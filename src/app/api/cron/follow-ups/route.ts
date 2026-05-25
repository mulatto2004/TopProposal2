// Vercel Cron Job — runs every hour
// Add to vercel.json: { "crons": [{ "path": "/api/cron/follow-ups", "schedule": "0 * * * *" }] }
//
// Three jobs in one pass:
//   1. Expire quotes past their expiryDate
//   2. 48h reminder — SENT but not opened after 48 hours
//   3. 72h nudge   — VIEWED but not accepted after 72 hours

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma";
import {
  sendFollowUp1Email,
  sendFollowUp2Email,
} from "@/lib/email";

// Protect the cron route with a shared secret
function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  // In dev, allow without auth if CRON_SECRET is not set
  if (!process.env.CRON_SECRET) return true;
  return secret === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { expired: 0, followUp1: 0, followUp2: 0, errors: 0 };

  // ── Job 1: Auto-expire overdue quotes ────────────────────────────────────────
  try {
    const { count } = await prisma.quote.updateMany({
      where: {
        status: { in: [QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.DRAFT] },
        expiryDate: { lt: now },
      },
      data: { status: QuoteStatus.EXPIRED },
    });
    results.expired = count;
  } catch (err) {
    console.error("[cron] expire job failed:", err);
    results.errors++;
  }

  // ── Job 2: 48-hour "not opened" reminder ─────────────────────────────────────
  // Target: status=SENT, sent >48h ago, followUp1Sent=false, followUpEnabled=true
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  try {
    const needsReminder = await prisma.quote.findMany({
      where: {
        status: QuoteStatus.SENT,
        followUpEnabled: true,
        followUp1Sent: false,
        sentAt: { lt: fortyEightHoursAgo },
      },
      include: {
        business: { select: { name: true } },
      },
      take: 50, // cap per cron run to avoid rate limits
    });

    for (const quote of needsReminder) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        await sendFollowUp1Email({
          to: quote.clientEmail,
          clientName: quote.clientName,
          businessName: quote.business.name,
          quoteTitle: quote.title,
          referenceNumber: quote.referenceNumber,
          shareUrl: `${appUrl}/q/${quote.shareToken}`,
        });
        await prisma.quote.update({
          where: { id: quote.id },
          data: { followUp1Sent: true },
        });
        results.followUp1++;
      } catch (err) {
        console.error(`[cron] follow-up 1 failed for ${quote.id}:`, err);
        results.errors++;
      }
    }
  } catch (err) {
    console.error("[cron] follow-up 1 job failed:", err);
    results.errors++;
  }

  // ── Job 3: 72-hour "opened but not accepted" nudge ───────────────────────────
  // Target: status=VIEWED, viewedAt >72h ago, followUp2Sent=false, followUpEnabled=true
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  try {
    const needsNudge = await prisma.quote.findMany({
      where: {
        status: QuoteStatus.VIEWED,
        followUpEnabled: true,
        followUp2Sent: false,
        viewedAt: { lt: seventyTwoHoursAgo },
      },
      include: {
        business: { select: { name: true } },
      },
      take: 50,
    });

    for (const quote of needsNudge) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        await sendFollowUp2Email({
          to: quote.clientEmail,
          clientName: quote.clientName,
          businessName: quote.business.name,
          quoteTitle: quote.title,
          referenceNumber: quote.referenceNumber,
          shareUrl: `${appUrl}/q/${quote.shareToken}`,
        });
        await prisma.quote.update({
          where: { id: quote.id },
          data: { followUp2Sent: true },
        });
        results.followUp2++;
      } catch (err) {
        console.error(`[cron] follow-up 2 failed for ${quote.id}:`, err);
        results.errors++;
      }
    }
  } catch (err) {
    console.error("[cron] follow-up 2 job failed:", err);
    results.errors++;
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    results,
  });
}
