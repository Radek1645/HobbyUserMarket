import {
  buildListingJsonLd,
  serializeListingJsonLd,
  type ListingJsonLdInput,
} from "@/lib/seo/listing-json-ld";

type ListingJsonLdProps = {
  input: ListingJsonLdInput;
};

export function ListingJsonLd({ input }: ListingJsonLdProps) {
  const jsonLd = buildListingJsonLd(input);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeListingJsonLd(jsonLd) }}
    />
  );
}
