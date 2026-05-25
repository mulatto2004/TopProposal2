import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

// Merge Tailwind classes safely (used everywhere)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a unique share token for public quote URLs
// 12 chars → ~3.5 billion combinations, URL-safe
export function generateShareToken(): string {
  return nanoid(12);
}

// Generate a human-readable reference number e.g. "TP-2026-0042"
export function generateReferenceNumber(count: number): string {
  const year = new Date().getFullYear();
  const padded = String(count).padStart(4, "0");
  return `TP-${year}-${padded}`;
}

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

// Format a date for display
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// Compute quote totals from line items
export interface LineItemInput {
  quantity: number;
  unitPrice: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositAmount: number | null;
}

export function computeQuoteTotals(
  lineItems: LineItemInput[],
  discountType: "percentage" | "flat" | null,
  discountValue: number,
  taxRate: number,
  requireDeposit: boolean,
  depositPercent: number
): QuoteTotals {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === "flat") {
    discountAmount = discountValue;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;
  const depositAmount = requireDeposit ? total * (depositPercent / 100) : null;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    depositAmount,
  };
}

// Quote status color helper
export const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  VIEWED: {
    label: "Viewed",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DECLINED: {
    label: "Declined",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  INVOICED: {
    label: "Invoiced",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};
