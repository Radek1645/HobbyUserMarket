import type { CategoryType, ConditionLabel, PostRow } from "@/types/post";
import { SITE_DISPLAY_NAME } from "@/config/site";

export type ListingJsonLdInput = {
  post: Pick<
    PostRow,
    | "title"
    | "description"
    | "category_type"
    | "subcategory_slug"
    | "price_type"
    | "price_amount"
    | "condition_label"
    | "location_text"
    | "expires_at"
    | "event_date"
    | "created_at"
    | "slug"
  >;
  pageUrl: string;
  imageUrls: string[];
  subcategoryLabel: string;
};

type JsonLd = Record<string, unknown>;

const ITEM_CONDITION: Partial<Record<ConditionLabel, string>> = {
  new: "https://schema.org/NewCondition",
  like_new: "https://schema.org/UsedCondition",
  used: "https://schema.org/UsedCondition",
  damaged: "https://schema.org/DamagedCondition",
};

const EMPLOYMENT_TYPE: Partial<Record<ConditionLabel, string>> = {
  one_time: "TEMPORARY",
  long_term: "FULL_TIME",
  substitute: "TEMPORARY",
};

function buildPlace(locationText: string): JsonLd {
  const name = locationText.trim();
  return {
    "@type": "Place",
    name,
    address: {
      "@type": "PostalAddress",
      streetAddress: name,
      addressCountry: "CZ",
    },
  };
}

function buildOffer(
  post: ListingJsonLdInput["post"],
  pageUrl: string,
): JsonLd {
  const offer: JsonLd = {
    "@type": "Offer",
    url: pageUrl,
    priceCurrency: "CZK",
    availability: "https://schema.org/InStock",
  };

  if (post.price_type === "free_pickup") {
    offer.price = 0;
  } else if (post.price_type === "fixed" && post.price_amount != null) {
    // SEO Bible §3.6 — negotiable/orientační cenu do Offer.price neposílat
    offer.price = post.price_amount;
  }

  if (post.expires_at) {
    offer.priceValidUntil = post.expires_at;
  }

  return offer;
}

function baseFields(input: ListingJsonLdInput): JsonLd {
  const { post, pageUrl, imageUrls } = input;
  const description = post.description?.trim();

  const fields: JsonLd = {
    name: post.title,
    url: pageUrl,
  };

  if (description) {
    fields.description = description;
  }

  if (imageUrls.length > 0) {
    fields.image = imageUrls.length === 1 ? imageUrls[0] : imageUrls;
  }

  return fields;
}

function buildProductJsonLd(input: ListingJsonLdInput): JsonLd {
  const { post } = input;
  const itemCondition = ITEM_CONDITION[post.condition_label];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    ...baseFields(input),
    category: input.subcategoryLabel,
    ...(itemCondition ? { itemCondition } : {}),
    offers: buildOffer(post, input.pageUrl),
  };
}

function buildServiceJsonLd(input: ListingJsonLdInput): JsonLd {
  const { post } = input;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    ...baseFields(input),
    serviceType: input.subcategoryLabel,
    areaServed: buildPlace(post.location_text),
    offers: buildOffer(post, input.pageUrl),
  };
}

function buildEventJsonLd(input: ListingJsonLdInput): JsonLd {
  const { post } = input;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    ...baseFields(input),
    ...(post.event_date ? { startDate: post.event_date } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: buildPlace(post.location_text),
    offers: buildOffer(post, input.pageUrl),
  };
}

function buildRealEstateJsonLd(input: ListingJsonLdInput): JsonLd {
  const { post } = input;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    ...baseFields(input),
    datePosted: post.created_at,
    ...(post.expires_at ? { validThrough: post.expires_at } : {}),
    offers: buildOffer(post, input.pageUrl),
  };
}

function buildJobPostingJsonLd(input: ListingJsonLdInput): JsonLd {
  const { post } = input;
  const employmentType = EMPLOYMENT_TYPE[post.condition_label];

  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: post.title,
    ...baseFields(input),
    datePosted: post.created_at,
    ...(post.expires_at ? { validThrough: post.expires_at } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_DISPLAY_NAME,
    },
    jobLocation: buildPlace(post.location_text),
    ...(employmentType ? { employmentType } : {}),
  };

  if (post.price_amount != null && post.price_type !== "offer") {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "CZK",
      value: {
        "@type": "QuantitativeValue",
        value: post.price_amount,
        unitText: post.price_type === "fixed" ? "HOUR" : "MONTH",
      },
    };
  }

  return jsonLd;
}

const BUILDERS: Record<
  CategoryType,
  (input: ListingJsonLdInput) => JsonLd
> = {
  zbozi: buildProductJsonLd,
  sluzby: buildServiceJsonLd,
  udalost: buildEventJsonLd,
  nemovitost: buildRealEstateJsonLd,
  prace: buildJobPostingJsonLd,
};

export function buildListingJsonLd(input: ListingJsonLdInput): JsonLd {
  return BUILDERS[input.post.category_type](input);
}

export function serializeListingJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
