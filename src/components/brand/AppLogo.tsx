import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { SITE_HOME_ARIA_LABEL, SITE_TAGLINE } from "@/config/site";
import { appLogoFrameClass } from "@/config/ui-primitives";
import Link from "next/link";

/** CamelCase wordmark zaPikolou.cz — zelený text bez rámečku. */
export function AppLogo() {
  return (
    <Link
      href="/"
      {...gtmCtaProps(GTM_CTA.HEADER_HOME)}
      aria-label={SITE_HOME_ARIA_LABEL}
      className="shrink-0 rounded-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <span
        className={[
          appLogoFrameClass,
          "flex-col items-start justify-center",
        ].join(" ")}
      >
        <span className="inline-flex items-baseline">
          <span className="font-light lowercase leading-none">za</span>
          <span className="font-black leading-none">Pikolou</span>
          <span className="ml-0.5 text-xs font-semibold leading-none opacity-75">
            .cz
          </span>
        </span>
        <span className="mt-0.5 text-[11px] font-medium leading-none text-gray-500">
          {SITE_TAGLINE}
        </span>
      </span>
    </Link>
  );
}
