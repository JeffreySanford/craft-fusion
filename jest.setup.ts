import 'jest-preset-angular/setup-jest';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Provide a minimal matchMedia polyfill for libraries (e.g., tinymce) used in tests
if (typeof (window as any).matchMedia !== 'function') {
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

// Provide a global `spyOn` helper that maps to Jest's spyOn when running under Jest
if (typeof (global as any).spyOn === 'undefined' && typeof (global as any).jest !== 'undefined') {
	(global as any).spyOn = (global as any).jest.spyOn.bind((global as any).jest);
}

// Ensure Element.animate is a function in the test environment (override if necessary)
if (typeof (window as any).Element !== 'undefined') {
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
