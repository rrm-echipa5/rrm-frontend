import { createBrowserRouter } from 'react-router';

import { AppLayout } from './components/AppLayout';
import { HomePage } from './features/home/HomePage';

/** Rutele aplicației; fiecare grup de pagini vine din folderul lui din `features/`. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);
