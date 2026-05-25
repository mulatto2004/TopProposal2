// Root page — redirect based on auth state
// The middleware handles the actual redirects, this is just a safety fallback
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Authenticated — middleware handles onboarding check, go to dashboard
  redirect("/dashboard");
}
