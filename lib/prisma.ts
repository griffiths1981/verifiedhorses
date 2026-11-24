import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaUrl?: string };

function sqliteConfigUrl(url: string): string {
  const raw = url.replace(/^file:/, "");
  if (raw === ":memory:" || path.isAbsolute(raw)) return url.startsWith("file:") || raw === ":memory:" ? url : `file:${raw}`;
  return `file:${path.join(/* turbopackIgnore: true */ process.cwd(), raw)}`;
}

export async function db(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL || "file:./data/dev.db";
  if (globalForPrisma.prisma && globalForPrisma.prismaUrl === url) return globalForPrisma.prisma;
  const mysql = url.startsWith("mysql:") || url.startsWith("mariadb:");
  const adapter = mysql
    ? new (await import("@prisma/adapter-mariadb")).PrismaMariaDb(url)
    : new (await import("@prisma/adapter-better-sqlite3")).PrismaBetterSqlite3({ url: sqliteConfigUrl(url) });
  const client = new PrismaClient({ adapter });
  globalForPrisma.prisma = client;
  globalForPrisma.prismaUrl = url;
  return client;
}

export type DbClient = PrismaClient;
