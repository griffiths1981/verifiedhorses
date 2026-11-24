import { currentUser } from "./current-user";
import { db } from "./prisma";

export async function ownedAdvert(id: string) {
  const user = await currentUser();
  if (!user) return { error: "auth" as const };
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) return { error: "missing" as const };
  return { user, prisma, advert };
}
