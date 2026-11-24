#!/bin/sh
# Install the VerifiedHorses video encoder on a Linux VPS.
# It does not touch DNS, buy anything, or restart other services.
set -eu
cd "$(dirname "$0")"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed. On Debian or Ubuntu: sudo apt-get install ffmpeg"
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22 or newer is required."
  exit 1
fi

mkdir -p data
if [ ! -f .env ]; then
  cp .env.example .env
  token="$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")"
  # shellcheck disable=SC2016
  sed "s/^VIDEO_API_TOKEN=.*/VIDEO_API_TOKEN=${token}/" .env > .env.tmp
  mv .env.tmp .env
  echo "Wrote .env with a new VIDEO_API_TOKEN. Copy that token into the web app."
fi

npm install --omit=dev
echo "Installed. Edit .env, then start with: npm start"
echo "A sample systemd unit is in verifiedhorses-video.service"
