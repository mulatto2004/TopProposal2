// Stripe Webhook Handler
// Events handled:
//   checkout.session.completed      → activate subscription
//   customer.subscription.updated  → sync plan changes
//   customer.subscription.deleted  → downgrade to FREE

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@/generated/prisma";
import type Stripe from "stripe";

// In App Router, req.text() provides the raw body without any config needed.
// The deprecated Pages Router `export const config` has been removed.

function getPlanFromPriceId(priceId: string): PlanTier {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return PlanTier.PRO;
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return PlanTier.BUSINESS;
  return PlanTier.FREE;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed → activate plan ──────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId || session.mode !== "subscription") break;

        const subscriptionId = session.subscription as string;
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = stripeSubscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subAny = stripeSubscription as any;
        await prisma.subscription.update({
          where: { userId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            plan,
            status: stripeSubscription.status,
            currentPeriodStart: subAny.current_period_start
              ? new Date(subAny.current_period_start * 1000)
              : null,
            currentPeriodEnd: subAny.current_period_end
              ? new Date(subAny.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: subAny.cancel_at_period_end ?? false,
          },
        });
        break;
      }

      // ── Subscription updated (plan change, renewal) ─────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subAny2 = sub as any;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            stripePriceId: priceId,
            plan,
            status: sub.status,
            currentPeriodStart: subAny2.current_period_start
              ? new Date(subAny2.current_period_start * 1000)
              : null,
            currentPeriodEnd: subAny2.current_period_end
              ? new Date(subAny2.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: subAny2.cancel_at_period_end ?? false,
          },
        });
        break;
      }

      // ── Subscription cancelled → downgrade to FREE ─────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: PlanTier.FREE,
            status: "canceled",
            stripeSubscriptionId: null,
            stripePriceId: null,
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }

      // ── Payment failed → mark past_due ─────────────────────────────────────
      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId: string | undefined =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : typeof invoice.subscription === "object" && invoice.subscription?.id
              ? invoice.subscription.id
              : undefined;
        if (!subId) break;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subId },
          data: { status: "past_due" },
        });
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler error for ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — log and investigate separately
    return NextResponse.json({ error: "Handler error" }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
