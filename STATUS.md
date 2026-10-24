# Status

Last updated 2026-10-24.

## The test

Will a local party boat operator pay a flat fee for exclusive trip requests? Answer it
before the domains renew on 2027-08-27. Cash cap $500, excluding domains already bought.

## Done

- Domain check: all 60 names registered at GoDaddy on 2026-08-27, expiring 2027-08-27.
  Owner hidden in the public record; Clint to confirm in his account. `docs/domain-register.csv`.
- Site framework ported from PoweredLandCo, with build-time guards on copy, unsourced
  figures, duplicate passages, canonicals, links and accessibility.
- Request receiver: form to GHL Party Boat sub-account (contact, note, tags). Tested against
  a stub only. 14 tests pass.
- Market screen: Lake Travis, Nashville and Lake Havasu chosen to join the Ozarks and
  Table Rock. Destin is the alternate.
- All five pilot sites written and passing every check (95 pages, 55 indexable, no
  accessibility violations, no shared passages across sites): **ozarks**, **table-rock**,
  **lake-travis**, **nashville**, **havasu**.
- Answer-engine build (Clint, 2026-10-19): at-a-glance fact table with a source per row, 8
  question pages per market each opening with a standalone answer, visible dated sources, a
  "facts checked" date on every page, How We Research page, llms.txt and llms-full.txt,
  robots.txt naming AI crawlers as allowed, dated structured data, sitemap lastmod.
- Operator prospect lists, each business verified on its own website on 2026-10-19:
  Ozarks 20, Table Rock 17, Lake Travis 18, Nashville 11, Havasu 11 (held locally, see Blocked).
- Docs: `docs/GHL-SETUP.md` (Ryan), `docs/OPERATOR-CALLS.md` (Ryan), `docs/LAUNCH.md` (Clint).

## Blocked on a person

| Who | What | Why it blocks |
| --- | --- | --- |
| Clint | Confirm the 60 domains are in his GoDaddy account | Nothing goes live on a domain we cannot prove is ours |
| Clint | Confirm the state Aidren LLC is organized in, and that it is filed. He named Aidren LLC as publisher on 2026-10-24 and `PUBLISHER.legalName` is set; `LEGAL_JURISDICTION` stays null, so the terms page omits the governing law sentence until he confirms | Governing law sentence on the terms page |
| Clint | Decide where research and operator lists live (repo is public) | They are only on this machine until then |
| Clint | GHL steps 1, 2 and 2b in the GHL screen: private integration token, two pipelines. Clint took GHL over from Ryan on 2026-10-24. Claude's GHL connections can read the Party Boat sub-account but cannot create pipelines, buy numbers or build workflows | The form cannot save anything without the token |
| Clint | Approve five local tracking numbers: $1.15 a month each, forwarded calls $0.02 a minute (HighLevel LC Phone pricing page, modified 2026-10-12) Calls ring Ryan's cell (Clint, 2026-10-24) | Phone numbers on the sites |
| Clint | Add four GitHub secrets (`docs/LAUNCH.md` Part 4) | Deploy and domain workflows |
| Clint | At launch: Cloudflare AI bot policies to Allow, Search Console, Bing Webmaster Tools (`docs/LAUNCH.md` Part 7) | Answer engines cannot quote what they cannot crawl |

## Official facts

Every state and federal fact used on the five sites has now been checked against its official
page. Checked on 2026-10-24:

- Texas (tpwd.texas.gov): party boat license for a charter of 30 feet or longer carrying more than
  six passengers on inland waters; boater education for anyone born on or after Sept 1, 1993 over
  15 hp. Both matched. The life jacket rule did not: Texas applies it to boats under 26 feet and
  counts drifting as underway. lake-travis said "while the boat is moving" and was corrected.
- Arizona (azleg.gov, A.R.S. 5-331 and 5-395, since azgfd.com does not state either rule): the
  .08 limit and the "impaired to the slightest degree" charge matched. Children 12 and under wear
  a life jacket whenever the boat is underway; havasu said "while moving" and was corrected.
- Coast Guard (news.uscg.mil): the April 27, 2024 Thompson Bay stop, a 25-foot pontoon with nine
  paying passengers, matched.

Checked against the official page on 2026-10-20:

- Tennessee (tn.gov/twra): boater education for anyone born after Jan 1, 1989 over 8.5 hp, the
  .08 limit, and children 12 and under in life jackets. The life jacket rule applies unless the
  boat is anchored, moored or aground; the nashville site said "while moving" and was corrected.
- Lake Havasu (golakehavasu.com): Bridgewater Channel rules (5 mph no wake, no boats 36 ft or
  longer, no houseboats, no swimming, no water cannons) and operator ages (12 Arizona, 16 California).

## Not verified yet

- The GHL API version header (`2021-07-28` vs `v3`). Confirm with one real test request
  as soon as the token exists. See `workers/site/ghl.mjs`.
- Exact GHL screen and scope names in `docs/GHL-SETUP.md`. GHL renames things.

## Promises the sites now make

The How We Research page commits the team to fixing reported errors after checking the
source, and says operators never edit the facts. Keep both true. Recheck facts before each
season and only then move `factsChecked`.

## Costs so far

$0 beyond the domains. No numbers bought, no ads, no paid tools.

## Next

1. When the GHL token exists: send one real test request, confirm it lands with note and
   tags, then fix the version header if needed.
2. Ryan starts operator calls from the prospect lists. That is the real test.
