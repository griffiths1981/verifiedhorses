import { requireUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format";
import { stripeConfigured } from "@/lib/config";
import { demoIdCheck, refreshIdCheck, startIdCheck } from "@/lib/actions/account";

export const metadata = { title: "Identity check" };

export default async function VerificationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const query = await searchParams;
  const stripe = stripeConfigured();
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Identity check</h1>
        <p>Status: <strong>{user.idStatus}</strong>{user.idVerifiedAt ? ` · verified ${formatDate(user.idVerifiedAt)}` : ""}</p>
        <p>The check is Stripe Identity. We keep the result and the date. Stripe keeps the document image. With no Stripe key, this staging site can mark the check as verified so you can try the rest of the flow. That button does not call Stripe.</p>
        {query.done ? <p className="ok" role="status">Identity marked verified in demo mode.</p> : null}
        <form action={startIdCheck}><button className="gold" type="submit">{stripe ? "Start Stripe Identity" : "How the check works"}</button></form>
        {!stripe ? <form action={demoIdCheck}><button type="submit">Mark as verified (demo only)</button></form> : <form action={refreshIdCheck}><button className="ghost" type="submit">Refresh status</button></form>}
      </div>
    </section>
  );
}
