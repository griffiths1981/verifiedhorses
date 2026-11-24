import { milesBetween, type Place } from "./places";

export type SearchFilters = {
  type: string;
  breed: string;
  where: string;
  radius: number;
  budgetMin: number | null;
  budgetMax: number | null;
  ageMin: number | null;
  ageMax: number | null;
  heightMin: number | null;
  heightMax: number | null;
  suits: string;
  level: string;
  sex: string;
  county: string;
  region: string;
  verified: boolean;
  video: boolean;
  includeSold: boolean;
  sort: "nearest" | "newest" | "price_asc" | "price_desc";
  page: number;
};

export type SearchableAdvert = {
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
  sellerVerified: boolean;
  hasVideo: boolean;
  featured: boolean;
  publishedAt: string | null;
};

export type ScoredAdvert = {
  advert: SearchableAdvert;
  miles: number | null;
};

const PAGE_SIZE = 12;

export function defaultFilters(input: Record<string, string | string[] | undefined> = {}): SearchFilters {
  const one = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const flag = (key: string, fallback: boolean) => {
    const value = one(key);
    if (value === undefined || value === "") return fallback;
    return value === "1" || value === "true" || value === "on";
  };
  const money = (key: string) => {
    const value = one(key);
    if (!value) return null;
    const pounds = Number(value);
    if (!Number.isFinite(pounds) || pounds < 0) return null;
    return Math.round(pounds * 100);
  };
  const num = (key: string) => {
    const value = one(key);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const sort = one("sort");
  const where = one("where") || "";
  return {
    type: one("type") || "",
    breed: one("breed") || "",
    where,
    radius: num("radius") ?? 30,
    budgetMin: money("budgetMin"),
    budgetMax: money("budgetMax") ?? money("budget"),
    ageMin: num("ageMin"),
    ageMax: num("ageMax"),
    heightMin: num("heightMin"),
    heightMax: num("heightMax"),
    suits: one("suits") || "",
    level: one("level") || "",
    sex: one("sex") || "",
    county: one("county") || "",
    region: one("region") || "",
    verified: flag("verified", true),
    video: flag("video", true),
    includeSold: flag("sold", false),
    sort: sort === "nearest" || sort === "price_asc" || sort === "price_desc" || sort === "newest" ? sort : where ? "nearest" : "newest",
    page: Math.max(1, Number(one("page") || 1) || 1),
  };
}

export function matchesAdvert(advert: SearchableAdvert, filters: SearchFilters, origin: Place | null): ScoredAdvert | null {
  if (advert.status !== "live" && !(filters.includeSold && advert.status === "sold")) return null;
  if (filters.verified && !advert.sellerVerified) return null;
  if (filters.video && !advert.hasVideo) return null;
  if (filters.type && !typeMatches(advert, filters.type)) return null;
  if (filters.breed && !advert.breed.toLowerCase().includes(filters.breed.toLowerCase())) return null;
  if (filters.county && advert.county.toLowerCase() !== filters.county.toLowerCase()) return null;
  if (filters.region && advert.region.toLowerCase() !== filters.region.toLowerCase()) return null;
  if (filters.sex && advert.sex.toLowerCase() !== filters.sex.toLowerCase()) return null;
  if (filters.level && advert.level.toLowerCase() !== filters.level.toLowerCase()) return null;
  if (filters.suits && !advert.suits.toLowerCase().includes(filters.suits.toLowerCase())) return null;
  if (filters.budgetMin !== null && advert.pricePence < filters.budgetMin) return null;
  if (filters.budgetMax !== null && advert.pricePence > filters.budgetMax) return null;
  if (filters.ageMin !== null && advert.ageYears < filters.ageMin) return null;
  if (filters.ageMax !== null && advert.ageYears > filters.ageMax) return null;
  if (filters.heightMin !== null && advert.heightInches && advert.heightInches < filters.heightMin) return null;
  if (filters.heightMax !== null && advert.heightInches && advert.heightInches > filters.heightMax) return null;
  let miles: number | null = null;
  if (origin && advert.lat && advert.lng) {
    miles = milesBetween(origin.lat, origin.lng, advert.lat, advert.lng);
    if (filters.where && miles > filters.radius) return null;
  } else if (filters.where && origin && (!advert.lat || !advert.lng)) {
    return null;
  }
  return { advert, miles };
}

function typeMatches(advert: SearchableAdvert, type: string): boolean {
  if (type === "cob") return advert.type === "cob" || /cob/i.test(advert.breed);
  return advert.type === type;
}

export function sortMatches(rows: ScoredAdvert[], sort: SearchFilters["sort"]): ScoredAdvert[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (a.advert.featured !== b.advert.featured) return a.advert.featured ? -1 : 1;
    if (sort === "price_asc") return a.advert.pricePence - b.advert.pricePence;
    if (sort === "price_desc") return b.advert.pricePence - a.advert.pricePence;
    if (sort === "nearest") {
      const am = a.miles ?? 9999;
      const bm = b.miles ?? 9999;
      if (am !== bm) return am - bm;
    }
    const at = a.advert.publishedAt || "";
    const bt = b.advert.publishedAt || "";
    return bt.localeCompare(at);
  });
  return copy;
}

export function paginate<T>(rows: T[], page: number): { pageItems: T[]; pages: number; page: number; total: number } {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safe = Math.min(Math.max(1, page), pages);
  const start = (safe - 1) * PAGE_SIZE;
  return { pageItems: rows.slice(start, start + PAGE_SIZE), pages, page: safe, total: rows.length };
}

export const SEARCH_PAGE_SIZE = PAGE_SIZE;

export function shouldIndexLanding(liveCount: number, indexingAllowed: boolean): boolean {
  return indexingAllowed && liveCount >= 3;
}
