import { MONETIZATION_ENABLED } from "@/config/monetization";
import type { ListingQuotaSnapshot } from "@/types/listing-quota";
import Link from "next/link";

type ListingQuotaSummaryProps = {
  quota: ListingQuotaSnapshot;
};

export function ListingQuotaSummary({ quota }: ListingQuotaSummaryProps) {
  const usageRatio =
    quota.totalLimit > 0 ? Math.min(quota.usedCount / quota.totalLimit, 1) : 0;
  const usagePercent = Math.round(usageRatio * 100);
  const exhausted = quota.remaining === 0;

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Váš balíček inzerce</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {quota.remaining > 0
              ? `Zbývá ${quota.remaining} z ${quota.totalLimit} publikací.`
              : MONETIZATION_ENABLED
                ? "Limit je vyčerpán — dokoupit kredit v nastavení účtu."
                : "Limit je vyčerpán — další publikace zatím není k dispozici."}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
          {quota.planLabel}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-gray-900">
            {quota.usedCount} / {quota.totalLimit} publikací
          </span>
          <span className={exhausted ? "font-medium text-amber-800" : "text-gray-500"}>
            {exhausted ? "Limit vyčerpán" : `Zbývá ${quota.remaining}`}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={usagePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Využití limitu ${quota.usedCount} z ${quota.totalLimit}`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              exhausted ? "bg-amber-500" : "bg-emerald-600"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      <Link
        href="/balicky-inzerce"
        className="mt-3 inline-flex text-sm font-medium text-gray-900 underline-offset-2 hover:underline"
      >
        {MONETIZATION_ENABLED ? "Balíčky a ceník →" : "Limity inzerce →"}
      </Link>
      <Link
        href="/profil/nastaveni"
        className="mt-2 block text-sm text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
      >
        Nastavení účtu
      </Link>
    </div>
  );
}
