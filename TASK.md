# Frontend Frameworks — Review Deck · build log & spec

A sibling of the **Backend Review Deck**, built by cloning its proven engine and re-skinning it
with a distinct identity, then loading a new set of (mostly frontend) frameworks. The two projects
are **independent** — the frontend deck lives in a subfolder only for authoring context.

## Goal
Same purpose as the backend deck: fast, dense **review** material for frameworks you already
learned but forget — setup, components, reactivity/state, templating, routing, data, forms,
testing, deploy, and real-world gotchas — with flashcards, search, progress, and per-framework
"Common headaches" sections.

## Frameworks (sidebar order)
- **JS / TS** group (collapsible): Preact · React · Angular · Vue
- **WebAssembly** group (collapsible): Yew (Rust) · C++ WebAssembly (Emscripten)
- **Flutter** (Dart) — standalone
- **Solidity** (+ Foundry) — standalone
- **Practice & Projects** — comparison + project ideas

Grouping is automatic: consecutive `content/*.js` files sharing a `group` value fold into one
collapsible sidebar parent (see `js/nav.js`). Order is set by the `<script>` tags in `index.html`.

## Engine (unchanged from the backend deck)
`index.html` + `css/{theme,layout,components,animations}.css` + `js/{highlight,render,nav,search,
progress,flashcards,theme,ux,app}.js`. Content is plain `<script>` tags pushing objects onto
`window.FRAMEWORKS`, so it runs from `file://` with no build. Content object schema in
`content/_schema.md`.

## What was changed vs. the backend deck (the "exclusiveness")
1. **New visual identity** — `css/theme.css` re-tokenized to a **violet + magenta on plum-black**
   palette (dark) and a violet-tinted light theme, with matching syntax colors, replacing the
   backend deck's GitHub-blue-on-near-black. Instantly recognizable as a different app.
2. **Brand & favicon** — title "Frontend Frameworks — Review Deck", 🎨 favicon, a **gradient
   wordmark** and a thin gradient hairline under the top bar (`css/layout.css`).
3. **Highlighter upgrade** (`js/highlight.js`) — added first-class keyword sets for **JSX**,
   **Dart**, and **Solidity** (the backend deck didn't need these), so component/contract code
   renders with correct token colors.
4. **New content manifest** in `index.html` and a **frontend-flavored** Practice page
   (`content/sample-projects.js`): a UI-framework comparison matrix (rendering model / reactivity /
   router), a signature-feature table across all 8, frontend project ideas, and a **dApp** project
   that ties the Solidity section to a React/Vue frontend via viem/wagmi + anvil.

## Content authoring
Each framework file was authored to match the backend deck's depth (14–21 sections, mostly
`core` with 2–4 `deep` accordions, 14–16 each of packages/gotchas/flashcards/cheatsheet, and a
dedicated "Common headaches" section). Modern idioms only; several files web-verified current
version numbers.

Targeted versions: Preact 10.x + `@preact/signals`; **React 19** (Actions, `use()`, `ref`-as-prop,
React Compiler, React Router v7); **modern Angular v19/v20** (standalone, signals, `@if`/`@for`,
zoneless — with an explicit note distinguishing it from legacy AngularJS 1.x); **Vue 3.5**
(Composition API, `<script setup>`, `defineModel`, `useTemplateRef`); **Yew 0.21** (function
components, `html!`, Trunk); **Emscripten 4.x** for C++ WebAssembly (framed honestly — no single
C++ web-UI framework; teaches toolchain + `Embind`/`val` interop + UI options); **Flutter 3.2x /
Dart 3.x**; **Solidity 0.8.x + Foundry** (`forge`/`cast`/`anvil`, forge-std tests, cheatcodes,
fuzzing).

## Validation gate (all passing)
- `node --check` on every content file — pass.
- Load-order test replicating `index.html` script order → correct order & nav grouping
  (`JS / TS[4]`, `WebAssembly[2]`, Flutter solo, Solidity solo).
- Structural validator (block types, callout variants, `level` values, unique framework/section
  ids, required fields, **table row width == header width**, count floors) — **0 errors, 0 warnings**.
- Runtime safety: every file loads via `require` with no throw (proves no stray template-literal
  interpolation).
- Headless Chrome boot: 2 nav groups render (counts 4 / 2), 9 nav items, deck-stats reads
  **"8 frameworks · 152 sections · ~3h 55m to review"**, hero + sections paint, title correct.
- Staleness scan: React uses `createRoot` (no legacy `ReactDOM.render`/lifecycles); Vue uses
  `createApp` (Vue 2 APIs only appear in an intentional contrast callout); Angular is fully
  standalone+signals with **zero** `@NgModule`; Solidity `pragma 0.8.x` + Foundry cheatcodes present.

## Totals
**8 frameworks + 1 practice page · 152 sections · ~235 min of review material.**
