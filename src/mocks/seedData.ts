// Datele de test din `rrm-backend/db/seed.sql` (KAN-56), aceleași ca în prototipurile Figma și în
// exemplele din `rrm-api.yaml`. Se păstrează identice cu seed-ul, ca integrarea cu backend-ul să
// schimbe doar sursa datelor. Câmpurile pe care seed-ul le lasă pe valoarea implicită din baza de
// date (`created_at`, `uploaded_at`) au aici momentul încărcării datelor de test.

import type { ApprovalFlow, ResourceCategory, UserRef } from '../api/types';

/** Enumerarea `Rol` din `rrm-api.yaml`. */
export type Role = 'STUDENT' | 'RESEARCHER' | 'RESOURCE_ADMIN' | 'SYSTEM_ADMIN';

/** Un rând din tabelul `users`, fără parolă și secretul 2FA. */
export interface SeedUser extends UserRef {
  role: Role;
  twoFactorEnabled: boolean;
}

/** Momentul la care sunt create rândurile fără dată explicită în seed. */
export const SEED_LOADED_AT = '2026-11-08T19:00:00+02:00';

/** Tabelul `users`. */
export const SEED_USERS: SeedUser[] = [
  {
    id: 1,
    name: 'Elena Marin',
    email: 'elena.marin@usv.ro',
    role: 'SYSTEM_ADMIN',
    twoFactorEnabled: true,
  },
  {
    id: 2,
    name: 'Andrei Rusu',
    email: 'andrei.rusu@usv.ro',
    role: 'RESEARCHER',
    twoFactorEnabled: true,
  },
  {
    id: 3,
    name: 'Ana Popescu',
    email: 'ana.popescu@student.usv.ro',
    role: 'STUDENT',
    twoFactorEnabled: true,
  },
  {
    id: 4,
    name: 'Mihai Ionescu',
    email: 'mihai.ionescu@usv.ro',
    role: 'RESOURCE_ADMIN',
    twoFactorEnabled: false,
  },
  {
    id: 5,
    name: 'Ioana Dumitru',
    email: 'ioana.dumitru@student.usv.ro',
    role: 'STUDENT',
    twoFactorEnabled: false,
  },
  {
    id: 6,
    name: 'Radu Stan',
    email: 'radu.stan@usv.ro',
    role: 'RESEARCHER',
    twoFactorEnabled: false,
  },
  {
    id: 7,
    name: 'Vlad Popa',
    email: 'vlad.popa@usv.ro',
    role: 'RESOURCE_ADMIN',
    twoFactorEnabled: false,
  },
];

/** Tabelul `resource_categories`. */
export const SEED_CATEGORIES: ResourceCategory[] = [
  { id: 1, code: 'HARDWARE', name: 'Echipamente hardware' },
  { id: 2, code: 'HPC', name: 'Calcul de înaltă performanță' },
  { id: 3, code: 'ROOM', name: 'Săli și spații' },
  { id: 4, code: 'MEASUREMENT_INSTRUMENT', name: 'Instrumente de măsură' },
];

/** Un rând din tabelul `resources`, împreună cu `usage_rules`. */
export interface SeedResource {
  id: number;
  name: string;
  categoryId: number;
  location: string;
  description: string;
  specifications: Record<string, string>;
  tags: string[];
  approvalFlow: ApprovalFlow;
  administratorId: number;
  checkInQrCode: string;
  rule: {
    minDurationMinutes: number;
    maxDurationMinutes: number;
    breakBetweenMinutes: number;
    checkInDeadlineMinutes: number;
    requiredCertificationLevel: number | null;
  };
}

/** Tabelele `resources` și `usage_rules`; toate resursele pornesc cu starea `ACTIVE`. */
export const SEED_RESOURCES: SeedResource[] = [
  {
    id: 7,
    name: 'Microscop electronic SEM',
    categoryId: 1,
    location: 'Corp C, sala C204',
    description: 'Microscop electronic cu baleiaj, cu detector EDS pentru analiză elementală.',
    specifications: { Rezoluție: '1,2 nm la 30 kV', Detector: 'EDS Oxford Ultim Max 65' },
    tags: ['microscopie', 'imagistică'],
    approvalFlow: 'COORDINATOR_AND_ADMIN',
    administratorId: 4,
    checkInQrCode: 'RRM-R7-6f1c2a',
    rule: {
      minDurationMinutes: 30,
      maxDurationMinutes: 240,
      breakBetweenMinutes: 15,
      checkInDeadlineMinutes: 15,
      requiredCertificationLevel: 2,
    },
  },
  {
    id: 9,
    name: 'Microscop electronic TEM',
    categoryId: 1,
    location: 'Corp C, sala C206',
    description: 'Microscop electronic prin transmisie, 200 kV.',
    specifications: { Tensiune: '200 kV', Rezoluție: '0,19 nm' },
    tags: ['microscopie', 'imagistică'],
    approvalFlow: 'COORDINATOR_AND_ADMIN',
    administratorId: 4,
    checkInQrCode: 'RRM-R9-b37e90',
    rule: {
      minDurationMinutes: 60,
      maxDurationMinutes: 240,
      breakBetweenMinutes: 30,
      checkInDeadlineMinutes: 15,
      requiredCertificationLevel: 3,
    },
  },
  {
    id: 10,
    name: 'Cluster HPC - nod GPU',
    categoryId: 2,
    location: 'Centrul de date USV',
    description: 'Nod de calcul cu 4 GPU-uri pentru simulări și antrenarea modelelor.',
    specifications: { GPU: '4 x NVIDIA L40S', RAM: '512 GB' },
    tags: ['hpc', 'gpu', 'simulare'],
    approvalFlow: 'AUTO',
    administratorId: 7,
    checkInQrCode: 'RRM-R10-0a4d55',
    rule: {
      minDurationMinutes: 60,
      maxDurationMinutes: 720,
      breakBetweenMinutes: 0,
      checkInDeadlineMinutes: 30,
      requiredCertificationLevel: null,
    },
  },
  {
    id: 11,
    name: 'Sala de seminar C105',
    categoryId: 3,
    location: 'Corp C, sala C105',
    description: 'Sală pentru 30 de persoane, cu videoproiector.',
    specifications: { Capacitate: '30 de locuri' },
    tags: ['sală', 'prezentări'],
    approvalFlow: 'AUTO',
    administratorId: 7,
    checkInQrCode: 'RRM-R11-91c7e2',
    rule: {
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      breakBetweenMinutes: 0,
      checkInDeadlineMinutes: 15,
      requiredCertificationLevel: null,
    },
  },
  {
    id: 12,
    name: 'Spectrometru Raman',
    categoryId: 4,
    location: 'Corp C, sala C210',
    description: 'Spectrometru Raman confocal, lasere de 532 nm și 785 nm.',
    specifications: { Lasere: '532 nm, 785 nm' },
    tags: ['spectroscopie'],
    approvalFlow: 'COORDINATOR',
    administratorId: 4,
    checkInQrCode: 'RRM-R12-c45b18',
    rule: {
      minDurationMinutes: 30,
      maxDurationMinutes: 120,
      breakBetweenMinutes: 10,
      checkInDeadlineMinutes: 15,
      requiredCertificationLevel: 1,
    },
  },
];
