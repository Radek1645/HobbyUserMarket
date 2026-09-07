"use client";

import { gtmCtaProps, type GtmCtaId } from "@/config/gtm-ids";
import { resolveInAppBackHref } from "@/lib/navigation/in-app-back";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useLayoutEffect,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

export const backLinkClassName =
  "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50";

type BackLinkProps = {
  href: string;
  label: string;
  gtmId?: GtmCtaId;
  className?: string;
  /** Po hydrataci nahradí href předchozí stránkou na webu; `href` zůstane fallback. */
  restoreInAppHistory?: boolean;
};

export function BackLink({
  href,
  label,
  gtmId,
  className,
  restoreInAppHistory = false,
}: BackLinkProps) {
  const pathname = usePathname();
  const [resolvedHref, setResolvedHref] = useState(href);

  useLayoutEffect(() => {
    if (!restoreInAppHistory) {
      setResolvedHref(href);
      return;
    }
    setResolvedHref(
      resolveInAppBackHref({
        currentPathname: pathname,
        fallbackHref: href,
        referrer: document.referrer,
        currentOrigin: window.location.origin,
      }),
    );
  }, [href, pathname, restoreInAppHistory]);

  return (
    <Link
      href={resolvedHref}
      {...(gtmId ? gtmCtaProps(gtmId) : {})}
      className={className ? `${backLinkClassName} ${className}` : backLinkClassName}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

type BackButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  label: string;
  gtmId?: GtmCtaId;
};

export function BackButton({
  label,
  gtmId,
  className,
  type = "button",
  ...props
}: BackButtonProps) {
  return (
    <button
      type={type}
      {...(gtmId ? gtmCtaProps(gtmId) : {})}
      className={className ? `${backLinkClassName} ${className}` : backLinkClassName}
      {...props}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}
