#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import { builtPages, visibleText } from './lib/html-text.mjs';

/**
 * Fails the build when two sites share a run of body copy.
 *
 * Duplicate content is the thing most likely to kill this network. Nineteen
 * domains built from one codebase will get discounted or dropped from the index
 * if their main content reads as the same document with the state name swapped.
 * Shared layout is fine. Shared sentences are not.
 *
 * Method: take the visible text of each page's <main>, normalise it to a word
 * list, and hash every rolling window of WINDOW words. If the same window
 * appears on two different sites, that is a collision and the build fails.
 *
 * Rolling windows rather than whole paragraphs on purpose. Hashing paragraphs
 * only catches copy that was duplicated wholesale; a shared run buried inside
 * two otherwise different paragraphs slips straight through, and that is the
 * common case when copy gets loosely rewritten per state.
 *
 * Two things are excluded, both deliberately:
 *
 *   - Anything outside <main>. Header, navigation and footer are chrome and are
 *     supposed to be identical.
 *   - Subtrees marked data-boilerplate, which is the intake form. It is the
 *     same form on every site, so it has the same field labels on every site.
 *     That attribute is for interface only, never for prose.
 *   - <nav> elements inside <main>: lists of links to other pages on the
 *     site, such as the question lists. Navigation is not body copy, and a
 *     list of question titles on every question page is how a reader moves
 *     between them. Never wrap prose in <nav> to get it past this check.
 *   - Subtrees marked data-citations, which are source lists. Two articles
 *     about one state should cite the same sources, and a check that punished
 *     that would be pushing us toward worse citations to satisfy a script. The
 *     Virginia pair that prompted this shared nothing but the three sources
 *     they both correctly rely on.
 *
 * About, privacy and terms are allowlisted from the passage check, because
 * there is one company and one privacy policy and writing nineteen versions of
 * either to satisfy a checker would be a bad trade.
 *
 * That exemption used to say identical legal text "carries little ranking
 * risk". True of one page, wrong in aggregate: measured against the build,
 * about is 978 words of which 3 differ between two states, and privacy and
 * terms are the same. Google reported it as "Duplicate, Google chose different
 * canonical than user" on several domains, which is Google picking which of the
 * nineteen copies survives.
 *
 * So the exemption now carries a control, asserted below. On any site that is
 * not the hub these pages must be noindex, and this check fails if one is not.
 * An allowlist without an enforced consequence is just a hole.
 */

import { isNoindexed } from '../src/lib/noindex.mjs';

const WINDOW = 40;

/**
 * An articles index against an article listed on it. The index carries each
 * piece's own description, so a shared run between the two is the listing
 * doing its job rather than duplicated prose.
 */
const isIndexAndArticle = (a, b) => {
  const idx = /^\/articles\/index\.html$/;
  const art = /^\/articles\/.+\/index\.html$/;
  return (idx.test(a) && art.test(b)) || (idx.test(b) && art.test(a));
};

const ALLOWLIST = [
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /^\/about(\/|$)/,
  /^\/how-we-research(\/|$)/,
  /^\/404\.html$/,
  /^\/thank-you(\/|$)/,
];

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = `${ROOT}dist`;

if (!existsSync(DIST)) {
  console.error('No dist/ directory. Run `npm run build:all` before this check.');
  process.exit(1);
}

const allPages = builtPages(DIST);

const NOINDEX_META = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i;
/** Paths this build serves noindex, keyed by path because every site matches. */
const noindexed = new Set(
  allPages.filter((p) => NOINDEX_META.test(p.html)).map((p) => p.path),
);
const sameSite = [];
const pages = allPages.filter((page) => !ALLOWLIST.some((re) => re.test(page.path)));

const sitesSeen = new Set(pages.map((p) => p.site));
if (sitesSeen.size < 2) {
  console.log(
    `Duplicate copy check skipped: only ${sitesSeen.size} site built (${[...sitesSeen].join(', ')}). ` +
      'This check compares sites against each other, so it needs at least two.',
  );
  process.exit(0);
}

/** Lowercase word list with punctuation removed, so rewording is what counts. */
const words = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

const seen = new Map(); // window hash -> { site, path, phrase }
const collisions = [];

