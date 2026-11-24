import { requireAdmin } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Email outbox", robots: { index: false, follow: false } };

export default async function OutboxPage() {
  await requireAdmin();
  const prisma = await db();
  const rows = await prisma.outboxEmail.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <section className="section">
      <div className="wrap">
        <h1>Email outbox</h1>
        <p>When Brevo is not configured, messages stay here with the status “logged” after the cron job runs, or “queued” until then.</p>
        {rows.map((row) => (
          <article key={row.id} className="panel">
            <p>{formatDate(row.createdAt)} · {row.status} · {row.kind} · {row.toEmail}</p>
            <h2>{row.subject}</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>{row.body}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}
