<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reflex

A personal reading/reflection journaling PWA. Users record voice reflections while reading, save text quotes, and track reading progress per book. Responsive: mobile-first pill nav + bottom sheets, with a real desktop layout (fixed sidebar, wider content, masonry card grids) at `md:` and up.

## Stack

Next.js 16.2.6 (App Router, Turbopack) · React 19.2.4 · TypeScript · Tailwind v4 · Framer Motion · SWR · Supabase (Postgres + Auth + Storage) · `@ducanh2912/next-pwa` (disabled in dev).

## Structure

- `src/app/` — routes: `/` (home: greeting, quote, record button, books-in-progress), `/library` (reflections/quotes tabs with book/tag filters), `/books` (book CRUD + reading-activity heatmap), `/login`, `/auth/callback`.
- `src/lib/hooks/` — one SWR-backed hook per domain (`useBooks`, `useReflections`, `useQuotes`, `useReadingLogs`, `useTags`, `useRecorder`, `useIsDesktop`). Each hook owns its own Supabase calls and does optimistic `mutate()` — there's no separate API/service layer.
- `src/lib/supabase/{client,server}.ts` — separate browser/server Supabase clients (`@supabase/ssr`).
- `src/middleware.ts` — redirects unauthenticated users to `/login`; `/login` and `/auth/*` are the only public paths. Note: Next.js prints a deprecation warning for `middleware.ts` in this version in favor of `proxy.ts` — not yet migrated.
- `src/components/` — presentational + form components. Notable ones: `Sidebar` (desktop nav, `hidden md:flex`) / `BottomNav` (mobile nav, `md:hidden`); `ConfirmDialog` (use for *every* destructive action instead of `window.confirm`); `PageUpdateSheet` / `QuoteEditSheet` (bottom sheet on mobile, centered modal on desktop via `useIsDesktop()`); `GlobalUI` (floating top-right cluster: logout + theme toggle) and `SettingsMenu` (the gear in that cluster — app config popover, currently just the "Rosa" palette toggle).
- `src/types/index.ts` — single flat file with all shared interfaces.
- `supabase/` — `schema.sql` (full schema) + incremental `migration_*.sql` files applied by hand in the Supabase SQL editor (no migration tool). `supabase/README.md` documents the current schema in Spanish and must stay in sync when adding migrations.

## Conventions

- **Neutral Spanish only** — tuteo (tú/tienes/puedes/ingresa), never Argentine voseo (vos/tenés/podés/ingresá). Use `toLocaleDateString("es", ...)`, not `"es-AR"`.
- **Every interactive button needs a hover state** (color/opacity/border change, or `whileHover` for icon-style buttons) — not just `active:`/`whileTap`.
- **Card lists of variable-height items use CSS multi-column masonry** (`columns-2/3/4` + `break-inside-avoid` on each item), not CSS Grid — Grid forces uniform row height and leaves dead gaps.
- **Never leave a CSS `transition` permanently active on a broad selector** (e.g. `*`). For the theme-toggle crossfade, a `.theme-transition` class is added to `<html>` right before the change and removed ~200ms later — that pattern, not an always-on rule.
- **Avoid `backdrop-filter: blur()` on full-screen overlays** (perf risk on Chromium, confirmed via research this app follows shadcn/Radix/Linear in using a plain `bg-black/60` scrim instead). `filter: blur()` on a *static* element animated only via `transform`/`opacity` (e.g. the login page's aurora background) is fine.
- **Don't add Framer Motion's `layout` prop to list items** unless there's a genuine reorder-in-place animation — it recomputes FLIP positioning for every sibling on every re-render of that list, even when nothing moved.
- **Brand name is "Reflex"**, not "Reflexiones" — except where "reflexiones" is used as the plain content-type noun (e.g. the library tab listing voice reflections), which is correct as-is.
- **Two independent theming axes, both driven by classes on `<html>` and both persisted in `localStorage`.** (1) Light/dark: `theme` key → `.light`/`.dark` (toggle in `GlobalUI`, floating top-right). (2) Palette: `palette` key (`"pink"`/`"default"`) → `.pink` (toggle in `SettingsMenu`, the gear next to the theme toggle). The default palette is warm terracotta/cream; `.pink` is the blush/plum "Rosa" palette from the 2026-09 mockup. All seven color tokens (`--bg`/`--fg`/`--muted`/`--border`/`--accent`/`--surface`/`--danger`) are redefined for `.pink` and `.pink.dark` in `globals.css` — always style with `var(--…)` so both axes keep working. The `.pink.dark` compound rule is explicit on purpose (same specificity as `.dark`).

## Local setup

`npm install`, then a `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `supabase/README.md`). If CSS/style changes stop appearing after a long `next dev` session with lots of hot-reloads, the Turbopack cache has likely gone stale — `pkill -f "next dev"; rm -rf .next; npm run dev` fixes it.

**Caution**: `.env.local` points at the user's real Supabase project — there is no test/staging database. Be careful with destructive actions (deletes) when testing through the browser.
