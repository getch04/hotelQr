import type { NextConfig } from "next";
import path from "path";

const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Multiple lockfiles (backend + frontend) make Next infer the repo root as the
  // parent folder, so `@import "tailwindcss"` resolves from there and fails.
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
