import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./prisma";
import { verifyPassword } from "./password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "dev-only-auth-secret-change-before-staging-32",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;
        const prisma = await db();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.bannedAt || !user.emailVerifiedAt) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
