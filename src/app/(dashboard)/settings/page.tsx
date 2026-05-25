import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsTabs from "./SettingsTabs";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  });
  if (!business) redirect("/onboarding");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
      quotesThisMonth: true,
    },
  });

  const activeTab = searchParams.tab ?? "profile";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your business profile and preferences
          </p>
        </div>
      </div>

      <SettingsTabs
        activeTab={activeTab}
        business={{
          name: business.name,
          email: business.email ?? "",
          phone: business.phone ?? "",
          address: business.address ?? "",
          city: business.city ?? "",
          state: business.state ?? "",
          zipCode: business.zipCode ?? "",
          country: business.country ?? "US",
          website: business.website ?? "",
          industry: business.industry ?? "",
          taxRate: business.taxRate,
          currency: business.currency,
          paymentTerms: business.paymentTerms,
          defaultNotes: business.defaultNotes ?? "",
          defaultTerms: business.defaultTerms ?? "",
        }}
        subscription={
          subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                hasStripe: !!subscription.stripeCustomerId,
                quotesThisMonth: subscription.quotesThisMonth,
              }
            : null
        }
      />
    </div>
  );
}
