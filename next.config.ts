import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The image optimiser fetches sources itself, so it drops preview basic
  // auth and broken images appear behind the staging gate. Serve files directly.
  images: { unoptimized: true },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-mariadb",
    "better-sqlite3",
    "mariadb",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
