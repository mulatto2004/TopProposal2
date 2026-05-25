import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QuoteStatus, SignatureMethod } from "@/generated/prisma";
import { sendQuoteAcceptedNotification } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  method: z.enum(["TYPED", "DRAWN"]),
  signatureData: z.string().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      business: {
        select: {
          userId: true,
          name: true,
          email: true,
          currency: true,
        },
      },
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (["ACCEPTED", "DECLINED", "EXPIRED"].includes(quote.status)) {
    return NextResponse.json(
      { error: `Quote is already ${quote.status.toLowerCase()}` },
      { status: 409 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Get client IP for audit trail
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // Accept quote + create signature in a transaction
    await prisma.$transaction([
      prisma.quote.update({
        where: { id: quote.id },
        data: {
          status: QuoteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      prisma.signature.create({
        data: {
          quoteId: quote.id,
          signerName: data.signerName,
          signerEmail: data.signerEmail,
          method: data.method as SignatureMethod,
          signatureData: data.signatureData ?? null,
          ipAddress: ip,
          userAgent: req.headers.get("user-agent") ?? null,
        },
      }),
    ]);

    // Notify business owner
    if (quote.business.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendQuoteAcceptedNotification({
        to: quote.business.email,
        clientName: quote.clientName,
        quoteTitle: quote.title,
        referenceNumber: quote.referenceNumber,
        total: quote.total,
        currency: quote.business.currency,
        dashboardUrl: `${appUrl}/quotes/${quote.id}`,
      }).catch(console.error); // don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    console.error("[accept quote]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
