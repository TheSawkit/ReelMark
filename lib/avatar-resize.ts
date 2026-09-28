/** Longest edge kept for an uploaded avatar: it is displayed at 128 CSS px at most (256 device px). */
const AVATAR_MAX_EDGE = 512;
const AVATAR_QUALITY = 0.85;

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
	return new Promise((resolve) =>
		canvas.toBlob(resolve, type, AVATAR_QUALITY)
	);
}

/**
 * Shrinks an avatar in the browser before upload. Stored as picked, avatars weighed up to
 * 900 KB and every view downloaded them whole from Supabase Storage — the bulk of its cached
 * egress. WebP when the browser can encode it, JPEG for a JPEG source otherwise; the original
 * file whenever decoding fails or the result would not be smaller.
 */
export async function downscaleAvatar(file: File): Promise<File> {
	try {
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(
			1,
			AVATAR_MAX_EDGE / Math.max(bitmap.width, bitmap.height)
		);
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		const context = canvas.getContext('2d');
		if (!context) return file;
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();

		let blob = await encode(canvas, 'image/webp');
		if (blob?.type !== 'image/webp')
			blob =
				file.type === 'image/jpeg'
					? await encode(canvas, 'image/jpeg')
					: null;
		if (!blob || blob.size >= file.size) return file;

		const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
		const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
		return new File([blob], `${baseName}.${extension}`, {
			type: blob.type,
		});
	} catch {
		return file;
	}
}
