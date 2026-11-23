// Endpoint-urile „Rezervările mele”, detaliile și anularea (tag-ul Rezervări din rrm-api.yaml), cu
// aceleași reguli și mesaje ca rrm-backend (KAN-77, KAN-78).

import type {
  Problem,
  Reservation,
  ReservationStatus,
  ReservationSummary,
  ReservationSummaryPage,
} from '../api/types';
import {
  allReservations,
  currentUser,
  findReservation,
  replaceReservation,
  userRef,
} from './mockDb';
import { SEED_RESOURCES } from './seedData';
import { SEED_APPROVALS, type SeedReservation } from './seedReservations';
import { SEED_PROJECTS, SEED_TEAMS } from './seedTeams';

/** Rezultatul unei operații: valoarea sau eroarea `application/problem+json`. */
export type MockResult<T> = { ok: true; value: T } | { ok: false; problem: Problem };

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
};

/** O eroare cu titlul standard al codului HTTP. */
export function fail(
  status: number,
  code: string,
  detail: string,
): { ok: false; problem: Problem } {
  return { ok: false, problem: { title: TITLES[status] ?? 'Error', status, code, detail } };
}

const CANCELLABLE: ReservationStatus[] = ['PENDING', 'PENDING_ADMIN', 'CONFIRMED'];
const SORT_FIELDS = ['id', 'start', 'end', 'status', 'createdAt'] as const;

function project(projectId: number): { id: number; title: string; coordinatorId: number } {
  const found = SEED_PROJECTS.find((candidate) => candidate.id === projectId);
  const team = SEED_TEAMS.find((candidate) => candidate.id === found?.teamId);
  if (found === undefined || team === undefined) {
    throw new Error(`Proiectul ${String(projectId)} lipsește din datele de test.`);
  }
  return { id: found.id, title: found.title, coordinatorId: team.coordinatorId };
}

function resource(resourceId: number): { id: number; name: string; administratorId: number } {
  // Și resursele scoase din catalog apar în istoricul rezervărilor.
  const found = SEED_RESOURCES.find((candidate) => candidate.id === resourceId);
  if (found === undefined) {
    throw new Error(`Resursa ${String(resourceId)} lipsește din datele de test.`);
  }
  return { id: found.id, name: found.name, administratorId: found.administratorId };
}

function toSummary(reservation: SeedReservation): ReservationSummary {
  const { id, title } = project(reservation.projectId);
  const { id: resourceId, name } = resource(reservation.resourceId);
  return {
    id: reservation.id,
    resource: { id: resourceId, name },
    project: { id, title },
    start: reservation.start,
    end: reservation.end,
    status: reservation.status,
  };
}

/** Detaliile rezervării, ca `ReservationOut` din backend. */
export function toReservation(reservation: SeedReservation): Reservation {
  const hours =
    (new Date(reservation.end).getTime() - new Date(reservation.start).getTime()) / 3_600_000;
  return {
    ...toSummary(reservation),
    requester: userRef(reservation.requesterId),
    hours,
    purpose: reservation.purpose,
    approvalFlow: reservation.approvalFlow,
    checkInDeadline: reservation.checkInDeadline,
    checkInAt: reservation.checkInAt,
    checkOutAt: reservation.checkOutAt,
    createdAt: reservation.createdAt,
    cancellation:
      reservation.cancelledAt === null
        ? null
        : {
            cancelledAt: reservation.cancelledAt,
            cancelledBy:
              reservation.cancelledById === null ? null : userRef(reservation.cancelledById),
            reason: reservation.cancelReason,
          },
    approvals: SEED_APPROVALS.filter((item) => item.reservationId === reservation.id).map(
      ({ id, stage, decision, approverId, decidedAt, comment }) => ({
        id,
        stage,
        decision,
        approver: userRef(approverId),
        decidedAt,
        comment,
      }),
    ),
  };
}

/** Parametrii `GET /users/me/reservations`, deja validați. */
export interface MyReservationsQuery {
  statuses: string[];
  from: Date | null;
  to: Date | null;
  page: number;
  size: number;
  sort: string;
}

