"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, generateReferenceNumber, computeQuoteTotals } from "@/lib/utils";
import { addDays, format } from "date-fns";
import StepClientInfo from "./StepClientInfo";
import StepLineItems from "./StepLineItems";
import StepSettings from "./StepSettings";
import StepPreview from "./StepPreview";
import { User, List, Settings, Eye, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LineItemDraft {
  id: string;            // temp client-side id (not DB id yet)
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteDraft {
  // Step 1 — client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  clientId: string | null;        // link to existing CRM client

  // Step 2 — line items
  lineItems: LineItemDraft[];
  discountType: "percentage" | "flat" | "";
  discountValue: number;

  // Step 3 — settings
  title: string;
  referenceNumber: string;
  issueDate: string;
  expiryDate: string;
  taxRate: number;
  notes: string;
  terms: string;
  requireDeposit: boolean;
  depositPercent: number;
  followUpEnabled: boolean;
  templateStyle: "MINIMAL" | "PROFESSIONAL" | "BOLD";
}

export interface BusinessInfo {
  id: string;
  name: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  currency: string;
  taxRate: number;
  paymentTerms: string;
  defaultNotes: string | null;
  defaultTerms: string | null;
}

export interface ClientOption {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

// ── Steps config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Client",    icon: User },
  { label: "Line Items",icon: List },
  { label: "Settings",  icon: Settings },
  { label: "Preview",   icon: Eye },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  business: BusinessInfo;
  clients: ClientOption[];
  nextQuoteNumber: number;
}

export default function QuoteBuilder({ business, clients, nextQuoteNumber }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialise with business defaults
  const [draft, setDraft] = useState<QuoteDraft>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    clientId: null,

    lineItems: [
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, total: 0 },
    ],
    discountType: "",
    discountValue: 0,

    title: "New Quote",
    referenceNumber: generateReferenceNumber(nextQuoteNumber),
    issueDate: format(new Date(), "yyyy-MM-dd"),
    expiryDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    taxRate: business.taxRate,
    notes: business.defaultNotes ?? "",
    terms: business.defaultTerms ?? "",
    requireDeposit: false,
    depositPercent: 50,
    followUpEnabled: true,
    templateStyle: "PROFESSIONAL",
  });

  // Memoised patcher so child components don't need to know the full state shape
  const updateDraft = useCallback((patch: Partial<QuoteDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  // Computed totals — recalculated on every render (fast, no effect needed)
  const totals = computeQuoteTotals(
    draft.lineItems,
    draft.discountType || null,
    draft.discountValue,
    draft.taxRate,
    draft.requireDeposit,
    draft.depositPercent
  );

  // ── Save handlers ────────────────────────────────────────────────────────────

  const saveQuote = async (status: "DRAFT" | "SENT") => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, totals, status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save quote");
      }
      const { quoteId } = await res.json();
      router.push(`/quotes/${quoteId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step validation ──────────────────────────────────────────────────────────

  const canAdvance = (): boolean => {
    if (step === 0) {
      return (
        draft.clientName.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.clientEmail)
      );
    }
    if (step === 1) {
      return (
        draft.lineItems.length > 0 &&
        draft.lineItems.every((li) => li.description.trim() && li.quantity > 0 && li.unitPrice >= 0)
      );
    }
    if (step === 2) {
      return draft.title.trim().length >= 2;
    }
    return true;
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Quote</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {business.name} · {draft.referenceNumber}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < step;
          const isCurrent = i === step;
          return (
            <div key={i} className="flex items-center">
              {/* Circle */}
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium",
                  isCurrent
                    ? "bg-[#1E3A5F] text-white"
                    : isDone
                      ? "text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      : "text-slate-400 cursor-not-allowed"
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8 sm:w-12 mx-1 transition-colors",
                    i < step ? "bg-emerald-400" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="card p-6 sm:p-8 mb-6">
        {step === 0 && (
          <StepClientInfo draft={draft} update={updateDraft} clients={clients} />
        )}
        {step === 1 && (
          <StepLineItems
            draft={draft}
            update={updateDraft}
            totals={totals}
            currency={business.currency}
          />
        )}
        {step === 2 && (
          <StepSettings
            draft={draft}
            update={updateDraft}
            business={business}
            totals={totals}
            currency={business.currency}
          />
        )}
        {step === 3 && (
          <StepPreview
            draft={draft}
            business={business}
            totals={totals}
          />
        )}
      </div>

      {/* Error banner */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {saveError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/quotes")}
          className="btn-secondary"
        >
          ← {step === 0 ? "Cancel" : "Back"}
        </button>

        <div className="flex gap-3">
          {/* Save as draft available on all steps */}
          {step === 3 && (
            <button
              type="button"
              onClick={() => saveQuote("DRAFT")}
              disabled={isSaving}
              className="btn-secondary"
            >
              {isSaving ? "Saving…" : "Save Draft"}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="btn-primary"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => saveQuote("DRAFT")}
              disabled={isSaving}
              className="btn-brand"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save & Continue →"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
