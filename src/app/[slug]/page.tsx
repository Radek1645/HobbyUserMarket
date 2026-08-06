import {
  getCategorySeoPath,
  getGoodsCategoryTypeForSeoSlug,
  getGoodsSubcategoryLabelForSeoSlug,
  isCategorySeoLandingSlug,
  CATEGORY_SEO_WAVE1_PRIORITY_SLUGS,
} from "@/config/category-seo";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { ListingCard } from "@/components/listing/ListingCard";
import { fetchCategorySeoListings } from "@/lib/seo/fetch-category-seo-listings";
import { getCategorySeoPage } from "@/lib/seo/get-category-seo-page";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type CategoryLandingPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CATEGORY_SEO_WAVE1_PRIORITY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CategoryLandingPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isCategorySeoLandingSlug(slug)) {
    return { title: SITE_DISPLAY_NAME };
  }

  const page = await getCategorySeoPage(slug);
  const label = getGoodsSubcategoryLabelForSeoSlug(slug) ?? slug;
  const title = page?.meta_title ?? `${label} | ${SITE_DISPLAY_NAME}`;
  const description =
    page?.meta_description ??
    `Inzeráty kategorie ${label} na ${SITE_DISPLAY_NAME}.`;
  const path = getCategorySeoPath(slug);
  const allowIndex = page?.index_status === "index";

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: "cs_CZ",
      siteName: SITE_DISPLAY_NAME,
    },
  };
}

export default async function CategorySeoLandingPage({
  params,
}: CategoryLandingPageProps) {
  const { slug } = await params;

  if (!isCategorySeoLandingSlug(slug)) {
    notFound();
  }

  const page = await getCategorySeoPage(slug);
  if (!page) {
    // Migrace 072 ještě není na DB — radši 404 než prázdná stránka bez SEO řádku.
    notFound();
  }

  const label = getGoodsSubcategoryLabelForSeoSlug(slug) ?? slug;
  const categoryType = getGoodsCategoryTypeForSeoSlug(slug);
  const listings = await fetchCategorySeoListings(slug);
  const siteUrl = getSiteUrl();
  const path = getCategorySeoPath(slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Domů",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `${siteUrl}${path}`,
      },
    ],
  };

  const homeFilterHref = categoryType
    ? `/?kategorie=${encodeURIComponent(categoryType)}`
    : "/";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="Drobečková navigace" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-800">
          Domů
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-zinc-800">{label}</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {label}
        </h1>
        {page.description ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
            {page.description}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-zinc-500">
          {listings.length === 0
            ? "Zatím žádné aktivní inzeráty v této kategorii."
            : `${listings.length} ${listings.length === 1 ? "inzerát" : listings.length < 5 ? "inzeráty" : "inzerátů"}`}
          {" · "}
          <Link
            href={homeFilterHref}
            className="font-medium text-zinc-800 underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-700"
          >
            Zobrazit na homepage
          </Link>
        </p>
      </header>

      {listings.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {listings.map((listing, index) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                imageFirst
                priority={index < 3}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
          Vraťte se na{" "}
          <Link href="/" className="font-medium text-emerald-700 underline">
            homepage
          </Link>{" "}
          nebo vytvořte nový inzerát.
        </p>
      )}
    </main>
  );
}
