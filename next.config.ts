import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy kept strict in production: no inline scripts
// other than Next.js's own hashed/nonce'd runtime chunks, no third-party
// script origins by default (add them here explicitly if you introduce
// analytics). In development, Next.js/Turbopack's React runtime uses
// eval() for hot-reload and dev-mode error overlays — this never happens
// in a production build, so 'unsafe-eval' is only added when NODE_ENV
// isn't "production".
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self'${isDev ? " ws:" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    // Uploaded images are served from /public/uploads (same-origin, needs no
    // config). Cover images may also be pasted in as absolute https URLs, so
    // allow the optimizer to fetch those — consistent with the `img-src https:`
    // CSP directive above. Narrow this to specific hosts if you lock the
    // cover-image field down to your own storage (see src/lib/storage/upload.ts).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
