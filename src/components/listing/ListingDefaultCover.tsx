import { getListingDefaultCover } from "@/config/listing-default-covers";
import type { CategoryType } from "@/types/post";

type ListingDefaultCoverProps = {
  categoryType: CategoryType;
  subcategorySlug: string;
  /** Větší ikona na homepage kartách */
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
};

const ICON_SIZE = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

/**
 * Náhradní vizuál místo „Bez fotky“ — jemná ikona podle kategorie/podkategorie.
 */
export function ListingDefaultCover({
  categoryType,
  subcategorySlug,
  size = "md",
  className = "",
  showLabel = true,
}: ListingDefaultCoverProps) {
  const cover = getListingDefaultCover(categoryType, subcategorySlug);
  const Icon = cover.icon;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 ${cover.surfaceClass} ${className}`}
      aria-hidden="true"
    >
      <Icon className={`${ICON_SIZE[size]} stroke-[1.25] ${cover.iconClass}`} />
      {showLabel ? (
        <span className="text-[11px] font-medium tracking-wide text-gray-400/90">
          {cover.label}
        </span>
      ) : null}
    </div>
  );
}
