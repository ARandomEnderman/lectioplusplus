# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules for every agent (Claude Code, Codex, …)

This repository is a public fork: everything pushed is public. Never put personal information in git. That covers commits, commit messages, branch and tag names, code, comments, config, docs, release notes and fixtures:
- No real names, email addresses, usernames/handles, or school names/IDs of the maintainer or anyone else.
- No Lectio credentials, session cookies, student/teacher IDs, or real Lectio data (schedules, grades, absence, messages, assignments). Use made-up sample data, as `apps/lectioplus/preview/index.html` does.
- No screenshots or saved HTML from a logged-in Lectio session.
- No secrets or tokens. They belong in untracked `.env` files or CI secrets.
- Commit with a neutral identity (a noreply address), never a personal email. Check `git config user.name`/`user.email` before committing.
- Identifiers that need an owner or reverse-domain name (e.g. the Safari bundle ID) use the project name, not a person's.

## Overview

BetterLectio monorepo: an alternative client for Lectio (Danish school system). Code, identifiers, routes and UI text are largely in Danish (`skema` = schedule, `opgaver` = assignments, `lektier` = homework, `beskeder` = messages, `fravær` = absence, `karakterer` = grades, `indstillinger` = settings). Keep new UI text in Danish.

There is no root workspace: each app under `apps/` is independent with its own `package.json`/lockfile, so run commands from inside the app directory. The extension has DOM regression checks in `apps/lectioplus/tests` (`npm ci && npm test` there). Other apps have no test suite.

| App | Stack | Role |
|---|---|---|
| `apps/frontend` | SvelteKit (static SPA) + Tauri 2 | The main app, served as the website and packaged as desktop/Android app |
| `apps/api` | Python Flask | Lectio REST API (`api.betterlectio.dk`) that scrapes Lectio HTML |
| `apps/auth-sync-server` | SvelteKit (server routes) | `auth.betterlectio.dk`: Google OAuth, Google Calendar/Tasks sync, latest app release info |
| `apps/landing-page` | SvelteKit | Marketing site |
| `apps/lectioplus` | Plain JS/CSS, Manifest V3 | LectioPlus+ browser extension (Chrome/Edge/Safari) that restyles lectio.dk itself |
| `apps/depricated` | SvelteKit (JS) | Old app, kept for reference; don't develop here |

## Git

Always merge changes into `main` and push the result to `origin/main`.

## Commands

`apps/frontend`:
- `npm run svelte:dev`: web-only dev server (Vite, port 5173). Use this unless you need native features.
- `npm run dev` / `npm run build`: Tauri desktop dev/build (needs Rust; Android also needs Android Studio).
- `npm run svelte:build`: static build to `build/`.
- `npm run svelte:check`: type-check. The baseline already has pre-existing errors (e.g. in `routes/modul`), so compare counts before and after a change rather than expecting zero.
- `npm run lint` / `npm run format`: Prettier.

`apps/auth-sync-server` and `apps/landing-page`: `npm run dev`, `npm run build`, `npm run lint`, `npm run format` (auth-sync-server also has `npm run check`). auth-sync-server reads `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI` and `OCTO_KEY` from `$env/static/private` (a `.env` file).

`apps/api`: `pip install -r requirements.txt && python app.py` (port 5000), or `docker compose up`.

Releases are for the extension only, and they are automatic: bumping `version` in `apps/lectioplus/extension/manifest.json` and pushing to `main` publishes release `vX.Y.Z`, so only bump it when a release is intended. No tag push is needed; the workflow creates the tag. On every push to `main` touching the extension, `.github/workflows/release.yml` checks whether a tag for the manifest version exists, and if not, zips the extension for Chrome, converts it with `safari-web-extension-converter`, builds an ad-hoc-signed macOS Safari app and publishes everything as a GitHub release. It can also be started by hand (workflow_dispatch). Release asset names are unversioned (`lectioplus-chrome.zip`, `lectioplus-safari-macos.zip`, `install-safari.sh`), so `releases/latest/download/…` URLs always point at the newest build. `apps/lectioplus/safari/install.sh` installs or updates the Safari app from there, and the popup (`popup.js`) shows a notice when a newer release exists. Both contain the placeholder `__GITHUB_REPOSITORY__`, which the workflow replaces at build time so the owner name is never committed. Leave the placeholder in git; unpacked dev copies skip the update check. The Tauri desktop/Android build is not in use and has no workflow.

## Frontend architecture (`apps/frontend`)

