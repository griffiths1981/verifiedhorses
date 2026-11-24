# Automation API

Grok Bot, or any other worker, moderates VerifiedHorses over HTTP. It does not need to sign in to the website. A person still decides disputes, scam outcomes and welfare cases. The API records an audit log for every change.

## Auth

```
Authorization: Bearer $ADMIN_API_TOKEN
```

If the staging basic-auth gate is on, the request needs that as well.

Cron jobs use a different secret:

```
Authorization: Bearer $CRON_SECRET
```

or `?secret=` on the cron URL.

## Poll, don't depend on a webhook

Every interesting event is stored. `GET /api/admin/events?status=pending` returns them. Acknowledge with `POST /api/admin/events/:id/ack`.

If `BOT_WEBHOOK_URL` is set, the app also POSTs the event with header `x-verifiedhorses-secret: $BOT_WEBHOOK_SECRET` and retries from `/api/cron/webhooks`.

Event types:

- `advert.submitted` — a seller paid (or the fee was £0) and the advert is waiting
- `report.created` — a report on an advert
- `message.flagged` — a message matched a scam rule (deposit, off-site app, bank details, and similar)
- `identity.updated` — Stripe Identity, or the demo check, changed a seller's status
- `video.flagged` — oEmbed says a clip is private, missing, or cannot be embedded

`GET /api/admin/queue` also returns `flaggedVideos`, each with the advert and the stored link.

## Queue

`GET /api/admin/queue`

Returns pending adverts, open reports, and flagged messages.

## Actions

All of these are `POST`, with an optional JSON body `{ "note": "..." }`.

| Path | Effect |
|---|---|
| `/api/admin/adverts/:id/approve` | Makes the advert live and emails the seller |
| `/api/admin/adverts/:id/reject` | Sends it back with the note |
| `/api/admin/adverts/:id/remove` | Takes it down |
| `/api/admin/users/:id/ban` | Closes the account and removes their live adverts. Cannot ban an admin. |
| `/api/admin/reports/:id` | Body `{ "status": "actioned" }` or `"dismissed"` |

## Prices and the log

- `GET /api/admin/pricing`
- `PUT /api/admin/pricing/:slug` with `{ "pricePence": 2900, "active": true }`
- `GET /api/admin/audit` — the last 100 audit rows

Prices are in pence. £29 is `2900`.

## Cron

| Path | What it does |
|---|---|
| `/api/cron/alerts` | Emails saved searches about new matches |
| `/api/cron/nudges` | Emails sellers whose draft is over 24 hours old |
| `/api/cron/emails` | Sends the outbox, or logs it when Brevo is unset |
| `/api/cron/videos` | Checks YouTube and Vimeo oEmbed. Flags private, missing and embedding-disabled clips. The old file uploader is skipped unless `VIDEO_UPLOADS_ENABLED=true`. |
| `/api/cron/webhooks` | Retries pending bot events |
| `/api/cron/retention` | Deletes expired email-confirmation tokens |
| `/api/cron/summary` | Emails a count of the queue to `CONTACT_EMAIL` |
| `/api/cron/all` | Alerts, nudges, videos, webhooks, retention, then the outbox |

There is no background worker and no websocket. Messaging is a thread plus an email, because the web host stops requests at 120 seconds and does not allow a live chat process.
