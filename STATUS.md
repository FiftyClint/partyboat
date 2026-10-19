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
- All five pilot sites written and passing every check (45 pages, no accessibility
  violations, no shared passages across sites): **ozarks**, **table-rock**,
  **lake-travis**, **nashville**, **havasu**.
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

## Not verified yet

Before launch, open these official pages in a normal browser and confirm the sites state them
correctly. Each refused automated fetches, so the facts came via a search index:

- Texas Parks and Wildlife: party boat license (30 ft, over six passengers), boater education
  (born on or after Sept 1, 1993), children under 13 in life jackets. Used on lake-travis.
- Tennessee Wildlife Resources Agency: boater education (born after Jan 1, 1989), children 12 and
  under in life jackets, .08 limit. Used on nashville.
- Arizona Game and Fish and Go Lake Havasu channel rules: life jackets 12 and under, channel code
  sections, California rental exemption. Used on havasu.
- Coast Guard press releases on illegal charters (Lake Havasu, April 2024).

- The GHL API version header (`2021-07-28` vs `v3`). Confirm with one real test request
  as soon as the token exists. See `workers/site/ghl.mjs`.
- Exact GHL screen and scope names in `docs/GHL-SETUP.md`. GHL renames things.

## Costs so far

$0 beyond the domains. No numbers bought, no ads, no paid tools.

## Next

1. When the GHL token exists: send one real test request, confirm it lands with note and
   tags, then fix the version header if needed.
2. Ryan starts operator calls from the prospect lists. That is the real test.
