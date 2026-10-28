import type { NextConfig } from "next";

// Static security headers. The Content-Security-Policy is per-request (nonce based)
// and is set in src/proxy.ts.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Nonce-based CSP needs every page rendered per request, which Partial Prerendering
  // cannot do (the static shell would ship without the nonce).
  cacheComponents: false,
  partialPrefetching: false,
  poweredByHeader: false,
  // Native addon: load it from node_modules at runtime instead of bundling.
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
  },
  turbopack: {
    rules: {
      "*.css": {
        // CSS Modules keep Next's built-in handling; re-typing them as "*.css" would
        // turn them into global stylesheets and drop their class-name exports.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
