import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma";
import { z } from "zod";

const schema = z.object({
  reason: z.string().optional().default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (["ACCEPTED", "DECLINED", "EXPIRED"].includes(quote.status)) {
    return NextResponse.json(
      { error: "Quote already finalised" },
      { status: 409 }
    );
  }

  try {
    const body = await req.json();
    const { reason } = schema.parse(body);

    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.DECLINED,
        declinedAt: new Date(),
        declineReason: reason || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[decline quote]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
