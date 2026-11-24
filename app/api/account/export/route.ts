import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const prisma = await db();
  const [adverts, messages, searches, payments] = await Promise.all([
    prisma.advert.findMany({ where: { sellerId: user.id } }),
    prisma.message.findMany({ where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } }),
    prisma.savedSearch.findMany({ where: { userId: user.id } }),
    prisma.payment.findMany({ where: { userId: user.id } }),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sellerType: user.sellerType,
      county: user.county,
      createdAt: user.createdAt,
      idStatus: user.idStatus,
    },
    adverts,
    messages,
    searches,
    payments,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": "attachment; filename=verifiedhorses-export.json",
    },
  });
}
