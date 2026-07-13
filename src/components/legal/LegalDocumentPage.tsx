import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";
import {
  readLegalDocument,
  type LegalDocumentSlug,
} from "@/lib/legal/read-legal-document";

type LegalDocumentPageProps = {
  slug: LegalDocumentSlug;
};

export async function LegalDocumentPage({ slug }: LegalDocumentPageProps) {
  const doc = await readLegalDocument(slug);

  return (
    <div className="px-4 py-8 sm:px-6">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {doc.title}
          </h1>
          {(doc.meta.version || doc.meta.effectiveDate || doc.meta.operator) && (
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              {doc.meta.operator ? (
                <div>
                  <dt className="sr-only">Provozovatel</dt>
                  <dd>{doc.meta.operator}</dd>
                </div>
              ) : null}
              {doc.meta.version ? (
                <div>
                  <dt className="sr-only">Verze</dt>
                  <dd>{doc.meta.version}</dd>
                </div>
              ) : null}
              {doc.meta.effectiveDate ? (
                <div>
                  <dt className="sr-only">Datum účinnosti</dt>
                  <dd>Účinnost: {doc.meta.effectiveDate}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </header>

        <div className="mt-6">
          <LegalMarkdown content={doc.body} />
        </div>
      </article>

      <BackHomeLink className="mx-auto mt-10 max-w-3xl" />
    </div>
  );
}
