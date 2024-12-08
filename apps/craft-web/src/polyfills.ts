// polyfills.ts
import 'zone.js';  // Required for Angular

// Modern Array Methods
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement: any, fromIndex?: number) {
    return this.indexOf(searchElement, fromIndex) !== -1;
  };
}

// Modern Storage APIs
if (!('localStorage' in window)) {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    }
  });
}
