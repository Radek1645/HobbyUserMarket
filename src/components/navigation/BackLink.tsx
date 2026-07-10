"use client";

import { gtmCtaProps, type GtmCtaId } from "@/config/gtm-ids";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export const backLinkClassName =
  "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50";

type BackLinkProps = {
  href: string;
  label: string;
  gtmId?: GtmCtaId;
  className?: string;
};

export function BackLink({ href, label, gtmId, className }: BackLinkProps) {
  return (
    <Link
      href={href}
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
