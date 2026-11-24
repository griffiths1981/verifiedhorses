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
    // Hostinger's build box reports dozens of CPUs but caps processes/threads,
    // so 58 page-data workers fail with "OS can't spawn worker thread".
    cpus: 2,
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
