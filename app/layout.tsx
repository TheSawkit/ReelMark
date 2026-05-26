import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navigation/Navbar";
import { PageTopGradient } from "@/components/ui/PageTopGradient";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { getServerLanguage, getTranslations } from "@/lib/i18n/server";
import { BASE_URL } from "@/lib/metadata";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const sans = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-sans",
});

const display = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-display",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
        { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    ],
}

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "ReelMark — Track Movies & TV Shows",
        template: "%s | ReelMark",
    },
    description:
        "Your personal companion to track and organize all the movies, shows and content you have already watched.",
    applicationName: "ReelMark",
    keywords: ["watchlist", "movies", "tv shows", "tracker", "cinema", "films", "series"],
    authors: [{ name: "SAWKIT" }],
    creator: "SAWKIT",
    openGraph: {
        type: "website",
        siteName: "ReelMark",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
    },
    appleWebApp: {
        capable: true,
        title: "ReelMark",
        statusBarStyle: "black-translucent",
    },
    icons: {
        icon: [
            { url: "/maskable_icon_x192.png", sizes: "192x192", type: "image/png" },
            { url: "/maskable_icon_x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/maskable_icon_x192.png", sizes: "192x192", type: "image/png" },
        ],
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const lang = await getServerLanguage();
    const t = await getTranslations();

    return (
        <html lang={lang} suppressHydrationWarning>
            <head>
                <link rel="dns-prefetch" href="https://image.tmdb.org" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var h=document.documentElement,t=localStorage.getItem("theme"),m=window.matchMedia("(prefers-color-scheme: light)");function a(l){h.classList.remove("light","dark");h.classList.add(l?"light":"dark")}if(t==="light")a(true);else if(t==="dark")a(false);else{a(m.matches);m.addEventListener("change",function(e){var s=localStorage.getItem("theme");if(!s||s==="system")a(e.matches)})}}catch(e){}})()`,
                    }}
                />
            </head>
            <body className={`${sans.variable} ${display.variable} antialiased bg-background text-text`}>
                <Analytics />
                <SpeedInsights />
                <Providers initialLang={lang}>
                    <ScrollToTop />
                    <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
                    >
                        {t.common.skipToMainContent}
                    </a>
                    <Navbar />
                    <PageTopGradient />
                    <main id="main-content" className="pt-12" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}>
                        {children}
                    </main>
                    <footer className="border-t border-border-subtle mt-auto py-8 text-center text-sm text-muted">
                        <p>© {new Date().getFullYear()} ReelMark</p>
                    </footer>
                </Providers>
                <Toaster />
            </body>
        </html>
    );
}
