import {
  getCategoryLabel,
  getConditionLabel,
  getPriceTypeLabel,
  getSubcategoryLabel,
} from "@/config/categories";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { ListingContactSection } from "@/components/listing/ListingContactSection";
import { ListingDescription } from "@/components/listing/ListingDescription";
import { ListingImageGallery } from "@/components/listing/ListingImageGallery";
import { ReportListingButton } from "@/components/listing/ReportListingButton";
import { ModeratorListingBar } from "@/components/mod/ModeratorListingBar";
import { BackLink } from "@/components/navigation/BackLink";
import { ListingJsonLd } from "@/components/seo/ListingJsonLd";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { getListingIntentLabel } from "@/config/listing-intent";
import {
  getAdvertiserIcoDisplay,
  getAdvertiserPrimaryLabel,
  getAdvertiserPrimaryLabelTitle,
} from "@/lib/auth/advertiser-display";
import { getAdvertiserProfile } from "@/lib/auth/get-advertiser";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import { formatListingPrice } from "@/lib/posts/format-listing-price";
import { formatPublicListingLocation } from "@/lib/posts/format-public-location";
import { getListingImages } from "@/lib/posts/listing-images";
import { getListingEditPath, getListingPath } from "@/lib/posts/listing-path";
import { buildListingMetaTitle } from "@/lib/seo/build-listing-meta-title";
import { resolveListingMetaDescription } from "@/lib/seo/listing-meta-description";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ListingImagePreview, PostRow, PostStatusReasonCode } from "@/types/post";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  invalid_report_reason: "Vyberte platný důvod nahlášení.",
  report_target_unavailable: "Inzerát nelze nahlásit.",
  cannot_report_own_listing: "Vlastní inzerát nelze nahlásit.",
  already_reported: "Tento inzerát jste už nahlásili.",
  report_failed: "Nahlášení se nepodařilo odeslat.",
};

const MOD_ERROR_MESSAGES: Record<string, string> = {
  invalid_post: "Neplatný inzerát.",
  post_not_found: "Inzerát nebyl nalezen.",
  post_already_restricted: "Inzerát je už zablokovaný.",
  post_already_deleted: "Inzerát je už smazaný.",
  post_not_blocked: "Inzerát není ve stavu blocked.",
  block_failed: "Zablokování se nepodařilo.",
  delete_failed: "Smazání se nepodařilo.",
  restore_failed: "Obnovení se nepodařilo.",
};

function resolveSlugParam(param: string): string {
  const legacy = /^(\d+)-(.*)$/.exec(param);
  if (legacy) {
    permanentRedirect(`/inzerat/${legacy[2]}`);
  }
  return param;
}

// contact_phone se zde záměrně nečte — odhaluje se jen přes reveal RPC (C2).
const POST_DETAIL_COLUMNS =
  "id, user_id, title, description, description_ai_assisted, meta_description, image_alt, " +
  "category_type, subcategory_slug, " +
  "price_type, price_amount, exchange_for, condition_label, location_text, " +
  "status, status_reason_code, expires_at, event_date, main_image_url, slug, " +
  "show_contact_email, show_contact_phone, created_at, updated_at, job_cv_required";

