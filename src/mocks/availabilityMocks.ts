// `GET /resources/available` (căutarea resurselor disponibile, KAN-71): resursele fără rezervări,
// cereri în așteptare sau mentenanță în intervalul `[start, end)`, cu filtrele catalogului.

import type { ResourceSummaryPage } from '../api/types';
import { isOccupied } from './occupancy';
import { catalogPage, type CatalogQuery } from './resourceMocks';

/** Rezultatul cererii: pagina sau mesajul erorii 400. */
export type AvailableResult =
  { ok: true; page: ResourceSummaryPage } | { ok: false; detail: string };

/** `GET /resources/available?start=&end=`, cu filtrele `categoryId`, `q`, `tag` și paginarea. */
export function availableResources(
  query: CatalogQuery,
  start: string | null,
  end: string | null,
  now: Date,
): AvailableResult {
  const span = { start: Date.parse(start ?? ''), end: Date.parse(end ?? '') };
  if (Number.isNaN(span.start) || Number.isNaN(span.end) || span.end <= span.start) {
    return { ok: false, detail: 'Parametrii start și end lipsesc sau end nu este după start.' };
  }
  // Filtrul de stare nu se aplică: decide intervalul (o resursă în mentenanță azi poate fi liberă
  // săptămâna viitoare, iar mentenanța din interval o exclude oricum). Ocuparea e aceeași ca la
  // cererea de rezervare (occupancy.ts), deci o cerere nouă scoate resursa din rezultate.
  const page = catalogPage(
    { ...query, statuses: [] },
    now,
    (resource) => !isOccupied(resource.id, span),
  );
  return { ok: true, page };
}
