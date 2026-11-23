import { createBrowserRouter } from 'react-router';

import { AppLayout } from './components/AppLayout';
import { HomePage } from './features/home/HomePage';
import { CatalogPage } from './features/resources/CatalogPage';
import { ResourceDetailPage } from './features/resources/ResourceDetailPage';
import { ResourcesPage } from './features/resources/ResourcesPage';

/** Rutele aplicației; fiecare grup de pagini vine din folderul lui din `features/`. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'catalog/:resourceId', element: <ResourceDetailPage /> },
      { path: 'resources', element: <ResourcesPage /> },
    ],
  },
]);
