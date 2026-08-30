import type { Metadata } from "next";
import { ResourceArticleLayout } from "@/components/resources/ResourceArticleLayout";
import { getResourceArticle } from "@/lib/resources/articles";

const meta = getResourceArticle("how-to-sell-a-business-in-india")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
  },
};

export default function HowToSellABusinessPage() {
  return (
    <ResourceArticleLayout title={meta.title} description={meta.description}>
      <section>
        <h2>Prepare before you list</h2>
        <p>
          Buyers respond better to organised sellers. Before listing on Bizora,
          gather a clear summary of what the business does, where it operates,
          what is included in the sale, and why you are selling.
        </p>
        <ul>
          <li>Write a factual overview of products, services, and customers</li>
          <li>List assets included (equipment, inventory, brand, digital assets)</li>
          <li>Note any known issues early — surprises reduce trust</li>
        </ul>
      </section>

      <section>
        <h2>Organise financial records</h2>
        <p>
          Clean records make conversations smoother. Prepare recent revenue and
          profit figures, major expense categories, and supporting documents you
          are willing to share at the right stage of enquiry.
        </p>
        <p>
          You do not need to publish every confidential detail in a public
          listing. Share sensitive documents only after you are comfortable with
          the buyer&apos;s seriousness and identity.
        </p>
      </section>

      <section>
        <h2>Determine an appropriate asking price</h2>
        <p>
          Your asking price should be supportable by performance, assets, and
          market context. Review our guide on valuing a business, then set a
          price that leaves room for discussion without appearing disconnected
          from the numbers.
        </p>
      </section>

      <section id="listing">
        <h2>Create a compelling listing</h2>
        <p>
          A strong Bizora listing helps the right buyers find you. Focus on
          clarity rather than hype.
        </p>
        <ul>
          <li>
            <strong>Accurate information:</strong> title, category, location,
            price, and key metrics should match what you can support
          </li>
          <li>
            <strong>Clear description:</strong> explain operations, customers,
            and what makes the business transferable
          </li>
          <li>
            <strong>Photos:</strong> use recent, well-lit photos of premises,
            products, or key assets where appropriate
          </li>
          <li>
            <strong>Reason for sale:</strong> a concise, credible explanation
            builds confidence
          </li>
        </ul>
      </section>

      <section>
        <h2>Respond to buyer enquiries</h2>
        <p>
          Reply promptly and professionally. Ask clarifying questions about the
          buyer&apos;s background and timeline. Keep early conversations focused
          on public listing details, then move to deeper information when both
          sides are ready.
        </p>
      </section>

      <section>
        <h2>Protect sensitive information</h2>
        <p>
          Share customer lists, exact margins, or proprietary processes only when
          needed. Many sellers use staged disclosure: summary figures first,
          detailed documents later, often under a non-disclosure agreement
          prepared with legal advice.
        </p>
      </section>

      <section>
        <h2>Prepare for due diligence and negotiation</h2>
        <p>
          Serious buyers will verify claims. Keep documents ready, be
          consistent in your answers, and negotiate on price, handover support,
          stock, and timelines with professionalism.
        </p>
        <p>
          Complete the transaction with appropriate professional support —
          typically legal and accounting advice — so agreements, tax, and
          handover steps are handled correctly.
        </p>
      </section>
    </ResourceArticleLayout>
  );
}
