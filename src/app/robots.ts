import { getSiteUrl } from "@/lib/supabase/env";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/onboarding",
        "/moje-inzeraty",
        "/inzerat/novy",
        "/inzerat/*/upravit",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
