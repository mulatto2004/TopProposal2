import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Welcome to TopProposal" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  // If already onboarded, skip straight to dashboard
  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { onboardingDone: true },
  });
  if (business?.onboardingDone) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2A5080] flex items-center justify-center p-4">
      <OnboardingWizard userId={session.user.id} userName={session.user.name} />
    </div>
  );
}
