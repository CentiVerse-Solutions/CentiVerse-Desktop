// Testing Library's custom matchers, wired for Vitest's expect.
import '@testing-library/jest-dom/vitest';

// jsdom implements neither of these, and both are read during render:
// MUI's theme layer calls matchMedia, framer-motion calls requestAnimationFrame
// via its scroll/resize observers.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// LandingPage drives its scroll reveals with IntersectionObserver.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
