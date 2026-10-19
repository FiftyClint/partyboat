/**
 * Injects the routes each market site is built with.
 *
 * The templates live in src/routes rather than src/pages so the route set is
 * stated in one place. src/pages holds only 404.astro, which every site needs.
 */

const routeUrl = (path) => new URL(`../src/routes/${path}`, import.meta.url);

const ROUTES = [
  ['/', 'market/index.astro'],
  ['/local-guide', 'market/local-guide.astro'],
  ['/faq', 'market/faq.astro'],
  ['/for-operators', 'market/for-operators.astro'],
  ['/about', 'common/about.astro'],
  ['/privacy', 'common/privacy.astro'],
  ['/terms', 'common/terms.astro'],
  ['/thank-you', 'common/thank-you.astro'],
  ['/robots.txt', 'files/robots.txt.mjs'],
];

export default function siteRoutes() {
  return {
    name: 'partyboat:site-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        for (const [pattern, entrypoint] of ROUTES) {
          injectRoute({ pattern, entrypoint: routeUrl(entrypoint) });
        }
      },
    },
  };
}

export { ROUTES };
