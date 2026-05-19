import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";

export default async function CTASection() {
    const t = await getTranslations();

    return (
        <section className="px-6 py-20 lg:px-12">
            <div className="mx-auto max-w-4xl rounded-(--radius-cinema) bg-surface-2 p-12 text-center shadow-cinema">
                <h2 className="mb-6 font-display text-4xl font-normal text-text md:text-5xl">
                    {t.home.cta.title}
                </h2>
                <p className="mb-8 text-lg text-muted md:text-xl">
                    {t.home.cta.subtitle}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button
                        asChild
                        className="px-8 py-4 text-lg transform hover:scale-105 active:scale-95 transition-transform duration-(--duration-fast)"
                    >
                        <Link href="/signup">{t.home.cta.button}</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="px-8 py-4 text-lg transform hover:scale-105 active:scale-95 transition-transform duration-(--duration-fast)"
                    >
                        <Link href="/login">{t.home.cta.alreadyHave}</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
