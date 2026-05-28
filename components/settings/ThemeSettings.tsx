'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { useTranslation } from '@/lib/i18n/context';

type ThemeValue = 'light' | 'dark' | 'system';

export function ThemeSettings() {
    const { t } = useTranslation();
    const [theme, setTheme] = useState<ThemeValue>(() => {
        const savedTheme = localStorage.getItem('theme') as ThemeValue | null;
        return savedTheme || 'system';
    });

    const THEMES: Array<{
        value: ThemeValue;
        label: string;
        description: string;
    }> = [
        {
            value: 'system',
            label: t.settings.theme.system,
            description: t.settings.theme.systemDesc,
        },
        {
            value: 'dark',
            label: t.settings.theme.dark,
            description: t.settings.theme.darkDesc,
        },
        {
            value: 'light',
            label: t.settings.theme.light,
            description: t.settings.theme.lightDesc,
        },
    ];

    const applyTheme = (newTheme: ThemeValue) => {
        const html = document.documentElement;
        html.classList.remove('light', 'dark');

        if (newTheme === 'system') {
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            html.classList.add(prefersDark ? 'dark' : 'light');
        } else {
            html.classList.add(newTheme);
        }
    };

    const handleThemeChange = (newTheme: ThemeValue) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.settings.theme.title}</CardTitle>
                <CardDescription>
                    {t.settings.theme.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field>
                        <FieldLabel>{t.common.theme}</FieldLabel>
                        <div className="space-y-3 mt-4">
                            {THEMES.map(({ value, label, description }) => (
                                <label
                                    key={value}
                                    className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={value}
                                        checked={theme === value}
                                        onChange={() =>
                                            handleThemeChange(value)
                                        }
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">
                                            {label}
                                        </p>
                                        <FieldDescription className="mt-1">
                                            {description}
                                        </FieldDescription>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </Field>
                </FieldGroup>
            </CardContent>
        </Card>
    );
}
