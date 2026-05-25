import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  FileText,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";

export const metadata = { title: "Dashboard" };

// Compute stats server-side — fast, fresh, no client bundle needed
async function getDashboardData(businessId: string) {
  const [quotes, acceptedQuotes] = await Promise.all([
    prisma.quote.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        referenceNumber: true,
        status: true,
        total: true,
        clientName: true,
        createdAt: true,
        expiryDate: true,
        sentAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.quote.findMany({
      where: { businessId, status: "ACCEPTED" },
      select: { total: true },
    }),
  ]);

  const sentStatuses: QuoteStatus[] = [
    QuoteStatus.SENT,
    QuoteStatus.VIEWED,
    QuoteStatus.ACCEPTED,
    QuoteStatus.DECLINED,
    QuoteStatus.EXPIRED,
    QuoteStatus.INVOICED,
  ];
  const totalSent = quotes.filter((q) => sentStatuses.includes(q.status)).length;
  const totalAccepted = acceptedQuotes.length;
  const winRate =
    totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0;
  const totalRevenue = acceptedQuotes.reduce(
    (sum: number, q: { total: number }) => sum + q.total,
    0
  );

  return { quotes, totalSent, totalAccepted, winRate, totalRevenue };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, currency: true },
  });

  if (!business) redirect("/onboarding");

  const { quotes, totalSent, totalAccepted, winRate, totalRevenue } =
    await getDashboardData(business.id);

  const currency = business.currency ?? "USD";

  const STAT_CARDS = [
    {
      label: "Quotes Sent",
      value: totalSent,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      change: null,
    },
    {
      label: "Accepted",
      value: totalAccepted,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      change: null,
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      change: null,
    },
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue, currency),
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-50",
      change: null,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good{getTimeOfDay()},{" "}
            {session.user.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here&apos;s what&apos;s happening with{" "}
            <span className="font-medium text-slate-700">{business.name}</span>
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent quotes */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Quotes</h2>
          <Link
            href="/quotes"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              No quotes yet
            </h3>
            <p className="text-slate-400 text-sm mb-5 max-w-xs">
              Create your first quote and start winning more business.
            </p>
            <Link href="/quotes/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Create First Quote
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quotes.map((quote) => {
              const isExpiring =
                quote.expiryDate &&
                new Date(quote.expiryDate) < new Date(Date.now() + 3 * 86400000) &&
                quote.status === "SENT";

              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>

                  {/* Quote info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">
                        {quote.title}
                      </p>
                      {isExpiring && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Clock className="w-3 h-3" />
                          Expiring soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {quote.clientName} ·{" "}
                      <span className="text-slate-400">
                        {quote.referenceNumber}
                      </span>
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(quote.total, currency)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(quote.createdAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 w-24 flex justify-end">
                    <StatusBadge status={quote.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            href: "/quotes/new",
            icon: "⚡",
            title: "New Quote",
            desc: "Create a quote in minutes",
          },
          {
            href: "/clients",
            icon: "👥",
            title: "Add Client",
            desc: "Save client for next time",
          },
          {
            href: "/templates",
            icon: "🎨",
            title: "Browse Templates",
            desc: "Customise your quote style",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {action.title}
              </p>
              <p className="text-slate-500 text-xs">{action.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
