import { splitLegalMentions } from "@/lib/legal/split-legal-mentions";
import Link from "next/link";

const legalLinkClassName =
  "font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700";

type LegalLinkedTextProps = {
  text: string;
  linkClassName?: string;
  /** Registrace: otevřít dokument v novém panelu, ať se neztratí formulář. */
  linkTarget?: "_blank";
};

/** Plain text s automatickými odkazy na VOP / Podmínky inzerce / GDPR (viz README). */
export function LegalLinkedText({
  text,
  linkClassName,
  linkTarget,
}: LegalLinkedTextProps) {
  const segments = splitLegalMentions(text);
  const className = linkClassName ?? legalLinkClassName;

  return (
    <>
      {segments.map((segment, index) =>
        segment.href ? (
          <Link
            key={`${segment.href}-${index}`}
            href={segment.href}
            className={className}
            {...(linkTarget === "_blank"
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            onClick={(event) => event.stopPropagation()}
          >
            {segment.text}
          </Link>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
