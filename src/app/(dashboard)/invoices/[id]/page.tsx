import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceActions from "./InvoiceActions";
import { ArrowLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    select: { invoiceNumber: true },
  });
  return { title: inv ? inv.invoiceNumber : "Invoice" };
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-700 border-gray-200",
  SENT:      "bg-blue-50 text-blue-700 border-blue-200",
  PAID:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE:   "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, email: true, currency: true },
  });
  if (!business) redirect("/onboarding");

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      quote: {
        include: {
          lineItems: { orderBy: { sortOrder: "asc" } },
          business: { select: { id: true, userId: true } },
        },
      },
    },
  });

  if (!invoice || invoice.quote.business.userId !== session.user.id) notFound();

  const fmt = (n: number) => formatCurrency(n, business.currency);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">
              {invoice.invoiceNumber}
            </h1>
            <span className={cn("badge", STATUS_BADGE[invoice.status] ?? STATUS_BADGE.DRAFT)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Created {formatDate(invoice.createdAt)} ·{" "}
            <Link
              href={`/quotes/${invoice.quoteId}`}
              className="text-emerald-600 hover:underline"
            >
              View Quote ↗
            </Link>
          </p>
        </div>
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status}
          clientEmail={invoice.quote.clientEmail}
          clientName={invoice.quote.clientName}
          amountDue={invoice.amountDue}
          currency={business.currency}
          invoiceNumber={invoice.invoiceNumber}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice document */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client info */}
          <div className="card p-5">
            <p className="section-label">Billed To</p>
            <p className="font-semibold text-slate-900">{invoice.quote.clientName}</p>
            {invoice.quote.clientCompany && (
              <p className="text-sm text-slate-500">{invoice.quote.clientCompany}</p>
            )}
            <p className="text-sm text-slate-500">{invoice.quote.clientEmail}</p>
          </div>

          {/* Line items */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Services
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400">Description</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-400 w-16">Qty</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400 w-24">Unit Price</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoice.quote.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-slate-700">{item.description}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{fmt(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Discount</span>
                  <span>-{fmt(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax</span>
                  <span>{fmt(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>Invoice Total</span>
                <span className="font-semibold">{fmt(invoice.total)}</span>
              </div>
              {invoice.depositPaid > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Deposit Paid</span>
                  <span>-{fmt(invoice.depositPaid)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-slate-200">
                <span className="font-bold text-slate-900 text-base">Amount Due</span>
                <span className="font-bold text-xl text-[#1E3A5F]">
                  {fmt(invoice.amountDue)}
                </span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="card p-5">
              <p className="section-label">Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="section-label">Payment Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Total</span>
                <span className="font-medium">{fmt(invoice.total)}</span>
              </div>
              {invoice.depositPaid > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Deposit Paid</span>
                  <span className="font-medium">-{fmt(invoice.depositPaid)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
                <span>Amount Due</span>
                <span className="text-[#1E3A5F]">{fmt(invoice.amountDue)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <p className="section-label">Dates</p>
            <dl className="space-y-2 text-sm">
              {[
                { label: "Issued", value: formatDate(invoice.issueDate) },
                { label: "Due", value: invoice.dueDate ? formatDate(invoice.dueDate) : "—" },
                { label: "Sent", value: invoice.sentAt ? formatDate(invoice.sentAt) : "Not sent" },
                { label: "Paid", value: invoice.paidAt ? formatDate(invoice.paidAt) : "—" },
              ].map((d) => (
                <div key={d.label} className="flex justify-between">
                  <dt className="text-slate-500">{d.label}</dt>
                  <dd className="font-medium text-slate-800">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-4">
            <p className="section-label">From Quote</p>
            <Link
              href={`/quotes/${invoice.quoteId}`}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-600"
            >
              <FileText className="w-4 h-4" />
              {invoice.quote.title}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
