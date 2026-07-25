/**
 * Milliseconds from a monotonic clock, safe inside prerenders where Next forbids
 * wall-clock reads (`Date.now()` aborts a Cache Components shell generation).
 * Only meaningful for measuring durations — never for dates.
 */
export function monotonicNowMs(): number {
	if (
		typeof process !== 'undefined' &&
		typeof process.hrtime?.bigint === 'function'
	) {
		return Number(process.hrtime.bigint() / BigInt(1_000_000));
	}
	return Date.now();
}
