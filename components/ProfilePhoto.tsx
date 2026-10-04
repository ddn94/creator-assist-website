"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon } from "@phosphor-icons/react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { showToast } from "@/components/Toast";
import { Text } from "@/components/Text";
import { clearAvatar, setAvatarPath } from "@/lib/auth/actions";
import { avatarObjectPath } from "@/lib/auth/avatar";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;

type ProfilePhotoProps = {
  userId: string;
  name: string;
  src: string | null;
};

export function ProfilePhoto({ userId, name, src }: ProfilePhotoProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [removedSrc, setRemovedSrc] = useState<string | null>(null);
  const shown = src && src === removedSrc ? null : src;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Use an image under 2 MB.");
      return;
    }

    setPending(true);
    const path = avatarObjectPath(userId);
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "0",
      });

    if (uploadError) {
      setError(uploadError.message);
      setPending(false);
      return;
    }

    const result = await setAvatarPath(path);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    showToast("Photo updated.");
    setRemovedSrc(null);
    router.refresh();
    setPending(false);
  }

  async function onRemove() {
    setError(null);
    setPending(true);
    const result = await clearAvatar();
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setRemovedSrc(src);
    showToast("Photo removed.");
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex">
        <Avatar name={name} size="xl" src={shown} />
        <button
          type="button"
          className="absolute -right-0.5 -bottom-0.5 flex size-8 items-center justify-center rounded-full bg-primary text-on-primary ring-2 ring-background outline-none hover:bg-primary-hover disabled:opacity-60"
          aria-label={
            pending
              ? "Updating photo"
              : shown
                ? "Change profile photo"
                : "Upload profile photo"
          }
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon size={16} weight="regular" aria-hidden />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void onFile(file);
        }}
      />
      {shown ? (
        <Button
          type="button"
          variant="link"
          className="mt-2"
          disabled={pending}
          onClick={() => void onRemove()}
        >
          Remove photo
        </Button>
      ) : null}
      {error ? (
        <Text variant="caption" className="mt-2 text-danger">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
