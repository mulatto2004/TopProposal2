import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@/generated/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Resend({
      from: process.env.RESEND_FROM_EMAIL!,
      apiKey: process.env.RESEND_API_KEY!,
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    // Attach userId + business onboarding status to session
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Check if business/onboarding is complete
        const business = await prisma.business.findUnique({
          where: { userId: user.id },
          select: { id: true, onboardingDone: true },
        });

        session.user.businessId = business?.id ?? null;
        session.user.onboardingDone = business?.onboardingDone ?? false;
      }
      return session;
    },
  },
  events: {
    // Auto-create a FREE subscription when a new user signs up
    async createUser({ user }) {
      if (!user.id) return; // Safety: id is always set for newly created users
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: PlanTier.FREE,
          status: "active",
        },
      });
    },
  },
});
