const nxPreset = require('@nx/jest/preset').default;
const path = require('path');

const preset = { ...nxPreset };

// Ensure global shims run before any module imports (e.g., tinymce)
// Use paths relative to each project's rootDir so the files are resolvable
preset.setupFiles = ['<rootDir>/../../test-global-setup.ts'].concat(preset.setupFiles || []);

// Provide moduleNameMapper entry for tinymce to use our lightweight mock during tests
preset.moduleNameMapper = Object.assign({}, preset.moduleNameMapper || {}, {
	'^tinymce$': '<rootDir>/../../__mocks__/tinymce.js',
	'^tinymce/(.*)$': '<rootDir>/../../__mocks__/tinymce/$1.js',
	'^mapbox-gl$': '<rootDir>/../../__mocks__/mapbox-gl.js',
	'^mapbox-gl/(.*)$': '<rootDir>/../../__mocks__/mapbox-gl.js',
	'^pdfjs-dist$': '<rootDir>/../../__mocks__/pdfjs-dist.js',
	'^pdfjs-dist/(.*)$': '<rootDir>/../../__mocks__/pdfjs-dist.js',
});

module.exports = preset;
