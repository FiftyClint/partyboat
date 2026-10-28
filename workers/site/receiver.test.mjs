import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receiveLead, canonicalLocation } from './index.mjs';
import { TAG_NEW, TAG_BLOCKED_SPAM, TAG_SMS_NO, TAG_SMS_YES, splitName } from './ghl.mjs';
import { leadStore, DEFAULT_LEAD_STORE } from '../../src/data/lead-store.mjs';

/*
 * The receiver against a stubbed Notion and a stubbed GHL. No network, no
 * secrets. These cover the cases that matter most for a lead site: a request
 * lands whole, a failure is reported as a failure rather than a thank you,
 * junk is kept but marked so nobody chases it, and aliases 301 to the primary
 * domain. Notion is the store in use; the GHL tests keep that path working for
 * when it is switched back on.
 */

const SITE = {
  SITE_DOMAIN: 'partyboatozarks.com',
  SITE_ALIASES: 'ozarkspartyboat.com',
  MARKET: 'ozarks',
};

/** What a deploy sets today: no LEAD_STORE, so the default, Notion. */
const NOTION_ENV = { ...SITE, NOTION_DATABASE_ID: 'db-test', NOTION_TOKEN: 'notion-test-token' };

const ENV = { ...SITE, LEAD_STORE: 'ghl', GHL_LOCATION_ID: 'loc-test', GHL_TOKEN: 'test-token' };

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

/** A fake Notion that records calls and can be told to fail. */
const fakeNotion = ({ status = 200 } = {}) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    if (status !== 200) return new Response('{"message":"nope"}', { status });
    return Response.json({ object: 'page', id: 'page-1' });
  };
  return { calls, fetchImpl };
};

const plain = (prop) => prop.rich_text.map((t) => t.text.content).join('');

test('the default lead store is Notion, and an unknown one is refused', () => {
  assert.equal(DEFAULT_LEAD_STORE, 'notion');
  assert.equal(leadStore(undefined), 'notion');
  assert.equal(leadStore(' GHL '), 'ghl');
  assert.throws(() => leadStore('hubspot'));
});

test('Notion: a real request becomes one row in Party Boat Leads', async () => {
  const notion = fakeNotion();
  const res = await receiveLead(post(realFields()), NOTION_ENV, { fetchImpl: notion.fetchImpl });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  assert.equal(notion.calls.length, 1);
  const [call] = notion.calls;
  assert.equal(call.url, 'https://api.notion.com/v1/pages');
  assert.equal(call.headers.authorization, 'Bearer notion-test-token');
  assert.equal(call.headers['notion-version'], '2022-06-28');
  assert.deepEqual(call.body.parent, { database_id: 'db-test' });
  const p = call.body.properties;
  assert.equal(p.Name.title[0].text.content, 'Jamie Lee Carter');
  assert.equal(p.Stage.select.name, 'New request');
  assert.equal(p.Market.select.name, 'ozarks');
  assert.equal(p.Phone.phone_number, '(816) 555-0142');
  assert.equal(p.Email.email, 'jamie@example.com');
  assert.equal(plain(p.When), 'June 12 or 13, 2027');
  assert.equal(plain(p['Group size']), '13-20');
  assert.equal(plain(p.Site), 'partyboatozarks.com');
  assert.equal(p['Texts OK'].checkbox, false);
  assert.equal(p.Spam.select.name, 'no');
});

test('Notion: texting consent is only recorded when the box was ticked', async () => {
  const notion = fakeNotion();
  await receiveLead(post({ ...realFields(), sms_consent: 'yes' }), NOTION_ENV, { fetchImpl: notion.fetchImpl });
  assert.equal(notion.calls[0].body.properties['Texts OK'].checkbox, true);
});

for (const status of [400, 401, 404, 429, 500]) {
  test(`Notion: a ${status} is reported as a failure, never a thank you`, async () => {
    const notion = fakeNotion({ status });
    const res = await receiveLead(post(realFields()), NOTION_ENV, { fetchImpl: notion.fetchImpl });
    assert.equal(res.status, 502);
  });
}

test('Notion: no token or no database is a 503, and GHL_TOKEN is not needed', async () => {
  assert.equal((await receiveLead(post(realFields()), { ...NOTION_ENV, NOTION_TOKEN: '' })).status, 503);
  assert.equal((await receiveLead(post(realFields()), { ...NOTION_ENV, NOTION_DATABASE_ID: '' })).status, 503);
  const notion = fakeNotion();
  const res = await receiveLead(post(realFields()), { ...NOTION_ENV, GHL_TOKEN: undefined }, { fetchImpl: notion.fetchImpl });
  assert.equal(res.status, 200);
});

test('an unknown LEAD_STORE is a 503 and writes nowhere', async () => {
  const notion = fakeNotion();
  const res = await receiveLead(post(realFields()), { ...NOTION_ENV, LEAD_STORE: 'hubspot' }, { fetchImpl: notion.fetchImpl });
  assert.equal(res.status, 503);
  assert.equal(notion.calls.length, 0);
});

test('Notion: obvious junk is kept but marked blocked and not a fit, and looks like success', async () => {
  const notion = fakeNotion();
  const junk = {
    ...realFields(),
    website: 'http://spam.example',
    form_loaded_at: '',
    group_size: 'lots',
    notes: 'Rank #1 on Google http://bit.ly/xyz',
  };
  const res = await receiveLead(post(junk, {}), NOTION_ENV, { fetchImpl: notion.fetchImpl });
  assert.equal(res.status, 200);
  const p = notion.calls[0].body.properties;
  assert.equal(p.Spam.select.name, 'blocked');
  assert.equal(p.Stage.select.name, 'Not a fit');
  assert.notEqual(plain(p['Spam signals']), '');
});

test('GHL: a real request is upserted, noted, then tagged, in that order', async () => {
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

test('GHL: texting consent is only recorded when the box was ticked', async () => {
  const ghl = fakeGhl();
  await receiveLead(post({ ...realFields(), sms_consent: 'yes' }), ENV, { fetchImpl: ghl.fetchImpl });
  const tags = ghl.calls.at(-1).body.tags;
  assert.ok(tags.includes(TAG_SMS_YES));
  assert.ok(!tags.includes(TAG_SMS_NO));
});

for (const step of ['upsert', 'note', 'tags']) {
  test(`GHL: a failure at ${step} is reported as a failure, never a thank you`, async () => {
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

test('GHL: no token configured is a 503, not a silent success', async () => {
  const res = await receiveLead(post(realFields()), { ...ENV, GHL_TOKEN: '' });
  assert.equal(res.status, 503);
});

test('an empty post creates nothing', async () => {
  const ghl = fakeGhl();
  const res = await receiveLead(post({ name: 'x', client: 'script' }), ENV, { fetchImpl: ghl.fetchImpl });
  assert.equal(res.status, 400);
  assert.equal(ghl.calls.length, 0);
});

test('GHL: obvious junk is kept but out of the new-request workflow, and looks like success', async () => {
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
