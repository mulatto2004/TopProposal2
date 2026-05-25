import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  businessName: z.string().min(2),
  industry: z.string().min(1),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  currency: z.string().default("USD"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  paymentTerms: z.string().default("Due on receipt"),
  defaultTerms: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Upsert the business profile (handles both create and re-submit)
    await prisma.business.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        name: data.businessName,
        industry: data.industry,
        phone: data.phone,
        city: data.city,
        state: data.state,
        currency: data.currency,
        taxRate: data.taxRate,
        paymentTerms: data.paymentTerms,
        defaultTerms: data.defaultTerms,
        onboardingDone: true,
      },
      update: {
        name: data.businessName,
        industry: data.industry,
        phone: data.phone,
        city: data.city,
        state: data.state,
        currency: data.currency,
        taxRate: data.taxRate,
        paymentTerms: data.paymentTerms,
        defaultTerms: data.defaultTerms,
        onboardingDone: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[ONBOARDING]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
