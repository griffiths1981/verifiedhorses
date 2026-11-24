import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();
  const prisma = await db();
  const threads = await prisma.thread.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: { advert: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <section className="section">
      <div className="wrap">
        <h1>Messages</h1>
        <p>Messages are email-style. There is no live chat, which suits the hosting limits.</p>
        {threads.length === 0 ? <p>No messages yet.</p> : null}
        <ul className="plain-list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <a href={`/account/messages/${thread.id}`}><strong>{thread.advert.horseName || "Advert"}</strong></a>
              <br />{thread.messages[0]?.redacted || thread.messages[0]?.body || "No message"} · {formatDate(thread.messages[0]?.createdAt)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
