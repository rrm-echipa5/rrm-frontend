// Verificările afișate înainte de trimiterea cererii (wireframe-ul 4.2, pasul 3): certificarea,
// durata și bugetul de ore. Serverul le refă la trimitere (KAN-73); aici utilizatorul vede din timp
// de ce cererea ar fi respinsă.

import dayjs from 'dayjs';

import type { Certification, ProjectBudget, UsageRuleSummary } from '../../api/types';
import { formatMinutes } from '../resources/formatters';
import type { TimeRange } from './calendarSelection';

/** O verificare: `ok` este `null` cât timp nu se poate face (de exemplu, fără proiect ales). */
export interface RequestCheck {
  key: 'certification' | 'duration' | 'budget';
  ok: boolean | null;
  label: string;
}

/** Datele de care au nevoie verificările. */
export interface RequestCheckInput {
  resourceId: number;
  rule: UsageRuleSummary;
  certifications: Certification[];
  range: TimeRange;
  project: ProjectBudget | null;
}

/** Orele intervalului, cu zecimale (90 de minute = 1,5 h). */
export function rangeHours(range: TimeRange): number {
  return dayjs(range.end).diff(dayjs(range.start), 'minute') / 60;
}

function formatHours(hours: number): string {
  return `${hours.toLocaleString('ro-RO', { maximumFractionDigits: 2 })} h`;
}

function certificationCheck({ resourceId, rule, certifications }: RequestCheckInput): RequestCheck {
  const required = rule.requiredCertificationLevel ?? null;
  if (required === null) {
    return { key: 'certification', ok: true, label: 'Resursa nu cere certificare' };
  }
  const valid = certifications.some(
    (cert) => cert.resource.id === resourceId && cert.status === 'ACTIVE' && cert.level >= required,
  );
  return valid
    ? {
        key: 'certification',
        ok: true,
        label: `Certificare pentru această resursă: validă (nivel ${String(required)} cerut)`,
      }
    : {
        key: 'certification',
        ok: false,
        label: `Nu ai certificarea de nivel ${String(required)} cerută de resursă`,
      };
}

function durationCheck({ rule, range }: RequestCheckInput): RequestCheck {
  const minutes = dayjs(range.end).diff(dayjs(range.start), 'minute');
  const limits = `${formatMinutes(rule.minDurationMinutes)} – ${formatMinutes(rule.maxDurationMinutes)}`;
  const ok = minutes >= rule.minDurationMinutes && minutes <= rule.maxDurationMinutes;
  return {
    key: 'duration',
    ok,
    label: ok
      ? `Durata se încadrează în regulile resursei (${limits})`
      : `Durata de ${formatMinutes(minutes)} nu se încadrează în regulile resursei (${limits})`,
  };
}

function budgetCheck({ range, project }: RequestCheckInput): RequestCheck {
  if (project === null) {
    return { key: 'budget', ok: null, label: 'Alege proiectul ca să verificăm bugetul de ore' };
  }
  const hours = rangeHours(range);
  const ok = project.remainingHours >= hours;
  return {
    key: 'budget',
    ok,
    label: ok
      ? `Bugetul proiectului acoperă cererea (${formatHours(hours)} din ${formatHours(project.remainingHours)} rămase)`
      : `Proiectul mai are doar ${formatHours(project.remainingHours)}, iar cererea are ${formatHours(hours)}`,
  };
}

/** Verificările automate, în ordinea din cazul de utilizare 2.1. */
export function requestChecks(input: RequestCheckInput): RequestCheck[] {
  return [certificationCheck(input), durationCheck(input), budgetCheck(input)];
}
