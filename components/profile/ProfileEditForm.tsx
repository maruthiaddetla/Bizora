"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { UserRound } from "lucide-react";
import {
  removeMyAvatar,
  updateMyProfileFormAction,
  uploadMyAvatar,
  type ProfileActionResult,
} from "@/lib/profile/actions";
import {
  MAX_PROFILE_BIO_LENGTH,
  MAX_PROFILE_CITY_LENGTH,
  MAX_PROFILE_NAME_LENGTH,
  MAX_PROFILE_WEBSITE_LENGTH,
} from "@/lib/profile/constants";
import type { MyProfileView } from "@/lib/repositories/profiles.repository";
import { Button } from "@/components/ui/Button";

type ProfileEditFormProps = {
  profile: MyProfileView;
};

const initialState: ProfileActionResult | null = null;

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateMyProfileFormAction,
    initialState,
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarPending, startAvatar] = useTransition();

  function onAvatarChange(fileList: FileList | null) {
    if (!fileList?.[0]) return;
    setAvatarError(null);
    setAvatarMessage(null);
    const fd = new FormData();
    fd.set("avatar", fileList[0]);
    startAvatar(async () => {
      const result = await uploadMyAvatar(fd);
      if (!result.ok) {
        setAvatarError(result.message);
        return;
      }
      setAvatarMessage(result.message ?? "Avatar updated.");
      router.refresh();
    });
  }

  function onRemoveAvatar() {
    setAvatarError(null);
    setAvatarMessage(null);
    startAvatar(async () => {
      const result = await removeMyAvatar();
      if (!result.ok) {
        setAvatarError(result.message);
        return;
      }
      setAvatarMessage(result.message ?? "Avatar removed.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Avatar</h2>
        <p className="mt-1 text-sm text-muted">
          JPEG, PNG, or WebP up to 5 MB. Shown on your public seller profile.
        </p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-surface ring-2 ring-border">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted">
                <UserRound className="h-9 w-9" aria-hidden />
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer">
              <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface">
                {avatarPending ? "Uploading…" : "Upload photo"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={avatarPending}
                onChange={(e) => {
                  onAvatarChange(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {profile.avatarStoragePath && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={avatarPending}
                onClick={onRemoveAvatar}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        {avatarError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {avatarError}
          </p>
        )}
        {avatarMessage && !avatarError && (
          <p className="mt-3 text-sm text-accent">{avatarMessage}</p>
        )}
      </section>

      <form action={formAction} className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Profile details</h2>
        <p className="mt-1 text-sm text-muted">
          These details appear on your public seller page when you have a seller
          role. Email and role cannot be changed here.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Display name</span>
            <input
              name="displayName"
              type="text"
              maxLength={MAX_PROFILE_NAME_LENGTH}
              defaultValue={profile.displayName ?? profile.fullName ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Company name</span>
            <input
              name="companyName"
              type="text"
              maxLength={MAX_PROFILE_NAME_LENGTH}
              defaultValue={profile.companyName ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">City</span>
            <input
              name="city"
              type="text"
              maxLength={MAX_PROFILE_CITY_LENGTH}
              defaultValue={profile.city ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Website</span>
            <input
              name="website"
              type="url"
              maxLength={MAX_PROFILE_WEBSITE_LENGTH}
              placeholder="https://"
              defaultValue={profile.website ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Bio</span>
            <textarea
              name="bio"
              rows={5}
              maxLength={MAX_PROFILE_BIO_LENGTH}
              defaultValue={profile.bio ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="mt-1 block text-xs text-muted">
              Up to {MAX_PROFILE_BIO_LENGTH} characters.
            </span>
          </label>
        </div>

        {state && !state.ok && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {state.message}
          </p>
        )}
        {state?.ok && state.message && (
          <p className="mt-4 text-sm text-accent">{state.message}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" size="md" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
          {profile.role === "seller" ||
          profile.role === "broker" ||
          profile.role === "admin" ? (
            <Button
              href={`/sellers/${profile.id}`}
              variant="secondary"
              size="md"
            >
              View public profile
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
