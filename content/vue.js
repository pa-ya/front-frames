(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "vue",
  name: "Vue",
  language: "TypeScript",
  group: "JS / TS",
  navLabel: "Vue",
  color: "#42b883",
  readMinutes: 28,
  tagline: "The **approachable** reactive framework — single-file components, the Composition API with `<script setup>`, and a signal-like `ref()`/`reactive()` core.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "Vue is a **reactive UI framework** built around two pillars: a **template** that declaratively describes the DOM as a function of state, and a **reactivity system** that tracks which state each piece of the DOM reads, so a change updates only what depends on it. You author UI as **components**, usually as **Single-File Components** (`.vue` files bundling template, script, and scoped styles). Vue does use a virtual DOM, but 3.x compiles templates to highly optimized render functions (static hoisting, patch flags) so updates are cheap." },
        { type: "list", items: [
          "**Reach for it when:** you want a gentle learning curve, first-class templates, batteries-included official libraries (Router, Pinia), and incremental adoption (drop it into one page, or build a full SPA/SSR app).",
          "**Two API styles:** the **Composition API** (`setup`, `ref`, `computed`) is the modern default for new apps — great TS inference and logic reuse; the **Options API** (`data`, `methods`, `computed` object) still works and is fine for small components. This deck uses Composition API with `<script setup>` throughout.",
          "**Mental model:** *state is the source of truth*. Reactive values (`ref`/`reactive`) are dependencies; the template and `computed`/`watch` are subscribers. Mutate the state and Vue re-runs exactly the subscribers that read it. You describe relationships, not DOM update steps."
        ] },
        { type: "table", headers: ["Concept", "React analog", "Vue"], rows: [
          ["Reactive state", "`useState`", "`ref()` / `reactive()`"],
          ["Derived value", "`useMemo`", "`computed()`"],
          ["Side effect", "`useEffect`", "`watch()` / `watchEffect()`"],
          ["Component-local logic reuse", "custom hook", "**composable** (`useX()`)"],
          ["Global state", "Redux/Zustand", "**Pinia** store"],
          ["Data fetching", "React Query", "`Suspense` + composables / TanStack Query"]
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Vue 3.5** (current stable). Highlights since 3.0: `<script setup>` is the recommended default, **`defineModel()`** (stable in 3.4) for two-way binding, **reactive props destructure** (stable in 3.5), **`useTemplateRef()`** and `useId()` (3.5), and big memory/reactivity performance work. Vue 2 reached end-of-life at the end of 2023 — build new apps on Vue 3." },
        { type: "callout", variant: "tip", text: "Coming from an older tutorial? If you see `new Vue({...})`, `Vue.component`, filters, or `this.$set` — that's **Vue 2**. Vue 3 uses `createApp()`, Proxy-based reactivity (no `Vue.set` needed), and `<script setup>`. If you see `export default { setup() { return {...} } }`, that's the verbose Composition form; `<script setup>` is the sugar you want." }
      ]
    },
    {
      id: "setup",
      title: "Project setup & structure",
      level: "core",
      body: [
        { type: "p", text: "The official way to scaffold a Vue project is **create-vue**, which sets up a **Vite** build with optional TypeScript, Vue Router, Pinia, ESLint, and Vitest. Vite gives instant dev startup and HMR; the Vue plugin compiles `.vue` files." },
        { type: "code", lang: "bash", code: "npm create vue@latest\n#   Project name, TypeScript? Yes, Router? Yes, Pinia? Yes, Vitest? (your call)\ncd my-app\nnpm install\nnpm run dev        # http://localhost:5173\nnpm run build      # production bundle in dist/\nnpm run preview    # serve the built app locally" },
        { type: "code", lang: "text", code: "src/\n  main.ts            // app entry: createApp(App).use(router).use(pinia).mount('#app')\n  App.vue            // root component\n  router/index.ts    // Vue Router routes\n  stores/            // Pinia stores\n  components/        // reusable UI components\n  views/             // route-level page components\n  composables/       // reusable logic (useX.ts)\n  assets/            // css, images\nindex.html           // the single HTML page (has <div id=\"app\">)\nvite.config.ts       // Vite + @vitejs/plugin-vue" },
        { type: "code", lang: "ts", code: "// main.ts — wiring the app\nimport { createApp } from \"vue\";\nimport { createPinia } from \"pinia\";\nimport App from \"./App.vue\";\nimport router from \"./router\";\nimport \"./assets/main.css\";\n\ncreateApp(App)\n  .use(createPinia())   // plugins: state, router, i18n, etc.\n  .use(router)\n  .mount(\"#app\");       // attach to <div id=\"app\"> in index.html" },
        { type: "callout", variant: "tip", text: "Use the official **Vue - Official** VS Code extension (Volar) for `.vue` template/TS intellisense. For type-checking `.vue` files on the command line, `vue-tsc` (create-vue wires it into `npm run build` as `vue-tsc --build`). `tsc` alone can't type-check templates." }
      ]
    },
    {
      id: "sfc",
      title: "Single-File Components (.vue)",
      level: "core",
      body: [
        { type: "p", text: "A **Single-File Component** puts a component's template, logic, and styles in one `.vue` file with three blocks: `<template>`, `<script setup>`, and `<style>`. `<script setup>` is compile-time sugar: every top-level binding (imports, variables, functions, components) is automatically available to the template — no `return` needed." },
        { type: "code", lang: "html", code: "<script setup lang=\"ts\">\nimport { ref, computed } from \"vue\";\nimport ChildBadge from \"./ChildBadge.vue\";   // imported comp is usable in the template\n\nconst count = ref(0);\nconst doubled = computed(() => count.value * 2);\nfunction inc() { count.value++; }\n</script>\n\n<template>\n  <button @click=\"inc\">count is {{ count }}</button>\n  <p>doubled: {{ doubled }}</p>\n  <ChildBadge :n=\"count\" />\n</template>\n\n<style scoped>\n/* scoped -> these rules only apply to THIS component's elements */\nbutton { font-weight: 600; }\n</style>" },
        { type: "list", items: [
          "**`<style scoped>`** rewrites selectors with a unique data attribute so styles don't leak. Use `:deep(.child)` to reach into a child component's DOM, and `<style module>` for CSS-Modules-style hashed class names exposed as `$style`.",
          "**`lang=\"ts\"`** on `<script setup>` enables TypeScript; `lang=\"scss\"` etc. on `<style>` enables preprocessors.",
          "A component can have **only one** `<script setup>`, but may add a **plain `<script>`** block alongside it for code that must run once at module scope or to set component options like `name` / `inheritAttrs`.",
          "The template compiles to a render function — you can also write render functions or JSX (via `@vitejs/plugin-vue-jsx`), but templates are idiomatic and enable the compiler's optimizations."
        ] },
        { type: "callout", variant: "note", text: "Vue 3 templates allow **multiple root nodes** (fragments) — you don't need a single wrapper element like Vue 2 did. When a component has multiple roots, automatic attribute fallthrough is ambiguous, so bind `v-bind=\"$attrs\"` explicitly on the element that should receive them." }
      ]
    },
    {
      id: "reactivity",
      title: "Reactivity: ref, reactive, computed & watch",
      level: "core",
      body: [
        { type: "p", text: "Reactivity is the core. **`ref()`** wraps any value (primitive or object) in a reactive container you access through **`.value`**. **`reactive()`** makes an object deeply reactive via a Proxy — you access its properties directly (no `.value`), but it only works on objects/arrays/Maps/Sets, and destructuring it loses reactivity." },
        { type: "code", lang: "ts", code: "import { ref, reactive, computed, watch, watchEffect } from \"vue\";\n\nconst count = ref(0);            // Ref<number>\ncount.value++;                   // read/write via .value in <script>\n\nconst state = reactive({ n: 0, user: { name: \"Ada\" } });\nstate.n++;                       // no .value; deeply reactive\n\n// computed: cached derived value, re-evaluates only when a dependency changes\nconst double = computed(() => count.value * 2);\ndouble.value;                    // read-only ref\n\n// writable computed (getter + setter)\nconst fullName = computed({\n  get: () => state.user.name,\n  set: (v) => { state.user.name = v; },\n});" },
        { type: "callout", variant: "note", text: "In the **template**, refs are **auto-unwrapped** — write `{{ count }}`, not `{{ count.value }}`. The `.value` is only needed in `<script>`/JS. (Caveat: auto-unwrap applies to top-level refs, not refs nested inside a plain object you access in the template.)" },
        { type: "heading", text: "ref vs reactive — which to use" },
        { type: "table", headers: ["", "`ref()`", "`reactive()`"], rows: [
          ["Holds", "any value (primitive or object)", "objects / arrays / Map / Set only"],
          ["Access", "`.value` in JS, auto-unwrapped in template", "direct property access"],
          ["Reassign whole value", "yes — `r.value = newObj`", "no — replacing the variable breaks reactivity"],
          ["Destructure-safe", "the ref itself yes; use `toRefs` for its object", "no — loses reactivity (use `toRefs`)"],
          ["Recommendation", "**default choice** — consistent, works for everything", "handy for a grouped set of related fields"]
        ] },
        { type: "callout", variant: "tip", text: "When in doubt, **use `ref` everywhere** — it handles primitives and objects uniformly and survives reassignment. Reserve `reactive` for a cohesive object of fields you never reassign wholesale. Many teams standardize on `ref` only to avoid the destructuring footguns of `reactive`." },
        { type: "heading", text: "watch & watchEffect" },
        { type: "p", text: "**`watch`** observes a specific source (a ref, a getter, or an array of sources) and runs a callback with the new & old values when it changes — lazy by default. **`watchEffect`** runs immediately and auto-tracks whatever reactive values it reads, re-running when any of them change (no explicit source, no old value)." },
        { type: "code", lang: "ts", code: "// watch a ref (lazy: runs only on change)\nwatch(count, (val, old) => console.log(`${old} -> ${val}`));\n\n// watch a getter for a nested value; { immediate, deep } options\nwatch(() => state.user.name, (name) => save(name), { immediate: true });\n\n// watch multiple sources\nwatch([count, () => state.n], ([c, n]) => {});\n\n// watchEffect: runs now, re-runs when count OR state.n change (auto-tracked)\nwatchEffect(() => {\n  document.title = `count ${count.value} / ${state.n}`;\n});\n\n// cleanup on re-run / unmount (e.g. cancel a timer or request)\nwatch(count, (v, _o, onCleanup) => {\n  const id = setTimeout(() => fetchFor(v), 300);\n  onCleanup(() => clearTimeout(id));\n});" },
        { type: "list", items: [
          "**`.value`** — the single most common bug source: forgetting it on a ref in `<script>` (e.g. `if (count)` is always truthy; you meant `count.value`).",
          "**`toRefs(obj)`** — turns each property of a reactive object into a ref, so you *can* destructure and keep reactivity: `const { n } = toRefs(state)`. **`toRef(obj, 'k')`** does one property.",
          "**`readonly(obj)`** — a reactive read-only proxy; good for handing state down without letting children mutate it.",
          "**`unref(x)`** — `isRef(x) ? x.value : x`; **`isRef`/`isReactive`/`toRaw`** round out the toolkit."
        ] }
      ]
    },
    {
      id: "template",
      title: "Template syntax & directives",
      level: "core",
      body: [
        { type: "p", text: "Templates are HTML with **mustache interpolation** `{{ }}`, **directives** (`v-`-prefixed attributes), and shorthands: `:` for `v-bind`, `@` for `v-on`. Expressions inside `{{ }}` and directives are single JS expressions evaluated against the component's scope." },
        { type: "code", lang: "html", code: "<template>\n  <!-- interpolation + attribute binding -->\n  <img :src=\"user.avatar\" :alt=\"user.name\" />\n  <a :href=\"`/u/${user.id}`\">{{ user.name }}</a>\n\n  <!-- events; @ = v-on. Inline or method, with modifiers -->\n  <button @click=\"count++\">+1</button>\n  <form @submit.prevent=\"onSubmit\">...</form>       <!-- .prevent, .stop, .once, .self -->\n  <input @keyup.enter=\"search\" />                    <!-- key modifiers -->\n\n  <!-- conditionals: v-if actually adds/removes; v-show toggles display:none -->\n  <p v-if=\"loading\">Loading…</p>\n  <p v-else-if=\"error\">{{ error }}</p>\n  <p v-else>{{ data }}</p>\n  <div v-show=\"isOpen\">toggled with CSS, stays in DOM</div>\n\n  <!-- lists: ALWAYS give a stable :key -->\n  <li v-for=\"item in items\" :key=\"item.id\">{{ item.name }}</li>\n  <li v-for=\"(val, key) in obj\" :key=\"key\">{{ key }}: {{ val }}</li>\n\n  <!-- two-way binding -->\n  <input v-model=\"query\" />\n  <input type=\"checkbox\" v-model=\"agreed\" />\n\n  <!-- raw HTML (danger: only trusted content — XSS risk) -->\n  <div v-html=\"trustedHtml\"></div>\n</template>" },
        { type: "table", headers: ["Directive", "Meaning"], rows: [
          ["`v-bind:x` / `:x`", "bind an attribute/prop to an expression"],
          ["`v-on:e` / `@e`", "attach an event listener"],
          ["`v-model`", "two-way binding on inputs/components (see props section)"],
          ["`v-if` / `v-else-if` / `v-else`", "conditionally render (adds/removes from DOM)"],
          ["`v-show`", "toggle visibility via `display:none` (stays in DOM)"],
          ["`v-for`", "render a list; requires a `:key`"],
          ["`v-html` / `v-text`", "set innerHTML / textContent"],
          ["`v-once` / `v-memo`", "render once / memoize a subtree by deps"]
        ] },
        { type: "callout", variant: "tip", text: "`v-model` on inputs has modifiers: `.trim` (trim whitespace), `.number` (cast to number), `.lazy` (sync on `change` not `input`). Bind class/style with objects or arrays: `:class=\"{ active: isActive, 'is-error': hasError }\"` and `:style=\"{ color, fontSize: size + 'px' }\"`." },
        { type: "callout", variant: "gotcha", text: "**Never put `v-if` and `v-for` on the same element** — `v-if` has higher priority in Vue 3, so it can't read the loop variable, and the intent is ambiguous. Instead, filter in a `computed`, or wrap the loop in a `<template v-for>` and put `v-if` on the inner element." }
      ]
    },
    {
      id: "props-emits",
      title: "Props, events & defineModel",
      level: "core",
      body: [
        { type: "p", text: "Data flows **down** via props and **up** via emitted events. In `<script setup>` you declare them with the compiler macros **`defineProps`** and **`defineEmits`** — no import needed. With TypeScript, pass a type argument for full inference." },
        { type: "code", lang: "html", code: "<script setup lang=\"ts\">\n// typed props with defaults (reactive props destructure, stable in 3.5)\nconst { size = \"md\", disabled = false, label } = defineProps<{\n  label: string;\n  size?: \"sm\" | \"md\" | \"lg\";\n  disabled?: boolean;\n}>();\n\n// typed emits\nconst emit = defineEmits<{\n  click: [id: number];        // event name -> tuple of payload args\n  change: [value: string];\n}>();\n\nfunction onClick() { emit(\"click\", 42); }\n</script>\n\n<template>\n  <button :class=\"size\" :disabled=\"disabled\" @click=\"onClick\">{{ label }}</button>\n</template>" },
        { type: "callout", variant: "note", text: "**Reactive props destructure** (stable in 3.5): destructuring `defineProps()` keeps the values reactive — the compiler rewrites references to `props.x`, so `label` stays live and defaults are given inline. Before 3.5 you used `withDefaults(defineProps<...>(), { size: \"md\" })` and did **not** destructure. Both work in 3.5; destructure is the newer, cleaner style." },
        { type: "heading", text: "defineModel — two-way binding on a component" },
        { type: "p", text: "To make a component work with `v-model`, use **`defineModel()`** (stable in 3.4). It returns a ref that stays in sync with the parent's `v-model` — reading it gives the current value, assigning it emits the update. This replaces the old manual `modelValue` prop + `update:modelValue` emit boilerplate." },
        { type: "code", lang: "html", code: "<!-- Child: MyInput.vue -->\n<script setup lang=\"ts\">\nconst model = defineModel<string>();          // <MyInput v-model=\"x\" />\nconst count = defineModel<number>(\"count\");   // named: <MyInput v-model:count=\"n\" />\n</script>\n<template>\n  <input :value=\"model\" @input=\"model = ($event.target as HTMLInputElement).value\" />\n</template>\n\n<!-- Parent -->\n<!-- <MyInput v-model=\"text\" v-model:count=\"n\" /> -->" },
        { type: "callout", variant: "gotcha", text: "**Never mutate a prop** — props are read-only; assigning to one warns and the change is clobbered on the next parent render. If a child needs to change a value, either emit an event (or use `defineModel`), or copy the prop into local state with `ref(props.x)` / a `computed` if you need to derive from it." },
        { type: "callout", variant: "tip", text: "Non-prop attributes (`class`, `id`, listeners) **fall through** to the component's single root element automatically. Disable with `defineOptions({ inheritAttrs: false })` and place them manually via `v-bind=\"$attrs\"` — useful for wrapper components around a real `<input>`." }
      ]
    },
    {
      id: "slots",
      title: "Slots: composing content",
      level: "core",
      body: [
        { type: "p", text: "**Slots** let a parent inject template content into a child — Vue's version of `children`. A child declares `<slot>` outlets; the parent fills them. Slots can be **default**, **named**, and **scoped** (the child passes data back up to the slot content)." },
        { type: "code", lang: "html", code: "<!-- Child: Card.vue -->\n<template>\n  <div class=\"card\">\n    <header><slot name=\"title\">Untitled</slot></header>   <!-- named + fallback -->\n    <div class=\"body\"><slot /></div>                       <!-- default slot -->\n    <!-- scoped slot: expose row data to the parent's template -->\n    <slot name=\"row\" v-for=\"r in rows\" :key=\"r.id\" :row=\"r\" :index=\"r.id\" />\n  </div>\n</template>\n\n<!-- Parent -->\n<Card>\n  <template #title>My Heading</template>       <!-- #title = v-slot:title -->\n  <p>Default slot content</p>\n  <template #row=\"{ row, index }\">            <!-- destructure scoped slot props -->\n    <span>{{ index }}: {{ row.name }}</span>\n  </template>\n</Card>" },
        { type: "list", items: [
          "**`#name`** is shorthand for `v-slot:name`; the default slot is `#default`.",
          "**Fallback content** inside `<slot>...</slot>` renders when the parent provides nothing for that slot.",
          "**Scoped slots** are the mechanism for headless/renderless components: the child owns logic/data, the parent owns presentation via the slot props.",
          "Check whether a slot was passed with **`$slots`** (`v-if=\"$slots.footer\"`) to avoid rendering empty wrappers."
        ] },
        { type: "callout", variant: "tip", text: "Slots vs props: pass **data** as props, pass **markup** as slots. A scoped slot combines both — the child provides data, the parent decides how to render it — which is how libraries build flexible tables, lists, and comboboxes." }
      ]
    },
    {
      id: "lifecycle",
      title: "Lifecycle, provide/inject & template refs",
      level: "core",
      body: [
        { type: "p", text: "Lifecycle hooks let you run code at key moments. In `<script setup>` they're functions you call, passing a callback — registered against the current component instance. The most common is **`onMounted`** (DOM is ready)." },
        { type: "code", lang: "ts", code: "import { onMounted, onUnmounted, onUpdated, onBeforeMount } from \"vue\";\n\nonMounted(() => {          // component + its DOM are in the page\n  const off = window.addEventListener(\"resize\", handler);\n});\nonUnmounted(() => {        // cleanup: remove listeners, timers, subscriptions\n  window.removeEventListener(\"resize\", handler);\n});" },
        { type: "table", headers: ["Hook", "Fires when"], rows: [
          ["`onBeforeMount` / `onMounted`", "before / after first DOM render"],
          ["`onBeforeUpdate` / `onUpdated`", "before / after a reactive re-render"],
          ["`onBeforeUnmount` / `onUnmounted`", "before / after the component is torn down"],
          ["`onErrorCaptured`", "an error from a descendant was caught"],
          ["`onActivated` / `onDeactivated`", "a `<KeepAlive>`-cached component is shown / hidden"]
        ] },
        { type: "heading", text: "provide / inject" },
        { type: "p", text: "**`provide`/`inject`** pass data down an arbitrarily deep tree without prop-drilling — an ancestor `provide`s a keyed value, any descendant `inject`s it. Provide a `ref`/`reactive` value to keep it reactive; provide a `readonly` wrapper plus an updater function to keep mutations controlled." },
        { type: "code", lang: "ts", code: "// ancestor\nimport { provide, ref, readonly } from \"vue\";\nconst theme = ref(\"dark\");\nprovide(\"theme\", readonly(theme));\nprovide(\"setTheme\", (t: string) => { theme.value = t; });\n\n// descendant (any depth)\nimport { inject } from \"vue\";\nconst theme = inject(\"theme\", \"light\");           // 2nd arg = default\nconst setTheme = inject<(t: string) => void>(\"setTheme\");" },
        { type: "heading", text: "Template refs & useTemplateRef" },
        { type: "p", text: "To touch a real DOM element or a child component instance, use a **template ref**. In 3.5+ the ergonomic way is **`useTemplateRef('name')`** matched to `ref=\"name\"`; the older pattern is a ref whose variable name matches the `ref` attribute." },
        { type: "code", lang: "html", code: "<script setup lang=\"ts\">\nimport { useTemplateRef, onMounted } from \"vue\";\nconst inputEl = useTemplateRef<HTMLInputElement>(\"inputEl\");   // 3.5+\nonMounted(() => inputEl.value?.focus());\n</script>\n<template>\n  <input ref=\"inputEl\" />\n</template>" },
        { type: "callout", variant: "gotcha", text: "A template ref is `null` until the component is mounted — only read it in `onMounted` or later, never during `setup`/render. To expose methods from a child to a parent ref, the child must publish them with `defineExpose({ ... })`; otherwise `<script setup>` components are closed by default." }
      ]
    },
    {
      id: "composables",
      title: "Composables: reusable logic",
      level: "core",
      body: [
        { type: "p", text: "A **composable** is a function (by convention named `useX`) that encapsulates and reuses **stateful, reactive logic** using the Composition API — Vue's answer to React hooks and mixins. It creates refs, wires watchers/lifecycle, and returns reactive state plus functions. Because it's just a function, it composes and is trivial to unit-test." },
        { type: "code", lang: "ts", code: "// composables/useMouse.ts\nimport { ref, onMounted, onUnmounted } from \"vue\";\n\nexport function useMouse() {\n  const x = ref(0), y = ref(0);\n  function update(e: MouseEvent) { x.value = e.pageX; y.value = e.pageY; }\n  onMounted(() => window.addEventListener(\"mousemove\", update));\n  onUnmounted(() => window.removeEventListener(\"mousemove\", update));\n  return { x, y };   // return refs so callers keep reactivity\n}\n\n// in any component's <script setup>:\n// const { x, y } = useMouse();" },
        { type: "list", items: [
          "**Return refs, not plain values** — a composable returning `x.value` would hand back a frozen snapshot. Return the ref (or a `reactive`/`toRefs`'d object) so callers stay reactive.",
          "**Call composables synchronously at the top of `setup`** (same rule as React hooks) — they register lifecycle hooks against the current instance, which only exists during setup.",
          "**Accept refs *or* plain values** with `toValue(source)` / `MaybeRefOrGetter<T>` so a composable works whether the caller passes a static value, a ref, or a getter.",
          "Composables replace Vue 2 **mixins** — no implicit `this` merging, no name collisions, explicit inputs and outputs."
        ] },
        { type: "callout", variant: "tip", text: "**VueUse** is the community standard library of 200+ composables — `useLocalStorage`, `useDebounceFn`, `useIntersectionObserver`, `useFetch`, `useDark`, `useEventListener`, and more. Reach for it before hand-rolling browser-API glue: `npm i @vueuse/core`." }
      ]
    },
    {
      id: "router",
      title: "Vue Router",
      level: "core",
      body: [
        { type: "p", text: "**Vue Router** is the official router for SPAs: map URLs to components, support dynamic and nested routes, and guard navigation. Define routes, create the router, and register it as a plugin; render matched components with `<RouterView>` and navigate with `<RouterLink>`." },
        { type: "code", lang: "ts", code: "// router/index.ts\nimport { createRouter, createWebHistory } from \"vue-router\";\n\nconst router = createRouter({\n  history: createWebHistory(),        // HTML5 history (clean URLs)\n  routes: [\n    { path: \"/\", name: \"home\", component: () => import(\"@/views/Home.vue\") }, // lazy\n    { path: \"/users/:id\", name: \"user\", component: () => import(\"@/views/User.vue\"), props: true },\n    {\n      path: \"/settings\", component: () => import(\"@/views/Settings.vue\"),\n      children: [                       // nested routes render in a nested <RouterView>\n        { path: \"\", component: () => import(\"@/views/SettingsHome.vue\") },\n        { path: \"profile\", component: () => import(\"@/views/Profile.vue\") },\n      ],\n    },\n    { path: \"/:pathMatch(.*)*\", component: () => import(\"@/views/NotFound.vue\") }, // 404\n  ],\n});\nexport default router;" },
        { type: "code", lang: "html", code: "<script setup lang=\"ts\">\nimport { useRoute, useRouter } from \"vue-router\";\nconst route = useRoute();       // reactive current route: route.params, route.query\nconst router = useRouter();     // imperative nav: push, replace, back\n\nfunction goUser(id: number) { router.push({ name: \"user\", params: { id } }); }\n// read the dynamic param reactively:  const id = computed(() => route.params.id)\n</script>\n<template>\n  <nav>\n    <RouterLink to=\"/\">Home</RouterLink>\n    <RouterLink :to=\"{ name: 'user', params: { id: 1 } }\">User 1</RouterLink>\n  </nav>\n  <RouterView />                <!-- matched component renders here -->\n</template>" },
        { type: "code", lang: "ts", code: "// navigation guards — auth, confirmation, analytics\nrouter.beforeEach((to, from) => {\n  const authed = !!localStorage.getItem(\"token\");\n  if (to.meta.requiresAuth && !authed) return { name: \"login\" };  // redirect\n  return true;                                                    // allow\n});\n// per-component guard inside <script setup>:\nimport { onBeforeRouteLeave } from \"vue-router\";\nonBeforeRouteLeave(() => confirm(\"Discard changes?\"));" },
        { type: "callout", variant: "gotcha", text: "When a route only changes its **param** (e.g. `/users/1` → `/users/2`), Vue **reuses** the same component instance — `onMounted` does **not** run again. Either `watch(() => route.params.id, ...)` to refetch, or give `<RouterView>`/the component a `:key` tied to the param to force a remount." }
      ]
    },
    {
      id: "pinia",
      title: "Pinia: global state",
      level: "core",
      body: [
        { type: "p", text: "**Pinia** is the official state-management library (successor to Vuex). A **store** holds shared reactive state with **getters** (computed) and **actions** (methods, sync or async). Pinia has first-class TypeScript inference, devtools support, and no mutations/modules boilerplate. The **setup-style** store is just the Composition API." },
        { type: "code", lang: "ts", code: "// stores/counter.ts — setup store (recommended)\nimport { defineStore } from \"pinia\";\nimport { ref, computed } from \"vue\";\n\nexport const useCounter = defineStore(\"counter\", () => {\n  const count = ref(0);                          // state\n  const double = computed(() => count.value * 2); // getter\n  function increment() { count.value++; }         // action\n  async function loadFromApi() {\n    count.value = await (await fetch(\"/api/count\")).json();\n  }\n  return { count, double, increment, loadFromApi };\n});" },
        { type: "code", lang: "html", code: "<script setup lang=\"ts\">\nimport { storeToRefs } from \"pinia\";\nimport { useCounter } from \"@/stores/counter\";\n\nconst counter = useCounter();\n// destructuring the store loses reactivity -> use storeToRefs for state/getters\nconst { count, double } = storeToRefs(counter);\n// actions can be destructured directly (they're bound functions)\nconst { increment } = counter;\n</script>\n<template>\n  <button @click=\"increment\">{{ count }} (x2 = {{ double }})</button>\n</template>" },
        { type: "callout", variant: "gotcha", text: "**Destructuring a store loses reactivity** for state and getters (same Proxy problem as `reactive`). Wrap them in **`storeToRefs(store)`** to get refs back. Actions are plain functions — those you *can* destructure directly." },
        { type: "callout", variant: "tip", text: "Prefer the setup-style store `defineStore(id, () => {...})` — it reads exactly like a composable and gives the best TS inference. The option-style `defineStore(id, { state, getters, actions })` is also supported if you like the Vuex-ish shape. Add `pinia-plugin-persistedstate` to persist a store to `localStorage`." }
      ]
    },
    {
      id: "async",
      title: "Async data, Suspense & fetching",
      level: "core",
      body: [
        { type: "p", text: "The simplest pattern is a composable that owns `data`/`error`/`loading` refs and fetches in `onMounted` or a `watch`. For coordinated loading UI, **`<Suspense>`** lets a component `await` in its `setup` and shows a fallback until it resolves." },
        { type: "code", lang: "ts", code: "// composables/useFetch.ts — a minimal typed fetcher\nimport { ref, watchEffect, toValue, type MaybeRefOrGetter } from \"vue\";\n\nexport function useFetch<T>(url: MaybeRefOrGetter<string>) {\n  const data = ref<T | null>(null);\n  const error = ref<unknown>(null);\n  const loading = ref(false);\n  watchEffect(async () => {              // refetch whenever url changes\n    loading.value = true; error.value = null;\n    try { data.value = await (await fetch(toValue(url))).json(); }\n    catch (e) { error.value = e; }\n    finally { loading.value = false; }\n  });\n  return { data, error, loading };\n}" },
        { type: "code", lang: "html", code: "<!-- Suspense: child uses top-level await in <script setup> -->\n<!-- Child.vue -->\n<script setup lang=\"ts\">\nconst res = await fetch(\"/api/user\");     // top-level await -> component is async\nconst user = await res.json();\n</script>\n<template><p>{{ user.name }}</p></template>\n\n<!-- Parent -->\n<template>\n  <Suspense>\n    <Child />\n    <template #fallback><p>Loading…</p></template>\n  </Suspense>\n</template>" },
        { type: "callout", variant: "warn", text: "`<Suspense>` is still marked **experimental** — the API can change. For error handling, pair it with an `onErrorCaptured` boundary (async setup errors bubble up). Many teams instead use **TanStack Query (Vue Query)** or **VueUse's `useAsyncState`/`useFetch`** for caching, retries, and dedup rather than raw `<Suspense>`." },
        { type: "callout", variant: "tip", text: "For real apps, reach for **@tanstack/vue-query** — caching, background refetch, mutations, and stale-while-revalidate — instead of hand-rolling loading state everywhere. For SSR data fetching, Nuxt's `useFetch`/`useAsyncData` handle server/client hydration for you (see Build & deploy)." }
      ]
    },
    {
      id: "builtins",
      title: "Built-ins: Teleport, Transition, KeepAlive, dynamic components",
      level: "core",
      body: [
        { type: "p", text: "Vue ships several built-in components for common UI needs — no import required in templates." },
        { type: "code", lang: "html", code: "<template>\n  <!-- Teleport: render this subtree elsewhere in the DOM (modals, toasts) -->\n  <Teleport to=\"body\">\n    <div v-if=\"open\" class=\"modal\">...</div>\n  </Teleport>\n\n  <!-- Transition: animate a single element entering/leaving -->\n  <Transition name=\"fade\">\n    <p v-if=\"show\">Hello</p>\n  </Transition>\n  <!-- CSS: .fade-enter-active/.fade-leave-active + .fade-enter-from/.fade-leave-to -->\n\n  <!-- TransitionGroup: animate list add/remove/reorder -->\n  <TransitionGroup name=\"list\" tag=\"ul\">\n    <li v-for=\"i in items\" :key=\"i.id\">{{ i.name }}</li>\n  </TransitionGroup>\n\n  <!-- dynamic component: swap by name/definition -->\n  <component :is=\"currentTab\" />\n\n  <!-- KeepAlive: cache toggled components instead of destroying them -->\n  <KeepAlive>\n    <component :is=\"currentTab\" />\n  </KeepAlive>\n</template>" },
        { type: "table", headers: ["Built-in", "Use for"], rows: [
          ["`<Teleport>`", "escape overflow/z-index by rendering to `body` — modals, tooltips, toasts"],
          ["`<Transition>`", "enter/leave animation for one element or component"],
          ["`<TransitionGroup>`", "animate items in a list (add/remove/move, with FLIP)"],
          ["`<KeepAlive>`", "preserve state of toggled components (`include`/`exclude`/`max`)"],
          ["`<component :is>`", "render a component chosen at runtime (tabs, wizards)"],
          ["`<Suspense>`", "coordinate async-setup loading fallbacks (experimental)"]
        ] },
        { type: "heading", text: "Custom directives" },
        { type: "p", text: "Beyond the built-in `v-` directives, you can define your own for low-level DOM access. In `<script setup>` a variable named `vX` is automatically usable as `v-x` in the template." },
        { type: "code", lang: "ts", code: "// v-focus: focus the element when it mounts\nconst vFocus = {\n  mounted: (el: HTMLElement) => el.focus(),\n};\n// template:  <input v-focus />  ->  auto-focused on mount" },
        { type: "callout", variant: "note", text: "A `<KeepAlive>`-cached component fires **`onActivated`/`onDeactivated`** instead of mount/unmount when toggled — put refetch/reset logic there, not in `onMounted`, or it will only run the first time." }
      ]
    },
    {
      id: "typescript",
      title: "TypeScript with Vue",
      level: "deep",
      body: [
        { type: "p", text: "Vue 3 is written in TypeScript and infers most things for you. Use `<script setup lang=\"ts\">`, type props/emits with generic macros, and let Volar/`vue-tsc` type-check templates. Component props, emits, slots, and even template expressions are checked end-to-end." },
        { type: "code", lang: "ts", code: "// typed props via an interface + generic components (3.3+)\ninterface Props<T> { items: T[]; selected?: T }\nconst props = defineProps<Props<string>>();\n\n// generic component: <script setup lang=\"ts\" generic=\"T\">\n// const props = defineProps<{ items: T[] }>();  // T inferred from usage\n\n// typing a ref explicitly\nconst el = ref<HTMLDivElement | null>(null);\nconst list = ref<string[]>([]);\n\n// PropType is only needed for the runtime (options) form:\nimport type { PropType } from \"vue\";\n// props: { cb: { type: Function as PropType<(n: number) => void> } }" },
        { type: "list", items: [
          "**Type props/emits with the generic form** (`defineProps<T>()`) — cleaner and better-inferred than the runtime object form. Use `withDefaults` (or reactive-props-destructure defaults in 3.5) for default values.",
          "**Generic components** (`<script setup lang=\"ts\" generic=\"T\">`) let a component be parameterized by a type inferred from its props — great for typed lists/tables/selects.",
          "**`vue-tsc`** type-checks `.vue` templates in CI (`vue-tsc --build`). Plain `tsc` ignores template expressions, so run `vue-tsc` for real coverage.",
          "**`InstanceType<typeof Comp>`** types a child component ref; `defineExpose` narrows what's public. `defineModel<T>()` and `defineSlots<...>()` are fully typed."
        ] },
        { type: "callout", variant: "tip", text: "`ref(0)` infers `Ref<number>`; give an explicit type when the initial value is narrower than what you'll assign (e.g. `ref<User | null>(null)`), or when starting from an empty array/object. `reactive()` also infers, but note it unwraps nested refs and can't be typed with a `Ref` inside." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "The create-vue default is **Vitest** (Vite-native, Jest-compatible API) plus **@vue/test-utils** for mounting and interacting with components. For higher-fidelity DOM behavior, **@testing-library/vue** wraps test-utils with user-centric queries. End-to-end tests use **Playwright** or **Cypress**." },
        { type: "code", lang: "ts", code: "// Counter.spec.ts — component test with Vitest + Vue Test Utils\nimport { mount } from \"@vue/test-utils\";\nimport { describe, it, expect } from \"vitest\";\nimport Counter from \"@/components/Counter.vue\";\n\ndescribe(\"Counter\", () => {\n  it(\"increments on click\", async () => {\n    const wrapper = mount(Counter, { props: { start: 5 } });\n    expect(wrapper.text()).toContain(\"5\");\n    await wrapper.find(\"button\").trigger(\"click\");   // await -> DOM updates\n    expect(wrapper.text()).toContain(\"6\");\n    expect(wrapper.emitted(\"change\")).toBeTruthy();  // assert emitted events\n  });\n});" },
        { type: "code", lang: "ts", code: "// testing a composable directly (no component needed)\nimport { useCounter } from \"@/composables/useCounter\";\nimport { expect, it } from \"vitest\";\n\nit(\"counts\", () => {\n  const { count, inc } = useCounter();\n  inc();\n  expect(count.value).toBe(1);\n});\n\n// Pinia in tests: createTestingPinia() stubs actions & lets you set state\n// mount(Comp, { global: { plugins: [createTestingPinia()] } })" },
        { type: "callout", variant: "gotcha", text: "DOM updates are **asynchronous** (batched on the next tick). After changing state or triggering an event, `await wrapper.vm.$nextTick()` (or `await` the `trigger`/`setValue` call, which flushes for you) before asserting — otherwise you assert against the old DOM." },
        { type: "callout", variant: "tip", text: "Prefer **@testing-library/vue** queries (`getByRole`, `getByText`) for tests that resemble how users interact and survive refactors, and reserve `@vue/test-utils` internals (`vm`, `emitted`, `find`) for when you need component-level detail. Use `createTestingPinia()` to isolate stores." }
      ]
    },
    {
      id: "deploy",
      title: "Build, deploy & Nuxt (SSR)",
      level: "deep",
      body: [
        { type: "p", text: "`npm run build` runs Vite to produce a static bundle in `dist/` — hashed JS/CSS you can host on any static host or CDN. Because a Vue SPA uses HTML5 history routing, the server must **fall back to `index.html`** for unknown paths so deep links work." },
        { type: "code", lang: "bash", code: "npm run build      # -> dist/ (static assets, code-split, minified)\nnpm run preview    # locally serve the production build to sanity-check\n\n# deploy dist/ to Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3+CDN, nginx, ...\n# SPA fallback (nginx):  try_files $uri $uri/ /index.html;" },
        { type: "list", items: [
          "**Base path:** if hosting under a sub-path, set `base` in `vite.config.ts` (and the router history base) so asset URLs resolve.",
          "**Env vars:** Vite exposes only variables prefixed **`VITE_`** to client code via `import.meta.env.VITE_X`. Everything else stays out of the bundle — but remember any client env var ships to the browser, so never put secrets there.",
          "**Code-splitting:** lazy-load routes with `() => import(...)` (shown in Routing) so the initial bundle stays small.",
          "**Analyze/optimize:** use `rollup-plugin-visualizer`, and Vite's `build.rollupOptions.output.manualChunks` to split large vendors."
        ] },
        { type: "callout", variant: "note", text: "**Nuxt** is the Vue meta-framework — like Next.js for React. It adds file-based routing, **SSR/SSG/hybrid rendering**, server API routes (Nitro), `useFetch`/`useAsyncData` with hydration, auto-imports, and SEO/`<head>` management. If you need server-side rendering, SEO on dynamic content, or a full-stack app, start with **Nuxt** rather than wiring SSR into a plain Vite SPA yourself." },
        { type: "callout", variant: "tip", text: "For head/meta management in a plain SPA (titles, OG tags), use **@unhead/vue** (`useHead`) — the same engine Nuxt uses. For component libraries, ship with Vite's library mode. For SSG-only marketing sites, **VitePress** (docs) or Nuxt's `nuxi generate` are the common choices." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "Vue's reactivity is powerful but has a handful of sharp edges that trip up almost everyone. Here are the ones that bite, each with the fix." },

        { type: "heading", text: "1. Forgetting `.value` on a ref" },
        { type: "p", text: "In `<script>`, a `ref` is a wrapper object — you read/write its `.value`. Forgetting it is the single most common Vue bug: `if (count)` is always truthy (a ref object is truthy), and `count + 1` gives `\"[object Object]1\"`. In the **template**, refs auto-unwrap, so there's no `.value` there — which makes the inconsistency easy to trip over." },
        { type: "code", lang: "ts", code: "const count = ref(0);\n// ❌ these operate on the wrapper, not the number\nif (count) { /* always true */ }\nconst n = count + 1;            // \"[object Object]1\"\n// ✅ use .value in JS\nif (count.value > 0) {}\ncount.value++;\n// (in <template> it's just {{ count }} — auto-unwrapped)" },

        { type: "heading", text: "2. Losing reactivity by destructuring reactive / props / stores" },
        { type: "p", text: "`reactive()` objects, `props`, and Pinia stores are **Proxies**. Destructuring them copies the *current* value out of the proxy, breaking the reactive link — the copy never updates. This is the #2 gotcha, and it shows up in three places." },
        { type: "code", lang: "ts", code: "const state = reactive({ n: 0 });\nconst { n } = state;            // ❌ n is a plain 0, frozen forever\nconst { n } = toRefs(state);    // ✅ n is a Ref, stays in sync\n\n// props: don't destructure pre-3.5; in 3.5 reactive-props-destructure is fine\n// store: use storeToRefs\nconst { count } = storeToRefs(useCounter());   // ✅\nconst { count } = useCounter();                // ❌ (state loses reactivity)" },
        { type: "callout", variant: "gotcha", text: "Rule of thumb: you can freely destructure **refs** and **actions/functions**, but never the reactive **state container** itself. Use `toRefs`/`toRef` for `reactive` objects and `storeToRefs` for Pinia stores. (Vue 3.5's reactive-props-destructure is a compiler special-case that rewrites the references — it only applies to `defineProps`.)" },

        { type: "heading", text: "3. Replacing a `reactive` object breaks reactivity" },
        { type: "code", lang: "ts", code: "let state = reactive({ items: [] });\nstate = reactive({ items: newItems });   // ❌ the template still tracks the OLD proxy\n// ✅ mutate in place, or use a ref you can reassign:\nObject.assign(state, { items: newItems });\n// or: const state = ref({ items: [] }); state.value = { items: newItems };  // ✅" },

        { type: "heading", text: "4. `v-for` + `v-if` on the same element" },
        { type: "callout", variant: "gotcha", text: "In Vue 3, `v-if` has **higher priority** than `v-for`, so `v-if` can't access the loop item and Vue warns. Fix by filtering the list in a `computed` (`activeItems`) and looping over that, or move `v-if` to an inner element inside a `<template v-for>` wrapper." },

        { type: "heading", text: "5. Missing or index-based `:key` in `v-for`" },
        { type: "callout", variant: "warn", text: "Always give `v-for` a **stable, unique `:key`** (an id), not the array index. Index keys cause wrong DOM reuse when the list reorders/filters — inputs keep stale values, component state leaks between rows, animations glitch. Use a real identity key." },

        { type: "heading", text: "6. Mutating props" },
        { type: "callout", variant: "gotcha", text: "Props are **read-only**. Assigning to a prop warns and gets overwritten on the next parent render. To adapt a prop locally, copy it into a `ref`/`computed`, or push changes up via an emitted event or `defineModel`. Note: mutating a nested object *inside* an object-typed prop won't warn but is still bad practice — it silently mutates the parent's state." },

        { type: "heading", text: "7. Reading a template ref too early" },
        { type: "callout", variant: "gotcha", text: "A `ref=\"el\"` / `useTemplateRef` is `null` until mount. Access it in `onMounted` (or after `await nextTick()`), never in `setup` body or a synchronous computed. For a child method, the child must `defineExpose({ ... })` first." },

        { type: "heading", text: "8. Deep watching cost & watch not firing" },
        { type: "p", text: "`watch(source, cb)` on a `reactive` object watches deeply by default; on a `ref` to an object it does **not** — pass `{ deep: true }`. But deep watching a large structure is expensive. Prefer watching a **getter** for the exact value you care about." },
        { type: "code", lang: "ts", code: "const form = ref({ name: \"\", age: 0 });\nwatch(form, save);                         // ❌ won't fire on form.value.name change\nwatch(form, save, { deep: true });         // ✅ but watches everything\nwatch(() => form.value.name, save);        // ✅ precise + cheap" },
        { type: "callout", variant: "tip", text: "Other quick fixes: use `nextTick()` to run code after the DOM updates from a state change; wrap large third-party objects you don't want made reactive in **`markRaw()`** (or `shallowRef`/`shallowReactive`) to avoid deep-proxy overhead; and give a route component a `:key` on the param so it remounts on `/users/1` → `/users/2`." }
      ]
    }
  ],

  packages: [
    { name: "vue", why: "core: reactivity, components, compiler, <script setup> macros" },
    { name: "vite + @vitejs/plugin-vue", why: "dev server + build; compiles .vue SFCs" },
    { name: "vue-router", why: "official SPA router (routes, params, nesting, guards)" },
    { name: "pinia", why: "official state management (stores, getters, actions)" },
    { name: "@vueuse/core", why: "200+ composables: storage, sensors, timers, network" },
    { name: "vue-tsc", why: "type-check .vue templates in CI (vue-tsc --build)" },
    { name: "vitest", why: "Vite-native unit/component test runner" },
    { name: "@vue/test-utils", why: "mount & interact with components in tests" },
    { name: "@testing-library/vue", why: "user-centric component testing queries" },
    { name: "@tanstack/vue-query", why: "server-state caching, refetch, mutations" },
    { name: "@unhead/vue", why: "manage document <head>/SEO in SPAs (useHead)" },
    { name: "vee-validate + zod", why: "form validation with schema (or FormKit)" },
    { name: "@vitejs/plugin-vue-jsx", why: "author components in JSX/TSX when preferred" },
    { name: "nuxt", why: "the Vue meta-framework for SSR/SSG/full-stack" },
    { name: "pinia-plugin-persistedstate", why: "persist Pinia stores to localStorage" },
    { name: "vue-i18n", why: "internationalization (messages, pluralization)" }
  ],

  gotchas: [
    "Forgetting `.value`: a `ref` in `<script>` is a wrapper — `if (count)` is always truthy and `count + 1` stringifies the object. Use `count.value`. (Templates auto-unwrap.)",
    "Destructuring a `reactive()` object, `props`, or a Pinia store **loses reactivity** — the copy is a frozen snapshot. Use `toRefs`/`toRef`, or `storeToRefs()` for stores.",
    "Reassigning a `reactive` variable (`state = reactive(...)`) breaks tracking — the template still watches the old proxy. Mutate in place (`Object.assign`) or use a `ref` you can reassign.",
    "`ref` vs `reactive`: `reactive` only works on objects and can't be reassigned or destructured. Default to `ref` everywhere to avoid the footguns.",
    "**Never put `v-if` and `v-for` on the same element** — `v-if` wins priority and can't see the loop var. Filter in a `computed`, or use a `<template v-for>` wrapper.",
    "Always use a **stable, unique `:key`** in `v-for` (an id, not the array index) or the DOM reuses the wrong nodes on reorder/filter.",
    "**Props are read-only** — mutating one warns and is overwritten on re-render. Copy to local state, or emit an event / use `defineModel`.",
    "Template refs (`useTemplateRef` / `ref=\"x\"`) are `null` until mount — read them in `onMounted`, and `defineExpose` a child's methods to reach them.",
    "`watch` on a `ref`-to-object needs `{ deep: true }`; deep watching is costly — prefer watching a getter for the exact value.",
    "A route that only changes its **param** reuses the component (no re-`onMounted`) — `watch(() => route.params.id)` or key the component to refetch.",
    "**`v-html` is an XSS vector** — only render trusted/sanitized HTML; never user input.",
    "DOM updates are async (batched) — after changing state, `await nextTick()` before measuring/reading the DOM (and in tests before asserting).",
    "`defineProps`/`defineEmits`/`defineModel` are **compiler macros** — don't import them, and don't reference outside-scope variables in their type argument.",
    "Making a huge third-party object reactive is slow — use `markRaw()`/`shallowRef`/`shallowReactive` for non-reactive or large data.",
    "Only `VITE_`-prefixed env vars reach client code (`import.meta.env.VITE_X`) — and they ship in the bundle, so keep real secrets server-side (Nuxt/API).",
    "`<Suspense>` is still experimental — for production data fetching, prefer Vue Query or VueUse rather than relying on it."
  ],

  flashcards: [
    { q: "What's the difference between `ref()` and `reactive()`?", a: "`ref()` wraps any value (accessed via `.value` in JS, auto-unwrapped in templates) and can be reassigned. `reactive()` deep-proxies an object (direct property access, no `.value`) but only works on objects and breaks if reassigned or destructured. Default to `ref`." },
    { q: "Why does destructuring a reactive object lose reactivity?", a: "It's a Proxy — destructuring copies the current value out and severs the tracking link. Use `toRefs(obj)`/`toRef(obj,'k')` (or `storeToRefs()` for Pinia) to get refs that stay in sync." },
    { q: "What is `<script setup>`?", a: "Compile-time sugar for the Composition API: every top-level binding (imports, vars, functions, components) is auto-exposed to the template — no `return`. It also enables the `defineProps`/`defineEmits`/`defineModel` macros." },
    { q: "How do you declare props and emits in `<script setup>` with TS?", a: "`const props = defineProps<{...}>()` and `const emit = defineEmits<{ click: [id: number] }>()`. Defaults via `withDefaults(...)` or (3.5) reactive-props-destructure with inline defaults." },
    { q: "What does `defineModel()` do?", a: "Creates a two-way binding for `v-model` on a component (stable in 3.4). It returns a ref synced with the parent's `v-model` — replacing the manual `modelValue` prop + `update:modelValue` emit. Named models: `defineModel('count')`." },
    { q: "computed vs watch vs watchEffect?", a: "`computed` = cached derived *value*. `watch(src, cb)` = run a side effect on change of a specific source (lazy, gives old+new). `watchEffect(fn)` = run now and re-run when any read reactive changes (auto-tracked, no old value)." },
    { q: "What is a composable?", a: "A `useX()` function that packages reusable stateful reactive logic with the Composition API — creates refs, wires watchers/lifecycle, returns reactive state. Return refs (not `.value`) so callers keep reactivity. Replaces Vue 2 mixins." },
    { q: "How do you share state without prop-drilling?", a: "`provide(key, value)` in an ancestor and `inject(key, default)` in any descendant — provide a `ref`/`reactive` (optionally `readonly`) to keep it reactive. For app-wide state, use a Pinia store." },
    { q: "Why shouldn't `v-if` and `v-for` be on the same element?", a: "In Vue 3 `v-if` has higher priority and evaluates before the loop, so it can't read the loop variable. Filter in a `computed` or wrap the loop in `<template v-for>` with `v-if` on the inner element." },
    { q: "How do you access a DOM element or child component?", a: "A template ref: `useTemplateRef('name')` (3.5+) matched to `ref=\"name\"`. It's `null` until mount — read it in `onMounted`. A child must `defineExpose({...})` to make methods reachable." },
    { q: "How do you handle a route whose param changes but component is reused?", a: "Vue reuses the instance, so `onMounted` doesn't re-run. `watch(() => route.params.id, refetch)` or add a `:key` bound to the param to force a remount." },
    { q: "Why must you use `storeToRefs` with Pinia?", a: "Destructuring a store copies state/getters out of its Proxy and loses reactivity. `storeToRefs(store)` returns refs for state & getters; actions are plain functions you can destructure directly." },
    { q: "What is `<Suspense>` for?", a: "Coordinating async setup: a child with a top-level `await` (or async setup) suspends, and `<Suspense>` shows a `#fallback` until it resolves. Still experimental — many use Vue Query/VueUse instead." },
    { q: "When do you need `nextTick()`?", a: "DOM updates are batched asynchronously after state changes; `await nextTick()` waits until the DOM reflects the new state — needed to measure/read the DOM or in tests before asserting." },
    { q: "What's the modern scaffolding command for Vue?", a: "`npm create vue@latest` (create-vue) — sets up a Vite build with optional TypeScript, Vue Router, Pinia, ESLint, and Vitest." },
    { q: "How is Nuxt related to Vue?", a: "Nuxt is the official Vue meta-framework (like Next.js for React): file-based routing, SSR/SSG/hybrid rendering, server API routes, hydrated data fetching, and SEO. Use it when you need server rendering or full-stack." }
  ],

  cheatsheet: [
    { label: "New project", code: "npm create vue@latest" },
    { label: "Dev server", code: "npm run dev" },
    { label: "Ref / reactive", code: "const n = ref(0); const s = reactive({});" },
    { label: "Computed", code: "const d = computed(() => n.value * 2)" },
    { label: "Watch", code: "watch(() => s.x, (v, o) => {}, { deep: true })" },
    { label: "Props (TS)", code: "const { x = 1 } = defineProps<{ x?: number }>()" },
    { label: "Emit (TS)", code: "const emit = defineEmits<{ save: [id: number] }>()" },
    { label: "v-model on comp", code: "const model = defineModel<string>()" },
    { label: "Template ref", code: "const el = useTemplateRef('el')  // ref=\"el\"" },
    { label: "Provide / inject", code: "provide('k', v);  const v = inject('k')" },
    { label: "Route param", code: "const r = useRoute(); r.params.id" },
    { label: "Navigate", code: "useRouter().push({ name: 'user', params: { id } })" },
    { label: "Pinia store", code: "const s = useStore(); const { x } = storeToRefs(s)" },
    { label: "List", code: "<li v-for=\"i in items\" :key=\"i.id\">" },
    { label: "Teleport modal", code: "<Teleport to=\"body\">...</Teleport>" },
    { label: "Build", code: "npm run build   # -> dist/" }
  ]
});
