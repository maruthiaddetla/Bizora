import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseSellerProfileFields } from "@/lib/profile/parse";

describe("parseSellerProfileFields", () => {
  it("saves a new display name", () => {
    const parsed = parseSellerProfileFields({
      displayName: "  Asha Patel  ",
      companyName: "Patel Ventures",
      bio: "Seller bio",
      city: "Bengaluru",
      website: "https://example.com",
    });

    expect(parsed).toEqual({
      ok: true,
      data: {
        displayName: "Asha Patel",
        companyName: "Patel Ventures",
        bio: "Seller bio",
        city: "Bengaluru",
        website: "https://example.com/",
      },
    });
  });

  it("treats a cleared display name as an intentional null update", () => {
    const parsed = parseSellerProfileFields({
      displayName: "",
      companyName: "Patel Ventures",
      bio: "Seller bio",
      city: "Bengaluru",
      website: "https://example.com",
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.displayName).toBeNull();
    expect(parsed.data.companyName).toBe("Patel Ventures");
    expect(parsed.data.bio).toBe("Seller bio");
    expect(parsed.data.city).toBe("Bengaluru");
    expect(parsed.data.website).toBe("https://example.com/");
  });

  it("also clears whitespace-only display names to null", () => {
    const parsed = parseSellerProfileFields({
      displayName: "   ",
      companyName: null,
      bio: null,
      city: null,
      website: null,
    });

    expect(parsed).toEqual({
      ok: true,
      data: {
        displayName: null,
        companyName: null,
        bio: null,
        city: null,
        website: null,
      },
    });
  });

  it("keeps other profile fields unchanged when only display name is cleared", () => {
    const before = {
      displayName: "Old Name",
      companyName: "Keep Co",
      bio: "Keep bio",
      city: "Mumbai",
      website: "https://keep.example",
    };
    const parsed = parseSellerProfileFields({
      ...before,
      displayName: "",
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data).toEqual({
      displayName: null,
      companyName: "Keep Co",
      bio: "Keep bio",
      city: "Mumbai",
      website: "https://keep.example/",
    });
  });
});

describe("Edit Profile display name loading", () => {
  it("does not fall back to fullName when displayName is empty after reload", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/profile/ProfileEditForm.tsx"),
      "utf8",
    );
    expect(form).toContain('name="displayName"');
    expect(form).toContain("defaultValue={profile.displayName ?? \"\"}");
    expect(form).not.toContain(
      "defaultValue={profile.displayName ?? profile.fullName ?? \"\"}",
    );
  });

  it("persists null display_name via the repository update payload", () => {
    const repo = readFileSync(
      resolve(process.cwd(), "lib/repositories/profiles.repository.ts"),
      "utf8",
    );
    expect(repo).toContain("display_name: profileData.displayName");
    expect(repo).toContain("displayName: data.display_name");
  });

  it("maps fetchMyProfile displayName from profiles.display_name without full_name coalesce", () => {
    const repo = readFileSync(
      resolve(process.cwd(), "lib/repositories/profiles.repository.ts"),
      "utf8",
    );
    // Edit-profile fetch path should expose raw display_name (null stays null).
    expect(repo).toMatch(
      /export async function fetchMyProfile[\s\S]*displayName: data\.display_name/,
    );
    expect(repo).not.toMatch(
      /export async function fetchMyProfile[\s\S]*displayName: data\.display_name\s*\|\|/,
    );
  });
});
