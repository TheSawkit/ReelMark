import { Heart } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import { DONATION_URL } from '@/lib/support';
import { cn } from '@/lib/utils';

interface DonateButtonProps {
	label: string;
	size?: VariantProps<typeof buttonVariants>['size'];
	className?: string;
}

/** Outbound donation link styled as a button — the only component that renders the donation URL. */
export function DonateButton({ label, size, className }: DonateButtonProps) {
	return (
		<a
			href={DONATION_URL}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(buttonVariants({ size }), className)}
		>
			<Heart className="fill-current" aria-hidden />
			{label}
		</a>
	);
}
