import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { SETTINGS_TABS } from './tabs';

const PROFILE_BLOCK_HEIGHTS = ['h-33 lg:h-32', 'h-17', 'h-17', 'h-25'] as const;

export function SettingsContentSkeleton() {
	return (
		<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
			<aside className="lg:w-48 lg:sticky lg:top-20 h-fit">
				<nav className="flex lg:flex-col gap-2">
					{SETTINGS_TABS.map((tab) => (
						<Skeleton
							key={tab}
							className="h-11 w-11 lg:h-13 lg:w-full rounded-lg shrink-0"
						/>
					))}
				</nav>
			</aside>

			<div className="flex-1 min-w-0 space-y-6">
				{Array.from({ length: 2 }).map((_, card) => (
					<Card key={card}>
						<CardHeader>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-5 w-52 max-w-full" />
						</CardHeader>
						<CardContent className="flex flex-col gap-7">
							{PROFILE_BLOCK_HEIGHTS.map((height, i) => (
								<Skeleton key={i} className={`${height} w-full`} />
							))}
							<Skeleton className="h-10 w-34 -mt-1" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
