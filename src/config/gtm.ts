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
