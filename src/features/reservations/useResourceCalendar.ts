import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiError } from '../../api/client';
import type { ResourceCalendar } from '../../api/types';
import { getResourceCalendar } from './reservationsApi';

/** Calendarul resursei pentru o săptămână; săptămâna anterioară rămâne afișată cât se încarcă. */
export function useResourceCalendar(
  resourceId: number,
  range: { start: string; end: string },
): UseQueryResult<ResourceCalendar, ApiError> {
  return useQuery<ResourceCalendar, ApiError>({
    queryKey: ['resources', 'calendar', resourceId, range.start, range.end],
    queryFn: () => getResourceCalendar(resourceId, range.start, range.end),
    placeholderData: keepPreviousData,
  });
}
