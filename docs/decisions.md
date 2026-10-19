# Decisions

Dated, with who decided and why. Newest first.

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
