import {
  COOKIES_PATH,
  DSA_CONTACT_PATH,
  GDPR_PATH,
  LISTING_PACKAGES_PATH,
  MARKETING_CONSENT_PATH,
  VOP_PATH,
} from "@/config/legal";

const LEGAL_DOCUMENT_PATHS = new Set([
  VOP_PATH,
  GDPR_PATH,
  LISTING_PACKAGES_PATH,
  COOKIES_PATH,
  DSA_CONTACT_PATH,
  MARKETING_CONSENT_PATH,
]);

export function isLegalDocumentPath(pathname: string): boolean {
  return LEGAL_DOCUMENT_PATHS.has(pathname);
}

export function isCreateListingPath(pathname: string): boolean {
  return pathname === "/inzerat/novy";
}
