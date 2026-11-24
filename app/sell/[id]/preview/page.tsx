import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { tiersForAdvert } from "@/lib/pricing";
import { stripeConfigured } from "@/lib/config";
import { saveTierAndPay } from "@/lib/actions/sell";
import { confirmCheckoutSession, listingsAreFree } from "@/lib/payments";
import { SellProgress } from "@/components/sell-progress";
import { PLATFORM_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Preview and pay" };

export default async function PreviewStep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  if (query.session_id) await confirmCheckoutSession(query.session_id);
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { videos: true, documents: true } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) notFound();
  const tiers = await prisma.pricingTier.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const allowed = new Set(tiersForAdvert(advert.type));
  const choices = tiers.filter((tier) => allowed.has(tier.slug));
  const free = await listingsAreFree();
  const errors: Record<string, string> = {
    honest: "Tick the box to confirm the advert is accurate.",
    identity: "Complete the identity check before submitting.",
    video: "Add a video before submitting.",
    description: "Add a description of at least a short paragraph.",
    place: "Add a town we can place on the map.",
    price: "Add the price of the horse.",
    use_stripe: "Stripe is configured, so use the Stripe button.",
  };
  return (
    <section className="section">
      <div className="wrap prose">
        <SellProgress id={id} step={4} />
        <h1>Preview</h1>
        {query.submitted ? <p className="ok" role="status">Submitted for review. It is not public until it is approved.</p> : null}
        {query.error ? <p className="alert" role="alert">{errors[query.error] || "The payment could not be completed."}</p> : null}
        <p><a href={`/horses/${advert.slug}`}>Open the preview as a buyer would see it</a></p>
        <ul>
          <li>Identity: {user.idStatus}</li>
          <li>Videos: {advert.videos.length}</li>
          <li>Documents: {advert.documents.length}</li>
          <li>Status: {advert.status}</li>
        </ul>
        <p>{PLATFORM_DISCLAIMER}</p>
        <form className="stack" action={saveTierAndPay}>
          <input type="hidden" name="id" value={id} />
          <fieldset>
            <legend>Advert fee</legend>
            {choices.map((tier) => (
              <label key={tier.slug} className="row">
                <input type="radio" name="tier" value={tier.slug} defaultChecked={tier.slug === advert.tierSlug} />
                {tier.name} · {free && tier.kind !== "monthly" ? "£0 while listings are free" : formatPrice(tier.pricePence)}
              </label>
            ))}
          </fieldset>
          <label className="row"><input type="checkbox" name="honest" /> I confirm this advert is accurate, I have the right to sell, and I understand VerifiedHorses is not a party to the sale.</label>
          {stripeConfigured() ? <button className="gold" name="intent" value="stripe" type="submit">Pay with Stripe and submit</button> : <button className="gold" name="intent" value="demo" type="submit">Submit with a demo payment</button>}
        </form>
      </div>
    </section>
  );
}
