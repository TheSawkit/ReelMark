import { requireAuth } from '@/lib/auth';

/** Auth boundary for every route in the (protected) group — redirects to /login when unauthenticated. */
export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireAuth();
	return <>{children}</>;
}
