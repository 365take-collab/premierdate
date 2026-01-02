import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化のドメイン設定
  images: {
    domains: ['premierdate.jp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'premierdate.jp',
      },
    ],
  },
};

export default nextConfig;
