"use client";

import { ChevronDown, MapPin } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { useFixedDropdownPosition } from "@/hooks/useFixedDropdownPosition";
import { BIZORA_DROPDOWN_Z } from "@/lib/ui/dropdown-layers";
import {
  loadCitiesByStateAction,
  loadLocalitiesAction,
} from "@/lib/repositories/locations.actions";
import type {
  CityOption,
  LocationOption,
} from "@/lib/repositories/locations.repository";

export type LocationSelection = {
  stateId: string | null;
  /** Kept for search URL compatibility; not shown in the UI. */
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
};

export const EMPTY_LOCATION: LocationSelection = {
  stateId: null,
  districtId: null,
  cityId: null,
  localityId: null,
};

type LocationSelectorProps = {
  states: LocationOption[];
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  initialCities?: CityOption[];
  initialLocalities?: LocationOption[];
  /** Optional classes for the closed trigger button (presentation only). */
  triggerClassName?: string;
};

type ExpandedField = "state" | "city" | "locality" | null;

const nestedLabelClass = "mb-1 block text-xs font-medium text-muted";

export function LocationSelector({
  states,
  value,
  onChange,
  initialCities = [],
  initialLocalities = [],
  triggerClassName = "",
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const [cities, setCities] = useState(initialCities);
  const [localities, setLocalities] = useState(initialLocalities);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const panelId = `${listboxId}-panel`;
  const placement = useFixedDropdownPosition(triggerRef, open);

  const stateOptions = useMemo(
    () => states.map((state) => ({ value: state.id, label: state.name })),
    [states],
  );

  const cityOptions = useMemo(
    () => cities.map((city) => ({ value: city.id, label: city.name })),
    [cities],
  );

  const localityOptions = useMemo(
    () =>
      localities.map((locality) => ({
        value: locality.id,
        label: locality.name,
      })),
    [localities],
  );

  function closePanel() {
    setExpandedField(null);
    setOpen(false);
  }

  function togglePanel() {
    setOpen((prev) => {
      if (prev) {
        setExpandedField(null);
      }
      return !prev;
    });
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      closePanel();
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, panelId]);

  function summaryLabel() {
    const stateName = states.find((item) => item.id === value.stateId)?.name;
    const cityName = cities.find((item) => item.id === value.cityId)?.name;
    const localityName = localities.find(
      (item) => item.id === value.localityId,
    )?.name;

    const parts = [localityName, cityName, stateName].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Select location";
  }

  function handleStateChange(stateId: string) {
    onChange({
      stateId: stateId || null,
      districtId: null,
      cityId: null,
      localityId: null,
    });
    setLocalities([]);

    if (!stateId) {
      setCities([]);
      return;
    }

    startTransition(async () => {
      setCities(await loadCitiesByStateAction(stateId));
    });
  }

  function handleCityChange(cityId: string) {
    onChange({
      ...value,
      districtId: null,
      cityId: cityId || null,
      localityId: null,
    });

    if (!cityId) {
      setLocalities([]);
      return;
    }

    startTransition(async () => {
      setLocalities(await loadLocalitiesAction(cityId));
    });
  }

  function handleClear() {
    onChange(EMPTY_LOCATION);
    setCities([]);
    setLocalities([]);
    closePanel();
  }

  const panel =
    open && placement && typeof document !== "undefined" ? (
      <div
        id={panelId}
        role="dialog"
        aria-label="Location selection"
        style={{
          position: "fixed",
          top: placement.top,
          left: placement.left,
          width: placement.width,
          maxHeight: placement.maxHeight,
          zIndex: BIZORA_DROPDOWN_Z,
        }}
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-lg"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4">
          {isPending && (
            <p className="mb-2 text-xs text-muted">Updating locations…</p>
          )}

          <div className="space-y-3">
            <div>
              <span className={nestedLabelClass}>Country</span>
              <div className="flex h-10 items-center rounded-lg border border-border bg-surface px-3 text-sm text-muted">
                India
              </div>
            </div>

            <ResponsiveSelect
              label="State"
              labelClassName={nestedLabelClass}
              triggerClassName="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-left text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
              value={value.stateId ?? ""}
              options={stateOptions}
              onChange={handleStateChange}
              placeholder="Select state"
              searchPlaceholder="Search state…"
              emptyOption={{ value: "", label: "Select state" }}
              searchable
              portal={false}
              open={expandedField === "state"}
              onOpenChange={(next) => setExpandedField(next ? "state" : null)}
            />

            {value.stateId ? (
              <ResponsiveSelect
                label="City"
                labelClassName={nestedLabelClass}
                triggerClassName="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-left text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
                value={value.cityId ?? ""}
                options={cityOptions}
                onChange={handleCityChange}
                placeholder="Select city"
                searchPlaceholder="Search city…"
                emptyOption={{ value: "", label: "Select city" }}
                searchable
                portal={false}
                disabled={isPending && cities.length === 0}
                open={expandedField === "city"}
                onOpenChange={(next) => setExpandedField(next ? "city" : null)}
              />
            ) : null}

            {value.cityId && localities.length > 0 ? (
              <ResponsiveSelect
                label="Locality (optional)"
                labelClassName={nestedLabelClass}
                triggerClassName="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-left text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
                value={value.localityId ?? ""}
                options={localityOptions}
                onChange={(localityId) =>
                  onChange({
                    ...value,
                    localityId: localityId || null,
                  })
                }
                placeholder="Select locality (optional)"
                searchPlaceholder="Search locality…"
                emptyOption={{
                  value: "",
                  label: "Select locality (optional)",
                }}
                searchable
                portal={false}
                open={expandedField === "locality"}
                onOpenChange={(next) =>
                  setExpandedField(next ? "locality" : null)
                }
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-white p-3">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-sm text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={closePanel}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <label className="sr-only" htmlFor={`${listboxId}-trigger`}>
        Location
      </label>
      <button
        ref={triggerRef}
        id={`${listboxId}-trigger`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={togglePanel}
        className={
          triggerClassName
            ? [
                "flex w-full min-w-0 items-center gap-2 text-left text-sm transition-colors focus:outline-none",
                triggerClassName,
              ].join(" ")
            : "flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm transition-colors hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
        }
      >
        <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span
          className={`min-w-0 flex-1 truncate ${value.stateId ? "text-foreground" : "text-muted/70"}`}
        >
          {summaryLabel()}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
