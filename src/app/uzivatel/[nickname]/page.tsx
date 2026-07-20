import { AdvertiserBadges } from "@/components/listing/AdvertiserBadges";
import { ListingCard } from "@/components/listing/ListingCard";
import { BackLink } from "@/components/navigation/BackLink";
import { HOME_LISTINGS_LIMIT } from "@/config/app";
import { SITE_DISPLAY_NAME } from "@/config/site";
import {
  getAdvertiserIcoDisplay,
  getAdvertiserPrimaryLabel,
} from "@/lib/auth/advertiser-display";
import { getAdvertiserPublicByNickname } from "@/lib/auth/get-advertiser";
import { normalizeNickname } from "@/lib/auth/nickname";
import { fetchAdvertiserListings } from "@/lib/posts/get-advertiser-listings";
import { getAdvertiserListingsPath } from "@/lib/posts/listing-path";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ stranka?: string }>;
};

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function resolveNicknameParam(param: string): string {
  try {
    return normalizeNickname(decodeURIComponent(param));
  } catch {
    return normalizeNickname(param);
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { nickname: raw } = await params;
  const nickname = resolveNicknameParam(raw);
  const profile = await getAdvertiserPublicByNickname(nickname);

  if (!profile) {
    return { title: `Zadavatel | ${SITE_DISPLAY_NAME}` };
  }

  const displayName = getAdvertiserPrimaryLabel(profile);
  const title = `${displayName} — inzeráty | ${SITE_DISPLAY_NAME}`;
  const pageUrl = `${getSiteUrl()}${getAdvertiserListingsPath(profile.nickname)}`;

  return {
    title,
    description: `Aktivní inzeráty zadavatele ${displayName} na ${SITE_DISPLAY_NAME}.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      url: pageUrl,
      siteName: SITE_DISPLAY_NAME,
      locale: "cs_CZ",
      type: "website",
    },
  };
}

export default async function AdvertiserListingsPage({
  params,
  searchParams,
}: PageProps) {
  const { nickname: raw } = await params;
  const nickname = resolveNicknameParam(raw);
  const query = await searchParams;
  const page = parsePage(query.stranka);

  const profile = await getAdvertiserPublicByNickname(nickname);
  if (!profile) notFound();

  const displayName = getAdvertiserPrimaryLabel(profile);
  const icoDisplay = getAdvertiserIcoDisplay(profile);
  const totalActive = profile.active_listing_count;
  const totalPages = Math.max(1, Math.ceil(totalActive / HOME_LISTINGS_LIMIT));
  const safePage = Math.min(page, totalPages);
  const pageListings = await fetchAdvertiserListings(
    profile.nickname,
    safePage,
  );

  const basePath = getAdvertiserListingsPath(profile.nickname);
  const prevHref =
    safePage > 1
      ? safePage === 2
        ? basePath
        : `${basePath}?stranka=${safePage - 1}`
      : null;
  const nextHref =
    safePage < totalPages ? `${basePath}?stranka=${safePage + 1}` : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <BackLink href="/" label="Zpět na přehled" />

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          {displayName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalActive === 0
            ? "Žádné aktivní inzeráty"
            : totalActive === 1
              ? "1 aktivní inzerát"
              : totalActive < 5
                ? `${totalActive} aktivní inzeráty`
                : `${totalActive} aktivních inzerátů`}
          {icoDisplay ? ` · IČO ${icoDisplay}` : null}
        </p>
        <AdvertiserBadges
          isCompany={profile.is_company}
          lifetimePublishedCount={profile.lifetime_published_count}
        />
      </header>

      {pageListings.length > 0 ? (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {pageListings.map((listing, index) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  imageFirst
                  priority={index < 3}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav
              className="mt-6 flex items-center justify-center gap-4 text-sm"
              aria-label="Stránkování inzerátů"
            >
              {prevHref ? (
                <Link
                  href={prevHref}
                  className="font-medium text-gray-900 underline-offset-2 hover:underline"
                >
                  ← Předchozí
                </Link>
              ) : (
                <span className="text-gray-400">← Předchozí</span>
              )}
              <span className="text-gray-500">
                Stránka {safePage} z {totalPages}
              </span>
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="font-medium text-gray-900 underline-offset-2 hover:underline"
                >
                  Další →
                </Link>
              ) : (
                <span className="text-gray-400">Další →</span>
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
          Tento zadavatel momentálně nemá žádné veřejné inzeráty.
        </p>
      )}
    </div>
  );
}
