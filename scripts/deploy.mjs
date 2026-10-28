#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, rmSync } from 'node:fs';
import { liveSites, allSites } from '../src/data/sites.node.mjs';
import { workerName } from './lib/worker-name.mjs';
import { LEAD_STORES, leadStore } from '../src/data/lead-store.mjs';

/**
 * Deploys every live market site to its own Cloudflare Worker.
 *
 * One Worker per market rather than one serving every hostname: each site
 * stays pure static, can be rolled back alone, and a mistake on one domain
 * cannot take down the others. A market's defensive alias domains attach to
 * the same Worker, which 301s them to the primary domain.
 *
 * Sites are built in CI and uploaded finished. Cloudflare never builds
 * anything, so the content guards cannot be skipped on the way to a domain.
 *
 *   node scripts/deploy.mjs            deploy every live site
 *   node scripts/deploy.mjs --only ozarks
 *   node scripts/deploy.mjs --dry-run  print what would happen
 *
 * Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, and the token of the
 * lead store for the request receiver: NOTION_TOKEN while LEAD_STORE is
 * notion (the default), GHL_TOKEN when it is ghl. Only that one token is
 * pushed, as a per-Worker secret, so it lives on Cloudflare and never in a
 * built file.
 *
 * Domains are deliberately not touched here; scripts/setup-zones.mjs does that
 * with a separate zone-scoped token. Publishing a site and pointing a domain
 * at it are separate jobs, and only one should be able to fail a deploy.
 */

/** The GHL "Party Boat" sub-account. Not a secret: it appears in GHL URLs. */
const GHL_LOCATION_ID = 'gbL1HD7CxijC004LwYEV';

/**
 * The Notion database "Party Boat Leads" under Business Operations Hub, made
 * 2026-10-28. Not a secret: it is in the database's own URL, and nothing can
 * read or write it without the integration token.
 */
const NOTION_DATABASE_ID = 'b3b648994c9f4dcd882ec537a855470a';

const LEAD_STORE = leadStore(process.env.LEAD_STORE);
const STORE_SECRET = LEAD_STORES[LEAD_STORE].secret;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const targets = liveSites().filter((s) => !only || s.key === only);

if (targets.length === 0) {
  console.error(
    only
      ? `No live site with key "${only}". Live: ${liveSites().map((s) => s.key).join(', ')}`
      : 'No live sites.',
  );
  process.exit(1);
}

if (!dryRun) {
  for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
    if (!process.env[key]) {
      console.error(
        `${key} is not set.\n\n` +
          'Locally, export it before running. In GitHub Actions it comes from\n' +
          'repository secrets. See docs/DEPLOY.md.',
      );
      process.exit(1);
    }
  }
}

const pending = allSites().filter((s) => s.status === 'pending');
console.log(`Deploying ${targets.length} site(s): ${targets.map((s) => s.key).join(', ')}`);
if (pending.length > 0) {
  console.log(`Not deploying ${pending.length} pending site(s): ${pending.map((s) => s.key).join(', ')}`);
}
console.log('');

const storeToken = (process.env[STORE_SECRET] ?? '').trim();

console.log(`Requests go to ${LEAD_STORES[LEAD_STORE].label} (LEAD_STORE=${LEAD_STORE}).`);
console.log('');

if (!dryRun && !storeToken) {
  console.log(`${STORE_SECRET} is not set, so no receiver secret will be pushed.`);
  console.log('Only do this deliberately. The sites will serve, but /api/lead will');
  console.log('answer with an error rather than saving a request.');
  console.log('');
}

/*
 * Written fresh for each site and deleted afterwards. A config file rather than
 * command line flags because run_worker_first and not_found_handling have no
 * flag equivalents, and neither does the SITE_DOMAIN the Worker redirects to.
 */
const CONFIG_PATH = './wrangler.generated.jsonc';

const configFor = (site) => ({
  $schema: './node_modules/wrangler/config-schema.json',
  name: workerName(site),
  main: 'workers/site/index.mjs',
  compatibility_date: '2026-07-01',
  assets: {
    directory: `dist/${site.key}`,
    binding: 'ASSETS',
    // Serve the designed 404 page instead of Cloudflare's bare one.
    not_found_handling: '404-page',
    // Pages and everything else run the Worker first, so www, http and stray
    // path spellings get one 301 by hostname. The fingerprinted CSS and the
    // fonts skip it: they never redirect, and on the Free plan every Worker
    // run counts toward 100,000 requests a day for the whole account, while a
    // file served straight from assets is free. public/_headers caches them.
    run_worker_first: ['/*', '!/_astro/*', '!/fonts/*'],
  },
  // The address every page is canonical at, and what the receiver needs to
  // tag and route a request. See workers/site/index.mjs.
  vars: {
    SITE_DOMAIN: site.domain.toLowerCase(),
    SITE_ALIASES: site.aliases.join(','),
    MARKET: site.key,
    LEAD_STORE,
    NOTION_DATABASE_ID,
    GHL_LOCATION_ID,
  },
});

const failed = [];

for (const site of targets) {
  const dir = `./dist/${site.key}`;

  if (!existsSync(dir)) {
    console.error(`  ${site.key}: ${dir} does not exist. Run npm run build:all first.`);
    failed.push(site.key);
    continue;
  }

  const config = configFor(site);

  process.stdout.write(`  ${site.key.padEnd(5)} ${site.domain.padEnd(34)} `);

  if (dryRun) {
    console.log('');
    console.log(`    ${JSON.stringify(config)}`);
    console.log(`    npx wrangler deploy -c ${CONFIG_PATH}`);
    if (storeToken) console.log(`    npx wrangler secret put ${STORE_SECRET} -c ${CONFIG_PATH}`);
    continue;
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

  const result = spawnSync('npx', ['wrangler', 'deploy', '-c', CONFIG_PATH], { encoding: 'utf8' });

  if (result.status !== 0) {
    console.log('FAILED');
    console.error(result.stdout);
    console.error(result.stderr);
    failed.push(site.key);
    continue;
  }

  if (!storeToken) {
    console.log('deployed, no receiver secret');
    continue;
  }

  /*
   * Pushed after the deploy because a secret cannot be set on a Worker that
   * does not exist yet. On a brand new site that leaves a few seconds where
   * /api/lead answers 503, which the form reports honestly as a failure.
   * The token goes in on stdin and never appears in the output.
   */
  const secret = spawnSync('npx', ['wrangler', 'secret', 'put', STORE_SECRET, '-c', CONFIG_PATH], {
    encoding: 'utf8',
    input: storeToken,
  });

  if (secret.status === 0) {
    console.log('deployed');
  } else {
    console.log('DEPLOYED, SECRET FAILED');
    console.error(secret.stdout);
    console.error(secret.stderr);
    failed.push(site.key);
  }
}

rmSync(CONFIG_PATH, { force: true });

console.log('');
if (failed.length > 0) {
  console.error(`Deploy failed for: ${failed.join(', ')}`);
  process.exit(1);
}

if (dryRun) {
  console.log('Dry run only. Nothing was deployed.');
} else {
  console.log(`Deployed ${targets.length} site(s).`);
  console.log('');
  console.log('A Worker serves nothing at a real address until a domain points at');
  console.log('it. Run the Domains workflow to do that. See docs/DEPLOY.md.');
}
