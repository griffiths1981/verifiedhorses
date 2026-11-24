import { requireAdmin } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { adminFreeListings, adminPrice } from "@/lib/actions/admin";

export const metadata = { title: "Prices", robots: { index: false, follow: false } };

export default async function PricingAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const query = await searchParams;
  const prisma = await db();
  const tiers = await prisma.pricingTier.findMany({ orderBy: { sortOrder: "asc" } });
  const free = await prisma.setting.findUnique({ where: { key: "listings_free" } });
  return (
    <section className="section">
      <div className="wrap">
        <h1>Advert prices</h1>
        <p>Steve sets these. The seeded figures are placeholders. HorseQuest, for reference, charges £38 and £48 for 6 weeks.</p>
        {query.saved ? <p className="ok" role="status">Saved.</p> : null}
        <form action={adminFreeListings} className="panel">
          <label className="row"><input type="checkbox" name="listings_free" defaultChecked={free?.value === "true"} /> Make new private adverts free (trade fee still applies)</label>
          <button type="submit">Save offer</button>
        </form>
        {tiers.map((tier) => (
          <form key={tier.slug} className="panel stack" action={adminPrice}>
            <h2>{tier.name}</h2>
            <input type="hidden" name="slug" value={tier.slug} />
            <label>Price in pounds<input name="price" defaultValue={(tier.pricePence / 100).toFixed(2)} /></label>
            <label>Description<textarea name="description" defaultValue={tier.description} /></label>
            <label className="row"><input type="checkbox" name="active" defaultChecked={tier.active} /> On sale</label>
            <button type="submit">Save {tier.slug}</button>
          </form>
        ))}
      </div>
    </section>
  );
}
