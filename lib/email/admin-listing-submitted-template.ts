import { getSiteUrl } from "@/lib/site";

export type AdminListingSubmittedEmailContent = {
  listingTitle: string;
  listingTypeLabel: string;
  locationLabel: string;
  priceLabel: string | null;
  sellerName: string | null;
  reviewUrl: string;
  isResubmission: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildAdminListingReviewUrl(
  siteUrl: string,
  listingId: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/admin/listings/${listingId}`;
}

export function buildAdminListingSubmittedEmail(
  content: AdminListingSubmittedEmailContent,
): { subject: string; html: string; text: string } {
  const title = content.listingTitle.trim() || "Untitled listing";
  const listingType = content.listingTypeLabel.trim() || "Listing";
  const location = content.locationLabel.trim() || "India";
  const subject = content.isResubmission
    ? "Bizora listing resubmitted for review"
    : "New Bizora listing submitted for review";

  const headline = content.isResubmission
    ? "Listing resubmitted for review"
    : "New listing submitted for review";
  const intro = content.isResubmission
    ? "A listing has been resubmitted on Bizora and requires your review."
    : "A new listing has been submitted on Bizora and requires your review.";

  const details: string[] = [
    `Title: ${title}`,
    `Type: ${listingType}`,
    `Location: ${location}`,
  ];
  if (content.priceLabel) {
    details.push(`Price: ${content.priceLabel}`);
  }
  if (content.sellerName) {
    details.push(`Seller: ${content.sellerName}`);
  }

  const text = [
    "Bizora",
    "",
    headline,
    "",
    intro,
    "",
    ...details,
    "",
    "Review listing:",
    content.reviewUrl,
  ].join("\n");

  const detailHtml = details
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <p style="font-size: 18px; font-weight: 700; margin: 0 0 12px;">Bizora</p>
      <p style="font-size: 16px; font-weight: 600; margin: 0 0 8px;">${escapeHtml(headline)}</p>
      <p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>
      <ul style="padding-left: 18px; margin: 0 0 20px;">
        ${detailHtml}
      </ul>
      <p style="margin: 0;">
        <a href="${escapeHtml(content.reviewUrl)}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
          Review listing
        </a>
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function resolveAdminListingEmailSiteUrl(): string {
  return getSiteUrl();
}
