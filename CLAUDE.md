# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MoneyTracker is a personal expense/income tracker split into independent projects in one repo, sharing no code or package management between them:

- **`Server/`** — NestJS + TypeORM + MySQL REST API (the backend of record).
- **`Client/`** — Create React App (TypeScript) web frontend, with a small internal design system at `Client/src/components/ui/`. This is the actively developed, feature-complete web client.
- **`Mobile/`** — React Native + Expo (TypeScript, `expo-router`) mobile client, targeting feature parity with `Client/` against the same REST API. This is the actively developed mobile client going forward.
- **`app/`** — Flutter mobile client. Deprecated in favor of `Mobile/` — an early-stage skeleton (splash/login/register screens only) left untouched; do not build on it.

There is no root-level package manager or workspace config — each of `Server/`, `Client/`, `Mobile/`, and `app/` is installed and run independently from within its own directory. `Server/` and `Client/` duplicate their enums/DTOs by hand (see below); `Mobile/` follows the same convention rather than introducing a shared package — its `src/types`, `src/apis`, and `src/store` are intentionally structured to mirror `Client/src/types`, `src/apis`, and `src/store` so logic ports cleanly between the two clients.

## Commands

### Server (`Server/`, NestJS API)

```bash
npm install
npm run start:dev        # dev server with watch, http://localhost:5000
npm run build            # nest build -> dist/
npm run lint             # eslint --fix on src/apps/libs/test
npm run format            # prettier --write on src/**/*.ts

npm run test              # unit tests (jest), rootDir=src, matches *.spec.ts
npm run test -- users.service          # run a single spec by name pattern
npm run test:watch
npm run test:cov
npm run test:e2e          # e2e tests via test/jest-e2e.json
```

Database migrations (TypeORM, `synchronize: false` — schema changes always go through a migration):

