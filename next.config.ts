import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep recently visited tabs in the browser so switching back is instant;
    // a quiet refresh on focus updates them in the background.
    staleTimes: {
      dynamic: 600,
      static: 1800,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ],
  },
};

export default nextConfig;
