'use client';

import { useActionState } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { requestPasswordReset } from '@/app/auth/actions';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const initialState: { error: string; success?: boolean } = { error: '' };

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState
  );
  const { t } = useTranslation();

  if (state?.success) {
    return (
      <div
        className={cn('flex flex-col gap-6 auth-form-animate', className)}
        {...props}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {t.auth.resetPassword.successTitle}
            </CardTitle>
            <CardDescription>
              {t.auth.resetPassword.successDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldDescription className="text-center">
              <Link href="/login">{t.auth.resetPassword.backToLogin}</Link>
            </FieldDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-6 auth-form-animate', className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {t.auth.resetPassword.title}
          </CardTitle>
          <CardDescription>{t.auth.resetPassword.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">
                  {t.auth.resetPassword.email}
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.auth.resetPassword.placeholders.email}
                  required
                />
              </Field>
              {state?.error && (
                <p role="alert" className="text-sm text-red-2 text-center">
                  {state.error}
                </p>
              )}
              <Field>
                <Button type="submit" loading={isPending}>
                  {isPending ? t.common.loading : t.auth.resetPassword.button}
                </Button>
                <FieldDescription className="text-center">
                  <Link href="/login">{t.auth.resetPassword.backToLogin}</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
