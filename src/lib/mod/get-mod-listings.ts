import { COMMENT_STATUS, POST_STATUS } from "@/config/post-status";
import { createClient } from "@/lib/supabase/server";
import type { PostStatusReasonCode } from "@/types/post";

export type ModListingSummary = {
  id: number;
  title: string;
  slug: string;
  status: string;
  statusReasonCode: PostStatusReasonCode | null;
  createdAt: string;
  updatedAt: string;
  reportCount: number;
};

export type ModHiddenComment = {
  id: string;
  postId: number;
  postTitle: string;
  postSlug: string;
  authorNickname: string;
  bodyPreview: string;
  createdAt: string;
};

async function loadReportCounts(
  postIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (postIds.length === 0) return counts;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("target_post_id, reporter_user_id")
    .eq("target_type", "post")
    .in("target_post_id", postIds)
    .not("reporter_user_id", "is", null);

  const grouped = new Map<number, Set<string>>();

  for (const row of data ?? []) {
    if (row.target_post_id == null || !row.reporter_user_id) continue;
    const set =
      grouped.get(row.target_post_id) ?? new Set<string>();
    set.add(row.reporter_user_id);
    grouped.set(row.target_post_id, set);
  }

  for (const [postId, reporters] of grouped) {
    counts.set(postId, reporters.size);
  }

  return counts;
}

export async function loadBlockedListings(): Promise<ModListingSummary[]> {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, status, status_reason_code, created_at, updated_at")
    .eq("status", POST_STATUS.blocked)
    .order("updated_at", { ascending: false })
    .returns<
      Array<{
        id: number;
        title: string;
        slug: string;
        status: string;
        status_reason_code: PostStatusReasonCode | null;
        created_at: string;
        updated_at: string;
      }>
    >();

  if (error || !posts) return [];

  const reportCounts = await loadReportCounts(posts.map((post) => post.id));

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    statusReasonCode: post.status_reason_code,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    reportCount: reportCounts.get(post.id) ?? 0,
  }));
}

export async function loadModListings(params: {
  status?: string | null;
  limit?: number;
}): Promise<ModListingSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id, title, slug, status, status_reason_code, created_at, updated_at")
    .neq("status", POST_STATUS.draft)
    .order("updated_at", { ascending: false })
    .limit(params.limit ?? 100);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: posts, error } = await query.returns<
    Array<{
      id: number;
      title: string;
      slug: string;
      status: string;
      status_reason_code: PostStatusReasonCode | null;
      created_at: string;
      updated_at: string;
    }>
  >();

  if (error || !posts) return [];

  const reportCounts = await loadReportCounts(posts.map((post) => post.id));

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    statusReasonCode: post.status_reason_code,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    reportCount: reportCounts.get(post.id) ?? 0,
  }));
}

export async function loadHiddenComments(): Promise<ModHiddenComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, post_id, author_nickname, body, created_at, posts!inner(title, slug)",
    )
    .eq("status", COMMENT_STATUS.hidden)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => {
    const post = Array.isArray(row.posts) ? row.posts[0] : row.posts;
    return {
      id: row.id as string,
      postId: row.post_id as number,
      postTitle: (post?.title as string) ?? "—",
      postSlug: (post?.slug as string) ?? "",
      authorNickname: row.author_nickname as string,
      bodyPreview: String(row.body).slice(0, 120),
      createdAt: row.created_at as string,
    };
  });
}
