import { describe, it, expect } from 'vitest';
import { createTokenBucket } from '@/lib/tmdb/rate-limit';

function clock(start = 0) {
	let now = start;
	return { now: () => now, advance: (ms: number) => (now += ms) };
}

describe('createTokenBucket', () => {
	it('lets a burst up to capacity through without waiting', () => {
		const time = clock();
		const bucket = createTokenBucket({
			capacity: 3,
			refillPerSecond: 1,
			now: time.now,
		});
		expect([bucket.reserve(), bucket.reserve(), bucket.reserve()]).toEqual([
			0, 0, 0,
		]);
	});

	it('spaces requests beyond the burst at the refill rate', () => {
		const time = clock();
		const bucket = createTokenBucket({
			capacity: 2,
			refillPerSecond: 10,
			now: time.now,
		});
		bucket.reserve();
		bucket.reserve();
		expect(bucket.reserve()).toBe(100);
		expect(bucket.reserve()).toBe(200);
	});

	it('refills over time, never above capacity', () => {
		const time = clock();
		const bucket = createTokenBucket({
			capacity: 2,
			refillPerSecond: 10,
			now: time.now,
		});
		bucket.reserve();
		bucket.reserve();
		time.advance(60_000);
		expect([bucket.reserve(), bucket.reserve(), bucket.reserve()]).toEqual([
			0, 0, 100,
		]);
	});

	it('gives an abandoned reservation back', () => {
		const time = clock();
		const bucket = createTokenBucket({
			capacity: 1,
			refillPerSecond: 10,
			now: time.now,
		});
		bucket.reserve();
		expect(bucket.reserve()).toBe(100);
		bucket.refund();
		expect(bucket.reserve()).toBe(100);
	});

	it('does not drain when the clock steps back (Date.now fallback)', () => {
		const time = clock(10_000);
		const bucket = createTokenBucket({
			capacity: 2,
			refillPerSecond: 10,
			now: time.now,
		});
		time.advance(-5_000);
		expect([bucket.reserve(), bucket.reserve()]).toEqual([0, 0]);
	});
});
