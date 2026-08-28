"use client";

import { ChevronDown, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useFixedDropdownPosition } from "@/hooks/useFixedDropdownPosition";
import { BIZORA_DROPDOWN_Z } from "@/lib/ui/dropdown-layers";
import {
  filterOptionsByQuery,
  type SelectOption,
} from "@/lib/ui/select-options";

export type { SelectOption };

const defaultTriggerClass =
  "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-left text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

const optionClass = (selected: boolean) =>
  [
    "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
    selected
      ? "bg-primary-light font-medium text-primary"
      : "text-navy hover:bg-primary-light/70 hover:text-primary",
  ].join(" ");

export type ResponsiveSelectProps = {
  id?: string;
  name?: string;
  label: string;
  labelClassName?: string;
  hideLabel?: boolean;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  emptyOption?: SelectOption;
  className?: string;
  triggerClassName?: string;
  icon?: ReactNode;
  /** Portals the menu to document.body with viewport-aware fixed positioning. */
  portal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  menuClassName?: string;
  zIndex?: number;
};

export function ResponsiveSelect({
  id,
  name,
  label,
  labelClassName = "mb-1.5 block text-sm font-medium text-foreground",
  hideLabel = false,
  value,
  options,
  onChange,
  placeholder = "Select…",
  searchable = false,
  searchPlaceholder,
  disabled = false,
  required = false,
  error,
  emptyOption,
  className = "",
  triggerClassName,
  icon,
  portal = true,
  open: controlledOpen,
  onOpenChange,
  menuClassName = "",
  zIndex = BIZORA_DROPDOWN_Z,
}: ResponsiveSelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const triggerId = id ?? `${listboxId}-trigger`;
  const menuId = `${listboxId}-menu`;

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const placement = useFixedDropdownPosition(triggerRef, open && portal);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    return filterOptionsByQuery(options, query);
  }, [options, query, searchable]);

  const menuOptions = useMemo(() => {
    if (!emptyOption) return filteredOptions;
    return [emptyOption, ...filteredOptions];
  }, [emptyOption, filteredOptions]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        const selectedIndex = menuOptions.findIndex(
          (option) => option.value === value,
        );
        setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        setQuery("");
        setHighlightIndex(0);
      }
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, menuOptions, onOpenChange, value],
  );

  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    emptyOption?.label ??
    placeholder;

  const resolvedSearchPlaceholder =
    searchPlaceholder ?? `Search ${label.toLowerCase()}…`;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, menuId, setOpen]);

  useEffect(() => {
    if (open && searchable) {
      searchInputRef.current?.focus();
    }
  }, [open, searchable]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) {
        setOpen(!open);
      }
      return;
    }
    if (event.key === "ArrowDown" && !open && !disabled) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (menuOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % menuOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex(
        (prev) => (prev - 1 + menuOptions.length) % menuOptions.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = menuOptions[highlightIndex];
      if (option) {
        handleSelect(option.value);
      }
    }
  }

  const menuContent = (
    <>
      {searchable ? (
        <div className="shrink-0 border-b border-border p-2">
          <label className="sr-only" htmlFor={`${listboxId}-search`}>
            {resolvedSearchPlaceholder}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              id={`${listboxId}-search`}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleMenuKeyDown}
              placeholder={resolvedSearchPlaceholder}
              className="h-9 w-full min-w-0 rounded-md border border-border bg-white pl-8 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="off"
            />
          </div>
        </div>
      ) : null}
      <ul
        role="listbox"
        aria-labelledby={`${listboxId}-label`}
        className={[
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-1",
          portal ? "" : "max-h-[min(11rem,35vh)]",
        ]
          .filter(Boolean)
          .join(" ")}
        onKeyDown={searchable ? undefined : handleMenuKeyDown}
        tabIndex={searchable ? undefined : -1}
      >
        {menuOptions.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted">No matches found.</li>
        ) : (
          menuOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightIndex;
            return (
              <li key={`${option.value}-${option.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={[
                    optionClass(isSelected),
                    isHighlighted && !isSelected ? "bg-surface" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </>
  );

  const inlineMenu =
    open && !portal ? (
      <div
        id={menuId}
        className={[
          "mt-1 overflow-hidden rounded-lg border border-border bg-white shadow-sm",
          menuClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {menuContent}
      </div>
    ) : null;

  const portaledMenu =
    open && portal && placement && typeof document !== "undefined" ? (
      <div
        id={menuId}
        style={{
          position: "fixed",
          top: placement.top,
          left: placement.left,
          width: placement.width,
          maxHeight: placement.maxHeight,
          zIndex,
        }}
        className={[
          "flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lg shadow-navy/10",
          menuClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        onKeyDown={handleMenuKeyDown}
      >
        {menuContent}
      </div>
    ) : null;

  return (
    <div
      ref={containerRef}
      className={["relative min-w-0", className].filter(Boolean).join(" ")}
    >
      {name ? (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      ) : null}

      <label
        id={`${listboxId}-label`}
        htmlFor={triggerId}
        className={hideLabel ? "sr-only" : labelClassName}
      >
        {label}
        {required && !hideLabel ? (
          <span className="text-red-600"> *</span>
        ) : null}
      </label>

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-labelledby={`${listboxId}-label ${triggerId}`}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span
          className={[
            "min-w-0 flex-1 truncate",
            value || emptyOption?.value === value ? "" : "text-muted/70",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {inlineMenu}
      {portaledMenu && typeof document !== "undefined"
        ? createPortal(portaledMenu, document.body)
        : null}

      {error ? (
        <p id={`${listboxId}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
