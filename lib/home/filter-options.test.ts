import { describe, expect, it } from "vitest";
import { filterOptionsByQuery } from "@/lib/home/filter-options";

describe("filterOptionsByQuery", () => {
  const options = [
    { value: "1", label: "Andhra Pradesh" },
    { value: "2", label: "Telangana" },
    { value: "3", label: "Karnataka" },
  ];

  it("returns all options for an empty query", () => {
    expect(filterOptionsByQuery(options, "")).toEqual(options);
  });

  it("filters options case-insensitively", () => {
    expect(filterOptionsByQuery(options, "tel")).toEqual([
      { value: "2", label: "Telangana" },
    ]);
  });
});
