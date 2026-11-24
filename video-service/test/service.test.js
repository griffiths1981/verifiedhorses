const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { createApp, buildVideoArgs, buildPosterArgs, buildHlsArgs } = require("../server");

test("transcode arguments target a 720p MP4, a poster, and optional HLS", () => {
  const video = buildVideoArgs("in.mov", "out.mp4").join(" ");
  assert.match(video, /scale=-2:720/);
  assert.match(video, /libx264/);
  assert.match(video, /faststart/);
  const poster = buildPosterArgs("in.mov", "poster.jpg").join(" ");
  assert.match(poster, /frames:v/);
  const hls = buildHlsArgs("in.mov", "index.m3u8").join(" ");
  assert.match(hls, /hls_playlist_type vod/);
});

test("upload is rejected without a token and a granted upload becomes ready", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vh-video-"));
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "vh-bin-"));
  const ffmpeg = path.join(binDir, "ffmpeg");
  const ffprobe = path.join(binDir, "ffprobe");
  fs.writeFileSync(ffmpeg, "#!/bin/sh\nout=\nfor arg in \"$@\"; do out=\"$arg\"; done\nprintf ok > \"$out\"\n");
  fs.writeFileSync(ffprobe, "#!/bin/sh\necho 12.5\n");
  fs.chmodSync(ffmpeg, 0o755);
  fs.chmodSync(ffprobe, 0o755);
  const app = createApp({
    dataDir: dir,
    apiToken: "test-token",
    publicBase: "http://video.local",
    ffmpeg,
    ffprobe,
    maxSeconds: 180,
  });
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  try {
    const denied = await fetch(`${base}/v1/grants`, { method: "POST" });
    assert.equal(denied.status, 401);
    const grantResponse = await fetch(`${base}/v1/grants`, {
      method: "POST",
      headers: { authorization: "Bearer test-token" },
    });
    assert.equal(grantResponse.status, 201);
    const grant = await grantResponse.json();
    const uploaded = await fetch(`${base}/v1/videos/${grant.id}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${grant.uploadToken}`, "content-type": "application/octet-stream" },
      body: Buffer.alloc(64, 1),
    });
    assert.equal(uploaded.status, 202);
    let status = "queued";
    for (let i = 0; i < 20 && status !== "ready"; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const info = await fetch(`${base}/v1/videos/${grant.id}`, { headers: { authorization: "Bearer test-token" } });
      const body = await info.json();
      status = body.status;
      if (status === "ready") {
        assert.equal(body.durationSec, 13);
        assert.equal(body.playbackUrl, `http://video.local/media/${grant.id}/play.mp4`);
        const media = await fetch(body.playbackUrl.replace("http://video.local", base));
        assert.equal(media.status, 200);
      }
    }
    assert.equal(status, "ready");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("the setup script is present and executable", () => {
  const script = path.join(__dirname, "..", "setup.sh");
  assert.equal(fs.statSync(script).mode & 0o111, 0o111);
});
