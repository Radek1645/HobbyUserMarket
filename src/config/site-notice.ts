/** Globální informační lišta (Site Notice) — PRD §12.4.
 *  Zdroj pravdy pro obsah a vzhled tenké lišty nad headerem (AppShell).
 *  Nasazení bez odstávky: uprav tento soubor nebo env a redeploy. */

export type SiteNoticeVariant = "info" | "marketing" | "maintenance";

export type SiteNoticeConfig = {
  enabled: boolean;
  variant: SiteNoticeVariant;
  /** Hlavní text lišty (1–2 věty, §1.7 — vykání, jasná očekávání). */
  message: string;
  /** Volitelný odkaz — CTA „Více“ na konci lišty. */
  link?: {
    href: string;
    label?: string;
  };
  /** U info/marketing může uživatel lištu zavřít (localStorage). U maintenance doporučeno false. */
  dismissible?: boolean;
};

/** Výchozí konfigurace (bez env override). Zapni změnou `enabled` nebo přes env. */
const DEFAULT_CONFIG: SiteNoticeConfig = {
  enabled: false,
  variant: "info",
  message: "",
  dismissible: true,
};

const VALID_VARIANTS: readonly SiteNoticeVariant[] = [
  "info",
  "marketing",
  "maintenance",
];

function parseVariant(value: string | undefined): SiteNoticeVariant | undefined {
  if (value && (VALID_VARIANTS as readonly string[]).includes(value)) {
    return value as SiteNoticeVariant;
  }
  return undefined;
}

/** Env override pro produkci — zapnutí/vypnutí lišty na Vercel bez úpravy kódu. */
export function getSiteNoticeConfig(): SiteNoticeConfig {
  const envMessage = process.env.NEXT_PUBLIC_SITE_NOTICE_MESSAGE?.trim();
  const envEnabled = process.env.NEXT_PUBLIC_SITE_NOTICE_ENABLED;

  const enabled =
    envEnabled !== undefined
      ? envEnabled === "true" || envEnabled === "1"
      : DEFAULT_CONFIG.enabled;

  const variant =
    parseVariant(process.env.NEXT_PUBLIC_SITE_NOTICE_VARIANT) ??
    DEFAULT_CONFIG.variant;

  const message = envMessage && envMessage.length > 0 ? envMessage : DEFAULT_CONFIG.message;

  const linkHref = process.env.NEXT_PUBLIC_SITE_NOTICE_LINK_HREF?.trim();
  const linkLabel = process.env.NEXT_PUBLIC_SITE_NOTICE_LINK_LABEL?.trim();
  const link = linkHref
    ? { href: linkHref, label: linkLabel || undefined }
    : DEFAULT_CONFIG.link;

  return {
    enabled: enabled && message.length > 0,
    variant,
    message,
    link,
    dismissible:
      variant === "maintenance" ? false : DEFAULT_CONFIG.dismissible ?? true,
  };
}
