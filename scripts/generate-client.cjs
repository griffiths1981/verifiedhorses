const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
process.chdir(root);

require("dotenv").config({ path: path.join(root, ".env") });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./data/dev.db";

require("./sync-mysql-schema.cjs");

const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
if (!fs.existsSync(prismaCli)) {
  console.log("Prisma CLI is not installed yet. Skipping generate.");
  process.exit(0);
}

fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.mkdirSync(path.join(root, "generated"), { recursive: true });

const result = spawnSync(process.execPath, [prismaCli, "generate"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
