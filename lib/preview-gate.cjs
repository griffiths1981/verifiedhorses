const crypto = require("crypto");

function isPreviewExempt(pathname) {
  if (!pathname) return false;
  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/_next/static")) return true;
  if (pathname.startsWith("/fonts/")) return true;
  if (pathname === "/favicon.ico" || pathname === "/icon.svg") return true;
  if (pathname === "/robots.txt") return true;
  return false;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function checkBasicAuth(req, env = process.env) {
  const user = env.PREVIEW_BASIC_AUTH_USER || "";
  const pass = env.PREVIEW_BASIC_AUTH_PASSWORD || "";
  if (!user && !pass) return true;
  const header = req.headers?.authorization || "";
  if (typeof header !== "string" || !header.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  } catch {
    return false;
  }
  const split = decoded.indexOf(":");
  if (split < 0) return false;
  return safeEqual(decoded.slice(0, split), user) && safeEqual(decoded.slice(split + 1), pass);
}

function applySecurityHeaders(res, env = process.env) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (env.ALLOW_INDEXING === "true") {
    res.removeHeader("X-Robots-Tag");
  } else {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  }
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "media-src 'self' https: http: blob:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https: http:",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    ].join("; "),
  );
}

module.exports = { isPreviewExempt, checkBasicAuth, applySecurityHeaders, safeEqual };
