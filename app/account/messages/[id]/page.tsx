import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { replyToThread } from "@/lib/actions/enquiries";

export const metadata = { title: "Message" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const prisma = await db();
  const thread = await prisma.thread.findUnique({
    where: { id },
    include: { advert: true, messages: { orderBy: { createdAt: "asc" }, include: { fromUser: true } } },
  });
  if (!thread || (thread.buyerId !== user.id && thread.sellerId !== user.id && user.role !== "admin")) notFound();
  await prisma.message.updateMany({ where: { threadId: id, toUserId: user.id, readAt: null }, data: { readAt: new Date() } });
  return (
    <section className="section">
      <div className="wrap prose">
        <p><a href={`/horses/${thread.advert.slug}`}>{thread.advert.horseName || "Advert"}</a></p>
        <h1>Messages</h1>
        {thread.messages.map((message) => {
          const showOriginal = message.fromUserId === user.id || user.role === "admin";
          return (
            <article key={message.id} className="panel">
              <p><strong>{message.fromUser.name}</strong> · {formatDate(message.createdAt)}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{showOriginal ? message.body : message.redacted || message.body}</p>
              {message.flagged && user.role === "admin" ? <p className="tag warn">Flagged: {message.scamFlags}</p> : null}
              {message.flagged && message.fromUserId === user.id ? <p className="muted">Some contact details or payment wording were hidden from the other person.</p> : null}
            </article>
          );
        })}
        <form className="stack" action={replyToThread}>
          <input type="hidden" name="threadId" value={thread.id} />
          <label>Reply<textarea name="body" required /></label>
          <button className="gold" type="submit">Send reply</button>
        </form>
      </div>
    </section>
  );
}
