import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-lib"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "vwixmyfjmuznlwbnonox.supabase.co",
      },
      {
        protocol: "https",
        hostname: "sdtbdlalwwdqqpctmgiy.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://api.midtrans.com https://app.midtrans.com https://app.sandbox.midtrans.com wss://*.supabase.co",
              "frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
