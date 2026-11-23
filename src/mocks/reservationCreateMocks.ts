// `POST /reservations` (cazul de utilizare 2.1, KAN-73 și KAN-74): regulile resursei, bugetul și
// suprapunerile, cu aceleași coduri ca în rrm-api.yaml. Suprapunerea se verifică înaintea pauzei,
// ca un interval ocupat să primească sloturile alternative (409), nu `BREAK_NOT_RESPECTED`.

import dayjs from 'dayjs';

import type { Problem, Reservation, ReservationCreateRequest } from '../api/types';
import { formatMinutes } from '../features/resources/formatters';
import { alternativeSlots } from './alternativeSlots';
import { currentUser, findResource, insertReservation } from './mockDb';
import { breaksPause, isOccupied, type Span } from './occupancy';
import { projectBudget } from './projectMocks';
import { fail, type MockResult, toReservation } from './reservationMocks';
import { resourceDetail } from './resourceMocks';
import type { SeedResource } from './seedData';
import { certificationStatus, SEED_CERTIFICATIONS } from './seedRecords';
import { SEED_PROJECTS, teamsOf } from './seedTeams';

interface Failure {
  ok: false;
  problem: Problem;
}

const rule = (code: string, detail: string): Failure => fail(422, code, detail);

function intervalText(span: Span): string {
  const start = dayjs(span.start);
  return `${start.format('DD.MM.YYYY, HH:mm')}-${dayjs(span.end).format('HH:mm')}`;
}

function certificationLevel(resourceId: number, userId: number, now: Date): number | null {
  const valid = SEED_CERTIFICATIONS.filter(
    (cert) =>
      cert.userId === userId &&
      cert.resourceId === resourceId &&
      certificationStatus(cert, now) === 'ACTIVE',
  );
  return valid.length === 0 ? null : Math.max(...valid.map((cert) => cert.level));
}

/** Starea, intervalul și durata (primele reguli din KAN-73). */
function checkResourceAndDuration(resource: SeedResource, span: Span, now: Date): Failure | null {
  const status = resourceDetail(resource.id, now)?.status;
  if (status !== 'ACTIVE') {
    return rule('RESOURCE_NOT_ACTIVE', 'Resursa nu este activă și nu poate fi rezervată acum.');
  }
  if (span.start < now.getTime()) {
    return rule('INTERVAL_IN_PAST', 'Intervalul a început deja; alege unul din viitor.');
  }
  const minutes = (span.end - span.start) / 60_000;
  const { minDurationMinutes: min, maxDurationMinutes: max } = resource.rule;
  if (minutes < min || minutes > max) {
    const range = `${formatMinutes(min)} și ${formatMinutes(max)}`;
    return rule('DURATION_OUT_OF_RANGE', `Durata trebuie să fie între ${range}.`);
  }
  return null;
}

/** Suprapunerea (409, cu sloturi alternative) și pauza dintre rezervări. */
function checkAvailability(resource: SeedResource, span: Span, now: Date): Failure | null {
  if (isOccupied(resource.id, span)) {
    const conflict = fail(
      409,
      'SLOT_UNAVAILABLE',
      `Intervalul ${intervalText(span)} nu mai este liber.`,
    );
    return {
      ok: false,
      problem: { ...conflict.problem, alternativeSlots: alternativeSlots(resource, span, now) },
    };
  }
  const pause = resource.rule.breakBetweenMinutes;
  if (breaksPause(resource.id, span, pause)) {
    return rule(
      'BREAK_NOT_RESPECTED',
      `Între rezervări trebuie o pauză de cel puțin ${formatMinutes(pause)}.`,
    );
  }
  return null;
}

/** Certificarea, apartenența la echipa proiectului și bugetul de ore. */
function checkUserAndBudget(
  resource: SeedResource,
  request: ReservationCreateRequest,
  span: Span,
  now: Date,
): Failure | null {
  const user = currentUser();
  const required = resource.rule.requiredCertificationLevel;
  const level = certificationLevel(resource.id, user.id, now);
  if (required !== null && (level === null || level < required)) {
    const has = level === null ? 'nu ai o certificare validă' : `ai nivelul ${String(level)}`;
    return rule(
      'CERTIFICATION_MISSING',
      `Resursa cere certificarea de nivel ${String(required)}, iar tu ${has}.`,
    );
  }
  const project = SEED_PROJECTS.find((candidate) => candidate.id === request.projectId);
  if (project === undefined || !teamsOf(user.id).some((team) => team.id === project.teamId)) {
    return rule('NOT_PROJECT_MEMBER', 'Nu faci parte din echipa acestui proiect.');
  }
  const hours = (span.end - span.start) / 3_600_000;
  const remaining = projectBudget(project).remainingHours;
  if (hours > remaining) {
    return rule(
      'BUDGET_EXCEEDED',
      `Proiectul mai are ${String(remaining)} h din buget, iar cererea are ${String(hours)} h.`,
    );
  }
  return null;
}

/** `POST /reservations` pentru o cerere deja validată ca formă (vezi handler-ul). */
export function createReservation(
  request: ReservationCreateRequest,
  now: Date,
): MockResult<Reservation> {
  const user = currentUser();
  if (user.role !== 'STUDENT' && user.role !== 'RESEARCHER') {
    return fail(403, 'ACCESS_DENIED', 'Doar studenții și cercetătorii pot solicita rezervări.');
  }
  const resource = findResource(request.resourceId);
  if (resource === undefined) {
    return fail(404, 'NOT_FOUND', `Resursa ${String(request.resourceId)} nu există.`);
  }
  if (!SEED_PROJECTS.some((project) => project.id === request.projectId)) {
    return fail(404, 'NOT_FOUND', `Proiectul ${String(request.projectId)} nu există.`);
  }
  const span = { start: Date.parse(request.start), end: Date.parse(request.end) };
  const failure =
    checkResourceAndDuration(resource, span, now) ??
    checkAvailability(resource, span, now) ??
    checkUserAndBudget(resource, request, span, now);
  if (failure !== null) {
    return failure;
  }
  // Studentul trimite o cerere; cercetătorul rezervă direct, ca și resursele cu auto-aprobare.
  const needsApproval = user.role === 'STUDENT' && resource.approvalFlow !== 'AUTO';
  const created = insertReservation((id) => ({
    id,
    resourceId: resource.id,
    requesterId: user.id,
    projectId: request.projectId,
    start: dayjs(span.start).format(),
    end: dayjs(span.end).format(),
    purpose: request.purpose.trim(),
    status: needsApproval ? 'PENDING' : 'CONFIRMED',
    approvalFlow: resource.approvalFlow,
    checkInDeadline: dayjs(span.start).add(resource.rule.checkInDeadlineMinutes, 'minute').format(),
    checkInAt: null,
    checkOutAt: null,
    createdAt: now.toISOString(),
    cancelledAt: null,
    cancelledById: null,
    cancelReason: null,
  }));
  return { ok: true, value: toReservation(created) };
}
