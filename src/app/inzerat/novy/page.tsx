import { CreateListingForm } from "@/components/listing/CreateListingForm";
import {
  GUEST_LISTING_DRAFT_ENABLED,
  GUEST_LISTING_RESUME_QUERY,
} from "@/config/guest-listing";
import {
  SUGGEST_FROM_PHOTOS_ENABLED,
  SUGGEST_FROM_PHOTOS_UI,
} from "@/config/suggest-from-photos";
import { getCurrentUser } from "@/lib/auth/get-user";
import {
  readGuestVisitorId,
  signGuestVisitorId,
} from "@/lib/guest/visitor-id-server";
import { isNewPublicationQuotaBlocked } from "@/lib/listings/quota-shared";
import { getUserListingQuota } from "@/lib/listings/quota";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Založit inzerát | HobbyUserMarket",
};

type NewListingPageProps = {
  searchParams: Promise<{ resume?: string }>;
};

export default async function NewListingPage({
  searchParams,
}: NewListingPageProps) {
  const user = await getCurrentUser();
  const query = await searchParams;
  const resumeGuestDraft = query[GUEST_LISTING_RESUME_QUERY] === "1";

  if (!user) {
    if (!GUEST_LISTING_DRAFT_ENABLED) {
      redirect("/login?next=/inzerat/novy&message=create_listing&tab=register");
    }

    // Cookie se smí založit jen ze Server Action — formulář si ji bootstrapne.
    const existingVisitorId = await readGuestVisitorId();
    let guestVisitorId: string | undefined;
    let guestVisitorToken: string | undefined;
    if (existingVisitorId) {
      guestVisitorId = existingVisitorId;
      guestVisitorToken = signGuestVisitorId(existingVisitorId);
    }

    return (
      <div className="px-4 py-8 sm:px-6">
        <CreateListingForm
          guestMode
          guestVisitorId={guestVisitorId}
          guestVisitorToken={guestVisitorToken}
          userEmail=""
          pageHeading={{
            title: "Založit inzerát",
            description:
              "Vyfoťte věc, napište pár slov — zbytek doplní AI. Účet založíte až při publikaci.",
          }}
        />
      </div>
    );
  }

  if (user.needsNicknameSetup) {
    const next = resumeGuestDraft
      ? `/inzerat/novy?${GUEST_LISTING_RESUME_QUERY}=1`
      : "/inzerat/novy";
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  const quota = await getUserListingQuota(user.id);
  const publishBlockedByQuota = isNewPublicationQuotaBlocked(quota);

  return (
    <div className="px-4 py-8 sm:px-6">
      <CreateListingForm
        userEmail={user.email ?? ""}
        publishBlockedByQuota={publishBlockedByQuota}
        resumeGuestDraft={resumeGuestDraft}
        pageHeading={{
          title: "Založit inzerát",
          description: SUGGEST_FROM_PHOTOS_ENABLED
            ? SUGGEST_FROM_PHOTOS_UI.pageHint
            : "Vyplňte kategorii a obsah. Platnost 30 dní (u akcí podle data konání).",
          afterDescription: publishBlockedByQuota ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Vyčerpali jste limit publikací.{" "}
              <Link href="/balicky-inzerce" className="font-medium underline">
                Balíčky inzerce
              </Link>
            </p>
          ) : null,
        }}
      />
    </div>
  );
}
