/*
 * WHERE TRIP REQUESTS GO
 * ======================
 *
 * The form posts to /api/lead on the site's own domain. workers/site/index.mjs
 * answers there and writes the request into the "Party Boat" sub-account in
 * GoHighLevel, as a contact plus a note, tagged with the market.
 *
 * The GHL token is a Cloudflare Worker secret (GHL_TOKEN), pushed by
 * scripts/deploy.mjs from the repository secret of the same name. It is never
 * in a built file. The build only checks whether it is present, to decide
 * whether a form would work at all.
 *
 * PUBLIC_LEAD_WEBHOOK overrides the destination, for previews pointed at a
 * test endpoint.
 */

const fromEnv = (key) => {
  const value = import.meta.env?.[key] ?? process.env?.[key] ?? '';
  return typeof value === 'string' ? value.trim() : '';
};

/** Relative, so one built page is correct on every domain with no CORS. */
export const LEAD_ENDPOINT = '/api/lead';

/** Only the presence of the token is read here. Its value never reaches a page. */
const receiverConfigured = () => (process.env?.GHL_TOKEN ?? '').trim().length > 0;

export const leadWebhook = () =>
  fromEnv('PUBLIC_LEAD_WEBHOOK') || (receiverConfigured() ? LEAD_ENDPOINT : '');

/**
 * Whether a submitted form actually reaches somewhere.
 *
 * PoweredLandCo once shipped a form with no action. The browser posted it back
 * to the page, the page answered 200, and the script thanked a visitor whose
 * details had gone nowhere. So a form with no destination is never rendered,
 * and scripts/check-lead-destination.mjs blocks a deploy that would ship one.
 */
export const hasLeadDestination = () => leadWebhook().length > 0;

/**
 * What a person is told will happen next. Shown under the form and in the
 * confirmation. It is a promise, so it says only what the team has agreed to
 * do. Change it here if that changes.
 */
export const RESPONSE_EXPECTATION =
  'A person reads every request. Expect a call or an email back, usually within one business day.';

export const SUCCESS_MESSAGE =
  'Thank you. We have your request. A person will read it and call or email you, usually within one business day.';

export const FAILURE_MESSAGE =
  'That did not go through, and nothing was saved. Please try once more.';

/*
 * Options. Every question that could be uncertain offers a "not sure" answer:
 * a group organiser often does not know the final headcount or the exact date
 * yet, and nobody should be blocked by a question they cannot answer.
 */
export const GROUP_SIZE_OPTIONS = [
  { value: '', label: 'Choose one' },
  { value: '1-6', label: '6 or fewer' },
  { value: '7-12', label: '7 to 12' },
  { value: '13-20', label: '13 to 20' },
  { value: '21-30', label: '21 to 30' },
  { value: '31-50', label: '31 to 50' },
  { value: '51+', label: 'More than 50' },
  { value: 'unsure', label: 'Not sure yet' },
];

export const OCCASION_OPTIONS = [
  { value: '', label: 'Choose one' },
  { value: 'bachelorette', label: 'Bachelorette party' },
  { value: 'bachelor', label: 'Bachelor party' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'friends-family', label: 'Day out with friends or family' },
  { value: 'corporate', label: 'Work or team outing' },
  { value: 'wedding', label: 'Wedding or rehearsal' },
  { value: 'other', label: 'Something else' },
];

export const BOAT_STYLE_OPTIONS = [
  { value: 'captained', label: 'With a captain' },
  { value: 'self-drive', label: 'We drive it ourselves' },
  { value: 'unsure', label: 'Not sure' },
];
