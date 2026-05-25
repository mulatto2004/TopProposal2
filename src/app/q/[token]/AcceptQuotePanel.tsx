"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, PenLine, Type, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type SignatureMethod = "typed" | "drawn";
type Step = "sign" | "confirming" | "confirmed";

interface Props {
  quoteId: string;
  shareToken: string;
  clientName: string;
  clientEmail: string;
  total: number;
  depositAmount: number | null;
  depositPercent: number | null;
  requireDeposit: boolean;
  currency: string;
  businessName: string;
}

export default function AcceptQuotePanel({
  quoteId,
  clientName,
  clientEmail,
  total,
  depositAmount,
  depositPercent,
  requireDeposit,
  currency,
  businessName,
}: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);

  const [step, setStep] = useState<Step>("sign");
  const [method, setMethod] = useState<SignatureMethod>("typed");
  const [typedName, setTypedName] = useState(clientName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  // ── Canvas drawing ─────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    e.preventDefault();

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1E3A5F";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => { isDrawing.current = false; lastPos.current = null; };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  // Set canvas DPI on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, [method]); // re-init when switching to drawn

  // ── Submit acceptance ──────────────────────────────────────────────────────
  const handleAccept = async () => {
    const isTyped = method === "typed";
    if (isTyped && !typedName.trim()) {
      setError("Please type your full name to sign.");
      return;
    }
    if (!isTyped && !hasDrawn) {
      setError("Please draw your signature.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let signatureData: string | null = null;
      if (!isTyped && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL("image/png");
      }

      const res = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: isTyped ? typedName : clientName,
          signerEmail: clientEmail,
          method: isTyped ? "TYPED" : "DRAWN",
          signatureData,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Acceptance failed");
      }

      setStep("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit decline ─────────────────────────────────────────────────────────
  const handleDecline = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await fetch(`/api/quotes/${quoteId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason }),
      });
      setShowDecline(false);
      // Reload page to show declined state
      window.location.reload();
    } catch {
      setError("Failed to decline. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Confirmed screen ───────────────────────────────────────────────────────
  if (step === "confirmed") {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Quote Accepted! 🎉
        </h2>
        <p className="text-slate-500 mb-4">
          Thank you, <strong>{clientName}</strong>. {businessName} has been notified and will be in touch soon.
        </p>
        {requireDeposit && depositAmount && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-sm text-emerald-700">
            <p className="font-semibold mb-1">Deposit Payment Required</p>
            <p>
              A deposit of <strong>{fmt(depositAmount)}</strong> ({depositPercent}%) is required before work begins.
              {businessName} will send you a payment link shortly.
            </p>
          </div>
        )}
        <p className="text-xs text-slate-400">
          A copy of this acceptance has been sent to {clientEmail}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-50 border-b border-slate-200">
        <h2 className="font-bold text-slate-900">Ready to Accept?</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Review and sign below to accept this quote from{" "}
          <strong>{businessName}</strong>.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Quote summary */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-sm text-slate-600">Quote Total</p>
            <p className="text-2xl font-bold text-[#1E3A5F]">{fmt(total)}</p>
          </div>
          {requireDeposit && depositAmount && (
            <div className="text-right">
              <p className="text-sm text-slate-600">Deposit Due</p>
              <p className="text-lg font-bold text-emerald-600">{fmt(depositAmount)}</p>
              <p className="text-xs text-slate-400">{depositPercent}% of total</p>
            </div>
          )}
        </div>

        {/* Signature method toggle */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Signature Method</p>
          <div className="flex gap-2">
            {(["typed", "drawn"] as SignatureMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                  method === m
                    ? "border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {m === "typed" ? (
                  <><Type className="w-4 h-4" /> Type to Sign</>
                ) : (
                  <><PenLine className="w-4 h-4" /> Draw Signature</>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Signature input */}
        {method === "typed" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Type your full legal name
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Jane Smith"
              className="input text-lg font-['Caveat',cursive] tracking-wide"
              style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}
            />
            {typedName && (
              <p
                className="mt-2 text-center text-2xl text-[#1E3A5F] tracking-wide"
                style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}
              >
                {typedName}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Draw your signature
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="border-2 border-slate-200 rounded-xl overflow-hidden touch-none bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-32 cursor-crosshair"
                style={{ touchAction: "none" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            {!hasDrawn && (
              <p className="text-xs text-slate-400 text-center mt-1.5">
                Sign in the box above using your mouse or finger
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Legal notice */}
        <p className="text-xs text-slate-400 leading-relaxed">
          By clicking &quot;Accept Quote&quot;, you agree to the terms stated in this quote
          and authorise {businessName} to proceed with the described work.
          Your signature and acceptance timestamp will be recorded.
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowDecline(!showDecline)}
            className="btn-secondary flex-1 text-slate-500"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Accept Quote
              </>
            )}
          </button>
        </div>

        {/* Decline reason */}
        {showDecline && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
            <p className="text-sm font-medium text-red-800">Decline this quote?</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Optional: let us know why…"
              rows={2}
              className="input text-sm resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDecline(false)}
                className="btn-secondary text-sm flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={isSubmitting}
                className="flex-1 text-sm font-medium py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? "Declining…" : "Confirm Decline"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
