#!/usr/bin/env node
import { liveSites } from '../src/data/sites.node.mjs';

/**
 * Every page, at every address Google might try, against the live sites.
 *
 * Each problem Search Console has reported on this network so far has been
 * the same problem in a new costume: one page answering at more than one
 * address, and Google picking the wrong one. www served a full copy until
 * 29 September. Slashless addresses moved with a temporary 307 until
 * 12 October. /page.html and /page/index.html did the same until 15 October.
 * Each was found by Google first and fixed one at a time, because every
 * check here read the built files and none of them asked the live sites how
 * they answer.
 *
 * This one does. For every page in every live sitemap it requires:
 *
 *   the page itself     200, a canonical naming exactly that address, and
 *                       no noindex (the sitemap only lists pages we want
 *                       indexed)
 *   www, plain http,    one permanent 301, straight to that address
 *   no trailing slash,
 *   /index.html, .html,
 *   doubled slashes
 *
 * A 302, 307 or 308, a second hop, or a redirect anywhere else fails it.
 *
 *   node scripts/check-live-addresses.mjs            all live sites
 *   node scripts/check-live-addresses.mjs --site ks  one site
 */

const args = process.argv.slice(2);
const only = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
const sites = liveSites().filter((s) => !only || s.key === only);

const problems = [];
let checked = 0;

const get = (url) =>
  fetch(url, { redirect: 'manual', headers: { 'user-agent': 'partyboat-address-check' } }).catch(
    (error) => ({ status: 0, error }),
  );

const variantsOf = (page) => {
  const url = new URL(page);
  const path = url.pathname;
  const list = [
    [`https://www.${url.host}${path}`, 'www'],
    [`http://${url.host}${path}`, 'plain http'],
  ];
  if (path !== '/') {
    const bare = path.replace(/\/$/, '');
    list.push([`https://${url.host}${bare}`, 'no trailing slash']);
    list.push([`https://${url.host}${bare}.html`, '.html']);
    list.push([`https://${url.host}/${path}`, 'doubled slash']);
  }
  list.push([`https://${url.host}${path}index.html`, '/index.html']);
  return list;
};

const checkPage = async (page) => {
  const response = await get(page);
  checked += 1;
  if (response.status !== 200) {
    problems.push(`${page}  answers ${response.status || response.error}, not 200`);
    return;
  }
  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== page) problems.push(`${page}  canonical says ${canonical ?? 'nothing'}`);
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) {
    problems.push(`${page}  is in the sitemap but serves noindex`);
  }

  for (const [variant, label] of variantsOf(page)) {
    const moved = await get(variant);
    checked += 1;
    const location = moved.headers?.get('location');
    if (moved.status !== 301 || location !== page) {
      problems.push(`${variant}  (${label}) answers ${moved.status || moved.error}${location ? ` to ${location}` : ''}, not one 301 to ${page}`);
    }
  }
};

const sitemapPages = async (domain) => {
  const read = async (url) => {
    const response = await fetch(url).catch(() => null);
    return response?.ok ? response.text() : '';
  };
  const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const pages = [];
  for (const feed of locs(await read(`https://${domain}/sitemap-index.xml`))) pages.push(...locs(await read(feed)));
  return pages;
};

for (const site of sites) {
  const pages = await sitemapPages(site.domain);
  if (pages.length === 0) {
    problems.push(`${site.domain}  sitemap could not be read or is empty`);
    continue;
  }
  // A few at a time: enough to finish in a minute or two, few enough not to
  // look like an attack to Cloudflare.
  for (let i = 0; i < pages.length; i += 4) await Promise.all(pages.slice(i, i + 4).map(checkPage));
  console.log(`  ${site.domain.padEnd(34)} ${pages.length} page(s)`);
}

console.log('');
if (problems.length > 0) {
  console.error(`Live address check FAILED: ${problems.length} problem(s) in ${checked} request(s).\n`);
  for (const line of problems) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`Live address check passed. ${checked} request(s): every page answers at one address and every variant is one 301 to it.`);
