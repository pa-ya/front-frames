(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "wasp",
  name: "Wasp",
  language: "TS + DSL",
  group: "Fullstack",
  color: "#ffc933",
  readMinutes: 26,
  tagline: "A **declarative full-stack framework** for React + Node + Prisma: you describe the app (auth, routes, data ops, jobs) in a config **spec**, and the **Wasp compiler** generates the type-safe glue.",

  sections: [
    {
      id: "overview",
      title: "Overview & philosophy: the config is the source of truth",
      level: "core",
      body: [
        { type: "p", text: "Wasp is a **batteries-included full-stack framework**. Instead of hand-wiring the seams between a React client, a Node/Express server and a Prisma database, you **declare** the app's high-level features — routes, pages, server operations, auth, jobs, custom APIs — in a single config **spec**, and the **Wasp compiler** generates all the glue: the router, type-safe RPC, data-fetching hooks, auth flows, an Express server, background-job runners and deployment config." },
        { type: "list", items: [
          "**Three real technologies underneath, not a black box:** the client is a normal **React + Vite** app, the server is **Express/Node**, the database layer is **Prisma**. You write ordinary `.tsx`/`.ts` files; Wasp only owns the *wiring*.",
          "**The spec is the source of truth.** One file (`main.wasp.ts`) declares *what* the app is. Change it and `wasp start` recompiles, regenerating typed imports under `wasp/...` that your code consumes.",
          "**End-to-end type safety for free:** an operation's argument and return types flow from the server implementation to the React hook that calls it — no manual API client, no OpenAPI codegen, no drift.",
          "**It removes boilerplate, not control:** auth (email + social), CRUD, data-fetching + caching, session handling, job scheduling and one-command deploy are declared in a line or two instead of wired by hand — but the underlying React/Node/Prisma code is yours to write."
        ] },
        { type: "table", headers: ["You declare (spec)", "Wasp generates", "You still write"], rows: [
          ["`route` + `page`", "React Router wiring, code-split pages", "the React component"],
          ["`query` / `action`", "type-safe RPC + react-query hooks", "the Node function body"],
          ["`auth`", "signup/login routes, sessions, auth UI, `useAuth`", "which methods + the User model"],
          ["`job`", "a pg-boss worker + scheduler", "the `perform` function"],
          ["`api`", "an Express route mounted for you", "the request handler"],
          ["Prisma `model`", "typed entity access via `context.entities`", "the `schema.prisma` models"]
        ] },
        { type: "callout", variant: "note", text: "**2026 status — the spec is now TypeScript.** Wasp historically used a custom DSL in `main.wasp`. As of the **0.24 line (announced June 2026, \"Launch Week #12\")** Wasp dropped the DSL in favor of a **TypeScript spec** written in **`main.wasp.ts`** using constructors from **`@wasp.sh/spec`**. This deck shows the TS spec as primary (the **0.24+** lines, mid-2026) and shows the old `main.wasp` DSL only as a contrast, since you'll still meet it in older repos and tutorials." },
        { type: "callout", variant: "tip", text: "Mental model: Wasp is a **compiler with a config front-end**. Treat `main.wasp.ts` like a build manifest, not application logic — it holds *declarations and references*, while the actual React components and Node functions live in `src/` and are imported into the spec by reference." }
      ]
    },
    {
      id: "setup",
      title: "Setup: the CLI, wasp new, project structure",
      level: "core",
      body: [
        { type: "p", text: "Install the **`wasp` CLI** (a single binary that bundles the compiler and dev tooling), scaffold with **`wasp new`**, then run **`wasp start`**. The CLI drives everything: compile, dev server, DB, migrations and deploy." },
        { type: "code", lang: "bash", code: "# install the CLI (macOS/Linux/WSL)\ncurl -sSL https://get.wasp.sh/installer.sh | sh\nwasp version\n\n# scaffold: interactive picker (basic, TS starter, SaaS/OpenSaaS, ...)\nwasp new\n# ...or non-interactively pick a template\nwasp new myapp -t basic\n\ncd myapp\nwasp start            # compile + run client (Vite) + server (Express) with hot reload\n\n# databases: Wasp can spin up a throwaway Postgres in Docker\nwasp start db         # run a dev Postgres (separate terminal), sets DATABASE_URL for you\nwasp db migrate-dev   # create & apply a Prisma migration from schema.prisma\nwasp db studio        # open Prisma Studio (visual DB browser)\nwasp db seed          # run a seed function declared in the spec" },
        { type: "code", lang: "text", code: "myapp/\n  main.wasp.ts         # THE spec: app, routes, pages, operations, auth, jobs, api\n  schema.prisma        # your Prisma datasource + models (entities)\n  package.json         # your deps (react, node libs); wasp injects its own\n  tsconfig.json        # references the two tsconfigs below\n  tsconfig.wasp.json   # type-checks the spec files (*.wasp.ts)\n  tsconfig.src.json    # type-checks your src/ app code\n  vite.config.ts       # client (Vite) config — optional overrides\n  public/              # static assets (favicon, images)\n  src/                 # YOUR code: React pages/components, server ops, jobs, apis\n    MainPage.tsx\n    queries.ts\n    actions.ts\n  .wasp/               # GENERATED output (gitignored) — the compiled full-stack app\n    out/               # the real React app + Express server Wasp builds for you" },
        { type: "list", items: [
          "**`wasp start`** watches both the spec and your `src/` — editing `main.wasp.ts` triggers a **recompile** and regenerates the `wasp/...` type imports.",
          "**`.wasp/out/`** is the generated project (never edit it). It is where the compiler emits the actual client + server before running Vite/Node.",
          "**Postgres in dev:** `wasp start db` runs a Dockerized Postgres and wires `DATABASE_URL` automatically — no manual DB setup for local work. (SQLite is only usable in very early scaffolds; production is Postgres.)",
          "**TypeScript by default:** new projects are TS end-to-end (`.tsx`/`.ts`); the spec itself is `main.wasp.ts`."
        ] },
        { type: "callout", variant: "gotcha", text: "You **cannot** `npm run dev` a Wasp app the normal way — the runnable project doesn't exist until the compiler emits it. Always use **`wasp start`** (and `wasp build` for a production bundle). Running raw `vite`/`node` against `src/` will fail because the `wasp/...` imports are generated." }
      ]
    },
    {
      id: "config",
      title: "The config spec: app, route+page, query, action, job, api",
      level: "core",
      body: [
        { type: "p", text: "`main.wasp.ts` builds one **app spec** object. You import constructors (`app`, `page`, `route`, `query`, `action`, `job`, `api`) from **`@wasp.sh/spec`**, and you reference your `src/` implementations with the special **`with { type: \"ref\" }`** import — a bundler hint that turns the import into a *reference* (a pointer to code) rather than actually evaluating it at spec-compile time." },
        { type: "code", lang: "ts", code: "// main.wasp.ts  (current TS spec, Wasp 0.24+)\nimport { app, page, route, query, action, job, api } from \"@wasp.sh/spec\";\n\n// implementations are imported BY REFERENCE, not evaluated here:\nimport { MainPage } from \"./src/MainPage\" with { type: \"ref\" };\nimport { LoginPage } from \"./src/LoginPage\" with { type: \"ref\" };\nimport { getTasks } from \"./src/queries\" with { type: \"ref\" };\nimport { createTask } from \"./src/actions\" with { type: \"ref\" };\nimport { dailyReport } from \"./src/jobs\" with { type: \"ref\" };\nimport { webhook } from \"./src/apis\" with { type: \"ref\" };\n\nexport default app({\n  name: \"todoApp\",\n  title: \"ToDo App\",\n  wasp: { version: \"^0.24.0\" },   // pin the compiler line\n\n  auth: {\n    userEntity: \"User\",\n    methods: { email: {}, google: {}, gitHub: {} },\n    onAuthFailedRedirectTo: \"/login\",\n  },\n\n  spec: [\n    // routing: a route points at a page (a plain React component, by ref)\n    route(\"RootRoute\", \"/\", page(MainPage, { authRequired: true })),\n    route(\"LoginRoute\", \"/login\", page(LoginPage)),\n\n    // operations: server functions Wasp exposes to the client as typed hooks\n    query(getTasks, { entities: [\"Task\"] }),\n    action(createTask, { entities: [\"Task\"] }),\n\n    // a recurring background job (pg-boss under the hood)\n    job(dailyReport, { schedule: { cron: \"0 7 * * *\" }, entities: [\"Task\"] }),\n\n    // a custom HTTP endpoint you own entirely\n    api(webhook, { httpRoute: [\"POST\", \"/webhook\"], auth: false }),\n  ],\n});" },
        { type: "p", text: "Because the spec is *just TypeScript*, you can split it across files (each feature exports a partial spec array), use loops, read env vars, and share helpers — a big ergonomic win over the old DSL. Editor autocomplete, type-checking and refactors all work out of the box, with no custom IDE plugin." },
        { type: "heading", text: "The old way: main.wasp DSL (contrast)" },
        { type: "p", text: "Pre-0.24 projects declared the same things in a bespoke DSL. Same concepts, different (non-TypeScript) syntax — recognize it in older repos:" },
        { type: "code", lang: "js", code: "// main.wasp  (LEGACY DSL — replaced by main.wasp.ts in 0.24+)\napp todoApp {\n  wasp: { version: \"^0.16.0\" },\n  title: \"ToDo App\",\n  auth: {\n    userEntity: User,\n    methods: { email: {}, google: {} },\n    onAuthFailedRedirectTo: \"/login\"\n  }\n}\n\nroute RootRoute { path: \"/\", to: MainPage }\npage MainPage {\n  component: import { MainPage } from \"@src/MainPage\",\n  authRequired: true\n}\n\nquery getTasks {\n  fn: import { getTasks } from \"@src/queries\",\n  entities: [Task]\n}" },
        { type: "callout", variant: "note", text: "A **transitional builder API** also existed briefly: `import { App } from \"wasp-config\"; const app = new App(...); app.query(...)`. It has been superseded by the functional `@wasp.sh/spec` constructors shown above. If you see `wasp-config` and `new App()`, it's an intermediate style — the current idiom is `app({ spec: [...] })`." },
        { type: "callout", variant: "tip", text: "In the DSL, `@src/...` meant \"a file under `src/`\". In the TS spec you use ordinary relative imports (`./src/...`) with `with { type: \"ref\" }`. The `\"ref\"` attribute is what lets Wasp connect a *declaration* in the spec to its *implementation* without running your app code during compilation." }
      ]
    },
    {
      id: "entities",
      title: "Entities & data: schema.prisma and migrations",
      level: "core",
      body: [
        { type: "p", text: "Your data model lives entirely in **`schema.prisma`** — standard Prisma. Wasp reads it, references models by name from the spec (as **entities**), and generates typed DB access. In current Wasp you do **not** declare entities in the config file; the Prisma schema is authoritative." },
        { type: "code", lang: "text", code: "// schema.prisma\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")   // Wasp sets this for `wasp start db`\n}\n\ngenerator client {\n  provider = \"prisma-client-js\"\n}\n\nmodel User {\n  id    Int    @id @default(autoincrement())\n  tasks Task[]\n  // Wasp manages auth fields (identities/sessions) separately — don't add password fields here\n}\n\nmodel Task {\n  id          Int     @id @default(autoincrement())\n  description String\n  isDone      Boolean @default(false)\n  user        User?   @relation(fields: [userId], references: [id])\n  userId      Int?\n}" },
        { type: "code", lang: "bash", code: "# after editing schema.prisma, create + apply a migration\nwasp db migrate-dev              # prompts for a migration name\nwasp db migrate-dev --name add_task_priority\n\nwasp db studio                   # browse/edit data visually (Prisma Studio)\nwasp db reset                    # drop + re-migrate (dev only — destroys data)\nwasp db seed                     # run a declared seed fn to populate dev data" },
        { type: "list", items: [
          "A model you reference in an operation's `entities: [\"Task\"]` becomes available as **`context.entities.Task`** — a scoped Prisma client — inside that operation's implementation.",
          "**Migrations are Prisma migrations.** `wasp db migrate-dev` = `prisma migrate dev` under the hood; the SQL history lives in `migrations/` and should be committed.",
          "You reference an entity by its **model name string** in the spec; the compiler validates that the model exists in `schema.prisma`.",
          "Auth adds its own tables/columns (identities, sessions). Let Wasp own those — declare only your domain fields on `User`."
        ] },
        { type: "callout", variant: "gotcha", text: "Only entities listed in an operation's/job's `entities: [...]` are injected into `context.entities`. Forget to list `\"Task\"` and `context.entities.Task` is **undefined** at runtime — add it to the declaration, not just to your imports." }
      ]
    },
    {
      id: "operations-queries",
      title: "Operations I — Queries (reads) & useQuery",
      level: "core",
      body: [
        { type: "p", text: "**Operations** are Wasp's core concept: server functions you declare in the spec and implement in Node, callable from React as **generated, type-safe hooks**. There are two kinds — **Queries** (reads, cached) and **Actions** (writes). A Query is declared with `query(...)` and implemented as a normal async function that receives `(args, context)`." },
        { type: "code", lang: "ts", code: "// src/queries.ts  — the server implementation\nimport { type GetTasks } from \"wasp/server/operations\";  // generated type\nimport { type Task } from \"wasp/entities\";                // generated from schema.prisma\nimport { HttpError } from \"wasp/server\";\n\n// GetTasks<Input, Output> — types flow to the client hook automatically\nexport const getTasks: GetTasks<void, Task[]> = async (args, context) => {\n  if (!context.user) throw new HttpError(401);   // context.user set when authed\n  return context.entities.Task.findMany({        // scoped Prisma client\n    where: { user: { id: context.user.id } },\n    orderBy: { id: \"asc\" },\n  });\n};" },
        { type: "code", lang: "tsx", code: "// src/MainPage.tsx — calling it from React\nimport { getTasks, useQuery } from \"wasp/client/operations\";\n\nexport function MainPage() {\n  // useQuery wraps react-query: reactive, cached, deduped\n  const { data: tasks, isLoading, error } = useQuery(getTasks);\n  if (isLoading) return <div>Loading…</div>;\n  if (error) return <div>Error: {error.message}</div>;\n  return <ul>{tasks!.map((t) => <li key={t.id}>{t.description}</li>)}</ul>;\n}" },
        { type: "list", items: [
          "**`useQuery(operation, args?)`** is a thin wrapper over **TanStack react-query** — you get `data`/`isLoading`/`error`/`refetch` and automatic caching + request dedup with zero setup.",
          "**`context.entities`** exposes the Prisma clients for the entities you declared; **`context.user`** is the logged-in user (or `undefined`).",
          "The generated **`GetTasks<Input, Output>`** type binds the server signature to the client, so `useQuery(getTasks)` is fully typed on both ends — change the return type and the component type-errors.",
          "You can also call a query directly (without the hook) by importing it from `wasp/client/operations` and awaiting it — handy in event handlers."
        ] },
        { type: "callout", variant: "tip", text: "Pass arguments as the second hook arg: `useQuery(getTask, { id })`. Wasp keys the cache by `(operation, args)`, so different args are cached independently — exactly like react-query query keys, but derived for you." }
      ]
    },
    {
      id: "operations-actions",
      title: "Operations II — Actions (writes), cache invalidation & optimistic updates",
      level: "core",
      body: [
        { type: "p", text: "**Actions** are operations that change data. Declare with `action(...)`, implement the same `(args, context)` shape. On the client, call an action directly, or wrap it in **`useAction`** to get optimistic updates. Wasp's headline convenience: **automatic, entity-based cache invalidation**." },
        { type: "code", lang: "ts", code: "// src/actions.ts\nimport { type CreateTask } from \"wasp/server/operations\";\nimport { type Task } from \"wasp/entities\";\nimport { HttpError } from \"wasp/server\";\n\ntype CreateTaskArgs = { description: string };\n\nexport const createTask: CreateTask<CreateTaskArgs, Task> = async ({ description }, context) => {\n  if (!context.user) throw new HttpError(401);\n  if (!description.trim()) throw new HttpError(400, \"Description required\");\n  return context.entities.Task.create({\n    data: { description, user: { connect: { id: context.user.id } } },\n  });\n};" },
        { type: "code", lang: "tsx", code: "import { createTask, useQuery, getTasks } from \"wasp/client/operations\";\n\nasync function onAdd(text: string) {\n  // simplest form: just await it. Any Query using the Task entity\n  // is AUTOMATICALLY invalidated + refetched afterwards.\n  await createTask({ description: text });\n}\n\n// getTasks (which uses Task) refreshes on its own — no manual refetch needed" },
        { type: "callout", variant: "good", text: "**Automatic entity-based invalidation:** Wasp knows which entities each operation touches (from `entities: [...]`). When an Action that uses `Task` runs, every Query that also uses `Task` has its cache invalidated and refetched. This removes the single most tedious part of react-query — you rarely write `invalidateQueries` by hand." },
        { type: "heading", text: "Optimistic updates with useAction" },
        { type: "p", text: "For instant UI feedback (before the server responds), wrap the action in **`useAction`** and describe how to patch the cached query optimistically:" },
        { type: "code", lang: "tsx", code: "import { useAction, markTaskAsDone, getTask } from \"wasp/client/operations\";\n\nconst markDone = useAction(markTaskAsDone, {\n  optimisticUpdates: [\n    {\n      getQuerySpecifier: ({ id }) => [getTask, { id }],       // which cache entry\n      updateQuery: (_payload, oldTask) => ({ ...oldTask, isDone: true }),\n    },\n  ],\n});\n\n// UI updates immediately; if the server call fails, Wasp rolls the cache back\n<button onClick={() => markDone({ id: task.id })}>Done</button>" },
        { type: "callout", variant: "note", text: "Throw **`HttpError`** (`new HttpError(403, \"msg\", { details })`) for expected failures — Wasp forwards the status/message to the client. **Unhandled** exceptions are turned into a generic 500 on purpose, so internal error details never leak to the browser." }
      ]
    },
    {
      id: "auth",
      title: "Auth: email, username & social with minimal config",
      level: "core",
      body: [
        { type: "p", text: "Auth is Wasp's biggest selling point. Turn it on by adding an `auth` block: pick the **methods** (email, username+password, Google, GitHub, Discord, Slack, Keycloak) and the **user entity**. Wasp generates the signup/login routes, session handling, password hashing, email verification/reset flows, the OAuth dance, ready-made **UI components**, and puts the user on `context.user` server-side and `useAuth()` client-side." },
        { type: "code", lang: "ts", code: "// main.wasp.ts — auth in ~6 lines\nexport default app({\n  // ...\n  auth: {\n    userEntity: \"User\",\n    methods: {\n      email: {                            // email + password with verification\n        fromField: { name: \"MyApp\", email: \"noreply@myapp.com\" },\n        emailVerification: { clientRoute: \"EmailVerificationRoute\" },\n        passwordReset:    { clientRoute: \"PasswordResetRoute\" },\n      },\n      usernameAndPassword: {},             // simplest, no email needed\n      google: {},                          // reads GOOGLE_CLIENT_ID / _SECRET from env\n      gitHub: {},\n    },\n    onAuthFailedRedirectTo: \"/login\",\n    onAuthSucceededRedirectTo: \"/\",\n  },\n});" },
        { type: "code", lang: "tsx", code: "// src/LoginPage.tsx — Wasp ships the forms\nimport { LoginForm, SignupForm, GoogleSignInButton, GitHubSignInButton } from \"wasp/client/auth\";\nimport { Link } from \"wasp/client/router\";\n\nexport function LoginPage() {\n  return (\n    <div>\n      <LoginForm />\n      <GoogleSignInButton />\n      <GitHubSignInButton />\n      <Link to=\"/signup\">Create an account</Link>\n    </div>\n  );\n}" },
        { type: "code", lang: "tsx", code: "// reading the user on the client\nimport { useAuth, logout } from \"wasp/client/auth\";\n\nexport function NavBar() {\n  const { data: user, isLoading } = useAuth();   // undefined when logged out\n  if (isLoading) return null;\n  return user\n    ? <button onClick={logout}>Log out {user.identities.username?.id}</button>\n    : <a href=\"/login\">Log in</a>;\n}\n\n// A page declared with authRequired:true ALSO receives `user` as a prop\n// and auto-redirects to onAuthFailedRedirectTo when logged out." },
        { type: "list", items: [
          "**`authRequired: true`** on a page both gates it (redirect if unauthenticated) and passes the typed `user` prop — no manual guard component.",
          "**`context.user`** is populated in every operation when the caller is authenticated; check it and throw `HttpError(401)` to protect server logic.",
          "The `User` model stays clean — Wasp stores credentials/identities in its own managed tables and exposes them via `user.identities` (e.g. `user.identities.email`, `user.identities.google`).",
          "Import UI from **`wasp/client/auth`**, the `AuthUser` type from **`wasp/auth`**, and `Link`/typed routing from **`wasp/client/router`**."
        ] },
        { type: "callout", variant: "tip", text: "Customize the generated forms by passing props/appearance to `LoginForm`/`SignupForm`, or build your own using the `login`/`signup` functions from `wasp/client/auth`. Social providers only need `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (and the GitHub equivalents) in your `.env.server`." }
      ]
    },
    {
      id: "frontend",
      title: "Frontend: pages are plain React, routing lives in the spec",
      level: "core",
      body: [
        { type: "p", text: "There's nothing special about a Wasp page — it's a **normal React component** exported from `src/`. Routing is declared in the spec (`route(name, path, page(Component))`), so the compiler owns React Router; you just write components and consume the generated `wasp/...` hooks." },
        { type: "code", lang: "tsx", code: "// src/TaskPage.tsx\nimport { getTask, updateTask, useQuery, useAction } from \"wasp/client/operations\";\nimport { useParams } from \"wasp/client/router\";   // typed router\nimport type { AuthUser } from \"wasp/auth\";\n\n// authRequired pages receive the user as a prop\nexport function TaskPage({ user }: { user: AuthUser }) {\n  const { taskId } = useParams();                          // typed route params\n  const { data: task } = useQuery(getTask, { id: Number(taskId) });\n  const doUpdate = useAction(updateTask);\n\n  if (!task) return null;\n  return (\n    <div>\n      <h1>{task.description}</h1>\n      <p>Owner: {user.identities.email?.id}</p>\n      <button onClick={() => doUpdate({ id: task.id, isDone: !task.isDone })}>\n        Toggle\n      </button>\n    </div>\n  );\n}" },
        { type: "code", lang: "ts", code: "// declare the route + params in the spec\nimport { route, page } from \"@wasp.sh/spec\";\nimport { TaskPage } from \"./src/TaskPage\" with { type: \"ref\" };\n\nroute(\"TaskRoute\", \"/task/:taskId\", page(TaskPage, { authRequired: true }));" },
        { type: "list", items: [
          "**Typed routing:** `Link`, `useParams`, `routes` come from `wasp/client/router`, generated from your `route` declarations — mistype a param name and it type-errors.",
          "**Client setup:** declare `client: { rootComponent, setupFn }` in the spec to wrap the app (providers, global CSS) or run setup before render (analytics, query-client config).",
          "**Styling:** Tailwind works out of the box — add `tailwind.config.js` + `postcss.config.js` and Wasp picks it up; otherwise import plain CSS.",
          "**Static assets** go in `public/`; import images/CSS normally from `src/` (it's a Vite app)."
        ] },
        { type: "code", lang: "ts", code: "// main.wasp.ts — client-wide setup\nimport { App } from \"./src/App\" with { type: \"ref\" };\nimport { setupClient } from \"./src/setup\" with { type: \"ref\" };\n\nexport default app({\n  // ...\n  client: {\n    rootComponent: App,        // wraps every page (providers, layout)\n    setupFn: setupClient,      // runs once before the app mounts\n  },\n});" },
        { type: "callout", variant: "gotcha", text: "Import operations/auth/router from the **generated `wasp/...` modules**, not from relative paths or `node_modules`. `wasp/client/operations`, `wasp/client/auth`, `wasp/client/router`, `wasp/server`, `wasp/entities` only exist after a compile — your editor resolves them once `wasp start` has run at least once." }
      ]
    },
    {
      id: "jobs-apis",
      title: "Jobs & custom APIs: pg-boss, api endpoints, middleware, setup fns",
      level: "core",
      body: [
        { type: "p", text: "Two escape hatches for backend work the operation model doesn't cover: **`job`** for recurring/background work (backed by **pg-boss** on Postgres) and **`api`** for raw HTTP endpoints (webhooks, third-party callbacks, non-RPC routes) where you get direct Express `req`/`res`." },
        { type: "heading", text: "Recurring & background jobs (pg-boss)" },
        { type: "code", lang: "ts", code: "// src/jobs.ts\nimport { type DailyReport } from \"wasp/server/jobs\";\n\nexport const dailyReport: DailyReport<{ userId?: number }, void> = async (args, context) => {\n  const stale = await context.entities.Task.findMany({ where: { isDone: false } });\n  // ...send an email, aggregate metrics, etc.\n};" },
        { type: "code", lang: "ts", code: "// main.wasp.ts\nimport { job } from \"@wasp.sh/spec\";\nimport { dailyReport } from \"./src/jobs\" with { type: \"ref\" };\n\njob(dailyReport, {\n  executor: \"PgBoss\",\n  schedule: { cron: \"0 7 * * *\" },        // every day 07:00\n  entities: [\"Task\"],                       // -> context.entities.Task\n});" },
        { type: "code", lang: "tsx", code: "// you can also kick a job off manually from server code\nimport { dailyReport } from \"wasp/server/jobs\";\nawait dailyReport.submit({ userId: 42 });          // enqueue now\nawait dailyReport.delay(60).submit({});            // enqueue in 60s" },
        { type: "heading", text: "Custom HTTP APIs & middleware" },
        { type: "code", lang: "ts", code: "// src/apis.ts — raw Express handler\nimport { type StripeWebhook } from \"wasp/server/api\";\n\nexport const stripeWebhook: StripeWebhook = async (req, res, context) => {\n  const event = req.body;                     // full Express req/res\n  await context.entities.Payment.create({ data: { ref: event.id } });\n  res.json({ received: true });\n};" },
        { type: "code", lang: "ts", code: "// main.wasp.ts\nimport { api, apiNamespace } from \"@wasp.sh/spec\";\nimport { stripeWebhook } from \"./src/apis\" with { type: \"ref\" };\nimport { withCors } from \"./src/middleware\" with { type: \"ref\" };\n\napi(stripeWebhook, {\n  httpRoute: [\"POST\", \"/webhooks/stripe\"],\n  entities: [\"Payment\"],\n  auth: false,                              // webhooks aren't user-authed\n  middlewareConfigFn: withCors,             // tweak middleware for this route\n});" },
        { type: "list", items: [
          "**Jobs** need a Postgres DB (pg-boss stores the queue in it); a `schedule.cron` makes them recurring, or call `.submit()` to enqueue on demand.",
          "**`api`** gives you the real request/response — use it for webhooks, file downloads, SSE, or any endpoint that isn't the query/action RPC shape.",
          "**`apiNamespace`** + a `middlewareConfigFn` lets you attach/modify Express middleware (CORS, body parsers, auth) for a group of routes.",
          "**Server setup:** declare `server: { setupFn, middlewareConfigFn }` in the spec to run code at server boot (connect a cache, register global middleware)."
        ] },
        { type: "callout", variant: "note", text: "Operations (`query`/`action`) are the ergonomic default — typed hooks, auto-caching, auth wired in. Reach for `api` only when you need raw HTTP semantics, and for `job` when work should run outside a request (async, scheduled, retried)." }
      ]
    },
    {
      id: "email-env-types",
      title: "Email, env vars & end-to-end type safety",
      level: "core",
      body: [
        { type: "p", text: "Wasp bundles an **email sender** (declare a provider once, then send from server code), a conventional **env var** split, and — the payoff of the whole model — **full-stack type safety** with no codegen step you run yourself." },
        { type: "heading", text: "Email sending" },
        { type: "code", lang: "ts", code: "// main.wasp.ts — emailSender is a config key on app({...}), not an import\nexport default app({\n  // ...\n  emailSender: {\n    provider: \"SMTP\",                 // or SendGrid, Mailgun, Dummy (logs to console in dev)\n    defaultFrom: { name: \"MyApp\", email: \"noreply@myapp.com\" },\n  },\n});" },
        { type: "code", lang: "ts", code: "// send from any server operation/job\nimport { emailSender } from \"wasp/server/email\";\n\nawait emailSender.send({\n  to: user.email,\n  subject: \"Welcome!\",\n  text: \"Thanks for signing up.\",\n  html: \"<h1>Thanks for signing up.</h1>\",\n});" },
        { type: "heading", text: "Environment variables" },
        { type: "list", items: [
          "**`.env.server`** — secrets for Node (`DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, SMTP creds, API keys). Never shipped to the client.",
          "**`.env.client`** — public values exposed to the browser; must be prefixed and are inlined at build time (treat as public).",
          "Both are gitignored by default; commit `.env.server.example` for teammates.",
          "Wasp validates required env for the features you enabled (e.g. enabling `google` auth without `GOOGLE_CLIENT_ID` fails fast at start)."
        ] },
        { type: "heading", text: "End-to-end type safety" },
        { type: "p", text: "The chain is fully typed with no manual API layer: **`schema.prisma` → `wasp/entities` types → operation signature (`GetTasks<In, Out>`) → the `useQuery`/`useAction` hook**. Rename a Prisma field, and every server op and React component that uses it type-errors until fixed." },
        { type: "code", lang: "ts", code: "// one source of truth flows outward:\n// schema.prisma:  model Task { description String }\n//        ↓ generated\n// wasp/entities:   type Task = { id: number; description: string; ... }\n//        ↓ used in\n// src/queries.ts:  GetTasks<void, Task[]>\n//        ↓ inferred by\n// component:       const { data } = useQuery(getTasks)   // data: Task[] | undefined" },
        { type: "callout", variant: "good", text: "This is the core value: you never hand-write an API client, request/response DTOs, or `fetch` calls. The compiler regenerates the typed bridge on every `wasp start`, so the client and server can't drift — a whole category of full-stack bugs disappears." }
      ]
    },
    {
      id: "crud",
      title: "Auto-CRUD: generate operations from an entity",
      level: "deep",
      body: [
        { type: "p", text: "For the common case of basic create/read/update/delete over one entity, Wasp can **generate the whole set of operations** from a single `crud(...)` declaration — no hand-written query/action bodies, still fully typed, and consumable with the same `useQuery`/`useAction` hooks." },
        { type: "code", lang: "ts", code: "// main.wasp.ts\nimport { crud } from \"@wasp.sh/spec\";\nimport { createTask } from \"./src/tasks\" with { type: \"ref\" };\n\ncrud(\"tasks\", {\n  entity: \"Task\",\n  operations: {\n    getAll: {},                    // auto-generated read-all\n    get: {},                       // auto-generated read-by-id\n    create: { overrideFn: createTask }, // override just this one to add auth/validation\n    update: {},\n    delete: {},\n  },\n});" },
        { type: "code", lang: "tsx", code: "// consume the generated CRUD from React\nimport { tasks } from \"wasp/client/crud\";\nimport { useQuery } from \"wasp/client/operations\";\n\nconst { data } = useQuery(tasks.getAll);\nawait tasks.create({ description: \"New\" });   // typed, cache auto-invalidates" },
        { type: "callout", variant: "tip", text: "Start with `crud` for boilerplate entities and **override individual operations** (`overrideFn`) as soon as one needs auth checks, validation, or custom shaping. You get scaffolding speed without giving up control where it matters." },
        { type: "callout", variant: "note", text: "CRUD operations respect the same `context.user`/`context.entities` model and participate in entity-based cache invalidation, so mixing generated CRUD and hand-written operations over the same entity keeps caches consistent." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment: wasp deploy (Fly.io), manual & OpenSaaS",
      level: "core",
      body: [
        { type: "p", text: "`wasp build` emits a production-ready Docker-friendly bundle (client static assets + Node server + Prisma). For hosting, **`wasp deploy`** ships the whole stack (client, server, Postgres) with one command — Fly.io and Railway are first-class — or you can deploy the artifacts manually anywhere." },
        { type: "code", lang: "bash", code: "# one-command full-stack deploy to Fly.io (server + client + Postgres)\nwasp deploy fly launch my-app mia    # first time: app name + region\nwasp deploy fly deploy               # subsequent deploys\nwasp deploy fly cmd secrets set STRIPE_KEY=sk_live_...   # set server env\n\n# Railway is also supported\nwasp deploy railway launch my-app\n\n# manual: build the bundle yourself\nwasp build                            # -> .wasp/build/ (client dist + Dockerfile'd server)\n# then deploy .wasp/build/web-app (static) + the server image + run prisma migrate deploy" },
        { type: "list", items: [
          "**`wasp deploy fly`** provisions two Fly apps (client + server) and a Postgres, wires `DATABASE_URL`, and runs migrations — genuinely one command for a full stack.",
          "**Migrations in prod** run via `prisma migrate deploy` (Wasp handles it in the deploy flow); never `migrate-dev` against production.",
          "**Manual deploy:** serve `.wasp/build/web-app/build` as static files (Netlify/Vercel/S3), containerize the server, and set `.env.server` values as real env vars.",
          "Set the client's server URL (`REACT_APP_API_URL` / `WASP_WEB_CLIENT_URL`) so the built client points at your deployed server."
        ] },
        { type: "heading", text: "OpenSaaS — the SaaS starter on Wasp" },
        { type: "p", text: "**Open SaaS** (`opensaas.sh`, by the Wasp team) is a free, open-source, production-grade **SaaS boilerplate built on Wasp**: auth (email + Google/GitHub/Slack/Discord/MS), **Stripe & Polar.sh payments**, Stripe-style subscriptions, background jobs, an admin dashboard, blog/docs, S3 file uploads, a landing page and shadcn/Tailwind UI. It's actively maintained in 2026 and is AI-ready (ships `AGENTS.md`, skills, a Claude Code plugin)." },
        { type: "code", lang: "bash", code: "# scaffold a SaaS from the Open SaaS template\nwasp new -t saas          # picks the Open SaaS starter\n# or: wasp new  (interactive) and choose the SaaS template" },
        { type: "callout", variant: "tip", text: "Don't build billing, auth UX and admin from scratch — start from **Open SaaS** and delete what you don't need. It's the same Wasp app model (`main.wasp.ts` + Prisma + operations), so everything in this deck applies directly." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring friction points are almost all about the **compile step** and the **spec ↔ implementation** boundary. Internalize these and Wasp gets out of your way." },
        { type: "heading", text: "1. Config changed but nothing updated" },
        { type: "callout", variant: "gotcha", text: "The spec is compiled, not interpreted live. After editing `main.wasp.ts` (or `schema.prisma`), Wasp recompiles on `wasp start` — but if hot reload gets confused, **stop and re-run `wasp start`**. The generated `wasp/...` imports only refresh on a successful compile." },
        { type: "heading", text: "2. Cannot find module 'wasp/...'" },
        { type: "callout", variant: "gotcha", text: "`wasp/client/operations`, `wasp/server`, `wasp/entities`, `wasp/client/auth`, `wasp/client/router` are **generated**. They don't exist until you've run `wasp start` (or `wasp start` failed to compile). Run it once, then your editor/TS resolves them. Never import operations via relative paths." },
        { type: "heading", text: "3. Operation must be declared before use" },
        { type: "callout", variant: "gotcha", text: "Implementing `getTasks` in `src/queries.ts` is not enough — you must also **declare it** in the spec (`query(getTasks, {...})`) with a `with { type: \"ref\" }` import. Undeclared functions aren't exposed as hooks and won't appear in `wasp/client/operations`." },
        { type: "heading", text: "4. context.entities.X is undefined" },
        { type: "callout", variant: "gotcha", text: "Entities are only injected if listed in that operation's/job's `entities: [\"X\"]`. Add the entity to the **declaration** (not just your imports), recompile, and `context.entities.X` appears. This is a per-operation allowlist, by design." },
        { type: "heading", text: "5. Migrations & the dev database" },
        { type: "callout", variant: "warn", text: "Editing `schema.prisma` without migrating leaves the DB out of sync — run **`wasp db migrate-dev`** after every model change and commit the `migrations/`. In dev, `wasp start db` provides Postgres; in prod, migrations apply via `prisma migrate deploy` in the deploy flow, never `migrate-dev`." },
        { type: "heading", text: "6. DSL vs TS-config confusion (old tutorials)" },
        { type: "callout", variant: "note", text: "Pre-0.24 content uses the **`main.wasp` DSL** (`query getTasks { fn: import ... }`) or the transitional `wasp-config` `new App()` builder. Current Wasp uses **`main.wasp.ts`** with `app({ spec: [...] })` constructors from `@wasp.sh/spec` and `with { type: \"ref\" }` imports. Translate concepts 1:1 — the features are identical, only the syntax changed." },
        { type: "heading", text: "7. Auth model / env pitfalls" },
        { type: "callout", variant: "gotcha", text: "Don't add password/credential fields to your `User` model — Wasp manages identities/sessions in its own tables and exposes them via `user.identities`. Social auth needs the provider env vars (`GOOGLE_CLIENT_ID`/`_SECRET`, GitHub equivalents) in `.env.server`, or `wasp start` fails fast." },
        { type: "heading", text: "8. Errors leaking (or not reaching) the client" },
        { type: "callout", variant: "tip", text: "Throw **`HttpError(status, msg)`** for expected failures you want the client to see; any other thrown error becomes a generic 500 (details hidden on purpose). If a UI shows a vague 500, wrap the server-side check in an explicit `HttpError` with the real message." },
        { type: "callout", variant: "note", text: "General discipline: keep the spec declarative (references + config, no heavy logic), put real code in `src/`, migrate after every schema change, and let the compiler regenerate the typed bridge — fighting the codegen is the root of most Wasp frustration." }
      ]
    }
  ],

  packages: [
    { name: "wasp (CLI)", why: "the whole toolchain: compiler, dev server, `wasp new/start/build/deploy`, DB + migration commands" },
    { name: "@wasp.sh/spec", why: "the TypeScript spec constructors (app, page, route, query, action, job, api, crud) for main.wasp.ts" },
    { name: "prisma / @prisma/client", why: "ORM + schema.prisma; powers entities, migrations and `context.entities.*`" },
    { name: "react + react-dom", why: "the client — Wasp pages are plain React components" },
    { name: "vite", why: "the client dev server + production bundler Wasp compiles the frontend with" },
    { name: "express", why: "the generated Node server that hosts operations, apis and auth routes" },
    { name: "@tanstack/react-query", why: "under `useQuery`/`useAction` — caching, dedup, and Wasp's automatic entity-based invalidation" },
    { name: "pg-boss", why: "the Postgres-backed job queue behind `job` (scheduling, retries, background work)" },
    { name: "react-router", why: "client routing generated from your `route` declarations (typed `wasp/client/router`)" },
    { name: "tailwindcss + postcss + autoprefixer", why: "first-class styling — add the config files and Wasp wires it into Vite" },
    { name: "nodemailer / SendGrid / Mailgun SDKs", why: "email providers behind `emailSender.send(...)`" },
    { name: "superjson", why: "serializes richer types (Date, BigInt) across the operation RPC boundary" },
    { name: "vitest", why: "the test runner Wasp expects for unit-testing operations/components (0.24+ dev dependency)" },
    { name: "open-saas (template)", why: "free SaaS boilerplate on Wasp: auth, Stripe/Polar payments, admin, jobs, file uploads" }
  ],

  gotchas: [
    "**Nothing runs without the compiler:** use `wasp start`, not `npm run dev`/`vite`. The runnable app in `.wasp/out/` is generated from the spec — raw tooling can't resolve the `wasp/...` imports.",
    "**Declare before you use:** implementing a function in `src/` isn't enough — add `query(fn,{...})`/`action(fn,{...})` to the spec (with `with { type: \"ref\" }`) or it's never exposed as a hook.",
    "**Entities are an allowlist:** `context.entities.X` is `undefined` unless `X` is in that operation's/job's `entities: [...]`. Add it to the declaration, then recompile.",
    "**Import from generated `wasp/...` modules:** operations from `wasp/client/operations`, auth from `wasp/client/auth`, types from `wasp/entities`/`wasp/auth`, routing from `wasp/client/router` — never relative paths.",
    "**Migrate after every schema change:** run `wasp db migrate-dev` when you edit `schema.prisma` and commit `migrations/`; skipping it leaves the DB out of sync.",
    "**Don't store credentials on `User`:** Wasp owns identities/sessions in its own tables (`user.identities.*`). Adding password fields fights the auth system.",
    "**Throw `HttpError` for client-visible failures:** unhandled exceptions become a generic 500 (details hidden). Use `new HttpError(401)` / `HttpError(400, \"msg\")` deliberately.",
    "**Automatic cache invalidation is entity-based:** an Action invalidates Queries sharing an entity — but only entities listed in `entities: [...]`. For cross-entity refresh, list every entity the op touches.",
    "**Optimistic updates need `useAction`:** a bare `await action()` won't patch the UI early; wrap it and provide `optimisticUpdates` with `getQuerySpecifier`/`updateQuery`.",
    "**DSL vs TS spec:** old repos use `main.wasp` (DSL) or `wasp-config`'s `new App()`. Current is `main.wasp.ts` with `app({ spec:[...] })` from `@wasp.sh/spec` — concepts map 1:1.",
    "**Social auth env at boot:** enabling `google`/`gitHub` requires the client id/secret in `.env.server` or `wasp start` fails fast — put public values in `.env.client`, secrets in `.env.server`.",
    "**Jobs require Postgres:** pg-boss stores its queue in the DB, so `job` won't run without a real Postgres (dev: `wasp start db`).",
    "**Prod migrations differ:** deployment runs `prisma migrate deploy` — never run `migrate-dev` against production data.",
    "**Pin the compiler line:** set `wasp: { version: \"^0.24.0\" }` in the spec so upgrades are intentional; the generated glue is tied to the compiler version.",
    "**`with { type: \"ref\" }` is required:** without the ref attribute, a spec import would try to evaluate your app code during compilation — the ref turns it into a pointer instead."
  ],

  flashcards: [
    { q: "What does the Wasp compiler generate from the spec?", a: "The full-stack glue: React Router wiring, type-safe RPC + react-query hooks for operations, auth flows/UI/sessions, an Express server, pg-boss job runners, and deploy config — over your React/Node/Prisma code." },
    { q: "What is the current config format in 2026 (vs the old one)?", a: "**`main.wasp.ts`** — a TypeScript spec using constructors from `@wasp.sh/spec` (`app`, `page`, `route`, `query`, `action`, `job`, `api`). It replaced the legacy **`main.wasp` DSL** in the 0.24 line (June 2026)." },
    { q: "What are Operations, and the two kinds?", a: "Server functions declared in the spec and called from React as typed hooks. **Queries** = reads (cached, `useQuery`); **Actions** = writes (`useAction`). Both get `(args, context)` with `context.entities` and `context.user`." },
    { q: "How do you call a query from React?", a: "`const { data, isLoading, error } = useQuery(getTasks, args?)` imported from `wasp/client/operations`. It wraps TanStack react-query — reactive, cached, deduped." },
    { q: "How does cache invalidation work after an Action?", a: "**Automatic, entity-based:** running an Action that uses an entity invalidates + refetches every Query that uses the same entity (from `entities: [...]`). You rarely call `invalidateQueries` by hand." },
    { q: "How do you do optimistic updates?", a: "Wrap the action: `useAction(fn, { optimisticUpdates: [{ getQuerySpecifier, updateQuery }] })`. It patches the cached query immediately and rolls back if the server call fails." },
    { q: "Where do entities/models live, and how are they accessed?", a: "In `schema.prisma` (standard Prisma). Referenced by name in `entities: [\"Task\"]`, then available as `context.entities.Task` (a scoped Prisma client) inside the operation." },
    { q: "How do you enable auth in Wasp?", a: "Add an `auth` block: `userEntity`, `methods` (email, usernameAndPassword, google, gitHub, ...), `onAuthFailedRedirectTo`. Wasp generates routes, sessions, UI (`LoginForm`), `useAuth`, and `context.user`." },
    { q: "How do you protect a page and get the user?", a: "Set `authRequired: true` on the page — it redirects unauthenticated users and passes a typed `user` prop. Elsewhere use `useAuth()` from `wasp/client/auth`; server-side use `context.user`." },
    { q: "What is `with { type: \"ref\" }` in the spec?", a: "A bundler hint: it imports a `src/` implementation as a **reference** (pointer) instead of evaluating it during compilation — the mechanism that links a spec declaration to its code." },
    { q: "What are `job` and `api` for?", a: "`job` = background/recurring work via **pg-boss** (`schedule.cron`, `.submit()`). `api` = a raw Express endpoint (webhooks, downloads) with direct `req`/`res`, outside the operation RPC model." },
    { q: "What powers end-to-end type safety?", a: "The chain `schema.prisma → wasp/entities → operation type (GetTasks<In,Out>) → useQuery/useAction`. Rename a field and every consumer type-errors — no hand-written API client or DTOs." },
    { q: "How do you set up a project and run it?", a: "`wasp new` to scaffold, `wasp start` to compile + run client+server, `wasp start db` for a dev Postgres, `wasp db migrate-dev` after schema changes." },
    { q: "How do you deploy a Wasp app?", a: "`wasp deploy fly launch <app> <region>` then `wasp deploy fly deploy` ships client+server+Postgres in one command (Railway also supported). Or `wasp build` and deploy the artifacts manually." },
    { q: "What is Open SaaS?", a: "A free, actively-maintained SaaS boilerplate built on Wasp: auth, Stripe/Polar payments + subscriptions, background jobs, admin dashboard, S3 uploads, landing page. Scaffold with `wasp new -t saas`." },
    { q: "Why does `wasp/client/operations` fail to resolve?", a: "The `wasp/...` modules are **generated** — they don't exist until a successful `wasp start`/compile. Run it once, then TS resolves them." }
  ],

  cheatsheet: [
    { label: "Install CLI", code: "curl -sSL https://get.wasp.sh/installer.sh | sh" },
    { label: "New project", code: "wasp new myapp -t basic   # or: wasp new -t saas" },
    { label: "Run dev", code: "wasp start                # + `wasp start db` for Postgres" },
    { label: "Migrate DB", code: "wasp db migrate-dev --name add_field" },
    { label: "Declare route+page", code: "route(\"Home\", \"/\", page(MainPage, { authRequired: true }))" },
    { label: "Declare a query", code: "query(getTasks, { entities: [\"Task\"] })" },
    { label: "Query impl", code: "export const getTasks: GetTasks<void, Task[]> = async (a, ctx) => ctx.entities.Task.findMany()" },
    { label: "Use a query", code: "const { data } = useQuery(getTasks)   // from wasp/client/operations" },
    { label: "Declare an action", code: "action(createTask, { entities: [\"Task\"] })" },
    { label: "Optimistic action", code: "useAction(fn, { optimisticUpdates: [{ getQuerySpecifier, updateQuery }] })" },
    { label: "Auth block", code: "auth: { userEntity: \"User\", methods: { email:{}, google:{} }, onAuthFailedRedirectTo: \"/login\" }" },
    { label: "Auth UI + hook", code: "import { LoginForm, useAuth, logout } from \"wasp/client/auth\"" },
    { label: "Ref import (spec)", code: "import { getTasks } from \"./src/queries\" with { type: \"ref\" }" },
    { label: "Recurring job", code: "job(dailyReport, { schedule: { cron: \"0 7 * * *\" }, entities: [\"Task\"] })" },
    { label: "Custom API", code: "api(stripeWebhook, { httpRoute: [\"POST\", \"/webhooks/stripe\"], auth: false })" },
    { label: "Send email", code: "await emailSender.send({ to, subject, text })   // from wasp/server/email" },
    { label: "Deploy (Fly)", code: "wasp deploy fly launch my-app mia && wasp deploy fly deploy" },
    { label: "Build for prod", code: "wasp build   # -> .wasp/build/" }
  ]
});
