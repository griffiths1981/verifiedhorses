import { PLATFORM_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Auctions coming soon" };

export default function AuctionsPage() {
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Auctions coming soon</h1>
        <p>Timed online auctions are not part of this version. When they open, every lot will need vetting documents, and a late bid will extend the finish so the last seconds are not a snatch.</p>
        <p>There is no bidding, no reserve and no countdown to join. The gold card on the home page is only a signpost.</p>
        <p>{PLATFORM_DISCLAIMER}</p>
        <p><a className="button gold" href="/horses">Browse adverts instead</a></p>
      </div>
    </section>
  );
}
