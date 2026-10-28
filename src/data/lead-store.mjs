/*
 * WHICH SYSTEM A TRIP REQUEST IS WRITTEN TO
 * =========================================
 *
 * Notion for now (Clint, 2026-10-28: "move party boats to notion"), the same
 * way the water systems sites write to their own Water Leads database. GHL is
 * where everything goes later ("We'll tie everything into GHL in the future"),
 * so its writer stays in workers/site/ghl.mjs, tested, and switching back is
 * one setting: LEAD_STORE=ghl on the deploy, plus the GHL_TOKEN secret.
 *
 * Plain JavaScript with no Astro or Worker imports, because the build, the
 * deploy script and the Worker all read it.
 */

export const LEAD_STORES = {
  notion: {
    secret: 'NOTION_TOKEN',
    label: 'the Notion database "Party Boat Leads"',
  },
  ghl: {
    secret: 'GHL_TOKEN',
    label: 'the GHL Party Boat sub-account',
  },
};

export const DEFAULT_LEAD_STORE = 'notion';

/**
 * The store named by a LEAD_STORE value, or the default when it is blank. An
 * unknown name throws rather than quietly falling back, because a typo here
 * would send requests somewhere nobody is looking.
 */
export function leadStore(value) {
  const name = String(value ?? '').trim().toLowerCase() || DEFAULT_LEAD_STORE;
  if (!Object.hasOwn(LEAD_STORES, name)) {
    throw new Error(`LEAD_STORE "${name}" is not one of: ${Object.keys(LEAD_STORES).join(', ')}`);
  }
  return name;
}
