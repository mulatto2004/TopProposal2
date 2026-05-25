import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TopProposal — Quote & Proposal Generator",
    template: "%s | TopProposal",
  },
  description:
    "Create professional quotes and proposals in minutes. Send, track, and get e-signatures for your service business.",
  keywords: ["quote generator", "proposal software", "invoice", "e-signature"],
  openGraph: {
    title: "TopProposal",
    description: "Professional quotes and proposals for service businesses.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-slate-50 text-slate-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
