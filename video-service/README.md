# VerifiedHorses video service

**Not used.** Sellers paste YouTube or Vimeo links. This uploader stays in the repo only. It does nothing unless the web app has `VIDEO_UPLOADS_ENABLED=true`, which is off. Do not install it for the current site.

This small Node service can run on a Linux VPS (the KVM, not the Hostinger Cloud site). Sellers' videos are uploaded here, FFmpeg makes a 720p MP4 and a poster image, and the files are served from this machine. The website only stores the URLs.

HLS is optional (`VIDEO_HLS=true`). The default is MP4 because it plays in every current browser without a script. MP4 is the right default on a 2-vCPU box.

## What it does

- `POST /v1/grants` with the API token creates an upload slot.
- The browser `PUT`s the file to `/v1/videos/:id` with the short-lived upload token. The long-lived API token never goes to the browser.
- FFmpeg encodes one video at a time.
- `GET /media/:id/play.mp4` and `GET /media/:id/poster.jpg` are public, but the id is unguessable.
- Clips longer than `VIDEO_MAX_SECONDS` (default 3 minutes) or larger than `VIDEO_MAX_BYTES` (default 250 MB) are rejected.

## Setup

On the VPS, in this directory:

```sh
chmod +x setup.sh
./setup.sh
```

The script checks for `ffmpeg` and Node 22, creates `data/`, writes a `.env` with a random `VIDEO_API_TOKEN` if you do not have one, and installs dependencies. It does not open a port in a firewall, request a certificate, or change DNS.

Put the same token in the web app as `VIDEO_API_TOKEN`. Set:

- `VIDEO_SERVICE_URL` to the URL the web server uses, for example `http://10.0.0.5:8080`
- `VIDEO_PUBLIC_URL` to the URL a buyer's browser uses. Use HTTPS if the website is HTTPS, or the browser will block the video.
- `VIDEO_CORS_ORIGIN` to the website origin, so the browser is allowed to upload.

A sample systemd unit is `verifiedhorses-video.service`. Edit the paths and user before installing it. Put a reverse proxy with TLS in front of the service when you have a hostname. There is no hostname yet.

Start it by hand with `npm start`.

## Limits

Encoding is queued, one file at a time, so a burst of uploads cannot use both CPUs at once. If the VPS is busy, encoding waits. The website stays up either way, because it does not run FFmpeg.
