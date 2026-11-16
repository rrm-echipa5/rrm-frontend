import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './routes';
import { theme } from './theme';

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
  const { network } = await import('virtual:msw');
  const { handlers } = await import('./mocks/handlers');
  // Cererile fără handler (de exemplu POST /resources) ajung în continuare la backend.
  network.configure({ handlers, onUnhandledFrame: 'bypass' });
  await network.enable();
}

await enableApiMocks();

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
