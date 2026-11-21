import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';

import { startMockServer } from '../../test/mockServer';
import { renderWithProviders } from '../../test/render';
import { ResourceDetailPage } from './ResourceDetailPage';

startMockServer();

function renderDetail(resourceId: number | string): void {
  renderWithProviders(
    <Routes>
      <Route path="/catalog/:resourceId" element={<ResourceDetailPage />} />
    </Routes>,
    { route: `/catalog/${String(resourceId)}` },
  );
}

/** Cardul care conține titlul dat. */
function card(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title });
  const element = heading.closest<HTMLElement>('.mantine-Card-root');
  if (element === null) {
    throw new Error(`Cardul „${title}” lipsește.`);
  }
  return element;
}

describe('ResourceDetailPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-16T12:00:00+02:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('afișează specificațiile, administratorul și manualele resursei', async () => {
    renderDetail(7);

    expect(await screen.findByRole('heading', { name: 'Microscop electronic SEM' })).toBeVisible();
    const overview = card('Specificații');
    expect(within(overview).getByText('Mihai Ionescu')).toBeInTheDocument();
    expect(within(overview).getByText('EDS Oxford Ultim Max 65')).toBeInTheDocument();
    const manual = within(overview).getByRole('link', { name: /Manual de utilizare SEM/ });
    expect(manual).toHaveAttribute('href', '/api/resources/7/files/1');
    expect(within(manual).getByText('2,4 MB')).toBeInTheDocument();
  });

  it('afișează regulile de utilizare și cele două etape de aprobare', async () => {
    renderDetail(7);

    await screen.findByRole('heading', { name: 'Microscop electronic SEM' });
    const rules = card('Reguli de utilizare');
    expect(within(rules).getByText('30 min – 4 h')).toBeInTheDocument();
    expect(within(rules).getByText('15 min')).toBeInTheDocument();
    expect(within(rules).getByText('Nivel 2')).toBeInTheDocument();
    expect(within(rules).getByText('Coordonator')).toBeInTheDocument();
    expect(within(rules).getByText('Administrator Resursă')).toBeInTheDocument();
  });

  it('afișează certificarea valabilă a utilizatorului curent', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '3'); // Ana Popescu, studentă certificată pentru SEM
    renderDetail(7);

    await screen.findByRole('heading', { name: 'Microscop electronic SEM' });
    const certification = card('Certificarea ta');
    expect(await within(certification).findByText('Validă')).toBeInTheDocument();
    expect(
      within(certification).getByText('Nivel 2 · valabilă până la 31 octombrie 2027'),
    ).toBeInTheDocument();
  });

  it('spune când utilizatorul nu are certificarea cerută', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
    renderDetail(9);

    await screen.findByRole('heading', { name: 'Microscop electronic TEM' });
    expect(
      await screen.findByText('Nu ai certificare pentru această resursă; este cerut nivelul 3.'),
    ).toBeInTheDocument();
  });

  it('anunță calibrarea programată a microscopului SEM', async () => {
    renderDetail(7);

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Calibrare programată')).toBeInTheDocument();
    expect(within(alert).getByText(/Calibrarea anuală a detectorului EDS/)).toBeInTheDocument();
  });

  it('în timpul calibrării, resursa apare în mentenanță și nu poate fi rezervată', async () => {
    vi.setSystemTime(new Date('2026-11-20T10:00:00+02:00'));
    renderDetail(7);

    await screen.findByRole('heading', { name: 'Microscop electronic SEM' });
    expect(screen.getAllByText('În mentenanță')[0]).toBeInTheDocument();
    expect(screen.getByText('Calibrare în curs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicită rezervare' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('afișează eroarea din API pentru o resursă care nu există', async () => {
    renderDetail(99);

    expect(await screen.findByText('Resursa 99 nu există.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Înapoi la catalog' })).toHaveAttribute(
      'href',
      '/catalog',
    );
  });
});
