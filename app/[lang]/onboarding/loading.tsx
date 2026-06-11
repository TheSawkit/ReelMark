import {
	Card,
	CardContent,
	CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingLoading() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-2 text-center">
					<Skeleton className="mx-auto h-6 w-44" />
					<Skeleton className="mx-auto h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-6">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
