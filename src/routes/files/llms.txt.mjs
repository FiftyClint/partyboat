import { currentSite } from '../../data/sites.mjs';
import { llmsIndex } from '../../lib/plaintext.mjs';

/** llms.txt: a short map of the site for language models (llmstxt.org). */
export function GET() {
  return new Response(llmsIndex(currentSite()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
