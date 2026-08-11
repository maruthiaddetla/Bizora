import type { BusinessRow } from "@/lib/supabase/database.types";
import type { Listing } from "@/lib/listings";

export function mapBusinessRowToListing(row: BusinessRow): Listing {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    price: row.price ?? undefined,
    description: row.description,
    image: row.image_url,
    category: row.category,
    premium: row.premium,
  };
}
