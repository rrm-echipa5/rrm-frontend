import { formatDayRange } from './formatters';

describe('formatDayRange', () => {
  // ICU scrie separatorul diferit (fără spații, cu spații înguste U+2009 sau `-`) în funcție de
  // versiune și de luni; rezultatul trebuie să fie mereu cu „ – ” și spații obișnuite.
  it.each([
    ['2026-11-09', '2026-11-13', '9 – 13 nov. 2026'],
    ['2026-11-30', '2026-12-04', '30 nov. – 4 dec. 2026'],
    ['2026-12-28', '2027-01-01', '28 dec. 2026 – 1 ian. 2027'],
  ])('%s - %s → „%s”', (start, end, expected) => {
    expect(formatDayRange(start, end)).toBe(expected);
  });
});
