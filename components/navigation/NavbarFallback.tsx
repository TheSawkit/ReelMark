/** Static navbar shell shown while the real navbar streams in; mirrors NavbarClient's fixed bar to avoid layout shift. */
export function NavbarFallback() {
	return (
		<header>
			<nav className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle glass-bar shadow-navbar top-nav-safe-area">
				<div className="mx-auto max-w-7xl px-6 lg:px-12">
					<div className="h-16" />
				</div>
			</nav>
		</header>
	);
}
