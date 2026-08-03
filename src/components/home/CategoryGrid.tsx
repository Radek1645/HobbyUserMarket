"use client";

import {
  isServicesBundleCategory,
  type CategoryGridTile,
} from "@/config/home-category-grid";
import type { HomeBrowseCategory } from "@/config/home-themes";
import {
  categoryGridTilePlainActiveClass,
  categoryGridTilePlainClass,
  homeCategoryGridTileActiveClass,
  homeCategoryGridTileClass,
  iconSmClass,
} from "@/config/ui-primitives";
import type { CategoryType } from "@/types/post";
import { useEffect, useState } from "react";

type CategoryGridProps = {
  tiles: CategoryGridTile[];
  selected: HomeBrowseCategory | CategoryType | null;
  onSelect: (id: HomeBrowseCategory | CategoryType) => void;
  /** Hero (poloprůhledné) vs. formulář (bílé). */
  variant?: "hero" | "plain";
  /** Popisek nad volbami v bundlu Služby/Práce/Reality. */
  bundlePrompt?: string;
  /** GTM attrs factory — volitelně na každou dlaždici. */
  tileProps?: (id: string) => Record<string, string | undefined>;
};

export function CategoryGrid({
  tiles,
  selected,
  onSelect,
  variant = "hero",
  bundlePrompt = "Co hledáte?",
  tileProps,
}: CategoryGridProps) {
  const bundleSelected = isServicesBundleCategory(selected);
  const [bundleOpen, setBundleOpen] = useState(bundleSelected);
  const bundleTile = tiles.find(
    (t): t is Extract<CategoryGridTile, { kind: "bundle" }> =>
      t.kind === "bundle",
  );

  useEffect(() => {
    if (bundleSelected) setBundleOpen(true);
  }, [bundleSelected]);

  const inactiveClass =
    variant === "hero" ? homeCategoryGridTileClass : categoryGridTilePlainClass;
  const activeClass =
    variant === "hero"
      ? homeCategoryGridTileActiveClass
      : categoryGridTilePlainActiveClass;

  const bundlePanelClass =
    variant === "hero"
      ? "rounded-xl border border-white/30 bg-white/70 p-2 backdrop-blur-sm"
      : "rounded-xl border border-gray-200 bg-gray-50 p-2";

  return (
    <div className={variant === "hero" ? "mt-6 space-y-3" : "space-y-3"}>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="list"
        aria-label="Kategorie"
      >
        {tiles.map((tile) => {
          if (tile.kind === "direct") {
            // Dokud je otevřený bundle bez vybraného člena, nechat aktivní jen bundle
            // (ne předchozí kategorii, ze které uživatel přišel).
            const isActive =
              selected === tile.id && !(bundleOpen && !bundleSelected);
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                type="button"
                role="listitem"
                {...(tileProps?.(tile.id) ?? {})}
                onClick={() => {
                  setBundleOpen(false);
                  onSelect(tile.id);
                }}
                aria-current={isActive ? "true" : undefined}
                className={isActive ? activeClass : inactiveClass}
              >
                <Icon className={`${iconSmClass} shrink-0`} aria-hidden="true" />
                <span className="min-w-0 leading-snug">{tile.label}</span>
              </button>
            );
          }

          const Icon = tile.icon;
          const isActive = bundleSelected || bundleOpen;
          return (
            <button
              key={tile.id}
              type="button"
              role="listitem"
              {...(tileProps?.(tile.id) ?? {})}
              onClick={() => {
                if (bundleSelected) {
                  setBundleOpen(true);
                  return;
                }
                setBundleOpen((open) => !open);
              }}
              aria-expanded={bundleOpen}
              aria-controls="category-services-bundle"
              className={isActive ? activeClass : inactiveClass}
            >
              <Icon className={`${iconSmClass} shrink-0`} aria-hidden="true" />
              <span className="min-w-0 leading-snug">{tile.label}</span>
            </button>
          );
        })}
      </div>

      {bundleOpen && bundleTile ? (
        <div
          id="category-services-bundle"
          className={bundlePanelClass}
          role="group"
          aria-label="Služby, práce nebo reality"
        >
          <p className="mb-2 px-1 text-xs font-medium text-slate-600">
            {bundlePrompt}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {bundleTile.members.map((member) => {
              const isActive = selected === member.id;
              const MemberIcon = member.icon;
              return (
                <button
                  key={member.id}
                  type="button"
                  {...(tileProps?.(member.id) ?? {})}
                  onClick={() => onSelect(member.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={isActive ? activeClass : inactiveClass}
                >
                  <MemberIcon
                    className={`${iconSmClass} shrink-0`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 leading-snug">{member.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
