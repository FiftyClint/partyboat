import { PUBLISHER, INDEPENDENCE_STATEMENT } from '../data/brand.mjs';
import { siteUrl } from '../data/sites.mjs';

/**
 * Schema.org builders.
 *
 * The site describes itself as a WebSite published by an Organization, never
 * as a LocalBusiness, BoatRental or TouristTrip. We do not run boats, and
 * structured data claiming we do would be the same lie the copy rules forbid,
 * told to a search engine instead of a person. No ratings, reviews or prices
 * either: we have none of our own to state.
 */

/** A page's real served URL. Always ends in a slash, because the file does. */
const page = (base, path) => {
  const clean = String(path || '/');
  return `${base}${clean.endsWith('/') ? clean : `${clean}/`}`;
};

export function websiteSchema(site) {
  const url = siteUrl(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}/#website`,
    name: site.siteName,
    url: page(url, '/'),
    description: INDEPENDENCE_STATEMENT,
    about: { '@type': 'Place', name: site.marketName },
    ...(PUBLISHER.legalName
      ? { publisher: { '@type': 'Organization', name: PUBLISHER.legalName } }
      : {}),
  };
}

export function webPageSchema({ site, title, description, path }) {
  const url = siteUrl(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${page(url, path)}#webpage`,
    url: page(url, path),
    name: title,
    description,
    isPartOf: { '@id': `${url}/#website` },
  };
}

export function faqPageSchema(entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}
