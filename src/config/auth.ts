/** Cíle e-mailových odkazů Auth (signup / recovery). */

/** Prefetch-safe potvrzení (`token_hash` + tlačítko). PKCE `?code=` je fallback. */
export const EMAIL_SIGNUP_CONFIRM_PATH = "/auth/potvrdit";

/** Implicit hash / starší odkazy / OAuth callback bez kódu. */
export const AUTH_SESSION_FINISH_PATH = "/auth/dokoncit";
