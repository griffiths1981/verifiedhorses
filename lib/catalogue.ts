import { db } from "./prisma";
import { defaultFilters, matchesAdvert, paginate, sortMatches, type SearchFilters, type SearchableAdvert } from "./search";
import { lookupPlace } from "./places";

const include = { seller: true, videos: true, documents: true, photos: true } as const;

export function asSearchable(advert: {
  id: string;
  slug: string;
  type: string;
  breed: string;
  pricePence: number;
  ageYears: number;
  heightInches: number;
  suits: string;
  level: string;
  sex: string;
  county: string;
  region: string;
  town: string;
  outcode: string;
  lat: number;
  lng: number;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  seller: { idStatus: string };
  videos: { status: string }[];
}): SearchableAdvert {
  return {
    id: advert.id,
    slug: advert.slug,
    type: advert.type,
    breed: advert.breed,
    pricePence: advert.pricePence,
    ageYears: advert.ageYears,
    heightInches: advert.heightInches,
    suits: advert.suits,
    level: advert.level,
    sex: advert.sex,
    county: advert.county,
    region: advert.region,
    town: advert.town,
    outcode: advert.outcode,
    lat: advert.lat,
    lng: advert.lng,
    status: advert.status,
    sellerVerified: advert.seller.idStatus === "verified",
    hasVideo: advert.videos.some((video) => video.status === "ready" || video.status === "example"),
    featured: advert.featured,
    publishedAt: advert.publishedAt?.toISOString() || null,
  };
}

export async function searchCatalogue(filters: SearchFilters) {
  const prisma = await db();
  const rows = await prisma.advert.findMany({
    where: { status: filters.includeSold ? { in: ["live", "sold"] } : "live" },
    include,
    take: 400,
    orderBy: { publishedAt: "desc" },
  });
  const origin = filters.where ? lookupPlace(filters.where) : null;
  const pairs = rows.flatMap((advert) => {
    const scored = matchesAdvert(asSearchable(advert), filters, origin);
    return scored ? [{ row: advert, scored }] : [];
  });
  const sorted = sortMatches(pairs.map((pair) => pair.scored), filters.sort);
  const ordered = sorted.map((item) => {
    const pair = pairs.find((candidate) => candidate.row.id === item.advert.id);
    return { advert: pair!.row, miles: item.miles };
  });
  const page = paginate(ordered, filters.page);
  return { ...page, origin, filters };
}

export async function loadAdvert(slug: string) {
  const prisma = await db();
  return prisma.advert.findUnique({
    where: { slug },
    include: {
      seller: true,
      videos: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
      traits: true,
    },
  });
}

export function filtersFromRecord(record: Record<string, string | string[] | undefined>) {
  return defaultFilters(record);
}

export async function liveCount(county?: string, type?: string) {
  const prisma = await db();
  if (type === "cob") {
    const rows = await prisma.advert.findMany({
      where: { status: "live", ...(county ? { county } : {}) },
      select: { type: true, breed: true },
    });
    return rows.filter((row) => row.type === "cob" || /cob/i.test(row.breed)).length;
  }
  return prisma.advert.count({
    where: {
      status: "live",
      ...(county ? { county } : {}),
      ...(type ? { type } : {}),
    },
  });
}
