import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas', 'canvas'],
};

export default nextConfig;
