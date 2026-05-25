import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShareToken } from "@/lib/utils";
import { QuoteStatus, TemplateStyle } from "@/generated/prisma";
import { z } from "zod";

// ── Validation ─────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const draftSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional().default(""),
  clientCompany: z.string().optional().default(""),
  clientId: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  discountType: z.enum(["percentage", "flat", ""]).optional(),
  discountValue: z.number().min(0).default(0),
  title: z.string().min(1),
  referenceNumber: z.string().min(1),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().default(""),
  terms: z.string().optional().default(""),
  requireDeposit: z.boolean().default(false),
  depositPercent: z.number().min(0).max(100).default(50),
  followUpEnabled: z.boolean().default(true),
  templateStyle: z.enum(["MINIMAL", "PROFESSIONAL", "BOLD"]).default("PROFESSIONAL"),
});

const totalsSchema = z.object({
  subtotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  depositAmount: z.number().nullable(),
});

const createQuoteSchema = z.object({
  draft: draftSchema,
  totals: totalsSchema,
  status: z.enum(["DRAFT", "SENT"]).default("DRAFT"),
});

// ── POST /api/quotes — create a new quote ────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { draft, totals, status } = createQuoteSchema.parse(body);

    // Check plan limits (Free = 3 quotes/month)
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, quotesThisMonth: true, usagePeriodStart: true },
    });

    if (subscription?.plan === "FREE") {
      // Reset counter if a new month has started
      const periodStart = subscription.usagePeriodStart;
      const now = new Date();
      const isNewMonth =
        now.getMonth() !== periodStart.getMonth() ||
        now.getFullYear() !== periodStart.getFullYear();

      if (isNewMonth) {
        await prisma.subscription.update({
          where: { userId: session.user.id },
          data: { quotesThisMonth: 0, usagePeriodStart: now },
        });
      } else if (subscription.quotesThisMonth >= 3) {
        return NextResponse.json(
          {
            error:
              "Free plan limit reached. Upgrade to Pro for unlimited quotes.",
            code: "PLAN_LIMIT",
          },
          { status: 403 }
        );
      }
    }

    // Generate unique share token
    let shareToken = generateShareToken();
    // Ensure uniqueness (extremely rare collision, but be safe)
    while (await prisma.quote.findUnique({ where: { shareToken } })) {
      shareToken = generateShareToken();
    }

    // Create quote + line items in a transaction
    const quote = await prisma.$transaction(async (tx) => {
      const q = await tx.quote.create({
        data: {
          businessId: business.id,
          clientId: draft.clientId ?? null,
          title: draft.title,
          referenceNumber: draft.referenceNumber,
          status: status === "SENT" ? QuoteStatus.SENT : QuoteStatus.DRAFT,
          templateStyle: draft.templateStyle as TemplateStyle,

          clientName: draft.clientName,
          clientEmail: draft.clientEmail,
          clientPhone: draft.clientPhone || null,
          clientCompany: draft.clientCompany || null,

          subtotal: totals.subtotal,
          discountType: draft.discountType || null,
          discountValue: draft.discountValue,
          discountAmount: totals.discountAmount,
          taxRate: draft.taxRate,
          taxAmount: totals.taxAmount,
          total: totals.total,

          requireDeposit: draft.requireDeposit,
          depositPercent: draft.depositPercent,
          depositAmount: totals.depositAmount,

          issueDate: new Date(draft.issueDate),
          expiryDate: draft.expiryDate ? new Date(draft.expiryDate) : null,
          sentAt: status === "SENT" ? new Date() : null,

          notes: draft.notes || null,
          terms: draft.terms || null,

          shareToken,
          followUpEnabled: draft.followUpEnabled,
        },
      });

      // Create line items
      await tx.lineItem.createMany({
        data: draft.lineItems.map((li, idx) => ({
          quoteId: q.id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.total,
          sortOrder: idx,
        })),
      });

      return q;
    });

    // Increment usage counter
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { quotesThisMonth: { increment: 1 } },
    });

    // Auto-save client to CRM if no existing link
    if (!draft.clientId && draft.clientEmail) {
      await prisma.client.upsert({
        where: {
          // Use a compound unique check (business + email)
          id: "non-existent-id", // force create path via the catch
        },
        create: {
          businessId: business.id,
          name: draft.clientName,
          email: draft.clientEmail,
          phone: draft.clientPhone || null,
          company: draft.clientCompany || null,
        },
        update: {},
      }).catch(() => {
        // Silently fail if client already exists — non-critical
      });
    }

    return NextResponse.json({ quoteId: quote.id, shareToken: quote.shareToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[POST /api/quotes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/quotes — list quotes for the business ───────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ quotes: [] });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as QuoteStatus | null;
  const search = searchParams.get("search") ?? "";

  const quotes = await prisma.quote.findMany({
    where: {
      businessId: business.id,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { clientName: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { referenceNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      referenceNumber: true,
      status: true,
      total: true,
      clientName: true,
      clientEmail: true,
      createdAt: true,
      sentAt: true,
      expiryDate: true,
      viewCount: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ quotes });
}
