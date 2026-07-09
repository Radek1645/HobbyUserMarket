import { getSitemapListings } from "@/lib/seo/get-sitemap-listings";
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
    url: "/vop",
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const listings = await getSitemapListings();

  const staticEntries = STATIC_PAGES.map((entry) => ({
    ...entry,
    url: new URL(entry.url, `${siteUrl}/`).toString(),
  }));

  const listingEntries: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${siteUrl}${listing.path}`,
    lastModified: listing.lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...listingEntries];
}
