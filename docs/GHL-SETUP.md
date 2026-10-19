# GHL setup for the Party Boat sub-account

For Ryan. One action per line. Do these in order. Nothing here sends a message to
anyone outside the team.

Sub-account: **Party Boat** (location ID `gbL1HD7CxijC004LwYEV`).

What is already there (read on 2026-10-19): the sub-account was made from a
template snapshot. It has one pipeline, "Marketing Pipeline", with hotel stages
("Reservation Booked", "During Stay", "Left a Review"), and one custom field
asking how often you work out. Neither fits. Step 2 adds what we need. You can
delete the leftovers or ignore them.

---

## 1. Create the key the websites use

The sites write each trip request into GHL with this key. Without it the form
says "not open yet".

1. Log in to GHL and switch to the **Party Boat** sub-account.
2. Click **Settings** (bottom left).
3. Click **Private Integrations**.
4. Click **Create new Integration**.
5. Name: `Party Boat websites`.
6. Scopes: tick only **View Contacts** and **Edit Contacts**. Nothing else.
7. Click **Create**.
8. Copy the token it shows. It is shown once.
9. Do not email it, text it, or paste it into chat. Give it to Clint in person or
   through a password manager. Clint stores it as the GitHub secret `GHL_TOKEN`
   (see `docs/LAUNCH.md`).

If the screen names differ from the above, tell Clint what you see rather than
guessing. GHL renames things.

## 2. Make the pipeline

1. Go to **Opportunities**, then **Pipelines**.
2. Click **Create new pipeline**.
3. Name: `Party Boat Requests`.
4. Stages, in this order:
   - New request
   - Talked to them
   - Sent to operator
   - Operator booked it
   - Not a fit
5. Save.

## 2b. A second pipeline for operators

Operators Ryan calls are tracked in the same sub-account, separate from consumers.

1. **Create new pipeline**, name `Operator Partners`.
2. Stages: To call, Talked, Interested, Terms sent, Signed, Not now.
3. When you add an operator as a contact, tag them `pb-operator` and the market tag,
   for example `pb-market-ozarks`. Never tag an operator `pb-new-request`.

## 3. Phone numbers, one per market

The test budget is **$500 total**. Before buying anything, check the monthly price
per number and the per-minute price on the purchase screen, and send Clint the
total for five numbers. Buy only after he says yes.

For each market below:

1. Go to **Settings**, then **Phone Numbers**.
2. Click **Add Number**.
3. Search by the city in the right column so the number is local.
4. Buy it.
5. Open the number's settings and set:
   - **Name:** the left column, for example `PB Ozarks`.
   - **Forward calls to:** your cell phone.
   - **Call whisper** (the message you hear before the caller is connected): the
     middle column. This tells you which site the caller came from.
   - **Call recording:** OFF. The privacy policy promises calls are not recorded.
   - **Missed call text back:** OFF. We cannot text people who have not agreed to it.
   - **Voicemail:** ON.
6. Send Clint the number. He puts it on the site.

| Name | Whisper | Search near |
| --- | --- | --- |
| PB Ozarks | Party boat call, Lake of the Ozarks | Osage Beach, MO |
| PB Table Rock | Party boat call, Table Rock Lake | Branson, MO |
| PB Lake Travis | Party boat call, Lake Travis | Lakeway, TX |
| PB Nashville | Party boat call, Nashville | Nashville, TN |
| PB Havasu | Party boat call, Lake Havasu | Lake Havasu City, AZ |

## 4. Workflow: tell Ryan about each web request

1. Go to **Automation**, then **Workflows**, then **Create Workflow**, **Start from scratch**.
2. Name: `PB new web request`.
3. Trigger: **Contact Tag**, tag added, tag is `pb-new-request`.
4. Action: **Create Or Update Opportunity**, pipeline `Party Boat Requests`, stage `New request`.
5. Action: **Internal Notification**, SMS and email to you. Include the contact's
   name and phone, and say "New party boat request. Details are in the contact notes."
6. Publish.

The full request (date, group size, occasion, notes) arrives as a **note** on the
contact. The market arrives as a tag such as `pb-market-ozarks`.

## 5. Workflow: log each phone call

1. New workflow, name `PB inbound call`.
2. Trigger: the inbound call trigger your account shows (GHL has called it
   **Call Details** and **Inbound Call** in different versions). Filter to the
   five PB numbers.
3. Action: add tag `pb-call` and the market tag for that number, for example
   `pb-market-ozarks`.
4. Action: **Create Or Update Opportunity**, pipeline `Party Boat Requests`, stage `New request`.
5. Publish.

## Tags the websites use

| Tag | Meaning |
| --- | --- |
| `pb-new-request` | A real web request. Triggers the workflow in step 4. |
| `pb-market-<market>` | Which site it came from. |
| `pb-sms-consent-yes` | They ticked the box allowing texts. Only these may be texted. |
| `pb-sms-consent-no` | They did not. Call or email only. |
| `pb-spam-suspected` | Looked partly like a bot. Still a request; check it. |
| `pb-spam-blocked` | Almost certainly a bot. Not sent to you. Kept so a mistake can be undone. |

## Rules

- Text only contacts tagged `pb-sms-consent-yes`. Never bulk text.
- Never forward a request to more than one operator.
- Keep party boat contacts in this sub-account only. Not Your Card Buyer, not Powered Land.
