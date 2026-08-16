import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

/**
 * Active categories for buyer search filters and seller forms.
 */
export async function fetchActiveCategories(): Promise<CategoryOption[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchActiveCategories failed:", error.message);
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
  }));
}

export async function fetchCategoriesByIds(
  ids: string[],
): Promise<CategoryOption[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .in("id", ids)
    .eq("is_active", true);

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchCategoriesByIds failed:", error.message);
    }
    return [];
  }

  return data;
}
