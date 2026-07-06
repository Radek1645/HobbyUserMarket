import { parseListingDescription } from "@/lib/moderation/parse-listing-description";

type ListingDescriptionProps = {
  description: string;
};

export function ListingDescription({ description }: ListingDescriptionProps) {
  const { intro, parametersHeading, parameters } =
    parseListingDescription(description);

  if (parameters.length === 0) {
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
            <li key={`${item.label}-${index}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
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
        </ul>
      </section>
    </div>
  );
}
