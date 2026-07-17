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
      {
        source: "/uploads/:path*",
        destination: "https://bmbookingapi.possibletechplc.com/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
