/**
 * Every page that asks not to be indexed, and why.
 *
 * SYNDICATED: identical text on every domain. About, privacy and terms are one
 * publisher's pages published once per site. There is no hub to hold the
 * indexable copy, so every site serves them noindex, follow: reachable,
 * linked, and out of the index. PoweredLandCo had Google report these as
 * "Duplicate, Google chose different canonical than user" before it did this.
 *
 * SUPERSEDED: the same text twice on one domain. The home page renders the
 * FAQ in full because it is the page each site exists to rank, so /faq/ stays
 * reachable for anyone who wants the questions alone without competing.
 *
 * One list, because the layout, the sitemap filter and the duplicate checker
 * all need the same answer.
 */

export const SYNDICATED_PATHS = ['/about', '/privacy', '/terms'];
export const SUPERSEDED_PATHS = ['/faq'];
export const NOINDEX_PATHS = [...SYNDICATED_PATHS, ...SUPERSEDED_PATHS];

/* "/about", "/about/" and "/about/index.html" are the same page. */
const clean = (path) =>
  `/${String(path || '')
    .replace(/\/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '')}`;

export const isSyndicated = (path) => SYNDICATED_PATHS.includes(clean(path));
export const isSuperseded = (path) => SUPERSEDED_PATHS.includes(clean(path));
export const isNoindexed = (path) => NOINDEX_PATHS.includes(clean(path));
