import fs from "node:fs";
import { Readable } from "node:stream";

export function fileResponse(file: string, type: string, request: Request, downloadName?: string) {
  const stat = fs.statSync(file);
  const headers = new Headers({
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  if (downloadName) headers.set("Content-Disposition", `inline; filename="${downloadName.replace(/"/g, "")}"`);
  const range = request.headers.get("range");
  const match = range && /bytes=(\d+)-(\d*)/.exec(range);
  if (match) {
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : Math.min(stat.size - 1, start + 1024 * 1024 - 1);
    if (start >= stat.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    headers.set("Content-Length", String(end - start + 1));
    headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream, { status: 206, headers });
  }
  headers.set("Content-Length", String(stat.size));
  return new Response(Readable.toWeb(fs.createReadStream(file)) as ReadableStream, { status: 200, headers });
}
