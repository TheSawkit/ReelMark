'use client';

import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

import { BlurredPosterBackdrop } from '@/components/shared/BlurredPosterBackdrop';
import { getImageUrl } from '@/lib/tmdb/images';
import { BASE_URL } from '@/lib/metadata';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { cn } from '@/lib/utils';
import type { Playlist } from '@/types/profile';

interface PlaylistHeroProps {
	playlist: Playlist;
	ownerUsername: string | null;
	ownerAvatarUrl: string | null;
}

export function PlaylistHero({
	playlist,
	ownerUsername,
	ownerAvatarUrl,
}: PlaylistHeroProps) {
	const { t, lang } = useTranslation();
	const items = playlist.items ?? [];
	const previewItems = items.slice(0, 5);
	const backgroundPoster = items[0]?.poster_path;
	const handleShare = async () => {
		await navigator.clipboard.writeText(
			`${BASE_URL}/playlist/${playlist.id}`
		);
		toast.success(t.profile.linkCopied);
	};

	return (
		<section className="relative -mt-16 overflow-hidden min-h-[20vh] md:min-h-[50vh] flex flex-col justify-end">
			<BlurredPosterBackdrop
				posterPath={backgroundPoster}
				variant="banner"
			/>

			<div className="relative z-10 container mx-auto px-6 lg:px-12 pt-28 md:pt-32 pb-8 md:pb-14 flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-12 animate-slide-up-subtle">
				<div className="flex-1 min-w-0 space-y-4 md:space-y-5">
					<div className="flex flex-wrap gap-2">
						{ownerUsername && (
							<Link
								href={localizedHref(
									lang,
									`/profile/${ownerUsername}`
								)}
								className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-surface shadow-card-sm text-sm text-muted hover:text-text hover:bg-glass-bg-hover transition-colors"
							>
								<span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border bg-surface-3">
									{ownerAvatarUrl ? (
										<Image
											src={ownerAvatarUrl}
											alt={ownerUsername}
											fill
											sizes="20px"
											className="object-cover"
										/>
									) : (
										<span className="flex h-full w-full items-center justify-center text-[10px] font-medium transition-colors">
											{ownerUsername[0].toUpperCase()}
										</span>
									)}
								</span>
								@{ownerUsername}
							</Link>
						)}
					</div>

					<h1 className="heading-display leading-none text-3xl sm:text-4xl lg:text-6xl uppercase tracking-wide text-text">
						{playlist.name}
					</h1>

					{playlist.description && (
						<p className="text-muted text-sm md:text-lg max-w-xl leading-relaxed line-clamp-3">
							{playlist.description}
						</p>
					)}

					<div className="flex flex-wrap gap-2 md:gap-3 pt-2 md:pt-1">
						{ownerUsername && (
							<Button
								asChild
								size="sm"
								variant="outline"
								className="glass-surface text-text hover:bg-glass-bg-hover hover:text-text"
							>
								<Link
									href={localizedHref(
										lang,
										`/profile/${ownerUsername}`
									)}
								>
									{t.profile.viewProfile}
								</Link>
							</Button>
						)}
						{playlist.visibility === 'public' && (
							<Button
								size="sm"
								variant="ghost"
								onClick={handleShare}
								className="text-muted hover:text-text hover:bg-glass-bg-hover"
							>
								{t.profile.sharePlaylist}
							</Button>
						)}
					</div>
				</div>

				{previewItems.length > 0 && (
					<div
						className="group flex items-end shrink-0 max-lg:hidden"
						aria-hidden
					>
						{previewItems.map((item, i) => (
							<div
								key={item.id}
								className={cn(
									'relative w-20 lg:w-24 aspect-2/3 rounded-poster overflow-hidden shrink-0',
									'border-2 border-background shadow-card',
									'transition-transform duration-(--duration-base) ease-apple',
									'group-hover:-translate-y-2',
									i > 0 && '-ml-6'
								)}
								style={{
									zIndex: previewItems.length - i,
									transitionDelay: `${i * 30}ms`,
								}}
							>
								{item.poster_path ? (
									<Image
										src={getImageUrl(
											item.poster_path,
											'w154'
										)}
										alt={item.media_title}
										fill
										sizes="96px"
										className="object-cover"
									/>
								) : (
									<div className="w-full h-full bg-surface-3" />
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
