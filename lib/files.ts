import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export type Sniffed = "jpeg" | "png" | "webp" | "pdf" | "mp4" | "webm" | "unknown";

export function sniff(buf: Buffer): Sniffed {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  if (buf.length >= 12 && buf.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  return "unknown";
}

const EXT: Record<Sniffed, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  pdf: "pdf",
  mp4: "mp4",
  webm: "webm",
  unknown: "bin",
};

export function saveUpload(kind: string, buf: Buffer, sniffed: Sniffed): string {
  const id = randomBytes(12).toString("hex");
  const relative = path.join(/* turbopackIgnore: true */ kind, `${id}.${EXT[sniffed]}`);
  const full = path.join(UPLOAD_ROOT, relative);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buf);
  return relative;
}

export function resolveUpload(stored: string): string | null {
  if (!stored || stored.includes("..") || stored.startsWith("http")) return null;
  const root = path.resolve(UPLOAD_ROOT);
  const full = path.resolve(root, stored);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  if (!fs.existsSync(full)) return null;
  return full;
}

export function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp4") return "video/mp4";
  return "application/octet-stream";
}