for (const page of pages) {
  const text = visibleText(page.html, { onlyMain: true, exclude: '[data-boilerplate], [data-citations], nav' });
  const list = words(text);
  if (list.length < WINDOW) continue;

  // One report per page pair is enough. Twenty overlapping windows describing
  // the same duplicated paragraph is noise, not information.
  const reported = new Set();

  for (let i = 0; i + WINDOW <= list.length; i += 1) {
    const phrase = list.slice(i, i + WINDOW).join(' ');
    const hash = createHash('sha1').update(phrase).digest('hex');
    const previous = seen.get(hash);

    if (!previous) {
      seen.set(hash, { site: page.site, path: page.path, phrase });
      continue;
    }

    const pair = `${previous.site}:${previous.path}|${page.site}:${page.path}`;
    if (reported.has(pair)) continue;

    /*
     * Same site, which this check ignored entirely until 16 September 2026.
     * The comment on the line that skipped it said "not our concern", and it
     * was wrong: two pages on one domain competing for the same text is the
     * exact thing Search Console reported about Ohio, and there were 119 such
     * pairs across the network at the time, three of them on every state site.
     *
     * Two same-site pairs are deliberate rather than accidental:
     *
     *   - One of the pages is noindex. That is the arrangement, not a fault.
     *   - The articles index against an article beneath it. An index listing
     *     each piece's own description is how every article index works, the
     *     article is the canonical target, and the index links straight to it.
     */
    if (previous.site === page.site) {
      if (noindexed.has(previous.path) || noindexed.has(page.path)) continue;
      if (isIndexAndArticle(previous.path, page.path)) continue;
      reported.add(pair);
      sameSite.push({
        site: page.site,
        a: previous.path,
        b: page.path,
        phrase,
      });
      continue;
    }

    reported.add(pair);
    collisions.push({
      a: `${previous.site}${previous.path}`,
      b: `${page.site}${page.path}`,
      phrase,
    });
  }
}

/*
 * The control on the allowlist. A page exempted from the passage check because
 * it is identical everywhere must not also be asking to be indexed everywhere.
 */
const unguarded = [];
for (const page of allPages) {
  if (!isNoindexed(page.path)) continue;
  if (page.site === 'hub') continue;
  if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(page.html)) {
    unguarded.push(`${page.site}${page.path}`);
  }
}

if (unguarded.length > 0) {
  console.error(
    `Duplicate copy check FAILED. ${unguarded.length} page(s) are identical across\n` +
      'the network and still indexable. These are allowlisted from the passage\n' +
      'check on the understanding that the state copies carry noindex.\n',
  );
  for (const u of unguarded) console.error(`  ${u}`);
  console.error('\nFix in src/lib/noindex.mjs, or write per-state copy for the page.');
  process.exit(1);
}

if (sameSite.length > 0) {
  console.error(
    `Duplicate copy check FAILED. ${sameSite.length} pair(s) of pages on the same\n` +
      `site share a passage of ${WINDOW} or more words. Two pages on one domain\n` +
      'asking to rank for the same text means Google picks one, and it will not\n' +
      'necessarily pick the one you wanted.\n',
  );
  for (const { site, a, b, phrase } of sameSite) {
    console.error(`  ${site}${a}`);
    console.error(`  ${site}${b}`);
    console.error(`    "${phrase}"\n`);
  }
  console.error(
    'Fix by deciding which page owns the text. Either cut it from the other\n' +
      'page, or add that page to SUPERSEDED_PATHS in src/lib/noindex.mjs so it\n' +
      'stays reachable without competing.',
  );
  process.exit(1);
}

if (collisions.length > 0) {
  console.error(
    `Duplicate copy check FAILED. ${collisions.length} shared passage(s) of ` +
      `${WINDOW} or more words found across different sites.\n`,
  );
  for (const { a, b, phrase } of collisions) {
    console.error(`  ${a}`);
    console.error(`  ${b}`);
    console.error(`    "${phrase}"\n`);
  }
  console.error(
    'Fix by writing different copy for each site, normally by moving the text\n' +
      'into the per-site data file. Do not mark prose as data-boilerplate to\n' +
      'silence this check.',
  );
  process.exit(1);
}

console.log(
  `Duplicate copy check passed. ${pages.length} page(s) across ${sitesSeen.size} sites, ` +
    `no shared ${WINDOW}-word passage across sites and none within a site. ` +
    'Every page that is identical network-wide, or superseded by another page ' +
    'on its own site, carries noindex.',
);
