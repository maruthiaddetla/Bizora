import type { Metadata } from "next";
import { ResourceArticleLayout } from "@/components/resources/ResourceArticleLayout";
import { getResourceArticle } from "@/lib/resources/articles";

const meta = getResourceArticle("how-to-buy-a-business-in-india")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
  },
};

export default function HowToBuyABusinessPage() {
  return (
    <ResourceArticleLayout title={meta.title} description={meta.description}>
      <section>
        <h2>Start with a clear brief</h2>
        <p>
          Buying a business in India is often more than comparing asking prices.
          Begin by defining what you want: industry, location preference, budget
          range, whether you want an owner-operated business or something that
          can run with a manager, and how much time you can commit after the
          purchase.
        </p>
        <p>
          A clear brief helps you shortlist listings on Bizora and avoid
          spending time on opportunities that do not match your goals.
        </p>
      </section>

      <section>
        <h2>Understand the asking price</h2>
        <p>
          The asking price is the seller&apos;s stated expectation — not a
          certified valuation. Compare it with revenue, profitability, assets
          included in the sale, lease terms, and recent performance trends.
        </p>
        <ul>
          <li>What is included in the sale (stock, equipment, brand, goodwill)?</li>
          <li>Are there liabilities that will transfer with the business?</li>
          <li>Has revenue been stable, growing, or declining?</li>
        </ul>
      </section>

      <section id="evaluate">
        <h2>Evaluate the business carefully</h2>
        <h3>Revenue and profitability</h3>
        <p>
          Review sales history, seasonality, and how profit is calculated. Ask
          for documents that support the numbers shown in the listing, and look
          for consistency across months and years.
        </p>
        <h3>Expenses and liabilities</h3>
        <p>
          Understand rent, salaries, utilities, marketing, loan repayments, and
          any pending dues. Unclear or incomplete expense information is a
          reason to slow down and ask more questions.
        </p>
        <h3>Reason for sale</h3>
        <p>
          Sellers may exit for retirement, relocation, health, partnership
          changes, or to pursue another opportunity. The reason itself is not
          automatically good or bad — but it should make sense when compared
          with the financial picture and operations.
        </p>
        <h3>Location and lease</h3>
        <p>
          For many businesses, the premises matter as much as the brand. Review
          remaining lease tenure, renewal options, rent escalation, deposit,
          lock-in, and whether the landlord must approve a transfer.
        </p>
        <h3>Employees, customers, and suppliers</h3>
        <p>
          Ask how dependent the business is on the current owner, key staff,
          a few large customers, or a single supplier. Concentration risk can
          affect continuity after handover.
        </p>
      </section>

      <section>
        <h2>Conduct due diligence</h2>
        <p>
          Due diligence is the structured review of documents and operations
          before you commit. Depending on the business, this may include
          financial statements, GST and tax records, licences, employee
          contracts, lease agreements, asset lists, and outstanding claims.
        </p>
        <p>
          Use Bizora to discover listings and start conversations, then verify
          claims independently before you finalise terms.
        </p>
      </section>

      <section>
        <h2>Seek professional advice</h2>
        <p>
          For most purchases, it is wise to involve a chartered accountant,
          lawyer, and — where relevant — an industry advisor. Professional
          review helps you understand tax implications, agreement wording, and
          risks that may not be obvious from a listing summary.
        </p>
      </section>

      <section>
        <h2>Negotiate and complete the transaction</h2>
        <p>
          Negotiation often covers price, payment milestones, stock valuation,
          training period, non-compete terms, and handover support. Complete the
          transfer with written agreements and the licences or approvals required
          for your industry and location.
        </p>
        <p>
          Bizora helps buyers and sellers connect. Completion of any transaction
          remains between the parties and their advisors.
        </p>
      </section>
    </ResourceArticleLayout>
  );
}
