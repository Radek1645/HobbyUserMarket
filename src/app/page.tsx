import { HomeBrowse } from "@/components/home/HomeBrowse";
import { parseHomeBrowseCategory } from "@/config/home-themes";
import { fetchHomeRecentListings } from "@/lib/posts/get-home-listings";
import { isSearchQueryValid, normalizeSearchQuery } from "@/lib/posts/search-query";

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

  return (
    <HomeBrowse
      initialListings={initialListings?.listings ?? null}
      initialListingsCategory={initialListings?.category ?? null}
    />
  );
}
