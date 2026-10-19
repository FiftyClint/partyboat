import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receiveLead, canonicalLocation } from './index.mjs';
import { TAG_NEW, TAG_BLOCKED_SPAM, TAG_SMS_NO, TAG_SMS_YES, splitName } from './ghl.mjs';

/*
 * The receiver against a stubbed GHL. No network, no secrets. These cover
 * the cases that matter most for a lead site: a request lands whole, a GHL
 * failure is reported as a failure rather than a thank you, junk stays out
 * of Ryan's notifications without being destroyed, and aliases 301 to the
 * primary domain.
 */

const ENV = {
  SITE_DOMAIN: 'partyboatozarks.com',
  SITE_ALIASES: 'ozarkspartyboat.com',
  MARKET: 'ozarks',
  GHL_LOCATION_ID: 'loc-test',
  GHL_TOKEN: 'test-token',
};

const realFields = () => ({
  name: 'Jamie Lee Carter',
  phone: '(816) 555-0142',
  email: 'jamie@example.com',
  trip_date: 'June 12 or 13, 2027',
  group_size: '13-20',
  occasion: 'bachelorette',
  boat_style: 'captained',
  notes: 'Want to stop at a cove for an hour.',
  form_loaded_at: String(Date.now() - 60_000),
  website: '',
  client: 'script',
});

const post = (fields, headers = { origin: 'https://partyboatozarks.com' }) => {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return new Request('https://partyboatozarks.com/api/lead', { method: 'POST', body, headers });
};

/** A fake GHL that records calls and can be told to fail one step. */
const fakeGhl = ({ failOn } = {}) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, headers: init.headers, body: JSON.parse(init.body) });
    const step = path.endsWith('/upsert') ? 'upsert' : path.endsWith('/notes') ? 'note' : 'tags';
    if (step === failOn) return new Response('{"message":"nope"}', { status: 422 });
    if (step === 'upsert') return Response.json({ new: true, contact: { id: 'c-1' } });
    return Response.json({}, { status: 201 });
  };
  return { calls, fetchImpl };
};

test('a real request is upserted, noted, then tagged, in that order', async () => {
  const ghl = fakeGhl();
  const res = await receiveLead(post(realFields()), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  assert.deepEqual(
    ghl.calls.map((c) => c.path),
    ['/contacts/upsert', '/contacts/c-1/notes', '/contacts/c-1/tags'],
  );
  const [upsert, note, tags] = ghl.calls;
  assert.equal(upsert.headers.authorization, 'Bearer test-token');
  assert.equal(upsert.body.locationId, 'loc-test');
  assert.equal(upsert.body.firstName, 'Jamie Lee');
  assert.equal(upsert.body.lastName, 'Carter');
  assert.equal('tags' in upsert.body, false, 'upsert must not carry tags; it replaces existing ones');
  assert.match(note.body.body, /When: June 12 or 13, 2027/);
  assert.match(note.body.body, /Group size: 13-20/);
  assert.match(note.body.body, /Texting allowed: no/);
  assert.ok(tags.body.tags.includes(TAG_NEW));
  assert.ok(tags.body.tags.includes('pb-market-ozarks'));
  assert.ok(tags.body.tags.includes(TAG_SMS_NO));
});

test('texting consent is only recorded when the box was ticked', async () => {
  const ghl = fakeGhl();
  await receiveLead(post({ ...realFields(), sms_consent: 'yes' }), ENV, { fetchImpl: ghl.fetchImpl });
  const tags = ghl.calls.at(-1).body.tags;
  assert.ok(tags.includes(TAG_SMS_YES));
  assert.ok(!tags.includes(TAG_SMS_NO));
});

for (const step of ['upsert', 'note', 'tags']) {
  test(`a GHL failure at ${step} is reported as a failure, never a thank you`, async () => {
    const ghl = fakeGhl({ failOn: step });
    const res = await receiveLead(post(realFields()), ENV, { fetchImpl: ghl.fetchImpl });
    assert.equal(res.status, 502);
    assert.equal((await res.json()).ok, undefined);
  });
}

test('GHL unreachable is a 502', async () => {
  const res = await receiveLead(post(realFields()), ENV, {
    fetchImpl: async () => {
      throw new Error('network down');
    },
  });
  assert.equal(res.status, 502);
});

test('no token configured is a 503, not a silent success', async () => {
  const res = await receiveLead(post(realFields()), { ...ENV, GHL_TOKEN: '' });
  assert.equal(res.status, 503);
});

test('an empty post creates nothing', async () => {
  const ghl = fakeGhl();
  const res = await receiveLead(post({ name: 'x', client: 'script' }), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 400);
  assert.equal(ghl.calls.length, 0);
});

test('obvious junk is kept but out of the new-request workflow, and looks like success', async () => {
  const ghl = fakeGhl();
  const junk = {
    ...realFields(),
    website: 'http://spam.example',
    form_loaded_at: '',
    group_size: 'lots',
    notes: 'Rank #1 on Google http://bit.ly/xyz',
  };
  const res = await receiveLead(post(junk, {}), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 200);
  const tags = ghl.calls.at(-1).body.tags;
  assert.ok(tags.includes(TAG_BLOCKED_SPAM));
  assert.ok(!tags.includes(TAG_NEW));
});

test('without JavaScript the browser is redirected to the thank you page, and only to our own paths', async () => {
  const ghl = fakeGhl();
  const fields = { ...realFields(), client: '', redirect_to: 'https://evil.example/' };
  const res = await receiveLead(post(fields), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/thank-you/');
});

test('GET on the receiver is 405 and noindex', async () => {
  const res = await receiveLead(new Request('https://partyboatozarks.com/api/lead'), ENV);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('x-robots-tag'), 'noindex');
});

test('aliases, www, http and slashless paths 301 to the one canonical address', () => {
  const at = (u) => canonicalLocation(new Request(u), ENV);
  assert.equal(at('https://ozarkspartyboat.com/local-guide/'), 'https://partyboatozarks.com/local-guide/');
  assert.equal(at('https://www.partyboatozarks.com/'), 'https://partyboatozarks.com/');
  assert.equal(at('http://partyboatozarks.com/faq'), 'https://partyboatozarks.com/faq/');
  assert.equal(at('https://partyboatozarks.com/local-guide/'), null);
  assert.equal(at('https://partyboatozarks.com/robots.txt'), null);
});

test('a POST is never redirected, so a form is never dropped', () => {
  const req = new Request('https://ozarkspartyboat.com/api/lead', { method: 'POST', body: 'x' });
  assert.equal(canonicalLocation(req, ENV), null);
});

test('names split sensibly', () => {
  assert.deepEqual(splitName('Cher'), { firstName: 'Cher', lastName: '' });
  assert.deepEqual(splitName('  Ana  María  López '), { firstName: 'Ana María', lastName: 'López' });
});
