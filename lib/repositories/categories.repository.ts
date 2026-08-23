import { createSupabaseServerClient } from "@/lib/supabase/server";
import { COMMERCIAL_SPACES_PARENT_SLUG } from "@/lib/listing-types";

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

async function resolveCommercialParentId(
  categories: CategoryOption[],
): Promise<string | null> {
  const parent = categories.find(
    (category) => category.slug === COMMERCIAL_SPACES_PARENT_SLUG,
  );
  return parent?.id ?? null;
}

/** Business-for-sale categories (excludes commercial-space hierarchy). */
export async function fetchBusinessCategories(): Promise<CategoryOption[]> {
  const categories = await fetchActiveCategories();
  const commercialParentId = await resolveCommercialParentId(categories);

  return categories.filter(
    (category) =>
      category.slug !== COMMERCIAL_SPACES_PARENT_SLUG &&
      category.parentId !== commercialParentId,
  );
}

/** Commercial-space child categories only. */
export async function fetchCommercialCategories(): Promise<CategoryOption[]> {
  const categories = await fetchActiveCategories();
  const commercialParentId = await resolveCommercialParentId(categories);
  if (!commercialParentId) return [];

  return categories.filter(
    (category) => category.parentId === commercialParentId,
  );
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
