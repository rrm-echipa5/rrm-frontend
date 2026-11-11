import { screen } from '@testing-library/react';

import { jsonResponse, renderWithProviders } from '../../test/render';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('arată că serverul și baza de date funcționează', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok', database: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<HomePage />);

    expect(await screen.findByText('Baza de date conectată')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.anything());
  });

  it('arată când serverul nu răspunde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    renderWithProviders(<HomePage />);

    expect(await screen.findByText('Serverul nu răspunde')).toBeInTheDocument();
  });
});
