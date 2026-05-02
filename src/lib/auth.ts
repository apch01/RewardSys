import type { NextAuthOptions } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { getOrCreateParent, getParentByEmail } from "./db";
import { verifyPassword } from "./passwords";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password ?? "";
      if (!email || !password) return null;

      const parent = await getParentByEmail(email);
      if (!parent?.password_hash || !verifyPassword(password, parent.password_hash)) return null;

      return { id: parent.id, email: parent.email, name: parent.name, image: parent.image };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(AppleProvider({ clientId: process.env.APPLE_ID, clientSecret: process.env.APPLE_SECRET }));
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(FacebookProvider({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET }));
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/signin"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email ?? (profile as { email?: string } | undefined)?.email;
      if (!email) return false;

      await getOrCreateParent({ email, name: user.name, image: user.image });
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const parent = await getOrCreateParent({ email: session.user.email, name: session.user.name, image: session.user.image });
        session.user.id = parent.id;
        session.user.familyId = parent.family_id ?? undefined;
        session.user.isFamilyCreator = parent.is_family_creator;
      }
      return session;
    }
  }
};