import {
  getCategoryLabel,
  getSubcategoryLabel,
} from "@/config/categories";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { formatListingPrice } from "@/lib/posts/format-listing-price";
import { getListingPath } from "@/lib/posts/listing-path";
import type { PublicListingPreview } from "@/types/post";
import Link from "next/link";

type ListingCardProps = {
  listing: PublicListingPreview;
};

export function ListingCard({ listing }: ListingCardProps) {
  const categoryLabel = getCategoryLabel(listing.category_type);
  const subcategory = getSubcategoryLabel(
    listing.category_type,
    listing.subcategory_slug,
  );
  const priceLabel = formatListingPrice(
    listing.category_type,
    listing.price_type,
    listing.price_amount,
  );

  const eventLabel = listing.event_date
    ? new Date(listing.event_date).toLocaleString("cs-CZ", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const descriptionPreview =
    listing.description.length > 120
      ? `${listing.description.slice(0, 120).trim()}…`
      : listing.description;

  return (
    <Link
      href={getListingPath(listing.slug)}
      {...gtmCtaProps(GTM_CTA.LISTING_CARD_OPEN, {
        category: listing.category_type,
        "listing-id": listing.id,
      })}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex aspect-[16/10] items-center justify-center bg-gray-100 text-gray-400">
        {listing.main_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.main_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs">Bez fotky</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-gray-500">
          {categoryLabel} · {subcategory.label}
          {listing.distance_km != null ? ` · ${listing.distance_km} km` : ""}
        </p>
        <h2 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900 group-hover:underline">
          {listing.title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{listing.location_text}</p>
        {descriptionPreview ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {descriptionPreview}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-sm">
          <span className="font-medium text-gray-900">{priceLabel}</span>
          {eventLabel ? (
            <span className="text-gray-500">Konání {eventLabel}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
