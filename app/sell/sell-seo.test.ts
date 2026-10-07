import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("/sell SEO indexing", () => {
  it("is publicly crawlable and explicitly indexable", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/sell/page.tsx"),
      "utf8",
    );

    expect(source).toContain("robots:");
    expect(source).toContain("index: true");
    expect(source).toContain("follow: true");
    expect(source).not.toContain("index: false");
    expect(source).not.toContain('requireUser("/sell")');
    expect(source).toContain("getCurrentUser");
    expect(source).toContain("Sell a Business in India | List on Bizora");
    expect(source).toContain(
      "Sell your business or list a commercial space on Bizora",
    );
  });
});
