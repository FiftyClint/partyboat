import { z } from 'astro/zod';
import { ACCENT_NAMES, STEP_LABELS } from './brand.mjs';

/**
 * Schema for a site data file (src/data/sites/<key>.yaml).
 *
 * Everything that varies between markets lives in one of these files. Pages
 * read from here and nowhere else. A missing or malformed field fails the
 * build rather than rendering an empty section onto a live domain.
 *
 * The shape follows the questions a person planning a party boat day actually
 * has: what kind of boat, where it leaves from, when, roughly what it costs
 * and what that price includes, and what the rules are. Every section that
 * states a fact a reader might act on (price, season, law) carries its own
 * sources, and scripts/check-claims.mjs stops a dollar figure or a percentage
 * appearing anywhere that has no source beside it.
 */

const nonEmpty = (label, max = 400) =>
  z.string().trim().min(1, `${label} cannot be empty`).max(max);

const blurb = z.object({
  title: nonEmpty('blurb title', 120),
  body: nonEmpty('blurb body', 1400),
});

const faqEntry = z.object({
  question: nonEmpty('FAQ question', 300),
  answer: nonEmpty('FAQ answer', 2000),
});

export const sourceSchema = z.object({
  label: nonEmpty('source label', 240),
  url: z.string().url('source url must be a full URL'),
  accessed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'source accessed date must be YYYY-MM-DD'),
});

const sources = (what) => z.array(sourceSchema).min(1, `${what} needs at least one source`);

/** A section that states facts, and therefore cites them. */
const sourcedSection = (what) =>
  z.object({
    summary: nonEmpty(`${what} summary`, 2400),
    sources: sources(what),
  });

/**
 * Where to look when checking whether a market's facts have moved. Not
 * rendered. Working knowledge for whoever refreshes the site next season.
 */
const watchEntry = z.object({
  label: nonEmpty('watch label', 200),
  url: z.string().url('watch url must be a full URL'),
  kind: z.enum(['regulator', 'operator', 'marina', 'tourism', 'news']),
});

const image = z.object({
  src: nonEmpty('image src', 300),
  alt: nonEmpty('image alt text', 300),
  credit: nonEmpty('image credit', 200),
});

/**
 * The market's tracking number. Optional: a site with no number shows only
 * the form, and never a number that rings nowhere.
 */
const phone = z.object({
  display: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'display as (555) 555-0123'),
  e164: z.string().regex(/^\+1\d{10}$/, 'e164 as +15555550123'),
  /**
   * Who actually answers, said plainly next to the number. Before an operator
   * signs, that is us, and the page must not imply otherwise.
   */
  answeredBy: nonEmpty('who answers the phone', 200),
  hours: nonEmpty('hours the phone is answered', 200),
});

/**
 * The operator a market's requests go to. Only set once an agreement is
 * signed. Until then the site says, truthfully, that requests are passed to
 * a local operator and names nobody.
 */
const operator = z.object({
  name: nonEmpty('operator name', 120),
  url: z.string().url().optional(),
  /** Written with the operator and approved by them. Shown beside every call to action. */
  disclosure: nonEmpty('operator disclosure', 400),
  agreementSigned: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'agreementSigned must be YYYY-MM-DD'),
});

/**
 * One row of the "at a glance" table at the top of the home page. A short
 * label, a short value, and the source that value came from. This table is
 * what an answer engine lifts first, so every row carries its own citation.
 */
const glanceRow = z.object({
  label: nonEmpty('glance label', 40),
  value: nonEmpty('glance value', 220),
  source: sourceSchema,
});

/**
 * A question page at /questions/<slug>/. The answer is the first thing on the
 * page and has to stand on its own when quoted out of context, so it is short
 * and names the market. The detail and sources follow.
 */
const question = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase words joined by hyphens').max(70),
  question: nonEmpty('question', 140),
  answer: nonEmpty('short answer', 420).refine(
    (text) => text.split(/\s+/).length <= 60,
    'short answer must be 60 words or fewer',
  ),
  detail: nonEmpty('question detail', 3200),
  sources: sources('question'),
});

