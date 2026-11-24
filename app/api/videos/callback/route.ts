import { db } from "@/lib/prisma";
import { safeEqual } from "@/lib/tokens";

export async function POST(request: Request) {
  const expected = process.env.VIDEO_CALLBACK_SECRET || "";
  const presented = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!expected || !safeEqual(presented, expected)) return Response.json({ error: "unauthorised" }, { status: 401 });
  const body = (await request.json()) as { id?: string; status?: string; playbackUrl?: string; posterUrl?: string; durationSec?: number };
  if (!body.id) return Response.json({ error: "id" }, { status: 400 });
  const prisma = await db();
  await prisma.video.updateMany({
    where: { remoteId: body.id },
    data: {
      status: body.status === "ready" ? "ready" : body.status === "failed" ? "failed" : "processing",
      playbackPath: body.playbackUrl || undefined,
      posterPath: body.posterUrl || undefined,
      durationSec: body.durationSec || undefined,
    },
  });
  return Response.json({ ok: true });
}
