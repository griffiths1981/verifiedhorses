import type { MetadataRoute } from "next";
import { baseUrl, indexingAllowed } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/sell"] }],
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
