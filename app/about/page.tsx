import { PLATFORM_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "How we verify" };

export default function AboutPage() {
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>How verification works</h1>
        <p>VerifiedHorses is a UK listings site for horses, ponies, youngstock, horseboxes and transport. It starts in the North and is built to be clearer than a crowded classifieds page.</p>
        <ol>
          <li>A seller confirms their email, then completes an identity check through Stripe Identity. We store the result and the date, not a copy of their passport.</li>
          <li>The seller pastes a YouTube or Vimeo link for each riding clip. The page shows a picture until you press play.</li>
          <li>Vetting reports, X-rays, the passport and the microchip can be added with a date. Buyers who are signed in can open the files the seller has chosen to share.</li>
          <li>Every new advert waits in a moderation queue before it goes live.</li>
        </ol>
        <p>{PLATFORM_DISCLAIMER}</p>
      </div>
    </section>
  );
}
