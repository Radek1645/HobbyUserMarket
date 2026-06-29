import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import Link from "next/link";

type AppLogoProps = {
  showWordmark?: boolean;
};

/** Lokální tržiště — sousedský domek. */
export function AppLogo({ showWordmark = true }: AppLogoProps) {
  return (
    <Link
      href="/"
      {...gtmCtaProps(GTM_CTA.HEADER_HOME)}
      aria-label="HobbyUserMarket — úvodní stránka"
      className="group flex h-10 shrink-0 items-center gap-2 rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-600/20 transition group-hover:bg-emerald-700">
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="h-6 w-6 text-white"
          fill="none"
        >
          <path
            d="M6 14.5 16 7l10 7.5V25a1.5 1.5 0 0 1-1.5 1.5H7.5A1.5 1.5 0 0 1 6 25V14.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M13 26.5V18h6v8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="hidden min-[380px]:flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            HUM
          </span>
          <span className="text-[10px] font-medium text-emerald-700">
            v okolí
          </span>
        </span>
      ) : null}
    </Link>
  );
}
