import { cronAuthorised, runCron } from "@/lib/cron-jobs";
import { deliverQueued } from "@/lib/mail";

async function run(request: Request, context: { params: Promise<{ job: string }> }) {
  const { job } = await context.params;
  const url = new URL(request.url);
  if (!cronAuthorised(request.headers.get("authorization"), url.searchParams.get("secret"))) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  if (job === "all") {
    const alerts = await runCron("alerts");
    const nudges = await runCron("nudges");
    const videos = await runCron("videos");
    const webhooks = await runCron("webhooks");
    const retention = await runCron("retention");
    const emails = await deliverQueued();
    return Response.json({ ok: true, alerts, nudges, videos, webhooks, retention, emails });
  }
  const result = await runCron(job);
  if (!result) return Response.json({ error: "unknown job" }, { status: 404 });
  if (job !== "emails") await deliverQueued();
  return Response.json({ ok: true, result });
}

export const GET = run;
export const POST = run;
