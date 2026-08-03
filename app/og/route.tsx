import { ImageResponse } from 'next/og';
import { cacheLife } from 'next/cache';
import { reportSwallowed } from '@/lib/report';
import Title from '@/components/layout/Title';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Le wordmark garde son rapport de 8129x1792.
const WORDMARK_WIDTH = 760;
const WORDMARK_HEIGHT = Math.round((WORDMARK_WIDTH * 1792) / 8129);

/**
 * The rendered PNG bytes, or null if rendering failed. Caches the bytes rather than the
 * `ImageResponse` itself, which is a stream and cannot cross a `"use cache"` boundary — and
 * never throws across that boundary either, since a digested cache error is far harder to
 * handle than a null.
 */
async function renderOgCard(): Promise<ArrayBuffer | null> {
	'use cache';
	cacheLife('max');

	try {
		const image = new ImageResponse(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#000000',
					backgroundImage:
						'radial-gradient(circle at 50% 0%, rgba(185,9,11,0.35), rgba(0,0,0,0) 60%)',
				}}
			>
				{/* Le wordmark de l'application, pas un titre redessiné : la carte partagée
				    doit montrer la même marque que la barre de navigation. */}
				<div style={{ display: 'flex', color: '#ffffff' }}>
					<Title width={WORDMARK_WIDTH} height={WORDMARK_HEIGHT} />
				</div>
				<div
					style={{
						display: 'flex',
						width: 96,
						height: 8,
						backgroundColor: '#b9090b',
						borderRadius: 9999,
						marginTop: 24,
						marginBottom: 28,
					}}
				/>
				<div
					style={{
						display: 'flex',
						fontSize: 34,
						color: '#a3a3a3',
					}}
				>
					Track movies &amp; TV shows
				</div>
			</div>,
			{ width: OG_WIDTH, height: OG_HEIGHT }
		);

		return await image.arrayBuffer();
	} catch (error) {
		reportSwallowed('og:render', error);
		return null;
	}
}

/** Default Open Graph card for pages without a media backdrop. */
export async function GET() {
	const bytes = await renderOgCard();
	if (!bytes) return new Response(null, { status: 500 });

	return new Response(bytes, {
		headers: { 'Content-Type': 'image/png' },
	});
}
