"use client";

import type { AppUser } from "@/types/auth";
import { createContext, useContext } from "react";

const UserContext = createContext<AppUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AppUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): AppUser | null {
  return useContext(UserContext);
}
