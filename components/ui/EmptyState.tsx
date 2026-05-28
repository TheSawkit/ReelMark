import Link from 'next/link';

interface EmptyStateProps {
  message: string;
  action?: { href: string; label: string };
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
      <p className="text-sm font-medium">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="text-xs text-primary hover:text-primary-hover transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
