/** Narrow column shared by auth form pages and their skeletons, keeping both mirrored. */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex w-full max-w-sm flex-col gap-6">{children}</div>
	);
}
