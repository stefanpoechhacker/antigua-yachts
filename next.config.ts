import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "photos.marinetraffic.com" },
      { protocol: "https", hostname: "www.marinetraffic.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://unpkg.com",
              "img-src 'self' data: blob: https://*.cartocdn.com https://*.openstreetmap.org https://photos.marinetraffic.com https://www.marinetraffic.com https://images.unsplash.com",
              "connect-src 'self' wss://stream.aisstream.io https://stream.aisstream.io",
              "font-src 'self' data:",
              "frame-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
