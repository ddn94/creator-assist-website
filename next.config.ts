import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Revisit a page within a minute from the copy already in the browser.
    staleTimes: {
      dynamic: 60,
      static: 180,
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
