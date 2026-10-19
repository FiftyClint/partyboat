import { currentSite, siteUrl } from '../../data/sites.mjs';

/**
 * Per-domain robots.txt.
 *
 * The sites want to be read and quoted by answer engines as well as search
 * engines, so the AI crawlers that respect robots.txt are named and allowed
 * explicitly. Naming them does not change what "User-agent: *" already
 * allows; it removes any doubt for a crawler that looks for its own name, and
 * records the decision where the next person will see it.
 *
 * Content-Signal states the same preference in the vocabulary Cloudflare's
 * managed robots.txt uses (contentsignals.org): search, AI answers that cite
 * us, and training are all welcome. Cloudflare's own AI bot policies on each
 * zone must also be set to Allow at launch; see docs/LAUNCH.md.
 *
 * Two paths are kept out: /thank-you, a post-submission page, and /api, the
 * request receiver, which answers a GET with 405.
 */

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

export function GET() {
  const site = currentSite();
  const base = siteUrl(site);

  const rules = ['Allow: /', 'Disallow: /thank-you', 'Disallow: /api/'];
  const lines = [
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
    ...rules,
    '',
    ...AI_CRAWLERS.flatMap((agent) => [`User-agent: ${agent}`, ...rules, '']),
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