- **Pure client-side SPA.** `src/routes/+layout.ts` sets `ssr = false` and `prerender = true` with `adapter-static`, so the same build ships as website and Tauri app. No SvelteKit server code.
- **Always talks to production backends.** `src/lib/lectio.ts` hard-codes `LECTIO_API = https://api.betterlectio.dk` and `LECTIO_OAUTH_API = https://auth.betterlectio.dk`, even in dev.
- **Auth flow.** `authStore` (in `src/lib/stores.ts`, persisted to localStorage) holds Lectio username, password, school ID and the session cookie. Every request sends the cookie in a `lectio-cookie` header (`src/lib/utils/http.ts`), and the API returns refreshed cookies in a `set-lectio-cookie` response header. `+layout.svelte` validates the cookie via `/check-cookie` and logs in again via `/auth` (headers `brugernavn`, `adgangskode`, `skoleid`) when it expires.
- **Data loading.** Most data lives in `lectioDataStore(endpoint, localStorageKey, initial, transformer?)` stores declared in `src/lib/stores.ts`: localStorage-backed stores with a `.fetch()` that calls the API and runs the transformer (raw API shape → app types in `src/lib/types`). Pages render cached data immediately, then call `.fetch()`. `http.ts` appends a `nonce` query param for cache-busting (`reloadData()` rotates it) and retries for up to ~100 s while offline (`connectionStore`).
- **Google sync** runs in a web worker (`src/lib/workers/calendarWorker.ts`) started from the layout, via the auth-sync-server.
- **UI components.** `src/lib/components/ui` holds shadcn-svelte components (generated; config in `components.json`) built on bits-ui/melt-ui. App components sit alongside it (`navigation/`, `lectio/`, `services/`, and so on).
- **Native side.** `src-tauri/src` adds the updater, autostart (desktop only) and Discord Rich Presence. Use `isDesktop`/`isWeb` from `$lib/utils` and `$lib/utils/environment` to guard Tauri-only calls, because Tauri APIs throw in a plain browser.

### Theming

The design system (palette, colour designs, density) was ported from the LectioPlus+ extension (`apps/lectioplus/extension/theme.css`, which uses hex `--lxp-*` variables). Keep both in sync when changing the palette:
- `src/app.pcss` defines all tokens as HSL triplets (`--primary: 240 45% 50%`) because `tailwind.config.js` wraps them as `hsl(var(--x) / <alpha-value>)`. Never use hex in these variables.
- Light/dark is the `.dark` class on `<html>`, managed by `mode-watcher`.
- The colour design is `data-design` on `<html>`. Each `:root[data-design=…]` block only sets `--design-accent-light/-dark`, `--design-tint-light/-dark` and `--design-mark`. `:root`/`.dark` then map those onto `--primary`, `--accent` and `--ring`.
- Density is `data-density` (`comfortable` | `compact`), which adjusts `.page-container` spacing.
- `src/lib/appearance.ts` (list of designs and densities, `appearanceStore` under localStorage key `appearance`) is the source of truth. An inline script in `src/app.html` applies the stored values before first paint, so keep the key and defaults in sync with it. To add a design, update `appearance.ts` and `app.pcss` together.
- Status colours: `text-tone-{blue,amber,green,red,teal,plum}` with matching `bg-tone-*-bg`. The `.page-container` / `.page-container-x` classes and the global h1–h3/ul/a styles in `app.pcss` apply unless an ancestor has class `unstyled`.

## API architecture (`apps/api`)

`app.py` holds all Flask routes. Each route builds a `lectio.sdk` client from the `lectio-cookie` header (or credentials on `/auth`), then calls a method on it. `lectio/lectio.py`'s `sdk` class only delegates: each feature lives in its own `lectio/_<feature>.py` module (e.g. `_skema.py`, `_opgaver.py`), which scrapes Lectio pages with BeautifulSoup. Unhandled exceptions are returned as `{"backend_error": <traceback>}` with status 500.

## Extension architecture (`apps/lectioplus`)

No build step: `extension/` is loaded as-is (`chrome://extensions` → Developer mode → Load unpacked). Open `preview/index.html` in a browser to try the UI with sample data; it loads the same files from `../extension`.

