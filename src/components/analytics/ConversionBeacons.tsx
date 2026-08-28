"use client";

import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import { resolveGtmContainerId } from "@/config/gtm";
import {
  LISTING_PUBLISHED_QUERY,
  LISTING_PUBLISHED_SENT_KEY,
  META_PIXEL_EVENTS,
  PENDING_LISTING_PUBLISHED_KEY,
  PENDING_REGISTRATION_CONVERSION_KEY,
  REGISTERED_CONVERSION_QUERY,
  REGISTRATION_CONVERSION_SENT_KEY,
  resolveMetaPixelId,
} from "@/config/meta-pixel";
import {
  hasGenerateLeadBeenSent,
  pushGenerateLeadOnce,
} from "@/lib/analytics/generate-lead";
import { trackEvent } from "@/lib/analytics/meta-pixel";
import { campaignParamsToEventData } from "@/lib/promo/campaign-storage";
import { clearGuestListingDraft } from "@/lib/guest/listing-draft";
import type { CategoryType } from "@/types/post";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type PendingListingPublished = {
  postId: string;
  contentCategory?: string;
};

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

function hasPixelLeadBeenSent(postId: string): boolean {
  try {
    return localStorage.getItem(listingPublishedSentKey(postId)) === "1";
  } catch {
    return false;
  }
}

function markPixelLeadSent(postId: string): void {
  try {
    localStorage.setItem(listingPublishedSentKey(postId), "1");
  } catch {
    /* Event se i bez storage může odeslat; serverový redirect je zdroj pravdy. */
  }
}

function listingPublishedEventParams(
  pending: PendingListingPublished,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    ...campaignParamsToEventData(),
  };
  if (pending.contentCategory) {
    params.content_category = pending.contentCategory;
  }
  return params;
}

function shouldKeepListingPublishedPending(postId: string): boolean {
  if (!hasGenerateLeadBeenSent(postId) && resolveGtmContainerId()) {
    return true;
  }

  if (resolveMetaPixelId() && !hasPixelLeadBeenSent(postId)) {
    return true;
  }

  return false;
}

/**
 * GA4 `generate_lead` po analytickém souhlasu; Pixel `Lead` po marketingovém.
 * Pending zůstane, dokud nedorazí kanály, které jsou v appce zapnuté.
 */
function flushListingPublishedConversions(options: {
  analytics: boolean;
  marketing: boolean;
}): void {
  const pending = readPendingListingPublished();
  if (!pending) {
    return;
  }

  const params = listingPublishedEventParams(pending);

  if (options.analytics && resolveGtmContainerId()) {
    pushGenerateLeadOnce(pending.postId, params);
  }

  if (options.marketing && resolveMetaPixelId()) {
    if (!hasPixelLeadBeenSent(pending.postId)) {
      markPixelLeadSent(pending.postId);
      trackEvent(META_PIXEL_EVENTS.LEAD, params);
    }
  }

  if (!shouldKeepListingPublishedPending(pending.postId)) {
    clearPendingListingPublished();
  }
}

function setPendingListingPublished(
  postId: string,
  contentCategory?: string,
): void {
  const payload: PendingListingPublished = { postId, contentCategory };
  try {
    localStorage.setItem(PENDING_LISTING_PUBLISHED_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function readPendingListingPublished(): PendingListingPublished | null {
  try {
    const raw = localStorage.getItem(PENDING_LISTING_PUBLISHED_KEY);
    if (!raw) {
      return null;
    }

    if (/^\d+$/.test(raw)) {
      return { postId: raw };
    }

    const parsed = JSON.parse(raw) as Partial<PendingListingPublished>;
    if (typeof parsed.postId !== "string" || parsed.postId === "") {
      return null;
    }

    return {
      postId: parsed.postId,
      contentCategory:
        typeof parsed.contentCategory === "string"
          ? parsed.contentCategory
          : undefined,
    };
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
    trackEvent(META_PIXEL_EVENTS.COMPLETE_REGISTRATION, {
      ...campaignParamsToEventData(),
    });
  }, [consent?.marketing, isReady, userId]);

  // Pending publish: GA4 po analytice, Pixel po marketingu (i na jiné stránce).
  useEffect(() => {
    if (!isReady) return;
    flushListingPublishedConversions({
      analytics: Boolean(consent?.analytics),
      marketing: Boolean(consent?.marketing),
    });
  }, [consent?.analytics, consent?.marketing, isReady, pathname]);

  return null;
}

/** Po redirectu `?published=<id>` vypálí GA4 generate_lead a Pixel Lead (jednou, až po serverovém zápisu). */
export function ListingPublishedConversionBeacon({
  postId,
  contentCategory,
}: {
  postId: number;
  contentCategory?: CategoryType;
}) {
  const searchParams = useSearchParams();
  const { consent, isReady } = useCookieConsent();

  useEffect(() => {
    const publishedId = searchParams.get(LISTING_PUBLISHED_QUERY);
    if (publishedId !== String(postId)) {
      return;
    }

    clearGuestListingDraft();
    setPendingListingPublished(publishedId, contentCategory);

    const url = new URL(window.location.href);
    url.searchParams.delete(LISTING_PUBLISHED_QUERY);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [contentCategory, postId, searchParams]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (readPendingListingPublished()?.postId !== String(postId)) {
      return;
    }

    flushListingPublishedConversions({
      analytics: Boolean(consent?.analytics),
      marketing: Boolean(consent?.marketing),
    });
  }, [consent?.analytics, consent?.marketing, isReady, postId]);

  return null;
}
