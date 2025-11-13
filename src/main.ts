// Client entry (TypeScript) — imports Alpine from node_modules and starts it.
// The Bun bundler will bundle Alpine into the output bundle so public/js/main.js
// contains everything the browser needs.

import Alpine from 'alpinejs';

// Expose on window for debug / directives to find it; TypeScript window typing:
declare global {
  interface Window {
    Alpine?: typeof Alpine;
  }
}

window.Alpine = Alpine;
Alpine.start();

// Note: keep client code minimal here — Alpine in the HTML handles accordion behavior declaratively.
export {};
