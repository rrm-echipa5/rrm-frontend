import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { ResourceCategory, ResourceDetail, ResourceSummaryPage } from '../../api/types';
import { jsonResponse, renderWithProviders } from '../../test/render';
import { ResourcesPage } from './ResourcesPage';

const CATEGORIES: ResourceCategory[] = [
  { id: 1, code: 'HARDWARE', name: 'Echipamente hardware' },
  { id: 2, code: 'HPC', name: 'Calcul de înaltă performanță' },
];

const SEM: ResourceDetail = {
  id: 7,
  name: 'Microscop electronic SEM',
  category: { id: 1, name: 'Echipamente hardware' },
  location: 'Corp C, sala C204',
  status: 'ACTIVE',
  approvalFlow: 'COORDINATOR_AND_ADMIN',
  tags: ['microscopie'],
  description: 'Microscop electronic cu baleiaj.',
  specifications: { Rezoluție: '1,2 nm la 30 kV' },
  administrator: { id: 4, name: 'Mihai Ionescu' },
  checkInQrCode: 'RRM-R7-6f1c2a',
  createdAt: '2026-11-08T19:00:00Z',
  updatedAt: '2026-11-08T19:00:00Z',
};

function page(items: ResourceDetail[]): ResourceSummaryPage {
  return {
    content: items,
    page: { page: 0, size: 10, totalElements: items.length, totalPages: 1 },
  };
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
type Route = [method: string, path: string, respond: (init?: RequestInit) => Response];

/** Simulează API-ul: fiecare rută are metoda, calea fără query string și răspunsul. */
function mockApi(routes: Route[]): Mock<FetchFn> {
  const fetchMock = vi.fn<FetchFn>((input, init) => {
    const path = input.split('?')[0];
    const route = routes.find(([method, routePath]) => {
      return method === (init?.method ?? 'GET') && routePath === path;
    });
    return Promise.resolve(route ? route[2](init) : jsonResponse({}, 404));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Corpul JSON trimis într-un apel `fetch` simulat. */
function sentBody(call: Parameters<FetchFn> | undefined): unknown {
  const body = call?.[1]?.body;
  return typeof body === 'string' ? JSON.parse(body) : undefined;
}

const CATALOG_ROUTES: Route[] = [
  ['GET', '/api/resource-categories', () => jsonResponse(CATEGORIES)],
  ['GET', '/api/resources', () => jsonResponse(page([SEM]))],
];

describe('ResourcesPage', () => {
  it('afișează resursele primite de la API', async () => {
    mockApi(CATALOG_ROUTES);

    renderWithProviders(<ResourcesPage />);

    const row = (await screen.findByText('Microscop electronic SEM')).closest('tr');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('Activă')).toBeInTheDocument();
    expect(within(row!).getByText('Coordonator și administrator')).toBeInTheDocument();
  });

  it('adaugă o resursă și trimite câmpurile în formatul API-ului', async () => {
    const user = userEvent.setup();
    const created = { ...SEM, id: 13, name: 'Imprimantă 3D', tags: [], specifications: {} };
    const fetchMock = mockApi([
      ...CATALOG_ROUTES,
      ['POST', '/api/resources', () => jsonResponse(created, 201)],
    ]);
    renderWithProviders(<ResourcesPage />);

    await user.click(await screen.findByRole('button', { name: 'Adaugă resursă' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Denumire/), 'Imprimantă 3D');
    await user.click(within(dialog).getByPlaceholderText('Alege categoria'));
    await user.click(await screen.findByRole('option', { name: 'Echipamente hardware' }));
    await user.type(within(dialog).getByLabelText('Locație'), 'Corp C, sala C110');
    await user.click(screen.getByRole('button', { name: 'Adaugă resursa' }));

    expect(await screen.findByText('Resursa „Imprimantă 3D” a fost adăugată.')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(sentBody(post)).toEqual({
      name: 'Imprimantă 3D',
      categoryId: 1,
      location: 'Corp C, sala C110',
      specifications: {},
      tags: [],
      approvalFlow: 'COORDINATOR',
    });
  });

  it('nu trimite formularul cu date invalide', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi([
      ['GET', '/api/resource-categories', () => jsonResponse(CATEGORIES)],
      ['GET', '/api/resources', () => jsonResponse(page([]))],
    ]);
    renderWithProviders(<ResourcesPage />);

    await user.click(await screen.findByRole('button', { name: 'Adaugă resursă' }));
    await user.type(await screen.findByLabelText(/Denumire/), 'A');
    await user.click(screen.getByRole('button', { name: 'Adaugă resursa' }));

    expect(
      await screen.findByText('Denumirea trebuie să aibă cel puțin 2 caractere.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Alege categoria.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('afișează eroarea 409 când resursa are rezervări viitoare', async () => {
    const user = userEvent.setup();
    const conflict = {
      title: 'Conflict',
      status: 409,
      code: 'RESOURCE_HAS_RESERVATIONS',
      detail: 'Resursa are cereri în așteptare sau rezervări viitoare.',
    };
    mockApi([...CATALOG_ROUTES, ['DELETE', '/api/resources/7', () => jsonResponse(conflict, 409)]]);
    renderWithProviders(<ResourcesPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Șterge Microscop electronic SEM' }),
    );
    await user.click(await screen.findByRole('button', { name: 'Șterge' }));

    expect(
      await screen.findByText('Resursa are cereri în așteptare sau rezervări viitoare.'),
    ).toBeInTheDocument();
  });

  it('încarcă fișa resursei la modificare și trimite PUT', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi([
      ...CATALOG_ROUTES,
      ['GET', '/api/resources/7', () => jsonResponse(SEM)],
      ['PUT', '/api/resources/7', () => jsonResponse({ ...SEM, name: 'Microscop SEM' })],
    ]);
    renderWithProviders(<ResourcesPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Modifică Microscop electronic SEM' }),
    );
    const name = await screen.findByDisplayValue('Microscop electronic SEM');
    await user.clear(name);
    await user.type(name, 'Microscop SEM');
    await user.click(screen.getByRole('button', { name: 'Salvează modificările' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true);
    });
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(sentBody(put)).toMatchObject({
      name: 'Microscop SEM',
      categoryId: 1,
      specifications: { Rezoluție: '1,2 nm la 30 kV' },
    });
  });
});
