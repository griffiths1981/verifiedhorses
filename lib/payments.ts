import { db } from "./prisma";
import { audit } from "./events";
import { baseUrl, stripeConfigured } from "./config";
import { submitAdvert } from "./moderation";

export async function listingsAreFree(): Promise<boolean> {
  const prisma = await db();
  const setting = await prisma.setting.findUnique({ where: { key: "listings_free" } });
  return setting?.value === "true";
}

export async function priceForTier(slug: string, kind: "advert" | "trade"): Promise<{ pricePence: number; name: string; kind: string } | null> {
  const prisma = await db();
  const tier = await prisma.pricingTier.findUnique({ where: { slug } });
  if (!tier || !tier.active) return null;
  const free = await listingsAreFree();
  const pricePence = free && kind === "advert" && tier.kind !== "monthly" ? 0 : tier.pricePence;
  return { pricePence, name: tier.name, kind: tier.kind };
}

export async function markPaid(input: {
  userId: string;
  advertId?: string | null;
  tierSlug: string;
  amountPence: number;
  provider: "stripe" | "demo";
  checkoutRef: string;
}) {
  const prisma = await db();
  const existing = input.checkoutRef
    ? await prisma.payment.findFirst({ where: { checkoutRef: input.checkoutRef, status: "paid" } })
    : null;
  if (existing) return existing;
  const payment = await prisma.payment.create({
    data: {
      userId: input.userId,
      advertId: input.advertId || null,
      tierSlug: input.tierSlug,
      amountPence: input.amountPence,
      status: "paid",
      provider: input.provider,
      checkoutRef: input.checkoutRef,
      paidAt: new Date(),
    },
  });
  if (input.tierSlug === "trade") {
    const until = new Date();
    until.setUTCDate(until.getUTCDate() + 30);
    await prisma.user.update({ where: { id: input.userId }, data: { tradeUntil: until, sellerType: "dealer" } });
  }
  if (input.advertId) {
    await prisma.advert.update({
      where: { id: input.advertId },
      data: {
        paidAt: new Date(),
        tierSlug: input.tierSlug,
        featured: input.tierSlug === "plus",
      },
    });
  }
  await audit({
    actor: { id: input.userId, type: "user" },
    action: "payment.paid",
    targetType: "payment",
    targetId: payment.id,
    detail: `${input.provider} ${input.amountPence}`,
  });
  return payment;
}

export async function demoPayAdvert(userId: string, advertId: string, tierSlug: string) {
  if (stripeConfigured()) return { ok: false as const, error: "use_stripe" };
  const price = await priceForTier(tierSlug, "advert");
  if (!price) return { ok: false as const, error: "tier" };
  await markPaid({
    userId,
    advertId,
    tierSlug,
    amountPence: price.pricePence,
    provider: "demo",
    checkoutRef: `demo-${advertId}-${Date.now()}`,
  });
  return submitAdvert(advertId, userId);
}

export async function demoPayTrade(userId: string) {
  if (stripeConfigured()) return { ok: false as const, error: "use_stripe" };
  const price = await priceForTier("trade", "trade");
  if (!price) return { ok: false as const, error: "tier" };
  await markPaid({
    userId,
    tierSlug: "trade",
    amountPence: price.pricePence,
    provider: "demo",
    checkoutRef: `demo-trade-${userId}-${Date.now()}`,
  });
  return { ok: true as const };
}

export async function createCheckout(input: { userId: string; email: string; tierSlug: string; advertId?: string }) {
  const kind = input.tierSlug === "trade" ? "trade" : "advert";
  const price = await priceForTier(input.tierSlug, kind);
  if (!price) return { ok: false as const, error: "tier" };
  if (price.pricePence === 0 && input.advertId) {
    await markPaid({
      userId: input.userId,
      advertId: input.advertId,
      tierSlug: input.tierSlug,
      amountPence: 0,
      provider: "demo",
      checkoutRef: `free-${input.advertId}`,
    });
    const submitted = await submitAdvert(input.advertId, input.userId);
    return { ok: true as const, mode: "free" as const, submitted };
  }
  if (!stripeConfigured()) return { ok: true as const, mode: "demo" as const, price };
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const success = input.advertId
    ? `${baseUrl()}/sell/${input.advertId}/preview?paid=1&session_id={CHECKOUT_SESSION_ID}`
    : `${baseUrl()}/account/billing?paid=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = input.advertId ? `${baseUrl()}/sell/${input.advertId}/preview?cancelled=1` : `${baseUrl()}/account/billing?cancelled=1`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: price.pricePence,
          product_data: { name: `VerifiedHorses: ${price.name}` },
        },
      },
    ],
    success_url: success,
    cancel_url: cancel,
    metadata: {
      userId: input.userId,
      advertId: input.advertId || "",
      tierSlug: input.tierSlug,
    },
  });
  const prisma = await db();
  await prisma.payment.create({
    data: {
      userId: input.userId,
      advertId: input.advertId || null,
      tierSlug: input.tierSlug,
      amountPence: price.pricePence,
      status: "pending",
      provider: "stripe",
      checkoutRef: session.id,
    },
  });
  return { ok: true as const, mode: "stripe" as const, url: session.url };
}

export async function confirmCheckoutSession(sessionId: string) {
  if (!sessionId || !stripeConfigured()) return { ok: false as const, error: "no_stripe" };
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { ok: false as const, error: "unpaid" };
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
  return { ok: true as const };
}
