import { monotonicNowMs } from '@/lib/monotonic-now';

interface TokenBucketOptions {
	capacity: number;
	refillPerSecond: number;
	now?: () => number;
}

/** Per-process token bucket: a burst up to `capacity` goes out at once, a sustained flow is held to `refillPerSecond`. */
export function createTokenBucket({
	capacity,
	refillPerSecond,
	now = monotonicNowMs,
}: TokenBucketOptions) {
	let tokens = capacity;
	let updatedAt = now();

	return {
		/** Reserves one request and returns how many milliseconds it must wait before going out. */
		reserve(): number {
			const current = now();
			tokens = Math.min(
				capacity,
				tokens +
					(Math.max(0, current - updatedAt) / 1000) * refillPerSecond
			);
			updatedAt = current;
			tokens -= 1;
			return tokens >= 0 ? 0 : (-tokens / refillPerSecond) * 1000;
		},
		/** Gives back a reserved request that was abandoned instead of sent. */
		refund(): void {
			tokens = Math.min(capacity, tokens + 1);
		},
	};
}
