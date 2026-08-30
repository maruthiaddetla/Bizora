import type { Metadata } from "next";
import { ResourceArticleLayout } from "@/components/resources/ResourceArticleLayout";
import { getResourceArticle } from "@/lib/resources/articles";

const meta = getResourceArticle("business-buying-checklist")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
  },
};

const checklistSections = [
  {
    title: "Business details",
    items: [
      "Business name, category, and years of operation",
      "Ownership structure and what is being transferred",
      "Exact location and nature of premises",
      "What is included in the sale (assets, stock, brand, digital assets)",
    ],
  },
  {
    title: "Financials",
    items: [
      "Recent revenue by month/year",
      "Gross profit and net profit figures",
      "Major expense categories (rent, salaries, utilities, marketing)",
      "Evidence supporting financial claims",
    ],
  },
  {
    title: "Assets and liabilities",
    items: [
      "List of tangible assets and their condition",
      "Inventory valuation method (if applicable)",
      "Outstanding loans, dues, or contingent liabilities",
      "Any ongoing disputes or claims",
    ],
  },
  {
    title: "Lease and premises",
    items: [
      "Remaining lease tenure and renewal options",
      "Current rent, deposit, and escalation terms",
      "Transfer/assignment permissions",
      "Fit-out ownership and restoration obligations",
    ],
  },
  {
    title: "People and relationships",
    items: [
      "Key employees and roles",
      "Owner involvement required day-to-day",
      "Customer concentration (top customers as % of revenue)",
      "Supplier reliability and alternatives",
    ],
  },
  {
    title: "Licences and compliance",
    items: [
      "Trade licences and industry permissions",
      "GST / tax registration status (as applicable)",
      "Food, health, fire, or other local approvals if relevant",
      "Any compliance notices or pending renewals",
    ],
  },
  {
    title: "Reason for sale and handover",
    items: [
      "Stated reason for sale and supporting context",
      "Training/handover period offered by seller",
      "Non-compete or transition support expectations",
    ],
  },
  {
    title: "Due diligence and completion",
    items: [
      "Independent document verification",
      "Site visit and operations walkthrough",
      "Professional advice (legal, tax, accounting)",
      "Written agreement covering price, inclusions, and timelines",
      "Settlement, payment milestones, and transfer formalities",
    ],
  },
] as const;

export default function BusinessBuyingChecklistPage() {
  return (
    <ResourceArticleLayout title={meta.title} description={meta.description}>
      <section>
        <h2>How to use this checklist</h2>
        <p>
          Use this list while reviewing Bizora listings and during follow-up
          conversations with sellers. Not every item applies to every business,
          but skipping major areas — especially financials, lease, and licences —
          increases risk.
        </p>
      </section>

      {checklistSections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h2>Next steps</h2>
        <p>
          After working through the checklist, decide whether the opportunity
          still fits your brief. If it does, continue due diligence with
          professional support before agreeing final terms.
        </p>
      </section>
    </ResourceArticleLayout>
  );
}
