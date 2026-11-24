import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { deleteAccount, logoutAction } from "@/lib/actions/account";
import { markSold } from "@/lib/actions/sell";

export const metadata = { title: "Your account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const query = await searchParams;
  const prisma = await db();
  const adverts = await prisma.advert.findMany({ where: { sellerId: user.id }, orderBy: { updatedAt: "desc" } });
  return (
    <section className="section">
      <div className="wrap">
        <h1>Hello, {user.name}</h1>
        {query.deleted ? null : null}
        <p>{user.email} · {user.role} · identity: {user.idStatus}{user.idVerifiedAt ? ` on ${formatDate(user.idVerifiedAt)}` : ""}</p>
        <p className="row">
          <a className="button" href="/account/verification">Identity check</a>
          <a className="button ghost" href="/account/messages">Messages</a>
          <a className="button ghost" href="/account/saved">Saved</a>
          <a className="button ghost" href="/account/billing">Billing</a>
          <a className="button ghost" href="/api/account/export">Download my data</a>
        </p>
        <h2>Your adverts</h2>
        {adverts.length === 0 ? <p>You have no adverts yet. <a href="/sell">Start one</a>.</p> : null}
        <div className="stack">
          {adverts.map((advert) => (
            <article key={advert.id} className="panel">
              <h3>{advert.horseName || advert.slug}</h3>
              <p>{advert.status} · {formatPrice(advert.pricePence)} · {advert.views} views</p>
              <p className="row">
                <a href={`/horses/${advert.slug}`}>View</a>
                <a href={`/sell/${advert.id}/video`}>Edit</a>
              </p>
              {advert.status === "live" ? (
                <form className="stack" action={markSold}>
                  <input type="hidden" name="id" value={advert.id} />
                  <label>Sold price, optional (£)<input name="soldPrice" inputMode="decimal" /></label>
                  <label className="row"><input type="checkbox" name="showPrice" /> Show the sold price on the page</label>
                  <button type="submit">Mark as sold</button>
                </form>
              ) : null}
              {advert.tierSlug === "plus" && advert.socialCaption ? <p>Social caption: {advert.socialCaption}</p> : null}
            </article>
          ))}
        </div>
        <form action={logoutAction}><button className="ghost" type="submit">Sign out</button></form>
        {user.role !== "admin" ? (
          <form action={deleteAccount} className="panel stack">
            <h2>Delete account</h2>
            <p>This removes your account, adverts, documents and messages. Type delete to confirm.</p>
            <input name="confirm" aria-label="Type delete" />
            <button type="submit">Delete my account</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
