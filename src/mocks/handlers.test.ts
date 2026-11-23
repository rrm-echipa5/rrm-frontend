import type {
  CurrentUser,
  Problem,
  ResourceCalendar,
  ResourceDetail,
  ResourceSummaryPage,
  ResourceWriteRequest,
} from '../api/types';
import { startMockServer } from '../test/mockServer';
import { SEED_LOADED_AT } from './seedData';

startMockServer();

async function getPage(path: string): Promise<ResourceSummaryPage> {
  const response = await fetch(path);
  return (await response.json()) as ResourceSummaryPage;
}

describe('handlerele mock pentru catalog', () => {
  it('paginează rezultatele, cu page de la 0', async () => {
    const body = await getPage('/api/resources?page=2&size=2');
    expect(body.page).toEqual({ page: 2, size: 2, totalElements: 5, totalPages: 3 });
    expect(body.content.map((resource) => resource.id)).toEqual([12]);
  });

  it('sortează după câmpul și direcția din parametrul sort', async () => {
    const body = await getPage('/api/resources?sort=name,desc&size=2');
    expect(body.content.map((resource) => resource.name)).toEqual([
      'Spectrometru Raman',
      'Sala de seminar C105',
    ]);
  });

  it('caută textul și în specificații, fără să țină cont de majuscule', async () => {
    const body = await getPage('/api/resources?q=nvidia');
    expect(body.content.map((resource) => resource.id)).toEqual([10]);
  });

  it('întoarce 400 în format problem+json pentru o mărime de pagină invalidă', async () => {
    const response = await fetch('/api/resources?size=500');
    const body = (await response.json()) as Problem;
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    expect(body.code).toBe('VALIDATION_FAILED');
  });
});

const NEW_RESOURCE: ResourceWriteRequest = {
  name: 'Imprimantă 3D',
  categoryId: 1,
  location: 'Corp C, sala C110',
  specifications: { Material: 'PLA' },
  tags: ['printare'],
  approvalFlow: 'AUTO',
};

function send(method: string, path: string, body?: ResourceWriteRequest): Promise<Response> {
  return fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function problemCode(response: Response): Promise<string> {
  return ((await response.json()) as Problem).code;
}

describe('handlerele mock pentru adăugare, modificare și ștergere', () => {
  it('administratorul de resurse adaugă o resursă, cu regulile implicite', async () => {
    const response = await send('POST', '/api/resources', NEW_RESOURCE);
    const created = (await response.json()) as ResourceDetail;

    expect(response.status).toBe(201);
    expect(created).toMatchObject({ id: 13, status: 'ACTIVE', administrator: { id: 4 } });
    expect(created.usageRule).toMatchObject({ minDurationMinutes: 30, maxDurationMinutes: 240 });
    expect((await getPage('/api/resources?q=Imprimant')).page.totalElements).toBe(1);
  });

  it('un student nu poate adăuga resurse (403 ACCESS_DENIED)', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
    const response = await send('POST', '/api/resources', NEW_RESOURCE);
    expect(response.status).toBe(403);
    expect(await problemCode(response)).toBe('ACCESS_DENIED');
  });

  it('întoarce erorile pe câmpuri pentru o categorie inexistentă', async () => {
    const response = await send('POST', '/api/resources', { ...NEW_RESOURCE, categoryId: 99 });
    const body = (await response.json()) as Problem;
    expect(response.status).toBe(400);
    expect(body.errors).toEqual([{ field: 'categoryId', message: 'Categoria nu există.' }]);
  });

  it('administratorul modifică doar resursele lui', async () => {
    const own = await send('PUT', '/api/resources/7', { ...NEW_RESOURCE, name: 'SEM nou' });
    expect(own.status).toBe(200);
    expect(((await own.json()) as ResourceDetail).name).toBe('SEM nou');

    const other = await send('PUT', '/api/resources/10', NEW_RESOURCE);
    expect(other.status).toBe(403);
  });

  it('la prima modificare, o resursă din datele de test își păstrează createdAt', async () => {
    const response = await send('PUT', '/api/resources/7', { ...NEW_RESOURCE, name: 'SEM nou' });
    const updated = (await response.json()) as ResourceDetail;
    const fetched = (await (await fetch('/api/resources/7')).json()) as ResourceDetail;

    for (const detail of [updated, fetched]) {
      expect(detail.createdAt).toBe(SEED_LOADED_AT);
      expect(Number.isNaN(new Date(detail.createdAt).getTime())).toBe(false);
    }
  });

  it('doar administratorul de sistem scoate o resursă din catalog', async () => {
    expect((await send('DELETE', '/api/resources/11')).status).toBe(403);

    vi.stubEnv('VITE_MOCK_USER_ID', '1');
    expect((await send('DELETE', '/api/resources/11')).status).toBe(204);
    expect((await fetch('/api/resources/11')).status).toBe(404);
  });

  it('refuză ștergerea cât timp resursa are rezervări viitoare', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-12T09:00:00+02:00'));
    vi.stubEnv('VITE_MOCK_USER_ID', '1');

    const response = await send('DELETE', '/api/resources/7');
    expect(response.status).toBe(409);
    expect(await problemCode(response)).toBe('RESOURCE_HAS_RESERVATIONS');
    vi.useRealTimers();
  });
});

describe('handlerul mock pentru calendarul resursei', () => {
  const WEEK = 'start=2026-11-09T00:00:00%2B02:00&end=2026-11-16T00:00:00%2B02:00';

  it('întoarce intervalele ocupate ale săptămânii, cu cele proprii marcate', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
    const response = await fetch(`/api/resources/7/calendar?${WEEK}`);
    const body = (await response.json()) as ResourceCalendar;

    expect(body.rules.minDurationMinutes).toBe(30);
    expect(body.entries).toEqual([
      expect.objectContaining({ type: 'PENDING', own: true, reservationId: 1042 }),
      expect.objectContaining({ type: 'CONFIRMED', own: false, reservationId: null }),
    ]);
  });

  it('include mentenanța încheiată din săptămâna ei', async () => {
    const response = await fetch(
      '/api/resources/7/calendar?start=2026-11-02T00:00:00%2B02:00&end=2026-11-09T00:00:00%2B02:00',
    );
    const body = (await response.json()) as ResourceCalendar;
    expect(body.entries.map((entry) => entry.type)).toEqual(['MAINTENANCE']);
  });

  it('respinge un interval mai lung de 31 de zile', async () => {
    const response = await fetch(
      '/api/resources/7/calendar?start=2026-11-01T00:00:00Z&end=2026-12-15T00:00:00Z',
    );
    expect(response.status).toBe(400);
  });
});

describe('handlerele mock pentru server și utilizatorul curent', () => {
  it('răspunde la GET /api/health', async () => {
    const response = await fetch('/api/health');
    expect(await response.json()).toEqual({ status: 'ok', database: 'ok' });
  });

  it('întoarce utilizatorul din VITE_MOCK_USER_ID, cu rolul și echipele', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '5');
    const user = (await (await fetch('/api/users/me')).json()) as CurrentUser;

    expect(user).toMatchObject({ id: 5, name: 'Ioana Dumitru', role: 'STUDENT' });
    expect(user.teams.map((team) => team.name)).toEqual([
      'Laboratorul de Nanomateriale',
      'Grupul de Calcul Științific',
    ]);
    expect(user.teams[0]?.coordinator).toMatchObject({ id: 2, name: 'Andrei Rusu' });
  });
});
