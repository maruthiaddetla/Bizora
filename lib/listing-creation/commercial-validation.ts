import {
  fetchCities,
  fetchDistricts,
  fetchLocalities,
  fetchStates,
} from "@/lib/repositories/locations.repository";
import { fetchCommercialCategories } from "@/lib/repositories/categories.repository";
import {
  isFurnishedOption,
  isListingPurpose,
  isSpaceType,
} from "@/lib/listing-types";

export type CommercialSpaceFormInput = {
  title?: string | null;
  description?: string | null;
  categoryId?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  cityId?: string | null;
  localityId?: string | null;
  spaceType?: string | null;
  listingPurpose?: string | null;
  monthlyRent?: number | string | null;
  securityDeposit?: number | string | null;
  areaSqft?: number | string | null;
  floor?: string | null;
  parkingSpaces?: number | string | null;
  furnished?: string | null;
  leaseTermMonths?: number | string | null;
  availableFrom?: string | null;
  businessUsage?: string | null;
};

export type CommercialFieldErrors = Partial<
  Record<
    | "title"
    | "description"
    | "categoryId"
    | "stateId"
    | "districtId"
    | "cityId"
    | "localityId"
    | "spaceType"
    | "listingPurpose"
    | "monthlyRent"
    | "securityDeposit"
    | "areaSqft"
    | "floor"
    | "parkingSpaces"
    | "furnished"
    | "leaseTermMonths"
    | "availableFrom"
    | "businessUsage"
    | "images"
    | "form",
    string
  >
>;

