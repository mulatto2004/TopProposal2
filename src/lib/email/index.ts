import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.RESEND_FROM_NAME ?? "TopProposal"} <${process.env.RESEND_FROM_EMAIL ?? "quotes@topproposal.app"}>`;

// ─── Quote sent to client ─────────────────────────────────────────────────────
export async function sendQuoteEmail({
  to,
  clientName,
  businessName,
  quoteTitle,
  referenceNumber,
  shareUrl,
  personalMessage,
  expiryDate,
}: {
  to: string;
  clientName: string;
  businessName: string;
  quoteTitle: string;
  referenceNumber: string;
  shareUrl: string;
  personalMessage?: string;
  expiryDate?: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${quoteTitle} — Quote from ${businessName} (${referenceNumber})`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #1E3A5F; margin: 0 0 4px 0;">
            ${businessName}
          </h1>
        </div>

        <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${clientName},</p>

        ${personalMessage ? `<p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">${personalMessage}</p>` : ""}

        <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
          Please find your quote <strong>${referenceNumber}</strong> for <strong>${quoteTitle}</strong> attached below.
          ${expiryDate ? `This quote is valid until <strong>${expiryDate}</strong>.` : ""}
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${shareUrl}"
             style="display: inline-block; background: #10B981; color: white; font-weight: 600;
                    font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            View &amp; Accept Quote →
          </a>
        </div>

        <p style="font-size: 13px; color: #888; margin: 32px 0 0 0; border-top: 1px solid #eee; padding-top: 16px;">
          You're receiving this because ${businessName} sent you a quote via TopProposal.<br/>
          Questions? Reply to this email or contact ${businessName} directly.
        </p>
      </div>
    `,
  });
}

// ─── Quote opened notification (to business owner) ───────────────────────────
export async function sendQuoteOpenedNotification({
  to,
  clientName,
  quoteTitle,
  referenceNumber,
  dashboardUrl,
}: {
  to: string;
  clientName: string;
  quoteTitle: string;
  referenceNumber: string;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `👁 ${clientName} viewed your quote (${referenceNumber})`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h2 style="font-size: 20px; color: #1E3A5F; margin: 0 0 16px 0;">Quote Viewed</h2>
        <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
          <strong>${clientName}</strong> just opened your quote <strong>${referenceNumber}</strong> — ${quoteTitle}.
        </p>
        <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
          Now's a great time to follow up if they have questions!
        </p>
        <a href="${dashboardUrl}" style="display: inline-block; background: #1E3A5F; color: white;
           font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
          View in Dashboard →
        </a>
      </div>
    `,
  });
}

// ─── 48-hour follow-up (not opened) ──────────────────────────────────────────
export async function sendFollowUp1Email({
  to,
  clientName,
  businessName,
  referenceNumber,
  shareUrl,
}: {
  to: string;
  clientName: string;
  businessName: string;
  quoteTitle?: string;
  referenceNumber: string;
  shareUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Friendly reminder: Your quote from ${businessName} is waiting`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${clientName},</p>
        <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
          Just a friendly reminder that your quote <strong>${referenceNumber}</strong> from
          <strong>${businessName}</strong> is still waiting for your review.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${shareUrl}" style="display: inline-block; background: #10B981; color: white;
             font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            View Quote →
          </a>
        </div>
      </div>
    `,
  });
}

// ─── 72-hour nudge (opened but not accepted) ─────────────────────────────────
export async function sendFollowUp2Email({
  to,
  clientName,
  businessName,
  shareUrl,
}: {
  to: string;
  clientName: string;
  businessName: string;
  quoteTitle?: string;
  referenceNumber?: string;
  shareUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Still interested? Your quote from ${businessName} expires soon`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${clientName},</p>
        <p style="font-size: 15px; color: #444; margin: 0 0 16px 0;">
          We noticed you've reviewed the quote from <strong>${businessName}</strong> but haven't
          accepted it yet. If you have any questions or need changes, just reply to this email.
        </p>
        <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
          When you're ready to move forward, simply click below:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${shareUrl}" style="display: inline-block; background: #10B981; color: white;
             font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            Accept Quote →
          </a>
        </div>
      </div>
    `,
  });
}

// ─── Quote accepted notification (to business owner) ─────────────────────────
export async function sendQuoteAcceptedNotification({
  to,
  clientName,
  quoteTitle,
  referenceNumber,
  total,
  currency,
  dashboardUrl,
}: {
  to: string;
  clientName: string;
  quoteTitle: string;
  referenceNumber: string;
  total: number;
  currency: string;
  dashboardUrl: string;
}) {
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(total);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `🎉 Quote accepted! ${clientName} signed ${referenceNumber}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; color: #065f46; margin: 0 0 8px 0;">✓ Quote Accepted</h2>
          <p style="font-size: 15px; color: #047857; margin: 0;">
            <strong>${clientName}</strong> has accepted and signed quote <strong>${referenceNumber}</strong>.
          </p>
        </div>
        <p style="font-size: 15px; color: #444; margin: 0 0 8px 0;">
          <strong>Quote:</strong> ${quoteTitle}<br/>
          <strong>Total:</strong> ${formattedTotal}
        </p>
        <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
          You can now convert this quote to an invoice in your dashboard.
        </p>
        <a href="${dashboardUrl}" style="display: inline-block; background: #10B981; color: white;
           font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
          Convert to Invoice →
        </a>
      </div>
    `,
  });
}

// ─── Invoice sent to client ───────────────────────────────────────────────────
export async function sendInvoiceEmail({
  to,
  clientName,
  businessName,
  invoiceNumber,
  total,
  amountDue,
  currency,
  dueDate,
  invoiceUrl,
}: {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  total: number;
  amountDue: number;
  currency: string;
  dueDate?: string;
  invoiceUrl: string;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Invoice ${invoiceNumber} from ${businessName} — ${fmt(amountDue)} due`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${clientName},</p>
        <p style="font-size: 15px; color: #444; margin: 0 0 24px 0;">
          Please find invoice <strong>${invoiceNumber}</strong> from <strong>${businessName}</strong> attached.
          ${dueDate ? `Payment is due by <strong>${dueDate}</strong>.` : ""}
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 15px; margin: 0 0 8px 0;"><strong>Invoice total:</strong> ${fmt(total)}</p>
          <p style="font-size: 18px; color: #1E3A5F; font-weight: 700; margin: 0;">
            Amount due: ${fmt(amountDue)}
          </p>
        </div>
        <a href="${invoiceUrl}" style="display: inline-block; background: #1E3A5F; color: white;
           font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
          View Invoice →
        </a>
      </div>
    `,
  });
}
