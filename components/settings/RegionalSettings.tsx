'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { updateProfile } from '@/app/settings/actions';
import { User } from '@supabase/supabase-js';
import { useTranslation } from '@/lib/i18n/context';
import { SelectInput } from '@/components/ui/SelectInput';

const initialState = {
    error: undefined,
    success: false,
    message: '',
};

interface RegionalSettingsProps {
    user: User | null;
}

export function RegionalSettings({ user }: RegionalSettingsProps) {
    const { t } = useTranslation();
    const [state, formAction, isPending] = useActionState(
        updateProfile,
        initialState
    );
    const [region, setRegion] = useState(user?.user_metadata?.region || '');

    const regions = [
        { value: 'BE', label: t.settings.region.be },
        { value: 'FR', label: t.settings.region.fr },
        { value: 'US', label: t.settings.region.us },
        { value: 'CA', label: t.settings.region.ca },
        { value: 'GB', label: t.settings.region.gb },
        { value: 'CH', label: t.settings.region.ch },
        { value: 'LU', label: t.settings.region.lu },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.settings.region.title}</CardTitle>
                <CardDescription>
                    {t.settings.region.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-6">
                    <input
                        type="hidden"
                        name="fullName"
                        value={user?.user_metadata?.full_name || ''}
                    />
                    <input
                        type="hidden"
                        name="username"
                        value={user?.user_metadata?.username || ''}
                    />

                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="region">
                                {t.settings.region.label}
                            </FieldLabel>
                            <SelectInput
                                id="region"
                                name="region"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="mt-2"
                            >
                                <option value="">
                                    {t.settings.region.placeholder}
                                </option>
                                {regions.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </SelectInput>
                            <FieldDescription>
                                {t.auth.signup.regionDescription}
                            </FieldDescription>
                        </Field>
                    </FieldGroup>

                    {state.error && (
                        <p className="text-sm text-red">{state.error}</p>
                    )}
                    {state.success && (
                        <p className="text-sm text-gold">{state.message}</p>
                    )}

                    <Button type="submit" disabled={isPending}>
                        {isPending ? t.common.updating : t.settings.region.save}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
