import {
  MY_LISTINGS_VIEW,
  MY_LISTINGS_VIEW_LABEL,
  type MyListingsView,
} from "@/config/my-listings";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  myListingsViewTabActiveClass,
  myListingsViewTabInactiveClass,
} from "@/config/ui-primitives";
import { getMyListingsPath } from "@/lib/posts/listing-path";
import Link from "next/link";

type MyListingsViewTabsProps = {
  activeView: MyListingsView;
  liveCount: number;
  expiredCount: number;
};

const TABS: {
  view: MyListingsView;
  gtmId: (typeof GTM_CTA)[keyof typeof GTM_CTA];
}[] = [
  {
    view: MY_LISTINGS_VIEW.live,
    gtmId: GTM_CTA.MY_LISTINGS_FILTER_LIVE,
  },
  {
    view: MY_LISTINGS_VIEW.expired,
    gtmId: GTM_CTA.MY_LISTINGS_FILTER_EXPIRED,
  },
];

export function MyListingsViewTabs({
  activeView,
  liveCount,
  expiredCount,
}: MyListingsViewTabsProps) {
  return (
    <nav
      aria-label="Filtr inzerátů"
      className="mt-6 flex flex-wrap gap-2"
    >
      {TABS.map((tab) => {
        const selected = activeView === tab.view;
        const count =
          tab.view === MY_LISTINGS_VIEW.live ? liveCount : expiredCount;
        return (
          <Link
            key={tab.view}
            href={getMyListingsPath({ view: tab.view })}
            aria-current={selected ? "page" : undefined}
            {...gtmCtaProps(tab.gtmId)}
            className={
              selected
                ? myListingsViewTabActiveClass
                : myListingsViewTabInactiveClass
            }
          >
            {MY_LISTINGS_VIEW_LABEL[tab.view]}{" "}
            <span className={selected ? "text-white/80" : "text-gray-500"}>
              {count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
