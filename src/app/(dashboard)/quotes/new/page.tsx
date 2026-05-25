import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuoteBuilder from "./QuoteBuilder";

export const metadata = { title: "New Quote" };

export default async function NewQuotePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      logo: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      currency: true,
      taxRate: true,
      paymentTerms: true,
      defaultNotes: true,
      defaultTerms: true,
    },
  });
  if (!business) redirect("/onboarding");

  // Count existing quotes to generate reference number
  const quoteCount = await prisma.quote.count({
    where: { businessId: business.id },
  });

  // Existing clients for autocomplete
  const clients = await prisma.client.findMany({
    where: { businessId: business.id },
    select: { id: true, name: true, email: true, phone: true, company: true },
    orderBy: { name: "asc" },
  });

  return (
    <QuoteBuilder
      business={business}
      clients={clients}
      nextQuoteNumber={quoteCount + 1}
    />
  );
}
