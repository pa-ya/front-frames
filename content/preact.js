(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "preact",
  name: "Preact",
  language: "JavaScript",
  group: "Web UI (JS / TS)",
  navLabel: "Preact",
  color: "#673ab8",
  readMinutes: 22,
  tagline: "A **3kB** alternative to React with the same modern API — `hooks`, function components, JSX — plus first-class **signals** for fine-grained reactivity.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "Preact is a **tiny (~3kB gzipped) reimplementation of the React API**. You write function components, JSX, and hooks exactly like React — but ship a fraction of the runtime. It has its own fast virtual DOM diff, uses **real browser events** (no synthetic system), and adds **signals** (`@preact/signals`) as a headline feature for fine-grained reactivity that skips virtual-DOM diffing entirely." },
        { type: "list", items: [
          "**Reach for it when:** you want React's mental model and ecosystem with a much smaller bundle — widgets embedded in other pages, performance-critical apps, or when every kB counts.",
          "**Two ways to hold state:** `preact/hooks` (`useState`, `useEffect`, … — identical to React) *or* **signals** (`signal`, `computed`) which update the exact DOM node that reads them, no re-render.",
          "**Runs React libraries** via **`preact/compat`** — an aliasing layer that maps `react`/`react-dom` imports onto Preact so most of the React ecosystem just works.",
          "**Mental model:** if you know React, you already know Preact. Then learn where it *diverges* — native events, `class` works, `onInput` over `onChange` — and *adds* — signals."
        ] },
        { type: "table", headers: ["Concept", "React", "Preact"], rows: [
          ["Component", "function returning JSX", "identical"],
          ["Local state", "`useState`", "`useState` (or a **signal**)"],
          ["Events", "**synthetic** event system", "**native** DOM events"],
          ["CSS class", "`className` only", "`class` **or** `className`"],
          ["Text input event", "`onChange` (fires on blur-ish)", "`onInput` (fires per keystroke)"],
          ["Fine-grained reactivity", "n/a (re-render + memo)", "**signals** update one node"],
          ["Run React libs", "native", "`preact/compat` alias"]
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Preact 10.29+** (current stable) with **`@preact/signals` 2.x** and **`preact-iso` 2.x**. Preact 11 is in alpha — the 10.x API here is stable and what you ship today." },
        { type: "callout", variant: "tip", text: "Preact is *not* a strict React subset. It intentionally omits some React internals (legacy context, some experimental APIs) and supports things React doesn't (native `class`, `onInput`, SVG attributes as-is). Use `preact/compat` when a library assumes true-React behaviour." }
      ]
    },
    {
      id: "setup",
      title: "Project setup & tooling",
      level: "core",
      body: [
        { type: "p", text: "The modern path is **Vite** with the official **`@preact/preset-vite`**. The fastest start is the **`create-preact`** CLI (a.k.a. `npm init preact`), which scaffolds a Vite + Preact + `preact-iso` app with TypeScript and prerendering options." },
        { type: "code", lang: "bash", code: "# scaffold (interactive: TypeScript? routing? prerender?)\nnpm init preact\n# or explicitly\nnpx create-preact my-app\n\ncd my-app\nnpm install\nnpm run dev        # Vite dev server, http://localhost:5173\nnpm run build      # production bundle in dist/\nnpm run preview    # serve the built bundle" },
        { type: "heading", text: "Adding Preact to an existing Vite project" },
        { type: "code", lang: "bash", code: "npm i preact\nnpm i -D @preact/preset-vite" },
        { type: "code", lang: "js", code: "// vite.config.js\nimport { defineConfig } from \"vite\";\nimport preact from \"@preact/preset-vite\";\n\nexport default defineConfig({\n  plugins: [preact()],   // JSX -> h(), Fast Refresh, prerender, compat aliasing\n});" },
        { type: "list", items: [
          "**`@preact/preset-vite`** wires up JSX-to-`h()` transform, **Prefresh** (hot reload preserving state), automatic **`preact/compat`** aliasing, and optional **prerendering** to static HTML.",
          "**No Vite?** Set the Babel/tsconfig JSX pragma manually: `jsxImportSource: \"preact\"` (automatic runtime) or `\"jsxFactory\": \"h\", \"jsxFragmentFactory\": \"Fragment\"` (classic).",
          "**Typical structure:** `src/main.tsx` (calls `render`/`hydrate`), `src/index.tsx` (the `<App/>` + router), `src/pages/`, `src/components/`, `src/style.css`, `index.html` with `<div id=\"app\">`."
        ] },
        { type: "callout", variant: "tip", text: "Prefer the **automatic JSX runtime** (`jsxImportSource: \"preact\"` in `tsconfig`/`vite`) — then you don't need to `import { h } from \"preact\"` in every file. The preset sets this up for you." }
      ]
    },
    {
      id: "components",
      title: "Components, JSX, h() & Fragments",
      level: "core",
      body: [
        { type: "p", text: "A component is a **plain function that returns a virtual DOM tree** (JSX). JSX compiles to calls of **`h(type, props, ...children)`** (Preact's `createElement`). Component names are PascalCase; DOM tags are lowercase." },
        { type: "code", lang: "jsx", code: "import { h, Fragment } from \"preact\";   // not needed with the automatic runtime\n\nfunction Greeting({ name }) {\n  const msg = `Hello ${name}`;\n  return (\n    <>\n      <h1 class=\"title\">{msg}</h1>\n      <p>Welcome to Preact.</p>\n    </>\n  );\n}" },
        { type: "p", text: "`<>...</>` is a **Fragment** — group siblings without a wrapper DOM node. JSX interpolates any expression with `{ }`; `null`, `undefined`, `false` and `true` render nothing (handy for conditionals)." },
        { type: "code", lang: "jsx", code: "// what JSX compiles to (classic runtime)\nh(\"h1\", { class: \"title\" }, \"Hello\");\nh(Fragment, null, childA, childB);\n\n// components compose like elements\nfunction App() {\n  return <Greeting name=\"Ada\" />;\n}" },
        { type: "list", items: [
          "**Class vs function components:** function components + hooks are the norm. Class components (`extends Component`, `this.state`, `render()`) exist and work, but you rarely write new ones.",
          "**`props.children`** holds nested content: `<Card>hi</Card>` passes `\"hi\"` as `children`.",
          "**Return one root** (or a Fragment). A component may also return a string, number, or an array of nodes."
        ] },
        { type: "callout", variant: "note", text: "Preact accepts both `class` and `className`, and both `for` and `htmlFor`. Unlike React you can write plain HTML attribute names (`class`, `tabindex`, `stroke-width` on SVG) and they work — Preact passes unknown props straight to the DOM." }
      ]
    },
    {
      id: "rendering",
      title: "Rendering with render() & hydrate()",
      level: "core",
      body: [
        { type: "p", text: "You mount an app by calling **`render(vnode, container)`** from `preact` — it diffs the vnode against `container` and applies the minimal DOM changes. There is **no `ReactDOM.createRoot`**; `render` is the entry point." },
        { type: "code", lang: "jsx", code: "import { render } from \"preact\";\nimport { App } from \"./app\";\n\nconst root = document.getElementById(\"app\");\nrender(<App />, root);   // mount (and re-mount: it diffs against existing content)" },
        { type: "code", lang: "jsx", code: "// hydrate server-rendered HTML instead of throwing it away\nimport { hydrate } from \"preact\";\nhydrate(<App />, document.getElementById(\"app\"));" },
        { type: "list", items: [
          "**`render(vnode, parent)`** replaces/patches `parent`'s contents. Call it again with a new tree to update the root imperatively (rare — components manage their own updates).",
          "**`hydrate(vnode, parent)`** attaches event listeners to existing server-rendered markup without re-creating DOM — use it for SSR/prerendered pages.",
          "**`preact/compat`** also exposes a React-shaped `createRoot(...).render(...)` if a library expects it, but native `render` is the idiom.",
          "**Remove an app:** `render(null, parent)` unmounts and cleans up."
        ] },
        { type: "callout", variant: "gotcha", text: "`render()` in Preact **patches** the container rather than clearing it first (differs from React 18's `createRoot`). If your target `<div>` has stale server HTML you don't want to hydrate, empty it first or use `hydrate` deliberately." }
      ]
    },
    {
      id: "hooks",
      title: "Hooks (preact/hooks)",
      level: "core",
      body: [
        { type: "p", text: "Hooks live in **`preact/hooks`** (a separate import from `react`'s bundled hooks) and behave identically to React's: `useState`, `useEffect`, `useLayoutEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useReducer`, `useId`, `useErrorBoundary`." },
        { type: "code", lang: "jsx", code: "import { useState, useEffect, useRef, useMemo, useCallback } from \"preact/hooks\";\n\nfunction Timer() {\n  const [count, setCount] = useState(0);\n  const tick = useCallback(() => setCount(c => c + 1), []);\n\n  useEffect(() => {\n    const id = setInterval(tick, 1000);\n    return () => clearInterval(id);   // cleanup on unmount / dep change\n  }, [tick]);\n\n  const doubled = useMemo(() => count * 2, [count]);\n  return <p>{count} (x2 = {doubled})</p>;\n}" },
        { type: "table", headers: ["Hook", "Use for"], rows: [
          ["`useState(init)`", "local reactive state; setter triggers re-render"],
          ["`useEffect(fn, deps)`", "side effects after paint; return a cleanup fn"],
          ["`useLayoutEffect`", "synchronous effect before paint (measure/mutate DOM)"],
          ["`useRef(init)`", "mutable `.current` box; also DOM refs"],
          ["`useMemo` / `useCallback`", "cache a value / a function across renders by deps"],
          ["`useContext(Ctx)`", "read the nearest context provider value"],
          ["`useReducer`", "reducer-driven state for complex transitions"],
          ["`useErrorBoundary(cb)`", "catch errors in children (Preact-specific ergonomic hook)"]
        ] },
        { type: "code", lang: "jsx", code: "// Preact's built-in error boundary hook (no class component needed)\nimport { useErrorBoundary } from \"preact/hooks\";\n\nfunction Boundary({ children }) {\n  const [error, reset] = useErrorBoundary();\n  if (error) return <button onClick={reset}>Retry ({String(error)})</button>;\n  return children;\n}" },
        { type: "callout", variant: "gotcha", text: "Import hooks from **`preact/hooks`**, not `preact`. And obey the Rules of Hooks: call them at the top level, in the same order every render — never inside conditions or loops." }
      ]
    },
    {
      id: "signals",
      title: "Signals — @preact/signals (the headline feature)",
      level: "core",
      body: [
        { type: "p", text: "**Signals** are Preact's fine-grained reactivity system. A `signal` holds a value; reading `.value` in JSX **subscribes that exact DOM node**. When you set `.value`, Preact updates **only that node** — no component re-render, no virtual-DOM diff of the subtree. It's the biggest reason to pick Preact over React." },
        { type: "code", lang: "bash", code: "npm i @preact/signals" },
        { type: "code", lang: "jsx", code: "import { signal, computed, effect } from \"@preact/signals\";\n\nconst count = signal(0);                 // a reactive box\nconst doubled = computed(() => count.value * 2);  // derived, auto-tracked\n\neffect(() => console.log(\"count is\", count.value)); // runs now + on every change\n\nfunction Counter() {\n  // NOTE: no useState, and this component body does NOT re-run on click\n  return (\n    <button onClick={() => count.value++}>\n      {count} (x2 = {doubled})\n    </button>\n  );\n}" },
        { type: "list", items: [
          "**`signal(v)`** — create. Read with `s.value`, write with `s.value = x`. In JSX you can drop `.value` and pass the signal itself (`{count}`) — Preact binds a text node directly to it.",
          "**`computed(fn)`** — a read-only derived signal; auto-tracks the signals `fn` reads and recomputes lazily.",
          "**`effect(fn)`** — run a side effect whenever its tracked signals change; returns a `dispose()` to stop it.",
          "**`batch(fn)`** — group multiple writes so subscribers update once.",
          "**`useSignal(v)`** / **`useComputed(fn)`** / **`useSignalEffect(fn)`** (from `@preact/signals`) — component-local signals that are created once and tied to the component lifecycle."
        ] },
        { type: "code", lang: "jsx", code: "import { useSignal, useComputed } from \"@preact/signals\";\n\nfunction LocalCounter() {\n  const count = useSignal(0);                  // local, created once\n  const label = useComputed(() => `n=${count.value}`);\n  return <button onClick={() => count.value++}>{label}</button>;\n}" },
        { type: "code", lang: "jsx", code: "// An object signal is ONE reactive value — @preact/signals is NOT deep\nimport { signal, batch } from \"@preact/signals\";\n\nconst user = signal({ name: \"Ada\", age: 36 });\nconst theme = signal(\"light\");\n// reading user.value subscribes to the signal; user.value.name is a plain read\n\n// reassign .value (spread a new object) to notify — in-place mutation won't\nbatch(() => {                     // group writes -> subscribers update once\n  user.value = { ...user.value, age: 37 };\n  theme.value = \"dark\";\n});" },
        { type: "callout", variant: "tip", text: "**Pass the signal, not `.value`, into JSX** (`{count}`) when you want the surgical one-node update. If you read `count.value` inside the component body/JSX, you subscribe the *whole component* to re-render instead — still correct, just less optimal." },
        { type: "callout", variant: "gotcha", text: "Signals hold values by reference. Mutating an object in place (`user.value.age = 37`) will **not** notify subscribers — reassign `.value` (or use a deep/nested signal) so the change is detected." },
        { type: "callout", variant: "note", text: "`@preact/signals-core` is the framework-agnostic engine (usable anywhere); `@preact/signals` adds the Preact JSX integration and the `use*` hooks. There's also `@preact/signals-react` for React." }
      ]
    },
    {
      id: "props-events",
      title: "Props & events (native DOM events)",
      level: "core",
      body: [
        { type: "p", text: "Props flow down as function arguments. The big divergence from React: **Preact uses real browser events**, attached directly to the DOM — there is **no synthetic event pooling or delegation layer**. Handlers receive the native `Event`." },
        { type: "code", lang: "jsx", code: "function SearchBox({ onSearch }) {\n  return (\n    <input\n      type=\"text\"\n      // onInput fires on every keystroke (React's onChange behaviour)\n      onInput={(e) => onSearch(e.currentTarget.value)}\n      // native casing works too: oninput / onInput both accepted\n    />\n  );\n}" },
        { type: "table", headers: ["React", "Preact", "Note"], rows: [
          ["`onChange` (per keystroke)", "**`onInput`**", "Preact's `onChange` is the *native* change (fires on blur/commit)"],
          ["`className={x}`", "`class={x}` or `className`", "both accepted"],
          ["`style={{color}}`", "`style={{ color }}` **or** string", "object or CSS string both work"],
          ["`SyntheticEvent`", "native `Event`", "use `e.currentTarget`, `stopPropagation()`"],
          ["`e.target` typing", "native DOM typing", "cast/annotate for TS"]
        ] },
        { type: "code", lang: "jsx", code: "// style accepts an object (camelCase or kebab) OR a plain string\n<div style={{ color: \"red\", marginTop: 8 }} />\n<div style=\"color: red; margin-top: 8px\" />\n\n// numeric style values without units get px (like React), except unitless props\n<div style={{ width: 200 }} />   // -> width: 200px" },
        { type: "callout", variant: "warn", text: "The **`onChange` trap**: on text inputs React's `onChange` behaves like the DOM `input` event. In Preact `onChange` is the *real* DOM change event (fires on blur/enter). For live-as-you-type updates use **`onInput`**." },
        { type: "callout", variant: "note", text: "Because events are native, there's no cross-browser synthetic normalization and no `e.persist()`. Event delegation is per-listener; capture-phase handlers use `onClickCapture` naming." }
      ]
    },
    {
      id: "lists-conditionals",
      title: "Lists, keys & conditionals",
      level: "core",
      body: [
        { type: "p", text: "Render a list by mapping data to elements. Give each item a stable **`key`** so the diff can match, move, and reuse DOM nodes instead of recreating them." },
        { type: "code", lang: "jsx", code: "function TodoList({ todos }) {\n  return (\n    <ul>\n      {todos.map((t) => (\n        <li key={t.id} class={t.done ? \"done\" : \"\"}>\n          {t.text}\n        </li>\n      ))}\n    </ul>\n  );\n}" },
        { type: "heading", text: "Conditionals" },
        { type: "code", lang: "jsx", code: "function Panel({ user, items }) {\n  return (\n    <div>\n      {user ? <Profile user={user} /> : <LoginButton />}\n\n      {items.length > 0 && <Badge count={items.length} />}\n\n      {/* false / null / undefined render nothing */}\n      {items.length === 0 && <p>No items yet.</p>}\n    </div>\n  );\n}" },
        { type: "list", items: [
          "**Use a stable, unique `key`** (an id) — not the array index when the list can reorder, insert, or delete, or you'll get wrong DOM reuse and lost input state.",
          "**`a && <X/>`** renders `<X/>` when truthy; beware `0 && <X/>` renders `0` — guard with `items.length > 0`.",
          "Returning an **array of vnodes** from a component is fine — no wrapper needed."
        ] },
        { type: "callout", variant: "gotcha", text: "Like React, using the array **index as `key`** breaks when items reorder or get removed — the diff mismatches and controlled inputs keep the previous row's value. Prefer a real id." }
      ]
    },
    {
      id: "refs-forms",
      title: "Refs, controlled inputs & forms",
      level: "core",
      body: [
        { type: "p", text: "**Refs** give you the underlying DOM node or a mutable value box. Use `useRef` and attach via the `ref` prop, or pass a callback ref." },
        { type: "code", lang: "jsx", code: "import { useRef, useEffect } from \"preact/hooks\";\n\nfunction AutoFocus() {\n  const input = useRef(null);\n  useEffect(() => input.current?.focus(), []);\n  return <input ref={input} />;\n}\n\n// callback ref\n<input ref={(el) => (myEl = el)} />" },
        { type: "heading", text: "Controlled inputs" },
        { type: "code", lang: "jsx", code: "import { useState } from \"preact/hooks\";\n\nfunction Form() {\n  const [name, setName] = useState(\"\");\n  const [agree, setAgree] = useState(false);\n\n  const onSubmit = (e) => {\n    e.preventDefault();\n    console.log({ name, agree });\n  };\n\n  return (\n    <form onSubmit={onSubmit}>\n      {/* value + onInput = controlled, updates per keystroke */}\n      <input value={name} onInput={(e) => setName(e.currentTarget.value)} />\n      <input type=\"checkbox\" checked={agree} onInput={(e) => setAgree(e.currentTarget.checked)} />\n      <button type=\"submit\">Save</button>\n    </form>\n  );\n}" },
        { type: "code", lang: "jsx", code: "// Signals make controlled inputs delightfully terse\nimport { useSignal } from \"@preact/signals\";\n\nfunction SignalForm() {\n  const name = useSignal(\"\");\n  return <input value={name} onInput={(e) => (name.value = e.currentTarget.value)} />;\n}" },
        { type: "list", items: [
          "**Controlled = `value` + `onInput`.** Use `onInput` (not `onChange`) so state tracks each keystroke.",
          "**Checkbox/radio** use `checked`; `<select>` uses `value` on the `<select>`.",
          "**Uncontrolled** = give a `ref` and read `ref.current.value` on submit — no state at all.",
          "**`forwardRef`** exists in `preact/compat`; in plain Preact you can also just pass a normal prop named `inputRef` if you prefer."
        ] },
        { type: "callout", variant: "tip", text: "Preact doesn't warn about a controlled input with `value` but no handler the way React does — if an input feels 'frozen', you likely set `value` without an `onInput` to update it." }
      ]
    },
    {
      id: "context",
      title: "Context (createContext)",
      level: "core",
      body: [
        { type: "p", text: "**`createContext`** shares data down the tree without prop-drilling — same API as React. Wrap with `<Ctx.Provider value={...}>` and read with `useContext(Ctx)`." },
        { type: "code", lang: "jsx", code: "import { createContext } from \"preact\";\nimport { useContext, useState } from \"preact/hooks\";\n\nconst ThemeCtx = createContext(\"light\");\n\nfunction App() {\n  const [theme, setTheme] = useState(\"dark\");\n  return (\n    <ThemeCtx.Provider value={theme}>\n      <Toolbar />\n      <button onClick={() => setTheme((t) => (t === \"dark\" ? \"light\" : \"dark\"))}>toggle</button>\n    </ThemeCtx.Provider>\n  );\n}\n\nfunction Toolbar() {\n  const theme = useContext(ThemeCtx);   // reads nearest provider\n  return <div class={theme}>...</div>;\n}" },
        { type: "callout", variant: "tip", text: "For app-wide state prefer a **signal in a module** (import it anywhere) over context + `useState` — it avoids re-rendering every consumer and needs no provider. Use context when the value must vary by subtree." },
        { type: "callout", variant: "note", text: "Preact implements the **modern** context API only. React's legacy `contextTypes`/`childContextTypes` are not supported — a non-issue for new code." }
      ]
    },
    {
      id: "routing",
      title: "Routing & SSR with preact-iso",
      level: "core",
      body: [
        { type: "p", text: "**`preact-iso`** is the official tiny isomorphic toolkit: a `<Router>` with `<Route>`s, async-friendly `lazy()` code-splitting, an `ErrorBoundary`, and helpers for **prerender/hydrate** so the same code runs on server and client." },
        { type: "code", lang: "bash", code: "npm i preact-iso" },
        { type: "code", lang: "jsx", code: "import { LocationProvider, Router, Route, lazy, ErrorBoundary } from \"preact-iso\";\nimport { Home } from \"./pages/home\";\n\nconst Profile = lazy(() => import(\"./pages/profile\"));   // async, code-split\n\nfunction App() {\n  return (\n    <LocationProvider>\n      <ErrorBoundary>\n        <Router>\n          <Route path=\"/\" component={Home} />\n          <Route path=\"/users/:id\" component={Profile} />\n          <Route default component={NotFound} />\n        </Router>\n      </ErrorBoundary>\n    </LocationProvider>\n  );\n}" },
        { type: "code", lang: "jsx", code: "// read route params & navigate\nimport { useRoute, useLocation } from \"preact-iso\";\n\nfunction Profile() {\n  const { params } = useRoute();       // { id: \"...\" }\n  const { route } = useLocation();     // route(\"/\") to navigate\n  return (\n    <div>\n      <p>User {params.id}</p>\n      <button onClick={() => route(\"/\")}>Home</button>\n    </div>\n  );\n}" },
        { type: "code", lang: "jsx", code: "// SSR / prerender entry: preact-iso ships prerender()\nimport { prerender as ssr } from \"preact-iso\";\nexport async function prerender(data) {\n  return await ssr(<App {...data} />);   // returns { html, links }\n}\n// client hydrates the same tree:\nimport { hydrate } from \"preact-iso\";\nhydrate(<App />, document.getElementById(\"app\"));" },
        { type: "list", items: [
          "**`<Router>` + `<Route path component>`**: `:param` segments, `default` for 404. Wrap in `<LocationProvider>`.",
          "**`lazy(() => import(...))`** returns a component that suspends while loading — pair with `preact-iso`'s built-in async handling; no separate `<Suspense>` boilerplate.",
          "**`ErrorBoundary`** catches render/async errors below it.",
          "**Alternatives:** `wouter-preact` (hook-based, ~1kB) and `preact-router` (older) are popular if you don't need SSR.",
          "**`create-preact`** can scaffold this router + prerendering for you (choose 'prerender' at init)."
        ] },
        { type: "callout", variant: "note", text: "`preact-iso`'s `hydrate` and `prerender` are re-exports tuned for its router. For non-router SSR you can render to a string with **`preact-render-to-string`** (`renderToString(<App/>)`) and hydrate with `preact`'s `hydrate`." }
      ]
    },
    {
      id: "compat",
      title: "preact/compat — running React libraries",
      level: "core",
      body: [
        { type: "p", text: "**`preact/compat`** is a compatibility layer that implements the extra React surface (`forwardRef`, `memo`, `Children`, `createPortal`, `Suspense`, `PureComponent`, `createRoot`, synthetic-ish niceties). You **alias `react` and `react-dom` to it** so React libraries import Preact instead — most just work at a fraction of the size." },
        { type: "code", lang: "js", code: "// @preact/preset-vite sets these aliases automatically. Manual Vite config:\nexport default {\n  resolve: {\n    alias: {\n      react: \"preact/compat\",\n      \"react-dom\": \"preact/compat\",\n      \"react/jsx-runtime\": \"preact/jsx-runtime\",\n      \"react-dom/test-utils\": \"preact/test-utils\",\n    },\n  },\n};" },
        { type: "code", lang: "jsx", code: "// import compat APIs directly when you don't want a global alias\nimport { forwardRef, memo, createPortal, Suspense, lazy } from \"preact/compat\";\n\nconst Modal = ({ children }) =>\n  createPortal(<div class=\"modal\">{children}</div>, document.body);" },
        { type: "list", items: [
          "**Aliasing** is the switch that makes `import ... from \"react\"` resolve to Preact — set it in Vite/webpack/tsconfig `paths`, or let the preset do it.",
          "**Provides:** `forwardRef`, `memo`, `PureComponent`, `Children.*`, `createPortal`, `Suspense`/`lazy`, `createRoot`, `flushSync`, `unstable_batchedUpdates` (no-op-ish).",
          "**Most React libraries work** (React Router, Redux, react-query, MUI-ish, etc.); ones using **React internals** or the reconciler (react-three-fiber, some animation libs) may not."
        ] },
        { type: "callout", variant: "warn", text: "If a React library throws about missing `react` internals or a hook 'called outside a component', you probably forgot the **alias**. Add `react`/`react-dom` → `preact/compat` in your bundler. Without aliasing, `preact/compat` exports still let you use `forwardRef`/`memo` in your own code." },
        { type: "callout", variant: "gotcha", text: "`preact/compat` adds a little weight and re-adds React-style `onChange` semantics for aliased components — that's usually what you want when hosting React libs. Your own Preact components still use native events." }
      ]
    },
    {
      id: "htm",
      title: "htm — JSX without a build step",
      level: "deep",
      body: [
        { type: "p", text: "**`htm`** is a tiny (~500b) tagged-template alternative to JSX. It uses standard JS template literals — so it runs **directly in the browser with no transpiler**. Great for embedding Preact on a page, CodePens, or Deno." },
        { type: "code", lang: "html", code: "<script type=\"module\">\n  import { h, render } from \"https://esm.sh/preact\";\n  import { useState } from \"https://esm.sh/preact/hooks\";\n  import htm from \"https://esm.sh/htm\";\n\n  const html = htm.bind(h);   // bind the template tag to Preact's h()\n\n  function Counter() {\n    const [n, setN] = useState(0);\n    return html`<button onClick=${() => setN(n + 1)}>count: ${n}</button>`;\n  }\n\n  render(html`<${Counter} />`, document.body);\n</script>" },
        { type: "list", items: [
          "**`htm.bind(h)`** returns a `html` tag; interpolate with `${...}` and mount components as `<${Comp} />`.",
          "**`htm`** ships a Preact preset: `import { html } from \"htm/preact\"` gives a ready-bound `html` tag (no `htm.bind(h)` needed).",
          "**Trade-off:** no JSX tooling/type-checking on the template contents; slightly different syntax (`${...}` instead of `{...}`)."
        ] },
        { type: "callout", variant: "tip", text: "Use `htm` for zero-build widgets and demos; use JSX (via Vite) for real apps where you want type-checking, editor support, and dead-code elimination." }
      ]
    },
    {
      id: "typescript",
      title: "TypeScript usage",
      level: "deep",
      body: [
        { type: "p", text: "Preact ships its own types (no `@types/preact` needed). Configure JSX to use Preact's runtime and type your props with plain interfaces." },
        { type: "code", lang: "json", code: "// tsconfig.json\n{\n  \"compilerOptions\": {\n    \"jsx\": \"react-jsx\",\n    \"jsxImportSource\": \"preact\",\n    \"skipLibCheck\": true,\n    \"moduleResolution\": \"bundler\"\n  }\n}" },
        { type: "code", lang: "tsx", code: "import { type JSX } from \"preact\";\nimport { useState } from \"preact/hooks\";\n\ntype Props = {\n  title: string;\n  onClose?: () => void;\n  children?: JSX.Element | JSX.Element[];\n};\n\nfunction Dialog({ title, onClose, children }: Props) {\n  const [open, setOpen] = useState(true);\n  if (!open) return null;\n  // event target is a real DOM element — annotate the handler:\n  const close = (e: JSX.TargetedEvent<HTMLButtonElement>) => {\n    setOpen(false);\n    onClose?.();\n  };\n  return (\n    <div role=\"dialog\">\n      <h2>{title}</h2>\n      {children}\n      <button onClick={close}>close</button>\n    </div>\n  );\n}" },
        { type: "list", items: [
          "**`JSX.TargetedEvent<T>`** / `JSX.TargetedInputEvent<T>` type native handlers with a correctly-typed `currentTarget`.",
          "**Signals are typed:** `signal<number>(0)`, `Signal<T>`; `.value` is `T`.",
          "**For React-lib types** via compat, add `\"react\": [\"./node_modules/preact/compat\"]` under `compilerOptions.paths` so `@types/react`-based code resolves."
        ] },
        { type: "callout", variant: "note", text: "Use `jsxImportSource: \"preact\"` with `jsx: \"react-jsx\"` (automatic runtime) so you never import `h` manually and get correct JSX types out of the box." }
      ]
    },
    {
      id: "testing",
      title: "Testing (Testing Library + Vitest)",
      level: "core",
      body: [
        { type: "p", text: "Test components with **`@testing-library/preact`** (render + query the DOM the way users see it) running under **Vitest** (or Jest) with a `jsdom`/`happy-dom` environment." },
        { type: "code", lang: "bash", code: "npm i -D vitest @testing-library/preact @testing-library/jest-dom jsdom" },
        { type: "code", lang: "tsx", code: "import { render, screen, fireEvent } from \"@testing-library/preact\";\nimport { expect, test } from \"vitest\";\nimport { Counter } from \"./counter\";\n\ntest(\"increments on click\", async () => {\n  render(<Counter />);\n  const btn = screen.getByRole(\"button\");\n  await fireEvent.click(btn);\n  expect(btn).toHaveTextContent(\"1\");\n});" },
        { type: "code", lang: "js", code: "// vitest.config.js\nimport { defineConfig } from \"vitest/config\";\nimport preact from \"@preact/preset-vite\";\nexport default defineConfig({\n  plugins: [preact()],\n  test: { environment: \"jsdom\", globals: true },\n});" },
        { type: "list", items: [
          "**`@testing-library/preact`** mirrors the React Testing Library API: `render`, `screen`, `fireEvent`, `waitFor`, `cleanup`.",
          "**Signals** are easy to unit-test standalone: set `.value`, assert `computed`/`effect` output — no component needed.",
          "**`preact/test-utils`** offers `act()` and low-level helpers if you need them."
        ] },
        { type: "callout", variant: "tip", text: "Because Preact uses native events, `fireEvent.input(...)` (not just `change`) is what triggers your `onInput` handlers — match the event to the handler you wrote." }
      ]
    },
    {
      id: "performance",
      title: "Performance & optimization",
      level: "deep",
      body: [
        { type: "p", text: "Preact is fast by default (small runtime, quick diff). The biggest lever is **avoiding unnecessary re-renders** — and signals sidestep that class of problem entirely by updating single nodes." },
        { type: "list", items: [
          "**Prefer signals for hot state:** a `signal` bound in JSX updates just its text node — no component re-render, no `memo` needed.",
          "**`memo(Component)`** (from `preact/compat`) skips re-render when props are shallow-equal — use for expensive pure components under a frequently-updating parent.",
          "**`useMemo`/`useCallback`** cache derived values / stable handler identities across renders.",
          "**Code-split** routes with `lazy(() => import(...))` so initial JS stays tiny.",
          "**Keys** on lists let the diff move nodes instead of rebuilding them.",
          "**`useLayoutEffect`** only when you must read/write layout synchronously; otherwise `useEffect` (runs after paint)."
        ] },
        { type: "code", lang: "jsx", code: "import { memo } from \"preact/compat\";\n\nconst Row = memo(function Row({ item }) {\n  return <li>{item.label}</li>;   // re-renders only when `item` changes\n});" },
        { type: "callout", variant: "tip", text: "Reach for signals *before* sprinkling `memo`/`useCallback`. The classic React optimization dance (stable references, memoized children) largely disappears when state lives in signals that update targeted nodes." },
        { type: "callout", variant: "note", text: "Preact batches state updates within event handlers like React. For imperative bursts of signal writes outside a handler, wrap them in `batch(() => { ... })` to collapse notifications." }
      ]
    },
    {
      id: "build-deploy",
      title: "Build, prerender & deploy",
      level: "core",
      body: [
        { type: "p", text: "`npm run build` (Vite) emits a hashed, minified bundle in `dist/` — plain static files you can host anywhere. For SEO/first-paint, **prerender to static HTML** and hydrate on the client." },
        { type: "code", lang: "bash", code: "npm run build       # -> dist/ (static assets)\nnpm run preview     # smoke-test the production build locally" },
        { type: "code", lang: "js", code: "// enable prerendering in the Vite preset: it runs your exported prerender()\nimport preact from \"@preact/preset-vite\";\nexport default {\n  plugins: [\n    preact({\n      prerender: {\n        enabled: true,\n        renderTarget: \"#app\",\n        additionalPrerenderRoutes: [\"/\", \"/about\"],\n      },\n    }),\n  ],\n};" },
        { type: "list", items: [
          "**Static hosting:** deploy `dist/` to Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 — no server needed for an SPA/prerendered app.",
          "**Prerender (SSG):** the preset calls your `prerender()` export at build time and inlines the HTML; the client `hydrate`s it.",
          "**Full SSR:** render per-request with `preact-render-to-string` behind a Node/edge server, then `hydrate` on the client.",
          "**Bundle wins:** Preact's tiny runtime plus tree-shaking keeps first-load JS small — verify with `vite build --report` or `source-map-explorer`."
        ] },
        { type: "callout", variant: "tip", text: "For an SPA on static hosts, add a **catch-all rewrite** to `index.html` (e.g. Netlify `/* /index.html 200`) so client routes deep-link correctly." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "Most Preact pain comes from React muscle-memory. Here are the divergences and signal pitfalls that actually bite people." },
        { type: "table", headers: ["Symptom", "Cause", "Fix"], rows: [
          ["Text input only updates on blur", "used `onChange` (native = change event)", "use **`onInput`** for per-keystroke"],
          ["A React library crashes / hook error", "`react` not aliased to compat", "alias `react`+`react-dom` → **`preact/compat`**"],
          ["Signal change doesn't re-render", "mutated object in place", "reassign `.value` (or use nested signal)"],
          ["`import { useState } from \"preact\"` fails", "hooks are a separate entry", "import from **`preact/hooks`**"],
          ["Whole component re-renders on signal change", "read `.value` in body/JSX", "pass the **signal itself** `{count}`"],
          ["`forwardRef`/`memo` undefined", "not in core `preact`", "import from **`preact/compat`**"],
          ["Input state jumps between rows", "index used as `key`", "use a stable **id** key"],
          ["Blank page after `render`", "container had SSR HTML", "use `hydrate`, or empty the node"]
        ] },
        { type: "list", items: [
          "**Events are native.** No `SyntheticEvent`, no `e.persist()`; use `e.currentTarget`. Capture phase is `onClickCapture` etc.",
          "**`class` and `className` both work** — but a library copied from React using `className` is fine; don't 'fix' it.",
          "**Signals vs hooks:** don't read `signal.value` inside `useEffect` deps expecting React-style tracking — effects use their dep array; `effect()`/`useSignalEffect` auto-track instead.",
          "**Compat is not free:** aliasing pulls in the compat layer (still tiny). If you author everything in Preact, you may not need it at all.",
          "**Object signals are one reactive value** (`@preact/signals` is not deep) — reassign `.value` with a fresh object (`{...obj, x}`) to notify; for per-property reactivity reach for the `deepsignal` add-on.",
          "**SSR mismatch:** the tree you `hydrate` must match the prerendered HTML exactly, or Preact re-renders from scratch (losing the hydration win)."
        ] },
        { type: "callout", variant: "gotcha", text: "The single most common gotcha: copying a React `<input onChange={...}/>` and finding it 'laggy'. In Preact that's the **change** event. Swap to **`onInput`** and it tracks every keystroke like you expect." }
      ]
    }
  ],

  packages: [
    { name: "preact", why: "core: h/JSX, render, hydrate, createContext, Fragment, Component" },
    { name: "preact/hooks", why: "useState/useEffect/useRef/useMemo/useContext/useReducer/useErrorBoundary" },
    { name: "@preact/signals", why: "fine-grained reactivity: signal/computed/effect + useSignal hooks" },
    { name: "@preact/signals-core", why: "framework-agnostic signals engine (use anywhere)" },
    { name: "preact/compat", why: "React aliasing layer: forwardRef, memo, portals, Suspense — run React libs" },
    { name: "preact-iso", why: "isomorphic router + lazy() + ErrorBoundary + prerender/hydrate" },
    { name: "@preact/preset-vite", why: "Vite plugin: JSX transform, Prefresh HMR, compat alias, prerender" },
    { name: "create-preact", why: "official scaffolder (npm init preact) — Vite + TS + router" },
    { name: "preact-render-to-string", why: "renderToString for SSR" },
    { name: "@testing-library/preact", why: "component testing (render/screen/fireEvent)" },
    { name: "htm", why: "JSX-like tagged templates, no build step (htm/preact)" },
    { name: "wouter-preact", why: "tiny hook-based router alternative" },
    { name: "preact-router", why: "older URL router (match-based)" },
    { name: "preact/debug", why: "dev-only warnings + Preact DevTools bridge (import once)" }
  ],

  gotchas: [
    "Text inputs: React's `onChange` == Preact's **`onInput`**. Preact's `onChange` is the *native* change event (fires on blur/commit) — use `onInput` for live updates.",
    "Import hooks from **`preact/hooks`**, not `preact`. `import { useState } from \"preact\"` fails.",
    "To run React libraries, **alias `react` and `react-dom` to `preact/compat`** in your bundler — otherwise you get missing-internals / hook errors.",
    "`forwardRef`, `memo`, `createPortal`, `Suspense`, `PureComponent` live in **`preact/compat`**, not core `preact`.",
    "Signals hold values by reference: mutating an object in place (`s.value.x = 1`) won't notify — **reassign `.value`** or use a nested/deep signal.",
    "Reading `signal.value` inside a component body/JSX subscribes the **whole component**; pass the signal itself (`{count}`) for a surgical one-node update.",
    "Preact uses **native DOM events** — no `SyntheticEvent`, no `e.persist()`. Use `e.currentTarget`; capture handlers are `onClickCapture`.",
    "`render(vnode, node)` **patches** the container (doesn't clear it first like React 18's `createRoot`) — empty stale HTML or use `hydrate` on purpose.",
    "Use a stable **id as `key`**, never the array index for reorderable lists, or controlled input values leak between rows.",
    "`class` and `className` both work in Preact; don't 'fix' React-style `className` — it's fine.",
    "SSR/prerender: the tree you `hydrate` must **match the server HTML exactly**, or Preact discards it and re-renders (losing hydration).",
    "`useEffect` deps do NOT auto-track signals — use `effect()` / `useSignalEffect` for signal-driven side effects; `useEffect` still uses its dep array.",
    "`0 && <X/>` renders `0`. Guard truthiness explicitly: `arr.length > 0 && <X/>`.",
    "Import **`preact/debug`** once in dev for helpful warnings + DevTools — but never ship it in production (it adds weight/checks)."
  ],

  flashcards: [
    { q: "Why choose Preact over React?", a: "Same API (function components, hooks, JSX) at **~3kB**, native DOM events, and first-class **signals** for fine-grained reactivity. Run React libraries via `preact/compat`." },
    { q: "Where do hooks come from in Preact?", a: "The **`preact/hooks`** entry point — `import { useState } from \"preact/hooks\"`. They behave identically to React's hooks." },
    { q: "What is a signal and how does it update the DOM?", a: "A `signal(v)` is a reactive box read via `.value`. Binding it in JSX subscribes that **exact DOM node**; setting `.value` updates only that node — no component re-render or vdom diff." },
    { q: "How do you create derived and side-effect signals?", a: "`computed(fn)` for a lazy, auto-tracked derived value; `effect(fn)` runs (and re-runs) a side effect on change and returns a dispose fn. `batch(fn)` groups writes." },
    { q: "signal vs useSignal?", a: "`signal()` is a module-level/global reactive value; **`useSignal()`** (from `@preact/signals`) creates a component-local signal once, tied to that component's lifecycle." },
    { q: "What is preact/compat and when do you need it?", a: "A compatibility layer providing extra React APIs (forwardRef, memo, portals, Suspense). **Alias `react`/`react-dom` to it** so React libraries import Preact and just work." },
    { q: "React's onChange vs Preact's?", a: "Preact uses **native events**: `onChange` fires on the real DOM change (blur/commit). For per-keystroke updates use **`onInput`** — that's React's onChange behaviour." },
    { q: "How do you render/mount a Preact app?", a: "`render(<App/>, container)` from `preact` (no createRoot). For server-rendered HTML use `hydrate(<App/>, container)`; `render(null, node)` unmounts." },
    { q: "What does preact-iso provide?", a: "An isomorphic toolkit: `<LocationProvider>/<Router>/<Route>`, `lazy()` code-splitting, `ErrorBoundary`, and `prerender`/`hydrate` for SSR — plus `useRoute`/`useLocation` hooks." },
    { q: "How do you make a controlled input?", a: "`value={state}` + **`onInput={e => setState(e.currentTarget.value)}`**. Checkboxes use `checked`. With signals: `value={sig}` + `onInput={e => sig.value = ...}`." },
    { q: "How do you share state without prop drilling?", a: "`createContext` + `<Ctx.Provider>` + `useContext(Ctx)` — same as React. Or import a module-level **signal** anywhere (no provider, no consumer re-render)." },
    { q: "What is htm?", a: "A ~500b tagged-template alternative to JSX (`htm.bind(h)`) that runs in the browser with **no build step** — interpolate with `${...}`, mount components as `<${Comp}/>`." },
    { q: "How do you scaffold and build a Preact app?", a: "`npm init preact` (create-preact) sets up Vite + `@preact/preset-vite`. `npm run dev` / `npm run build`; the preset can prerender to static HTML." },
    { q: "Why doesn't my signal update re-render?", a: "You mutated an object in place. Signals compare by reference — **reassign `.value`** (e.g. `s.value = {...s.value, x}`) or use a nested signal so the change is detected." },
    { q: "How do you catch errors in a Preact tree?", a: "`useErrorBoundary()` from `preact/hooks` returns `[error, reset]`; or `preact-iso`'s `<ErrorBoundary>`. In compat, standard React error-boundary classes work too." }
  ],

  cheatsheet: [
    { label: "New project", code: "npm init preact" },
    { label: "Dev / build", code: "npm run dev  |  npm run build" },
    { label: "Mount", code: "render(<App/>, document.getElementById(\"app\"))" },
    { label: "Hydrate SSR", code: "hydrate(<App/>, node)" },
    { label: "State hook", code: "const [n, setN] = useState(0);  // from preact/hooks" },
    { label: "Signal", code: "const count = signal(0); count.value++" },
    { label: "Computed", code: "const d = computed(() => count.value * 2)" },
    { label: "Local signal", code: "const n = useSignal(0);  // @preact/signals" },
    { label: "Signal in JSX", code: "<span>{count}</span>  // updates just this node" },
    { label: "Controlled input", code: "<input value={v} onInput={e => setV(e.currentTarget.value)}/>" },
    { label: "Context", code: "const C = createContext(x); useContext(C)" },
    { label: "Ref", code: "const el = useRef(null); <input ref={el}/>" },
    { label: "Router", code: "<Router><Route path=\"/u/:id\" component={U}/></Router>" },
    { label: "Route params", code: "const { params } = useRoute();" },
    { label: "Lazy route", code: "const P = lazy(() => import(\"./p\"));" },
    { label: "Compat alias", code: "alias: { react: \"preact/compat\" }" }
  ]
});
