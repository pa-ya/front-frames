(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "yew",
  name: "Yew",
  language: "Rust",
  group: "WebAssembly",
  navLabel: "Yew (Rust)",
  color: "#4e9a06",
  readMinutes: 26,
  tagline: "Build **reactive web UIs in Rust**, compiled to WebAssembly — function components, hooks, and the `html!` macro, à la React.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "Yew is a Rust framework for building **client-side web apps** that compile to **WebAssembly**. If you know React, you already know Yew's shape: **components** return markup, **hooks** hold state, and re-rendering flows top-down. The whole app runs in the browser as a `.wasm` bundle driven by a tiny JS loader." },
        { type: "list", items: [
          "**Reach for it when:** you want a Rust SPA — sharing types/logic with a Rust backend, leaning on the type system and `cargo` tooling, or reusing crates in the browser.",
          "**Component model, not signals:** Yew keeps a **virtual DOM**. When a component's state or props change it **re-renders the whole component**, Yew diffs the new vtree against the old, and patches only the changed DOM. This is the key contrast with **Leptos**, whose fine-grained signals update individual nodes with *no* vdom and *no* component re-run.",
          "**Mental model:** *state changes → component function re-runs → html! produces a new vtree → Yew diffs & patches*. You write what the UI *should look like* for the current state, not imperative DOM updates."
        ] },
        { type: "table", headers: ["Concept", "React analog", "Yew"], rows: [
          ["Component", "function component", "`#[function_component]` fn -> `Html`"],
          ["Local state", "`useState`", "`use_state` / `use_reducer`"],
          ["Side effect", "`useEffect`", "`use_effect` / `use_effect_with`"],
          ["Markup", "JSX", "the `html!` macro"],
          ["Props", "props object", "`#[derive(Properties, PartialEq)]` struct"],
          ["Event handler", "`onClick={fn}`", "`onclick={Callback}`"],
          ["Re-render unit", "the component re-runs", "the component re-runs (+ vdom diff)"]
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Yew 0.21** (current stable). 0.21 renamed `use_effect_with_deps` to **`use_effect_with`**, moved to function components as the default, and split workers into the `yew-agent` 0.3 / `gloo-worker` crates. Everything imports from one prelude: `use yew::prelude::*;`." },
        { type: "callout", variant: "tip", text: "Yew is **CSR-first** (a single-page app). It also supports SSR + hydration (see the SSR section), but there is no built-in server/router/data layer like Next.js — you assemble those from crates (`yew-router`, `gloo-net`, your own Axum/Actix backend)." }
      ]
    },
    {
      id: "setup",
      title: "Setup with Trunk",
      level: "core",
      body: [
        { type: "p", text: "The standard toolchain is **Trunk** — a zero-config WASM web bundler. It compiles your crate to `wasm32-unknown-unknown`, runs `wasm-bindgen`, hashes assets, and serves with live reload. You need the wasm target and Trunk installed once." },
        { type: "code", lang: "bash", code: "# one-time: the wasm target + the bundler\nrustup target add wasm32-unknown-unknown\ncargo install trunk --locked\n\n# dev server with auto-rebuild + live reload\ntrunk serve --open        # -> http://127.0.0.1:8080\n\n# optimized production build -> ./dist\ntrunk build --release" },
        { type: "code", lang: "toml", code: "# Cargo.toml\n[package]\nname = \"my-app\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[dependencies]\nyew = { version = \"0.21\", features = [\"csr\"] }   # csr = client-side rendering\nwasm-bindgen = \"0.2\"" },
        { type: "code", lang: "html", code: "<!-- index.html  (Trunk's entry point, at the crate root) -->\n<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"utf-8\"/>\n    <title>My Yew App</title>\n    <link data-trunk rel=\"css\" href=\"main.css\"/>   <!-- Trunk processes & hashes it -->\n  </head>\n  <body></body>   <!-- Yew mounts into <body> by default -->\n</html>" },
        { type: "code", lang: "rust", code: "// src/main.rs — the entry point mounts the root component\nuse yew::prelude::*;\n\n#[function_component]\nfn App() -> Html {\n    html! { <h1>{ \"Hello, Yew!\" }</h1> }\n}\n\nfn main() {\n    yew::Renderer::<App>::new().render();       // mount into <body>\n    // yew::Renderer::<App>::with_root(element).render();  // mount into a specific node\n}" },
        { type: "callout", variant: "gotcha", text: "Trunk looks for **`index.html` at the project root**, not `src/`. Assets you want bundled must be tagged `data-trunk` (e.g. `<link data-trunk rel=\"css\" ...>`, `<link data-trunk rel=\"rust\" ...>`); a plain `<script>` or `<link>` is left untouched." },
        { type: "callout", variant: "tip", text: "Add `console_error_panic_hook` and call it in `main` so a Rust panic prints a real stack trace to the browser console instead of the useless `unreachable executed`. Pair with `wasm-logger` or `tracing-wasm` for `log!`/`tracing` output." }
      ]
    },
    {
      id: "components",
      title: "Function components",
      level: "core",
      body: [
        { type: "p", text: "The default (and recommended) component is a plain function annotated with **`#[function_component]`** that returns `Html`. The macro turns it into a real component type you can use as an element: `<App />`. Hooks (below) give it state and effects." },
        { type: "code", lang: "rust", code: "use yew::prelude::*;\n\n#[function_component]\nfn Counter() -> Html {\n    let count = use_state(|| 0);          // UseStateHandle<i32>\n\n    let onclick = {\n        let count = count.clone();        // clone the handle into the closure\n        Callback::from(move |_| count.set(*count + 1))\n    };\n\n    html! {\n        <div>\n            <button {onclick}>{ \"+1\" }</button>\n            <p>{ \"Count: \" }{ *count }</p>   // deref the handle to read\n        </div>\n    }\n}" },
        { type: "list", items: [
          "**Naming:** `#[function_component]` infers the component name from the fn (`Counter`). To rename, pass it: `#[function_component(MyName)]`.",
          "**Return type is `Html`** — every component renders exactly one `html!` tree (wrap siblings in a fragment `<>...</>`).",
          "**PascalCase = component, lowercase = HTML element** inside `html!`: `<Counter/>` is your component, `<button>` is a DOM node.",
          "**Rules of hooks apply** (same as React): call hooks unconditionally, at the top level of the component — never inside `if`, loops, or nested closures."
        ] },
        { type: "callout", variant: "tip", text: "`use_state` returns a `UseStateHandle<T>` that is **`Clone` and `Copy`-cheap to move into closures**. Read it by dereferencing (`*count`); update with `.set(v)`. It does **not** mutate in place — calling `.set` schedules a re-render." }
      ]
    },
    {
      id: "html-macro",
      title: "The html! macro",
      level: "core",
      body: [
        { type: "p", text: "`html!` is Yew's JSX: an HTML-like macro that expands to a typed virtual-DOM tree. Tags are real HTML; **`{ }` interpolates Rust expressions**; attributes take Rust values. Unlike JSX, **text and interpolations both go inside braces** — bare text must be a quoted string in braces: `{ \"hello\" }`." },
        { type: "code", lang: "rust", code: "let name = \"Ada\";\nlet count = 3;\nhtml! {\n    <div class=\"card\">\n        <h1>{ \"Hello, \" }{ name }</h1>          // literals + variables in braces\n        <p>{ format!(\"Count: {count}\") }</p>     // any expression\n        <img src=\"/logo.png\" alt=\"logo\"/>        // self-closing needs the slash\n    </div>\n}" },
        { type: "heading", text: "Attributes, classes & fragments" },
        { type: "code", lang: "rust", code: "let active = true;\nhtml! {\n    // dynamic attribute value\n    <a href={format!(\"/user/{}\", count)}>{ \"profile\" }</a>\n\n    // classes! builds a class string from many sources (strings, Options, conditionals)\n    <div class={classes!(\"btn\", active.then_some(\"btn--active\"))}></div>\n\n    // shorthand: a variable named exactly like the attribute\n    <button {onclick}>{ \"go\" }</button>          // == onclick={onclick}\n\n    // a fragment groups siblings without a wrapper element\n    <>\n        <li>{ \"one\" }</li>\n        <li>{ \"two\" }</li>\n    </>\n}" },
        { type: "heading", text: "Conditionals & lists" },
        { type: "code", lang: "rust", code: "let items = vec![\"a\", \"b\", \"c\"];\nhtml! {\n    <>\n        // conditional: if/else must yield Html on both arms\n        { if count > 5 { html! { <p>{ \"high\" }</p> } } else { html! { <p>{ \"low\" }</p> } } }\n\n        // Option -> render or nothing (None renders empty)\n        { active.then(|| html! { <span>{ \"on\" }</span> }) }\n\n        // a list: map to Html; give each row a stable `key`\n        <ul>\n            { for items.iter().map(|it| html! { <li key={*it}>{ *it }</li> }) }\n        </ul>\n    </>\n}" },
        { type: "callout", variant: "gotcha", text: "Every element in a dynamically-rendered list should have a **`key`** (a stable, unique value). Without keys, Yew falls back to index-based diffing, which mis-associates DOM nodes when the list reorders/inserts — causing lost input focus and wrong component state." },
        { type: "callout", variant: "note", text: "`html! {}` (empty) renders nothing — handy for the else-branch of a conditional. `for` inside `html!` is the iterator adapter (`{ for iter }`), not a Rust `for` loop; it collects an iterator of `Html` into children." }
      ]
    },
    {
      id: "hooks",
      title: "Hooks: state & effects",
      level: "core",
      body: [
        { type: "p", text: "Hooks give function components memory and lifecycle. They mirror React's, with Rust flavor. The core set: `use_state`, `use_reducer`, `use_effect` / `use_effect_with`, `use_ref` / `use_node_ref`, `use_context`, `use_memo`, `use_callback`." },
        { type: "table", headers: ["Hook", "Purpose"], rows: [
          ["`use_state(|| init)`", "local state; `.set(v)` re-renders. `use_state_eq` skips if unchanged"],
          ["`use_reducer(init)`", "state via a `Reducible` reducer + `.dispatch(action)`"],
          ["`use_effect(f)`", "run a side effect after **every** render; return a cleanup closure"],
          ["`use_effect_with(deps, f)`", "run only when `deps` change (like React's dep array)"],
          ["`use_memo(deps, f)`", "cache an expensive computation, recompute when `deps` change"],
          ["`use_callback(deps, f)`", "memoize a `Callback` so children don't re-render needlessly"],
          ["`use_ref` / `use_mut_ref`", "a persistent value that does NOT trigger re-render"],
          ["`use_node_ref()`", "a handle to a real DOM node (focus, measure, canvas)"],
          ["`use_context::<T>()`", "read the nearest `ContextProvider<T>`"]
        ] },
        { type: "heading", text: "use_reducer for structured state" },
        { type: "code", lang: "rust", code: "use std::rc::Rc;\nuse yew::prelude::*;\n\n#[derive(Default, PartialEq)]\nstruct State { count: i32 }\n\nenum Action { Inc, Dec }\n\nimpl Reducible for State {\n    type Action = Action;\n    fn reduce(self: Rc<Self>, action: Action) -> Rc<Self> {\n        let count = match action {\n            Action::Inc => self.count + 1,\n            Action::Dec => self.count - 1,\n        };\n        State { count }.into()          // return a new Rc<State>\n    }\n}\n\n#[function_component]\nfn Counter() -> Html {\n    let state = use_reducer(State::default);\n    let inc = { let s = state.clone(); Callback::from(move |_| s.dispatch(Action::Inc)) };\n    html! { <button onclick={inc}>{ state.count }</button> }\n}" },
        { type: "heading", text: "Effects with dependencies" },
        { type: "code", lang: "rust", code: "let id = use_state(|| 1);\n\n// runs on mount AND whenever *id changes; the returned closure is cleanup\n{\n    let id = id.clone();\n    use_effect_with(*id, move |id| {\n        let handle = start_polling(*id);\n        move || handle.cancel()      // cleanup runs before the next effect / on unmount\n    });\n}\n\n// run once on mount: pass () as the dependency\nuse_effect_with((), move |_| {\n    web_sys::console::log_1(&\"mounted\".into());\n    || ()                            // no-op cleanup\n});" },
        { type: "callout", variant: "gotcha", text: "The dependency passed to `use_effect_with` must be **`PartialEq + Clone + 'static`** (Yew captures and compares it). To depend on several values, pass a **tuple**: `use_effect_with((a.clone(), b), move |(a, b)| { ... })`. Plain `use_effect(f)` runs after *every* render — rarely what you want." }
      ]
    },
    {
      id: "props",
      title: "Props & children",
      level: "core",
      body: [
        { type: "p", text: "Props are a struct deriving **`Properties`** and **`PartialEq`** (Yew needs `PartialEq` to skip re-rendering when props are unchanged). The component takes `&Props`. Attribute-style call sites map to struct fields; the macro checks required fields at compile time." },
        { type: "code", lang: "rust", code: "use yew::prelude::*;\n\n#[derive(Properties, PartialEq)]\nstruct GreetProps {\n    pub name: String,                 // required\n    #[prop_or_default]                // defaults to 0\n    pub count: i32,\n    #[prop_or(\"Hi\".to_string())]      // custom default\n    pub greeting: String,\n    #[prop_or_default]\n    pub on_click: Callback<MouseEvent>,\n}\n\n#[function_component]\nfn Greet(props: &GreetProps) -> Html {\n    html! {\n        <button onclick={props.on_click.clone()}>\n            { format!(\"{}, {} ({})\", props.greeting, props.name, props.count) }\n        </button>\n    }\n}\n\n// call site: required prop must be present; others optional\n// <Greet name=\"Ada\" count={3} />" },
        { type: "heading", text: "Children" },
        { type: "code", lang: "rust", code: "#[derive(Properties, PartialEq)]\nstruct CardProps {\n    #[prop_or_default]\n    pub children: Html,               // 0.21: children as Html (was Children)\n}\n\n#[function_component]\nfn Card(props: &CardProps) -> Html {\n    html! { <div class=\"card\">{ props.children.clone() }</div> }\n}\n// <Card><h1>{ \"Title\" }</h1><p>{ \"body\" }</p></Card>" },
        { type: "callout", variant: "tip", text: "In 0.21 the idiomatic children type is **`Html`** (render with `{ props.children.clone() }`). The older `Children` / `ChildrenWithProps<T>` types still exist for when you need to iterate or require a specific child component type." },
        { type: "callout", variant: "gotcha", text: "Forgetting `PartialEq` on a `Properties` struct is a compile error. And if a prop holds a type that isn't cheaply comparable, Yew can't memo it — every parent render re-renders the child. Prefer `Rc<T>` / `Callback` for heavy or closure props so `PartialEq` stays cheap and stable." }
      ]
    },
    {
      id: "events",
      title: "Callbacks & event handling",
      level: "core",
      body: [
        { type: "p", text: "Event handlers are **`Callback<E>`** values wired to `on*` attributes. Build one with `Callback::from(closure)`. The event `E` is a `web-sys` type — `MouseEvent` for `onclick`, `InputEvent` for `oninput`, `SubmitEvent` for `onsubmit`, `KeyboardEvent` for `onkeydown`, etc." },
        { type: "code", lang: "rust", code: "let count = use_state(|| 0);\n\nlet onclick = {\n    let count = count.clone();\n    Callback::from(move |_e: MouseEvent| count.set(*count + 1))\n};\n\nhtml! { <button {onclick}>{ *count }</button> }" },
        { type: "heading", text: "Reading a value out of an input event" },
        { type: "p", text: "The event target is a generic DOM node; cast it to the concrete element to read `.value()`. Yew's **`TargetCast`** trait gives ergonomic casts (`target_dyn_into` / `target_unchecked_into`); the target types come from `web-sys`." },
        { type: "code", lang: "rust", code: "use web_sys::HtmlInputElement;\nuse yew::TargetCast;\n\nlet text = use_state(String::new);\n\nlet oninput = {\n    let text = text.clone();\n    Callback::from(move |e: InputEvent| {\n        // unchecked cast: fine when you KNOW the element type\n        let input: HtmlInputElement = e.target_unchecked_into();\n        text.set(input.value());\n    })\n};\n\nhtml! {\n    <input type=\"text\" value={(*text).clone()} {oninput}/>\n    // controlled-ish: `value` reflects state; oninput pushes new state\n}" },
        { type: "callout", variant: "tip", text: "Prefer `target_dyn_into::<HtmlInputElement>()` (returns `Option`) when the target might not be that element; `target_unchecked_into()` panics on a wrong guess but is terser. To stop default behavior (e.g. form submit reload), call `e.prevent_default()` inside the callback." },
        { type: "callout", variant: "gotcha", text: "Every closure that captures state must `.clone()` the handle first — `use_state`/`use_reducer` handles are `Clone`, but a plain owned `String`/`Vec` moved into two closures needs an explicit clone each. This is the Rust ownership tax you pay in almost every Yew component." }
      ]
    },
    {
      id: "context",
      title: "Context for shared state",
      level: "core",
      body: [
        { type: "p", text: "To share state without prop-drilling, wrap a subtree in **`<ContextProvider<T>>`** and read it below with **`use_context::<T>()`**. The context type `T` must be `Clone + PartialEq`. Provide a struct that bundles the value plus a `Callback` (or a reducer's dispatch) so descendants can update it." },
        { type: "code", lang: "rust", code: "use yew::prelude::*;\n\n#[derive(Clone, PartialEq)]\nstruct Theme { dark: bool, toggle: Callback<()> }\n\n#[function_component]\nfn App() -> Html {\n    let dark = use_state(|| true);\n    let toggle = {\n        let dark = dark.clone();\n        Callback::from(move |_| dark.set(!*dark))\n    };\n    let ctx = Theme { dark: *dark, toggle };\n\n    html! {\n        <ContextProvider<Theme> context={ctx}>\n            <Toolbar/>\n        </ContextProvider<Theme>>\n    }\n}\n\n#[function_component]\nfn Toolbar() -> Html {\n    let theme = use_context::<Theme>().expect(\"no Theme context found\");\n    let onclick = { let t = theme.clone(); Callback::from(move |_| t.toggle.emit(())) };\n    html! { <button {onclick}>{ if theme.dark { \"dark\" } else { \"light\" } }</button> }\n}" },
        { type: "callout", variant: "gotcha", text: "The generic on the closing tag is required: `</ContextProvider<Theme>>`. And `use_context` returns `Option<T>` — it's `None` when no matching provider is above, so `.expect(...)` with a clear message beats a silent panic later." },
        { type: "callout", variant: "note", text: "For app-wide state consider the **`yewdux`** crate (a Redux-like global store with `use_store`) or **`bounce`** (atoms/selectors, Recoil-style). Context is fine for a handful of shared values; reach for a store when many disconnected components read/write the same state." }
      ]
    },
    {
      id: "router",
      title: "Routing with yew-router",
      level: "core",
      body: [
        { type: "p", text: "**`yew-router`** provides client-side routing. Define routes as an enum deriving **`Routable`**, map each variant to a view in a **`switch`** function, and render a **`<Switch<Route>>`** inside a **`<BrowserRouter>`**. Navigate with **`<Link<Route>>`** or the **`use_navigator`** hook." },
        { type: "code", lang: "rust", code: "use yew::prelude::*;\nuse yew_router::prelude::*;\n\n#[derive(Clone, Routable, PartialEq)]\nenum Route {\n    #[at(\"/\")]\n    Home,\n    #[at(\"/post/:id\")]\n    Post { id: u32 },        // typed path param\n    #[not_found]\n    #[at(\"/404\")]\n    NotFound,\n}\n\nfn switch(route: Route) -> Html {\n    match route {\n        Route::Home => html! { <h1>{ \"Home\" }</h1> },\n        Route::Post { id } => html! { <Post {id}/> },\n        Route::NotFound => html! { <h1>{ \"404\" }</h1> },\n    }\n}\n\n#[function_component]\nfn App() -> Html {\n    html! {\n        <BrowserRouter>\n            <nav>\n                <Link<Route> to={Route::Home}>{ \"Home\" }</Link<Route>>\n                <Link<Route> to={Route::Post { id: 1 }}>{ \"Post 1\" }</Link<Route>>\n            </nav>\n            <Switch<Route> render={switch}/>\n        </BrowserRouter>\n    }\n}" },
        { type: "code", lang: "rust", code: "// programmatic navigation + reading params inside a routed component\nuse yew_router::prelude::*;\n\n#[function_component]\nfn Post(props: &PostProps) -> Html {\n    let navigator = use_navigator().unwrap();\n    let go_home = Callback::from(move |_| navigator.push(&Route::Home));\n\n    // the :id param is passed as a prop by the switch match above,\n    // or read the current route directly:\n    let route = use_route::<Route>();\n\n    html! {\n        <>\n            <p>{ format!(\"post {}\", props.id) }</p>\n            <button onclick={go_home}>{ \"home\" }</button>\n        </>\n    }\n}" },
        { type: "list", items: [
          "**`#[at(\"/post/:id\")]`** binds path segments to struct fields (typed — `id: u32` parses automatically).",
          "**Query params:** `use_location().query::<MyQuery>()` deserializes `?a=1&b=2` into a `serde` struct.",
          "**`use_navigator()`** gives `.push`, `.replace`, `.back`, `.forward`; `use_route::<Route>()` reads the current match.",
          "**Hash routing:** swap `<BrowserRouter>` for `<HashRouter>` when you can't configure server fallbacks (GitHub Pages, static hosts)."
        ] },
        { type: "callout", variant: "gotcha", text: "`BrowserRouter` uses the History API, so a hard refresh on `/post/1` hits your server for that path. On a **static host** either configure a catch-all rewrite to `index.html`, or use **`HashRouter`** (URLs become `/#/post/1`) which never round-trips to the server." }
      ]
    },
    {
      id: "data-fetching",
      title: "Fetching data",
      level: "core",
      body: [
        { type: "p", text: "There's no built-in data layer — you fire an async request from an effect and stash the result in state. In WASM there is **no Tokio runtime**, so spawn futures with **`wasm_bindgen_futures::spawn_local`**. The go-to HTTP client is **`gloo-net`** (a thin `fetch` wrapper); `reqwest` also works with its wasm backend." },
        { type: "code", lang: "rust", code: "use yew::prelude::*;\nuse gloo_net::http::Request;\nuse serde::Deserialize;\n\n#[derive(Clone, PartialEq, Deserialize)]\nstruct User { id: u32, name: String }\n\n#[function_component]\nfn Users() -> Html {\n    let users = use_state(Vec::<User>::new);\n\n    {\n        let users = users.clone();\n        use_effect_with((), move |_| {          // run once on mount\n            let users = users.clone();\n            wasm_bindgen_futures::spawn_local(async move {\n                let fetched: Vec<User> = Request::get(\"/api/users\")\n                    .send().await.unwrap()\n                    .json().await.unwrap();\n                users.set(fetched);             // triggers a re-render\n            });\n            || ()\n        });\n    }\n\n    html! {\n        <ul>\n            { for users.iter().map(|u| html! { <li key={u.id}>{ &u.name }</li> }) }\n        </ul>\n    }\n}" },
        { type: "callout", variant: "tip", text: "Model loading/error states explicitly — e.g. `use_state(|| None::<Result<Vec<User>, String>>)` and match on `None` (loading) / `Some(Ok)` / `Some(Err)`. The **`yew-hooks`** crate offers `use_async` to package the pending/data/error trio for you." },
        { type: "callout", variant: "gotcha", text: "`spawn_local` needs a **`'static`** future, so move (and clone) everything it uses inside `async move`. Don't reach for `tokio::spawn` or `reqwest::blocking` — neither exists in the browser; blocking or a non-wasm runtime will fail to compile or panic." }
      ]
    },
    {
      id: "interop",
      title: "JS & DOM interop",
      level: "core",
      body: [
        { type: "p", text: "Yew sits on the standard Rust/WASM interop stack. **`wasm-bindgen`** bridges Rust <-> JS, **`web-sys`** exposes typed browser/DOM APIs, **`js-sys`** exposes JS built-ins, and **`gloo`** wraps common browser APIs in ergonomic Rust (timers, storage, events, dialogs)." },
        { type: "code", lang: "rust", code: "// grab a real DOM node with use_node_ref (e.g. to focus an input)\nuse web_sys::HtmlInputElement;\nuse yew::prelude::*;\n\n#[function_component]\nfn AutoFocus() -> Html {\n    let input_ref = use_node_ref();\n    {\n        let input_ref = input_ref.clone();\n        use_effect_with((), move |_| {\n            if let Some(el) = input_ref.cast::<HtmlInputElement>() {\n                el.focus().ok();\n            }\n            || ()\n        });\n    }\n    html! { <input ref={input_ref} type=\"text\"/> }\n}" },
        { type: "code", lang: "rust", code: "// call an existing JS function via wasm-bindgen\nuse wasm_bindgen::prelude::*;\n\n#[wasm_bindgen(module = \"/js/helpers.js\")]\nextern \"C\" {\n    fn greet(name: &str) -> String;\n}\n\n// gloo for browser APIs (storage, timers)\nuse gloo_storage::{LocalStorage, Storage};\nLocalStorage::set(\"key\", \"value\").ok();\nlet v: String = LocalStorage::get(\"key\").unwrap_or_default();\n\nuse gloo_timers::callback::Timeout;\nlet t = Timeout::new(1_000, || web_sys::console::log_1(&\"tick\".into()));\nt.forget();   // or keep the handle to cancel" },
        { type: "callout", variant: "note", text: "`web-sys` is **feature-gated**: each DOM type/method lives behind a Cargo feature, so you enable exactly what you use (`web-sys = { version = \"0.3\", features = [\"HtmlInputElement\", \"Window\"] }`). Missing a feature shows up as an unresolved import — add it to the feature list." }
      ]
    },
    {
      id: "styling",
      title: "Styling",
      level: "core",
      body: [
        { type: "p", text: "Two common paths: **plain CSS** processed by Trunk (`<link data-trunk rel=\"css\" ...>`, or Tailwind via its CLI), or **CSS-in-Rust** with the **`stylist`** crate — scoped, component-local styles written inline, with a `style!`/`css!` macro and a Yew integration (`styled_component`)." },
        { type: "code", lang: "rust", code: "use stylist::yew::styled_component;\nuse stylist::css;\nuse yew::prelude::*;\n\n#[styled_component]\nfn Badge() -> Html {\n    // scoped class: stylist injects a hashed <style> and returns the class name\n    let style = css!(r#\"\n        color: white;\n        background: #4e9a06;\n        padding: 4px 8px;\n        border-radius: 4px;\n    \"#);\n    html! { <span class={style}>{ \"new\" }</span> }\n}" },
        { type: "list", items: [
          "**Global CSS:** put a `main.css` at the root, reference it with `<link data-trunk rel=\"css\" href=\"main.css\"/>`; Trunk fingerprints it.",
          "**Tailwind:** run the Tailwind CLI (or the `trunk` post-build hook) to generate a stylesheet, then link it like any CSS.",
          "**stylist:** `css!` for a one-off class, `style!` for a reusable `Style`, `Global` component for global rules — all scoped and hashed.",
          "**`classes!`** (from Yew) composes class names conditionally regardless of which styling approach you use."
        ] },
        { type: "callout", variant: "tip", text: "`stylist`'s `css!` accepts a Rust raw string (`r#\"...\"#`) so you can write multi-line CSS with quotes and no escaping. Values can interpolate Rust expressions, giving you dynamic, per-render styles without inline `style` attributes." }
      ]
    },
    {
      id: "struct-components",
      title: "Legacy struct components",
      level: "deep",
      body: [
        { type: "p", text: "Before function components, Yew components were structs implementing the **`Component`** trait — an Elm-style loop of `Message`/`update`/`view`. They're still supported and occasionally clearer for complex, long-lived stateful widgets, but **function components + hooks are the default** for new code." },
        { type: "code", lang: "rust", code: "use yew::prelude::*;\n\npub struct Counter { count: i32 }\n\npub enum Msg { Increment, Reset }\n\nimpl Component for Counter {\n    type Message = Msg;\n    type Properties = ();\n\n    fn create(_ctx: &Context<Self>) -> Self {\n        Self { count: 0 }\n    }\n\n    fn update(&mut self, _ctx: &Context<Self>, msg: Msg) -> bool {\n        match msg {\n            Msg::Increment => self.count += 1,\n            Msg::Reset => self.count = 0,\n        }\n        true            // return true to re-render, false to skip\n    }\n\n    fn view(&self, ctx: &Context<Self>) -> Html {\n        // link().callback maps a DOM event to a Message\n        let inc = ctx.link().callback(|_| Msg::Increment);\n        html! {\n            <button onclick={inc}>{ self.count }</button>\n        }\n    }\n}" },
        { type: "list", items: [
          "**`create`** builds initial state from props (`ctx.props()`); **`update`** handles a `Message` and returns whether to re-render.",
          "**`ctx.link()`** is the messenger: `.callback(|e| Msg::...)` for events, `.send_message(msg)` / `.send_future(async {...})` for imperative/async updates.",
          "**Optional lifecycle:** `changed` (props changed), `rendered` (after DOM commit — good for measuring/focusing), `destroy` (teardown).",
          "**Props** must still derive `Properties + PartialEq`; access them via `ctx.props()`."
        ] },
        { type: "callout", variant: "note", text: "You can freely mix: a struct component can render function components and vice versa. Migrate incrementally — there's no need to rewrite working struct components, but write new ones as `#[function_component]`." }
      ]
    },
    {
      id: "agents",
      title: "Agents & web workers",
      level: "deep",
      body: [
        { type: "p", text: "Heavy CPU work on the main thread freezes the UI. Move it to a **web worker** via **`yew-agent`** (0.3, built on `gloo-worker`). An agent is a Rust function/struct that runs in a separate worker thread; the UI communicates with it by message passing. Two flavors: **oneshot** (request/response) and **reactor** (a streaming bridge)." },
        { type: "code", lang: "rust", code: "use yew_agent::oneshot::oneshot;\n\n// a oneshot agent: runs off-main-thread, returns one result per call\n#[oneshot]\nasync fn Fibonacci(n: u32) -> u64 {\n    fn fib(n: u32) -> u64 { if n < 2 { n as u64 } else { fib(n-1) + fib(n-2) } }\n    fib(n)\n}" },
        { type: "code", lang: "rust", code: "// in a component: register the worker + call it\nuse yew::prelude::*;\nuse yew_agent::oneshot::{OneshotProvider, use_oneshot_runner};\n\n#[function_component]\nfn App() -> Html {\n    html! {\n        // the provider spins up the worker bundle\n        <OneshotProvider<Fibonacci> path=\"/worker.js\">\n            <Calc/>\n        </OneshotProvider<Fibonacci>>\n    }\n}\n\n#[function_component]\nfn Calc() -> Html {\n    let runner = use_oneshot_runner::<Fibonacci>();\n    let onclick = Callback::from(move |_| {\n        let runner = runner.clone();\n        wasm_bindgen_futures::spawn_local(async move {\n            let result = runner.run(30).await;   // computed in the worker\n            web_sys::console::log_1(&result.into());\n        });\n    });\n    html! { <button {onclick}>{ \"compute\" }</button> }\n}" },
        { type: "callout", variant: "gotcha", text: "A worker needs its **own entry binary** compiled to a separate JS/WASM bundle (a second `bin` target that calls `Fibonacci::register()` / `Registrable`). Configure Trunk to build it, and point the provider's `path` at that output. This build wiring is the fiddly part of agents." }
      ]
    },
    {
      id: "ssr",
      title: "SSR & hydration",
      level: "deep",
      body: [
        { type: "p", text: "Yew can render on the server for faster first paint and SEO, then **hydrate** the same component tree on the client to make it interactive. Use **`ServerRenderer`** on the server (behind the `ssr` feature) and **`Renderer::hydrate`** on the client (behind `hydration`). This is manual wiring — you bring your own server (Axum/Actix)." },
        { type: "code", lang: "rust", code: "// server side (feature = \"ssr\"): produce an HTML string\nuse yew::ServerRenderer;\n\nasync fn render_page() -> String {\n    let renderer = ServerRenderer::<App>::new();\n    renderer.render().await          // -> the app's HTML, to inline into your shell\n}\n\n// client side (feature = \"hydration\"): attach to server HTML instead of re-rendering\nfn main() {\n    yew::Renderer::<App>::new().hydrate();\n}" },
        { type: "list", items: [
          "**Features:** `yew = { version = \"0.21\", features = [\"ssr\", \"hydration\"] }` — often gated by your own `#[cfg]` per build target.",
          "**Async during SSR:** components can suspend on data with **`use_prepared_state`** / **`use_transitive_state`** so fetched values serialize into the HTML and don't refetch on hydrate.",
          "**Hydration mismatch:** the client tree must match the server output exactly (same conditional branches, same data) or hydration errors and re-renders.",
          "**Static site generation** is possible by rendering each route to a file at build time and serving the HTML."
        ] },
        { type: "callout", variant: "warn", text: "SSR uses a multithreaded server runtime while the client is single-threaded WASM. Server-side futures/values may need to be `Send`, and browser-only APIs (`web_sys::window`, DOM access) **don't exist during SSR** — guard them so they run only after hydration (e.g. in an effect), or SSR panics." }
      ]
    },
    {
      id: "testing-deploy",
      title: "Testing, build & deploy",
      level: "core",
      body: [
        { type: "list", items: [
          "**Pure logic** (reducers, helpers) tests with ordinary `#[test]` on the host — no browser needed.",
          "**Component/DOM tests** run in a headless browser under **`wasm-bindgen-test`** via `wasm-pack test` — they can mount components and assert on the rendered DOM.",
          "**End-to-end** with Playwright/Cypress against `trunk serve`, same as any SPA."
        ] },
        { type: "code", lang: "rust", code: "use wasm_bindgen_test::*;\nwasm_bindgen_test_configure!(run_in_browser);\n\n#[wasm_bindgen_test]\nfn adds() {\n    assert_eq!(2 + 2, 4);\n}\n// run:  wasm-pack test --headless --firefox" },
        { type: "code", lang: "bash", code: "# production build: optimized wasm + hashed assets into ./dist\ntrunk build --release\n\n# set a base path when hosting under a subdirectory (e.g. GitHub Pages)\ntrunk build --release --public-url /my-app/\n\n# ./dist is fully static — deploy to Netlify, Vercel, GH Pages, S3, nginx, ...\n# for BrowserRouter, add a catch-all rewrite of all paths to /index.html" },
        { type: "callout", variant: "tip", text: "Shrink the bundle: build `--release` (Trunk enables `wasm-opt`), set `[profile.release] opt-level = \"z\"` and `lto = true` in `Cargo.toml`, strip `panic = \"abort\"`, and audit dependencies — a stray heavy crate (or `web-sys` with too many features) bloats the `.wasm`. Serve it gzip/brotli-compressed." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "Most Yew friction is **Rust ownership meeting a React-shaped API**. The patterns below cover the bugs that hit almost everyone in the first week." },
        { type: "heading", text: "1. \"value moved into closure\" — clone the handle" },
        { type: "code", lang: "rust", code: "// WRONG: `count` moved into the first closure, gone for the second\nlet count = use_state(|| 0);\nlet inc = Callback::from(move |_| count.set(*count + 1));\nlet dec = Callback::from(move |_| count.set(*count - 1));   // error: use of moved value\n\n// RIGHT: clone the handle for each closure (handles are cheap Rc-backed clones)\nlet inc = { let count = count.clone(); Callback::from(move |_| count.set(*count + 1)) };\nlet dec = { let count = count.clone(); Callback::from(move |_| count.set(*count - 1)) };" },
        { type: "list", items: [
          "**`PartialEq` on props is mandatory** and load-bearing: it's how Yew skips re-rendering unchanged children. If it's missing you get a compile error; if it's *expensive* (a big `Vec`), memoization costs more than it saves — wrap heavy data in `Rc<T>` so the comparison is a pointer check.",
          "**`use_effect_with` deps or you loop:** an effect that `.set`s state it also *reads* without a proper dep array re-runs forever. Pin the dependency (`use_effect_with(dep, ...)`), and read state with the handle, not by re-subscribing.",
          "**No Tokio in WASM:** `tokio::spawn`, `reqwest::blocking`, `std::thread`, and `std::time::Instant`/`sleep` don't work in the browser. Use `wasm_bindgen_futures::spawn_local`, `gloo-net`, `gloo-timers`, and `web_sys` time APIs instead.",
          "**Bundle size:** the WASM is bigger than a JS bundle. Build `--release`, enable `wasm-opt`, `opt-level=\"z\"` + `lto`, trim `web-sys` features, and lazy-load workers — measure with `twiggy` if it balloons.",
          "**Stale closure reads:** a `Callback` captures the state value at creation. Inside an event handler, read the *current* value via the handle (`*count`) — but remember the handle in a long-lived effect may itself be stale; re-clone in the dep-driven effect.",
          "**Missing `key`s:** dynamic lists without stable keys lose DOM state (focus, scroll) on reorder — always key list items.",
          "**Forgetting the closing generic:** `</ContextProvider<T>>`, `</Link<Route>>`, `<Switch<Route>>` all need the type on both tags — a common macro-syntax gotcha."
        ] },
        { type: "callout", variant: "gotcha", text: "**Blank page, no error?** You almost certainly panicked. Add `console_error_panic_hook::set_once()` at the top of `main` so panics print to the console with a backtrace — without it a panic is an opaque `RuntimeError: unreachable`." },
        { type: "callout", variant: "tip", text: "When a component re-renders too often, check props `PartialEq` and wrap event-handler props in **`use_callback(deps, ...)`** so their identity is stable across renders — otherwise a fresh `Callback` each render makes memoized children re-render anyway." }
      ]
    }
  ],

  packages: [
    { name: "yew", why: "core: function/struct components, html! macro, hooks, Renderer" },
    { name: "yew-router", why: "client-side routing (Routable derive, Switch, Link, use_navigator)" },
    { name: "trunk", why: "the WASM web bundler: build, wasm-bindgen, live-reload dev server" },
    { name: "wasm-bindgen", why: "Rust <-> JS bindings; import JS, export Rust to JS" },
    { name: "web-sys", why: "typed bindings to browser/DOM APIs (feature-gated per type)" },
    { name: "js-sys", why: "bindings to JavaScript built-ins (Array, Object, Promise, Date)" },
    { name: "wasm-bindgen-futures", why: "spawn_local — run async futures on the browser event loop" },
    { name: "gloo / gloo-net", why: "ergonomic wrappers for fetch, storage, timers, events, dialogs" },
    { name: "serde / serde_json", why: "(de)serialize API payloads to/from Rust structs" },
    { name: "stylist", why: "scoped CSS-in-Rust with css!/style! macros + Yew integration" },
    { name: "yew-agent / gloo-worker", why: "run heavy work in web workers (oneshot/reactor agents)" },
    { name: "yew-hooks", why: "extra hooks: use_async, use_interval, use_local_storage, etc." },
    { name: "yewdux / bounce", why: "app-wide global state stores (Redux-like / Recoil-like)" },
    { name: "wasm-bindgen-test", why: "run component/DOM tests in a headless browser" },
    { name: "console_error_panic_hook", why: "print Rust panics to the browser console with a backtrace" },
    { name: "wasm-logger / tracing-wasm", why: "route log!/tracing output to the browser console" }
  ],

  gotchas: [
    "Every closure capturing state must `.clone()` the handle first — `use_state`/`use_reducer` handles are cheap `Rc`-backed clones, but a value moved into two closures errors with 'use of moved value'.",
    "Props structs MUST derive `PartialEq` (and `Properties`) — it's how Yew skips re-rendering unchanged children. Missing it is a compile error; an expensive one (big `Vec`) hurts perf — wrap heavy data in `Rc<T>`.",
    "There is **no Tokio in WASM**: `tokio::spawn`, `reqwest::blocking`, `std::thread`, and `std::time` sleeping don't work. Use `wasm_bindgen_futures::spawn_local`, `gloo-net`, `gloo-timers`, `web_sys` time.",
    "`use_effect_with(deps, f)` runs only when `deps` change; deps must be `PartialEq + Clone + 'static`. Depend on several values via a **tuple**. Plain `use_effect(f)` runs after *every* render.",
    "An effect that `.set`s state it also reads, without a proper dep, loops forever — pin the dependency in `use_effect_with`.",
    "In `html!`, bare text must be a quoted string in braces: `{ \"hi\" }`, not `hi`. Self-closing tags need the slash: `<img/>`.",
    "Dynamic list items need a stable **`key`** or Yew mis-diffes on reorder/insert — losing input focus and component state.",
    "Closing-tag generics are required: `</ContextProvider<T>>`, `</Link<Route>>` — a frequent macro syntax error.",
    "`spawn_local` requires a `'static` future — move (and clone) everything it uses inside `async move`.",
    "`web-sys` is feature-gated: an 'unresolved import' for a DOM type usually means you forgot to add its feature to the `web-sys` dependency.",
    "A blank page with no console error is almost always a panic — install `console_error_panic_hook::set_once()` in `main` to see the real error.",
    "`BrowserRouter` needs a server catch-all rewrite to `index.html`, or a hard refresh on a deep link 404s. Use `HashRouter` on static hosts that can't rewrite.",
    "WASM bundles are large — build `--release` (enables wasm-opt), set `opt-level=\"z\"` + `lto`, trim `web-sys` features, and serve compressed.",
    "`use_context::<T>()` returns `None` when no matching `ContextProvider<T>` is above — `.expect()` with a message beats a silent later panic.",
    "During SSR the DOM doesn't exist — `web_sys::window()` and DOM access panic; guard browser-only code so it runs after hydration."
  ],

  flashcards: [
    { q: "How does Yew's rendering differ from Leptos?", a: "Yew keeps a **virtual DOM** and **re-runs the whole component** on state/prop change, then diffs & patches. Leptos uses fine-grained signals that update individual nodes with no vdom and no component re-run." },
    { q: "How do you define the default kind of Yew component?", a: "A function annotated with `#[function_component]` returning `Html`, e.g. `#[function_component] fn App() -> Html { html!{ ... } }`. Use it as `<App/>`." },
    { q: "How do you hold local state and update it?", a: "`let s = use_state(|| init);` — read by deref `*s`, update with `s.set(v)` (schedules a re-render). For structured state use `use_reducer` with a `Reducible` impl and `.dispatch(action)`." },
    { q: "What changed with use_effect_with in 0.21?", a: "It was renamed from `use_effect_with_deps`. Signature is `use_effect_with(deps, |deps| { ...; cleanup_closure })`; the effect re-runs only when `deps` (PartialEq) change. Depend on many values via a tuple." },
    { q: "How do you read an input's value from an event?", a: "Cast the event target to the concrete `web-sys` element: `let input: HtmlInputElement = e.target_unchecked_into();` (or `target_dyn_into` for an Option), then `input.value()`. Uses Yew's `TargetCast` trait." },
    { q: "What derives does a props struct need?", a: "`#[derive(Properties, PartialEq)]`. Field defaults use `#[prop_or_default]` or `#[prop_or(expr)]`. Children are typically typed `children: Html` in 0.21." },
    { q: "How do you share state without prop-drilling?", a: "Wrap a subtree in `<ContextProvider<T> context={...}>` and read below with `use_context::<T>()` (returns `Option<T>`). `T` must be `Clone + PartialEq`; bundle a `Callback` to let children update it." },
    { q: "How is routing set up with yew-router?", a: "Derive `Routable` on an enum with `#[at(\"/path/:id\")]` variants, write a `switch(route) -> Html`, and render `<Switch<Route> render={switch}/>` inside `<BrowserRouter>`. Navigate with `<Link<Route>>` or `use_navigator`." },
    { q: "How do you fetch data in Yew?", a: "From an effect, spawn with `wasm_bindgen_futures::spawn_local`, fetch with `gloo-net`'s `Request::get(url).send().await?.json().await?`, then `state.set(result)`. There's no Tokio in WASM." },
    { q: "What's the interop stack for JS/DOM?", a: "`wasm-bindgen` (Rust<->JS bridge), `web-sys` (typed DOM APIs, feature-gated), `js-sys` (JS built-ins), and `gloo` (ergonomic wrappers for storage/timers/events). `use_node_ref` grabs a real DOM node." },
    { q: "What is a struct component and when use one?", a: "The legacy `Component` trait: `create`/`update(Message)`/`view`, Elm-style. Still supported (occasionally clearer for complex long-lived widgets), but function components + hooks are the default for new code." },
    { q: "How do you do SSR + hydration in Yew?", a: "`ServerRenderer::<App>::new().render().await` on the server (feature `ssr`) produces HTML; `yew::Renderer::<App>::new().hydrate()` on the client (feature `hydration`) attaches to it. Client tree must match server output." },
    { q: "Why is my Yew page blank with no error?", a: "You panicked. Install `console_error_panic_hook::set_once()` at the top of `main` to get a real backtrace instead of an opaque `RuntimeError: unreachable`." },
    { q: "How do you offload heavy computation off the main thread?", a: "Use a web worker via `yew-agent` (oneshot or reactor agents). The agent runs in a separate worker bundle; the UI calls it by message passing (e.g. `use_oneshot_runner`)." },
    { q: "What are the dev and prod commands with Trunk?", a: "`trunk serve --open` for a live-reload dev server; `trunk build --release` for an optimized static bundle in `./dist`. Add `--public-url /sub/` when hosting under a subpath." },
    { q: "Why does my component re-render on every parent render?", a: "Props aren't comparing equal — usually a fresh `Callback`/closure each render. Stabilize handlers with `use_callback(deps, ...)` and ensure props derive a cheap `PartialEq` (wrap heavy data in `Rc`)." }
  ],

  cheatsheet: [
    { label: "New wasm target", code: "rustup target add wasm32-unknown-unknown" },
    { label: "Dev server", code: "trunk serve --open" },
    { label: "Prod build", code: "trunk build --release" },
    { label: "Component", code: "#[function_component] fn App() -> Html { html!{ ... } }" },
    { label: "Mount", code: "yew::Renderer::<App>::new().render();" },
    { label: "State", code: "let n = use_state(|| 0); n.set(*n + 1);" },
    { label: "Effect (once)", code: "use_effect_with((), move |_| { /* ... */ || () });" },
    { label: "Callback", code: "let f = Callback::from(move |e: MouseEvent| { ... });" },
    { label: "Input value", code: "let i: HtmlInputElement = e.target_unchecked_into(); i.value()" },
    { label: "Props", code: "#[derive(Properties, PartialEq)] struct P { name: String }" },
    { label: "List", code: "{ for items.iter().map(|x| html!{ <li key={x.id}>{ &x.name }</li> }) }" },
    { label: "Context", code: "<ContextProvider<T> context={c}>...</ContextProvider<T>>" },
    { label: "Route", code: "#[at(\"/post/:id\")] Post { id: u32 }" },
    { label: "Navigate", code: "let nav = use_navigator().unwrap(); nav.push(&Route::Home);" },
    { label: "Fetch", code: "Request::get(\"/api\").send().await?.json().await?" },
    { label: "Spawn async", code: "wasm_bindgen_futures::spawn_local(async move { ... });" }
  ]
});
