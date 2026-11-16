import 'dayjs/locale/ro';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { DATES_SETTINGS, theme } from '../theme';

/** Opțiunile randării: adresa de pornire a routerului (implicit `/`). */
export interface RenderOptions {
  route?: string;
}

/** Randează o componentă cu aceiași provideri ca aplicația (Mantine, TanStack Query, router). */
export function renderWithProviders(ui: ReactNode, options: RenderOptions = {}): RenderResult {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MantineProvider theme={theme} env="test">
      <Notifications />
      <DatesProvider settings={DATES_SETTINGS}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>,
  );
}

/** Răspuns JSON pentru `fetch` simulat în teste. */
export function jsonResponse(body: unknown, status = 200): Response {
  const contentType = status >= 400 ? 'application/problem+json' : 'application/json';
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  });
}
