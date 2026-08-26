"use client";

import { useActionState, useCallback, useState } from "react";
import {
  createCommercialFormAction,
  updateCommercialFormAction,
  type CommercialFormActionState,
} from "@/lib/listing-creation/commercial-actions";
import type { CommercialFieldErrors } from "@/lib/listing-creation/commercial-validation";
import type { CategoryOption } from "@/lib/repositories/categories.repository";
import type {
  CityOption,
  LocationOption,
} from "@/lib/repositories/locations.repository";
import {
  ListingLocationFields,
  type ListingLocationValue,
} from "@/components/listings/ListingLocationFields";
import { BusinessPhotosManager } from "@/components/listings/BusinessPhotosManager";
import {
  FURNISHED_OPTIONS,
  LISTING_PURPOSES,
  SPACE_TYPES,
  FURNISHED_LABELS,
  LISTING_PURPOSE_LABELS,
  SPACE_TYPE_LABELS,
} from "@/lib/listing-types";
import { Button } from "@/components/ui/Button";
import type { CommercialSpaceFormDefaults } from "@/components/listings/CommercialSpaceFormDefaults";
import { PHOTO_UPLOADS_PENDING } from "@/lib/business-images/messages";
import type {
  BusinessImageView,
  BusinessPhotosUploadState,
} from "@/lib/business-images/types";

type CommercialSpaceFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  states: LocationOption[];
  initialCities?: CityOption[];
  defaults?: CommercialSpaceFormDefaults;
  rejectionReason?: string | null;
  initialImages?: BusinessImageView[];
};

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const textareaClass =
  "min-h-32 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const initialState: CommercialFormActionState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-700">{message}</p>;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function CommercialSpaceForm({
  mode,
  categories,
  states,
  initialCities = [],
  defaults,
  rejectionReason,
  initialImages = [],
}: CommercialSpaceFormProps) {
  const action =
    mode === "create" ? createCommercialFormAction : updateCommercialFormAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [title, setTitle] = useState(defaults?.title ?? "");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [categoryId, setCategoryId] = useState(defaults?.categoryId ?? "");
  const [spaceType, setSpaceType] = useState(defaults?.spaceType ?? "");
  const [listingPurpose, setListingPurpose] = useState(
    defaults?.listingPurpose ?? "",
  );
  const [location, setLocation] = useState<ListingLocationValue>({
    stateId: defaults?.stateId ?? null,
    districtId: defaults?.districtId ?? null,
    cityId: defaults?.cityId ?? null,
    locality: defaults?.locality ?? "",
  });
  const [monthlyRent, setMonthlyRent] = useState(defaults?.monthlyRent ?? "");
  const [securityDeposit, setSecurityDeposit] = useState(
    defaults?.securityDeposit ?? "",
  );
  const [areaSqft, setAreaSqft] = useState(defaults?.areaSqft ?? "");
  const [floor, setFloor] = useState(defaults?.floor ?? "");
  const [parkingSpaces, setParkingSpaces] = useState(
    defaults?.parkingSpaces ?? "",
  );
  const [furnished, setFurnished] = useState(defaults?.furnished ?? "");
  const [leaseTermMonths, setLeaseTermMonths] = useState(
    defaults?.leaseTermMonths ?? "",
  );
  const [availableFrom, setAvailableFrom] = useState(
    defaults?.availableFrom ?? "",
  );
  const [businessUsage, setBusinessUsage] = useState(
    defaults?.businessUsage ?? "",
  );
  const [photosBusy, setPhotosBusy] = useState(false);
  const [photosGuardMessage, setPhotosGuardMessage] = useState<string | null>(
    null,
  );

  const onUploadStateChange = useCallback((uploadState: BusinessPhotosUploadState) => {
    setPhotosBusy(uploadState.hasPendingUploads);
    if (!uploadState.hasPendingUploads) {
      setPhotosGuardMessage(null);
    }
  }, []);

  const fieldErrors: CommercialFieldErrors = state.fieldErrors ?? {};
  const successMessage = state.ok ? state.message : undefined;
  const generalError = !state.ok ? state.message : undefined;
  const formBlocked = pending || photosBusy;

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(event) => {
        if (photosBusy) {
          event.preventDefault();
          setPhotosGuardMessage(PHOTO_UPLOADS_PENDING);
        }
      }}
    >
      {mode === "edit" && defaults?.listingId && (
        <input type="hidden" name="listingId" value={defaults.listingId} />
      )}

      {rejectionReason && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">Previously rejected: </span>
          {rejectionReason}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {successMessage}
        </div>
      )}

      {generalError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {generalError}
        </div>
      )}

      {photosGuardMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {photosGuardMessage}
        </div>
      )}

      <Section title="Basic information">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ground-floor restaurant space in Banjara Hills"
          />
          <FieldError message={fieldErrors.title} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="spaceType" className="mb-1.5 block text-sm font-medium">
              Space type <span className="text-red-600">*</span>
            </label>
            <select
              id="spaceType"
              name="spaceType"
              className={inputClass}
              value={spaceType}
              onChange={(e) => setSpaceType(e.target.value)}
            >
              <option value="">Select type</option>
              {SPACE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SPACE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.spaceType} />
          </div>
          <div>
            <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className={inputClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.categoryId} />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            className={textareaClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the space, layout, access, and suitability for business use."
          />
          <FieldError message={fieldErrors.description} />
        </div>
      </Section>

      <Section title="Location">
        <ListingLocationFields
          states={states}
          initialCities={initialCities}
          value={location}
          onChange={setLocation}
          errors={{
            stateId: fieldErrors.stateId,
            districtId: fieldErrors.districtId,
            cityId: fieldErrors.cityId,
            locality: fieldErrors.locality,
          }}
        />
      </Section>

      <Section title="Rental details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="listingPurpose" className="mb-1.5 block text-sm font-medium">
              Listing purpose <span className="text-red-600">*</span>
            </label>
            <select
              id="listingPurpose"
              name="listingPurpose"
              className={inputClass}
              value={listingPurpose}
              onChange={(e) => setListingPurpose(e.target.value)}
            >
              <option value="">Select</option>
              {LISTING_PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {LISTING_PURPOSE_LABELS[purpose]}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.listingPurpose} />
          </div>
          <div>
            <label htmlFor="monthlyRent" className="mb-1.5 block text-sm font-medium">
              Monthly rent (INR) <span className="text-red-600">*</span>
            </label>
            <input
              id="monthlyRent"
              name="monthlyRent"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
            />
            <FieldError message={fieldErrors.monthlyRent} />
          </div>
          <div>
            <label htmlFor="securityDeposit" className="mb-1.5 block text-sm font-medium">
              Security deposit (INR)
            </label>
            <input
              id="securityDeposit"
              name="securityDeposit"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
            />
            <FieldError message={fieldErrors.securityDeposit} />
          </div>
          <div>
            <label htmlFor="leaseTermMonths" className="mb-1.5 block text-sm font-medium">
              Lease term (months)
            </label>
            <input
              id="leaseTermMonths"
              name="leaseTermMonths"
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={leaseTermMonths}
              onChange={(e) => setLeaseTermMonths(e.target.value)}
            />
            <FieldError message={fieldErrors.leaseTermMonths} />
          </div>
          <div>
            <label htmlFor="availableFrom" className="mb-1.5 block text-sm font-medium">
              Available from
            </label>
            <input
              id="availableFrom"
              name="availableFrom"
              type="date"
              className={inputClass}
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
            <FieldError message={fieldErrors.availableFrom} />
          </div>
        </div>
      </Section>

      <Section title="Property details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="areaSqft" className="mb-1.5 block text-sm font-medium">
              Area (sq.ft) <span className="text-red-600">*</span>
            </label>
            <input
              id="areaSqft"
              name="areaSqft"
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={areaSqft}
              onChange={(e) => setAreaSqft(e.target.value)}
            />
            <FieldError message={fieldErrors.areaSqft} />
          </div>
          <div>
            <label htmlFor="floor" className="mb-1.5 block text-sm font-medium">
              Floor
            </label>
            <input
              id="floor"
              name="floor"
              type="text"
              className={inputClass}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. Ground, 1, 2"
            />
            <FieldError message={fieldErrors.floor} />
          </div>
          <div>
            <label htmlFor="parkingSpaces" className="mb-1.5 block text-sm font-medium">
              Parking spaces
            </label>
            <input
              id="parkingSpaces"
              name="parkingSpaces"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={parkingSpaces}
              onChange={(e) => setParkingSpaces(e.target.value)}
            />
            <FieldError message={fieldErrors.parkingSpaces} />
          </div>
          <div>
            <label htmlFor="furnished" className="mb-1.5 block text-sm font-medium">
              Furnishing
            </label>
            <select
              id="furnished"
              name="furnished"
              className={inputClass}
              value={furnished}
              onChange={(e) => setFurnished(e.target.value)}
            >
              <option value="">Select</option>
              {FURNISHED_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {FURNISHED_LABELS[option]}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.furnished} />
          </div>
        </div>
        <div>
          <label htmlFor="businessUsage" className="mb-1.5 block text-sm font-medium">
            Business usage (optional)
          </label>
          <input
            id="businessUsage"
            name="businessUsage"
            type="text"
            className={inputClass}
            value={businessUsage}
            onChange={(e) => setBusinessUsage(e.target.value)}
            placeholder="e.g. Restaurant, retail, clinic"
          />
          <FieldError message={fieldErrors.businessUsage} />
        </div>
      </Section>

      <Section title="Photos">
        {mode === "create" || !defaults?.listingId ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-6 text-sm text-muted">
            Save a draft first to upload photos.
          </div>
        ) : (
          <>
            <BusinessPhotosManager
              businessId={defaults.listingId}
              initialImages={initialImages}
              onUploadStateChange={onUploadStateChange}
            />
            <FieldError message={fieldErrors.images} />
          </>
        )}
      </Section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="secondary"
          size="md"
          disabled={formBlocked}
        >
          {pending ? "Working…" : photosBusy ? "Uploading photos…" : "Save Draft"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="submit"
          size="md"
          disabled={formBlocked || mode === "create"}
        >
          {pending
            ? "Working…"
            : photosBusy
              ? "Uploading photos…"
              : "Submit for Review"}
        </Button>
      </div>
    </form>
  );
}
