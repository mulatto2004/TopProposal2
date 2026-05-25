import "next-auth";

// Extend the built-in session types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      businessId: string | null;
      onboardingDone: boolean;
    };
  }
}
