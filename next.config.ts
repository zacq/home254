import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Netlify exposes the production URL as URL at build time.
  env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "" },
  images: { formats: ["image/avif", "image/webp"] },
  // netlify.toml headers do not reach SSR responses, so they are set here.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
