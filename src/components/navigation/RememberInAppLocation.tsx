"use client";

import { rememberInAppLocation } from "@/lib/navigation/in-app-back";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function RememberInAppLocationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    rememberInAppLocation(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  return null;
}

export function RememberInAppLocation() {
  return (
    <Suspense fallback={null}>
      <RememberInAppLocationInner />
    </Suspense>
  );
}
