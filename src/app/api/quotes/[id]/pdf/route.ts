import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QuotePDF from "@/components/pdf/QuotePDF";
import { formatDate } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if this is a public or authenticated request
  const session = await auth();
  const isPublic = req.nextUrl.searchParams.get("public") === "1";

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
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
      signature: { select: { signerName: true, signedAt: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auth check: must be business owner or public access
  if (!isPublic && (!session?.user || quote.business.userId !== session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build PDF data
  const pdfData = {
    referenceNumber: quote.referenceNumber,
    title: quote.title,
    issueDate: formatDate(quote.issueDate),
    expiryDate: quote.expiryDate ? formatDate(quote.expiryDate) : null,
    templateStyle: quote.templateStyle as "MINIMAL" | "PROFESSIONAL" | "BOLD",

    businessName: quote.business.name,
    businessEmail: quote.business.email,
    businessPhone: quote.business.phone,
    businessAddress: quote.business.address,
    businessCity: quote.business.city,
    businessState: quote.business.state,

    clientName: quote.clientName,
    clientEmail: quote.clientEmail,
    clientPhone: quote.clientPhone,
    clientCompany: quote.clientCompany,

    lineItems: quote.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: li.total,
    })),

    subtotal: quote.subtotal,
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    discountAmount: quote.discountAmount,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    total: quote.total,
    currency: quote.business.currency,
    requireDeposit: quote.requireDeposit,
    depositPercent: quote.depositPercent,
    depositAmount: quote.depositAmount,

    notes: quote.notes,
    terms: quote.terms,

    signedBy: quote.signature?.signerName ?? null,
    signedAt: quote.signature ? formatDate(quote.signature.signedAt) : null,
  };

  // Render PDF to buffer
  const buffer = await renderToBuffer(createElement(QuotePDF, pdfData));

  const filename = `${quote.referenceNumber}-${quote.clientName.replace(/\s+/g, "-")}.pdf`;

  // Convert Node Buffer → Uint8Array (required by NextResponse BodyInit)
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": uint8.byteLength.toString(),
    },
  });
}
