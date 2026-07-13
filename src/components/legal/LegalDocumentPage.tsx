import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";
import {
  readLegalDocument,
  type LegalDocumentSlug,
} from "@/lib/legal/read-legal-document";
import { resolveVopVersionInfo } from "@/lib/legal/vop-versioning";
import { CURRENT_VOP_VERSION } from "@/config/legal";
import Link from "next/link";
import { access } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";

type LegalDocumentPageProps = {
  slug: LegalDocumentSlug;
};

async function publicFileExists(urlPath: string): Promise<boolean> {
  if (!urlPath.startsWith("/")) {
    return false;
  }

  try {
    const fsPath = path.join(process.cwd(), "public", urlPath.replace(/^\//, ""));
    await access(fsPath);
    return true;
  } catch {
    return false;
  }
}

export async function LegalDocumentPage({ slug }: LegalDocumentPageProps) {
  const doc = await readLegalDocument(slug);
  const vopInfo =
    slug === "vop" ? resolveVopVersionInfo(CURRENT_VOP_VERSION) : null;
  const vopPdfExists =
    slug === "vop" && vopInfo?.ok ? await publicFileExists(vopInfo.pdfPath) : false;
  const currentUser = slug === "vop" ? await getCurrentUser() : null;
  const canSeeVopHistory = Boolean(currentUser && isStaffRole(currentUser.role));

  return (
    <div className="px-4 py-8 sm:px-6">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {doc.title}
          </h1>
          {slug === "vop" && vopInfo?.ok ? (
            <p className="mt-2 text-sm text-gray-600">
              {vopPdfExists ? (
                <Link
                  href={vopInfo.pdfPath}
                  className="font-medium text-gray-900 underline-offset-2 hover:underline"
                >
                  Stáhnout PDF ({vopInfo.version})
                </Link>
              ) : canSeeVopHistory ? (
                <Link
                  href={vopInfo.snapshotPagePath}
                  className="font-medium text-gray-900 underline-offset-2 hover:underline"
                >
                  Zobrazit verzi ({vopInfo.version})
                </Link>
              ) : null}
            </p>
          ) : null}
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