export type ParsedCommercialFields = {
  title: string;
  description: string | null;
  categoryId: string | null;
  stateId: string | null;
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
  spaceType: string | null;
  listingPurpose: string | null;
  monthlyRent: number | null;
  securityDeposit: number | null;
  areaSqft: number | null;
  floor: string | null;
  parkingSpaces: number | null;
  furnished: string | null;
  leaseTermMonths: number | null;
  availableFrom: string | null;
  businessUsage: string | null;
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

function parseOptionalDate(value: string | null | undefined): string | null | "invalid" {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "invalid";
  return trimmed;
}

export function parseCommercialFormInput(input: CommercialSpaceFormInput): {
  fields: ParsedCommercialFields;
  errors: CommercialFieldErrors;
} {
  const errors: CommercialFieldErrors = {};

  const title = (input.title ?? "").trim();
  const descriptionRaw = (input.description ?? "").trim();
  const floorRaw = (input.floor ?? "").trim();
  const businessUsageRaw = (input.businessUsage ?? "").trim();

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

  const spaceType =
    input.spaceType && isSpaceType(input.spaceType) ? input.spaceType : null;
  if (input.spaceType && !spaceType) {
    errors.spaceType = "Please select a valid space type.";
  }

  const listingPurpose =
    input.listingPurpose && isListingPurpose(input.listingPurpose)
      ? input.listingPurpose
      : null;
  if (input.listingPurpose && !listingPurpose) {
    errors.listingPurpose = "Please select rent or lease.";
  }

  const furnished =
    input.furnished && isFurnishedOption(input.furnished)
      ? input.furnished
      : null;
  if (input.furnished && !furnished) {
    errors.furnished = "Please select a valid furnishing option.";
  }

  const monthlyRent = parseOptionalNumber(input.monthlyRent);
  const securityDeposit = parseOptionalNumber(input.securityDeposit);
  const areaSqft = parseOptionalNumber(input.areaSqft);
  const parkingSpaces = parseOptionalNumber(input.parkingSpaces);
  const leaseTermMonths = parseOptionalNumber(input.leaseTermMonths);
  const availableFrom = parseOptionalDate(input.availableFrom);

  if (monthlyRent === "invalid") {
    errors.monthlyRent = "Please enter a valid monthly rent.";
  } else if (monthlyRent != null && monthlyRent < 0) {
    errors.monthlyRent = "Monthly rent cannot be negative.";
  }

  if (securityDeposit === "invalid") {
    errors.securityDeposit = "Please enter a valid security deposit.";
  } else if (securityDeposit != null && securityDeposit < 0) {
    errors.securityDeposit = "Security deposit cannot be negative.";
  }

  if (areaSqft === "invalid") {
    errors.areaSqft = "Please enter a valid area.";
  } else if (areaSqft != null && areaSqft <= 0) {
    errors.areaSqft = "Area must be greater than zero.";
  }

  if (parkingSpaces === "invalid") {
    errors.parkingSpaces = "Please enter a valid parking count.";
  } else if (
    parkingSpaces != null &&
    (parkingSpaces < 0 || !Number.isInteger(parkingSpaces))
  ) {
    errors.parkingSpaces = "Parking must be a whole number of zero or more.";
  }

  if (leaseTermMonths === "invalid") {
    errors.leaseTermMonths = "Please enter a valid lease term.";
  } else if (
    leaseTermMonths != null &&
    (leaseTermMonths <= 0 || !Number.isInteger(leaseTermMonths))
  ) {
    errors.leaseTermMonths = "Lease term must be a whole number greater than zero.";
  }

  if (availableFrom === "invalid") {
    errors.availableFrom = "Please enter a valid available-from date.";
  }

  const fields: ParsedCommercialFields = {
    title,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
    categoryId,
    stateId,
    districtId,
    cityId,
    localityId,
    spaceType,
    listingPurpose,
    monthlyRent: monthlyRent === "invalid" ? null : monthlyRent,
    securityDeposit: securityDeposit === "invalid" ? null : securityDeposit,
    areaSqft: areaSqft === "invalid" ? null : areaSqft,
    floor: floorRaw.length > 0 ? floorRaw : null,
    parkingSpaces: parkingSpaces === "invalid" ? null : parkingSpaces,
    furnished,
    leaseTermMonths: leaseTermMonths === "invalid" ? null : leaseTermMonths,
    availableFrom: availableFrom === "invalid" ? null : availableFrom,
    businessUsage: businessUsageRaw.length > 0 ? businessUsageRaw : null,
  };

  return { fields, errors };
}

export function validateCommercialDraftFields(
  fields: ParsedCommercialFields,
  baseErrors: CommercialFieldErrors,
): CommercialFieldErrors {
  const errors = { ...baseErrors };
  if (!fields.title) {
    errors.title = "Please enter a title for this space.";
  }
  return errors;
}

export async function validateCommercialSubmitFields(
  fields: ParsedCommercialFields,
  baseErrors: CommercialFieldErrors,
  options?: {
    requirePrimaryImage?: boolean;
    hasPrimaryImage?: boolean;
    imageCount?: number;
  },
): Promise<CommercialFieldErrors> {
  const errors = { ...baseErrors };

  if (!fields.title) {
    errors.title = "Please enter a title for this space.";
  }

  if (!fields.description || fields.description.length < 50) {
    errors.description =
      "Please enter a description of at least 50 characters.";
  }

  if (!fields.spaceType) {
    errors.spaceType = "Please select a space type.";
  }

  if (!fields.listingPurpose) {
    errors.listingPurpose = "Please select rent or lease.";
  }

  if (!fields.categoryId) {
    errors.categoryId = "Please select a category.";
  } else {
    const categories = await fetchCommercialCategories();
    if (!categories.some((category) => category.id === fields.categoryId)) {
      errors.categoryId = "Please select a valid commercial category.";
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

  if (fields.monthlyRent == null || fields.monthlyRent <= 0) {
    errors.monthlyRent = "Please enter a monthly rent greater than zero.";
  }

  if (fields.areaSqft == null || fields.areaSqft <= 0) {
    errors.areaSqft = "Please enter an area greater than zero.";
  }

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
      errors.images = "Please upload at least one photo.";
    } else if (!options.hasPrimaryImage) {
      errors.images = "Please select a primary photo.";
    }
  }

  return errors;
}

export function hasCommercialFieldErrors(errors: CommercialFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
