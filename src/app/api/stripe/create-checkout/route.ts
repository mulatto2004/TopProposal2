import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  priceId: z.string(),
  plan: z.enum(["PRO", "BUSINESS"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { priceId, plan } = schema.parse(body);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Get or create Stripe customer
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing&cancelled=true`,
      metadata: { userId: session.user.id, ...(plan ? { plan } : {}) },
      subscription_data: {
        metadata: { userId: session.user.id, ...(plan ? { plan } : {}) },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[stripe/create-checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
