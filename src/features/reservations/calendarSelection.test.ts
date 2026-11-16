import type { CalendarEntry, UsageRuleSummary } from '../../api/types';
import { rangeFromSlot, selectionError, weekRange } from './calendarSelection';

// Regulile microscopului SEM din datele de test.
const SEM_RULES: UsageRuleSummary = {
  minDurationMinutes: 30,
  maxDurationMinutes: 240,
  breakBetweenMinutes: 15,
  checkInDeadlineMinutes: 15,
  requiredCertificationLevel: 2,
};

// Rezervarea 1046 a lui Andrei Rusu: vineri, 13 noiembrie 2026, 09:00-11:00.
const BOOKED: CalendarEntry = {
  start: '2026-11-13T09:00:00+02:00',
  end: '2026-11-13T11:00:00+02:00',
  type: 'CONFIRMED',
  own: false,
  reservationId: null,
};

const NOW = new Date('2026-11-11T12:00:00+02:00');

function range(start: string, end: string): { start: string; end: string } {
  return { start: `2026-11-13T${start}:00+02:00`, end: `2026-11-13T${end}:00+02:00` };
}

describe('weekRange', () => {
  it('întoarce săptămâna de luni până lunea următoare', () => {
    const week = weekRange('2026-11-15');
    expect(new Date(week.start)).toEqual(new Date(2026, 10, 9));
    expect(new Date(week.end)).toEqual(new Date(2026, 10, 16));
  });
});

describe('selectionError', () => {
  it('acceptă un interval liber cu durata permisă', () => {
    expect(selectionError(range('13:00', '15:00'), [BOOKED], SEM_RULES, NOW)).toBeNull();
  });

  it('respinge un interval mai scurt decât minimul sau mai lung decât maximul', () => {
    expect(selectionError(range('13:00', '13:15'), [], SEM_RULES, NOW)).toMatch(/între 30 min/);
    expect(selectionError(range('12:00', '17:00'), [], SEM_RULES, NOW)).toMatch(/și 4 h/);
  });

  it('respinge un interval care se suprapune cu unul ocupat', () => {
    expect(selectionError(range('10:30', '12:00'), [BOOKED], SEM_RULES, NOW)).toMatch(
      /se suprapune/,
    );
  });

  it('cere pauza dintre rezervări', () => {
    expect(selectionError(range('11:00', '12:00'), [BOOKED], SEM_RULES, NOW)).toMatch(/pauză/);
    expect(selectionError(range('11:15', '12:00'), [BOOKED], SEM_RULES, NOW)).toBeNull();
  });

  it('respinge un interval care a început deja', () => {
    const past = { start: '2026-11-10T10:00:00+02:00', end: '2026-11-10T11:00:00+02:00' };
    expect(selectionError(past, [], SEM_RULES, NOW)).toMatch(/a început deja/);
  });
});

describe('rangeFromSlot', () => {
  it('propune durata minimă de la începutul slotului', () => {
    const proposed = rangeFromSlot('2026-11-13 14:00:00', SEM_RULES);
    expect(new Date(proposed.end).getTime() - new Date(proposed.start).getTime()).toBe(30 * 60_000);
  });
});
