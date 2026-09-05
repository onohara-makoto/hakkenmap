import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qwugcgoqyfgpmlxnjbpk.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
    qualities: [50, 75],
    formats: ["image/webp"],
  },
};

export default nextConfig;
