import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import siteRoutes from './integrations/site-routes.mjs';
import { currentSite, siteUrl } from './src/data/sites.node.mjs';
import { NOINDEX_PATHS } from './src/lib/noindex.mjs';

/**
 * One Astro project, built once per market.
 *
 *   SITE=ozarks npm run build   ->  dist/ozarks/
 *
 * Each build is a complete static site for exactly one domain, so the deploy
 * target stays interchangeable. `npm run build:all` loops every live site.
 */
const site = currentSite();

export default defineConfig({
  site: siteUrl(site),
  outDir: `./dist/${site.key}`,
  output: 'static',
  trailingSlash: 'ignore',

  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  integrations: [
    siteRoutes(),
    /* A sitemap lists pages we want indexed, so noindex pages stay out of it. */
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '');
        if (path === '/thank-you') return false;
        return !NOINDEX_PATHS.includes(path);
      },
    }),
  ],

  image: { domains: [] },

  vite: { build: { assetsInlineLimit: 2048 } },
});
