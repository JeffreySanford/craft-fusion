/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes recent versions of Safari, Chrome (including
 * Opera), Edge, and Firefox.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js';  // Included with Angular CLI.

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

// Import web animations module for smoother animations
import 'web-animations-js';

// Import intersection observer for better scroll detection
import 'intersection-observer';

// Polyfill for older browsers that don't support the Internationalization API
if (!Intl.PluralRules) {
  require('@formatjs/intl-pluralrules/polyfill');
  require('@formatjs/intl-pluralrules/locale-data/en');
}

// Added for custom elements support if needed
import '@webcomponents/custom-elements/custom-elements.min.js';

// Polyfill for CSS variables in IE11 if needed
// import 'css-vars-ponyfill';

// For IE11 support (if needed)
// import 'classlist.js';
// import 'core-js/features/array/includes';
// import 'core-js/features/string/includes';
