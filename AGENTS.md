# Repository Guidelines

## Working Principle: Root Cause First
- Every problem (bug, failing check, regression, review remark, tool error that keeps coming back) has a root cause. Find it with "5 whys" before fixing; a fix that only hides the symptom is not done.
- Then stop it from happening again, preferably with an automatic safeguard (test, type, lint rule, CI step) rather than a note. If that is not possible, record the cause and the rule in this file.
- A recurring warning or error is a problem, not noise: do not work around it again and again.
- When reporting a fix, state the root cause and what now prevents it. If a bug could not be reproduced, say so; never claim it is fixed.

### Past incidents (cause → prevention)
- Tooltip/popup on the geolocation marker: `cacheAt` excluded known layers (blacklist), so any new layer leaked in → whitelist `vectorLayer` only.
- Dead basemaps (Carto, Stamen): tile URLs were never checked after being added → check with `curl` when adding or touching a basemap.
- Flash of unstyled page in dev: the hiding rule lived in CSS that Vite injects through JS → critical rule inline in `app/index.html`.
- Type errors piling up unnoticed: CI did not run `tsc` → `npx tsc --noEmit` is now a CI step (`check.yml`); also run it before finishing.

## Project Structure & Module Organization
- `app/` contains the Vite HTML entry (`index.html`) used for dev/build.
- `static/` holds public assets copied as-is at build time (favicons, manifest, map icons).
- `public/` is the build output directory produced by `npm run build` (what Nginx should serve).
- `src/` holds TypeScript logic (`main.ts`) and styling (`style.css`); `src/gpx/` parsing, `src/map/` layers/controls/styles, `src/ui/` DOM helpers (icons, panel, settings), `src/i18n/` translations.
- `CHANGELOG.md` follows Keep a Changelog; add user-visible changes under the next version. The version lives in `package.json`.
- `package.json`, `vite.config.ts`, `tsconfig.json`, and `biome.json` define tooling.

## Build, Test, and Development Commands
- `npm install` – install dependencies (Vite, TypeScript, OpenLayers, Biome).
- `npm run dev` – launch Vite dev server (entry: `app/index.html`).
- `npm run build` – bundle the app into `public/` (HTML/CSS/JS, tree-shaken).
- `npm run preview` – serve the built bundle locally for smoke tests.
- `npm test` – run the Vitest unit tests (jsdom). Config is in `vite.config.ts`.
- `npx tsc --noEmit` – type check; it must report zero errors.
- `npm run lint` – run Biome check with auto-fix on project sources.
Run commands from the repo root. Dev and build use the base path `/gpxviewer/` (open http://localhost:5173/gpxviewer/ during `npm run dev`).

## Coding Style & Naming Conventions
- TypeScript with ES modules. Formatting, import order and unused code are enforced by Biome (`npm run lint`).
- Name functions and variables in `camelCase`; exported modules/components in `PascalCase` only when they represent classes or singletons.
- Asset files follow the existing pattern (`type_*.png`, control icons); keep filenames lowercase with dashes/underscores for readability. Keep source assets in `static/`, not in `public/`.

## Testing Guidelines
- Unit tests (Vitest + jsdom) sit next to the code as `*.test.ts` and cover pure logic only: GPX parsing, filters (`isFeatureVisible`), coordinate formatting, settings. Add or update tests when touching that logic; keep map/DOM wiring out of them.
- Run `npm test`, `npx tsc --noEmit`, `npx biome check src` and `npm run build` before declaring work done. The CI (`.github/workflows/check.yml`) runs lint (read-only, it fails instead of fixing), type check, tests and build; `deploy.yml` runs it first and only deploys if it passes.
- UI changes are verified manually in the browser: `npm run dev`, load a GPX via the UI (file or URL), zoom/pan, open popups, toggle filters, test the sidebar, basemap picker and location controls.
- For data parsing changes, exercise multiple GPX samples (found vs unfound caches, tracks/routes, non-cache waypoints, different sizes).
- To load a test GPX by URL, copy it temporarily into `static/` and delete the copy afterwards; never leave test files in the repo.
- Accessibility: clickable things are `<button>`s (never `div`/`img`), groups are labelled, text comes from i18n keys (also `aria-label`). After UI changes inject axe-core (cdnjs script) in the page and expect zero violations; `html-has-lang` on `#claude-ai` is an artefact of the Chrome extension.
- Geolocation can be tested by overriding `navigator.geolocation.watchPosition` with a fake position.
- If the page ignores a CSS change (computed style differs from the file), the dev server missed the edit: restart it before debugging the CSS.
- Start the dev server with `--strictPort`: if the port is taken Vite silently moves to another one, and the browser then shows whatever else listens there (blank page).
- `pkill -f` in a shell chain kills the shell (exit code 144 here): start the dev server in the background and stop it on its own, never combined with other commands.

## Architecture & Gotchas
- Privacy: GPX files are processed only in the browser. Never upload them or add features that need them server-side (e.g. share-by-URL with the content).
- Layers: caches are in `vectorLayer`; tracks (`trackLayer`), labels, perimeters and geolocation each have their own source. Map interactions (`cacheAt` in `main.ts`) only consider `vectorLayer`, so a new layer must never be treated as a cache.
- Filtering: all cache filters go through `isFeatureVisible` in `src/map/styles.ts`; after changing one, refresh labels/perimeters (`refreshOverlayLayers`) and call `vectorLayer.changed()`. Type/difficulty/terrain/hide-found filters are deliberately not persisted; display settings (basemap, labels, perimeters, sidebar) are, via `src/ui/settings.ts`.
- Credits: every new dependency, data source or third-party asset must be added to the list in `src/ui/about.ts` (name, official site, license) in the same change.
- i18n: every new string needs a key in all five locales (en, fr, de, es, it) in `src/i18n/translations.ts`.
- Icons: use Lucide through `src/ui/icons.ts` (`icon` for DOM, `iconLabel` for OpenLayers control labels, which only accept `HTMLElement`). Lucide has no brand icons, so the GitHub logo is an inline SVG.
- Basemaps: tile URLs rot. Check a tile with `curl` before adding one, prefer sources without a key, and add a thumbnail in `static/icons/basemaps/`.
- Layout: the sidebar overlays a full-width map; the map must not resize or move when it collapses.

## Commit & Pull Request Guidelines
- Use concise, imperative commits (e.g., `fix: handle empty cache size`, `docs: clarify build steps`); group unrelated changes separately.
- PRs should include a brief summary, linked issues (if any), screenshots or GIFs for UI/visual updates, and noted manual test steps.
- Avoid committing generated `public/` build output unless explicitly needed for a release; prefer source changes plus build instructions.
