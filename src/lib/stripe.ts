import Stripe from "stripe";

// Singleton Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// Plan limits config (single source of truth)
export const PLAN_LIMITS = {
  FREE: {
    quotesPerMonth: 3,
    templates: ["PROFESSIONAL"],
    tracking: false,
    esignature: false,
    deposits: false,
    teamMembers: 0,
  },
  PRO: {
    quotesPerMonth: Infinity,
    templates: ["MINIMAL", "PROFESSIONAL", "BOLD"],
    tracking: true,
    esignature: true,
    deposits: false,
    teamMembers: 0,
  },
  BUSINESS: {
    quotesPerMonth: Infinity,
    templates: ["MINIMAL", "PROFESSIONAL", "BOLD"],
    tracking: true,
    esignature: true,
    deposits: true,
    teamMembers: 5,
  },
} as const;

// Check if user can create a new quote based on their plan
export function canCreateQuote(
  plan: keyof typeof PLAN_LIMITS,
  quotesThisMonth: number
): boolean {
  const limit = PLAN_LIMITS[plan].quotesPerMonth;
  return limit === Infinity || quotesThisMonth < limit;
}
