import { apiRequest } from '../../api/client';
import type { ResourceCalendar } from '../../api/types';

/** `GET /api/resources/{resourceId}/calendar`: intervalele ocupate dintre `start` și `end`. */
export function getResourceCalendar(
  resourceId: number,
  start: string,
  end: string,
): Promise<ResourceCalendar> {
  const query = new URLSearchParams({ start, end });
  return apiRequest<ResourceCalendar>(
    `/resources/${String(resourceId)}/calendar?${query.toString()}`,
  );
}
