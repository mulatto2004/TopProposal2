// React-PDF invoice document — server-side only
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePDFData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  status: string;

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

  // Quote ref
  quoteTitle: string;
  referenceNumber: string;

  // Financials
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositPaid: number;
  amountDue: number;
  currency: string;

  notes: string | null;
}

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
  invoiceLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    textAlign: "right",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  invoiceNumber: {
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
  statusBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: EMERALD,
    textAlign: "right",
    marginTop: 3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    textTransform: "uppercase",
  },
  td: { fontSize: 9.5, color: SLATE_600 },
  tdBold: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: SLATE_800 },
  totalsSection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    width: 210,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalsLabel: { fontSize: 9.5, color: SLATE_600 },
  totalsValue: { fontSize: 9.5, color: SLATE_800 },
  dividerRow: {
    flexDirection: "row",
    width: 210,
    borderTopWidth: 1,
    borderTopColor: SLATE_100,
    marginTop: 4,
    paddingTop: 4,
    justifyContent: "space-between",
  },
  amountDueRow: {
    flexDirection: "row",
    width: 210,
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: NAVY,
  },
  grandLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY },
  grandValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY },
  notesBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: SLATE_100,
    borderRadius: 4,
  },
  notesText: { fontSize: 9, color: SLATE_600, lineHeight: 1.5 },
  refBox: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  refText: { fontSize: 8.5, color: SLATE_600 },
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

export default function InvoicePDF(data: InvoicePDFData) {
  const fmt = (n: number) => formatCurrency(n, data.currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{data.businessName}</Text>
            {data.businessEmail && (
              <Text style={styles.smallText}>{data.businessEmail}</Text>
            )}
            {data.businessPhone && (
              <Text style={styles.smallText}>{data.businessPhone}</Text>
            )}
            {(data.businessCity || data.businessState) && (
              <Text style={styles.smallText}>
                {[data.businessCity, data.businessState]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <Text style={styles.meta}>Issued: {data.issueDate}</Text>
            {data.dueDate && (
              <Text style={styles.meta}>Due: {data.dueDate}</Text>
            )}
            <Text style={styles.statusBadge}>
              {data.status === "PAID" ? "✓ PAID" : data.status}
            </Text>
          </View>
        </View>

        {/* Bill To + From Quote */}
        <View style={styles.clientRow}>
          <View>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Helvetica-Bold",
                color: SLATE_800,
              }}
            >
              {data.clientName}
            </Text>
            {data.clientCompany && (
              <Text style={styles.smallText}>{data.clientCompany}</Text>
            )}
            <Text style={styles.smallText}>{data.clientEmail}</Text>
            {data.clientPhone && (
              <Text style={styles.smallText}>{data.clientPhone}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sectionLabel}>Project</Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Helvetica-Bold",
                color: SLATE_800,
                textAlign: "right",
                maxWidth: 200,
              }}
            >
              {data.quoteTitle}
            </Text>
            <Text style={{ fontSize: 8, color: SLATE_400, marginTop: 2 }}>
              Ref: {data.referenceNumber}
            </Text>
          </View>
        </View>

        {/* Line items */}
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
            <Text style={[styles.td, styles.colPrice]}>
              {fmt(item.unitPrice)}
            </Text>
            <Text style={[styles.tdBold, styles.colTotal]}>
              {fmt(item.total)}
            </Text>
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
                Discount
              </Text>
              <Text style={[styles.totalsValue, { color: "#ef4444" }]}>
                -{fmt(data.discountAmount)}
              </Text>
            </View>
          )}
          {data.taxAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>{fmt(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.dividerRow}>
            <Text style={{ fontSize: 9.5, color: SLATE_600 }}>
              Invoice Total
            </Text>
            <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold" }}>
              {fmt(data.total)}
            </Text>
          </View>
          {data.depositPaid > 0 && (
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: EMERALD }]}>
                Deposit Paid
              </Text>
              <Text style={[styles.totalsValue, { color: EMERALD }]}>
                -{fmt(data.depositPaid)}
              </Text>
            </View>
          )}
          <View style={styles.amountDueRow}>
            <Text style={styles.grandLabel}>Amount Due</Text>
            <Text style={styles.grandValue}>{fmt(data.amountDue)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.businessName} · {data.invoiceNumber}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
          <Text style={styles.footerText}>TopProposal</Text>
        </View>
      </Page>
    </Document>
  );
}
