import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { startMockServer } from '../../test/mockServer';
import { renderWithProviders } from '../../test/render';
import { MyReservationsPage } from './MyReservationsPage';

startMockServer();

function rowOf(resourceName: string, interval: RegExp): HTMLElement {
  const row = screen
    .getAllByRole('row')
    .find(
      (candidate) =>
        within(candidate).queryByText(resourceName) !== null &&
        interval.test(candidate.textContent),
    );
  if (row === undefined) {
    throw new Error(`Rândul pentru ${resourceName} lipsește.`);
  }
  return row;
}

describe('MyReservationsPage', () => {
  beforeEach(() => {
    // Ana Popescu (studentă): rezervările 1040, 1041, 1042, 1044 și 1047 din datele de test.
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
  });

  it('arată rezervările cu statusurile colorate și numărul din fiecare filtru', async () => {
    renderWithProviders(<MyReservationsPage />);

    expect(await screen.findByRole('radio', { name: 'Toate (5)' })).toBeInTheDocument();
    await screen.findByText('Spectrometru Raman');
    const pending = rowOf('Microscop electronic SEM', /12 noiembrie/);
    expect(within(pending).getByText('În așteptare')).toBeInTheDocument();
    expect(within(pending).getByText('Nanostructuri pentru senzori de gaz')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Active (1)' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Istoric (4)' })).toBeInTheDocument();
    expect(screen.getByText('Anulată automat')).toBeInTheDocument();
  });

  it('filtrează doar rezervările active', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyReservationsPage />);
    await screen.findByText('Spectrometru Raman');

    await user.click(screen.getByRole('radio', { name: /^Active/ }));

    await waitFor(() => {
      expect(screen.queryByText('Spectrometru Raman')).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('deschide detaliile cu istoricul aprobărilor', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyReservationsPage />);

    await user.click(await screen.findByRole('button', { name: 'Detalii rezervarea 1042' }));

    const drawer = await screen.findByRole('dialog', { name: 'Rezervarea 1042' });
    expect(
      await within(drawer).findByText('Aprobată de Andrei Rusu (coordonatorul echipei)'),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText('Așteaptă avizul administratorului resursei'),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText('Imagini SEM pentru probele de ZnO depuse în octombrie.'),
    ).toBeInTheDocument();
  });

  it('anulează o cerere cu motiv, iar rezervarea apare anulată', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyReservationsPage />);

    await user.click(await screen.findByRole('button', { name: 'Anulează rezervarea 1042' }));
    const dialog = await screen.findByRole('dialog', { name: 'Anulezi rezervarea?' });
    await user.type(within(dialog).getByLabelText(/Motivul/), 'Proba nu este gata.');
    await user.click(within(dialog).getByRole('button', { name: 'Anulează rezervarea' }));

    expect(
      await screen.findByText('Rezervarea pentru „Microscop electronic SEM” a fost anulată.'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /^Anulează rezervarea/ }),
      ).not.toBeInTheDocument();
    });
    expect(await screen.findByRole('radio', { name: 'Active (0)' })).toBeInTheDocument();
  });

  it('arată mesajul serverului pentru un rol fără rezervări proprii', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '4');
    renderWithProviders(<MyReservationsPage />);

    expect(
      await screen.findByText('Doar studenții și cercetătorii au rezervări proprii.'),
    ).toBeInTheDocument();
  });
});
