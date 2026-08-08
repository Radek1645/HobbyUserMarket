"use client";

import { trackMetaPixelEvent } from "@/components/analytics/MetaPixelLoader";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import {
  LISTING_PUBLISHED_QUERY,
  LISTING_PUBLISHED_SENT_KEY,
  META_PIXEL_EVENTS,
  PENDING_LISTING_PUBLISHED_KEY,
  PENDING_REGISTRATION_CONVERSION_KEY,
  REGISTERED_CONVERSION_QUERY,
  REGISTRATION_CONVERSION_SENT_KEY,
} from "@/config/meta-pixel";
import { clearGuestListingDraft } from "@/lib/guest/listing-draft";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function registrationSentKey(userId: string): string {
  return `${REGISTRATION_CONVERSION_SENT_KEY}:${userId}`;
}

function hasRegistrationConversionBeenSent(userId: string): boolean {
  try {
    return localStorage.getItem(registrationSentKey(userId)) === "1";
  } catch {
    return false;
  }
}

function markRegistrationConversionSent(userId: string): void {
  try {
    localStorage.setItem(registrationSentKey(userId), "1");
  } catch {
    /* ignore */
  }
}

function readPendingRegistrationConversion(userId: string): boolean {
  try {
    return (
      localStorage.getItem(PENDING_REGISTRATION_CONVERSION_KEY) === userId
    );
  } catch {
    return false;
  }
}

function setPendingRegistrationConversion(userId: string): void {
  try {
    localStorage.setItem(PENDING_REGISTRATION_CONVERSION_KEY, userId);
  } catch {
    /* ignore */
  }
}

function clearPendingRegistrationConversion(): void {
  try {
    localStorage.removeItem(PENDING_REGISTRATION_CONVERSION_KEY);
  } catch {
    /* ignore */
  }
}

function listingPublishedSentKey(postId: string): string {
  return `${LISTING_PUBLISHED_SENT_KEY}:${postId}`;
}

function setPendingListingPublished(postId: string): void {
  try {
    localStorage.setItem(PENDING_LISTING_PUBLISHED_KEY, postId);
  } catch {
    /* ignore */
  }
}

function readPendingListingPublished(): string | null {
  try {
    return localStorage.getItem(PENDING_LISTING_PUBLISHED_KEY);
  } catch {
    return null;
  }
}

function clearPendingListingPublished(): void {
  try {
    localStorage.removeItem(PENDING_LISTING_PUBLISHED_KEY);
  } catch {
    /* ignore */
  }
}

function trackPendingListingPublished(): void {
  const postId = readPendingListingPublished();
  if (!postId) return;

  const sentKey = listingPublishedSentKey(postId);
  try {
    if (localStorage.getItem(sentKey) === "1") {
      clearPendingListingPublished();
      return;
    }
    localStorage.setItem(sentKey, "1");
  } catch {
    /* Event se i bez storage může odeslat; serverový redirect je zdroj pravdy. */
  }

  clearPendingListingPublished();
  trackMetaPixelEvent(META_PIXEL_EVENTS.LISTING_PUBLISHED, {
    listing_id: postId,
  });
}

/**
 * Po úspěšném auth flow (`?registered=1`) vypálí CompleteRegistration.
 * Bez marketing souhlasu pending zůstane — „Přijmout vše“ později event spustí.
 */
export function RegistrationConversionBeacon({
  userId,
}: {
  userId: string | null;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { consent, isReady } = useCookieConsent();
  const fired = useRef(false);

  useEffect(() => {
    if (
      !userId ||
      searchParams.get(REGISTERED_CONVERSION_QUERY) !== "1"
    ) {
      return;
    }

    if (!hasRegistrationConversionBeenSent(userId)) {
      setPendingRegistrationConversion(userId);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete(REGISTERED_CONVERSION_QUERY);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [searchParams, userId]);

  useEffect(() => {
    if (!userId || !isReady || fired.current || !consent?.marketing) {
      return;
    }

    if (hasRegistrationConversionBeenSent(userId)) {
      clearPendingRegistrationConversion();
      return;
    }

    if (!readPendingRegistrationConversion(userId)) {
      return;
    }

    fired.current = true;
    clearPendingRegistrationConversion();
    markRegistrationConversionSent(userId);
    trackMetaPixelEvent(META_PIXEL_EVENTS.COMPLETE_REGISTRATION);
  }, [consent?.marketing, isReady, userId]);

  // Pending publish může vzniknout na detailu a souhlas přijít až na jiné stránce.
  useEffect(() => {
    if (!isReady || !consent?.marketing) return;
    trackPendingListingPublished();
  }, [consent?.marketing, isReady, pathname]);

  return null;
}

/** Po redirectu `?published=1` vypálí ListingPublished (jednou). */
export function ListingPublishedConversionBeacon({
  postId,
}: {
  postId: number;
}) {
  const searchParams = useSearchParams();
  const { consent, isReady } = useCookieConsent();
  const fired = useRef(false);

  useEffect(() => {
    const publishedId = searchParams.get(LISTING_PUBLISHED_QUERY);
    if (publishedId !== String(postId)) {
      return;
    }

    clearGuestListingDraft();
    setPendingListingPublished(publishedId);

    const url = new URL(window.location.href);
    url.searchParams.delete(LISTING_PUBLISHED_QUERY);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [postId, searchParams]);

  useEffect(() => {
    if (!isReady || fired.current || !consent?.marketing) {
      return;
    }

    if (readPendingListingPublished() !== String(postId)) {
      return;
    }

    fired.current = true;
    trackPendingListingPublished();
  }, [consent?.marketing, isReady, postId]);

  return null;
}
