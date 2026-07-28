import { describe, it, expect } from 'vitest';
import { createInFlightGuard } from '@/lib/in-flight-guard';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('createInFlightGuard', () => {
	it('runs the action and returns its value', async () => {
		const guard = createInFlightGuard();
		await expect(guard.run(() => 'done')).resolves.toBe('done');
	});

	it('drops a call made while another is still running', async () => {
		const guard = createInFlightGuard();
		const first = deferred<string>();
		let calls = 0;

		const running = guard.run(() => {
			calls++;
			return first.promise;
		});
		const dropped = await guard.run(() => {
			calls++;
			return Promise.resolve('second');
		});

		expect(dropped).toBeUndefined();
		expect(calls).toBe(1);

		first.resolve('first');
		await expect(running).resolves.toBe('first');
	});

	it('marks itself busy synchronously, before the action awaits', () => {
		const guard = createInFlightGuard();
		const pending = deferred<void>();

		expect(guard.busy).toBe(false);
		void guard.run(() => pending.promise);
		expect(guard.busy).toBe(true);

		pending.resolve();
	});

	it('accepts a new call once the previous one settled', async () => {
		const guard = createInFlightGuard();
		await guard.run(() => 'first');
		await expect(guard.run(() => 'second')).resolves.toBe('second');
	});

	it('releases the guard when the action throws', async () => {
		const guard = createInFlightGuard();
		await expect(guard.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
		expect(guard.busy).toBe(false);
		await expect(guard.run(() => 'recovered')).resolves.toBe('recovered');
	});

	it('keeps a burst of clicks down to a single execution', async () => {
		const guard = createInFlightGuard();
		const pending = deferred<void>();
		let calls = 0;

		const runOnce = () =>
			guard.run(() => {
				calls++;
				return pending.promise;
			});

		const first = runOnce();
		const second = runOnce();
		const third = runOnce();
		pending.resolve();

		expect(await second).toBeUndefined();
		expect(await third).toBeUndefined();
		await first;
		expect(calls).toBe(1);
	});
});
