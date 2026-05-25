import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      quote: {
        select: {
          clientName: true,
          clientEmail: true,
          title: true,
          business: {
            select: { userId: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!invoice || invoice.quote.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "send") {
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        issueDate: invoice.issueDate ?? new Date(),
      },
    });

    // Send invoice email (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    sendInvoiceEmail({
      to: invoice.quote.clientEmail,
      clientName: invoice.quote.clientName,
      businessName: invoice.quote.business.name,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      amountDue: invoice.amountDue,
      currency: "USD",
      invoiceUrl: `${appUrl}/invoices/${invoice.id}`,
      dueDate: invoice.dueDate ? invoice.dueDate.toLocaleDateString() : undefined,
    }).catch(console.error);

    return NextResponse.json({ ok: true, invoice: updated });
  }

  if (action === "mark-paid") {
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, invoice: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      quote: {
        include: {
          lineItems: { orderBy: { sortOrder: "asc" } },
          business: { select: { userId: true } },
        },
      },
    },
  });

  if (!invoice || invoice.quote.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}
