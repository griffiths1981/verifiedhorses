# VerifiedHorses

A UK horse, pony and horsebox marketplace. Trust first, video first, and built for a private staging site. Nothing in this repository is public, and it does not register a domain or touch DNS.

Buyers search by type, postcode and budget. Sellers prove who they are, lead with a riding video, and can attach dated vetting papers. The site is a listings platform only. It is not a party to any sale.

## Stack

- Next.js 16, React 19, TypeScript
- Prisma 7 with SQLite locally and MySQL in production
- Auth.js (`next-auth` 5) with email and password
- Stripe Checkout and Stripe Identity, test mode, or a demo flow when no keys are set
- A separate video encoder in `video-service/` for the Linux VPS

## Run it locally

Node 22 is required.

```sh
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000.

`npm start` runs `server.js`, which is the Hostinger entry. It listens on `PORT` immediately, answers 503 until it is ready, runs `prisma migrate deploy` and a seed-if-empty step, then starts Next.

Example accounts, created only when `SEED_DEMO` is not `false`:

| Email | Password | Role |
|---|---|---|
| admin@verifiedhorses.example | value of `ADMIN_INITIAL_PASSWORD` (sample: `Demo-admin-1`) | admin |
| amelia@verifiedhorses.example | `Demo-seller-1` | verified seller |
| daniel@verifiedhorses.example | `Demo-seller-1` | verified seller |
| buyer@verifiedhorses.example | `Demo-buyer-1` | buyer |

These people and horses are made up. A banner says so on the site.

## Deploy to Hostinger Cloud (private staging)

In hPanel, create a **new** Node.js site. Do not reuse a site that is already live.

- Node 22
- Application type: express
- Entry file: `server.js`
- Build command: `npm run build` (the script name is `build`)
- Start: `npm start`

Set the environment variables below in the panel. `node` is not on the PATH there, so this app never calls a `.bin` shim. `server.js` uses `process.execPath`.

The site stays out of search engines until `ALLOW_INDEXING=true`. Set `PREVIEW_BASIC_AUTH_USER` and `PREVIEW_BASIC_AUTH_PASSWORD` so the staging site is not open. Health checks (`/api/health`) and static files (`/_next/static`, `/fonts`, the icon, `robots.txt`) skip that gate. Every other route, including cron, needs the username and password. A cron URL looks like:

```
https://USER:PASSWORD@your-staging-host/api/cron/all?secret=CRON_SECRET
```

Suggested cron, once a day is enough at the start:

- `/api/cron/all` runs alerts, draft nudges, video status, webhook delivery, retention, then sends the outbox
- `/api/cron/summary` emails a moderation count to `CONTACT_EMAIL`

Images are served directly (`images.unoptimized`). That is deliberate: the Next image optimiser would fetch pictures without the visitor's basic-auth header and they would break.

## Video service

Encoding does not run on the web host. Hostinger Cloud has no FFmpeg and no long-running worker. `video-service/README.md` and `video-service/setup.sh` install the encoder on the VPS. Leave `VIDEO_SERVICE_URL` empty and uploads are stored on the web server without transcoding, which is only for local development.

## Environment variables

See `.env.example` for the full list.

| Variable | Purpose |
|---|---|
| `BASE_URL` | Public origin of this site. No domain yet, so point it at the staging host. |
| `AUTH_URL` | Same origin, used by Auth.js. |
| `AUTH_SECRET` | Long random string. Required once you leave your laptop. |
| `DATABASE_URL` | `file:./data/dev.db` locally. `mysql://USER:PASSWORD@localhost:3306/verifiedhorses` on Hostinger. |
| `PREVIEW_BASIC_AUTH_USER` / `PASSWORD` | Staging gate. Leave blank locally. |
| `ALLOW_INDEXING` | `false` until a public launch. Sends `noindex` and a disallow-all `robots.txt`. |
| `CRON_SECRET` | Bearer token for `/api/cron/*`. |
| `ADMIN_API_TOKEN` | Bearer token for the bot API in `AUTOMATION.md`. |
| `ADMIN_INITIAL_PASSWORD` | Used once, if there is no admin user yet. |
| `SEED_DEMO` | `false` skips the example horses and example people. Prices are still seeded. |
| `CONTACT_EMAIL` | Shown on the site and used for the weekly summary. |
| `LEGAL_ENTITY_NAME` | Footer and privacy notice. Blank until you confirm it. |
| `MAIL_FROM` | From address when Brevo is set. |
| `BREVO_API_KEY` | Optional. Without it, mail is written to the outbox and the log. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Test keys only. Without them, identity and fees use the on-screen demo buttons. |
| `VIDEO_SERVICE_URL` / `VIDEO_PUBLIC_URL` / `VIDEO_API_TOKEN` / `VIDEO_CALLBACK_SECRET` | The VPS encoder. |
| `BOT_WEBHOOK_URL` / `BOT_WEBHOOK_SECRET` | Optional push of moderation events. The poll API works without them. |
| `DEFAULT_OUTCODE` | Home page “near you” point. Default `YO1`. |
| `SHOW_DEV_EMAIL_LINKS` | Set `false` to hide confirmation links on screen. They are shown only when Brevo is unset. |

## Prices

Prices live in the database and are edited at `/admin/pricing` or `PUT /api/admin/pricing/:slug`. Seeded placeholders, for Steve to replace:

- £29 standard, until sold
- £39 PLUS (higher in search, a badge, and a caption to copy)
- £19 youngstock, until sold
- £45 horsebox and transport
- £59 trade, monthly (a badge only; yard pages are later)

HorseQuest, for reference, charges £38 and £48 for 6 weeks. A switch on the pricing page can make new private adverts free without changing the numbers.

## Tests

```sh
npm test
```

`npm run build` typechecks and builds the Next app. `npm audit` should show no critical or high findings. Two moderate findings remain in Vitest, which is a dev dependency and is not installed with `npm install --omit=dev`.

## What this build does not do

Auctions, escrow, protected payment, SMS checks, live chat, yard pages, reviews, and a real price index are not in this version. See `REPORT.md`.
