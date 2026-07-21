"use client";

import { ModNav } from "@/components/mod/ModNav";
import type { UserRole } from "@/types/auth";
import { usePathname } from "next/navigation";

type ModNavShellProps = {
  role: UserRole;
};

export function ModNavShell({ role }: ModNavShellProps) {
  const pathname = usePathname();

  const current =
    pathname.startsWith("/mod/uzivatele")
      ? "uzivatele"
      : pathname.startsWith("/mod/blacklist")
        ? "blacklist"
        : pathname.startsWith("/mod/inzeraty")
          ? "inzeraty"
          : "karantena";

  return <ModNav role={role} current={current} />;
}
