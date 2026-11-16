import { createBrowserRouter } from 'react-router';

import { AppLayout } from './components/AppLayout';
import { HomePage } from './features/home/HomePage';
import { ResourcesPage } from './features/resources/ResourcesPage';

/** Rutele aplicației; fiecare grup de pagini vine din folderul lui din `features/`. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'resources', element: <ResourcesPage /> },
    ],
  },
]);
