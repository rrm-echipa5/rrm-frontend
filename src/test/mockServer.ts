import { setupServer } from 'msw/node';

import { handlers } from '../mocks/handlers';
import { resetMockDb } from '../mocks/mockDb';

/**
 * Serverul MSW pentru teste, cu aceleași handlere ca stratul mock din aplicație: testele verifică
 * astfel și datele de test, nu doar componentele.
 */
export const mockServer = setupServer(...handlers);

/** Pornește serverul mock pentru fișierul de test curent. */
export function startMockServer(): void {
  beforeAll(() => {
    mockServer.listen({ onUnhandledFrame: 'error' });
  });
  afterEach(() => {
    mockServer.resetHandlers();
    resetMockDb();
  });
  afterAll(() => {
    mockServer.close();
  });
}
