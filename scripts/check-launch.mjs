#!/usr/bin/env node
import { liveSites } from '../src/data/sites.node.mjs';
import { PUBLISHER } from '../src/data/brand.mjs';

/**
 * The things that must be true before any site is served on a real domain,
 * none of which a build can tell by itself. Runs in the deploy workflow.
 *
 * Each item is a decision or a fact that belongs to a person. This check does
 * not make those decisions; it refuses to ship until somebody has.
 */

const problems = [];

if (!PUBLISHER.legalName) {
  problems.push(
    'PUBLISHER.legalName in src/data/brand.mjs is not set. The footer, About page, privacy\n' +
      '    policy and terms all name the publisher, and the right entity has not been confirmed.',
  );
}

for (const site of liveSites()) {
  if (/\.example\.(com|org|net)$/.test(site.domain) || site.key === 'fixture') {
    problems.push(`${site.key}: a test fixture is marked live.`);
  }
  if (site.phone && /^\+1555/.test(site.phone.e164)) {
    problems.push(`${site.key}: phone is a 555 placeholder, not a purchased tracking number.`);
  }
  if (site.operator && !site.operator.agreementSigned) {
    problems.push(`${site.key}: an operator is named with no signed agreement date.`);
  }
}

if (problems.length > 0) {
  console.error(`Launch check FAILED. Nothing will be deployed.\n`);
  for (const p of problems) console.error(`  - ${p}\n`);
  process.exit(1);
}
console.log(`Launch check passed for ${liveSites().length} live site(s).`);
