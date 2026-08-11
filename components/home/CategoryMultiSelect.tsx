"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SEARCH_CATEGORIES } from "@/lib/search-sample-data";

type CategoryMultiSelectProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function CategoryMultiSelect({
  selected,
  onChange,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_CATEGORIES;
    return SEARCH_CATEGORIES.filter((cat) => cat.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleCategory(category: string) {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  }

  function removeCategory(category: string) {
    onChange(selected.filter((c) => c !== category));
  }

  function clearAll() {
    onChange([]);
  }

  const triggerLabel =
    selected.length === 0
      ? "Business category"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <label className="sr-only" htmlFor={`${listboxId}-trigger`}>
        Business category
      </label>
      <button
        id={`${listboxId}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm transition-colors hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
      >
        <span
          className={`min-w-0 flex-1 truncate ${selected.length ? "text-foreground" : "text-muted/70"}`}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((category) => (
            <span
              key={category}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary-light px-2.5 py-1 text-xs font-medium text-primary"
            >
              <span className="truncate">{category}</span>
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Remove ${category}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Search categories"
              />
            </div>
            {selected.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-medium text-muted">
                  {selected.length} selected
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <ul
            role="listbox"
            aria-label="Business categories"
            aria-multiselectable="true"
            className="max-h-52 overflow-y-auto p-2"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted">
                No categories found
              </li>
            ) : (
              filtered.map((category) => {
                const isSelected = selected.includes(category);
                return (
                  <li key={category} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      <span className="text-foreground">{category}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <p className="border-t border-border px-3 py-2 text-xs text-muted">
            Sample categories — will be replaced by Supabase
          </p>
        </div>
      )}
    </div>
  );
}
