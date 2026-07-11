import type { PostStatus } from "@/types/post";

/** Konstanty pro sloupec posts.status — typ PostStatus v types/post.ts */
export const POST_STATUS = {
  draft: "draft",
  active: "active",
  archived: "archived",
  hidden: "hidden",
  blocked: "blocked",
  deleted: "deleted",
} as const satisfies Record<PostStatus, PostStatus>;

/** Konstanty pro sloupec comments.status */
export const COMMENT_STATUS = {
  active: "active",
  hidden: "hidden",
} as const;
