import type { Problem, Reservation, ReservationSummaryPage, ResourceCalendar } from '../api/types';
import { startMockServer } from '../test/mockServer';

startMockServer();

async function json<T>(path: string, init?: RequestInit): Promise<[number, T]> {
  const response = await fetch(path, init);
  return [response.status, (await response.json()) as T];
}

function cancel<T = Reservation>(reservationId: number, body?: unknown): Promise<[number, T]> {
  return json(`/api/reservations/${String(reservationId)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('handlerele mock pentru rezervările mele', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
  });

  it('întoarce rezervările Anei, de la cea mai recentă', async () => {
    const [status, body] = await json<ReservationSummaryPage>('/api/users/me/reservations');

    expect(status).toBe(200);
    expect(body.content.map((item) => item.id)).toEqual([1044, 1042, 1047, 1041, 1040]);
    expect(body.content[1]).toMatchObject({
      resource: { id: 7, name: 'Microscop electronic SEM' },
      project: { id: 1, title: 'Nanostructuri pentru senzori de gaz' },
      status: 'PENDING_ADMIN',
    });
  });

  it('filtrează după statusurile repetate și paginează', async () => {
    const [, active] = await json<ReservationSummaryPage>(
      '/api/users/me/reservations?status=PENDING&status=PENDING_ADMIN&status=CONFIRMED',
    );
    const [, second] = await json<ReservationSummaryPage>(
      '/api/users/me/reservations?size=2&page=1',
    );

    expect(active.content.map((item) => item.id)).toEqual([1042]);
    expect(second.page).toEqual({ page: 1, size: 2, totalElements: 5, totalPages: 3 });
  });

  it('respinge parametrii invalizi cu 400 și câmpul greșit', async () => {
    const [status, body] = await json<Problem>('/api/users/me/reservations?sort=name,asc');
    expect(status).toBe(400);
    expect(body.errors).toEqual([{ field: 'sort', message: 'Sortarea nu este validă.' }]);
  });

  it('refuză lista pentru un administrator de resurse (403), ca backend-ul', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '4');
    const [status, body] = await json<Problem>('/api/users/me/reservations');
    expect(status).toBe(403);
    expect(body.detail).toBe('Doar studenții și cercetătorii au rezervări proprii.');
  });
});

describe('handlerele mock pentru detaliile și anularea unei rezervări', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
  });

  it('arată detaliile cu istoricul aprobărilor', async () => {
    const [status, body] = await json<Reservation>('/api/reservations/1042');

    expect(status).toBe(200);
    expect(body).toMatchObject({ hours: 2, requester: { id: 3 }, cancellation: null });
    expect(body.approvals).toHaveLength(1);
    expect(body.approvals[0]).toMatchObject({
      stage: 'COORDINATOR',
      decision: 'APPROVED',
      approver: { id: 2, name: 'Andrei Rusu' },
    });
  });

  it('nu arată rezervarea altui student (403)', async () => {
    const [status] = await json<Problem>('/api/reservations/1045');
    expect(status).toBe(403);
  });

  it('anulează cererea cu motiv și eliberează intervalul din calendar', async () => {
    const [status, body] = await cancel(1042, { reason: '  Proba nu este gata.  ' });
    const [, calendar] = await json<ResourceCalendar>(
      '/api/resources/7/calendar?start=2026-11-12T00:00:00%2B02:00&end=2026-11-13T00:00:00%2B02:00',
    );

    expect(status).toBe(200);
    expect(body.status).toBe('CANCELLED');
    expect(body.cancellation).toMatchObject({
      reason: 'Proba nu este gata.',
      cancelledBy: { id: 3 },
    });
    expect(calendar.entries).toEqual([]);
  });

  it('anulează și fără corp, cu motivul null', async () => {
    const [status, body] = await cancel(1042);
    expect(status).toBe(200);
    expect(body.cancellation?.reason).toBeNull();
  });

  it('refuză anularea unei rezervări finalizate (409 INVALID_STATE)', async () => {
    const [status, body] = await cancel<Problem>(1041);
    expect(status).toBe(409);
    expect(body.code).toBe('INVALID_STATE');
  });

  it('coordonatorul echipei poate anula cererea unui student', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '2');
    const [status] = await cancel(1042);
    expect(status).toBe(200);
  });

  it('refuză anularea rezervării altcuiva (403) și un motiv prea lung (400)', async () => {
    const [forbidden] = await cancel(1046);
    const [tooLong] = await cancel(1042, { reason: 'x'.repeat(501) });
    expect(forbidden).toBe(403);
    expect(tooLong).toBe(400);
  });
});
