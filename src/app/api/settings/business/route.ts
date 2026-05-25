import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    website,
    industry,
    taxRate,
    currency,
    paymentTerms,
    defaultNotes,
    defaultTerms,
  } = body;

  if (!name || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Business name is required" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null,
      country: country?.trim() || "US",
      website: website?.trim() || null,
      industry: industry?.trim() || null,
      taxRate: parseFloat(taxRate) || 0,
      currency: currency?.trim() || "USD",
      paymentTerms: paymentTerms?.trim() || "Due on receipt",
      defaultNotes: defaultNotes?.trim() || null,
      defaultTerms: defaultTerms?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, business: updated });
}
