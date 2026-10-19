#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { walk } from './lib/html-text.mjs';

/**
 * No price, percentage or count stated where no source sits beside it.
 *
 * The sections that carry sources in the schema (departures, season, pricing,
 * rules, guide) may state figures, because a reader can see where each came
 * from. Everywhere else, the hero, the FAQ, the steps, the boat types, a
 * figure is a claim with nothing behind it, and a model writing local copy
 * will produce confident numbers if left alone. A reader planning a group
 * trip will act on a price they read. So figures live in the sourced
 * sections and the rest of the page points there.
 *
 * Runs on every site file, pending ones included, so a draft is caught before
 * it is ever built.
 */

const ROOT = new URL('..', import.meta.url).pathname;
const SOURCED = new Set(['departures', 'season', 'pricing', 'rules', 'guide']);

/* Not linted: identity, configuration, and source lists, which quote third parties. */
const SKIP = new Set(['key', 'domain', 'aliases', 'timezone', 'accent', 'status', 'phone', 'operator', 'images', 'watch', 'sources']);

const PATTERNS = [
  { re: /\$\s?\d/, what: 'a dollar amount' },
  { re: /\d\s?(?:%|percent\b)/i, what: 'a percentage' },
  { re: /\b\d[\d,]*\+?\s(?:boats|operators|marinas|captains|people a year|visitors)\b/i, what: 'a count of things' },
  { re: /\b(?:the|world'?s|nation'?s|state'?s)\s+(?:largest|biggest|busiest|best|number one)\b/i, what: 'a ranking claim' },
];

const problems = [];

function scan(file, node, path) {
  if (typeof node === 'string') {
    for (const { re, what } of PATTERNS) {
      if (re.test(node)) problems.push(`${relative(ROOT, file)} (${path}): ${what} with no source beside it`);
    }
  } else if (Array.isArray(node)) {
    node.forEach((item, i) => scan(file, item, `${path}[${i}]`));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (SKIP.has(key)) continue;
      scan(file, value, path ? `${path}.${key}` : key);
    }
  }
}

const files = walk(`${ROOT}src/data/sites`, (f) => f.endsWith('.yaml'));
for (const file of files) {
  const data = parseYaml(readFileSync(file, 'utf8')) ?? {};
  for (const [key, value] of Object.entries(data)) {
    if (SKIP.has(key) || SOURCED.has(key)) continue;
    scan(file, value, key);
  }
}

if (problems.length > 0) {
  console.error(`Claims check FAILED. ${problems.length} unsourced figure(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\nMove the figure into pricing, season, rules, departures or guide, where its\n' +
      'source is listed beside it, and have this text point there instead.',
  );
  process.exit(1);
}
console.log(`Claims check passed. ${files.length} site file(s), no unsourced figures outside the sourced sections.`);
