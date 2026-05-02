import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@my-pet/shared-config", "@my-pet/shared-prompts", "@my-pet/shared-types"],
  output: "export",
  experimental: {
    webpackBuildWorker: false,
    workerThreads: false
  },
  images: {
    unoptimized: true
  },
  distDir: "dist",
  trailingSlash: true
};

export default nextConfig;
