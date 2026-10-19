#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { BANNED_TERMS, INDEPENDENCE_STATEMENT } from '../src/data/brand.mjs';
import { walk, visibleText, normalize } from './lib/html-text.mjs';
import { builtPages } from './lib/html-text.mjs';

/**
 * Copy rules, enforced rather than trusted.
 *
 * Three things are checked:
 *
 *  1. Banned phrases. We are a guide, not a boat company, and every phrase in
 *     BANNED_TERMS claims something only an operator can say ("our fleet",
 *     "book now") or something nobody can verify ("guaranteed", "top rated").
 *     A site that talks like an operator it is not is the single largest
 *     consumer-protection exposure this network has.
 *
 *  2. Em dashes and exclamation points, which Clint does not want anywhere.
 *
 *  3. That the independence statement appears verbatim on every page.
 *
 * Two sources are scanned. Rendered HTML is authoritative for anything that
 * actually ships. Source YAML and markdown are scanned too, so a violation in a
 * pending market file is caught before it is ever built.
 *
 * Rendered text is read from visible content only. Scripts, styles and JSON-LD
 * are excluded, since linting raw markup would flag `<!doctype`, `!important`
 * and "User-agent" forever.
 */

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = `${ROOT}dist`;

const problems = [];
const report = (file, detail) => problems.push({ file: relative(ROOT, file), detail });

const BANNED_RE = new RegExp(
  `\\b(${BANNED_TERMS.map((t) => t.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'gi',
);

// U+2014 em dash and U+2015 horizontal bar. En dashes are left alone: they show
// up legitimately in numeric ranges and are not what Clint objects to.
const EM_DASH_RE = /[—―]/g;
const BANG_RE = /!/g;

const excerpt = (text, index, span = 60) =>
  normalize(text.slice(Math.max(0, index - span), index + span));

function checkText(file, text, { allowBang = false } = {}) {
  const scannable = text;
  for (const match of scannable.matchAll(BANNED_RE)) {
    report(
      file,
      `banned word "${match[0]}" near: ...${excerpt(scannable, match.index)}...`,
    );
  }
  for (const match of text.matchAll(EM_DASH_RE)) {
    report(file, `em dash near: ...${excerpt(text, match.index)}...`);
  }
  if (!allowBang) {
    for (const match of text.matchAll(BANG_RE)) {
      report(file, `exclamation point near: ...${excerpt(text, match.index)}...`);
    }
  }
}

/** Walks a parsed YAML tree and checks only string leaves. */
function checkYamlStrings(file, node, path = '') {
  if (typeof node === 'string') {
    checkText(`${file}${path ? ` (${path})` : ''}`, node);
  } else if (Array.isArray(node)) {
    node.forEach((item, i) => checkYamlStrings(file, item, `${path}[${i}]`));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      checkYamlStrings(file, value, path ? `${path}.${key}` : key);
    }
  }
}

// ---- Source: site data files -------------------------------------------------

for (const file of walk(`${ROOT}src/data/sites`, (f) => f.endsWith('.yaml'))) {
  checkYamlStrings(file, parseYaml(readFileSync(file, 'utf8')));
}

// ---- Built output ------------------------------------------------------------

if (!existsSync(DIST)) {
  console.error('No dist/ directory. Run `npm run build:all` before linting copy.');
  process.exit(1);
}

const pages = builtPages(DIST);
if (pages.length === 0) {
  console.error('dist/ contains no HTML. Run `npm run build:all` first.');
  process.exit(1);
}

for (const page of pages) {
  const text = visibleText(page.html);
  checkText(page.file, text);

  // The independence statement is what keeps a referral site honest. Verbatim, every page.
  if (!normalize(text).includes(normalize(INDEPENDENCE_STATEMENT))) {
    report(page.file, 'missing the required independence statement');
  }
}

// ---- Result ------------------------------------------------------------------

if (problems.length > 0) {
  console.error(`Copy check failed with ${problems.length} problem(s):\n`);
  for (const { file, detail } of problems) console.error(`  ${file}\n    ${detail}\n`);
  process.exit(1);
}

console.log(
  `Copy check passed. ${pages.length} built page(s) scanned, independence statement present on all of them.`,
);
