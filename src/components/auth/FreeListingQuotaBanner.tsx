import { LISTING_QUOTA_FREE_DEFAULT } from "@/config/app";

/** Promo startovního balíčku — registrace i onboarding. */
export function FreeListingQuotaBanner({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-sm font-medium text-emerald-900 ${className}`}
    >
      Startujete s {LISTING_QUOTA_FREE_DEFAULT} inzeráty zdarma!
    </div>
  );
}
