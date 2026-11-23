import type {
  Problem,
  ProjectBudget,
  Reservation,
  ReservationCreateRequest,
  ReservationSummaryPage,
} from '../api/types';
import { startMockServer } from '../test/mockServer';

startMockServer();

/** Ziua de 12 noiembrie 2026, ora României. */
function at(time: string): string {
  return `2026-11-12T${time}:00+02:00`;
}

const SEM_REQUEST: ReservationCreateRequest = {
  resourceId: 7,
  projectId: 1,
  start: at('14:00'),
  end: at('15:00'),
  purpose: 'Imagini SEM pentru probele noi.',
};

async function post<T = Problem>(body: Partial<ReservationCreateRequest>): Promise<[Response, T]> {
  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...SEM_REQUEST, ...body }),
  });
  return [response, (await response.json()) as T];
}

describe('handlerele mock pentru cererea de rezervare', () => {
  beforeEach(() => {
    // Ana Popescu (studentă, certificată pentru SEM), miercuri 11 noiembrie la prânz.
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
    vi.stubEnv('VITE_MOCK_NOW', '2026-11-11T12:00:00+02:00');
  });

  it('întoarce proiectele Anei, cu orele rămase din buget', async () => {
    const projects = (await (await fetch('/api/users/me/projects')).json()) as ProjectBudget[];

    expect(
      projects.map(({ id, usedHours, remainingHours }) => [id, usedHours, remainingHours]),
    ).toEqual([
      [1, 4, 116],
      [2, 0, 60],
    ]);
    expect(projects[0]?.team.coordinator).toMatchObject({ name: 'Andrei Rusu' });
  });

  it('creează cererea unui student ca PENDING și o arată în rezervările lui', async () => {
    const [response, created] = await post<Reservation>({});
    const mine = (await (
      await fetch('/api/users/me/reservations')
    ).json()) as ReservationSummaryPage;

    expect(response.status).toBe(201);
    expect(response.headers.get('Location')).toBe(`/api/reservations/${String(created.id)}`);
    expect(created).toMatchObject({ id: 1049, status: 'PENDING', hours: 1, approvals: [] });
    expect(mine.content.map((item) => item.id)).toContain(1049);
  });

  it('confirmă direct rezervarea unui cercetător', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '2');
    const [response, created] = await post<Reservation>({});
    expect(response.status).toBe(201);
    expect(created.status).toBe('CONFIRMED');
  });

  it('propune sloturi alternative când intervalul e ocupat (409)', async () => {
    // 10:30-11:30 se suprapune cu cererea 1042 (10:00-12:00).
    const [response, body] = await post({ start: at('10:30'), end: at('11:30') });

    expect(response.status).toBe(409);
    expect(body.code).toBe('SLOT_UNAVAILABLE');
    expect(body.alternativeSlots?.[0]).toMatchObject({ resource: { id: 7 }, sameResource: true });
    expect(
      body.alternativeSlots?.some((slot) => !slot.sameResource && slot.resource.id === 9),
    ).toBe(true);
  });

  it.each([
    ['BREAK_NOT_RESPECTED', { start: at('12:00'), end: at('13:00') }],
    ['DURATION_OUT_OF_RANGE', { start: at('14:00'), end: at('14:15') }],
    ['INTERVAL_IN_PAST', { start: '2026-11-11T09:00:00+02:00', end: '2026-11-11T10:00:00+02:00' }],
    ['CERTIFICATION_MISSING', { resourceId: 9 }],
    ['NOT_PROJECT_MEMBER', { projectId: 3 }],
  ])('respinge cu 422 %s', async (code, change) => {
    const [response, body] = await post(change);
    expect(response.status).toBe(422);
    expect(body.code).toBe(code);
  });

  it('validează forma cererii (400) și rolul (403)', async () => {
    const [invalid, problem] = await post({ purpose: 'ok' });
    vi.stubEnv('VITE_MOCK_USER_ID', '4');
    const [forbidden] = await post({});

    expect(invalid.status).toBe(400);
    expect(problem.errors?.map((error) => error.field)).toEqual(['purpose']);
    expect(forbidden.status).toBe(403);
  });
});
