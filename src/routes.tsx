import { createBrowserRouter } from 'react-router';

import { AppLayout } from './components/AppLayout';

/**
 * Rutele aplicației; fiecare grup de pagini vine din folderul lui din `features/`. Paginile se
 * încarcă la prima vizită (`lazy`), ca bundle-ul inițial să conțină doar cadrul aplicației, iar
 * calendarul (`@mantine/schedule`) și formularele să vină doar pe paginile care le folosesc.
 */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./features/home/HomePage')).HomePage }),
      },
      {
        path: 'catalog',
        lazy: async () => ({
          Component: (await import('./features/resources/CatalogPage')).CatalogPage,
        }),
      },
      {
        path: 'catalog/:resourceId',
        lazy: async () => ({
          Component: (await import('./features/resources/ResourceDetailPage')).ResourceDetailPage,
        }),
      },
      {
        path: 'catalog/:resourceId/request',
        lazy: async () => ({
          Component: (await import('./features/reservations/ReservationRequestPage'))
            .ReservationRequestPage,
        }),
      },
      {
        path: 'reservations',
        lazy: async () => ({
          Component: (await import('./features/reservations/MyReservationsPage'))
            .MyReservationsPage,
        }),
      },
      {
        path: 'reservations/:reservationId/sent',
        lazy: async () => ({
          Component: (await import('./features/reservations/ReservationSentPage'))
            .ReservationSentPage,
        }),
      },
      {
        path: 'resources',
        lazy: async () => ({
          Component: (await import('./features/resources/ResourcesPage')).ResourcesPage,
        }),
      },
    ],
  },
]);
