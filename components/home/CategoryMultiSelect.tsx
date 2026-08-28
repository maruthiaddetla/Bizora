"use client";

import { useMemo } from "react";
import { ResponsiveMultiSelect } from "@/components/ui/ResponsiveMultiSelect";
import type { CategoryOption } from "@/lib/repositories/categories.repository";

type CategoryMultiSelectProps = {
  options: CategoryOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
};

export function CategoryMultiSelect({
  options,
  selectedIds,
  onChange,
}: CategoryMultiSelectProps) {
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
