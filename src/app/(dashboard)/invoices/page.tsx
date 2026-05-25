import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Invoices" };

const INVOICE_STYLES: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: "Draft",     className: "bg-gray-100 text-gray-700 border-gray-200" },
  SENT:      { label: "Sent",      className: "bg-blue-50 text-blue-700 border-blue-200" },
  PAID:      { label: "Paid",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OVERDUE:   { label: "Overdue",   className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });
  if (!business) redirect("/onboarding");

  // Auto-mark overdue invoices
  await prisma.invoice.updateMany({
    where: {
      businessId: business.id,
      status: "SENT",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { businessId: business.id },
    include: {
      quote: {
        select: { clientName: true, clientEmail: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const currency = business.currency;
  const fmt = (n: number) => formatCurrency(n, currency);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.amountDue, 0);

  const totalOutstanding = invoices
    .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + i.amountDue, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Invoices", value: invoices.length, cls: "" },
          { label: "Paid", value: invoices.filter((i) => i.status === "PAID").length, cls: "text-emerald-600" },
          { label: "Outstanding", value: fmt(totalOutstanding), cls: "text-amber-600" },
          { label: "Collected", value: fmt(totalPaid), cls: "text-[#1E3A5F]" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className={cn("text-xl font-bold", s.cls || "text-slate-900")}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invoices table */}
      <div className="card overflow-hidden">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Receipt className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No invoices yet</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Invoices are created when you convert an accepted quote. Accept a
              quote first, then click &quot;Create Invoice&quot;.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_160px_100px_100px_90px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div>Invoice</div>
              <div>Client</div>
              <div className="text-right">Amount Due</div>
              <div className="text-right">Due Date</div>
              <div className="text-right">Status</div>
            </div>

            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const style = INVOICE_STYLES[inv.status] ?? INVOICE_STYLES.DRAFT;
                const isOverdue = inv.status === "OVERDUE";
                return (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_160px_100px_100px_90px] gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 font-mono text-sm group-hover:text-[#1E3A5F]">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {inv.quote.title}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        {inv.quote.clientName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold text-sm", isOverdue ? "text-red-600" : "text-slate-900")}>
                        {fmt(inv.amountDue)}
                      </p>
                    </div>
                    <div className="text-right flex items-center justify-end gap-1">
                      {isOverdue && <Clock className="w-3.5 h-3.5 text-red-400" />}
                      <p className={cn("text-sm", isOverdue ? "text-red-500" : "text-slate-500")}>
                        {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <span className={cn("badge text-xs", style.className)}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {style.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
