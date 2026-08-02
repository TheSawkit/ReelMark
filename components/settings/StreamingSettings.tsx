'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateStreamingProviders } from '@/app/actions/recommendations';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useTranslation } from '@/lib/i18n/context';
import { getImageUrl } from '@/lib/tmdb/images';
import { cn } from '@/lib/utils';
import type { WatchProvider } from '@/types/tmdb';

interface StreamingSettingsProps {
	providers: WatchProvider[];
	initialSelected: number[];
}

/** Streaming platform picker feeding the "On your services" recommendation row. */
export function StreamingSettings({
	providers,
	initialSelected,
}: StreamingSettingsProps) {
	const { t } = useTranslation();
	const { loading, execute } = useAsyncAction();
	const [selected, setSelected] = useState<Set<number>>(
		() => new Set(initialSelected)
	);
	const [savedSnapshot, setSavedSnapshot] = useState<Set<number>>(
		() => new Set(initialSelected)
	);

	const isDirty =
		selected.size !== savedSnapshot.size ||
		[...selected].some((id) => !savedSnapshot.has(id));

	function toggle(providerId: number) {
		setSelected((previous) => {
			const next = new Set(previous);
			if (next.has(providerId)) next.delete(providerId);
			else next.add(providerId);
			return next;
		});
	}

	async function handleSave() {
		const ids = [...selected];
		const saved = await execute(async () => {
			await updateStreamingProviders(ids);
			return true;
		});
		if (saved) {
			setSavedSnapshot(new Set(ids));
			toast.success(t.settings.streaming.saved);
		} else {
			toast.error(t.common.actionError);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.settings.streaming.title}</CardTitle>
				<CardDescription>
					{t.settings.streaming.description}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				{providers.length === 0 ? (
					<p className="text-sm text-muted">
						{t.settings.streaming.empty}
					</p>
				) : (
					<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
						{providers.map((provider) => {
							const isSelected = selected.has(
								provider.provider_id
							);
							return (
								<button
									key={provider.provider_id}
									type="button"
									onClick={() => toggle(provider.provider_id)}
									aria-pressed={isSelected}
									aria-label={provider.provider_name}
									title={provider.provider_name}
									className={cn(
										'relative aspect-square rounded-xl overflow-hidden border-2 transition duration-(--duration-fast) ease-apple cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
										isSelected
											? 'border-primary shadow-control-lift'
											: 'border-transparent opacity-60 hover:opacity-100'
									)}
								>
									<Image
										src={getImageUrl(
											provider.logo_path,
											'w92'
										)}
										alt={provider.provider_name}
										fill
										unoptimized
										sizes="92px"
										className="object-cover"
									/>
									{isSelected && (
										<span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
											<Check className="h-3 w-3" />
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}

				<div className="flex items-center gap-4">
					<Button
						onClick={handleSave}
						disabled={!isDirty || loading}
						loading={loading}
					>
						{t.settings.streaming.save}
					</Button>
					<span className="text-sm text-muted tabular-nums">
						{t.settings.streaming.selectedCount.replace(
							'${count}',
							String(selected.size)
						)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
