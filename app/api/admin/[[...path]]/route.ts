import { handleAdmin } from "@/lib/admin-api";

async function dispatch(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const body = request.method === "GET" ? Object.fromEntries(new URL(request.url).searchParams) : await request.json().catch(() => ({}));
  const result = await handleAdmin(request.method, path, body as Record<string, unknown>, request.headers.get("authorization"));
  return Response.json(result.json, { status: result.status });
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
