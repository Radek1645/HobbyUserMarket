import { getSiteUrl } from "@/lib/supabase/env";

export type ParsedListingUrl =
  | { ok: true; slug: string }
  | { ok: false; error: string };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validuje URL inzerátu z formuláře — musí být /inzerat/[slug] na produkční doméně. */
export function parseListingReportUrl(raw: string): ParsedListingUrl {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Zadejte URL inzerátu." };
  }

  let pathname: string;

  try {
    const siteUrl = getSiteUrl();
    const base = new URL(siteUrl);
    const parsed = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, base);

    if (parsed.origin !== base.origin) {
      return {
        ok: false,
        error: "URL musí vést na inzerát na tomto webu.",
      };
    }

    pathname = parsed.pathname;
  } catch {
    return { ok: false, error: "Neplatná URL." };
  }

  const match = /^\/inzerat\/([^/]+)\/?$/.exec(pathname);
  if (!match?.[1]) {
    return {
      ok: false,
      error: "URL musí být ve tvaru /inzerat/nazev-inzeratu.",
    };
  }

  const slug = decodeURIComponent(match[1]).trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, error: "Neplatný formát odkazu na inzerát." };
  }

  return { ok: true, slug };
}
