import { HomeBrowse } from "@/components/home/HomeBrowse";
import { parseHomeBrowseCategory } from "@/config/home-themes";
import {
  SITE_DESCRIPTION,
  SITE_DISPLAY_NAME,
  SITE_SEO_TITLE,
} from "@/config/site";
import { fetchHomeRecentListings } from "@/lib/posts/get-home-listings";
import { isSearchQueryValid, normalizeSearchQuery } from "@/lib/posts/search-query";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SITE_SEO_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_SEO_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_DISPLAY_NAME,
  },
};

function buildHomeWebSiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_DISPLAY_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    inLanguage: "cs-CZ",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

type HomePageProps = {
  searchParams: Promise<{ kategorie?: string; q?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = parseHomeBrowseCategory(params.kategorie ?? null);
  const searchQuery = normalizeSearchQuery(params.q ?? "");

  const initialListings =
    searchQuery && isSearchQueryValid(searchQuery)
      ? null
      : await fetchHomeRecentListings(category);

  const webSiteJsonLd = buildHomeWebSiteJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <HomeBrowse
        initialListings={initialListings?.listings ?? null}
        initialListingsCategory={initialListings?.category ?? null}
      />
    </>
  );
}
