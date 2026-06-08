/** Centered shell shared by every auth screen (login, signup, password flows). */
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			{children}
		</div>
	);
}
