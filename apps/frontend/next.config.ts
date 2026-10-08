import type { NextConfig } from "next";
import { DESIGN_COOKIE } from "./lib/design";

const nextConfig: NextConfig = {
  // Test builds can use a separate folder (NEXT_DIST_DIR=.next-test) so they
  // never clash with a running `npm run dev`, which uses .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Each version has its own root layout (app/(dark), app/(light)), so
    // the 404 page can't borrow one: app/global-not-found.tsx is used instead.
    globalNotFound: true,
  },
  async rewrites() {
    return {
      // The Dark / Light switch: "/" serves the light version when the
      // visitor chose it (lib/design.ts). Both pages stay prerendered.
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "cookie", key: DESIGN_COOKIE, value: "light" }],
          destination: "/light",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
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
