import { requireAdmin } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { adminApprove, adminBan, adminClearDemo, adminReject, adminRemove, adminReport } from "@/lib/actions/admin";
import { embedStatusLabel } from "@/lib/video-links";
import { CLIPS } from "@/lib/constants";

export const metadata = { title: "Moderation", robots: { index: false, follow: false } };

export default async function AdminPage() {
  await requireAdmin();
  const prisma = await db();
  const [pending, flaggedVideos, reports, flagged] = await Promise.all([
    prisma.advert.findMany({ where: { status: "pending" }, include: { seller: true, videos: true }, orderBy: { updatedAt: "asc" } }),
    prisma.video.findMany({
      where: { embedStatus: { in: ["unavailable", "private", "embed_disabled"] } },
      include: { advert: true },
      orderBy: { checkedAt: "desc" },
      take: 30,
    }),
    prisma.report.findMany({ where: { status: "open" }, include: { advert: true }, orderBy: { createdAt: "asc" } }),
    prisma.message.findMany({ where: { flagged: true }, orderBy: { createdAt: "desc" }, take: 20, include: { fromUser: true } }),
  ]);
  return (
    <section className="section">
      <div className="wrap">
        <h1>Moderation</h1>
        <p className="row">
          <a href="/admin/pricing">Prices</a>
          <a href="/admin/audit">Audit log</a>
          <a href="/admin/outbox">Email outbox</a>
        </p>
        <form action={adminClearDemo}><button className="ghost" type="submit">Remove example data</button></form>
        <h2>Waiting for review</h2>
        {pending.map((advert) => (
          <article key={advert.id} className="panel">
            <h3>{advert.horseName || advert.slug}</h3>
            <p>{advert.seller.name} · {advert.seller.email} · {advert.isDemo ? "example" : "real"}</p>
            <p><a href={`/horses/${advert.slug}`}>Open</a></p>
            <ul>
              {advert.videos.map((video) => (
                <li key={video.id}>
                  {CLIPS.find(([key]) => key === video.clipKey)?.[1] || "Clip"}:{" "}
                  <a href={video.playbackPath || video.sourceUrl}>{video.playbackPath || video.sourceUrl || video.remoteId}</a>
                  {video.embedStatus !== "ok" && video.embedStatus !== "unchecked" ? ` · ${embedStatusLabel(video.embedStatus)}` : ""}
                </li>
              ))}
            </ul>
            <form action={adminApprove}><input type="hidden" name="id" value={advert.id} /><button type="submit">Approve</button></form>
            <form action={adminReject} className="stack"><input type="hidden" name="id" value={advert.id} /><input name="note" placeholder="What needs changing" /><button className="ghost" type="submit">Reject</button></form>
          </article>
        ))}
        <h2>Video problems</h2>
        {flaggedVideos.length === 0 ? <p>No private, missing or non-embeddable videos.</p> : null}
        {flaggedVideos.map((video) => (
          <article key={video.id} className="panel">
            <p>{video.advert.horseName || video.advert.slug} · {embedStatusLabel(video.embedStatus)}</p>
            <p><a href={video.playbackPath || video.sourceUrl}>{video.playbackPath || video.sourceUrl}</a></p>
          </article>
        ))}
        <h2>Reports</h2>
        {reports.map((report) => (
          <article key={report.id} className="panel">
            <p>{report.reason} · {formatDate(report.createdAt)} · {report.advert?.horseName}</p>
            <p>{report.details}</p>
            <form action={adminReport}><input type="hidden" name="id" value={report.id} /><input type="hidden" name="status" value="actioned" /><button type="submit">Mark actioned</button></form>
            <form action={adminReport}><input type="hidden" name="id" value={report.id} /><input type="hidden" name="status" value="dismissed" /><button className="ghost" type="submit">Dismiss</button></form>
            {report.advert ? (
              <form action={adminRemove}><input type="hidden" name="id" value={report.advert.id} /><input type="hidden" name="note" value="Removed after a report" /><button className="ghost" type="submit">Remove advert</button></form>
            ) : null}
          </article>
        ))}
        <h2>Flagged messages</h2>
        {flagged.map((message) => (
          <article key={message.id} className="panel">
            <p>{message.fromUser.name} · {message.scamFlags}</p>
            <p>{message.body}</p>
            <form action={adminBan}><input type="hidden" name="id" value={message.fromUserId} /><input type="hidden" name="note" value="Banned from a flagged message" /><button className="ghost" type="submit">Ban sender</button></form>
          </article>
        ))}
      </div>
    </section>
  );
}
