# Party Boat Network: rules for any agent working here

Read STATUS.md first. It says what is done, what is blocked, and who owes what.

## What this is

Independent local party boat guide sites, one per market, built from one Astro
codebase. Each site sends trip requests (form and phone) to ONE local operator,
who pays a flat monthly or seasonal fee for them. We never run boats, take
bookings, take payment, or quote binding prices.

Pilot markets (October 2026): ozarks, table-rock, lake-travis, nashville, havasu.
Every other market file in `src/data/sites/` is `status: pending` and is not built.

## Non-negotiable copy rules (enforced by `npm run check`)

1. `INDEPENDENCE_STATEMENT` in `src/data/brand.mjs` appears verbatim on every page.
2. Never write anything only an operator could say or nobody can verify. See
   `BANNED_TERMS`. No "book now", "our fleet", "guaranteed", ratings, rankings.
3. No em dashes. No exclamation points.
4. Prices, percentages and counts only in sections that list sources beside them
   (departures, season, pricing, rules, guide). `scripts/check-claims.mjs`.
5. No 40-word passage may repeat across two sites, or across two indexable pages
   of one site. `scripts/check-duplicate-copy.mjs`. Write different copy; never
   add `data-boilerplate` to prose to get past it.
6. Never invent an operator, boat, marina, price, rule, review, photo, or
   credential. Every fact in a site file comes from `docs/research/` with a URL
   and an access date. Unknown stays out.
7. Never name an operator on a site until `operator.agreementSigned` is a real date.
8. The sites are written answer-first for AI answer engines and people at once. Each
   question page opens with a standalone answer of 60 words or fewer that names the
   market. Every glance row has its own source. Update `factsChecked` only after every
   fact on that site has actually been rechecked.

## GHL

- Requests go to the GHL sub-account "Party Boat", location `gbL1HD7CxijC004LwYEV`.
- Through Composio, use connection `highlevel_mcp_marok-plew` for Party Boat.
  The Composio default (`highlevel_mcp_shape-prest`) is **Your Card Buyer**.
  Never write party boat data without naming the Party Boat connection.
- The receiver (`workers/site/ghl.mjs`) has only been tested against a stub.
  Treat the live API version header as unverified until a real request lands.

## What needs a human

Domain purchases or DNS changes, buying phone numbers, any outbound message to
an operator or consumer, any spend, signing anything, naming an operator, and
setting `status: live` on a new market. Agents draft; people send and sign.

## Commands

```
npm run build:all       build every live site into dist/<key>/
npm run check           copy, claims, duplicates, canonicals, links
npm run test:receiver   request receiver against a stubbed GHL
npm run audit:a11y      axe-core and contrast, in Chromium
npm run verify          all of the above
SITE=ozarks npm run dev one site locally
```

Do not run scheduled jobs on GitHub Actions for this project without asking:
the PoweredLandCo lead screener went down for weeks when Actions minutes ran out.
