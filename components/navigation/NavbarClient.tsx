'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Title from '@/components/layout/Title';
import { NavbarMobile } from '@/components/navigation/NavbarMobile';
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
import { useMediaHeader } from '@/lib/media-header-store';
import type { NavbarUser } from '@/types/components';

interface NavbarTranslations {
    common: { goBack: string };
    navbar: {
        userMenu: string;
        profile: string;
        settings: string;
        login: string;
        signup: string;
    };
}

interface NavbarClientProps {
    user: NavbarUser | null;
    t: NavbarTranslations;
}

export function NavbarClient({ user, t }: NavbarClientProps) {
    const { title, scrolled } = useMediaHeader();
    const router = useRouter();
    const pathname = usePathname();
    const isMediaBarActive = scrolled && !!title;

    return (
        <header>
            <nav
                className="fixed w-full top-0 z-50 border-b border-border-subtle bg-surface/30 backdrop-blur-3xl backdrop-saturate-150 shadow-navbar"
                style={{
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingRight: 'env(safe-area-inset-right)',
                    paddingTop: 'env(safe-area-inset-top)',
                }}
            >
                <div className="mx-auto max-w-7xl px-6 lg:px-12">
                    <div className="grid grid-cols-3 h-16 items-center gap-4">
                        {user ? (
                            <div className="flex items-center md:hidden justify-start col-start-1">
                                <NavbarMobile user={user} />
                            </div>
                        ) : null}

                        <div className="flex justify-center md:justify-start col-start-2 md:col-start-1">
                            <Link
                                href="/"
                                className="font-display text-2xl font-normal text-text transform transition-transform duration-(--duration-fast) hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 flex items-center"
                            >
                                <Title className="inline-block h-[0.7em] align-baseline mr-[0.03em] text-text" />
                            </Link>
                        </div>

                        {user ? (
                            <div className="hidden md:flex gap-6 justify-center col-start-2">
                                <NavLinks orientation="horizontal" />
                            </div>
                        ) : null}

                        <div className="hidden md:flex gap-4 justify-end col-start-3">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <SearchModal key={pathname} />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon-lg"
                                                aria-label={t.navbar.userMenu}
                                                className="rounded-full overflow-hidden border-2 border-transparent data-[state=open]:border-primary transition-all duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 min-w-12"
                                            >
                                                <UserAvatar
                                                    picture={
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
                                                        user.user_metadata.email
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
                                                            user.user_metadata
                                                                .full_name}
                                                    </p>
                                                    <p className="text-xs leading-none text-muted">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {user.user_metadata.username && (
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/profile/${user.user_metadata.username}`}
                                                        className="cursor-pointer w-full flex items-center"
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        <span>
                                                            {t.navbar.profile}
                                                        </span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href="/settings"
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
                                        <Link href="/login">
                                            {t.navbar.login}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 flex items-center bg-primary hover:bg-primary-hover text-white"
                                    >
                                        <Link href="/signup">
                                            {t.navbar.signup}
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    className={cn(
                        'overflow-hidden transition-all duration-(--duration-base) ease-in-out',
                        isMediaBarActive
                            ? 'max-h-12 opacity-100'
                            : 'max-h-0 opacity-0 pointer-events-none'
                    )}
                >
                    <div className="mx-auto max-w-7xl px-6 md:px-12 h-12 flex items-center gap-2 border-t border-border/20">
                        <button
                            onClick={() => router.back()}
                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full hover:bg-surface-2/50 text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
    );
}
