# Notion setup for party boat trip requests

For Clint. One action per line. About 10 minutes. Nothing here costs money or
sends anything to anyone.

Every trip request from the sites becomes one row in the Notion database
**Party Boat Leads**, under Business Operations Hub. It was made on 2026-10-28
and sits next to Water Leads, kept separate from it and from the REAP leads.

The sites need one key to write those rows. This page makes that key, lets it
into that one database, and puts it in GitHub.

GHL comes back later for everything. When it does, nothing here is undone: the
GHL writer is still in the code, and the switch is described at the bottom.

---

## 1. Make the key

Use a new integration for the party boat sites, not the water systems one, so
each key can only reach its own leads.

1. Go to **notion.so/profile/integrations** and sign in.
2. Click **New integration**.
3. Name: `Party boat sites`.
4. Workspace: the one that has Business Operations Hub.
5. Type: **Internal**.
6. Click **Save**.
7. On the next screen, find **Internal Integration Secret** and click **Show**, then **Copy**.
8. Keep that tab open. Go straight to step 3 below with it, and do not paste it into chat or email.

## 2. Let the key into Party Boat Leads

A Notion key can read and write nothing until a page or database is shared with it.

1. In Notion, open **Business Operations Hub**, then **Party Boat Leads**.
2. Click the **•••** menu at the top right of the database.
3. Click **Connections**.
4. Search for `Party boat sites` and click it.
5. Click **Confirm**.

## 3. Put the key in GitHub

1. Go to **github.com/FiftyClint/partyboat**.
2. Click **Settings** along the top.
3. In the left menu click **Secrets and variables**, then **Actions**.
4. Click the green **New repository secret** button.
5. Name: `NOTION_TOKEN`
6. Secret: paste the Internal Integration Secret from step 1.
7. Click **Add secret**.

If a Notion screen looks different from this, tell Claude what you see rather
than guessing. Notion renames things.

---

## Working the leads

- New requests arrive with Stage **New request** and Spam **no**.
- Spam **suspected** means the request looked odd but may be real. Call it if the details make sense.
- Spam **blocked** rows are junk the site kept so a mistake can be found. They arrive as **Not a fit**. Leave them.
- Move Stage along as the request goes: Talked to them, Sent to operator, Operator booked it, or Not a fit.
- **Texts OK** is ticked only when the person ticked the texting box. Do not text anyone without it.

Notion does not send a text or an email when a row arrives. Notion's own
database automations may be able to send an alert, depending on the Notion
plan; that is a setting in Notion, not in this code.

## Switching to GHL later

1. Make the GHL key and pipelines in `docs/GHL-SETUP.md`.
2. Add the GitHub secret `GHL_TOKEN`.
3. In GitHub, **Settings**, **Secrets and variables**, **Actions**, click the **Variables** tab, then **New repository variable**.
4. Name `LEAD_STORE`, value `ghl`, click **Add variable**.
5. Run Deploy.

Requests then go to GHL and the Notion database stops getting new rows. Deleting
the variable sends them back to Notion.
