import { db } from "@/lib/prisma";
import { contentTypeFor, resolveUpload } from "@/lib/files";
import { fileResponse } from "@/lib/stream";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prisma = await db();
  const video = await prisma.video.findUnique({ where: { id }, include: { advert: true } });
  if (!video || (video.advert.status !== "live" && video.advert.status !== "sold" && video.advert.status !== "pending")) {
    return new Response("Not found", { status: 404 });
  }
  if (video.playbackPath.startsWith("http")) return Response.redirect(video.playbackPath);
  const file = resolveUpload(video.playbackPath);
  if (!file) return new Response("Not found", { status: 404 });
  return fileResponse(file, contentTypeFor(file), request);
}
