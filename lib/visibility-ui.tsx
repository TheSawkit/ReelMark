import { Globe, Users, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PrivacyVisibility } from '@/types/profile';

export const VISIBILITY_ICON: Record<PrivacyVisibility, LucideIcon> = {
  public: Globe,
  friends: Users,
  private: Lock,
};
