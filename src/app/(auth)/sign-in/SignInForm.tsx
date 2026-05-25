"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Zap, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<"google" | "email" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading("email");
    setError(null);
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to your TopProposal account
          </p>
        </div>

        {emailSent ? (
          /* Magic link sent state */
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Check your inbox
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              We sent a magic link to{" "}
              <strong className="text-slate-700">{email}</strong>. Click it to
              sign in — no password needed.
            </p>
            <button
              onClick={() => { setEmailSent(false); setEmail(""); }}
              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <>
            {/* Google button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors font-medium text-slate-700 disabled:opacity-50 mb-4"
            >
              {/* Google G icon via inline SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLoading === "google" ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Email magic link */}
            <form onSubmit={handleEmailSignIn}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input flex-1"
                  disabled={isLoading !== null}
                />
                <button
                  type="submit"
                  disabled={isLoading !== null || !email}
                  className="btn-brand flex-shrink-0 px-3"
                >
                  {isLoading === "email" ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                We&apos;ll send a magic link — no password needed.
              </p>
            </form>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-slate-500">
              New to TopProposal?{" "}
              <Link
                href="/sign-up"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Create a free account
              </Link>
            </p>
          </>
        )}
      </div>

      <p className="text-center text-white/40 text-xs mt-4">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
