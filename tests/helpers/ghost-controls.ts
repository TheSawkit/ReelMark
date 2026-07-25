import type { Page } from '@playwright/test';

function collect(): string[] {
	const SELECTOR =
		'button, a, input, select, textarea, [role="button"], [tabindex]';
	const effectiveOpacity = (el: Element): number => {
		let opacity = 1;
		for (let node: Element | null = el; node; node = node.parentElement) {
			opacity *= parseFloat(getComputedStyle(node).opacity || '1');
		}
		return opacity;
	};
	const describe = (el: Element): string =>
		`${el.tagName.toLowerCase()} "${(
			el.getAttribute('aria-label') ||
			el.textContent?.trim() ||
			el.getAttribute('href') ||
			''
		)
			.replace(/\s+/g, ' ')
			.slice(0, 40)}"`;

	const ghosts: string[] = [];
	for (const el of document.querySelectorAll(SELECTOR)) {
		const style = getComputedStyle(el);
		if (style.pointerEvents === 'none' || style.visibility === 'hidden')
			continue;
		const rect = el.getBoundingClientRect();
		if (rect.width * rect.height < 400) continue;
		if (effectiveOpacity(el) > 0.05) continue;
		const hit = document.elementFromPoint(
			Math.min(
				window.innerWidth - 1,
				Math.max(1, rect.x + rect.width / 2)
			),
			Math.min(
				window.innerHeight - 1,
				Math.max(1, rect.y + rect.height / 2)
			)
		);
		if (!hit || (hit !== el && !el.contains(hit))) continue;
		ghosts.push(describe(el));
	}
	return ghosts;
}

/** Lists interactive controls that are invisible yet still the tap target — on touch devices they fire actions the user cannot see. */
export async function findGhostControls(page: Page): Promise<string[]> {
	const found = new Set<string>();
	for (const ratio of [0, 0.35, 0.7, 1]) {
		await page.evaluate(
			(r) => window.scrollTo(0, document.body.scrollHeight * r),
			ratio
		);
		await page.waitForTimeout(600);
		for (const ghost of await page.evaluate(collect)) found.add(ghost);
	}
	return [...found];
}
