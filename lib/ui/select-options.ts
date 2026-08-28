export type SelectOption = {
  value: string;
  label: string;
};

export function filterOptionsByQuery(
  options: SelectOption[],
  query: string,
): SelectOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((option) =>
    option.label.toLowerCase().includes(normalized),
  );
}
