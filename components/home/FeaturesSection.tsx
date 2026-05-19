import { Film, Compass, FolderOpen, Star, Smartphone, Users } from "lucide-react"
import FeatureCard from "./FeatureCard";
import { StaggeredItem } from "@/components/ui/StaggeredItem";
import { getTranslations } from "@/lib/i18n/server";

export default async function FeaturesSection() {
    const t = await getTranslations();

    const features = [
        { icon: <Film className="h-9 w-9 text-primary" />, title: t.features.feature1Title, description: t.features.feature1Desc },
        { icon: <Compass className="h-9 w-9 text-gold" />, title: t.features.feature2Title, description: t.features.feature2Desc },
        { icon: <FolderOpen className="h-9 w-9 text-primary" />, title: t.features.feature3Title, description: t.features.feature3Desc },
        { icon: <Star className="h-9 w-9 text-gold" />, title: t.features.feature4Title, description: t.features.feature4Desc },
        { icon: <Smartphone className="h-9 w-9 text-primary" />, title: t.features.feature5Title, description: t.features.feature5Desc },
        { icon: <Users className="h-9 w-9 text-gold" />, title: t.features.feature6Title, description: t.features.feature6Desc },
    ];

    return (
        <section className="px-6 py-20 lg:px-12">
            <div className="mx-auto max-w-6xl">
                <h2
                    className="mb-12 text-center font-display text-5xl font-normal text-text md:text-6xl"
                    style={{ animation: "slideUpSubtle var(--duration-slower) ease-out both" }}
                >
                    {t.home.features.title}
                </h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <StaggeredItem
                            key={index}
                            index={index}
                            staggerMs={100}
                            animation="fadeIn"
                            duration="var(--duration-slower)"
                            eager={index < 3}
                        >
                            <FeatureCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                            />
                        </StaggeredItem>
                    ))}
                </div>
            </div>
        </section>
    );
}
