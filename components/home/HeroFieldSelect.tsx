"use client";

import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type HeroFieldSelectOption = {
  value: string;
  label: string;
};

type HeroFieldSelectProps = {
  id?: string;
  label: string;
  value: string;
  options: HeroFieldSelectOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  className?: string;
};

/**
 * Compact single-select for homepage search Category / Budget fields.
 * Custom menu (not native select) so option padding, hover, and selected
 * styles match Bizora tokens and sit flush under the field.
 */
export function HeroFieldSelect({
  id,
  label,
  value,
  options,
  onChange,
  icon,
  className = "",
}: HeroFieldSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const triggerId = id ?? `${listboxId}-trigger`;

  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label ?? options[0]?.label ?? "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={["relative min-w-0 flex-1", className].filter(Boolean).join(" ")}
    >
      <label className="sr-only" htmlFor={triggerId}>
        {label}
      </label>
      <button
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${listboxId}-list`}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border-0 bg-transparent text-left text-sm font-medium text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        {icon}
        <span className="min-w-0 flex-1 truncate pr-5">{displayLabel}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={`${listboxId}-list`}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-[60] mt-1.5 max-h-[min(16rem,50vh)] overflow-y-auto rounded-lg border border-border bg-white py-1.5 shadow-lg shadow-navy/10"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={[
                    // 16px horizontal padding — aligns with field text inset
                    "flex w-full items-center px-4 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary-light font-medium text-primary"
                      : "text-navy hover:bg-primary-light/70 hover:text-primary",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
