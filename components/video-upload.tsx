"use client";

import { useState } from "react";

export function VideoUpload({ advertId }: { advertId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file) {
      setMessage("Choose a video file.");
      return;
    }
    setBusy(true);
    setMessage("Asking the video service for an upload slot…");
    const grantResponse = await fetch(`/api/sell/${advertId}/video-grant`, { method: "POST" });
    const grant = await grantResponse.json();
    if (grant.mode !== "remote") {
      setMessage("The video service is not configured. Use the form below to store the file on this server.");
      setBusy(false);
      return;
    }
    setMessage("Uploading…");
    const uploaded = await fetch(grant.uploadUrl, {
      method: "PUT",
      headers: { authorization: `Bearer ${grant.uploadToken}`, "content-type": "application/octet-stream" },
      body: file,
    });
    if (!uploaded.ok) {
      setMessage("The video service did not accept the file.");
      setBusy(false);
      return;
    }
    await fetch(`/api/sell/${advertId}/video-complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ videoId: grant.videoId }),
    });
    setMessage("Uploaded. Encoding runs on the video server. Refresh this page in a minute.");
    setBusy(false);
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>Video file, sent straight to the video server
        <input name="file" type="file" accept="video/mp4,video/webm,video/quicktime" required />
      </label>
      <button className="gold" type="submit" disabled={busy}>Upload video</button>
      <p role="status">{message}</p>
    </form>
  );
}
