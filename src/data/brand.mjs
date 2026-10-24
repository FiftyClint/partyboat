/**
 * Network-level constants shared by every site.
 *
 * Anything in here appears identically on every domain. That is deliberate:
 * it is chrome and legal language, not body copy, so the duplicate-copy
 * checker ignores it. Anything that varies by market belongs in a site data
 * file, never here.
 */

export const PUBLISHER = {
  /*
   * The legal entity that publishes the sites. Clint named Aidren LLC on
   * 2026-10-24. scripts/check-launch.mjs refuses a deploy while this is null.
   */
  legalName: 'Aidren LLC',

  location: { locality: 'Overland Park', region: 'KS', regionName: 'Kansas', country: 'US' },

  /*
   * No mailbox exists yet. Leave null rather than publish an address that
   * bounces. Pages fall back to the form and the market's phone number.
   */
  email: null,

  foundingYear: '2026',
};

/**
 * Required verbatim on every page of every site, and asserted by
 * scripts/lint-copy.mjs. This is the sentence that keeps the network honest:
 * we are a guide that passes requests to operators, never the operator.
 * Do not reword without Clint's sign-off.
 */
export const INDEPENDENCE_STATEMENT =
  'This site is an independent local guide. We do not own, operate, or captain any boat. Every trip is provided by an independent operator, who sets its own prices, terms, and safety rules.';

/**
 * Shown directly above the submit button and repeated in the privacy policy.
 *
 * It names the one thing that makes a lead worth anything to an operator,
 * sharing the request with a local operator, at the point of submission
 * rather than in a policy nobody opens. Texting is a separate, optional
 * checkbox, because a phone number given for a callback is not permission to
 * text.
 */
export const CONTACT_CONSENT =
  'By sending this, you agree that we may contact you by phone or email about this trip request, and that we may share it with one local boat operator so they can contact you about it. You can tell us to stop at any time. Agreeing is not a condition of any purchase.';

export const SMS_CONSENT_LABEL =
  'You may also text me about this request. Message and data rates may apply. Reply STOP to stop.';

/** Jurisdiction for the governing law clause. Clint confirmed Kansas on 2026-10-24. */
export const LEGAL_JURISDICTION = 'the State of Kansas';

/**
 * Phrases that must never appear in site copy, because each one claims
 * something only an operator can say, or something nobody can verify.
 * Matched case-insensitively on word boundaries by scripts/lint-copy.mjs.
 */
export const BANNED_TERMS = [
  'book now',
  'book online',
  'our fleet',
  'our boats',
  'our boat',
  'our captains',
  'our captain',
  'our crew',
  'we rent',
  'available now',
  'guaranteed',
  'guarantee',
  'best price',
  'lowest price',
  'top rated',
  'five star',
  '5 star',
  'number one',
  'coast guard approved',
  'fully licensed',
  'fully insured',
];

/**
 * Sanctioned accent tones. Each site may pick one; nothing else about the
 * design varies between sites. Every tone is checked for WCAG AA against the
 * page background and against white button text by scripts/audit-a11y.mjs.
 */
export const ACCENTS = {
  lake: { base: '#1F4E79', dark: '#173B5C', tint: '#E5ECF3' },
  pine: { base: '#1F5148', dark: '#173D36', tint: '#E5EEEC' },
  slate: { base: '#2C4A5E', dark: '#213847', tint: '#E6ECF0' },
  harbor: { base: '#24566B', dark: '#1B4252', tint: '#E4EEF1' },
  dusk: { base: '#4A3F6B', dark: '#382F52', tint: '#ECE9F2' },
};

export const ACCENT_NAMES = Object.keys(ACCENTS);

/**
 * The three steps on every home page. Short labels only; the sentence under
 * each one is written per market so no forty-word run repeats across sites.
 */
export const STEP_LABELS = [
  'Tell us the date and the group',
  'We pass it to one local operator',
  'The operator confirms the boat and the price with you',
];