async function getPostBySlug(slug: string): Promise<PostRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle<PostRow>();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: param } = await params;
  const slug = resolveSlugParam(param);

  const post = await getPostBySlug(slug);
  if (!post) return { title: `Inzerát | ${SITE_DISPLAY_NAME}` };

  const location = formatPublicListingLocation(post.location_text);
  const pageUrl = `${getSiteUrl()}${getListingPath(post.slug)}`;
  const description = resolveListingMetaDescription({
    metaDescription: post.meta_description,
    description: post.description,
    title: post.title,
    locality: location,
  });
  const documentTitle = buildListingMetaTitle(post.title, location);
  const imageAlt = post.image_alt?.trim() || post.title;

  return {
    title: documentTitle,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: documentTitle,
      description,
      url: pageUrl,
      siteName: SITE_DISPLAY_NAME,
      locale: "cs_CZ",
      type: "website",
      ...(post.main_image_url
        ? { images: [{ url: post.main_image_url, alt: imageAlt }] }
        : {}),
    },
  };
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { slug: param } = await params;
  const slug = resolveSlugParam(param);
  const query = await searchParams;

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === post.user_id;
  const isStaff = isStaffRole(currentUser?.role);

  if (post.status !== "active") {
    if (isOwner) {
      redirect("/moje-inzeraty");
    }
    if (!isStaff) {
      notFound();
    }
  }

  const advertiser = await getAdvertiserProfile(post.user_id);

  const supabase = await createClient();
  const imageRows = await getListingImages(supabase, post.id);
  const galleryImages: ListingImagePreview[] = imageRows.map((row) => ({
    id: row.id,
    url: row.url,
    isMain: row.is_main,
    sortOrder: row.sort_order,
  }));

  const categoryLabel = getCategoryLabel(post.category_type);
  const intentLabel = getListingIntentLabel(post.category_type);
  const subcategory = getSubcategoryLabel(
    post.category_type,
    post.subcategory_slug,
  );

  const expiresLabel = post.expires_at
    ? new Date(post.expires_at).toLocaleDateString("cs-CZ")
    : null;

  const createdLabel = new Date(post.created_at).toLocaleDateString("cs-CZ");

  const conditionText =
    post.category_type === "udalost" ||
    post.category_type === "nemovitost" ||
    post.category_type === "prace"
      ? getConditionLabel(post.category_type, post.condition_label)
      : null;

  const eventHeading =
    post.condition_label === "long_term" && post.category_type === "udalost"
      ? "Nejbližší termín"
      : "Konání";
  const eventLabel = post.event_date
    ? new Date(post.event_date).toLocaleString("cs-CZ", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const priceTypeLabel = getPriceTypeLabel(post.category_type, post.price_type);
  const isService = post.category_type === "sluzby";

  const priceAmountLabel =
    post.category_type === "prace"
      ? post.price_type === "negotiable"
        ? "Fixní odměna"
        : post.price_type === "fixed"
          ? "Hodinová mzda"
          : "Odměna"
      : isService
        ? post.price_type === "negotiable"
          ? "Orientační cena zakázky"
          : post.price_type === "fixed"
            ? "Hodinová sazba"
            : "Cena"
        : post.price_type === "negotiable"
          ? "Orientačně"
          : "Cena";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pageError = query.error
    ? (REPORT_ERROR_MESSAGES[query.error] ??
        MOD_ERROR_MESSAGES[query.error] ??
        decodeURIComponent(query.error))
    : undefined;
  const statusReasonCode = post.status_reason_code as
    | PostStatusReasonCode
    | null
    | undefined;

  const pageUrl = `${getSiteUrl()}${getListingPath(post.slug)}`;
  const jsonLdImageUrls = galleryImages.map((image) => image.url);
  if (jsonLdImageUrls.length === 0 && post.main_image_url) {
    jsonLdImageUrls.push(post.main_image_url);
  }

  return (
    <article className="px-4 py-8 sm:px-6">
      <ListingJsonLd
        input={{
          post,
          pageUrl,
          imageUrls: jsonLdImageUrls,
          subcategoryLabel: subcategory.label,
        }}
      />
      <BackLink
        href="/"
        label="Zpět"
        gtmId={GTM_CTA.DETAIL_BACK_HOME}
      />

      {isStaff && !isOwner ? (
        <div className="mt-4">
          <ModeratorListingBar
            postId={post.id}
            postSlug={post.slug}
            postTitle={post.title}
            status={post.status}
            statusReasonCode={statusReasonCode ?? null}
          />
        </div>
      ) : null}

      {query.reported === "1" ? (
        <p
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          Děkujeme. Prověříme to do 24 hodin a dáme vám vědět.
        </p>
      ) : null}

      {pageError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {pageError}
        </p>
      ) : null}

      {query.listing_blocked === "1" ||
      query.listing_deleted === "1" ||
      query.listing_restored === "1" ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {query.listing_restored === "1"
            ? "Inzerát byl obnoven."
            : query.listing_deleted === "1"
              ? "Inzerát byl smazán."
              : "Inzerát byl zablokován."}
        </p>
      ) : null}

      <header className="mt-4">
        <p className="text-sm text-gray-500">
          {intentLabel
            ? `${intentLabel} · ${categoryLabel} · ${subcategory.label}`
            : `${categoryLabel} · ${subcategory.label}`}
          {conditionText ? ` · ${conditionText}` : ""}
          {subcategory.isLegacy ? (
            <span className="text-gray-400"> (archivní kategorie)</span>
          ) : null}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
          {post.title}
        </h1>
      </header>

      {galleryImages.length > 0 ? (
        <div className="mt-6">
          <ListingImageGallery
            images={galleryImages}
            title={post.title}
            imageAlt={post.image_alt}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        {eventLabel ? (
          <p className="text-sm font-medium text-gray-900">
            {eventHeading}: {eventLabel}
          </p>
        ) : null}

        {post.description ? (
          <ListingDescription
            description={post.description}
            descriptionAiAssisted={post.description_ai_assisted === true}
          />
        ) : (
          <p className="text-gray-500 italic">Bez popisu.</p>
        )}

        <dl className="grid gap-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
          {advertiser ? (
            <>
              <div>
                <dt className="text-gray-500">
                  {getAdvertiserPrimaryLabelTitle(advertiser)}
                </dt>
                <dd className="font-medium text-gray-900">
                  {getAdvertiserPrimaryLabel(advertiser)}
                </dd>
              </div>
              {getAdvertiserIcoDisplay(advertiser) ? (
                <div>
                  <dt className="text-gray-500">IČO</dt>
                  <dd className="font-medium text-gray-900">
                    {getAdvertiserIcoDisplay(advertiser)}
                  </dd>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-gray-500">Lokalita</dt>
            <dd className="break-words font-medium text-gray-900">
              {formatPublicListingLocation(post.location_text)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Vytvořeno</dt>
            <dd className="font-medium text-gray-900">{createdLabel}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Typ ceny</dt>
            <dd className="font-medium text-gray-900">{priceTypeLabel}</dd>
          </div>
          {post.price_amount != null ? (
            <div>
              <dt className="text-gray-500">{priceAmountLabel}</dt>
              <dd className="font-medium text-gray-900">
                {formatListingPrice(
                  post.category_type,
                  post.price_type,
                  post.price_amount,
                  post.exchange_for,
                )}
              </dd>
            </div>
          ) : null}
          {post.price_type === "exchange" && post.exchange_for ? (
            <div>
              <dt className="text-gray-500">Ideálně za co</dt>
              <dd className="font-medium text-gray-900">{post.exchange_for}</dd>
            </div>
          ) : null}
          {expiresLabel ? (
            <div>
              <dt className="text-gray-500">Platí do</dt>
              <dd className="font-medium text-gray-900">{expiresLabel}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <section className="mt-6">
        {isOwner ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Toto je váš inzerát.</p>
            <p className="mt-1">
              Poptávky od zájemců vám přijdou na e-mail účtu, kterým jste se
              přihlásili. Pro test otevřete odkaz na inzerát v{" "}
              <strong>anonymním okně</strong> (nebo se odhlaste) a formulář
              vyplňte jako zájemce.
            </p>
            <Link
              href={getListingEditPath(post.slug)}
              {...gtmCtaProps(GTM_CTA.DETAIL_EDIT_LISTING, {
                listing_id: post.id,
              })}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Upravit inzerát
            </Link>
          </div>
        ) : post.status === "active" ? (
          <>
            <ListingContactSection
              postId={post.id}
              postSlug={post.slug}
              postTitle={post.title}
              categoryType={post.category_type}
              jobCvRequired={post.job_cv_required === true}
              showContactEmail={post.show_contact_email === true}
              showContactPhone={post.show_contact_phone === true}
              isLoggedIn={Boolean(user)}
            />
            <div className="mt-4 text-center">
              <ReportListingButton
                postId={post.id}
                postSlug={post.slug}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
            Inzerát není veřejně viditelný. Kontakt a poptávka nejsou k
            dispozici.
          </p>
        )}
      </section>
    </article>
  );
}
