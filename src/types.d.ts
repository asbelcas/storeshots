/**
 * Minimal ambient type shim: opentype.js 1.3.4 ships no bundled types and we
 * only need loadSync + glyph metrics. Declaring the module as `any` keeps the
 * dependency pinned and the build hermetic without @types packages.
 */
declare module 'opentype.js';
