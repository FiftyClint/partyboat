# Putting the sites online

For Clint. One action per line. Do the parts in order. Each part says what it costs.

The sites are built and checked. They are not online. Nothing below has been done yet.

---

## Part 1. Confirm you own the domains (free, 2 minutes)

The public record shows all 60 domains were registered at GoDaddy on 2026-08-27 and
expire on 2027-08-27, but it hides the owner. Only your account can confirm it.

1. Go to **godaddy.com** and sign in.
2. Click your name (top right), then **My Products**.
3. Under **Domains**, check the count says **60**.
4. Search for `partyboatozarks.com`. You should see it listed.
5. Tell Claude "I own all 60" or the count you see.

While you are there: turn **auto-renew off** for every domain except the six pilot
names below, so nothing renews in August 2027 without a decision.

Pilot names: partyboatozarks.com, ozarkspartyboat.com, tablerockpartyboat.com,
laketravispartyboat.com, partyboatnashville.com, partyboatlakehavasu.com.

## Part 2. Name the publisher (free, a decision)

Every footer, the About page, the privacy policy and the terms name the company that
publishes the sites. It is blank, and the deploy refuses to run until it is filled.

Tell Claude which legal entity publishes these sites (for example an existing LLC, or a
new one), and which state it is organized in.

## Part 3. Phone numbers (costs money: Ryan gets the price first)

Ryan follows `docs/GHL-SETUP.md` steps 1 to 5. He sends you the total for five numbers
before buying. The test cap is $500 total.

When he sends the five numbers, give them to Claude. They go into the site files.

## Part 4. Put three secrets into GitHub (free, about 10 minutes)

These let GitHub publish the sites and let the sites write requests into GHL. You
already did this once for PoweredLandCo; this is the same, in the partyboat repository.

### The GHL key

1. Get the token Ryan created in `docs/GHL-SETUP.md` step 1.
2. Go to **github.com/FiftyClint/partyboat**
3. Click **Settings** along the top.
4. In the left menu click **Secrets and variables**, then **Actions**.
5. Click the green **New repository secret** button.
6. Name: `GHL_TOKEN`
7. Secret: paste the token.
8. Click **Add secret**.

### The Cloudflare keys

Use the same Cloudflare account as PoweredLandCo. GitHub will not show you the old
values, so make new tokens.

1. Go to **dash.cloudflare.com** and sign in.
2. Click your profile icon (top right), then **My Profile**, then **API Tokens**.
3. Click **Create Token**.
4. Next to **Edit Cloudflare Workers** click **Use template**.
5. Scroll down, click **Continue to summary**, then **Create Token**.
6. Copy the token.
7. Back in GitHub, add a secret named `CLOUDFLARE_API_TOKEN` with that value.
8. In Cloudflare click **Workers & Pages** in the left menu and copy the **Account ID**
   on the right.
9. In GitHub add a secret named `CLOUDFLARE_ACCOUNT_ID` with that value.

For pointing domains (Part 6) you also need a zone token. In Cloudflare, Create Token,
Create Custom Token, permissions **Zone: Zone: Edit**, **Zone: DNS: Edit** and
**Zone: Workers Routes: Edit**, zone resources **All zones**. Add it to GitHub as
`CLOUDFLARE_ZONE_TOKEN`.

You should now see four secrets listed. You cannot read them back, which is correct.

## Part 5. Publish (free)

Only after Parts 1 to 4, and only when you want the sites live.

1. Go to **github.com/FiftyClint/partyboat**
2. Click **Actions** along the top.
3. Click **Deploy** in the left list.
4. Click **Run workflow**, leave the box blank, click the green **Run workflow**.
5. Wait for the green check. If it is red, click it and send Claude the first red line.

The sites now answer at addresses like `partyboat-ozarks.clint-bfa.workers.dev`, not yet
at the real domains.

## Part 6. Point the domains (free)

1. In **Actions**, click **Domains**, then **Run workflow**.
2. Leave mode as **dry-run** and run it. It lists what it would change.
3. Send Claude the output.
4. When Claude says it looks right, run it again with mode **apply**.
5. The output ends with nameservers to set at GoDaddy. In GoDaddy, My Products, select
   the pilot domains, choose **Nameservers**, **Change**, **Enter my own**, and paste
   the two names it gave you.
6. It can take a few hours for Cloudflare to see the change. Run **Domains** with
   **apply** once more the next day.

## Part 7. Let answer engines in (free, about 10 minutes per domain)

The sites are built to be read and quoted by ChatGPT, Claude, Perplexity and Google's AI
answers. Three settings outside the code decide whether those engines can actually reach them.

### Cloudflare AI bot settings, for each pilot domain

Cloudflare changed its defaults for new domains on September 15, 2026, and it can block some AI
crawlers before they ever see the robots.txt we publish.

1. Go to **dash.cloudflare.com** and click the domain, for example `partyboatozarks.com`.
2. Click **Security**, then **Settings**.
3. Find **Configure AI bot policies**.
4. Set **Search**, **Agent** and **Training** all to **Allow (do not block)**.
5. Click **AI Crawl Control** in the left menu. In the **Crawlers** tab, make sure nothing is
   set to **Block**.
6. Repeat for the other four pilot domains.

If the screen names differ, tell Claude what you see.

### Google Search Console

1. Go to **search.google.com/search-console** and sign in.
2. Click **Add property**, choose **Domain**, type `partyboatozarks.com`.
3. It shows a TXT record. Claude can add it through Cloudflare, or you add it in Cloudflare
   under **DNS**, **Add record**, type **TXT**.
4. Click **Verify**.
5. Click **Sitemaps**, enter `sitemap-index.xml`, click **Submit**.
6. Repeat for each pilot domain.

### Bing Webmaster Tools

Bing's index feeds several AI assistants, so this matters as much as Google.

1. Go to **bing.com/webmasters** and sign in.
2. Choose **Import from Google Search Console**. It copies all the domains from step above.
3. Submit `sitemap-index.xml` for each if it was not imported.
