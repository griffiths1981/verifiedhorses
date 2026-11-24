require("dotenv").config();
const express = require("express");
const { spawnSync } = require("child_process");
const path = require("path");
const { isPreviewExempt, checkBasicAuth, applySecurityHeaders } = require("./lib/preview-gate.cjs");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const app = express();
let ready = false;
let bootError = "";
let handle = null;

app.disable("x-powered-by");
app.use((req, res) => {
  applySecurityHeaders(res);
  if (!isPreviewExempt(req.path) && !checkBasicAuth(req)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="VerifiedHorses preview"');
    res.status(401).type("text/plain").send("Authentication required");
    return;
  }
  if (!ready || !handle) {
    const starting = !bootError;
    if (req.path === "/api/health") {
      res.status(503).json({ ok: false, status: starting ? "starting" : "error", error: bootError || undefined });
      return;
    }
    res
      .status(503)
      .type("text/plain")
      .send(bootError ? `VerifiedHorses failed to start. ${bootError}` : "VerifiedHorses is starting");
    return;
  }
  Promise.resolve(handle(req, res)).catch((error) => {
    console.error(error);
    if (!res.headersSent) res.status(500).type("text/plain").send("Something went wrong");
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`VerifiedHorses listening on ${port} before the app is ready`);
  boot().catch((error) => {
    bootError = error instanceof Error ? error.message : String(error);
    console.error(bootError);
  });
});

function runNode(script, args = [], nodeArgs = []) {
  const result = spawnSync(process.execPath, [...nodeArgs, script, ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${path.basename(script)} exited with ${result.status}`);
  }
}

async function boot() {
  const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
  runNode(prismaCli, ["migrate", "deploy"]);
  runNode(path.join(root, "scripts", "seed-if-empty.cjs"));
  const next = require("next");
  const nextApp = next({ dev: false, dir: root });
  handle = nextApp.getRequestHandler();
  await nextApp.prepare();
  ready = true;
  console.log("VerifiedHorses is ready");
}
