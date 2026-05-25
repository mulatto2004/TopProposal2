import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/generated/prisma";
import { addDays } from "date-fns";
import { z } from "zod";

const schema = z.object({ quoteId: z.string() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quoteId } = schema.parse(body);

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        business: { select: { userId: true, id: true } },
        invoice: true,
      },
    });

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.business.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (quote.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Only accepted quotes can be converted to invoices" },
        { status: 400 }
      );
    }
    if (quote.invoice) {
      return NextResponse.json(
        { invoiceId: quote.invoice.id },
        { status: 200 }
      );
    }

    // Count existing invoices to generate number
    const count = await prisma.invoice.count({
      where: { businessId: quote.business.id },
    });

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const depositPaid = quote.depositPaid ? (quote.depositAmount ?? 0) : 0;
    const amountDue = quote.total - depositPaid;

    const invoice = await prisma.invoice.create({
      data: {
        quoteId: quote.id,
        businessId: quote.business.id,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        taxAmount: quote.taxAmount,
        total: quote.total,
        depositPaid,
        amountDue,
        issueDate: new Date(),
        dueDate: addDays(new Date(), 30),
      },
    });

    // Update quote status to INVOICED
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "INVOICED" },
    });

    return NextResponse.json({ invoiceId: invoice.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    console.error("[POST /api/invoices]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
