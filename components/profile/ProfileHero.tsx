'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { siInstagram, siLetterboxd } from 'simple-icons';
import { Button } from '@/components/ui/button';
import { Aurora } from '@/components/effects/Aurora';
import { Spotlight } from '@/components/effects/Spotlight';
import { Grain } from '@/components/effects/Grain';
import type { UserProfile } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';

interface IconProps {
	className?: string;
}
function TikTokIcon({ className }: IconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.52V6.74a4.85 4.85 0 01-1.02-.05z" />
		</svg>
	);
}

function LetterboxdIcon({ className }: IconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			width="1em"
			height="1em"
		>
			<path d={siLetterboxd.path} />
		</svg>
	);
}

function InstagramIcon({ className }: IconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			width="1em"
			height="1em"
		>
			<path d={siInstagram.path} />
		</svg>
	);
}

function XIcon({ className }: IconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

interface ProfileHeroProps {
	profile: UserProfile;
	avatarUrl?: string;
	fullName?: string;
	isOwnProfile: boolean;
	friendshipButton?: React.ReactNode;
	optionsMenu?: React.ReactNode;
}

export function ProfileHero({
	profile,
	avatarUrl,
	fullName,
	isOwnProfile,
	friendshipButton,
	optionsMenu,
}: ProfileHeroProps) {
	const { t, lang } = useTranslation();
	const displayName = fullName || profile.username;
	const initials = displayName.slice(0, 2).toUpperCase();

	const socialLinks = [
		profile.instagram && {
			href: `https://instagram.com/${profile.instagram}`,
			icon: <InstagramIcon className="h-4 w-4" />,
			label: 'Instagram',
		},
		profile.tiktok && {
			href: `https://tiktok.com/@${profile.tiktok}`,
			icon: <TikTokIcon className="h-4 w-4" />,
			label: 'TikTok',
		},
		profile.letterboxd && {
			href: `https://letterboxd.com/${profile.letterboxd}`,
			icon: <LetterboxdIcon className="h-4 w-4" />,
			label: 'Letterboxd',
		},
		profile.twitter && {
			href: `https://x.com/${profile.twitter}`,
			icon: <XIcon className="h-4 w-4" />,
			label: 'X / Twitter',
		},
		profile.website &&
			/^https?:\/\//.test(profile.website) && {
				href: profile.website,
				icon: <Globe className="h-4 w-4" />,
				label: 'Website',
			},
	].filter(Boolean) as Array<{
		href: string;
		icon: React.ReactNode;
		label: string;
	}>;

	return (
		<div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-surface">
			<div className="relative h-28 overflow-hidden sm:h-36">
				<div className="absolute inset-0 bg-linear-to-br from-primary/25 via-surface-2 to-surface" />
				<Aurora intensity={0.6} />
				<Spotlight />
				<Grain opacity={0.06} />
				<div className="absolute inset-0 bg-linear-to-t from-surface via-surface/20 to-transparent" />
			</div>

			<div className="relative px-5 pb-6 sm:px-7">
				<div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
					<div className="shrink-0">
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={`${displayName} — ${t.common.userAvatar}`}
								width={96}
								height={96}
								className="h-24 w-24 rounded-full border-4 border-surface object-cover shadow-card"
								unoptimized
							/>
						) : (
							<div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-surface-2 shadow-card">
								<span className="text-2xl font-bold text-muted">
									{initials}
								</span>
							</div>
						)}
					</div>

					<div className="min-w-0 flex-1 sm:pb-1">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="truncate text-2xl font-bold text-text">
								{displayName}
							</h1>
							{fullName && fullName !== profile.username && (
								<span className="text-sm text-muted">
									@{profile.username}
								</span>
							)}
							{optionsMenu}
						</div>
					</div>

					<div className="flex flex-wrap gap-2 sm:pb-1">
						{isOwnProfile ? (
							<Button variant="outline" size="sm" asChild>
								<Link href={localizedHref(lang, '/settings')}>
									{t.profile.editProfile}
								</Link>
							</Button>
						) : (
							friendshipButton
						)}
					</div>
				</div>

				{profile.bio && (
					<p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
						{profile.bio}
					</p>
				)}

				{socialLinks.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{socialLinks.map((link) => (
							<a
								key={link.label}
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={link.label}
								className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-text"
							>
								{link.icon}
								<span>{link.label}</span>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
