/**
 * What a junk submission looks like.
 *
 * Ported from PoweredLandCo, where the first version had two checks and
 * caught five of eighty-one bots. The lesson that carried over: a missing load
 * stamp is evidence, not innocence. Every real submission from our page
 * carries form_loaded_at, so its absence means the post did not come from our
 * page at all. The land-specific signals (acreage, county) are replaced with
 * their trip-request equivalents.
 *
 * Weighted rather than boolean so no single soft signal buries a real person.
 * FLAG_AT marks a request for a second look and still sends it to Ryan.
 * DISCARD_AT keeps it out of his notifications, but it is still written to
 * GHL under a separate tag, so a mistake can be found and undone.
 */

const MIN_FILL_MS = 3000;
const FLAG_AT = 6;
const DISCARD_AT = 12;

const SPAM_LINK_HOST =
  /\b(?:telegra\.ph|t\.me|bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|shorturl|myip\.kr|tau\.lu|i8\.ae|linkypay|freeurl|clickto|short\.vi)/i;

/** Any character from a non-Latin script. Spanish and other Latin-script languages pass. */
const NON_LATIN =
  /[Ѐ-ӿͰ-Ͽ԰-֏Ⴀ-ჿ֐-׿؀-ۿऀ-ॿঀ-৿一-鿿぀-ヿ가-힯]/;

const GROUP_SIZES = new Set(['', '1-6', '7-12', '13-20', '21-30', '31-50', '51+', 'unsure']);

/**
 * @param fields  the submitted form, keys to strings
 * @param request the incoming Request, for Origin and Referer
 * @param hosts   every hostname this site answers on (primary plus aliases)
 */
export function spamScore(fields, request, hosts = []) {
  const reasons = [];
  const add = (weight, reason) => reasons.push({ weight, reason });
  const text = (key) => (typeof fields[key] === 'string' ? fields[key].trim() : '');

  const isOurHost = (value) => {
    try {
      const { hostname } = new URL(value);
      return hosts.includes(hostname.replace(/^www\./, ''));
    } catch {
      return false;
    }
  };

  /* An off-screen field no person sees, let alone fills. */
  if (text('website').length > 0) add(10, 'honeypot filled');

  const loadedAt = Number(fields.form_loaded_at);
  if (Number.isFinite(loadedAt) && loadedAt > 0) {
    const elapsed = Date.now() - loadedAt;
    /* Negative means the visitor's clock is ahead of ours, not a bot. */
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) add(10, 'submitted faster than a person can type');
  } else {
    /* Soft: a visitor with scripting off is missing it through no fault of their own. */
    add(3, 'no page load stamp');
  }

  const origin = request?.headers?.get('origin');
  const referer = request?.headers?.get('referer');
  if (hosts.length > 0 && !isOurHost(origin) && !isOurHost(referer)) {
    add(5, 'not posted from one of our pages');
  }

  const notes = text('notes');
  if (/https?:\/\//i.test(notes)) add(5, 'link in the notes');
  if (SPAM_LINK_HOST.test(notes)) add(5, 'link goes somewhere only spam goes');
  if (NON_LATIN.test(notes)) add(6, 'message is not in a Latin alphabet');

  /* Search-ranking pitches open by naming the site they scraped. */
  if (hosts.some((h) => notes.toLowerCase().includes(h))) add(5, 'quotes our own address back at us');

  /* The date field is required in the browser. Missing means the browser was skipped. */
  if (text('trip_date').length === 0) add(3, 'no trip date');

  /* A select can only send one of its own values. Anything else was typed by a script. */
  if (!GROUP_SIZES.has(text('group_size'))) add(5, 'group size is not one of the options');

  if (/^[a-z]{8,}$/.test(text('name'))) add(3, 'name looks generated');

  /* Eleven digits is a US number only when the first is a 1. */
  const digits = text('phone').replace(/\D/g, '');
  if (digits.length === 11 && !digits.startsWith('1')) add(5, 'phone is not a usable number');
  if (digits.length > 0 && digits.length < 10) add(3, 'phone is too short to call');

  const total = reasons.reduce((sum, r) => sum + r.weight, 0);
  return {
    spam: total >= FLAG_AT,
    discard: total >= DISCARD_AT,
    total,
    reasons: reasons.map((r) => r.reason),
  };
}
