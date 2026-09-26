import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';

function InputFieldSkeleton() {
	return (
		<Field>
			<Skeleton className="h-4.75 w-20" />
			<Skeleton className="h-9 w-full" />
		</Field>
	);
}

export default function SignupLoading() {
	return (
		<AuthPageShell>
			<div className="flex flex-col gap-6">
				<Card>
					<CardHeader className="text-center">
						<Skeleton className="h-14 w-56 mx-auto" />
						<Skeleton className="h-5 w-48 mx-auto" />
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<Field>
								<Skeleton className="h-10.5 w-full" />
							</Field>
							<Skeleton className="-my-2 h-5 w-full" />
							<InputFieldSkeleton />
							<InputFieldSkeleton />
							<Field>
								<Field className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<InputFieldSkeleton />
									<InputFieldSkeleton />
								</Field>
								<Skeleton className="h-5.25 w-full" />
							</Field>
							<Field>
								<Skeleton className="h-4.75 w-28" />
								<Skeleton className="h-9 w-full" />
								<Skeleton className="h-10.5 w-full" />
							</Field>
							<Field>
								<Skeleton className="h-10 w-full" />
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
