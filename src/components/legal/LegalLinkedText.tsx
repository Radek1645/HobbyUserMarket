import { splitLegalMentions } from "@/lib/legal/split-legal-mentions";
import Link from "next/link";

const legalLinkClassName =
  "font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700";

type LegalLinkedTextProps = {
  text: string;
};

/** Plain text s automatickými odkazy na VOP / Podmínky inzerce / GDPR (viz README). */
export function LegalLinkedText({ text }: LegalLinkedTextProps) {
  const segments = splitLegalMentions(text);

  return (
    <>
      {segments.map((segment, index) =>
        segment.href ? (
          <Link
            key={`${segment.href}-${index}`}
            href={segment.href}
            className={legalLinkClassName}
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
