# Status

Last updated 2026-10-19.

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
| Clint | Name the legal entity that publishes the sites, and its state | Footer, about, privacy and terms; `check:launch` refuses a deploy without it |
| Clint | Decide where research and operator lists live (repo is public) | They are only on this machine until then |
| Ryan | GHL steps 1, 2 and 2b: private integration token, two pipelines | The form cannot save anything without the token |
| Ryan, then Clint | Price five tracking numbers; Clint approves; Ryan buys | Phone numbers on the sites |
| Clint | Add four GitHub secrets (`docs/LAUNCH.md` Part 4) | Deploy and domain workflows |
| Clint | At launch: Cloudflare AI bot policies to Allow, Search Console, Bing Webmaster Tools (`docs/LAUNCH.md` Part 7) | Answer engines cannot quote what they cannot crawl |

## Not verified yet

Before launch, open these official pages in a normal browser and confirm the sites state them
correctly. Each refused automated fetches, so the facts came via a search index:

- Texas Parks and Wildlife: party boat license (30 ft, over six passengers), boater education
  (born on or after Sept 1, 1993), children under 13 in life jackets. Used on lake-travis.
  tpwd.texas.gov still refused on 2026-10-20.
- Arizona Game and Fish (azgfd.com, 403 on 2026-10-20): children 12 and under in life jackets
  and the .08 limit. Used on havasu.
- Coast Guard press releases on illegal charters (news.uscg.mil, 403 on 2026-10-20). Used on havasu.

Checked against the official page on 2026-10-20:

- Tennessee (tn.gov/twra): boater education for anyone born after Jan 1, 1989 over 8.5 hp, the
  .08 limit, and children 12 and under in life jackets. The life jacket rule applies unless the
  boat is anchored, moored or aground; the nashville site said "while moving" and was corrected.
- Lake Havasu (golakehavasu.com): Bridgewater Channel rules (5 mph no wake, no boats 36 ft or
  longer, no houseboats, no swimming, no water cannons) and operator ages (12 Arizona, 16 California).

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
