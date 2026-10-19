#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { walk } from './lib/html-text.mjs';
import { liveSites } from '../src/data/sites.node.mjs';

/**
 * Asserts that every page's canonical is the URL that page is actually served
 * at, and that the sitemap agrees.
 *
 * This exists because it was wrong on every page of all nineteen sites for two
 * weeks and nothing noticed.
 *
 * build.format is 'directory', so a route at /about is written to
 * about/index.html and served at /about/. The canonical was built as base +
 * path with no trailing slash, so each page told Google to prefer /about while
 * living at /about/, and the sitemap listed /about/. A declared canonical that
 * points somewhere other than the page itself is one of the few things that
 * reliably stops a page being indexed at all.
 *
 * The homepage escaped it, because path === '/' short-circuited the
 * expression. So the network launched with exactly one indexable page per
 * domain, and Search Console duly reported one page indexed and zero not
 * indexed on all nineteen: the rest were never candidates.
 *
 * Three things are checked, because the bug could recur as any of them:
 *
 *   Every page has exactly one canonical.
 *   The canonical equals the page's own served URL.
 *   The canonical appears verbatim in that site's sitemap, unless the page is
 *   noindex, in which case it must be absent from the sitemap instead.
 *   No JSON-LD url, item or mainEntityOfPage names the same page by a
 *   different URL.
 *
 * The third is the one that would have caught it. The first two can both be
 * self-consistently wrong.
 */

const ROOT = new URL('..', import.meta.url).pathname;
const errors = [];
let checked = 0;
let skipped = 0;

/** The URL a built file is served at, given directory build format. */
const servedUrl = (site, file, siteRoot) => {
  const rel = relative(siteRoot, file);
  const dir = rel.replace(/index\.html$/, '');
  return `https://${site.domain}/${dir}`;
};

for (const site of liveSites()) {
  const siteRoot = `${ROOT}dist/${site.key}`;

  let sitemap;
  try {
    sitemap = readFileSync(`${siteRoot}/sitemap-0.xml`, 'utf8');
  } catch {
    errors.push(`${site.key}: no sitemap-0.xml, so nothing can be checked against it`);
    continue;
  }

  const listed = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()),
  );

  for (const file of walk(siteRoot, (f) => f.endsWith('.html'))) {
    /* Not indexable and deliberately absent from the sitemap. */
    if (/\/(404|thank-you)\//.test(file) || file.endsWith('/404.html')) continue;

    const html = readFileSync(file, 'utf8');
    const found = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"/g)].map(
      (m) => m[1],
    );
    const where = relative(ROOT, file);

    if (found.length === 0) {
      errors.push(`${where}: no canonical`);
      continue;
    }
    if (found.length > 1) {
      errors.push(`${where}: ${found.length} canonicals, there must be exactly one`);
      continue;
    }

    const canonical = found[0];
    const served = servedUrl(site, file, siteRoot);
    checked += 1;

    if (canonical !== served) {
      errors.push(
        `${where}:\n      canonical  ${canonical}\n      served at  ${served}\n` +
          '      A page must declare itself, not a URL that redirects to it.',
      );
      continue;
    }

    /*
     * Structured data has to agree with the canonical too.
     *
     * This check only ever read <link rel="canonical">, so when the trailing
     * slash bug was fixed on 26 August it passed while every page in the
     * network went on asserting the unslashed URL in its JSON-LD. 243 pages
     * told Google one URL in the head and a redirecting one in the schema, and
     * this check called it fine for eleven days.
     */
    for (const [, schemaUrl] of html.matchAll(
      /"(?:url|item|mainEntityOfPage)":"(https:\/\/[^"]+)"/g,
    )) {
      if (schemaUrl !== canonical && schemaUrl.replace(/\/$/, '') === canonical.replace(/\/$/, '')) {
        errors.push(
          `${where}:\n      canonical      ${canonical}\n      structured data ${schemaUrl}\n` +
            '      Same page, two URLs. The schema one redirects.',
        );
        break;
      }
    }

    /*
     * A sitemap says "please index these". A noindex page says the opposite, so
     * a page in both states is asking Google for two contradictory things and
     * Google reports the contradiction rather than resolving it quietly. The
     * assertion therefore inverts rather than lifting: a noindex page must be
     * absent from the sitemap, and an indexable one must be present.
     */
    const noindexed = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

    if (noindexed) {
      skipped += 1;
      if (listed.has(canonical)) {
        errors.push(
          `${where}:\n      canonical  ${canonical}\n` +
            '      is noindex and still listed in the sitemap. Pick one.',
        );
      }
      continue;
    }

    if (!listed.has(canonical)) {
      errors.push(
        `${where}:\n      canonical  ${canonical}\n` +
          '      is not in that site\'s sitemap. The two must agree exactly.',
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`\nCanonical check FAILED with ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  ${error}\n`);
  process.exit(1);
}

console.log(
  `Canonical check passed. ${checked} page(s) declare their own URL. ` +
    `${checked - skipped} appear in their sitemap, ${skipped} are noindex and correctly absent from it.`,
);
