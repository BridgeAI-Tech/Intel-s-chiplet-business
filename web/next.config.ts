import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Ship the read-only database snapshot with the server functions.
  outputFileTracingIncludes: { "/**": ["./data/chiplet.db"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
