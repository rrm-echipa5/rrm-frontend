import type { UserRef } from '../api/types';
import { SEED_RESOURCES, SEED_USERS, type SeedResource, type SeedUser } from './seedData';

/**
 * Utilizatorul în numele căruia răspunde mock-ul, ca `RRM_DEMO_USER_ID` din backend până la
 * autentificare (KAN-64). Implicit, ca în backend, Mihai Ionescu (4, `RESOURCE_ADMIN`); cu
 * `VITE_MOCK_USER_ID=3` se vede catalogul ca Ana Popescu (student).
 */
export function currentUser(): SeedUser {
  const id = Number(import.meta.env.VITE_MOCK_USER_ID ?? 4);
  const user = findUser(id);
  if (user === undefined) {
    throw new Error(`VITE_MOCK_USER_ID=${String(id)} nu există în datele de test (1-7).`);
  }
  return user;
}

/** Utilizatorul cu id-ul dat din datele de test, sau `undefined`. */
export function findUser(userId: number): SeedUser | undefined {
  return SEED_USERS.find((candidate) => candidate.id === userId);
}

/** Referința la un utilizator (`UserRef`), fără rol. */
export function userRef(userId: number): UserRef {
  const user = findUser(userId);
  if (user === undefined) {
    throw new Error(`Utilizatorul ${String(userId)} lipsește din datele de test.`);
  }
  return { id: user.id, name: user.name, email: user.email ?? null };
}

/** Momentele de creare și modificare ale resurselor adăugate sau modificate în mock. */
export interface ResourceTimestamps {
  createdAt: string;
  updatedAt: string;
}

let resources: SeedResource[] = [];
let timestamps = new Map<number, ResourceTimestamps>();

/** Readuce resursele la datele de test (la pornire și între teste). */
export function resetMockDb(): void {
  resources = structuredClone(SEED_RESOURCES);
  timestamps = new Map();
}

resetMockDb();

/** Resursele din catalog (cele scoase din catalog nu mai apar). */
export function allResources(): readonly SeedResource[] {
  return resources;
}

/** Resursa cu id-ul dat, dacă e în catalog. */
export function findResource(resourceId: number): SeedResource | undefined {
  return resources.find((candidate) => candidate.id === resourceId);
}

/** Adaugă o resursă cu id-ul următor, ca secvența din baza de date. */
export function insertResource(build: (id: number) => SeedResource, now: string): SeedResource {
  const id = Math.max(0, ...resources.map((candidate) => candidate.id)) + 1;
  const created = build(id);
  resources = [...resources, created];
  timestamps.set(id, { createdAt: now, updatedAt: now });
  return created;
}

/** Înlocuiește datele unei resurse existente. */
export function replaceResource(resource: SeedResource, now: string): void {
  resources = resources.map((candidate) => (candidate.id === resource.id ? resource : candidate));
  const createdAt = timestamps.get(resource.id)?.createdAt;
  timestamps.set(resource.id, { createdAt: createdAt ?? '', updatedAt: now });
}

/** Scoate resursa din catalog (ștergerea logică din backend). */
export function removeResource(resourceId: number): void {
  resources = resources.filter((candidate) => candidate.id !== resourceId);
}

/** Momentele de creare și modificare, dacă resursa a fost adăugată sau modificată în mock. */
export function resourceTimestamps(resourceId: number): Partial<ResourceTimestamps> {
  return timestamps.get(resourceId) ?? {};
}
