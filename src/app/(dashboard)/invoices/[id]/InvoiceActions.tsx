"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle, Download } from "lucide-react";

interface Props {
  invoiceId: string;
  status: string;
  clientEmail: string;
  clientName: string;
  amountDue: number;
  currency: string;
  invoiceNumber: string;
}

export default function InvoiceActions({
  invoiceId,
  status,
  clientEmail,
  invoiceNumber,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);

  const canSend = ["DRAFT", "SENT", "OVERDUE"].includes(status);
  const canMarkPaid = ["SENT", "OVERDUE"].includes(status);

  const handleSend = async () => {
    setIsLoading("send");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowSendModal(false);
      router.refresh();
    } catch {
      alert("Failed to send invoice.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm("Mark this invoice as paid?")) return;
    setIsLoading("paid");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-paid" }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("Failed to mark as paid.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`/api/invoices/${invoiceId}/pdf`}
          target="_blank"
          className="btn-secondary text-sm"
        >
          <Download className="w-3.5 h-3.5" /> PDF
        </a>

        {canSend && (
          <button
            onClick={() => setShowSendModal(true)}
            className="btn-primary text-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {status === "DRAFT" ? "Send Invoice" : "Resend"}
          </button>
        )}

        {canMarkPaid && (
          <button
            onClick={handleMarkPaid}
            disabled={isLoading === "paid"}
            className="btn-brand text-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isLoading === "paid" ? "Saving…" : "Mark Paid"}
          </button>
        )}
      </div>

      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Send Invoice</h2>
            <p className="text-slate-500 text-sm mb-6">
              Sending <strong>{invoiceNumber}</strong> to{" "}
              <strong>{clientEmail}</strong>
            </p>
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
                  <><Send className="w-4 h-4" /> Send Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
