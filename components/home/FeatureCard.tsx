import type { FeatureCardProps } from '@/types/components';

export default function FeatureCard({
	icon,
	title,
	description,
}: FeatureCardProps) {
	return (
		<div className="glass-surface h-full rounded-2xl p-8 transition-all duration-(--duration-base) ease-apple hover:-translate-y-1 hover:border-glass-border-hover hover:shadow-glow-red">
			<div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-glass-bg-hover">
				{icon}
			</div>
			<h3 className="mb-3 heading-display leading-none text-2xl text-text">
				{title}
			</h3>
			<p className="text-muted">{description}</p>
		</div>
	);
}
