/**
 * Veřejné odznaky zadavatele — Podnikatel (VOP §7.2) a milníky lifetime publikací.
 */

export const PODNIKATEL_BADGE_LABEL = "Podnikatel";

/** Lifetime publikace (`listing_quota_consumed`) — prahy milníkových odznaků. */
export const ADVERTISER_MILESTONE_THRESHOLDS = [5, 10, 20, 40] as const;

export type AdvertiserMilestoneThreshold =
  (typeof ADVERTISER_MILESTONE_THRESHOLDS)[number];

export type AdvertiserMilestone = {
  threshold: AdvertiserMilestoneThreshold;
  label: string;
};

/** Text pro majitele — odznaky vidí zájemci. */
export const ADVERTISER_BADGES_OWNER_HINT =
  "Tyto odznaky vidí zájemci u vašeho jména a zvyšují důvěryhodnost inzerátu.";

export function formatAdvertiserMilestoneLabel(
  threshold: AdvertiserMilestoneThreshold,
): string {
  return `Aktivní inzerent · ${threshold}+`;
}

/** Nejvyšší dosažený milník, nebo null pod nejnižším prahem. */
export function resolveAdvertiserMilestone(
  lifetimePublishedCount: number,
): AdvertiserMilestone | null {
  if (
    !Number.isFinite(lifetimePublishedCount) ||
    lifetimePublishedCount < ADVERTISER_MILESTONE_THRESHOLDS[0]
  ) {
    return null;
  }

  let reached: AdvertiserMilestoneThreshold =
    ADVERTISER_MILESTONE_THRESHOLDS[0];

  for (const threshold of ADVERTISER_MILESTONE_THRESHOLDS) {
    if (lifetimePublishedCount >= threshold) {
      reached = threshold;
    }
  }

  return {
    threshold: reached,
    label: formatAdvertiserMilestoneLabel(reached),
  };
}
