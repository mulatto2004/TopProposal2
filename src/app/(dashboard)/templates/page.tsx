import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Templates" };

const TEMPLATES = [
  {
    id: "PROFESSIONAL",
    name: "Professional",
    description:
      "Clean, polished layout trusted by consultants and agencies. Balanced spacing with a modern navy accent.",
    badge: "Most Popular",
    badgeCls: "bg-emerald-100 text-emerald-700",
    preview: {
      accent: "#1E3A5F",
      headerBg: "#1E3A5F",
      textPrimary: "#1e293b",
      textSecondary: "#64748b",
    },
  },
  {
    id: "MINIMAL",
    name: "Minimal",
    description:
      "Ultra-clean with maximum white space. Perfect for creative professionals who want the work to speak.",
    badge: "Clean",
    badgeCls: "bg-slate-100 text-slate-600",
    preview: {
      accent: "#374151",
      headerBg: "#f9fafb",
      textPrimary: "#111827",
      textSecondary: "#6b7280",
    },
  },
  {
    id: "BOLD",
    name: "Bold",
    description:
      "High-impact design with strong colour blocks. Ideal for contractors, landscapers, and trades.",
    badge: "High Impact",
    badgeCls: "bg-amber-100 text-amber-700",
    preview: {
      accent: "#10B981",
      headerBg: "#10B981",
      textPrimary: "#111827",
      textSecondary: "#374151",
    },
  },
];

function TemplatePreview({
  accent,
  headerBg,
}: {
  accent: string;
  headerBg: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-100 bg-white aspect-[3/4] relative">
      {/* Header bar */}
      <div
        className="h-10 w-full px-3 flex items-center justify-between"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex flex-col gap-0.5">
          <div
            className="h-1.5 w-14 rounded-full"
            style={{ backgroundColor: headerBg === "#f9fafb" ? "#9ca3af" : "rgba(255,255,255,0.7)" }}
          />
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: headerBg === "#f9fafb" ? "#d1d5db" : "rgba(255,255,255,0.4)" }}
          />
        </div>
        <div
          className="h-5 w-14 rounded text-center flex items-center justify-center"
          style={{
            backgroundColor: headerBg === "#f9fafb" ? accent : "rgba(255,255,255,0.2)",
          }}
        >
          <div className="h-1.5 w-8 rounded-full bg-white/70" />
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Client block */}
        <div className="space-y-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
          <div className="h-1.5 w-20 rounded-full bg-slate-800" />
          <div className="h-1 w-16 rounded-full bg-slate-300" />
        </div>

        {/* Table header */}
        <div
          className="flex gap-1 rounded py-1 px-1.5"
          style={{ backgroundColor: `${accent}15` }}
        >
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
          <div className="w-6 h-1 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
        </div>

        {/* Table rows */}
        {[0.8, 0.6, 0.7].map((op, i) => (
          <div key={i} className="flex gap-1 py-0.5 border-b border-slate-50">
            <div className="flex-1 h-1 bg-slate-200 rounded-full" style={{ opacity: op }} />
            <div className="w-6 h-1 bg-slate-200 rounded-full" style={{ opacity: op }} />
            <div className="w-8 h-1 bg-slate-300 rounded-full" style={{ opacity: op }} />
          </div>
        ))}

        {/* Total */}
        <div className="flex justify-end">
          <div
            className="flex gap-2 items-center"
          >
            <div className="h-1 w-8 bg-slate-400 rounded-full" />
            <div
              className="h-2 w-12 rounded"
              style={{ backgroundColor: accent, opacity: 0.8 }}
            />
          </div>
        </div>

        {/* Notes box */}
        <div className="mt-2 rounded p-1.5 bg-slate-50 space-y-1">
          <div className="h-1 w-8 bg-slate-300 rounded-full" />
          <div className="h-1 w-full bg-slate-200 rounded-full" />
          <div className="h-1 w-4/5 bg-slate-200 rounded-full" />
        </div>
      </div>

      {/* Footer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-4 border-t border-slate-100 flex items-center justify-between px-3">
        <div className="h-0.5 w-12 bg-slate-200 rounded-full" />
        <div className="h-0.5 w-8 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Choose a template style when creating a new quote
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      <p className="text-sm text-slate-500 mb-8 max-w-xl">
        Template styles control the look of your client-facing quote page and
        the exported PDF. You can select a template per-quote in the quote
        builder.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="card p-5 hover:shadow-md transition-shadow group"
          >
            {/* Preview */}
            <div className="mb-4">
              <TemplatePreview
                accent={tpl.preview.accent}
                headerBg={tpl.preview.headerBg}
              />
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="font-semibold text-slate-900">{tpl.name}</h2>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", tpl.badgeCls)}>
                {tpl.badge}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">{tpl.description}</p>

            <Link
              href={`/quotes/new?template=${tpl.id}`}
              className="btn-secondary w-full text-sm justify-center"
            >
              Use {tpl.name}
            </Link>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="mt-8 card p-5 bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">
              All templates are fully responsive
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Every template renders perfectly in the browser, on mobile, and as
              a downloaded PDF. Your branding (logo, business name, contact
              details) is applied automatically from your{" "}
              <Link
                href="/settings"
                className="text-emerald-600 hover:underline"
              >
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
