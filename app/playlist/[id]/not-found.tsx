import Link from 'next/link'
import { ListVideo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTranslations } from '@/lib/i18n/server'

export default async function PlaylistNotFound() {
    const t = await getTranslations()

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-2 text-muted mb-4">
                    <ListVideo className="w-10 h-10" />
                </div>

                <div>
                    <p className="text-6xl font-bold text-primary mb-2">404</p>
                    <h1 className="text-2xl font-bold text-text">{t.common.notFoundTitle}</h1>
                    <p className="text-muted mt-2">{t.common.notFoundDescription}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button asChild className="w-full sm:w-auto min-w-35">
                        <Link href="/">{t.common.errorBackHome}</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
