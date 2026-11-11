import type { FieldError, HealthStatus, Problem } from './types';

/** Prefixul API-ului; în dezvoltare, Vite trimite `/api` către backend-ul local. */
export const API_BASE_URL = '/api';

/** Eroare întoarsă de API, cu corpul `application/problem+json` (sau un echivalent local). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code;
    this.fieldErrors = problem.errors ?? [];
  }
}

function isProblem(body: unknown): body is Problem {
  return typeof body === 'object' && body !== null && 'code' in body && 'status' in body;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (isProblem(body)) {
    return new ApiError(body);
  }
  return new ApiError({
    title: response.statusText,
    status: response.status,
    code: 'UNEXPECTED_RESPONSE',
    detail: `Serverul a răspuns cu ${String(response.status)} ${response.statusText}.`,
  });
}

/**
 * Trimite o cerere JSON la API și întoarce corpul răspunsului.
 *
 * @throws ApiError dacă serverul răspunde cu o eroare sau nu poate fi contactat.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError({
      title: 'Network Error',
      status: 0,
      code: 'NETWORK_ERROR',
      detail: 'Serverul nu poate fi contactat. Verifică dacă backend-ul rulează.',
    });
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** `GET /api/health`: starea serverului și a bazei de date. */
export function getHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/health');
}
