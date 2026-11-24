import { contactEmail, legalEntity } from "@/lib/config";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="section">
      <div className="wrap prose">
        <h1>Privacy notice</h1>
        <p>This notice explains how {legalEntity()} handles personal information under the UK GDPR and the Data Protection Act 2018. The contact for privacy questions is {contactEmail()}.</p>
        <h2>What we hold</h2>
        <ul>
          <li>Account: name, email, password hash, role, and the county or outcode you give us.</li>
          <li>Adverts, photos, videos, messages, saved searches and reports.</li>
          <li>Identity: the status and date of a Stripe Identity check, and Stripe's session reference. The identity document image stays with Stripe. We do not keep a copy of it.</li>
          <li>Payments: the amount, the advert, and Stripe's checkout reference. Card numbers are entered on Stripe's page, not on ours.</li>
          <li>Documents you upload, such as a vetting report. A microchip number is shown on the advert if you type it in.</li>
        </ul>
        <h2>Why</h2>
        <ul>
          <li>To run your account and publish the advert you asked for (contract).</li>
          <li>To take the advert fee and keep payment records (contract and legal obligation).</li>
          <li>To moderate scams and welfare reports, and to keep the site secure (legitimate interests).</li>
          <li>To send a saved-search email or a draft reminder you asked for. You can turn alerts off from the link in the email.</li>
        </ul>
        <h2>Who else sees it</h2>
        <p>Hosting is on the operator's Hostinger plan. Video files are encoded on a separate server the operator controls. Payments and identity checks are processed by Stripe. If email delivery is switched on, messages go through Brevo. Each of those parties acts as a processor or, for Stripe, as its own controller for some of the payment and identity data. We do not sell personal information.</p>
        <p>Stripe and an email provider may process data outside the UK. They describe their own safeguards in their terms. Ask us if you want the current list.</p>
        <h2>How long</h2>
        <ul>
          <li>Account data: for as long as the account is open, then deleted when you ask, except payment records kept for up to six years.</li>
          <li>Adverts and documents: removed when you delete the account or when we remove the advert. Sold pages can stay up without the private documents.</li>
          <li>Messages: up to 24 months, unless they are needed for a report.</li>
          <li>Identity session references: up to 12 months.</li>
          <li>Unused email confirmation links: a few days.</li>
        </ul>
        <h2>Your rights</h2>
        <p>You can ask for a copy of your data from the account page, ask us to correct it, or delete the account. You can also object to some uses, ask us to restrict them, and ask for data you provided in a portable file. You can complain to the Information Commissioner's Office (ico.org.uk). We will respond within one month in the usual case.</p>
        <h2>Children</h2>
        <p>Accounts are for adults. Do not open an account if you are under 18.</p>
      </div>
    </article>
  );
}
