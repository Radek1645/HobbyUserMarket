import { LISTING_QUOTA_FREE_DEFAULT } from "@/config/app";

/** Veřejný popis webu pro LLM crawlery — `/llms.txt`. */

export const LLMS_TXT_PATH = "/llms.txt";

export const LLMS_TXT_UI = {
  footerLinkLabel: "Pro AI (llms.txt)",
} as const;

/** Max. počet aktivních inzerátů v `/llms.txt` (zbytek → sitemap). */
export const LLMS_TXT_LISTINGS_LIMIT = 100;

export const LLMS_TXT_FREE_PUBLICATIONS = LISTING_QUOTA_FREE_DEFAULT;
