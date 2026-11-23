// Sloturile alternative (extensia „Primire sugestii de sloturi alternative”, KAN-74): intervale
// libere de aceeași durată, apropiate de cel cerut, pentru aceeași resursă și pentru resurse din
// aceeași categorie.

import dayjs from 'dayjs';

import type { AlternativeSlot } from '../api/types';
import { allResources } from './mockDb';
import { breaksPause, isOccupied, type Span } from './occupancy';
import type { SeedResource } from './seedData';

const STEP_MINUTES = 30;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const DAYS_AHEAD = 7;
const SAME_RESOURCE_LIMIT = 3;

/** Începuturile posibile, din 30 în 30 de minute, între 08:00 și 20:00, în ziua cererii și după. */
function candidateStarts(requested: Span, now: Date): number[] {
  const minutes = (requested.end - requested.start) / 60_000;
  const firstDay = dayjs(requested.start).startOf('day');
  const starts: number[] = [];
  for (let day = 0; day < DAYS_AHEAD; day += 1) {
    const opening = firstDay.add(day, 'day').hour(DAY_START_HOUR);
    const lastStart = firstDay.add(day, 'day').hour(DAY_END_HOUR).subtract(minutes, 'minute');
    for (let slot = opening; !slot.isAfter(lastStart); slot = slot.add(STEP_MINUTES, 'minute')) {
      if (slot.valueOf() > now.getTime() && slot.valueOf() !== requested.start) {
        starts.push(slot.valueOf());
      }
    }
  }
  const distance = (start: number): number => Math.abs(start - requested.start);
  return starts.sort((a, b) => distance(a) - distance(b));
}

function slot(resource: SeedResource, span: Span, sameResource: boolean): AlternativeSlot {
  return {
    resource: { id: resource.id, name: resource.name },
    start: dayjs(span.start).format(),
    end: dayjs(span.end).format(),
    sameResource,
  };
}

/** Sloturile propuse pentru un interval ocupat, ordonate: întâi aceeași resursă, apoi similare. */
export function alternativeSlots(
  resource: SeedResource,
  requested: Span,
  now: Date,
  limit = 5,
): AlternativeSlot[] {
  const length = requested.end - requested.start;
  const same = candidateStarts(requested, now)
    .map((start) => ({ start, end: start + length }))
    .filter(
      (span) =>
        !isOccupied(resource.id, span) &&
        !breaksPause(resource.id, span, resource.rule.breakBetweenMinutes),
    )
    .slice(0, SAME_RESOURCE_LIMIT)
    .map((span) => slot(resource, span, true));
  const similar = allResources()
    .filter(
      (other) =>
        other.id !== resource.id &&
        other.categoryId === resource.categoryId &&
        !isOccupied(other.id, requested),
    )
    .map((other) => slot(other, requested, false));
  return [...same, ...similar].slice(0, limit);
}