- Scripts share code through globals rather than modules (`globalThis.lectioPlusAppearance`, `lectioPlusBoot`, `lectioPlusData`, `lectioPlusWorkspace`, `lectioPlusIcon`, `lectioPlusHints`). Load order is set by the `content_scripts` entries in `manifest.json`, so a new script must be listed after the ones it depends on.
- `appearance.js` and `boot.js` run at `document_start` to apply the theme and hide the page until the UI is ready, avoiding a flash of unstyled Lectio. `native-theme.js` restyles Lectio's own pages and iframes at `document_end`, exposing `lectioPlusNativeTheme.ready` and `.flush()` so reveal can wait for the first color pass. Boot also guards the root school picker and matching Lectio/about:blank frames; skipped authentication/exam paths must remain untouched. `content.js` builds the app shell (sidebar, top bar, Ctrl+K search) and handles in-page navigation with `history.pushState` and same-origin `fetch` of Lectio pages. `workspace.js` renders the task, homework and message views, and `lectio-data.js` parses Lectio's HTML (dates in Europe/Copenhagen).
- Stored state in `chrome.storage.local` contains validated appearance, navigation and schedule preferences plus dashboard layout and user-authored notes/links. Never persist scraped school data. `appearance.js` owns defaults and validation; `settings.js` owns the categorized editor. Custom URLs must be http(s) without credentials; render user text using DOM text nodes. Resetting dashboard layout preserves custom fields but hides them. Login, logout and exam pages are skipped by path regex in `boot.js`, `native-theme.js` and `content.js`.
- The Strafe Clicker tab (below Beskeder in the sidebar) is the only page not backed by Lectio: `content.js` shows it when the URL hash is `#lxp-clicker` (`clickerPage`), embedding clicker.strafe-mc.com in an iframe that is created on first open and kept alive while enabled. Setting `showClicker` to false removes the iframe, sidebar entry and dashboard banner. It is deliberately not in `links`, because entries there are matched against Lectio URLs. The Overblik banner links to the same hash.
- The Strafe Clicker tab links to the game in its own browser tab for users whose browser blocks its session cookie in the iframe. The game manages that session on its own domain.
- The default look is the `strafe` design in dark mode (`appearance.js` defaults), which copies Strafe Clicker's colours and system font. In dark mode it also overrides the surface colours (`theme.css`). The frontend app has no `strafe` design.
- Lectio's own CSS can give `body` a fixed width (`100%`/`100dvw`) and `overflow: hidden`, so `body.lxp-enabled` uses `box-sizing: border-box` to keep the sidebar padding inside it. Full-height views like the clicker are `position: fixed` to the visible area. A plain stub page won't reproduce this, so test layout changes with those body rules added.
- Festtilstand (party mode, `party` preference, off by default; switches in the popup and in Settings → Udseende) adds `data-lxp-party` to `<html>`: `party.css` (rainbows, wobble, Comic Sans, blinking badges) and `party.js` (click confetti, cursor sparkles). It stays off when `reducedMotion` is on, and all its animations sit inside `@media (prefers-reduced-motion: no-preference)`. Keep the photosensitivity limits: nothing large flashes, nothing alternates light/dark more than 3 times a second, hard blinking only on small badges at 1 Hz. `tests/party.cjs` checks the guards.
- All CSS classes and variables are prefixed `lxp-`, so they don't collide with Lectio's own styles.

### School tools

The extension's `school-*` modules implement the offline HjælpeMiddler workspace. Validate domains, units and all calculation results. The classic calculator is sequential; the scientific parser follows operator precedence. Ionic-compound names are limited to the reference-backed catalog; charge balance alone does not establish a substance. `toolbox` preferences hold only settings and user-authored notes/cards. The general AI chat was removed at the user's request. Test 18 includes a dedicated offline Danish punctuation model (no chat, API key or network inference). Do not claim logged-in Lectio testing from fixtures. Danish remains default, with optional English/mixed terminology; translation coverage is partial.

### Local punctuation (Test 18–20)

`punctuation-client.js` opens a hidden extension-origin `punctuation-frame.html` only when requested. Installed builds use `chrome.runtime.connect` with a per-frame token and browser-supplied sender checks; only the same-origin localhost preview uses a MessageChannel. The frame owns a dedicated module worker. Do not reintroduce cross-origin window.postMessage in the installed path. `punctuation-worker.mjs` runs the bundled int8 model using single-threaded ONNX Runtime Web WASM; `punctuation-core.js` preserves word offsets, protected notation and line breaks. All assets are under `extension/vendor/punctuation`, with pinned revisions, licenses and hashes. Keep these assets together; no remote scripts or silent rule-engine fallback. Startup has finite deadlines and reports file/runtime stages. Model errors and missing punctuation remain possible. Do not describe passing runtime tests as perfect language quality or live browser verification. The direct file:// demo cannot run the model.

Single line wraps share model context; blank lines delimit paragraphs. Before comma reinforcement, `guardBoundaries` can veto an uncertain full stop before a detached prepositional phrase using `school-writing.js`'s pure `danglingPrepositionalPhrase` helper. This is a bounded heuristic, not a general parser. Maintain contrasting complete sentences and already-punctuated examples in `tests/fixtures/punctuation-sentences.json` when changing it.


### Code workshop and games (0.1.5)

`workbench-client.js` communicates through `workbench-host.html` with the opaque sandbox `workbench-sandbox.html`, which owns a classic blob worker. Keep sandbox CSP hashes synchronized using `tests/sync-workbench-sandbox.cjs`. Bundled runtimes and licenses live in `extension/vendor/workbench`; ship the entire directory. Interactive Python input uses WebAssembly JSPI and suspends the execution deadline while awaiting an answer. Do not replay code to simulate input.

`school-code-lessons.js` contains 125 exercises in five levels; source guides and reference solutions are under `tests/fixtures`. Preserve exercise IDs, drafts and progress. `games-core.js` owns pure game logic; `games.js` renders `#lxp-games` routes. Games use local preferences. Gæt læreren reads teacher names and photos from the current school while its quiz is open. Keep this data in tab memory and respect the photo visibility setting.

Run `npm ci --prefix apps/lectioplus/tests` and `npm test --prefix apps/lectioplus/tests` with Node 24 for release validation, including the real Python runtime tests. Fixture tests do not establish live browser or logged-in Lectio compatibility.
