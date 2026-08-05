import {
  getAllListings,
  getListingById,
  type BusinessDetail,
  type Listing,
} from "@/lib/listings";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Udaipur: { lat: 24.5854, lng: 73.7125 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  "Pan-India": { lat: 20.5937, lng: 78.9629 },
  Nationwide: { lat: 20.5937, lng: 78.9629 },
};

const detailOverrides: Record<string, Partial<BusinessDetail>> = {
  "1": {
    images: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80",
      "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80",
      "https://images.unsplash.com/photo-1587291321797-f122b9e9c9a8?w=1200&q=80",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
    ],
    industry: "Precision Engineering & Manufacturing",
    revenue: "₹32 Cr",
    ebitda: "₹6.8 Cr",
    netProfit: "₹4.2 Cr",
    establishedYear: 2008,
    employees: 85,
    overview:
      "A highly regarded precision engineering business serving automotive, aerospace, and industrial clients across South India. The company operates from a 45,000 sq ft facility with modern CNC machinery, ISO-certified processes, and a skilled workforce with low attrition. Revenue is diversified across 12 anchor clients with multi-year contracts, providing strong visibility and predictable cash flows.",
    reasonForSale:
      "The founding partners are approaching retirement and wish to transition ownership to a buyer who can scale operations nationally. There is no distress — the business is performing at record levels with a full order book through the next 18 months.",
    assetsIncluded: [
      "CNC machinery & tooling (fully owned)",
      "Inventory & raw materials",
      "Client contracts & order pipeline",
      "Brand reputation & ISO certifications",
      "Experienced management team (optional retention)",
      "ERP system & quality documentation",
    ],
    facilities: [
      "45,000 sq ft manufacturing facility (leased, 8 years remaining)",
      "In-house quality lab and testing equipment",
      "Dedicated R&D prototyping unit",
      "Warehouse with raw material storage",
      "Administration block with conference facilities",
    ],
    growthOpportunities: [
      "Expand into defence and medical device manufacturing",
      "Add export channels to Southeast Asia and Middle East",
      "Acquire complementary fabrication capabilities",
      "Introduce automation to increase throughput by 30%",
      "Cross-sell value-added assembly services to existing clients",
    ],
    address: "IDA Uppal, Hyderabad, Telangana 500039",
    coordinates: CITY_COORDS.Hyderabad,
    seller: {
      name: "Rajesh K.",
      role: "Broker",
      company: "DealFlow Advisors India",
      verified: true,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
      responseTime: "Within 4 hours",
      listingsCount: 24,
    },
  },
};

function buildDefaultDetail(listing: Listing): BusinessDetail {
  const coords =
    CITY_COORDS[listing.location] ?? CITY_COORDS.Hyderabad;

  const galleryExtras = [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80",
  ];

  return {
    ...listing,
    price: listing.price ?? "Price on request",
    images: [listing.image, ...galleryExtras],
    industry: listing.category,
    revenue: "₹8–15 Cr",
    ebitda: "₹1.5–3 Cr",
    netProfit: "₹1–2 Cr",
    establishedYear: 2012,
    employees: 25,
    overview: `${listing.description} This is a well-established ${listing.category.toLowerCase()} business in ${listing.location} with verified financials, clean compliance records, and a motivated seller ready for a structured handover.`,
    reasonForSale:
      "Owner relocating abroad and seeking a qualified buyer to continue operations. Sale process is confidential with NDAs required before financial disclosure.",
    assetsIncluded: [
      "Business goodwill & brand name",
      "Equipment and fixtures",
      "Existing customer contracts",
      "Inventory at valuation",
      "Digital assets & social presence",
    ],
    facilities: [
      "Fully fitted commercial premises",
      "Modern equipment in good working order",
      "Storage and back-office facilities",
      "Parking for staff and customers",
    ],
    growthOpportunities: [
      "Expand to adjacent markets within the region",
      "Increase digital marketing and online presence",
      "Add complementary product or service lines",
      "Optimise operations for margin improvement",
    ],
    address: `${listing.location}, India`,
    coordinates: coords,
    seller: {
      name: "Priya M.",
      role: "Owner",
      verified: true,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
      responseTime: "Within 24 hours",
      listingsCount: 1,
    },
  };
}

export function getBusinessDetail(id: string): BusinessDetail | undefined {
  const listing = getListingById(id);
  if (!listing) return undefined;

  const override = detailOverrides[id];
  const base = buildDefaultDetail(listing);

  if (!override) return base;

  return {
    ...base,
    ...override,
    seller: { ...base.seller, ...override.seller },
    coordinates: override.coordinates ?? base.coordinates,
  };
}

export function getAllListingIds(): string[] {
  return getAllListings().map((listing) => listing.id);
}
