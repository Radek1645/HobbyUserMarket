import type { NextConfig } from "next";
import { LISTING_IMAGE_MAX_UPLOAD_BYTES } from "./src/config/app";

function supabaseStorageHostname(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    ).hostname;
  } catch {
    return "placeholder.supabase.co";
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: LISTING_IMAGE_MAX_UPLOAD_BYTES,
    },
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: supabaseStorageHostname(),
      },
    ],
  },
};

export default nextConfig;
