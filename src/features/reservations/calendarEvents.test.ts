import type { CalendarEntry } from '../../api/types';
import { toEvents } from './calendarEvents';

function maintenance(start: string, end: string): CalendarEntry {
  return { start, end, type: 'MAINTENANCE', own: false, reservationId: null };
}

describe('toEvents', () => {
  it('împarte o intrare de două zile în câte un eveniment pe zi, cu id unic', () => {
    // Mentenanța microscopului SEM din datele de test.
    const entry = maintenance('2026-11-20T08:00:00+02:00', '2026-11-21T18:00:00+02:00');

    const events = toEvents([entry], null);

    expect(events.map(({ start, end }) => [start, end])).toEqual([
      ['2026-11-20 08:00:00', '2026-11-20 23:59:00'],
      ['2026-11-21 00:00:00', '2026-11-21 18:00:00'],
    ]);
    expect(new Set(events.map((event) => event.id)).size).toBe(2);
    expect(events.every((event) => event.title === 'Mentenanță')).toBe(true);
  });

  it('o zi întreagă din mijloc nu ajunge la 24:00, ca să nu fie tratată ca „all-day”', () => {
    const entry = maintenance('2026-11-17T18:00:00+02:00', '2026-11-19T10:00:00+02:00');

    expect(toEvents([entry], null).map(({ start, end }) => [start, end])).toEqual([
      ['2026-11-17 18:00:00', '2026-11-17 23:59:00'],
      ['2026-11-18 00:00:00', '2026-11-18 23:59:00'],
      ['2026-11-19 00:00:00', '2026-11-19 10:00:00'],
    ]);
  });

  it('lasă neschimbate intrarea dintr-o singură zi și selecția', () => {
    const entry = maintenance('2026-11-13T09:00:00+02:00', '2026-11-13T11:00:00+02:00');
    const selection = { start: '2026-11-13T14:00:00+02:00', end: '2026-11-13T15:00:00+02:00' };

    expect(toEvents([entry], selection).map(({ id, start, end }) => [id, start, end])).toEqual([
      ['entry-0-0', '2026-11-13 09:00:00', '2026-11-13 11:00:00'],
      ['selection-0', '2026-11-13 14:00:00', '2026-11-13 15:00:00'],
    ]);
  });
});