/** Everything a market needs before it can be served on its own domain. */
const marketContent = z.object({
  /** The date every fact on the site was last checked against its source. */
  factsChecked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'factsChecked must be YYYY-MM-DD'),

  glance: z.array(glanceRow).min(4).max(8),

  questions: z
    .array(question)
    .min(6, 'a market site needs at least six question pages')
    .refine((qs) => new Set(qs.map((q) => q.slug)).size === qs.length, 'question slugs must be unique'),

  hero: z.object({
    headline: nonEmpty('hero headline', 120),
    subhead: nonEmpty('hero subhead', 400),
  }),

  /**
   * The direct answer to "how do I get a party boat on <market>". Opens the
   * home page, so it has to land inside the first 150 words.
   */
  directAnswer: nonEmpty('direct answer', 1200),

  /** One sentence per shared step label, written for this market. */
  steps: z
    .array(nonEmpty('step body', 600))
    .length(STEP_LABELS.length, `provide exactly ${STEP_LABELS.length} step descriptions`),

  boatTypes: z.object({
    intro: nonEmpty('boat types intro', 900),
    types: z.array(blurb).min(2).max(5),
  }),

  departures: z.object({
    intro: nonEmpty('departures intro', 1200),
    places: z.array(blurb).min(2).max(8),
    sources: sources('departures'),
  }),

  season: sourcedSection('season'),

  pricing: z.object({
    summary: nonEmpty('pricing summary', 2400),
    components: z.array(blurb).min(2).max(6),
    sources: sources('pricing'),
  }),

  rules: sourcedSection('rules'),

  guide: z.object({
    title: nonEmpty('guide title', 120),
    description: nonEmpty('guide description', 300),
    intro: nonEmpty('guide intro', 1400),
    sections: z.array(blurb).min(3).max(10),
    sources: sources('guide'),
  }),

  faq: z.array(faqEntry).min(4, 'a market site needs at least four FAQ entries'),

  /** The /for-operators/ page opener, written for this market. */
  forOperators: nonEmpty('for operators intro', 1400),

  /** What the home page title and meta description say. */
  meta: z.object({
    title: nonEmpty('meta title', 70),
    description: nonEmpty('meta description', 170),
  }),
});

export const siteSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z-]{1,24}$/, 'key must be lowercase letters and hyphens'),
    /** What the wordmark says, for example "Party Boat Ozarks". */
    siteName: nonEmpty('site name', 60),
    domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'domain must be a bare hostname'),
    /**
     * Defensive names for the same market. Attached to the same Worker, which
     * answers every request on them with a 301 to the primary domain.
     */
    aliases: z.array(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)).default([]),
    /** The water, as people say it: "Lake of the Ozarks". */
    marketName: nonEmpty('market name', 80),
    /** State or states, for structured data and footers. */
    regionName: nonEmpty('region name', 80),
    timezone: z.string().regex(/^[A-Za-z]+\/[A-Za-z_]+$/, 'IANA time zone'),
    accent: z.enum(ACCENT_NAMES),
    /**
     * `live` builds and deploys. `pending` is a held domain with no site yet;
     * its file exists so the inventory is visible, and build:all skips it by
     * name.
     */
    status: z.enum(['live', 'pending']),
    phone: phone.optional(),
    operator: operator.optional(),
    images: z.object({ og: image.optional(), banner: image.optional() }).default({}),
    watch: z.array(watchEntry).default([]),
  })
  .merge(marketContent.partial())
  .superRefine((value, ctx) => {
    if (value.status !== 'live') return;
    const result = marketContent.safeParse(value);
    if (result.success) return;
    for (const issue of result.error.issues) {
      ctx.addIssue({ ...issue, message: `${issue.message} (required once status is "live")` });
    }
  });
