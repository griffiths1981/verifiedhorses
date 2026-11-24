import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";
import { db } from "@/lib/prisma";
import { counties, slugifyCounty } from "@/lib/places";
import { GUIDES } from "@/lib/guides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const prisma = await db();
  const adverts = await prisma.advert.findMany({ where: { status: { in: ["live", "sold"] } }, select: { slug: true, updatedAt: true } });
  const base = baseUrl();
  const staticPages = ["", "/horses", "/sell", "/auctions", "/advice", "/about", "/safety", "/welfare", "/services", "/contact", "/legal/terms", "/legal/privacy", "/legal/cookies", "/accessibility", ...GUIDES.map((guide) => `/advice/${guide.slug}`), ...counties().map((county) => `/horses-for-sale/${slugifyCounty(county)}`)];
  return [
    ...staticPages.map((path) => ({ url: `${base}${path || "/"}`, lastModified: new Date() })),
    ...adverts.map((advert) => ({ url: `${base}/horses/${advert.slug}`, lastModified: advert.updatedAt })),
  ];
}
