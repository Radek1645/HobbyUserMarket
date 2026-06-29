import { HomeBrowse } from "@/components/home/HomeBrowse";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Suspense } from "react";

function HomeFallback() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      <div className="mt-6 h-10 animate-pulse rounded-full bg-gray-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeBrowse user={user} />
    </Suspense>
  );
}
