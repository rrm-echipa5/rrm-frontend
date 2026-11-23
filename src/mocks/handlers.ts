import { http, HttpResponse } from 'msw';

import type { Problem, ResourceDetail, ResourceWriteRequest } from '../api/types';
import { availableResources } from './availabilityMocks';
import { resourceCalendar } from './calendarMocks';
import { catalogMoment } from './mockClock';
import { requestHandlers } from './requestHandlers';
import { reservationHandlers } from './reservationHandlers';
import { catalogPage, type CatalogQuery, myCertifications, resourceDetail } from './resourceMocks';
import {
  createResource,
  deleteResource,
  readWriteRequest,
  updateResource,
  type WriteResult,
} from './resourceWriteMocks';
import { SEED_CATEGORIES } from './seedData';
import { currentUserProfile } from './userMocks';

function problem(status: number, code: string, detail: string): HttpResponse<Problem> {
  return problemResponse({
    title: status === 400 ? 'Bad Request' : 'Not Found',
    status,
    code,
    detail,
  });
}

function problemResponse(body: Problem): HttpResponse<Problem> {
  return HttpResponse.json(
    { type: 'about:blank', ...body },
    { status: body.status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

/** Răspunsul unei operații de scriere: fișa resursei sau eroarea. */
function writeResponse(
  result: WriteResult,
  status: number,
): HttpResponse<Problem | ResourceDetail> {
  if (!result.ok) {
    return problemResponse(result.problem);
  }
  const detail = resourceDetail(result.resource.id, catalogMoment());
  return detail === null
    ? new HttpResponse(null, { status: 204 })
    : HttpResponse.json(detail, { status });
}

async function writeRequest(request: Request): Promise<ResourceWriteRequest | null> {
  const json: unknown = await request.json().catch(() => null);
  return readWriteRequest(json);
}

const INVALID_BODY = (): HttpResponse<Problem> =>
  problem(400, 'VALIDATION_FAILED', 'Corpul cererii nu respectă schema ResourceWriteRequest.');

function integerParam(params: URLSearchParams, name: string, fallback: number): number | null {
  const raw = params.get(name);
  if (raw === null) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function validatePaging(page: number, size: number): string | null {
  if (page < 0) {
    return 'Parametrul page pornește de la 0.';
  }
  if (size < 1 || size > 100) {
    return 'Parametrul size trebuie să fie între 1 și 100.';
  }
  return null;
}

/** Citește parametrii din `GET /resources`, cu limitele din `rrm-api.yaml`. */
function parseCatalogQuery(url: URL): CatalogQuery | string {
  const params = url.searchParams;
  const page = integerParam(params, 'page', 0);
  const size = integerParam(params, 'size', 20);
  const categoryId = integerParam(params, 'categoryId', 0);
  const q = params.get('q') ?? '';
  if (page === null || size === null || categoryId === null) {
    return 'Parametrii page, size și categoryId trebuie să fie numere întregi.';
  }
  const invalid =
    validatePaging(page, size) ??
    (q.length > 100 ? 'Textul q are maximum 100 de caractere.' : null);
  if (invalid !== null) {
    return invalid;
  }
  return {
    page,
    size,
    categoryId: categoryId === 0 ? null : categoryId,
    statuses: params.getAll('status'),
    q,
    tags: params.getAll('tag'),
    sort: params.get('sort') ?? 'name,asc',
  };
}

/** Handlerele MSW pentru endpoint-urile implementate în mock, în ordinea din `rrm-api.yaml`. */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok', database: 'ok' })),

  http.get('/api/users/me', () => HttpResponse.json(currentUserProfile())),

  http.get('/api/resource-categories', () => HttpResponse.json(SEED_CATEGORIES)),

  http.get('/api/resources', ({ request }) => {
    const query = parseCatalogQuery(new URL(request.url));
    if (typeof query === 'string') {
      return problem(400, 'VALIDATION_FAILED', query);
    }
    return HttpResponse.json(catalogPage(query, catalogMoment()));
  }),

  // Înaintea rutei `/api/resources/:resourceId`, care altfel ar citi „available” ca id.
  http.get('/api/resources/available', ({ request }) => {
    const url = new URL(request.url);
    const query = parseCatalogQuery(url);
    if (typeof query === 'string') {
      return problem(400, 'VALIDATION_FAILED', query);
    }
    const params = url.searchParams;
    const result = availableResources(
      query,
      params.get('start'),
      params.get('end'),
      catalogMoment(),
    );
    return result.ok
      ? HttpResponse.json(result.page)
      : problem(400, 'VALIDATION_FAILED', result.detail);
  }),

  http.get('/api/resources/:resourceId', ({ params }) => {
    const resourceId = Number(params['resourceId']);
    const detail = Number.isInteger(resourceId)
      ? resourceDetail(resourceId, catalogMoment())
      : null;
    if (detail === null) {
      return problem(404, 'NOT_FOUND', `Resursa ${String(params['resourceId'])} nu există.`);
    }
    return HttpResponse.json(detail);
  }),

  http.post('/api/resources', async ({ request }) => {
    const body = await writeRequest(request);
    return body === null
      ? INVALID_BODY()
      : writeResponse(createResource(body, catalogMoment()), 201);
  }),

  http.put('/api/resources/:resourceId', async ({ request, params }) => {
    const body = await writeRequest(request);
    const resourceId = Number(params['resourceId']);
    return body === null
      ? INVALID_BODY()
      : writeResponse(updateResource(resourceId, body, catalogMoment()), 200);
  }),

  http.delete('/api/resources/:resourceId', ({ params }) => {
    const result = deleteResource(Number(params['resourceId']), catalogMoment());
    return result.ok ? new HttpResponse(null, { status: 204 }) : problemResponse(result.problem);
  }),

  http.get('/api/resources/:resourceId/calendar', ({ request, params }) => {
    const url = new URL(request.url);
    const result = resourceCalendar(
      Number(params['resourceId']),
      url.searchParams.get('start'),
      url.searchParams.get('end'),
    );
    if (!result.ok) {
      const code = result.status === 404 ? 'NOT_FOUND' : 'VALIDATION_FAILED';
      return problem(result.status, code, result.detail);
    }
    return HttpResponse.json(result.calendar);
  }),

  http.get('/api/resources/:resourceId/files/:fileId', ({ params }) =>
    problem(
      404,
      'NOT_FOUND',
      `Fișierul ${String(params['fileId'])} nu are conținut în datele mock; apare doar cu backend-ul.`,
    ),
  ),

  http.get('/api/users/me/certifications', () =>
    HttpResponse.json(myCertifications(catalogMoment())),
  ),

  ...reservationHandlers,

  ...requestHandlers,
];
