import {
  LISTING_TERMS_PATH,
  MODERATION_REJECTION_UI,
} from "@/config/moderation";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-medium text-gray-900">HUM</span> — lokální
          inzerce ve tvém okolí
        </p>
        <nav aria-label="Právní informace" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link
            href={LISTING_TERMS_PATH}
            className="font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
          >
            {MODERATION_REJECTION_UI.termsLinkLabel}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
