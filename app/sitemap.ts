import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/listings`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/sell`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/sign-in`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/sign-up`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return staticEntries;
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id, updated_at, seller_id")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (error || !data) {
    if (process.env.NODE_ENV === "development" && error) {
      console.warn("[Bizora] sitemap listing fetch failed:", error.message);
    }
    return staticEntries;
  }

  const listingEntries: MetadataRoute.Sitemap = data.map((row) => ({
    url: `${siteUrl}/listings/${row.id}`,
    lastModified: row.updated_at ? new Date(row.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const sellerIds = [
    ...new Set(
      data
        .map((row) => row.seller_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ].slice(0, 2000);

  const sellerEntries: MetadataRoute.Sitemap = sellerIds.map((id) => ({
    url: `${siteUrl}/sellers/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...listingEntries, ...sellerEntries];
}
