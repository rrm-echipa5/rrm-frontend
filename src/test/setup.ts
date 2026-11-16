import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';

class ResizeObserverStub {
  observe(): void {
    // jsdom nu calculează dimensiuni, deci nu are ce observa.
  }
  unobserve(): void {
    // La fel ca observe().
  }
  disconnect(): void {
    // La fel ca observe().
  }
}

// Mantine folosește API-uri de browser pe care jsdom nu le are.
// Testele scripturilor rulează în mediul node, fără `window`.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  window.ResizeObserver = ResizeObserverStub;
  window.HTMLElement.prototype.scrollIntoView = (): void => undefined;
  // Textarea cu autosize ascultă încărcarea fonturilor.
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { addEventListener: () => undefined, removeEventListener: () => undefined },
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
