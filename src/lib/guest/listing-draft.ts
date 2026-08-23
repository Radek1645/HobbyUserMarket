import {
  GUEST_LISTING_DRAFT_MAX_AGE_MS,
  GUEST_LISTING_DRAFT_STORAGE_KEY,
} from "@/config/guest-listing";
import { isGuestVisitorId } from "@/lib/guest/visitor-id";
import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

/** UX-only draft — server při publish vždy znovu validuje a běží final AI. */
export type GuestListingDraft = {
  version: 1;
  visitorId: string;
  /** Serverová idempotence create/publish napříč refreshi a kartami. */
  publishRequestId: string;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
  conditionLabel: ConditionLabel | "";
  priceType: PriceType;
  priceAmount: string;
  exchangeFor: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  eventDate: string;
  listingDurationDays: number;
  showContactEmail: boolean;
  showContactPhone: boolean;
  contactPhone: string;
  jobCvRequired: boolean;
  /** Událost — volitelný odkaz (guest draft). */
  externalUrl?: string;
  /** Guest staging paths — claim po auth. */
  stagingPaths: string[];
  mainImageIndex: number;
  /** Po úspěšném claim — user staging paths (idempotentní resume). */
  claimedPaths?: string[];
  claimDone?: boolean;
  /** AI náhled (volitelný) — po resume se stejně běží final AI znovu. */
  aiTitle?: string;
  aiDescription?: string;
  metaDescription?: string;
  imageAlt?: string;
  preferAi?: boolean;
  savedAt: string;
};

export function saveGuestListingDraft(draft: GuestListingDraft): boolean {
  try {
    localStorage.setItem(
      GUEST_LISTING_DRAFT_STORAGE_KEY,
      JSON.stringify(draft),
    );
    return true;
  } catch {
    return false;
  }
}

export function readGuestListingDraft(): GuestListingDraft | null {
  try {
    const raw = localStorage.getItem(GUEST_LISTING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestListingDraft>;
    const savedAt = Date.parse(String(parsed.savedAt ?? ""));
    if (
      parsed.version !== 1 ||
      !isGuestVisitorId(String(parsed.visitorId ?? "")) ||
      !isGuestVisitorId(String(parsed.publishRequestId ?? "")) ||
      !Array.isArray(parsed.stagingPaths) ||
      !parsed.stagingPaths.every((path) => typeof path === "string") ||
      !Number.isInteger(parsed.mainImageIndex) ||
      !Number.isFinite(savedAt) ||
      Date.now() - savedAt > GUEST_LISTING_DRAFT_MAX_AGE_MS
    ) {
      return null;
    }
    if (
      parsed.claimDone === true &&
      (!Array.isArray(parsed.claimedPaths) ||
        !parsed.claimedPaths.every((path) => typeof path === "string"))
    ) {
      return null;
    }
    return parsed as GuestListingDraft;
  } catch {
    return null;
  }
}

export function clearGuestListingDraft(): void {
  try {
    localStorage.removeItem(GUEST_LISTING_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
