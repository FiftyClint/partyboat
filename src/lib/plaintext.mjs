import { STEP_LABELS, INDEPENDENCE_STATEMENT, PUBLISHER } from '../data/brand.mjs';
import { siteUrl } from '../data/sites.mjs';
import { internalPath, questionPath } from './nav.mjs';
import { longDate } from './dates.mjs';

/**
 * The site as plain markdown, for llms.txt and llms-full.txt.
 *
 * Built from the same site data as the pages, so the two can never disagree.
 * Every fact keeps its source and check date, because a model quoting this
 * file should be able to cite where a number came from.
 */

const cite = (sources) => sources.map((s) => `- ${s.label}: ${s.url} (checked ${s.accessed})`).join('\n');
const paras = (text) => text.split(/\n+/).join('\n\n');

export function llmsIndex(site) {
  const base = siteUrl(site);
  const link = (path, label, note) => `- [${label}](${base}${path}): ${note}`;
  return [
    `# ${site.siteName}`,
    '',
    `> An independent guide to party boats on ${site.marketName}, ${site.regionName}. ${INDEPENDENCE_STATEMENT}`,
    '',
    `Facts checked against their sources on ${longDate(site.factsChecked)}. Every price is a published range, not a quote.`,
    '',
    '## Key facts',
    '',
    ...site.glance.map((row) => `- ${row.label}: ${row.value} (source: ${row.source.url})`),
    '',
    '## Pages',
    '',
    link('/', 'Home', site.meta.description),
    link(internalPath('local-guide'), site.guide.title, site.guide.description),
    link(internalPath('how-we-research'), 'How we research', 'How facts are sourced, dated and corrected.'),
    '',
    '## Answers',
    '',
    ...site.questions.map((q) => link(questionPath(q), q.question, q.answer)),
    '',
    '## Full text',
    '',
    `- [Everything on this site as plain text](${base}/llms-full.txt)`,
    '',
  ].join('\n');
}

export function llmsFull(site) {
  const out = [
    `# ${site.siteName}: ${site.marketName}, ${site.regionName}`,
    '',
    INDEPENDENCE_STATEMENT,
    '',
    `Facts checked against their sources on ${longDate(site.factsChecked)}.${PUBLISHER.legalName ? ` Published by ${PUBLISHER.legalName}.` : ''}`,
    '',
    '## Summary',
    '',
    site.directAnswer,
    '',
    '## At a glance',
    '',
    ...site.glance.map((row) => `- ${row.label}: ${row.value} (source: ${row.source.label}, ${row.source.url}, checked ${row.source.accessed})`),
    '',
    '## How requests work',
    '',
    ...STEP_LABELS.map((label, i) => `${i + 1}. ${label}. ${site.steps[i]}`),
    '',
    '## Boat types',
    '',
    site.boatTypes.intro,
    '',
    ...site.boatTypes.types.map((t) => `### ${t.title}\n\n${t.body}\n`),
    '## Where boats leave from',
    '',
    site.departures.intro,
    '',
    ...site.departures.places.map((p) => `### ${p.title}\n\n${p.body}\n`),
    'Sources:',
    cite(site.departures.sources),
    '',
    '## Season',
    '',
    paras(site.season.summary),
    '',
    'Sources:',
    cite(site.season.sources),
    '',
    '## Prices',
    '',
    paras(site.pricing.summary),
    '',
    ...site.pricing.components.map((c) => `### ${c.title}\n\n${c.body}\n`),
    'Sources:',
    cite(site.pricing.sources),
    '',
    '## Rules',
    '',
    paras(site.rules.summary),
    '',
    'Sources:',
    cite(site.rules.sources),
    '',
    `## ${site.guide.title}`,
    '',
    site.guide.intro,
    '',
    ...site.guide.sections.map((s) => `### ${s.title}\n\n${paras(s.body)}\n`),
    'Sources:',
    cite(site.guide.sources),
    '',
    '## Questions and answers',
    '',
  ];
  for (const q of site.questions) {
    out.push(`### ${q.question}`, '', q.answer, '', paras(q.detail), '', 'Sources:', cite(q.sources), '');
  }
  for (const f of site.faq) {
    out.push(`### ${f.question}`, '', f.answer, '');
  }
  return out.join('\n');
}
