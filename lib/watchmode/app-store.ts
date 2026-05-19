interface ItunesApp {
    trackId: number
    artworkUrl512: string
}

const PROVIDER_APP_IDS: Record<string, number> = {
    netflix: 363590051,
    amazon: 545519333,
    amazonprimevideo: 545519333,
    primevideo: 545519333,
    appletv: 1174078549,
    appletvplus: 1174078549,
    disneyplus: 1446075923,
    disney: 1446075923,
    max: 1666653815,
    hbomax: 1666653815,
    paramountplus: 1440266650,
    paramountwithshowtime: 530168168,
    youtube: 544007664,
    youtubepremium: 544007664,
    youtubetv: 1193350206,
    crunchyroll: 329913454,
    crunchyrollpremium: 329913454,
    hulu: 376510438,
    peacockpremium: 1508186374,
    peacock: 1508186374,
    starz: 550221096,
    mubi: 626148774,
    discoveryplus: 1498327873,
    fubotv: 905401434,
    fubo: 905401434,
    amcplus: 1578728899,
    shudder: 919790315,
    curiositystream: 971830624,
    mgmplus: 1387514950,
    betplus: 1456618978,
    philo: 893244665,
    itvx: 446079916,
    britbox: 1206838907,
    britboxuk: 1206838907,
    nowtv: 512266300,
    now: 512266300,
    skygo: 446086440,
    skyshowtime: 1616478112,
    hayu: 1052817340,
    rakutentv: 532577301,
    rakuten: 532577301,
    canalplus: 694580816,
    canal: 694580816,
    videoland: 1570409180,
    nlziet: 881822672,
    movistarplus: 540674767,
    movistar: 540674767,
    stan: 948095331,
    binge: 1486598248,
    foxtelnow: 569457984,
    kayosports: 1434518367,
    globoplay: 536321738,
    sonyliv: 587794258,
    jiohotstar: 934459219,
    zee5: 743691886,
    dazn: 1129523589,
    rakutenviki: 445553058,
    viki: 445553058,
    acorntv: 896014310,
}

/** Returns a map of normalized provider name → App Store icon URL (512px), cached 1 week. */
export async function getAppStoreIconMap(country = 'GB'): Promise<Map<string, string>> {
    try {
        const uniqueIds = [...new Set(Object.values(PROVIDER_APP_IDS))]
        const res = await fetch(
            `https://itunes.apple.com/lookup?id=${uniqueIds.join(',')}&entity=software&country=${country.toLowerCase()}`,
            { next: { revalidate: 604800 } },
        )
        if (!res.ok) return new Map()

        const data: { results: ItunesApp[] } = await res.json()
        const idToIcon = new Map(data.results.map(a => [a.trackId, a.artworkUrl512]))

        const map = new Map<string, string>()
        for (const [key, appId] of Object.entries(PROVIDER_APP_IDS)) {
            const icon = idToIcon.get(appId)
            if (icon) map.set(key, icon)
        }
        return map
    } catch {
        return new Map()
    }
}
