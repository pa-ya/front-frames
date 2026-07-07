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
          "Mark each section **Reviewed** to track coverage; the ring in the sidebar shows overall progress.",
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
        { type: "p", text: "A one-glance matrix of the **UI frameworks** in this deck. \"Rendering model\" is how the framework turns state into pixels; \"Reactivity\" is how it tracks what changed. (**C++ WebAssembly** is a *compile target + interop layer*, not a UI framework, and **Solidity** is a smart-contract language — both sit outside these UI axes; see the signature-feature list below.)" },
        { type: "table", headers: ["Framework", "Language", "Rendering model", "Reactivity / state", "Typical router"], rows: [
          ["Preact", "JavaScript", "Virtual DOM (~3kB)", "hooks + **signals**", "preact-iso"],
          ["React", "JS / TS", "Virtual DOM + Fiber", "hooks + external stores", "React Router v7"],
          ["Angular", "TypeScript", "DOM + change detection", "**signals** + RxJS", "built-in Router"],
          ["Vue", "JS / TS", "compiler-informed VDOM", "`ref` / `reactive`", "Vue Router"],
          ["Yew", "Rust → WASM", "Virtual DOM", "hooks (`use_state`)", "yew-router"],
          ["Flutter", "Dart → native/canvas", "retained widget tree", "`setState` / Riverpod / Bloc", "Navigator / go_router"]
        ] },
        { type: "table", headers: ["Tech", "Signature feature to remember"], rows: [
          ["Preact", "Tiny React-compatible core + `@preact/signals`; `preact/compat` aliases React libraries"],
          ["React", "Components + hooks; v19 adds Actions, `use()`, and Server Components"],
          ["Angular", "Standalone components + DI + signals + the `@if`/`@for` control flow"],
          ["Vue", "Single-file components + Composition API `<script setup>`; `ref()` reactivity"],
          ["Yew", "React-style components in Rust via the `html!` macro, compiled to WASM"],
          ["C++ WebAssembly", "Emscripten toolchain; `Embind`/`val` for JS↔C++ interop (no single UI framework)"],
          ["Flutter", "Everything is a widget; UI = f(state); one Dart codebase → mobile/web/desktop"],
          ["Solidity", "EVM smart contracts, tested & shipped with **Foundry**; pair with a frontend via viem/wagmi"]
        ] },
        { type: "callout", variant: "note", text: "Notice the two reactivity families converging: **signals** (Preact, Angular, Vue's `ref`, Solid, Leptos) track dependencies at the value level, while **VDOM diffing** (React, Preact, Yew) re-runs components and reconciles. Modern React leans on the compiler; everyone else is adopting signals." }
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
          "**Tic-tac-toe** — derive the winner from board state (no duplicated state), immutable updates, time-travel history."
        ] },
        { type: "callout", variant: "tip", text: "Add the same two things to every minimal project: **an async data source** (loading/error states) and **one piece of URL state** (a route param or query the UI reads). They're the two things every framework does differently and are worth muscle-memory." }
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
          "**Wallet dApp** — connect a wallet with **viem/wagmi**, read balances and call an **ERC-20 you wrote in Solidity** (mint/transfer), and show live tx status. Ties the Solidity section to a real UI."
        ] },
        { type: "callout", variant: "note", text: "The dApp is the one project that spans this whole deck: write & test the contract with **Foundry**, run **anvil** as a local chain, and drive it from a **React/Vue** frontend. It's the fastest way to internalize the frontend↔contract boundary." }
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
