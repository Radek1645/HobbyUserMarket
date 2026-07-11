export type UserRole = "user" | "moderator" | "admin";

export type AppUser = {
  id: string;
  email: string;
  nickname: string;
  name: string | null;
  surname: string | null;
  avatarUrl: string | null;
  role: UserRole;
  displayName: string;
  needsNicknameSetup: boolean;
  isCompany: boolean;
  companyName: string | null;
};
