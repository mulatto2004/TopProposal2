import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { Users, Plus, FileText, Mail, Phone, Building2 } from "lucide-react";

export const metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, currency: true },
  });
  if (!business) redirect("/onboarding");

  const search = searchParams.search ?? "";

  const clients = await prisma.client.findMany({
    where: {
      businessId: business.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      quotes: {
        select: { id: true, status: true, total: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {clients.length} saved client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Search */}
      <form action="/clients" method="GET" className="relative mb-5 max-w-sm">
        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search clients…"
          className="input pl-9 text-sm"
        />
      </form>

      {clients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No clients yet</h3>
          <p className="text-slate-400 text-sm mb-5 max-w-xs">
            Clients are auto-saved when you create quotes. Create your first
            quote to get started.
          </p>
          <Link href="/quotes/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Create First Quote
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const accepted = client.quotes.filter((q) => q.status === "ACCEPTED");
            const revenue = accepted.reduce((s, q) => s + q.total, 0);
            const lastQuote = client.quotes[0];

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card p-5 hover:shadow-md transition-shadow group"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate group-hover:text-[#1E3A5F]">
                      {client.name}
                    </p>
                    {client.company && (
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1 mb-4">
                  <a
                    href={`mailto:${client.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 truncate"
                  >
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {client.email}
                  </a>
                  {client.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {client.phone}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">
                      {client.quotes.length}
                    </p>
                    <p className="text-xs text-slate-400">Quotes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">
                      {accepted.length}
                    </p>
                    <p className="text-xs text-slate-400">Accepted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#1E3A5F]">
                      {formatCurrency(revenue, business.currency)}
                    </p>
                    <p className="text-xs text-slate-400">Revenue</p>
                  </div>
                </div>

                {/* Last quote badge */}
                {lastQuote && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-400">Last quote</p>
                    <StatusBadge status={lastQuote.status} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
