import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type BackHomeLinkProps = {
  gtmId?: (typeof GTM_CTA)[keyof typeof GTM_CTA];
  label?: string;
};

export function BackHomeLink({
  gtmId = GTM_CTA.CREATE_BACK_HOME,
  label = "Zpět na úvod",
}: BackHomeLinkProps) {
  return (
    <Link
      href="/"
      {...gtmCtaProps(gtmId)}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
