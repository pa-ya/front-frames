(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "sample-projects",
  name: "Practice & Projects",
  language: "All",
  tagline: "How to use this deck, a **cross-framework comparison**, and frontend project ideas (minimal → medium) to cement what you reviewed.",
  color: "#06b6d4",
  readMinutes: 9,

  sections: [
    {
      id: "how-to-review",
      title: "How to get the most from this deck",
      level: "core",
      body: [
        { type: "list", items: [
          "**Skim the core sections** of a framework (ordered easy → hard), then open the **Deep dive** accordions only for the parts you've forgotten.",
          "Hit **Study flashcards** (`f`) after reading — the quiz mode tests active recall, which beats re-reading.",
          "Open the **Deep dive** accordions (marked *deep*) only for the advanced parts you've forgotten — the core sections are the fast path.",
          "Use **search** (`/`) to jump straight to a concept across all frameworks (e.g. \"signals\", \"props\", \"hydration\", \"reentrancy\").",
          "Keyboard: `j`/`k` next/prev framework, `t` theme, `f` flashcards, `/` search, `Esc` close."
        ] },
        { type: "callout", variant: "tip", text: "Best retention loop: **read core → flashcards → build one small UI → skim gotchas again.** The gotchas list is the single highest-value part to re-read before an interview or before starting a new app." }
      ]
    },
    {
      id: "comparison",
      title: "Cross-framework comparison",
      level: "core",
      body: [
        { type: "p", text: "A one-glance matrix of the **UI frameworks** in this deck. \"Rendering model\" is how the framework turns state into pixels; \"Reactivity\" is how it tracks what changed. The rest of the deck (fullstack meta-frameworks, the Python GUI/game libs, and the EVM/TON smart-contract stacks) sit outside these UI axes — those are summarised in the **signature-feature** table below." },
        { type: "table", headers: ["Framework", "Language", "Rendering model", "Reactivity / state", "Typical router"], rows: [
          ["Preact", "JavaScript", "Virtual DOM (~3kB)", "hooks + **signals**", "preact-iso"],
          ["React", "JS / TS", "Virtual DOM + Fiber", "hooks + external stores", "React Router v7"],
          ["Angular", "TypeScript", "DOM + change detection", "**signals** + RxJS", "built-in Router"],
          ["Vue", "JS / TS", "compiler-informed VDOM", "`ref` / `reactive`", "Vue Router"],
          ["Yew", "Rust → WASM", "Virtual DOM", "hooks (`use_state`)", "yew-router"],
          ["Flutter", "Dart → native/canvas", "retained widget tree", "`setState` / Riverpod / Bloc", "Navigator / go_router"],
          ["Tkinter / PySide6", "Python → native widgets", "retained widget tree", "explicit vars / signals-slots", "n/a (window/frame nav)"]
        ] },
        { type: "callout", variant: "note", text: "Notice the two reactivity families converging: **signals** (Preact, Angular, Vue's `ref`, Solid, Leptos) track dependencies at the value level, while **VDOM diffing** (React, Preact, Yew) re-runs components and reconciles. Modern React leans on the compiler; everyone else is adopting signals." },
        { type: "heading", text: "Desktop GUI toolkits — at a glance" },
        { type: "p", text: "The **Desktop GUI** group spans five languages. They split cleanly into two paradigms: **retained** (you build a widget tree once; the toolkit keeps and redraws it) vs **immediate** (you re-describe the whole UI every frame from your state — no persistent widget objects)." },
        { type: "table", headers: ["Toolkit", "Language", "Paradigm", "Native look?", "Mobile?", "Package with"], rows: [
          ["Qt (Widgets)", "C++", "retained (widgets)", "native-ish + themable", "yes (Qt for iOS/Android)", "windeployqt / CMake"],
          ["PySide6", "Python", "retained (Qt widgets)", "native-ish + themable", "limited", "PyInstaller / Nuitka"],
          ["Tkinter", "Python", "retained (Tk widgets)", "themed via `ttk`", "no", "PyInstaller"],
          ["egui", "Rust", "**immediate** mode", "custom-drawn (uniform)", "via winit (rough)", "cargo / cargo-bundle"],
          ["Fyne", "Go", "retained (own canvas)", "custom (Material-ish)", "yes (Android/iOS)", "`fyne package`"]
        ] },
        { type: "callout", variant: "tip", text: "Rule of thumb: **Qt** for the richest, most native desktop apps (and when you'll also ship Python via PySide6); **Tkinter** for a zero-dependency Python utility; **egui** for a Rust tool/debug UI or a game overlay (immediate mode is the easiest to reason about); **Fyne** for a pure-Go app that also targets mobile. **Flutter** (its own section) is the option when mobile is the primary target." },
        { type: "heading", text: "Game-dev libraries — at a glance" },
        { type: "table", headers: ["Library", "Language", "Level", "You write", "Best for"], rows: [
          ["Pygame (pygame-ce)", "Python", "high-level over SDL", "the game loop + blits", "learning, prototypes, 2D games/jams"],
          ["SDL (SDL3)", "C++", "low-level multimedia", "loop + GPU render + input", "shipped 2D games, engines, ports, emulators"],
          ["LÖVE (Love2D)", "Lua", "high-level, callback-driven", "`load`/`update(dt)`/`draw`", "2D games shipped fast (LuaJIT speed); e.g. Balatro"]
        ] },
        { type: "callout", variant: "note", text: "All three share **one mental model**: own (or fill in) the loop, update by delta-time, draw each frame, poll input. **Pygame** and **LÖVE** are both high-level wrappers over **SDL** — Pygame you write the `while` loop yourself; LÖVE calls your `love.update`/`love.draw` callbacks and runs on **LuaJIT** for near-C speed. Drop to **SDL/C++** for raw performance, GPU rendering, console/gamepad reach, or to embed in a larger C++ engine. **SFML** is the friendlier object-oriented C++ alternative to SDL if you prefer classes over C APIs." },
        { type: "heading", text: "Signature feature to remember — every tech in the deck" },
        { type: "table", headers: ["Tech", "Signature feature to remember"], rows: [
          ["Preact", "Tiny React-compatible core + `@preact/signals`; `preact/compat` aliases React libraries"],
          ["React", "Components + hooks; v19 adds Actions, `use()`, and Server Components"],
          ["Angular", "Standalone components + DI + signals + the `@if`/`@for` control flow"],
          ["Vue", "Single-file components + Composition API `<script setup>`; `ref()` reactivity"],
          ["TanStack", "Headless, framework-agnostic primitives: Query (async cache), Router, Table, Form, Virtual, Start"],
          ["AdonisJS", "Batteries-included Node MVC: Lucid ORM, VineJS validation, Edge templates, first-party auth"],
          ["Wasp", "Config-as-code (`main.wasp.ts`) generates a full React + Node + Prisma app from declarations"],
          ["Yew", "React-style components in Rust via the `html!` macro, compiled to WASM"],
          ["C++ WebAssembly", "Emscripten toolchain; `Embind`/`val` for JS↔C++ interop (no single UI framework)"],
          ["Flutter", "Everything is a widget; UI = f(state); one Dart codebase → mobile/web/desktop"],
          ["Qt (C++)", "The C++ GUI standard: signals & slots + moc, Widgets **and** QML/Qt Quick, parent-child ownership"],
          ["PySide6 (Python)", "Full Qt6 for Python; signals & slots, model/view, `QThread` for off-UI work"],
          ["Tkinter", "Python's built-in GUI; `ttk` themed widgets + `pack`/`grid`/`place` geometry managers"],
          ["egui (Rust)", "Immediate-mode GUI: UI rebuilt every frame from `&mut self`; native + WASM via eframe"],
          ["Fyne (Go)", "Pure-Go cross-platform GUI; data binding + `fyne.Do` for thread-safe UI updates; ships mobile"],
          ["Pygame", "2D game loop + surfaces/sprites; `convert()`/`convert_alpha()` and a fixed-step clock"],
          ["SDL (C++)", "Low-level cross-platform loop + GPU 2D render; SDL3 renamed much of SDL2 (SDL_RenderTexture, SDL_FRect)"],
          ["LÖVE (Lua)", "You write `love.load`/`update(dt)`/`draw` callbacks; LuaJIT speed; colors are 0–1; `.love` = zip + fuse to ship"],
          ["Solidity", "EVM smart contracts, tested & shipped with **Foundry**; pair with a frontend via viem/wagmi"],
          ["EVM Clients (TS)", "`viem` (+ `wagmi` React hooks) for typed reads/writes, wallet connect, and ABI-typed contracts"],
          ["Tact", "TON's high-level contract language; actor model, typed messages, `receive()` handlers, Blueprint SDK"],
          ["FunC", "TON's low-level contract language; explicit cells/slices/builders and stack-based semantics"]
        ] }
      ]
    },
    {
      id: "minimal",
      title: "Minimal projects (½–1 day each)",
      level: "core",
      body: [
        { type: "p", text: "Small enough to finish, big enough to touch components, state, effects, events, and conditional rendering. Build each in a framework you want to refresh." },
        { type: "list", items: [
          "**Counter + theme toggle** — the \"hello reactivity\" app: state, an event handler, and persist the theme to `localStorage`. Feel how each framework models state.",
          "**Todo app** — add / toggle / delete / filter, persisted locally. The canonical \"do I remember this framework?\" project; exercises list rendering + keys.",
          "**Markdown previewer** — a controlled `<textarea>` on the left, live-rendered HTML on the right. Two-way binding + derived state.",
          "**Weather widget** — fetch a public API, render **loading / error / empty / success** states properly. The four states everyone forgets.",
          "**GitHub-user / movie search** — a **debounced** search box → fetch → paginated results. Effects, cleanup, and race-condition handling.",
          "**Stopwatch / countdown timer** — `setInterval` inside an effect with correct **cleanup**. The classic effect-lifecycle drill.",
          "**Tic-tac-toe** — derive the winner from board state (no duplicated state), immutable updates, time-travel history.",
          "**Desktop calculator / note-taker** *(Desktop GUI)* — a native window with inputs, buttons and a menu; state in memory, saved to a file. Build it in **Qt**, **Tkinter**, **egui** or **Fyne** to feel each toolkit's layout system and event model.",
          "**Pong or Snake** *(Game dev)* — the \"hello game loop\": a fixed-timestep loop, keyboard input, collision and a score. Build in **Pygame** or **LÖVE** (fastest to prototype), then port to **SDL/C++** to feel the same loop one level lower."
        ] },
        { type: "callout", variant: "tip", text: "Add the same two things to every minimal *web* project: **an async data source** (loading/error states) and **one piece of URL state** (a route param or query the UI reads). For **desktop/game** builds the two muscle-memory drills are instead **off-thread work** (never block the UI/game loop) and a **clean update→render split**." }
      ]
    },
    {
      id: "medium",
      title: "Medium projects (a weekend+)",
      level: "core",
      body: [
        { type: "list", items: [
          "**Kanban board** — columns + cards with **drag-and-drop** reordering, persisted. Exercises local optimistic updates and ordering logic.",
          "**Real-time chat UI** — rooms + messages over a **WebSocket**; optimistic send, auto-scroll, reconnect. Tests the framework's effect/streaming story.",
          "**E-commerce storefront** — product grid, product detail route, a **cart in global state**, and a checkout form. Routing + global store + forms in one app.",
          "**Analytics dashboard** — fetch data, cache it, filter by date range, and draw a couple of charts. Data fetching + caching + derived/computed values.",
          "**Movie explorer (TMDB)** — list → detail routing, favorites in persisted state, infinite scroll or pagination. Great for router params + data caching.",
          "**Multi-step form wizard** — validated steps, a progress indicator, and review-before-submit. Form state, validation, and cross-step state.",
          "**Wallet dApp** — connect a wallet with **viem/wagmi**, read balances and call an **ERC-20 you wrote in Solidity** (mint/transfer), and show live tx status. Ties the Solidity section to a real UI.",
          "**Desktop file/image browser** *(Desktop GUI)* — a list/tree pane + preview pane, **background loading off the UI thread** (`QThread` / goroutine + `fyne.Do` / a channel into `update`), and packaging into a shippable binary. The real test of a GUI toolkit's threading + layout story.",
          "**2D platformer or top-down shooter** *(Game dev)* — sprites, a tilemap, delta-time movement, AABB collision, a sprite sheet, sound effects, and a title→play→pause→game-over **state machine**. Build in **Pygame**, **LÖVE** (add `hump.gamestate` + `bump.lua`), or **SDL/C++**."
        ] },
        { type: "callout", variant: "note", text: "The dApp is the one project that spans this whole deck: write & test the contract with **Foundry**, run **anvil** as a local chain, and drive it from a **React/Vue** frontend. It's the fastest way to internalize the frontend↔contract boundary. For the **desktop/game** builds, the equivalent lesson is the **off-thread → UI-thread handoff**: every toolkit here has one blessed way to update the UI from a background worker (Qt signals, `fyne.Do`, egui `request_repaint` + channel) — learn it early." }
      ]
    },
    {
      id: "cross-cutting",
      title: "Cross-cutting challenges (add to any project)",
      level: "core",
      body: [
        { type: "p", text: "Once the UI renders, layer these on — they're what separates a demo from a real app, and each framework handles them differently:" },
        { type: "list", items: [
          "**Routing + code-splitting** — lazy-load routes/components so the initial bundle stays small.",
          "**Forms + validation** — a schema (zod / valibot / native constraints) with inline error messages and disabled-while-submitting.",
          "**Data fetching done right** — caching, `loading`/`error` states, retries and refetch (TanStack Query / SWR / RTK Query / framework built-ins).",
          "**Global state** — pick the right tool: context/signals for light state, a store (Zustand / Pinia / NgRx / Riverpod / Redux Toolkit) for app-wide state.",
          "**Dark mode + theming** — CSS variables + a persisted preference that respects `prefers-color-scheme`.",
          "**Accessibility** — semantic HTML, focus management, keyboard nav, ARIA where needed, and a real screen-reader pass.",
          "**Testing** — component tests (Testing Library / @vue/test-utils / widget tests) + one end-to-end flow (Playwright / Cypress).",
          "**Build + deploy** — a production build to a static host/CDN, plus a bundle-size budget and a basic CI (lint + test + build)."
        ] }
      ]
    },
    {
      id: "compare-drill",
      title: "The 'same UI, two frameworks' drill",
      level: "core",
      body: [
        { type: "p", text: "The single best exercise for reviewing: pick **one** small spec (e.g. the Todo app) and build it in **two** frameworks back-to-back. You instantly feel each one's philosophy — where it helps and where it gets in the way." },
        { type: "list", items: [
          "**React vs Preact** — nearly the same API; feel the bundle-size and `signals` difference, and where `preact/compat` matters.",
          "**React vs Vue** — JSX + hooks + external stores vs SFC + Composition API + built-in reactivity.",
          "**Vue vs Angular** — progressive & minimal vs batteries-included (DI, RxJS, CLI, full router).",
          "**Yew vs React** — the identical component/hook model, but paying Rust's ownership/`.clone()` tax for WASM performance and type safety.",
          "**Flutter vs any web framework** — a retained **widget tree** rendered to a canvas vs the DOM; the same declarative UI = f(state) idea, different substrate."
        ] },
        { type: "callout", variant: "note", text: "Keep a tiny `NOTES.md` while doing the drill: for each framework jot the one thing that surprised you and the one gotcha that bit you. That file becomes your personal version of this deck." }
      ]
    },
    {
      id: "further",
      title: "Further reading",
      level: "deep",
      body: [
        { type: "link", url: "https://github.com/gothinkster/realworld", text: "RealWorld — the same 'Medium clone' frontend implemented in dozens of frameworks (great for side-by-side comparison)" },
        { type: "link", url: "https://roadmap.sh/frontend", text: "roadmap.sh/frontend — frontend concepts checklist (rendering, state, routing, performance, a11y)" },
        { type: "link", url: "https://www.patterns.dev/", text: "patterns.dev — modern web app patterns (rendering, performance, component patterns)" },
        { type: "link", url: "https://developer.mozilla.org/en-US/docs/Web", text: "MDN Web Docs — the canonical reference for the DOM, CSS, and browser APIs every framework sits on" },
        { type: "link", url: "https://book.getfoundry.sh/", text: "The Foundry Book — the reference for forge / cast / anvil (the Solidity section's toolchain)" }
      ]
    }
  ],

  packages: [],
  gotchas: [],
  flashcards: [],
  cheatsheet: []
});
