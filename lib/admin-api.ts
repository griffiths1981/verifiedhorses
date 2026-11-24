import { db } from "./prisma";
import { safeEqual } from "./tokens";
import { approveAdvert, banUser, rejectAdvert, removeAdvert, resolveReport } from "./moderation";

function authorised(authorization: string | null): boolean {
  const token = process.env.ADMIN_API_TOKEN || "";
  const presented = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token || !presented) return false;
  return safeEqual(presented, token);
}

const actor = { type: "bot" as const, id: "bot" };

export async function handleAdmin(method: string, segments: string[], body: Record<string, unknown>, authorization: string | null) {
  if (!authorised(authorization)) return { status: 401, json: { error: "unauthorised" } };
  const prisma = await db();
  const [a, b, c] = segments;

  if (method === "GET" && a === "queue") {
    const [pendingAdverts, openReports, flaggedMessages] = await Promise.all([
      prisma.advert.findMany({ where: { status: "pending" }, include: { seller: true }, orderBy: { updatedAt: "asc" }, take: 50 }),
      prisma.report.findMany({ where: { status: "open" }, orderBy: { createdAt: "asc" }, take: 50 }),
      prisma.message.findMany({ where: { flagged: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    return { status: 200, json: { pendingAdverts, openReports, flaggedMessages } };
  }

  if (method === "GET" && a === "events") {
    const status = typeof body.status === "string" ? body.status : "pending";
    const events = await prisma.botEvent.findMany({ where: { status }, orderBy: { createdAt: "asc" }, take: 100 });
    return { status: 200, json: { events } };
  }

  if (method === "POST" && a === "events" && b && c === "ack") {
    await prisma.botEvent.update({ where: { id: b }, data: { status: "delivered", deliveredAt: new Date() } }).catch(() => null);
    return { status: 200, json: { ok: true } };
  }

  if (method === "POST" && a === "adverts" && b && c === "approve") return jsonResult(await approveAdvert(b, actor));
  if (method === "POST" && a === "adverts" && b && c === "reject") return jsonResult(await rejectAdvert(b, String(body.note || ""), actor));
  if (method === "POST" && a === "adverts" && b && c === "remove") return jsonResult(await removeAdvert(b, String(body.note || ""), actor));
  if (method === "POST" && a === "users" && b && c === "ban") return jsonResult(await banUser(b, String(body.note || ""), actor));
  if (method === "POST" && a === "reports" && b) {
    const status = body.status === "dismissed" ? "dismissed" : "actioned";
    return jsonResult(await resolveReport(b, status, String(body.note || ""), actor));
  }

  if (method === "GET" && a === "audit") {
    const audit = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return { status: 200, json: { audit } };
  }

  if (method === "GET" && a === "pricing") {
    const tiers = await prisma.pricingTier.findMany({ orderBy: { sortOrder: "asc" } });
    const settings = await prisma.setting.findMany();
    return { status: 200, json: { tiers, settings } };
  }

  if (method === "PUT" && a === "pricing" && b) {
    const pricePence = Number(body.pricePence);
    if (!Number.isInteger(pricePence) || pricePence < 0 || pricePence > 1000000) {
      return { status: 400, json: { error: "price" } };
    }
    const tier = await prisma.pricingTier.update({
      where: { slug: b },
      data: {
        pricePence,
        active: body.active === undefined ? undefined : body.active === true || body.active === "true" || body.active === 1,
        name: typeof body.name === "string" ? body.name.slice(0, 80) : undefined,
        description: typeof body.description === "string" ? body.description.slice(0, 1000) : undefined,
      },
    });
    return { status: 200, json: { tier } };
  }

  return { status: 404, json: { error: "not_found" } };
}

function jsonResult(result: { ok: boolean; error?: string }) {
  if (!result.ok) return { status: result.error === "not_found" ? 404 : 400, json: result };
  return { status: 200, json: result };
}
