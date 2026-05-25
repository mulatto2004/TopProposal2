"use client";

import { useState, useRef, useEffect } from "react";
import type { QuoteDraft, ClientOption } from "./QuoteBuilder";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  draft: QuoteDraft;
  update: (patch: Partial<QuoteDraft>) => void;
  clients: ClientOption[];
}

export default function StepClientInfo({ draft, update, clients }: Props) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          c.company?.toLowerCase().includes(query.toLowerCase())
      )
    : clients.slice(0, 5);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectClient = (client: ClientOption) => {
    update({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone ?? "",
      clientCompany: client.company ?? "",
    });
    setQuery(client.name);
    setShowDropdown(false);
  };

  const clearClient = () => {
    update({ clientId: null, clientName: "", clientEmail: "", clientPhone: "", clientCompany: "" });
    setQuery("");
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Client Information</h2>
      <p className="text-slate-500 text-sm mb-6">
        Who is this quote for? Search existing clients or enter details manually.
      </p>

      {/* Client search (only if there are saved clients) */}
      {clients.length > 0 && (
        <div className="mb-6 relative" ref={dropdownRef}>
          <label className="section-label">Search Existing Clients</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by name, email, or company…"
              className="input pl-9"
            />
          </div>

          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClient(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">
                      {c.email}{c.company ? ` · ${c.company}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected client chip */}
      {draft.clientId && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-emerald-800">
            Linked to saved client: {draft.clientName}
          </span>
          <button
            type="button"
            onClick={clearClient}
            className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 underline"
          >
            Unlink
          </button>
        </div>
      )}

      {clients.length > 0 && !draft.clientId && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or enter manually</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {/* Manual fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cn(draft.clientId && "opacity-60 pointer-events-none")}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={draft.clientName}
            onChange={(e) => update({ clientName: e.target.value })}
            placeholder="Jane Smith"
            className="input"
            required
          />
        </div>

        <div className={cn(draft.clientId && "opacity-60 pointer-events-none")}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={draft.clientEmail}
            onChange={(e) => update({ clientEmail: e.target.value })}
            placeholder="jane@example.com"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            value={draft.clientPhone}
            onChange={(e) => update({ clientPhone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Company{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={draft.clientCompany}
            onChange={(e) => update({ clientCompany: e.target.value })}
            placeholder="Acme Corp"
            className="input"
          />
        </div>
      </div>

      {/* Validation hint */}
      {draft.clientName.trim().length > 0 &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.clientEmail) && (
          <p className="mt-3 text-sm text-amber-600">
            ⚠ Please enter a valid email address to continue.
          </p>
        )}
    </div>
  );
}
