/**
 * Writes a trip request into the Notion database "Party Boat Leads", one row
 * per request, in a single call.
 *
 * The database lives under Business Operations Hub, next to Water Leads, and
 * is kept separate from it and from the REAP leads. Its columns are named in
 * PROPERTIES below; a column renamed in Notion makes this call fail with a
 * 400, which the form reports as a failure rather than thanking anyone.
 *
 * Blocked junk is still written, as Spam "blocked" and Stage "Not a fit", so a
 * mistake by the spam rules can be found and undone. It is never deleted.
 *
 * Endpoint and Notion-Version are the ones the water systems sites and
 * usdareapgrant.com already use (POST /v1/pages, 2022-06-28). A retry after a
 * timeout can leave two rows for one request; that is cheaper to tidy by hand
 * than a lost request.
 */

export const NOTION_API_BASE = 'https://api.notion.com';
export const NOTION_API_VERSION = '2022-06-28';

const STAGE_NEW = 'New request';
const STAGE_NOT_A_FIT = 'Not a fit';

const str = (value) => (typeof value === 'string' ? value.trim().slice(0, 2000) : '');

/** Notion caps one rich text item at 2,000 characters, and str() already does. */
const text = (value) => ({ rich_text: value ? [{ type: 'text', text: { content: value } }] : [] });

export function pageProperties(fields, { market, sourceSite, verdict }) {
  const name = str(fields.name) || str(fields.phone) || str(fields.email) || 'No name given';
  const spam = verdict.discard ? 'blocked' : verdict.spam ? 'suspected' : 'no';
  const props = {
    Name: { title: [{ type: 'text', text: { content: name } }] },
    Stage: { select: { name: verdict.discard ? STAGE_NOT_A_FIT : STAGE_NEW } },
    Market: { select: { name: market } },
    When: text(str(fields.trip_date)),
    'Group size': text(str(fields.group_size)),
    Occasion: text(str(fields.occasion)),
    'Captain or self-drive': text(str(fields.boat_style)),
    Notes: text(str(fields.notes)),
    'Texts OK': { checkbox: str(fields.sms_consent) === 'yes' },
    Spam: { select: { name: spam } },
    'Spam signals': text((verdict.reasons ?? []).join(', ')),
    Site: text(sourceSite || str(fields.source_site)),
    Page: text(str(fields.page)),
  };
  if (str(fields.phone)) props.Phone = { phone_number: str(fields.phone) };
  if (str(fields.email)) props.Email = { email: str(fields.email) };
  return props;
}

/**
 * Sends the request to Notion. Returns { ok, pageId } or
 * { ok: false, step, status, detail }, the same shape as the GHL writer, so
 * the receiver treats both alike.
 */
export async function writeRequest({ fields, market, token, databaseId, sourceSite, verdict, fetchImpl = fetch }) {
  const response = await fetchImpl(`${NOTION_API_BASE}/v1/pages`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'notion-version': NOTION_API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: pageProperties(fields, { market, sourceSite, verdict }),
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { ok: false, step: 'create', status: response.status, detail };
  }
  const json = await response.json().catch(() => ({}));
  if (!json?.id) return { ok: false, step: 'create', status: response.status, detail: 'no page id in response' };
  return { ok: true, pageId: json.id };
}
