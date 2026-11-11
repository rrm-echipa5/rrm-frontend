// Tipurile JSON din contractul API (rrm-api.yaml). Numele câmpurilor sunt cele din API (camelCase).

/** Eroarea de validare a unui câmp (`FieldError`). */
export interface FieldError {
  field: string;
  message: string;
}

/** Corpul unei erori `application/problem+json` (`Problem`, RFC 9457). */
export interface Problem {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  instance?: string;
  timestamp?: string;
  errors?: FieldError[];
}

/** Răspunsul `GET /api/health`. */
export interface HealthStatus {
  status: 'ok';
  database: 'ok' | 'unavailable';
}
