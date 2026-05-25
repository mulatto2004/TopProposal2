import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import InvoicePDF from "@/components/pdf/InvoicePDF";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
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
          business: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  if (!invoice || invoice.quote.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { quote } = invoice;
  const { business } = quote;

  const pdfData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: formatDate(invoice.issueDate),
    dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : null,
    status: invoice.status,

    businessName: business.name,
    businessEmail: business.email ?? null,
    businessPhone: business.phone ?? null,
    businessAddress: business.address ?? null,
    businessCity: business.city ?? null,
    businessState: business.state ?? null,

    clientName: quote.clientName,
    clientEmail: quote.clientEmail,
    clientPhone: quote.clientPhone ?? null,
    clientCompany: quote.clientCompany ?? null,

    quoteTitle: quote.title,
    referenceNumber: quote.referenceNumber,

    lineItems: quote.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: li.total,
    })),

    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    depositPaid: invoice.depositPaid,
    amountDue: invoice.amountDue,
    currency: business.currency ?? "USD",

    notes: invoice.notes ?? null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(InvoicePDF, pdfData) as any);
  const bytes = new Uint8Array(buffer);

  const safeClient = quote.clientName.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `${invoice.invoiceNumber}-${safeClient}.pdf`;

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
