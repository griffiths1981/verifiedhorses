import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadAdvert, searchCatalogue } from "@/lib/catalogue";
import { defaultFilters } from "@/lib/search";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { advertHeading, seoTitle } from "@/lib/description";
import { formatAge, formatDate, formatHeight, formatMonthYear, formatPrice } from "@/lib/format";
import { DOC_KINDS, PLATFORM_DISCLAIMER, REPORT_REASONS, TRAITS, docLabel } from "@/lib/constants";
import { baseUrl } from "@/lib/config";
import { reportAdvert, sendEnquiry, toggleSave } from "@/lib/actions/enquiries";
import { AdvertCard } from "@/components/advert-card";
import { VideoFacade } from "@/components/video-facade";
import { embedStatusLabel, posterFor } from "@/lib/video-links";
import { CLIPS } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const advert = await loadAdvert(slug);
  if (!advert || (advert.status !== "live" && advert.status !== "sold")) return { title: "Advert" };
  const title = seoTitle({ ...advert, verified: advert.seller.idStatus === "verified" });
  return {
    title,
    description: advert.description.slice(0, 160),
  };
}

export default async function AdvertPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  const advert = await loadAdvert(slug);
  if (!advert) notFound();
  const user = await currentUser();
  const visible = advert.status === "live" || advert.status === "sold" || user?.role === "admin" || user?.id === advert.sellerId;
  if (!visible || advert.status === "removed") notFound();
  if (advert.status === "live") {
    const prisma = await db();
    await prisma.advert.update({ where: { id: advert.id }, data: { views: { increment: 1 } } });
  }
  const title = advertHeading(advert);
  const clips = [...advert.videos].sort((a, b) => {
    const order = CLIPS.map(([key]) => key);
    return order.indexOf(a.clipKey as (typeof CLIPS)[number][0]) - order.indexOf(b.clipKey as (typeof CLIPS)[number][0]);
  });
  const lead = clips.find((video) => video.remoteId) || clips[0];
  const similar = await searchCatalogue({ ...defaultFilters({ type: advert.type === "cob" ? "cob" : advert.type }), page: 1 });
  const share = `${baseUrl()}/horses/${advert.slug}`;
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: advert.description.slice(0, 400),
    category: advert.type,
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: (advert.pricePence / 100).toFixed(2),
      availability: advert.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };
  return (
    <article className="section with-message">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product).replace(/</g, "\\u003c") }} />
      <div className="wrap">
        <p className="muted"><a href="/horses">Horses</a> · {advert.county} · {advert.town}</p>
        {advert.isDemo ? <p className="example">Example advert. This horse, seller and price are made up for the staging site. Nothing here is for sale.</p> : null}
        {query.reported ? <p className="ok" role="status">Report received. A person reviews welfare and scam reports.</p> : null}
        {query.error ? <p className="alert" role="alert">Please write a short message before sending, and use your own account rather than the seller's.</p> : null}
        <div className="grid-2">
          <div>
            <h1>{title}</h1>
            {lead?.remoteId ? (
              <VideoFacade provider={lead.provider} videoId={lead.remoteId} poster={posterFor(lead)} title={`${advert.horseName || "Advert"} ${lead.clipKey || "video"}`} />
            ) : (
              <div className="video-frame"><p>This advert has no video link yet.</p></div>
            )}
            <p className="muted">Gallery · Video first · The player loads when you press play. Nothing starts on its own.</p>
            {clips.length ? (
              <ul className="plain-list">
                {clips.map((video) => (
                  <li key={video.id}>
                    <strong>{CLIPS.find(([key]) => key === video.clipKey)?.[1] || "Clip"}</strong>
                    {video.playbackPath ? <> · <a href={video.playbackPath}>{video.provider === "vimeo" ? "Vimeo" : "YouTube"}</a></> : null}
                    {video.embedStatus !== "ok" && video.embedStatus !== "unchecked" ? <span className="tag warn">{embedStatusLabel(video.embedStatus)}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {advert.photos.length ? (
              <div className="row">
                {advert.photos.map((photo) => (
                  <img key={photo.id} src={`/api/media/photos/${photo.id}`} alt={photo.alt || "Horse photo"} width={160} height={120} />
                ))}
              </div>
            ) : null}
            <p className="facts">
              {formatHeight(advert.heightInches) ? <span>{formatHeight(advert.heightInches)}</span> : null}
              {advert.ageYears || advert.ageMonths ? <span>{formatAge(advert.ageYears, advert.ageMonths)}</span> : null}
              {advert.sex ? <span>{advert.sex}</span> : null}
              {advert.colour ? <span>{advert.colour}</span> : null}
              {advert.breed ? <span>{advert.breed}</span> : null}
              {advert.suits ? <span>Suits: {advert.suits}</span> : null}
            </p>
            <h2>Documents</h2>
            <ul className="doc-list">
              {DOC_KINDS.map(([kind, label]) => {
                const doc = advert.documents.find((item) => item.kind === kind);
                if (!doc) return <li key={kind}>{label}: not added</li>;
                return (
                  <li key={kind}>
                    {label}
                    {doc.issuedOn ? ` · ${formatDate(doc.issuedOn)}` : ""}
                    {doc.microchip ? ` · microchip ${doc.microchip}` : ""}
                    {doc.storagePath ? <> · <a href={`/api/media/documents/${doc.id}`}>View file</a></> : " · date supplied by the seller"}
                  </li>
                );
              })}
            </ul>
            <h2>Good to…</h2>
            <div className="good-grid">
              {TRAITS.map(([key, label]) => {
                const trait = advert.traits.find((item) => item.key === key);
                const value = trait?.value === "yes" ? "Yes" : trait?.value === "no" ? "No" : "Not stated";
                return <div key={key}><strong>{label}</strong><br />{value}</div>;
              })}
            </div>
            <h2>Description</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{advert.description}</p>
            <h2>Buy safely</h2>
            <ul className="safe">
              <li>See the horse in person. A video is a start, not a viewing.</li>
              <li>Book your own vet. A vetting date on this page is the seller's paperwork, not our check.</li>
              <li>Do not send a deposit to someone you have not met, and do not move the conversation off the site for the first reply.</li>
              <li>{PLATFORM_DISCLAIMER}</li>
            </ul>
            <form className="stack" action={reportAdvert}>
              <input type="hidden" name="slug" value={advert.slug} />
              <label>Report this advert
                <select name="reason">{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              </label>
              <label>Details<textarea name="details" /></label>
              <button className="ghost" type="submit">Report</button>
            </form>
            <p className="row">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${share}`)}`}>WhatsApp</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share)}`}>Facebook</a>
            </p>
          </div>
          <aside className="panel price-panel stack">
            <p className="price">{formatPrice(advert.pricePence)}</p>
            {advert.status === "sold" ? <p className="tag sold">Sold {formatMonthYear(advert.soldAt)}</p> : null}
            {advert.showSoldPrice && advert.soldPricePence ? <p>Sold price shared by the seller: {formatPrice(advert.soldPricePence)}</p> : null}
            <p>{advert.seller.idStatus === "verified" ? <span className="verified">ID verified seller{advert.seller.idVerifiedAt ? ` · ${formatDate(advert.seller.idVerifiedAt)}` : ""}</span> : "Seller has not completed an identity check"}</p>
            <p className="muted">{advert.seller.name} · member since {formatDate(advert.seller.createdAt)} · {advert.town}</p>
            {advert.seller.tradeUntil && advert.seller.tradeUntil > new Date() ? <p className="tag">Trade seller</p> : null}
            <p className="muted">Price check: not enough comparable sold adverts yet. We will show a range once 10 similar horses have sold here.</p>
            {advert.status === "live" ? (
              <form className="stack" action={sendEnquiry} id="message">
                <input type="hidden" name="slug" value={advert.slug} />
                <label>Message the seller<textarea name="body" required minLength={10} placeholder="Ask about the video, the vetting, and a time to visit." /></label>
                <button className="gold wide message-button" type="submit">Message seller</button>
              </form>
            ) : null}
            <form action={toggleSave}><input type="hidden" name="slug" value={advert.slug} /><button className="ghost wide" type="submit">Save</button></form>
          </aside>
        </div>
        <h2>Similar adverts</h2>
        <div className="results">
          {similar.pageItems.filter((item) => item.advert.id !== advert.id).slice(0, 3).map((item) => (
            <AdvertCard key={item.advert.id} advert={item.advert} miles={item.miles} />
          ))}
        </div>
      </div>
      {advert.status === "live" ? (
        <div className="mobile-bar">
          <a className="button gold wide" href="#message">Message seller</a>
        </div>
      ) : null}
    </article>
  );
}
