import { PLATFORM_DISCLAIMER } from "@/lib/constants";
import { contactEmail, legalEntity } from "@/lib/config";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="section">
      <div className="wrap prose legal">
        <h1>Terms of use</h1>
        <p>These terms are written in plain English for people using VerifiedHorses. They are the rules of the site. They are not a tailored legal opinion on your own sale.</p>
        <h2>The service</h2>
        <p>{PLATFORM_DISCLAIMER}</p>
        <p>The contract for a horse, pony, horsebox or transport job is between the buyer and the seller. {legalEntity()} provides the pages, the accounts, the identity check and the moderation queue. We do not own the horses, we do not collect the purchase price, and we do not hold deposits for buyers.</p>
        <h2>Accounts</h2>
        <p>You must give a real email address and confirm it. You are responsible for what is done with your password. We can suspend an account that is used for scams, abuse, or unlawful content.</p>
        <h2>Sellers</h2>
        <p>If you sell, you confirm that you have the right to sell, that the video and photos are of the animal or vehicle in the advert, and that the description is honest about age, height, temperament, vices and veterinary history you know about. Trade sellers must say they are trading. Horses in the UK generally need a passport and a microchip: prompt for them, and do not invent the paperwork.</p>
        <p>New adverts are checked before they go live. We can refuse, edit nothing and ask you to rewrite, or remove an advert. Marking an advert sold keeps the page up as a sold page.</p>
        <h2>Buyers</h2>
        <p>You should view in person and arrange your own vetting. A badge on an advert is information the seller supplied, or the result of an identity check. It is not a warranty.</p>
        <h2>Fees</h2>
        <p>Sellers pay the advert fee shown at checkout. Prices are set by the operator and can change for new adverts. Card fees charged by Stripe are part of paying that fee. We do not take a cut of the horse's sale price in this version. There is no escrow and no “protected payment”.</p>
        <h2>Messages and reports</h2>
        <p>Use the message thread for the first contact. We may hide contact details in a first message and flag wording that looks like a deposit scam. Reports are kept so there is a record of what was done. Serious welfare cases may be passed to the RSPCA or World Horse Welfare by the operator.</p>
        <h2>Liability</h2>
        <p>The site is provided with reasonable care, but we do not accept liability for a horse's soundness, a seller's honesty, a journey, or a loss that the law allows us to exclude. Nothing in these terms limits liability for death or personal injury caused by negligence, or for fraud, where the law does not allow that.</p>
        <h2>Law</h2>
        <p>These terms are governed by the law of England and Wales. Contact {contactEmail()} about an account or an advert.</p>
      </div>
    </article>
  );
}
