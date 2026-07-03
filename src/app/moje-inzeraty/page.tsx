import { getCategoryLabel, getSubcategoryLabel } from "@/config/categories";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { MyListingActions } from "@/components/listing/MyListingActions";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { PostRow, PostStatus } from "@/types/post";
import type { Metadata } from "next";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Moje inzeráty | HobbyUserMarket",
};

const STATUS_LABELS: Record<PostStatus, string> = {
  active: "Aktivní",
  archived: "Expirovaný",
  hidden: "Pozastavený",
  draft: "Koncept",
  deleted: "Smazaný",
};

async function getMyListings(userId: string): Promise<PostRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PostRow[];
}

export default async function MyListingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/moje-inzeraty");
  }

  if (user.needsNicknameSetup) {
    redirect("/onboarding?next=/moje-inzeraty");
  }

  const listings = await getMyListings(user.id);

  return (
    <div className="px-4 py-8 sm:px-6">
      <BackHomeLink />

      <h1 className="mt-4 text-2xl font-semibold text-gray-900">
        Správa inzerátů
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Tvoje publikované inzeráty — uprav lokalitu, cenu nebo text.
      </p>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-gray-600">
            Zatím nemáš žádný inzerát.
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

            return (
              <li
                key={post.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">
                      {getCategoryLabel(post.category_type)} ·{" "}
                      {subcategory.label}
                      <span className="text-gray-400"> · </span>
                      {STATUS_LABELS[post.status]}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-gray-900">
                      {post.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {post.location_text}
                      {expiresLabel ? ` · platí do ${expiresLabel}` : ""}
                    </p>
                  </div>

                  <MyListingActions
                    postId={post.id}
                    slug={post.slug}
                    status={post.status}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
