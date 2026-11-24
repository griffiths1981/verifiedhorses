import { markPaid } from "@/lib/payments";
import { submitAdvert } from "@/lib/moderation";
import { db } from "@/lib/prisma";
import { recordEvent } from "@/lib/events";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return Response.json({ error: "stripe not configured" }, { status: 400 });
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(key);
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature") || "", secret);
  } catch {
    return Response.json({ error: "bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const userId = session.metadata?.userId || "";
      const advertId = session.metadata?.advertId || "";
      const tierSlug = session.metadata?.tierSlug || "standard";
      await markPaid({
        userId,
        advertId: advertId || null,
        tierSlug,
        amountPence: session.amount_total || 0,
        provider: "stripe",
        checkoutRef: session.id,
      });
      if (advertId) await submitAdvert(advertId, userId);
    }
  }
  if (event.type === "identity.verification_session.verified" || event.type === "identity.verification_session.requires_input") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId) {
      const prisma = await db();
      const status = event.type.endsWith("verified") ? "verified" : "requires_input";
      await prisma.user.update({
        where: { id: userId },
        data: { idStatus: status, idVerifiedAt: status === "verified" ? new Date() : undefined, idSessionId: session.id },
      });
      await recordEvent("identity.updated", { userId, status });
    }
  }
  return Response.json({ received: true });
}