```bash
npm run m:gen --name=SomeMigrationName    # generate from entity diff
npm run m:create --name=SomeMigrationName # empty migration
npm run m:run                             # apply pending migrations
```
(`m:win:*` variants exist for Windows shells where `$npm_config_name` isn't expanded.)

Requires a `.env` (see `Server/.env.example`) with `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `JWT_EXPIRATION_TIME` — the app will not boot without a reachable MySQL instance.

### Client (`Client/`, CRA + TypeScript)

```bash
npm install
npm start                 # dev server, http://localhost:3000
npm run build
npm test                  # react-scripts test (Jest + RTL), interactive watch
npm test -- --testPathPattern=SomeComponent   # run a single test file
```

Requires a `.env` (see `Client/.env.example`) with `REACT_APP_BASE_URL` pointing at the Server API (e.g. `http://localhost:5000`).

### Mobile (`Mobile/`, Expo + TypeScript)

```bash
npm install
npx expo start            # dev server; scan the QR code with Expo Go, or press i/a for a simulator
npx expo export --platform android   # non-interactive Metro bundle smoke test (no device/emulator needed)
npx tsc --noEmit
```

Requires a `.env` (see `Mobile/.env.example`) with `EXPO_PUBLIC_API_URL` (e.g. `http://<your-lan-ip>:5000/api/v1`) — Expo Go on a physical device or emulator cannot reach `localhost`, it needs the host machine's LAN IP. The Server's dev-mode CORS (see below) already allows this.

Use `npx expo install <package>` (not raw `npm install`) when adding a dependency, so Expo resolves an SDK-compatible version.

### app (`app/`, Flutter — deprecated)

Standard Flutter workflow (`flutter pub get`, `flutter run`, `flutter test`) if you ever need it, but new mobile work goes in `Mobile/`, not here.

## Architecture

### API shape and cross-cutting conventions (Server)

- Global prefix `api/v1` (set in `main.ts`); Swagger UI is mounted at `/api` and CORS is enabled **only when `NODE_ENV !== 'production'`** — production is expected to be same-origin. The dev CORS check accepts `localhost`/`127.0.0.1` on any port, private-LAN IP origins (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) on any port (so `Mobile/` running in Expo Go over the LAN works), requests with no `Origin` header at all (native mobile requests aren't subject to CORS in the first place), and anything listed in the comma-separated `CORS_ORIGINS` env var (e.g. an Expo tunnel URL).
- Auth is Passport local (login) + Passport JWT (everything else): `AuthService.validateUser` checks bcrypt hash, `AuthController` issues a JWT via `local-auth.guard`, and `JwtAuthGuard` (`@UseGuards(JwtAuthGuard)`) protects the rest of the API. There is no roles/permissions system — authorization is done ad hoc in each controller method by comparing the resource's owning `userId` against `req.user.id` (see `WalletsController.create/findAll`, `CategoriesController.create`). When adding new endpoints, follow this same manual-ownership-check pattern rather than assuming a guard does it for you.
- Every entity (`User`, `Wallet`, `Category`, `Record`) extends TypeORM `BaseEntity`, uses soft deletes (`@DeleteDateColumn`), and excludes internal timestamp/password fields from JSON responses via `class-transformer`'s `@Exclude` + the controllers' `ClassSerializerInterceptor`.
- Domain model: `User` 1→N `Wallet`, `User` 1→N `Category`, `Wallet` 1→N `Record`, `Category` 1→N `Record`. A `Record` (an income or expense entry) always belongs to exactly one wallet and one category.
- `IconName` and `CategoryType` enums live in `Server/src/enums` and are **duplicated by hand** in `Client/src/common/icon-name.enum.ts`/`category-type.ts` and again in `Mobile/src/types` — there's no shared package, so keep all sides in sync manually when changing these.
- Registering a user (`UsersController.create`) seeds a fixed default set of categories and immediately writes their generated IDs into `user.categoryOrder` — this array is what drives category drag-and-drop ordering in both clients (`@dnd-kit` on web, `react-native-draggable-flatlist` on mobile); if you change the seed list, the ordering bootstrap logic needs to stay consistent.
- `User.categoryOrder` (`Server/src/users/entities/user.entity.ts`) has an explicit TypeORM `transformer` that maps each stored value through `Number(...)` on read. Without it, TypeORM's `simple-array` column type returns each id as a **string** (`"81"` not `81`), which silently breaks any `===` comparison against real `Category.id` values (a real bug this shipped with — categories rendered as permanently empty on the redesigned web Categories page until this was added). If you ever touch this column, keep the transformer.
- `RecordsService.findAll` caps results at the 6 most recent records per wallet (`.limit(6)`) — the client does its own further aggregation on top of whatever it fetches, so don't assume "all records" are ever loaded through this endpoint.
- `Server/src/main.ts` also serves the built client as static files via `ServeStaticModule` pointed at `client/build` relative to `dist/` — this expects a lowercase `client` directory produced by the root-level `build:client` script, which doesn't match the actual `Client/` (capitalized) directory at the repo root. Treat this static-serving path as stale/likely broken rather than the source of truth for how the frontend is served locally; the CI workflow (`.github/workflows/main_moneytracker.yml`) only builds and deploys `Server/` to Azure Web Apps and does not reference the client build at all.

### Client architecture (`Client/`)

- Routing is `react-router-dom` v6 data router (`src/routes/index.tsx`). Naming is inverted from what you'd guess: `routes.authRoute` is the **protected** set of pages (Home, Charts, Wallets, Records, Settings, Categories, Profile) rendered under `AuthLayout`, which redirects to `/login` unless `useAuth()` reports `isSignedIn && authorized`; `routes.publicRoute` is Login/Register rendered under the plain `Layout`.
- **`AuthProvider` exposes an `isInitializing` flag that `AuthLayout` must check before its authorized/signed-in check.** On a hard reload or direct deep link, `AuthProvider`'s token check runs in a `useEffect` (so it hasn't resolved on the very first render) while Redux's `isSignedIn` is already `true` (rehydrated synchronously from `sessionStorage`) — without `isInitializing` gating the redirect, `AuthLayout` briefly redirects to `/login` before the check completes, and (since `LoginPage` bounces an already-authenticated user to `/`) the user lands on `/` instead of the route they actually requested. `AuthLayout` renders `null` while `isInitializing` is true, and only redirects once it's false. Any new protected-route gating logic needs to respect this same flag.
- State is deliberately split three ways — know which one to reach for:
  - **Redux Toolkit** (`src/store`) for small persisted-ish app state: `userSlice` (session/JWT, mirrored into `sessionStorage`) and `walletSlice` (currently selected wallet id).
  - **TanStack Query** for all server data fetching/caching (e.g. `fetchWallets` in `RecordDataProvider`).
  - **React Context providers** (`src/provider`) for derived/computed client state: `AuthProvider` decodes the JWT (via `jwt-decode`) to derive `authorized`/`userId`/expiry rather than trusting `isSignedIn` alone; `RecordDataProvider` is the heaviest piece of client logic — it takes the selected wallet's records and does grouping/aggregation by date scale (day/week/month/quarter/year, `GroupByScale` enum) and by category (income vs. expense) using `lodash` and `luxon`, and exposes the derived income/expense/total figures (`total` is `income - expense`) and chart-ready trend data consumed by `Chart.tsx`/`Home.tsx`. New chart or summary features should extend this provider rather than re-deriving aggregates elsewhere.
- Charting uses `chart.js`/`react-chartjs-2` with the `datalabels` and `annotation` plugins (`components/chart/*`).
- Axios instance (`src/apis/index.ts`) is configured with `baseURL = REACT_APP_BASE_URL` and manually has its `Authorization` header set/cleared in `userSlice` (on login/logout) and re-applied in `AuthLayout` — there's no request interceptor, so if you add a new way to authenticate, update all these spots.
- **Design system**: `src/components/ui/` (`Button`, `Card`, `Input`, `Select`, `Modal`, `EmptyState`, `Skeleton`/`SkeletonText`/`SkeletonCard`, `ConfirmDialog`) is the current design system — use these instead of the older `src/components/Custom/*` (`CustomModal`, `CustomTextField`, etc.) when touching a page, though `Custom/*` still backs a few not-yet-migrated components (e.g. `RecordModal.tsx`, `CategorySelector.tsx`) and shouldn't be deleted. Semantic color tokens (`success`/`danger`/`warning`, aliasing Tailwind's `emerald`/`rose`/`amber`) live alongside the existing `primary`/`secondary`/`info` scales in `tailwind.config.js`.
- Mobile nav below the `sm` breakpoint is a real bottom tab bar (`components/BottomNavbar.tsx`), not a hamburger/drawer — there's no `NavbarOverlay`/`MenuOpenProvider` anymore (removed as dead code; the hamburger it powered didn't render anything).

