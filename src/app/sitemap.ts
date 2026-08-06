import { getSitemapListings } from "@/lib/seo/get-sitemap-listings";
import { getIndexedCategorySeoPaths } from "@/lib/seo/get-category-seo-page";
import { getSiteUrl } from "@/lib/supabase/env";
import type { MetadataRoute } from "next";

export const revalidate = 300;

const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: "/",
    changeFrequency: "hourly",
    priority: 1,
  },
  {
    url: "/co-je-zapikolou",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: "/jak-vytvorit-inzerat",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: "/kontakt",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: "/faq",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: "/vop",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: "/gdpr",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: "/balicky-inzerce",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: "/podminky-inzerce",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: "/marketingovy-souhlas",
    changeFrequency: "monthly",
    priority: 0.2,
  },
  {
    url: "/cookies",
    changeFrequency: "monthly",
    priority: 0.2,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [listings, categoryPages] = await Promise.all([
    getSitemapListings(),
    getIndexedCategorySeoPaths(),
  ]);

  const staticEntries = STATIC_PAGES.map((entry) => ({
    ...entry,
    url: new URL(entry.url, `${siteUrl}/`).toString(),
  }));

  const listingEntries: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${siteUrl}${listing.path}`,
    lastModified: listing.lastModified,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categoryPages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: page.lastModified,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...listingEntries];
}
