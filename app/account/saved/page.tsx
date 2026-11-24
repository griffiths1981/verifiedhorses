import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { AdvertCard } from "@/components/advert-card";

export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await requireUser();
  const prisma = await db();
  const [searches, saved] = await Promise.all([
    prisma.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.savedAdvert.findMany({
      where: { userId: user.id },
      include: { advert: { include: { seller: true, videos: true, documents: true } } },
    }),
  ]);
  return (
    <section className="section">
      <div className="wrap">
        <h1>Saved</h1>
        <h2>Searches</h2>
        <ul>{searches.map((search) => <li key={search.id}>{search.name} · alerts {search.alerts ? "on" : "off"}</li>)}</ul>
        <h2>Horses</h2>
        <div className="results">
          {saved.map((item) => <AdvertCard key={item.advertId} advert={item.advert} miles={null} />)}
        </div>
      </div>
    </section>
  );
}