function compare(sort: string): (a: SeedReservation, b: SeedReservation) => number {
  const [field = 'start', direction = 'asc'] = sort.split(',');
  const key = SORT_FIELDS.find((candidate) => candidate === field) ?? 'start';
  const sign = direction === 'desc' ? -1 : 1;
  const value = (reservation: SeedReservation): number | string =>
    key === 'id' || key === 'status' ? reservation[key] : new Date(reservation[key]).getTime();
  return (a, b) => {
    const left = value(a);
    const right = value(b);
    if (left === right) {
      return 0;
    }
    return left < right ? -sign : sign;
  };
}

/** `GET /users/me/reservations`; 403 pentru rolurile care nu au rezervări proprii. */
export function myReservations(query: MyReservationsQuery): MockResult<ReservationSummaryPage> {
  const user = currentUser();
  if (user.role !== 'STUDENT' && user.role !== 'RESEARCHER') {
    return fail(403, 'ACCESS_DENIED', 'Doar studenții și cercetătorii au rezervări proprii.');
  }
  const matching = allReservations()
    .filter(
      (reservation) =>
        reservation.requesterId === user.id &&
        (query.statuses.length === 0 || query.statuses.includes(reservation.status)) &&
        (query.from === null || new Date(reservation.end) > query.from) &&
        (query.to === null || new Date(reservation.start) < query.to),
    )
    .sort(compare(query.sort));
  const offset = query.page * query.size;
  return {
    ok: true,
    value: {
      content: matching.slice(offset, offset + query.size).map(toSummary),
      page: {
        page: query.page,
        size: query.size,
        totalElements: matching.length,
        totalPages: Math.ceil(matching.length / query.size),
      },
    },
  };
}

function isRequesterOrCoordinator(reservation: SeedReservation, userId: number): boolean {
  return (
    reservation.requesterId === userId || project(reservation.projectId).coordinatorId === userId
  );
}

function findOrFail(reservationId: number): MockResult<SeedReservation> {
  const reservation = findReservation(reservationId);
  return reservation === undefined
    ? fail(404, 'NOT_FOUND', `Rezervarea ${String(reservationId)} nu există.`)
    : { ok: true, value: reservation };
}

/** `GET /reservations/{id}`: solicitantul, coordonatorul, administratorul resursei, SYSTEM_ADMIN. */
export function reservationDetail(reservationId: number): MockResult<Reservation> {
  const found = findOrFail(reservationId);
  if (!found.ok) {
    return found;
  }
  const user = currentUser();
  const canView =
    isRequesterOrCoordinator(found.value, user.id) ||
    resource(found.value.resourceId).administratorId === user.id ||
    user.role === 'SYSTEM_ADMIN';
  return canView
    ? { ok: true, value: toReservation(found.value) }
    : fail(403, 'ACCESS_DENIED', 'Nu ai acces la această rezervare.');
}

/** `POST /reservations/{id}/cancel`: doar solicitantul și coordonatorul, din stările permise. */
export function cancelReservation(
  reservationId: number,
  reason: string | null,
  now: Date,
): MockResult<Reservation> {
  const found = findOrFail(reservationId);
  if (!found.ok) {
    return found;
  }
  const user = currentUser();
  if (!isRequesterOrCoordinator(found.value, user.id)) {
    return fail(
      403,
      'ACCESS_DENIED',
      'Doar solicitantul și coordonatorul echipei pot anula rezervarea.',
    );
  }
  if (!CANCELLABLE.includes(found.value.status)) {
    return fail(
      409,
      'INVALID_STATE',
      `Rezervarea are statusul ${found.value.status} și nu mai poate fi anulată.`,
    );
  }
  // Ca în backend: motivul fără spații la capete, iar unul gol devine `null`.
  const trimmed = reason?.trim() ?? '';
  const cancelled: SeedReservation = {
    ...found.value,
    status: 'CANCELLED',
    cancelledAt: now.toISOString(),
    cancelledById: user.id,
    cancelReason: trimmed === '' ? null : trimmed,
  };
  replaceReservation(cancelled);
  return { ok: true, value: toReservation(cancelled) };
}
