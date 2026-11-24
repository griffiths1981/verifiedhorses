import { db } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { contentTypeFor, resolveUpload } from "@/lib/files";
import { fileResponse } from "@/lib/stream";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Sign in to view this document", { status: 401 });
  const { id } = await context.params;
  const prisma = await db();
  const document = await prisma.document.findUnique({ where: { id }, include: { advert: true } });
  if (!document || !document.storagePath) return new Response("Not found", { status: 404 });
  const isStaff = user.role === "admin" || user.id === document.advert.sellerId;
  if (!isStaff && document.visibility === "on_request") {
    const thread = await prisma.thread.findFirst({ where: { advertId: document.advertId, buyerId: user.id } });
    if (!thread) return new Response("The seller has not shared this file with you yet", { status: 403 });
  }
  const file = resolveUpload(document.storagePath);
  if (!file) return new Response("Not found", { status: 404 });
  return fileResponse(file, contentTypeFor(file), request, document.filename || "document");
}
