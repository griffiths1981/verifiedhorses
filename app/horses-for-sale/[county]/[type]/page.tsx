import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { countyFromSlug, countyIntro } from "@/lib/places";
import { liveCount, searchCatalogue } from "@/lib/catalogue";
import { defaultFilters } from "@/lib/search";
import { AdvertCard } from "@/components/advert-card";
import { typePlural } from "@/lib/constants";
import { indexingAllowed } from "@/lib/config";
import { shouldIndexLanding } from "@/lib/search";

const TYPE_SLUGS: Record<string, string> = {
  horses: "horse",
  ponies: "pony",
  cobs: "cob",
  youngstock: "youngstock",
  horseboxes: "horsebox",
  transport: "transport",
  horse: "horse",
  pony: "pony",
  cob: "cob",
  horsebox: "horsebox",
};

export async function generateMetadata({ params }: { params: Promise<{ county: string; type: string }> }): Promise<Metadata> {
  const { county: countySlug, type } = await params;
  const county = countyFromSlug(countySlug);
  const kind = TYPE_SLUGS[type];
  if (!county || !kind) return { title: "Listings" };
  const count = await liveCount(county, kind);
  const label = typePlural(kind);
  return {
    title: `${label} for sale in ${county}`,
    description: `${label} for sale in ${county}. ${countyIntro(county)}`.slice(0, 160),
    robots: shouldIndexLanding(count, indexingAllowed()) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CountyTypePage({ params }: { params: Promise<{ county: string; type: string }> }) {
  const { county: countySlug, type } = await params;
  const county = countyFromSlug(countySlug);
  const kind = TYPE_SLUGS[type];
  if (!county || !kind) notFound();
  const result = await searchCatalogue({ ...defaultFilters({ county, type: kind }), page: 1 });
  return (
    <section className="section">
      <div className="wrap">
        <p className="muted"><a href={`/horses-for-sale/${countySlug}`}>{county}</a></p>
        <h1>{typePlural(kind)} for sale in {county}</h1>
        <p className="prose">{countyIntro(county)} This page is only for {typePlural(kind).toLowerCase()}.</p>
        <div className="results">
          {result.pageItems.map((item) => <AdvertCard key={item.advert.id} advert={item.advert} miles={item.miles} />)}
        </div>
        {result.total === 0 ? <p>None of these match the default filters yet. <a href={`/horses?county=${encodeURIComponent(county)}&type=${kind}&verified=0&video=0`}>Widen the search</a>.</p> : null}
      </div>
    </section>
  );
}
