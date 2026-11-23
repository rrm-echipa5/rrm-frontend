import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiError } from '../../api/client';
import type { CurrentUser } from '../../api/types';
import { getCurrentUser } from './usersApi';

/** Utilizatorul curent; nu se schimbă în timpul sesiunii, deci rămâne în cache. */
export function useCurrentUser(): UseQueryResult<CurrentUser, ApiError> {
  return useQuery<CurrentUser, ApiError>({
    queryKey: ['users', 'me'],
    queryFn: getCurrentUser,
    staleTime: Infinity,
    retry: false,
  });
}
