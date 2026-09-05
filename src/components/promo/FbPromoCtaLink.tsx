"use client";

import { gtmCtaProps, type GtmCtaId } from "@/config/gtm-ids";
import {
  createListingHrefWithCampaign,
  withCampaignQuery,
} from "@/lib/promo/campaign-query";
import { resolveCampaignSearchParams } from "@/lib/promo/campaign-storage";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

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

function hrefWithStoredCampaign(href: string, createListing?: boolean): string {
  const campaign = resolveCampaignSearchParams(
    new URLSearchParams(window.location.search),
  );
  return createListing
    ? createListingHrefWithCampaign(campaign, href)
    : withCampaignQuery(href, campaign);
}

/**
 * CTA z FB landing. UTM / fbclid se připojí až po mountu — jinak SSR HTML
 * (`/inzerat/novy`) nesedí s clientem (URL nebo localStorage).
 */
export function FbPromoCtaLink({
  href,
  gtmId,
  className,
  children,
  position,
  category,
  createListing,
}: FbPromoCtaLinkProps) {
  const [to, setTo] = useState(href);

  useEffect(() => {
    setTo(hrefWithStoredCampaign(href, createListing));
  }, [href, createListing]);

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
