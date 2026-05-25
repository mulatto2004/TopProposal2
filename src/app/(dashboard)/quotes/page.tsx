import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { Plus, FileText, Search } from "lucide-react";

export const metadata = { title: "Quotes" };

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });
  if (!business) redirect("/onboarding");

  const status = searchParams.status;
  const search = searchParams.search ?? "";

  const quotes = await prisma.quote.findMany({
    where: {
      businessId: business.id,
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            OR: [
              { clientName: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { referenceNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      referenceNumber: true,
      status: true,
      total: true,
      clientName: true,
      clientEmail: true,
      createdAt: true,
      sentAt: true,
      expiryDate: true,
      viewCount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_FILTERS = [
    { label: "All", value: "" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Sent", value: "SENT" },
    { label: "Viewed", value: "VIEWED" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Declined", value: "DECLINED" },
    { label: "Expired", value: "EXPIRED" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotes</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
            {status ? ` · ${status.toLowerCase()}` : ""}
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/quotes${f.value ? `?status=${f.value}` : ""}${search ? `${f.value ? "&" : "?"}search=${search}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                (status ?? "") === f.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form action="/quotes" method="GET" className="relative flex-1 max-w-xs ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search quotes…"
            className="input pl-9 text-sm"
          />
        </form>
      </div>

      {/* Quotes table */}
      <div className="card overflow-hidden">
        {quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No quotes found</h3>
            <p className="text-slate-400 text-sm mb-5 max-w-xs">
              {search
                ? `No quotes match "${search}"`
                : "Create your first quote to get started."}
            </p>
            <Link href="/quotes/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Quote
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_180px_100px_90px_100px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div>Quote</div>
              <div>Client</div>
              <div className="text-right">Amount</div>
              <div className="text-center">Views</div>
              <div className="text-right">Status</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_180px_100px_90px_100px] gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate group-hover:text-[#1E3A5F]">
                      {quote.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {quote.referenceNumber} · {formatDate(quote.createdAt)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 truncate">{quote.clientName}</p>
                    <p className="text-xs text-slate-400 truncate">{quote.clientEmail}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900 text-sm">
                      {formatCurrency(quote.total, business.currency)}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="text-sm text-slate-500">{quote.viewCount}</span>
                  </div>

                  <div className="flex justify-end">
                    <StatusBadge status={quote.status} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
