'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { MediaTrailersProps } from '@/types/components';

export function MediaTrailers({ trailers }: MediaTrailersProps) {
	const { t } = useTranslation();
	const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set());

	const handleIframeError = useCallback((key: string) => {
		setFailedKeys((prev) => new Set(prev).add(key));
	}, []);

	const visibleTrailers = trailers.filter(
		(trailer) => !failedKeys.has(trailer.key)
	);

	if (visibleTrailers.length === 0) return null;

	return (
		<section className="space-y-6">
			<SectionHeading>{t.movie.trailers}</SectionHeading>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{visibleTrailers.slice(0, 3).map((trailer) => (
					<TrailerEmbed
						key={trailer.id}
						videoKey={trailer.key}
						title={trailer.name}
						site={trailer.site}
						onError={handleIframeError}
						unsupportedLabel={t.movie.unsupportedFormat}
					/>
				))}
			</div>
		</section>
	);
}

function TrailerEmbed({
	videoKey,
	title,
	site,
	onError,
	unsupportedLabel,
}: {
	videoKey: string;
	title: string;
	site: string;
	onError: (key: string) => void;
	unsupportedLabel: string;
}) {
	const [isPlaying, setIsPlaying] = useState(false);

	if (site !== 'YouTube') {
		return (
			<div className="relative aspect-video glass-overlay rounded-xl overflow-hidden shadow-card">
				<div className="w-full h-full flex items-center justify-center bg-transparent text-muted">
					<p className="text-sm font-medium">{unsupportedLabel}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative aspect-video glass-overlay rounded-xl overflow-hidden shadow-card transition-all duration-(--duration-base) hover:shadow-glow-gold hover:border-gold/30 hover:border-t-gold/50">
			{isPlaying ? (
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${videoKey}?rel=0&modestbranding=1&autoplay=1`}
					title={title}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="w-full h-full"
					onError={() => onError(videoKey)}
				/>
			) : (
				<button
					type="button"
					onClick={() => setIsPlaying(true)}
					aria-label={title}
					className="group/trailer relative block w-full h-full cursor-pointer"
				>
					<Image
						src={`https://i.ytimg.com/vi/${videoKey}/hqdefault.jpg`}
						alt={title}
						fill
						unoptimized
						className="object-cover transition-transform duration-(--duration-base) group-hover/trailer:scale-105"
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
					/>
					<span className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
					<span className="absolute inset-0 flex items-center justify-center">
						<span className="flex h-14 w-14 items-center justify-center rounded-full bg-poster-overlay backdrop-blur-md border border-white/10 shadow-card-sm transition-all duration-(--duration-base) group-hover/trailer:scale-110 group-hover/trailer:bg-primary">
							<Play
								className="h-6 w-6 fill-current text-white"
								aria-hidden="true"
							/>
						</span>
					</span>
				</button>
			)}
		</div>
	);
}
