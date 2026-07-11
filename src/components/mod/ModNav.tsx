import { isStaffRole } from "@/lib/auth/is-staff-role";
import type { UserRole } from "@/types/auth";
import Link from "next/link";

type ModNavProps = {
  role: UserRole;
  current: "karantena" | "inzeraty" | "uzivatele";
};

const linkClass = (active: boolean) =>
  active
    ? "rounded-lg bg-amber-100 px-3 py-1.5 font-medium text-amber-950"
    : "rounded-lg px-3 py-1.5 text-amber-900/80 transition hover:bg-amber-100/70 hover:text-amber-950";

export function ModNav({ role, current }: ModNavProps) {
  if (!isStaffRole(role)) return null;

  return (
    <nav
      aria-label="Moderace"
      className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 py-3 text-sm"
    >
      <Link href="/mod/karantena" className={linkClass(current === "karantena")}>
        Karanténa
      </Link>
      <Link href="/mod/inzeraty" className={linkClass(current === "inzeraty")}>
        Všechny inzeráty
      </Link>
      {role === "admin" ? (
        <Link
          href="/mod/uzivatele"
          className={linkClass(current === "uzivatele")}
        >
          Uživatelé
        </Link>
      ) : null}
    </nav>
  );
}
