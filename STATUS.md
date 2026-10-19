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
- Sites written and passing every check: **ozarks**, **table-rock**.
- Operator prospect lists: Ozarks 20, Table Rock 17 (held locally, see Blocked).
- Docs: `docs/GHL-SETUP.md` (Ryan), `docs/OPERATOR-CALLS.md` (Ryan), `docs/LAUNCH.md` (Clint).

## In progress

- Research and sites for lake-travis, nashville, havasu.

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

- The GHL API version header (`2021-07-28` vs `v3`). Confirm with one real test request
  as soon as the token exists. See `workers/site/ghl.mjs`.
- Exact GHL screen and scope names in `docs/GHL-SETUP.md`. GHL renames things.

## Costs so far

$0 beyond the domains. No numbers bought, no ads, no paid tools.

## Next

1. Finish the three remaining sites.
2. When the GHL token exists: send one real test request, confirm it lands with note and
   tags, then fix the version header if needed.
3. Ryan starts operator calls from the prospect lists. That is the real test.
