import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/lib/legacy-routes";

// No environment access here on purpose: the build must succeed without any runtime settings.
// The /api/* proxy lives in src/proxy.ts so API_ORIGIN is read at runtime.
const nextConfig: NextConfig = {
  // Netlify builds with its own Next runtime, which does not want the standalone bundle used for the Docker image.
  output: process.env.NETLIFY ? undefined : "standalone",
  // Pin Turbopack to this project so a stray lockfile higher up the filesystem is never picked as the root.
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    // Legacy page URLs that moved (see docs/LEGACY_URLS.md). Permanent, and query strings are kept.
    return LEGACY_REDIRECTS.map(({ source, destination }) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
