import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("sitemap and robots SEO host", () => {
  it("builds sitemap entries from getSiteUrl and omits noindex auth pages", () => {
    const source = readFileSync(resolve(process.cwd(), "app/sitemap.ts"), "utf8");

    expect(source).toContain("getSiteUrl");
    expect(source).not.toContain("/sign-in");
    expect(source).not.toContain("/sign-up");
    expect(source).toContain("/listings");
    expect(source).toContain("/resources");
    expect(source).toContain("/sell");
  });

  it("advertises the sitemap via getSiteUrl in robots.ts", () => {
    const source = readFileSync(resolve(process.cwd(), "app/robots.ts"), "utf8");

    expect(source).toContain("getSiteUrl");
    expect(source).toContain("sitemap: `${siteUrl}/sitemap.xml`");
  });

  it("uses www as the production site origin constant", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/site.ts"), "utf8");

    expect(source).toContain(
      'BIZORA_PRODUCTION_SITE_URL = "https://www.bizoraindia.com"',
    );
    expect(source).toContain("getCanonicalUrl");
  });
});
