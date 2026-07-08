(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "graphql",
  name: "GraphQL",
  language: "GraphQL",
  color: "#e10098",
  readMinutes: 30,
  tagline: "A **query language for APIs** and a runtime to execute it — one endpoint where the client asks for **exactly the fields it needs**. A spec, not a library: SDL type system, resolvers, and a whole client/server ecosystem.",

  sections: [
    {
      id: "overview",
      title: "Overview: why GraphQL, and when",
      level: "core",
      body: [
        { type: "p", text: "GraphQL is **two things**: a *query language* for describing what data you want, and a *server-side runtime* that resolves those queries against a strongly-typed **schema**. It is a [spec](https://spec.graphql.org/), not a framework — implementations exist in every language. The core idea: expose **one endpoint** (usually `POST /graphql`) whose schema describes every type and field, and let the client request *exactly* the fields it needs in a single round-trip." },
        { type: "p", text: "This directly attacks the two classic REST pain points. **Over-fetching:** `GET /users/1` returns 40 fields when your UI needs 3. **Under-fetching / round-trips:** rendering a screen needs `/user`, then `/user/1/posts`, then `/posts/*/comments` — a waterfall of requests. In GraphQL the client sends one query describing the whole tree and gets back exactly that shape." },
        { type: "code", lang: "graphql", code: "# ONE request, exactly the fields the screen needs, across 3 entity types\nquery HomeScreen {\n  me {\n    name\n    avatarUrl\n    posts(first: 5) {\n      title\n      comments(first: 3) { author { name } body }\n    }\n  }\n}" },
        { type: "code", lang: "json", code: "{\n  \"data\": {\n    \"me\": {\n      \"name\": \"Ada\",\n      \"avatarUrl\": \"https://...\",\n      \"posts\": [\n        { \"title\": \"Hello\", \"comments\": [ { \"author\": { \"name\": \"Bob\" }, \"body\": \"nice\" } ] }\n      ]\n    }\n  }\n}" },
        { type: "list", items: [
          "**Response shape mirrors the query** — the JSON keys match the fields you asked for. Predictable, self-documenting.",
          "**Strongly typed** — the schema is introspectable, so tooling (autocomplete, codegen, validation) is first-class.",
          "**Transport-agnostic** — the spec says nothing about HTTP; almost everyone uses a single HTTP `POST` (queries can also go over `GET` for caching), and subscriptions ride WebSocket/SSE.",
          "**Client-driven** — the frontend decides the query; the backend exposes capabilities, not fixed response payloads.",
          "**Versionless by design** — you evolve the schema by adding fields and `@deprecated`-ing old ones instead of cutting `/v2/`."
        ] },
        { type: "table", headers: ["Approach", "Shape", "Best when"], rows: [
          ["**REST**", "many endpoints, server-defined payloads", "simple CRUD, heavy HTTP caching, public APIs, file-ish resources"],
          ["**GraphQL**", "one endpoint, client-defined selection", "many clients / rich UIs, aggregating multiple sources, avoiding round-trips, evolving schema"],
          ["**tRPC**", "typed RPC functions, no schema/SDL", "full-stack **TypeScript monorepo**, one client, want end-to-end types with zero codegen"]
        ] },
        { type: "callout", variant: "note", text: "GraphQL shines when you have **diverse clients** (web, iOS, Android, partners) and **graph-shaped data** where a UI stitches many entities. If you own both ends and it's all TypeScript, **tRPC** gives you end-to-end types for far less machinery. If your data is flat and HTTP caching matters most, **REST** is often the pragmatic choice. GraphQL's power (arbitrary client queries) is also its cost (N+1, complexity limiting, cache design)." }
      ]
    },
    {
      id: "type-system",
      title: "The type system & SDL",
      level: "core",
      body: [
        { type: "p", text: "The **Schema Definition Language (SDL)** is how you declare your API's shape. The schema is the contract: every query is validated against it *before* execution. Learn the SDL and you can read any GraphQL API." },
        { type: "heading", text: "Scalars & the null/list modifiers" },
        { type: "p", text: "Built-in **scalars**: `Int`, `Float`, `String`, `Boolean`, and `ID` (a serialized-as-string unique identifier). Everything bottoms out in scalars. You add **custom scalars** (`DateTime`, `JSON`, `EmailAddress`) by defining them and providing serialize/parse logic on the server (e.g. the `graphql-scalars` package)." },
        { type: "p", text: "Two modifiers do a lot of work: **`!`** means *non-null* (the field is guaranteed present) and **`[T]`** means *list of T*. They compose, and the position matters:" },
        { type: "table", headers: ["Type", "`null` allowed as the whole value?", "`null` allowed as a list item?"], rows: [
          ["`[String]`", "yes (list may be null)", "yes (items may be null)"],
          ["`[String!]`", "yes", "no"],
          ["`[String]!`", "no", "yes"],
          ["`[String!]!`", "no (must be a list)", "no (every item non-null)"]
        ] },
        { type: "heading", text: "Object types, the three root types, input/enum/interface/union" },
        { type: "code", lang: "graphql", code: "# comments start with a hash\nscalar DateTime          # custom scalar (needs server-side serialize/parse)\n\nenum Role { ADMIN EDITOR VIEWER }\n\ninterface Node { id: ID! }          # shared field contract\n\ntype User implements Node {\n  id: ID!                # non-null ID\n  name: String!\n  email: String\n  role: Role!\n  posts(first: Int = 10): [Post!]!  # field with an argument + default\n  createdAt: DateTime!\n}\n\ntype Post implements Node {\n  id: ID!\n  title: String!\n  author: User!          # object fields form the graph's edges\n}\n\n# union = a value that is ONE of several object types (no shared fields required)\nunion SearchResult = User | Post\n\n# input types are used for arguments (they can't have interfaces or unions)\ninput CreatePostInput {\n  title: String!\n  body: String!\n  tags: [String!] = []\n}\n\n# the three special ROOT types = the API's entry points\ntype Query {\n  me: User\n  node(id: ID!): Node\n  search(term: String!): [SearchResult!]!\n}\ntype Mutation {\n  createPost(input: CreatePostInput!): Post!\n}\ntype Subscription {\n  postAdded: Post!\n}\n\n# optional: wire up the roots explicitly (defaults to Query/Mutation/Subscription)\nschema { query: Query, mutation: Mutation, subscription: Subscription }" },
        { type: "list", items: [
          "**`type`** — an object with fields; fields may take **arguments** (with optional defaults).",
          "**`input`** — a special object used only for arguments. Cannot contain output-only things (no interfaces, unions, or field args).",
          "**`enum`** — a fixed set of named values (serialized as strings over the wire).",
          "**`interface`** — a set of fields an implementing type must have; lets a field return \"any Node\".",
          "**`union`** — one of several object types with *no* required shared fields (e.g. a heterogeneous search result).",
          "**`Query` / `Mutation` / `Subscription`** — the three root operation types; only their fields can be selected at the top level."
        ] },
        { type: "callout", variant: "tip", text: "`interface` when the members **share fields** (`Node { id }`, `Media { url }`). `union` when they **don't** (a `SearchResult` that's a `User | Post | Comment`). Clients discriminate both with `__typename` and inline fragments." }
      ]
    },
    {
      id: "queries",
      title: "Queries: fields, arguments, aliases, fragments, variables, directives",
      level: "core",
      body: [
        { type: "p", text: "A query is a **selection set** — a tree of fields. Scalar fields are leaves; object fields must have their own sub-selection. Give operations a **name** (`query HomeScreen`) for debugging, caching, and codegen." },
        { type: "code", lang: "graphql", code: "query UserProfile($id: ID!, $withPosts: Boolean!) {\n  # arguments filter/parameterize a field\n  user(id: $id) {\n    id\n    name\n    # alias: rename a field in the response, and query the same field twice\n    small: avatar(size: SMALL)\n    large: avatar(size: LARGE)\n    # @include / @skip: conditionally fetch a subtree based on a variable\n    posts(first: 5) @include(if: $withPosts) {\n      ...PostCard          # spread a named fragment\n    }\n  }\n}\n\n# fragment: a reusable named selection set on a specific type\nfragment PostCard on Post {\n  id\n  title\n  author { name }\n}" },
        { type: "list", items: [
          "**Arguments** parameterize a field: `user(id: \"1\")`, `posts(first: 5, after: \"cursor\")`.",
          "**Aliases** (`small: avatar(...)`) rename fields in the result and let you request the same field with different args.",
          "**Variables** (`query($id: ID!)`) are declared in the operation signature and passed alongside the query as a JSON `variables` object — never string-interpolate user input into the query text.",
          "**Fragments** name a reusable selection set on a type; **spread** them with `...Name`. They keep queries DRY and are the unit of colocation in Relay/Apollo.",
          "**Directives** `@include(if:)` / `@skip(if:)` conditionally include/omit a field or fragment at runtime."
        ] },
        { type: "heading", text: "Inline fragments for interfaces & unions" },
        { type: "p", text: "When a field returns an interface or union, use **inline fragments** (`... on Type`) to select type-specific fields, and add `__typename` so the client can discriminate." },
        { type: "code", lang: "graphql", code: "query Search($term: String!) {\n  search(term: $term) {\n    __typename            # tells the client which member this is\n    ... on User { id name }\n    ... on Post { id title author { name } }\n  }\n}" },
        { type: "callout", variant: "note", text: "The whole request body is JSON: `{ \"query\": \"...\", \"variables\": { \"id\": \"1\" }, \"operationName\": \"UserProfile\" }`. `operationName` is required when a document contains multiple named operations so the server knows which to run." }
      ]
    },
    {
      id: "mutations",
      title: "Mutations: writes",
      level: "core",
      body: [
        { type: "p", text: "**Mutations** are how you change data. Syntactically they look like queries but sit under the `Mutation` root. The convention is one `input` argument and **returning the mutated object** (or a richer result type) so the client can update its cache from the response without a refetch." },
        { type: "code", lang: "graphql", code: "mutation CreatePost($input: CreatePostInput!) {\n  createPost(input: $input) {\n    id            # return the new data so the client cache can absorb it\n    title\n    author { id name }\n  }\n}" },
        { type: "code", lang: "json", code: "{\n  \"input\": { \"title\": \"GraphQL in 2026\", \"body\": \"...\", \"tags\": [\"api\"] }\n}" },
        { type: "callout", variant: "warn", text: "**Top-level mutation fields execute SERIALLY, left to right** — this is guaranteed by the spec so two mutations in one request don't race. (Top-level *query* fields, by contrast, may resolve in parallel.) If you send `{ a: deduct(...) b: credit(...) }`, `a` fully completes before `b` starts. Nested selections under each mutation still resolve normally." },
        { type: "callout", variant: "tip", text: "Prefer a single `input` object argument over many positional args — it's easier to evolve (add optional fields without breaking clients). Many teams also return a **payload/result type** (`CreatePostPayload { post: Post, errors: [UserError!]! }`) instead of the bare entity, so expected business errors travel as data (see Schema design)." }
      ]
    },
    {
      id: "subscriptions",
      title: "Subscriptions: real-time",
      level: "core",
      body: [
        { type: "p", text: "**Subscriptions** stream a series of results to the client when server-side events happen. Unlike a query (one response) a subscription is a long-lived stream. Transport is **WebSocket** via the `graphql-ws` protocol (the modern replacement for the deprecated `subscriptions-transport-ws`), or increasingly **SSE** (`graphql-sse`) which is simpler to scale and firewall-friendly." },
        { type: "code", lang: "graphql", code: "subscription OnPostAdded($channel: ID!) {\n  postAdded(channel: $channel) {\n    id\n    title\n    author { name }\n  }\n}" },
        { type: "code", lang: "ts", code: "// server side: a subscription resolver returns an async iterator\nimport { PubSub } from \"graphql-subscriptions\";\nconst pubsub = new PubSub();\n\nconst resolvers = {\n  Mutation: {\n    async createPost(_p, { input }, ctx) {\n      const post = await ctx.db.post.create(input);\n      pubsub.publish(\"POST_ADDED\", { postAdded: post }); // fan out to subscribers\n      return post;\n    },\n  },\n  Subscription: {\n    postAdded: {\n      subscribe: () => pubsub.asyncIterableIterator([\"POST_ADDED\"]),\n    },\n  },\n};" },
        { type: "callout", variant: "gotcha", text: "Reach for subscriptions only when you need **true push with low latency** (chat, live collaboration, presence, trade tickers). For \"data that changes occasionally,\" **polling** (`pollInterval` on a query) or refetch-on-focus is far simpler and cheaper — stateful WebSocket connections are hard to scale, need sticky sessions or an external pub/sub (Redis) for horizontal fan-out, and complicate auth. The in-memory `PubSub` above is single-process only; use `graphql-redis-subscriptions` in production." }
      ]
    },
    {
      id: "resolvers",
      title: "Resolvers: how the server produces data",
      level: "core",
      body: [
        { type: "p", text: "A **resolver** is a function that produces the value for a single field. Execution walks the query tree **depth-first**: it resolves `Query.user`, then for that user resolves each requested field (`name`, `posts`), then for each post its fields, and so on. Each resolver has the signature **`(parent, args, context, info)`**." },
        { type: "code", lang: "ts", code: "const resolvers = {\n  Query: {\n    // parent = root value (undefined at top), args = field args, ctx = per-request context\n    user: (_parent, args, ctx, _info) => ctx.db.user.findById(args.id),\n  },\n  User: {\n    // `parent` is the User returned above; return a value (or a Promise) for each field\n    posts: (parent, _args, ctx) => ctx.db.post.findByAuthor(parent.id),\n    // default resolver: if you omit this, GraphQL just returns parent.name\n    fullName: (parent) => `${parent.first} ${parent.last}`,\n  },\n  Post: {\n    author: (parent, _args, ctx) => ctx.loaders.user.load(parent.authorId),\n  },\n};" },
        { type: "table", headers: ["Arg", "What it is"], rows: [
          ["`parent` (a.k.a. `root`/`source`)", "the value returned by the **parent** field's resolver — the object this field hangs off"],
          ["`args`", "the field's arguments, e.g. `{ id: \"1\", first: 5 }`"],
          ["`context`", "a per-request object you build once (auth/user, db handles, **DataLoaders**) — shared by every resolver in that request"],
          ["`info`", "the AST + schema info for this field (requested sub-selection, path, variables) — used for advanced tricks like projection"]
        ] },
        { type: "list", items: [
          "**Default resolvers:** if you don't define a resolver for a field, GraphQL returns `parent[fieldName]` (or calls it if it's a function). So plain data properties need no resolver at all.",
          "**Resolvers can return Promises** — the runtime awaits them, so async DB/HTTP calls are natural. Sibling fields resolve concurrently.",
          "**`context` is built per request** in your server setup (see Building a server), which is exactly where you attach the authenticated user and create fresh DataLoaders.",
          "**Resolver chains are lazy:** a field's resolver only runs if the client selected it — unselected branches cost nothing."
        ] },
        { type: "callout", variant: "note", text: "Because `Post.author` runs once *per post*, naive resolvers fan out into many DB calls — the N+1 problem, handled next. Note the `author` resolver above already routes through a `ctx.loaders.user.load(...)` DataLoader instead of hitting the DB directly." }
      ]
    },
    {
      id: "n-plus-one",
      title: "The N+1 problem & DataLoader",
      level: "core",
      body: [
        { type: "p", text: "This is *the* GraphQL server performance issue and every backend dev must understand it. Because each field resolves independently, a list query triggers **1 query for the list + N queries for each item's relations** — the **N+1 problem**." },
        { type: "code", lang: "graphql", code: "query { posts(first: 100) { title author { name } } }" },
        { type: "p", text: "Resolving this naively runs **1** query for the 100 posts, then **100** separate `SELECT * FROM users WHERE id = ?` — one per post's `author` resolver. 101 queries to render one list." },
        { type: "code", lang: "ts", code: "import DataLoader from \"dataloader\";\n\n// A loader batches all .load(id) calls made in the same tick into ONE batch call,\n// and memoizes within the request so duplicate ids are fetched once.\nfunction createUserLoader(db) {\n  return new DataLoader(async (ids) => {\n    const users = await db.user.findManyByIds(ids); // ONE query: WHERE id IN (...)\n    const byId = new Map(users.map((u) => [u.id, u]));\n    // MUST return results in the SAME ORDER as `ids` (null for misses)\n    return ids.map((id) => byId.get(id) ?? null);\n  });\n}\n\n// build FRESH loaders per request in your context factory (never share across requests)\nfunction buildContext(req) {\n  return { db, loaders: { user: createUserLoader(db) } };\n}\n\n// resolver just calls .load — batching/caching is transparent\nconst resolvers = {\n  Post: { author: (post, _a, ctx) => ctx.loaders.user.load(post.authorId) },\n};" },
        { type: "list", items: [
          "**Batching:** all `.load(id)` calls in the same event-loop tick are collected and passed to your batch function once — 100 authors become **1** `WHERE id IN (...)` query.",
          "**Caching:** within one request, `.load(5)` twice hits the DB once (per-request memoization).",
          "**Order contract:** your batch function **must** return an array the same length and order as the input keys — this is the #1 DataLoader bug.",
          "**Per-request lifetime:** create loaders in the context factory so the cache doesn't leak stale data across requests or users."
        ] },
        { type: "callout", variant: "warn", text: "DataLoader's per-request cache never invalidates mid-request — if you mutate a row and re-read it in the same request, you may get the stale cached value. Call `loader.clear(id)` after a write, or don't cache mutated entities. Also: **one loader per relation** (userById, postsByAuthorId, ...), all created fresh per request." }
      ]
    },
    {
      id: "building-server",
      title: "Building a server: schema-first vs code-first",
      level: "core",
      body: [
        { type: "p", text: "There are two philosophies. **Schema-first**: write SDL by hand, then write a matching resolver map (graphql-js, Apollo Server, GraphQL Yoga). **Code-first**: define types in your host language and *generate* the SDL from code (Pothos, Nexus, TypeGraphQL) — the schema and its TS types can't drift." },
        { type: "heading", text: "Schema-first with Apollo Server 5" },
        { type: "code", lang: "ts", code: "// Apollo Server 5 (v4 reached end-of-life Jan 2026). Node 20+.\nimport { ApolloServer } from \"@apollo/server\";\nimport { startStandaloneServer } from \"@apollo/server/standalone\";\n\nconst typeDefs = /* GraphQL */ `\n  type Query { hello(name: String!): String! }\n`;\n\nconst resolvers = {\n  Query: { hello: (_p, { name }) => `Hello, ${name}!` },\n};\n\nconst server = new ApolloServer({ typeDefs, resolvers });\n\nconst { url } = await startStandaloneServer(server, {\n  listen: { port: 4000 },\n  // build per-request context here: auth + fresh DataLoaders\n  context: async ({ req }) => ({\n    user: await authenticate(req.headers.authorization),\n    loaders: buildLoaders(),\n  }),\n});\nconsole.log(`ready at ${url}`);" },
        { type: "heading", text: "Schema-first with GraphQL Yoga 5" },
        { type: "p", text: "**GraphQL Yoga** (from The Guild) is a batteries-included, spec-compliant server built on `graphql-js` and the WHATWG Fetch API — so it runs on Node, Bun, Deno, Cloudflare Workers, etc. It ships subscriptions (SSE), file uploads, and a GraphiQL UI out of the box." },
        { type: "code", lang: "ts", code: "import { createYoga, createSchema } from \"graphql-yoga\";\nimport { createServer } from \"node:http\";\n\nconst yoga = createYoga({\n  schema: createSchema({\n    typeDefs: `type Query { hello: String! }`,\n    resolvers: { Query: { hello: () => \"world\" } },\n  }),\n  context: async ({ request }) => ({ user: await auth(request) }),\n});\n\ncreateServer(yoga).listen(4000);" },
        { type: "heading", text: "Code-first with Pothos" },
        { type: "p", text: "**Pothos** is the modern code-first favorite: a plugin-based schema builder that is TypeScript-native, so every field is type-checked against your models and the SDL is generated. No resolver-map/typedef drift." },
        { type: "code", lang: "ts", code: "import SchemaBuilder from \"@pothos/core\";\n\nconst builder = new SchemaBuilder({});\n\nbuilder.objectType(\"User\", {\n  fields: (t) => ({\n    id: t.exposeID(\"id\"),\n    name: t.exposeString(\"name\"),\n  }),\n});\n\nbuilder.queryType({\n  fields: (t) => ({\n    // resolver return type is checked against the field type at compile time\n    me: t.field({ type: \"User\", resolve: (_p, _a, ctx) => ctx.currentUser }),\n  }),\n});\n\nexport const schema = builder.toSchema(); // hand this to Yoga/Apollo" },
        { type: "table", headers: ["", "Schema-first", "Code-first"], rows: [
          ["Source of truth", "hand-written SDL", "code (generates SDL)"],
          ["Type safety of resolvers", "needs codegen (server preset) to match", "built-in, compiler-enforced"],
          ["Best for", "schema-design-led teams, cross-language", "TS teams wanting no drift"],
          ["Tools", "graphql-js, Apollo, Yoga, `@graphql-tools`", "Pothos, Nexus, TypeGraphQL"]
        ] },
        { type: "callout", variant: "tip", text: "New TypeScript service in 2026? **Pothos + GraphQL Yoga** is a very common, ergonomic stack. Prefer schema-first? Use **Apollo Server 5** or Yoga with SDL and run **graphql-codegen's server preset** so your resolver signatures stay typed against the schema." }
      ]
    },
    {
      id: "clients",
      title: "Clients: Apollo, urql, Relay, graphql-request",
      level: "core",
      body: [
        { type: "p", text: "On the frontend you rarely `fetch` GraphQL by hand — a client library handles requests, caching, and (for the big two) a **normalized cache** that dedupes and auto-updates entities across the UI." },
        { type: "heading", text: "Apollo Client 4" },
        { type: "code", lang: "ts", code: "import { ApolloClient, InMemoryCache, gql } from \"@apollo/client\";\nimport { useQuery, useMutation } from \"@apollo/client/react\"; // v4: React hooks live under /react\n\nconst client = new ApolloClient({\n  uri: \"/graphql\",\n  cache: new InMemoryCache(), // normalizes by __typename + id\n});\n\nconst GET_USER = gql`query GetUser($id: ID!) { user(id: $id) { id name } }`;\n\nfunction Profile({ id }) {\n  const { data, loading, error } = useQuery(GET_USER, { variables: { id } });\n  if (loading) return <Spinner />;\n  return <h1>{data.user.name}</h1>;\n}\n\nconst ADD = gql`mutation Add($input: CreatePostInput!){ createPost(input:$input){ id title } }`;\nfunction NewPost() {\n  const [add] = useMutation(ADD, {\n    // optimistic UI: show the result immediately, roll back if the server errors\n    optimisticResponse: { createPost: { __typename: \"Post\", id: \"temp\", title: \"...\" } },\n    update(cache, { data }) { /* write the new post into a cached list */ },\n  });\n}" },
        { type: "list", items: [
          "**Normalized cache:** Apollo flattens responses into a store keyed by `__typename:id`. Update one `User` anywhere and every query showing that user re-renders — no manual sync. This is why querying `id` everywhere matters.",
          "**Fetch/cache policies:** `cache-first` (default), `cache-and-network`, `network-only`, `no-cache`, `cache-only` — control the freshness/speed tradeoff per query.",
          "**Optimistic UI + `update`:** apply the expected result instantly and reconcile with the server response; use `update`/`refetchQueries` to keep lists correct after mutations."
        ] },
        { type: "heading", text: "urql, Relay, graphql-request" },
        { type: "list", items: [
          "**urql** (v5) — smaller, modular. Ships a fast *document cache* by default; add the **Graphcache** exchange for normalized caching. Great when you want a lighter footprint than Apollo.",
          "**Relay** — Meta's opinionated client. Uses a **compiler** (`relay-compiler`) and **fragment colocation**: each component declares its own data fragment via `useFragment`, and Relay composes them into one query. Steepest setup, unmatched at scale (strict conventions, Connections, `@defer`).",
          "**graphql-request** — a tiny (~1 request) promise-based client with no cache. Perfect for scripts, server-to-server calls, RSC/loaders, or pairing with TanStack Query for caching."
        ] },
        { type: "callout", variant: "tip", text: "Pick by weight: **graphql-request** (+ your own cache / TanStack Query) for minimal needs, **urql** for a modular middle ground, **Apollo Client** for the feature-rich default, **Relay** when you're at Meta-scale and will adopt its conventions wholesale." }
      ]
    },
    {
      id: "codegen",
      title: "Codegen & end-to-end type safety",
      level: "core",
      body: [
        { type: "p", text: "GraphQL's schema is machine-readable, so you should never hand-type your operation results. **graphql-code-generator** reads your schema + your operation documents and emits fully-typed operations and hooks. The modern setup is the **client preset**, which gives you a typed `graphql()` function and infers result/variables types from the query string itself." },
        { type: "code", lang: "ts", code: "// codegen.ts\nimport type { CodegenConfig } from \"@graphql-codegen/cli\";\n\nconst config: CodegenConfig = {\n  schema: \"http://localhost:4000/graphql\",  // or a schema.graphql file / introspection\n  documents: [\"src/**/*.tsx\"],               // where your queries live\n  generates: {\n    \"./src/gql/\": { preset: \"client\" },      // the recommended client preset\n  },\n};\nexport default config;" },
        { type: "code", lang: "ts", code: "// run: npx graphql-codegen --watch\nimport { graphql } from \"./gql\";           // generated, typed graphql() function\nimport { useQuery } from \"@apollo/client/react\";\n\n// `graphql()` gives this document a TypedDocumentNode:\n// data + variables are now fully inferred, no manual generics\nconst UserDoc = graphql(`\n  query User($id: ID!) { user(id: $id) { id name email } }\n`);\n\nfunction Profile({ id }: { id: string }) {\n  const { data } = useQuery(UserDoc, { variables: { id } });\n  return <p>{data?.user.name /* string | undefined — typed! */}</p>;\n}" },
        { type: "list", items: [
          "**Client preset** — the current best practice: colocated `graphql()` docs, no per-operation generated hook files, tree-shakeable, works with Apollo/urql/Relay-ish `TypedDocumentNode`.",
          "**`.graphql` documents** — alternatively keep operations in `.graphql` files and generate typed hooks (`near-operation-file` / older presets).",
          "**Server preset** — generates typed **resolver** signatures from your SDL so schema-first backends stay type-safe end to end.",
          "**`as const` + `TypedDocumentNode`** — the mechanism that carries result/variable types through a plain string into the client."
        ] },
        { type: "callout", variant: "good", text: "Run codegen in `--watch` during dev and as a CI check. The payoff: rename a schema field and TypeScript instantly flags every broken query and every component reading the old field. This is the single biggest quality-of-life win in a GraphQL frontend." }
      ]
    },
    {
      id: "schema-design",
      title: "Schema design best practices",
      level: "core",
      body: [
        { type: "p", text: "A GraphQL schema is a long-lived public contract. Good design is mostly about **nullability discipline, pagination, error modeling, and evolvability**." },
        { type: "heading", text: "Nullability" },
        { type: "callout", variant: "gotcha", text: "**A null in a non-null (`!`) field bubbles UP:** if a resolver for a `Foo!` field errors or returns null, GraphQL cannot put null there, so it nulls the **parent** — and if the parent is also non-null, it keeps propagating until it hits a nullable field, potentially nulling a huge subtree. Be *conservative* with `!`: mark a field non-null only when it truly can never be null. Over-eager `!` turns one flaky field into a whole-query failure." },
        { type: "heading", text: "Pagination: offset vs cursor (Relay Connections)" },
        { type: "p", text: "**Offset/limit** (`posts(offset: 40, limit: 20)`) is simple but breaks under inserts (items shift, you skip/duplicate rows) and is slow deep in the list. **Cursor-based** pagination is the standard; the **Relay Connection** spec formalizes it with `edges`/`node`/`cursor` and `pageInfo`." },
        { type: "code", lang: "graphql", code: "type Query { posts(first: Int, after: String): PostConnection! }\n\ntype PostConnection {\n  edges: [PostEdge!]!\n  pageInfo: PageInfo!\n  totalCount: Int\n}\ntype PostEdge {\n  node: Post!         # the actual item\n  cursor: String!     # opaque cursor for this edge\n}\ntype PageInfo {\n  hasNextPage: Boolean!\n  hasPreviousPage: Boolean!\n  startCursor: String\n  endCursor: String\n}" },
        { type: "heading", text: "Errors: top-level array vs errors-as-data" },
        { type: "p", text: "GraphQL responses have a top-level **`errors`** array for *exceptional* failures (validation, thrown resolver errors, auth). But **expected business outcomes** (\"email already taken\", \"insufficient funds\") are better modeled **as data** — via a payload with a `userErrors` list or a **union result type** — so clients handle them in a typed, exhaustive way instead of string-matching the errors array." },
        { type: "code", lang: "graphql", code: "type Mutation { register(input: RegisterInput!): RegisterResult! }\n\n# union result: success OR a typed failure the client must handle\nunion RegisterResult = RegisterSuccess | EmailTakenError | WeakPasswordError\n\ntype RegisterSuccess { user: User! }\ntype EmailTakenError { message: String! }\ntype WeakPasswordError { message: String!, minLength: Int! }" },
        { type: "heading", text: "Evolution without versioning" },
        { type: "list", items: [
          "**Add, don't break:** you evolve by adding fields/types. There is no `/v2` — a single schema serves all clients.",
          "**`@deprecated(reason: \"...\")`** marks a field/enum value as going away; tooling shows a strikethrough and you can watch usage before removal.",
          "**Naming:** `camelCase` fields, `PascalCase` types, `SCREAMING_SNAKE` enum values; name mutations `verbNoun` (`createPost`) and consider `input`/`Payload` pairs.",
          "**Nullable new fields:** add new fields as nullable (or with a default) so old clients and resolvers aren't forced to supply them."
        ] },
        { type: "callout", variant: "tip", text: "Model relationships as **fields, not IDs**: expose `post.author: User!`, not `post.authorId: ID!` — that's the whole point of a graph. Let clients traverse; resolvers + DataLoader make it efficient." }
      ]
    },
    {
      id: "federation",
      title: "Federation & schema composition",
      level: "deep",
      body: [
        { type: "p", text: "In a microservices world you don't want one giant monolithic schema. **Apollo Federation** lets each service own a **subgraph**; a **router/gateway** composes them into one **supergraph** that clients query as a single endpoint. A type can be split across services and extended by `@key`." },
        { type: "code", lang: "graphql", code: "# users subgraph — owns the User type, identified by its key\ntype User @key(fields: \"id\") {\n  id: ID!\n  name: String!\n}\n\n# reviews subgraph — EXTENDS User with a field it owns, resolved via the key\ntype User @key(fields: \"id\") {\n  id: ID!\n  reviews: [Review!]!     # the gateway fetches this from the reviews service\n}\ntype Review { id: ID!, body: String!, author: User! }" },
        { type: "list", items: [
          "**Subgraphs** are normal GraphQL servers annotated with federation directives (`@key`, `@shareable`, `@external`, `@requires`).",
          "**Composition** merges subgraph schemas into a supergraph (checked in CI with `rover supergraph compose`); the **Apollo Router** (Rust) executes cross-service query plans.",
          "**Entity resolution:** the router splits a query, calls each subgraph for the fields it owns, and joins by the entity's `@key` — DataLoader-style batching happens across the mesh.",
          "**Schema stitching** (`@graphql-tools/stitch`) is the older, gateway-side alternative: merge remote schemas without special directives. Federation is the more scalable, decentralized standard today."
        ] },
        { type: "callout", variant: "note", text: "Don't reach for federation until you actually have multiple teams/services. For a single service it's pure overhead — a monolithic schema is simpler and faster. Federation earns its keep at org scale where independent teams ship independent subgraphs." }
      ]
    },
    {
      id: "security-performance",
      title: "Security & performance",
      level: "core",
      body: [
        { type: "p", text: "GraphQL's flexibility is an attack surface: a client can request arbitrarily **deep** and **expensive** queries. A public GraphQL endpoint with no limits is a DoS waiting to happen. Layer these defenses." },
        { type: "list", items: [
          "**Depth limiting:** cap query nesting (e.g. `graphql-depth-limit`) so `user { posts { author { posts { author ... } } } }` can't recurse forever.",
          "**Cost/complexity analysis:** assign each field a cost and reject queries over a budget *before* execution (e.g. `graphql-query-complexity`, or built-in analysis in Yoga/Envelop plugins). Weight list fields by their `first`/`limit` arg.",
          "**Persisted queries / trusted documents:** register your app's known queries at build time and let clients send only a **hash** (APQ) — or run an **allowlist** that rejects any operation not in the registry. Kills arbitrary/malicious queries and shrinks payloads.",
          "**Disable introspection in production** for internal/first-party APIs so attackers can't trivially map your schema (keep it on in dev; pair with persisted queries).",
          "**Auth in context/resolvers:** authenticate once when building `context` (verify the JWT/session), then authorize per-field/entity in resolvers or with a plugin/directive. Never trust arguments alone.",
          "**Rate limiting & timeouts:** limit requests per client and set per-query execution timeouts; disable unbounded batching if you don't need it.",
          "**Field-level caching / CDN:** GraphQL over `POST` isn't HTTP-cacheable by default — use response caching (`@cacheControl` hints + a cache plugin) and/or persisted queries over `GET` to enable CDN caching."
        ] },
        { type: "code", lang: "ts", code: "// Apollo Server: register plugins for depth + complexity + response caching\nimport { ApolloServer } from \"@apollo/server\";\nimport depthLimit from \"graphql-depth-limit\";\n\nconst server = new ApolloServer({\n  schema,\n  validationRules: [depthLimit(8)],          // reject queries nested deeper than 8\n  // add a complexity plugin + response cache plugin as needed\n  introspection: process.env.NODE_ENV !== \"production\",\n});" },
        { type: "callout", variant: "warn", text: "The classic exploit is a **deeply nested / cyclic query** (`a { b { a { b ... } } }`) that explodes into millions of resolver calls. Depth limit + complexity budget + persisted-query allowlist together neutralize it. Do this before you ship a public endpoint, not after the incident." }
      ]
    },
    {
      id: "tooling",
      title: "Tooling: GraphiQL, introspection, config, uploads",
      level: "deep",
      body: [
        { type: "list", items: [
          "**GraphiQL / Apollo Sandbox / GraphQL Playground:** in-browser IDEs to explore the schema, autocomplete queries, and run them. Yoga serves GraphiQL by default; Apollo serves Sandbox. Lock these down (or disable) in prod.",
          "**Introspection:** the schema is queryable via the `__schema` / `__type` meta-fields — this is what powers autocomplete, codegen, and docs. `graphql-codegen`, `get-graphql-schema`, and editor plugins all use it.",
          "**`.graphqlrc` / `graphql.config.yml`:** the GraphQL Config standard points every tool (VS Code GraphQL extension, codegen, linters) at your schema + document locations from one file.",
          "**graphql-eslint:** lint SDL and operations (naming, deprecations, required `id`, forbidden patterns).",
          "**Schema registry / checks:** Apollo GraphOS / Hive track schema changes and run **breaking-change checks** against real client usage in CI."
        ] },
        { type: "code", lang: "yaml", code: "# graphql.config.yml — one config every tool reads\nschema: \"http://localhost:4000/graphql\"\ndocuments: \"src/**/*.{graphql,tsx}\"" },
        { type: "callout", variant: "gotcha", text: "**File uploads are NOT in the GraphQL spec.** The common workaround is the `graphql-multipart-request-spec` (`graphql-upload` / an `Upload` scalar) which multiplexes files into a multipart POST — but it's fiddly and a known security/DoS footgun. The modern recommendation is to **skip GraphQL for uploads entirely**: have the client request a **pre-signed S3 URL** (via a mutation) and PUT the bytes directly, then send only the resulting URL/key through GraphQL." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite GraphQL teams — most are design or operational, not syntax." },
        { type: "heading", text: "1. N+1 queries" },
        { type: "callout", variant: "warn", text: "Nested resolvers fan out into one DB call per parent. **Fix:** wrap every relation fetch in a **DataLoader** created fresh per request — it batches `.load(id)` calls into a single `IN (...)` query and memoizes within the request. Return results in input order or you'll silently mismatch rows." },
        { type: "heading", text: "2. Over-nesting / cyclic queries as a DoS" },
        { type: "callout", variant: "warn", text: "Clients can request arbitrarily deep/expensive trees. **Fix:** depth limit + query complexity budget (reject before execution) + persisted-query allowlist. Never expose an unlimited public endpoint." },
        { type: "heading", text: "3. Leaking internal errors / stack traces" },
        { type: "callout", variant: "gotcha", text: "Thrown resolver errors can serialize DB messages and stack traces into the `errors` array. **Fix:** mask errors in production (Apollo/Yoga do this by default — keep it on), log the real error server-side with an ID, and return a generic message + code to the client. Model *expected* failures as data (union results), not thrown errors." },
        { type: "heading", text: "4. Cache invalidation complexity" },
        { type: "callout", variant: "gotcha", text: "Normalized client caches are magic until a mutation adds/removes a list item — the entity updates but lists don't. **Fix:** return affected entities from mutations, use `cache.modify`/`update` or `refetchQueries` for list membership, and always query `id` + `__typename` so the cache can normalize. When in doubt, refetch the affected query." },
        { type: "heading", text: "5. Versioning misconceptions" },
        { type: "callout", variant: "note", text: "There's no `/v2` in GraphQL. Trying to version the endpoint fights the design. **Fix:** evolve additively — add fields, `@deprecated` old ones, watch usage via a schema registry, then remove. Run breaking-change checks in CI." },
        { type: "heading", text: "6. Nullability foot-guns" },
        { type: "callout", variant: "gotcha", text: "One `null` in a non-null field **nulls its parent**, cascading up to the nearest nullable ancestor — a single flaky field can blank a whole screen. **Fix:** use `!` conservatively; make a field non-null only if it genuinely can never be null or error." },
        { type: "heading", text: "7. Auth placement" },
        { type: "callout", variant: "gotcha", text: "Authenticating in a single top resolver misses that any resolver can be an entry point (unions, node interfaces, federation). **Fix:** authenticate once in the **context factory**, then authorize per-field/per-entity in resolvers (or via a directive/plugin). Never rely on the client not asking for a field." },
        { type: "heading", text: "8. Subscriptions & scaling" },
        { type: "callout", variant: "warn", text: "In-memory `PubSub` only works single-process; WebSockets need sticky sessions and eat connections. **Fix:** prefer polling/refetch when latency allows; when you truly need push, back subscriptions with an external broker (Redis/NATS) via `graphql-redis-subscriptions`, or use `graphql-sse` which scales more like plain HTTP." },
        { type: "heading", text: "9. File uploads" },
        { type: "callout", variant: "tip", text: "Uploads aren't in the spec and the multipart approach is a footgun. **Fix:** issue a **pre-signed URL** from a mutation and upload bytes directly to object storage, then pass only the URL/key through GraphQL." }
      ]
    }
  ],

  packages: [
    { name: "graphql", why: "the reference JS implementation (graphql-js, v17) — parser, type system, validation, execution; the base every JS tool builds on" },
    { name: "@apollo/server", why: "Apollo Server 5 — the popular schema-first Node server (v4 hit end-of-life Jan 2026; use v5, Node 20+)" },
    { name: "graphql-yoga", why: "The Guild's batteries-included, cross-runtime (Node/Bun/Deno/Workers) server on the Fetch API; SSE subscriptions + GraphiQL built in" },
    { name: "@pothos/core", why: "code-first, plugin-based TypeScript schema builder — type-safe resolvers, generates SDL, no typedef/resolver drift" },
    { name: "nexus", why: "the other code-first builder (declarative, generates SDL + TS types)" },
    { name: "dataloader", why: "per-request batching + caching to kill the N+1 problem — essential in every resolver that fetches relations" },
    { name: "@apollo/client", why: "feature-rich React/JS client (v4) with a normalized cache, hooks, optimistic UI, and cache policies" },
    { name: "urql", why: "lightweight modular client (v5); document cache by default, Graphcache exchange for normalization" },
    { name: "react-relay / relay-compiler", why: "Meta's compiler-driven client with fragment colocation and Connections — max power at scale, strict conventions" },
    { name: "graphql-request", why: "minimal promise-based client, no cache — ideal for scripts, RSC/loaders, and server-to-server calls" },
    { name: "@graphql-codegen/cli", why: "generates typed operations/hooks (client preset) and typed resolvers (server preset) from schema + documents" },
    { name: "graphql-ws", why: "the modern WebSocket subprotocol for subscriptions (replaces the deprecated subscriptions-transport-ws)" },
    { name: "@apollo/gateway / @apollo/subgraph / Apollo Router", why: "Apollo Federation: build subgraphs and compose/route a supergraph across microservices" },
    { name: "graphql-scalars", why: "ready-made custom scalars (DateTime, EmailAddress, JSON, URL, ...) with serialize/parse logic" },
    { name: "@envelop/core / graphql-armor", why: "plugin layer + security presets (depth/complexity limits, cost analysis, error masking) for hardening endpoints" }
  ],

  gotchas: [
    "**N+1 by default:** nested resolvers run one query per parent. Wrap relation fetches in a **DataLoader** built fresh per request, and return batch results in input order.",
    "**Non-null (`!`) nulls the parent:** a null/error in a `Field!` bubbles up to the nearest nullable ancestor, potentially blanking a large subtree. Use `!` conservatively.",
    "**Top-level mutations run serially**, but top-level query fields resolve in parallel — don't assume ordering guarantees for queries.",
    "**No file uploads in the spec:** the multipart hack (`graphql-upload`) is a footgun; prefer pre-signed URLs to object storage and pass only the URL through GraphQL.",
    "**No endpoint versioning:** evolve additively (add fields, `@deprecated` old ones). Trying to build `/v2` fights the design.",
    "**GraphQL over POST isn't HTTP-cacheable:** use response caching (`@cacheControl`) and/or persisted queries over GET for CDN caching.",
    "**Unbounded query cost:** depth + complexity limits + persisted-query allowlists are mandatory before exposing a public endpoint (deep/cyclic queries are a DoS).",
    "**Disable introspection & lock the GraphiQL/Sandbox playground in production** for first-party APIs so attackers can't map the schema.",
    "**DataLoader per-request cache is stale after writes:** call `loader.clear(id)` after a mutation, or don't cache mutated entities.",
    "**Auth belongs in the context factory + per-resolver checks**, not one top resolver — unions/interfaces/federation create many entry points.",
    "**Always request `id` + `__typename`** so normalized client caches (Apollo/urql Graphcache) can dedupe and auto-update entities.",
    "**Apollo Server 4 reached end-of-life (Jan 2026):** use Apollo Server 5 (Node 20+) or GraphQL Yoga 5; old v3/v4 setup snippets won't apply.",
    "**Model expected business failures as data** (payload `userErrors` or a union result), not thrown errors — keeps the top-level `errors` array for the truly exceptional and lets clients handle them exhaustively.",
    "**In-memory PubSub is single-process:** back production subscriptions with Redis/NATS, or use `graphql-sse` which scales like HTTP.",
    "**Never string-interpolate input into a query** — declare `variables` and pass them separately (typed, and no injection)."
  ],

  flashcards: [
    { q: "What problem does GraphQL solve vs REST?", a: "Over-fetching (endpoints return more than the UI needs) and under-fetching/round-trips (many requests to assemble one screen). The client asks for exactly the fields it needs in one request against a typed schema." },
    { q: "What do `!` and `[T]` mean, and how do they combine?", a: "`!` = non-null, `[T]` = list. `[T!]!` = a non-null list of non-null items. Position matters: the inner `!` guards items, the outer `!` guards the list itself." },
    { q: "Name the three root operation types.", a: "`Query` (reads), `Mutation` (writes, top-level fields run serially), `Subscription` (real-time streams over WebSocket/SSE)." },
    { q: "interface vs union?", a: "`interface` = members share required fields (`Node { id }`) and a field can return \"any implementer\". `union` = one of several object types with no shared fields. Discriminate both with `__typename` + inline fragments." },
    { q: "What is the resolver signature?", a: "`(parent, args, context, info)`: parent = value from the parent field's resolver; args = field arguments; context = per-request object (auth + DataLoaders); info = the field's AST/schema info." },
    { q: "What is the N+1 problem and its fix?", a: "A list of N items triggers 1 query for the list + N queries for each item's relation. Fix: DataLoader batches all `.load(id)` calls in a tick into one `IN (...)` query and memoizes per request." },
    { q: "Schema-first vs code-first?", a: "Schema-first: write SDL + a matching resolver map (Apollo/Yoga/graphql-js); use codegen to type it. Code-first: define types in TS and generate SDL (Pothos/Nexus) — resolvers are compiler-checked, no drift." },
    { q: "What does a normalized client cache do?", a: "Flattens responses into a store keyed by `__typename:id`, so updating one entity updates it everywhere it's shown. Why you should always query `id` + `__typename`. Apollo InMemoryCache and urql Graphcache do this." },
    { q: "Why cursor pagination over offset?", a: "Offset skips/duplicates rows when items are inserted and is slow deep in the list. Cursor-based (Relay Connections: edges/node/cursor + pageInfo) is stable under mutation and the ecosystem standard." },
    { q: "Where should errors go: top-level `errors` or as data?", a: "Exceptional failures (validation, thrown, auth) → the top-level `errors` array (mask details in prod). Expected business outcomes → as data via a payload `userErrors` list or a union result type the client handles exhaustively." },
    { q: "How do you evolve a schema without versioning?", a: "Add fields/types (never break), mark old ones `@deprecated(reason:)`, watch usage via a registry, then remove. New fields nullable so old clients/resolvers aren't forced to supply them." },
    { q: "What is Apollo Federation?", a: "Each service owns a subgraph (annotated with `@key` etc.); composition merges them into a supergraph; the router splits queries, calls each subgraph for the fields it owns, and joins by entity key. Use it at multi-team scale." },
    { q: "How do you protect a public GraphQL endpoint?", a: "Depth limiting + query complexity/cost budget (reject before execution) + persisted queries/allowlist + disable introspection in prod + auth in context + rate limiting. Neutralizes deep/cyclic DoS queries." },
    { q: "What does graphql-codegen's client preset give you?", a: "A typed `graphql()` function: write the query string, and result + variable types are inferred (TypedDocumentNode). Rename a schema field and TS flags every broken query. Server preset types resolvers." },
    { q: "How should you handle file uploads?", a: "Not through GraphQL (uploads aren't in the spec; the multipart approach is a footgun). Issue a pre-signed URL from a mutation, PUT bytes directly to storage, send only the URL/key through GraphQL." },
    { q: "When is a subscription the wrong tool?", a: "When data changes only occasionally — polling (`pollInterval`) or refetch-on-focus is simpler. Subscriptions need stateful WebSockets, sticky sessions, and an external pub/sub (Redis) to scale horizontally." }
  ],

  cheatsheet: [
    { label: "Non-null list of non-null", code: "posts: [Post!]!" },
    { label: "Field with arg + default", code: "posts(first: Int = 10): [Post!]!" },
    { label: "Query with variables", code: "query U($id: ID!){ user(id:$id){ id name } }" },
    { label: "Alias + directive", code: "big: avatar(size: LARGE) @include(if: $hi)" },
    { label: "Fragment", code: "fragment PostCard on Post { id title }  # ...PostCard" },
    { label: "Inline fragment (union)", code: "... on User { name }  ... on Post { title }" },
    { label: "Mutation", code: "mutation($in: CreatePostInput!){ createPost(input:$in){ id } }" },
    { label: "Subscription", code: "subscription { postAdded { id title } }" },
    { label: "Resolver signature", code: "field: (parent, args, ctx, info) => value | Promise" },
    { label: "DataLoader (kills N+1)", code: "new DataLoader(ids => db.byIds(ids)) // return in input order" },
    { label: "Apollo Server 5", code: "new ApolloServer({ typeDefs, resolvers }); startStandaloneServer(s)" },
    { label: "GraphQL Yoga 5", code: "createYoga({ schema: createSchema({ typeDefs, resolvers }) })" },
    { label: "Pothos (code-first)", code: "builder.queryType({ fields:(t)=>({ me: t.field({...}) }) })" },
    { label: "Apollo Client query", code: "const { data, loading } = useQuery(DOC, { variables })" },
    { label: "Codegen (client preset)", code: "generates: { './src/gql/': { preset: 'client' } }" },
    { label: "Deprecate a field", code: "oldField: String @deprecated(reason: \"use newField\")" },
    { label: "Depth limit", code: "validationRules: [depthLimit(8)]" },
    { label: "Federation key", code: "type User @key(fields: \"id\") { id: ID! }" }
  ]
});
