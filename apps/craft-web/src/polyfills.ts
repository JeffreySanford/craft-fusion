/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js'; // Included with Angular CLI.

import * as jest from 'jest-mock';

/***************************************************************************************************
 * Additional Safe Guards
 *
 * Provide fallbacks for common `window`, `document`, and global references.
 * These ensure that the application can run in environments where these objects are not available.
 */
if (typeof window === 'undefined') {
  (global as any).window = {};
}

if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
  };
}

/***************************************************************************************************
 * Polyfills for Legacy Browsers
 *
 * These ensure compatibility with older browsers or specific environments, including older versions
 * of Android and iPhone (iOS) browsers.
 */

/** ✅ Modern Array.prototype.includes Polyfill
 * Ensures compatibility with older browsers that do not support Array.prototype.includes.
 */
if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement: any, fromIndex?: number): boolean {
    return this.indexOf(searchElement, fromIndex) !== -1;
  };
}

/** ✅ Modern String.prototype.startsWith Polyfill
 * Ensures compatibility with older browsers that do not support String.prototype.startsWith.
 */
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString: string, position?: number): boolean {
    return this.indexOf(searchString, position || 0) === (position || 0);
  };
}

/** ✅ Modern Object.assign Polyfill
 * Ensures compatibility with older browsers that do not support Object.assign.
 */
if (!Object.assign) {
  Object.assign = function (target: any, ...sources: any[]): any {
    if (target === null || target === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    for (const source of sources) {
      if (source !== null || source !== undefined) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };
}

/** ✅ Modern Promise Polyfill
 * Ensures compatibility with older browsers that do not support Promises.
 */
if (typeof Promise === 'undefined') {
  (window as any).Promise = require('es6-promise').Promise;
}

/***************************************************************************************************
 * localStorage & sessionStorage Polyfills
 *
 * Ensure safe usage of `localStorage` and `sessionStorage` in environments lacking native support.
 * These polyfills provide a fallback implementation using a Map.
 */
if (typeof window !== 'undefined') {
  if (!('localStorage' in window)) {
    console.warn('Polyfilling localStorage...');
    const storage = new Map<string, string>();

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage.get(key) || null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
        key: (index: number) => Array.from(storage.keys())[index] || null,
        get length() {
          return storage.size;
        },
      },
      writable: false,
    });
  }

  if (!('sessionStorage' in window)) {
    console.warn('Polyfilling sessionStorage...');
    const storage = new Map<string, string>();

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: (key: string) => storage.get(key) || null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
        key: (index: number) => Array.from(storage.keys())[index] || null,
        get length() {
          return storage.size;
        },
      },
      writable: false,
    });
  }
}

/***************************************************************************************************
 * IntersectionObserver Polyfill
 *
 * Adds IntersectionObserver for lazy loading and efficient DOM observation.
 * Ensures compatibility with environments that do not support IntersectionObserver.
 */
if (typeof IntersectionObserver === 'undefined') {
  require('intersection-observer');
}

/***************************************************************************************************
 * ResizeObserver Polyfill
 *
 * Adds ResizeObserver for observing DOM element size changes.
 * Ensures compatibility with environments that do not support ResizeObserver.
 */
if (typeof ResizeObserver === 'undefined') {
  require('resize-observer-polyfill');
}

/***************************************************************************************************
 * Browser Compatibility Extras
 *
 * Add any additional specific polyfills or shims here.
 */
// Example: Reflect Metadata Polyfill (if using decorators in legacy environments)
import 'core-js/proposals/reflect-metadata';

/***************************************************************************************************
 * Global Compatibility
 *
 * Provide fallbacks for common global references.
 * 
 * Returns a warning message if the global object is used instead of Angular Renderer2.
 */
const globalProxyHandler = {
  get(target: any, prop: string) {
    console.warn(`Warning: Accessing global property '${prop}' directly. Use Angular Renderer2 for DOM manipulations.`);
    return target[prop];
  },
  set(target: any, prop: string, value: any) {
    console.warn(`Warning: Setting global property '${prop}' directly. Use Angular Renderer2 for DOM manipulations.`);
    target[prop] = value;
    return true;
  }
};

(global as any).window = new Proxy((global as any).window || {}, globalProxyHandler);
(global as any).document = new Proxy((global as any).document || {}, globalProxyHandler);
(global as any).ResizeObserver = (global as any).ResizeObserver || jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

/***************************************************************************************************
 * Final Initialization
 *
 * Run any final compatibility initialization code here.
 */
console.log('✅ Polyfills successfully loaded.');

declare const window: any;
declare const document: any;
declare const IntersectionObserver: any;
declare const ResizeObserver: any;
