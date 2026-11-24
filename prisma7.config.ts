import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL || "file:./data/dev.db";
const mysql = databaseUrl.startsWith("mysql:") || databaseUrl.startsWith("mariadb:");

export default defineConfig({
  schema: mysql ? "prisma/schema.mysql.prisma" : "prisma/schema.prisma",
  migrations: {
    path: mysql ? "prisma/migrations-mysql" : "prisma/migrations",
  },
  datasource: {
    url: databaseUrl.startsWith("file:")
      ? databaseUrl
      : databaseUrl,
  },
});

void path;
