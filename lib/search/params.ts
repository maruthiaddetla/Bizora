/**
 * URL ↔ BusinessSearchFilters contract for buyer browse/search.
 * Used by the future /listings page and homepage SearchHero navigation.
 */

export const DEFAULT_SEARCH_PAGE = 1;
export const DEFAULT_SEARCH_PAGE_SIZE = 12;
export const MAX_SEARCH_PAGE_SIZE = 50;

/**
 * Query sort for published listings.
 * Not currently parsed from public URL params (homepage / repository only).
 * - featured: is_premium DESC, then created_at DESC (default /listings order)
 * - newest: created_at DESC
 */
export type BusinessSearchSort = "featured" | "newest";

export const DEFAULT_SEARCH_SORT: BusinessSearchSort = "featured";

export type BusinessSearchFilters = {
  q?: string;
  categoryIds?: string[];
  stateId?: string;
  districtId?: string;
  cityId?: string;
  localityId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sort?: BusinessSearchSort;
};

/** Filters with pagination defaults applied (for repository queries). */
export type ResolvedBusinessSearchFilters = BusinessSearchFilters & {
  page: number;
  pageSize: number;
  sort: BusinessSearchSort;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function firstParam(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (params instanceof URLSearchParams) {
    const value = params.get(key);
    return value == null ? undefined : value;
  }

  const raw = params[key];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function parseOptionalString(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalUuid(value: string | undefined): string | undefined {
  const trimmed = parseOptionalString(value);
  if (!trimmed || !isUuid(trimmed)) return undefined;
  return trimmed;
}

function parseCategoryIds(value: string | undefined): string[] | undefined {
  const trimmed = parseOptionalString(value);
  if (!trimmed) return undefined;

  const ids = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && isUuid(part));

  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

function parseNonNegativeNumber(value: string | undefined): number | undefined {
  const trimmed = parseOptionalString(value);
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function parsePage(value: string | undefined): number {
  const trimmed = parseOptionalString(value);
  if (!trimmed) return DEFAULT_SEARCH_PAGE;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_SEARCH_PAGE;
  return parsed;
}

function parsePageSize(value: string | undefined): number {
  const trimmed = parseOptionalString(value);
  if (!trimmed) return DEFAULT_SEARCH_PAGE_SIZE;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_SEARCH_PAGE_SIZE;
  }

  return Math.min(parsed, MAX_SEARCH_PAGE_SIZE);
}

/**
 * Parse URL search parameters into BusinessSearchFilters.
 * Invalid values are ignored; pagination defaults are applied via resolveSearchFilters.
 */
export function parseSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): BusinessSearchFilters {
  const q = parseOptionalString(firstParam(params, "q"));
  const categoryIds = parseCategoryIds(firstParam(params, "category"));
  const stateId = parseOptionalUuid(firstParam(params, "state"));
  const districtId = parseOptionalUuid(firstParam(params, "district"));
  const cityId = parseOptionalUuid(firstParam(params, "city"));
  const localityId = parseOptionalUuid(firstParam(params, "locality"));

  let minPrice = parseNonNegativeNumber(firstParam(params, "min"));
  let maxPrice = parseNonNegativeNumber(firstParam(params, "max"));

  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    const swappedMin = maxPrice;
    maxPrice = minPrice;
    minPrice = swappedMin;
  }

  const pageRaw = firstParam(params, "page");
  const pageSizeRaw = firstParam(params, "pageSize");

  const filters: BusinessSearchFilters = {};

  if (q) filters.q = q;
  if (categoryIds) filters.categoryIds = categoryIds;
  if (stateId) filters.stateId = stateId;
  if (districtId) filters.districtId = districtId;
  if (cityId) filters.cityId = cityId;
  if (localityId) filters.localityId = localityId;
  if (minPrice != null) filters.minPrice = minPrice;
  if (maxPrice != null) filters.maxPrice = maxPrice;

  if (pageRaw != null && parseOptionalString(pageRaw)) {
    filters.page = parsePage(pageRaw);
  }
  if (pageSizeRaw != null && parseOptionalString(pageSizeRaw)) {
    filters.pageSize = parsePageSize(pageSizeRaw);
  }

  return filters;
}

/** Apply pagination defaults for repository queries. */
export function resolveSearchFilters(
  filters: BusinessSearchFilters,
): ResolvedBusinessSearchFilters {
  let minPrice = filters.minPrice;
  let maxPrice = filters.maxPrice;

  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    const swappedMin = maxPrice;
    maxPrice = minPrice;
    minPrice = swappedMin;
  }

  const page =
    filters.page != null && filters.page >= 1
      ? Math.floor(filters.page)
      : DEFAULT_SEARCH_PAGE;

  const pageSize =
    filters.pageSize != null && filters.pageSize >= 1
      ? Math.min(Math.floor(filters.pageSize), MAX_SEARCH_PAGE_SIZE)
      : DEFAULT_SEARCH_PAGE_SIZE;

  const sort: BusinessSearchSort =
    filters.sort === "newest" ? "newest" : DEFAULT_SEARCH_SORT;

  return {
    ...filters,
    minPrice,
    maxPrice,
    page,
    pageSize,
    sort,
  };
}

/**
 * Serialize filters to URLSearchParams.
 * Omits empty values and default pagination (page=1, pageSize=12).
 */
export function serializeSearchParams(
  filters: BusinessSearchFilters,
): URLSearchParams {
  const resolved = resolveSearchFilters(filters);
  const params = new URLSearchParams();

  if (resolved.q) {
    params.set("q", resolved.q);
  }

  if (resolved.categoryIds && resolved.categoryIds.length > 0) {
    params.set("category", resolved.categoryIds.join(","));
  }

  if (resolved.stateId) params.set("state", resolved.stateId);
  if (resolved.districtId) params.set("district", resolved.districtId);
  if (resolved.cityId) params.set("city", resolved.cityId);
  if (resolved.localityId) params.set("locality", resolved.localityId);

  if (resolved.minPrice != null) {
    params.set("min", String(resolved.minPrice));
  }
  if (resolved.maxPrice != null) {
    params.set("max", String(resolved.maxPrice));
  }

  if (resolved.page !== DEFAULT_SEARCH_PAGE) {
    params.set("page", String(resolved.page));
  }
  if (resolved.pageSize !== DEFAULT_SEARCH_PAGE_SIZE) {
    params.set("pageSize", String(resolved.pageSize));
  }

  return params;
}

export function buildSearchHref(filters: BusinessSearchFilters): string {
  const params = serializeSearchParams(filters);
  const query = params.toString();
  return query ? `/listings?${query}` : "/listings";
}
