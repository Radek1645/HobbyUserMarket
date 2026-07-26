/** Typy systémového auditu — sync s migrací 059 / PRD §11.1 A. */

export const AUDIT_ENTITY_TYPE = {
  post: "post",
  profile: "profile",
} as const;

export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPE)[keyof typeof AUDIT_ENTITY_TYPE];

export const AUDIT_EVENT_TYPE = {
  postCreated: "post_created",
  postPublished: "post_published",
  postHidden: "post_hidden",
  postBlocked: "post_blocked",
  postAutoBlockedReports: "post_auto_blocked_reports",
  postExpired: "post_expired",
  postRenewed: "post_renewed",
  postRestored: "post_restored",
  postRevertedToDraft: "post_reverted_to_draft",
  postDeletedByOwner: "post_deleted_by_owner",
  postDeletedByMod: "post_deleted_by_mod",
  postStatusChanged: "post_status_changed",
  postReported: "post_reported",
} as const;

export type AuditEventType =
  (typeof AUDIT_EVENT_TYPE)[keyof typeof AUDIT_EVENT_TYPE];

export const AUDIT_ACTOR_ROLE = {
  owner: "owner",
  moderator: "moderator",
  admin: "admin",
  system: "system",
  user: "user",
} as const;
