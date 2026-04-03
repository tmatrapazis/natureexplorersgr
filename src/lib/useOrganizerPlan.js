import { useQuery } from '@tanstack/react-query';
import { Organizer } from '@/api/db';
import { useAuth } from '@/lib/AuthContext';

/**
 * Returns the current organizer's plan details.
 * Only meaningful when the user is an organizer (has organizer_code).
 *
 * Returns:
 *   isPremium  — true if plan === 'premium' and not expired
 *   plan       — 'free' | 'premium'
 *   isLoading  — while fetching organizer row
 */
export function useOrganizerPlan() {
  const { user } = useAuth();

  const { data: organizer, isLoading } = useQuery({
    queryKey: ['organizer-plan', user?.organizer_code],
    queryFn: async () => {
      const results = await Organizer.filter({ organizer_code: user.organizer_code });
      return results?.[0] ?? null;
    },
    enabled: !!user?.organizer_code,
    staleTime: 5 * 60 * 1000,
  });

  const plan = organizer?.plan ?? 'free';

  const isPremium =
    plan === 'premium' &&
    (!organizer?.plan_expires_at || new Date(organizer.plan_expires_at) > new Date());

  const isExpired =
    plan === 'premium' &&
    !!organizer?.plan_expires_at &&
    new Date(organizer.plan_expires_at) <= new Date();

  return { isPremium, isExpired, plan, organizer, isLoading };
}
