"use client";

import { useMemo } from "react";
import { ResponsiveMultiSelect } from "@/components/ui/ResponsiveMultiSelect";
import type { CategoryOption } from "@/lib/repositories/categories.repository";

type CategoryFilterSelectProps = {
  options: CategoryOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
};

export function CategoryFilterSelect({
  options,
  selectedIds,
  onChange,
}: CategoryFilterSelectProps) {
  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.id,
        label: option.name,
      })),
    [options],
  );

  return (
    <ResponsiveMultiSelect
      label="Business category"
      hideLabel
      options={selectOptions}
      selectedIds={selectedIds}
      onChange={onChange}
      placeholder="Business category"
      searchPlaceholder="Search categories..."
    />
  );
}
