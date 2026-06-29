import type { NextConfig } from "next";
import { LISTING_IMAGE_MAX_UPLOAD_BYTES } from "./src/config/app";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: LISTING_IMAGE_MAX_UPLOAD_BYTES,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
