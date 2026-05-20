import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["zod-to-json-schema", "zod"],
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
