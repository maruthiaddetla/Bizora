import type { Metadata } from "next";
import { ResourceArticleLayout } from "@/components/resources/ResourceArticleLayout";
import { getResourceArticle } from "@/lib/resources/articles";

const meta = getResourceArticle("how-to-find-a-commercial-space-in-india")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
  },
};

export default function HowToFindCommercialSpacePage() {
  return (
    <ResourceArticleLayout title={meta.title} description={meta.description}>
      <section>
        <h2>Define your space requirements</h2>
        <p>
          Before browsing commercial listings, clarify what you need: shop,
          office, warehouse, restaurant-ready space, or another use. Note
          preferred cities or neighbourhoods, minimum and maximum size, budget
          for rent and deposit, and whether you need parking, storage, or a
          street-facing frontage.
        </p>
      </section>

      <section>
        <h2>Location and accessibility</h2>
        <p>
          Location often determines customer flow and staff convenience. Consider
          foot traffic, road access, public transport, visibility, nearby
          complementary businesses, and local competition.
        </p>
      </section>

      <section>
        <h2>Size, rent, and deposit</h2>
        <p>
          Compare carpet/built-up area with usable layout. Confirm monthly rent,
          security deposit, advance rent, and any brokerage. Ask whether
          maintenance, parking, or society charges are separate.
        </p>
      </section>

      <section>
        <h2>Lease terms and permitted use</h2>
        <p>
          Review lock-in period, tenure, renewal options, escalation, exit
          clauses, and subletting rules. Confirm that your intended business use
          is permitted under the lease and local regulations.
        </p>
      </section>

      <section>
        <h2>Parking, utilities, and fit-out</h2>
        <ul>
          <li>Parking availability for customers and staff</li>
          <li>Power load, water, drainage, and internet readiness</li>
          <li>Whether the space is bare shell, semi-furnished, or ready-to-use</li>
          <li>Who pays for fit-out and what happens to fittings at exit</li>
        </ul>
      </section>

      <section>
        <h2>Permissions and surrounding context</h2>
        <p>
          Some uses need additional local permissions. Also walk the area at
          different times of day to understand traffic, noise, and neighbouring
          businesses before you commit.
        </p>
      </section>

      <section>
        <h2>Calculate total occupancy cost</h2>
        <p>
          Look beyond headline rent. Include deposit opportunity cost,
          maintenance, utilities, parking, fit-out, and expected escalation over
          the lease term. A lower rent can still be expensive if other costs are
          high.
        </p>
      </section>

      <section>
        <h2>Inspect and review the lease</h2>
        <p>
          Visit the site in person, check structural condition, and verify
          measurements where possible. Have a lawyer review the lease before you
          sign, especially around termination, renewal, and landlord obligations.
        </p>
      </section>

      <section id="leasing-checklist">
        <h2>Commercial space leasing checklist</h2>
        <ul>
          <li>Space type and permitted use confirmed</li>
          <li>Location, access, and foot traffic assessed</li>
          <li>Size and layout suitable for operations</li>
          <li>Rent, deposit, and other charges clarified</li>
          <li>Lease tenure, lock-in, escalation, and exit terms reviewed</li>
          <li>Parking and utilities adequate</li>
          <li>Fit-out responsibility and costs understood</li>
          <li>Local permissions considered</li>
          <li>Surrounding businesses and competition observed</li>
          <li>Total occupancy cost estimated</li>
          <li>Site inspection completed</li>
          <li>Lease reviewed with professional advice</li>
        </ul>
      </section>
    </ResourceArticleLayout>
  );
}
