"use client";

import {
  getSiteNoticeConfig,
  type SiteNoticeVariant,
} from "@/config/site-notice";
import { Info, Megaphone, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const VARIANT_STYLES: Record<
  SiteNoticeVariant,
  { bar: string; link: string; icon: typeof Info }
> = {
  info: {
    bar: "bg-blue-50 text-blue-900 border-blue-200",
    link: "text-blue-900 decoration-blue-400 hover:decoration-blue-700",
    icon: Info,
  },
  marketing: {
    bar: "bg-emerald-50 text-emerald-900 border-emerald-200",
    link: "text-emerald-900 decoration-emerald-400 hover:decoration-emerald-700",
    icon: Megaphone,
  },
  maintenance: {
    bar: "bg-amber-50 text-amber-900 border-amber-200",
    link: "text-amber-900 decoration-amber-400 hover:decoration-amber-700",
    icon: Wrench,
  },
};

/** Odlišný klíč pro každou zprávu — po změně textu se lišta zobrazí i uživateli, který předchozí zavřel. */
function dismissKey(variant: string, message: string): string {
  let hash = 0;
  const raw = `${variant}:${message}`;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return `site-notice-dismissed:${hash}`;
}

export function SiteNoticeBar() {
  const config = getSiteNoticeConfig();
  const dismissible = config.dismissible ?? true;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!config.enabled) return;
    if (!dismissible) {
      setDismissed(false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(
        dismissKey(config.variant, config.message),
      );
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, [config.enabled, config.variant, config.message, dismissible]);

  if (!config.enabled || dismissed) return null;

  const styles = VARIANT_STYLES[config.variant];
  const Icon = styles.icon;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(
        dismissKey(config.variant, config.message),
        "1",
      );
    } catch {
      /* localStorage nedostupný — jen zavřeme v rámci session */
    }
    setDismissed(true);
  };

  const isExternal = /^https?:\/\//.test(config.link?.href ?? "");

  return (
    <div
      role={config.variant === "maintenance" ? "alert" : "status"}
      className={`relative border-b ${styles.bar}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-9 py-2 text-center text-sm">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="leading-snug">
          {config.message}
          {config.link ? (
            <>
              {" "}
              {isExternal ? (
                <a
                  href={config.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-semibold underline underline-offset-2 ${styles.link}`}
                >
                  {config.link.label ?? "Více informací"}
                </a>
              ) : (
                <Link
                  href={config.link.href}
                  className={`font-semibold underline underline-offset-2 ${styles.link}`}
                >
                  {config.link.label ?? "Více informací"}
                </Link>
              )}
            </>
          ) : null}
        </p>
        {dismissible ? (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Zavřít oznámení"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current sm:right-3"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
