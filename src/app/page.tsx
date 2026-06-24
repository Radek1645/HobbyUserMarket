import { getCurrentUser } from "@/lib/auth/get-user";
import Link from "next/link";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          HobbyUserMarket
        </h1>
        <p className="mt-3 max-w-xl text-gray-600">
          Lokální tržiště pro hobby uživatele — najdi potraviny, služby a řemeslo
          ve svém okolí.
        </p>

        {user ? (
          <p className="mt-6 text-sm text-gray-600">
            Přihlášen jako{" "}
            <span className="font-medium text-gray-900">
              {user.fullName ?? user.email}
            </span>
            . Profil je synchronizovaný v databázi.
          </p>
        ) : (
          <p className="mt-6 text-sm text-gray-600">
            Pro vytváření inzerátů se{" "}
            <Link
              href="/login"
              className="font-medium text-gray-900 underline-offset-2 hover:underline"
            >
              přihlas přes Google
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
