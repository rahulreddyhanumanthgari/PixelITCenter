import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Test builds can use a separate folder (NEXT_DIST_DIR=.next-test) so they
  // never clash with a running `npm run dev`, which uses .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      // Hero shaders live in real .glsl files and are imported as strings.
      "*.glsl": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
