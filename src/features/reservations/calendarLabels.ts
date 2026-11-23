import type { ScheduleLabelsOverride } from '@mantine/schedule';

import type { CalendarEntry, CalendarEntryType } from '../../api/types';

/** Textul și culoarea fiecărui tip de interval din calendar, ca în legenda din wireframe-ul 4.1. */
export const ENTRY_STYLES: Record<CalendarEntryType, { label: string; color: string }> = {
  CONFIRMED: { label: 'Ocupat', color: 'gray' },
  IN_PROGRESS: { label: 'În desfășurare', color: 'gray' },
  PENDING: { label: 'În așteptare', color: 'yellow' },
  MAINTENANCE: { label: 'Mentenanță', color: 'orange' },
};

/** Rezervările utilizatorului curent au culoarea lor, oricare ar fi statusul. */
export const OWN_ENTRY_STYLE = { label: 'Rezervarea ta', color: 'teal' };

/** Intervalul ales de utilizator. */
export const SELECTION_STYLE = { label: 'Selecția ta', color: 'blue' };

/** Stilul unui interval din calendar. */
export function entryStyle(entry: CalendarEntry): { label: string; color: string } {
  return entry.own ? OWN_ENTRY_STYLE : ENTRY_STYLES[entry.type];
}

/** Textele componentelor `@mantine/schedule`, în română. */
export const SCHEDULE_LABELS: ScheduleLabelsOverride = {
  today: 'Azi',
  next: 'Săptămâna următoare',
  previous: 'Săptămâna anterioară',
  day: 'Zi',
  week: 'Săptămână',
  month: 'Lună',
  weekday: 'Ziua',
  timeSlot: 'Interval',
  viewSelectLabel: 'Vizualizare',
  switchToDayView: 'Vizualizare pe zi',
  switchToWeekView: 'Vizualizare pe săptămână',
  switchToMonthView: 'Vizualizare pe lună',
  noEvents: 'Niciun interval ocupat',
};
