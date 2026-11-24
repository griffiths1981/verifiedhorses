import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { stripeConfigured } from "@/lib/config";
import { buyTradeDemo } from "@/lib/actions/account";
import { createCheckout } from "@/lib/payments";
import { redirect } from "next/navigation";

async function startTradeCheckout() {
  "use server";
  const { currentUser } = await import("@/lib/current-user");
  const user = await currentUser();
  if (!user) redirect("/login");
  const result = await createCheckout({ userId: user.id, email: user.email, tierSlug: "trade" });
  if (result.ok && result.mode === "stripe" && result.url) redirect(result.url);
  redirect("/account/billing?error=demo");
}

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireUser();
  const prisma = await db();
  const payments = await prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const trade = await prisma.pricingTier.findUnique({ where: { slug: "trade" } });
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Billing</h1>
        <p>These are fees for using the site. They are not the price of a horse, and we never hold a buyer's money.</p>
        {user.tradeUntil ? <p>Trade badge until {formatDate(user.tradeUntil)}.</p> : <p>No trade subscription.</p>}
        {trade ? <p>Trade placeholder: {formatPrice(trade.pricePence)} a month. {trade.description}</p> : null}
        {stripeConfigured() ? (
          <form action={startTradeCheckout}><button className="gold" type="submit">Pay the trade fee with Stripe</button></form>
        ) : (
          <form action={buyTradeDemo}><button type="submit">Record a demo trade payment</button></form>
        )}
        <h2>Payments</h2>
        <ul>
          {payments.map((payment) => (
            <li key={payment.id}>{formatDate(payment.createdAt)} · {payment.tierSlug} · {formatPrice(payment.amountPence)} · {payment.status} · {payment.provider}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
