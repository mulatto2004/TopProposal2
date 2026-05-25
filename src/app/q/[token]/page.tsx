import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QuoteStatus } from "@/generated/prisma";
import AcceptQuotePanel from "./AcceptQuotePanel";
import { Zap } from "lucide-react";

// Auto-expire quotes past their expiry date on view
async function markExpiredIfNeeded(quoteId: string, expiryDate: Date | null) {
  if (expiryDate && new Date() > expiryDate) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.EXPIRED },
    });
    return true;
  }
  return false;
}

export default async function PublicQuotePage({
  params,
}: {
  params: { token: string };
}) {
  const quote = await prisma.quote.findUnique({
    where: { shareToken: params.token },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      business: {
        select: {
          name: true,
          logo: true,
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

  if (!quote) notFound();

  // Expire if needed
  const justExpired = await markExpiredIfNeeded(quote.id, quote.expiryDate);
  const isExpired = justExpired || quote.status === "EXPIRED";
  const isAccepted = quote.status === "ACCEPTED";
  const isDeclined = quote.status === "DECLINED";

  // Track view (increment counter + set viewedAt on first view)
  if (!["ACCEPTED", "DECLINED", "EXPIRED", "INVOICED"].includes(quote.status)) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        viewCount: { increment: 1 },
        viewedAt: quote.viewedAt ?? new Date(),
        status:
          quote.status === QuoteStatus.SENT ? QuoteStatus.VIEWED : undefined,
      },
    });
  }

  const currency = quote.business.currency;
  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded top bar */}
      <header className="bg-[#1E3A5F] text-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">{quote.business.name}</span>
          </div>
          <span className="text-white/50 text-xs font-mono">{quote.referenceNumber}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Status banners */}
        {isAccepted && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold text-emerald-800">Quote Accepted</p>
              <p className="text-sm text-emerald-600">
                Signed by {quote.signature?.signerName} on{" "}
                {quote.signature ? formatDate(quote.signature.signedAt) : "—"}
              </p>
            </div>
          </div>
        )}
        {isExpired && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="font-semibold text-orange-800">⏰ This Quote Has Expired</p>
            <p className="text-sm text-orange-600 mt-0.5">
              Please contact {quote.business.name} to request an updated quote.
            </p>
          </div>
        )}
        {isDeclined && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-semibold text-red-800">Quote Declined</p>
          </div>
        )}

        {/* Quote document */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-[#1E3A5F] text-white px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{quote.business.name}</h1>
                {quote.business.email && (
                  <p className="text-sm text-white/70 mt-0.5">{quote.business.email}</p>
                )}
                {quote.business.phone && (
                  <p className="text-sm text-white/70">{quote.business.phone}</p>
                )}
                {(quote.business.city || quote.business.state) && (
                  <p className="text-sm text-white/70">
                    {[quote.business.city, quote.business.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm font-semibold">QUOTE</p>
                <p className="text-2xl font-bold font-mono">{quote.referenceNumber}</p>
                <p className="text-white/60 text-xs mt-1">
                  Issued: {formatDate(quote.issueDate)}
                </p>
                {quote.expiryDate && (
                  <p className="text-white/60 text-xs">
                    Valid until: {formatDate(quote.expiryDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-6">
            {/* To / Subject */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Prepared For
                </p>
                <p className="font-semibold text-slate-900">{quote.clientName}</p>
                {quote.clientCompany && (
                  <p className="text-sm text-slate-500">{quote.clientCompany}</p>
                )}
                <p className="text-sm text-slate-500">{quote.clientEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Subject
                </p>
                <p className="font-semibold text-slate-900 max-w-[200px] text-right">
                  {quote.title}
                </p>
              </div>
            </div>

            {/* Line items */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Description
                    </th>
                    <th className="text-center py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 w-16">
                      Qty
                    </th>
                    <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">
                      Unit Price
                    </th>
                    <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-slate-700">{item.description}</td>
                      <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                      <td className="py-3 text-right font-semibold text-slate-800">
                        {fmt(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{fmt(quote.subtotal)}</span>
                </div>
                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Discount</span>
                    <span>-{fmt(quote.discountAmount)}</span>
                  </div>
                )}
                {quote.taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax ({quote.taxRate}%)</span>
                    <span>{fmt(quote.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t-2 border-slate-200">
                  <span>Total</span>
                  <span className="text-xl text-[#1E3A5F]">{fmt(quote.total)}</span>
                </div>
                {quote.requireDeposit && quote.depositAmount && (
                  <div className="flex justify-between text-sm text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg">
                    <span>Deposit required ({quote.depositPercent}%)</span>
                    <span className="font-semibold">{fmt(quote.depositAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}

            {/* Terms */}
            {quote.terms && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Terms & Conditions
                </p>
                <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {quote.terms}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Accept panel — only shown if not already accepted/expired/declined */}
        {!isAccepted && !isExpired && !isDeclined && (
          <AcceptQuotePanel
            quoteId={quote.id}
            shareToken={params.token}
            clientName={quote.clientName}
            clientEmail={quote.clientEmail}
            total={quote.total}
            depositAmount={quote.depositAmount}
            depositPercent={quote.depositPercent}
            requireDeposit={quote.requireDeposit}
            currency={currency}
            businessName={quote.business.name}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400">
        Powered by{" "}
        <span className="font-semibold text-slate-500">TopProposal</span>
      </footer>
    </div>
  );
}
