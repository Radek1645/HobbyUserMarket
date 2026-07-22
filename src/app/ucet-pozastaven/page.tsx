import { signOut } from "@/app/actions/auth";
import { ACCOUNT_SUSPENDED_UI } from "@/config/moderation";
import {
  SITE_DISPLAY_NAME,
  SITE_OPERATOR_CONTACT_EMAIL,
} from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Účet pozastaven | ${SITE_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
};

export default function AccountSuspendedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">
        {ACCOUNT_SUSPENDED_UI.title}
      </h1>
      <p className="mt-4 text-base text-gray-700">{ACCOUNT_SUSPENDED_UI.body}</p>
      <p className="mt-4 text-base text-gray-700">
        {ACCOUNT_SUSPENDED_UI.contactPrefix}{" "}
        <a
          href={`mailto:${SITE_OPERATOR_CONTACT_EMAIL}`}
          className="font-medium text-gray-900 underline-offset-2 hover:underline"
        >
          {SITE_OPERATOR_CONTACT_EMAIL}
        </a>
        .
      </p>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
        >
          {ACCOUNT_SUSPENDED_UI.signOutLabel}
        </button>
      </form>
    </main>
  );
}
