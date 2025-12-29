// Node.js types file for @napi-rs/canvas and mammoth
// This is essentially a marker file to ensure @types/node is loaded correctly

// Make this an external module
export {};

// No need for custom type definitions as they are all provided by @types/node
// Just including this file in tsconfig ensures the TypeScript compiler knows to include @types/node

// Declare the module for ReadableStream used in canvas
declare module 'node:stream/web' {
  // Empty interface - just ensuring the module is recognized
}

// Similarly for other Node.js modules used in dependencies
declare module 'http' {
  // Empty interface
}

declare module 'stream' {
  // Empty interface
}
