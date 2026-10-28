# Decisions

Dated, with who decided and why. Newest first.

## 2026-10-28 (Clint: trip requests go to Notion, GHL later)

- **Requests go to Notion for now.** Clint: "move party boats to notion", the same way the
  water systems sites send theirs. A new database, "Party Boat Leads", under Business
  Operations Hub, separate from Water Leads and the REAP leads. This drops the GHL key,
  pipelines and workflow from the launch path.
- **GHL later, without a rewrite.** Clint: "We'll tie everything into GHL in the future".
  The GHL writer and its tests stay; `LEAD_STORE=ghl` (a GitHub repository variable) plus
  the `GHL_TOKEN` secret switches back.
- **Trade-off accepted:** Notion sends no alert when a row arrives, unlike the GHL workflow
  that would have texted Ryan.

## 2026-10-19 (Clint, in the planning session)

- **Lean pilot, not the full plan.** The 31-section execution plan specified a custom
  database, worker queue, adapter layer and 10 agents before any operator had agreed to
  pay. Decided instead: one site codebase, GHL for forms, phones and pipeline,
  QuickBooks for rent invoices, no custom database until GHL is shown to fall short.
- **Goal is a cheap test.** Prove or kill the model before the domains renew on
  2027-08-27. Cash cap for the test: **$500**, excluding the domains already bought.
- **Ryan makes the operator calls.** Claude prepares prospect lists and the call guide.
- **GHL:** the separate agency account reachable through Composio, sub-account "Party Boat".
- **Reuse PoweredLandCo's framework** (Astro multi-site, Cloudflare Workers, content guards).
- **Markets:** Lake of the Ozarks and Table Rock fixed by Clint. Research picked the other
  three on 2026-10-19: Lake Travis, Nashville, Lake Havasu. Destin was the alternate,
  held back for fishing-dominant intent and active Coast Guard enforcement. See
  `docs/research/market-screen.md`.
- **Tracking numbers on all five markets from launch** (Clint chose this over adding
  numbers only after an operator signs).
- **Until an operator signs, calls ring Ryan**, with a whisper naming the market. He takes
  the details and says honestly that a local operator will follow up.

## 2026-10-19 (Claude, within the authority above)

- No hub site. A central site linking 38 lookalike market sites is the doorway pattern
  Google names in its spam policy. Each market stands alone; about, privacy and terms are
  noindex everywhere because they are identical.
- Defensive domains 301 to the primary through the same Worker.
- Texting needs its own checkbox. A phone number given for a callback is not permission
  to text. GHL workflows must only text contacts tagged `pb-sms-consent-yes`.
- Calls are not recorded. The privacy policy says so. Changing it needs a spoken notice
  on the line and a policy change first.
- Deploys are manual only, and `check:launch` blocks them until the publisher entity is
  named.

## 2026-10-19 (Claude, while writing the first two markets)

- Market pages describe departure areas and price ranges without naming rental companies in
  the body copy. The companies are cited in the source lists under each section, which is
  where a reader checks a fact. A site whose job is to send requests to one operator should
  not be promoting that operator's competitors in its headings.
- Facts marked "search summary only" or "not verified on the business's own site" in the
  research dossiers are left off the sites.

## 2026-10-19 (Clint: make the sites answer-engine first, high trust)

- Clint asked that the sites target AI answer engines and bots, with high trust and authority.
  Built in response: an at-a-glance fact table on every home page with a source and date on
  every row; eight question pages per market, each opening with a standalone answer of 60
  words or fewer; sources shown openly under every fact section rather than folded away; a
  "facts checked" date on every page; a How We Research page; llms.txt and llms-full.txt; a
  robots.txt naming the major AI crawlers as allowed with a Content-Signal line; FAQPage,
  breadcrumb and dated WebPage structured data; sitemap lastmod.
- **No individual is named as author or editor** (Clint's choice). The publisher is named, and
  the method page is what stands behind the facts.
- Answer-engine traffic and human usability point the same way here: the table and short
  answers that a model lifts are also what a planner on a phone reads first.
- Limit stated plainly: on-page work cannot create authority a new domain does not have.
  Mentions and links from elsewhere build that over time.
