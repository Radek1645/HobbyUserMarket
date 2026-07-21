import {
  ADVERTISER_BADGES_OWNER_HINT,
  PODNIKATEL_BADGE_LABEL,
  resolveAdvertiserMilestone,
} from "@/config/advertiser-badges";
import {
  advertiserMilestoneBadgeClassByThreshold,
  advertiserPodnikatelBadgeClass,
} from "@/config/ui-primitives";

type AdvertiserBadgesProps = {
  isCompany: boolean;
  lifetimePublishedCount: number;
  /** Majitel vidí vysvětlení, že odznaky posilují důvěryhodnost. */
  showOwnerHint?: boolean;
};

export function AdvertiserBadges({
  isCompany,
  lifetimePublishedCount,
  showOwnerHint = false,
}: AdvertiserBadgesProps) {
  const milestone = resolveAdvertiserMilestone(lifetimePublishedCount);
  if (!isCompany && !milestone) return null;

  const podnikatelTitle =
    "Inzerát od podnikatele — ne od soukromé osoby (VOP).";
  const milestoneTitle = milestone
    ? `Zadavatel má alespoň ${milestone.threshold} publikovaných inzerátů na platformě.`
    : undefined;

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {isCompany ? (
          <span
            className={advertiserPodnikatelBadgeClass}
            title={podnikatelTitle}
            aria-label={podnikatelTitle}
          >
            {PODNIKATEL_BADGE_LABEL}
          </span>
        ) : null}
        {milestone ? (
          <span
            className={
              advertiserMilestoneBadgeClassByThreshold[milestone.threshold]
            }
            title={milestoneTitle}
            aria-label={milestoneTitle}
          >
            {milestone.label}
          </span>
        ) : null}
      </div>
      {showOwnerHint ? (
        <p className="text-xs text-gray-500">{ADVERTISER_BADGES_OWNER_HINT}</p>
      ) : null}
    </div>
  );
}
