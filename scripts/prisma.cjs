const { spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env") });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./data/dev.db";

const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
