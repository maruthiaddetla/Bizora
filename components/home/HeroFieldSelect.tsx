"use client";

import { ResponsiveSelect, type SelectOption } from "@/components/ui/ResponsiveSelect";
import type { ReactNode } from "react";

export type HeroFieldSelectOption = SelectOption;

type HeroFieldSelectProps = {
  id?: string;
  label: string;
  value: string;
  options: HeroFieldSelectOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  className?: string;
  searchable?: boolean;
};

/** Compact single-select for homepage search Category / Budget fields. */
export function HeroFieldSelect({
  id,
  label,
  value,
  options,
  onChange,
  icon,
  className = "",
  searchable = false,
}: HeroFieldSelectProps) {
  return (
    <ResponsiveSelect
      id={id}
      label={label}
      hideLabel
      value={value}
      options={options}
      onChange={onChange}
      searchable={searchable}
      portal
      className={className}
      icon={icon}
      triggerClassName="relative flex h-9 w-full min-w-0 items-center gap-2 rounded-md border-0 bg-transparent text-left text-sm font-medium text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    />
  );
}
