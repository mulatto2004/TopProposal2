"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Settings,
  Palette,
  LogOut,
  Zap,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/templates", label: "Templates", icon: Palette },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-[#1E3A5F] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            TopProposal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/10 space-y-1">
        {/* Upgrade CTA (only show on free plan) */}
        <Link
          href="/settings?tab=billing"
          className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-300">Free Plan</p>
            <p className="text-xs text-emerald-400/70">Upgrade to Pro</p>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400" />
        </Link>

        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {session?.user?.name ?? "Your Account"}
            </p>
            <p className="text-xs text-white/50 truncate">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-white/40 hover:text-white/80 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
