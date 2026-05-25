"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Download, Receipt, Copy, Trash2 } from "lucide-react";

interface Props {
  quoteId: string;
  status: string;
  shareUrl: string;
  clientEmail: string;
  hasInvoice: boolean;
  invoiceId: string | null;
}

export default function QuoteActions({
  quoteId,
  status,
  shareUrl,
  clientEmail,
  hasInvoice,
  invoiceId,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const [copyText, setCopyText] = useState("Copy Link");

  const isDraft = status === "DRAFT";
  const isAccepted = status === "ACCEPTED";
  const canSend = ["DRAFT", "SENT", "VIEWED"].includes(status);

  const handleSend = async () => {
    setIsLoading("send");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", personalMessage }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setShowSendModal(false);
      router.refresh();
    } catch {
      alert("Failed to send quote. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Link"), 2000);
  };

  const handleConvertToInvoice = async () => {
    setIsLoading("invoice");
    try {
      const res = await fetch(`/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      const { invoiceId: newId } = await res.json();
      router.push(`/invoices/${newId}`);
    } catch {
      alert("Failed to convert to invoice.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this draft quote? This cannot be undone.")) return;
    setIsLoading("delete");
    try {
      await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      router.push("/quotes");
    } catch {
      alert("Failed to delete quote.");
      setIsLoading(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy link */}
        <button onClick={handleCopyLink} className="btn-secondary text-sm">
          <Copy className="w-3.5 h-3.5" />
          {copyText}
        </button>

        {/* Download PDF */}
        <a
          href={`/api/quotes/${quoteId}/pdf`}
          target="_blank"
          className="btn-secondary text-sm"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </a>

        {/* Send quote */}
        {canSend && (
          <button
            onClick={() => setShowSendModal(true)}
            disabled={isLoading === "send"}
            className="btn-primary text-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {status === "DRAFT" ? "Send Quote" : "Resend"}
          </button>
        )}

        {/* Convert to invoice */}
        {isAccepted && !hasInvoice && (
          <button
            onClick={handleConvertToInvoice}
            disabled={isLoading === "invoice"}
            className="btn-brand text-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            {isLoading === "invoice" ? "Creating…" : "Create Invoice"}
          </button>
        )}

        {/* View existing invoice */}
        {hasInvoice && invoiceId && (
          <a href={`/invoices/${invoiceId}`} className="btn-brand text-sm">
            <Receipt className="w-3.5 h-3.5" />
            View Invoice
          </a>
        )}

        {/* Delete (draft only) */}
        {isDraft && (
          <button
            onClick={handleDelete}
            disabled={isLoading === "delete"}
            className="btn-secondary text-sm text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Send Quote</h2>
            <p className="text-slate-500 text-sm mb-4">
              Sending to <strong>{clientEmail}</strong>
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Personal message{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={4}
              placeholder="Hi! Please find your quote attached. Let me know if you have any questions."
              className="input resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading === "send"}
                className="btn-primary flex-1"
              >
                {isLoading === "send" ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
