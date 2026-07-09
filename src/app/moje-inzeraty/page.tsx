import { getCategoryLabel, getSubcategoryLabel } from "@/config/categories";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { MyListingActions } from "@/components/listing/MyListingActions";
import { ListingBlockedNotice } from "@/components/listing/ListingBlockedNotice";
import { getCurrentUser } from "@/lib/auth/get-user";
import { archiveExpiredPosts } from "@/lib/posts/archive-expired";
import {
  getOwnerDisplayStatus,
  isListingExpired,
} from "@/lib/posts/listing-status";
import { createClient } from "@/lib/supabase/server";
import type { PostRow, PostStatus } from "@/types/post";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moje inzeráty | HobbyUserMarket",
};

const STATUS_BADGE: Record<
  PostStatus,
  { label: string; className: string } | null
> = {
  active: {
    label: "Aktivní",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  hidden: {
    label: "Pozastaveno",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  draft: {
    label: "Koncept",
    className: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  },
  archived: {
    label: "Expirovaný",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  blocked: {
    label: "Zablokováno",
    className: "bg-red-50 text-red-800 ring-red-300",
  },
  deleted: null,
};

// contact_phone se v přehledu nezobrazuje a je odebraný z veřejného SELECT (C2).
const MY_LISTING_COLUMNS =
  "id, user_id, title, description, category_type, subcategory_slug, " +
  "price_type, price_amount, exchange_for, condition_label, location_text, " +
  "status, status_reason_code, expires_at, listing_duration_days, event_date, renew_count, " +
  "payment_status, main_image_url, slug, show_contact_email, " +
  "show_contact_phone, created_at, updated_at";

async function getMyListings(userId: string): Promise<PostRow[]> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(MY_LISTING_COLUMNS)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();

  if (error || !data) return [];
  return data;
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const user = await getCurrentUser();
  const { deleteError } = await searchParams;

  if (!user) {
    redirect("/login?next=/moje-inzeraty");
  }

  if (user.needsNicknameSetup) {
    redirect("/onboarding?next=/moje-inzeraty");
  }

  await archiveExpiredPosts();
  const listings = await getMyListings(user.id);

  return (
    <div className="px-4 py-8 sm:px-6">
      <BackHomeLink />

      <h1 className="mt-4 text-2xl font-semibold text-gray-900">
        Správa inzerátů
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Vaše publikované inzeráty — upravte lokalitu, cenu nebo text.
      </p>

      {deleteError ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Inzerát se nepodařilo smazat. Zkuste to prosím znovu.
        </p>
      ) : null}

      {listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-gray-600">
            Zatím nemáte žádný inzerát.
          </p>
          <Link
            href="/inzerat/novy"
            {...gtmCtaProps(GTM_CTA.HEADER_CREATE_LISTING)}
            className="mt-4 inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Vytvořit první inzerát
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {listings.map((post) => {
            const subcategory = getSubcategoryLabel(
              post.category_type,
              post.subcategory_slug,
            );
            const expiresLabel = post.expires_at
              ? new Date(post.expires_at).toLocaleDateString("cs-CZ")
              : null;
            const displayStatus = getOwnerDisplayStatus(post.status, post.expires_at);
            const expired = isListingExpired(post.expires_at);

            return (
              <li
                key={post.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-xs text-gray-500">
                        {getCategoryLabel(post.category_type)} ·{" "}
                        {subcategory.label}
                      </p>
                      {STATUS_BADGE[displayStatus] ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[displayStatus]!.className}`}
                        >
                          {STATUS_BADGE[displayStatus]!.label}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-gray-900">
                      {post.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {post.location_text}
                      {expiresLabel
                        ? expired
                          ? ` · platnost vypršela ${expiresLabel}`
                          : ` · platí do ${expiresLabel}`
                        : ""}
                    </p>
                  </div>

                  <MyListingActions
                    postId={post.id}
                    slug={post.slug}
                    status={post.status}
                    expiresAt={post.expires_at}
                  />
                </div>

                {post.status === "blocked" ? (
                  <ListingBlockedNotice reasonCode={post.status_reason_code} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
