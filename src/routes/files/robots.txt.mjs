import { currentSite, siteUrl } from '../../data/sites.mjs';
import { LEAD_ENDPOINT } from '../../data/lead-capture.mjs';

/**
 * Per-domain robots.txt.
 *
 * /thank-you is a post-submission destination with nothing to find in search.
 * /api is the request receiver. Google reads form action URLs as links, and a
 * GET there answers 405, which Search Console reported as an error on the
 * PoweredLandCo sites until this line existed. Crawlers only; the form still
 * posts.
 */
export function GET() {
  const site = currentSite();
  const base = siteUrl(site);

  /* "/api" rather than LEAD_ENDPOINT, so the second step and anything added
     later is covered by the same line rather than needing to be remembered. */
  const apiPrefix = `/${LEAD_ENDPOINT.split('/').filter(Boolean)[0]}`;

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /thank-you',
    `Disallow: ${apiPrefix}/`,
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
