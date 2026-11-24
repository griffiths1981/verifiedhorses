"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "../auth";
import { db } from "../prisma";
import { hashPassword, verifyPassword } from "../password";
import { hashToken, newToken } from "../tokens";
import { enqueueEmail } from "../mail";
import { baseUrl, showDevEmailLinks } from "../config";
import { rateLimit } from "../rate-limit";
import { currentUser } from "../current-user";
import { demoVerify, refreshIdentity, startIdentity } from "../identity";
import { demoPayTrade } from "../payments";

async function clientKey() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "buyer") === "seller" ? "seller" : "buyer";
  const agreed = formData.get("agree") === "on";
  const referredBy = String(formData.get("ref") || "").slice(0, 32);
  if (!rateLimit(`register:${await clientKey()}`, 5, 60 * 60 * 1000)) redirect("/register?error=rate");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || !agreed) {
    redirect("/register?error=fields");
  }
  const prisma = await db();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/register?error=exists");
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      referralCode: newToken().slice(0, 10),
      referredBy,
    },
  });
  const token = newToken();
  await prisma.emailToken.create({
    data: {
      userId: user.id,
      purpose: "verify",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  const link = `${baseUrl()}/verify-email?token=${token}`;
  await enqueueEmail({
    to: email,
    kind: "verify",
    subject: "Confirm your VerifiedHorses email",
    body: `Confirm your email by opening this link within 48 hours:\n\n${link}\n\nIf you did not create an account, ignore this message.`,
  });
  const extra = showDevEmailLinks() ? `&token=${encodeURIComponent(token)}` : "";
  redirect(`/verify-email?pending=1&email=${encodeURIComponent(email)}${extra}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");
  if (!rateLimit(`login:${await clientKey()}`, 10, 15 * 60 * 1000)) redirect("/login?error=rate");
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.bannedAt || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=credentials");
  }
  if (!user.emailVerifiedAt) {
    redirect(`/verify-email?pending=1&email=${encodeURIComponent(email)}`);
  }
  try {
    await signIn("credentials", { email, password, redirectTo: next.startsWith("/") ? next : "/account" });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=credentials");
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function resendVerification(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!rateLimit(`resend:${email}`, 3, 60 * 60 * 1000)) redirect("/verify-email?pending=1&error=rate");
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) redirect("/login");
  const token = newToken();
  await prisma.emailToken.create({
    data: {
      userId: user.id,
      purpose: "verify",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  const link = `${baseUrl()}/verify-email?token=${token}`;
  await enqueueEmail({
    to: email,
    kind: "verify",
    subject: "Confirm your VerifiedHorses email",
    body: `Confirm your email:\n\n${link}`,
  });
  const extra = showDevEmailLinks() ? `&token=${encodeURIComponent(token)}` : "";
  redirect(`/verify-email?pending=1&email=${encodeURIComponent(email)}${extra}`);
}

export async function startIdCheck() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/verification");
  const result = await startIdentity(user.id);
  if (result.mode === "stripe" && result.url) redirect(result.url);
  redirect("/account/verification?mode=demo");
}

export async function demoIdCheck() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const result = await demoVerify(user.id);
  redirect(result.ok ? "/account/verification?done=1" : "/account/verification?error=stripe");
}

export async function refreshIdCheck() {
  const user = await currentUser();
  if (!user) redirect("/login");
  await refreshIdentity(user.id);
  redirect("/account/verification");
}

export async function buyTradeDemo() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const result = await demoPayTrade(user.id);
  redirect(result.ok ? "/account/billing?done=1" : "/account/billing?error=stripe");
}

export async function exportData() {
  const user = await currentUser();
  if (!user) redirect("/login");
  redirect("/account/export");
}

export async function deleteAccount(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (formData.get("confirm") !== "delete") redirect("/account?error=confirm");
  if (user.role === "admin") redirect("/account?error=admin");
  const prisma = await db();
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/?deleted=1" });
}
