/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js'; // Included with Angular CLI.
import 'tslib';

/***************************************************************************************************
 * Additional Safe Guards
 *
 * Provide fallbacks for common `window`, `document`, and global references.
 * These environments might not be fully implemented in non-browser environments.
 */
(global as any).window = (global as any).window || {};
(global as any).document = (global as any).document || {};
(global as any).ResizeObserver = (global as any).ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
