export type EnquirySellerEmailContent = {
  listingTitle: string;
  buyerName: string;
  message: string;
  enquiryUrl: string;
};

const MESSAGE_PREVIEW_MAX = 500;

export function truncateEnquiryMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= MESSAGE_PREVIEW_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX - 1)}…`;
}

export function buildEnquirySellerEmail(
  content: EnquirySellerEmailContent,
): { subject: string; html: string; text: string } {
  const listingTitle = content.listingTitle.trim() || "your listing";
  const buyerName = content.buyerName.trim() || "A buyer";
  const message = truncateEnquiryMessage(content.message);
  const subject = "New enquiry for your Bizora listing";

  const text = [
    "Someone has contacted you about:",
    "",
    listingTitle,
    "",
    "Buyer:",
    buyerName,
    "",
    "Message:",
    message,
    "",
    "View enquiry:",
    content.enquiryUrl,
  ].join("\n");

  const html = `
    <p>Someone has contacted you about:</p>
    <p><strong>${escapeHtml(listingTitle)}</strong></p>
    <p><strong>Buyer:</strong><br />${escapeHtml(buyerName)}</p>
    <p><strong>Message:</strong><br />${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    <p><a href="${escapeHtml(content.enquiryUrl)}">View enquiry</a></p>
  `.trim();

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEnquiryDashboardUrl(
  siteUrl: string,
  enquiryId: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/dashboard/enquiries/${enquiryId}`;
}
