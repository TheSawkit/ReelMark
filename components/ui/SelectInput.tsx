import { cn } from '@/lib/utils';

type SelectInputProps = React.ComponentPropsWithoutRef<'select'>;

/**
 * A styled `<select>` element consistent with the app's input design system.
 * Supports all native select attributes via props spreading.
 *
 * @param className - Additional classes merged with the base input styles.
 *
 * @example
 * <SelectInput id="region" name="region" value={value} onChange={handleChange}>
 *   <option value="FR">France</option>
 * </SelectInput>
 */
export function SelectInput({
  className,
  children,
  ...props
}: SelectInputProps) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-(--radius-cinema) border border-border bg-surface px-3 py-1 text-sm text-text shadow-card-xs transition-all duration-(--duration-fast) outline-none',
        'focus-visible:border-red focus-visible:ring-[3px] focus-visible:ring-red/40',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
