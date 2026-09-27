const afterLoad = () =>
	new Promise<void>((resolve) =>
		document.readyState === 'complete'
			? resolve()
			: window.addEventListener('load', () => resolve(), { once: true })
	);

const whenIdle = () =>
	new Promise<void>((resolve) =>
		'requestIdleCallback' in window
			? window.requestIdleCallback(() => resolve())
			: setTimeout(resolve)
	);

/** Resolves once the page has fully loaded and the browser is idle — for work that must never compete with the LCP. */
export function afterLoadAndIdle(): Promise<void> {
	return afterLoad().then(whenIdle);
}
