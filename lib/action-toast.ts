import { toast } from 'sonner';
import { isRedirectSignal } from '@/lib/action-errors';

/** Error toast for a failed Server Action — none when it redirected to login, the page is already leaving. */
export function toastActionError(error: unknown, message: string): void {
	if (!isRedirectSignal(error)) toast.error(message);
}
