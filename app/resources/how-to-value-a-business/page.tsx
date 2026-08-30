import type { Metadata } from "next";
import { ResourceArticleLayout } from "@/components/resources/ResourceArticleLayout";
import { getResourceArticle } from "@/lib/resources/articles";

const meta = getResourceArticle("how-to-value-a-business")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
  },
};

export default function HowToValueABusinessPage() {
  return (
    <ResourceArticleLayout title={meta.title} description={meta.description}>
      <section>
        <h2>There is no single universal formula</h2>
        <p>
          Business valuation in India depends on industry norms, asset intensity,
          transferability, and buyer demand. A café, a manufacturing unit, and a
          service firm are rarely valued the same way. Treat any rule of thumb
          as a starting point for discussion — not a guarantee of market price.
        </p>
      </section>

      <section>
        <h2>Key factors that influence value</h2>
        <h3>Revenue</h3>
        <p>
          Absolute sales matter, but so do trends. Growing, stable, and declining
          revenue tell different stories about future earnings potential.
        </p>
        <h3>Profitability</h3>
        <p>
          Buyers usually care about sustainable profit after realistic owner
          compensation and operating costs. One strong year is less persuasive
          than several years of consistent performance.
        </p>
        <h3>Cash flow</h3>
        <p>
          Profit on paper is not the same as cash available to run and grow the
          business. Working capital needs, receivables, and inventory cycles
          affect what a buyer can actually take home.
        </p>
        <h3>Assets</h3>
        <p>
          Equipment, inventory, vehicles, intellectual property, and fit-outs
          can support value — especially when they are owned, usable, and
          included in the sale.
        </p>
        <h3>Industry and location</h3>
        <p>
          Some sectors attract more buyers than others. Location quality, local
          demand, competition, and lease security often influence what buyers
          are willing to pay.
        </p>
        <h3>Growth potential and customer base</h3>
        <p>
          Diversified, repeat customers and clear growth levers (new products,
          nearby markets, digital channels) can support a stronger price.
          Heavy dependence on one client or the current owner can reduce it.
        </p>
        <h3>Liabilities</h3>
        <p>
          Loans, pending dues, disputes, and unfavourable contracts can reduce
          what a buyer offers — or stop a deal entirely if they are not
          disclosed early.
        </p>
      </section>

      <section>
        <h2>Comparable businesses</h2>
        <p>
          Looking at similar businesses listed for sale can provide context, but
          public asking prices are not the same as completed sale prices. Use
          comparables carefully and adjust for differences in size, location,
          and profitability.
        </p>
      </section>

      <section>
        <h2>Asking price vs valuation</h2>
        <p>
          An asking price is what a seller hopes to receive. A valuation is an
          estimate of worth based on analysis. They may differ because of
          urgency to sell, emotional attachment, incomplete information, or
          negotiation strategy.
        </p>
        <p>
          On Bizora, treat asking price as the starting point for enquiry and
          verification — then refine your view with documents and professional
          advice.
        </p>
      </section>
    </ResourceArticleLayout>
  );
}
