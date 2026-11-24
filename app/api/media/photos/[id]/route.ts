import { db } from "@/lib/prisma";
import { contentTypeFor, resolveUpload } from "@/lib/files";
import { fileResponse } from "@/lib/stream";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prisma = await db();
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return new Response("Not found", { status: 404 });
  const file = resolveUpload(photo.path);
  if (!file) return new Response("Not found", { status: 404 });
  return fileResponse(file, contentTypeFor(file), request);
}
