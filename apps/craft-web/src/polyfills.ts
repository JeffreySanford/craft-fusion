/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js';  // Included with Angular CLI.

/***************************************************************************************************
 * Polyfills for older browsers.
 */

// Modern Array Methods (if targeting very old browsers)
if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement: unknown, fromIndex?: number): boolean {
    return this.indexOf(searchElement, fromIndex) !== -1;
  };
}

// Modern localStorage Polyfill (if targeting very old browsers)
if (!('localStorage' in window)) {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      key: (index: number) => Array.from(storage.keys())[index] || null,
      length: storage.size
    },
    writable: false
  });
}

/***************************************************************************************************
 * Other Browser Compatibility Features.
 * Add any other specific polyfills you need here.
 */
