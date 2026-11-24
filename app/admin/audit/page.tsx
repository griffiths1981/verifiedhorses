import { requireAdmin } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Audit log", robots: { index: false, follow: false } };

export default async function AuditPage() {
  await requireAdmin();
  const prisma = await db();
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <section className="section">
      <div className="wrap">
        <h1>Audit log</h1>
        <ul>
          {rows.map((row) => (
            <li key={row.id}>{formatDate(row.createdAt)} · {row.actorType} · {row.action} · {row.targetType} {row.targetId}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
