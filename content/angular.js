(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "angular",
  name: "Angular",
  language: "TypeScript",
  group: "Web UI (JS / TS)",
  navLabel: "Angular",
  color: "#dd0031",
  readMinutes: 30,
  tagline: "A **batteries-included** TypeScript framework — standalone components, **signals**, the new `@if`/`@for` control flow, DI, RxJS, and a full CLI.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "Angular is Google's **batteries-included** framework for building web apps: components + a template language, dependency injection, a router, an HTTP client, forms, testing, and a first-class CLI — all maintained together in one versioned release train. You write **TypeScript**; the compiler (`ngc`, ahead-of-time) turns your components and templates into optimized JS. Unlike a library you assemble yourself, Angular gives you an opinionated, cohesive stack." },
        { type: "callout", variant: "warn", text: "**This guide covers *modern* Angular (v2+, currently v20/v21)** — the TypeScript, component-based framework often just called \"Angular\". It is **NOT AngularJS (1.x)**, a completely different, **end-of-life** framework (`$scope`, `ng-controller`, `angular.module`, `.js` script tag). If a tutorial uses `$scope` or `angular.module(...)`, it's the legacy one — ignore it. Modern Angular releases a major version roughly every 6 months (v20 = mid-2025, v21 = late 2025)." },
        { type: "list", items: [
          "**Reach for it when:** you want a complete, opinionated stack for a large/long-lived app, strong TypeScript integration, and a team that benefits from consistent conventions and tooling.",
          "**Mental model (modern):** a tree of **standalone components**, each a class + template. State lives in **signals** (reactive values); the template re-renders the parts that read a changed signal. Cross-cutting logic lives in **injectable services** pulled in via **dependency injection**.",
          "**Two eras of idioms live side by side.** New code uses standalone components, `signal()`, `input()`/`output()`, the `@if`/`@for` control flow, and functional providers. Older code uses `NgModule`, `@Input`/`@Output`, `*ngIf`/`*ngFor`, and class-based providers. This deck teaches the modern way and flags the legacy equivalent."
        ] },
        { type: "table", headers: ["Concept", "React analog", "Angular (modern)"], rows: [
          ["Reactive state", "`useState`", "`signal(0)`"],
          ["Derived value", "`useMemo`", "`computed(() => ...)`"],
          ["Side effect", "`useEffect`", "`effect(() => ...)`"],
          ["Component input", "prop", "`input()` / `@Input()`"],
          ["Shared logic", "custom hook / context", "**injectable service** (DI)"],
          ["Async streams", "—", "**RxJS** `Observable`"],
          ["Data fetching", "fetch / React Query", "`HttpClient` (returns Observables)"]
        ] },
        { type: "callout", variant: "note", text: "Angular has **two reactivity systems** and you'll use both: **signals** (synchronous reactive values, the new default for component state) and **RxJS** (Observables, for async streams, HTTP, and events). `toSignal()`/`toObservable()` bridge them. Don't fight it — signals for local UI state, RxJS where you have a stream over time." }
      ]
    },
    {
      id: "setup",
      title: "Setup, the CLI & project structure",
      level: "core",
      body: [
        { type: "p", text: "The **Angular CLI** (`ng`) scaffolds, builds, serves, tests and updates your app. Modern builds use the **application builder** (`@angular/build`) powered by **esbuild** for production and **Vite** for the dev server — a big speedup over the old webpack builder." },
        { type: "code", lang: "bash", code: "npm install -g @angular/cli        # the `ng` command\nng new my-app                      # scaffold (prompts: routing? CSS/SCSS?)\ncd my-app\nng serve                           # dev server -> http://localhost:4200 (Vite)\nng build                           # production build -> dist/ (esbuild, AOT, minified)\n\n# generate boilerplate (schematics)\nng generate component features/user     # or: ng g c features/user\nng g service core/auth\nng g directive shared/highlight\nng g pipe shared/truncate\nng g guard core/auth\n\nng update                          # migrate to the next major (runs codemods)\nng add @angular/material           # install + configure a library" },
        { type: "code", lang: "text", code: "src/\n  main.ts               // bootstrapApplication(App, appConfig) — the entry point\n  index.html            // the single host page (<app-root>)\n  styles.scss           // global styles\n  app/\n    app.ts              // root standalone component (class App)\n    app.html            // its template\n    app.config.ts       // appConfig: providers (router, http, ...)\n    app.routes.ts       // route table\n    core/               // singletons: services, guards, interceptors\n    shared/             // reusable components/pipes/directives\n    features/           // feature areas (lazy-loaded)\nangular.json            // workspace/build config\ntsconfig.json           // strict TypeScript by default" },
        { type: "code", lang: "ts", code: "// main.ts — modern standalone bootstrap (no root NgModule)\nimport { bootstrapApplication } from \"@angular/platform-browser\";\nimport { App } from \"./app/app\";\nimport { appConfig } from \"./app/app.config\";\n\nbootstrapApplication(App, appConfig)\n  .catch((err) => console.error(err));" },
        { type: "code", lang: "ts", code: "// app.config.ts — application-wide providers live here\nimport { ApplicationConfig } from \"@angular/core\";\nimport { provideRouter } from \"@angular/router\";\nimport { provideHttpClient, withInterceptors } from \"@angular/common/http\";\nimport { routes } from \"./app.routes\";\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideRouter(routes),\n    provideHttpClient(),\n  ],\n};" },
        { type: "callout", variant: "tip", text: "`ng update` is the killer feature for longevity: it runs **automated migrations** (codemods) that rewrite your code across major versions — e.g. converting `*ngIf` to `@if`, or NgModules to standalone. Always upgrade one major at a time and commit first." }
      ]
    },
    {
      id: "components",
      title: "Components & anatomy",
      level: "core",
      body: [
        { type: "p", text: "A component is a TypeScript **class** decorated with **`@Component`**, pairing logic with a template and styles. Since **v19, components are standalone by default** — no `NgModule` needed. You list what a component uses directly in its `imports` array (other components, directives, pipes)." },
        { type: "code", lang: "ts", code: "import { Component, signal } from \"@angular/core\";\nimport { CommonModule } from \"@angular/common\";\n\n@Component({\n  selector: \"app-counter\",        // used as <app-counter> in other templates\n  imports: [CommonModule],        // standalone: bring in what the template needs\n  template: `\n    <button (click)=\"inc()\">Count: {{ count() }}</button>\n  `,\n  styles: [\":host { display: inline-block; }\"],\n})\nexport class Counter {\n  count = signal(0);\n  inc() { this.count.update((n) => n + 1); }\n}" },
        { type: "code", lang: "ts", code: "// external template + styles (common for larger components)\n@Component({\n  selector: \"app-user\",\n  templateUrl: \"./user.html\",\n  styleUrls: [\"./user.scss\"],     // component styles are SCOPED by default\n})\nexport class User { /* ... */ }" },
        { type: "table", headers: ["@Component option", "What it does"], rows: [
          ["`selector`", "the tag/attribute the component matches (`app-*` by convention)"],
          ["`template` / `templateUrl`", "inline template string vs external `.html` file"],
          ["`styles` / `styleUrls`", "inline vs external styles, **scoped to this component**"],
          ["`imports`", "standalone deps: components, directives, pipes it uses"],
          ["`changeDetection`", "`OnPush` for performance (see change detection)"],
          ["`encapsulation`", "how styles are scoped (`Emulated` default)"],
          ["`host`", "bind classes/attrs/listeners on the component's own element"]
        ] },
        { type: "heading", text: "View encapsulation" },
        { type: "p", text: "By default (`ViewEncapsulation.Emulated`) Angular rewrites your component CSS with generated attributes so styles **don't leak** to other components. `ShadowDom` uses real Shadow DOM; `None` disables scoping (styles become global — use sparingly)." },
        { type: "code", lang: "ts", code: "import { ViewEncapsulation } from \"@angular/core\";\n@Component({\n  selector: \"app-card\",\n  encapsulation: ViewEncapsulation.Emulated,   // default; None | ShadowDom also exist\n  styles: [\".title { color: rebeccapurple; }\"], // only affects THIS component\n  template: `<h2 class=\"title\">Scoped</h2>`,\n})\nexport class Card {}" },
        { type: "callout", variant: "tip", text: "Style the component's own host element with the **`:host`** selector, and pierce into child components deliberately with **`::ng-deep`** (deprecated but still used) — prefer passing CSS custom properties (variables) across component boundaries instead." }
      ]
    },
    {
      id: "templates",
      title: "Templates & data binding",
      level: "core",
      body: [
        { type: "p", text: "Angular templates are HTML plus binding syntax. There are four binding forms, distinguished by punctuation — memorize the brackets and you've learned most of the template language." },
        { type: "table", headers: ["Binding", "Syntax", "Direction"], rows: [
          ["Interpolation", "`{{ expr }}`", "class -> text"],
          ["Property binding", "`[prop]=\"expr\"`", "class -> element property"],
          ["Event binding", "`(event)=\"handler($event)\"`", "element -> class"],
          ["Two-way binding", "`[(ngModel)]=\"value\"`", "both (needs `FormsModule`)"]
        ] },
        { type: "code", lang: "html", code: "<!-- interpolation: renders a value as text -->\n<h1>Hello {{ name() }}</h1>\n\n<!-- property binding: set a DOM property / component input -->\n<img [src]=\"avatarUrl()\" [alt]=\"name()\" />\n<button [disabled]=\"loading()\">Save</button>\n\n<!-- attribute binding (no matching DOM prop): use attr. -->\n<td [attr.colspan]=\"span()\">cell</td>\n\n<!-- event binding: $event is the DOM event (or emitted value) -->\n<input (input)=\"onType($event)\" (keyup.enter)=\"submit()\" />\n\n<!-- two-way binding on a form control -->\n<input [(ngModel)]=\"query\" />\n\n<!-- template reference variable (#ref) -->\n<input #box (keyup)=\"log(box.value)\" />" },
        { type: "callout", variant: "note", text: "`[(x)]=\"v\"` (\"banana in a box\") is sugar for `[x]=\"v\"` + `(xChange)=\"v = $event\"`. Any component exposing an `x` input and an `xChange` output (or a `model()` signal — see below) supports it, not just `ngModel`." },
        { type: "callout", variant: "gotcha", text: "Template expressions are **not full JavaScript**: no `new`, no assignments (except in event handlers), no `||=`-style operators. Keep logic in the component class and expose a method or `computed()` — templates should read, not compute heavily." }
      ]
    },
    {
      id: "control-flow",
      title: "Built-in control flow: @if / @for / @switch / @defer",
      level: "core",
      body: [
        { type: "p", text: "Since v17, Angular has **built-in block control flow** baked into the template compiler — `@if`, `@for`, `@switch`, `@defer`. It replaces the old structural directives `*ngIf`/`*ngFor`/`*ngSwitch`: it's faster, needs no imports, and has cleaner syntax. `ng update` migrates the old form automatically." },
        { type: "code", lang: "html", code: "<!-- @if / @else if / @else -->\n@if (user()) {\n  <p>Welcome, {{ user()!.name }}</p>\n} @else if (loading()) {\n  <p>Loading...</p>\n} @else {\n  <a routerLink=\"/login\">Sign in</a>\n}\n\n<!-- bind the truthy value to a local (the async-pipe/optional pattern) -->\n@if (user(); as u) {\n  <p>{{ u.email }}</p>\n}" },
        { type: "code", lang: "html", code: "<!-- @for REQUIRES a track expression (identity for efficient diffing) -->\n@for (item of items(); track item.id) {\n  <li>{{ item.name }}</li>\n} @empty {\n  <li>No items yet.</li>\n}\n\n<!-- contextual variables: $index, $count, $first, $last, $even, $odd -->\n@for (row of rows(); track row.id; let i = $index) {\n  <tr [class.alt]=\"$even\">{{ i + 1 }}. {{ row.label }}</tr>\n}" },
        { type: "code", lang: "html", code: "<!-- @switch -->\n@switch (status()) {\n  @case (\"active\")  { <span class=\"ok\">Active</span> }\n  @case (\"pending\") { <span class=\"warn\">Pending</span> }\n  @default          { <span>Unknown</span> }\n}" },
        { type: "heading", text: "@defer — lazy-load part of a template" },
        { type: "p", text: "`@defer` lazily loads its content (and its component's JS chunk) only when a trigger fires — on idle, on viewport, on interaction, on a timer. Great for below-the-fold or heavy widgets; it splits them out of the initial bundle automatically." },
        { type: "code", lang: "html", code: "@defer (on viewport) {\n  <app-heavy-chart [data]=\"data()\" />\n} @placeholder {\n  <div class=\"skeleton\">Chart loading area</div>\n} @loading (after 100ms; minimum 500ms) {\n  <app-spinner />\n} @error {\n  <p>Failed to load.</p>\n}\n\n<!-- triggers: on idle | on viewport | on interaction | on hover | on timer(2s) | when cond() -->" },
        { type: "callout", variant: "warn", text: "**`track` is mandatory in `@for`** and choosing it wrong is the classic performance/bug trap: track a **stable unique id**, not `$index` (unless the list is append-only and never reordered). Tracking by object identity when you replace objects on every fetch destroys and rebuilds every row." }
      ]
    },
    {
      id: "signals",
      title: "Signals: the modern reactivity",
      level: "core",
      body: [
        { type: "p", text: "A **signal** is a reactive value wrapped in a getter. Read it by **calling it** (`count()`); when it changes, Angular re-renders exactly the template bits that read it. Signals are the recommended way to hold component state in modern Angular — synchronous, granular, and (in zoneless mode) the change-detection trigger." },
        { type: "code", lang: "ts", code: "import { signal, computed, effect } from \"@angular/core\";\n\nconst count = signal(0);          // WritableSignal<number>\ncount();                          // READ (call it) -> 0\ncount.set(5);                     // replace\ncount.update((n) => n + 1);       // derive from current -> 6\n\n// computed: cached derived signal, recalculated lazily when deps change\nconst doubled = computed(() => count() * 2);\ndoubled();                        // 12\n\n// effect: runs a side effect whenever a signal it reads changes\neffect(() => {\n  console.log(\"count is now\", count());   // re-runs on every change\n});" },
        { type: "table", headers: ["API", "Purpose"], rows: [
          ["`signal(v)`", "writable reactive value; `.set()` / `.update()`"],
          ["`computed(fn)`", "cached derived signal; auto-tracks its dependencies"],
          ["`effect(fn)`", "side effect that re-runs when read signals change"],
          ["`linkedSignal(fn)`", "writable signal that also resets when a source changes (v19)"],
          ["`toSignal(obs$)`", "convert an Observable to a signal (`@angular/core/rxjs-interop`)"],
          ["`toObservable(sig)`", "convert a signal to an Observable"],
          ["`untracked(fn)`", "read a signal inside effect/computed WITHOUT subscribing to it"]
        ] },
        { type: "code", lang: "ts", code: "import { linkedSignal } from \"@angular/core\";\n\n// linkedSignal: user-editable, but re-derives when the source list changes\nconst options = signal([\"a\", \"b\", \"c\"]);\nconst selected = linkedSignal(() => options()[0]);   // resets to first when options change\nselected.set(\"b\");                                    // still user-writable" },
        { type: "code", lang: "ts", code: "import { toSignal } from \"@angular/core/rxjs-interop\";\n\n// bridge RxJS -> signals: read HTTP/stream data as a signal in the template\nprivate http = inject(HttpClient);\nusers = toSignal(this.http.get<User[]>(\"/api/users\"), { initialValue: [] });\n// template: @for (u of users(); track u.id) { ... }" },
        { type: "callout", variant: "gotcha", text: "**Read a signal by calling it** — `count()`, not `count`. Writing `{{ count }}` (no parens) renders the signal *function*, not its value — a very common first-day mistake. Same in `computed`/`effect`: you must *call* the signal to create a dependency." },
        { type: "callout", variant: "note", text: "`effect()` runs in an injection context (constructor or field initializer). It auto-cleans up when the component is destroyed. In v20 you can freely `.set()` other signals inside an effect; the old `allowSignalWrites` flag is gone. Prefer `computed()` over `effect()` for deriving values — effects are for I/O side effects, not state derivation." }
      ]
    },
    {
      id: "inputs-outputs",
      title: "Inputs & outputs (props & events)",
      level: "core",
      body: [
        { type: "p", text: "Components communicate via **inputs** (parent -> child data) and **outputs** (child -> parent events). Modern Angular has **signal-based** `input()` / `output()` / `model()`; the older decorator forms `@Input()` / `@Output()` still work and appear everywhere in existing code." },
        { type: "code", lang: "ts", code: "import { Component, input, output, model } from \"@angular/core\";\n\n@Component({\n  selector: \"app-rating\",\n  template: `\n    <span>{{ label() }}: {{ value() }}</span>\n    <button (click)=\"bump()\">+</button>\n  `,\n})\nexport class Rating {\n  // signal inputs — read like signals: label()\n  label = input(\"Rating\");                 // optional, with default\n  max = input.required<number>();          // required (compile-time enforced)\n  disabled = input(false, { transform: booleanAttribute });  // coerce attr\n\n  // signal output — emit an event\n  changed = output<number>();\n\n  // model(): two-way bindable input+output in one ([(value)])\n  value = model(0);\n\n  bump() {\n    this.value.update((v) => v + 1);       // updates the parent binding\n    this.changed.emit(this.value());       // also fire the event\n  }\n}" },
        { type: "code", lang: "html", code: "<!-- parent template -->\n<app-rating\n  [label]=\"'Stars'\"\n  [max]=\"5\"\n  [(value)]=\"score\"           \n  (changed)=\"onChange($event)\"\n/>" },
        { type: "code", lang: "ts", code: "// legacy decorator form — still valid, you'll see it a lot\nimport { Input, Output, EventEmitter } from \"@angular/core\";\nexport class OldRating {\n  @Input() label = \"Rating\";              // read as plain property: this.label\n  @Input({ required: true }) max!: number;\n  @Output() changed = new EventEmitter<number>();\n}" },
        { type: "table", headers: ["Modern (signal)", "Legacy (decorator)", "Note"], rows: [
          ["`input(default)`", "`@Input()`", "read via `x()` vs `this.x`"],
          ["`input.required<T>()`", "`@Input({ required: true })`", "compiler errors if omitted"],
          ["`output<T>()`", "`@Output() = new EventEmitter<T>()`", "`.emit(v)` on both"],
          ["`model<T>()`", "`@Input()` + `@Output() xChange`", "enables `[(x)]` two-way"]
        ] },
        { type: "callout", variant: "tip", text: "Prefer **signal inputs** in new components: they're readable in `computed()`/`effect()` directly (a `@Input` setter can't be), they support `transform` and `required` cleanly, and they remove a whole class of `ngOnChanges` boilerplate. `model()` is the clean way to build a two-way-bindable custom control." }
      ]
    },
    {
      id: "directives",
      title: "Directives (structural & attribute)",
      level: "core",
      body: [
        { type: "p", text: "A **directive** adds behavior to an element without being a full component (no template of its own). Two flavors: **attribute directives** change appearance/behavior (`ngClass`, `ngStyle`, custom), and **structural directives** change the DOM structure (`*ngIf`, `*ngFor` — now largely superseded by `@if`/`@for`)." },
        { type: "code", lang: "html", code: "<!-- built-in attribute directives -->\n<div [ngClass]=\"{ active: isActive(), disabled: !enabled() }\">...</div>\n<div [ngStyle]=\"{ color: color(), 'font-size.px': size() }\">...</div>\n\n<!-- often simpler with dedicated bindings: -->\n<div [class.active]=\"isActive()\" [style.color]=\"color()\">...</div>" },
        { type: "code", lang: "ts", code: "// a custom attribute directive: highlight on hover\nimport { Directive, ElementRef, inject, HostListener, input } from \"@angular/core\";\n\n@Directive({ selector: \"[appHighlight]\" })   // matches attribute appHighlight\nexport class Highlight {\n  private el = inject(ElementRef);\n  color = input(\"yellow\", { alias: \"appHighlight\" });\n\n  @HostListener(\"mouseenter\") onEnter() { this.set(this.color()); }\n  @HostListener(\"mouseleave\") onLeave() { this.set(\"\"); }\n  private set(c: string) { this.el.nativeElement.style.backgroundColor = c; }\n}\n// usage: <p [appHighlight]=\"'pink'\">hover me</p>" },
        { type: "callout", variant: "note", text: "**Directive composition (`hostDirectives`)** lets a component/directive apply other directives to its host, composing behavior without inheritance — the modern alternative to base classes for sharing host behavior." },
        { type: "callout", variant: "gotcha", text: "You can only apply **one structural directive per element** — you can't put `*ngIf` and `*ngFor` on the same tag. Historically you nested an `<ng-container>`; with the new `@if`/`@for` blocks this pain largely disappears since blocks wrap freely." }
      ]
    },
    {
      id: "pipes",
      title: "Pipes (template transforms)",
      level: "core",
      body: [
        { type: "p", text: "A **pipe** transforms a value in the template with the `|` operator — formatting dates, numbers, currency, slicing, etc. Built-ins live in `CommonModule` (or import the standalone pipe directly). The **`async` pipe** is special: it subscribes to an Observable/Promise and auto-unsubscribes." },
        { type: "code", lang: "html", code: "{{ price | currency:\"USD\" }}                <!-- $12.50 -->\n{{ today | date:\"mediumDate\" }}             <!-- Jul 8, 2026 -->\n{{ ratio | percent:\"1.0-2\" }}               <!-- 42% -->\n{{ name | uppercase }}   {{ big | number:\"1.0-0\" }}\n{{ items | slice:0:3 }}   {{ obj | json }}\n\n<!-- async pipe: subscribe to an Observable, unwrap latest value, auto-cleanup -->\n@if (user$ | async; as user) {\n  <p>{{ user.name }}</p>\n}" },
        { type: "code", lang: "ts", code: "// custom pipe\nimport { Pipe, PipeTransform } from \"@angular/core\";\n\n@Pipe({ name: \"truncate\" })          // standalone by default\nexport class Truncate implements PipeTransform {\n  transform(value: string, limit = 20, tail = \"...\"): string {\n    return value.length > limit ? value.slice(0, limit) + tail : value;\n  }\n}\n// template: {{ description | truncate:50 }}  (after adding Truncate to imports)" },
        { type: "callout", variant: "tip", text: "Pipes are **pure by default** — recomputed only when the input reference changes, which is efficient. If your pipe must react to internal mutations, set `pure: false`, but that's rare and can hurt performance. For most derived values a **`computed()` signal** is cleaner than an impure pipe." },
        { type: "callout", variant: "note", text: "With signals you often don't need the `async` pipe anymore: `toSignal(obs$)` gives you a signal you read as `user()`. But `async` is still handy for one-off Observables straight in the template." }
      ]
    },
    {
      id: "di-services",
      title: "Dependency injection & services",
      level: "core",
      body: [
        { type: "p", text: "**Dependency injection (DI)** is core to Angular. Shared logic (data access, auth, state) goes in **services** — plain classes marked `@Injectable`. Components ask for them and Angular's injector supplies a singleton. This decouples wiring from usage and makes testing trivial (swap the provider)." },
        { type: "code", lang: "ts", code: "import { Injectable, inject, signal } from \"@angular/core\";\nimport { HttpClient } from \"@angular/common/http\";\n\n@Injectable({ providedIn: \"root\" })   // one app-wide singleton, tree-shakable\nexport class UserService {\n  private http = inject(HttpClient);   // modern: inject() instead of constructor params\n  readonly current = signal<User | null>(null);\n\n  load(id: number) {\n    this.http.get<User>(`/api/users/${id}`)\n      .subscribe((u) => this.current.set(u));\n  }\n}" },
        { type: "code", lang: "ts", code: "// consume it — two equivalent styles\nimport { Component, inject } from \"@angular/core\";\n\n@Component({ /* ... */ })\nexport class Profile {\n  // modern: the inject() function (works in fields, functions, guards)\n  private users = inject(UserService);\n\n  // classic: constructor injection (still fully supported)\n  // constructor(private users: UserService) {}\n}" },
        { type: "table", headers: ["providedIn / scope", "Meaning"], rows: [
          ["`providedIn: \"root\"`", "one singleton for the whole app (most common)"],
          ["provided in a route's `providers`", "one instance per lazy-loaded feature"],
          ["`providers: [X]` in a component", "a new instance per component instance"],
          ["`useClass` / `useValue` / `useFactory`", "swap the implementation (great for tests/config)"],
          ["`InjectionToken<T>`", "inject non-class values (config objects, strings)"]
        ] },
        { type: "callout", variant: "tip", text: "`providedIn: \"root\"` services are **tree-shakable** — if nothing injects the service, it's dropped from the bundle. Prefer it over registering services in a module/`providers` array unless you specifically need a narrower scope." },
        { type: "callout", variant: "gotcha", text: "`inject()` must run in an **injection context** — a constructor, a field initializer, a factory, or inside `runInInjectionContext`. Calling it later (e.g. in a click handler or a `setTimeout`) throws `NG0203`. Inject at construction, store the reference." }
      ]
    },
    {
      id: "rxjs",
      title: "RxJS essentials (as used in Angular)",
      level: "core",
      body: [
        { type: "p", text: "Angular leans on **RxJS** for anything asynchronous over time: HTTP, router events, form value changes, and custom event streams. An **Observable** is a lazy stream you **subscribe** to; **operators** (piped) transform it. You don't need all of RxJS — a dozen operators cover most app code." },
        { type: "code", lang: "ts", code: "import { of, from, interval, fromEvent } from \"rxjs\";\nimport { map, filter, debounceTime, distinctUntilChanged,\n         switchMap, catchError, takeUntil, startWith } from \"rxjs/operators\";\n\n// typeahead search: debounce input, cancel stale requests with switchMap\nthis.searchControl.valueChanges.pipe(\n  debounceTime(300),\n  distinctUntilChanged(),\n  switchMap((term) => this.api.search(term)),   // switchMap cancels the previous request\n  catchError(() => of([])),                     // recover to a safe value\n).subscribe((results) => this.results.set(results));" },
        { type: "table", headers: ["Operator", "Use for"], rows: [
          ["`map` / `filter`", "transform / drop values"],
          ["`switchMap`", "flatten + **cancel** previous inner stream (typeahead, latest-wins)"],
          ["`mergeMap` / `concatMap`", "flatten keeping all / in order"],
          ["`debounceTime` / `throttleTime`", "rate-limit fast emissions"],
          ["`distinctUntilChanged`", "skip repeated identical values"],
          ["`combineLatest` / `forkJoin`", "combine streams / wait for all to complete"],
          ["`catchError` / `retry`", "error recovery"],
          ["`takeUntil` / `take`", "complete a subscription on a signal / after N"]
        ] },
        { type: "code", lang: "ts", code: "// the MODERN way to auto-unsubscribe: takeUntilDestroyed()\nimport { takeUntilDestroyed } from \"@angular/core/rxjs-interop\";\nimport { inject, DestroyRef } from \"@angular/core\";\n\nexport class Ticker {\n  constructor() {\n    interval(1000).pipe(\n      takeUntilDestroyed(),        // completes when the component is destroyed\n    ).subscribe((n) => console.log(n));\n  }\n}" },
        { type: "callout", variant: "gotcha", text: "**Manual subscriptions leak** if you don't unsubscribe. Fixes, best first: (1) the **`async` pipe** / `toSignal()` (unsubscribe for free), (2) **`takeUntilDestroyed()`**, (3) store `Subscription` and unsubscribe in `ngOnDestroy`. Never leave a bare `.subscribe()` on a long-lived stream." },
        { type: "callout", variant: "warn", text: "Observables are **lazy**: nothing runs until you subscribe (an `HttpClient` call with no subscriber sends **no request**). And they can emit many times — use `switchMap` (not `map`) when the value is itself an Observable, or you'll get a stream-of-streams." }
      ]
    },
    {
      id: "http",
      title: "HttpClient & interceptors",
      level: "core",
      body: [
        { type: "p", text: "`HttpClient` is Angular's HTTP API. Register it once with **`provideHttpClient()`** in `app.config.ts`, then inject it. Its methods return **Observables** — subscribe (or pipe through `toSignal`/`async`). Type the response with a generic." },
        { type: "code", lang: "ts", code: "// app.config.ts\nimport { provideHttpClient, withInterceptors, withFetch } from \"@angular/common/http\";\nprovideHttpClient(withFetch(), withInterceptors([authInterceptor]));" },
        { type: "code", lang: "ts", code: "import { HttpClient, HttpParams } from \"@angular/common/http\";\nimport { inject } from \"@angular/core\";\n\nexport class TodoApi {\n  private http = inject(HttpClient);\n\n  list()               { return this.http.get<Todo[]>(\"/api/todos\"); }\n  get(id: number)      { return this.http.get<Todo>(`/api/todos/${id}`); }\n  add(t: Partial<Todo>){ return this.http.post<Todo>(\"/api/todos\", t); }\n  remove(id: number)   { return this.http.delete<void>(`/api/todos/${id}`); }\n\n  search(q: string) {\n    const params = new HttpParams().set(\"q\", q).set(\"limit\", 20);\n    return this.http.get<Todo[]>(\"/api/todos\", { params });\n  }\n}" },
        { type: "code", lang: "ts", code: "// functional interceptor: attach a token, handle 401s (modern style)\nimport { HttpInterceptorFn } from \"@angular/common/http\";\nimport { inject } from \"@angular/core\";\nimport { catchError, throwError } from \"rxjs\";\n\nexport const authInterceptor: HttpInterceptorFn = (req, next) => {\n  const token = inject(AuthService).token();\n  const authed = token\n    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })\n    : req;\n  return next(authed).pipe(\n    catchError((err) => {\n      if (err.status === 401) inject(Router).navigate([\"/login\"]);\n      return throwError(() => err);\n    }),\n  );\n};" },
        { type: "callout", variant: "tip", text: "Use **`withFetch()`** to run `HttpClient` on the Fetch API (needed/recommended for SSR and modern setups). Interceptors are now plain **functions** (`HttpInterceptorFn`) registered with `withInterceptors([...])` — no more class-based `HTTP_INTERCEPTORS` boilerplate." },
        { type: "callout", variant: "gotcha", text: "`http.get(...)` returns a **cold Observable** — it does nothing until subscribed, and it re-fires the request on **each** subscription. If you subscribe twice (e.g. `async` pipe used twice), you send two requests. Share with `shareReplay(1)` or read once via `toSignal`." }
      ]
    },
    {
      id: "router",
      title: "Routing",
      level: "core",
      body: [
        { type: "p", text: "The Router maps URLs to components. Configure it with **`provideRouter(routes)`**; each route pairs a `path` with a `component` (or a **lazy `loadComponent`**). The matched component renders into `<router-outlet>`. Navigation uses the `routerLink` directive or the imperative `Router`." },
        { type: "code", lang: "ts", code: "// app.routes.ts\nimport { Routes } from \"@angular/router\";\n\nexport const routes: Routes = [\n  { path: \"\", component: Home },\n  { path: \"users/:id\", component: UserDetail },              // route param :id\n  { path: \"users\", loadComponent: () =>                     // LAZY: own JS chunk\n      import(\"./features/users/users\").then((m) => m.Users) },\n  { path: \"admin\", canActivate: [authGuard],                // route guard\n      loadChildren: () => import(\"./admin/routes\").then((m) => m.ADMIN_ROUTES) },\n  { path: \"**\", component: NotFound },                       // wildcard 404\n];" },
        { type: "code", lang: "html", code: "<!-- template navigation -->\n<nav>\n  <a routerLink=\"/\" routerLinkActive=\"active\" [routerLinkActiveOptions]=\"{ exact: true }\">Home</a>\n  <a [routerLink]=\"['/users', user.id]\">Profile</a>\n</nav>\n<router-outlet />   <!-- matched component renders here -->" },
        { type: "code", lang: "ts", code: "// read params & navigate imperatively\nimport { inject, input } from \"@angular/core\";\nimport { ActivatedRoute, Router } from \"@angular/router\";\n\nexport class UserDetail {\n  // with withComponentInputBinding(), route params bind straight to inputs:\n  id = input.required<string>();          // /users/:id -> this.id()\n\n  private router = inject(Router);\n  goHome() { this.router.navigate([\"/\"]); }\n}" },
        { type: "code", lang: "ts", code: "// functional guard (modern) — protect a route\nimport { CanActivateFn, Router } from \"@angular/router\";\nimport { inject } from \"@angular/core\";\n\nexport const authGuard: CanActivateFn = () => {\n  const auth = inject(AuthService);\n  return auth.isLoggedIn() ? true : inject(Router).createUrlTree([\"/login\"]);\n};" },
        { type: "list", items: [
          "**Lazy loading:** `loadComponent` (one component) / `loadChildren` (a routes file) split code into on-demand chunks — key for large-app startup speed.",
          "**Params:** `:id` route params, `?q=` query params. Read via `ActivatedRoute` (as signals: `route.paramMap`), or bind to inputs with **`provideRouter(routes, withComponentInputBinding())`**.",
          "**Guards & resolvers:** functional `CanActivateFn`/`CanDeactivateFn`/`ResolveFn` gate navigation or pre-fetch data.",
          "**Nested routes:** a `children` array renders into the parent's own `<router-outlet>`."
        ] },
        { type: "callout", variant: "tip", text: "Turn on **`withComponentInputBinding()`** and route params/query/data flow directly into component `input()`s — no `ActivatedRoute` subscription boilerplate. This is the cleanest modern pattern for param-driven pages." }
      ]
    },
    {
      id: "forms",
      title: "Forms: Reactive & Template-driven",
      level: "core",
      body: [
        { type: "p", text: "Angular has two form systems. **Reactive Forms** (recommended for anything non-trivial) define the form model in the class — explicit, typed, easily validated and tested. **Template-driven** forms use `[(ngModel)]` in the template — quick for tiny forms. Import `ReactiveFormsModule` or `FormsModule` respectively." },
        { type: "code", lang: "ts", code: "// Reactive Forms — typed model built with FormBuilder\nimport { Component, inject } from \"@angular/core\";\nimport { FormBuilder, Validators, ReactiveFormsModule } from \"@angular/forms\";\n\n@Component({\n  selector: \"app-signup\",\n  imports: [ReactiveFormsModule],\n  templateUrl: \"./signup.html\",\n})\nexport class Signup {\n  private fb = inject(FormBuilder);\n\n  form = this.fb.group({\n    email: [\"\", [Validators.required, Validators.email]],\n    password: [\"\", [Validators.required, Validators.minLength(8)]],\n    remember: [false],\n  });\n\n  submit() {\n    if (this.form.invalid) return;\n    console.log(this.form.value);   // { email, password, remember } — typed\n  }\n}" },
        { type: "code", lang: "html", code: "<!-- signup.html -->\n<form [formGroup]=\"form\" (ngSubmit)=\"submit()\">\n  <input formControlName=\"email\" type=\"email\" />\n  @if (form.controls.email.touched && form.controls.email.invalid) {\n    <small>Enter a valid email.</small>\n  }\n\n  <input formControlName=\"password\" type=\"password\" />\n  <label><input formControlName=\"remember\" type=\"checkbox\" /> Remember me</label>\n\n  <button [disabled]=\"form.invalid\">Sign up</button>\n</form>" },
        { type: "code", lang: "html", code: "<!-- Template-driven: quick, model lives in the template -->\n<form #f=\"ngForm\" (ngSubmit)=\"save(f.value)\">\n  <input name=\"title\" [(ngModel)]=\"title\" required />\n  <button [disabled]=\"f.invalid\">Save</button>\n</form>" },
        { type: "table", headers: ["Building block", "Role"], rows: [
          ["`FormControl`", "a single field's value + validation state"],
          ["`FormGroup`", "a keyed group of controls (an object)"],
          ["`FormArray`", "a dynamic list of controls"],
          ["`FormBuilder` (`fb.group`)", "terse factory for the above"],
          ["`Validators`", "built-ins: `required`, `email`, `minLength`, `pattern`..."],
          ["custom `ValidatorFn`", "your own sync validator; async validators for server checks"]
        ] },
        { type: "callout", variant: "tip", text: "Reactive forms are **strictly typed** since v14 — `form.value` and `form.controls` carry real types, catching field typos at compile time. Prefer them; reach for template-driven only for the simplest forms." },
        { type: "callout", variant: "note", text: "Watch this space: **Signal Forms** (a new signal-based forms API) is in developer preview in recent versions — but Reactive Forms remain the stable, production choice today." }
      ]
    },
    {
      id: "lifecycle-projection",
      title: "Lifecycle hooks & content projection",
      level: "deep",
      body: [
        { type: "p", text: "Components have **lifecycle hooks** — methods Angular calls at defined moments. With signal inputs and `effect()` you need far fewer of them than before, but `ngOnInit` and `ngOnDestroy` remain everyday tools." },
        { type: "table", headers: ["Hook", "When it fires"], rows: [
          ["`ngOnInit`", "once, after first inputs are set (setup, initial load)"],
          ["`ngOnChanges`", "on every `@Input` change (legacy inputs only)"],
          ["`ngOnDestroy`", "just before removal (cleanup, unsubscribe)"],
          ["`ngAfterViewInit`", "after the component's view (and `@ViewChild`) is ready"],
          ["`ngAfterContentInit`", "after projected content (`@ContentChild`) is ready"],
          ["`afterNextRender` / `afterRender`", "browser-only, after DOM render (v17+, for direct DOM/3rd-party libs)"]
        ] },
        { type: "code", lang: "ts", code: "import { Component, OnInit, OnDestroy, inject } from \"@angular/core\";\n\nexport class Widget implements OnInit, OnDestroy {\n  private data = inject(DataService);\n  ngOnInit()    { this.data.load(); }\n  ngOnDestroy() { /* cleanup timers, manual subscriptions */ }\n}" },
        { type: "heading", text: "Content projection with ng-content" },
        { type: "p", text: "**`<ng-content>`** projects markup a parent puts *between* your component's tags — Angular's version of slots. Multiple slots are selected by CSS selector." },
        { type: "code", lang: "ts", code: "@Component({\n  selector: \"app-card\",\n  template: `\n    <header><ng-content select=\"[card-title]\" /></header>\n    <section><ng-content /></section>          <!-- default slot -->\n  `,\n})\nexport class Card {}" },
        { type: "code", lang: "html", code: "<app-card>\n  <h2 card-title>Report</h2>     <!-- goes to the title slot -->\n  <p>Body content here.</p>       <!-- goes to the default slot -->\n</app-card>" },
        { type: "callout", variant: "note", text: "Query projected/view children with the signal-based **`contentChild()`** / **`viewChild()`** functions (modern) or the `@ContentChild`/`@ViewChild` decorators (legacy). Signal queries integrate with `computed()`/`effect()` and are the recommended form in new code." }
      ]
    },
    {
      id: "change-detection",
      title: "Change detection, OnPush & zoneless",
      level: "deep",
      body: [
        { type: "p", text: "Historically Angular used **Zone.js** to monkey-patch async APIs (events, timers, XHR) and re-check the whole component tree after each. It works, but over-checks. Two levers make it fast: **`OnPush`** change detection and, newer, **zoneless** mode driven by signals." },
        { type: "code", lang: "ts", code: "import { ChangeDetectionStrategy, Component } from \"@angular/core\";\n\n@Component({\n  selector: \"app-row\",\n  changeDetection: ChangeDetectionStrategy.OnPush,   // check only when inputs/signals change\n  template: `{{ item().name }}`,\n})\nexport class Row { item = input.required<Item>(); }" },
        { type: "p", text: "With **`OnPush`**, Angular skips re-checking a component unless: an `@Input` reference changed, an event fired inside it, an `async` pipe emitted, or a **signal it reads changed**. This prunes huge subtrees. Signals + `OnPush` are the intended pairing." },
        { type: "code", lang: "ts", code: "// zoneless: no Zone.js — signals (and async pipe / event bindings) drive updates\n// app.config.ts\nimport { provideZonelessChangeDetection } from \"@angular/core\";\n\nexport const appConfig = {\n  providers: [ provideZonelessChangeDetection() ],   // stable since v20.2\n};\n// (older name: provideExperimentalZonelessChangeDetection)" },
        { type: "callout", variant: "tip", text: "**Zoneless is the direction of travel.** It removes the ~100 KB Zone.js dependency and updates the UI only from real reactive changes. It requires your state to flow through signals / async pipe / explicit `markForCheck`. It's **stable since v20.2**, and new apps in **v21+ are zoneless by default**." },
        { type: "callout", variant: "gotcha", text: "Under `OnPush`, **mutating an object/array in place does NOT trigger an update** — Angular compares references. Replace the reference (`this.items = [...this.items, x]`) or, better, use a **signal** and `.update()`/`.set()`. This is the #1 \"my view won't refresh\" cause." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Angular ships a testing utility, **`TestBed`**, that configures a mini module and creates component fixtures. The classic runner is **Jasmine + Karma** (in-browser). Angular has now moved to **Vitest** — promoted to stable and made the default test runner in **v21** (the `@angular/build:unit-test` builder), running specs faster with no browser required." },
        { type: "code", lang: "ts", code: "import { TestBed } from \"@angular/core/testing\";\nimport { Counter } from \"./counter\";\n\ndescribe(\"Counter\", () => {\n  it(\"increments\", () => {\n    const fixture = TestBed.createComponent(Counter);\n    fixture.detectChanges();                       // initial render\n    const btn = fixture.nativeElement.querySelector(\"button\");\n\n    btn.click();\n    fixture.detectChanges();\n    expect(btn.textContent).toContain(\"Count: 1\");\n  });\n});" },
        { type: "code", lang: "ts", code: "// mock a dependency via DI — swap the real service for a fake\nTestBed.configureTestingModule({\n  imports: [Profile],\n  providers: [{ provide: UserService, useValue: { current: signal(fakeUser) } }],\n});\n\n// HTTP: use provideHttpClientTesting() + HttpTestingController to assert requests\n// e2e: Playwright or Cypress (ng e2e) drive the real app in a browser." },
        { type: "list", items: [
          "**Unit / component:** `TestBed` + Jasmine (Karma) in older apps; **Vitest** is the default runner via `ng test` since v21 (`@angular/build:unit-test`).",
          "**DI makes mocking easy:** override any provider with `useValue`/`useClass` in the test module.",
          "**HTTP:** `provideHttpClientTesting()` + `HttpTestingController` to flush and assert requests without a network.",
          "**End-to-end:** Playwright or Cypress; Angular deprecated its old Protractor e2e long ago."
        ] },
        { type: "callout", variant: "note", text: "Karma is **deprecated**. New projects use the **Vitest** builder by default (or Jest via a community setup) — faster and runs in Node. The `TestBed`/`fixture` API is the same regardless of runner." }
      ]
    },
    {
      id: "build-deploy",
      title: "Build, SSR & deploy",
      level: "deep",
      body: [
        { type: "p", text: "`ng build` produces an optimized, ahead-of-time-compiled bundle in `dist/` via the **esbuild-based application builder** — tree-shaken, minified, hashed, with automatic route-level code splitting for lazy routes. The output of a client-only app is **static files** you can host anywhere (S3, Netlify, nginx, any CDN)." },
        { type: "code", lang: "bash", code: "ng build                    # production by default: dist/<app>/browser/\n# SPA hosting: serve dist and rewrite all paths to index.html (client routing)\n\nng add @angular/ssr         # add Server-Side Rendering / prerendering (Angular SSR)\nng build                    # now emits a server/ bundle too\nnode dist/<app>/server/server.mjs   # run the SSR Node server" },
        { type: "list", items: [
          "**CSR (default):** ship static files; the browser boots the app. Simplest to host.",
          "**SSR / SSG:** `@angular/ssr` renders HTML on the server (or prerenders at build) for faster first paint and SEO; supports **hydration** and incremental/partial hydration.",
          "**Budgets:** `angular.json` sets bundle-size budgets that **fail the build** if exceeded — catches bloat early.",
          "**Deploy:** `ng deploy` (with an adapter) or just upload `dist/`. Remember the SPA fallback rewrite to `index.html`."
        ] },
        { type: "callout", variant: "gotcha", text: "For a client-rendered SPA, the host **must rewrite unknown paths to `index.html`** — otherwise refreshing a deep link like `/users/42` returns a 404 (the server has no such file; Angular's router handles it client-side). Configure this on nginx/Netlify/S3." },
        { type: "callout", variant: "tip", text: "Use **`ng build --configuration production`** implicitly (it's the default) and inspect the bundle with `--stats-json` + a visualizer. Lazy-load feature routes and heavy widgets (`@defer`) to keep the initial chunk small." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "Angular is powerful but has sharp edges — many from the mix of old and new idioms, plus DI and change detection. These are the ones that bite everyone, with the fix." },

        { type: "heading", text: "1. \"Why won't my view update?\"" },
        { type: "p", text: "Almost always a change-detection or reference issue. Under `OnPush` (and zoneless), mutating in place doesn't notify Angular." },
        { type: "code", lang: "ts", code: "// bad: mutating in place -> OnPush/zoneless won't re-render\nthis.items.push(newItem);\n\n// good: new reference, or a signal\nthis.items = [...this.items, newItem];\n// best:\nthis.items.update((list) => [...list, newItem]);   // items is a signal" },
        { type: "callout", variant: "gotcha", text: "Related: reading a signal **without calling it** — `{{ count }}` shows the function's source, not the value. Always call: `{{ count() }}`. And `computed`/`effect` only track signals you actually *call* inside them." },

        { type: "heading", text: "2. NG0100: ExpressionChangedAfterItHasBeenChecked" },
        { type: "callout", variant: "warn", text: "You changed a value **during** change detection (e.g. in `ngAfterViewInit`, or a getter used in the template that mutates state), so the value differs between the check and the re-check. Fix: don't mutate bound state in lifecycle hooks that run mid-CD; move it to `ngOnInit`, wrap in `queueMicrotask`/`setTimeout`, or derive it with a `computed()` instead of a side-effecting getter." },

        { type: "heading", text: "3. NG0203: inject() outside an injection context" },
        { type: "code", lang: "ts", code: "// bad: inject() called later, in a callback\nonClick() { const svc = inject(Thing); }        // throws NG0203\n\n// good: inject at construction, keep the reference\nprivate svc = inject(Thing);\nonClick() { this.svc.do(); }" },

        { type: "heading", text: "4. Leaking subscriptions" },
        { type: "p", text: "A bare `.subscribe()` on a long-lived Observable (router events, `valueChanges`, an interval) never unsubscribes and leaks memory / duplicate handlers." },
        { type: "code", lang: "ts", code: "// prefer, in order:\n// 1) async pipe / toSignal() — auto cleanup\ndata = toSignal(this.api.get());\n// 2) takeUntilDestroyed()\nstream$.pipe(takeUntilDestroyed()).subscribe(...);\n// 3) manual: store Subscription, unsubscribe in ngOnDestroy" },

        { type: "heading", text: "5. RxJS: forgetting it's lazy / cold" },
        { type: "callout", variant: "gotcha", text: "`http.get(...)` sends **no request** until subscribed, and sends a **new** request per subscription. Subscribing (or `async`-piping) the same Observable twice = two HTTP calls. Share with `shareReplay(1)`, or read once via `toSignal`. And use `switchMap` (not nested `subscribe`) to chain dependent async calls." },

        { type: "heading", text: "6. Standalone vs NgModule confusion" },
        { type: "callout", variant: "gotcha", text: "\"'app-foo' is not a known element\" usually means you forgot to add the component/directive/pipe to the current component's **`imports`** array (standalone), or you're mixing a module-based component into a standalone one without importing it. In standalone code, everything a template uses must be in that component's `imports`." },

        { type: "heading", text: "7. Bundle bloat & slow startup" },
        { type: "list", items: [
          "**Lazy-load routes** (`loadComponent`/`loadChildren`) and heavy widgets (`@defer`) so they aren't in the initial chunk.",
          "Set **bundle budgets** in `angular.json` to fail CI on regressions.",
          "Avoid importing whole libraries for one function; import submodules. Consider **zoneless** to drop Zone.js.",
          "Use **`OnPush`** everywhere feasible so change detection doesn't walk the whole tree."
        ] },

        { type: "heading", text: "8. Upgrading across majors" },
        { type: "callout", variant: "tip", text: "Never hand-migrate — run **`ng update @angular/core @angular/cli`** one major at a time; its schematics rewrite deprecated code (e.g. `*ngIf` -> `@if`, `@Input` -> `input()` with the dedicated migration). Commit first, review the diff, run tests. Check the official Update Guide for the exact version jump." }
      ]
    }
  ],

  packages: [
    { name: "@angular/core", why: "components, signals, DI, change detection — the framework core" },
    { name: "@angular/common", why: "CommonModule, pipes (date/currency/async), NgClass/NgStyle, @if/@for" },
    { name: "@angular/cli", why: "ng new/generate/serve/build/update — scaffolding & build tooling" },
    { name: "@angular/router", why: "provideRouter, routes, guards, lazy loadComponent, RouterLink" },
    { name: "@angular/forms", why: "Reactive (FormGroup/FormControl/FormBuilder) & template-driven forms" },
    { name: "@angular/common/http", why: "HttpClient, functional interceptors (provideHttpClient)" },
    { name: "@angular/core/rxjs-interop", why: "toSignal / toObservable / takeUntilDestroyed bridges" },
    { name: "rxjs", why: "Observables + operators — HTTP, streams, form/router events" },
    { name: "@angular/ssr", why: "server-side rendering / prerendering / hydration" },
    { name: "@angular/material + @angular/cdk", why: "Material Design components + behavior primitives (CDK)" },
    { name: "@angular/build", why: "the esbuild/Vite application builder + Vitest unit-test builder" },
    { name: "@ngrx/store + @ngrx/signals", why: "Redux-style global state; SignalStore for signal-based state" },
    { name: "@ngneat/transloco / @ngx-translate", why: "i18n / runtime translations (alt to built-in @angular/localize)" },
    { name: "jasmine + karma / vitest", why: "unit-test runner (Karma deprecated; Vitest is the new default)" },
    { name: "playwright / cypress", why: "end-to-end browser testing" }
  ],

  gotchas: [
    "**Modern Angular != AngularJS 1.x.** `$scope`/`ng-controller`/`angular.module` are the dead legacy framework — don't mix tutorials.",
    "Read a signal by **calling** it: `{{ count() }}`, not `{{ count }}` (which renders the function). `computed`/`effect` only track signals you call inside them.",
    "Under `OnPush`/zoneless, **mutating an object/array in place doesn't update the view** — replace the reference or use a signal `.set()`/`.update()`.",
    "`@for` **requires `track`** — use a stable unique id, not `$index`, or you'll rebuild every row and lose state/perf.",
    "`inject()` only works in an **injection context** (constructor/field/factory). Calling it in a click handler or `setTimeout` throws **NG0203** — inject at construction.",
    "**Manual `.subscribe()` leaks.** Use `async` pipe / `toSignal()` / `takeUntilDestroyed()`; only fall back to manual unsubscribe in `ngOnDestroy`.",
    "Observables are **lazy & cold**: no subscriber = no HTTP request; each subscription re-fires it. Use `shareReplay(1)` or `toSignal` to avoid duplicate calls.",
    "**NG0100 ExpressionChangedAfterItHasBeenChecked**: you mutated bound state during CD (often in `ngAfterViewInit` or a side-effecting getter). Move it earlier or defer it.",
    "\"'app-x' is not a known element\": in standalone code you forgot to add the component/pipe/directive to the current component's **`imports`** array.",
    "Only **one structural directive per element** (`*ngIf` + `*ngFor` together is illegal) — use `<ng-container>` or the new `@if`/`@for` blocks.",
    "Component styles are **scoped** by default; global overrides need `:host`, `::ng-deep` (deprecated), CSS variables, or `ViewEncapsulation.None`.",
    "SPA deep links 404 on refresh unless the host **rewrites unknown paths to `index.html`** — configure the SPA fallback.",
    "`nextMap`/route params via `ActivatedRoute` need a subscription; enable **`withComponentInputBinding()`** to bind params straight to `input()`s instead.",
    "Prefer **signal inputs** (`input()`) over `@Input()` in new code — they're readable in `computed`/`effect` and remove `ngOnChanges` boilerplate.",
    "**Karma is deprecated** and Zone.js is on the way out — new apps trend toward Vitest + zoneless (`provideZonelessChangeDetection()`)."
  ],

  flashcards: [
    { q: "How is modern Angular different from AngularJS (1.x)?", a: "Completely different frameworks. Modern Angular (v2+, TypeScript, components, DI, signals) is the maintained one; **AngularJS 1.x** (`$scope`, `angular.module`) is end-of-life. This deck is 100% modern Angular." },
    { q: "What makes a component 'standalone' and why does it matter?", a: "It declares its own template dependencies in `imports` and needs **no NgModule**. Since v19 it's the default. Simpler mental model, easier lazy-loading, less boilerplate." },
    { q: "How do you create and read a signal?", a: "`const c = signal(0);` then **call it** to read: `c()`. Write with `c.set(v)` or `c.update(fn)`. Derive with `computed(() => c() * 2)`; run side effects with `effect(() => ...)`." },
    { q: "What's the modern control-flow syntax?", a: "Built-in blocks: `@if/@else`, `@for (x of xs; track x.id) {} @empty {}`, `@switch/@case`, and `@defer` for lazy content. They replace `*ngIf`/`*ngFor`/`*ngSwitch`." },
    { q: "signal input() vs @Input()?", a: "`input()` is a signal input — read as `x()`, usable in `computed`/`effect`, supports `required`/`transform`. `@Input()` is the legacy decorator (plain property). `model()` adds two-way `[(x)]`." },
    { q: "How do you do two-way binding?", a: "`[(x)]=\"v\"` — sugar for `[x]` + `(xChange)`. On a form control use `[(ngModel)]` (needs `FormsModule`); on a custom component expose a `model()` signal." },
    { q: "What is a service and how do you inject it?", a: "An `@Injectable({ providedIn: \"root\" })` class holding shared logic/state. Get it with `inject(MyService)` (or constructor injection). DI supplies a tree-shakable singleton." },
    { q: "signals vs RxJS — when each?", a: "**Signals** for synchronous local/UI state (default). **RxJS** for async streams over time — HTTP, events, form/router changes. Bridge with `toSignal()`/`toObservable()`." },
    { q: "How do you avoid subscription leaks?", a: "Prefer the `async` pipe or `toSignal()` (auto-unsubscribe); else `takeUntilDestroyed()`; else store the `Subscription` and unsubscribe in `ngOnDestroy`." },
    { q: "How do you register HttpClient and add auth headers?", a: "`provideHttpClient(withInterceptors([authInterceptor]))` in app.config. The interceptor is a functional `HttpInterceptorFn` that clones the request with an `Authorization` header." },
    { q: "How do you lazy-load a route?", a: "`{ path: 'x', loadComponent: () => import('./x').then(m => m.X) }` (or `loadChildren` for a routes file) — it splits into its own on-demand JS chunk." },
    { q: "Reactive vs Template-driven forms?", a: "**Reactive**: model in the class (`FormBuilder`/`FormGroup`/`FormControl`), typed, testable — the recommended default. **Template-driven**: `[(ngModel)]` in the template, fine for tiny forms." },
    { q: "What does OnPush change detection do?", a: "Skips re-checking a component unless an `@Input` reference changed, an event fired inside it, an `async` pipe emitted, or a **signal it reads** changed. Big perf win; pair with signals." },
    { q: "What is zoneless change detection?", a: "Running Angular without Zone.js — updates are driven by signals / async pipe / explicit `markForCheck` instead of monkey-patched async. `provideZonelessChangeDetection()`, stable since v20.2." },
    { q: "What is @defer for?", a: "Lazily load a template block (and its JS) on a trigger — `on viewport | idle | interaction | hover | timer(...) | when cond`. With `@placeholder`/`@loading`/`@error` blocks. Shrinks the initial bundle." },
    { q: "Why is my page 404 on refresh after deploying the SPA?", a: "The host has no file at that deep path. Configure the SPA fallback to **rewrite unknown routes to `index.html`** so Angular's client router can handle them." }
  ],

  cheatsheet: [
    { label: "New app", code: "ng new my-app" },
    { label: "Dev server", code: "ng serve" },
    { label: "Generate", code: "ng g component features/user" },
    { label: "Signal", code: "count = signal(0); count.update(n => n+1)" },
    { label: "Computed", code: "doubled = computed(() => count() * 2)" },
    { label: "Effect", code: "effect(() => console.log(count()))" },
    { label: "Input / Output", code: "x = input.required<T>(); ev = output<T>()" },
    { label: "Two-way model", code: "value = model(0)  // <cmp [(value)]=\"v\">" },
    { label: "@if / @for", code: "@for (i of items(); track i.id) { {{ i.name }} }" },
    { label: "@defer", code: "@defer (on viewport) { <heavy/> }" },
    { label: "Inject service", code: "private svc = inject(MyService)" },
    { label: "HttpClient", code: "provideHttpClient(); http.get<T>(url)" },
    { label: "Route", code: "{ path: 'users/:id', component: User }" },
    { label: "Lazy route", code: "loadComponent: () => import('./x').then(m => m.X)" },
    { label: "Reactive form", code: "fb.group({ email: ['', Validators.required] })" },
    { label: "OnPush", code: "changeDetection: ChangeDetectionStrategy.OnPush" }
  ]
});
