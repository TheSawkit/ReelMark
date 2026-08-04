'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Title from '@/components/layout/Title';
import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { NavLinks } from '@/components/navigation/NavLinks';
import { SearchModal } from '@/components/search/SearchModal';
import { SignoutButton } from '@/components/auth/SignoutButton';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMediaHeader } from '@/lib/stores/media-header';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';
import { RealtimeUserSync } from '@/components/sync/RealtimeUserSync';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import type { NavbarUser } from '@/types/components';

interface NavbarTranslations {
	common: { goBack: string };
	navbar: {
		userMenu: string;
		myProfile: string;
		settings: string;
		login: string;
		signup: string;
		notifications: string;
	};
}

interface NavbarClientProps {
	user: NavbarUser | null;
	t: NavbarTranslations;
	initialUnreadCount: number;
	avatarUrl?: string | null;
}

export function NavbarClient({
	user,
	t,
	initialUnreadCount,
	avatarUrl,
}: NavbarClientProps) {
	const { title, scrolled } = useMediaHeader();
	const { lang } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();
	const isMedia = !!title;
	const isMediaBarActive = scrolled && isMedia;

	const logo = (
		<Link
			href={localizedHref(lang, '/')}
			className="heading-display leading-none text-2xl text-text transform transition-transform duration-(--duration-fast) hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 flex items-center"
		>
			<Title className="inline-block h-[0.7em] align-baseline mr-[0.03em] text-text" />
		</Link>
	);

	const content = (
		<>
			<header>
				<nav className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle glass-bar shadow-navbar top-nav-safe-area">
					<div className="mx-auto max-w-7xl px-6 lg:px-12">
						<div className="flex lg:hidden h-16 items-center gap-2">
							{isMedia ? (
								<div className="flex flex-1 min-w-0 items-center gap-2">
									<button
										onClick={() => router.back()}
										aria-label={t.common.goBack}
										className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full glass-surface text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
									>
										<ArrowLeft className="h-5 w-5" />
									</button>
									<span className="font-semibold text-text text-base truncate">
										{title}
									</span>
								</div>
							) : (
								<div className="flex-1 min-w-0">{logo}</div>
							)}

							<div className="shrink-0 grid items-center">
								<div
									className={cn(
										'col-start-1 row-start-1 justify-self-end flex items-center gap-1 transition-[opacity,transform,visibility] duration-(--duration-base) ease-apple',
										isMediaBarActive
											? 'invisible scale-95 opacity-0'
											: 'visible scale-100 opacity-100'
									)}
								>
									{user ? (
										<>
											<SearchModal key={pathname} />
											<NotificationBell variant="mobile" />
										</>
									) : (
										<div className="flex gap-2">
											<Button
												asChild
												variant="outline"
												size="sm"
												className="border-border text-muted hover:text-text hover:bg-surface-2 border"
											>
												<Link
													href={localizedHref(
														lang,
														'/login'
													)}
												>
													{t.navbar.login}
												</Link>
											</Button>
											<Button
												asChild
												size="sm"
												className="bg-primary hover:bg-primary-hover text-white"
											>
												<Link
													href={localizedHref(
														lang,
														'/signup'
													)}
												>
													{t.navbar.signup}
												</Link>
											</Button>
										</div>
									)}
								</div>
								<div
									id="rm-nav-actions"
									className="col-start-1 row-start-1 justify-self-end lg:hidden"
								/>
							</div>
						</div>

						{/* Desktop: full navigation */}
						<div className="grid max-lg:hidden grid-cols-3 h-16 items-center gap-4">
							<div className="flex justify-start col-start-1">
								{logo}
							</div>

							{user ? (
								<div className="flex justify-center col-start-2">
									<NavLinks
										username={user.user_metadata.username}
									/>
								</div>
							) : null}

							<div className="flex gap-4 justify-end col-start-3">
								{user ? (
									<div className="flex items-center gap-4">
										<SearchModal key={pathname} />
										<NotificationBell variant="desktop" />
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="icon-lg"
													aria-label={
														t.navbar.userMenu
													}
													className="rounded-full overflow-hidden border-2 border-transparent data-[state=open]:border-primary transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 min-w-12"
												>
													<UserAvatar
														picture={
															avatarUrl ||
															user.user_metadata
																.avatar_url ||
															user.user_metadata
																.picture
														}
														fullName={
															user.user_metadata
																.username ||
															user.user_metadata
																.full_name
														}
														email={
															user.user_metadata
																.email
														}
														size={128}
														className="select-none"
														loading="eager"
													/>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="w-56"
											>
												<DropdownMenuLabel>
													<div className="flex flex-col space-y-1">
														<p className="text-sm font-medium leading-none">
															{user.user_metadata
																.username ||
																user
																	.user_metadata
																	.full_name}
														</p>
														<p className="text-xs leading-none text-muted">
															{user.email}
														</p>
													</div>
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{user.user_metadata
													.username && (
													<DropdownMenuItem asChild>
														<Link
															href={localizedHref(
																lang,
																`/profile/${user.user_metadata.username}`
															)}
															className="cursor-pointer w-full flex items-center"
														>
															<User className="mr-2 h-4 w-4" />
															<span>
																{
																	t.navbar
																		.myProfile
																}
															</span>
														</Link>
													</DropdownMenuItem>
												)}
												<DropdownMenuItem asChild>
													<Link
														href={localizedHref(
															lang,
															'/settings'
														)}
														className="cursor-pointer w-full flex items-center"
													>
														<Settings className="mr-2 h-4 w-4" />
														<span>
															{t.navbar.settings}
														</span>
													</Link>
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem variant="destructive">
													<SignoutButton />
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								) : (
									<div className="flex gap-4">
										<Button
											asChild
											variant="outline"
											className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 border-border text-muted hover:text-text hover:bg-surface-2 border"
										>
											<Link
												href={localizedHref(
													lang,
													'/login'
												)}
											>
												{t.navbar.login}
											</Link>
										</Button>
										<Button
											asChild
											className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 flex items-center bg-primary hover:bg-primary-hover text-white"
										>
											<Link
												href={localizedHref(
													lang,
													'/signup'
												)}
											>
												{t.navbar.signup}
											</Link>
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Desktop only: media sub-bar that expands on scroll */}
					<div
						className={cn(
							'block max-lg:hidden overflow-hidden transition-[max-height,opacity] duration-(--duration-base) ease-in-out',
							isMediaBarActive
								? 'max-h-12 opacity-100'
								: 'max-h-0 opacity-0 pointer-events-none'
						)}
					>
						<div className="mx-auto max-w-7xl px-6 md:px-12 h-12 flex items-center gap-2 border-t border-border/20">
							<button
								onClick={() => router.back()}
								className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full hover:bg-surface-2/50 text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none relative before:absolute before:-inset-2 before:content-['']"
								aria-label={t.common.goBack}
							>
								<ArrowLeft className="h-4 w-4" />
							</button>
							<span className="font-semibold text-text text-sm truncate">
								{title}
							</span>
						</div>
					</div>
				</nav>
			</header>

			{user && <BottomTabBar username={user.user_metadata.username} />}
		</>
	);

	return user ? (
		<NotificationsProvider
			userId={user.id}
			initialUnreadCount={initialUnreadCount}
		>
			<RealtimeUserSync userId={user.id} />
			{content}
		</NotificationsProvider>
	) : (
		content
	);
}
