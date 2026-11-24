const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env") });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./data/dev.db";

async function main() {
  const esbuild = require("esbuild");
  fs.mkdirSync(path.join(root, "generated"), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(root, "prisma", "seed-entry.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: path.join(root, "generated", "seed.mjs"),
    external: [
      "better-sqlite3",
      "@prisma/adapter-better-sqlite3",
      "@prisma/adapter-mariadb",
      "mariadb",
      "@prisma/client",
    ],
    banner: {
      js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [path.join(root, "generated", "seed.mjs")], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
