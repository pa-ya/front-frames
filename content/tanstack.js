(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "tanstack",
  name: "TanStack",
  language: "TS / JS",
  group: "Web UI (JS / TS)",
  navLabel: "TanStack",
  color: "#ff4154",
  readMinutes: 30,
  tagline: "A suite of **headless, type-safe, framework-agnostic** libraries — **Query** (async server state), **Router**, **Table**, **Form**, **Virtual** and the **Start** fullstack framework. You own the markup; TanStack owns the hard logic.",

  sections: [
    {
      id: "overview",
      title: "Overview & philosophy",
      level: "core",
      body: [
        { type: "p", text: "TanStack (formerly \"React Query\" et al., created by Tanner Linsley) is a family of libraries that share three principles: **headless** (they give you state and behavior, never markup or styles — you render everything), **type-safe** (end-to-end TypeScript inference is the headline feature), and **framework-agnostic** (a core package plus thin adapters for React, Vue, Solid, Svelte and Angular). You install the adapter for your framework, e.g. `@tanstack/react-query`." },
        { type: "table", headers: ["Library", "Solves", "React package"], rows: [
          ["**Query**", "async **server state**: fetching, caching, background sync, mutations", "`@tanstack/react-query`"],
          ["**Router**", "type-safe routing with typed params & validated search params", "`@tanstack/react-router`"],
          ["**Table**", "headless datagrid: sorting/filtering/pagination/grouping row models", "`@tanstack/react-table`"],
          ["**Form**", "type-safe form state + field-level & schema validation", "`@tanstack/react-form`"],
          ["**Virtual**", "windowing/virtualization for huge lists & grids", "`@tanstack/react-virtual`"],
          ["**Start**", "fullstack React framework: Router + Vite + server functions", "`@tanstack/react-start`"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets the **current stable line (July 2026)**: **Query v5**, **Router v1**, **Table v8**, **Form v1**, **Virtual v3**, and **Start v1** (in **Release Candidate** as of mid-2026 — not yet a tagged stable 1.0). Query is by far the most-used member — most of this deck is about it." },
        { type: "heading", text: "\"Headless\" — why it matters" },
        { type: "p", text: "Headless means the library returns data and callbacks and **zero DOM**. TanStack Table doesn't render a `<table>` — it hands you row models and you map over them. This is the opposite of AG Grid or MUI DataGrid. The payoff: total control over markup, styling and accessibility; the cost: you write more glue. Query is \"headless\" too — it manages the cache and gives you `{ data, isPending, ... }`; you decide what to render." },
        { type: "callout", variant: "tip", text: "Reach for **Query** the moment you `fetch` in a component — it is the biggest quality-of-life upgrade in the suite. Add **Router** when you want typed routes/search params (especially with Query). **Table/Virtual/Form** are independent — adopt them à la carte. **Start** is the all-in bet: a Next.js alternative built on Router." }
      ]
    },
    {
      id: "query-basics",
      title: "TanStack Query: QueryClient & useQuery",
      level: "core",
      body: [
        { type: "p", text: "Query manages **server state** — data you don't own, that lives on a server, is shared, and goes stale. It replaces the `useEffect` + `useState` + `loading`/`error` boilerplate with a declarative cache. You provide a **query key** (identity) and a **query function** (how to fetch); Query handles caching, deduping, background refetching, retries and garbage collection." },
        { type: "code", lang: "bash", code: "npm i @tanstack/react-query @tanstack/react-query-devtools" },
        { type: "p", text: "Create one **`QueryClient`** (the cache) and wrap your app in **`QueryClientProvider`**." },
        { type: "code", lang: "tsx", code: "// main.tsx\nimport { QueryClient, QueryClientProvider } from \"@tanstack/react-query\";\nimport { ReactQueryDevtools } from \"@tanstack/react-query-devtools\";\n\nconst queryClient = new QueryClient({\n  defaultOptions: {\n    queries: { staleTime: 60_000, retry: 2 }, // sensible app-wide defaults\n  },\n});\n\ncreateRoot(document.getElementById(\"root\")!).render(\n  <QueryClientProvider client={queryClient}>\n    <App />\n    <ReactQueryDevtools initialIsOpen={false} />\n  </QueryClientProvider>\n);" },
        { type: "code", lang: "tsx", code: "import { useQuery } from \"@tanstack/react-query\";\n\nfunction Todos() {\n  const { data, isPending, isError, error } = useQuery({\n    queryKey: [\"todos\"],\n    queryFn: async () => {\n      const res = await fetch(\"/api/todos\");\n      if (!res.ok) throw new Error(\"Failed to load todos\"); // MUST throw on error\n      return res.json() as Promise<Todo[]>;\n    },\n  });\n\n  if (isPending) return <Spinner />;          // no data yet\n  if (isError) return <p>{error.message}</p>; // queryFn threw\n  return <ul>{data.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;\n}" },
        { type: "list", items: [
          "**`queryKey`** — a serializable array that uniquely identifies this data. Same key = same cache entry (shared, deduped across components).",
          "**`queryFn`** — an async function that **returns the data or throws**. Query keys off the thrown error for `isError`; a `fetch` that resolves with a 404 is a *success* unless you throw.",
          "The returned object exposes cache state: `data`, `error`, `status`/`isPending`/`isError`/`isSuccess`, `fetchStatus`/`isFetching`, `refetch`, and more.",
          "Mount two components with the same key and only **one** network request fires — Query dedupes in-flight requests automatically."
        ] },
        { type: "callout", variant: "gotcha", text: "`fetch()` does **not** throw on HTTP errors (4xx/5xx) — it only rejects on network failure. If you don't check `res.ok` and `throw`, Query treats a 500 as a successful result and `isError` stays false. Libraries like `axios`/`ky` throw on non-2xx for you." }
      ]
    },
    {
      id: "query-keys-cache",
      title: "Query keys & the caching model (staleTime vs gcTime)",
      level: "core",
      body: [
        { type: "p", text: "The query key is both an **identity** and a **dependency array**. Anything the `queryFn` depends on must be in the key — when it changes, Query fetches the new data and caches it separately, exactly like a `useEffect` dependency array." },
        { type: "code", lang: "tsx", code: "// key includes every input the fetch depends on\nfunction Todo({ id }: { id: number }) {\n  return useQuery({\n    queryKey: [\"todos\", id],           // \"todos/5\" is a distinct cache entry from \"todos/6\"\n    queryFn: () => fetchTodo(id),\n  });\n}\n\n// filters/params belong in the key too — use an object for named params\nuseQuery({\n  queryKey: [\"todos\", { status, page }],\n  queryFn: () => fetchTodos({ status, page }),\n});" },
        { type: "callout", variant: "tip", text: "Keys are compared **structurally** and **order-independently for objects** (`{ a, b }` === `{ b, a }`) but order-dependently for arrays. Convention: go from generic to specific — `[\"todos\"]`, `[\"todos\", id]`, `[\"todos\", id, \"comments\"]`. This lets you invalidate a whole subtree with a prefix." },
        { type: "heading", text: "staleTime vs gcTime — the two timers everyone confuses" },
        { type: "table", headers: ["Option", "Default", "Controls"], rows: [
          ["**`staleTime`**", "**0**", "how long data is considered **fresh**. While fresh, Query serves it from cache and will **not** refetch on mount/focus/reconnect."],
          ["**`gcTime`**", "**5 min**", "how long an **inactive** (no observers) query's data stays in cache before it's garbage-collected. Was `cacheTime` in v4."]
        ] },
        { type: "p", text: "The mental model: **`staleTime`** answers \"should I refetch this?\" and **`gcTime`** answers \"can I still show old data instantly while I do?\". They are independent. A query can be stale but still cached (shown immediately, refetched in the background)." },
        { type: "callout", variant: "gotcha", text: "**Default `staleTime` is 0**, so every mount / window refocus / reconnect triggers a background refetch. This surprises newcomers who see \"extra\" requests. It's intentional (data is assumed stale immediately) — raise `staleTime` for data that doesn't change often. `gcTime` is unrelated: it only controls eviction of *unused* data." },
        { type: "heading", text: "Background refetching triggers" },
        { type: "list", items: [
          "**On mount** — a new observer mounts and the data is stale.",
          "**`refetchOnWindowFocus`** (default `true`) — refetch when the tab regains focus.",
          "**`refetchOnReconnect`** (default `true`) — refetch after the network comes back.",
          "**`refetchInterval: ms`** — polling. Set a number or a function of the latest data.",
          "**Manual** — `refetch()` from the hook, or `queryClient.invalidateQueries({ queryKey })`."
        ] }
      ]
    },
    {
      id: "query-states",
      title: "Query states: isPending / isLoading / isFetching / status",
      level: "core",
      body: [
        { type: "p", text: "Query separates **two axes**: `status` (do we have data?) and `fetchStatus` (is a request in flight right now?). Conflating them is the most common source of stuck spinners." },
        { type: "table", headers: ["Flag", "Axis", "Means"], rows: [
          ["**`status: 'pending'`** / `isPending`", "data", "no data in cache yet (first load). **Renamed from `isLoading` in v5.**"],
          ["`status: 'success'`** / `isSuccess`", "data", "`data` is available"],
          ["`status: 'error'`** / `isError`", "data", "the `queryFn` threw; `error` is populated"],
          ["**`fetchStatus: 'fetching'`** / `isFetching`", "network", "a request is in flight (initial **or** background refetch)"],
          ["`fetchStatus: 'idle'`", "network", "no request running"],
          ["**`isLoading`**", "derived", "`isPending && isFetching` — true only on the **first** fetch with no cached data"]
        ] },
        { type: "code", lang: "tsx", code: "const { data, isPending, isFetching, isError, error } = useQuery({\n  queryKey: [\"todos\"],\n  queryFn: fetchTodos,\n});\n\nif (isPending) return <Spinner />;      // truly nothing to show yet\nif (isError) return <Error e={error} />;\n\nreturn (\n  <>\n    {isFetching && <RefreshDot />}       {/* subtle 'updating' indicator on background refetch */}\n    <TodoList todos={data} />            {/* data is defined here */}\n  </>\n);" },
        { type: "callout", variant: "gotcha", text: "**v5 renamed `isLoading` → `isPending`** for the \"no data yet\" state. `isLoading` still exists but now means `isPending && isFetching` (the derived first-load flag). If you're porting v4 code, `isLoading` → `isPending` is the mechanical rename. Use `isPending` for the initial spinner and `isFetching` for a background-refresh indicator." },
        { type: "callout", variant: "note", text: "`status` describes the **data**; `fetchStatus` describes the **network**. A query showing cached data during a background refetch is `status: 'success'` **and** `fetchStatus: 'fetching'` at the same time — that's why you need both." }
      ]
    },
    {
      id: "query-features",
      title: "enabled, select, placeholderData & retries",
      level: "core",
      body: [
        { type: "heading", text: "enabled — dependent (sequential) queries" },
        { type: "p", text: "**`enabled: false`** pauses a query until a condition is met — the idiomatic way to chain queries where one depends on another's result." },
        { type: "code", lang: "tsx", code: "const { data: user } = useQuery({\n  queryKey: [\"user\", email],\n  queryFn: () => getUserByEmail(email),\n});\n\nconst userId = user?.id;\n\n// don't run until we have a userId\nconst { data: projects } = useQuery({\n  queryKey: [\"projects\", userId],\n  queryFn: () => getProjects(userId!),\n  enabled: !!userId,          // <- gate on the dependency\n});" },
        { type: "callout", variant: "gotcha", text: "A query with `enabled: false` (or a falsy condition) stays in `status: 'pending'` forever until enabled. Don't treat `isPending` as \"loading\" for a disabled query — check `isFetching`, or better, gate the UI on the dependency itself. In v5 there's also `skipToken` you can return as `queryFn` to disable while keeping types tidy." },
        { type: "heading", text: "select — derive/transform without re-render churn" },
        { type: "code", lang: "tsx", code: "// only re-renders when the SELECTED slice changes, not the whole payload\nconst count = useQuery({\n  queryKey: [\"todos\"],\n  queryFn: fetchTodos,\n  select: (todos) => todos.length,   // subscribe to a derived value\n}).data;" },
        { type: "heading", text: "placeholderData & keepPreviousData — no flicker on key change" },
        { type: "p", text: "By default, changing the query key (e.g. paginating) drops back to `isPending` and shows a spinner. **`placeholderData: keepPreviousData`** keeps the previous page's data on screen while the new page loads — smooth pagination." },
        { type: "code", lang: "tsx", code: "import { keepPreviousData } from \"@tanstack/react-query\";\n\nconst { data, isPlaceholderData } = useQuery({\n  queryKey: [\"todos\", page],\n  queryFn: () => fetchPage(page),\n  placeholderData: keepPreviousData,   // v5: replaces the old `keepPreviousData: true`\n});\n// `isPlaceholderData` is true while showing the old page -> disable the Next button" },
        { type: "callout", variant: "note", text: "In **v5** the standalone `keepPreviousData: true` option was removed; import the **`keepPreviousData`** function and pass it as `placeholderData`. Plain `placeholderData: someValue` (or a function) provides initial data that is **not** persisted to the cache — good for instant first paint from a known shape." },
        { type: "heading", text: "Retries" },
        { type: "list", items: [
          "**`retry`** — number of retry attempts on failure (default **3** for queries, **0** for mutations). Set `false` to disable, or a function `(failureCount, error) => boolean`.",
          "**`retryDelay`** — backoff; defaults to exponential (`2^n` capped at 30s).",
          "Don't retry on 4xx: `retry: (n, err) => err.status >= 500 && n < 3`."
        ] }
      ]
    },
    {
      id: "mutations",
      title: "Mutations: useMutation & invalidation",
      level: "core",
      body: [
        { type: "p", text: "Queries read; **mutations** write (POST/PUT/PATCH/DELETE). `useMutation` gives you an imperative `mutate` you call from an event handler, plus lifecycle callbacks. After a successful write you typically **invalidate** the affected queries so they refetch." },
        { type: "code", lang: "tsx", code: "import { useMutation, useQueryClient } from \"@tanstack/react-query\";\n\nfunction AddTodo() {\n  const queryClient = useQueryClient();\n\n  const { mutate, isPending } = useMutation({\n    mutationFn: (title: string) =>\n      fetch(\"/api/todos\", { method: \"POST\", body: JSON.stringify({ title }) })\n        .then((r) => { if (!r.ok) throw new Error(\"create failed\"); return r.json(); }),\n    onSuccess: () => {\n      // refetch the list so the new todo shows up\n      queryClient.invalidateQueries({ queryKey: [\"todos\"] });\n    },\n    onError: (err) => toast.error(err.message),\n    onSettled: () => {/* runs after success OR error — good for cleanup */},\n  });\n\n  return <button disabled={isPending} onClick={() => mutate(\"New todo\")}>Add</button>;\n}" },
        { type: "table", headers: ["", "`mutate(vars)`", "`mutateAsync(vars)`"], rows: [
          ["Returns", "`void` (fire-and-forget)", "a `Promise` of the result"],
          ["Errors", "handled via `onError` only", "rejects — you must `try/catch` or get an unhandled rejection"],
          ["Use when", "the common case; let callbacks drive UI", "you need to `await` the result or chain several mutations"]
        ] },
        { type: "callout", variant: "gotcha", text: "**A mutation without invalidation shows stale data.** Writing to the server does not touch Query's cache. Either `invalidateQueries` in `onSuccess` (refetch — simplest, correct) or `setQueryData` to patch the cache in place (no refetch — faster, but you must produce the exact new shape). Forgetting both is the classic \"I added it but the list didn't update\" bug." },
        { type: "callout", variant: "tip", text: "`invalidateQueries({ queryKey: [\"todos\"] })` invalidates **every** query whose key starts with `[\"todos\"]` (prefix match) — `[\"todos\"]`, `[\"todos\", 5]`, `[\"todos\", { page: 2 }]` all refetch. Use narrower keys or `exact: true` when you want to invalidate just one." }
      ]
    },
    {
      id: "optimistic",
      title: "Optimistic updates & setQueryData",
      level: "core",
      body: [
        { type: "p", text: "Optimistic updates apply the change to the cache **immediately**, before the server confirms, then roll back if it fails. Use the `onMutate` → `onError` (rollback) → `onSettled` (refetch) trio; `onMutate` returns a **context** object that the other callbacks receive." },
        { type: "code", lang: "tsx", code: "const queryClient = useQueryClient();\n\nconst toggleTodo = useMutation({\n  mutationFn: updateTodo,\n  // 1. before the request: patch the cache and stash a rollback snapshot\n  onMutate: async (next: Todo) => {\n    await queryClient.cancelQueries({ queryKey: [\"todos\"] }); // avoid races w/ in-flight refetch\n    const previous = queryClient.getQueryData<Todo[]>([\"todos\"]);\n    queryClient.setQueryData<Todo[]>([\"todos\"], (old) =>\n      old?.map((t) => (t.id === next.id ? next : t))\n    );\n    return { previous }; // <- becomes `context` below\n  },\n  // 2. on failure: restore the snapshot\n  onError: (_err, _next, context) => {\n    if (context?.previous) queryClient.setQueryData([\"todos\"], context.previous);\n  },\n  // 3. always: resync with the server\n  onSettled: () => queryClient.invalidateQueries({ queryKey: [\"todos\"] }),\n});" },
        { type: "list", items: [
          "**`cancelQueries`** in `onMutate` prevents an in-flight refetch from overwriting your optimistic write with stale server data.",
          "**`getQueryData`** snapshots the current cache so you can roll back.",
          "**`setQueryData(key, updater)`** writes to the cache synchronously; the updater receives the old value (may be `undefined`).",
          "**`onSettled` → invalidate** reconciles: whatever you guessed, the server's truth wins on the next refetch."
        ] },
        { type: "callout", variant: "tip", text: "For a single mutation you can skip the manual dance and use the mutation's own state via `useMutationState`, or read `variables` while `isPending` to render the pending item inline. But the `onMutate`/rollback pattern is the robust general approach and what you should reach for when multiple components read the list." }
      ]
    },
    {
      id: "advanced-query",
      title: "Advanced Query: infinite, prefetch, suspense, useQueries, cancellation",
      level: "deep",
      body: [
        { type: "heading", text: "useInfiniteQuery — pagination / infinite scroll" },
        { type: "code", lang: "tsx", code: "import { useInfiniteQuery } from \"@tanstack/react-query\";\n\nconst { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({\n  queryKey: [\"feed\"],\n  queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam }),\n  initialPageParam: null as string | null,      // v5: required\n  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined, // undefined => no more pages\n});\n\n// data.pages is an array of page results; flatten to render\nconst items = data?.pages.flatMap((p) => p.items) ?? [];" },
        { type: "callout", variant: "note", text: "**v5 requires `initialPageParam`** (the first page's param) and passes `pageParam` into `queryFn`. `getNextPageParam` returning `undefined` sets `hasNextPage` to false. There's also `getPreviousPageParam`/`fetchPreviousPage` for bi-directional lists." },
        { type: "heading", text: "Prefetching — fill the cache before render" },
        { type: "code", lang: "tsx", code: "// on hover / route intent, warm the cache so the next screen is instant\nfunction onHover(id: number) {\n  queryClient.prefetchQuery({\n    queryKey: [\"todos\", id],\n    queryFn: () => fetchTodo(id),\n    staleTime: 60_000,   // don't refetch if fetched again within a minute\n  });\n}" },
        { type: "heading", text: "useSuspenseQuery — data is never undefined" },
        { type: "code", lang: "tsx", code: "import { useSuspenseQuery } from \"@tanstack/react-query\";\n\nfunction Profile({ id }: { id: number }) {\n  // suspends until data is ready; wrap in <Suspense> + <ErrorBoundary>\n  const { data } = useSuspenseQuery({ queryKey: [\"user\", id], queryFn: () => getUser(id) });\n  return <h1>{data.name}</h1>; // `data` is guaranteed defined — no isPending check\n}" },
        { type: "callout", variant: "gotcha", text: "`useSuspenseQuery` has **no `enabled`, `placeholderData`, or `throwOnError`** options, and `data` is always defined. Loading is delegated to a parent `<Suspense>` boundary and errors to an `<ErrorBoundary>`. Because it can't be conditionally disabled, dependent queries are harder — keep `useQuery` + `enabled` for those." },
        { type: "heading", text: "useQueries — dynamic parallel queries" },
        { type: "code", lang: "tsx", code: "import { useQueries } from \"@tanstack/react-query\";\n\n// run a variable number of queries in parallel (can't call hooks in a loop)\nconst results = useQueries({\n  queries: ids.map((id) => ({ queryKey: [\"todo\", id], queryFn: () => fetchTodo(id) })),\n  combine: (results) => ({           // optional: reduce many results into one value\n    data: results.map((r) => r.data),\n    pending: results.some((r) => r.isPending),\n  }),\n});" },
        { type: "heading", text: "Query cancellation" },
        { type: "p", text: "Query passes an **`AbortSignal`** into `queryFn`; forward it to `fetch` and Query cancels the request when the query is unused, refetched, or its key changes." },
        { type: "code", lang: "tsx", code: "useQuery({\n  queryKey: [\"search\", term],\n  queryFn: ({ signal }) => fetch(`/api/search?q=${term}`, { signal }).then((r) => r.json()),\n});" },
        { type: "callout", variant: "tip", text: "The **Devtools** (`@tanstack/react-query-devtools`) are essential: they show every query's key, state (fresh/stale/fetching/inactive), data, and let you trigger refetch/invalidate/reset. Keep them on in dev — half of \"why is this refetching?\" questions are answered by looking at the panel." }
      ]
    },
    {
      id: "router",
      title: "TanStack Router: type-safe file-based routing",
      level: "core",
      body: [
        { type: "p", text: "TanStack Router is a fully **type-safe** router. Its differentiator over React Router is **first-class, validated, typed search params** and typed path params — `Link` targets, params and search are all checked at compile time. It supports file-based routing (via a Vite plugin that generates a route tree) or code-based routing." },
        { type: "code", lang: "bash", code: "npm i @tanstack/react-router\nnpm i -D @tanstack/router-plugin  # Vite plugin for file-based routes + codegen" },
        { type: "code", lang: "tsx", code: "// src/routes/posts.$postId.tsx  (file-based route)\nimport { createFileRoute } from \"@tanstack/react-router\";\nimport { z } from \"zod\";\n\nexport const Route = createFileRoute(\"/posts/$postId\")({\n  // typed & validated search params — the differentiator\n  validateSearch: z.object({ tab: z.enum([\"comments\", \"likes\"]).default(\"comments\") }),\n  // loader runs before render; data is typed on the other side\n  loader: ({ params }) => fetchPost(params.postId),\n  component: PostPage,\n});\n\nfunction PostPage() {\n  const post = Route.useLoaderData();       // typed\n  const { postId } = Route.useParams();     // typed: string\n  const { tab } = Route.useSearch();        // typed: \"comments\" | \"likes\"\n  return <Post post={post} tab={tab} />;\n}" },
        { type: "code", lang: "tsx", code: "import { Link } from \"@tanstack/react-router\";\n\n// params & search are type-checked against the target route; a typo won't compile\n<Link to=\"/posts/$postId\" params={{ postId: \"42\" }} search={{ tab: \"likes\" }}>\n  View post\n</Link>;" },
        { type: "list", items: [
          "**`validateSearch`** turns URL query strings into a typed, validated object (use Zod/Valibot or a plain function). Navigating with the wrong search shape is a type error.",
          "**`loader`** fetches data before the component renders; **`beforeLoad`** runs earlier still (auth checks, redirects, context injection). Loaders preload on link intent (hover) and cache.",
          "**`params`** from `$paramName` segments are typed per route.",
          "Register the route tree once so the whole app is type-aware (`declare module '@tanstack/react-router' { interface Register { router: typeof router } }`)."
        ] },
        { type: "heading", text: "Router + Query integration" },
        { type: "p", text: "The common pattern is to use the **router loader to prefetch** into the Query cache, then read with `useSuspenseQuery` in the component — routing kicks off the fetch early, Query owns caching and background updates." },
        { type: "code", lang: "tsx", code: "export const Route = createFileRoute(\"/posts/$postId\")({\n  loader: ({ params, context: { queryClient } }) =>\n    queryClient.ensureQueryData({ queryKey: [\"post\", params.postId], queryFn: () => fetchPost(params.postId) }),\n  component: () => {\n    const { postId } = Route.useParams();\n    const { data } = useSuspenseQuery({ queryKey: [\"post\", postId], queryFn: () => fetchPost(postId) });\n    return <Post post={data} />;\n  },\n});" },
        { type: "callout", variant: "tip", text: "`ensureQueryData` in the loader is \"fetch if not already cached\" — it returns the cached value or fetches it. Pair with `useSuspenseQuery` (same key) so the loader warms the cache and the component reads it without a second request." }
      ]
    },
    {
      id: "table",
      title: "TanStack Table: headless datagrid",
      level: "core",
      body: [
        { type: "p", text: "TanStack Table (v8) is **headless** — it computes row models (sorting, filtering, pagination, grouping) and hands you the data; **you render the `<table>`**. You define columns with `createColumnHelper` for full type-safety, then feed data + columns to `useReactTable`." },
        { type: "code", lang: "bash", code: "npm i @tanstack/react-table" },
        { type: "code", lang: "tsx", code: "import {\n  createColumnHelper, useReactTable,\n  getCoreRowModel, getSortedRowModel, flexRender,\n} from \"@tanstack/react-table\";\n\ntype Person = { name: string; age: number };\nconst columnHelper = createColumnHelper<Person>();\n\nconst columns = [\n  columnHelper.accessor(\"name\", { header: \"Name\" }),\n  columnHelper.accessor(\"age\", { header: \"Age\", cell: (c) => `${c.getValue()} yrs` }),\n];\n\nfunction PeopleTable({ data }: { data: Person[] }) {\n  const [sorting, setSorting] = React.useState([]);\n  const table = useReactTable({\n    data,\n    columns,\n    state: { sorting },\n    onSortingChange: setSorting,\n    getCoreRowModel: getCoreRowModel(),      // always required\n    getSortedRowModel: getSortedRowModel(),  // opt-in feature = opt-in row model\n  });\n\n  return (\n    <table>\n      <thead>\n        {table.getHeaderGroups().map((hg) => (\n          <tr key={hg.id}>\n            {hg.headers.map((h) => (\n              <th key={h.id} onClick={h.column.getToggleSortingHandler()}>\n                {flexRender(h.column.columnDef.header, h.getContext())}\n              </th>\n            ))}\n          </tr>\n        ))}\n      </thead>\n      <tbody>\n        {table.getRowModel().rows.map((row) => (\n          <tr key={row.id}>\n            {row.getVisibleCells().map((cell) => (\n              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>\n            ))}\n          </tr>\n        ))}\n      </tbody>\n    </table>\n  );\n}" },
        { type: "list", items: [
          "**`getCoreRowModel()`** is mandatory. Each feature has a paired row model you opt into: `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, `getGroupedRowModel`, `getExpandedRowModel`.",
          "**`flexRender`** renders a column's `header`/`cell` definition (which can be a string, a function, or a component) with the right context.",
          "State (`sorting`, `columnFilters`, `pagination`, `rowSelection`) can be **controlled** (pass `state` + `onXChange`) or left uncontrolled/internal.",
          "`columnHelper.accessor` (typed key or accessor fn), `columnHelper.display` (buttons/checkboxes with no data), `columnHelper.group` (grouped headers)."
        ] },
        { type: "callout", variant: "gotcha", text: "Keep `data` and `columns` **referentially stable** (define `columns` outside the component or memoize both). Passing a fresh array every render makes the table recompute row models each time and can cause infinite loops. For very large tables, combine with **TanStack Virtual** to only render visible rows." }
      ]
    },
    {
      id: "form",
      title: "TanStack Form: type-safe forms",
      level: "core",
      body: [
        { type: "p", text: "TanStack Form (v1) is a headless, type-safe form library. `useForm` owns values, validation and submission; `form.Field` is a render-prop component that wires an individual field. Validation runs per-field via `onChange`/`onBlur`/`onSubmit` callbacks, or via a **Standard Schema** (Zod/Valibot/ArkType) at the field or form level." },
        { type: "code", lang: "bash", code: "npm i @tanstack/react-form" },
        { type: "code", lang: "tsx", code: "import { useForm } from \"@tanstack/react-form\";\n\nfunction SignupForm() {\n  const form = useForm({\n    defaultValues: { email: \"\", age: 0 },\n    onSubmit: async ({ value }) => { await createUser(value); },\n  });\n\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>\n      <form.Field\n        name=\"email\"\n        validators={{ onChange: ({ value }) => (value.includes(\"@\") ? undefined : \"Invalid email\") }}\n      >\n        {(field) => (\n          <>\n            <input\n              value={field.state.value}\n              onBlur={field.handleBlur}\n              onChange={(e) => field.handleChange(e.target.value)}\n            />\n            {field.state.meta.errors.length > 0 && <em>{field.state.meta.errors[0]}</em>}\n          </>\n        )}\n      </form.Field>\n\n      {/* re-render only on the subscribed slice */}\n      <form.Subscribe selector={(s) => s.canSubmit}>\n        {(canSubmit) => <button type=\"submit\" disabled={!canSubmit}>Sign up</button>}\n      </form.Subscribe>\n    </form>\n  );\n}" },
        { type: "list", items: [
          "**Field state** lives in `field.state`: `value`, `meta.errors`, `meta.isTouched`, `meta.isValidating`. Wire inputs with `field.handleChange` / `field.handleBlur`.",
          "**`validators`** accepts `onChange`, `onBlur`, `onSubmit`, plus async variants (`onChangeAsync`) with `onChangeAsyncDebounceMs`. Return `undefined` for valid, a string/error for invalid.",
          "**Schema validation:** pass a Zod/Valibot/ArkType schema directly as a validator (Standard Schema support) — no adapter needed.",
          "**`form.Subscribe`** with a `selector` gives fine-grained reactivity (e.g. only re-render the submit button when `canSubmit` changes)."
        ] },
        { type: "callout", variant: "tip", text: "For maximum type-safety and reuse, create a **bound form** with `createFormHook` and pre-wire your own field/subscribe components — you get a typed component library instead of raw render props on every form." }
      ]
    },
    {
      id: "virtual",
      title: "TanStack Virtual: windowing huge lists",
      level: "deep",
      body: [
        { type: "p", text: "TanStack Virtual (v3) renders only the rows/columns visible in a scroll container, so a list of 100k items mounts a handful of DOM nodes. It's headless: `useVirtualizer` returns virtual items with sizes/offsets and you absolutely-position them." },
        { type: "code", lang: "bash", code: "npm i @tanstack/react-virtual" },
        { type: "code", lang: "tsx", code: "import { useVirtualizer } from \"@tanstack/react-virtual\";\n\nfunction BigList({ rows }: { rows: string[] }) {\n  const parentRef = React.useRef<HTMLDivElement>(null);\n  const rv = useVirtualizer({\n    count: rows.length,\n    getScrollElement: () => parentRef.current,\n    estimateSize: () => 35,       // px per row (measured/corrected as they render)\n    overscan: 5,                  // render a few extra above/below\n  });\n\n  return (\n    <div ref={parentRef} style={{ height: 400, overflow: \"auto\" }}>\n      <div style={{ height: rv.getTotalSize(), position: \"relative\" }}>\n        {rv.getVirtualItems().map((vi) => (\n          <div\n            key={vi.key}\n            style={{ position: \"absolute\", top: 0, left: 0, width: \"100%\",\n                     height: vi.size, transform: `translateY(${vi.start}px)` }}\n          >\n            {rows[vi.index]}\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}" },
        { type: "callout", variant: "note", text: "The scroll container needs a fixed height and `overflow: auto`; the inner spacer gets `getTotalSize()` height so the scrollbar is correct, and each virtual item is absolutely positioned via `translateY(start)`. Supports dynamic row measurement, horizontal virtualization, and grids — pairs naturally with TanStack Table for large datagrids." }
      ]
    },
    {
      id: "start",
      title: "TanStack Start: the fullstack framework",
      level: "deep",
      body: [
        { type: "p", text: "**TanStack Start** (v1, in **Release Candidate** as of mid-2026 — API stable, not yet a tagged 1.0) is a fullstack React framework built on **TanStack Router + Vite**, positioned as a type-safe alternative to Next.js. It adds SSR/streaming, and **server functions** — isomorphic functions you write once and call from anywhere (loaders, components, other server functions)." },
        { type: "code", lang: "bash", code: "npm i @tanstack/react-start" },
        { type: "code", lang: "tsx", code: "import { createServerFn } from \"@tanstack/react-start\";\n\n// runs ONLY on the server; callable from client, loaders, or other server fns\nexport const getUser = createServerFn({ method: \"GET\" })\n  .validator((id: string) => id)               // validate/typed input\n  .handler(async ({ data: id }) => {\n    return db.user.findUnique({ where: { id } }); // DB access, secrets, etc. stay server-side\n  });\n\n// in a route loader:\nexport const Route = createFileRoute(\"/users/$id\")({\n  loader: ({ params }) => getUser({ data: params.id }),\n  component: () => <User user={Route.useLoaderData()} />,\n});" },
        { type: "list", items: [
          "**Server functions** (`createServerFn`) support GET/POST, input validation, and are addressed by a stable generated ID under the hood; server-only code is stripped from the client bundle.",
          "Built on the same **type-safe Router** — routes, params, search and loaders carry types across the server/client boundary.",
          "**Vite-native** (fast dev/HMR), SSR + streaming, deployable to Node and edge runtimes.",
          "Choose Start when you want Next.js-style fullstack ergonomics but with TanStack's end-to-end type safety and Router's search-param model; it's stable enough to ship real SaaS in 2026."
        ] },
        { type: "callout", variant: "note", text: "Start is essentially \"Router with a server\": if you already use TanStack Router + Query on the client, Start is the natural fullstack extension. Unlike Next.js App Router it isn't built on React Server Components — it uses classic SSR + isomorphic server functions, which many teams find simpler to reason about." }
      ]
    },
    {
      id: "comparison",
      title: "Query vs SWR vs RTK Query vs framework built-ins",
      level: "deep",
      body: [
        { type: "p", text: "These all cache async/server state. The axis that matters: how much do you want the library to own, and what's your surrounding stack?" },
        { type: "table", headers: ["Tool", "Strengths", "Reach for when"], rows: [
          ["**TanStack Query**", "the most complete cache: mutations, optimistic updates, infinite, devtools, framework-agnostic", "default choice for any non-trivial data layer, any framework"],
          ["**SWR**", "tiny, simple, Vercel-made; great for read-heavy Next.js apps", "you want minimal API and mostly `GET`s; less need for mutation tooling"],
          ["**RTK Query**", "part of Redux Toolkit; auto-generated hooks, normalized cache, codegen from OpenAPI", "you already use Redux and want data-fetching integrated with your store"],
          ["**Router loaders**", "React Router / TanStack Router loaders fetch on navigation", "route-coupled data; pair with Query for caching + background sync"],
          ["**Next.js `fetch`/RSC**", "server components + framework-level request cache", "you're all-in on Next App Router and can do fetching on the server"]
        ] },
        { type: "callout", variant: "tip", text: "Query and router loaders / RSC are **complementary**, not either/or: use the router (or a Server Component) to kick off the fetch early, and Query to own client-side caching, deduping, background refetch and mutations. A very common 2026 stack is TanStack Router + Query, or Next.js + Query for the client-interactive parts." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns across the suite — mostly Query, since it's what you'll use most." },
        { type: "heading", text: "1. Query key mistakes" },
        { type: "callout", variant: "gotcha", text: "The key is a dependency array: **anything the `queryFn` reads must be in the key**. Missing a variable (`queryKey: [\"todo\"]` while fetching `todo/id`) means stale/shared data across ids; a non-serializable value (a `Date`, a class instance, a function) breaks structural matching. Use plain arrays of primitives/plain objects, generic → specific." },
        { type: "heading", text: "2. staleTime=0 surprise refetches" },
        { type: "callout", variant: "warn", text: "The default `staleTime: 0` refetches on every mount, window focus and reconnect — people report \"my API is hit constantly.\" It's by design. Raise `staleTime` for data that doesn't change every second, or tune `refetchOnWindowFocus`. Don't confuse it with `gcTime` (cache eviction of *unused* queries, default 5 min)." },
        { type: "heading", text: "3. isLoading vs isPending (v5)" },
        { type: "callout", variant: "gotcha", text: "v5 renamed the \"no data yet\" state to **`isPending`**; `isLoading` now means `isPending && isFetching`. Use `isPending` for the first-load spinner and `isFetching` for a background-refresh indicator. A disabled query (`enabled: false`) is `isPending` forever — don't render a spinner for it." },
        { type: "heading", text: "4. Over-invalidation" },
        { type: "callout", variant: "warn", text: "`invalidateQueries({ queryKey: [\"todos\"] })` is a **prefix** match — it refetches every query under `todos`. Invalidating a broad key (or `queryClient.invalidateQueries()` with no key) after every mutation causes refetch storms. Invalidate the narrowest key that changed, or use `setQueryData` to patch in place." },
        { type: "heading", text: "5. Server state in useState" },
        { type: "callout", variant: "gotcha", text: "Copying `data` into `useState` (`const [todos, setTodos] = useState(data)`) forks the cache — your local copy goes stale and won't background-refresh. Let Query be the source of truth; derive with `select`, and for edits use mutations + `setQueryData`, not local state. Keep `useState` for genuine *client* state (form inputs, toggles)." },
        { type: "heading", text: "6. Forgetting enabled for dependent queries" },
        { type: "callout", variant: "gotcha", text: "A query whose `queryFn` uses a value from another query must be gated: `enabled: !!userId`. Without it, the second query runs immediately with `undefined` and fetches garbage (or throws). Gate on the dependency being present." },
        { type: "heading", text: "7. Mutation without invalidation" },
        { type: "callout", variant: "gotcha", text: "Writing to the server doesn't touch the cache. After a mutation, `invalidateQueries` (refetch) or `setQueryData` (patch) — otherwise the UI shows the pre-mutation list. This is the #1 \"it saved but didn't update\" bug." },
        { type: "heading", text: "8. Router types & `as const`" },
        { type: "callout", variant: "tip", text: "TanStack Router's type-safety depends on literal types. Register the router in the `Register` interface, and when building nav objects by hand use **`as const`** (e.g. `{ to: \"/posts/$id\" } as const`) so `to`/`params`/`search` stay literal and get checked — a widened `string` loses all the inference the library is famous for." },
        { type: "callout", variant: "note", text: "General discipline: keep the **Devtools** open in dev to see cache state; set sensible `defaultOptions` on the `QueryClient` once instead of per-query; keep Table `columns`/`data` referentially stable; and remember every TanStack library is *headless* — if something isn't rendering, it's usually because you haven't mapped over the model it returned." }
      ]
    }
  ],

  packages: [
    { name: "@tanstack/react-query", why: "the core: QueryClient, useQuery/useMutation, caching, background refetch, invalidation" },
    { name: "@tanstack/react-query-devtools", why: "inspect every query's key/state/data; trigger refetch & invalidate — essential in dev" },
    { name: "@tanstack/query-core", why: "framework-agnostic core the adapters wrap; use directly for custom integrations" },
    { name: "@tanstack/react-router", why: "type-safe routing with typed params and validated search params; loaders/beforeLoad" },
    { name: "@tanstack/router-plugin", why: "Vite/Rspack plugin for file-based routes + route-tree codegen" },
    { name: "@tanstack/react-table", why: "headless datagrid v8: column defs, row models (sort/filter/paginate/group)" },
    { name: "@tanstack/react-form", why: "type-safe form state, field API, and Standard-Schema (Zod/Valibot) validation" },
    { name: "@tanstack/react-virtual", why: "windowing/virtualization (useVirtualizer) for huge lists, grids and tables" },
    { name: "@tanstack/react-start", why: "fullstack React framework: Router + Vite + isomorphic server functions (createServerFn)" },
    { name: "zod / valibot / arktype", why: "Standard-Schema validators used by Router validateSearch and Form validators" },
    { name: "@tanstack/eslint-plugin-query", why: "lint rules catching missing deps in query keys and other Query footguns" },
    { name: "@tanstack/react-query-persist-client", why: "persist the cache to localStorage/IndexedDB for offline & instant reloads" }
  ],

  gotchas: [
    "**`fetch` doesn't throw on 4xx/5xx** — check `res.ok` and `throw` in your `queryFn`, or Query treats a 500 as success and `isError` stays false.",
    "**Everything the `queryFn` reads must be in the `queryKey`** — a missing variable shares/staless data across inputs; the key is a dependency array.",
    "**Default `staleTime` is 0** → refetch on every mount/focus/reconnect. Raise it for data that doesn't change constantly; it's unrelated to `gcTime` (5-min eviction of unused queries).",
    "**v5 renamed `isLoading` → `isPending`** (no data yet). `isLoading` now means `isPending && isFetching`. Use `isPending` for first-load, `isFetching` for background refresh.",
    "**A mutation doesn't touch the cache** — `invalidateQueries` (refetch) or `setQueryData` (patch) in `onSuccess`, or the UI stays stale.",
    "**`invalidateQueries` is a prefix match** — a broad key refetches everything under it. Invalidate the narrowest key that actually changed.",
    "**Dependent queries need `enabled`** — gate the second query on the first's result (`enabled: !!id`) or it runs with `undefined`.",
    "**Don't copy `data` into `useState`** — it forks the cache and goes stale. Query is the source of truth; derive with `select`, edit via mutations.",
    "**v5 pagination:** import the `keepPreviousData` function and pass it as `placeholderData` — the standalone `keepPreviousData: true` option was removed.",
    "**`useInfiniteQuery` requires `initialPageParam`** in v5, and `pageParam` is passed into `queryFn`; return `undefined` from `getNextPageParam` to end the list.",
    "**`useSuspenseQuery` has no `enabled`/`placeholderData`** and `data` is always defined — needs a `<Suspense>` + `<ErrorBoundary>`; keep `useQuery` for dependent/conditional queries.",
    "**Keep Table `columns` & `data` referentially stable** (define outside the component / memoize) or the table recomputes row models every render and can loop.",
    "**Every TanStack lib is headless** — Table returns row models, Virtual returns virtual items; nothing renders until you map over them.",
    "**Router type-safety needs literals** — register the router and use `as const` for hand-built nav objects so `to`/`params`/`search` stay checked.",
    "**Forward the `AbortSignal`** from `queryFn` into `fetch` so Query can cancel superseded/unused requests (great for search-as-you-type)."
  ],

  flashcards: [
    { q: "What kind of state does TanStack Query manage?", a: "**Server state** — async data you don't own that goes stale (fetching, caching, background sync, mutations). Not client/UI state (use `useState`/a store for that)." },
    { q: "What does 'headless' mean for TanStack?", a: "The libraries give you state and behavior but render **zero DOM** — you own all markup, styling and accessibility. Table returns row models; you write the `<table>`." },
    { q: "queryKey vs queryFn?", a: "`queryKey` is a serializable array identifying (and deduping) the cache entry — it acts as a dependency array. `queryFn` is an async function that returns the data or **throws** on error." },
    { q: "staleTime vs gcTime?", a: "`staleTime` (default 0) = how long data is **fresh** (no refetch while fresh). `gcTime` (default 5 min) = how long an **inactive** query stays cached before garbage collection. Independent." },
    { q: "isPending vs isLoading vs isFetching (v5)?", a: "`isPending` = no data yet (renamed from v4 `isLoading`). `isFetching` = a request is in flight (initial or background). `isLoading` = `isPending && isFetching` (derived first-load flag)." },
    { q: "status vs fetchStatus?", a: "`status` describes the **data** (pending/success/error). `fetchStatus` describes the **network** (fetching/idle). Cached data during a background refetch is `success` + `fetching` simultaneously." },
    { q: "How do you make one query depend on another?", a: "`enabled: !!dependency` — the query stays pending and won't run until the condition is true. The idiom for sequential/dependent queries." },
    { q: "How do you refresh data after a mutation?", a: "In `onSuccess`, `queryClient.invalidateQueries({ queryKey })` (refetch) or `setQueryData(key, updater)` (patch in place). A mutation never touches the cache by itself." },
    { q: "How do optimistic updates work?", a: "`onMutate`: cancel in-flight queries, snapshot via `getQueryData`, patch with `setQueryData`, return the snapshot as context. `onError`: restore the snapshot. `onSettled`: invalidate to resync." },
    { q: "mutate vs mutateAsync?", a: "`mutate` is fire-and-forget (errors go to `onError`). `mutateAsync` returns a Promise you must `await`/catch. Use `mutate` normally; `mutateAsync` when you need to chain or await." },
    { q: "What's special about TanStack Router vs React Router?", a: "End-to-end **type safety**, especially **validated & typed search params** (`validateSearch`) plus typed path params and typed `Link` targets — typos won't compile." },
    { q: "What does useReactTable need at minimum?", a: "`data`, `columns`, and `getCoreRowModel()`. Each feature adds a paired row model (`getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`). You render everything with `flexRender`." },
    { q: "How does TanStack Virtual render huge lists?", a: "`useVirtualizer` returns only the visible virtual items (with size/offset); you absolutely-position them inside a spacer of `getTotalSize()` height. Only a handful of DOM nodes exist at once." },
    { q: "What is a TanStack Start server function?", a: "`createServerFn(...).handler(...)` — server-only logic callable isomorphically from loaders, components or other server functions. Input can be validated; server code is stripped from the client bundle." },
    { q: "When choose Query over SWR / RTK Query?", a: "Query for a complete data layer (mutations, optimistic, infinite, devtools) in any framework. SWR for tiny read-heavy apps. RTK Query if you're already on Redux." },
    { q: "Why not store query `data` in useState?", a: "It forks the cache — the copy goes stale and won't background-refresh. Query is the source of truth; derive with `select` and edit via mutations + `setQueryData`." }
  ],

  cheatsheet: [
    { label: "Install Query", code: "npm i @tanstack/react-query @tanstack/react-query-devtools" },
    { label: "Provider", code: "<QueryClientProvider client={new QueryClient()}>{app}</QueryClientProvider>" },
    { label: "useQuery", code: "useQuery({ queryKey: [\"todos\", id], queryFn: () => fetchTodo(id) })" },
    { label: "Set staleTime", code: "useQuery({ queryKey, queryFn, staleTime: 60_000 })" },
    { label: "Dependent query", code: "useQuery({ queryKey: [\"p\", id], queryFn, enabled: !!id })" },
    { label: "Keep prev page", code: "useQuery({ queryKey:[\"t\",page], queryFn, placeholderData: keepPreviousData })" },
    { label: "useMutation", code: "const { mutate } = useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey:[\"todos\"] }) })" },
    { label: "Invalidate", code: "queryClient.invalidateQueries({ queryKey: [\"todos\"] })" },
    { label: "Patch cache", code: "queryClient.setQueryData([\"todos\"], (old) => [...old, next])" },
    { label: "Infinite query", code: "useInfiniteQuery({ queryKey, queryFn, initialPageParam: null, getNextPageParam: (p)=>p.next })" },
    { label: "Prefetch", code: "queryClient.prefetchQuery({ queryKey, queryFn })" },
    { label: "Suspense query", code: "const { data } = useSuspenseQuery({ queryKey, queryFn }) // data defined" },
    { label: "Router route", code: "createFileRoute(\"/posts/$id\")({ loader, component })" },
    { label: "Validate search", code: "validateSearch: z.object({ tab: z.enum([\"a\",\"b\"]) })" },
    { label: "Table", code: "useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })" },
    { label: "Virtualizer", code: "useVirtualizer({ count, getScrollElement, estimateSize: () => 35 })" },
    { label: "Server fn (Start)", code: "createServerFn().handler(async ({ data }) => db.get(data))" }
  ]
});
