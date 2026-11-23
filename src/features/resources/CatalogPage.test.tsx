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
    vi.stubEnv('VITE_MOCK_USER_ID', '3'); // Ana Popescu, studentă certificată pentru SEM
    renderWithProviders(<CatalogPage />, { route: '/catalog' });

    const sem = await screen.findByRole('link', { name: /Microscop electronic SEM/ });
    expect(within(sem).getByText('Ai certificarea (nivel 2 cerut)')).toBeInTheDocument();
    const tem = screen.getByRole('link', { name: /Microscop electronic TEM/ });
    expect(
      within(tem).getByText('Necesită certificare nivel 3, pe care nu o ai'),
    ).toBeInTheDocument();
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

  describe('căutarea resurselor libere într-un interval (KAN-71)', () => {
    const BUSY_SEM =
      '/catalog?start=2026-11-12T10%3A00%3A00%2B02%3A00&end=2026-11-12T12%3A00%3A00%2B02%3A00';

    it('arată doar resursele libere în intervalul din adresă, fără filtrul de stare', async () => {
      renderWithProviders(<CatalogPage />, { route: BUSY_SEM });

      expect(
        await screen.findByText('Resursele libere joi, 12 noiembrie, 10:00 – 12:00.'),
      ).toBeInTheDocument();
      await waitFor(async () => {
        expect(await shownResources()).not.toContain('Microscop electronic SEM');
      });
      expect(await shownResources()).toHaveLength(4);
      expect(screen.queryByRole('group', { name: 'Starea resursei' })).not.toBeInTheDocument();
    });

    it('arată fluxul de aprobare și certificarea lipsă pe fiecare rezultat', async () => {
      vi.stubEnv('VITE_MOCK_USER_ID', '3');
      renderWithProviders(<CatalogPage />, { route: BUSY_SEM });

      const tem = await screen.findByRole('link', { name: /Microscop electronic TEM/ });
      expect(within(tem).getByText('Aprobare: Coordonator și administrator')).toBeInTheDocument();
      expect(
        within(tem).getByText('Necesită certificare nivel 3, pe care nu o ai'),
      ).toBeInTheDocument();
    });

    it('revine la tot catalogul când se șterge intervalul', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CatalogPage />, { route: BUSY_SEM });
      await screen.findByText(/Resursele libere/);

      await user.click(screen.getByRole('button', { name: 'Șterge intervalul' }));

      expect(
        await screen.findByText(
          'Toate resursele de cercetare ale universității, cu starea lor actuală.',
        ),
      ).toBeInTheDocument();
      await waitFor(async () => {
        expect(await shownResources()).toContain('Microscop electronic SEM');
      });
    });

    it('păstrează ultima căutare când sfârșitul ajunge înaintea începutului', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CatalogPage />, { route: BUSY_SEM });
      await screen.findByText(/Resursele libere/);

      const to = screen.getByLabelText('Până la ora');
      await user.clear(to);
      await user.type(to, '09:00');

      expect(await screen.findByText('După ora de început')).toBeInTheDocument();
      expect(screen.getByText('Resursele libere joi, 12 noiembrie, 10:00 – 12:00.')).toBeVisible();
    });
  });
});
