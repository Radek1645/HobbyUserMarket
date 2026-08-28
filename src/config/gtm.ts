/** Veřejné ID GTM containeru — stejné jako ve snippetu od Google. */
export const DEFAULT_GTM_CONTAINER_ID = "GTM-WGLNJRNK";

/** Env `NEXT_PUBLIC_GTM_ID` přepíše default; prázdný string GTM vypne. */
export function resolveGtmContainerId(): string | null {
  const env = process.env.NEXT_PUBLIC_GTM_ID?.trim();

  if (env === "") {
    return null;
  }

  if (env) {
    return env;
  }

  return DEFAULT_GTM_CONTAINER_ID;
}

/** dataLayer / GA4 — publikace inzerátu (stejný moment jako Pixel `Lead`). */
export const GTM_GENERATE_LEAD_EVENT = "generate_lead";

/** localStorage — `generate_lead` jednou na inzerát. */
export const GENERATE_LEAD_SENT_KEY = "zapikolou:generate_lead_sent";
