import { screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { Route, Routes } from 'react-router';

import { startMockServer } from '../../test/mockServer';
import { renderWithProviders } from '../../test/render';
import { requestPath } from './requestLinks';
import { ReservationRequestPage } from './ReservationRequestPage';
import { ReservationSentPage } from './ReservationSentPage';

startMockServer();

function at(time: string): string {
  return `2026-11-12T${time}:00+02:00`;
}

function renderRequest(resourceId: number, start: string, end: string): void {
  renderWithProviders(
    <Routes>
      <Route path="/catalog/:resourceId/request" element={<ReservationRequestPage />} />
      <Route path="/reservations/:reservationId/sent" element={<ReservationSentPage />} />
    </Routes>,
    { route: requestPath(resourceId, { start: at(start), end: at(end) }) },
  );
}

async function fillForm(user: UserEvent): Promise<void> {
  await user.click(await screen.findByPlaceholderText('Alege proiectul'));
  await user.click(
    await screen.findByRole('option', { name: /Nanostructuri pentru senzori de gaz/ }),
  );
  await user.type(screen.getByLabelText(/Scopul utilizării/), 'Imagini SEM pentru probele noi.');
  await user.click(
    screen.getByRole('checkbox', { name: 'Am citit regulile de utilizare ale resursei' }),
  );
}

describe('ReservationRequestPage', () => {
  beforeEach(() => {
    // Ana Popescu (studentă, certificată pentru SEM), miercuri 11 noiembrie la prânz.
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
    vi.stubEnv('VITE_MOCK_NOW', '2026-11-11T12:00:00+02:00');
  });

  it('trimite cererea după verificări și deschide confirmarea', async () => {
    const user = userEvent.setup();
    renderRequest(7, '14:00', '15:00');

    // Intervalul apare în pasul 1 și în rezumatul din pasul 3.
    expect(await screen.findAllByText('joi, 12 noiembrie, 14:00 – 15:00')).toHaveLength(2);
    const submit = screen.getByRole('button', { name: 'Trimite cererea' });
    expect(submit).toBeDisabled();
    expect(
      await screen.findByText(/Certificare pentru această resursă: validă/),
    ).toBeInTheDocument();

    await fillForm(user);
    expect(
      await screen.findByText(/Bugetul proiectului acoperă cererea \(1 h din 116 h rămase\)/),
    ).toBeInTheDocument();
    await user.click(submit);

    expect(
      await screen.findByRole('heading', { name: 'Cererea a fost trimisă' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/este nevoie și de avizul Administratorului Resursei/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vezi rezervările mele' })).toHaveAttribute(
      'href',
      '/reservations',
    );
  });

  it('confirmă direct rezervarea unui cercetător', async () => {
    vi.stubEnv('VITE_MOCK_USER_ID', '2');
    const user = userEvent.setup();
    renderRequest(7, '14:00', '15:00');

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Trimite cererea' }));

    expect(
      await screen.findByRole('heading', { name: 'Rezervarea a fost confirmată' }),
    ).toBeInTheDocument();
  });

  it('la un interval ocupat arată sloturile alternative și completează din nou formularul', async () => {
    const user = userEvent.setup();
    renderRequest(7, '10:30', '11:30');

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Trimite cererea' }));

    const alert = await screen.findByRole('alert', { name: 'Intervalul nu mai este liber' });
    expect(
      within(alert).getByText(/12.11.2026, 10:30-11:30 nu mai este liber/),
    ).toBeInTheDocument();
    const choices = within(alert).getAllByRole('button');
    const similar = within(alert).getByRole('button', {
      name: /Microscop electronic TEM \(resursă similară\)/,
    });
    expect(choices.length).toBeGreaterThan(1);
    expect(similar).toBeInTheDocument();

    await user.click(choices[0]!);

    await waitFor(() => {
      expect(
        screen.queryByRole('alert', { name: 'Intervalul nu mai este liber' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Scopul utilizării/)).toHaveValue(
      'Imagini SEM pentru probele noi.',
    );
  });

  it('afișează motivul unei reguli încălcate (422)', async () => {
    const user = userEvent.setup();
    // 12:00-13:00 începe imediat după cererea 1042, fără pauza de 15 minute.
    renderRequest(7, '12:00', '13:00');

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Trimite cererea' }));

    expect(
      await screen.findByText('Între rezervări trebuie o pauză de cel puțin 15 min.'),
    ).toBeInTheDocument();
  });

  it('nu lasă trimiterea fără certificarea cerută de resursă', async () => {
    const user = userEvent.setup();
    renderRequest(9, '14:00', '15:00');

    await fillForm(user);

    expect(
      await screen.findByText('Nu ai certificarea de nivel 3 cerută de resursă'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trimite cererea' })).toBeDisabled();
  });
});