### Mobile architecture (`Mobile/`)

- File-based routing via `expo-router`: `app/_layout.tsx` is the root (Redux `Provider` + `QueryClientProvider` + `AuthProvider`, restores the JWT from `expo-secure-store` on boot, and gates `(app)` vs `(auth)` via `expo-router`'s `Stack.Protected`). `app/(auth)/` holds Login/Register; `app/(app)/` holds the tab navigator (Home, Wallets, Records, Categories, Charts, Settings) plus a `settings/` sub-stack for Profile/Update Password.
- Auth/session logic intentionally mirrors `Client/src/provider/AuthProvider.tsx` (same JWT-decode-and-expiry-check approach) but persists the token via `expo-secure-store` instead of `sessionStorage`.
- `babel.config.js` requires `babel-preset-expo` as an actual installed dependency (not just bundled inside `expo`) — if a fresh `npm install` ever breaks Metro bundling with `Cannot find module 'babel-preset-expo'`, that's what's missing; `npx expo install babel-preset-expo` fixes it.
- To verify the app actually builds without a device/emulator, use `npx expo export --platform android` (or `ios`) — it runs the real Metro bundler end-to-end (catches native-module/babel-config issues `tsc` can't) and is non-interactive/finite, unlike `npx expo start`. `--platform web` will fail unless `react-dom`/`react-native-web` are installed — this is a native-first app, not a concern.
- `.npmrc` sets `legacy-peer-deps=true`. `expo-router`'s optional web-support chain (`vaul` → `@radix-ui/*`) pulls in a `react-dom` peer version newer than this app's `react`, which npm's default (strict) resolver rejects with `ERESOLVE`. This is a real, upstream Expo dependency conflict (not a mistake in this repo) — don't try to "fix" it by bumping `react`/removing the `.npmrc`, since native `react`/`react-native` versions are pinned to match the installed Expo SDK.
- **Expo SDK is pinned to 54, not the newest 57**, deliberately: the project was first scaffolded on SDK 57, but the Expo Go app version installed on the dev's phone (54.0.2 — Expo Go's version number *is* the SDK it supports, since Expo Go dropped multi-SDK support years ago) only understood SDK 54, so `npx expo start` failed with "Project is incompatible with this version of Expo Go". Downgraded via `npx expo install expo@^54.0.0 --fix` (which also realigns `react-native`, `typescript`, and every `expo-*`/native-module package to their SDK-54-compatible versions in lockstep — always use this command for any future SDK change, never hand-edit versions). Before bumping the SDK again, check the target Expo Go app's version number against the SDK you're moving to.
- `tsconfig.json`'s `ignoreDeprecations` value must match whatever TypeScript version is actually installed (e.g. `"5.0"` for TS 5.9.x) — an SDK downgrade/upgrade that changes the `typescript` version but leaves this value stale fails with `TS5103: Invalid value for '--ignoreDeprecations'`.
- `app.json`'s `plugins` array must only list packages that are genuine **config plugins** (ship an `app.plugin.js`) — `expo-status-bar` is not one (it's just a `<StatusBar/>` component) and must not be listed there; including it crashes `expo export`/`expo start`'s config-plugin resolution (worse, cryptically, on newer Node versions that refuse to type-strip `.ts` files under `node_modules`). If `npx expo install --fix` ever warns "Unable to resolve a valid config plugin for X", remove `X` from `plugins` rather than trying to fix the plugin resolution.
