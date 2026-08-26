import { describe, expect, it, vi } from "vitest";
import {
  PHOTO_TOO_LARGE,
  PHOTO_TYPE_INVALID,
  PHOTO_UPLOAD_FAILED,
  PHOTO_UPLOADS_PENDING,
} from "@/lib/business-images/messages";
import {
  photosUploadStateFromItems,
  uploadListingPhotoDirect,
} from "@/lib/business-images/client-upload";
import {
  buildBusinessImageStoragePath,
  parseBusinessImageStoragePath,
} from "@/lib/business-images/storage-path";
import {
  validateBusinessImageFile,
  validateBusinessImageFileClient,
} from "@/lib/business-images/validate-file";
import {
  canSubmitWhilePhotosUpload,
  preserveListingFormFieldsAfterFailure,
} from "@/lib/business-images/form-safety";
import { MAX_BUSINESS_IMAGE_BYTES } from "@/lib/business-images/constants";

function jpegFile(name: string, size: number): File {
  const header = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const body = new Uint8Array(Math.max(0, size - header.length));
  const bytes = new Uint8Array(header.length + body.length);
  bytes.set(header, 0);
  bytes.set(body, header.length);
  return new File([bytes], name, { type: "image/jpeg" });
}

function pngFile(name: string, size = 64): File {
  const header = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const body = new Uint8Array(Math.max(0, size - header.length));
  const bytes = new Uint8Array(header.length + body.length);
  bytes.set(header, 0);
  bytes.set(body, header.length);
  return new File([bytes], name, { type: "image/png" });
}

describe("business image validation", () => {
  it("rejects oversized files client-side", () => {
    const file = jpegFile("big.jpg", MAX_BUSINESS_IMAGE_BYTES + 1);
    expect(validateBusinessImageFileClient(file)).toBe(PHOTO_TOO_LARGE);
  });

  it("rejects non-image MIME client-side", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "doc.pdf", {
      type: "application/pdf",
    });
    expect(validateBusinessImageFileClient(file)).toBe(PHOTO_TYPE_INVALID);
  });

  it("accepts JPEG under the size limit", async () => {
    const file = jpegFile("ok.jpg", 1024);
    expect(validateBusinessImageFileClient(file)).toBeNull();
    const result = await validateBusinessImageFile(file, file.type);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mime).toBe("image/jpeg");
      expect(result.extension).toBe("jpg");
    }
  });

  it("rejects files whose magic bytes are not an allowed image", async () => {
    const file = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "fake.jpg", {
      type: "image/jpeg",
    });
    const result = await validateBusinessImageFile(file, file.type);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(PHOTO_TYPE_INVALID);
  });
});

describe("storage path helpers", () => {
  const userId = "11111111-1111-1111-1111-111111111111";
  const businessId = "22222222-2222-2222-2222-222222222222";
  const imageId = "33333333-3333-3333-3333-333333333333";

  it("builds owner-scoped paths", () => {
    expect(
      buildBusinessImageStoragePath({
        userId,
        businessId,
        imageId,
        extension: "webp",
      }),
    ).toBe(`${userId}/${businessId}/${imageId}.webp`);
  });

  it("parses only matching owner/listing/image paths", () => {
    const path = `${userId}/${businessId}/${imageId}.png`;
    expect(
      parseBusinessImageStoragePath(path, { userId, businessId, imageId }),
    ).toMatchObject({ extension: "png", mime: "image/png" });

    expect(
      parseBusinessImageStoragePath(path, {
        userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        businessId,
        imageId,
      }),
    ).toBeNull();
  });
});

