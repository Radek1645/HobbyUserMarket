import {
  getCategoryLabel,
  getSubcategoryLabel,
} from "@/config/categories";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { formatListingPrice } from "@/lib/posts/format-listing-price";
import { formatPublicListingLocation } from "@/lib/posts/format-public-location";
import { getListingPath } from "@/lib/posts/listing-path";
import type { PublicListingPreview } from "@/types/post";
import Image from "next/image";
import Link from "next/link";

type ListingCardProps = {
  listing: PublicListingPreview;
  /** Homepage — větší fotka, méně textu */
  imageFirst?: boolean;
  /** První karty na homepage — rychlejší LCP */
  priority?: boolean;
};

export function ListingCard({
  listing,
  imageFirst = false,
  priority = false,
}: ListingCardProps) {
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

  const createdLabel = new Date(listing.created_at).toLocaleDateString("cs-CZ");

  if (imageFirst) {
    return (
      <Link
        href={getListingPath(listing.slug)}
        {...gtmCtaProps(GTM_CTA.LISTING_CARD_OPEN, {
          category: listing.category_type,
          "listing-id": listing.id,
        })}
        className="group block overflow-hidden rounded-2xl border border-gray-200/80 bg-white transition hover:border-gray-300 hover:shadow-md"
      >
        <div className="relative aspect-[4/5] bg-gray-100">
          {listing.main_image_url ? (
            <Image
              src={listing.main_image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
              <span className="text-3xl font-light text-gray-300">◇</span>
              <span className="text-xs">Bez fotky</span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 pb-3 pt-10">
            <span className="inline-block max-w-full truncate rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm">
              {subcategory.label}
            </span>
            <h2 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-white">
              {listing.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/90">
              <span className="font-semibold text-white">{priceLabel}</span>
              {listing.distance_km != null ? (
                <span>{listing.distance_km} km</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 px-3 py-2 text-xs">
          <p className="min-w-0 flex-1 truncate text-gray-500">
            {formatPublicListingLocation(listing.location_text)}
            {eventLabel ? ` · ${eventLabel}` : ""}
          </p>
          <div className="shrink-0 text-right">
            <p className="text-gray-500">Vytvořeno</p>
            <p className="font-medium text-gray-900">{createdLabel}</p>
          </div>
        </div>
      </Link>
    );
  }

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
      <div className="relative flex aspect-[16/10] items-center justify-center bg-gray-100 text-gray-400">
        {listing.main_image_url ? (
          <Image
            src={listing.main_image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
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
        <div className="mt-1 flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm text-gray-600">
            {formatPublicListingLocation(listing.location_text)}
          </p>
          <div className="shrink-0 text-right text-xs">
            <p className="text-gray-500">Vytvořeno</p>
            <p className="font-medium text-gray-900">{createdLabel}</p>
          </div>
        </div>
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
