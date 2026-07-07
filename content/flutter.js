(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "flutter",
  name: "Flutter",
  language: "Dart",
  tagline: "One **Dart** codebase, every screen — a reactive **widget** tree that renders natively to mobile, web, and desktop.",
  color: "#027dfd",
  readMinutes: 30,

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "Flutter is a UI toolkit: you write **Dart**, and Flutter paints every pixel itself with its own rendering engine (Skia / Impeller) — it does **not** wrap native OS widgets. One codebase compiles to Android, iOS, web, Windows, macOS, and Linux, all looking and behaving the same because Flutter draws them all." },
        { type: "p", text: "The defining idea: **everything is a widget**. A button is a widget, padding is a widget, the whole app is a widget, even *state* and *animation* live inside widgets. Your UI is a **tree** of widgets, and that tree is a pure function of your state: **UI = f(state)**. You never mutate the DOM/views imperatively — you change state and *describe* what the UI should look like now; Flutter figures out the minimal change." },
        { type: "list", items: [
          "**Reach for it when:** you want one team + one codebase across mobile/web/desktop, pixel-perfect custom UI, 60/120fps animations, and a fast edit loop (hot reload).",
          "**Declarative, not imperative:** you return a fresh widget tree from `build()` on every change. Widgets are cheap, immutable *descriptions*; Flutter reuses the heavy objects underneath.",
          "**Batteries included:** Material 3 + Cupertino widget sets, routing, animation, gestures, and testing all ship in the SDK."
        ] },
        { type: "heading", text: "The three trees" },
        { type: "p", text: "Flutter keeps **three parallel trees**, and understanding them explains almost every performance question and `key` bug:" },
        { type: "table", headers: ["Tree", "What it is", "Lifetime"], rows: [
          ["**Widget** tree", "immutable *config* you return from `build()`", "thrown away & rebuilt constantly (cheap)"],
          ["**Element** tree", "the runtime instance that holds state & links the trees", "persists across rebuilds (this is where `State` lives)"],
          ["**Render** (RenderObject) tree", "does layout, painting, hit-testing", "persists; only mutated when config actually changes"]
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Flutter 3.2x** with **Dart 3.x** (sound null safety, records & patterns, `sealed`/`final` classes). **Material 3** (`useMaterial3: true`) is the default theme. Impeller is the default renderer on iOS/Android." },
        { type: "callout", variant: "tip", text: "Mental shortcut when reading Flutter code: **it's all constructors**. Nesting widgets is just passing widgets as arguments (`child:` / `children:`). There is no template language — the layout *is* the Dart expression tree." }
      ]
    },
    {
      id: "dart-essentials",
      title: "Dart essentials for Flutter",
      level: "core",
      body: [
        { type: "p", text: "You can't read Flutter code without a little modern Dart. Dart 3 has **sound null safety** (types are non-nullable unless you add `?`), so most \"cannot be null\" bugs are compile errors." },
        { type: "code", lang: "dart", code: "// null safety\nString name = \"Ada\";        // never null\nString? maybe;              // nullable -> defaults to null\nint len = maybe?.length ?? 0;  // null-aware access + default\nString sure = maybe!;       // ! asserts non-null (throws if wrong — use sparingly)\n\n// final vs const\nfinal now = DateTime.now(); // runtime constant: assigned once\nconst pi = 3.14159;         // compile-time constant (baked in, canonicalized)" },
        { type: "callout", variant: "tip", text: "`const` matters for performance in Flutter: a `const` widget is created **once** and reused across rebuilds, so Flutter can skip rebuilding it entirely. Prefer `const` constructors everywhere the values are compile-time known." },
        { type: "heading", text: "Async: Future, Stream, async/await" },
        { type: "code", lang: "dart", code: "Future<String> fetchUser() async {\n  final res = await http.get(Uri.parse(\"https://api.example.com/me\"));\n  return res.body;                 // a Future resolves once\n}\n\nStream<int> ticker() async* {      // a Stream yields many values over time\n  for (var i = 0; ; i++) {\n    await Future.delayed(const Duration(seconds: 1));\n    yield i;\n  }\n}\n\nawait for (final tick in ticker()) { print(tick); }" },
        { type: "heading", text: "Records & pattern matching (Dart 3)" },
        { type: "code", lang: "dart", code: "// records: lightweight anonymous tuples\n(int, String) pair = (1, \"one\");\nvar ({int x, int y}) = (x: 3, y: 4);      // named fields\n\n// destructuring + switch expressions with patterns\nfinal (id, label) = pair;\nString describe(Object o) => switch (o) {\n  int n when n > 0 => \"positive int\",\n  String s         => \"string of length ${s.length}\",\n  _                => \"something else\",\n};" },
        { type: "heading", text: "Collection-if / collection-for & cascades" },
        { type: "code", lang: "dart", code: "// build lists inline — very common inside `children: [...]`\nfinal loggedIn = true;\nWidget nav = Column(children: [\n  const Text(\"Home\"),\n  if (loggedIn) const Text(\"Profile\"),        // collection-if\n  for (final t in [\"A\", \"B\"]) Text(t),         // collection-for\n  ...extraWidgets,                             // spread\n]);\n\n// cascade `..` configures one object without repeating its name\nfinal ctrl = TextEditingController()\n  ..text = \"hi\"\n  ..selection = const TextSelection.collapsed(offset: 2);" },
        { type: "callout", variant: "note", text: "`collection-if`/`collection-for` replace the ternary-and-spread mess you'd write in JSX. They're the idiomatic way to conditionally include widgets in a `children` list." }
      ]
    },
    {
      id: "setup",
      title: "Setup, tooling & the edit loop",
      level: "core",
      body: [
        { type: "p", text: "Install the Flutter SDK, then let `flutter doctor` tell you what's missing (Android SDK, Xcode, a browser). Scaffold and run from the CLI or your IDE (VS Code / Android Studio with the Flutter plugin)." },
        { type: "code", lang: "bash", code: "flutter doctor                 # check toolchain (Android/iOS/web)\nflutter create my_app          # scaffold a project\ncd my_app\nflutter devices                # list emulators/simulators/browsers\nflutter run                    # build & launch on the selected device\nflutter run -d chrome          # run on web\nflutter run --release          # AOT-compiled, no debug overhead" },
        { type: "heading", text: "Hot reload vs hot restart" },
        { type: "table", headers: ["Action", "Key", "What it does", "State"], rows: [
          ["**Hot reload**", "`r`", "injects changed Dart into the running VM, rebuilds the widget tree", "**kept**"],
          ["**Hot restart**", "`R`", "restarts the app from scratch (re-runs `main`)", "**lost**"],
          ["Full restart", "stop + `flutter run`", "recompiles everything (needed after native/pubspec changes)", "lost"]
        ] },
        { type: "callout", variant: "gotcha", text: "Hot **reload** re-runs `build()` but does **not** re-run `main()`, `initState()`, or global/`static` initializers, and won't pick up changes to `const` values or enum/class shape. When something \"won't update,\" hot **restart** (`R`). Native code or `pubspec.yaml` changes need a full restart." },
        { type: "heading", text: "pubspec.yaml & pub" },
        { type: "code", lang: "yaml", code: "name: my_app\nenvironment:\n  sdk: \">=3.2.0 <4.0.0\"\n\ndependencies:\n  flutter:\n    sdk: flutter\n  http: ^1.2.0\n  go_router: ^14.0.0\n\ndev_dependencies:\n  flutter_test:\n    sdk: flutter\n  flutter_lints: ^4.0.0\n\nflutter:\n  uses-material-design: true\n  assets:\n    - assets/images/" },
        { type: "code", lang: "bash", code: "flutter pub add http           # add a dependency (edits pubspec + runs get)\nflutter pub get                # fetch deps\nflutter pub upgrade            # bump within version constraints\ndart run build_runner build   # run codegen (json_serializable, etc.)" },
        { type: "callout", variant: "tip", text: "**DevTools** is Flutter's Swiss-army debugger: the **widget inspector** (tap a widget, see the tree + why it laid out that way), a rebuild counter, CPU/memory profilers, and the network view. Launch it from your IDE or the URL printed by `flutter run`." }
      ]
    },
    {
      id: "widgets",
      title: "Stateless vs Stateful widgets",
      level: "core",
      body: [
        { type: "p", text: "There are two widgets you write by hand. A **`StatelessWidget`** is a pure function of its constructor args — nothing changes over its lifetime. A **`StatefulWidget`** owns mutable **`State`** that survives rebuilds and can trigger them with `setState`." },
        { type: "code", lang: "dart", code: "class Greeting extends StatelessWidget {\n  const Greeting({super.key, required this.name});\n  final String name;                 // immutable fields\n\n  @override\n  Widget build(BuildContext context) => Text(\"Hello, $name\");\n}" },
        { type: "code", lang: "dart", code: "class Counter extends StatefulWidget {\n  const Counter({super.key});\n  @override\n  State<Counter> createState() => _CounterState();\n}\n\nclass _CounterState extends State<Counter> {\n  int _count = 0;                    // mutable state lives here, in the Element\n\n  void _increment() {\n    setState(() => _count++);        // mark dirty -> Flutter re-runs build()\n  }\n\n  @override\n  Widget build(BuildContext context) {\n    return ElevatedButton(\n      onPressed: _increment,\n      child: Text(\"Count: $_count\"),\n    );\n  }\n}" },
        { type: "callout", variant: "note", text: "**Why the split `State` class?** The `StatefulWidget` itself is immutable and thrown away on every rebuild; the `State` object lives in the Element tree and persists. That's why `_count` survives rebuilds but the widget's `final` fields don't." },
        { type: "heading", text: "setState, BuildContext & the lifecycle" },
        { type: "list", items: [
          "**`setState`** synchronously mutates state, then schedules a rebuild of *this* `State`'s subtree. Never do heavy work or `await` inside the closure — mutate, return, done.",
          "**`BuildContext`** is the element's location in the tree. You use it to look *up* the tree — `Theme.of(context)`, `Navigator.of(context)`, `MediaQuery.of(context)`.",
          "**`initState()`** runs once when the State is inserted — set up controllers, subscriptions, initial fetches (but you can't use `InheritedWidget`/`context` for `.of()` reliably here; use `didChangeDependencies`).",
          "**`dispose()`** runs when the State is removed — **cancel timers, close streams, dispose controllers** here or you leak.",
          "**`didUpdateWidget(old)`** runs when the parent rebuilds with new config — react to changed props."
        ] },
        { type: "code", lang: "dart", code: "@override\nvoid initState() {\n  super.initState();\n  _sub = stream.listen(_onData);         // set up\n}\n\n@override\nvoid dispose() {\n  _sub.cancel();                          // tear down — always mirror initState\n  _controller.dispose();\n  super.dispose();\n}" },
        { type: "callout", variant: "gotcha", text: "Forgetting to `dispose()` a `TextEditingController`, `AnimationController`, `ScrollController`, or `StreamSubscription` is the classic Flutter memory leak. Rule: anything you `.dispose()`/`.cancel()`-able that you created in `initState`, tear down in `dispose`." }
      ]
    },
    {
      id: "layout",
      title: "Layout: constraints go down, sizes go up",
      level: "core",
      body: [
        { type: "p", text: "Flutter layout is a single-pass algorithm you must internalize: **constraints go down, sizes go up, and the parent sets the position.** A parent passes size *constraints* (min/max width & height) to each child; the child chooses its own size within them and reports back; the parent then positions each child. A widget can **never** know its own size in `build()` — only its constraints do (via `LayoutBuilder`)." },
        { type: "table", headers: ["Widget", "Does", "Use for"], rows: [
          ["`Row` / `Column`", "lay children out horizontally / vertically", "the two main flex axes"],
          ["`Expanded`", "child fills remaining space along the flex axis", "\"take the rest\" (weight via `flex:`)"],
          ["`Flexible`", "child *may* shrink to fit (unlike Expanded which forces fill)", "proportional but not greedy"],
          ["`Stack` / `Positioned`", "overlap children, z-order", "badges, overlays, absolute positioning"],
          ["`Container`", "combines padding + margin + decoration + constraints", "a styled box (convenience)"],
          ["`Padding`", "inset the child", "spacing without a full Container"],
          ["`SizedBox`", "fixed size, or a gap", "`SizedBox(height: 16)` between widgets"],
          ["`Center` / `Align`", "position a child within available space", "centering"]
        ] },
        { type: "code", lang: "dart", code: "Row(\n  mainAxisAlignment: MainAxisAlignment.spaceBetween,  // along the row\n  crossAxisAlignment: CrossAxisAlignment.center,      // across the row\n  children: [\n    const Icon(Icons.menu),\n    const Expanded(child: Text(\"Title\")),   // takes the leftover width\n    const SizedBox(width: 8),               // fixed gap\n    IconButton(icon: const Icon(Icons.search), onPressed: () {}),\n  ],\n)" },
        { type: "callout", variant: "gotcha", text: "**\"RenderFlex overflowed by N pixels\"** (yellow-black stripes) means a child wanted more space than its constraints allowed — usually text or an image in a `Row`. Fix by wrapping the flexible child in `Expanded`/`Flexible`, or the whole thing in a scroll view." },
        { type: "callout", variant: "warn", text: "**Unbounded constraints:** putting a `Column`/`ListView` inside another `Column` (or a `Row` inside a `Row`) gives the inner one *infinite* height/width and it throws. Wrap the inner one in `Expanded`, give it a fixed `SizedBox` height, or set `shrinkWrap: true` on a `ListView` (small lists only)." },
        { type: "code", lang: "dart", code: "// need to know the actual constraints? LayoutBuilder gives them to you\nLayoutBuilder(\n  builder: (context, constraints) {\n    return constraints.maxWidth > 600\n        ? const WideLayout()\n        : const NarrowLayout();   // responsive without a media query\n  },\n)" }
      ]
    },
    {
      id: "common-widgets",
      title: "Common widgets, Material 3 & Cupertino",
      level: "core",
      body: [
        { type: "p", text: "Flutter ships two full design systems: **Material** (`MaterialApp`, Android/Google look, Material 3 by default) and **Cupertino** (`CupertinoApp`, iOS look). Most apps use Material and let it adapt. **`Scaffold`** provides the standard page skeleton — app bar, body, FAB, drawer, bottom nav." },
        { type: "code", lang: "dart", code: "Scaffold(\n  appBar: AppBar(title: const Text(\"Inbox\")),\n  body: ListView.builder(                 // lazy: only builds visible rows\n    itemCount: messages.length,\n    itemBuilder: (context, i) => ListTile(\n      leading: const CircleAvatar(child: Icon(Icons.person)),\n      title: Text(messages[i].subject),\n      subtitle: Text(messages[i].preview),\n      onTap: () {},\n    ),\n  ),\n  floatingActionButton: FloatingActionButton(\n    onPressed: () {},\n    child: const Icon(Icons.add),\n  ),\n)" },
        { type: "list", items: [
          "**`ListView.builder`** / **`GridView.builder`** — lazily build only on-screen items. Always prefer these over `ListView(children: [...])` for long or dynamic lists.",
          "**`ListView.separated`** — like builder but with a `separatorBuilder` (dividers).",
          "**`GridView.count`** / **`SliverGridDelegateWithFixedCrossAxisCount`** — grid layouts.",
          "**`Text`, `Image`, `Icon`, `Card`, `Chip`, `TextButton`/`ElevatedButton`/`OutlinedButton`** — the everyday atoms.",
          "**`InkWell` / `GestureDetector`** — make anything tappable (InkWell adds the ripple)."
        ] },
        { type: "code", lang: "dart", code: "// the root: MaterialApp wires up theming, routing, localization\nMaterialApp(\n  title: \"My App\",\n  theme: ThemeData(\n    useMaterial3: true,\n    colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),\n  ),\n  home: const HomePage(),\n)" },
        { type: "callout", variant: "tip", text: "Material 3 uses a **seed color**: `ColorScheme.fromSeed(seedColor: ...)` generates a full, accessible tonal palette (primary, secondary, surface, etc.) from one color. Reference roles via `Theme.of(context).colorScheme.primary` instead of hardcoding hex values." },
        { type: "callout", variant: "note", text: "For an iOS-native feel on iOS while staying Material elsewhere, use the `.adaptive` constructors (e.g. `Switch.adaptive`, `CircularProgressIndicator.adaptive`) or the community `flutter_platform_widgets` package." }
      ]
    },
    {
      id: "input-forms",
      title: "Input & forms",
      level: "core",
      body: [
        { type: "p", text: "A **`TextField`** captures text. To *read* its value you either listen to `onChanged` or attach a **`TextEditingController`** (which you must `dispose`). For multi-field forms with validation, wrap fields in a **`Form`** and use **`TextFormField`** with a `GlobalKey<FormState>`." },
        { type: "code", lang: "dart", code: "final _controller = TextEditingController();\n\n@override\nvoid dispose() { _controller.dispose(); super.dispose(); }\n\n@override\nWidget build(BuildContext context) => TextField(\n  controller: _controller,\n  decoration: const InputDecoration(\n    labelText: \"Email\",\n    border: OutlineInputBorder(),\n  ),\n  keyboardType: TextInputType.emailAddress,\n  onSubmitted: (value) => print(value),\n);" },
        { type: "code", lang: "dart", code: "final _formKey = GlobalKey<FormState>();\n\nForm(\n  key: _formKey,\n  child: Column(children: [\n    TextFormField(\n      decoration: const InputDecoration(labelText: \"Email\"),\n      validator: (v) =>\n          (v == null || !v.contains(\"@\")) ? \"Enter a valid email\" : null,\n    ),\n    ElevatedButton(\n      onPressed: () {\n        if (_formKey.currentState!.validate()) {   // runs every validator\n          // all good -> submit\n        }\n      },\n      child: const Text(\"Sign in\"),\n    ),\n  ]),\n)" },
        { type: "callout", variant: "tip", text: "A `validator` returns `null` when the field is valid, or the **error message string** when it isn't. Call `_formKey.currentState!.validate()` to run them all; `.save()` triggers each field's `onSaved`." },
        { type: "callout", variant: "gotcha", text: "For anything beyond a couple of fields, reach for a form package (**`flutter_form_builder`** or **`reactive_forms`**) or drive fields from your state-management solution — hand-managing many `TextEditingController`s and `GlobalKey`s gets tedious fast." }
      ]
    },
    {
      id: "navigation",
      title: "Navigation & routing",
      level: "core",
      body: [
        { type: "p", text: "The built-in **`Navigator`** is a stack of routes: `push` a new screen on top, `pop` to go back. For small apps that's enough; for anything with deep links, web URLs, or nested/tab navigation, use **`go_router`** (maintained by the Flutter team) for declarative, URL-driven routing." },
        { type: "code", lang: "dart", code: "// imperative Navigator — quick and local\nNavigator.push(\n  context,\n  MaterialPageRoute(builder: (_) => DetailPage(id: 42)),\n);\n\n// return a value from the pushed screen\nfinal result = await Navigator.push<bool>(context, route);\nNavigator.pop(context, true);   // on the detail screen, return `true`" },
        { type: "code", lang: "dart", code: "// go_router — declarative, deep-linkable, works great on web\nfinal router = GoRouter(\n  routes: [\n    GoRoute(path: \"/\", builder: (context, state) => const HomePage()),\n    GoRoute(\n      path: \"/user/:id\",\n      builder: (context, state) =>\n          UserPage(id: state.pathParameters[\"id\"]!),\n    ),\n  ],\n);\n\nMaterialApp.router(routerConfig: router);\n\n// navigate by URL\ncontext.go(\"/user/42\");     // replace the stack (like a link)\ncontext.push(\"/user/42\");   // push on top (keeps back button)" },
        { type: "table", headers: ["Need", "Navigator", "go_router"], rows: [
          ["Push a detail screen", "`Navigator.push(...)`", "`context.push(\"/x\")`"],
          ["Named routes", "`Navigator.pushNamed` + `routes:`", "path-based, typed params"],
          ["Deep links / web URLs", "manual & painful", "**built in**"],
          ["Redirects / auth guards", "roll your own", "`redirect:` callback"],
          ["Nested tabs (persistent shell)", "hard", "`StatefulShellRoute`"]
        ] },
        { type: "callout", variant: "tip", text: "On **web** and for **deep links**, `go_router` is effectively mandatory — the raw `Navigator` doesn't keep the browser URL in sync. Start new non-trivial apps on `go_router` and skip the migration later." }
      ]
    },
    {
      id: "state-management",
      title: "State management landscape",
      level: "core",
      body: [
        { type: "p", text: "\"How do I share state?\" is *the* Flutter question. There's a natural progression — start with the simplest thing that works and only reach further when you feel the pain." },
        { type: "table", headers: ["Approach", "What it is", "Reach for it when"], rows: [
          ["**`setState`**", "local mutable state in one `State`", "state used by a single widget / small subtree"],
          ["**`InheritedWidget`**", "the low-level primitive that exposes data down the tree", "you're building a library; rarely by hand"],
          ["**Provider**", "an ergonomic wrapper over `InheritedWidget` + `ChangeNotifier`", "simple app-wide state, dependency injection"],
          ["**Riverpod**", "compile-safe, provider-without-context, testable", "most new apps — the community default"],
          ["**Bloc / Cubit**", "events -> states via streams, very structured", "large teams, complex flows, explicit state machines"]
        ] },
        { type: "heading", text: "Provider (ChangeNotifier)" },
        { type: "code", lang: "dart", code: "class CartModel extends ChangeNotifier {\n  final _items = <Item>[];\n  List<Item> get items => List.unmodifiable(_items);\n  void add(Item i) { _items.add(i); notifyListeners(); }  // ping listeners\n}\n\n// provide it above the widgets that need it\nChangeNotifierProvider(create: (_) => CartModel(), child: const App());\n\n// read it\nfinal cart = context.watch<CartModel>();   // rebuilds on notifyListeners\ncontext.read<CartModel>().add(item);       // one-off, no rebuild" },
        { type: "heading", text: "Riverpod (modern default)" },
        { type: "code", lang: "dart", code: "// declare a provider (global, but compile-safe & mockable)\nfinal counterProvider = NotifierProvider<Counter, int>(Counter.new);\n\nclass Counter extends Notifier<int> {\n  @override int build() => 0;\n  void increment() => state++;\n}\n\n// consume it — no BuildContext lookup needed\nclass CounterView extends ConsumerWidget {\n  @override\n  Widget build(BuildContext context, WidgetRef ref) {\n    final count = ref.watch(counterProvider);\n    return Text(\"$count\");\n  }\n}" },
        { type: "code", lang: "dart", code: "// Cubit (bloc's simpler sibling): a class that emits new states\nclass CounterCubit extends Cubit<int> {\n  CounterCubit() : super(0);\n  void increment() => emit(state + 1);\n}\n\nBlocBuilder<CounterCubit, int>(\n  builder: (context, count) => Text(\"$count\"),\n);" },
        { type: "callout", variant: "tip", text: "**Rule of thumb:** `setState` for local UI state (a toggle, a text field). **Riverpod** for shared/app-wide state in most new apps. **Bloc/Cubit** when you want enforced structure and an auditable event→state log for a big team. Provider is fine and still very common; Riverpod is essentially its successor by the same author." },
        { type: "callout", variant: "gotcha", text: "Don't build a giant global store and `watch` it everywhere — that rebuilds huge subtrees. Split state into focused providers/notifiers and watch the **narrowest** slice each widget needs (Riverpod's `select`, Provider's `Selector`)." }
      ]
    },
    {
      id: "async-ui",
      title: "Async UI: FutureBuilder & StreamBuilder",
      level: "core",
      body: [
        { type: "p", text: "To render data that arrives *later*, wrap it in **`FutureBuilder`** (one-shot: a `Future`) or **`StreamBuilder`** (ongoing: a `Stream`). Both give you an `AsyncSnapshot` describing the current state — waiting, data, or error — and rebuild when it changes." },
        { type: "code", lang: "dart", code: "FutureBuilder<User>(\n  future: _userFuture,          // created ONCE (see gotcha), e.g. in initState\n  builder: (context, snapshot) {\n    if (snapshot.connectionState == ConnectionState.waiting) {\n      return const CircularProgressIndicator();\n    }\n    if (snapshot.hasError) return Text(\"Error: ${snapshot.error}\");\n    final user = snapshot.data!;\n    return Text(user.name);\n  },\n)" },
        { type: "code", lang: "dart", code: "StreamBuilder<int>(\n  stream: ticker(),\n  initialData: 0,\n  builder: (context, snap) => Text(\"Tick: ${snap.data}\"),\n)" },
        { type: "callout", variant: "gotcha", text: "**Never create the Future inline** in `build()` (`future: fetchUser()`). `build()` can run many times, so you'd refire the request on every rebuild. Create it once in `initState()` (or a state-management provider) and pass the stored reference." },
        { type: "callout", variant: "note", text: "For real apps, prefer a state-management layer (Riverpod's `FutureProvider`/`AsyncNotifier`, or a Bloc) over raw `FutureBuilder` — you get caching, refetch, error retry, and loading state for free, and you keep async logic out of the widget." }
      ]
    },
    {
      id: "networking",
      title: "Networking & JSON",
      level: "core",
      body: [
        { type: "p", text: "**`http`** is the minimal client; **`dio`** is the batteries-included one (interceptors, timeouts, retries, cancellation, form-data). JSON comes back as `Map<String, dynamic>`; convert it to typed models with `fromJson`/`toJson` — hand-written for a few models, or generated with **`json_serializable`**." },
        { type: "code", lang: "dart", code: "import \"dart:convert\";\nimport \"package:http/http.dart\" as http;\n\nFuture<List<Post>> fetchPosts() async {\n  final res = await http.get(Uri.parse(\"https://api.example.com/posts\"));\n  if (res.statusCode != 200) throw Exception(\"HTTP ${res.statusCode}\");\n  final list = jsonDecode(res.body) as List;\n  return list.map((j) => Post.fromJson(j as Map<String, dynamic>)).toList();\n}" },
        { type: "code", lang: "dart", code: "// dio: interceptors, base URL, timeouts, cancel tokens\nfinal dio = Dio(BaseOptions(baseUrl: \"https://api.example.com\"));\ndio.interceptors.add(LogInterceptor());\nfinal res = await dio.get(\"/posts\");   // auto-decodes JSON into res.data" },
        { type: "code", lang: "dart", code: "// json_serializable: annotate, then `dart run build_runner build`\nimport \"package:json_annotation/json_annotation.dart\";\npart \"post.g.dart\";\n\n@JsonSerializable()\nclass Post {\n  final int id;\n  final String title;\n  Post({required this.id, required this.title});\n  factory Post.fromJson(Map<String, dynamic> j) => _$PostFromJson(j);\n  Map<String, dynamic> toJson() => _$PostToJson(this);\n}" },
        { type: "callout", variant: "tip", text: "Modeling many endpoints? Pair **`dio`** with **`retrofit`** (annotation-based typed API client) + **`json_serializable`** — you declare interfaces and the codegen writes the HTTP + parsing. Or use **`freezed`** for immutable models with `copyWith`, unions, and JSON in one." }
      ]
    },
    {
      id: "theming",
      title: "Theming & dark mode",
      level: "core",
      body: [
        { type: "p", text: "Set a **`ThemeData`** on `MaterialApp` and read it anywhere with `Theme.of(context)`. Provide a **`darkTheme`** and a `themeMode`, and Flutter switches automatically with the OS (or on your command). Style from the **`colorScheme`** and **`textTheme`** roles rather than hardcoding colors — that's what makes dark mode and Material 3 dynamic color work." },
        { type: "code", lang: "dart", code: "MaterialApp(\n  themeMode: ThemeMode.system,           // follow OS light/dark\n  theme: ThemeData(\n    useMaterial3: true,\n    colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),\n  ),\n  darkTheme: ThemeData(\n    useMaterial3: true,\n    colorScheme: ColorScheme.fromSeed(\n      seedColor: Colors.teal,\n      brightness: Brightness.dark,\n    ),\n  ),\n  home: const HomePage(),\n)" },
        { type: "code", lang: "dart", code: "// read theme roles in a widget\nWidget build(BuildContext context) {\n  final scheme = Theme.of(context).colorScheme;\n  final text = Theme.of(context).textTheme;\n  return Container(\n    color: scheme.surfaceContainerHighest,\n    child: Text(\"Hi\", style: text.titleLarge?.copyWith(color: scheme.primary)),\n  );\n}" },
        { type: "callout", variant: "tip", text: "To let users toggle theme in-app, drive `themeMode` from state (a Riverpod/Provider value) rather than `ThemeMode.system`, and rebuild `MaterialApp` when it changes." },
        { type: "callout", variant: "note", text: "Add reusable component styling via the sub-themes on `ThemeData` — `elevatedButtonTheme`, `appBarTheme`, `cardTheme`, `inputDecorationTheme` — so every instance of a widget looks consistent without repeating styles at each call site." }
      ]
    },
    {
      id: "animations",
      title: "Animations: implicit & explicit",
      level: "deep",
      body: [
        { type: "p", text: "Two tiers. **Implicit** animations (`AnimatedFoo`) tween automatically whenever their properties change — zero controllers, great for most UI polish. **Explicit** animations use an `AnimationController` you drive by hand — for looping, choreographed, or gesture-linked motion." },
        { type: "code", lang: "dart", code: "// implicit: just change the value and it animates over `duration`\nbool _big = false;\n\nAnimatedContainer(\n  duration: const Duration(milliseconds: 300),\n  curve: Curves.easeInOut,\n  width: _big ? 200 : 100,\n  height: _big ? 200 : 100,\n  color: _big ? Colors.indigo : Colors.orange,\n)\n// call setState(() => _big = !_big) and it tweens the transition\n// friends: AnimatedOpacity, AnimatedPadding, AnimatedAlign, AnimatedSwitcher" },
        { type: "code", lang: "dart", code: "// explicit: an AnimationController (needs a TickerProvider mixin)\nclass Spinner extends StatefulWidget { const Spinner({super.key});\n  @override State<Spinner> createState() => _SpinnerState(); }\n\nclass _SpinnerState extends State<Spinner>\n    with SingleTickerProviderStateMixin {\n  late final AnimationController _c = AnimationController(\n    vsync: this, duration: const Duration(seconds: 2),\n  )..repeat();\n\n  @override void dispose() { _c.dispose(); super.dispose(); }  // required!\n\n  @override\n  Widget build(BuildContext context) => RotationTransition(\n    turns: _c,                              // 0..1 drives a full turn\n    child: const Icon(Icons.sync),\n  );\n}" },
        { type: "code", lang: "dart", code: "// Tween maps the controller's 0..1 to a value range, + a curve\nfinal Animation<double> _size = Tween(begin: 0.0, end: 300.0).animate(\n  CurvedAnimation(parent: _c, curve: Curves.elasticOut),\n);\n// use inside AnimatedBuilder so only the animated part rebuilds\nAnimatedBuilder(\n  animation: _size,\n  builder: (context, child) => SizedBox(width: _size.value, child: child),\n  child: const FlutterLogo(),   // built once, not on every frame\n)" },
        { type: "callout", variant: "gotcha", text: "An `AnimationController` requires a `vsync` (a `TickerProvider`) — add `SingleTickerProviderStateMixin` (one controller) or `TickerProviderStateMixin` (several). And **always `dispose()`** the controller, or the ticker keeps firing forever." },
        { type: "callout", variant: "tip", text: "Pass the non-animating subtree as the `child:` of `AnimatedBuilder`/transition widgets — it's built once and reused every frame, so only the wrapper rebuilds. For complex sequences, the **`flutter_animate`** package gives a concise chainable API." }
      ]
    },
    {
      id: "assets",
      title: "Assets, images & fonts",
      level: "core",
      body: [
        { type: "p", text: "Declare bundled files under the `flutter:` section of `pubspec.yaml`, then load them by path. Flutter picks resolution variants (`2.0x`, `3.0x`) automatically for images placed in sibling folders." },
        { type: "code", lang: "yaml", code: "flutter:\n  uses-material-design: true\n  assets:\n    - assets/images/logo.png\n    - assets/data/          # a whole folder\n  fonts:\n    - family: Inter\n      fonts:\n        - asset: assets/fonts/Inter-Regular.ttf\n        - asset: assets/fonts/Inter-Bold.ttf\n          weight: 700" },
        { type: "code", lang: "dart", code: "Image.asset(\"assets/images/logo.png\", width: 120);   // bundled image\nImage.network(\"https://example.com/pic.jpg\");         // remote (add caching!)\n\n// load a text/JSON asset at runtime\nfinal json = await rootBundle.loadString(\"assets/data/config.json\");\n\n// use the bundled font\nconst TextStyle(fontFamily: \"Inter\", fontWeight: FontWeight.bold);" },
        { type: "callout", variant: "tip", text: "Use **`cached_network_image`** for remote images — it adds disk/memory caching plus placeholder and error widgets. For crisp icons at any size, prefer vector **`flutter_svg`** over multi-resolution PNGs." },
        { type: "callout", variant: "gotcha", text: "New assets in `pubspec.yaml` need a **full restart** (not hot reload) to be picked up, and indentation in `pubspec.yaml` is significant — a misaligned `assets:` list silently fails to bundle." }
      ]
    },
    {
      id: "platform",
      title: "Platform channels & native interop",
      level: "deep",
      body: [
        { type: "p", text: "When you need something the SDK/pub packages don't cover (a native SDK, a sensor, platform APIs), you bridge to Kotlin/Swift/etc. via a **`MethodChannel`** — an async message passing boundary. Most people never write one directly: a pub package already wraps it." },
        { type: "code", lang: "dart", code: "// Dart side: invoke a native method\nconst channel = MethodChannel(\"com.example/battery\");\n\nFuture<int> getBatteryLevel() async {\n  final level = await channel.invokeMethod<int>(\"getBatteryLevel\");\n  return level ?? -1;\n}\n// the native side registers a handler for \"getBatteryLevel\" and returns a result.\n// arguments/results are passed via a standard message codec (like JSON)." },
        { type: "list", items: [
          "**`MethodChannel`** — request/response calls. **`EventChannel`** — a stream of native events (sensor updates, connectivity).",
          "**FFI (`dart:ffi`)** — call C/C++ libraries directly, no channel, for performance-critical native code.",
          "**Platform views** (`AndroidView`/`UiKitView`) — embed a real native view (maps, webviews) inside the Flutter tree.",
          "**Prefer a package first:** `battery_plus`, `geolocator`, `camera`, `url_launcher`, `shared_preferences` already wrap the native code and handle both platforms."
        ] },
        { type: "callout", variant: "note", text: "Channel calls are **async** and cross an isolate/language boundary, so results are `dynamic` until you cast. Keep the native surface small and typed on the Dart side; return plain maps/lists that the standard codec understands." }
      ]
    },
    {
      id: "testing",
      title: "Testing: unit, widget & integration",
      level: "core",
      body: [
        { type: "p", text: "Flutter has three test tiers. **Unit tests** verify plain Dart (logic, models). **Widget tests** pump a widget into a headless test environment and assert on the tree — fast, no device. **Integration tests** drive the real app on a device/emulator end-to-end." },
        { type: "code", lang: "dart", code: "// unit test\nimport \"package:test/test.dart\";\n\ntest(\"cart totals\", () {\n  final cart = CartModel()..add(Item(price: 3))..add(Item(price: 4));\n  expect(cart.total, 7);\n});" },
        { type: "code", lang: "dart", code: "// widget test — pumpWidget + finders + matchers\nimport \"package:flutter_test/flutter_test.dart\";\n\ntestWidgets(\"counter increments\", (tester) async {\n  await tester.pumpWidget(const MaterialApp(home: Counter()));\n  expect(find.text(\"Count: 0\"), findsOneWidget);\n\n  await tester.tap(find.byIcon(Icons.add));\n  await tester.pump();                       // rebuild after setState\n\n  expect(find.text(\"Count: 1\"), findsOneWidget);\n});" },
        { type: "table", headers: ["Tier", "Runs on", "Speed", "Use for"], rows: [
          ["Unit", "Dart VM", "instant", "logic, models, providers"],
          ["Widget", "headless test binding", "fast", "a widget/screen's behavior & rendering"],
          ["Integration", "real device/emulator", "slow", "full flows, platform integration"]
        ] },
        { type: "callout", variant: "gotcha", text: "In widget tests, call **`await tester.pump()`** after an interaction to flush one frame, or **`pumpAndSettle()`** to run animations/async to completion. Forgetting to pump means your assertions run against the pre-interaction tree." },
        { type: "code", lang: "bash", code: "flutter test                          # unit + widget tests\nflutter test --coverage               # generates coverage/lcov.info\nflutter test integration_test/        # integration (on a device)" }
      ]
    },
    {
      id: "build-deploy",
      title: "Build, flavors & deploy",
      level: "core",
      body: [
        { type: "p", text: "`flutter build` produces the release artifact per platform. Use **`--release`** for AOT-compiled, stripped builds. Configure **flavors** (dev/staging/prod) in the native projects to ship different app IDs, icons, and config from one codebase." },
        { type: "code", lang: "bash", code: "flutter build apk --release            # Android APK\nflutter build appbundle --release      # Android .aab (Play Store preferred)\nflutter build ipa --release            # iOS (needs macOS + Xcode signing)\nflutter build web --release            # web (build/web/)\nflutter build macos / windows / linux  # desktop\n\n# flavors + compile-time config\nflutter build apk --flavor prod -t lib/main_prod.dart \\\n  --dart-define=API_URL=https://api.prod.example.com" },
        { type: "code", lang: "dart", code: "// read compile-time config injected via --dart-define\nconst apiUrl = String.fromEnvironment(\"API_URL\", defaultValue: \"http://localhost\");" },
        { type: "list", items: [
          "**Android:** ship an **App Bundle** (`.aab`) to Play; configure signing in `android/key.properties` + `build.gradle`.",
          "**iOS:** `build ipa` then upload via Xcode/Transporter; needs a paid Apple Developer account and provisioning.",
          "**Web:** static output in `build/web` — host on any static host/CDN; choose the HTML or CanvasKit renderer.",
          "**`--dart-define-from-file=env.json`** keeps many defines tidy; never bake real secrets into the client bundle."
        ] },
        { type: "callout", variant: "tip", text: "Shrink release size: `--split-per-abi` for APKs (per-architecture), prefer the App Bundle so Play serves the right slice, and use `--obfuscate --split-debug-info=...` to obfuscate Dart and keep symbol files for crash de-obfuscation." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The bugs every Flutter developer hits. Recognize the symptom, apply the fix." },
        { type: "heading", text: "setState() called after dispose()" },
        { type: "p", text: "An async callback (a network response, a timer) completes *after* the widget left the tree and calls `setState`, throwing \"setState() called after dispose()\". Guard with the `mounted` flag, or cancel the work in `dispose()`." },
        { type: "code", lang: "dart", code: "final data = await fetch();\nif (!mounted) return;         // widget gone? bail before touching state\nsetState(() => _data = data);" },
        { type: "heading", text: "Using BuildContext across an async gap" },
        { type: "p", text: "After an `await`, the `context` may be stale (the widget could be gone). The analyzer flags `use_build_context_synchronously`. Capture what you need *before* the await, or re-check `mounted`." },
        { type: "code", lang: "dart", code: "// WRONG: context used after await, widget may be disposed\nawait save();\nNavigator.of(context).pop();          // <- flagged, may crash\n\n// RIGHT: capture first, then await, then guard\nfinal nav = Navigator.of(context);\nawait save();\nif (!mounted) return;\nnav.pop();" },
        { type: "heading", text: "Rebuilding too much" },
        { type: "p", text: "Calling `setState` (or `notifyListeners`) high in the tree rebuilds everything below it. Push state as **low** as possible, split large `build` methods into smaller widgets, mark unchanging subtrees `const`, and watch the **narrowest** state slice (`Selector`/`select`)." },
        { type: "heading", text: "Unbounded height in Column / ListView" },
        { type: "p", text: "A `ListView` inside a `Column` has infinite height and throws; a `Column` inside a `Column` too. Wrap the inner scrollable in `Expanded` (or give a fixed `SizedBox` height). Use `shrinkWrap: true` only for genuinely short lists." },
        { type: "heading", text: "Keys: when the wrong widget keeps the wrong state" },
        { type: "p", text: "When you reorder or filter a list of *stateful* items, Flutter matches new widgets to old Elements by position and type — so state can stick to the wrong item. Give each item a **`ValueKey`/`ObjectKey`** so Flutter matches by identity, not position." },
        { type: "code", lang: "dart", code: "ListView(children: [\n  for (final todo in todos)\n    TodoTile(key: ValueKey(todo.id), todo: todo),   // stable identity\n]);" },
        { type: "callout", variant: "gotcha", text: "But don't sprinkle keys everywhere — an unnecessary or non-stable key (e.g. `UniqueKey()` in `build`) forces Flutter to *destroy and rebuild* the subtree every frame, killing performance and animations. Keys are for *preserving identity across position changes*, nothing else." },
        { type: "callout", variant: "tip", text: "**const constructors for perf:** a `const` widget is instantiated once and short-circuits rebuilds. Turn on the `prefer_const_constructors` lint and add `const` wherever the analyzer allows — it's the cheapest performance win in Flutter." },
        { type: "callout", variant: "warn", text: "**Jank from heavy `build`/synchronous work:** never do expensive computation, file I/O, or JSON parsing on the UI thread inside `build`. Move heavy CPU work to a background **isolate** with `compute(...)`, and keep `build` methods pure and fast." }
      ]
    }
  ],

  packages: [
    { name: "flutter (SDK)", why: "the framework: widgets, rendering, Material/Cupertino, animation, gestures" },
    { name: "provider", why: "ergonomic InheritedWidget + ChangeNotifier state/DI" },
    { name: "flutter_riverpod", why: "compile-safe, context-free, testable state management (modern default)" },
    { name: "flutter_bloc", why: "Bloc/Cubit event->state architecture for structured, large apps" },
    { name: "go_router", why: "declarative, URL/deep-link-driven routing (Flutter-team maintained)" },
    { name: "http", why: "minimal HTTP client for REST calls" },
    { name: "dio", why: "full HTTP client: interceptors, timeouts, cancel, form-data" },
    { name: "json_serializable + json_annotation", why: "codegen fromJson/toJson for typed models" },
    { name: "freezed", why: "immutable data classes, unions/sealed, copyWith, JSON" },
    { name: "get_it", why: "service locator for dependency injection" },
    { name: "shared_preferences", why: "simple key-value persistence (settings, tokens)" },
    { name: "cached_network_image", why: "network images with disk/memory caching + placeholders" },
    { name: "flutter_svg", why: "render SVG assets crisply at any size" },
    { name: "intl", why: "i18n, date/number formatting, localization" },
    { name: "flutter_animate", why: "concise chainable API for complex animations" },
    { name: "mocktail", why: "mocking for unit/widget tests" }
  ],

  gotchas: [
    "**`setState` after `dispose`:** async callbacks that resolve after the widget unmounts throw. Guard with `if (!mounted) return;` before `setState`.",
    "**`BuildContext` across async gaps:** after `await`, `context` may be stale. Capture `Navigator.of(context)`/`ScaffoldMessenger.of(context)` **before** the await, then check `mounted`.",
    "**Creating a Future inside `build`:** `FutureBuilder(future: fetch())` refires on every rebuild. Create the future once in `initState` or a provider.",
    "**Unbounded height:** a `ListView`/`Column` inside a `Column` gets infinite height and throws. Wrap in `Expanded`, give a fixed `SizedBox` height, or use `shrinkWrap: true` for short lists.",
    "**RenderFlex overflow (yellow/black stripes):** a child overflowed its `Row`/`Column`. Wrap the flexible child in `Expanded`/`Flexible` or make the parent scrollable.",
    "**Forgetting `dispose`:** `TextEditingController`, `AnimationController`, `ScrollController`, and `StreamSubscription` leak unless torn down in `dispose()`.",
    "**Rebuilding too much:** `setState` high in the tree rebuilds everything below. Push state low, split widgets, use `const`, and watch the narrowest slice.",
    "**Missing/misused keys:** reordered stateful lists keep state on the wrong item — add `ValueKey`. But `UniqueKey()` in `build` destroys/rebuilds the subtree every frame; avoid it.",
    "**Not marking widgets `const`:** const widgets are built once and skip rebuilds. Enable `prefer_const_constructors` and add `const` everywhere allowed.",
    "**Hot reload not reflecting changes:** it doesn't re-run `main`/`initState`/statics/`const`s. Hot **restart** (`R`); native or `pubspec` changes need a full restart.",
    "**Heavy work on the UI thread:** JSON parsing / big loops in `build` cause jank. Offload to a background isolate with `compute(...)`.",
    "**`Navigator.of(context)` errors:** calling it above the `MaterialApp`/`Navigator`, or on a context that isn't under one, throws. Use a `Builder` to get a descendant context.",
    "**`late` field never initialized:** accessing a `late` variable before assignment throws `LateInitializationError` at runtime — initialize it in `initState` or inline.",
    "**Assets not found:** new `pubspec.yaml` assets need a full restart, and YAML indentation is significant — a misaligned list silently doesn't bundle.",
    "**Global providers rebuilding everything:** one giant store watched everywhere is slow. Split into focused providers and select the exact fields each widget needs.",
    "**`double`/`int` and null-safety pitfalls:** `1` is an `int`, not a `double` — some APIs want `1.0`. And a stray `!` on a nullable that's actually null crashes; prefer `?.`/`??`."
  ],

  flashcards: [
    { q: "What is the core mental model of Flutter's UI?", a: "**Everything is a widget** and the **UI is a pure function of state (UI = f(state))**. You return an immutable widget tree from `build()`; changing state re-runs `build` and Flutter applies the minimal diff via the Element/Render trees." },
    { q: "What are the three trees?", a: "**Widget** (immutable config, rebuilt constantly), **Element** (persistent runtime instance that holds `State` and links the trees), and **Render** (RenderObject: layout, paint, hit-test)." },
    { q: "StatelessWidget vs StatefulWidget?", a: "`StatelessWidget` is a pure function of its constructor args (no mutable state). `StatefulWidget` has a companion `State` object (living in the Element tree) that holds mutable state and calls `setState` to rebuild." },
    { q: "What does `setState` do?", a: "Synchronously mutate state, then mark this `State` dirty so Flutter re-runs its `build()` on the next frame. Keep the closure tiny — never `await` inside it." },
    { q: "State the Flutter layout rule.", a: "**Constraints go down, sizes go up, parent sets position.** A parent gives each child min/max constraints; the child picks its size within them; the parent positions it. A widget can't know its own size in `build` (use `LayoutBuilder`)." },
    { q: "Expanded vs Flexible?", a: "Both distribute space along a `Row`/`Column`'s main axis. `Expanded` *forces* the child to fill its share; `Flexible` lets the child be smaller than its share. `Expanded` = `Flexible(fit: FlexFit.tight)`." },
    { q: "Hot reload vs hot restart?", a: "Hot **reload** (`r`) injects changed code and rebuilds the tree, **keeping state** — but doesn't re-run `main`/`initState`/statics/`const`s. Hot **restart** (`R`) re-runs the app from scratch, **losing state**." },
    { q: "How do you render data that arrives asynchronously?", a: "`FutureBuilder` (one-shot Future) or `StreamBuilder` (ongoing Stream) — they give an `AsyncSnapshot` (waiting/data/error) and rebuild on change. Create the future/stream once, not inline in `build`." },
    { q: "When do you use setState vs Provider/Riverpod vs Bloc?", a: "`setState` for local widget state; **Riverpod** (or Provider) for shared/app-wide state in most apps; **Bloc/Cubit** for large teams wanting explicit event→state structure. Progress from simplest to most structured." },
    { q: "Why prefer `const` constructors?", a: "A `const` widget is created once and canonicalized, so Flutter can skip rebuilding it entirely — the cheapest perf win. Enable `prefer_const_constructors`." },
    { q: "How do you avoid a `setState()`-after-`dispose` crash?", a: "Guard async callbacks with `if (!mounted) return;` before calling `setState`, and cancel timers/subscriptions in `dispose()`." },
    { q: "What's the BuildContext-across-async-gap problem?", a: "After an `await`, the widget may be gone and `context` stale. Capture what you need (e.g. `Navigator.of(context)`) **before** the await, then re-check `mounted` after it." },
    { q: "When do widgets need keys?", a: "When reordering/filtering a list of *stateful* widgets — a `ValueKey`/`ObjectKey` matches new widgets to old Elements by identity, not position, so state stays with the right item. Don't overuse keys." },
    { q: "Implicit vs explicit animations?", a: "**Implicit** (`AnimatedContainer`, `AnimatedOpacity`) tween automatically when a property changes — no controller. **Explicit** uses an `AnimationController` (+ `Tween`, `vsync`) you drive by hand for looping/choreographed motion." },
    { q: "How do you call native platform code?", a: "A `MethodChannel` (request/response) or `EventChannel` (event stream) passes async messages to Kotlin/Swift; `dart:ffi` calls C directly. Usually a pub package already wraps it." },
    { q: "What do widget tests use to interact and assert?", a: "`tester.pumpWidget(...)` to mount, **finders** (`find.text`, `find.byIcon`), **matchers** (`findsOneWidget`), and `tester.tap` + `pump()`/`pumpAndSettle()` to advance frames." }
  ],

  cheatsheet: [
    { label: "New project", code: "flutter create my_app && cd my_app" },
    { label: "Run / hot reload", code: "flutter run   (then r = reload, R = restart)" },
    { label: "Add package", code: "flutter pub add go_router" },
    { label: "Stateless widget", code: "class X extends StatelessWidget { Widget build(c) => ...; }" },
    { label: "Update state", code: "setState(() => _count++);" },
    { label: "Column with gap", code: "Column(children: [a, const SizedBox(height: 8), b])" },
    { label: "Fill remaining space", code: "Expanded(child: ...)" },
    { label: "Lazy list", code: "ListView.builder(itemCount: n, itemBuilder: (c, i) => ...)" },
    { label: "Navigate (go_router)", code: "context.push(\"/user/42\")" },
    { label: "Read theme color", code: "Theme.of(context).colorScheme.primary" },
    { label: "Async UI", code: "FutureBuilder(future: f, builder: (c, snap) => ...)" },
    { label: "Guard after await", code: "if (!mounted) return;" },
    { label: "Implicit animation", code: "AnimatedContainer(duration: d, width: w)" },
    { label: "Bundled image", code: "Image.asset(\"assets/images/logo.png\")" },
    { label: "Run tests", code: "flutter test" },
    { label: "Release build", code: "flutter build appbundle --release" }
  ]
});
