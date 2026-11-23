import { fireEvent, screen } from '@testing-library/react';
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

  it('duce la formularul cererii cu intervalul ales', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);
    await screen.findByText('Rezervarea ta', { selector: '[class*="Event"] *' });

    await user.click(
      screen.getByRole('button', { name: 'Interval 2026-11-12 14:00:00 - 14:30:00' }),
    );

    const link = await screen.findByRole('link', { name: 'Continuă cu cererea' });
    const target = new URL(link.getAttribute('href') ?? '', 'http://localhost');
    expect(target.pathname).toBe('/catalog/7/request');
    expect(new Date(target.searchParams.get('start') ?? '')).toEqual(
      new Date('2026-11-12T14:00:00+02:00'),
    );
    expect(new Date(target.searchParams.get('end') ?? '')).toEqual(
      new Date('2026-11-12T14:30:00+02:00'),
    );
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

  it('marchează cu gri sloturile ocupate și pe cele trecute', async () => {
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);
    await screen.findByText('Rezervarea ta', { selector: '[class*="Event"] *' });

    // Vineri 09:30 e ocupat de rezervarea 1046, marți 10:00 a trecut, joi 14:00 e liber.
    const busy = screen.getByRole('button', { name: 'Interval 2026-11-13 09:30:00 - 10:00:00' });
    const past = screen.getByRole('button', { name: 'Interval 2026-11-10 10:00:00 - 10:30:00' });
    const free = screen.getByRole('button', { name: 'Interval 2026-11-12 14:00:00 - 14:30:00' });

    for (const slot of [busy, past]) {
      expect(slot).toHaveAttribute('data-unavailable');
      expect(slot.style.backgroundColor).toBe('var(--mantine-color-gray-1)');
    }
    expect(free).not.toHaveAttribute('data-unavailable');
  });

  it('la tragere, intervalul ține până la sfârșitul ultimului slot', async () => {
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);
    await screen.findByText('Rezervarea ta', { selector: '[class*="Event"] *' });
    const first = screen.getByRole('button', { name: 'Interval 2026-11-12 14:00:00 - 14:30:00' });
    const last = screen.getByRole('button', { name: 'Interval 2026-11-12 14:30:00 - 15:00:00' });

    // jsdom nu are elementsFromPoint; @mantine/schedule îl folosește ca să afle slotul de sub cursor.
    Object.defineProperty(document, 'elementsFromPoint', {
      value: () => [last],
      configurable: true,
    });
    try {
      fireEvent.pointerDown(first);
      fireEvent.pointerMove(document);
      fireEvent.pointerUp(document);
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }

    // onSlotDragEnd dă sfârșitul ultimului slot (15:00), nu începutul lui (14:30).
    expect(await screen.findByText(/joi, 12 noiembrie, 14:00 – 15:00 \(1 h\)/)).toBeVisible();
  });

  it('afișează mentenanța care trece peste miezul nopții', async () => {
    // Vineri, 20 noiembrie 2026, 08:00 - sâmbătă, 21 noiembrie, 18:00.
    vi.setSystemTime(new Date('2026-11-18T12:00:00+02:00'));
    renderWithProviders(<ResourceWeekCalendar resourceId={7} selectable />);

    const pieces = await screen.findAllByText('Mentenanță', { selector: '[class*="Event"] *' });
    expect(pieces[0]).toBeVisible();
  });
});
