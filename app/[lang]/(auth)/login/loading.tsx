import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoading() {
	return (
		<AuthPageShell>
			<div className="flex flex-col gap-6">
				<Card>
					<CardHeader className="text-center">
						<Skeleton className="h-7 w-48 mx-auto" />
						<div>
							<Skeleton className="h-5 w-64 max-w-full mx-auto" />
							<Skeleton className="h-5 w-16 mx-auto sm:hidden" />
						</div>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<Field>
								<Skeleton className="h-10.5 w-full" />
								<Skeleton className="h-10.5 w-full" />
							</Field>
							<Skeleton className="-my-2 h-5 w-full" />
							<Field>
								<Skeleton className="h-4.75 w-12" />
								<Skeleton className="h-9 w-full" />
							</Field>
							<Field>
								<Skeleton className="h-5 w-full" />
								<Skeleton className="h-9 w-full" />
							</Field>
							<Field>
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-5.25 w-48 mx-auto" />
							</Field>
						</FieldGroup>
					</CardContent>
				</Card>
				<Skeleton className="h-10.5 w-72 max-w-full mx-auto" />
			</div>
		</AuthPageShell>
	);
}
