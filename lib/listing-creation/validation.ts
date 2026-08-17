import {
  fetchCities,
  fetchDistricts,
  fetchLocalities,
  fetchStates,
} from "@/lib/repositories/locations.repository";
import { fetchActiveCategories } from "@/lib/repositories/categories.repository";

export type ListingFormInput = {
  title?: string | null;
  description?: string | null;
  categoryId?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  cityId?: string | null;
  localityId?: string | null;
  askingPrice?: number | string | null;
  annualRevenue?: number | string | null;
  annualProfit?: number | string | null;
  ebitda?: number | string | null;
  establishedYear?: number | string | null;
  employees?: number | string | null;
  reasonForSale?: string | null;
};

export type ListingFieldErrors = Partial<
  Record<
    | "title"
    | "description"
    | "categoryId"
    | "stateId"
    | "districtId"
    | "cityId"
    | "localityId"
    | "askingPrice"
    | "annualRevenue"
    | "annualProfit"
    | "ebitda"
    | "establishedYear"
    | "employees"
    | "reasonForSale"
    | "images"
    | "form",
    string
  >
>;

export type ParsedListingFields = {
  title: string;
  description: string | null;
  categoryId: string | null;
  stateId: string | null;
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
  askingPrice: number | null;
  annualRevenue: number | null;
  annualProfit: number | null;
  ebitda: number | null;
  establishedYear: number | null;
  employees: number | null;
  reasonForSale: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function parseOptionalNumber(
  value: number | string | null | undefined,
): number | null | "invalid" {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "invalid";
  return parsed;
}

export function parseListingFormInput(input: ListingFormInput): {
  fields: ParsedListingFields;
  errors: ListingFieldErrors;
} {
  const errors: ListingFieldErrors = {};

  const title = (input.title ?? "").trim();
  const descriptionRaw = (input.description ?? "").trim();
  const reasonForSaleRaw = (input.reasonForSale ?? "").trim();

  const categoryId =
    input.categoryId && isUuid(input.categoryId) ? input.categoryId : null;
  const stateId = input.stateId && isUuid(input.stateId) ? input.stateId : null;
  const districtId =
    input.districtId && isUuid(input.districtId) ? input.districtId : null;
  const cityId = input.cityId && isUuid(input.cityId) ? input.cityId : null;
  const localityId =
    input.localityId && isUuid(input.localityId) ? input.localityId : null;

  if (input.categoryId && !categoryId) {
    errors.categoryId = "Please select a valid category.";
  }
  if (input.stateId && !stateId) {
    errors.stateId = "Please select a valid state.";
  }
  if (input.districtId && !districtId) {
    errors.districtId = "Please select a valid district.";
  }
  if (input.cityId && !cityId) {
    errors.cityId = "Please select a valid city.";
  }
  if (input.localityId && !localityId) {
    errors.localityId = "Please select a valid locality.";
  }

  const askingPrice = parseOptionalNumber(input.askingPrice);
  const annualRevenue = parseOptionalNumber(input.annualRevenue);
  const annualProfit = parseOptionalNumber(input.annualProfit);
  const ebitda = parseOptionalNumber(input.ebitda);
  const establishedYear = parseOptionalNumber(input.establishedYear);
  const employees = parseOptionalNumber(input.employees);

  if (askingPrice === "invalid") {
    errors.askingPrice = "Please enter a valid asking price.";
  } else if (askingPrice != null && askingPrice < 0) {
    errors.askingPrice = "Asking price cannot be negative.";
  }

  if (annualRevenue === "invalid") {
    errors.annualRevenue = "Please enter a valid annual revenue.";
  } else if (annualRevenue != null && annualRevenue < 0) {
    errors.annualRevenue = "Annual revenue cannot be negative.";
  }

  if (annualProfit === "invalid") {
    errors.annualProfit = "Please enter a valid annual profit.";
  }

  if (ebitda === "invalid") {
    errors.ebitda = "Please enter a valid EBITDA.";
  }

  const currentYear = new Date().getFullYear();
  if (establishedYear === "invalid") {
    errors.establishedYear = "Please enter a valid established year.";
  } else if (
    establishedYear != null &&
    (establishedYear < 1800 || establishedYear > currentYear)
  ) {
    errors.establishedYear = `Established year must be between 1800 and ${currentYear}.`;
  }

  if (employees === "invalid") {
    errors.employees = "Please enter a valid employee count.";
  } else if (employees != null && (employees < 0 || !Number.isInteger(employees))) {
    errors.employees = "Employees must be a whole number of zero or more.";
  }

  const fields: ParsedListingFields = {
    title,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
    categoryId,
    stateId,
    districtId,
    cityId,
    localityId,
    askingPrice: askingPrice === "invalid" ? null : askingPrice,
    annualRevenue: annualRevenue === "invalid" ? null : annualRevenue,
    annualProfit: annualProfit === "invalid" ? null : annualProfit,
    ebitda: ebitda === "invalid" ? null : ebitda,
    establishedYear:
      establishedYear === "invalid" ? null : establishedYear,
    employees: employees === "invalid" ? null : employees,
    reasonForSale: reasonForSaleRaw.length > 0 ? reasonForSaleRaw : null,
  };

  return { fields, errors };
}

/** Lenient draft save: title required so the listing is identifiable. */
export function validateDraftFields(
  fields: ParsedListingFields,
  baseErrors: ListingFieldErrors,
): ListingFieldErrors {
  const errors = { ...baseErrors };
  if (!fields.title) {
    errors.title = "Please enter a business title.";
  }
  return errors;
}

/**
 * Strict submit validation (text/data).
 * Image requirement is reserved for Phase 4C-2B via `errors.images`.
 */
export async function validateSubmitFields(
  fields: ParsedListingFields,
  baseErrors: ListingFieldErrors,
  options?: {
    requirePrimaryImage?: boolean;
    hasPrimaryImage?: boolean;
    imageCount?: number;
  },
): Promise<ListingFieldErrors> {
  const errors = { ...baseErrors };

  if (!fields.title) {
    errors.title = "Please enter a business title.";
  }

  if (!fields.description || fields.description.length < 50) {
    errors.description =
      "Please enter a description of at least 50 characters.";
  }

  if (!fields.categoryId) {
    errors.categoryId = "Please select a category.";
  } else {
    const categories = await fetchActiveCategories();
    if (!categories.some((category) => category.id === fields.categoryId)) {
      errors.categoryId = "Please select a valid active category.";
    }
  }

  if (!fields.stateId) {
    errors.stateId = "Please select a state.";
  }
  if (!fields.districtId) {
    errors.districtId = "Please select a district.";
  }
  if (!fields.cityId) {
    errors.cityId = "Please select a city.";
  }

  if (fields.askingPrice == null || fields.askingPrice <= 0) {
    errors.askingPrice = "Please enter an asking price greater than zero.";
  }

  // Location hierarchy (server-side, trusted lookups)
  if (fields.stateId) {
    const states = await fetchStates();
    if (!states.some((state) => state.id === fields.stateId)) {
      errors.stateId = "Please select a valid state.";
    }
  }

  if (fields.stateId && fields.districtId) {
    const districts = await fetchDistricts(fields.stateId);
    if (!districts.some((district) => district.id === fields.districtId)) {
      errors.districtId = "Please select a valid district for the selected state.";
    }
  }

  if (fields.districtId && fields.cityId) {
    const cities = await fetchCities(fields.districtId);
    if (!cities.some((city) => city.id === fields.cityId)) {
      errors.cityId = "Please select a valid city for the selected district.";
    }
  }

  if (fields.cityId && fields.localityId) {
    const localities = await fetchLocalities(fields.cityId);
    if (!localities.some((locality) => locality.id === fields.localityId)) {
      errors.localityId =
        "Please select a valid locality for the selected city.";
    }
  }

  if (options?.requirePrimaryImage) {
    const imageCount = options.imageCount ?? 0;
    if (imageCount < 1) {
      errors.images = "Please upload at least one business photo.";
    } else if (!options.hasPrimaryImage) {
      errors.images = "Please select a primary business photo.";
    }
  }

  return errors;
}

export function hasFieldErrors(errors: ListingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
