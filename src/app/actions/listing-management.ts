"use server";

import { LISTING_EXTEND_DAYS } from "@/config/listing-lifetime";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isListingQuotaExceededError } from "@/lib/listings/quota";
import { clampExpiresAtToLifetime } from "@/lib/posts/listing-lifetime";
import { getListingPath } from "@/lib/posts/listing-path";
import { isListingExpired } from "@/lib/posts/listing-status";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type OwnedPost = {
  id: number;
  slug: string;
  user_id: string;
  status: string;
  expires_at: string | null;
  renew_count: number;
  created_at: string;
};

async function getOwnedPost(postId: number): Promise<OwnedPost | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, user_id, status, expires_at, renew_count, created_at")
    .eq("id", postId)
    .maybeSingle<OwnedPost>();

  if (error || !data || data.user_id !== user.id) return null;
  return data;
}

function revalidateListingPaths(slug: string) {
  revalidatePath("/moje-inzeraty", "page");
  revalidatePath("/");
  revalidatePath(getListingPath(slug));
}

export async function deleteListing(formData: FormData): Promise<void> {
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId)) redirect("/moje-inzeraty");

  const post = await getOwnedPost(postId);
  if (!post || post.status === "deleted") redirect("/moje-inzeraty");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ status: "deleted" })
    .eq("id", postId)
    .eq("user_id", post.user_id)
    .select("id, status")
    .maybeSingle();

  if (error || !data || data.status !== "deleted") {
    console.error("deleteListing:", error, data);
    redirect("/moje-inzeraty?deleteError=1");
  }

  revalidateListingPaths(post.slug);
  redirect("/moje-inzeraty");
}

export async function pauseListing(formData: FormData): Promise<void> {
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId)) redirect("/moje-inzeraty");

  const post = await getOwnedPost(postId);
  if (
    !post ||
    post.status !== "active" ||
    isListingExpired(post.expires_at)
  ) {
    redirect("/moje-inzeraty");
  }

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
    if (isListingQuotaExceededError(error.message)) {
      redirect("/moje-inzeraty?quotaError=1");
    }
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

  const nowMs = Date.now();
  const currentExpiry = post.expires_at
    ? new Date(post.expires_at).getTime()
    : nowMs;
  const proposed = new Date(Math.max(currentExpiry, nowMs));
  proposed.setDate(proposed.getDate() + LISTING_EXTEND_DAYS);

  const clamped = clampExpiresAtToLifetime(
    post.created_at,
    proposed,
    new Date(nowMs),
  );

  if (!clamped || clamped.getTime() <= Math.max(currentExpiry, nowMs)) {
    redirect("/moje-inzeraty?lifetimeError=1");
  }

  const updates: Record<string, unknown> = {
    expires_at: clamped.toISOString(),
    renew_count: post.renew_count + 1,
  };

  if (post.status === "archived" || isListingExpired(post.expires_at)) {
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
    if (isListingQuotaExceededError(error.message)) {
      redirect("/moje-inzeraty?quotaError=1");
    }
    if (error.message?.includes("max lifetime")) {
      redirect("/moje-inzeraty?lifetimeError=1");
    }
    redirect("/moje-inzeraty");
  }

  revalidateListingPaths(post.slug);
  redirect("/moje-inzeraty");
}
