import { FbPromoLanding } from "@/components/promo/FbPromoLanding";
import {
  FB_PROMO_LANDING_FAQ,
  FB_PROMO_LANDING_PATH,
  FB_PROMO_LANDING_UI,
} from "@/config/fb-promo-landing";
import { SITE_CANONICAL_URL, SITE_DISPLAY_NAME } from "@/config/site";
import type { Metadata } from "next";

const ui = FB_PROMO_LANDING_UI;

export const metadata: Metadata = {
  title: ui.metaTitle,
  description: ui.metaDescription,
  alternates: {
    canonical: FB_PROMO_LANDING_PATH,
  },
  openGraph: {
    title: ui.metaTitle,
    description: ui.metaDescription,
    url: FB_PROMO_LANDING_PATH,
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_DISPLAY_NAME,
  },
};

function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FB_PROMO_LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: `${SITE_CANONICAL_URL}${FB_PROMO_LANDING_PATH}`,
  };
}

export default function FbPromoLandingPage() {
  const faqJsonLd = buildFaqJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FbPromoLanding />
    </>
  );
}
