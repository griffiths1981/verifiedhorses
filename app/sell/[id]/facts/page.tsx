import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { COLOURS, LEVELS, SEXES, SUITS, TRAITS, TYPES } from "@/lib/constants";
import { formatHeight } from "@/lib/format";
import { saveFacts } from "@/lib/actions/sell";
import { SellProgress } from "@/components/sell-progress";

export const metadata = { title: "Horse details" };

export default async function FactsStep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { traits: true } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) notFound();
  const errors: Record<string, string> = {
    place: "Use a UK outcode or town we recognise, such as YO7 or Thirsk.",
    price: "Enter the price in pounds.",
  };
  const hands = advert.heightInches ? formatHeight(advert.heightInches).replace("hh", "") : "";
  return (
    <section className="section">
      <div className="wrap prose">
        <SellProgress id={id} step={2} />
        <h1>The horse</h1>
        {query.error ? <p className="alert" role="alert">{errors[query.error]}</p> : null}
        {query.saved ? <p className="ok" role="status">Saved.</p> : null}
        <form className="stack" action={saveFacts}>
          <input type="hidden" name="id" value={id} />
          <label>Type<select name="type" defaultValue={advert.type}>{TYPES.map((type) => <option key={type.slug} value={type.slug}>{type.label}</option>)}</select></label>
          <label>Name<input name="horseName" defaultValue={advert.horseName} /></label>
          <label>Breed<input name="breed" defaultValue={advert.breed} /></label>
          <label>Colour<select name="colour" defaultValue={advert.colour}><option value="">Not set</option>{COLOURS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Sex<select name="sex" defaultValue={advert.sex}><option value="">Not set</option>{SEXES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Height (hands)<input name="height" defaultValue={hands} placeholder="15.2" /></label>
          <label>Age in years<input name="ageYears" defaultValue={advert.ageYears || ""} inputMode="numeric" /></label>
          <label>Extra months<input name="ageMonths" defaultValue={advert.ageMonths || ""} inputMode="numeric" /></label>
          <label>Level<select name="level" defaultValue={advert.level}><option value="">Not set</option>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <fieldset>
            <legend>Suits</legend>
            {SUITS.map((item) => (
              <label key={item} className="row"><input type="checkbox" name="suits" value={item} defaultChecked={advert.suits.includes(item)} /> {item}</label>
            ))}
          </fieldset>
          <label>Price (£)<input name="price" defaultValue={advert.pricePence ? String(advert.pricePence / 100) : ""} inputMode="decimal" required /></label>
          <label className="row"><input type="checkbox" name="negotiable" defaultChecked={advert.negotiable} /> Price is negotiable</label>
          <label>Postcode or town<input name="postcode" defaultValue={advert.postcode || advert.town} required /></label>
          <fieldset>
            <legend>Good to…</legend>
            {TRAITS.map(([key, label]) => {
              const current = advert.traits.find((trait) => trait.key === key)?.value || "";
              return (
                <label key={key}>{label}
                  <select name={`trait_${key}`} defaultValue={current}>
                    <option value="">Not stated</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </label>
              );
            })}
          </fieldset>
          <label>Description<textarea name="description" defaultValue={advert.description} /></label>
          <button className="ghost" name="intent" value="draft-text" type="submit">Draft a description from these facts</button>
          <button className="ghost" name="intent" value="stay" type="submit">Save draft</button>
          <button className="gold" name="intent" value="next" type="submit">Save and continue</button>
        </form>
      </div>
    </section>
  );
}
