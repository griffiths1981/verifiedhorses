import { db } from "./prisma";

type Actor = { id?: string; type: "user" | "admin" | "bot" | "system" };

export async function audit(entry: {
  actor?: Actor;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
}) {
  const prisma = await db();
  await prisma.auditLog.create({
    data: {
      actorId: entry.actor?.id || "",
      actorType: entry.actor?.type || "system",
      action: entry.action,
      targetType: entry.targetType || "",
      targetId: entry.targetId || "",
      detail: entry.detail || "",
    },
  });
}

export async function recordEvent(type: string, payload: Record<string, unknown>) {
  const prisma = await db();
  const row = await prisma.botEvent.create({
    data: { type, payload: JSON.stringify(payload), status: "pending" },
  });
  await audit({ action: type, targetType: "event", targetId: row.id, detail: JSON.stringify(payload) });
  const url = process.env.BOT_WEBHOOK_URL;
  if (!url) return row;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-verifiedhorses-secret": process.env.BOT_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify({ id: row.id, type, payload }),
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      await prisma.botEvent.update({
        where: { id: row.id },
        data: { status: "delivered", deliveredAt: new Date() },
      });
    }
  } catch {
    // The cron job retries pending events.
  }
  return row;
}
