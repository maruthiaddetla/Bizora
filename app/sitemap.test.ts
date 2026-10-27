import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

type BusinessRow = {
  id: string;
  updated_at: string;
  seller_id: string | null;
  status: string;
};

/**
 * Chainable mock that applies `.eq("status", …)` filtering like PostgREST,
 * so mixed-status seed data only returns published rows after the sitemap query.
 */
function mockBusinessesQuery(options: {
  rows?: BusinessRow[];
  error?: { message: string } | null;
}) {
  const { rows = [], error = null } = options;
  let filtered = [...rows];

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: string) => {
      if (column === "status") {
        filtered = filtered.filter((row) => row.status === value);
      }
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(async () => {
      if (error) {
        return { data: null, error };
      }
      return {
        data: filtered.map(({ id, updated_at, seller_id }) => ({
          id,
          updated_at,
          seller_id,
        })),
        error: null,
      };
    }),
  };

  createSupabaseServerClient.mockResolvedValue({
    from: vi.fn((table: string) => {
      expect(table).toBe("businesses");
      return builder;
    }),
  });

  return builder;
}

describe("sitemap listing entries", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseServerClient.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.bizoraindia.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes only published listings with www URLs and updated_at lastmod", async () => {
    const publishedA = {
      id: "11111111-1111-4111-8111-111111111111",
      updated_at: "2026-10-01T10:00:00.000Z",
      seller_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      status: "published",
    };
    const publishedB = {
      id: "22222222-2222-4222-8222-222222222222",
      updated_at: "2026-10-02T12:30:00.000Z",
      seller_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      status: "published",
    };
    const builder = mockBusinessesQuery({
      rows: [
        publishedA,
        {
          id: "33333333-3333-4333-8333-333333333333",
          updated_at: "2026-10-03T00:00:00.000Z",
          seller_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          status: "draft",
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          updated_at: "2026-10-03T01:00:00.000Z",
          seller_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          status: "pending",
        },
        {
          id: "55555555-5555-4555-8555-555555555555",
          updated_at: "2026-10-03T02:00:00.000Z",
          seller_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          status: "rejected",
        },
        {
          id: "66666666-6666-4666-8666-666666666666",
          updated_at: "2026-10-03T03:00:00.000Z",
          seller_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          status: "sold",
        },
        {
          id: "77777777-7777-4777-8777-777777777777",
          updated_at: "2026-10-03T04:00:00.000Z",
          seller_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "leased",
        },
        {
          id: "88888888-8888-4888-8888-888888888888",
          updated_at: "2026-10-03T05:00:00.000Z",
          seller_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          status: "withdrawn",
        },
        publishedB,
      ],
    });

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(builder.eq).toHaveBeenCalledWith("status", "published");

    const listingUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.includes("/listings/"));

    expect(listingUrls).toEqual([
      "https://www.bizoraindia.com/listings/11111111-1111-4111-8111-111111111111",
      "https://www.bizoraindia.com/listings/22222222-2222-4222-8222-222222222222",
    ]);

    const byUrl = new Map(entries.map((entry) => [entry.url, entry]));
    expect(
      byUrl.get(
        "https://www.bizoraindia.com/listings/11111111-1111-4111-8111-111111111111",
      )?.lastModified,
    ).toEqual(new Date(publishedA.updated_at));
    expect(
      byUrl.get(
        "https://www.bizoraindia.com/listings/22222222-2222-4222-8222-222222222222",
      )?.lastModified,
    ).toEqual(new Date(publishedB.updated_at));

    for (const status of [
      "draft",
      "pending",
      "rejected",
      "sold",
      "leased",
      "withdrawn",
    ]) {
      expect(
        listingUrls.some((url) => url.includes(status)),
      ).toBe(false);
    }
  });

  it("returns static entries only when the businesses query is empty", async () => {
    mockBusinessesQuery({ rows: [] });

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(entries.some((entry) => entry.url.includes("/listings/"))).toBe(
      false,
    );
    expect(
      entries.some(
        (entry) => entry.url === "https://www.bizoraindia.com/listings",
      ),
    ).toBe(true);
    expect(
      entries.some((entry) => entry.url === "https://www.bizoraindia.com/"),
    ).toBe(true);
  });

  it("returns static entries only when the businesses query errors", async () => {
    mockBusinessesQuery({
      error: { message: "permission denied for table businesses" },
    });

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(entries.some((entry) => /\/listings\/[0-9a-f-]{36}/i.test(entry.url))).toBe(
      false,
    );
    expect(
      entries.some(
        (entry) => entry.url === "https://www.bizoraindia.com/listings",
      ),
    ).toBe(true);
  });

  it("returns static entries only when Supabase is not configured", async () => {
    createSupabaseServerClient.mockResolvedValue(null);

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    expect(entries.some((entry) => /\/listings\/[0-9a-f-]{36}/i.test(entry.url))).toBe(
      false,
    );
    expect(
      entries.some(
        (entry) => entry.url === "https://www.bizoraindia.com/",
      ),
    ).toBe(true);
  });
});
