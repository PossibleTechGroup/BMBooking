import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://bmbookingapi.possibletechplc.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
