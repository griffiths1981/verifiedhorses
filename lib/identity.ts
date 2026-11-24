import { db } from "./prisma";
import { recordEvent } from "./events";
import { baseUrl, stripeConfigured } from "./config";

export async function startIdentity(userId: string) {
  if (!stripeConfigured()) return { mode: "demo" as const };
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { userId },
    return_url: `${baseUrl()}/account/verification`,
  });
  const prisma = await db();
  await prisma.user.update({
    where: { id: userId },
    data: { idStatus: "pending", idSessionId: session.id },
  });
  await recordEvent("identity.updated", { userId, status: "pending" });
  return { mode: "stripe" as const, url: session.url };
}

export async function demoVerify(userId: string) {
  if (stripeConfigured()) return { ok: false as const, error: "use_stripe" };
  const prisma = await db();
  await prisma.user.update({
    where: { id: userId },
    data: { idStatus: "verified", idVerifiedAt: new Date() },
  });
  await recordEvent("identity.updated", { userId, status: "verified", mode: "demo" });
  return { ok: true as const };
}

export async function refreshIdentity(userId: string) {
  if (!stripeConfigured()) return { ok: false as const, error: "demo" };
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.idSessionId) return { ok: false as const, error: "none" };
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const session = await stripe.identity.verificationSessions.retrieve(user.idSessionId);
  const status = session.status === "verified" ? "verified" : session.status === "requires_input" ? "requires_input" : "pending";
  await prisma.user.update({
    where: { id: userId },
    data: {
      idStatus: status,
      idVerifiedAt: status === "verified" ? user.idVerifiedAt ?? new Date() : user.idVerifiedAt,
    },
  });
  await recordEvent("identity.updated", { userId, status });
  return { ok: true as const, status };
}
