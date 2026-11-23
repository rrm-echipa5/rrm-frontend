// Rezervările și aprobările din `rrm-backend/db/seed.sql` (KAN-56), în toate statusurile din
// diagrama de stări 7.1. Momentele sunt cele din seed, cu fusul orar al României.

import type { ApprovalFlow, ApprovalStage, Decision, ReservationStatus } from '../api/types';

/** Un rând din tabelul `reservations`. */
export interface SeedReservation {
  id: number;
  resourceId: number;
  requesterId: number;
  projectId: number;
  start: string;
  end: string;
  purpose: string;
  status: ReservationStatus;
  approvalFlow: ApprovalFlow;
  checkInDeadline: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  createdAt: string;
  cancelledAt: string | null;
  cancelledById: number | null;
  cancelReason: string | null;
}

type Times = [start: string, end: string, checkInDeadline: string, createdAt: string];

/** Un rând fără check-in și fără anulare; ora de început și sfârșit sunt ora României. */
function reservation(
  ids: [id: number, resourceId: number, requesterId: number, projectId: number],
  state: [status: ReservationStatus, approvalFlow: ApprovalFlow],
  times: Times,
  purpose: string,
): SeedReservation {
  const [id, resourceId, requesterId, projectId] = ids;
  const [status, approvalFlow] = state;
  const [start, end, checkInDeadline, createdAt] = times.map((time) => `${time}:00+02:00`) as Times;
  return {
    id,
    resourceId,
    requesterId,
    projectId,
    start,
    end,
    purpose,
    status,
    approvalFlow,
    checkInDeadline,
    checkInAt: null,
    checkOutAt: null,
    createdAt,
    cancelledAt: null,
    cancelledById: null,
    cancelReason: null,
  };
}

/** Rezervările 1040-1048 din seed. */
export const SEED_RESERVATIONS: SeedReservation[] = [
  {
    ...reservation(
      [1040, 7, 3, 1],
      ['CANCELLED', 'COORDINATOR_AND_ADMIN'],
      ['2026-11-03T10:00', '2026-11-03T12:00', '2026-11-03T10:15', '2026-10-28T11:00'],
      'Imagini SEM pentru probele de ZnO.',
    ),
    cancelledAt: '2026-11-01T14:00:00+02:00',
    cancelledById: 4,
    cancelReason: 'Mentenanță: Înlocuirea filamentului.',
  },
  {
    ...reservation(
      [1041, 12, 3, 1],
      ['COMPLETED', 'COORDINATOR'],
      ['2026-11-05T09:00', '2026-11-05T11:00', '2026-11-05T09:15', '2026-11-02T16:20'],
      'Spectre Raman pentru probele S1-S4.',
    ),
    checkInAt: '2026-11-05T09:04:00+02:00',
    checkOutAt: '2026-11-05T10:52:00+02:00',
  },
  reservation(
    [1042, 7, 3, 1],
    ['PENDING_ADMIN', 'COORDINATOR_AND_ADMIN'],
    ['2026-11-12T10:00', '2026-11-12T12:00', '2026-11-12T10:15', '2026-11-06T18:40'],
    'Imagini SEM pentru probele de ZnO depuse în octombrie.',
  ),
  reservation(
    [1043, 10, 5, 3],
    ['CONFIRMED', 'AUTO'],
    ['2026-11-10T08:00', '2026-11-10T20:00', '2026-11-10T08:30', '2026-11-07T09:10'],
    'Simulare MD, 2 milioane de atomi.',
  ),
  {
    ...reservation(
      [1044, 7, 3, 2],
      ['CANCELLED', 'COORDINATOR_AND_ADMIN'],
      ['2026-11-20T13:00', '2026-11-20T15:00', '2026-11-20T13:15', '2026-11-04T12:00'],
      'Morfologia filmelor de ZnO.',
    ),
    cancelledAt: '2026-11-08T21:30:00+02:00',
    cancelledById: 4,
    cancelReason: 'Mentenanță: Calibrarea anuală a detectorului EDS.',
  },
  reservation(
    [1045, 9, 5, 2],
    ['REJECTED', 'COORDINATOR_AND_ADMIN'],
    ['2026-11-14T14:00', '2026-11-14T16:00', '2026-11-14T14:15', '2026-11-06T10:00'],
    'Difracție de electroni pe filme ZnO.',
  ),
  reservation(
    [1046, 7, 2, 1],
    ['CONFIRMED', 'COORDINATOR_AND_ADMIN'],
    ['2026-11-13T09:00', '2026-11-13T11:00', '2026-11-13T09:15', '2026-11-07T15:30'],
    'Verificarea probelor înainte de publicare.',
  ),
  {
    ...reservation(
      [1047, 11, 3, 1],
      ['AUTO_CANCELLED', 'AUTO'],
      ['2026-11-06T12:00', '2026-11-06T13:00', '2026-11-06T12:15', '2026-11-05T20:00'],
      'Repetiție pentru prezentarea de grup.',
    ),
    cancelledAt: '2026-11-06T12:15:00+02:00',
    cancelReason: 'Fără check-in în termen.',
  },
  reservation(
    [1048, 12, 5, 2],
    ['PENDING', 'COORDINATOR'],
    ['2026-11-11T14:00', '2026-11-11T15:30', '2026-11-11T14:15', '2026-11-08T19:45'],
    'Spectre Raman de control.',
  ),
];

/** Un rând din tabelul `approvals`; id-urile sunt cele generate, în ordinea din seed. */
export interface SeedApproval {
  id: number;
  reservationId: number;
  stage: ApprovalStage;
  decision: Decision;
  approverId: number;
  decidedAt: string;
  comment: string | null;
}

function approval(
  ids: [id: number, reservationId: number, approverId: number],
  outcome: [stage: ApprovalStage, decision: Decision],
  decidedAt: string,
  comment: string | null = null,
): SeedApproval {
  const [id, reservationId, approverId] = ids;
  const [stage, decision] = outcome;
  return { id, reservationId, stage, decision, approverId, decidedAt, comment };
}

/** Tabelul `approvals`. */
export const SEED_APPROVALS: SeedApproval[] = [
  approval([1, 1040, 2], ['COORDINATOR', 'APPROVED'], '2026-10-28T14:00:00+02:00'),
  approval([2, 1040, 4], ['RESOURCE_ADMIN', 'APPROVED'], '2026-10-29T09:00:00+02:00'),
  approval([3, 1041, 2], ['COORDINATOR', 'APPROVED'], '2026-11-03T08:30:00+02:00'),
  approval([4, 1042, 2], ['COORDINATOR', 'APPROVED'], '2026-11-07T10:00:00+02:00'),
  approval([5, 1044, 2], ['COORDINATOR', 'APPROVED'], '2026-11-04T15:00:00+02:00'),
  approval([6, 1044, 4], ['RESOURCE_ADMIN', 'APPROVED'], '2026-11-05T09:30:00+02:00'),
  approval(
    [7, 1045, 2],
    ['COORDINATOR', 'REJECTED'],
    '2026-11-06T16:00:00+02:00',
    'Certificarea pentru TEM a fost retrasă; reprogramează după recertificare.',
  ),
];
