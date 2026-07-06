/** Centered shell shared by every auth screen (login, signup, password flows). */
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="centered-screen">{children}</div>;
}
