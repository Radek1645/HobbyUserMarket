import { getExternalUrlDisplayLabel } from "@/lib/posts/external-url";
import { listingInquiryCtaButtonClass } from "@/config/listing-form-ui";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { ExternalLink } from "lucide-react";

type ListingExternalLinkProps = {
  url: string;
  category?: string;
};

export function ListingExternalLink({
  url,
  category,
}: ListingExternalLinkProps) {
  const label = getExternalUrlDisplayLabel(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      {...gtmCtaProps(GTM_CTA.DETAIL_EXTERNAL_URL, {
        category,
      })}
      className={`${listingInquiryCtaButtonClass} mt-6`}
    >
      <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
      {label}
    </a>
  );
}
