"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { getListingPath } from "@/lib/posts/listing-path";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EXTEND_DAYS = 30;

type OwnedPost = {
  id: number;
  slug: string;
  user_id: string;
  status: string;
  expires_at: string | null;
  renew_count: number;
};

async function getOwnedPost(postId: number): Promise<OwnedPost | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, user_id, status, expires_at, renew_count")
    .eq("id", postId)
    .maybeSingle<OwnedPost>();

  if (error || !data || data.user_id !== user.id) return null;
  return data;
}

function revalidateListingPaths(slug: string) {
  revalidatePath("/moje-inzeraty");
  revalidatePath("/");
  revalidatePath(getListingPath(slug));
}

export async function deleteListing(formData: FormData): Promise<void> {
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId)) redirect("/moje-inzeraty");

  const post = await getOwnedPost(postId);
  if (!post || post.status === "deleted") redirect("/moje-inzeraty");

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: "deleted" })
    .eq("id", postId)
    .eq("user_id", post.user_id);

  if (error) {
    console.error("deleteListing:", error);
    redirect("/moje-inzeraty");
  }

  revalidateListingPaths(post.slug);
  redirect("/moje-inzeraty");
}

export async function pauseListing(formData: FormData): Promise<void> {
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId)) redirect("/moje-inzeraty");

  const post = await getOwnedPost(postId);
  if (!post || post.status !== "active") redirect("/moje-inzeraty");

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: "hidden" })
    .eq("id", postId)
    .eq("user_id", post.user_id);

  if (error) {
    console.error("pauseListing:", error);
    redirect("/moje-inzeraty");
  }

  revalidateListingPaths(post.slug);
  redirect("/moje-inzeraty");
}

export async function publishListing(formData: FormData): Promise<void> {
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId)) redirect("/moje-inzeraty");

  const post = await getOwnedPost(postId);
  if (!post || post.status !== "hidden") redirect("/moje-inzeraty");

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: "active" })
    .eq("id", postId)
    .eq("user_id", post.user_id);

  if (error) {
    console.error("publishListing:", error);
    redirect("/moje-inzeraty");
  }

  revalidateListingPaths(post.slug);
  redirect("/moje-inzeraty");
}

export async function extendListingBy30Days(formData: FormData): Promise<void> {
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId)) redirect("/moje-inzeraty");

  const post = await getOwnedPost(postId);
  if (
    !post ||
    post.status === "deleted" ||
    post.status === "draft"
  ) {
    redirect("/moje-inzeraty");
  }

  const now = Date.now();
  const currentExpiry = post.expires_at
    ? new Date(post.expires_at).getTime()
    : now;
  const base = new Date(Math.max(currentExpiry, now));
  base.setDate(base.getDate() + EXTEND_DAYS);

  const updates: Record<string, unknown> = {
    expires_at: base.toISOString(),
    renew_count: post.renew_count + 1,
  };

  if (post.status === "archived") {
    updates.status = "active";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("user_id", post.user_id);

  if (error) {
    console.error("extendListingBy30Days:", error);
    redirect("/moje-inzeraty");
  }

  revalidateListingPaths(post.slug);
  redirect("/moje-inzeraty");
}
