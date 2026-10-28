# Party Boat Network

Independent local party boat guide sites, one per market, built from one codebase.
Each site passes trip requests (a form and a phone number) to one local operator, who
pays a flat fee for them. We do not run boats or take bookings.

Start with **STATUS.md** (where things stand) and **CLAUDE.md** (the rules).

## How it works

One Astro project, built once per market. `SITE=<key> astro build` reads
`src/data/sites/<key>.yaml` and writes a complete static site for that one domain to
`dist/<key>/`. A market's `status` decides whether it builds: `live` builds and
deploys, `pending` is a domain we hold with no site yet.

Each live site deploys to its own Cloudflare Worker, which serves the files, 301s
www, http, slashless paths and the market's defensive alias domains to the one
canonical address, and answers the request form at `/api/lead` by writing a row into the Notion
database "Party Boat Leads" (`workers/site/`). The GHL writer is kept for later and
turned on with `LEAD_STORE=ghl`.

Pages per market: home (with the form), local guide, questions, for operators, about,
privacy, terms, thank you, 404.

## The guards

Run by `npm run check`, and they fail the build:

| Script | Fails when |
| --- | --- |
| `lint-copy.mjs` | A banned phrase, em dash or exclamation point appears, or a page lacks the independence statement. |
| `check-claims.mjs` | A price, percentage, count or ranking appears outside a section that lists its sources. |
| `check-duplicate-copy.mjs` | Any 40-word passage repeats across two sites, or across two indexable pages of one site. |
| `check-canonicals.mjs` | A page's canonical, sitemap entry and noindex disagree. |
| `check-internal-links.mjs` | An internal link points at an address that is not a page's canonical. |

Also: `npm run test:receiver` (the request receiver against stubbed Notion and GHL),
`npm run audit:a11y` (axe-core and contrast in Chromium), and before any deploy
`npm run check:launch`, `check:leads` and `check:secrets`.

## Commands

```bash
npm install
SITE=ozarks npm run dev    # one site at localhost:4321
npm run build:all          # every live site
npm run verify             # build, guards, receiver tests, accessibility
```

## Origin

The framework, guards, deploy and domain scripts are ported from FiftyClint/poweredlandco,
which runs nineteen state sites the same way. Its comments explain several hard-won
details (trailing slashes, 301 versus 307, noindex on syndicated pages) and were kept.

The business plan this implements is a lean cut of the "Party Boat Network Agent
Execution Plan" of 2026-10-18. What changed and why is in `docs/decisions.md`.
