/** Static navbar shell shown while the real navbar streams in; mirrors NavbarClient's fixed bar to avoid layout shift. */
export function NavbarFallback() {
	return (
		<header>
			<nav
				className="fixed w-full top-0 z-50 border-b border-border-subtle glass-bar shadow-navbar"
				style={{
					paddingLeft: 'env(safe-area-inset-left)',
					paddingRight: 'env(safe-area-inset-right)',
					paddingTop: 'env(safe-area-inset-top)',
					viewTransitionName: 'top-nav',
				}}
			>
				<div className="mx-auto max-w-7xl px-6 lg:px-12">
					<div className="h-16" />
				</div>
			</nav>
		</header>
	);
}
