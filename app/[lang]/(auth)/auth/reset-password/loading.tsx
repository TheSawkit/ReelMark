import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResetPasswordLoading() {
	return (
		<AuthPageShell>
			<div className="flex flex-col items-center gap-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-56" />
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-10 w-full" />
			</div>
			<Skeleton className="h-4 w-32 mx-auto" />
		</AuthPageShell>
	);
}
