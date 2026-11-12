# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

BetterLectio monorepo: an alternative client for Lectio (Danish school system). Code, identifiers, routes and UI text are largely in Danish (`skema` = schedule, `opgaver` = assignments, `lektier` = homework, `beskeder` = messages, `fravær` = absence, `karakterer` = grades, `indstillinger` = settings). Keep new UI text in Danish.

There is no root workspace: each app under `apps/` is independent with its own `package.json`/lockfile, so run commands from inside the app directory. There is no test suite in any app.

| App | Stack | Role |
|---|---|---|
| `apps/frontend` | SvelteKit (static SPA) + Tauri 2 | The main app, served as the website and packaged as desktop/Android app |
| `apps/api` | Python Flask | Lectio REST API (`api.betterlectio.dk`) that scrapes Lectio HTML |
| `apps/auth-sync-server` | SvelteKit (server routes) | `auth.betterlectio.dk`: Google OAuth, Google Calendar/Tasks sync, latest app release info |
| `apps/landing-page` | SvelteKit | Marketing site |
| `apps/depricated` | SvelteKit (JS) | Old app, kept for reference; don't develop here |

## Commands

`apps/frontend`:
- `npm run svelte:dev`: web-only dev server (Vite, port 5173). Use this unless you need native features.
- `npm run dev` / `npm run build`: Tauri desktop dev/build (needs Rust; Android also needs Android Studio).
- `npm run svelte:build`: static build to `build/`.
- `npm run svelte:check`: type-check. The baseline already has pre-existing errors (e.g. in `routes/modul`), so compare counts before and after a change rather than expecting zero.
- `npm run lint` / `npm run format`: Prettier.

`apps/auth-sync-server` and `apps/landing-page`: `npm run dev`, `npm run build`, `npm run lint`, `npm run format` (auth-sync-server also has `npm run check`). auth-sync-server reads `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI` and `OCTO_KEY` from `$env/static/private` (a `.env` file).

`apps/api`: `pip install -r requirements.txt && python app.py` (port 5000), or `docker compose up`.

Releases: pushing a `vX.Y.Z` tag runs `.github/workflows/release.yml`, which builds Tauri bundles for Windows and Ubuntu with bun (`bun tauri`).

## Frontend architecture (`apps/frontend`)

- **Pure client-side SPA.** `src/routes/+layout.ts` sets `ssr = false` and `prerender = true` with `adapter-static`, so the same build ships as website and Tauri app. No SvelteKit server code.
- **Always talks to production backends.** `src/lib/lectio.ts` hard-codes `LECTIO_API = https://api.betterlectio.dk` and `LECTIO_OAUTH_API = https://auth.betterlectio.dk`, even in dev.
- **Auth flow.** `authStore` (in `src/lib/stores.ts`, persisted to localStorage) holds Lectio username, password, school ID and the session cookie. Every request sends the cookie in a `lectio-cookie` header (`src/lib/utils/http.ts`), and the API returns refreshed cookies in a `set-lectio-cookie` response header. `+layout.svelte` validates the cookie via `/check-cookie` and logs in again via `/auth` (headers `brugernavn`, `adgangskode`, `skoleid`) when it expires.
- **Data loading.** Most data lives in `lectioDataStore(endpoint, localStorageKey, initial, transformer?)` stores declared in `src/lib/stores.ts`: localStorage-backed stores with a `.fetch()` that calls the API and runs the transformer (raw API shape → app types in `src/lib/types`). Pages render cached data immediately, then call `.fetch()`. `http.ts` appends a `nonce` query param for cache-busting (`reloadData()` rotates it) and retries for up to ~100 s while offline (`connectionStore`).
- **Google sync** runs in a web worker (`src/lib/workers/calendarWorker.ts`) started from the layout, via the auth-sync-server.
- **UI components.** `src/lib/components/ui` holds shadcn-svelte components (generated; config in `components.json`) built on bits-ui/melt-ui. App components sit alongside it (`navigation/`, `lectio/`, `services/`, and so on).
- **Native side.** `src-tauri/src` adds the updater, autostart (desktop only) and Discord Rich Presence. Use `isDesktop`/`isWeb` from `$lib/utils` and `$lib/utils/environment` to guard Tauri-only calls, because Tauri APIs throw in a plain browser.

### Theming

The design system (palette, colour designs, density) was ported from the former LectioPlus+ extension:
- `src/app.pcss` defines all tokens as HSL triplets (`--primary: 240 45% 50%`) because `tailwind.config.js` wraps them as `hsl(var(--x) / <alpha-value>)`. Never use hex in these variables.
- Light/dark is the `.dark` class on `<html>`, managed by `mode-watcher`.
- The colour design is `data-design` on `<html>`. Each `:root[data-design=…]` block only sets `--design-accent-light/-dark`, `--design-tint-light/-dark` and `--design-mark`. `:root`/`.dark` then map those onto `--primary`, `--accent` and `--ring`.
- Density is `data-density` (`comfortable` | `compact`), which adjusts `.page-container` spacing.
- `src/lib/appearance.ts` (list of designs and densities, `appearanceStore` under localStorage key `appearance`) is the source of truth. An inline script in `src/app.html` applies the stored values before first paint, so keep the key and defaults in sync with it. To add a design, update `appearance.ts` and `app.pcss` together.
- Status colours: `text-tone-{blue,amber,green,red,teal,plum}` with matching `bg-tone-*-bg`. The `.page-container` / `.page-container-x` classes and the global h1–h3/ul/a styles in `app.pcss` apply unless an ancestor has class `unstyled`.

## API architecture (`apps/api`)

`app.py` holds all Flask routes. Each route builds a `lectio.sdk` client from the `lectio-cookie` header (or credentials on `/auth`), then calls a method on it. `lectio/lectio.py`'s `sdk` class only delegates: each feature lives in its own `lectio/_<feature>.py` module (e.g. `_skema.py`, `_opgaver.py`), which scrapes Lectio pages with BeautifulSoup. Unhandled exceptions are returned as `{"backend_error": <traceback>}` with status 500.
