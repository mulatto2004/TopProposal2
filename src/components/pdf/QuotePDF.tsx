// React-PDF document — runs server-side only (Node.js renderer)
// Do NOT import this in any client component directly — use the API route.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotePDFData {
  referenceNumber: string;
  title: string;
  issueDate: string;
  expiryDate: string | null;
  templateStyle: "MINIMAL" | "PROFESSIONAL" | "BOLD";

  // Business
  businessName: string;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessState: string | null;

  // Client
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientCompany: string | null;

  // Financials
  lineItems: LineItem[];
  subtotal: number;
  discountType: string | null;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  requireDeposit: boolean;
  depositPercent: number | null;
  depositAmount: number | null;

  // Content
  notes: string | null;
  terms: string | null;

  // Signature
  signedBy: string | null;
  signedAt: string | null;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const NAVY = "#1E3A5F";
const EMERALD = "#10B981";
const SLATE_800 = "#1e293b";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_100 = "#f1f5f9";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: SLATE_800,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
  },
  businessName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 3,
  },
  smallText: {
    fontSize: 9,
    color: SLATE_600,
    marginBottom: 1,
  },
  quoteLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    textAlign: "right",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  refNumber: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "right",
    marginTop: 2,
  },
  meta: {
    fontSize: 9,
    color: SLATE_600,
    textAlign: "right",
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: SLATE_100,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "center" },
  colPrice: { width: 70, textAlign: "right" },
  colTotal: { width: 70, textAlign: "right" },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: SLATE_400, textTransform: "uppercase" },
  td: { fontSize: 9.5, color: SLATE_600 },
  tdBold: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: SLATE_800 },
  // Totals
  totalsSection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalsLabel: { fontSize: 9.5, color: SLATE_600 },
  totalsValue: { fontSize: 9.5, color: SLATE_800 },
  totalLine: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: NAVY,
  },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY },
  // Notes
  notesBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: SLATE_100,
    borderRadius: 4,
  },
  notesText: { fontSize: 9, color: SLATE_600, lineHeight: 1.5 },
  // Signature
  signatureBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
  },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#065f46", marginBottom: 3 },
  signatureText: { fontSize: 9, color: "#047857" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: SLATE_100,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: SLATE_400 },
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuotePDF(data: QuotePDFData) {
  const fmt = (n: number) => formatCurrency(n, data.currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{data.businessName}</Text>
            {data.businessEmail && <Text style={styles.smallText}>{data.businessEmail}</Text>}
            {data.businessPhone && <Text style={styles.smallText}>{data.businessPhone}</Text>}
            {(data.businessCity || data.businessState) && (
              <Text style={styles.smallText}>
                {[data.businessCity, data.businessState].filter(Boolean).join(", ")}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.quoteLabel}>QUOTE</Text>
            <Text style={styles.refNumber}>{data.referenceNumber}</Text>
            <Text style={styles.meta}>Issued: {data.issueDate}</Text>
            {data.expiryDate && (
              <Text style={styles.meta}>Valid until: {data.expiryDate}</Text>
            )}
          </View>
        </View>

        {/* Client + Subject */}
        <View style={styles.clientRow}>
          <View>
            <Text style={styles.sectionLabel}>Prepared For</Text>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: SLATE_800 }}>
              {data.clientName}
            </Text>
            {data.clientCompany && (
              <Text style={styles.smallText}>{data.clientCompany}</Text>
            )}
            <Text style={styles.smallText}>{data.clientEmail}</Text>
            {data.clientPhone && <Text style={styles.smallText}>{data.clientPhone}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sectionLabel}>Subject</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: SLATE_800, textAlign: "right", maxWidth: 200 }}>
              {data.title}
            </Text>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDesc]}>Description</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
        </View>

        {data.lineItems.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.td, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
            <Text style={[styles.tdBold, styles.colTotal]}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{fmt(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: "#ef4444" }]}>
                Discount{data.discountType === "percentage" ? ` (${data.discountValue}%)` : ""}
              </Text>
              <Text style={[styles.totalsValue, { color: "#ef4444" }]}>
                -{fmt(data.discountAmount)}
              </Text>
            </View>
          )}
          {data.taxAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({data.taxRate}%)</Text>
              <Text style={styles.totalsValue}>{fmt(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{fmt(data.total)}</Text>
          </View>
          {data.requireDeposit && data.depositAmount && (
            <View style={[styles.totalsRow, { marginTop: 6 }]}>
              <Text style={{ fontSize: 9, color: EMERALD }}>
                Deposit required ({data.depositPercent}%)
              </Text>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: EMERALD }}>
                {fmt(data.depositAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {data.terms && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionLabel}>Terms & Conditions</Text>
            <Text style={{ fontSize: 8, color: SLATE_400, lineHeight: 1.5 }}>
              {data.terms}
            </Text>
          </View>
        )}

        {/* Signature */}
        {data.signedBy && (
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>✓ ELECTRONICALLY SIGNED</Text>
            <Text style={styles.signatureText}>
              Signed by {data.signedBy} on {data.signedAt}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.businessName} · {data.referenceNumber}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
          <Text style={styles.footerText}>TopProposal</Text>
        </View>
      </Page>
    </Document>
  );
}
