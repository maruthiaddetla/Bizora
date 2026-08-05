export type Listing = {
  id: string;
  title: string;
  location: string;
  price?: string;
  description: string;
  image: string;
  category: string;
  premium?: boolean;
};

export type SellerInfo = {
  name: string;
  role: "Owner" | "Broker";
  company?: string;
  verified: boolean;
  avatar: string;
  responseTime: string;
  listingsCount: number;
};

export type BusinessDetail = Listing & {
  images: string[];
  industry: string;
  revenue: string;
  ebitda: string;
  netProfit: string;
  establishedYear: number;
  employees: number;
  overview: string;
  reasonForSale: string;
  assetsIncluded: string[];
  facilities: string[];
  growthOpportunities: string[];
  address: string;
  coordinates: { lat: number; lng: number };
  seller: SellerInfo;
  brokerId?: string;
};

export function getAllListings(): Listing[] {
  const seen = new Set<string>();
  const result: Listing[] = [];
  for (const arr of [premiumListings, latestListings, popularListings]) {
    for (const listing of arr) {
      if (!seen.has(listing.id)) {
        seen.add(listing.id);
        result.push(listing);
      }
    }
  }
  return result;
}

export function getListingById(id: string): Listing | undefined {
  return getAllListings().find((listing) => listing.id === id);
}

export function getSimilarListings(id: string, limit = 3): Listing[] {
  const current = getListingById(id);
  if (!current) return getAllListings().filter((l) => l.id !== id).slice(0, limit);
  return getAllListings()
    .filter((l) => l.id !== id && l.category === current.category)
    .slice(0, limit);
}

export const premiumListings: Listing[] = [
  {
    id: "1",
    title: "Engineering Business for Sale",
    location: "Hyderabad",
    price: "₹20.5 Cr",
    description:
      "Highly regarded engineering business with long-term contracts and skilled workforce.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    category: "Manufacturing",
    premium: true,
  },
  {
    id: "2",
    title: "Premium Café & Roastery",
    location: "Bangalore",
    price: "₹7.4 Cr",
    description:
      "Award-winning specialty coffee brand with strong foot traffic and loyal customer base.",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    category: "Hospitality",
    premium: true,
  },
  {
    id: "3",
    title: "SaaS Platform — B2B Analytics",
    location: "Pan-India",
    price: "₹10 Cr",
    description:
      "Profitable recurring-revenue software business with 94% retention and clean financials.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    category: "Technology",
    premium: true,
  },
  {
    id: "4",
    title: "Landscaping & Garden Services",
    location: "Pune",
    price: "₹3.2 Cr",
    description:
      "Established franchise territory with recurring maintenance contracts and growth runway.",
    image:
      "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80",
    category: "Services",
    premium: true,
  },
  {
    id: "5",
    title: "Liquor Retail — Under Management",
    location: "Mumbai",
    price: "₹5 Cr",
    description:
      "Turnkey retail operation with experienced management team and stable cash flow.",
    image:
      "https://images.unsplash.com/photo-1472851293107-0f6c60818006?w=800&q=80",
    category: "Retail",
    premium: true,
  },
  {
    id: "6",
    title: "Boutique Hotel — 20 Rooms",
    location: "Goa",
    price: "₹5.8 Cr",
    description:
      "Recently renovated property with strong seasonal returns and excellent online reviews.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    category: "Hospitality",
    premium: true,
  },
];

export const latestListings: Listing[] = [
  {
    id: "7",
    title: "South Indian Restaurant Chain",
    location: "Chennai",
    price: "₹1.15 Cr",
    description: "15 years trading · ₹2 Cr revenue · Strong local following",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    category: "Hospitality",
  },
  {
    id: "8",
    title: "Digital Marketing Agency",
    location: "Hyderabad",
    price: "₹3.5 Cr",
    description: "12 retainer clients · Remote-capable team · Clean handover",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    category: "Services",
  },
  {
    id: "9",
    title: "Agro-Processing Unit",
    location: "Nagpur",
    price: "₹46 Cr",
    description: "Central India operations · Long-term supply contracts",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    category: "Agriculture",
  },
  {
    id: "10",
    title: "E-commerce Health Brand",
    location: "Nationwide",
    price: "₹2.6 Cr",
    description: "DTC supplements brand · 38% gross margin · Shopify stack",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    category: "Retail",
  },
];

export const popularListings: Listing[] = [
  {
    id: "11",
    title: "Resort & Wellness Retreat",
    location: "Udaipur",
    description: "Premium hospitality asset · Freehold · High occupancy",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    category: "Hospitality",
  },
  {
    id: "12",
    title: "Waterfront Restaurant & Bar",
    location: "Kochi",
    price: "₹2.1 Cr",
    description: "Stunning location · Fully equipped kitchen · Liquor licence",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    category: "Hospitality",
  },
  {
    id: "13",
    title: "Commercial Cleaning Contract",
    location: "Mumbai",
    price: "₹1.5 Cr",
    description: "Recurring B2B contracts · Low overheads · Owner-operated",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    category: "Services",
  },
];

export const categories = [
  "All Industries",
  "Hospitality",
  "Retail",
  "Services",
  "Technology",
  "Manufacturing",
  "Franchises",
  "Agriculture",
];

export const locations = [
  "All India",
  "Hyderabad",
  "Mumbai",
  "Delhi NCR",
  "Bangalore",
  "Chennai",
  "Pune",
  "Ahmedabad",
  "Nationwide",
];
