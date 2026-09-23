export function avatarPublicUrl(
  path: string | null | undefined,
  version?: string | null,
) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const url = `${base}/storage/v1/object/public/avatars/${path}`;
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

export function avatarObjectPath(userId: string) {
  return `${userId}/avatar`;
}
