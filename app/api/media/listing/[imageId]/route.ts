import { BUSINESS_IMAGES_BUCKET } from "@/lib/business-images/constants";
import {
  canServeListingImageViaPublicProxy,
  privateUncachedMediaCacheControl,
  publicListingMediaCacheControl,
} from "@/lib/business-images/public-media-policy";
import { isExternalImageUrl } from "@/lib/business-images/resolve-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? "application/octet-stream";
}

function notFoundResponse(): NextResponse {
  return new NextResponse("Not found", {
    status: 404,
    headers: {
      "Cache-Control": privateUncachedMediaCacheControl(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

type RouteParams = { params: Promise<{ imageId: string }> };

/**
 * Public listing image proxy — stable cache key for published listings only.
 * Buckets stay private; draft/pending/rejected/sold/leased/withdrawn are never served here.
 * Does not use the service-role client (honours Storage RLS).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { imageId } = await params;
  if (!UUID_PATTERN.test(imageId)) {
    return notFoundResponse();
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return new NextResponse("Unavailable", {
      status: 503,
      headers: {
        "Cache-Control": privateUncachedMediaCacheControl(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Join enforces the image belongs to the listed business; status gate is published-only.
  const { data: row, error } = await supabase
    .from("business_images")
    .select(
      `
      id,
      storage_path,
      image_url,
      business:businesses!inner ( status )
    `,
    )
    .eq("id", imageId)
    .maybeSingle();

  if (error || !row) {
    return notFoundResponse();
  }

  const business = row.business as
    | { status: string }
    | { status: string }[]
    | null;
  const status = Array.isArray(business)
    ? business[0]?.status
    : business?.status;

  if (!canServeListingImageViaPublicProxy(status)) {
    // Unpublished / closed / missing status — do not leak via public proxy.
    return notFoundResponse();
  }

  // External seed URL — redirect (no Storage egress). Not long-cached.
  if (isExternalImageUrl(row.image_url) && !row.storage_path) {
    return NextResponse.redirect(row.image_url, {
      status: 302,
      headers: {
        "Cache-Control": privateUncachedMediaCacheControl(),
      },
    });
  }

  const storagePath =
    row.storage_path ||
    (!isExternalImageUrl(row.image_url) ? row.image_url : null);

  if (!storagePath) {
    return notFoundResponse();
  }

  // Anon/authenticated download — RLS allows SELECT only for published listings.
  // No service-role bypass; no signed-URL redirect (would churn Next image cache keys).
  const { data: file, error: downloadError } = await supabase.storage
    .from(BUSINESS_IMAGES_BUCKET)
    .download(storagePath);

  if (downloadError || !file) {
    return notFoundResponse();
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    return notFoundResponse();
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeFromPath(storagePath),
      "Content-Length": String(buffer.byteLength),
      // Stable URL + 24h public cache; image UUID is the cache key (no seller path/token).
      "Cache-Control": publicListingMediaCacheControl(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
