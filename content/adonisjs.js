(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "adonisjs",
  name: "AdonisJS",
  language: "TypeScript",
  group: "Fullstack",
  color: "#5a45ff",
  readMinutes: 28,
  tagline: "The **batteries-included TypeScript** MVC framework for Node — \"Laravel for Node\". IoC container, **Lucid** ORM, **VineJS** validation, **Edge** views + **Inertia** SPAs, and the `node ace` CLI, all wired by convention.",

  sections: [
    {
      id: "overview",
      title: "Overview & the AdonisJS mental model",
      level: "core",
      body: [
        { type: "p", text: "AdonisJS is a **fullstack, TypeScript-first, MVC** framework for Node.js. Where Express/Fastify hand you a router and leave the rest to npm, Adonis ships an opinionated, integrated stack: routing, controllers, an ORM (**Lucid**), a validator (**VineJS**), auth, a template engine (**Edge**), an Inertia adapter, mailer, Redis, queues and a first-class testing runner (**Japa**) — all glued together by an **IoC container** and configured by convention. The pitch is \"Laravel for Node\": you spend time on your domain, not on wiring libraries together." },
        { type: "list", items: [
          "**MVC + convention over configuration:** routes → controllers → models → views. Folders have fixed meaning (`app/controllers`, `app/models`, `config/`, `database/migrations`, `resources/views`), so any Adonis codebase reads the same way.",
          "**IoC container + dependency injection:** services are resolved from a central container. Constructor-inject dependencies with the `@inject` decorator; the container builds the graph. This is what makes the framework testable and swappable.",
          "**ESM + subpath imports:** v6 is ESM-only. Instead of `../../../models/user` you write `#models/user`. These `#`-prefixed aliases are Node.js **subpath imports** declared in `package.json`'s `imports` map — no bundler, no `tsconfig` path magic at runtime.",
          "**`node ace` CLI:** every scaffolding/maintenance task is an ace command — `make:controller`, `migration:run`, `serve`, `build`, `test`, `repl`. It is the Adonis equivalent of `artisan` / `rails`.",
          "**Fullstack, your choice of frontend:** render HTML server-side with **Edge**, or build a React/Vue/Svelte SPA with **Inertia** (no separate REST API, end-to-end types), or expose a pure JSON API. One backend, three frontend stories."
        ] },
        { type: "table", headers: ["Concern", "Adonis piece", "Rough analog"], rows: [
          ["Routing", "`start/routes.ts` + `router`", "Express router / Rails routes.rb"],
          ["ORM / DB", "Lucid (Active Record) + Knex", "Eloquent / ActiveRecord / Prisma"],
          ["Validation", "VineJS", "Zod / Laravel FormRequest"],
          ["Views", "Edge templates", "Blade / EJS / ERB"],
          ["SPA bridge", "Inertia adapter + Vite", "Inertia (Laravel) / Next-ish"],
          ["Auth", "@adonisjs/auth + Bouncer", "Passport + CASL / Laravel Gate"],
          ["Tests", "Japa runner", "Jest/Vitest + supertest"],
          ["CLI / codegen", "`node ace`", "artisan / rails"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets **AdonisJS v6** (ESM, VineJS, Lucid, Japa, Inertia). **v7** shipped early 2026 as an *incremental* upgrade — same idioms, mostly package bumps (Lucid 19, better Vite HMR, native `Response` returns), so everything here carries forward. The real trap is **v5**: it used CommonJS, `@ioc:` imports, the old `@ioc:Adonis/Core/Validator`, and `.ioc.rc` — v5 tutorials will not compile on v6. Don't mix them." },
        { type: "callout", variant: "tip", text: "The single best habit: run `node ace list` to see every generator and command, and prefer `node ace make:*` over hand-creating files. The generators wire up imports, register providers, and follow the naming conventions the rest of the framework relies on." }
      ]
    },
    {
      id: "setup",
      title: "Setup, starter kits & project structure",
      level: "core",
      body: [
        { type: "p", text: "Scaffold a new app with the `create-adonisjs` initializer. Pick a **starter kit** with `--kit`: `web` (server-rendered Edge apps), `api` (JSON API, trimmed down), `slim` (bare minimum), or `inertia` (fullstack React/Vue/Svelte SPA with E2E types)." },
        { type: "code", lang: "bash", code: "# note the double `--` so npm forwards flags to the initializer\nnpm init adonisjs@latest my-app -- --kit=web --db=postgres\n\n# other kits\nnpm init adonisjs@latest -- --kit=api        # JSON API server\nnpm init adonisjs@latest -- --kit=inertia --adapter=react --ssr\nnpm init adonisjs@latest -- --kit=slim       # minimal\n\ncd my-app\nnode ace serve --watch     # dev server with file watching + HMR (http://localhost:3333)\n# or: npm run dev" },
        { type: "code", lang: "text", code: "my-app/\n  adonisrc.ts            # app manifest: providers, preloads, commands, metaFiles, test suites\n  bin/\n    server.ts            # HTTP entrypoint      console.ts / test.ts\n  start/\n    routes.ts            # route definitions\n    kernel.ts            # middleware stack (server / router / named)\n    env.ts               # validated env schema\n    events.ts            # event listener bindings (optional)\n  app/\n    controllers/         # HTTP controllers\n    models/              # Lucid models\n    middleware/          # middleware classes\n    validators/          # VineJS validators\n    exceptions/          # custom exceptions + global handler\n    services/            # your domain services (container-injectable)\n  config/                # one file per package (database.ts, auth.ts, ...)\n  database/\n    migrations/          # schema migrations\n    seeders/             # data seeders\n    factories/           # model factories for tests/seeding\n  resources/\n    views/               # Edge templates (.edge)  [web kit]\n    js/  css/            # frontend assets (Vite)\n  tests/\n    functional/  unit/   # Japa test suites\n  .env                   # secrets/config (gitignored)" },
        { type: "p", text: "Subpath imports are declared in `package.json` under `imports`. This is a **Node.js** feature, not TypeScript-only — it works at runtime with no bundler. Add your own aliases here as the app grows." },
        { type: "code", lang: "json", code: "{\n  \"type\": \"module\",\n  \"imports\": {\n    \"#controllers/*\": \"./app/controllers/*.js\",\n    \"#models/*\": \"./app/models/*.js\",\n    \"#middleware/*\": \"./app/middleware/*.js\",\n    \"#validators/*\": \"./app/validators/*.js\",\n    \"#services/*\": \"./app/services/*.js\",\n    \"#start/*\": \"./start/*.js\",\n    \"#config/*\": \"./config/*.js\"\n  }\n}" },
        { type: "callout", variant: "gotcha", text: "Subpath import targets end in **`.js`** even though the source files are `.ts` — the map points at the *compiled* path, and Adonis's dev loader resolves it transparently. Writing `#models/user.ts` (or forgetting the mapping exists for a new top-level folder) is the classic first-day error. Add a new folder? Add its `#alias/*` to `imports` too." },
        { type: "callout", variant: "tip", text: "`.env` values are read through a **validated schema** in `start/env.ts` (next covered under config). Access them via the typed `env` service, never `process.env` directly — you lose validation and types." }
      ]
    },
    {
      id: "routing",
      title: "Routing",
      level: "core",
      body: [
        { type: "p", text: "Routes live in `start/routes.ts`. Import the `router` service and register handlers with `router.get/post/put/patch/delete`. Handlers can be inline closures, but the idiomatic form binds a **controller method** via a lazily-imported tuple `[Controller, 'method']` — lazy imports keep boot fast and avoid circular-import headaches." },
        { type: "code", lang: "ts", code: "import router from '@adonisjs/core/services/router'\nimport { middleware } from '#start/kernel'\n\n// lazy controller import — the recommended pattern\nconst PostsController = () => import('#controllers/posts_controller')\nconst UsersController = () => import('#controllers/users_controller')\n\nrouter.get('/', () => 'hello')                 // inline handler\nrouter.get('/posts', [PostsController, 'index'])\nrouter.get('/posts/:id', [PostsController, 'show'])   // route param -> ctx.params.id\nrouter.post('/posts', [PostsController, 'store'])\n\n// optional & wildcard params, plus a matcher (regex/where)\nrouter.get('/files/*', [PostsController, 'serve'])\nrouter\n  .get('/posts/:id', [PostsController, 'show'])\n  .where('id', router.matchers.number())        // 404 unless id is numeric\n\n// named routes -> build URLs with router.makeUrl('posts.show', { id })\nrouter.get('/posts/:id', [PostsController, 'show']).as('posts.show')" },
        { type: "heading", text: "Groups, resources & route model binding" },
        { type: "code", lang: "ts", code: "// group: shared prefix + middleware\nrouter\n  .group(() => {\n    router.get('/users', [UsersController, 'index'])\n    router.get('/users/:id', [UsersController, 'show'])\n  })\n  .prefix('/api/v1')\n  .use(middleware.auth())            // apply named middleware to the whole group\n\n// resourceful routes: index/create/store/show/edit/update/destroy in one line\nrouter.resource('posts', PostsController)         // 7 RESTful routes\nrouter.resource('posts', PostsController).apiOnly()   // drop create/edit (JSON APIs)\nrouter.resource('posts.comments', CommentsController) // nested: /posts/:post_id/comments" },
        { type: "p", text: "**Route model binding** turns a `:param` into a loaded model instance automatically. Type the controller argument and Adonis queries the model for you (404 if missing)." },
        { type: "code", lang: "ts", code: "import Post from '#models/post'\nimport { bind } from '@adonisjs/route-model-binding'\n\nexport default class PostsController {\n  // #route.get('/posts/:id') — binding resolves Post by its primary key\n  @bind()\n  async show({ view }: HttpContext, post: Post) {\n    return view.render('posts/show', { post })\n  }\n}" },
        { type: "callout", variant: "tip", text: "List every registered route (method, pattern, handler, name, middleware) with `node ace list:routes` — the fastest way to debug a 404 or a name typo. Add `--json` to feed it to tooling." },
        { type: "callout", variant: "gotcha", text: "Order matters: a broad `router.get('/posts/:id')` declared **before** `router.get('/posts/new')` will swallow `/posts/new` (it matches `:id = \"new\"`). Register specific/static routes before dynamic ones, or constrain params with `.where(...)`." }
      ]
    },
    {
      id: "controllers",
      title: "Controllers & HttpContext",
      level: "core",
      body: [
        { type: "p", text: "Controllers are plain classes in `app/controllers`, generated with `node ace make:controller post` (add `--resource` for the seven RESTful stubs). Every method receives a single **`HttpContext`** — the per-request object holding `request`, `response`, `params`, `auth`, `view`, `inertia`, `session`, `bouncer`, `logger` and more. Destructure what you need." },
        { type: "code", lang: "bash", code: "node ace make:controller post              # app/controllers/posts_controller.ts\nnode ace make:controller post --resource   # with index/create/store/show/edit/update/destroy" },
        { type: "code", lang: "ts", code: "import { HttpContext } from '@adonisjs/core/http'\nimport Post from '#models/post'\nimport { createPostValidator } from '#validators/post'\n\nexport default class PostsController {\n  // GET /posts\n  async index({ request, view }: HttpContext) {\n    const page = request.input('page', 1)\n    const posts = await Post.query().orderBy('createdAt', 'desc').paginate(page, 20)\n    return view.render('posts/index', { posts })   // or `return posts` for JSON\n  }\n\n  // POST /posts\n  async store({ request, response, auth }: HttpContext) {\n    const data = await request.validateUsing(createPostValidator)\n    const post = await auth.user!.related('posts').create(data)\n    return response.created(post)                   // 201 + JSON body\n  }\n\n  // GET /posts/:id\n  async show({ params, view }: HttpContext) {\n    const post = await Post.findOrFail(params.id)    // 404 if not found\n    return view.render('posts/show', { post })\n  }\n}" },
        { type: "list", items: [
          "**Return value = response body.** Return a string/object/array and Adonis serializes it (objects/models → JSON). Or drive the response explicitly with `response.status(201).json(...)`, `response.redirect().toRoute('posts.index')`, `response.ok(...)`.",
          "**`ctx.request`:** `request.input('key', default)`, `request.only([...])`, `request.all()`, `request.qs()` (query string), `request.file('avatar')`, `request.header(...)`.",
          "**`ctx.response`:** `.status()`, `.json()`, `.redirect()`, `.created()`, `.notFound()`, `.header()`, cookies via `.cookie()`.",
          "**Dependency injection:** decorate the controller with `@inject()` to constructor-inject services from the container (e.g. a `PostService`) — the container resolves them per request."
        ] },
        { type: "callout", variant: "tip", text: "Keep controllers thin: validate → delegate to a service/model → shape the response. Put domain logic in `app/services/*` (container-injectable classes) so it's reusable from commands, queues and tests, not trapped behind an HTTP handler." }
      ]
    },
    {
      id: "middleware",
      title: "Middleware & the request pipeline",
      level: "core",
      body: [
        { type: "p", text: "Middleware wraps the request pipeline. Adonis has **three kinds**, all registered in `start/kernel.ts`: **server middleware** (runs on every request *before* routing — CORS, static files), **router middleware** (runs on every *matched* route — body parser, session, Shield), and **named middleware** (opt-in per route/group — auth, throttle, your own)." },
        { type: "code", lang: "ts", code: "// start/kernel.ts\nimport router from '@adonisjs/core/services/router'\nimport server from '@adonisjs/core/services/server'\n\n// 1) server middleware — every request, before routing\nserver.use([\n  () => import('#middleware/container_bindings_middleware'),\n  () => import('@adonisjs/static/static_middleware'),\n  () => import('@adonisjs/cors/cors_middleware'),\n])\n\n// 2) router middleware — every matched route\nrouter.use([\n  () => import('@adonisjs/core/bodyparser_middleware'),\n  () => import('@adonisjs/session/session_middleware'),\n  () => import('@adonisjs/shield/shield_middleware'),\n])\n\n// 3) named middleware — referenced explicitly on routes\nexport const middleware = router.named({\n  auth: () => import('#middleware/auth_middleware'),\n  guest: () => import('#middleware/guest_middleware'),\n})" },
        { type: "code", lang: "ts", code: "// app/middleware/auth_middleware.ts  (node ace make:middleware auth)\nimport { HttpContext } from '@adonisjs/core/http'\nimport { NextFn } from '@adonisjs/core/types/http'\n\nexport default class AuthMiddleware {\n  async handle(ctx: HttpContext, next: NextFn, options: { guards?: string[] } = {}) {\n    // work BEFORE the route handler\n    await ctx.auth.authenticateUsing(options.guards)\n\n    const result = await next()   // run the rest of the pipeline / handler\n\n    // work AFTER the handler (result unused here)\n    return result\n  }\n}" },
        { type: "p", text: "Apply named middleware on a route or group. Middleware that takes options is called as a factory:" },
        { type: "code", lang: "ts", code: "import { middleware } from '#start/kernel'\n\nrouter.get('/dashboard', [DashboardController, 'index']).use(middleware.auth())\nrouter.group(() => { /* ... */ }).use(middleware.auth({ guards: ['web'] }))" },
        { type: "callout", variant: "gotcha", text: "Everything **before** `await next()` runs on the way in; everything **after** runs on the way out (in reverse order). Forgetting to `await next()` silently hangs the request — nothing downstream ever runs. And code after `next()` executes *after* the response is prepared, so you can't change the status there." },
        { type: "callout", variant: "note", text: "Order in `server.use`/`router.use` is execution order. Session must come before Shield (CSRF needs the session); bodyparser before anything reading `request.body()`. The starter kits ship a sane order — don't reshuffle without reason." }
      ]
    },
    {
      id: "validation",
      title: "Request handling & VineJS validation",
      level: "core",
      body: [
        { type: "p", text: "**VineJS** is Adonis's dedicated validation library — schema-first, extremely fast, and fully typed (the validated payload's TypeScript type is inferred from the schema). Define validators in `app/validators`, compile them once, and run them with `request.validateUsing(...)`, which merges body + query + files into the data automatically." },
        { type: "code", lang: "ts", code: "// app/validators/post.ts\nimport vine from '@vinejs/vine'\n\nexport const createPostValidator = vine.compile(\n  vine.object({\n    title: vine.string().trim().minLength(6).maxLength(120),\n    slug: vine.string().trim().regex(/^[a-z0-9-]+$/),\n    body: vine.string().trim().escape(),\n    isPublished: vine.boolean().optional(),\n    tags: vine.array(vine.string()).minLength(1).optional(),\n    // async DB rule: email must be unique\n    authorEmail: vine.string().email().unique(async (db, value) => {\n      const row = await db.from('users').where('email', value).first()\n      return !row\n    }),\n  })\n)\n\nexport const updatePostValidator = vine.compile(\n  vine.object({\n    title: vine.string().trim().minLength(6).optional(),\n    body: vine.string().trim().optional(),\n  })\n)" },
        { type: "code", lang: "ts", code: "// in a controller — payload is fully typed, throws E_VALIDATION_ERROR (422) on failure\nasync store({ request, auth }: HttpContext) {\n  const payload = await request.validateUsing(createPostValidator)\n  return auth.user!.related('posts').create(payload)\n}\n\n// pass runtime metadata (e.g. exclude current user from a unique check)\nasync update({ request, params, auth }: HttpContext) {\n  const payload = await request.validateUsing(updateUserValidator, {\n    meta: { userId: auth.user!.id },\n  })\n}" },
        { type: "p", text: "Customize messages globally or per-field, and register **custom rules** for logic beyond the built-ins." },
        { type: "code", lang: "ts", code: "// custom messages\nimport vine from '@vinejs/vine'\nvine.messagesProvider = new vine.SimpleMessagesProvider({\n  'minLength': '{{ field }} must be at least {{ min }} characters',\n  'title.required': 'A post needs a title',\n})\n\n// a reusable custom rule\nconst mustBeEven = vine.createRule((value, _opts, field) => {\n  if (typeof value !== 'number') return\n  if (value % 2 !== 0) field.report('{{ field }} must be even', 'even', field)\n})\nconst schema = vine.object({ seats: vine.number().use(mustBeEven()) })" },
        { type: "callout", variant: "gotcha", text: "A failed `validateUsing` throws `E_VALIDATION_ERROR` (HTTP 422). The **global exception handler** (`app/exceptions/handler.ts`) already turns it into a JSON error list or a flash-and-redirect for web forms — you usually don't catch it in the controller. For web forms, read errors back in Edge via `flashMessages.get('errors')` / the `@error` tag." },
        { type: "callout", variant: "tip", text: "`vine.compile()` builds an optimized validator once at module load — compile at the top level, not inside the request handler, or you pay the compile cost per request. The inferred type is available via `Infer<typeof createPostValidator>` if you need it in a service signature." }
      ]
    },
    {
      id: "lucid-models",
      title: "Lucid ORM: models & migrations",
      level: "core",
      body: [
        { type: "p", text: "**Lucid** is Adonis's Active Record ORM, built on **Knex**. Models are classes extending `BaseModel`; each `@column`-decorated property maps to a table column. Schema is evolved through **migrations** (versioned, up/down), never edited by hand in the DB. Configure the connection in `config/database.ts` (supports PostgreSQL, MySQL, SQLite, MSSQL)." },
        { type: "code", lang: "bash", code: "node ace make:model Post -m       # model + migration in one shot\nnode ace make:migration posts     # just a migration\nnode ace migration:run            # apply pending migrations\nnode ace migration:rollback       # undo the last batch\nnode ace migration:fresh --seed   # drop all, re-run, then seed (dev only!)\nnode ace migration:status         # what's applied vs pending" },
        { type: "code", lang: "ts", code: "// app/models/post.ts\nimport { DateTime } from 'luxon'\nimport { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'\nimport type { BelongsTo } from '@adonisjs/lucid/types/relations'\nimport User from '#models/user'\nimport { cuid } from '@adonisjs/core/helpers'\n\nexport default class Post extends BaseModel {\n  @column({ isPrimary: true })\n  declare id: number\n\n  @column()\n  declare title: string\n\n  @column()\n  declare slug: string\n\n  @column({ columnName: 'is_published' })\n  declare isPublished: boolean\n\n  @column()\n  declare userId: number\n\n  @belongsTo(() => User)\n  declare author: BelongsTo<typeof User>\n\n  @column.dateTime({ autoCreate: true })\n  declare createdAt: DateTime\n\n  @column.dateTime({ autoCreate: true, autoUpdate: true })\n  declare updatedAt: DateTime\n\n  // model hook — runs before every INSERT\n  @beforeCreate()\n  static assignSlug(post: Post) {\n    if (!post.slug) post.slug = cuid()\n  }\n}" },
        { type: "code", lang: "ts", code: "// database/migrations/xxxx_create_posts_table.ts\nimport { BaseSchema } from '@adonisjs/lucid/schema'\n\nexport default class extends BaseSchema {\n  protected tableName = 'posts'\n\n  async up() {\n    this.schema.createTable(this.tableName, (table) => {\n      table.increments('id')\n      table.string('title').notNullable()\n      table.string('slug').notNullable().unique()\n      table.boolean('is_published').defaultTo(false)\n      table\n        .integer('user_id')\n        .unsigned()\n        .references('id').inTable('users')\n        .onDelete('CASCADE')\n      table.timestamp('created_at')\n      table.timestamp('updated_at')\n    })\n  }\n\n  async down() {\n    this.schema.dropTable(this.tableName)\n  }\n}" },
        { type: "callout", variant: "gotcha", text: "Lucid uses **snake_case** columns in the DB but **camelCase** in models by default (`createdAt` ↔ `created_at`), handled by the `NamingStrategy`. When a property name doesn't map cleanly, set `@column({ columnName: 'is_published' })`. Getting this mapping wrong yields silent `undefined`s, not errors." },
        { type: "callout", variant: "warn", text: "`migration:fresh` and `migration:rollback --batch=0` **drop data** — they're for dev/test only. In production you only ever run `migration:run` (forward-only). Never edit an already-applied migration; write a new one." }
      ]
    },
    {
      id: "lucid-queries",
      title: "Lucid: query builder, relationships & transactions",
      level: "core",
      body: [
        { type: "p", text: "Models expose Active-Record statics (`.find`, `.create`, `.findOrFail`, `.updateOrCreate`) and a fluent **query builder** (`Model.query()`) for anything richer. Relationships are declared with decorators and loaded with **`preload`** — the mechanism that prevents N+1 queries." },
        { type: "code", lang: "ts", code: "// basics\nconst post   = await Post.find(1)              // Post | null\nconst post2  = await Post.findOrFail(1)         // throws 404 if missing\nconst fresh  = await Post.create({ title: 'Hi', userId: 1 })\nawait Post.updateOrCreate({ slug: 'hi' }, { title: 'Hi', userId: 1 })\n\n// query builder\nconst posts = await Post.query()\n  .where('isPublished', true)\n  .whereILike('title', `%${term}%`)\n  .orderBy('createdAt', 'desc')\n  .preload('author')                 // eager-load belongsTo -> no N+1\n  .paginate(page, 20)\n\n// aggregates, raw, transactions-aware\nconst count = await Post.query().where('isPublished', true).count('* as total')" },
        { type: "heading", text: "Relationships" },
        { type: "code", lang: "ts", code: "import { hasMany, belongsTo, manyToMany } from '@adonisjs/lucid/orm'\nimport type { HasMany, BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'\n\nexport default class User extends BaseModel {\n  @hasMany(() => Post)\n  declare posts: HasMany<typeof Post>\n\n  @manyToMany(() => Role, { pivotTable: 'role_user' })\n  declare roles: ManyToMany<typeof Role>\n}\n\n// working through relationships\nconst user = await User.query().preload('posts').preload('roles').firstOrFail()\nawait user.related('posts').create({ title: 'From relation' })   // sets user_id for you\nawait user.related('roles').attach([roleId])                     // pivot insert\n\n// nested + constrained preload\nawait User.query().preload('posts', (q) => q.where('isPublished', true).limit(5))" },
        { type: "heading", text: "Transactions" },
        { type: "code", lang: "ts", code: "import db from '@adonisjs/lucid/services/db'\n\n// managed transaction: auto-commit on success, auto-rollback on throw\nawait db.transaction(async (trx) => {\n  const user = await User.create({ email }, { client: trx })\n  await user.related('posts').create({ title }, { client: trx })\n  // any throw here rolls the whole thing back\n})" },
        { type: "table", headers: ["Relationship", "Decorator", "FK lives on"], rows: [
          ["one-to-many", "`@hasMany(() => Post)`", "child (`posts.user_id`)"],
          ["inverse / owning", "`@belongsTo(() => User)`", "self (`posts.user_id`)"],
          ["one-to-one", "`@hasOne(() => Profile)`", "child (`profiles.user_id`)"],
          ["many-to-many", "`@manyToMany(() => Role)`", "pivot table (`role_user`)"],
          ["through", "`@hasManyThrough([...])`", "intermediate model"]
        ] },
        { type: "callout", variant: "warn", text: "**The N+1 trap:** looping over `users` and doing `await user.posts` inside the loop fires one query per user. Always `preload('posts')` (or `.load('posts')` on an existing instance) to batch it into a single `WHERE user_id IN (...)`. This is the most common Lucid performance bug." }
      ]
    },
    {
      id: "seeders-factories",
      title: "Seeders & factories",
      level: "deep",
      body: [
        { type: "p", text: "**Seeders** populate the database with baseline or demo data; **factories** generate model instances with fake data for seeding and tests (Faker built in). Both live under `database/`." },
        { type: "code", lang: "bash", code: "node ace make:seeder User        # database/seeders/user_seeder.ts\nnode ace make:factory Post       # database/factories/post_factory.ts\nnode ace db:seed                 # run all seeders" },
        { type: "code", lang: "ts", code: "// database/factories/post_factory.ts\nimport factory from '@adonisjs/lucid/factories'\nimport Post from '#models/post'\nimport { UserFactory } from '#database/factories/user_factory'\n\nexport const PostFactory = factory\n  .define(Post, ({ faker }) => ({\n    title: faker.lorem.sentence(),\n    slug: faker.helpers.slugify(faker.lorem.words(3)),\n    body: faker.lorem.paragraphs(2),\n    isPublished: faker.datatype.boolean(),\n  }))\n  .relation('author', () => UserFactory)   // wire relationships\n  .build()\n\n// usage (seeder or test)\nawait PostFactory.merge({ isPublished: true }).createMany(20)\nawait PostFactory.with('author').create()" },
        { type: "code", lang: "ts", code: "// database/seeders/user_seeder.ts\nimport { BaseSeeder } from '@adonisjs/lucid/seeders'\nimport { UserFactory } from '#database/factories/user_factory'\n\nexport default class extends BaseSeeder {\n  async run() {\n    await UserFactory.with('posts', 3).createMany(10)   // 10 users, 3 posts each\n  }\n}" },
        { type: "callout", variant: "tip", text: "Mark a seeder's `static environment = ['development', 'testing']` so demo data never runs in production. Factories are the right source of test data — they keep tests independent of hand-written fixtures and make relationships trivial (`.with('posts', 3)`)." }
      ]
    },
    {
      id: "auth",
      title: "Authentication: guards, providers & tokens",
      level: "core",
      body: [
        { type: "p", text: "`@adonisjs/auth` authenticates requests via configurable **guards** over a **user provider**. The three built-in guards: **session** (cookie-based, for server-rendered web apps), **access tokens** (opaque bearer tokens in the DB, for APIs/mobile), and **basic** (HTTP Basic). Install with `node ace add @adonisjs/auth --guard=access_tokens` (or `session`)." },
        { type: "code", lang: "ts", code: "// config/auth.ts — access tokens guard over a Lucid user provider\nimport { defineConfig } from '@adonisjs/auth'\nimport { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'\nimport { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'\n\nconst authConfig = defineConfig({\n  default: 'api',\n  guards: {\n    api: tokensGuard({\n      provider: tokensUserProvider({\n        tokens: 'accessTokens',\n        model: () => import('#models/user'),\n      }),\n    }),\n    web: sessionGuard({\n      useRememberMeTokens: true,\n      provider: sessionUserProvider({ model: () => import('#models/user') }),\n    }),\n  },\n})\nexport default authConfig" },
        { type: "p", text: "The **User model** mixes in `withAuthFinder` (verifies credentials + auto-hashes the password) and, for the tokens guard, declares an `accessTokens` provider." },
        { type: "code", lang: "ts", code: "import { BaseModel, column } from '@adonisjs/lucid/orm'\nimport { compose } from '@adonisjs/core/helpers'\nimport hash from '@adonisjs/core/services/hash'\nimport { withAuthFinder } from '@adonisjs/auth/mixins/lucid'\nimport { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'\n\nconst AuthFinder = withAuthFinder(() => hash.use('scrypt'), {\n  uids: ['email'],            // columns you can log in with\n  passwordColumnName: 'password',\n})\n\nexport default class User extends compose(BaseModel, AuthFinder) {\n  @column({ isPrimary: true }) declare id: number\n  @column() declare email: string\n  @column({ serializeAs: null }) declare password: string   // never serialized to JSON\n\n  static accessTokens = DbAccessTokensProvider.forModel(User)\n}" },
        { type: "code", lang: "ts", code: "// controller: login flows\nexport default class SessionController {\n  // token login (API)\n  async apiLogin({ request }: HttpContext) {\n    const { email, password } = request.only(['email', 'password'])\n    const user = await User.verifyCredentials(email, password)   // throws on bad creds\n    const token = await User.accessTokens.create(user)\n    return { token: token.value!.release() }   // release() gives the plaintext ONCE\n  }\n\n  // session login (web)\n  async webLogin({ request, auth, response }: HttpContext) {\n    const { email, password } = request.only(['email', 'password'])\n    const user = await User.verifyCredentials(email, password)\n    await auth.use('web').login(user)\n    return response.redirect('/dashboard')\n  }\n\n  // protected handler — middleware.auth() already ran\n  async me({ auth }: HttpContext) {\n    await auth.authenticate()          // populates auth.user or throws E_UNAUTHORIZED_ACCESS\n    return auth.user\n  }\n}" },
        { type: "callout", variant: "gotcha", text: "Access token `value` is only readable **at creation** — `token.value!.release()` returns the plaintext once and it's never recoverable (the DB stores a hash). Show/store it client-side immediately. Losing it means issuing a new token." },
        { type: "callout", variant: "tip", text: "Protect routes by attaching `middleware.auth({ guards: ['api'] })`; inside handlers, `auth.user!` is the authenticated user. Use `auth.authenticateUsing(['api','web'])` to accept multiple guards on one endpoint (e.g. both cookie and bearer)." }
      ]
    },
    {
      id: "bouncer",
      title: "Authorization with Bouncer",
      level: "core",
      body: [
        { type: "p", text: "Authentication asks *who are you*; **authorization** asks *are you allowed*. Adonis ships **Bouncer** for that: define **abilities** (small allow/deny functions) or **policies** (a class of related checks per resource). Install with `node ace add @adonisjs/bouncer` — it wires an initialize middleware that puts `ctx.bouncer` (scoped to the current user) on every request." },
        { type: "code", lang: "ts", code: "// app/abilities/main.ts — lightweight abilities\nimport { Bouncer } from '@adonisjs/bouncer'\nimport User from '#models/user'\nimport Post from '#models/post'\n\nexport const editPost = Bouncer.ability((user: User, post: Post) => {\n  return user.id === post.userId || user.isAdmin\n})" },
        { type: "code", lang: "ts", code: "// app/policies/post_policy.ts  (node ace make:policy post)\nimport { BasePolicy } from '@adonisjs/bouncer'\nimport { AuthorizerResponse } from '@adonisjs/bouncer/types'\nimport User from '#models/user'\nimport Post from '#models/post'\n\nexport default class PostPolicy extends BasePolicy {\n  create(user: User): AuthorizerResponse { return !!user }\n  update(user: User, post: Post): AuthorizerResponse { return user.id === post.userId }\n  delete(user: User, post: Post): AuthorizerResponse { return user.id === post.userId || user.isAdmin }\n}" },
        { type: "code", lang: "ts", code: "// in a controller\nasync update({ bouncer, params, request }: HttpContext) {\n  const post = await Post.findOrFail(params.id)\n\n  // ability form\n  if (await bouncer.allows(editPost, post)) { /* ok */ }\n\n  // policy form — throws E_AUTHORIZATION_FAILURE (403) if denied\n  await bouncer.with(PostPolicy).authorize('update', post)\n\n  post.merge(request.only(['title', 'body']))\n  await post.save()\n  return post\n}" },
        { type: "p", text: "In Edge templates use the `@can` / `@cannot` tags to conditionally render UI (e.g. an Edit button)." },
        { type: "code", lang: "html", code: "@can('PostPolicy.update', post)\n  <a href=\"/posts/{{ post.id }}/edit\">Edit</a>\n@end\n@cannot('PostPolicy.delete', post)\n  <span class=\"muted\">You can't delete this</span>\n@end" },
        { type: "callout", variant: "tip", text: "`bouncer.allows(...)` returns a boolean (branch on it); `bouncer.authorize(...)` throws a 403 you let bubble to the exception handler. Use `authorize` at the top of a controller method as a guard clause, `allows` when you need to render or decide inline." }
      ]
    },
    {
      id: "edge",
      title: "Frontend I — Edge templates (server-rendered)",
      level: "core",
      body: [
        { type: "p", text: "**Edge** is Adonis's template engine for server-rendered HTML (the `web` starter kit's default view layer). Templates live in `resources/views/*.edge`, use `{{ }}` for **auto-escaped** interpolation and `@`-prefixed tags for logic. Render from a controller with `view.render('path', data)`." },
        { type: "code", lang: "ts", code: "// controller\nasync index({ view }: HttpContext) {\n  const posts = await Post.query().preload('author')\n  return view.render('posts/index', { posts, title: 'Blog' })\n}" },
        { type: "code", lang: "html", code: "{{-- resources/views/layouts/main.edge --}}\n<!DOCTYPE html>\n<html>\n<head>\n  <title>{{ title }}</title>\n  @vite(['resources/css/app.css', 'resources/js/app.js'])\n</head>\n<body>\n  @include('partials/nav')\n  <main>{{{ await $slots.main() }}}</main>\n</body>\n</html>" },
        { type: "code", lang: "html", code: "{{-- resources/views/posts/index.edge --}}\n@layout.main()\n  @slot('main')\n    <h1>{{ title }}</h1>\n\n    @each(post in posts)\n      <article>\n        <h2>{{ post.title }}</h2>\n        <p>by {{ post.author.email }}</p>\n        {{-- {{ }} escapes HTML; {{{ }}} renders raw/trusted HTML --}}\n        <div>{{{ post.body }}}</div>\n      </article>\n    @else\n      <p>No posts yet.</p>\n    @end\n\n    @if(auth.user)\n      <a href=\"{{ route('posts.create') }}\">New post</a>\n    @end\n  @end\n@end" },
        { type: "list", items: [
          "**`{{ value }}`** auto-escapes HTML (XSS-safe). **`{{{ value }}}`** renders raw — only for HTML you trust.",
          "**Tags:** `@if/@elseif/@else/@end`, `@each(item in list)`, `@include('partial')`, `@component(...)` / `@slot(...)`, `@vite([...])`, `@can/@cannot`, `@error('field')`, `@csrfField()`.",
          "**Components** are reusable `.edge` files taking props + slots — the modern alternative to layouts/partials for composable UI. Layouts (as above) use slots for the page body.",
          "**Globals:** `route(name, params)`, `request`, `auth`, `flashMessages`, `csrfField()` are available in every template; register your own with `edge.global(...)` in a provider."
        ] },
        { type: "callout", variant: "gotcha", text: "Reach for `{{{ }}}` (triple-brace, unescaped) only for content you generated or sanitized — piping user input through it is a direct **XSS** hole. Default to `{{ }}` everywhere; if markdown/rich text must render as HTML, sanitize it server-side first." }
      ]
    },
    {
      id: "inertia",
      title: "Frontend II — Inertia SPAs & Vite",
      level: "core",
      body: [
        { type: "p", text: "**Inertia** lets you build a **React / Vue / Svelte single-page app** that talks to your Adonis backend with *no separate REST API and no client-side router*. Controllers return `inertia.render('PageComponent', props)`; Inertia swaps the page component client-side and passes props as the component's props — you get SPA UX with server-driven routing and (with the TS adapters) **end-to-end type safety**. Scaffold with the `inertia` starter kit or `node ace add @adonisjs/inertia`." },
        { type: "code", lang: "ts", code: "// controller — render an Inertia page instead of an Edge view\nexport default class UsersController {\n  async index({ inertia }: HttpContext) {\n    const users = await User.query().select('id', 'email').orderBy('email')\n    return inertia.render('users/index', {\n      users,\n      // lazy prop: only evaluated when explicitly requested (partial reloads)\n      stats: inertia.optional(() => computeExpensiveStats()),\n    })\n  }\n}" },
        { type: "code", lang: "tsx", code: "// inertia/pages/users/index.tsx (React adapter)\nimport { Head, Link, router } from '@inertiajs/react'\n\ntype Props = { users: { id: number; email: string }[] }\n\nexport default function UsersIndex({ users }: Props) {\n  return (\n    <>\n      <Head title=\"Users\" />\n      <ul>\n        {users.map((u) => (\n          <li key={u.id}>\n            <Link href={`/users/${u.id}`}>{u.email}</Link>\n          </li>\n        ))}\n      </ul>\n      {/* form submit -> hits an Adonis route, no fetch/axios needed */}\n      <button onClick={() => router.post('/users', { email: 'a@b.co' })}>Add</button>\n    </>\n  )\n}" },
        { type: "p", text: "**Vite** bundles the frontend and drives HMR in dev. The Adonis dev server (`node ace serve --watch`) runs Vite alongside the HTTP server; the `@vite` Edge tag (or Inertia's root template) injects the right script/style tags and switches to hashed assets in production." },
        { type: "code", lang: "ts", code: "// vite.config.ts\nimport { defineConfig } from 'vite'\nimport adonisjs from '@adonisjs/vite/client'\nimport react from '@vitejs/plugin-react'\nimport inertia from '@adonisjs/inertia/client'\n\nexport default defineConfig({\n  plugins: [\n    inertia({ ssr: { enabled: true, entrypoint: 'inertia/app/ssr.tsx' } }),\n    react(),\n    adonisjs({ entrypoints: ['inertia/app/app.tsx'] }),\n  ],\n})" },
        { type: "table", headers: ["Choose", "When"], rows: [
          ["**Edge**", "Content sites, forms, low interactivity, SEO-first, minimal JS. Simplest deploy."],
          ["**Inertia**", "App-like UI (dashboards, CRUD) wanting SPA feel + component frameworks, no separate API."],
          ["**API kit + separate SPA**", "You already have (or need) a standalone frontend, multiple clients, or mobile apps."]
        ] },
        { type: "callout", variant: "gotcha", text: "Inertia props are serialized to JSON and embedded in the page — don't return whole Lucid models with secrets. Use `.select(...)`, a serializer, or DTOs, and remember `serializeAs: null` columns (like `password`) are already stripped by Lucid's serializer but *not* if you hand-build the object." },
        { type: "callout", variant: "tip", text: "Inertia SSR (`--ssr`) renders the first paint on the server for SEO/perf, then hydrates. It needs a second Node process/entrypoint (`ssr.tsx`) built by `node ace build`. If you don't need SEO on app screens, skip SSR to simplify the deploy." }
      ]
    },
    {
      id: "container-services",
      title: "IoC container, providers, events, mail & Redis",
      level: "deep",
      body: [
        { type: "p", text: "The **IoC container** resolves and wires your services. Constructor-inject with `@inject()` and the container builds the whole dependency graph — you never `new` a service by hand. **Service providers** (`providers/*`) register bindings and run boot/start/shutdown lifecycle hooks; register them in `adonisrc.ts`." },
        { type: "code", lang: "ts", code: "// app/services/report_service.ts\nimport { inject } from '@adonisjs/core'\nimport Mailer from '#services/mailer'\n\n@inject()\nexport default class ReportService {\n  // Mailer is resolved & injected by the container\n  constructor(private mailer: Mailer) {}\n  async sendDaily() { /* ... */ }\n}\n\n// resolve manually when needed\nimport app from '@adonisjs/core/services/app'\nconst reports = await app.container.make(ReportService)" },
        { type: "heading", text: "Events & the emitter" },
        { type: "code", lang: "ts", code: "// emit from anywhere\nimport emitter from '@adonisjs/core/services/emitter'\nawait emitter.emit('user:registered', user)\n\n// bind listeners in start/events.ts\nemitter.on('user:registered', [() => import('#listeners/send_welcome_email'), 'handle'])" },
        { type: "heading", text: "Mail & Redis" },
        { type: "code", lang: "ts", code: "// @adonisjs/mail — node ace add @adonisjs/mail\nimport mail from '@adonisjs/mail/services/main'\n\nawait mail.send((message) => {\n  message.to(user.email).from('hello@app.co')\n    .subject('Welcome!').htmlView('emails/welcome', { user })\n})\nawait mail.sendLater(/* ... */)   // push onto the mail queue instead of blocking\n\n// @adonisjs/redis — node ace add @adonisjs/redis\nimport redis from '@adonisjs/redis/services/main'\nawait redis.set('cache:posts', JSON.stringify(posts), 'EX', 60)\nconst cached = await redis.get('cache:posts')" },
        { type: "callout", variant: "note", text: "Adonis has no built-in job queue; the common stack is **BullMQ** (Redis-backed) via a community package (`@rlanz/bull-queue` or `adonisjs-jobs`), plus `@adonisjs/scheduler` (or cron) for recurring tasks. `mail.sendLater` uses an in-memory queue by default — wire it to a real transport/queue for production." },
        { type: "callout", variant: "tip", text: "Bind interfaces to implementations in a provider (`container.bind(IPayments, () => new StripePayments())`) so tests can swap a fake. This container-first design is why Adonis code is easy to unit-test — inject a stub, no monkey-patching." }
      ]
    },
    {
      id: "config-security",
      title: "Config, env validation & security (Shield/CORS/static)",
      level: "core",
      body: [
        { type: "p", text: "Config lives in `config/*.ts` (one file per package), read via typed helpers. **Every environment variable is validated at boot** by the schema in `start/env.ts` — a missing or malformed var crashes the app immediately with a clear message, instead of blowing up mid-request." },
        { type: "code", lang: "ts", code: "// start/env.ts\nimport { Env } from '@adonisjs/core/env'\n\nexport default await Env.create(new URL('../', import.meta.url), {\n  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),\n  PORT: Env.schema.number(),\n  APP_KEY: Env.schema.string(),                 // signs cookies/sessions — keep secret\n  HOST: Env.schema.string({ format: 'host' }),\n  DB_HOST: Env.schema.string({ format: 'host' }),\n  DB_PORT: Env.schema.number(),\n  DB_USER: Env.schema.string(),\n  DB_PASSWORD: Env.schema.string.optional(),\n  SESSION_DRIVER: Env.schema.enum(['cookie', 'redis'] as const),\n})" },
        { type: "code", lang: "ts", code: "// read env + config anywhere (typed)\nimport env from '#start/env'\nimport { defineConfig } from '@adonisjs/cors'\n\nconst dbHost = env.get('DB_HOST')          // typed as string\nconst port = env.get('PORT')               // typed as number\n\n// config/cors.ts\nexport default defineConfig({\n  enabled: true,\n  origin: ['https://app.example.com'],     // don't ship '*' with credentials\n  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],\n  credentials: true,\n})" },
        { type: "list", items: [
          "**@adonisjs/shield** — security headers, **CSRF protection** (`@csrfField()` in forms), CSP, X-Frame-Options. Registered as router middleware; enabled by the web kit.",
          "**@adonisjs/cors** — cross-origin config for API kits. Lock `origin` down; never combine `origin: '*'` with `credentials: true`.",
          "**@adonisjs/static** — serves `public/` as server middleware.",
          "**Hashing / encryption** — `hash` service (scrypt/argon2/bcrypt) for passwords, `encryption` service (uses `APP_KEY`) for signed/encrypted values."
        ] },
        { type: "callout", variant: "warn", text: "`APP_KEY` signs cookies, sessions and encrypted payloads. Rotating or losing it invalidates all existing sessions and signed cookies; committing it to git is a critical leak. Generate per-environment (`node ace generate:key`) and inject via the deploy platform's secrets, not `.env` in the repo." },
        { type: "callout", variant: "gotcha", text: "Reading `process.env.FOO` directly bypasses validation and typing — you get `string | undefined` and no boot-time check. Always go through the `env` service (`env.get('FOO')`); if it's not in the schema, add it there first." }
      ]
    },
    {
      id: "testing",
      title: "Testing with Japa",
      level: "core",
      body: [
        { type: "p", text: "**Japa** is Adonis's own test runner (no Jest). Tests live in `tests/`, split into **suites** (declared in `adonisrc.ts`) — typically `unit` (fast, no HTTP boot) and `functional` (boots the app + an in-memory HTTP/API client). Run with `node ace test`." },
        { type: "code", lang: "bash", code: "node ace test                 # all suites\nnode ace test functional      # one suite\nnode ace test --watch         # re-run on change\nnode ace test --files posts   # filter by filename\nnode ace make:test PostsList --suite=functional" },
        { type: "code", lang: "ts", code: "// tests/functional/posts.spec.ts\nimport { test } from '@japa/runner'\nimport testUtils from '@adonisjs/core/services/test_utils'\nimport { UserFactory } from '#database/factories/user_factory'\n\ntest.group('Posts', (group) => {\n  // wrap EVERY test in a transaction that rolls back -> clean DB, no teardown\n  group.each.setup(() => testUtils.db().withGlobalTransaction())\n\n  test('lists published posts', async ({ client }) => {\n    const response = await client.get('/posts')\n    response.assertStatus(200)\n    response.assertBodyContains([{ title: 'Hello' }])\n  })\n\n  test('creates a post when authenticated', async ({ client }) => {\n    const user = await UserFactory.create()\n    const response = await client\n      .post('/posts')\n      .loginAs(user)                       // sets up the auth guard for the request\n      .json({ title: 'From test', slug: 'from-test', body: 'x' })\n\n    response.assertStatus(201)\n    response.assertBodyContains({ title: 'From test' })\n  })\n})" },
        { type: "list", items: [
          "**`client`** (`@japa/api-client`) drives real HTTP requests against the booted app: `.get/.post/...`, `.json()`, `.form()`, `.header()`, `.loginAs(user)`, and asserts (`assertStatus`, `assertBodyContains`, `assertCookie`).",
          "**Global DB transaction** (`testUtils.db().withGlobalTransaction()`) wraps each test and rolls back after — the standard way to keep tests isolated without truncating tables.",
          "**Migrations for the test DB:** `testUtils.db().migrate()` in a suite `setup` hook, or run against a dedicated test database/SQLite.",
          "**Unit tests** need no app boot — import the class/service and assert directly; inject fakes via the container."
        ] },
        { type: "callout", variant: "tip", text: "Configure lifecycle hooks (migrate, seed, global transaction) in the suite's `configure` function in `tests/bootstrap.ts`. Use a separate test database (or in-memory SQLite via `DB_CONNECTION` in `.env.test`) so tests never touch dev data — Japa loads `.env.test` automatically when `NODE_ENV=test`." }
      ]
    },
    {
      id: "deployment",
      title: "Building & deploying to production",
      level: "core",
      body: [
        { type: "p", text: "`node ace build` compiles TypeScript to plain JS in `build/`, copies non-TS assets (and runs the Vite frontend build), and produces a self-contained folder you deploy. The runtime entrypoint is `build/bin/server.js`." },
        { type: "code", lang: "bash", code: "# 1) build (frontend + backend) — outputs ./build\nnode ace build\n\n# 2) on the server: install prod deps INSIDE build/\ncd build\nnpm ci --omit=dev\n\n# 3) run pending migrations (forward-only in prod)\nnode ace migration:run --force      # --force required when NODE_ENV=production\n\n# 4) start the server\nnode bin/server.js" },
        { type: "list", items: [
          "**`--force`** is mandatory for `migration:run`/`db:seed` in production — a guard against accidental prod schema changes.",
          "**Env:** set `NODE_ENV=production`, a real `APP_KEY`, DB creds, `HOST=0.0.0.0`, `PORT`, and `SESSION_DRIVER=redis` (cookie sessions don't scale across instances). The env schema fails fast if any are missing.",
          "**Assets:** `node ace build` runs `vite build`; serve hashed assets from `public/assets` (or a CDN). The `@vite` tag emits production tags automatically.",
          "**Process manager:** run `node bin/server.js` under PM2, systemd, or a container. Adonis is a long-lived Node process; put Nginx/a load balancer in front for TLS and multiple instances.",
          "**Docker:** multi-stage build — `node ace build` in a builder stage, copy `build/` into a slim runtime image, `npm ci --omit=dev`, `CMD node bin/server.js`."
        ] },
        { type: "callout", variant: "gotcha", text: "Don't run the app from `build/` with dev deps or from the source tree in prod. And don't forget to build the **frontend** — if Vite assets aren't built or the manifest is missing, `@vite` throws at render time. `node ace build` handles both, but a custom CI must run it (not just `tsc`)." },
        { type: "callout", variant: "tip", text: "Migrations are a **deploy step**, not app-boot magic — run `node ace migration:run --force` as a release command before switching traffic to the new version, so a failed migration blocks the deploy instead of half-migrating live." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that trip up AdonisJS developers — most are about ESM/version drift and the ORM, and each has a clean fix." },
        { type: "heading", text: "1. ESM subpath import confusion" },
        { type: "callout", variant: "gotcha", text: "`#controllers/*` etc. are Node **subpath imports** declared in `package.json`'s `imports`, targeting `.js` paths. A new top-level folder needs its own `#alias/*` entry or imports fail; and you write `#models/user` (no extension), never `#models/user.ts`. When an import mysteriously can't resolve, check the `imports` map first." },
        { type: "heading", text: "2. v5-vs-v6 (and v7) API drift" },
        { type: "callout", variant: "warn", text: "v5 was CommonJS with `@ioc:Adonis/...` imports, the old validator, and `HttpContextContract`. v6/v7 are ESM with `#`-imports, VineJS, `HttpContext`, and container `@inject`. **v5 tutorials won't compile on v6.** v6→v7 is smooth (package bumps), but always confirm a snippet targets v6+ before copying." },
        { type: "heading", text: "3. Forgetting `preload` → N+1 queries" },
        { type: "callout", variant: "gotcha", text: "Accessing a relationship inside a loop (`for (const u of users) { await u.posts }`) fires one query per row. **Fix:** `preload('posts')` on the query (or `.load('posts')` on a loaded instance) to batch into a single `IN (...)`. Watch your query log in dev — a burst of identical queries is the tell." },
        { type: "heading", text: "4. Migrations vs schema drift" },
        { type: "callout", variant: "warn", text: "Never edit an already-applied migration or hand-alter the DB — models and DB silently diverge. Write a **new** migration for every change; use `migration:status` to see what's applied. `migration:fresh`/`rollback` drop data and are dev-only; prod is forward-only `migration:run --force`." },
        { type: "heading", text: "5. IoC binding & injection types" },
        { type: "callout", variant: "gotcha", text: "`@inject()` resolves constructor params by their **class** type — inject a `type`/`interface` and the container has nothing concrete to build. Bind interfaces to implementations in a provider (`container.bind(...)`) and inject the token, or inject the concrete class. Missing `@inject()` on a class that has injected deps yields `undefined` dependencies." },
        { type: "heading", text: "6. Inertia vs Edge (and mixing them)" },
        { type: "callout", variant: "note", text: "Pick one story per surface: `view.render(...)` (Edge) *or* `inertia.render(...)` (Inertia). Returning Inertia props for a route whose frontend page doesn't exist gives a blank page; returning an Edge view where the client expects an Inertia response breaks the SPA navigation. Content/SEO pages → Edge; app screens → Inertia." },
        { type: "heading", text: "7. Env not validated / read raw" },
        { type: "callout", variant: "gotcha", text: "`process.env.FOO` skips the schema in `start/env.ts` — no type, no boot-time check, `undefined` surfaces deep in a request. Declare every var in the schema and read via `env.get('FOO')`. A misconfigured deploy should crash on boot with a clear message, not 500 later." },
        { type: "heading", text: "8. Validation errors & the exception handler" },
        { type: "callout", variant: "tip", text: "`request.validateUsing` throws `E_VALIDATION_ERROR` (422); the global `app/exceptions/handler.ts` already formats it (JSON list for APIs, flash+redirect for web). Don't wrap every call in try/catch — customize the handler once for app-wide error shape. Same for auth (`E_UNAUTHORIZED_ACCESS` → 401) and Bouncer (`E_AUTHORIZATION_FAILURE` → 403)." },
        { type: "callout", variant: "note", text: "General discipline: scaffold with `node ace make:*` (correct wiring for free), keep controllers thin and logic in injectable services, `preload` relationships, validate every input with VineJS, and write functional tests with the global-transaction hook so the DB stays clean. Confirm every snippet is v6+ before trusting it." }
      ]
    }
  ],

  packages: [
    { name: "@adonisjs/core", why: "the framework runtime: IoC container, HTTP server, router, ace CLI, providers, hash/encryption" },
    { name: "@adonisjs/lucid", why: "Active Record ORM over Knex — models, migrations, query builder, relationships, seeders, factories, transactions" },
    { name: "@vinejs/vine", why: "the validation library: schema-first, typed, fast; powers request.validateUsing" },
    { name: "@adonisjs/auth", why: "authentication guards (session / access tokens / basic), user providers, withAuthFinder mixin" },
    { name: "@adonisjs/bouncer", why: "authorization — abilities & policies, ctx.bouncer, @can/@cannot Edge tags" },
    { name: "edge.js", why: "the server-side template engine (layouts, components, slots, partials, auto-escaping)" },
    { name: "@adonisjs/inertia", why: "Inertia adapter — render React/Vue/Svelte SPA pages from controllers with E2E types, optional SSR" },
    { name: "@adonisjs/vite", why: "Vite integration for asset bundling, HMR in dev, hashed production assets, the @vite tag" },
    { name: "@adonisjs/session", why: "session management (cookie/redis drivers), flash messages — required by the session auth guard" },
    { name: "@adonisjs/shield", why: "security middleware: CSRF protection, CSP, security headers" },
    { name: "@adonisjs/cors", why: "configurable CORS for API servers" },
    { name: "@adonisjs/mail", why: "mailer with drivers (SMTP/SES/Mailgun/Resend), Edge email templates, sendLater queueing" },
    { name: "@adonisjs/redis", why: "typed Redis client (ioredis) for caching, sessions, pub/sub, queue backends" },
    { name: "@japa/runner + @japa/api-client", why: "the test runner and HTTP/API client (client.get/post, loginAs, assertions)" },
    { name: "@adonisjs/route-model-binding", why: "resolve :params into loaded model instances automatically via @bind()" },
    { name: "luxon", why: "date/time library Lucid uses for @column.dateTime fields (DateTime)" }
  ],

  gotchas: [
    "**Subpath imports target `.js`:** `#models/user` maps to `./app/models/user.js` in `package.json` `imports` — new top-level folders need their own `#alias/*` entry, and you never write the `.ts` extension.",
    "**v5 ≠ v6:** v5 is CommonJS with `@ioc:Adonis/...` and the old validator; v6 is ESM with `#`-imports and VineJS. v5 snippets won't compile — always confirm the version.",
    "**N+1 via missing `preload`:** accessing a relationship in a loop fires one query per row. `preload('rel')` on the query (or `.load` on an instance) batches into one `IN (...)`.",
    "**camelCase model ↔ snake_case column:** `createdAt` maps to `created_at` automatically; when it doesn't map cleanly set `@column({ columnName: '...' })` or you get silent `undefined`s.",
    "**`request.validateUsing` throws 422:** don't try/catch it — the global exception handler formats `E_VALIDATION_ERROR` (JSON or flash+redirect). Customize the handler once.",
    "**Access token plaintext is one-time:** `token.value!.release()` is only available at creation; the DB stores a hash. Show/store it immediately.",
    "**`process.env` bypasses validation:** read env via the typed `env.get()` (schema in `start/env.ts`); declare every var there so a bad deploy crashes on boot, not mid-request.",
    "**`migration:fresh`/`rollback` drop data** — dev/test only. Production is forward-only `migration:run --force`; never edit an applied migration, write a new one.",
    "**`@inject()` resolves by class type:** injecting a bare interface/type gives the container nothing to build — bind it in a provider or inject the concrete class. Forgetting `@inject()` yields `undefined` deps.",
    "**Edge `{{{ }}}` is unescaped:** triple-brace renders raw HTML (XSS risk). Default to `{{ }}`; only use `{{{ }}}` on content you generated or sanitized.",
    "**Middleware needs `await next()`:** forget it and the request hangs; code after `next()` runs on the way out and can't change the already-prepared response status.",
    "**Route order matters:** a dynamic `/posts/:id` declared before `/posts/new` swallows the static route — register specific routes first or constrain params with `.where(...)`.",
    "**`APP_KEY` is critical:** it signs cookies/sessions and encrypts payloads. Rotating invalidates all sessions; committing it is a security leak. Inject via platform secrets per environment.",
    "**Don't forget the frontend build:** `node ace build` runs Vite too — a custom CI that only runs `tsc` ships an app whose `@vite` tag throws at render (missing manifest).",
    "**No built-in job queue:** use BullMQ (via a community package) + Redis for background jobs; `mail.sendLater` defaults to an in-memory queue not suited to production scale.",
    "**Inertia props are JSON:** don't return whole models with secrets — `select` columns or use DTOs; `serializeAs: null` protects Lucid serialization but not hand-built objects."
  ],

  flashcards: [
    { q: "What are AdonisJS `#`-prefixed imports (e.g. `#models/user`)?", a: "Node.js **subpath imports** declared in `package.json`'s `imports` map, pointing at compiled `.js` paths. They replace long relative paths and work at runtime with no bundler — a v6 ESM feature." },
    { q: "How do you bind a route to a controller in v6?", a: "Lazily: `const C = () => import('#controllers/posts_controller')` then `router.get('/posts', [C, 'index'])`. Lazy imports keep boot fast and avoid circular imports." },
    { q: "What is HttpContext and what's on it?", a: "The single per-request object every controller method receives: `request`, `response`, `params`, `auth`, `view`, `inertia`, `session`, `bouncer`, `logger`. Destructure what you need." },
    { q: "Three kinds of middleware and where they're registered?", a: "In `start/kernel.ts`: **server** (every request, pre-routing — CORS/static), **router** (every matched route — bodyparser/session/shield), **named** (opt-in per route/group — auth, your own via `router.named({...})`)." },
    { q: "How do you validate a request in v6?", a: "Define a VineJS validator with `vine.compile(vine.object({...}))`, then `const data = await request.validateUsing(createValidator)`. It merges body+query+files, returns a typed payload, and throws `E_VALIDATION_ERROR` (422) on failure." },
    { q: "What is Lucid and how are models defined?", a: "The Active Record ORM over Knex. Models extend `BaseModel`; `@column` maps properties to columns, `@hasMany/@belongsTo/@manyToMany` declare relationships. Schema evolves via migrations." },
    { q: "How do you avoid N+1 queries in Lucid?", a: "Use **`preload('relation')`** on the query builder (or `.load('relation')` on an existing instance) to batch related rows into one `WHERE ... IN (...)` instead of a query per parent row." },
    { q: "Session guard vs access tokens guard?", a: "**Session** = cookie-based, for server-rendered web apps (`auth.use('web').login(user)`). **Access tokens** = opaque DB-stored bearer tokens for APIs/mobile (`User.accessTokens.create(user)`, plaintext via `.value.release()` once)." },
    { q: "How do you hash passwords and verify credentials in v6 auth?", a: "Mix `withAuthFinder(() => hash.use('scrypt'), { uids: ['email'], passwordColumnName: 'password' })` into the User model (auto-hashes on save); log in with `User.verifyCredentials(email, password)`." },
    { q: "Bouncer: ability vs policy, and allows vs authorize?", a: "**Ability** = a single allow/deny function; **policy** = a class of checks per resource. `bouncer.allows(...)` returns a boolean; `bouncer.authorize(...)` throws `E_AUTHORIZATION_FAILURE` (403). Use `@can/@cannot` in Edge." },
    { q: "Edge: `{{ }}` vs `{{{ }}}`?", a: "`{{ }}` interpolates with **HTML auto-escaping** (XSS-safe, the default). `{{{ }}}` renders **raw/unescaped** HTML — only for content you generated or sanitized." },
    { q: "What does Inertia give you over a separate REST API?", a: "Controllers `inertia.render('Page', props)` and props become the React/Vue/Svelte component's props — SPA UX with server-driven routing, no separate API, no client router, and end-to-end TypeScript types (optional SSR)." },
    { q: "How is env configuration validated?", a: "`start/env.ts` declares a schema via `Env.create(...)`; the app **fails fast on boot** if a var is missing/malformed. Read values with the typed `env.get('KEY')`, never `process.env`." },
    { q: "How do you test with Japa and keep the DB clean?", a: "`test('...', async ({ client }) => { ... })` with the `@japa/api-client` (`client.get().loginAs(user)`), and wrap each test in `testUtils.db().withGlobalTransaction()` so changes roll back. Run `node ace test`." },
    { q: "What does `node ace build` produce and how do you deploy it?", a: "Compiles TS + runs the Vite frontend build into `./build`. On the server: `cd build && npm ci --omit=dev`, `node ace migration:run --force`, then `node bin/server.js` under a process manager." },
    { q: "Why prefer container injection (`@inject`) over `new`?", a: "The IoC container resolves the whole dependency graph and lets tests swap fakes by binding interfaces to implementations in a provider — no monkey-patching, fully testable services." }
  ],

  cheatsheet: [
    { label: "New project", code: "npm init adonisjs@latest my-app -- --kit=web --db=postgres" },
    { label: "Dev server", code: "node ace serve --watch" },
    { label: "List everything", code: "node ace list && node ace list:routes" },
    { label: "Make controller (resource)", code: "node ace make:controller post --resource" },
    { label: "Make model + migration", code: "node ace make:model Post -m" },
    { label: "Run / rollback migrations", code: "node ace migration:run    # prod: --force  |  rollback: migration:rollback" },
    { label: "Seed / factory", code: "node ace make:factory Post && node ace db:seed" },
    { label: "Route -> controller", code: "const C = () => import('#controllers/posts_controller'); router.get('/posts', [C, 'index'])" },
    { label: "Resource routes", code: "router.resource('posts', PostsController).apiOnly()" },
    { label: "Validate a request", code: "const data = await request.validateUsing(createPostValidator)" },
    { label: "Query + preload", code: "await Post.query().where('isPublished', true).preload('author').paginate(1, 20)" },
    { label: "Transaction", code: "await db.transaction(async (trx) => { await Post.create(data, { client: trx }) })" },
    { label: "Protect a route", code: "router.get('/me', [MeController, 'show']).use(middleware.auth({ guards: ['api'] }))" },
    { label: "Issue access token", code: "const t = await User.accessTokens.create(user); return t.value!.release()" },
    { label: "Authorize (Bouncer)", code: "await bouncer.with(PostPolicy).authorize('update', post)" },
    { label: "Render Edge / Inertia", code: "return view.render('posts/index', { posts })   // or inertia.render('users/index', { users })" },
    { label: "Add a package", code: "node ace add @adonisjs/mail   # installs + configures + registers provider" },
    { label: "Run tests", code: "node ace test --watch" },
    { label: "Build for prod", code: "node ace build && cd build && npm ci --omit=dev && node bin/server.js" }
  ]
});
