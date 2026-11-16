import type { Problem, ResourceSummaryPage } from '../api/types';
import { startMockServer } from '../test/mockServer';

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
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
