"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings, Menu, X } from "lucide-react"
import { SignoutButton } from "@/components/auth/SignoutButton"
import { NavLinks } from "@/components/navigation/NavLinks"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { SearchBar } from "@/components/search/SearchBar"
import { useTranslation } from "@/lib/i18n/context"
import type { NavbarMobileProps } from "@/types/components"

export function NavbarMobile({ user }: NavbarMobileProps) {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)

    const toggleMenu = () => setIsOpen(!isOpen)
    const closeMenu = () => setIsOpen(false)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    const menuContent = isOpen && (
        <>
            <div
                className="fixed inset-0 z-50 bg-surface/50 backdrop-blur-xs md:hidden cursor-pointer"
                style={{ animation: "backdropBlur var(--duration-base) ease-out" }}
                onClick={closeMenu}
            />

            <div
                className="fixed inset-y-0 left-0 z-50 w-80 bg-surface border-r border-border shadow-navbar overflow-y-auto md:hidden"
                style={{ animation: "slideInFromLeft var(--duration-base) ease-out" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeMenu}
                                aria-label={t.navbar.mobile.closeMenu}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <UserAvatar
                                picture={user.user_metadata.avatar_url || user.user_metadata.picture}
                                fullName={user.user_metadata.username || user.user_metadata.full_name}
                                email={user.user_metadata.email}
                                size={64}
                                className="rounded-full object-cover"
                            />
                            <div>
                                <p className="text-sm font-medium text-text">
                                    {user.user_metadata.username || user.user_metadata.full_name || t.common.user}
                                </p>
                                <p className="text-xs text-muted">{user.user_metadata.email || ""}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                onClick={closeMenu}
                            >
                                <Settings className="h-4 w-4" />
                                <span>{t.navbar.settings}</span>
                            </Link>
                            <div className="px-4">
                                <SignoutButton />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-4 flex flex-col gap-4">
                        <SearchBar variant="compact" onNavigate={closeMenu} />
                        <NavLinks onLinkClick={closeMenu} />
                    </div>
                </div>
            </div>
        </>
    )

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="md:hidden"
                aria-label={t.navbar.mobile.toggleMenu}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {typeof window !== "undefined" && isOpen && createPortal(menuContent, document.body)}
        </>
    )
}
