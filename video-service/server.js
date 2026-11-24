const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function buildVideoArgs(input, output) {
  return ["-y", "-i", input, "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", output];
}

function buildPosterArgs(input, output) {
  return ["-y", "-ss", "1", "-i", input, "-frames:v", "1", "-vf", "scale=960:-2", output];
}

function buildHlsArgs(input, output) {
  return ["-y", "-i", input, "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "veryfast", "-hls_time", "4", "-hls_playlist_type", "vod", "-f", "hls", output];
}

function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.VIDEO_DATA_DIR || path.join(__dirname, "data");
  const token = options.apiToken ?? process.env.VIDEO_API_TOKEN ?? "";
  const publicBase = (options.publicBase || process.env.VIDEO_PUBLIC_URL || "").replace(/\/$/, "");
  const maxBytes = Number(options.maxBytes || process.env.VIDEO_MAX_BYTES || 250 * 1024 * 1024);
  const maxSeconds = Number(options.maxSeconds || process.env.VIDEO_MAX_SECONDS || 180);
  const ffmpeg = options.ffmpeg || process.env.FFMPEG_BIN || "ffmpeg";
  const ffprobe = options.ffprobe || process.env.FFPROBE_BIN || "ffprobe";
  const hls = options.hls ?? process.env.VIDEO_HLS === "true";
  const cors = options.corsOrigin ?? process.env.VIDEO_CORS_ORIGIN ?? "";
  fs.mkdirSync(dataDir, { recursive: true });

  const jobsFile = path.join(dataDir, "jobs.json");
  const jobs = new Map();
  if (fs.existsSync(jobsFile)) {
    try {
      for (const job of JSON.parse(fs.readFileSync(jobsFile, "utf8"))) jobs.set(job.id, job);
    } catch {
      // A corrupt jobs file should not stop the service from booting.
    }
  }
  const queue = [];
  let working = false;

  function persist() {
    fs.writeFileSync(jobsFile, JSON.stringify([...jobs.values()]));
  }

  function bearer(req) {
    const header = req.get("authorization") || "";
    return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  }

  function requireApi(req, res) {
    if (!token || !safeEqual(bearer(req), token)) {
      res.status(401).json({ error: "unauthorised" });
      return false;
    }
    return true;
  }

  function run(bin, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve(stderr);
        else reject(new Error(stderr.slice(-500) || `${bin} exited ${code}`));
      });
    });
  }

  async function probe(file) {
    const output = await new Promise((resolve, reject) => {
      const child = spawn(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve(stdout.trim()) : reject(new Error("ffprobe failed"))));
    });
    const seconds = Number(output);
    return Number.isFinite(seconds) ? seconds : 0;
  }

  async function work() {
    if (working) return;
    const next = queue.shift();
    if (!next) return;
    working = true;
    const job = jobs.get(next);
    try {
      const seconds = await probe(job.source);
      job.durationSec = Math.round(seconds);
      if (seconds > maxSeconds) throw new Error(`Video is longer than ${maxSeconds} seconds`);
      await run(ffmpeg, buildVideoArgs(job.source, job.mp4));
      try {
        await run(ffmpeg, buildPosterArgs(job.source, job.poster));
      } catch {
        await run(ffmpeg, ["-y", "-i", job.source, "-frames:v", "1", job.poster]);
      }
      if (hls) {
        fs.mkdirSync(job.hlsDir, { recursive: true });
        await run(ffmpeg, buildHlsArgs(job.source, path.join(job.hlsDir, "index.m3u8")));
      }
      job.status = "ready";
      job.error = "";
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
    }
    persist();
    working = false;
    work();
  }

  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, nextMiddleware) => {
    if (cors) {
      const allowed = cors.split(",").map((item) => item.trim());
      const origin = req.get("origin");
      if (allowed.includes("*") || (origin && allowed.includes(origin))) {
        res.setHeader("Access-Control-Allow-Origin", allowed.includes("*") ? "*" : origin);
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
      }
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    nextMiddleware();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "verifiedhorses-video" });
  });

  app.post("/v1/grants", (req, res) => {
    if (!requireApi(req, res)) return;
    const id = crypto.randomBytes(16).toString("hex");
    const uploadToken = crypto.randomBytes(24).toString("base64url");
    const dir = path.join(dataDir, id);
    fs.mkdirSync(dir, { recursive: true });
    const job = {
      id,
      uploadToken,
      status: "waiting",
      source: path.join(dir, "source"),
      mp4: path.join(dir, "play.mp4"),
      poster: path.join(dir, "poster.jpg"),
      hlsDir: path.join(dir, "hls"),
      durationSec: 0,
      error: "",
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    jobs.set(id, job);
    persist();
    res.status(201).json({ id, uploadToken, expiresAt: new Date(job.expiresAt).toISOString() });
  });

  app.put("/v1/videos/:id", express.raw({ type: "*/*", limit: maxBytes }), (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job || !job.uploadToken || !safeEqual(bearer(req), job.uploadToken)) {
      res.status(401).json({ error: "unauthorised" });
      return;
    }
    if (Date.now() > job.expiresAt) {
      res.status(410).json({ error: "expired" });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length < 32) {
      res.status(400).json({ error: "empty" });
      return;
    }
    fs.writeFileSync(job.source, req.body);
    job.status = "queued";
    job.uploadToken = "";
    persist();
    queue.push(job.id);
    work();
    res.status(202).json({ id: job.id, status: "queued" });
  });

  app.get("/v1/videos/:id", (req, res) => {
    if (!requireApi(req, res)) return;
    const job = jobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const base = publicBase || `${req.protocol}://${req.get("host")}`;
    res.json({
      id: job.id,
      status: job.status,
      durationSec: job.durationSec,
      error: job.error,
      playbackUrl: job.status === "ready" ? `${base}/media/${job.id}/play.mp4` : "",
      posterUrl: job.status === "ready" ? `${base}/media/${job.id}/poster.jpg` : "",
      hlsUrl: job.status === "ready" && hls ? `${base}/media/${job.id}/hls/index.m3u8` : "",
    });
  });

  app.delete("/v1/videos/:id", (req, res) => {
    if (!requireApi(req, res)) return;
    const job = jobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    fs.rmSync(path.dirname(job.source), { recursive: true, force: true });
    jobs.delete(job.id);
    persist();
    res.json({ ok: true });
  });

  function sendFile(res, file, type) {
    if (!fs.existsSync(file)) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", type);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Accept-Ranges", "bytes");
    fs.createReadStream(file).pipe(res);
  }

  app.get("/media/:id/play.mp4", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).end();
    sendFile(res, job.mp4, "video/mp4");
  });
  app.get("/media/:id/poster.jpg", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).end();
    sendFile(res, job.poster, "image/jpeg");
  });
  app.get("/media/:id/hls/:file", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).end();
    const file = path.basename(req.params.file);
    const type = file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";
    sendFile(res, path.join(job.hlsDir, file), type);
  });

  return app;
}

module.exports = { createApp, buildVideoArgs, buildPosterArgs, buildHlsArgs };

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  if (!process.env.VIDEO_API_TOKEN) {
    console.error("Set VIDEO_API_TOKEN before starting the video service.");
    process.exit(1);
  }
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`VerifiedHorses video service listening on ${port}`);
  });
}
