import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function UpdatePasswordLoading() {
	return (
		<AuthPageShell>
			<div className="flex flex-col items-center gap-2">
				<Skeleton className="h-8 w-44" />
				<Skeleton className="h-4 w-60" />
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-10 w-full" />
			</div>
			<Skeleton className="h-4 w-48 mx-auto" />
		</AuthPageShell>
	);
}
