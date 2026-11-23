// Fișierele, certificările și blocările pentru mentenanță din `rrm-backend/db/seed.sql` (KAN-56).

import type {
  CertificationStatus,
  MaintenanceStatus,
  ResourceFileType,
  WorkType,
} from '../api/types';

/** Un rând din tabelul `resource_files`; id-urile sunt cele generate, în ordinea din seed. */
export interface SeedFile {
  id: number;
  resourceId: number;
  type: ResourceFileType;
  title: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Tabelul `resource_files`. */
export const SEED_FILES: SeedFile[] = [
  {
    id: 1,
    resourceId: 7,
    type: 'MANUAL',
    title: 'Manual de utilizare SEM',
    fileName: 'manual-sem.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2483120,
  },
  {
    id: 2,
    resourceId: 7,
    type: 'PHOTO',
    title: 'Microscopul SEM',
    fileName: 'sem.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 412883,
  },
  {
    id: 3,
    resourceId: 12,
    type: 'MANUAL',
    title: 'Procedura de lucru Raman',
    fileName: 'raman.pdf',
    contentType: 'application/pdf',
    sizeBytes: 918204,
  },
];

/** Un rând din tabelul `certifications`; starea `EXPIRED` se calculează din `expiresAt`. */
export interface SeedCertification {
  id: number;
  userId: number;
  resourceId: number;
  level: number;
  grantedAt: string;
  grantedById: number;
  expiresAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
}

/** O certificare acordată de Mihai Ionescu (id 4), cum sunt toate cele din seed. */
function certification(
  ids: [id: number, userId: number, resourceId: number],
  level: number,
  grantedAt: string,
  expiresAt: string | null,
): SeedCertification {
  const [id, userId, resourceId] = ids;
  return {
    id,
    userId,
    resourceId,
    level,
    grantedAt,
    grantedById: 4,
    expiresAt,
    revokedAt: null,
    revokeReason: null,
  };
}

/** Tabelul `certifications`: Ioana Dumitru are certificarea pentru TEM retrasă. */
export const SEED_CERTIFICATIONS: SeedCertification[] = [
  certification([1, 3, 7], 2, '2026-10-01T10:00:00+03:00', '2027-10-31'),
  certification([2, 3, 12], 1, '2026-10-01T10:30:00+03:00', '2027-10-31'),
  certification([3, 5, 7], 1, '2026-10-15T12:00:00+03:00', '2027-10-31'),
  {
    ...certification([4, 5, 9], 1, '2026-10-15T12:30:00+03:00', null),
    revokedAt: '2026-11-02T09:00:00+02:00',
    revokeReason: 'Nu a respectat procedura de oprire a fasciculului.',
  },
  certification([5, 2, 7], 3, '2026-09-20T09:00:00+03:00', null),
];

/** Un rând din tabelul `maintenance_blocks`. */
export interface SeedMaintenance {
  id: number;
  resourceId: number;
  workType: WorkType;
  start: string;
  end: string | null;
  reason: string;
  status: MaintenanceStatus;
  createdAt: string;
  endedAt: string | null;
  /** Rezervările din seed cu `maintenance_id` egal cu id-ul blocării. */
  cancelledReservationsCount: number;
}

/** Tabelul `maintenance_blocks`: una încheiată și una programată, ambele pentru SEM. */
export const SEED_MAINTENANCE: SeedMaintenance[] = [
  {
    id: 30,
    resourceId: 7,
    workType: 'MAINTENANCE',
    start: '2026-11-03T08:00:00+02:00',
    end: '2026-11-03T17:00:00+02:00',
    reason: 'Înlocuirea filamentului.',
    status: 'ENDED',
    createdAt: '2026-11-01T14:00:00+02:00',
    endedAt: '2026-11-03T17:00:00+02:00',
    cancelledReservationsCount: 1,
  },
  {
    id: 31,
    resourceId: 7,
    workType: 'CALIBRATION',
    start: '2026-11-20T08:00:00+02:00',
    end: '2026-11-21T18:00:00+02:00',
    reason: 'Calibrarea anuală a detectorului EDS.',
    status: 'SCHEDULED',
    createdAt: '2026-11-08T21:30:00+02:00',
    endedAt: null,
    cancelledReservationsCount: 1,
  },
];

/** Starea calculată a unei certificări, ca în vederea `certification_statuses`. */
export function certificationStatus(cert: SeedCertification, now: Date): CertificationStatus {
  if (cert.revokedAt !== null) {
    return 'REVOKED';
  }
  if (cert.expiresAt !== null && new Date(`${cert.expiresAt}T23:59:59`) < now) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}

/** Din tabelul `reservations`: câmpurile folosite de calendar și de scoaterea din catalog. */
export interface SeedReservation {
  id: number;
  resourceId: number;
  requesterId: number;
  status: string;
  start: string;
  end: string;
}

function reservation(
  ids: [id: number, resourceId: number, requesterId: number],
  status: string,
  start: string,
  end: string,
): SeedReservation {
  const [id, resourceId, requesterId] = ids;
  return { id, resourceId, requesterId, status, start, end };
}

/** Rezervările 1040-1048 din seed, în toate statusurile din diagrama de stări. */
export const SEED_RESERVATIONS: SeedReservation[] = [
  reservation([1040, 7, 3], 'CANCELLED', '2026-11-03T10:00:00+02:00', '2026-11-03T12:00:00+02:00'),
  reservation([1041, 12, 3], 'COMPLETED', '2026-11-05T09:00:00+02:00', '2026-11-05T11:00:00+02:00'),
  reservation(
    [1042, 7, 3],
    'PENDING_ADMIN',
    '2026-11-12T10:00:00+02:00',
    '2026-11-12T12:00:00+02:00',
  ),
  reservation([1043, 10, 5], 'CONFIRMED', '2026-11-10T08:00:00+02:00', '2026-11-10T20:00:00+02:00'),
  reservation([1044, 7, 3], 'CANCELLED', '2026-11-20T13:00:00+02:00', '2026-11-20T15:00:00+02:00'),
  reservation([1045, 9, 5], 'REJECTED', '2026-11-14T14:00:00+02:00', '2026-11-14T16:00:00+02:00'),
  reservation([1046, 7, 2], 'CONFIRMED', '2026-11-13T09:00:00+02:00', '2026-11-13T11:00:00+02:00'),
  reservation(
    [1047, 11, 3],
    'AUTO_CANCELLED',
    '2026-11-06T12:00:00+02:00',
    '2026-11-06T13:00:00+02:00',
  ),
  reservation([1048, 12, 5], 'PENDING', '2026-11-11T14:00:00+02:00', '2026-11-11T15:30:00+02:00'),
];
