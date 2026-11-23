import type { Certification, ProjectBudget, UsageRuleSummary } from '../../api/types';
import { requestChecks } from './requestChecks';

const RULE: UsageRuleSummary = {
  minDurationMinutes: 30,
  maxDurationMinutes: 240,
  breakBetweenMinutes: 15,
  checkInDeadlineMinutes: 15,
  requiredCertificationLevel: 2,
};

const CERT: Certification = {
  id: 1,
  user: { id: 3, name: 'Ana Popescu' },
  resource: { id: 7, name: 'Microscop electronic SEM' },
  level: 2,
  status: 'ACTIVE',
  grantedAt: '2026-10-01T10:00:00+03:00',
  grantedBy: { id: 4, name: 'Mihai Ionescu' },
};

const PROJECT: ProjectBudget = {
  id: 1,
  title: 'Nanostructuri pentru senzori de gaz',
  team: { id: 1, name: 'Laboratorul de Nanomateriale' },
  budgetHours: 120,
  usedHours: 119,
  remainingHours: 1,
};

function range(start: string, end: string): { start: string; end: string } {
  return { start: `2026-11-12T${start}:00+02:00`, end: `2026-11-12T${end}:00+02:00` };
}

describe('requestChecks', () => {
  it('trec toate verificările pentru o cerere în reguli', () => {
    const checks = requestChecks({
      resourceId: 7,
      rule: RULE,
      certifications: [CERT],
      range: range('14:00', '15:00'),
      project: PROJECT,
    });
    expect(checks.map((check) => check.ok)).toEqual([true, true, true]);
  });

  it('cer certificarea de nivelul resursei, validă, pentru aceeași resursă', () => {
    const input = { resourceId: 7, rule: RULE, range: range('14:00', '15:00'), project: null };
    const revoked = { ...CERT, status: 'REVOKED' as const };
    const lower = { ...CERT, level: 1 };
    const other = { ...CERT, resource: { id: 9, name: 'Microscop electronic TEM' } };

    for (const certifications of [[revoked], [lower], [other], []]) {
      expect(requestChecks({ ...input, certifications })[0]?.ok).toBe(false);
    }
  });

  it('verifică durata și bugetul, iar fără proiect bugetul rămâne de verificat', () => {
    const base = { resourceId: 7, rule: RULE, certifications: [CERT] };
    const tooShort = requestChecks({ ...base, range: range('14:00', '14:15'), project: PROJECT });
    const overBudget = requestChecks({ ...base, range: range('14:00', '16:00'), project: PROJECT });
    const noProject = requestChecks({ ...base, range: range('14:00', '15:00'), project: null });

    expect(tooShort[1]?.ok).toBe(false);
    expect(overBudget[2]).toMatchObject({
      ok: false,
      label: 'Proiectul mai are doar 1 h, iar cererea are 2 h',
    });
    expect(noProject[2]?.ok).toBeNull();
  });
});
