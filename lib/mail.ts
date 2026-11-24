import { db } from "./prisma";

export async function enqueueEmail(input: { to: string; subject: string; body: string; kind: string }) {
  const prisma = await db();
  return prisma.outboxEmail.create({
    data: {
      toEmail: input.to,
      subject: input.subject,
      body: input.body,
      kind: input.kind,
      status: "queued",
    },
  });
}

export async function deliverQueued(limit = 25): Promise<{ sent: number; logged: number; failed: number }> {
  const prisma = await db();
  const rows = await prisma.outboxEmail.findMany({ where: { status: "queued" }, orderBy: { createdAt: "asc" }, take: limit });
  const totals = { sent: 0, logged: 0, failed: 0 };
  for (const row of rows) {
    const status = await deliverOne(row.toEmail, row.subject, row.body);
    totals[status] += 1;
    await prisma.outboxEmail.update({
      where: { id: row.id },
      data: { status, sentAt: new Date() },
    });
  }
  return totals;
}

async function deliverOne(to: string, subject: string, body: string): Promise<"sent" | "logged" | "failed"> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.log(`[email logged] to ${to}: ${subject}`);
    return "logged";
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: process.env.MAIL_FROM || "hello@verifiedhorses.example", name: "VerifiedHorses" },
        to: [{ email: to }],
        subject,
        textContent: body,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch (error) {
    console.error("Email send failed", error);
    return "failed";
  }
}
