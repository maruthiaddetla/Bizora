"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useFixedDropdownPosition } from "@/hooks/useFixedDropdownPosition";
import { BIZORA_DROPDOWN_Z } from "@/lib/ui/dropdown-layers";
import {
  filterOptionsByQuery,
  type SelectOption,
} from "@/lib/ui/select-options";

export type ResponsiveMultiSelectProps = {
  label: string;
  hideLabel?: boolean;
  options: SelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  zIndex?: number;
};

const defaultTriggerClass =
  "flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm transition-colors hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4";

export function ResponsiveMultiSelect({
  label,
  hideLabel = false,
  options,
  selectedIds,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled = false,
  className = "",
  triggerClassName,
  zIndex = BIZORA_DROPDOWN_Z,
}: ResponsiveMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const menuId = `${listboxId}-menu`;
  const placement = useFixedDropdownPosition(triggerRef, open);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedIds.includes(option.value)),
    [options, selectedIds],
  );

  const filteredOptions = useMemo(
    () => filterOptionsByQuery(options, query),
    [options, query],
  );

  const closeMenu = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightIndex(0);
  }, []);

  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      closeMenu();
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, menuId, closeMenu]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  function toggleOption(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) {
        setOpen((prev) => !prev);
      }
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (filteredOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex(
        (prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightIndex];
      if (option) {
        toggleOption(option.value);
      }
    }
  }

  const menu =
    open && placement && typeof document !== "undefined" ? (
      <div
        id={menuId}
        role="listbox"
        aria-label={label}
        aria-multiselectable="true"
        style={{
          position: "fixed",
          top: placement.top,
          left: placement.left,
          width: placement.width,
          maxHeight: placement.maxHeight,
          zIndex,
        }}
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-lg"
        onKeyDown={handleMenuKeyDown}
      >
        <div className="shrink-0 border-b border-border p-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleMenuKeyDown}
              placeholder={searchPlaceholder}
              className="h-10 w-full min-w-0 rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label={searchPlaceholder}
              autoComplete="off"
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-2">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted">
              No matches found
            </li>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selectedIds.includes(option.value);
              const isHighlighted = index === highlightIndex;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={[
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isHighlighted ? "bg-surface" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white"
                      }`}
                      aria-hidden
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 truncate text-foreground">
                      {option.label}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div
      ref={containerRef}
      className={["relative w-full min-w-0", className].filter(Boolean).join(" ")}
    >
      <label
        className={hideLabel ? "sr-only" : "mb-1.5 block text-xs font-medium text-muted"}
        htmlFor={`${listboxId}-trigger`}
      >
        {label}
      </label>
      <button
        ref={triggerRef}
        id={`${listboxId}-trigger`}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClassName ?? defaultTriggerClass}
      >
        <span
          className={`min-w-0 flex-1 truncate ${selectedIds.length ? "text-foreground" : "text-muted/70"}`}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary-light px-2.5 py-1 text-xs font-medium text-primary"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => toggleOption(option.value)}
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      {menu && typeof document !== "undefined"
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
