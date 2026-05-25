"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Bell,
  Save,
  ExternalLink,
  CheckCircle,
  Crown,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusinessData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  industry: string;
  taxRate: number;
  currency: string;
  paymentTerms: string;
  defaultNotes: string;
  defaultTerms: string;
}

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripe: boolean;
  quotesThisMonth: number;
}

interface Props {
  activeTab: string;
  business: BusinessData;
  subscription: SubscriptionData | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile", label: "Business Profile", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "NZD", label: "NZD — New Zealand Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "ZAR", label: "ZAR — South African Rand" },
];

const INDUSTRIES = [
  "Construction",
  "Cleaning",
  "Photography",
  "Videography",
  "Landscaping",
  "Consulting",
  "Design",
  "Development",
  "Marketing",
  "Event Planning",
  "Catering",
  "Electrician",
  "Plumbing",
  "HVAC",
  "Painting",
  "Roofing",
  "Other",
];

const PAYMENT_TERMS = [
  "Due on receipt",
  "Net 7",
  "Net 14",
  "Net 30",
  "Net 60",
  "50% upfront, 50% on completion",
];

const PLAN_INFO: Record<
  string,
  { label: string; color: string; icon: typeof Crown; features: string[] }
> = {
  FREE: {
    label: "Free",
    color: "text-slate-600",
    icon: Zap,
    features: ["3 quotes/month", "PDF download", "Basic templates"],
  },
  PRO: {
    label: "Pro — $19/mo",
    color: "text-emerald-600",
    icon: Crown,
    features: [
      "Unlimited quotes",
      "Email sending",
      "E-signatures",
      "Follow-up automations",
      "Invoice conversion",
      "CRM",
    ],
  },
  BUSINESS: {
    label: "Business — $49/mo",
    color: "text-[#1E3A5F]",
    icon: Shield,
    features: [
      "Everything in Pro",
      "Priority support",
      "Team members (coming soon)",
      "Custom branding",
    ],
  },
};

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ business }: { business: BusinessData }) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessData>(business);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof BusinessData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Info */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Business Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business Name *">
            <input
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </Field>
          <Field label="Industry">
            <select
              className="input"
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i.toLowerCase()}>
                  {i}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Business Email">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="billing@yourcompany.com"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              className="input sm:col-span-2"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://yourcompany.com"
            />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address">
              <input
                className="input"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="123 Main St"
              />
            </Field>
          </div>
          <Field label="City">
            <input
              className="input"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="State / Province">
            <input
              className="input"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
            />
          </Field>
          <Field label="ZIP / Postal Code">
            <input
              className="input"
              value={form.zipCode}
              onChange={(e) => set("zipCode", e.target.value)}
            />
          </Field>
          <Field label="Country">
            <input
              className="input"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Financial Defaults */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">
          Financial Defaults
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <select
              className="input"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default Tax Rate (%)" hint="Applied by default to new quotes">
            <input
              type="number"
              className="input"
              value={form.taxRate}
              onChange={(e) => set("taxRate", parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Payment Terms">
              <select
                className="input"
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* Default Content */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Default Content</h2>
        <div className="space-y-4">
          <Field
            label="Default Notes"
            hint="Pre-filled on every new quote. Clients can see this."
          >
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.defaultNotes}
              onChange={(e) => set("defaultNotes", e.target.value)}
              placeholder="Thank you for your interest in our services…"
            />
          </Field>
          <Field
            label="Default Terms & Conditions"
            hint="Legal terms shown at the bottom of every quote."
          >
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.defaultTerms}
              onChange={(e) => set("defaultTerms", e.target.value)}
              placeholder="Payment is due within 30 days of invoice date…"
            />
          </Field>
        </div>
      </div>

      {/* Save */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>
    </form>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    quoteViewed: true,
    quoteAccepted: true,
    quoteDeclined: true,
    followUpSent: false,
    invoicePaid: true,
    weeklyDigest: false,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    {
      key: "quoteViewed",
      label: "Quote Viewed",
      desc: "When a client opens your quote link",
    },
    {
      key: "quoteAccepted",
      label: "Quote Accepted",
      desc: "When a client signs and accepts a quote",
    },
    {
      key: "quoteDeclined",
      label: "Quote Declined",
      desc: "When a client declines a quote",
    },
    {
      key: "followUpSent",
      label: "Follow-up Sent",
      desc: "When an automated follow-up email goes out",
    },
    {
      key: "invoicePaid",
      label: "Invoice Paid",
      desc: "When you mark an invoice as paid",
    },
    {
      key: "weeklyDigest",
      label: "Weekly Digest",
      desc: "A summary of your quotes and revenue each Monday",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-1">
          Email Notifications
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Choose which events trigger an email to your account.
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <div
                onClick={() => toggle(item.key)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors flex-shrink-0",
                  prefs[item.key] ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    prefs[item.key] ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex">
        <button className="btn-primary">
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// ── Billing Tab ───────────────────────────────────────────────────────────────

function BillingTab({
  subscription,
}: {
  subscription: SubscriptionData | null;
}) {
  const [loading, setLoading] = useState(false);

  const plan = subscription?.plan ?? "FREE";
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.FREE;
  const PlanIcon = planInfo.icon;

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Could not open billing portal.");
    } catch {
      alert("Error opening billing portal.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Could not open checkout.");
    } catch {
      alert("Error opening checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Current Plan</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Your subscription details
            </p>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              planInfo.color
            )}
          >
            <PlanIcon className="w-4 h-4" />
            {planInfo.label}
          </span>
        </div>

        {/* Plan features */}
        <ul className="space-y-1.5 mb-5">
          {planInfo.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Usage (FREE only) */}
        {plan === "FREE" && subscription && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
            <p className="text-sm font-medium text-amber-800">
              {subscription.quotesThisMonth} / 3 quotes used this month
            </p>
            <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (subscription.quotesThisMonth / 3) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Period info */}
        {subscription?.currentPeriodEnd && (
          <p className="text-xs text-slate-400 mb-4">
            {subscription.cancelAtPeriodEnd
              ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
          </p>
        )}

        {/* Actions */}
        {subscription?.hasStripe ? (
          <button
            onClick={handlePortal}
            disabled={loading}
            className="btn-secondary"
          >
            <ExternalLink className="w-4 h-4" />
            {loading ? "Opening…" : "Manage Billing"}
          </button>
        ) : null}
      </div>

      {/* Upgrade plans */}
      {plan === "FREE" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pro */}
          <div className="card p-5 border-2 border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-600">Pro</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">
              $19
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <ul className="space-y-1.5 mb-4 mt-3">
              {PLAN_INFO.PRO.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                handleUpgrade(
                  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ""
                )
              }
              disabled={loading}
              className="btn-primary w-full"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Business */}
          <div className="card p-5 border-2 border-[#1E3A5F]/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#1E3A5F]" />
              <span className="font-bold text-[#1E3A5F]">Business</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">
              $49
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <ul className="space-y-1.5 mb-4 mt-3">
              {PLAN_INFO.BUSINESS.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-[#1E3A5F] flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                handleUpgrade(
                  process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID ?? ""
                )
              }
              disabled={loading}
              className="w-full border-2 border-[#1E3A5F] text-[#1E3A5F] font-semibold rounded-xl py-2 hover:bg-[#1E3A5F] hover:text-white transition-colors"
            >
              Upgrade to Business
            </button>
          </div>
        </div>
      )}

      {/* Manage existing paid plan */}
      {plan !== "FREE" && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Manage Plan</h2>
          <p className="text-sm text-slate-500 mb-4">
            Update payment method, download receipts, or cancel your
            subscription via the billing portal.
          </p>
          <button
            onClick={handlePortal}
            disabled={loading}
            className="btn-secondary"
          >
            <ExternalLink className="w-4 h-4" />
            {loading ? "Opening…" : "Open Billing Portal"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsTabs({
  activeTab,
  business,
  subscription,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(activeTab);

  const switchTab = (id: string) => {
    setTab(id);
    router.push(`/settings?tab=${id}`, { scroll: false });
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-[#1E3A5F] text-[#1E3A5F]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "profile" && <ProfileTab business={business} />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "billing" && <BillingTab subscription={subscription} />}
    </div>
  );
}
