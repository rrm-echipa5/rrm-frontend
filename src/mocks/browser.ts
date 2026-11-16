import { FetchInterceptor } from '@mswjs/interceptors/fetch';
import { defineNetwork, InterceptorSource } from 'msw/experimental';

import { handlers } from './handlers';

/**
 * Pornește stratul mock în browser. Cererile sunt interceptate direct în `fetch`, fără Service
 * Worker, ca mock-ul să meargă și în browserele care nu permit înregistrarea worker-ului (de
 * exemplu panoul de browser din aplicațiile desktop). Cererile fără handler ajung la backend.
 */
export function startMockApi(): void {
  const network = defineNetwork({
    sources: [new InterceptorSource({ interceptors: [new FetchInterceptor()] })],
    handlers,
    onUnhandledFrame: 'bypass',
  });
  network.enable();
}
