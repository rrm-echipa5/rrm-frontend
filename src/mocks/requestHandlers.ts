import { http, HttpResponse } from 'msw';

import type { FieldError, ReservationCreateRequest } from '../api/types';
import { catalogMoment } from './mockClock';
import { currentUser } from './mockDb';
import { myProjects } from './projectMocks';
import { createReservation } from './reservationCreateMocks';
import { fail, type MockResult } from './reservationMocks';

function problemResponse(result: Extract<MockResult<unknown>, { ok: false }>): Response {
  return HttpResponse.json(
    { type: 'about:blank', ...result.problem },
    { status: result.problem.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function field(body: Record<string, unknown>, name: string): unknown {
  return body[name];
}

function idErrors(body: Record<string, unknown>): FieldError[] {
  return ['resourceId', 'projectId']
    .filter((name) => !Number.isInteger(field(body, name)))
    .map((name) => ({ field: name, message: 'Câmpul este obligatoriu.' }));
}

function intervalErrors(start: unknown, end: unknown): FieldError[] {
  const from = typeof start === 'string' ? Date.parse(start) : NaN;
  const to = typeof end === 'string' ? Date.parse(end) : NaN;
  if (Number.isNaN(from) || Number.isNaN(to)) {
    return [{ field: Number.isNaN(from) ? 'start' : 'end', message: 'Data nu este validă.' }];
  }
  return to > from ? [] : [{ field: 'end', message: 'Sfârșitul trebuie să fie după început.' }];
}

function purposeErrors(purpose: unknown): FieldError[] {
  const length = typeof purpose === 'string' ? purpose.trim().length : 0;
  return length >= 3 && length <= 500
    ? []
    : [{ field: 'purpose', message: 'Scopul utilizării are între 3 și 500 de caractere.' }];
}

/** Validează forma corpului (`ReservationCreateRequest`); regulile de business vin după. */
function readRequest(json: unknown): MockResult<ReservationCreateRequest> {
  if (typeof json !== 'object' || json === null) {
    return fail(400, 'VALIDATION_FAILED', 'Corpul cererii lipsește.');
  }
  const body = json as Record<string, unknown>;
  const errors = [
    ...idErrors(body),
    ...intervalErrors(body['start'], body['end']),
    ...purposeErrors(body['purpose']),
  ];
  if (errors.length > 0) {
    const invalid = fail(400, 'VALIDATION_FAILED', 'Cererea nu respectă schema.');
    return { ok: false, problem: { ...invalid.problem, errors } };
  }
  return { ok: true, value: body as unknown as ReservationCreateRequest };
}

/** Handlerele MSW pentru formularul cererii de rezervare (KAN-76). */
export const requestHandlers = [
  http.get('/api/users/me/projects', () => {
    const user = currentUser();
    if (user.role !== 'STUDENT' && user.role !== 'RESEARCHER') {
      return problemResponse(
        fail(403, 'ACCESS_DENIED', 'Doar studenții și cercetătorii au proiecte cu buget de ore.'),
      );
    }
    return HttpResponse.json(myProjects(user.id));
  }),

  http.post('/api/reservations', async ({ request }) => {
    const parsed = readRequest(await request.json().catch(() => null));
    if (!parsed.ok) {
      return problemResponse(parsed);
    }
    const result = createReservation(parsed.value, catalogMoment());
    if (!result.ok) {
      return problemResponse(result);
    }
    return HttpResponse.json(result.value, {
      status: 201,
      headers: { Location: `/api/reservations/${String(result.value.id)}` },
    });
  }),
];
