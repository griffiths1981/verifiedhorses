import { searchCatalogue } from "@/lib/catalogue";
import { defaultFilters } from "@/lib/search";
import { AdvertCard } from "@/components/advert-card";
import { LEVELS, SEXES, SUITS, TYPES } from "@/lib/constants";
import { saveSearch } from "@/lib/actions/enquiries";

export const metadata = { title: "Horses for sale" };

export default async function HorsesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = defaultFilters(params);
  const result = await searchCatalogue(filters);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && key !== "page") query.set(key, value);
  }
  const back = `/horses?${query.toString()}`;
  return (
    <section className="section">
      <div className="wrap layout">
        <form className="panel filters stack" action="/horses">
          <h1 style={{ fontSize: "1.6rem" }}>Search</h1>
          <label>Type<select name="type" defaultValue={filters.type}><option value="">Any</option>{TYPES.map((type) => <option key={type.slug} value={type.slug}>{type.label}</option>)}</select></label>
          <label>Where<input name="where" defaultValue={filters.where} placeholder="YO7 or Thirsk" /></label>
          <label>Radius (miles)<input name="radius" defaultValue={String(filters.radius)} inputMode="numeric" /></label>
          <label>Budget max (£)<input name="budget" defaultValue={filters.budgetMax ? String(filters.budgetMax / 100) : ""} inputMode="numeric" /></label>
          <label>Suits<select name="suits" defaultValue={filters.suits}><option value="">Any</option>{SUITS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Sex<select name="sex" defaultValue={filters.sex}><option value="">Any</option>{SEXES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Level<select name="level" defaultValue={filters.level}><option value="">Any</option>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Breed contains<input name="breed" defaultValue={filters.breed} /></label>
          <label>Age from<input name="ageMin" defaultValue={filters.ageMin ?? ""} inputMode="numeric" /></label>
          <label>Age to<input name="ageMax" defaultValue={filters.ageMax ?? ""} inputMode="numeric" /></label>
          <label>ID-verified sellers
            <select name="verified" defaultValue={filters.verified ? "1" : "0"}>
              <option value="1">Yes, the default</option>
              <option value="0">Show unchecked sellers too</option>
            </select>
          </label>
          <label>Video
            <select name="video" defaultValue={filters.video ? "1" : "0"}>
              <option value="1">Must have video</option>
              <option value="0">Include adverts without video</option>
            </select>
          </label>
          <label>Sold adverts
            <select name="sold" defaultValue={filters.includeSold ? "1" : "0"}>
              <option value="0">Hide sold</option>
              <option value="1">Include sold</option>
            </select>
          </label>
          <label>Sort
            <select name="sort" defaultValue={filters.sort}>
              <option value="newest">Newest</option>
              <option value="nearest">Nearest</option>
              <option value="price_asc">Price, low to high</option>
              <option value="price_desc">Price, high to low</option>
            </select>
          </label>
          <button className="gold" type="submit">Show horses</button>
          <p className="muted">Verified sellers and video are on unless you untick them. A hidden field keeps an unticked box as off.</p>
        </form>
        <div>
          <div className="section-head">
            <h2>{result.total} {result.total === 1 ? "advert" : "adverts"}</h2>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <a className="tag" href={toggle(back, "verified", filters.verified)}>Verified: {filters.verified ? "on" : "off"}</a>
            <a className="tag" href={toggle(back, "video", filters.video)}>Video: {filters.video ? "on" : "off"}</a>
          </div>
          {result.total === 0 ? (
            <div className="notice">
              <h2>Nothing matches yet</h2>
              <p>Widen the radius, raise the budget, or turn off the verified and video filters. You can also save the search and we will email you when something appears.</p>
            </div>
          ) : (
            <div className="results">
              {result.pageItems.map((item) => <AdvertCard key={item.advert.id} advert={item.advert} miles={item.miles} />)}
            </div>
          )}
          <p className="row">
            {result.page > 1 ? <a href={`${back}&page=${result.page - 1}`}>Previous</a> : null}
            <span>Page {result.page} of {result.pages}</span>
            {result.page < result.pages ? <a href={`${back}&page=${result.page + 1}`}>Next</a> : null}
          </p>
          <form className="panel stack" action={saveSearch}>
            <h2>Alert me</h2>
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="filters" value={JSON.stringify(Object.fromEntries(query))} />
            <label>Name this search<input name="name" defaultValue={filters.where ? `Near ${filters.where}` : "My search"} /></label>
            <label className="row"><input type="checkbox" name="alerts" defaultChecked /> Email me about new matches</label>
            <button type="submit">Save search</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function toggle(back: string, key: string, currentlyOn: boolean) {
  const url = new URL(back, "http://local");
  url.searchParams.set(key, currentlyOn ? "0" : "1");
  return `${url.pathname}?${url.searchParams.toString()}`;
}
