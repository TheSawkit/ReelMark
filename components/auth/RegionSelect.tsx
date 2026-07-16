'use client';

import { SelectInput } from '@/components/ui/SelectInput';
import { useTranslation } from '@/lib/i18n/context';
import { VALID_REGIONS } from '@/lib/validators';

/** Theatrical region picker, driven by `VALID_REGIONS` so the options can never drift from what the server accepts. */
export function RegionSelect({ defaultValue }: { defaultValue?: string }) {
	const { t } = useTranslation();

	return (
		<SelectInput
			id="region"
			name="region"
			defaultValue={defaultValue}
			required
		>
			<option value="">{t.settings.region.placeholder}</option>
			{VALID_REGIONS.map((code) => (
				<option key={code} value={code}>
					{
						t.settings.region[
							code.toLowerCase() as Lowercase<typeof code>
						]
					}
				</option>
			))}
		</SelectInput>
	);
}
