import { LISTING_AI_DISCLOSURE } from "@/config/moderation/messages";
import { ListingAiDisclosureInfo } from "@/components/listing/ListingAiDisclosureInfo";
import { parseListingDescription } from "@/lib/moderation/parse-listing-description";

type ListingDescriptionProps = {
  description: string;
  descriptionAiAssisted?: boolean;
};

function ListingAiDisclosureParameterRow() {
  return (
    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <span className="shrink-0 font-semibold text-gray-900 sm:min-w-[9rem]">
        {LISTING_AI_DISCLOSURE.paramLabel}:
      </span>
      <span className="inline-flex items-center gap-1 whitespace-pre-wrap text-gray-700">
        {LISTING_AI_DISCLOSURE.paramValueYes}
        <ListingAiDisclosureInfo />
      </span>
    </li>
  );
}

export function ListingDescription({
  description,
  descriptionAiAssisted = false,
}: ListingDescriptionProps) {
  const { intro, parametersHeading, parameters } =
    parseListingDescription(description);

  const hasParameters = parameters.length > 0 || descriptionAiAssisted;

  if (!hasParameters) {
    return (
      <p className="whitespace-pre-wrap text-gray-800">{intro || description}</p>
    );
  }

  return (
    <div className="space-y-4 text-gray-800">
      {intro ? (
        <p className="whitespace-pre-wrap leading-relaxed">{intro}</p>
      ) : null}

      <section className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {parametersHeading}
        </h3>
        <ul className="mt-3 space-y-2 text-sm sm:text-base">
          {parameters.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="flex flex-col gap-0.5 sm:flex-row sm:gap-2"
            >
              <span className="shrink-0 font-semibold text-gray-900 sm:min-w-[9rem]">
                {item.label}:
              </span>
              {item.value ? (
                <span className="whitespace-pre-wrap text-gray-700">
                  {item.value}
                </span>
              ) : null}
            </li>
          ))}
          {descriptionAiAssisted ? <ListingAiDisclosureParameterRow /> : null}
        </ul>
      </section>
    </div>
  );
}
