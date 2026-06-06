import type { ReactNode } from 'react';

declare module 'react' {
	interface ViewTransitionProps {
		children?: ReactNode;
		name?: string;
		enter?: string;
		exit?: string;
		update?: string;
		share?: string;
		default?: string;
	}

	export function ViewTransition(props: ViewTransitionProps): ReactNode;
}
