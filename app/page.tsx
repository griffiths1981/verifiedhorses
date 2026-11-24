import { searchCatalogue } from "@/lib/catalogue";
import { defaultFilters } from "@/lib/search";
import { AdvertCard } from "@/components/advert-card";
import { SUITS, TYPES } from "@/lib/constants";
import { NORTHERN_COUNTIES, slugifyCounty } from "@/lib/places";

export default async function HomePage() {
  const result = await searchCatalogue({ ...defaultFilters({ where: "YO1", radius: "60" }), page: 1 });
  const cards = result.pageItems.filter((item) => ["horse", "pony", "cob"].includes(item.advert.type)).slice(0, 2);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>Buy a horse you can trust.</h1>
          <p>Every seller ID-checked. Every advert with video. Proudly northern.</p>
          <form className="search-bar" action="/horses">
            <label>Type
              <select name="type" defaultValue="">
                <option value="">Any</option>
                {TYPES.map((type) => <option key={type.slug} value={type.slug}>{type.label}</option>)}
              </select>
            </label>
            <label>Where
              <input name="where" defaultValue="YO1" aria-label="Postcode or town" />
            </label>
            <label>Budget
              <input name="budget" inputMode="numeric" placeholder="£ max" />
            </label>
            <label>Suits
              <select name="suits" defaultValue="">
                <option value="">Any</option>
                {SUITS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <input type="hidden" name="radius" value="30" />
            <input type="hidden" name="verified" value="1" />
            <input type="hidden" name="video" value="1" />
            <button className="gold" type="submit">Search</button>
          </form>
          <div className="chips">
            <span className="chip">ID-verified sellers</span>
            <span className="chip">Video on every advert</span>
            <span className="chip">Vetting documents</span>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="example">These horses are example data, made up so you can try the staging site. They are not for sale.</div>
          <div className="section-head">
            <h2>Fresh near you · North Yorkshire</h2>
            <a href="/horses?where=YO1&radius=60">See all</a>
          </div>
          <div className="grid-3">
            {cards.map((item) => <AdvertCard key={item.advert.id} advert={item.advert} miles={item.miles} />)}
            <a className="card" href="/auctions">
              <div className="poster gold" />
              <div className="card-body">
                <p className="price">Auctions</p>
                <p>Coming soon. Timed sales with vetting papers on every lot, once there is enough stock.</p>
              </div>
            </a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <h2>Browse by type</h2>
          <div className="chips">
            {TYPES.map((type) => (
              <a key={type.slug} className="button ghost" href={`/horses?type=${type.slug}`}>{type.plural}</a>
            ))}
          </div>
          <h2>Counties</h2>
          <div className="county-grid">
            {NORTHERN_COUNTIES.map((county) => (
              <a key={county} className="panel" href={`/horses-for-sale/${slugifyCounty(county)}`}>{county}</a>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap steps">
          <article className="panel"><h2>1. Seller ID</h2><p>The seller confirms who they are with Stripe Identity. The badge shows the date.</p></article>
          <article className="panel"><h2>2. Video and papers</h2><p>The advert leads with riding clips. Vetting, X-rays, passport and microchip sit underneath, with dates.</p></article>
          <article className="panel"><h2>3. You decide</h2><p>Watch, read, then see the horse and book your own vet. We are not part of the sale.</p></article>
        </div>
        <div className="wrap" style={{ marginTop: 20 }}>
          <a className="button gold" href="/sell">Sell your horse</a>
        </div>
      </section>
    </>
  );
}
