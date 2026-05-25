"use client";

import type { QuoteDraft, BusinessInfo } from "./QuoteBuilder";
import type { QuoteTotals } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

const TEMPLATE_STYLES = [
  {
    id: "MINIMAL" as const,
    label: "Minimal",
    description: "Clean, whitespace-heavy layout",
    preview: "⬜",
  },
  {
    id: "PROFESSIONAL" as const,
    label: "Professional",
    description: "Classic business look with header",
    preview: "🏢",
  },
  {
    id: "BOLD" as const,
    label: "Bold",
    description: "Dark header, strong typography",
    preview: "◼",
  },
];

interface Props {
  draft: QuoteDraft;
  update: (patch: Partial<QuoteDraft>) => void;
  business: BusinessInfo;
  totals: QuoteTotals;
  currency: string;
}

export default function StepSettings({
  draft,
  update,
  business,
  totals,
  currency,
}: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Quote Settings</h2>
        <p className="text-slate-500 text-sm">Configure dates, terms, and presentation.</p>
      </div>

      {/* ── Quote identity ────────────────────────────────────────────────────── */}
      <section>
        <p className="section-label">Quote Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Quote Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Weekly Lawn Care Service"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reference Number
            </label>
            <input
              type="text"
              value={draft.referenceNumber}
              onChange={(e) => update({ referenceNumber: e.target.value })}
              className="input font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Payment Terms
            </label>
            <select
              value={business.paymentTerms}
              disabled
              className="input opacity-70 cursor-not-allowed"
              title="Set in Settings"
            >
              <option>{business.paymentTerms}</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Change default in{" "}
              <a href="/settings" className="text-emerald-600 hover:underline">
                Settings
              </a>
              .
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Issue Date
            </label>
            <input
              type="date"
              value={draft.issueDate}
              onChange={(e) => update({ issueDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Expiry Date{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={draft.expiryDate}
              onChange={(e) => update({ expiryDate: e.target.value })}
              className="input"
            />
            <p className="text-xs text-slate-400 mt-1">
              After this date the quote auto-expires.
            </p>
          </div>
        </div>
      </section>

      {/* ── Deposit ───────────────────────────────────────────────────────────── */}
      <section>
        <p className="section-label">Deposit</p>
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="requireDeposit"
            checked={draft.requireDeposit}
            onChange={(e) => update({ requireDeposit: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-emerald-500"
          />
          <label htmlFor="requireDeposit" className="flex-1 cursor-pointer">
            <p className="text-sm font-medium text-slate-800">
              Require a deposit before work begins
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Client will pay via Stripe after signing the quote.
            </p>
          </label>
        </div>

        {draft.requireDeposit && (
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Deposit %
              </label>
              <div className="relative w-24">
                <input
                  type="number"
                  value={draft.depositPercent}
                  onChange={(e) =>
                    update({
                      depositPercent: Math.min(100, Math.max(1, parseFloat(e.target.value) || 0)),
                    })
                  }
                  min="1"
                  max="100"
                  className="input text-right pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <Info className="w-3.5 h-3.5" />
              Deposit amount:{" "}
              <strong>{fmt(totals.depositAmount ?? 0)}</strong>
            </div>
          </div>
        )}
      </section>

      {/* ── Follow-up automation ─────────────────────────────────────────────── */}
      <section>
        <p className="section-label">Follow-up Automation</p>
        <div className="space-y-2">
          {[
            {
              label: "48-hour reminder",
              desc: "Send client a reminder if they haven't opened the quote after 48 hours.",
            },
            {
              label: "72-hour nudge",
              desc: "Send a gentle nudge if they've opened but not accepted after 72 hours.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                draft.followUpEnabled
                  ? "bg-blue-50 border-blue-200"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <input
                type="checkbox"
                checked={draft.followUpEnabled}
                onChange={(e) => update({ followUpEnabled: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-blue-500"
                id={`followup-${i}`}
              />
              <label htmlFor={`followup-${i}`} className="cursor-pointer">
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* ── Notes & Terms ─────────────────────────────────────────────────────── */}
      <section>
        <p className="section-label">Notes & Terms</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notes to client{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => update({ notes: e.target.value })}
              rows={4}
              placeholder="Thank you for the opportunity! Please don't hesitate to reach out with any questions."
              className="input resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Terms & Conditions{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={draft.terms}
              onChange={(e) => update({ terms: e.target.value })}
              rows={4}
              placeholder="Payment due within 30 days of invoice. Late payments subject to 1.5% monthly fee."
              className="input resize-none"
            />
          </div>
        </div>
      </section>

      {/* ── Template Style ────────────────────────────────────────────────────── */}
      <section>
        <p className="section-label">Quote Style</p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATE_STYLES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => update({ templateStyle: tpl.id })}
              className={cn(
                "p-4 rounded-xl border-2 text-center transition-all",
                draft.templateStyle === tpl.id
                  ? "border-[#1E3A5F] bg-[#1E3A5F]/5 ring-1 ring-[#1E3A5F]"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="text-2xl mb-1">{tpl.preview}</div>
              <p className="font-semibold text-sm text-slate-800">{tpl.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{tpl.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
