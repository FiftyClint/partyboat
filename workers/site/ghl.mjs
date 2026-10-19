/**
 * Writes a trip request into the GoHighLevel "Party Boat" sub-account.
 *
 * Three calls, in this order:
 *
 *   1. upsert the contact, deduplicated by GHL on email and phone
 *   2. add a note holding the whole request, so nothing is lost to a field
 *      mapping nobody has set up yet
 *   3. add tags, last
 *
 * Tags go last because they are what the GHL workflow triggers on
 * ("pb-new-request" notifies Ryan). By the time the notification fires, the
 * note with the details is already on the contact.
 *
 * Tags are added with their own endpoint rather than sent with the upsert,
 * because the upsert replaces every existing tag on a returning contact.
 *
 * Endpoints and the Version header were taken from HighLevel's API docs on
 * 2026-10-19 (marketplace.gohighlevel.com/docs). The docs pages show "v3" in
 * a version selector while the private integration token page's own example
 * sends 2021-07-28. GHL_API_VERSION is the one place to change if the live
 * test says otherwise. Until a real request has been seen to land, treat this
 * file as unverified against the live account.
 */

export const GHL_API_BASE = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';

/** Tags. The workflow in GHL keys off these exact strings. */
export const TAG_NEW = 'pb-new-request';
export const TAG_SUSPECTED_SPAM = 'pb-spam-suspected';
export const TAG_BLOCKED_SPAM = 'pb-spam-blocked';
export const TAG_SMS_YES = 'pb-sms-consent-yes';
export const TAG_SMS_NO = 'pb-sms-consent-no';
export const marketTag = (market) => `pb-market-${market}`;

const LABELS = {
  trip_date: 'When',
  group_size: 'Group size',
  occasion: 'Occasion',
  boat_style: 'Captain or self-drive',
  notes: 'Notes',
  sms_consent: 'Texting allowed',
  source_site: 'Site',
  page: 'Page',
};

const str = (value) => (typeof value === 'string' ? value.trim().slice(0, 2000) : '');

/** "Mary Ann Smith" -> first "Mary Ann", last "Smith". One word stays a first name. */
export function splitName(full) {
  const parts = str(full).split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}

export function contactBody(fields, locationId, sourceSite) {
  const { firstName, lastName } = splitName(fields.name);
  const body = {
    locationId,
    source: `${sourceSite || str(fields.source_site) || 'party boat site'} trip request form`,
  };
  if (firstName) body.firstName = firstName;
  if (lastName) body.lastName = lastName;
  if (str(fields.email)) body.email = str(fields.email);
  if (str(fields.phone)) body.phone = str(fields.phone);
  return body;
}

/** The whole request as plain text, for the contact note. */
export function noteBody(fields, { market, receivedAt, spamReasons = [] }) {
  const lines = [`Trip request, ${market}, received ${receivedAt}`];
  for (const [key, label] of Object.entries(LABELS)) {
    const value = key === 'sms_consent' ? (str(fields[key]) === 'yes' ? 'yes' : 'no') : str(fields[key]);
    if (value) lines.push(`${label}: ${value}`);
  }
  if (spamReasons.length > 0) lines.push(`Spam signals: ${spamReasons.join(', ')}`);
  return lines.join('\n');
}

export function tagsFor(fields, market, { spam, discard }) {
  if (discard) return [TAG_BLOCKED_SPAM, marketTag(market)];
  const tags = [TAG_NEW, marketTag(market), str(fields.sms_consent) === 'yes' ? TAG_SMS_YES : TAG_SMS_NO];
  if (spam) tags.push(TAG_SUSPECTED_SPAM);
  return tags;
}

/**
 * Sends the request to GHL. Returns { ok, contactId, step, status, detail }.
 * Any failed step returns ok: false so the visitor is told the truth and can
 * try again; the upsert makes a retry land on the same contact.
 */
export async function writeRequest({ fields, market, token, locationId, sourceSite, verdict, fetchImpl = fetch, now = new Date() }) {
  const headers = {
    authorization: `Bearer ${token}`,
    version: GHL_API_VERSION,
    'content-type': 'application/json',
    accept: 'application/json',
  };
  const call = async (step, path, body) => {
    const response = await fetchImpl(`${GHL_API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { ok: false, step, status: response.status, detail };
    }
    return { ok: true, json: await response.json().catch(() => ({})) };
  };

  const upsert = await call('upsert', '/contacts/upsert', contactBody(fields, locationId, sourceSite));
  if (!upsert.ok) return upsert;
  const contactId = upsert.json?.contact?.id;
  if (!contactId) return { ok: false, step: 'upsert', status: 200, detail: 'no contact id in response' };

  const note = await call('note', `/contacts/${contactId}/notes`, {
    body: noteBody(fields, { market, receivedAt: now.toISOString(), spamReasons: verdict.reasons }),
  });
  if (!note.ok) return { ...note, contactId };

  const tags = await call('tags', `/contacts/${contactId}/tags`, { tags: tagsFor(fields, market, verdict) });
  if (!tags.ok) return { ...tags, contactId };

  return { ok: true, contactId };
}
