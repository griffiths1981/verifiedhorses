import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { isPreviewExempt, checkBasicAuth } = require("../lib/preview-gate.cjs") as {
  isPreviewExempt: (path: string) => boolean;
  checkBasicAuth: (req: { headers?: { authorization?: string } }, env?: NodeJS.ProcessEnv) => boolean;
};

describe("preview basic auth", () => {
  it("lets health and static files through and challenges the rest", () => {
    expect(isPreviewExempt("/api/health")).toBe(true);
    expect(isPreviewExempt("/_next/static/chunk.js")).toBe(true);
    expect(isPreviewExempt("/fonts/inter-latin-400.woff2")).toBe(true);
    expect(isPreviewExempt("/robots.txt")).toBe(true);
    expect(isPreviewExempt("/")).toBe(false);
    expect(isPreviewExempt("/api/cron/alerts")).toBe(false);
    expect(isPreviewExempt("/api/media/photos/abc")).toBe(false);
  });

  it("accepts the configured user and password", () => {
    const env = { PREVIEW_BASIC_AUTH_USER: "preview", PREVIEW_BASIC_AUTH_PASSWORD: "secret" } as unknown as NodeJS.ProcessEnv;
    const header = `Basic ${Buffer.from("preview:secret").toString("base64")}`;
    expect(checkBasicAuth({ headers: { authorization: header } }, env)).toBe(true);
    expect(checkBasicAuth({ headers: { authorization: "Basic bm9wZTpwZQ==" } }, env)).toBe(false);
    expect(checkBasicAuth({ headers: {} }, env)).toBe(false);
    expect(checkBasicAuth({ headers: {} }, { PREVIEW_BASIC_AUTH_USER: "", PREVIEW_BASIC_AUTH_PASSWORD: "" } as unknown as NodeJS.ProcessEnv)).toBe(true);
  });
});
