const DEFAULT_AVATAR_NAME = 'User';

export const buildAvatarFallbackUrl = (name?: string): string => {
  const normalizedName = (name || DEFAULT_AVATAR_NAME).trim() || DEFAULT_AVATAR_NAME;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=random`;
};

export const getSafeAvatarUrl = (rawUrl: string | undefined, name?: string): string => {
  const fallback = buildAvatarFallbackUrl(name);

  if (!rawUrl) {
    return fallback;
  }

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://armz.in';
    const resolved = new URL(rawUrl, baseOrigin);

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && resolved.protocol === 'http:') {
      return fallback;
    }

    return resolved.toString();
  } catch {
    return fallback;
  }
};