import { requireUser } from "@/lib/current-user";
import { startAdvert } from "@/lib/actions/sell";
import { TYPES } from "@/lib/constants";
import { SellProgress } from "@/components/sell-progress";

export const metadata = { title: "Sell a horse" };

export default async function SellPage() {
  const user = await requireUser();
  return (
    <section className="section">
      <div className="wrap prose">
        <SellProgress step={0} />
        <h1>Sell a horse</h1>
        <p>Five short steps: who you are, a video, the facts, the papers, then a preview and the fee. You can leave and come back. The draft stays on your account.</p>
        <p>Signed in as {user.name}. Identity: {user.idStatus}. You will need a verified identity before the advert can be submitted.</p>
        <form className="stack" action={startAdvert}>
          <label>What are you advertising?
            <select name="type">{TYPES.map((type) => <option key={type.slug} value={type.slug}>{type.label}</option>)}</select>
          </label>
          <button className="gold" type="submit">Start the advert</button>
        </form>
      </div>
    </section>
  );
}
