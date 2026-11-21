import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { startMockServer } from '../../test/mockServer';
import { renderWithProviders } from '../../test/render';
import { ResourceWeekCalendar } from './ResourceWeekCalendar';

startMockServer();

describe('ResourceWeekCalendar', () => {
  beforeEach(() => {
    // Miercuri, 11 noiembrie 2026: săptămâna cu cererea 1042 a Anei și rezervarea 1046 a lui Andrei.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-11T12:00:00+02:00'));
    vi.stubEnv('VITE_MOCK_USER_ID', '3');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('afișează rezervarea proprie și intervalele ocupate de alții', async () => {
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);

    expect(
      await screen.findByText('Rezervarea ta', { selector: '[class*="Event"] *' }),
    ).toBeVisible();
    expect(screen.getAllByText('Ocupat').length).toBeGreaterThan(1);
  });

  it('alege un interval liber cu durata minimă la click pe un slot', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);
    await screen.findByText('Rezervarea ta', { selector: '[class*="Event"] *' });

    await user.click(
      screen.getByRole('button', { name: 'Interval 2026-11-12 14:00:00 - 14:30:00' }),
    );

    expect(await screen.findByText(/joi, 12 noiembrie, 14:00 – 14:30 \(30 min\)/)).toBeVisible();
  });

  it('nu permite alegerea unui interval ocupat', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);
    await screen.findByText('Rezervarea ta', { selector: '[class*="Event"] *' });

    await user.click(
      screen.getByRole('button', { name: 'Interval 2026-11-13 09:30:00 - 10:00:00' }),
    );

    expect(await screen.findByText(/se suprapune cu un interval ocupat/)).toBeVisible();
    expect(screen.queryByText(/Selecția ta:/)).not.toBeInTheDocument();
  });
});
