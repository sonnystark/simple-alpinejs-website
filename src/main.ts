import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';

Alpine.plugin(collapse);

declare global {
  interface Window {
    Alpine?: typeof Alpine;
  }
}

window.Alpine = Alpine;
Alpine.start();

export {};
