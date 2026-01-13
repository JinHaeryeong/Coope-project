import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // // 빌드 시 타입스크립트 에러를 무시하고 빌드를 진행합니다.
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    formats: ['image/avif', 'image/webp'],

    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [400, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
        port: '',
        pathname: '/api/storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.convex.site',
        port: '',
        pathname: '/getFile**',
      },
      {
        protocol: "https",
        hostname: "files.edgestore.dev", // 팀원이 추가한 domains를 remotePatterns로 변경
        port: "",
        pathname: "/**", // 필요한 모든 경로 허용
      },
    ],
  },
};

export default nextConfig;
