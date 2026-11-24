import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./prisma";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.bannedAt) return null;
  return user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
