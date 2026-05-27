import type { MetadataRoute } from 'next'

type LocalizedValue = { value: string }
type LocalizedMap = Record<string, LocalizedValue>

type LocalizedShortcut = NonNullable<MetadataRoute.Manifest['shortcuts']>[number] & {
    name_localized?: LocalizedMap
    short_name_localized?: LocalizedMap
    description_localized?: LocalizedMap
}

type LocalizedManifest = Omit<MetadataRoute.Manifest, 'shortcuts'> & {
    description_localized?: LocalizedMap
    shortcuts?: LocalizedShortcut[]
}

const ICON_192 = [{ src: '/maskable_icon_x192.png', sizes: '192x192', type: 'image/png' as const }]

export default function manifest(): MetadataRoute.Manifest {
    const m: LocalizedManifest = {
        name: 'ReelMark',
        short_name: 'ReelMark',
        description: 'Track and organize movies & TV shows you watched.',
        description_localized: {
            fr: { value: 'Suivez, organisez et découvrez tous les films et séries que vous avez regardés ou voulez regarder.' },
        },
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'portrait-primary',
        lang: 'en',
        dir: 'ltr',
        categories: ['entertainment', 'lifestyle'],
        shortcuts: [
            {
                name: 'My Library',
                name_localized: { fr: { value: 'Ma bibliothèque' } },
                short_name: 'Library',
                short_name_localized: { fr: { value: 'Bibliothèque' } },
                description: 'Your personal library of movies and TV shows to watch or already seen.',
                description_localized: { fr: { value: 'Votre bibliothèque personnelle de films et séries à regarder ou déjà vus.' } },
                url: '/library',
                icons: ICON_192,
            },
            {
                name: 'Explorer',
                name_localized: { fr: { value: 'Explorateur' } },
                short_name: 'Explorer',
                short_name_localized: { fr: { value: 'Explorateur' } },
                description: 'Discover movies and TV shows to add to your collection.',
                description_localized: { fr: { value: 'Découvrez des films et séries à ajouter à votre collection.' } },
                url: '/explorer',
                icons: ICON_192,
            },
            {
                name: 'Dashboard',
                name_localized: { fr: { value: 'Tableau de bord' } },
                short_name: 'Dashboard',
                short_name_localized: { fr: { value: 'Tableau' } },
                description: 'Access your personal dashboard with recommendations and watch history.',
                description_localized: { fr: { value: 'Accédez à votre tableau de bord personnel avec vos recommandations et votre historique de visionnage.' } },
                url: '/dashboard',
                icons: ICON_192,
            },
        ],
        screenshots: [
            {
                src: '/screenshots/screenshot-mobile-1.png',
                sizes: '390x844',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Home page',
            },
            {
                src: '/screenshots/screenshot-mobile-2.png',
                sizes: '390x844',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Your library',
            },
        ],
        icons: [
            { src: '/maskable_icon_x48.png', sizes: '48x48', type: 'image/png' },
            { src: '/maskable_icon_x72.png', sizes: '72x72', type: 'image/png' },
            { src: '/maskable_icon_x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/maskable_icon_x128.png', sizes: '128x128', type: 'image/png' },
            { src: '/maskable_icon_x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/maskable_icon_x384.png', sizes: '384x384', type: 'image/png' },
            { src: '/maskable_icon_x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    }

    return m as MetadataRoute.Manifest
}
