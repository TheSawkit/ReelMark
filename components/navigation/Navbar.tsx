import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { NavbarClient } from '@/components/navigation/NavbarClient';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations();

  return <NavbarClient user={user} t={t} />;
}
