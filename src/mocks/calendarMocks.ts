import type { CalendarEntry, CalendarEntryType, ResourceCalendar } from '../api/types';
import { currentUser, findResource } from './mockDb';
import { SEED_MAINTENANCE, SEED_RESERVATIONS } from './seedRecords';

/** Intervalul maxim al unei cereri de calendar, din `rrm-api.yaml`. */
const MAX_RANGE_DAYS = 31;

/** Statusurile rezervărilor care ocupă resursa și tipul lor în calendar. */
const ENTRY_TYPES: Partial<Record<string, CalendarEntryType>> = {
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING: 'PENDING',
  PENDING_ADMIN: 'PENDING',
};

function overlaps(start: string, end: string, from: Date, to: Date): boolean {
  return new Date(start) < to && new Date(end) > from;
}

function reservationEntries(resourceId: number, from: Date, to: Date): CalendarEntry[] {
  const userId = currentUser().id;
  return SEED_RESERVATIONS.flatMap((reservation) => {
    const type = ENTRY_TYPES[reservation.status];
    if (
      reservation.resourceId !== resourceId ||
      type === undefined ||
      !overlaps(reservation.start, reservation.end, from, to)
    ) {
      return [];
    }
    const own = reservation.requesterId === userId;
    return [
      {
        start: reservation.start,
        end: reservation.end,
        type,
        own,
        reservationId: own ? reservation.id : null,
      },
    ];
  });
}

function maintenanceEntries(resourceId: number, from: Date, to: Date): CalendarEntry[] {
  return SEED_MAINTENANCE.flatMap((block) => {
    // O blocare încheiată ocupă resursa până la încheierea reală; una fără sfârșit, până la `to`.
    const end = block.endedAt ?? block.end ?? to.toISOString();
    if (block.resourceId !== resourceId || block.status === 'CANCELLED') {
      return [];
    }
    return overlaps(block.start, end, from, to)
      ? [{ start: block.start, end, type: 'MAINTENANCE' as const, own: false, reservationId: null }]
      : [];
  });
}

/** Rezultatul cererii: calendarul sau mesajul erorii (400 sau 404). */
export type CalendarResult =
  { ok: true; calendar: ResourceCalendar } | { ok: false; status: 400 | 404; detail: string };

/** `GET /resources/{resourceId}/calendar?start=&end=` */
export function resourceCalendar(
  resourceId: number,
  start: string | null,
  end: string | null,
): CalendarResult {
  const from = new Date(start ?? '');
  const to = new Date(end ?? '');
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return {
      ok: false,
      status: 400,
      detail: 'Parametrii start și end lipsesc sau end nu este după start.',
    };
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    return { ok: false, status: 400, detail: 'Intervalul cerut poate avea cel mult 31 de zile.' };
  }
  const resource = findResource(resourceId);
  if (resource === undefined) {
    return { ok: false, status: 404, detail: `Resursa ${String(resourceId)} nu există.` };
  }
  const entries = [
    ...reservationEntries(resourceId, from, to),
    ...maintenanceEntries(resourceId, from, to),
  ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return {
    ok: true,
    calendar: {
      resource: { id: resource.id, name: resource.name },
      start: from.toISOString(),
      end: to.toISOString(),
      rules: resource.rule,
      entries,
    },
  };
}
