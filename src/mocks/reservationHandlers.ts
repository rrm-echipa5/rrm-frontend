import { http, HttpResponse, type JsonBodyType } from 'msw';

import type { FieldError, ReservationStatus } from '../api/types';
import { catalogMoment } from './mockClock';
import {
  cancelReservation,
  fail,
  type MockResult,
  myReservations,
  type MyReservationsQuery,
  reservationDetail,
} from './reservationMocks';

const STATUSES: ReservationStatus[] = [
  'PENDING',
  'PENDING_ADMIN',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'AUTO_CANCELLED',
];
const SORT_PATTERN = /^(id|start|end|status|createdAt)(,(asc|desc))?$/;
const REASON_MAX_LENGTH = 500;

function respond(result: MockResult<JsonBodyType>): Response {
  if (result.ok) {
    return HttpResponse.json(result.value);
  }
  return HttpResponse.json(
    { type: 'about:blank', ...result.problem },
    { status: result.problem.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function invalid(errors: FieldError[]): MockResult<never> {
  const problem = fail(400, 'VALIDATION_FAILED', 'Parametrii cererii nu sunt valizi.').problem;
  return { ok: false, problem: { ...problem, errors } };
}

function optionalDate(params: URLSearchParams, name: string): Date | null | undefined {
  const raw = params.get(name);
  if (raw === null) {
    return null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateErrors(from: Date | null | undefined, to: Date | null | undefined): FieldError[] {
  if (from === undefined || to === undefined) {
    return [{ field: from === undefined ? 'from' : 'to', message: 'Data nu este validă.' }];
  }
  return from && to && to <= from
    ? [{ field: 'to', message: 'Sfârșitul intervalului trebuie să fie după început.' }]
    : [];
}

function pagingErrors(page: number, size: number, sort: string): FieldError[] {
  const errors: FieldError[] = [];
  if (!Number.isInteger(page) || page < 0) {
    errors.push({ field: 'page', message: 'Minim 0.' });
  }
  if (!Number.isInteger(size) || size < 1 || size > 100) {
    errors.push({ field: 'size', message: 'Între 1 și 100.' });
  }
  if (!SORT_PATTERN.test(sort)) {
    errors.push({ field: 'sort', message: 'Sortarea nu este validă.' });
  }
  return errors;
}

/** Validează parametrii din `GET /users/me/reservations`, ca router-ul din backend. */
function parseQuery(url: URL): MockResult<MyReservationsQuery> {
  const params = url.searchParams;
  const statuses = params.getAll('status');
  const from = optionalDate(params, 'from');
  const to = optionalDate(params, 'to');
  const page = Number(params.get('page') ?? 0);
  const size = Number(params.get('size') ?? 20);
  const sort = params.get('sort') ?? 'start,desc';
  const errors: FieldError[] = [
    ...statuses
      .filter((status) => !STATUSES.some((known) => known === status))
      .map((status) => ({ field: 'status', message: `Statusul ${status} nu există.` })),
    ...dateErrors(from, to),
    ...pagingErrors(page, size, sort),
  ];
  if (errors.length > 0) {
    return invalid(errors);
  }
  return { ok: true, value: { statuses, from: from ?? null, to: to ?? null, page, size, sort } };
}

/** Motivul din corpul opțional al anulării; `undefined` dacă e prea lung sau nu e text. */
async function cancelReason(request: Request): Promise<string | null | undefined> {
  const text = await request.text();
  if (text === '') {
    return null;
  }
  const body: unknown = JSON.parse(text);
  const reason = typeof body === 'object' && body !== null && 'reason' in body ? body.reason : null;
  if (reason === null || reason === undefined) {
    return null;
  }
  return typeof reason === 'string' && reason.trim().length <= REASON_MAX_LENGTH
    ? reason
    : undefined;
}

/** Handlerele MSW pentru rezervările utilizatorului curent (KAN-77, KAN-78). */
export const reservationHandlers = [
  http.get('/api/users/me/reservations', ({ request }) => {
    const query = parseQuery(new URL(request.url));
    return respond(query.ok ? myReservations(query.value) : query);
  }),

  http.get('/api/reservations/:reservationId', ({ params }) =>
    respond(reservationDetail(Number(params['reservationId']))),
  ),

  http.post('/api/reservations/:reservationId/cancel', async ({ request, params }) => {
    const reason = await cancelReason(request);
    if (reason === undefined) {
      return respond(
        invalid([{ field: 'reason', message: 'Motivul are cel mult 500 de caractere.' }]),
      );
    }
    return respond(cancelReservation(Number(params['reservationId']), reason, catalogMoment()));
  }),
];
