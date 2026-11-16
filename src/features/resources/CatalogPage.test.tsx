import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { startMockServer } from '../../test/mockServer';
import { renderWithProviders } from '../../test/render';
import { CatalogPage } from './CatalogPage';

startMockServer();

/** Denumirile resurselor afișate, în ordinea cardurilor. */
async function shownResources(): Promise<string[]> {
  const headings = await screen.findAllByRole('heading', { level: 3 });
  return headings.map((heading) => heading.textContent);
}

describe('CatalogPage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('afișează toate resursele din datele de test, în ordinea denumirii', async () => {
    renderWithProviders(<CatalogPage />, { route: '/catalog' });

    expect(await shownResources()).toEqual([
      'Cluster HPC - nod GPU',
      'Microscop electronic SEM',
      'Microscop electronic TEM',
      'Sala de seminar C105',
      'Spectrometru Raman',
    ]);
    expect(screen.getByText('5 resurse')).toBeInTheDocument();
  });

  it('arată dacă utilizatorul curent are certificarea cerută', async () => {
    renderWithProviders(<CatalogPage />, { route: '/catalog' });

    const sem = await screen.findByRole('link', { name: /Microscop electronic SEM/ });
    expect(within(sem).getByText('Ai certificarea (nivel 2 cerut)')).toBeInTheDocument();
    const tem = screen.getByRole('link', { name: /Microscop electronic TEM/ });
    expect(within(tem).getByText('Necesită certificare nivel 3')).toBeInTheDocument();
  });

  it('combină filtrul pe categorie cu textul căutat', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage />, { route: '/catalog' });

    await user.click(await screen.findByPlaceholderText('Toate categoriile'));
    await user.click(await screen.findByRole('option', { name: 'Echipamente hardware' }));
    expect(await screen.findByText('2 resurse')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Caută resurse' }), '200 kV');
    expect(await screen.findByText('1 resursă')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Microscop electronic TEM/ })).toBeInTheDocument();
  });

  it('păstrează doar resursele care au toate tag-urile cerute', async () => {
    renderWithProviders(<CatalogPage />, { route: '/catalog?tag=microscopie&tag=imagistic%C4%83' });
    expect(await screen.findByText('2 resurse')).toBeInTheDocument();
  });

  it('afișează un mesaj când filtrele nu se potrivesc cu nicio resursă', async () => {
    renderWithProviders(<CatalogPage />, { route: '/catalog?tag=microscopie&tag=gpu' });
    expect(await screen.findByText('Nicio resursă nu corespunde filtrelor alese.')).toBeVisible();
  });

  it('în timpul calibrării, SEM apare în mentenanță și se găsește cu filtrul de stare', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T10:00:00+02:00'));
    const user = userEvent.setup();
    renderWithProviders(<CatalogPage />, { route: '/catalog' });

    const sem = await screen.findByRole('link', { name: /Microscop electronic SEM/ });
    expect(within(sem).getByText('În mentenanță')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'În mentenanță' }));
    await waitFor(() => {
      expect(screen.getByText('1 resursă')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Microscop electronic SEM/ })).toBeInTheDocument();
  });
});
