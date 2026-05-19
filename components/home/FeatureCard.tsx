import { Card, CardContent } from "@/components/ui/card";
import type { FeatureCardProps } from "@/types/components";

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card className="shadow-cinema transform transition-all duration-(--duration-base) hover:scale-105 hover:shadow-card group h-full">
      <CardContent className="p-8 h-full flex flex-col">
        <div className="mb-4 text-4xl">{icon}</div>
        <h3 className="mb-3 font-display text-2xl font-normal text-text">
          {title}
        </h3>
        <p className="text-muted flex-1">{description}</p>
      </CardContent>
    </Card>
  );
}

