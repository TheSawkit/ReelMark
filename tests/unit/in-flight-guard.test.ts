import { describe, it, expect } from 'vitest';
import { coalesceInFlight, createInFlightGuard } from '@/lib/in-flight-guard';

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
		await expect(
			guard.run(() => Promise.reject(new Error('boom')))
		).rejects.toThrow('boom');
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

describe('coalesceInFlight', () => {
	const flush = () => new Promise((resolve) => setTimeout(resolve));

	it('answers a burst of calls with the run in flight plus one more run', async () => {
		const runs = [deferred<void>(), deferred<void>()];
		let calls = 0;
		const refresh = coalesceInFlight(() => runs[calls++]!.promise);

		const first = refresh();
		await flush();
		void refresh();
		void refresh();
		void refresh();
		expect(calls).toBe(1);

		runs[0]!.resolve();
		await flush();
		expect(calls).toBe(2);

		runs[1]!.resolve();
		await first;
		expect(calls).toBe(2);
	});

	it('lets calls made before the run starts share that run', async () => {
		let calls = 0;
		const refresh = coalesceInFlight(async () => {
			calls++;
		});

		await Promise.all([refresh(), refresh(), refresh()]);

		expect(calls).toBe(1);
	});

	it('does not rerun when nothing was asked meanwhile', async () => {
		let calls = 0;
		const refresh = coalesceInFlight(async () => {
			calls++;
		});

		await refresh();
		await refresh();

		expect(calls).toBe(2);
	});

	it('settles a caller who arrived mid-run only after a run that started after its call', async () => {
		const runs = [deferred<void>(), deferred<void>()];
		let calls = 0;
		const refresh = coalesceInFlight(() => runs[calls++]!.promise);

		void refresh();
		await flush();
		let lateCallerSettled = false;
		const late = refresh().then(() => {
			lateCallerSettled = true;
		});

		runs[0]!.resolve();
		await flush();
		expect(calls).toBe(2);
		expect(lateCallerSettled).toBe(false);

		runs[1]!.resolve();
		await late;
		expect(lateCallerSettled).toBe(true);
	});

	it('gives a call made during the rerun a run of its own', async () => {
		const runs = [deferred<void>(), deferred<void>(), deferred<void>()];
		let calls = 0;
		const refresh = coalesceInFlight(() => runs[calls++]!.promise);

		void refresh();
		await flush();
		void refresh();
		runs[0]!.resolve();
		await flush();
		expect(calls).toBe(2);

		void refresh();
		runs[1]!.resolve();
		await flush();
		expect(calls).toBe(3);
		runs[2]!.resolve();
	});

	it('accepts new calls after a run rejected', async () => {
		let calls = 0;
		const refresh = coalesceInFlight(() =>
			calls++ === 0
				? Promise.reject(new Error('boom'))
				: Promise.resolve()
		);

		await expect(refresh()).rejects.toThrow('boom');
		await expect(refresh()).resolves.toBeUndefined();
		expect(calls).toBe(2);
	});

	it('keeps working after a task that throws synchronously', async () => {
		let calls = 0;
		const refresh = coalesceInFlight(() => {
			calls++;
			if (calls === 1) throw new Error('sync');
			return Promise.resolve();
		});

		await expect(refresh()).rejects.toThrow('sync');
		await expect(refresh()).resolves.toBeUndefined();
		expect(calls).toBe(2);
	});

	it('still runs the rerun asked for while a run was failing', async () => {
		const runs = [deferred<void>(), deferred<void>()];
		let calls = 0;
		const refresh = coalesceInFlight(() => runs[calls++]!.promise);

		const pending = refresh();
		await flush();
		void refresh();
		runs[0]!.reject(new Error('boom'));
		await flush();
		expect(calls).toBe(2);

		runs[1]!.resolve();
		await expect(pending).resolves.toBeUndefined();
	});
});
