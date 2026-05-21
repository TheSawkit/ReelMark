'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/app/auth/actions'
import { useTranslation } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

const initialState: { error: string } = { error: '' }

export function UpdatePasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState)
  const { t } = useTranslation()

  return (
    <div className={cn('flex flex-col gap-6 auth-form-animate', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t.auth.updatePassword.title}</CardTitle>
          <CardDescription>{t.auth.updatePassword.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">{t.auth.updatePassword.password}</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t.auth.updatePassword.placeholders.password}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">{t.auth.updatePassword.confirmPassword}</FieldLabel>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder={t.auth.updatePassword.placeholders.confirmPassword}
                  required
                />
              </Field>
              {state?.error && <p role="alert" className="text-sm text-red-2 text-center">{state.error}</p>}
              <Field>
                <Button type="submit" loading={isPending}>
                  {isPending ? t.common.loading : t.auth.updatePassword.button}
                </Button>
                <FieldDescription className="text-center">
                  {t.auth.updatePassword.note}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

