// Adăugarea, modificarea și scoaterea din catalog, cu regulile din backend (KAN-88): adaugă doar
// RESOURCE_ADMIN și SYSTEM_ADMIN, modifică administratorul resursei sau SYSTEM_ADMIN, iar
// administratorul îl schimbă și resursa o scoate din catalog doar SYSTEM_ADMIN.

import type {
  ApprovalFlow,
  FieldError,
  Problem,
  ReservationStatus,
  ResourceWriteRequest,
} from '../api/types';
import {
  allReservations,
  currentUser,
  findResource,
  findUser,
  insertResource,
  removeResource,
  replaceResource,
} from './mockDb';
import { SEED_CATEGORIES, type SeedResource } from './seedData';

/** Rezultatul unei operații: resursa salvată sau eroarea `application/problem+json`. */
export type WriteResult = { ok: true; resource: SeedResource } | { ok: false; problem: Problem };

const APPROVAL_FLOWS: ApprovalFlow[] = ['AUTO', 'COORDINATOR', 'COORDINATOR_AND_ADMIN'];
const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  'PENDING',
  'PENDING_ADMIN',
  'CONFIRMED',
  'IN_PROGRESS',
];

/** Regulile implicite la creare, din descrierea `POST /resources` din `rrm-api.yaml`. */
const DEFAULT_RULE: SeedResource['rule'] = {
  minDurationMinutes: 30,
  maxDurationMinutes: 240,
  breakBetweenMinutes: 0,
  checkInDeadlineMinutes: 15,
  requiredCertificationLevel: null,
};

function fail(status: number, code: string, detail: string, errors?: FieldError[]): WriteResult {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
  };
  const problem: Problem = { title: titles[status] ?? 'Error', status, code, detail };
  return { ok: false, problem: errors ? { ...problem, errors } : problem };
}

const forbidden = (detail: string): WriteResult => fail(403, 'ACCESS_DENIED', detail);

function invalid(errors: FieldError[]): WriteResult {
  return fail(400, 'VALIDATION_FAILED', 'Cererea conține câmpuri invalide.', errors);
}

function isSystemAdmin(): boolean {
  return currentUser().role === 'SYSTEM_ADMIN';
}

/** Verifică corpul cererii cu limitele din `ResourceWriteRequest`; întoarce erorile pe câmpuri. */
function validate(body: ResourceWriteRequest, administratorId: number): FieldError[] {
  const errors: FieldError[] = [];
  const name = body.name.trim();
  if (name.length < 2 || name.length > 150) {
    errors.push({ field: 'name', message: 'Denumirea are între 2 și 150 de caractere.' });
  }
  if (!SEED_CATEGORIES.some((category) => category.id === body.categoryId)) {
    errors.push({ field: 'categoryId', message: 'Categoria nu există.' });
  }
  if ((body.location ?? '').trim().length > 200) {
    errors.push({ field: 'location', message: 'Locația are cel mult 200 de caractere.' });
  }
  if (!APPROVAL_FLOWS.includes(body.approvalFlow)) {
    errors.push({ field: 'approvalFlow', message: 'Fluxul de aprobare nu este valid.' });
  }
  if (body.tags.length > 20 || body.tags.some((tag) => tag.trim().length > 40)) {
    errors.push({ field: 'tags', message: 'Cel mult 20 de tag-uri, de cel mult 40 de caractere.' });
  }
  if (findUser(administratorId) === undefined) {
    errors.push({ field: 'administratorId', message: 'Utilizatorul nu există.' });
  }
  return errors;
}

/** Câmpurile descriptive din cerere, ca `_apply` din serviciul backend. */
function applyRequest(
  body: ResourceWriteRequest,
): Omit<SeedResource, 'id' | 'administratorId' | 'checkInQrCode' | 'rule'> {
  return {
    name: body.name.trim(),
    categoryId: body.categoryId,
    location: body.location?.trim() ?? '',
    description: body.description ?? '',
    specifications: { ...body.specifications },
    tags: [...new Set(body.tags.map((tag) => tag.trim()))],
    approvalFlow: body.approvalFlow,
  };
}

