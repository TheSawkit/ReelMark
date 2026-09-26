'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, useDragControls, type PanInfo } from 'motion/react';
import * as m from 'motion/react-m';
import { SHEET_DISMISS, SPRING } from '@/lib/motion';

interface BottomSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger: ReactNode;
	title: string;
	children: ReactNode;
}

/**
 * iOS-style bottom sheet: slides up on the surface spring; its grab zone (handle + title) follows
 * the finger and closes it when dragged or flicked down past `SHEET_DISMISS`, leaving the content
 * free to scroll. Radix keeps the focus trap, Escape and outside-tap handling; Motion only moves it.
 */
export function BottomSheet({
	open,
	onOpenChange,
	trigger,
	title,
	children,
}: BottomSheetProps) {
	const dragControls = useDragControls();
	const onDragEnd = (_: unknown, info: PanInfo) => {
		if (
			info.offset.y > SHEET_DISMISS.offset ||
			info.velocity.y > SHEET_DISMISS.velocity
		) {
			onOpenChange(false);
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
			<AnimatePresence>
				{open && (
					<Dialog.Portal forceMount>
						<Dialog.Overlay asChild forceMount>
							<m.div
								className="fixed inset-0 z-50 bg-black/50"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={SPRING.surface}
							/>
						</Dialog.Overlay>
						<Dialog.Content asChild forceMount aria-describedby={undefined}>
							<m.div
								className="glass-popover fixed inset-x-0 bottom-0 z-50 flex max-h-3/4 flex-col rounded-t-2xl pb-[env(safe-area-inset-bottom)] outline-none"
								initial={{ y: '100%' }}
								animate={{ y: 0 }}
								exit={{ y: '100%' }}
								transition={SPRING.surface}
								drag="y"
								dragControls={dragControls}
								dragListener={false}
								dragConstraints={{ top: 0, bottom: 0 }}
								dragElastic={{ top: 0, bottom: 0.6 }}
								onDragEnd={onDragEnd}
							>
								<div
									className="shrink-0 cursor-grab touch-none px-5 pt-2 pb-2 active:cursor-grabbing"
									onPointerDown={(event) => dragControls.start(event)}
								>
									<div
										className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border"
										aria-hidden
									/>
									<Dialog.Title className="text-base font-semibold text-text">
										{title}
									</Dialog.Title>
								</div>
								<div className="overflow-y-auto overscroll-contain px-3 pb-4">
									{children}
								</div>
							</m.div>
						</Dialog.Content>
					</Dialog.Portal>
				)}
			</AnimatePresence>
		</Dialog.Root>
	);
}
