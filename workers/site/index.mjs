import { spamScore } from './spam.mjs';
import { writeRequest } from './ghl.mjs';

/**
 * The Worker that fronts every market site.
 *
 * Every request except the hashed CSS and the fonts passes through here first
 * (run_worker_first in the generated wrangler config; those two never redirect
 * and each Worker run counts toward the account's free daily requests). For a
 * page that costs one comparison: if the request came in on www, plain http,
 * a defensive alias domain, or a non-canonical path spelling, it is sent to the one address the page is published at with a
 * 301. Otherwise it is handed straight to the built files. The only request
 * that does real work is a trip request posted to /api/lead.
 *
 * The receiver lives on each site's own domain so the form posts to a
 * relative path, the same built HTML is correct everywhere, and there is no
 * CORS to configure. The GHL token is a Worker secret and never reaches a
 * browser.
 *
 * Environment, set by scripts/deploy.mjs:
 *   SITE_DOMAIN      the primary domain (var)
 *   SITE_ALIASES     comma-separated defensive domains (var)
 *   MARKET           the market key, for tags (var)
 *   GHL_LOCATION_ID  the Party Boat sub-account (var)
 *   GHL_TOKEN        private integration token (secret)
 */

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-robots-tag': 'noindex' },
  });

/**
 * The one spelling of each page's path: a directory, ending in a slash.
 * Cloudflare's asset handler fixes the other spellings with a 307, which
 * Google reads as temporary; PoweredLandCo had pages split across two
 * addresses until this answered with a 301 instead. Files keep their names
 * and /api is left to the receiver.
 */
const normalPath = (pathname) => {
  if (pathname.startsWith('/api/')) return pathname;
  let path = pathname.replace(/\/{2,}/g, '/');
  path = path.replace(/\/index\.html$/, '/');
  path = path.replace(/^(.*\/[^/.]+)\.html$/, '$1/');
  const last = path.slice(path.lastIndexOf('/') + 1);
  return path.endsWith('/') || last.includes('.') ? path : `${path}/`;
};

/**
 * The address a request should be read at, or null if it already is. Only
 * GET and HEAD move: a 301 turns a POST into a GET in most clients, which
 * would drop a trip request on the floor. Without SITE_DOMAIN (tests,
 * wrangler dev) nothing moves.
 */
export const canonicalLocation = (request, env) => {
  const domain = env.SITE_DOMAIN;
  if (!domain) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  const path = normalPath(url.pathname);
  if (url.protocol === 'https:' && url.host === domain && path === url.pathname) return null;
  return `https://${domain}${path}${url.search}`;
};

const hostsFor = (env) =>
  [env.SITE_DOMAIN, ...String(env.SITE_ALIASES ?? '').split(',')]
    .map((h) => (h ?? '').trim().toLowerCase())
    .filter(Boolean);

export async function receiveLead(request, env, { fetchImpl = fetch } = {}) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: 'POST', 'x-robots-tag': 'noindex' },
    });
  }

  /*
   * No token or location means no destination, and saying so is the point:
   * the form shows "that did not go through" rather than thanking somebody
   * whose request went nowhere.
   */
  if (!env.GHL_TOKEN || !env.GHL_LOCATION_ID) {
    console.error('lead: GHL_TOKEN or GHL_LOCATION_ID is not set on this Worker');
    return json(503, { error: 'Request capture is not configured' });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Could not read the request' });
  }

  const fields = {};
  for (const key of new Set([...form.keys()])) {
    const value = form.get(key);
    fields[key] = typeof value === 'string' ? value : '';
  }

  /* Nobody should be able to create an empty contact by posting here. */
  const hasContact = ['phone', 'email'].some((k) => (fields[k] || '').trim().length > 0);
  if (!hasContact) return json(400, { error: 'Nothing to record' });

  const verdict = spamScore(fields, request, hostsFor(env));
  const market = env.MARKET || fields.market || 'unknown';

  let result;
  try {
    result = await writeRequest({
      fields,
      market,
      token: env.GHL_TOKEN,
      locationId: env.GHL_LOCATION_ID,
      sourceSite: env.SITE_DOMAIN,
      verdict,
      fetchImpl,
    });
  } catch (error) {
    console.error('lead: could not reach GHL', error);
    return json(502, { error: 'Could not save the request' });
  }

  if (!result.ok) {
    /* Logged in full for `wrangler tail`; never returned to the browser. */
    console.error(`lead: GHL ${result.step} failed (${result.status})`, result.detail);
    return json(502, { error: 'Could not save the request' });
  }

  /*
   * The visitor is told the same thing whether or not it scored as spam. A bot
   * that learns which submissions were rejected learns how to get past this.
   */
  if (fields.client !== 'script') {
    const redirect = typeof fields.redirect_to === 'string' ? fields.redirect_to : '/thank-you/';
    /* Only our own paths. An absolute URL here would be an open redirect. */
    const safe = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/thank-you/';
    return new Response(null, { status: 303, headers: { location: safe } });
  }
  return json(200, { ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const location = canonicalLocation(request, env);
    if (location) return new Response(null, { status: 301, headers: { location } });

    if (url.pathname === '/api/lead') return receiveLead(request, env);

    /* Anything else under /api/ is not ours. A typo in a form action must not render a 200. */
    if (url.pathname.startsWith('/api/')) return json(404, { error: 'Not found' });

    return env.ASSETS.fetch(request);
  },
};
