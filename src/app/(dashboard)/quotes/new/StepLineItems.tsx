"use client";

import { useCallback } from "react";
import type { QuoteDraft, LineItemDraft } from "./QuoteBuilder";
import type { QuoteTotals } from "@/lib/utils";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Props {
  draft: QuoteDraft;
  update: (patch: Partial<QuoteDraft>) => void;
  totals: QuoteTotals;
  currency: string;
}

export default function StepLineItems({ draft, update, totals, currency }: Props) {
  const fmt = useCallback(
    (n: number) => formatCurrency(n, currency),
    [currency]
  );

  // ── Line item CRUD ──────────────────────────────────────────────────────────

  const addItem = () => {
    const newItem: LineItemDraft = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    update({ lineItems: [...draft.lineItems, newItem] });
  };

  const removeItem = (id: string) => {
    if (draft.lineItems.length === 1) return; // keep at least one row
    update({ lineItems: draft.lineItems.filter((li) => li.id !== id) });
  };

  const updateItem = (id: string, changes: Partial<LineItemDraft>) => {
    update({
      lineItems: draft.lineItems.map((li) => {
        if (li.id !== id) return li;
        const merged = { ...li, ...changes };
        merged.total = merged.quantity * merged.unitPrice;
        return merged;
      }),
    });
  };

  // ── Discount ────────────────────────────────────────────────────────────────

  const handleDiscountTypeChange = (type: "" | "percentage" | "flat") => {
    update({ discountType: type, discountValue: 0 });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Line Items</h2>
      <p className="text-slate-500 text-sm mb-6">
        Add the services or products you&apos;re quoting for.
      </p>

      {/* Column headers — desktop only */}
      <div className="hidden sm:grid grid-cols-[auto_1fr_100px_120px_100px_36px] gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
        <div className="w-5" />
        <div>Description</div>
        <div className="text-center">Qty</div>
        <div className="text-right">Unit Price</div>
        <div className="text-right">Total</div>
        <div />
      </div>

      {/* Line item rows */}
      <div className="space-y-2 mb-4">
        {draft.lineItems.map((item, idx) => (
          <div
            key={item.id}
            className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_100px_120px_100px_36px] gap-2 items-start p-3 sm:p-2 bg-slate-50 rounded-xl border border-slate-100"
          >
            {/* Drag handle (cosmetic for now) */}
            <div className="flex items-center justify-center w-5 pt-2.5 text-slate-300">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Description */}
            <div className="col-span-1">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder={`Item ${idx + 1} — e.g. Lawn mowing (front yard)`}
                className="input text-sm"
                required
              />
            </div>

            {/* Qty + Price + Total on mobile — stacked */}
            <div className="col-span-2 sm:contents grid grid-cols-3 gap-2">
              <div>
                <label className="sm:hidden text-xs text-slate-400 mb-1 block">Qty</label>
                <input
                  type="number"
                  value={item.quantity === 0 ? "" : item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, {
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                  placeholder="1"
                  className="input text-sm text-center"
                />
              </div>
              <div>
                <label className="sm:hidden text-xs text-slate-400 mb-1 block">Unit Price</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, {
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="input text-sm text-right pl-6"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="w-full text-right">
                  <label className="sm:hidden text-xs text-slate-400 mb-1 block">Total</label>
                  <p className="text-sm font-semibold text-slate-800 py-2.5">
                    {fmt(item.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              disabled={draft.lineItems.length === 1}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors mt-1",
                draft.lineItems.length === 1
                  ? "text-slate-200 cursor-not-allowed"
                  : "text-slate-400 hover:text-red-500 hover:bg-red-50"
              )}
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8 px-2"
      >
        <Plus className="w-4 h-4" />
        Add line item
      </button>

      {/* Totals section */}
      <div className="border-t border-slate-200 pt-5 space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span className="font-medium">{fmt(totals.subtotal)}</span>
        </div>

        {/* Discount row */}
        <div className="flex items-center gap-3 py-1">
          <span className="text-sm text-slate-600 flex-shrink-0">Discount</span>
          <select
            value={draft.discountType}
            onChange={(e) =>
              handleDiscountTypeChange(e.target.value as "" | "percentage" | "flat")
            }
            className="input text-sm w-36 flex-shrink-0"
          >
            <option value="">None</option>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount</option>
          </select>

          {draft.discountType && (
            <div className="relative w-28">
              {draft.discountType === "flat" && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {getCurrencySymbol(currency)}
                </span>
              )}
              <input
                type="number"
                value={draft.discountValue || ""}
                onChange={(e) =>
                  update({ discountValue: parseFloat(e.target.value) || 0 })
                }
                min="0"
                max={draft.discountType === "percentage" ? 100 : undefined}
                step="0.01"
                placeholder={draft.discountType === "percentage" ? "10" : "50.00"}
                className={cn("input text-sm text-right", draft.discountType === "flat" && "pl-6")}
              />
              {draft.discountType === "percentage" && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  %
                </span>
              )}
            </div>
          )}

          <span className="ml-auto text-sm font-medium text-red-500">
            {totals.discountAmount > 0 && `-${fmt(totals.discountAmount)}`}
          </span>
        </div>

        {/* Tax row */}
        <div className="flex items-center gap-3 py-1">
          <span className="text-sm text-slate-600 flex-shrink-0">Tax</span>
          <div className="relative w-24">
            <input
              type="number"
              value={draft.taxRate || ""}
              onChange={(e) => update({ taxRate: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              className="input text-sm text-right pr-7"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
          </div>
          <span className="ml-auto text-sm font-medium text-slate-600">
            {fmt(totals.taxAmount)}
          </span>
        </div>

        {/* Grand total */}
        <div className="flex justify-between pt-3 border-t border-slate-200">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-xl font-bold text-[#1E3A5F]">{fmt(totals.total)}</span>
        </div>

        {/* Deposit preview */}
        {totals.depositAmount !== null && (
          <div className="flex justify-between text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
            <span>Deposit required ({draft.depositPercent}%)</span>
            <span className="font-semibold">{fmt(totals.depositAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to get currency symbol for inline prefix
function getCurrencySymbol(currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency })
    .format(0)
    .replace(/[\d.,\s]/g, "")
    .trim();
}