/** Corpul unei cereri de scriere, dacă are forma `ResourceWriteRequest`; altfel `null`. */
export function readWriteRequest(json: unknown): ResourceWriteRequest | null {
  if (typeof json !== 'object' || json === null) {
    return null;
  }
  const body = json as Partial<Record<keyof ResourceWriteRequest, unknown>>;
  const valid =
    typeof body.name === 'string' &&
    typeof body.categoryId === 'number' &&
    typeof body.approvalFlow === 'string' &&
    Array.isArray(body.tags) &&
    body.tags.every((tag) => typeof tag === 'string') &&
    typeof body.specifications === 'object' &&
    body.specifications !== null;
  return valid ? (json as ResourceWriteRequest) : null;
}

/** `POST /resources` */
export function createResource(body: ResourceWriteRequest, now: Date): WriteResult {
  const user = currentUser();
  if (user.role !== 'RESOURCE_ADMIN' && user.role !== 'SYSTEM_ADMIN') {
    return forbidden('Doar administratorii de resurse pot adăuga resurse în catalog.');
  }
  const administratorId = body.administratorId ?? user.id;
  if (administratorId !== user.id && !isSystemAdmin()) {
    return forbidden('Doar administratorul de sistem poate schimba administratorul resursei.');
  }
  const errors = validate(body, administratorId);
  if (errors.length > 0) {
    return invalid(errors);
  }
  const resource = insertResource(
    (id) => ({
      ...applyRequest(body),
      id,
      administratorId,
      checkInQrCode: `RRM-R${String(id)}-mock`,
      rule: { ...DEFAULT_RULE },
    }),
    now.toISOString(),
  );
  return { ok: true, resource };
}

/** `PUT /resources/{resourceId}` */
export function updateResource(
  resourceId: number,
  body: ResourceWriteRequest,
  now: Date,
): WriteResult {
  const resource = findResource(resourceId);
  if (resource === undefined) {
    return fail(404, 'NOT_FOUND', `Resursa ${String(resourceId)} nu există.`);
  }
  if (resource.administratorId !== currentUser().id && !isSystemAdmin()) {
    return forbidden('Doar administratorul resursei poate modifica fișa ei.');
  }
  const administratorId = body.administratorId ?? resource.administratorId;
  if (administratorId !== resource.administratorId && !isSystemAdmin()) {
    return forbidden('Doar administratorul de sistem poate schimba administratorul resursei.');
  }
  const errors = validate(body, administratorId);
  if (errors.length > 0) {
    return invalid(errors);
  }
  const updated = { ...resource, ...applyRequest(body), administratorId };
  replaceResource(updated, now.toISOString());
  return { ok: true, resource: updated };
}

/** `DELETE /resources/{resourceId}` */
export function deleteResource(resourceId: number, now: Date): WriteResult {
  const resource = findResource(resourceId);
  if (resource === undefined) {
    return fail(404, 'NOT_FOUND', `Resursa ${String(resourceId)} nu există.`);
  }
  if (!isSystemAdmin()) {
    return forbidden('Doar administratorul de sistem poate scoate resurse din catalog.');
  }
  const hasActive = allReservations().some(
    (reservation) =>
      reservation.resourceId === resourceId &&
      ACTIVE_RESERVATION_STATUSES.includes(reservation.status) &&
      new Date(reservation.end) > now,
  );
  if (hasActive) {
    return fail(
      409,
      'RESOURCE_HAS_RESERVATIONS',
      `Resursa „${resource.name}” are cereri în așteptare sau rezervări viitoare. ` +
        'Anulează-le înainte de a o scoate din catalog.',
    );
  }
  removeResource(resourceId);
  return { ok: true, resource };
}
