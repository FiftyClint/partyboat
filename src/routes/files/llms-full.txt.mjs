import { currentSite } from '../../data/sites.mjs';
import { llmsFull } from '../../lib/plaintext.mjs';

/** llms-full.txt: every fact on the site, with sources, as one plain text file. */
export function GET() {
  return new Response(llmsFull(currentSite()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
