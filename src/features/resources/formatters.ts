// Formatarea valorilor din API pentru interfață, în limba română și în fusul orar al utilizatorului.

const DATE_FORMAT = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/** O durată în minute, ca în prototip: „30 min”, „4 h”, „1 h 30 min”. */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest} min`;
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** O dată calendaristică (`2027-10-31` sau ISO 8601), de forma „31 octombrie 2027”. */
export function formatDate(value: string): string {
  // O dată fără oră se citește ca zi locală, nu ca miezul nopții în UTC.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return DATE_FORMAT.format(date);
}

/** Un moment ISO 8601, de forma „20 noiembrie, 08:00”. */
export function formatDateTime(value: string): string {
  return DATE_TIME_FORMAT.format(new Date(value));
}

const WEEKDAY_TIME_FORMAT = new Intl.DateTimeFormat('ro-RO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Un moment cu ziua săptămânii, de forma „joi, 12 noiembrie, 14:00”. */
export function formatWeekdayTime(value: string): string {
  return WEEKDAY_TIME_FORMAT.format(new Date(value)).replace(' la ', ', ');
}

/** Un interval de zile, ca în calendarul din wireframe: „9 – 13 nov. 2026”. */
export function formatDayRange(start: string, end: string): string {
  const range = SHORT_DATE_FORMAT.formatRange(new Date(start), new Date(end));
  return range.replace('–', ' – ').replace(/\s+/g, ' ');
}

/** Mărimea unui fișier, de forma „2,4 MB”. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} MB`;
}
