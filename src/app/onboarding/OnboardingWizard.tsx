"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Zap, Building2, Settings2, CheckCircle2 } from "lucide-react";

// No external schema needed — manual validation keeps form types simple

// Form uses string inputs; validated output has number taxRate
type OnboardingFormValues = {
  businessName: string;
  industry: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  currency: string;
  taxRate: string; // raw string from <input type="number">
  paymentTerms: string;
  defaultTerms?: string;
};

type OnboardingData = {
  businessName: string;
  industry: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  currency: string;
  taxRate: number;
  paymentTerms: string;
  defaultTerms?: string;
};

// ── Industry options ───────────────────────────────────────────────────────────
const INDUSTRIES = [
  { value: "construction", label: "🏗️ Construction & Contracting" },
  { value: "cleaning", label: "🧹 Cleaning Services" },
  { value: "landscaping", label: "🌿 Landscaping & Lawn Care" },
  { value: "photography", label: "📷 Photography & Videography" },
  { value: "design", label: "🎨 Design & Creative" },
  { value: "consulting", label: "💼 Consulting & Coaching" },
  { value: "it", label: "💻 IT & Technology" },
  { value: "events", label: "🎉 Events & Catering" },
  { value: "beauty", label: "💆 Beauty & Wellness" },
  { value: "other", label: "✨ Other Services" },
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "CAD", label: "CAD — Canadian Dollar (CA$)" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)" },
  { value: "NGN", label: "NGN — Nigerian Naira (₦)" },
  { value: "ZAR", label: "ZAR — South African Rand (R)" },
];

const PAYMENT_TERMS = [
  "Due on receipt",
  "Net 7",
  "Net 14",
  "Net 30",
  "Net 60",
  "50% upfront, 50% on completion",
];

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Welcome", icon: Zap },
  { label: "Business", icon: Building2 },
  { label: "Preferences", icon: Settings2 },
  { label: "Done", icon: CheckCircle2 },
];

interface Props {
  userId: string;
  userName?: string | null;
}

export default function OnboardingWizard({ userId, userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      currency: "USD",
      taxRate: "0",
      paymentTerms: "Due on receipt",
    },
  });

  const onSubmit: SubmitHandler<OnboardingFormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: OnboardingData = {
        ...data,
        taxRate: parseFloat(data.taxRate) || 0,
      };
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Something went wrong");
      }
      setStep(3); // Show success step
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isComplete = i < step;
            const isCurrent = i === step;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-[#1E3A5F] text-white"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    isCurrent ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 sm:p-8">
            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
                </h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Let&apos;s set up your TopProposal account in 2 minutes. You&apos;ll
                  be sending professional quotes to clients before you know it.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                  {[
                    { emoji: "⚡", text: "Create quotes in minutes" },
                    { emoji: "✍️", text: "Get e-signatures" },
                    { emoji: "📊", text: "Track opens & views" },
                  ].map((f) => (
                    <div key={f.text} className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-2xl mb-1">{f.emoji}</div>
                      <p className="text-xs text-slate-600 font-medium leading-tight">
                        {f.text}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-primary w-full py-3 text-base"
                >
                  Get Started →
                </button>
              </div>
            )}

            {/* ── Step 1: Business Info ── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Tell us about your business
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  This info will appear on all your quotes.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Business name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("businessName")}
                      placeholder="e.g. Green Lawn Services"
                      className="input"
                    />
                    {errors.businessName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select {...register("industry")} className="input">
                      <option value="">Select your industry...</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.industry.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Phone
                      </label>
                      <input
                        {...register("phone")}
                        placeholder="+1 (555) 000-0000"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        City
                      </label>
                      <input
                        {...register("city")}
                        placeholder="New York"
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Preferences ── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Quote preferences
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  These become your defaults — you can change them per quote.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Currency
                      </label>
                      <select {...register("currency")} className="input">
                        {CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tax rate (%)
                      </label>
                      <input
                        {...register("taxRate")}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Default payment terms
                    </label>
                    <select {...register("paymentTerms")} className="input">
                      {PAYMENT_TERMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Default terms & conditions{" "}
                      <span className="text-slate-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      {...register("defaultTerms")}
                      rows={4}
                      placeholder="e.g. Payment is due within 30 days. A 1.5% monthly late fee applies to overdue balances..."
                      className="input resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      These will pre-fill on every quote you create.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  You&apos;re all set! 🎉
                </h2>
                <p className="text-slate-500">
                  Taking you to your dashboard...
                </p>
                <div className="mt-6 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-[progress_1.8s_ease-out_forwards]" />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          {step > 0 && step < 3 && (
            <div className="px-6 sm:px-8 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                ← Back
              </button>

              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-primary flex-1"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Finish Setup ✓"}
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-white/50 text-xs mt-4">
        TopProposal · All your data is encrypted and secure
      </p>
    </div>
  );
}
