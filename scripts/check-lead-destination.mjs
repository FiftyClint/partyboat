#!/usr/bin/env node
import { hasLeadDestination, leadWebhook, LEAD_ENDPOINT } from '../src/data/lead-capture.mjs';
import { LEAD_STORES, leadStore } from '../src/data/lead-store.mjs';

/**
 * Refuses to deploy sites whose request form has nowhere to send a request.
 *
 * Without a destination LeadForm renders a "not open yet" notice instead of a
 * form, which is honest but means the site captures nothing. This check makes
 * that a deliberate choice rather than an accident: a deploy without the
 * chosen store's token (NOTION_TOKEN unless LEAD_STORE says otherwise) fails
 * here. GHL_TOKEN is not needed while LEAD_STORE is notion.
 */

const store = leadStore(process.env.LEAD_STORE);
const { secret, label } = LEAD_STORES[store];

if (hasLeadDestination()) {
  const via =
    leadWebhook() === LEAD_ENDPOINT
      ? `built-in receiver at ${LEAD_ENDPOINT}, which writes to ${label}`
      : 'configured webhook';
  console.log(`Lead destination check passed. Requests go to the ${via}.`);
  process.exit(0);
}

console.error(
  [
    'Lead destination check FAILED.',
    '',
    'Nothing would receive a trip request. Set one of these:',
    `  ${secret.padEnd(21)} turns on the built-in receiver, which writes to`,
    `                        ${label}. In GitHub Actions it`,
    '                        comes from the repository secret of the same name.',
    '  PUBLIC_LEAD_WEBHOOK   send requests somewhere else instead',
    '',
    `  LEAD_STORE            ${store}`,
    `  ${secret.padEnd(21)} ${process.env[secret] ? 'set' : 'not set'}`,
    `  PUBLIC_LEAD_WEBHOOK   ${process.env.PUBLIC_LEAD_WEBHOOK ? 'set' : 'not set'}`,
  ].join('\n'),
);
process.exit(1);
