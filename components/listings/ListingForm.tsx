"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import {
  createListingFormAction,
  updateListingFormAction,
  type ListingFormActionState,
} from "@/lib/listing-creation/actions";
import type { ListingFieldErrors } from "@/lib/listing-creation/validation";
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
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { Button } from "@/components/ui/Button";
import type { ListingFormDefaults } from "@/components/listings/ListingFormDefaults";
import { PHOTO_UPLOADS_PENDING } from "@/lib/business-images/messages";
import type {
  BusinessImageView,
  BusinessPhotosUploadState,
} from "@/lib/business-images/types";

export type { ListingFormDefaults };

type ListingFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  states: LocationOption[];
  initialCities?: CityOption[];
  defaults?: ListingFormDefaults;
  rejectionReason?: string | null;
  initialImages?: BusinessImageView[];
};

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const textareaClass =
  "min-h-32 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const initialState: ListingFormActionState = { ok: false };

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

export function ListingForm({
  mode,
  categories,
  states,
  initialCities = [],
  defaults,
  rejectionReason,
  initialImages = [],
}: ListingFormProps) {
  const action =
    mode === "create" ? createListingFormAction : updateListingFormAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [title, setTitle] = useState(defaults?.title ?? "");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [categoryId, setCategoryId] = useState(defaults?.categoryId ?? "");
  const [location, setLocation] = useState<ListingLocationValue>({
    stateId: defaults?.stateId ?? null,
    districtId: defaults?.districtId ?? null,
    cityId: defaults?.cityId ?? null,
    locality: defaults?.locality ?? "",
  });
  const [askingPrice, setAskingPrice] = useState(defaults?.askingPrice ?? "");
  const [annualRevenue, setAnnualRevenue] = useState(
    defaults?.annualRevenue ?? "",
  );
  const [annualProfit, setAnnualProfit] = useState(
    defaults?.annualProfit ?? "",
  );
  const [ebitda, setEbitda] = useState(defaults?.ebitda ?? "");
  const [establishedYear, setEstablishedYear] = useState(
    defaults?.establishedYear ?? "",
  );
  const [employees, setEmployees] = useState(defaults?.employees ?? "");
  const [reasonForSale, setReasonForSale] = useState(
    defaults?.reasonForSale ?? "",
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

  const fieldErrors: ListingFieldErrors = state.fieldErrors ?? {};
  const successMessage = state.ok ? state.message : undefined;
  const generalError = !state.ok ? state.message : undefined;
  const formBlocked = pending || photosBusy;

  const parentIds = new Set(
    categories
      .map((category) => category.parentId)
      .filter((id): id is string => Boolean(id)),
  );
  const hasHierarchy = categories.some((category) => category.parentId);
  const categoryOptions = hasHierarchy
    ? categories.filter((category) => !parentIds.has(category.id))
    : categories;

  const categorySelectOptions = useMemo(
    () =>
      categoryOptions.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categoryOptions],
  );

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
        <div
          role="status"
          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span className="font-semibold">Previously rejected: </span>
          {rejectionReason}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {successMessage}
        </div>
      )}

      {generalError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
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

      <Section
        title="Basic information"
        description="Title and category help buyers find your business."
      >
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Business title <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Established café in Indiranagar"
            aria-invalid={Boolean(fieldErrors.title)}
          />
          <FieldError message={fieldErrors.title} />
        </div>

        <ResponsiveSelect
          id="categoryId"
          name="categoryId"
          label="Category"
          required
          searchable
          value={categoryId}
          options={categorySelectOptions}
          onChange={setCategoryId}
          emptyOption={{ value: "", label: "Select category" }}
          error={fieldErrors.categoryId}
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Description <span className="text-red-600">*</span>
            <span className="ml-1 font-normal text-muted">
              (min. 50 characters to submit)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            className={textareaClass}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the business, customers, operations, and what is included in the sale."
            aria-invalid={Boolean(fieldErrors.description)}
          />
          <FieldError message={fieldErrors.description} />
        </div>
      </Section>

      <Section
        title="Location"
        description="Choose the most specific location buyers should search by."
      >
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

      <Section
        title="Financial"
        description="Enter amounts in INR as whole numbers (no ₹ or Cr suffixes)."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="askingPrice"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Asking price (INR) <span className="text-red-600">*</span>
            </label>
            <input
              id="askingPrice"
              name="askingPrice"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={askingPrice}
              onChange={(event) => setAskingPrice(event.target.value)}
              placeholder="e.g. 25000000"
              aria-invalid={Boolean(fieldErrors.askingPrice)}
            />
            <FieldError message={fieldErrors.askingPrice} />
          </div>
          <div>
            <label
              htmlFor="annualRevenue"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Annual revenue (INR)
            </label>
            <input
              id="annualRevenue"
              name="annualRevenue"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={annualRevenue}
              onChange={(event) => setAnnualRevenue(event.target.value)}
              placeholder="Optional"
              aria-invalid={Boolean(fieldErrors.annualRevenue)}
            />
            <FieldError message={fieldErrors.annualRevenue} />
          </div>
          <div>
            <label
              htmlFor="annualProfit"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Annual profit (INR)
            </label>
            <input
              id="annualProfit"
              name="annualProfit"
              type="number"
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={annualProfit}
              onChange={(event) => setAnnualProfit(event.target.value)}
              placeholder="Optional"
              aria-invalid={Boolean(fieldErrors.annualProfit)}
            />
            <FieldError message={fieldErrors.annualProfit} />
          </div>
          <div>
            <label
              htmlFor="ebitda"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              EBITDA (INR)
            </label>
            <input
              id="ebitda"
              name="ebitda"
              type="number"
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={ebitda}
              onChange={(event) => setEbitda(event.target.value)}
              placeholder="Optional"
              aria-invalid={Boolean(fieldErrors.ebitda)}
            />
            <FieldError message={fieldErrors.ebitda} />
          </div>
        </div>
      </Section>

      <Section
        title="Business information"
        description="Optional details for stronger listings."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="establishedYear"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Established year
            </label>
            <input
              id="establishedYear"
              name="establishedYear"
              type="number"
              min={1800}
              max={new Date().getFullYear()}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={establishedYear}
              onChange={(event) => setEstablishedYear(event.target.value)}
              placeholder="e.g. 2015"
              aria-invalid={Boolean(fieldErrors.establishedYear)}
            />
            <FieldError message={fieldErrors.establishedYear} />
          </div>
          <div>
            <label
              htmlFor="employees"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Employees
            </label>
            <input
              id="employees"
              name="employees"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={employees}
              onChange={(event) => setEmployees(event.target.value)}
              placeholder="Optional"
              aria-invalid={Boolean(fieldErrors.employees)}
            />
            <FieldError message={fieldErrors.employees} />
          </div>
        </div>
        <div>
          <label
            htmlFor="reasonForSale"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Reason for sale
          </label>
          <textarea
            id="reasonForSale"
            name="reasonForSale"
            className={textareaClass}
            value={reasonForSale}
            onChange={(event) => setReasonForSale(event.target.value)}
            placeholder="Optional — e.g. relocation, retirement, focus on another venture"
            aria-invalid={Boolean(fieldErrors.reasonForSale)}
          />
          <FieldError message={fieldErrors.reasonForSale} />
        </div>
      </Section>

      <Section
        title="Business Photos"
        description="Add photos that show the premises, products, or operations."
      >
        {mode === "create" || !defaults?.listingId ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-6 text-sm text-muted">
            Save a draft first to unlock photo uploads. After saving, you&apos;ll
            return to the edit page where you can add up to 8 photos and choose a
            primary image before submitting for review.
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
          title={
            mode === "create"
              ? "Save a draft and upload photos before submitting"
              : photosBusy
                ? PHOTO_UPLOADS_PENDING
                : undefined
          }
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
