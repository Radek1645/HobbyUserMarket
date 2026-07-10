import {
  AdminDeleteUserButton,
  type AdminUserRow,
} from "@/components/mod/AdminDeleteUserButton";
import { AdminGrantPackageButton } from "@/components/mod/AdminGrantPackageButton";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getListingQuotasForUsers } from "@/lib/listings/quota";
import { LISTING_QUOTA_FREE_DEFAULT } from "@/config/app";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Uživatelé | God Mode",
};

type ProfileRow = {
  id: string;
  profile_no: number;
  nickname: string;
  email: string | null;
  role: UserRole;
  created_at: string;
};

const QUOTA_BYPASS_ROLES: UserRole[] = ["admin", "moderator"];

const ERROR_MESSAGES: Record<string, string> = {
  missing_user: "Chybí identifikátor uživatele.",
  missing_reason: "Vyberte důvod smazání.",
  user_not_found: "Uživatel nebyl nalezen.",
  admin_protected: "Admin účty nelze smazat z tohoto panelu.",
  self_delete: "Vlastní účet smažte v nastavení profilu.",
};

async function loadAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, profile_no, nickname, email, role, created_at")
    .order("created_at", { ascending: false })
    .returns<ProfileRow[]>();

  if (error || !profiles) {
    return [];
  }

  const quotas = await getListingQuotasForUsers(profiles.map((profile) => profile.id));

  return profiles.map((profile) => ({
    id: profile.id,
    profileNo: profile.profile_no,
    nickname: profile.nickname,
    email: profile.email,
    role: profile.role,
    quota: quotas.get(profile.id) ?? null,
    createdAt: profile.created_at,
  }));
}

type ModUsersPageProps = {
  searchParams: Promise<{
    error?: string;
    deleted?: string;
    granted?: string;
    email_failed?: string;
  }>;
};

export default async function ModUsersPage({ searchParams }: ModUsersPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const { error, deleted, granted, email_failed } = await searchParams;
  const users = await loadAdminUsers();

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? decodeURIComponent(error))
    : undefined;

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink />

      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">Uživatelé</h1>
        <p className="mt-2 text-sm text-gray-600">
          Seznam účtů a smazání porušujících uživatelů.
        </p>

        {deleted === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Účet byl smazán.
            {email_failed === "1" ? (
              <span className="mt-1 block text-amber-900">
                Upozornění e-mailem se nepodařilo odeslat — zkontrolujte terminál
                dev serveru a Resend dashboard. V testovacím režimu Resend lze posílat
                jen na e-mail registrovaný u Resend účtu, nebo ověřte vlastní doménu
                na resend.com/domains.
              </span>
            ) : null}
          </p>
        ) : null}

        {granted === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Partnerský balíček byl přidělen.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Přezdívka</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Balíček</th>
                <th className="px-4 py-3 font-medium">Publikace</th>
                <th className="px-4 py-3 font-medium">Registrace</th>
                <th className="px-4 py-3 font-medium">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((row) => (
                <tr key={row.id} className="text-gray-800">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {row.profileNo}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.nickname}</td>
                  <td className="px-4 py-3 text-gray-600">{row.email ?? "—"}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">
                    <UserQuotaPlanCell row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <UserQuotaUsageCell row={row} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {row.id === user.id ? (
                        <LinkToSettings />
                      ) : (
                        <>
                          <AdminGrantPackageButton
                            userId={row.id}
                            profileNo={row.profileNo}
                            nickname={row.nickname}
                          />
                          <AdminDeleteUserButton user={row} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Žádní uživatelé.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LinkToSettings() {
  return (
    <a
      href="/profil/nastaveni"
      className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline"
    >
      váš účet → nastavení
    </a>
  );
}

function UserQuotaPlanCell({ row }: { row: AdminUserRow }) {
  if (QUOTA_BYPASS_ROLES.includes(row.role)) {
    return <span className="text-gray-500">bez limitu</span>;
  }

  if (!row.quota) {
    return <span className="text-gray-400">—</span>;
  }

  const boosted = row.quota.totalLimit > LISTING_QUOTA_FREE_DEFAULT;

  return (
    <div>
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-700">
        {row.quota.planLabel}
      </span>
      {boosted ? (
        <p className="mt-1 text-xs text-gray-500">limit {row.quota.totalLimit}</p>
      ) : null}
    </div>
  );
}

function UserQuotaUsageCell({ row }: { row: AdminUserRow }) {
  if (QUOTA_BYPASS_ROLES.includes(row.role)) {
    return <span className="text-gray-500">—</span>;
  }

  if (!row.quota) {
    return <span className="text-gray-400">—</span>;
  }

  const exhausted = row.quota.remaining === 0;

  return (
    <div>
      <span className={exhausted ? "font-medium text-amber-800" : "text-gray-900"}>
        {row.quota.usedCount} / {row.quota.totalLimit}
      </span>
      <p className="text-xs text-gray-500">
        {exhausted
          ? "limit vyčerpán"
          : `zbývá ${row.quota.remaining}`}
      </p>
    </div>
  );
}
