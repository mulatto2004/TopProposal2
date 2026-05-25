import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  ArrowLeft,
  Plus,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
} from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  return { title: client ? `${client.name} — Client` : "Client" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });
  if (!business) redirect("/onboarding");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      quotes: {
        select: {
          id: true,
          title: true,
          referenceNumber: true,
          status: true,
          total: true,
          createdAt: true,
          sentAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client || client.businessId !== business.id) notFound();

  const currency = business.currency;
  const fmt = (n: number) => formatCurrency(n, currency);

  const totalRevenue = client.quotes
    .filter((q) => q.status === "ACCEPTED" || q.status === "INVOICED")
    .reduce((s, q) => s + q.total, 0);

  const winRate =
    client.quotes.filter((q) =>
      ["SENT", "VIEWED", "ACCEPTED", "DECLINED", "INVOICED"].includes(q.status)
    ).length > 0
      ? Math.round(
          (client.quotes.filter((q) =>
            ["ACCEPTED", "INVOICED"].includes(q.status)
          ).length /
            client.quotes.filter((q) =>
              ["SENT", "VIEWED", "ACCEPTED", "DECLINED", "INVOICED"].includes(
                q.status
              )
            ).length) *
            100
        )
      : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            {client.company && (
              <p className="text-slate-500 text-sm">{client.company}</p>
            )}
          </div>
        </div>
        <Link
          href={`/quotes/new?clientId=${client.id}`}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — contact info */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="section-label">Contact</p>
            <div className="space-y-2.5">
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-emerald-600"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                {client.email}
              </a>
              {client.phone && (
                <p className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {client.phone}
                </p>
              )}
              {client.company && (
                <p className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {client.company}
                </p>
              )}
              {(client.city || client.state) && (
                <p className="flex items-center gap-2.5 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {[client.city, client.state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            {client.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="section-label">Notes</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card p-5">
            <p className="section-label">Stats</p>
            <div className="space-y-3">
              {[
                { label: "Total Quotes", value: client.quotes.length },
                {
                  label: "Accepted",
                  value: client.quotes.filter((q) =>
                    ["ACCEPTED", "INVOICED"].includes(q.status)
                  ).length,
                },
                { label: "Win Rate", value: `${winRate}%` },
                { label: "Total Revenue", value: fmt(totalRevenue) },
                { label: "Client Since", value: formatDate(client.createdAt) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex justify-between text-sm"
                >
                  <span className="text-slate-500">{s.label}</span>
                  <span className="font-semibold text-slate-900">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — quote history */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                Quote History ({client.quotes.length})
              </h2>
            </div>

            {client.quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No quotes yet</p>
                <Link
                  href={`/quotes/new?clientId=${client.id}`}
                  className="btn-primary mt-3 text-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Quote
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {client.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate group-hover:text-[#1E3A5F] text-sm">
                        {quote.title}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {quote.referenceNumber} ·{" "}
                        {formatDate(quote.createdAt)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900 text-sm flex-shrink-0">
                      {fmt(quote.total)}
                    </p>
                    <StatusBadge status={quote.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
