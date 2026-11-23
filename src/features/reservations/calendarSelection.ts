// Regulile intervalului ales în calendar, din `UsageRuleSummary`: durata minimă și maximă, pauza
// față de rezervările altora și suprapunerea cu intervalele ocupate. Backend-ul le verifică din nou
// la trimiterea cererii (KAN-73); aici doar oprim din timp o selecție care oricum ar fi respinsă.

import dayjs from 'dayjs';

import type { CalendarEntry, UsageRuleSummary } from '../../api/types';
import { formatMinutes } from '../resources/formatters';

/** Un interval `[start, end)`, cu momentele în format ISO 8601. */
export interface TimeRange {
  start: string;
  end: string;
}

/** Formatul de dată și oră folosit de `@mantine/schedule` (`YYYY-MM-DD HH:mm:ss`, ora locală). */
export const SCHEDULE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** Săptămâna (luni 00:00 - luni următoare 00:00) care conține ziua dată, în format ISO 8601. */
export function weekRange(day: string): TimeRange {
  const date = dayjs(day);
  // `day()` întoarce 0 pentru duminică; săptămâna începe luni, ca în calendarul din wireframe.
  const monday = date.subtract((date.day() + 6) % 7, 'day').startOf('day');
  return { start: monday.format(), end: monday.add(7, 'day').format() };
}

/** Un moment din API în formatul calendarului. */
export function toScheduleTime(value: string): string {
  return dayjs(value).format(SCHEDULE_FORMAT);
}

/** Intervalul propus la un click pe un slot: începe la slot și durează minimul permis. */
export function rangeFromSlot(slotStart: string, rules: UsageRuleSummary): TimeRange {
  const start = dayjs(slotStart);
  return { start: start.format(), end: start.add(rules.minDurationMinutes, 'minute').format() };
}

function overlaps(range: TimeRange, entry: CalendarEntry, marginMinutes = 0): boolean {
  const start = dayjs(range.start).subtract(marginMinutes, 'minute');
  const end = dayjs(range.end).add(marginMinutes, 'minute');
  return start.isBefore(dayjs(entry.end)) && end.isAfter(dayjs(entry.start));
}

/** Verifică intervalul ales; întoarce motivul pentru care nu poate fi cerut sau `null`. */
export function selectionError(
  range: TimeRange,
  entries: CalendarEntry[],
  rules: UsageRuleSummary,
  now: Date,
): string | null {
  const minutes = dayjs(range.end).diff(dayjs(range.start), 'minute');
  if (dayjs(range.start).isBefore(dayjs(now))) {
    return 'Intervalul a început deja; alege unul din viitor.';
  }
  if (minutes < rules.minDurationMinutes || minutes > rules.maxDurationMinutes) {
    const min = formatMinutes(rules.minDurationMinutes);
    return `Durata trebuie să fie între ${min} și ${formatMinutes(rules.maxDurationMinutes)}.`;
  }
  if (entries.some((entry) => overlaps(range, entry))) {
    return 'Intervalul se suprapune cu un interval ocupat sau cu o mentenanță.';
  }
  const pause = rules.breakBetweenMinutes;
  const tooClose = entries.some(
    (entry) => entry.type !== 'MAINTENANCE' && overlaps(range, entry, pause),
  );
  return tooClose ? `Între rezervări trebuie o pauză de cel puțin ${formatMinutes(pause)}.` : null;
}

/** Dacă slotul `[start, end)` din calendar este ocupat sau a trecut. */
export function isSlotUnavailable(slot: TimeRange, entries: CalendarEntry[], now: Date): boolean {
  return dayjs(slot.start).isBefore(dayjs(now)) || entries.some((entry) => overlaps(slot, entry));
}
