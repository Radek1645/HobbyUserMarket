import { MONETIZATION_ENABLED } from "@/config/monetization";
import { OPERATOR_CONTACT_EMAIL } from "@/config/app";
import { formatPackagePrice } from "@/lib/listings/quota";
import type { ListingPackageCatalogItem, ListingQuotaSnapshot } from "@/types/listing-quota";
import Link from "next/link";

type ListingQuotaSectionProps = {
  quota: ListingQuotaSnapshot;
  upsellPackage: ListingPackageCatalogItem | null;
};

function operatorContactHref(subject: string): string | null {
  if (OPERATOR_CONTACT_EMAIL) {
    return `mailto:${OPERATOR_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  }
  return null;
}

export function ListingQuotaSection({
  quota,
  upsellPackage,
}: ListingQuotaSectionProps) {
  const usageRatio =
    quota.totalLimit > 0 ? Math.min(quota.usedCount / quota.totalLimit, 1) : 0;
  const usagePercent = Math.round(usageRatio * 100);
  const showUpsell = MONETIZATION_ENABLED && upsellPackage;

  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Inzerce</h2>
        <p className="mt-1 text-sm text-gray-600">
          {MONETIZATION_ENABLED
            ? "Přehled vašeho balíčku a možnost navýšit limit publikací."
            : "Přehled vašeho bezplatného limitu publikací."}
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-gray-900">
            {quota.usedCount} / {quota.totalLimit} publikací využito
          </span>
          <span className="text-gray-500">
            {quota.remaining > 0
              ? `Můžete ještě publikovat ${quota.remaining}`
              : "Všechny kredity jsou využité"}
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
              quota.remaining === 0 ? "bg-amber-500" : "bg-emerald-600"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      <div
        className={
          showUpsell
            ? "grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2"
            : "border-t border-gray-100 pt-4"
        }
      >
        <CurrentPackageTile quota={quota} />
        {showUpsell ? (
          <UpsellPackageTile upsellPackage={upsellPackage} />
        ) : null}
      </div>

      {!MONETIZATION_ENABLED ? (
        <p className="text-xs text-gray-500">
          Podrobnosti k limitům viz{" "}
          <Link href="/balicky-inzerce" className="font-medium underline-offset-2 hover:underline">
            Limity inzerce
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}

function CurrentPackageTile({ quota }: { quota: ListingQuotaSnapshot }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
        Váš aktuální balíček
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-lg font-semibold text-gray-900">{quota.planLabel}</p>
        <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
          aktivní
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-800">
        Máte k dispozici{" "}
        <strong>{quota.totalLimit} publikací inzerátů</strong>
        {quota.planLabel === "Free" ? " zdarma" : ""}.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        {quota.remaining > 0
          ? `Zbývá ${quota.remaining} z ${quota.totalLimit} publikací.`
          : "Všechny publikace z balíčku jsou využité."}
      </p>
    </div>
  );
}

function UpsellPackageTile({
  upsellPackage,
}: {
  upsellPackage: ListingPackageCatalogItem;
}) {
  const priceLabel = formatPackagePrice(upsellPackage.priceCents);
  const contactHref = operatorContactHref("Dokoupení balíčku +20 inzerátů");
  const packageName = upsellPackage.displayName;
  const packageQuota = upsellPackage.listingQuota;

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Potřebujete víc?
      </p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{packageName}</p>
      <p className="mt-2 text-sm text-gray-700">
        Rozšiřte limit o dalších{" "}
        <strong>{packageQuota} publikací</strong>.
        {priceLabel ? (
          <>
            {" "}
            Cena balíčku: <strong>{priceLabel}</strong>.
          </>
        ) : null}
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Online platba bude brzy k dispozici.
      </p>
      <div className="mt-4">
        {contactHref ? (
          <Link
            href={contactHref}
            className="inline-flex rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Dokoupit kredit — kontaktujte nás
          </Link>
        ) : (
          <p className="text-sm text-gray-600">
            Pro dokoupení kreditu{" "}
            <Link href="/vop" className="font-medium underline-offset-2 hover:underline">
              kontaktujte provozovatele webu
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
