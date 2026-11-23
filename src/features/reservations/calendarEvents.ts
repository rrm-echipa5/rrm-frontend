// Intervalele din `GET /resources/{resourceId}/calendar` ca evenimente `@mantine/schedule`.

import type { ScheduleEventData } from '@mantine/schedule';
import dayjs from 'dayjs';

import type { CalendarEntry } from '../../api/types';
import { entryStyle, SELECTION_STYLE } from './calendarLabels';
import { type TimeRange, toScheduleTime } from './calendarSelection';

/**
 * Împarte un interval pe zile, tăiat la miezul nopții. `WeekView` tratează ca „all-day” orice
 * eveniment care trece de miezul nopții, iar cu `withAllDaySlots={false}` nu îl afișează deloc
 * (de exemplu, mentenanța SEM din 20 nov. 08:00 - 21 nov. 18:00). O bucată care ține până la
 * miezul nopții se termină la 23:59, nu la 24:00: `isAllDayEvent` din `@mantine/schedule` consideră
 * „all-day” și o bucată 00:00 - 24:00 (sau 23:59:59), adică o zi întreagă din mijlocul unei
 * mentenanțe de mai multe zile.
 */
export function splitByDay(range: TimeRange): TimeRange[] {
  const end = dayjs(range.end);
  const parts: TimeRange[] = [];
  let start = dayjs(range.start);
  while (start.isBefore(end)) {
    const nextDay = start.startOf('day').add(1, 'day');
    const partEnd = end.isBefore(nextDay) ? end : nextDay.subtract(1, 'minute');
    parts.push({ start: start.format(), end: partEnd.format() });
    start = nextDay;
  }
  return parts;
}

function dayEvents(
  id: string,
  range: TimeRange,
  style: { label: string; color: string },
  variant: 'filled' | 'light',
): ScheduleEventData[] {
  return splitByDay(range).map((part, index) => ({
    id: `${id}-${String(index)}`,
    title: style.label,
    start: toScheduleTime(part.start),
    end: toScheduleTime(part.end),
    color: style.color,
    variant,
  }));
}

/** Intervalele din calendar și selecția, câte un eveniment pe zi, cu `id` unic. */
export function toEvents(
  entries: CalendarEntry[],
  selection: TimeRange | null,
): ScheduleEventData[] {
  const events = entries.flatMap((entry, index) =>
    dayEvents(`entry-${String(index)}`, entry, entryStyle(entry), entry.own ? 'filled' : 'light'),
  );
  if (selection !== null) {
    events.push(...dayEvents('selection', selection, SELECTION_STYLE, 'filled'));
  }
  return events;
}
