# Cafe Westen — Bun + TypeScript client + Alpine (Accordion demo)

This repository is a small static site for Cafe Westen. It uses Bun as the runtime and bundler, a TypeScript client entry that bundles Alpine.js, plain HTML/CSS for layout and styles, and a tiny Bun static server. Alpine is used only to provide accessible accordion behavior (one panel open at a time). Images and fonts are served from the `public/` directory.

I set this project up by:
- creating a minimal Bun static server (`server.js`) to serve files from `public/`,
- adding a TypeScript client entry (`src/main.ts`) that imports Alpine and starts it so Bun's bundler inlines Alpine into the final client bundle,
- wiring the accordion UI declaratively in HTML with Alpine directives so Alpine is only responsible for toggling accordion panels open/closed,
- providing responsive images, x-cloak to avoid FOUC, and basic accessibility attributes (aria-expanded, role=region, aria-controls/aria-labelledby).

Below is a concise guide describing what is in the repo, how things work, and how to run and extend the project.

## Tech stack
- Bun
  - Used for the static server and for bundling TypeScript client code (`bun build`).
- TypeScript
  - Client entry `src/main.ts` is written in TypeScript and compiled/bundled by Bun.
- Alpine.js
  - Imported from `node_modules` and bundled into the client bundle. Used only for accordion behavior (x-data, x-show, x-transition, etc.).
- HTML & CSS
  - Static markup in `public/index.html` and styles in `public/styles.css`.
- Static assets
  - Images, icons and fonts live under `public/` (for example `public/assets/img` and `public/fonts`).

## Files and responsibilities
- `package.json`
  - Scripts for building and starting:
    - `build` — bundle the TypeScript client with Bun.
    - `start` — builds then starts the server.
    - `dev` — build in watch mode (when used) and run server.
- `tsconfig.json`
  - TypeScript configuration for the client code.
- `server.js`
  - Minimal Bun.serve static server serving files from `./public`.
  - Maps extensions to MIME types (including fonts), and sets Cache-Control for fonts.
- `src/main.ts`
  - TypeScript client entry that imports Alpine (`import Alpine from "alpinejs";`), attaches it to `window.Alpine`, and calls `Alpine.start()`.
  - (Previously included a keyboard helper; you chose to skip that — the current client only starts Alpine.)
- `public/index.html`
  - The page markup. The accordion is structured so a parent `x-data="{ open: null }"` controls which panel is open (one at a time).
  - Buttons use `@click="open = (open === <id> ? null : <id>)"` and `:aria-expanded`.
- `public/styles.css`
  - All visual styles; includes `[x-cloak] { display: none !important; }`, accordion styles, responsive image rules, and font usage.
- `public/assets/*`
  - Images and icons used by the site (e.g. `public/assets/img/…`, `public/assets/icons/…`).
- `public/fonts/*` (optional / recommended)
  - Self-hosted font files (e.g. `inter-400.woff2`) and `@font-face` declarations in CSS.

## Key behaviors & implementation notes

Accordion (single-open behavior)
- The accordion group uses a parent Alpine scope: `x-data="{ open: null }"` on the container.
- Each item sets `@click="open = (open === 1 ? null : 1)"` (or string-based ids if preferred).
- Each panel uses `x-show="open === 1"` and `x-transition`, plus `x-cloak` to avoid flash before Alpine initializes.
- Accessibility:
  - Buttons include `aria-expanded` and `aria-controls`.
  - Panels include `role="region"` and `aria-labelledby`.
  - Button elements are real `<button>`s, so Enter/Space activate them by default.

Bundling Alpine & TypeScript client
- The client entry (`src/main.ts`) imports Alpine as a module. Bun's bundler resolves and inlines Alpine into the output bundle.
- Output bundle is `public/js/main.js` (produced by `bun build`).
- Because Alpine is bundled, the browser only needs to load that single module.

Images and media
- Put image files under `public/assets/img/` (or a path of your choosing under `public/`).
- Use `<picture>` / `srcset` and `sizes` for responsive images and include `loading="lazy"` for offscreen images.
- If images are shown inside an accordion, `x-cloak` and `x-transition` keep things tidy. If you need smooth height collapse animations, consider the `@alpinejs/collapse` plugin (optional).

Fonts
- Self-host fonts under `public/fonts/` (recommended file types: `woff2`, then `woff` fallback).
- Add `@font-face` rules in `public/styles.css` and a preload `<link rel="preload" as="font">` in the HTML head for critical fonts.
- `server.js` includes MIME mappings and adds long cache headers for fonts.

Server behavior & caching
- `server.js` is a tiny static server intended for development. It:
  - Serves files under `./public`.
  - Provides reasonable Content-Type headers.
  - Sets `Cache-Control: public, max-age=31536000, immutable` for font files.
- For production, serve static assets through a proper CDN / web server with content-hashed filenames.

## How to run
1. Install dependencies:
```bash
bun install
```

2. Build client bundle:
```bash
bun run build
```

3. Start the server (build is run automatically by `start` script):
```bash
bun run start
```

4. Open the site at:
```
http://localhost:3000
```

Development (watch + server)
- If you use the `dev` script (configured to run `bun build --watch`), rebuilds will run on file changes. You can then reload the browser to see changes. (A live-reload client is not included.)

## Troubleshooting checklist
- Alpine is present: check `window.Alpine` in the browser console.
- Parent scoping: ensure only the accordion container has `x-data="{ open: null }"`; remove any child `x-data` that shadow `open`.
- x-cloak: ensure CSS contains `[x-cloak]{display:none!important}` to avoid flashes.
- Bundling: check `public/js/main.js` is the latest bundle from `bun build` (Network tab in DevTools). Re-run `bun run build` if stale.
- JS errors: open DevTools console to spot runtime errors that might stop Alpine from initializing.

## Optional improvements you might add later
- Add `@alpinejs/collapse` for smooth animated height transitions when panels open/close.
- Implement keyboard navigation (Up/Down/Home/End) for arrow-key interaction between headers (roving focus) — previously prepared, but skipped for now.
- Add a small live-reload helper so the browser refreshes automatically after rebuilds.
- Add content-hashed filenames (e.g. via a build step) for long-term caching in production.
- Add unit / integration tests if you expand client logic beyond declarative Alpine usage.

## Final notes (the story)
I wired the project so Alpine is limited in scope and only responsible for accordion toggle behavior. The client is authored in TypeScript (`src/main.ts`) and bundled with Bun, which keeps the browser payload to a single client bundle (`public/js/main.js`). The server is intentionally minimal and geared towards development; static assets (images, fonts) are stored under `public/` so Bun serves them directly with correct mime types and caching headers. You asked to skip the keyboard helper for now, so the codebase focuses on a minimal, accessible accordion pattern with ARIA attributes, `x-cloak`, and `x-transition`. When you are ready later, we can add smooth collapse animation, keyboard navigation, or a live-reload workflow — the project is structured so those features can be added with a small change to `src/main.ts` and a rebuild.

Enjoy working on Cafe Westen — if you want, I can commit this README into your repo or open a PR with the file added.
