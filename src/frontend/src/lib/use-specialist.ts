import { useQuery } from '@tanstack/react-query';
import { ApiError, specialists } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

/**
 * Returns the current user's specialist row. Replaces the old localStorage
 * hack — derives the specialist_id from the API so it works across devices,
 * across logout/login as another user, and across cleared storage.
 *
 * - Disabled when there is no token at all (avoids 401 spam on /login).
 * - Returns null on 404 (the user simply isn't a specialist yet).
 */
export function useMySpecialist() {
  const { token, user } = useAuth();
  const role = user?.role;

  return useQuery({
    queryKey: ['specialists', 'me'],
    queryFn: async () => {
      try {
        return await specialists.me();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!token && (role === 'specialist' || role === 'admin' || !role),
    staleTime: 60_000,
  });
}

export function useMySpecialistId(): string | null {
  const { data } = useMySpecialist();
  return data?.id ?? null;
}
