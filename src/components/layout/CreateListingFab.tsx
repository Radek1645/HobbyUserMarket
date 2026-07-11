"use client";

import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  createListingCtaLabel,
  createListingFabClass,
  iconSmClass,
} from "@/config/ui-primitives";
import type { AppUser } from "@/types/auth";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SCROLL_COLLAPSE_THRESHOLD = 80;

type CreateListingFabProps = {
  user: AppUser | null;
};

function shouldHideFab(pathname: string): boolean {
  return (
    pathname === "/inzerat/novy" || pathname.endsWith("/upravit")
  );
}

export function CreateListingFab({ user }: CreateListingFabProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setCollapsed(window.scrollY > SCROLL_COLLAPSE_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (shouldHideFab(pathname)) {
    return null;
  }

  const href = user
    ? "/inzerat/novy"
    : "/login?next=/inzerat/novy&message=create_listing&tab=register";

  return (
    <Link
      href={href}
      {...gtmCtaProps(GTM_CTA.FAB_CREATE_LISTING)}
      aria-label={createListingCtaLabel}
      className={[
        createListingFabClass,
        collapsed ? "w-14 gap-0" : "w-auto gap-2 px-6",
        "bottom-[max(1rem,env(safe-area-inset-bottom))]",
        "transition-[width,padding,gap] duration-300 ease-out",
      ].join(" ")}
    >
      <Sparkles className={`${iconSmClass} shrink-0`} strokeWidth={2.5} />
      <span
        className={[
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-none opacity-100",
        ].join(" ")}
      >
        {createListingCtaLabel}
      </span>
    </Link>
  );
}
