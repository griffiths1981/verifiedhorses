const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "prisma", "schema.prisma");
const targetPath = path.join(root, "prisma", "schema.mysql.prisma");
const source = fs.readFileSync(sourcePath, "utf8");
if (!/provider\s*=\s*"sqlite"/.test(source)) {
  console.error("schema.prisma must use the sqlite provider. The MySQL copy is generated.");
  process.exit(1);
}

// SQLite has no varchar/text native types. MySQL stores unmarked String
// fields as varchar(191), which is too small for descriptions and messages.
const longFields = new Set([
  "User.bio",
  "Advert.description",
  "Advert.socialCaption",
  "Advert.rejectionNote",
  "Message.body",
  "Message.redacted",
  "Report.details",
  "SavedSearch.filters",
  "PricingTier.description",
  "AuditLog.detail",
  "OutboxEmail.body",
  "BotEvent.payload",
  "Setting.value",
  "Video.sourceUrl",
]);

let model = "";
const mysqlLines = source.replace(/provider\s*=\s*"sqlite"/, 'provider = "mysql"').split("\n").map((line) => {
  const modelMatch = line.match(/^model (\w+)/);
  if (modelMatch) model = modelMatch[1];
  if (line.startsWith("}") || line.startsWith("model ")) return line;
  const field = line.match(/^\s+(\w+)\s+String\b/);
  if (!field || !longFields.has(`${model}.${field[1]}`)) return line;
  if (line.includes("@db.Text")) return line;
  return line.replace(/\bString\b/, "String @db.Text");
});
const mysql = mysqlLines.join("\n");
const check = process.argv.includes("--check");
if (check) {
  const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : "";
  if (current !== mysql) {
    console.error("prisma/schema.mysql.prisma is out of date. Run node scripts/sync-mysql-schema.cjs");
    process.exit(1);
  }
  process.exit(0);
}
fs.writeFileSync(targetPath, mysql);
console.log("Wrote prisma/schema.mysql.prisma");
