"use client";

import { gtmCtaProps, type GtmCtaId } from "@/config/gtm-ids";
import {
  createListingHrefWithCampaign,
  withCampaignQuery,
} from "@/lib/promo/campaign-query";
import { resolveCampaignSearchParams } from "@/lib/promo/campaign-storage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

type FbPromoCtaLinkProps = {
  href: string;
  gtmId: GtmCtaId;
  className?: string;
  children: ReactNode;
  position?: "header" | "hero" | "footer";
  category?: string;
  /** Cíl je formulář inzerátu — UTM se připojí k `href`. */
  createListing?: boolean;
};

function FbPromoCtaLinkInner({
  href,
  gtmId,
  className,
  children,
  position,
  category,
  createListing,
}: FbPromoCtaLinkProps) {
  const searchParams = useSearchParams();
  const campaign = resolveCampaignSearchParams(searchParams);
  const to = createListing
    ? createListingHrefWithCampaign(campaign, href)
    : withCampaignQuery(href, campaign);

  return (
    <Link
      href={to}
      prefetch={false}
      {...gtmCtaProps(gtmId, { position, category })}
      className={className}
    >
      {children}
    </Link>
  );
}

/** CTA z FB landing — zachová UTM / fbclid. */
export function FbPromoCtaLink(props: FbPromoCtaLinkProps) {
  return (
    <Suspense
      fallback={
        <Link
          href={props.href}
          prefetch={false}
          {...gtmCtaProps(props.gtmId, {
            position: props.position,
            category: props.category,
          })}
          className={props.className}
        >
          {props.children}
        </Link>
      }
    >
      <FbPromoCtaLinkInner {...props} />
    </Suspense>
  );
}
