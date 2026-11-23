import type { TimeRange } from './calendarSelection';

/**
 * Adresa formularului cererii pentru o resursă și un interval (`?start=&end=`); folosită din
 * calendar și pentru sloturile alternative propuse la `409`.
 */
export function requestPath(resourceId: number, range: TimeRange): string {
  const query = new URLSearchParams({ start: range.start, end: range.end });
  return `/catalog/${String(resourceId)}/request?${query.toString()}`;
}
