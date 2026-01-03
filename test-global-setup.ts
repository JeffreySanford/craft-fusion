// Global shims that must be applied before modules are imported in tests

// matchMedia shim for libs that call it at module import time (e.g., tinymce)
if (typeof window !== 'undefined' && typeof (window as any).matchMedia !== 'function') {
  (window as any).matchMedia = (query: string) => ({
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

// Ensure Element.animate exists
if (typeof window !== 'undefined' && typeof (window as any).Element !== 'undefined') {
  (window as any).Element.prototype.animate = function () {
    return {
      play: () => {},
      pause: () => {},
      finish: () => {},
      cancel: () => {},
      reverse: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any;
  };
}

// Expose a global spyOn bound to jest.spyOn for test code that uses Jasmine-style spyOn
if (typeof (global as any).spyOn === 'undefined') {
  try {
    // Prefer jest.spyOn when available
    if (typeof (global as any).jest !== 'undefined') {
        (global as any).spyOn = (obj: any, methodName: string) => {
          try {
            const spy = (global as any).jest.spyOn(obj, methodName as any);
            const safeSpy = spy || {
              mockReturnValue: (_v: any) => undefined,
              mockImplementation: (_f: any) => undefined,
            };
            (safeSpy as any).and = {
              returnValue: (v: any) => (safeSpy as any).mockReturnValue(v),
              callFake: (f: any) => (safeSpy as any).mockImplementation(f),
            };
            return safeSpy;
          } catch (e) {
            // If jest.spyOn fails, install a jest.fn on the target and return a Jasmine-like wrapper
            try {
              if (obj && methodName) {
                obj[methodName] = jest.fn();
              }
            } catch (e2) {
              // ignore
            }
            const dummy: any = {
              mockReturnValue: jest.fn(),
              mockImplementation: jest.fn(),
            };
            dummy.and = {
              returnValue: (v: any) => {
                if (obj && obj[methodName] && typeof obj[methodName].mockReturnValue === 'function') {
                  return obj[methodName].mockReturnValue(v);
                }
                return dummy.mockReturnValue(v);
              },
              callFake: (f: any) => {
                if (obj && obj[methodName] && typeof obj[methodName].mockImplementation === 'function') {
                  return obj[methodName].mockImplementation(f);
                }
                return dummy.mockImplementation(f);
              },
            };
            return dummy;
          }
        };
    } else {
      // Fallback wrapper that delegates to jest.spyOn if it appears later
      (global as any).spyOn = (...args: any[]) => (global as any).jest?.spyOn(...args);
    }
  } catch (e) {
    // noop
  }
}

// Minimal DOMMatrix shim for environments where it's not present (pdfjs, etc.)
if (typeof (global as any).DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}
