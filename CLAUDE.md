# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # no lockfile is committed; node_modules is not present
npm run dev        # next dev
npm run build      # next build
npm run start      # next start (production server)
npm run lint       # next lint — note: no eslint config file exists in the repo yet
npx tsc --noEmit   # typecheck (tsconfig sets noEmit; there is no `typecheck` script)
```

**There is no test setup** — no test runner, no test files, no test script. Do not invent test commands or a single-test invocation; if verification is needed, use `npm run build` plus `npx tsc --noEmit`.

Two env vars are required (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL` (bare project URL, *not* the `/rest/v1/` REST endpoint — pasting the REST URL produces "INVALID PATH SPECIFIED") and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Deployment target is Vercel with Framework Preset = Next.js; a wrong preset yields a 404 NOT_FOUND on deploy.

## What this is

`pail` — a personal bucket-list PWA for the author and his wife: Chicago things to do before moving to San Diego. Next.js 15 App Router + React 19 + TypeScript, Supabase (Postgres + Storage) as the only backend, deployed on Vercel, installable to the iOS/Android home screen.

Lineage: `/Users/nathan/Documents/pail-v4` and `pail-v4.1` are older snapshots of this same app (they query an `items` table); this repo is the v5/v6 continuation and is the only one to document.

## Architecture

### Single-page, single-fetch, no router
There is exactly one route: `src/app/page.tsx`. It is a client component that owns **all** application state — the item list, the active tab, both board filters, and which modal is open. There is no router usage, no state library, no server components doing data work, no API routes, and no `useContext`. Every view is a presentational child that receives `items` plus callbacks as props.

`fetchItems()` in `page.tsx` is the sole read path. Every mutation anywhere in the tree (status change, edit, delete, memory save, mark-soon) writes directly to Supabase from the component and then calls back up to trigger a full `fetchItems()` refetch. There is no optimistic update, cache, or realtime subscription — refetch-everything is the deliberate convention. Preserve it when adding mutations: write, then call the `onUpdated`/`onAdded` prop.

Tab switching is state, not navigation. `TAB_ORDER = ['board','roll','timeline','memories']` drives both the `TabBar` and horizontal swipe gestures handled on `<main>`. Any horizontally scrollable strip must carry `data-swipe-ignore` so the swipe handler skips it (the board's filter strips do).

### Data model and the schema/code mismatch
`src/lib/supabase.ts` is the domain layer, not just a client: it exports the client, the `Item` type, and every enum-ish constant (`CATEGORIES`, `SEASONS`, `MONTHS`, `STATUS_LABELS`, `STATUS_ORDER`) plus the time-window logic. Category codes, colors, and labels live only here — adding a category means editing this one array.

**Important:** the app queries the table `pail_items` (all of `page.tsx`, `AddItemModal`, `ItemDetailModal`). `MIGRATION.sql` still targets a table named `items`, as do the v4.x sibling snapshots. The rename happened in the "DB Fix" commit and the migration file was never updated — treat `MIGRATION.sql` as stale on the table name if you run it against a fresh project.

Statuses are `someday → planned → soon → done`. MIGRATION.sql also renames a legacy status vocabulary (`dreaming/scheduled/boarding/departed`) and the legacy category `fair → road`; some CSS keyframes still carry old names (`pulseBoarding`). `time_window` is a dead column still written as `'any'` on insert for back-compat.

### Time windows — the core abstraction
An item's "when" is expressed by three optional, combinable mechanisms, resolved in strict precision order by `timelineMode()`:

1. `date_start`/`date_end` → mode `exact`
2. `months[]` (3-letter codes) → mode `month`
3. `seasons[]` → mode `season`
4. none → mode `any`

`timeWindowLabel()` renders the display string using the same precedence, and `itemCoversMonth()` answers whether an item falls in a given (year, month). This trio is the single source of truth — never re-derive time-window logic inside a component.

`TimelineView` builds a month-by-month bucket list from the current month through September 2027 and places items by mode: `exact` and `month` items appear in **every** matching bucket, while `season`-only items appear in just the **next** upcoming matching month (the "roll forward" behavior). `any` items are collected into a separate trailing "anytime · no window" section. Done items are excluded entirely. Note the timeline horizon (Sept 2027) is independent of, and currently inconsistent with, the header countdown deadline in `theme.ts` (Dec 15, 2026) — changing one does not change the other.

### The four views
- **Board** (`BoardView.tsx`) — the default view and the closest thing to a kanban: it is a *single* list sorted by `STATUS_ORDER` (`soon`, `planned`, `someday`, `done`) rather than columns, with status shown as a per-row left border color and a split-flap animated status label. Two horizontal filter strips sit above it — category (with live counts and color dots) and season. The category filter state is **lifted into `page.tsx`** specifically so the Roll tab can seed its own multi-select from whatever the board is currently filtered to. Also owns the floating `+` FAB.
- **Roll** (`RollView.tsx`) — random picker over non-done items in the selected categories, with an `idle → rolling → revealed` phase machine; "rolling" cycles random titles on a timer for a slot-machine effect before the final pick. Offers re-roll, mark-soon, and open-detail.
- **Timeline** — described above.
- **Memories** (`MemoriesView.tsx`) — grid of `done` items sorted by `completed_at`, showing the memory photo and note.

`ItemDetailModal.tsx` is the largest file and the only place items are edited or deleted. It holds an inline edit mode (title/category/seasons/months/date range/notes), the status changer, and the memory logger. Photos upload to the public Supabase Storage bucket `memories` at path `{item.id}-{timestamp}.{ext}`, then the resulting public URL is written to `memory_photo`. That bucket must exist, be public, and have an INSERT policy (`with check true`) for uploads to work.

`FlapText.tsx` is a shared split-flap character animation (cycles random glyphs per character with a per-character stagger before settling) used for board status labels and the Roll reveal.

### Styling conventions
No CSS framework and no CSS modules. Everything is inline `style={{}}` objects reading tokens from `src/lib/theme.ts`. `theme.ts` token *names* (`brass`, `accent`, `board`) are historical and were deliberately kept while their *values* were remapped to the Cubs-blue palette, so a token name may not describe its color — change values there, not names. `globals.css` holds only the reset, the body gradient/film-grain overlay, `.no-scrollbar`, and the shared keyframes (`fadeIn`, `slideUp`, `pulseBoarding`).

Typography is a fixed three-font stack loaded from Google Fonts in `layout.tsx`: Fraunces (display/serif figures), Geist Mono (all uppercase letterspaced labels, the dominant UI voice), Manrope (body). Layout is mobile-first and hard-capped at `maxWidth: 520`; PWA safe-area insets (`env(safe-area-inset-*)`) are applied on `<main>`, the TabBar, and bottom-sheet modals.

### Auth
There is none. The anon key is used with `persistSession: false` and every user is anonymous with full read/write. Attribution is a client-side convention only: `localStorage.getItem('pail_user')` is read at write time and stored into `added_by`/`completed_by`; it is never displayed in the UI.
