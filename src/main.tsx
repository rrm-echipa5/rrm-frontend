import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/schedule/styles.css';
import 'dayjs/locale/ro';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './routes';
import { DATES_SETTINGS, theme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Elementul #root lipsește din index.html.');
}

/** Pornește stratul mock (MSW) doar în dezvoltare și doar dacă `VITE_API_MOCKS=true`. */
async function enableApiMocks(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKS !== 'true') {
    return;
  }
  try {
    const { startMockApi } = await import('./mocks/browser');
    startMockApi();
  } catch (error) {
    // Aplicația pornește oricum; fără mock, cererile ajung la backend-ul local.
    console.error('Stratul mock nu a putut fi pornit.', error);
  }
}

await enableApiMocks();

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <DatesProvider settings={DATES_SETTINGS}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
