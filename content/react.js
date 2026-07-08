(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "react",
  name: "React",
  language: "TypeScript",
  group: "Web UI (JS / TS)",
  navLabel: "React",
  color: "#61dafb",
  readMinutes: 32,
  tagline: "The **component + hooks** library that defines modern UI: declarative JSX, unidirectional data flow, and (in v19) first-class **Actions**, `use()`, and Server Components.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "React is a **library** (not a full framework) for building user interfaces out of **components**: functions that take data (**props** + **state**) and return a description of the UI (**JSX**). You never touch the DOM imperatively — you declare *what* the UI should look like for the current state, and React reconciles the real DOM to match." },
        { type: "list", items: [
          "**Declarative & unidirectional:** UI is a function of state; data flows **down** through props, events flow **up** through callbacks. Change state → React re-renders the affected components → the DOM updates.",
          "**Component model:** modern React is **function components + hooks**. Class components still work but are legacy — you will not write new ones. This deck uses function components only.",
          "**Reach for it when:** you want the largest UI ecosystem, a component model that scales from a widget to an app, and freedom to pick your own router/data/state libraries (React is unopinionated — the framework layer is Next.js / React Router / Remix)."
        ] },
        { type: "table", headers: ["Concept", "React API", "One-liner"], rows: [
          ["Local state", "`useState` / `useReducer`", "reactive value owned by a component"],
          ["Side effect", "`useEffect`", "sync with an external system (often overused)"],
          ["Derived value", "compute in render (or `useMemo`)", "no state needed — just calculate it"],
          ["Escape hatch to DOM", "`useRef`", "a mutable box that survives re-renders"],
          ["Shared/global state", "Context, Zustand, Redux Toolkit", "avoid prop-drilling"],
          ["Async data", "`use()` + Suspense / TanStack Query", "read a promise, cache server state"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets **React 19** (stable since Dec 2024). The headline additions over 18: **Actions** (`useActionState`, `useFormStatus`, `useOptimistic`, async transitions), the **`use()`** API, `ref` as a normal prop (**`forwardRef` no longer needed**), native document-metadata hoisting (`<title>`/`<meta>` anywhere), and the production-ready **React Compiler 1.0** (auto-memoization)." },
        { type: "callout", variant: "tip", text: "Keep the core loop in your head: **render is pure** (no side effects, no mutation — it just computes JSX from props/state), and everything that touches the outside world happens in **event handlers** or **effects**. Most React bugs are a violation of that split." }
      ]
    },
    {
      id: "setup",
      title: "Setup, tooling & project structure",
      level: "core",
      body: [
        { type: "p", text: "The old `create-react-app` is deprecated. For a **client-side SPA**, scaffold with **Vite** — instant dev server, fast HMR, and a tiny config. For a real production app (routing, SSR, data, SEO) the React team recommends starting from a **framework**: **Next.js**, **React Router v7** (framework mode), or **Expo** (for native)." },
        { type: "code", lang: "bash", code: "# Vite SPA (client-only) — great for dashboards, embedded widgets, learning\nnpm create vite@latest my-app -- --template react-ts\ncd my-app\nnpm install\nnpm run dev        # http://localhost:5173\nnpm run build      # -> dist/ (static assets)\n\n# Or a full framework for real apps:\nnpx create-next-app@latest my-app          # Next.js (RSC, routing, SSR)\nnpx create-react-router@latest my-app      # React Router v7 framework mode" },
        { type: "code", lang: "tsx", code: "// src/main.tsx — the client entry (React 18/19 root API)\nimport { StrictMode } from \"react\";\nimport { createRoot } from \"react-dom/client\";\nimport App from \"./App\";\nimport \"./index.css\";\n\ncreateRoot(document.getElementById(\"root\")!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);" },
        { type: "list", items: [
          "**`<StrictMode>`** (dev only) intentionally **double-invokes** render, effects, and reducers to surface impure code and missing effect cleanup. It has zero effect in production — do not remove it to \"fix\" a double log; fix the impurity.",
          "**Structure (SPA):** `src/main.tsx` (entry), `src/App.tsx` (root), `src/components/`, `src/hooks/` (custom hooks), `src/lib/` (non-React utils). Colocate a component with its styles/tests.",
          "**TypeScript is standard.** Type props with an interface/type, let inference handle `useState`, and prefer `React.ReactNode` for `children`. `.tsx` files hold JSX; `.ts` holds plain logic."
        ] },
        { type: "callout", variant: "tip", text: "Add the official lint rules: `eslint-plugin-react-hooks` (its **recommended** preset now also ships the **React Compiler** rules) enforces the Rules of Hooks and flags effect-dependency and mutation mistakes at author time. This is the single highest-value setup step." }
      ]
    },
    {
      id: "jsx",
      title: "JSX, rendering, lists & keys",
      level: "core",
      body: [
        { type: "p", text: "**JSX** is HTML-like syntax that compiles to `React.createElement(...)` calls (plain objects describing the UI). It is expressions, not templates — any JS value goes inside `{ }`, and a component **returns one** element tree." },
        { type: "code", lang: "tsx", code: "function Greeting({ name, admin }: { name: string; admin: boolean }) {\n  const label = `Hello, ${name}`;\n  return (\n    <section className=\"greet\">          {/* class -> className */}\n      <h1 style={{ color: \"teal\" }}>{label}</h1>  {/* style is an object */}\n      <label htmlFor=\"x\">Name</label>    {/* for -> htmlFor */}\n      {admin && <span>(admin)</span>}     {/* conditional render */}\n      {admin ? <AdminPanel /> : null}     {/* ternary for either/or */}\n    </section>\n  );\n}" },
        { type: "list", items: [
          "**Return one root.** Wrap siblings in a parent or a **Fragment** `<>...</>` (renders nothing extra).",
          "**Attributes are camelCase:** `className`, `htmlFor`, `onClick`, `tabIndex`. `style` takes an **object** of camelCased CSS props.",
          "**`{expr}` interpolates.** `false`, `null`, `undefined`, and `true` render **nothing** — that is why `cond && <X/>` works. But `0 && <X/>` renders **`0`**; use `cond ? <X/> : null` or `!!count &&`.",
          "**Everything must be closed:** `<img />`, `<br />`, `<input />`."
        ] },
        { type: "heading", text: "Lists & keys" },
        { type: "p", text: "Render a list by mapping data to elements. Each sibling needs a **stable, unique `key`** so React can match elements across renders — keys are how it knows which item moved, was added, or removed." },
        { type: "code", lang: "tsx", code: "function TodoList({ todos }: { todos: Todo[] }) {\n  return (\n    <ul>\n      {todos.map((t) => (\n        <li key={t.id}>{t.title}</li>   // key = stable id, NOT the array index\n      ))}\n    </ul>\n  );\n}" },
        { type: "callout", variant: "gotcha", text: "**Never use the array index as `key`** for a list that can reorder, filter, or insert. On change React reuses the wrong DOM node/state — you get stale inputs, wrong checkboxes, and animation glitches. Use a real id. Index is only acceptable for a static, never-reordered list." },
        { type: "callout", variant: "note", text: "A `key` must be unique **among siblings**, not globally. Changing a component's `key` is also a deliberate trick to force React to **remount** it (reset all its state) — e.g. `<Form key={userId} />` gives each user a fresh form." }
      ]
    },
    {
      id: "components",
      title: "Components, props & composition",
      level: "core",
      body: [
        { type: "p", text: "A component is a function whose name is **Capitalized** (lowercase names are treated as DOM tags). It receives a single **props** object and returns JSX. Props are **read-only** — a component must never mutate them; to change data, the owner updates its state and passes new props down." },
        { type: "code", lang: "tsx", code: "type ButtonProps = {\n  variant?: \"primary\" | \"ghost\";\n  onClick?: () => void;\n  children: React.ReactNode;    // whatever is nested between the tags\n};\n\nfunction Button({ variant = \"primary\", onClick, children }: ButtonProps) {\n  return (\n    <button className={`btn btn-${variant}`} onClick={onClick}>\n      {children}\n    </button>\n  );\n}\n\n// usage — children is the composition slot\n<Button variant=\"ghost\" onClick={save}>Save changes</Button>" },
        { type: "heading", text: "Composition over configuration" },
        { type: "p", text: "React has **no `extends`** — you reuse UI by **composing** components and passing JSX through `children` (and named slots as props). This is how you build layout shells, cards, and modals without inheritance." },
        { type: "code", lang: "tsx", code: "function Card({ title, actions, children }: {\n  title: string;\n  actions?: React.ReactNode;   // a \"slot\" — pass any JSX\n  children: React.ReactNode;\n}) {\n  return (\n    <div className=\"card\">\n      <header><h3>{title}</h3>{actions}</header>\n      <div className=\"card-body\">{children}</div>\n    </div>\n  );\n}\n\n<Card title=\"Profile\" actions={<Button>Edit</Button>}>\n  <p>Body content here</p>\n</Card>" },
        { type: "callout", variant: "tip", text: "Prefer **composition + `children`** over prop-drilling deep configuration. If a component takes 15 boolean props, it usually wants to be split, or to accept JSX slots. \"Lift state up\" to the closest common parent when two components need to share it." },
        { type: "callout", variant: "note", text: "**Spread with care:** `<Comp {...props} />` forwards everything, handy for wrappers, but it hides which props flow through and can pass invalid DOM attributes. Be explicit for public components." }
      ]
    },
    {
      id: "state",
      title: "State: useState & useReducer",
      level: "core",
      body: [
        { type: "p", text: "**`useState`** gives a component a reactive value plus a setter. Calling the setter **schedules a re-render** with the new value — it does not mutate a variable in place. State is **local and private** to the component instance." },
        { type: "code", lang: "tsx", code: "import { useState } from \"react\";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);         // lazy init: useState(() => heavy())\n\n  return (\n    <button onClick={() => setCount((c) => c + 1)}>  {/* updater form */}\n      Count: {count}\n    </button>\n  );\n}" },
        { type: "list", items: [
          "**State is a snapshot.** Within one render `count` is a fixed number. `setCount(count + 1)` twice in a row still only +1 — use the **updater form** `setCount(c => c + 1)` when the next value depends on the previous.",
          "**Updates are batched** and asynchronous: reading `count` right after `setCount` gives the *old* value; the new one arrives on the next render.",
          "**Treat state as immutable.** Never `state.push(x)` or `obj.field = y`. Create a new array/object: `setItems([...items, x])`, `setUser({ ...user, name })`. Mutating in place will not re-render and corrupts React's comparison."
        ] },
        { type: "heading", text: "useReducer for complex/related state" },
        { type: "p", text: "When state has **many sub-values that update together**, or the next state is a function of an event **type**, a reducer centralizes the logic into one pure `(state, action) => newState` function — easier to test and to reason about than scattered `useState`s." },
        { type: "code", lang: "tsx", code: "import { useReducer } from \"react\";\n\ntype State = { count: number; step: number };\ntype Action = { type: \"inc\" } | { type: \"setStep\"; step: number };\n\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case \"inc\":     return { ...state, count: state.count + state.step };\n    case \"setStep\": return { ...state, step: action.step };\n  }\n}\n\nfunction Counter() {\n  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });\n  return <button onClick={() => dispatch({ type: \"inc\" })}>{state.count}</button>;\n}" },
        { type: "callout", variant: "gotcha", text: "**Do not derive state into state.** If a value can be computed from existing props/state, compute it *during render* (`const total = items.length`) instead of storing it in a second `useState` and syncing it in an effect. Duplicated state drifts out of sync — this is the #1 React antipattern (see Common headaches)." },
        { type: "callout", variant: "note", text: "`useState` re-runs the whole component on every change. For an alternative model that updates only the nodes that read a value — **signals** — see the *Signals* section; they're not built into React but are a popular fine-grained-reactivity option." }
      ]
    },
    {
      id: "effects",
      title: "useEffect — and when NOT to use it",
      level: "core",
      body: [
        { type: "p", text: "**`useEffect`** synchronizes a component with an **external system** — the DOM outside React, a subscription, a timer, a non-React widget, browser APIs. It runs **after** render commits, re-runs when its **dependencies** change, and can return a **cleanup** function that runs before the next effect and on unmount." },
        { type: "code", lang: "tsx", code: "import { useEffect, useState } from \"react\";\n\nfunction WindowWidth() {\n  const [w, setW] = useState(window.innerWidth);\n  useEffect(() => {\n    const onResize = () => setW(window.innerWidth);\n    window.addEventListener(\"resize\", onResize);\n    return () => window.removeEventListener(\"resize\", onResize); // cleanup!\n  }, []);                            // [] = run once on mount, clean up on unmount\n  return <p>{w}px</p>;\n}" },
        { type: "heading", text: "You might not need an effect" },
        { type: "p", text: "Effects are the **most misused** hook. If you are not talking to an external system, you probably do not need one. The React docs dedicate a whole page to removing effects." },
        { type: "table", headers: ["Instead of an effect that...", "Do this"], rows: [
          ["computes a value from props/state", "**calculate it in render** — `const full = a + b`"],
          ["caches an expensive calc", "**`useMemo`**, not effect + state"],
          ["resets state when a prop changes", "give the component a **`key`** so it remounts"],
          ["updates state on a user click", "do it in the **event handler**, not an effect"],
          ["fetches data on mount", "use a **framework loader / TanStack Query / `use()`**"]
        ] },
        { type: "code", lang: "tsx", code: "// BAD: effect to derive state (extra render, can desync)\nconst [full, setFull] = useState(\"\");\nuseEffect(() => { setFull(first + \" \" + last); }, [first, last]);\n\n// GOOD: just compute it while rendering\nconst full = first + \" \" + last;" },
        { type: "callout", variant: "warn", text: "**Dependency array must list every reactive value the effect reads** (props, state, and functions/objects created in render). Omitting one causes a **stale closure** (the effect sees old values); the eslint rule catches this. Do not \"silence\" it by deleting deps — fix the real dependency (move it inside, memoize it, or use a ref)." },
        { type: "callout", variant: "gotcha", text: "Effects run **twice on mount in `<StrictMode>`** (dev). That is a feature: it verifies your cleanup is correct. If a double-mount breaks something (double fetch, double subscription), your cleanup is incomplete — fix it, don't disable StrictMode." }
      ]
    },
    {
      id: "refs",
      title: "Refs: useRef, ref as a prop & useImperativeHandle",
      level: "core",
      body: [
        { type: "p", text: "A **ref** is a mutable box (`{ current: ... }`) that **persists across renders but does not trigger one** when you change it. Two uses: (1) reach a **DOM node** (focus, measure, play/scroll), and (2) hold a **mutable value** that render does not depend on (a timer id, a previous value, a WebSocket)." },
        { type: "code", lang: "tsx", code: "import { useRef, useEffect } from \"react\";\n\nfunction SearchBox() {\n  const inputRef = useRef<HTMLInputElement>(null);\n  useEffect(() => { inputRef.current?.focus(); }, []); // focus on mount\n  return <input ref={inputRef} placeholder=\"Search...\" />;\n}\n\n// mutable value that must NOT cause re-renders\nconst timer = useRef<number | null>(null);\ntimer.current = window.setTimeout(fn, 1000);" },
        { type: "heading", text: "React 19: ref is just a prop" },
        { type: "p", text: "In React 19 a function component can accept **`ref` as a normal prop** — **`forwardRef` is no longer needed** (it still works but is deprecated). This makes forwarding a DOM node to a child trivial." },
        { type: "code", lang: "tsx", code: "// React 19 — no forwardRef\nfunction FancyInput({ ref, ...props }: React.ComponentProps<\"input\">) {\n  return <input ref={ref} className=\"fancy\" {...props} />;\n}\n\n// parent can now grab the inner <input>\nconst ref = useRef<HTMLInputElement>(null);\n<FancyInput ref={ref} />;" },
        { type: "code", lang: "tsx", code: "// useImperativeHandle: expose a CUSTOM imperative API instead of the raw node\nimport { useImperativeHandle, useRef } from \"react\";\n\nfunction Editor({ ref }: { ref: React.Ref<{ clear: () => void }> }) {\n  const areaRef = useRef<HTMLTextAreaElement>(null);\n  useImperativeHandle(ref, () => ({\n    clear: () => { if (areaRef.current) areaRef.current.value = \"\"; },\n  }), []);\n  return <textarea ref={areaRef} />;\n}" },
        { type: "callout", variant: "warn", text: "**Do not read/write `ref.current` during render** — render must be pure, and the ref may not be attached yet (it's `null` until after commit). Touch refs in **event handlers** and **effects** only. Also: changing a ref never re-renders, so don't store display data in a ref expecting the UI to update." },
        { type: "callout", variant: "note", text: "React 19 also supports **ref cleanup functions**: a callback ref can `return () => {...}` to run on detach — a cleaner replacement for the old \"ref called with `null`\" pattern." }
      ]
    },
    {
      id: "context",
      title: "Context: passing data without prop-drilling",
      level: "core",
      body: [
        { type: "p", text: "**Context** lets a parent make a value available to *every* descendant without threading it through props at each level — ideal for **theme, current user, locale, a design-system config**. Create a context, wrap a subtree in a provider, and read it with **`useContext`**." },
        { type: "code", lang: "tsx", code: "import { createContext, useContext, useState } from \"react\";\n\ntype Theme = \"light\" | \"dark\";\nconst ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);\n\nexport function ThemeProvider({ children }: { children: React.ReactNode }) {\n  const [theme, setTheme] = useState<Theme>(\"dark\");\n  const toggle = () => setTheme((t) => (t === \"dark\" ? \"light\" : \"dark\"));\n  return (\n    <ThemeContext value={{ theme, toggle }}>   {/* React 19: <Context> is the provider */}\n      {children}\n    </ThemeContext>\n  );\n}\n\n// a tiny hook that also guards against \"used outside provider\"\nexport function useTheme() {\n  const ctx = useContext(ThemeContext);\n  if (!ctx) throw new Error(\"useTheme must be used inside <ThemeProvider>\");\n  return ctx;\n}" },
        { type: "callout", variant: "note", text: "**React 19** lets you render the context object directly as a provider: `<ThemeContext value={...}>` instead of `<ThemeContext.Provider value={...}>` (both work)." },
        { type: "callout", variant: "gotcha", text: "**Every consumer re-renders whenever the context *value* changes identity.** Passing a fresh object literal (`value={{ theme, toggle }}`) each render re-renders all consumers every time the provider renders. For hot paths, `useMemo` the value, or **split** frequently-changing state into its own context. Context is a *transport*, not a performance optimizer — for high-frequency global state, reach for Zustand/Redux (see Global state)." }
      ]
    },
    {
      id: "hooks",
      title: "Rules of Hooks & custom hooks",
      level: "core",
      body: [
        { type: "p", text: "Hooks are functions starting with **`use`** that let a component tap into React features (state, effects, context). React tracks them **by call order**, which drives two non-negotiable rules." },
        { type: "list", ordered: true, items: [
          "**Only call hooks at the top level** — never inside conditions, loops, or nested functions. The call order must be identical on every render. (Want conditional logic? Put the condition *inside* the hook.)",
          "**Only call hooks from React functions** — components or other custom hooks, never plain JS functions or event handlers."
        ] },
        { type: "code", lang: "tsx", code: "// BAD — hook inside a condition: order changes between renders -> crash\nif (loggedIn) { const [x, setX] = useState(0); }\n\n// GOOD — hook always runs; branch on the value\nconst [x, setX] = useState(0);\nif (loggedIn) { /* use x */ }" },
        { type: "heading", text: "Custom hooks: reuse stateful logic" },
        { type: "p", text: "A **custom hook** is just a function that calls other hooks — it extracts reusable *logic* (not UI). Each call gets its **own isolated state**; hooks share behavior, never state instances." },
        { type: "code", lang: "tsx", code: "// useLocalStorage — reusable stateful logic\nimport { useState, useEffect } from \"react\";\n\nfunction useLocalStorage<T>(key: string, initial: T) {\n  const [value, setValue] = useState<T>(() => {\n    const raw = localStorage.getItem(key);\n    return raw ? (JSON.parse(raw) as T) : initial;\n  });\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n  return [value, setValue] as const;\n}\n\n// use it like any hook\nconst [name, setName] = useLocalStorage(\"name\", \"\");" },
        { type: "callout", variant: "tip", text: "Good custom hooks wrap a **concept** (`useDebounce`, `useOnlineStatus`, `useFetchUser`), returning values and callbacks. Name them `useX`, keep them focused, and the eslint hook rules will lint them like built-ins." }
      ]
    },
    {
      id: "memo",
      title: "Memoization & the React Compiler",
      level: "core",
      body: [
        { type: "p", text: "React re-renders a component when its state changes **and re-renders all its children by default**. Usually that is cheap. When profiling shows a genuinely expensive render or a child that re-renders needlessly, three tools skip work by **caching between renders**." },
        { type: "table", headers: ["Tool", "Caches", "Use when"], rows: [
          ["`useMemo(fn, deps)`", "a **computed value**", "a calculation in render is expensive"],
          ["`useCallback(fn, deps)`", "a **function identity**", "passing a callback to a memoized child / effect dep"],
          ["`React.memo(Comp)`", "a **component's render**", "a pure child re-renders with identical props"]
        ] },
        { type: "code", lang: "tsx", code: "import { memo, useMemo, useCallback } from \"react\";\n\nconst Row = memo(function Row({ item, onPick }: RowProps) { /* ... */ });\n\nfunction List({ items, query }: { items: Item[]; query: string }) {\n  const filtered = useMemo(\n    () => items.filter((i) => i.name.includes(query)),   // recompute only when deps change\n    [items, query]\n  );\n  const onPick = useCallback((id: string) => console.log(id), []); // stable identity\n  return filtered.map((i) => <Row key={i.id} item={i} onPick={onPick} />);\n}" },
        { type: "callout", variant: "warn", text: "**Do not memoize everything.** `useMemo`/`useCallback` cost memory + a deps comparison; wrapping trivial work is slower and noisier. Memoize only after measuring, and remember `React.memo` is defeated the moment you pass it a new object/array/function prop each render — which is exactly why you pair it with `useMemo`/`useCallback`." },
        { type: "heading", text: "React Compiler 1.0 — automatic memoization" },
        { type: "p", text: "The **React Compiler** (stable **1.0**, Oct 2025) is a build-time plugin that **auto-memoizes** components and hooks — it inserts the equivalent of `useMemo`/`useCallback`/`memo` for you, and can even memoize *conditionally* (which hand-written hooks cannot). With it enabled, most manual memoization becomes unnecessary." },
        { type: "code", lang: "js", code: "// vite.config.js — enable the compiler via the Babel plugin\nimport react from \"@vitejs/plugin-react\";\nexport default {\n  plugins: [react({ babel: { plugins: [\"babel-plugin-react-compiler\"] } })],\n};" },
        { type: "callout", variant: "tip", text: "The compiler only optimizes code that **follows the Rules of React** (pure render, no prop mutation). Its lint rules ship in **`eslint-plugin-react-hooks`** (recommended preset) — clean lint is the prerequisite. New apps on Vite/Next/Expo can turn it on from day one and mostly stop writing `useMemo`/`useCallback` by hand." }
      ]
    },
    {
      id: "forms-actions",
      title: "Forms & React 19 Actions",
      level: "core",
      body: [
        { type: "p", text: "A **controlled input** binds `value` to state and updates it in `onChange` — React is the single source of truth. This is the standard pattern for validation and dependent fields." },
        { type: "code", lang: "tsx", code: "function NameForm() {\n  const [name, setName] = useState(\"\");\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); save(name); }}>\n      <input value={name} onChange={(e) => setName(e.target.value)} />\n      <button disabled={!name.trim()}>Save</button>\n    </form>\n  );\n}" },
        { type: "heading", text: "React 19 Actions: <form action>, useActionState, useFormStatus" },
        { type: "p", text: "**Actions** are React 19's built-in story for form submission and async mutations. Pass an **async function to `<form action>`** and React handles pending state, errors, and (in RSC) progressive enhancement. **`useActionState`** wraps an action to track its return value + pending flag; **`useFormStatus`** reads the parent form's pending state from a child (great for a submit button)." },
        { type: "code", lang: "tsx", code: "import { useActionState } from \"react\";\nimport { useFormStatus } from \"react-dom\";\n\nasync function saveName(prev: string | null, formData: FormData) {\n  const name = formData.get(\"name\") as string;\n  const err = await updateName(name);      // returns error string or null\n  return err;                              // becomes the new `error` state\n}\n\nfunction SubmitButton() {\n  const { pending } = useFormStatus();      // reads the enclosing <form>\n  return <button disabled={pending}>{pending ? \"Saving...\" : \"Save\"}</button>;\n}\n\nfunction NameForm() {\n  const [error, action, isPending] = useActionState(saveName, null);\n  return (\n    <form action={action}>       {/* React calls the action, tracks pending/errors */}\n      <input name=\"name\" />\n      <SubmitButton />\n      {error && <p className=\"err\">{error}</p>}\n    </form>\n  );\n}" },
        { type: "heading", text: "useOptimistic: instant UI before the server responds" },
        { type: "code", lang: "tsx", code: "import { useOptimistic } from \"react\";\n\nfunction Thread({ messages, sendMessage }: Props) {\n  const [optimistic, addOptimistic] = useOptimistic(\n    messages,\n    (state, newMsg: string) => [...state, { text: newMsg, sending: true }]\n  );\n  async function action(formData: FormData) {\n    const text = formData.get(\"msg\") as string;\n    addOptimistic(text);            // show it immediately\n    await sendMessage(text);        // then reconcile with the real result\n  }\n  return (\n    <form action={action}>\n      {optimistic.map((m, i) => <p key={i}>{m.text}{m.sending && \" (sending)\"}</p>)}\n      <input name=\"msg\" />\n    </form>\n  );\n}" },
        { type: "callout", variant: "note", text: "An async function passed to `<form action>` runs inside a **transition**, so `isPending` and `useOptimistic` updates are non-blocking. For complex forms + schema validation, **React Hook Form** + **Zod** is still the ecosystem workhorse; Actions shine for simpler forms and RSC/server-action apps." },
        { type: "callout", variant: "gotcha", text: "**Controlled `value` needs an `onChange`** or the input is read-only and React warns. For a genuinely uncontrolled input use `defaultValue` + a ref (or read `FormData` in an action) instead of `value`." }
      ]
    },
    {
      id: "data",
      title: "Data fetching: use(), Suspense & TanStack Query",
      level: "core",
      body: [
        { type: "p", text: "React itself does not ship a data-fetching client — it gives you **primitives** (`Suspense`, `use()`) and leaves caching to libraries or the framework. Three modern approaches, from lowest to highest level:" },
        { type: "heading", text: "1. use() + Suspense (read a promise)" },
        { type: "p", text: "React 19's **`use()`** reads the value of a **promise** (or a context) *during render*. If the promise is pending it **suspends**, and the nearest **`<Suspense>`** shows a fallback until it resolves. Unlike hooks, `use()` may be called **conditionally**." },
        { type: "code", lang: "tsx", code: "import { use, Suspense } from \"react\";\n\nfunction UserName({ userPromise }: { userPromise: Promise<User> }) {\n  const user = use(userPromise);        // suspends until resolved\n  return <h1>{user.name}</h1>;\n}\n\nfunction Page() {\n  const userPromise = fetchUser(1);     // create/caches the promise OUTSIDE render ideally\n  return (\n    <Suspense fallback={<Spinner />}>\n      <UserName userPromise={userPromise} />\n    </Suspense>\n  );\n}" },
        { type: "callout", variant: "warn", text: "`use()` does **not** cache or dedupe — do not create a `fetch()` promise inside a component body without a cache, or every render starts a new request. In practice you get the promise from a **framework loader**, an RSC, or a cache. For client SPAs, use TanStack Query below." },
        { type: "heading", text: "2. TanStack Query — the client-state standard" },
        { type: "p", text: "For a client-rendered SPA, **TanStack Query** (`@tanstack/react-query`) is the de-facto answer for **server state**: caching, background refetch, dedupe, pagination, mutations + cache invalidation, and loading/error state — all handled for you." },
        { type: "code", lang: "tsx", code: "import { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";\n\nfunction Todos() {\n  const qc = useQueryClient();\n  const { data, isLoading, error } = useQuery({\n    queryKey: [\"todos\"],\n    queryFn: () => fetch(\"/api/todos\").then((r) => r.json()),\n  });\n  const add = useMutation({\n    mutationFn: (title: string) => api.addTodo(title),\n    onSuccess: () => qc.invalidateQueries({ queryKey: [\"todos\"] }), // refetch after write\n  });\n  if (isLoading) return <Spinner />;\n  if (error) return <p>Failed</p>;\n  return <ul>{data.map((t: Todo) => <li key={t.id}>{t.title}</li>)}</ul>;\n}" },
        { type: "table", headers: ["Approach", "Best for", "Caching"], rows: [
          ["`use()` + Suspense", "framework loaders / RSC data", "you/the framework provide it"],
          ["TanStack Query", "client SPA server-state", "**built in** (keys, staleTime, refetch)"],
          ["`useEffect` + `fetch`", "avoid for real apps", "**none** — manual, race-prone"]
        ] },
        { type: "callout", variant: "gotcha", text: "The old `useEffect(() => { fetch()... }, [])` pattern is fragile: **race conditions** (fast-changing params resolve out of order), no cache, no retry, waterfalls, and it runs twice in StrictMode. Prefer TanStack Query or a framework loader; if you must use an effect, guard with an `ignore` flag in cleanup." }
      ]
    },
    {
      id: "error-boundaries",
      title: "Error boundaries",
      level: "core",
      body: [
        { type: "p", text: "A render error (a thrown exception during rendering, in an effect, or from a suspended resource that rejects) will unmount the whole tree unless caught by an **error boundary** — a component that catches errors *below* it and shows a fallback UI. Boundaries are the one place you still need a **class component** (or a wrapper library), because the lifecycle methods have no hook equivalent yet." },
        { type: "code", lang: "tsx", code: "import { Component, type ReactNode } from \"react\";\n\nclass ErrorBoundary extends Component<\n  { fallback: ReactNode; children: ReactNode },\n  { hasError: boolean }\n> {\n  state = { hasError: false };\n  static getDerivedStateFromError() { return { hasError: true }; }\n  componentDidCatch(error: Error, info: unknown) { logError(error, info); }\n  render() {\n    return this.state.hasError ? this.props.fallback : this.props.children;\n  }\n}\n\n// usage: wrap a risky subtree; pairs naturally with <Suspense>\n<ErrorBoundary fallback={<p>Something went wrong.</p>}>\n  <Suspense fallback={<Spinner />}>\n    <Profile />\n  </Suspense>\n</ErrorBoundary>" },
        { type: "callout", variant: "note", text: "Most teams use **`react-error-boundary`** (function-friendly, gives a `resetErrorBoundary()` and `onReset`) instead of hand-writing the class. Frameworks provide their own: Next.js has `error.tsx`, React Router has route `errorElement`/`ErrorBoundary`." },
        { type: "callout", variant: "warn", text: "Error boundaries **do NOT catch** errors in event handlers, async code (`setTimeout`, promises you don't `use()`), or SSR. Handle those with a normal `try/catch`. React 19 also adds `onCaughtError`/`onUncaughtError` root options for centralized reporting." }
      ]
    },
    {
      id: "concurrent",
      title: "Concurrent UI: useTransition & useDeferredValue",
      level: "deep",
      body: [
        { type: "p", text: "React can **interrupt** rendering to keep the UI responsive. Two hooks let you mark updates as **non-urgent** so a heavy re-render doesn't block typing or clicks." },
        { type: "code", lang: "tsx", code: "import { useTransition, useState } from \"react\";\n\nfunction TabBar() {\n  const [isPending, startTransition] = useTransition();\n  const [tab, setTab] = useState(\"home\");\n  function select(next: string) {\n    startTransition(() => setTab(next)); // this update is interruptible / low-priority\n  }\n  return (\n    <>\n      <button onClick={() => select(\"reports\")}>Reports</button>\n      {isPending && <Spinner />}\n      <TabPanel tab={tab} />   {/* slow to render, but won't freeze the buttons */}\n    </>\n  );\n}" },
        { type: "code", lang: "tsx", code: "import { useDeferredValue, useMemo } from \"react\";\n\nfunction Search({ query }: { query: string }) {\n  const deferred = useDeferredValue(query);   // lags behind during rapid typing\n  const results = useMemo(() => filterHugeList(deferred), [deferred]);\n  return <ResultList items={results} />;      // input stays snappy\n}" },
        { type: "list", items: [
          "**`useTransition`** — you own the state update; wrap it in `startTransition` and get an `isPending` flag. Also powers React 19 Actions (async functions run in a transition).",
          "**`useDeferredValue`** — you receive a value (e.g. a prop) and want a *deferred copy* that updates at low priority. Use it when you can't wrap the setter.",
          "**Net effect:** urgent updates (typing, clicks) render immediately; the expensive downstream render happens in the background and can be interrupted by the next keystroke."
        ] },
        { type: "callout", variant: "tip", text: "Reach for these only when a render is genuinely heavy (big lists, charts, syntax highlighting) and the UI stutters. For most apps, plain state is fine. They reduce *jank*, not total work." }
      ]
    },
    {
      id: "portals",
      title: "Portals: rendering outside the parent DOM",
      level: "deep",
      body: [
        { type: "p", text: "**`createPortal`** renders children into a **different DOM node** (typically `document.body`) while keeping them in the React tree — so context, state, and event bubbling still work as if they were nested. This is how you build **modals, tooltips, dropdowns, and toasts** that must escape a parent's `overflow: hidden` or `z-index` stacking context." },
        { type: "code", lang: "tsx", code: "import { createPortal } from \"react-dom\";\n\nfunction Modal({ open, onClose, children }: ModalProps) {\n  if (!open) return null;\n  return createPortal(\n    <div className=\"overlay\" onClick={onClose}>\n      <div className=\"dialog\" onClick={(e) => e.stopPropagation()}>\n        {children}\n      </div>\n    </div>,\n    document.body                    // <- render target, outside the parent\n  );\n}" },
        { type: "callout", variant: "note", text: "Even though the DOM node lives under `<body>`, React **events still bubble through the React tree** (the component's logical parent), not the DOM parent — so an `onClick` on an ancestor React component still fires. That surprises people debugging portal click handling." },
        { type: "callout", variant: "tip", text: "For real modals, prefer the native `<dialog>` element or a headless library (**Radix UI**, **React Aria**) — they solve focus-trapping, `Esc`-to-close, scroll-lock, and ARIA for you. Portals are the low-level primitive underneath." }
      ]
    },
    {
      id: "routing",
      title: "Routing with React Router v7",
      level: "core",
      body: [
        { type: "p", text: "React has no built-in router. **React Router v7** (the merge of Remix into React Router) is the community standard. It offers three modes: **declarative** (classic `<Routes>`/`<Route>`), **data** (`createBrowserRouter` + loaders/actions), and **framework** (file routes, SSR, codegen — a Next.js-like full stack). For a Vite SPA, the **data router** is the sweet spot." },
        { type: "code", lang: "tsx", code: "import { createBrowserRouter, RouterProvider } from \"react-router\";\n\nconst router = createBrowserRouter([\n  {\n    path: \"/\",\n    element: <RootLayout />,          // renders <Outlet/> for children\n    errorElement: <ErrorPage />,       // route-level error boundary\n    children: [\n      { index: true, element: <Home /> },\n      {\n        path: \"users/:id\",\n        element: <User />,\n        loader: async ({ params }) => fetch(`/api/users/${params.id}`), // data BEFORE render\n      },\n    ],\n  },\n]);\n\nexport default function App() {\n  return <RouterProvider router={router} />;\n}" },
        { type: "code", lang: "tsx", code: "import { Link, NavLink, Outlet, useParams, useLoaderData, useNavigate } from \"react-router\";\n\nfunction RootLayout() {\n  return (\n    <>\n      <nav>\n        <NavLink to=\"/\">Home</NavLink>            {/* auto .active class */}\n        <Link to=\"/users/1\">User 1</Link>\n      </nav>\n      <Outlet />                                  {/* child route renders here */}\n    </>\n  );\n}\n\nfunction User() {\n  const { id } = useParams();                     // \"/users/:id\"\n  const data = useLoaderData();                   // resolved loader result\n  const navigate = useNavigate();\n  return <button onClick={() => navigate(\"/\")}>{id}</button>;\n}" },
        { type: "list", items: [
          "**Import from `react-router`** in v7 (the separate `react-router-dom` package is merged; `<RouterProvider>`, `<BrowserRouter>`, hooks all come from `react-router`).",
          "**`loader`** fetches data before a route renders (no loading-flash waterfall); **`action`** handles form submissions; **`useNavigation()`** exposes pending state.",
          "**Nested routes** share layouts via `<Outlet/>`; **`:param`** captures segments; **`*`** is a splat; **`index: true`** is the default child.",
          "**Framework mode** adds file-based routes, SSR, and typed params — use `create-react-router` when you need that (else Next.js)."
        ] },
        { type: "callout", variant: "gotcha", text: "**Client-side routing needs a server rewrite.** A static host must fall back all unknown paths to `index.html`, or a hard refresh on `/users/1` 404s. Configure a SPA fallback (Vite preview does it; Netlify/Vercel need a rewrite rule). React Router **v8** is now out; v7 code upgrades cleanly." }
      ]
    },
    {
      id: "global-state",
      title: "Global state: Context vs Zustand vs Redux Toolkit",
      level: "core",
      body: [
        { type: "p", text: "Not everything needs a global store. **Local state → lift up → Context → a store library**, in that order. Reach for a dedicated store only when many distant components read/write the same **client** state and Context re-render churn or boilerplate hurts. (Remember: **server** state belongs in TanStack Query, not a global store.)" },
        { type: "table", headers: ["Option", "Good for", "Cost"], rows: [
          ["`useState` + lift up", "state shared by a few nearby components", "prop-drilling if deep"],
          ["**Context**", "low-frequency global (theme, user, locale)", "all consumers re-render on value change"],
          ["**Zustand**", "most app-wide client state; minimal API", "external lib (~1kb)"],
          ["**Redux Toolkit**", "large apps, strict patterns, devtools, middleware", "more boilerplate/ceremony"]
        ] },
        { type: "code", lang: "tsx", code: "// Zustand — a store is a hook; components subscribe to SLICES (no provider needed)\nimport { create } from \"zustand\";\n\nconst useCart = create<{ items: Item[]; add: (i: Item) => void }>((set) => ({\n  items: [],\n  add: (i) => set((s) => ({ items: [...s.items, i] })),\n}));\n\nfunction CartCount() {\n  const count = useCart((s) => s.items.length);   // re-renders only when the count changes\n  return <span>{count}</span>;\n}" },
        { type: "heading", text: "Redux Toolkit — the full loop" },
        { type: "p", text: "**Redux Toolkit (RTK)** is the official, batteries-included Redux — you almost never write plain Redux by hand anymore. The four moving parts are: a **slice** (state + reducers + auto-generated action creators), the **store** (combines slices, wires devtools + thunk middleware for you), a single **`<Provider>`** at the root, and **typed hooks** components use to read/dispatch. Here's the whole loop end-to-end." },
        { type: "code", lang: "ts", code: "// features/counter/counterSlice.ts — state + reducers + actions in one place\nimport { createSlice, type PayloadAction } from \"@reduxjs/toolkit\";\n\ninterface CounterState { value: number; status: \"idle\" | \"loading\"; }\nconst initialState: CounterState = { value: 0, status: \"idle\" };\n\nconst counterSlice = createSlice({\n  name: \"counter\",\n  initialState,\n  reducers: {\n    inc: (s) => { s.value += 1; },                    // Immer: \"mutate\" -> produces new state\n    add: (s, a: PayloadAction<number>) => { s.value += a.payload; },  // typed payload\n    reset: () => initialState,\n  },\n});\n\nexport const { inc, add, reset } = counterSlice.actions;  // action creators, generated\nexport default counterSlice.reducer;" },
        { type: "code", lang: "ts", code: "// app/store.ts — combine slices, then export TYPED hooks (do this once)\nimport { configureStore } from \"@reduxjs/toolkit\";\nimport { useDispatch, useSelector } from \"react-redux\";\nimport counterReducer from \"../features/counter/counterSlice\";\n\nexport const store = configureStore({\n  reducer: { counter: counterReducer },     // add more slices as your app grows\n});                                          // devtools + thunk middleware are on by default\n\n// Infer the types straight from the store — never hand-write them\nexport type RootState = ReturnType<typeof store.getState>;\nexport type AppDispatch = typeof store.dispatch;\n\n// Pre-typed hooks — import THESE everywhere instead of the raw react-redux ones\nexport const useAppDispatch = useDispatch.withTypes<AppDispatch>();\nexport const useAppSelector = useSelector.withTypes<RootState>();" },
        { type: "code", lang: "tsx", code: "// main.tsx — exactly one <Provider> wraps the app\nimport { Provider } from \"react-redux\";\nimport { store } from \"./app/store\";\n\ncreateRoot(document.getElementById(\"root\")!).render(\n  <Provider store={store}><App /></Provider>\n);" },
        { type: "code", lang: "tsx", code: "// Counter.tsx — read with a selector, write by dispatching an action\nimport { useAppDispatch, useAppSelector } from \"./app/store\";\nimport { inc, add } from \"./features/counter/counterSlice\";\n\nfunction Counter() {\n  const value = useAppSelector((s) => s.counter.value);  // re-renders only when THIS value changes\n  const dispatch = useAppDispatch();\n  return (\n    <div>\n      <output>{value}</output>\n      <button onClick={() => dispatch(inc())}>+1</button>\n      <button onClick={() => dispatch(add(5))}>+5</button>\n    </div>\n  );\n}" },
        { type: "p", text: "**Server data → RTK Query, not thunks.** RTK ships **RTK Query**, a data-fetching + caching layer: you declare endpoints and it generates hooks with caching, dedup, and invalidation — the Redux answer to TanStack Query." },
        { type: "code", lang: "ts", code: "// api.ts — declare endpoints once, get fully-typed hooks for free\nimport { createApi, fetchBaseQuery } from \"@reduxjs/toolkit/query/react\";\n\nexport const api = createApi({\n  baseQuery: fetchBaseQuery({ baseUrl: \"/api\" }),\n  tagTypes: [\"Todo\"],\n  endpoints: (b) => ({\n    getTodos: b.query<Todo[], void>({ query: () => \"todos\", providesTags: [\"Todo\"] }),\n    addTodo: b.mutation<Todo, Partial<Todo>>({\n      query: (body) => ({ url: \"todos\", method: \"POST\", body }),\n      invalidatesTags: [\"Todo\"],          // refetches getTodos automatically\n    }),\n  }),\n});\nexport const { useGetTodosQuery, useAddTodoMutation } = api;\n\n// wire into the store:\n//   reducer:    { [api.reducerPath]: api.reducer, counter: counterReducer }\n//   middleware: (getDefault) => getDefault().concat(api.middleware)\n// component:    const { data, isLoading, error } = useGetTodosQuery();" },
        { type: "callout", variant: "tip", text: "**Zustand** is the modern default for most apps: tiny, no provider, selector-based subscriptions that dodge Context's re-render problem. Choose **Redux Toolkit** when you want enforced structure, time-travel devtools, RTK Query, or a large-team convention. Other options: **Jotai** (atoms), **Valtio** (proxy)." },
        { type: "callout", variant: "gotcha", text: "**Select narrow, not wide.** `useAppSelector((s) => s.counter)` returns a fresh-ish object and re-renders more than needed — select the exact primitive you use (`s.counter.value`). For values derived across slices, memoize with **`createSelector`** (reselect, bundled with RTK). And never `dispatch` during render — only in effects or event handlers." }
      ]
    },
    {
      id: "signals",
      title: "Signals: fine-grained reactivity (vs useState)",
      level: "core",
      body: [
        { type: "p", text: "A **signal** is a reactive value in a box. You read it with `.value` and write it with `.value = x`. The magic is *tracking*: whenever a component reads `signal.value` during render, it **subscribes to that exact signal** — so a write updates only the components (and, with the DOM binding, the individual nodes) that actually read it. This is **fine-grained reactivity**, and it's a fundamentally different update model from `useState`." },
        { type: "callout", variant: "note", text: "**Signals are not built into React** (as of React 19.2). Every other major framework — Solid, Vue (`ref`), Svelte 5 (runes), Angular, Qwik, Preact — ships them; React's official answer to the same re-render problem is the **React Compiler** (automatic memoization), not signals. In React you add signals with the **`@preact/signals-react`** library." },
        { type: "code", lang: "bash", code: "npm i @preact/signals-react\n# plus the build transform so reading `.value` auto-subscribes the component:\n#   @preact/signals-react-transform  (Babel)  — add to your Vite/Babel config" },
        { type: "code", lang: "tsx", code: "import { signal, computed, effect } from \"@preact/signals-react\";\n\nconst count = signal(0);                            // a reactive box, lives OUTSIDE any component\nconst doubled = computed(() => count.value * 2);    // derived, auto-tracked, lazy\n\neffect(() => console.log(\"count is\", count.value)); // re-runs whenever count changes\n\nfunction Counter() {\n  // No useState. With the transform, reading count.value subscribes this component.\n  // The component body does NOT re-run on unrelated state changes.\n  return (\n    <button onClick={() => count.value++}>\n      {count.value} (x2 = {doubled.value})\n    </button>\n  );\n}" },
        { type: "list", items: [
          "**`signal(v)`** — create. Read `s.value`, write `s.value = x`. Declared in a module, it's **global state you just `import`** — no provider, no context.",
          "**`computed(fn)`** — a read-only derived signal; auto-tracks the signals `fn` reads and recomputes lazily. Replaces `useMemo` with no dependency array.",
          "**`effect(fn)`** — run a side effect when its tracked signals change; returns a `dispose()`. Replaces the `useEffect(..., [deps])` bookkeeping for signal-driven work.",
          "**`useSignal(v)` / `useComputed(fn)` / `useSignalEffect(fn)`** — component-local versions (from `@preact/signals-react`) created once and tied to the component lifecycle.",
          "**`useSignals()`** (from `@preact/signals-react/runtime`) — call it at the top of a component to enable tracking **without** the Babel transform."
        ] },
        { type: "heading", text: "Why it's better than useState (and the catch)" },
        { type: "table", headers: ["Aspect", "useState", "signal"], rows: [
          ["Update granularity", "re-runs the **whole component** (+ children unless memoized)", "updates **only** what read `.value` — often a single node"],
          ["Derived values", "`useMemo(fn, [deps])` — manual dependency list", "`computed(fn)` — dependencies tracked automatically"],
          ["Reacting to change", "`useEffect(fn, [deps])`", "`effect(fn)` — no dependency array"],
          ["Sharing globally", "lift state up / Context / a store lib", "`export const s = signal(...)` then `import` anywhere"],
          ["Reference bookkeeping", "`useCallback`/`useMemo`/`memo` to stop re-renders", "mostly unnecessary — updates are already surgical"],
          ["Built into React", "yes", "no — via `@preact/signals-react`"]
        ] },
        { type: "callout", variant: "tip", text: "**Why signals win for hot/shared state:** a change skips the whole render→diff cycle and touches only subscribed nodes (benchmarks show large drops in re-render count on update-heavy UIs), derived state is `computed()` with zero dependency arrays, and global state is a plain `import` with no provider. The bookkeeping tax of `useState` — updater functions, dep arrays, `useCallback`/`memo` to keep references stable — largely disappears." },
        { type: "callout", variant: "gotcha", text: "**The catch:** signals aren't idiomatic React and need a build transform (or a `useSignals()` call) to track reads — forget it and the component won't re-render. Signals hold values by reference, so mutating an object in place (`user.value.name = 'x'`) won't notify; reassign `.value`. And the **React Compiler** now auto-memoizes plain `useState` code, narrowing the performance gap — so for most apps, reach for signals when you have genuinely high-frequency or widely-shared state, not as a blanket replacement." },
        { type: "callout", variant: "note", text: "Preact ships signals natively as its headline feature (`@preact/signals`); `@preact/signals-react` is the same engine (`@preact/signals-core`) with a React adapter. If fine-grained reactivity is central to your app, that's a large part of why teams pick **Preact** over React — see the Preact deck." }
      ]
    },
    {
      id: "styling",
      title: "Styling: CSS Modules, Tailwind & CSS-in-JS",
      level: "deep",
      body: [
        { type: "p", text: "React is style-agnostic — `className` takes any string. Pick one of the mainstream approaches:" },
        { type: "table", headers: ["Approach", "How", "Notes"], rows: [
          ["**CSS Modules**", "`import s from \"./x.module.css\"` → `className={s.card}`", "scoped by build, zero runtime, Vite-native"],
          ["**Tailwind CSS**", "utility classes in `className`", "most popular; v4 is config-light, fast"],
          ["**CSS-in-JS**", "styled-components / Emotion", "dynamic styles; **runtime cost + RSC friction**"],
          ["**Plain / global CSS**", "one stylesheet, BEM naming", "simplest, no scoping guarantees"]
        ] },
        { type: "code", lang: "tsx", code: "// CSS Modules — locally-scoped class names\nimport styles from \"./Button.module.css\";\nexport function Button() {\n  return <button className={styles.primary}>Save</button>;\n}\n\n// Tailwind — utilities inline; use clsx/cn to compose conditionals\nimport clsx from \"clsx\";\nfunction Badge({ active }: { active: boolean }) {\n  return <span className={clsx(\"px-2 py-1 rounded\", active && \"bg-teal-500\")}>New</span>;\n}" },
        { type: "callout", variant: "note", text: "**Tailwind** is the community default for new apps (pairs well with component libraries like **shadcn/ui**). **CSS Modules** are the safe zero-runtime choice. Be cautious with runtime **CSS-in-JS** (styled-components/Emotion) in **RSC / Next App Router** — it needs client components and special SSR setup; zero-runtime options (Tailwind, CSS Modules, **vanilla-extract**, **PandaCSS**) fit RSC better." }
      ]
    },
    {
      id: "rsc",
      title: "Server Components & Actions (RSC overview)",
      level: "deep",
      body: [
        { type: "p", text: "**React Server Components (RSC)** are a paradigm where components can run **only on the server**, render to a special stream, and ship **zero JS** to the browser. React 19 stabilizes the RSC APIs, but RSC is used through a **framework** (Next.js App Router, React Router framework mode) — you don't wire it up by hand. Know the model:" },
        { type: "list", items: [
          "**Server Components** (the default in an RSC app) run on the server, can be **`async`**, and can hit the database/filesystem directly. They cannot use state, effects, or event handlers.",
          "**Client Components** opt in with the **`\"use client\"`** directive at the top of the file. They (and their imports) ship to the browser and can use hooks, events, and browser APIs.",
          "**Server Functions / Actions** are marked **`\"use server\"`**: server-side functions callable from the client (e.g. as a `<form action>`), for mutations without hand-writing an API route.",
          "**The boundary is a serialization seam:** props passed from a Server to a Client Component must be **serializable** — no functions (except Server Actions), class instances, or `Map`/`Set`."
        ] },
        { type: "code", lang: "tsx", code: "// Server Component (default in an RSC framework) — async, direct data access\nasync function Users() {\n  const users = await db.user.findMany();   // runs on the server, ships no JS\n  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;\n}\n\n// Client Component — needs interactivity\n\"use client\";\nimport { useState } from \"react\";\nfunction Counter() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}" },
        { type: "callout", variant: "note", text: "**Plain Vite SPAs do not use RSC** — everything there is a client component and you never write `\"use client\"`. RSC only matters inside a framework. For the full App-Router treatment (caching, boundaries, server actions), see the **Next.js** deck." },
        { type: "callout", variant: "tip", text: "Rule of thumb: keep `\"use client\"` at the **leaves** (a small interactive island). A Server Component can render Client Components and pass server-rendered UI down through `children`, so a mostly-static page ships minimal JS." }
      ]
    },
    {
      id: "testing",
      title: "Testing: React Testing Library + Vitest",
      level: "core",
      body: [
        { type: "p", text: "The standard stack is **Vitest** (Vite-native test runner) + **React Testing Library (RTL)** + **`@testing-library/user-event`**. RTL's philosophy: **test behavior the way a user experiences it** — query by visible text/role/label, not by implementation details like class names or state." },
        { type: "code", lang: "tsx", code: "import { render, screen } from \"@testing-library/react\";\nimport userEvent from \"@testing-library/user-event\";\nimport { expect, test } from \"vitest\";\nimport Counter from \"./Counter\";\n\ntest(\"increments on click\", async () => {\n  const user = userEvent.setup();\n  render(<Counter />);\n  const btn = screen.getByRole(\"button\", { name: /count/i }); // query by role + name\n  await user.click(btn);\n  expect(screen.getByText(\"Count: 1\")).toBeInTheDocument();\n});" },
        { type: "list", items: [
          "**Query priority:** `getByRole` > `getByLabelText` > `getByText` > (last resort) `getByTestId`. This mirrors accessibility and resists refactors.",
          "**`findBy*`** returns a promise (auto-retries) — use it for async UI (after a fetch/suspense). **`queryBy*`** returns `null` for asserting *absence*.",
          "**Config:** `jsdom` environment, `@testing-library/jest-dom` matchers (`toBeInTheDocument`), and `user-event` (not `fireEvent`) for realistic interactions.",
          "**E2E:** **Playwright** or **Cypress** for full browser flows; **MSW** (Mock Service Worker) to mock network at the request level."
        ] },
        { type: "callout", variant: "tip", text: "Wrap components that need context/router/query in a custom `render` that includes the providers. Don't assert on internal state or effect calls — assert on what the user sees. This keeps tests green through refactors." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "These bite nearly everyone. Each has the same root cause — a subtle break in React's render/state/effect model — and a concrete fix." },

        { type: "heading", text: "1. Stale closures" },
        { type: "p", text: "A function created during a render **captures the props/state from that render**. If an effect, timer, or event handler runs later with an **empty/wrong dependency array**, it sees the *old* values forever." },
        { type: "code", lang: "tsx", code: "// BUG: interval always logs 0 — the closure captured count from the first render\nuseEffect(() => {\n  const id = setInterval(() => console.log(count), 1000);\n  return () => clearInterval(id);\n}, []);            // count not in deps -> stale\n\n// FIX A: add count to deps (interval resets each change)\n// FIX B: use the updater form so you never read the stale value\nsetCount((c) => c + 1);\n// FIX C: keep the latest value in a ref for read-only access\nconst countRef = useRef(count); countRef.current = count;" },

        { type: "heading", text: "2. Effect dependency bugs" },
        { type: "callout", variant: "gotcha", text: "Silencing the exhaustive-deps lint (`// eslint-disable-next-line`) instead of fixing the dependency is the source of most effect bugs — infinite loops (an object/array/function dep is recreated every render) and stale data (a needed dep omitted). Fixes: **memoize object/function deps** (`useMemo`/`useCallback`), move the value **inside** the effect, or lift it to a ref if it shouldn't trigger a re-run." },
        { type: "code", lang: "tsx", code: "// BUG: options is a new object each render -> effect runs every render (infinite-ish)\nconst options = { url, headers };\nuseEffect(() => { connect(options); }, [options]);\n\n// FIX: memoize the object, or depend on the primitives\nconst options = useMemo(() => ({ url, headers }), [url, headers]);" },

        { type: "heading", text: "3. Key misuse in lists" },
        { type: "callout", variant: "gotcha", text: "Using the **array index as `key`** on a reorderable/filterable list makes React reuse the wrong node — inputs keep the previous row's text, checkboxes tick the wrong item, transitions jump. Use a **stable domain id**. Conversely, deliberately *changing* a key remounts a component (a valid reset trick — don't do it by accident inside a `.map`)." },

        { type: "heading", text: "4. Unnecessary re-renders" },
        { type: "p", text: "A parent re-render re-renders all children. Usually harmless — but for heavy trees it stutters. Causes and fixes:" },
        { type: "list", items: [
          "**New object/array/function props every render** defeat `React.memo` → memoize them (`useMemo`/`useCallback`) or let the **React Compiler** handle it.",
          "**Context value churn** re-renders every consumer → memoize the value or split contexts.",
          "**Lifting state too high** re-renders a big subtree for a local change → **push state down** to the component that owns it, or isolate the interactive part.",
          "**Measure first** with the React DevTools Profiler — don't optimize renders you can't feel."
        ] },

        { type: "heading", text: "5. The derived-state antipattern" },
        { type: "code", lang: "tsx", code: "// BAD: copying props into state -> goes stale when the prop changes\nfunction Profile({ user }: { user: User }) {\n  const [name, setName] = useState(user.name);   // frozen at first render!\n  // ... user.name updates later, but `name` doesn't\n}\n\n// GOOD: derive during render, or (to RESET on change) use a key\nfunction Profile({ user }: { user: User }) {\n  const displayName = user.name.toUpperCase();     // just compute it\n  // or, to reset editable state when the user changes: <Profile key={user.id} .../>\n}" },
        { type: "callout", variant: "warn", text: "**Never mirror props/other-state into `useState`.** If it can be computed, compute it in render. If it truly must be resettable local state, remount with a `key` rather than syncing in an effect. This one antipattern causes a huge share of \"my UI shows old data\" bugs." },

        { type: "heading", text: "6. Direct mutation" },
        { type: "callout", variant: "gotcha", text: "`state.push(x)` / `obj.prop = y` then `setState(state)` **won't re-render** — React compares by reference and the reference didn't change. Always produce a **new** object/array: `setItems([...items, x])`, `setUser({ ...user, name })`, or use Immer (built into Redux Toolkit)." }
      ]
    }
  ],

  packages: [
    { name: "react + react-dom", why: "the library + the DOM renderer (createRoot, createPortal)" },
    { name: "vite + @vitejs/plugin-react", why: "dev server / bundler for client SPAs (replaces CRA)" },
    { name: "typescript", why: "typed props/state; the community default" },
    { name: "react-router", why: "routing (v7 merges react-router-dom + Remix data/framework modes)" },
    { name: "@tanstack/react-query", why: "server-state: caching, refetch, mutations, dedupe" },
    { name: "zustand", why: "minimal global client state, no provider, selector subscriptions" },
    { name: "@reduxjs/toolkit + react-redux", why: "structured global state, devtools, RTK Query" },
    { name: "@preact/signals-react", why: "signals in React: fine-grained reactivity, updates only what reads `.value`" },
    { name: "react-hook-form + zod", why: "performant forms + schema validation" },
    { name: "babel-plugin-react-compiler", why: "React Compiler 1.0 — automatic memoization at build time" },
    { name: "eslint-plugin-react-hooks", why: "enforces Rules of Hooks + ships React Compiler lint rules" },
    { name: "tailwindcss", why: "utility-first styling (most popular option)" },
    { name: "clsx", why: "conditionally compose className strings" },
    { name: "vitest + @testing-library/react", why: "unit/component testing (Vite-native)" },
    { name: "@testing-library/user-event", why: "realistic user interactions in tests" },
    { name: "react-error-boundary", why: "function-friendly error boundary with reset" },
    { name: "framer-motion (motion)", why: "animation/gestures for React" }
  ],

  gotchas: [
    "State updates are **async + batched**: reading state right after `setState` gives the old value. Use the **updater form** `setX(x => ...)` when the next value depends on the previous.",
    "**Never mutate state or props.** `arr.push()` / `obj.k = v` then setting the same reference won't re-render — make a new array/object (`[...arr, x]`, `{ ...obj }`).",
    "**Don't copy props into state** (`useState(props.x)`) — it freezes at first render. Derive in render, or remount with a `key` to reset.",
    "**Don't store derived data in state + sync with an effect.** Compute it during render; duplicated state drifts.",
    "**Array index as `key`** breaks reorderable/filterable lists (wrong node reuse). Use a stable id.",
    "`useEffect` deps must include **every reactive value read**. Omitting one = stale closure; an object/function dep recreated each render = infinite loop. Memoize or move it inside.",
    "**You probably don't need that effect** — for computing values, handling events, or fetching. See the 'you might not need an effect' guidance.",
    "**Effects run twice on mount in StrictMode (dev)** to test cleanup. Don't disable StrictMode — make your cleanup correct (double fetch/subscription = missing cleanup).",
    "`cond && <X/>` renders `0` when `cond` is the number `0`. Use `cond ? <X/> : null` or `!!count &&`.",
    "**Context re-renders all consumers** when the value's identity changes. Memoize the value or split contexts; use Zustand for high-frequency global state.",
    "**Don't read/write `ref.current` during render** — it's null before commit and render must be pure. Use refs in effects/handlers.",
    "**React 19: no more `forwardRef`** — accept `ref` as a normal prop. `forwardRef` still works but is deprecated.",
    "`use()` doesn't cache — creating a fetch promise inline re-requests every render. Get it from a loader/cache/TanStack Query.",
    "Error boundaries **don't catch** event-handler or async errors — use `try/catch` there.",
    "Client-side routing needs a **server SPA fallback** to `index.html`, or deep links 404 on refresh.",
    "**Don't over-memoize.** `useMemo`/`useCallback` everywhere adds cost + noise; measure first, or enable the React Compiler and let it handle memoization."
  ],

  flashcards: [
    { q: "Why use the updater form `setCount(c => c + 1)`?", a: "State is a snapshot within a render; two `setCount(count + 1)` calls both see the same `count`. The updater form receives the latest queued value, so sequential updates compose correctly." },
    { q: "When do you actually need `useEffect`?", a: "Only to **synchronize with an external system** (subscriptions, timers, non-React widgets, browser APIs). Not for computing values (do it in render), handling events (do it in the handler), or (usually) fetching (use a loader/TanStack Query)." },
    { q: "What must go in a `useEffect` dependency array?", a: "Every reactive value the effect reads — props, state, and any functions/objects created during render. Missing deps = stale closure; unstable object/function deps = re-runs every render (memoize them)." },
    { q: "Why not use the array index as a list `key`?", a: "On reorder/insert/filter, React matches elements by key and reuses the wrong DOM node + state (stale inputs, wrong checkboxes). Use a stable unique id; index is only ok for static lists." },
    { q: "What changed about refs in React 19?", a: "`ref` is now a **normal prop** — function components accept it directly, so `forwardRef` is no longer needed (deprecated). Callback refs can also return a cleanup function." },
    { q: "What is `useActionState` for?", a: "Wraps an async **action** to track its return value + a pending flag: `const [state, action, isPending] = useActionState(fn, initial)`. Wire `action` to `<form action={action}>`; `fn(prev, formData)` returns the next state." },
    { q: "What does `useOptimistic` do?", a: "Shows an immediate, optimistic UI state while an async action is in flight, then reconciles to the real result when it resolves — e.g. render a message as 'sending' before the server confirms." },
    { q: "What is `use()` and how is it different from a hook?", a: "React 19 API that reads a **promise** (suspends until resolved) or context during render. Unlike hooks it **can be called conditionally**. It does not cache — provide the promise from a loader/cache." },
    { q: "Context vs a store library — when to use which?", a: "Context for low-frequency global data (theme/user/locale). For high-frequency or large client state, use **Zustand** (selectors avoid re-render churn) or **Redux Toolkit** (structure + devtools). Server state → TanStack Query." },
    { q: "What is a signal, and how is it better than useState?", a: "A reactive value read via `.value`; reading it **subscribes the exact component/node** that read it, so a write updates only those — no whole-component re-render, no dependency arrays (`computed`/`effect` auto-track). Not built into React — added via `@preact/signals-react` (needs a Babel transform or `useSignals()`). Trade-off: non-idiomatic + the React Compiler narrows the perf gap, so use it for high-frequency or widely-shared state." },
    { q: "Why does my component show stale data after updating a prop?", a: "You copied the prop into `useState` — it froze at first render. Derive the value during render instead, or remount with a `key` to reset local state. Don't sync props→state via effects." },
    { q: "What are the two Rules of Hooks?", a: "1) Call hooks only at the top level (never in conditions/loops/nested fns) so call order is stable. 2) Call hooks only from components or other hooks. Enforced by `eslint-plugin-react-hooks`." },
    { q: "What does the React Compiler do?", a: "Build-time auto-memoization (stable 1.0, Oct 2025): inserts the equivalent of `useMemo`/`useCallback`/`memo` (even conditionally), so you mostly stop writing them by hand. Requires Rules-of-React-clean code." },
    { q: "How do you keep a heavy re-render from blocking typing?", a: "Mark the update non-urgent: `startTransition(() => setState(...))` (with `useTransition`'s `isPending`), or defer a value with `useDeferredValue`. Urgent input stays responsive; the heavy render runs interruptibly." },
    { q: "What does `createPortal` solve?", a: "Renders children into a different DOM node (e.g. `document.body`) to escape `overflow`/`z-index`, while keeping them in the React tree — so context and event bubbling still work. Used for modals/tooltips/toasts." },
    { q: "Server vs Client Components in RSC?", a: "Server Components (default) run only on the server, can be async + hit the DB, ship zero JS, and can't use state/effects. Client Components opt in with `\"use client\"` and can use hooks/events. Props across the boundary must be serializable." },
    { q: "How should you query elements in React Testing Library?", a: "By what the user perceives: `getByRole` (with `name`) first, then label/text, `getByTestId` last. Use `findBy*` for async UI and `user-event` for realistic interactions — never assert on internal state." }
  ],

  cheatsheet: [
    { label: "New SPA", code: "npm create vite@latest my-app -- --template react-ts" },
    { label: "Root render", code: "createRoot(el).render(<StrictMode><App/></StrictMode>)" },
    { label: "State", code: "const [n, setN] = useState(0); setN(c => c + 1);" },
    { label: "Reducer", code: "const [s, dispatch] = useReducer(reducer, init);" },
    { label: "Effect", code: "useEffect(() => { ...; return cleanup; }, [deps]);" },
    { label: "Ref (DOM)", code: "const r = useRef(null); <input ref={r} />" },
    { label: "Context read", code: "const ctx = useContext(MyContext);" },
    { label: "Memo value", code: "const v = useMemo(() => calc(a), [a]);" },
    { label: "List", code: "items.map(i => <li key={i.id}>{i.name}</li>)" },
    { label: "Form action", code: "const [s, action] = useActionState(fn, null); <form action={action}>" },
    { label: "Read promise", code: "const data = use(promise);  // inside <Suspense>" },
    { label: "TanStack Query", code: "useQuery({ queryKey: ['k'], queryFn })" },
    { label: "Transition", code: "const [pending, start] = useTransition();" },
    { label: "Portal", code: "createPortal(<Modal/>, document.body)" },
    { label: "Route", code: "createBrowserRouter([{ path, element, loader }])" },
    { label: "Zustand", code: "const useStore = create(set => ({ ... }))" }
  ]
});