describe("direct client upload", () => {
  const userId = "11111111-1111-1111-1111-111111111111";
  const businessId = "22222222-2222-2222-2222-222222222222";

  function mockSupabase(uploadImpl: () => { error: { message: string } | null }) {
    return {
      storage: {
        from: () => ({
          upload: vi.fn().mockImplementation(async () => uploadImpl()),
          remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      },
    };
  }

  it("uploads successfully then registers metadata only", async () => {
    const register = vi.fn().mockResolvedValue({ ok: true, message: "Photo uploaded." });
    const supabase = mockSupabase(() => ({ error: null }));
    const file = jpegFile("shop.jpg", 2048);
    const phases: string[] = [];

    const result = await uploadListingPhotoDirect({
      // @ts-expect-error minimal mock
      supabase,
      file,
      businessId,
      userId,
      currentImageCount: 0,
      register,
      onProgress: (u) => {
        if (u.phase) phases.push(u.phase);
      },
    });

    expect(result.ok).toBe(true);
    expect(register).toHaveBeenCalledTimes(1);
    const arg = register.mock.calls[0][0];
    expect(arg.businessId).toBe(businessId);
    expect(arg.storagePath).toContain(`${userId}/${businessId}/`);
    expect(arg.mime).toBe("image/jpeg");
    expect(phases).toContain("uploading");
    expect(phases).toContain("registering");
    expect(phases).toContain("done");
  });

  it("surfaces a safe failure message when storage upload fails", async () => {
    const register = vi.fn();
    const supabase = mockSupabase(() => ({ error: { message: "network" } }));
    const result = await uploadListingPhotoDirect({
      // @ts-expect-error minimal mock
      supabase,
      file: pngFile("a.png"),
      businessId,
      userId,
      currentImageCount: 0,
      register,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(PHOTO_UPLOAD_FAILED);
    expect(register).not.toHaveBeenCalled();
  });

  it("allows retry after a failed upload by calling upload again", async () => {
    const register = vi.fn().mockResolvedValue({ ok: true });
    let attempts = 0;
    const supabase = mockSupabase(() => {
      attempts += 1;
      return attempts === 1
        ? { error: { message: "fail" } }
        : { error: null };
    });
    const file = jpegFile("retry.jpg", 512);

    const first = await uploadListingPhotoDirect({
      // @ts-expect-error minimal mock
      supabase,
      file,
      businessId,
      userId,
      currentImageCount: 0,
      register,
      localId: "local-1",
    });
    expect(first.ok).toBe(false);

    const second = await uploadListingPhotoDirect({
      // @ts-expect-error minimal mock
      supabase,
      file,
      businessId,
      userId,
      currentImageCount: 0,
      register,
      localId: "local-1",
    });
    expect(second.ok).toBe(true);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("supports multiple sequential uploads", async () => {
    const register = vi.fn().mockResolvedValue({ ok: true });
    const supabase = mockSupabase(() => ({ error: null }));

    const a = await uploadListingPhotoDirect({
      // @ts-expect-error minimal mock
      supabase,
      file: jpegFile("1.jpg", 400),
      businessId,
      userId,
      currentImageCount: 0,
      register,
    });
    const b = await uploadListingPhotoDirect({
      // @ts-expect-error minimal mock
      supabase,
      file: pngFile("2.png", 400),
      businessId,
      userId,
      currentImageCount: 1,
      register,
    });

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(register).toHaveBeenCalledTimes(2);
  });

  it("tracks pending and failed upload state for submit gating", () => {
    expect(
      photosUploadStateFromItems([
        { phase: "uploading" },
        { phase: "failed" },
      ]),
    ).toEqual({ hasPendingUploads: true, hasFailedUploads: true });

    // Removing a failed tile clears failed state for that image
    expect(
      photosUploadStateFromItems([{ phase: "uploading" }]),
    ).toEqual({ hasPendingUploads: true, hasFailedUploads: false });

    expect(canSubmitWhilePhotosUpload(true)).toEqual({
      allow: false,
      message: PHOTO_UPLOADS_PENDING,
    });
    expect(canSubmitWhilePhotosUpload(false)).toEqual({
      allow: true,
      message: null,
    });
  });
});

describe("form state preservation", () => {
  it("keeps entered listing fields after an upload failure", () => {
    const before = {
      title: "Corner cafe lease",
      monthlyRent: "85000",
      description: "High footfall",
    };
    const after = preserveListingFormFieldsAfterFailure(before, {
      ok: false,
      message: PHOTO_UPLOAD_FAILED,
    });
    expect(after).toEqual(before);
  });

  it("keeps entered listing fields after a server-action failure", () => {
    const before = {
      title: "Retail shop",
      askingPrice: "2500000",
    };
    const after = preserveListingFormFieldsAfterFailure(before, {
      ok: false,
      message:
        "We couldn't save your listing right now. Your entered information is still here — please try again.",
    });
    expect(after).toEqual(before);
  });
});
