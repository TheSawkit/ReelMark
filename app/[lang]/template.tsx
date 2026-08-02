'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Fades every screen in on navigation. The pathname key is what makes it replay: Next re-renders
 * a template on each route change, but React reconciles the same DOM node, and a CSS animation
 * only restarts when its element is inserted. `children` stays a Server Component subtree.
 */
export default function ScreenTemplate({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	return (
		<div key={pathname} className="screen-enter">
			{children}
		</div>
	);
}
