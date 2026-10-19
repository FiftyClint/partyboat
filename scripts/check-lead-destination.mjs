#!/usr/bin/env node
import { hasLeadDestination, leadWebhook, LEAD_ENDPOINT } from '../src/data/lead-capture.mjs';

/**
 * Refuses to deploy sites whose request form has nowhere to send a request.
 *
 * Without a destination LeadForm renders a "not open yet" notice instead of a
 * form, which is honest but means the site captures nothing. This check makes
 * that a deliberate choice rather than an accident: a deploy without GHL_TOKEN
 * fails here.
 */

if (hasLeadDestination()) {
  const via =
    leadWebhook() === LEAD_ENDPOINT
      ? `built-in receiver at ${LEAD_ENDPOINT}, which writes to the GHL Party Boat sub-account`
      : 'configured webhook';
  console.log(`Lead destination check passed. Requests go to the ${via}.`);
  process.exit(0);
}

console.error(
  [
    'Lead destination check FAILED.',
    '',
    'Nothing would receive a trip request. Set one of these:',
    '  GHL_TOKEN             turns on the built-in receiver. In GitHub Actions it',
    '                        comes from the repository secret of the same name.',
    '  PUBLIC_LEAD_WEBHOOK   send requests somewhere else instead',
    '',
    `  GHL_TOKEN             ${process.env.GHL_TOKEN ? 'set' : 'not set'}`,
    `  PUBLIC_LEAD_WEBHOOK   ${process.env.PUBLIC_LEAD_WEBHOOK ? 'set' : 'not set'}`,
  ].join('\n'),
);
process.exit(1);
