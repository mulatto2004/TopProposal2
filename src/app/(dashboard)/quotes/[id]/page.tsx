import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import QuoteActions from "./QuoteActions";
import {
  ArrowLeft,
  Eye,
  Clock,
  CheckCircle,
  ExternalLink,
  Copy,
} from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    select: { title: true, referenceNumber: true },
  });
  return { title: quote ? `${quote.referenceNumber} — ${quote.title}` : "Quote" };
}

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      business: {
        select: {
          id: true,
          userId: true,
          name: true,
          currency: true,
          email: true,
        },
      },
      signature: true,
      invoice: { select: { id: true, invoiceNumber: true, status: true } },
    },
  });

  if (!quote) notFound();
  if (quote.business.userId !== session.user.id) redirect("/quotes");

  const currency = quote.business.currency;
  const fmt = (n: number) => formatCurrency(n, currency);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/q/${quote.shareToken}`;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quotes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {quote.title}
            </h1>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1 font-mono">
            {quote.referenceNumber} · Created {formatDate(quote.createdAt)}
          </p>
        </div>
        {/* Action buttons (client component for interactivity) */}
        <QuoteActions
          quoteId={quote.id}
          status={quote.status}
          shareUrl={shareUrl}
          clientEmail={quote.clientEmail}
          hasInvoice={!!quote.invoice}
          invoiceId={quote.invoice?.id ?? null}
        />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total",
            value: fmt(quote.total),
            icon: null,
            highlight: true,
          },
          {
            label: "Views",
            value: quote.viewCount,
            icon: Eye,
            highlight: false,
          },
          {
            label: "Sent",
            value: quote.sentAt ? formatDate(quote.sentAt) : "Not sent",
            icon: Clock,
            highlight: false,
          },
          {
            label: "Accepted",
            value: quote.acceptedAt ? formatDate(quote.acceptedAt) : "—",
            icon: CheckCircle,
            highlight: quote.status === "ACCEPTED",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`card p-4 ${stat.highlight ? "border-emerald-200 bg-emerald-50" : ""}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              </div>
              <p
                className={`font-bold text-sm ${stat.highlight ? "text-emerald-700" : "text-slate-900"}`}
              >
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column — quote document */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client info */}
          <div className="card p-5">
            <p className="section-label">Client</p>
            <p className="font-semibold text-slate-900">{quote.clientName}</p>
            {quote.clientCompany && (
              <p className="text-sm text-slate-500">{quote.clientCompany}</p>
            )}
            <p className="text-sm text-slate-500 mt-0.5">{quote.clientEmail}</p>
            {quote.clientPhone && (
              <p className="text-sm text-slate-500">{quote.clientPhone}</p>
            )}
          </div>

          {/* Line items */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Line Items
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400">
                    Description
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-400 w-16">
                    Qty
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400 w-24">
                    Unit Price
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 w-24">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quote.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-slate-700">{item.description}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">
                      {fmt(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{fmt(quote.subtotal)}</span>
              </div>
              {quote.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>
                    Discount{" "}
                    {quote.discountType === "percentage"
                      ? `(${quote.discountValue}%)`
                      : ""}
                  </span>
                  <span>-{fmt(quote.discountAmount)}</span>
                </div>
              )}
              {quote.taxAmount > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({quote.taxRate}%)</span>
                  <span>{fmt(quote.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-lg text-[#1E3A5F]">{fmt(quote.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(quote.notes || quote.terms) && (
            <div className="card p-5 space-y-4">
              {quote.notes && (
                <div>
                  <p className="section-label">Notes</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <p className="section-label">Terms & Conditions</p>
                  <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                    {quote.terms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Signature */}
          {quote.signature && (
            <div className="card p-5 border-emerald-200 bg-emerald-50">
              <p className="section-label text-emerald-600">E-Signature</p>
              <p className="text-sm font-semibold text-emerald-800">
                ✓ Signed by {quote.signature.signerName}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {formatDate(quote.signature.signedAt)} ·{" "}
                {quote.signature.method === "TYPED" ? "Typed signature" : "Drawn signature"}
                {quote.signature.ipAddress
                  ? ` · IP: ${quote.signature.ipAddress}`
                  : ""}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Share link */}
          <div className="card p-4">
            <p className="section-label">Share Link</p>
            <p className="text-xs text-slate-500 mb-3">
              Send this link to your client — no login required.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-600 truncate flex-1 font-mono">
                /q/{quote.shareToken}
              </span>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                title="Open"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="mt-2 w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </button>
          </div>

          {/* Dates */}
          <div className="card p-4">
            <p className="section-label">Dates</p>
            <dl className="space-y-2 text-sm">
              {[
                { label: "Issued", value: formatDate(quote.issueDate) },
                {
                  label: "Expires",
                  value: quote.expiryDate ? formatDate(quote.expiryDate) : "No expiry",
                },
                {
                  label: "Sent",
                  value: quote.sentAt ? formatDate(quote.sentAt) : "Not yet",
                },
                {
                  label: "Viewed",
                  value: quote.viewedAt ? formatDate(quote.viewedAt) : "Not yet",
                },
              ].map((d) => (
                <div key={d.label} className="flex justify-between">
                  <dt className="text-slate-500">{d.label}</dt>
                  <dd className="font-medium text-slate-800">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Invoice link */}
          {quote.invoice && (
            <div className="card p-4 border-purple-200 bg-purple-50">
              <p className="section-label text-purple-600">Invoice Created</p>
              <Link
                href={`/invoices/${quote.invoice.id}`}
                className="text-sm font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                {quote.invoice.invoiceNumber}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <p className="text-xs text-purple-500 mt-0.5 capitalize">
                {quote.invoice.status.toLowerCase()}
              </p>
            </div>
          )}

          {/* Follow-up status */}
          <div className="card p-4">
            <p className="section-label">Follow-up Automation</p>
            <div className="space-y-2">
              {[
                {
                  label: "48h reminder",
                  sent: quote.followUp1Sent,
                  enabled: quote.followUpEnabled,
                },
                {
                  label: "72h nudge",
                  sent: quote.followUp2Sent,
                  enabled: quote.followUpEnabled,
                },
              ].map((fu) => (
                <div key={fu.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      fu.sent
                        ? "bg-emerald-500"
                        : fu.enabled
                          ? "bg-slate-300"
                          : "bg-red-300"
                    }`}
                  />
                  <span className="text-slate-600">{fu.label}</span>
                  <span className="ml-auto text-slate-400">
                    {fu.sent ? "Sent" : fu.enabled ? "Pending" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
