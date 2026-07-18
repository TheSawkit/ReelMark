import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

/** Default Open Graph card for pages without a media backdrop. */
export async function GET() {
	return new ImageResponse(
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
			<div
				style={{
					display: 'flex',
					fontSize: 148,
					fontWeight: 700,
					letterSpacing: -6,
				}}
			>
				<span style={{ color: '#ffffff' }}>Reel</span>
				<span style={{ color: '#b9090b' }}>Mark</span>
			</div>
			<div
				style={{
					display: 'flex',
					width: 96,
					height: 8,
					backgroundColor: '#b9090b',
					borderRadius: 9999,
					marginTop: 8,
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
		{ width: 1200, height: 630 }
	);
}
