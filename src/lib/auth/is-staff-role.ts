import type { UserRole } from "@/types/auth";

export function isStaffRole(role: UserRole | undefined | null): boolean {
  return role === "moderator" || role === "admin";
}
