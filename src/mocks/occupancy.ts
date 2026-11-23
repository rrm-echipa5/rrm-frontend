// Ce ocupă o resursă într-un interval: rezervările active și mentenanțele programate. Folosit la
// cererea de rezervare și la sloturile alternative, cu aceleași reguli ca regulile din calendar.

import type { ReservationStatus } from '../api/types';
import { allReservations } from './mockDb';
import { SEED_MAINTENANCE } from './seedRecords';

/** Statusurile rezervărilor care ocupă resursa. */
const OCCUPYING: ReservationStatus[] = ['PENDING', 'PENDING_ADMIN', 'CONFIRMED', 'IN_PROGRESS'];

/** Un interval `[start, end)` în milisecunde. */
export interface Span {
  start: number;
  end: number;
}

function overlaps(a: Span, b: Span, marginMs = 0): boolean {
  return a.start - marginMs < b.end && a.end + marginMs > b.start;
}

function reservationSpans(resourceId: number): Span[] {
  return allReservations()
    .filter((item) => item.resourceId === resourceId && OCCUPYING.includes(item.status))
    .map((item) => ({ start: Date.parse(item.start), end: Date.parse(item.end) }));
}

function maintenanceSpans(resourceId: number): Span[] {
  return SEED_MAINTENANCE.filter(
    (block) => block.resourceId === resourceId && block.status !== 'CANCELLED',
  ).map((block) => ({
    start: Date.parse(block.start),
    end: Date.parse(block.endedAt ?? block.end ?? '9999-12-31T00:00:00Z'),
  }));
}

/** Dacă intervalul se suprapune cu o rezervare activă sau cu o mentenanță. */
export function isOccupied(resourceId: number, span: Span): boolean {
  return [...reservationSpans(resourceId), ...maintenanceSpans(resourceId)].some((busy) =>
    overlaps(span, busy),
  );
}

/**
 * Dacă intervalul e prea aproape de o rezervare (nu de o mentenanță): pauza se cere față de toate
 * rezervările active, inclusiv cele proprii și cele în așteptare, iar o distanță egală e permisă.
 */
export function breaksPause(resourceId: number, span: Span, pauseMinutes: number): boolean {
  return reservationSpans(resourceId).some((busy) => overlaps(span, busy, pauseMinutes * 60_000));
}
