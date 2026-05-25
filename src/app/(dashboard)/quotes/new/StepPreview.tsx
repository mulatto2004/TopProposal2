"use client";

import type { QuoteDraft, BusinessInfo } from "./QuoteBuilder";
import type { QuoteTotals } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  draft: QuoteDraft;
  business: BusinessInfo;
  totals: QuoteTotals;
}

export default function StepPreview({ draft, business, totals }: Props) {
  const fmt = (n: number) => formatCurrency(n, business.currency);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
          <p className="text-slate-500 text-sm">
            This is how your quote will look to the client.
          </p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
          {draft.templateStyle} style
        </span>
      </div>

      {/* The quote document preview */}
      <div
        className={cn(
          "border rounded-2xl overflow-hidden shadow-sm",
          draft.templateStyle === "BOLD" ? "border-slate-800" : "border-slate-200"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "px-8 py-6",
            draft.templateStyle === "MINIMAL"
              ? "bg-white border-b border-slate-100"
              : draft.templateStyle === "PROFESSIONAL"
                ? "bg-[#1E3A5F] text-white"
                : "bg-slate-900 text-white"
          )}
        >
          <div className="flex items-start justify-between">
            {/* Business info */}
            <div>
              <h1
                className={cn(
                  "text-xl font-bold",
                  draft.templateStyle === "MINIMAL" ? "text-slate-900" : "text-white"
                )}
              >
                {business.name}
              </h1>
              {business.email && (
                <p className={cn("text-sm mt-0.5", draft.templateStyle === "MINIMAL" ? "text-slate-500" : "text-white/70")}>
                  {business.email}
                </p>
              )}
              {business.phone && (
                <p className={cn("text-sm", draft.templateStyle === "MINIMAL" ? "text-slate-500" : "text-white/70")}>
                  {business.phone}
                </p>
              )}
            </div>

            {/* Quote meta */}
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-semibold",
                  draft.templateStyle === "MINIMAL" ? "text-slate-400" : "text-white/60"
                )}
              >
                QUOTE
              </p>
              <p
                className={cn(
                  "text-2xl font-bold font-mono",
                  draft.templateStyle === "MINIMAL" ? "text-slate-900" : "text-white"
                )}
              >
                {draft.referenceNumber}
              </p>
              <p className={cn("text-xs mt-1", draft.templateStyle === "MINIMAL" ? "text-slate-400" : "text-white/60")}>
                Issued: {draft.issueDate ? formatDate(draft.issueDate) : "—"}
              </p>
              {draft.expiryDate && (
                <p className={cn("text-xs", draft.templateStyle === "MINIMAL" ? "text-slate-400" : "text-white/60")}>
                  Valid until: {formatDate(draft.expiryDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-8 py-6 space-y-6">
          {/* To / Quote title */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Prepared For
              </p>
              <p className="font-semibold text-slate-900">{draft.clientName || "Client Name"}</p>
              {draft.clientCompany && (
                <p className="text-sm text-slate-500">{draft.clientCompany}</p>
              )}
              <p className="text-sm text-slate-500">{draft.clientEmail || "client@example.com"}</p>
              {draft.clientPhone && (
                <p className="text-sm text-slate-500">{draft.clientPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Subject
              </p>
              <p className="font-semibold text-slate-900 max-w-[200px] text-right">
                {draft.title}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-sm">
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
                {draft.lineItems
                  .filter((li) => li.description.trim() || li.unitPrice > 0)
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-slate-700">
                        {item.description || <span className="text-slate-300 italic">Item description</span>}
                      </td>
                      <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium text-slate-800">{fmt(item.total)}</td>
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
                <span>{fmt(totals.subtotal)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>
                    Discount{" "}
                    {draft.discountType === "percentage" && `(${draft.discountValue}%)`}
                  </span>
                  <span>-{fmt(totals.discountAmount)}</span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({draft.taxRate}%)</span>
                  <span>{fmt(totals.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-slate-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-lg text-[#1E3A5F]">{fmt(totals.total)}</span>
              </div>
              {totals.depositAmount !== null && (
                <div className="flex justify-between text-sm text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg">
                  <span>Deposit required ({draft.depositPercent}%)</span>
                  <span className="font-semibold">{fmt(totals.depositAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {draft.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Notes
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{draft.notes}</p>
            </div>
          )}

          {/* Terms */}
          {draft.terms && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Terms & Conditions
              </p>
              <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                {draft.terms}
              </p>
            </div>
          )}

          {/* Signature placeholder */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-end gap-12">
              <div className="flex-1">
                <div className="h-12 border-b-2 border-slate-300 border-dashed mb-1" />
                <p className="text-xs text-slate-400">Client Signature</p>
              </div>
              <div className="flex-1">
                <div className="h-12 border-b-2 border-slate-300 border-dashed mb-1" />
                <p className="text-xs text-slate-400">Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center">
          <p className="text-xs text-slate-400">
            Created with TopProposal · This quote is valid until{" "}
            {draft.expiryDate ? formatDate(draft.expiryDate) : "further notice"}
          </p>
        </div>
      </div>
    </div>
  );
}
