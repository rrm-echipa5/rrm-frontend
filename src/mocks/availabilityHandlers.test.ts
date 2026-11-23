import type { Problem, ResourceSummaryPage } from '../api/types';
import { startMockServer } from '../test/mockServer';

startMockServer();

async function available(query: string): Promise<[number, ResourceSummaryPage & Problem]> {
  const response = await fetch(`/api/resources/available?${query}`);
  return [response.status, (await response.json()) as ResourceSummaryPage & Problem];
}

function interval(start: string, end: string): string {
  return new URLSearchParams({
    start: `2026-11-${start}:00+02:00`,
    end: `2026-11-${end}:00+02:00`,
  }).toString();
}

describe('handlerul mock pentru GET /resources/available', () => {
  it('scoate resursele cu rezervări sau cereri în interval', async () => {
    // 12 nov., 10:00-12:00: cererea 1042 a Anei ocupă Microscopul SEM.
    const [status, body] = await available(interval('12T10:00', '12T12:00'));

    expect(status).toBe(200);
    expect(body.content.map((resource) => resource.name)).toEqual([
      'Cluster HPC - nod GPU',
      'Microscop electronic TEM',
      'Sala de seminar C105',
      'Spectrometru Raman',
    ]);
  });

  it('scoate resursele în mentenanță în interval și păstrează filtrele catalogului', async () => {
    // 20 nov., calibrarea SEM; categoria 1 (echipamente hardware) are doar SEM și TEM.
    const [, body] = await available(`${interval('20T10:00', '20T11:00')}&categoryId=1`);
    expect(body.content.map((resource) => resource.name)).toEqual(['Microscop electronic TEM']);
  });

  it('cere un interval valid (400)', async () => {
    const [status, body] = await available(interval('12T12:00', '12T10:00'));
    expect(status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });
});
