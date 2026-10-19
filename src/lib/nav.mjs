/**
 * Any path we link to on our own site, always ending in a slash.
 *
 * build.format is 'directory', so every page is written to <path>/index.html
 * and served at <path>/, and that is what the canonical tag and the sitemap
 * both say. PoweredLandCo learned this the hard way: for two weeks every
 * domain had one page indexed, the only one whose path already ended in a
 * slash. scripts/check-internal-links.mjs fails the build if a link escapes
 * this helper.
 */
export const internalPath = (path) => {
  const clean = `/${String(path || '').replace(/^\/+|\/+$/g, '')}`;
  return clean === '/' ? '/' : `${clean}/`;
};

/** A question page, for example "/questions/how-much-does-it-cost/". */
export const questionPath = (q) => internalPath(`questions/${q.slug}`);

export function primaryNav() {
  return [
    { href: internalPath('local-guide'), label: 'Local Guide' },
    { href: internalPath('questions'), label: 'Answers' },
    { href: `${internalPath('')}#request`, label: 'Request a Boat' },
  ];
}

export function footerNav() {
  return [
    { href: internalPath('local-guide'), label: 'Local Guide' },
    { href: internalPath('questions'), label: 'Answers' },
    { href: internalPath('faq'), label: 'Questions' },
    { href: internalPath('how-we-research'), label: 'How We Research' },
    { href: internalPath('for-operators'), label: 'For Boat Operators' },
    { href: internalPath('about'), label: 'About' },
    { href: internalPath('privacy'), label: 'Privacy' },
    { href: internalPath('terms'), label: 'Terms' },
  ];
}
