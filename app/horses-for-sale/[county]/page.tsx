import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { countyFromSlug, countyIntro, slugifyCounty } from "@/lib/places";
import { liveCount, searchCatalogue } from "@/lib/catalogue";
import { defaultFilters } from "@/lib/search";
import { AdvertCard } from "@/components/advert-card";
import { TYPES } from "@/lib/constants";
import { indexingAllowed } from "@/lib/config";
import { shouldIndexLanding } from "@/lib/search";

export async function generateMetadata({ params }: { params: Promise<{ county: string }> }): Promise<Metadata> {
  const { county: slug } = await params;
  const county = countyFromSlug(slug);
  if (!county) return { title: "County" };
  const count = await liveCount(county);
  return {
    title: `Horses for sale in ${county}`,
    description: countyIntro(county).slice(0, 160),
    robots: shouldIndexLanding(count, indexingAllowed()) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CountyPage({ params }: { params: Promise<{ county: string }> }) {
  const { county: slug } = await params;
  const county = countyFromSlug(slug);
  if (!county) notFound();
  const result = await searchCatalogue({ ...defaultFilters({ county, verified: "1", video: "1" }), page: 1 });
  return (
    <section className="section">
      <div className="wrap">
        <h1>Horses for sale in {county}</h1>
        <p className="prose">{countyIntro(county)}</p>
        <div className="chips">
          {TYPES.map((type) => (
            <a key={type.slug} className="button ghost" href={`/horses-for-sale/${slugifyCounty(county)}/${type.slug === "horse" ? "horses" : type.slug}`}>{type.plural}</a>
          ))}
        </div>
        <div className="results">
          {result.pageItems.map((item) => <AdvertCard key={item.advert.id} advert={item.advert} miles={item.miles} />)}
        </div>
        {result.total === 0 ? <p>No live adverts in this county match the verified and video defaults yet.</p> : null}
      </div>
    </section>
  );
}
