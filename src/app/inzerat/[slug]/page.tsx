import {
  getCategoryLabel,
  getConditionLabel,
  getPriceTypeLabel,
  getSubcategoryLabel,
} from "@/config/categories";
import { ListingInquiryForm } from "@/components/listing/ListingInquiryForm";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  getAdvertiserIcoDisplay,
  getAdvertiserPrimaryLabel,
  getAdvertiserPrimaryLabelTitle,
} from "@/lib/auth/advertiser-display";
import { getAdvertiserProfile } from "@/lib/auth/get-advertiser";
import { getListingEditPath } from "@/lib/posts/listing-path";
import { createClient } from "@/lib/supabase/server";
import type { PostRow } from "@/types/post";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function resolveSlugParam(param: string): string {
  const legacy = /^(\d+)-(.*)$/.exec(param);
  if (legacy) {
    permanentRedirect(`/inzerat/${legacy[2]}`);
  }
  return param;
}

async function getPostBySlug(slug: string): Promise<PostRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
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
  if (!post) return { title: "Inzerát | HobbyUserMarket" };

  return {
    title: `${post.title} | ${post.location_text} | HobbyUserMarket`,
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug: param } = await params;
  const slug = resolveSlugParam(param);

  const post = await getPostBySlug(slug);
  if (!post || post.status !== "active") notFound();

  const advertiser = await getAdvertiserProfile(post.user_id);

  const categoryLabel = getCategoryLabel(post.category_type);
  const subcategory = getSubcategoryLabel(
    post.category_type,
    post.subcategory_slug,
  );

  const expiresLabel = post.expires_at
    ? new Date(post.expires_at).toLocaleDateString("cs-CZ")
    : null;

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

  const priceAmountLabel =
    post.category_type === "prace"
      ? post.price_type === "negotiable"
        ? "Orientační odměna"
        : "Odměna"
      : post.price_type === "negotiable"
        ? "Orientačně"
        : "Cena";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === post.user_id;

  return (
    <article className="px-4 py-8 sm:px-6">
      <Link
        href="/"
        {...gtmCtaProps(GTM_CTA.DETAIL_BACK_HOME)}
        className="text-sm text-gray-500 hover:text-gray-800"
      >
        ← Zpět
      </Link>

      <header className="mt-4">
        <p className="text-sm text-gray-500">
          {categoryLabel} · {subcategory.label}
          {conditionText ? ` · ${conditionText}` : ""}
          {subcategory.isLegacy ? (
            <span className="text-gray-400"> (archivní kategorie)</span>
          ) : null}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
          {post.title}
        </h1>
      </header>

      <div className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        {eventLabel ? (
          <p className="text-sm font-medium text-gray-900">
            {eventHeading}: {eventLabel}
          </p>
        ) : null}

        {post.description ? (
          <p className="whitespace-pre-wrap text-gray-800">{post.description}</p>
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
              {advertiser.is_company ? (
                <div>
                  <dt className="text-gray-500">Kontaktní přezdívka</dt>
                  <dd className="font-medium text-gray-900">
                    {advertiser.nickname}
                  </dd>
                </div>
              ) : null}
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
          <div>
            <dt className="text-gray-500">Lokalita</dt>
            <dd className="font-medium text-gray-900">{post.location_text}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Typ ceny</dt>
            <dd className="font-medium text-gray-900">{priceTypeLabel}</dd>
          </div>
          {post.price_amount != null ? (
            <div>
              <dt className="text-gray-500">{priceAmountLabel}</dt>
              <dd className="font-medium text-gray-900">
                {post.price_type === "negotiable"
                  ? `cca ${post.price_amount} Kč (dohodou)`
                  : `${post.price_amount} Kč`}
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
            <p className="font-medium text-gray-900">Toto je tvůj inzerát.</p>
            <p className="mt-1">
              Poptávky od zájemců ti přijdou na e-mail účtu, kterým jsi se
              přihlásil. Pro test otevři odkaz na inzerát v{" "}
              <strong>anonymním okně</strong> (nebo se odhlaš) a formulář
              vyplň jako zájemce.
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
        ) : (
          <ListingInquiryForm
            postId={post.id}
            postTitle={post.title}
            categoryType={post.category_type}
          />
        )}
      </section>
    </article>
  );
}
