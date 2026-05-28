'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useTranslation } from '@/lib/i18n/context';
import type { Language } from '@/lib/i18n/translations';
import { SelectInput } from '@/components/ui/SelectInput';

export function LanguageSettings() {
	const { lang, setLang, t } = useTranslation();

	const options: Array<{ value: Language; label: string; icon: string }> = [
		{ value: 'fr', label: t.settings.language.french, icon: '🇫🇷' },
		{ value: 'en', label: t.settings.language.english, icon: '🇬🇧' },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.settings.language.title}</CardTitle>
				<CardDescription>
					{t.settings.language.description}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="language-select">
							{t.common.language}
						</FieldLabel>
						<SelectInput
							id="language-select"
							value={lang}
							onChange={(e) =>
								setLang(e.target.value as Language)
							}
							className="mt-2"
						>
							{options.map(({ value, label, icon }) => (
								<option key={value} value={value}>
									{icon} {label}
								</option>
							))}
						</SelectInput>
					</Field>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}
