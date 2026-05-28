import { MAX_REVIEW_LENGTH } from '@/types/profile';

export const VALID_STATUSES = new Set<string>(['watched', 'to_watch']);
export const VALID_MEDIA_TYPES = new Set<string>(['movie', 'tv']);

export function validateRating(rating: unknown): number | null {
    if (
        typeof rating !== 'number' ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 10
    )
        return null;
    return rating;
}

const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function validateReviewContent(content: unknown): string | null {
    if (content === null || content === undefined) return null;
    if (typeof content !== 'string') return null;
    const cleaned = content.replace(CONTROL_CHARS_REGEX, '').trim();
    if (!cleaned) return null;
    if (cleaned.length > MAX_REVIEW_LENGTH) return null;
    return cleaned;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,50}$/;

const VALID_REGIONS = ['BE', 'FR', 'US', 'CA', 'GB', 'CH', 'LU'] as const;
const VALID_LANGUAGES = ['fr', 'en'] as const;
const ALLOWED_AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
const ALLOWED_AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export type Region = (typeof VALID_REGIONS)[number];
export type AppLanguage = (typeof VALID_LANGUAGES)[number];

export function sanitizeRedirectPath(
    path: string | null,
    fallback: string
): string {
    if (!path) return fallback;
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://'))
        return fallback;
    return path;
}

export function validateEmail(email: unknown): string | null {
    if (typeof email !== 'string' || !email.trim()) return null;
    if (!EMAIL_REGEX.test(email.trim())) return null;
    if (email.length > 254) return null;
    return email.trim();
}

export function validatePassword(password: unknown): string | null {
    if (typeof password !== 'string') return null;
    if (password.length < 8 || password.length > 128) return null;
    return password;
}

export function validateUsername(username: unknown): string | null {
    if (typeof username !== 'string' || !username.trim()) return null;
    if (!USERNAME_REGEX.test(username.trim())) return null;
    return username.trim();
}

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    if (!UUID_REGEX.test(value)) return null;
    return value;
}

export function validateRegion(region: unknown): Region | null {
    if (typeof region !== 'string') return null;
    const upper = region.toUpperCase() as Region;
    if (!(VALID_REGIONS as readonly string[]).includes(upper)) return null;
    return upper;
}

export function validateLanguage(language: unknown): AppLanguage {
    if (typeof language !== 'string') return 'en';
    return (VALID_LANGUAGES as readonly string[]).includes(language)
        ? (language as AppLanguage)
        : 'en';
}

export function formStr(formData: FormData, key: string): string | null {
    const v = formData.get(key);
    return typeof v === 'string' ? v || null : null;
}

type AvatarErrorCode = 'fileTooLarge' | 'invalidExtension' | 'invalidMimeType';

export function validateAvatarFile(
    file: File
): { valid: true; ext: string } | { valid: false; errorCode: AvatarErrorCode } {
    if (file.size > MAX_AVATAR_SIZE)
        return { valid: false, errorCode: 'fileTooLarge' };
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !(ALLOWED_AVATAR_EXTENSIONS as readonly string[]).includes(ext))
        return { valid: false, errorCode: 'invalidExtension' };
    if (!(ALLOWED_AVATAR_MIMES as readonly string[]).includes(file.type))
        return { valid: false, errorCode: 'invalidMimeType' };
    return { valid: true, ext };
}
