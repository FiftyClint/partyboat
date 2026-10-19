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

/**
 * The publisher, by name only. No individual is named as author by Clint's
 * decision on 2026-10-19; the method on /how-we-research/ is what stands
 * behind the facts.
 */
const publisherRef = () =>
  PUBLISHER.legalName ? { '@type': 'Organization', name: PUBLISHER.legalName } : undefined;

export function webPageSchema({ site, title, description, path }) {
  const url = siteUrl(site);
  const publisher = publisherRef();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${page(url, path)}#webpage`,
    url: page(url, path),
    name: title,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': `${url}/#website` },
    about: { '@type': 'Place', name: site.marketName, address: { '@type': 'PostalAddress', addressRegion: site.regionName, addressCountry: 'US' } },
    ...(site.factsChecked ? { dateModified: site.factsChecked, lastReviewed: site.factsChecked } : {}),
    ...(publisher ? { publisher } : {}),
  };
}

/**
 * A question page: one Question with its accepted answer, plus the sources
 * the answer rests on as citations. FAQPage rather than QAPage, because
 * QAPage is for questions users ask and other users answer.
 */
export function questionPageSchema({ site, q, path }) {
  const url = siteUrl(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${page(url, path)}#faq`,
    ...(site.factsChecked ? { dateModified: site.factsChecked } : {}),
    mainEntity: [
      {
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer,
          url: page(url, path),
          citation: q.sources.map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
        },
      },
    ],
  };
}

/** `trail` is [{ label, path }], root first, current page last. */
export function breadcrumbSchema(site, trail) {
  const url = siteUrl(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: page(url, crumb.path),
    })),
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
