"use client";

import { ListingContactReveal } from "@/components/listing/ListingContactReveal";
import { ListingInquiryForm } from "@/components/listing/ListingInquiryForm";
import { getInquiryCtaLabel } from "@/lib/inquiry/labels";
import { listingInquiryCtaButtonClass } from "@/config/listing-form-ui";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import type { CategoryType } from "@/types/post";
import { useState } from "react";

type ListingContactSectionProps = {
  postId: number;
  postSlug: string;
  postTitle: string;
  categoryType: CategoryType;
  jobCvRequired?: boolean;
  showContactEmail: boolean;
  showContactPhone: boolean;
  isLoggedIn: boolean;
};

export function ListingContactSection({
  postId,
  postSlug,
  postTitle,
  categoryType,
  jobCvRequired = false,
  showContactEmail,
  showContactPhone,
  isLoggedIn,
}: ListingContactSectionProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);

  const hasDirectContact = showContactEmail || showContactPhone;
  const inquiryLabel = getInquiryCtaLabel(categoryType);
  const loginHref = `/login?next=${encodeURIComponent(`/inzerat/${postSlug}`)}&tab=register`;

  const showInquiryInStack = hasDirectContact && !contactRevealed && !inquiryOpen;

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      {hasDirectContact ? (
        <>
          <ListingContactReveal
            embedded
            postId={postId}
            showEmail={showContactEmail}
            showPhone={showContactPhone}
            loginHref={loginHref}
            isLoggedIn={isLoggedIn}
            onRevealed={() => setContactRevealed(true)}
            secondaryAction={
              showInquiryInStack
                ? {
                    label: inquiryLabel,
                    onClick: () => setInquiryOpen(true),
                    gtmCategory: categoryType,
                  }
                : undefined
            }
          />
          {contactRevealed && !inquiryOpen ? (
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.INQUIRY_OPEN, { category: categoryType })}
              onClick={() => setInquiryOpen(true)}
              className={`${listingInquiryCtaButtonClass} mt-4`}
            >
              {inquiryLabel}
            </button>
          ) : null}
        </>
      ) : null}

      <ListingInquiryForm
        postId={postId}
        postTitle={postTitle}
        categoryType={categoryType}
        cvRequired={jobCvRequired}
        embedded={hasDirectContact}
        open={hasDirectContact ? inquiryOpen : undefined}
        onOpenChange={hasDirectContact ? setInquiryOpen : undefined}
        hideTrigger={hasDirectContact}
      />
    </section>
  );
}
