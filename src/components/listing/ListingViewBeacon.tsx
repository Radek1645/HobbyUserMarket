"use client";

import { useEffect, useRef } from "react";

type ListingViewBeaconProps = {
  postId: number;
};

/**
 * Po načtení detailu pošle beacon zobrazení (mimo GA4).
 * Dedup a filtr majitele řeší server / RPC.
 */
export function ListingViewBeacon({ postId }: ListingViewBeaconProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    if (!Number.isInteger(postId) || postId < 1) return;
    sentRef.current = true;

    const body = JSON.stringify({ postId });
    const url = "/api/listing-view";

    try {
      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        const queued = navigator.sendBeacon(url, blob);
        if (queued) return;
      }
    } catch {
      // fallback na fetch
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // statistiky nesmí shodit UX
    });
  }, [postId]);

  return null;
}
