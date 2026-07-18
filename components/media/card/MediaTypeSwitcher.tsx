'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Film, Tv, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { useState, useTransition } from 'react';

type MediaType = 'movie' | 'tv';

interface MediaTypeSwitcherProps {
	defaultType?: MediaType;
	shallow?: boolean;
}

/** `shallow` swaps the type without a server round-trip — for pages that already hold both datasets. */
export function MediaTypeSwitcher({
	defaultType = 'movie',
	shallow = false,
}: MediaTypeSwitcherProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [requestedType, setRequestedType] = useState<MediaType | null>(null);

	const currentType = searchParams.get('type') || defaultType;
	const pendingType = isPending ? requestedType : null;
	const activeType = pendingType ?? currentType;

	const setType = (type: MediaType) => {
		if (activeType === type || isPending) return;

		const params = new URLSearchParams(searchParams.toString());
		params.set('type', type);

		if (shallow) {
			window.history.replaceState(null, '', `${pathname}?${params}`);
			return;
		}

		setRequestedType(type);
		startTransition(() => {
			router.replace(`${pathname}?${params.toString()}`, {
				scroll: false,
			});
		});
	};

	return (
		<div className="flex justify-center mb-8">
			<div
				aria-busy={isPending}
				className="relative inline-flex items-center p-1 glass-surface rounded-xl shadow-card-xs isolate"
			>
				<div
					className={cn(
						'absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg transition-transform duration-(--duration-base) ease-in-out -z-10',
						activeType === 'movie'
							? 'translate-x-0'
							: 'translate-x-full'
					)}
				/>
				{(
					[
						{ type: 'movie', icon: Film, label: t.movie.films },
						{ type: 'tv', icon: Tv, label: t.movie.series },
					] as const
				).map(({ type, icon: Icon, label }) => (
					<button
						key={type}
						onClick={() => setType(type)}
						disabled={isPending}
						className={cn(
							'flex flex-1 justify-center items-center gap-2 min-h-11 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-(--duration-base) disabled:cursor-not-allowed',
							activeType === type
								? 'text-white shadow-cinema'
								: 'text-muted hover:text-text'
						)}
					>
						{pendingType === type ? (
							<Loader2
								className="w-4 h-4 animate-spin"
								aria-hidden="true"
							/>
						) : (
							<Icon className="w-4 h-4" aria-hidden="true" />
						)}
						{label}
					</button>
				))}
			</div>
		</div>
	);
}
