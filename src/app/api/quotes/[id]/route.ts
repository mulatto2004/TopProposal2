import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma";
import { sendQuoteEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { z } from "zod";

// ── GET /api/quotes/[id] — fetch a single quote with line items ───────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      business: {
        select: {
          id: true,
          userId: true,
          name: true,
          logo: true,
          email: true,
          phone: true,
          currency: true,
        },
      },
      signature: true,
      invoice: { select: { id: true, invoiceNumber: true, status: true } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Must belong to the requesting user's business
  if (quote.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ quote });
}

// ── PATCH /api/quotes/[id] — update status, send, etc. ───────────────────────

const patchSchema = z.object({
  action: z.enum(["send", "mark-viewed", "accept", "decline", "expire"]).optional(),
  personalMessage: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      business: { select: { userId: true, name: true, email: true, currency: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, personalMessage } = patchSchema.parse(body);

    if (action === "send") {
      // Send email + mark as SENT
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const shareUrl = `${appUrl}/q/${quote.shareToken}`;

      await sendQuoteEmail({
        to: quote.clientEmail,
        clientName: quote.clientName,
        businessName: quote.business.name,
        quoteTitle: quote.title,
        referenceNumber: quote.referenceNumber,
        shareUrl,
        personalMessage: personalMessage,
        expiryDate: quote.expiryDate ? formatDate(quote.expiryDate) : undefined,
      });

      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.SENT, sentAt: new Date() },
      });

      return NextResponse.json({ success: true, status: "SENT" });
    }

    if (action === "expire") {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.EXPIRED },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    console.error("[PATCH /api/quotes/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/quotes/[id] — delete a draft quote ───────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { business: { select: { userId: true } } },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (quote.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft quotes can be deleted" },
      { status: 400 }
    );
  }

  await prisma.quote.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
