(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "cpp-wasm",
  name: "C++ WebAssembly",
  language: "C++",
  group: "WebAssembly",
  navLabel: "C++ (Emscripten)",
  tagline: "Ship **C++ to the browser** via WebAssembly — the Emscripten toolchain, `Embind`/`val` JS↔C++ interop, and DOM/canvas access.",
  color: "#654ff0",
  readMinutes: 26,

  sections: [
    {
      id: "overview",
      title: "Overview & the honest mental model",
      level: "core",
      body: [
        { type: "p", text: "This is not \"a C++ UI framework\" the way React or Leptos are frameworks. **C++ has no single dominant retained-mode UI framework for the web.** What C++ *does* have is a mature way to **run on the web at all**: compile your C++ to **WebAssembly** (`.wasm`) with the **Emscripten** toolchain, then drive it from — or have it drive — JavaScript, the DOM, and `<canvas>`. This deck teaches that: the toolchain, the JS↔C++ interop, the memory model, and the *real* options for putting pixels on screen." },
        { type: "p", text: "WebAssembly is a compact, fast, stack-based bytecode that runs in every modern browser at near-native speed inside the same sandbox as JS. It cannot touch the DOM directly — every DOM/Web API call crosses into JS. Emscripten's whole job is to make that crossing (and the C/C++ standard library, `malloc`, a virtual filesystem, `SDL`, `OpenGL`) *just work*." },
        { type: "list", items: [
          "**Reach for it when:** you have an existing C++ codebase (a game engine, image/video codec, physics sim, CAD kernel, emulator, crypto/DSP library) and want it in the browser without a rewrite — or you want C++-grade compute in a web app.",
          "**Do NOT reach for it** to build ordinary form-and-list web UIs from scratch. HTML/CSS/JS (or Rust/Yew, Blazor, etc.) are far more ergonomic for that. C++/WASM shines for *compute* and for *porting existing native apps*.",
          "**Mental model:** your C++ compiles to a `.wasm` module + a `.js` \"glue\" loader. The glue instantiates the module, wires up `Module.HEAP*` views over its **linear memory**, and exposes your exported functions. JS and C++ talk by **calling exported functions and reading/writing shared linear memory** — Embind and `emscripten::val` are the ergonomic layer over that raw seam.",
          "**UI reality:** most browser C++ UIs are **immediate-mode** — you own the `<canvas>` and redraw every frame (SDL/OpenGL→WebGL, or Dear ImGui). Retained-mode DOM options exist (Qt for WebAssembly, Asm-DOM) but are heavier or niche."
        ] },
        { type: "table", headers: ["Concept", "Native C++", "C++ on the web (Emscripten)"], rows: [
          ["Compiler", "clang/gcc → machine code", "`emcc`/`em++` (clang) → `.wasm` + `.js` glue"],
          ["Entry point", "`main()` runs to completion", "`main()` runs once; a **main loop** yields to the browser"],
          ["Memory", "OS virtual memory", "a single `ArrayBuffer` = **linear memory**, viewed via `HEAP8/HEAPF32/...`"],
          ["Threads", "`std::thread` / pthreads", "pthreads via **Web Workers + SharedArrayBuffer** (needs COOP/COEP)"],
          ["Filesystem", "real disk", "**virtual FS** (MEMFS in RAM), or `fetch`/IDBFS"],
          ["Talk to the UI", "OS windowing", "call into **JS/DOM** (`EM_JS`, `val`) or draw to `<canvas>`"]
        ] },
        { type: "callout", variant: "note", text: "This guide targets the **current Emscripten toolchain (the 4.x line)** installed via `emsdk`. Emscripten tracks upstream LLVM/clang closely and moves fast, but the APIs shown here (`emcc`, `-s` link flags, `EMSCRIPTEN_KEEPALIVE`, Embind, `emscripten::val`, `emscripten_set_main_loop`) have been stable for years. Always `./emsdk install latest && ./emsdk activate latest` for the newest clang + bug fixes." },
        { type: "callout", variant: "tip", text: "Two mindsets to keep separate: **\"C++ as a compute engine\"** (JS owns the page and calls into WASM for the heavy lifting — codecs, sims, ML) vs **\"C++ owns the whole app\"** (an ImGui/Qt app that took over the canvas and only pokes JS for platform bits). Most successful web ports are the *former*." }
      ]
    },
    {
      id: "setup",
      title: "Setup: the emsdk toolchain",
      level: "core",
      body: [
        { type: "p", text: "You do not install \"Emscripten\" from a package manager — you clone **`emsdk`** (the SDK manager), which downloads a matched set of clang, the compiler runtime, Node, and the Emscripten front-end scripts. `emsdk_env` puts `emcc`/`em++` on your `PATH`." },
        { type: "code", lang: "bash", code: "# 1. clone the SDK manager\ngit clone https://github.com/emscripten-core/emsdk.git\ncd emsdk\n\n# 2. download + activate the latest toolchain (pins a version in .emscripten)\n./emsdk install latest\n./emsdk activate latest\n\n# 3. put emcc/em++/node on PATH for THIS shell (source it, don't run it)\nsource ./emsdk_env.sh        # Windows: emsdk_env.bat\n\n# verify\nemcc --version               # emcc (Emscripten gcc/clang-like replacement) 4.x.x\nem++ --version" },
        { type: "list", items: [
          "**`emcc`** compiles C (and links); **`em++`** is the C++ driver (links `libc++`, enables C++ defaults). Use `em++` for C++ projects.",
          "**Pin a version** for reproducible builds: `./emsdk install 4.0.0 && ./emsdk activate 4.0.0`. The active version lives in `~/.emscripten` / the emsdk dir.",
          "**Source `emsdk_env` every new shell** (or add it to your shell profile). Forgetting this is the #1 \"emcc: command not found\".",
          "**Docker alternative:** `emscripten/emsdk` official image — great for CI so you don't manage the SDK on the runner."
        ] },
        { type: "code", lang: "bash", code: "# smoke test: hello world -> a runnable .html you can open in a browser\ncat > hello.cpp <<'EOF'\n#include <cstdio>\nint main() { printf(\"Hello from C++/WASM!\\n\"); return 0; }\nEOF\n\nem++ hello.cpp -o hello.html   # emits hello.html + hello.js + hello.wasm\n\n# WASM can't be opened from file:// — serve over http\nemrun --no_browser --port 8080 .   # or: python3 -m http.server 8080" },
        { type: "callout", variant: "gotcha", text: "You **cannot** open the generated `.html` with `file://` — browsers block `WebAssembly.instantiateStreaming` and `fetch` of the `.wasm` over the file protocol (CORS/MIME). Always serve over HTTP: `emrun`, `python3 -m http.server`, or your dev server. \"failed to fetch\" / \"wrong MIME type\" on a local file is almost always this." }
      ]
    },
    {
      id: "compile-model",
      title: "The compile/link model & output modes",
      level: "core",
      body: [
        { type: "p", text: "`emcc` is a clang wrapper: normal compiler flags (`-O2`, `-I`, `-D`, `-std=c++20`, `-c`) work as expected. What's Emscripten-specific are the **`-s` settings** (link-time knobs, one per `KEY=VALUE`) and the **output extension**, which selects what glue you get." },
        { type: "table", headers: ["`-o` extension", "You get", "Use when"], rows: [
          ["`app.html`", "`.html` + `.js` + `.wasm` — a full runnable page", "quick demos, ImGui/SDL apps that own the page"],
          ["`app.js`", "`.js` glue + `app.wasm` — you write the HTML", "you control the page; load the `.js` yourself"],
          ["`app.mjs`", "an **ES module** + `.wasm`", "importing into a bundler (Vite/Rollup)"],
          ["`app.wasm`", "bare module, no glue (`-sSTANDALONE_WASM`)", "WASI-style / custom host / non-web runtime"]
        ] },
        { type: "code", lang: "bash", code: "# typical release build of a compute module for a JS frontend\nem++ src/*.cpp -o dist/engine.mjs \\\n  -std=c++20 -O3 -flto \\\n  -sMODULARIZE=1 -sEXPORT_ES6=1 \\\n  -sEXPORT_NAME=createEngine \\\n  -sALLOW_MEMORY_GROWTH=1 \\\n  -sENVIRONMENT=web \\\n  --bind                       # enable Embind\n\n# debug build (fast compile, checks on, symbols)\nem++ src/*.cpp -o build/debug.js \\\n  -O0 -g3 -gsource-map \\\n  -sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2" },
        { type: "list", items: [
          "**`-O0..-O3`, `-Os`, `-Oz`** — same meaning as clang; optimization also runs `wasm-opt` (Binaryen) on the module. `-O0` for dev (fast link, no minify), `-O3`/`-Os` for ship.",
          "**`-flto`** — link-time optimization; often meaningfully smaller/faster WASM. Pair with `-O2`/`-O3`.",
          "**`-sMODULARIZE=1`** — instead of a global `Module`, the glue exports a **factory function** returning a `Promise<Module>`. Essential for bundlers and for loading more than one module. Name it with `-sEXPORT_NAME=...`.",
          "**`-sEXPORT_ES6=1`** (with `MODULARIZE`) — emit an ES module (`import createEngine from './engine.mjs'`).",
          "**`-sENVIRONMENT=web`** — drop Node/worker shims from the glue for a smaller web-only bundle (values: `web`, `webview`, `worker`, `node`, or a comma list)."
        ] },
        { type: "callout", variant: "note", text: "`-s` flags can be written `-sNAME=VALUE`, `-sNAME` (implies `=1`), or `-s NAME=VALUE` (space). Values that are lists use JSON-ish syntax: `-sEXPORTED_FUNCTIONS=_add,_main` or the safer quoted form `-sEXPORTED_FUNCTIONS='[\"_add\",\"_main\"]'`. See the full list in `emcc --help` and `src/settings.js`." }
      ]
    },
    {
      id: "call-cpp-from-js",
      title: "Calling C++ from JS: exports, ccall & cwrap",
      level: "core",
      body: [
        { type: "p", text: "The lowest-level bridge: mark C++ functions for export and call them from JS. Two things you must handle — (1) stop the optimizer from stripping the function (dead-code elimination), and (2) stop C++ **name mangling** so JS can find the symbol by a stable name." },
        { type: "code", lang: "cpp", code: "#include <emscripten/emscripten.h>\n\n// extern \"C\"  -> no C++ name mangling (symbol is exactly \"add\", not \"_Z3addii\")\n// EMSCRIPTEN_KEEPALIVE -> keep it even if nothing internal calls it (no DCE)\nextern \"C\" {\n\nEMSCRIPTEN_KEEPALIVE\nint add(int a, int b) { return a + b; }\n\nEMSCRIPTEN_KEEPALIVE\ndouble scale(double x) { return x * 2.5; }\n\n}" },
        { type: "code", lang: "bash", code: "# either use KEEPALIVE (above) OR list exports explicitly (leading underscore!):\nem++ math.cpp -o math.js \\\n  -sEXPORTED_FUNCTIONS=_add,_scale,_malloc,_free \\\n  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap,HEAPF32" },
        { type: "code", lang: "js", code: "import createModule from \"./math.js\";\nconst Module = await createModule();       // wait for the runtime to be ready\n\n// ccall: one-shot call. signature strings describe args + return.\nconst sum = Module.ccall(\"add\", \"number\", [\"number\", \"number\"], [2, 3]); // 5\n\n// cwrap: build a reusable JS function once, call it many times (faster).\nconst add   = Module.cwrap(\"add\",   \"number\", [\"number\", \"number\"]);\nconst scale = Module.cwrap(\"scale\", \"number\", [\"number\"]);\nadd(10, 20);      // 30\nscale(4);         // 10\n\n// Or call the raw export directly (numbers only, fastest):\nModule._add(1, 2);   // note the leading underscore on the raw symbol" },
        { type: "table", headers: ["Type token (ccall/cwrap)", "Maps to"], rows: [
          ["`\"number\"`", "int / float / double / pointer (a JS number)"],
          ["`\"string\"`", "auto-marshals a JS string ↔ `char*` (UTF-8, temp-allocated)"],
          ["`\"array\"`", "a JS `Uint8Array` ↔ `uint8_t*` (temp-allocated)"],
          ["`\"boolean\"`", "JS bool ↔ int"],
          ["`null` (return)", "no return value (`void`)"]
        ] },
        { type: "callout", variant: "gotcha", text: "Forgetting `extern \"C\"` on a C++ function means the exported symbol is **mangled** (`_Z3addii`) and `ccall(\"add\", ...)` fails with \"function 'add' not found\". Either wrap in `extern \"C\"` for the raw/`ccall` path, or use **Embind** (next sections), which handles mangling *and* rich types for you." },
        { type: "callout", variant: "warn", text: "Anything you reference from JS at runtime that isn't obviously reachable — `malloc`, `free`, `ccall`, `cwrap`, `HEAPF32`, `UTF8ToString`, `stringToUTF8`, `FS` — must be listed in `-sEXPORTED_RUNTIME_METHODS` (and functions in `-sEXPORTED_FUNCTIONS`), or the optimizer drops them and you get `undefined is not a function`." }
      ]
    },
    {
      id: "memory",
      title: "The linear-memory model & HEAP views",
      level: "core",
      body: [
        { type: "p", text: "A WASM module has **one contiguous block of memory** — a JS `ArrayBuffer` called *linear memory*. C/C++ pointers are just **byte offsets** into it. The glue exposes typed-array views so JS can read/write that same memory: `HEAP8/HEAPU8` (bytes), `HEAP16/HEAPU16`, `HEAP32/HEAPU32`, `HEAPF32`, `HEAPF64`. \"Passing a buffer\" between JS and C++ = agreeing on a pointer (offset) + length into these views." },
        { type: "code", lang: "js", code: "// JS -> C++: allocate in the wasm heap, copy data in, call, read back, free.\nconst n = 1024;\nconst ptr = Module._malloc(n * Float32Array.BYTES_PER_ELEMENT); // returns an offset\n\n// write a Float32Array into linear memory at ptr\nconst input = new Float32Array(n).map((_, i) => Math.sin(i));\nModule.HEAPF32.set(input, ptr >> 2);   // >>2 because HEAPF32 is indexed in 4-byte words\n\nModule._process(ptr, n);               // C++ mutates the buffer in place\n\n// read the result back out (subarray is a live VIEW, copy if you keep it)\nconst out = Module.HEAPF32.subarray(ptr >> 2, (ptr >> 2) + n).slice();\nModule._free(ptr);                     // you allocated it -> you free it" },
        { type: "code", lang: "cpp", code: "#include <emscripten/emscripten.h>\nextern \"C\" EMSCRIPTEN_KEEPALIVE\nvoid process(float* data, int n) {\n    for (int i = 0; i < n; ++i) data[i] = data[i] * data[i]; // in place\n}" },
        { type: "list", items: [
          "**Fixed vs growable:** by default linear memory is a fixed size (`-sINITIAL_MEMORY`, default 16MB). Add **`-sALLOW_MEMORY_GROWTH=1`** to let it grow on demand (like `sbrk`). Without it, an over-large `malloc` returns 0 / aborts with `OOM`.",
          "**Strings:** C `char*` are UTF-8. Use `Module.UTF8ToString(ptr)` to read a C string into JS, and `Module.stringToUTF8(str, ptr, maxLen)` / `Module.lengthBytesUTF8(str)` to write one. `ccall`/`cwrap` `\"string\"` does this for you (temporary).",
          "**Ownership is manual across the seam:** if JS `_malloc`s, JS must `_free`. If C++ returns a pointer to something it owns, JS must call the C++ free function, not `_free`. Embind (`register_vector`, smart pointers) automates most of this.",
          "**Pointer math for views:** `HEAP8` indexes by byte, `HEAP32/HEAPF32` by 4 (`ptr >> 2`), `HEAPF64` by 8 (`ptr >> 3`). Off-by-shift bugs read garbage."
        ] },
        { type: "callout", variant: "warn", text: "**Memory growth invalidates HEAP views.** When linear memory grows, the underlying `ArrayBuffer` is replaced, so any `HEAPF32`/`HEAPU8` reference (and any `subarray` view) you cached becomes **detached and stale**. Rule: with `ALLOW_MEMORY_GROWTH`, always re-read `Module.HEAPF32` *after* any call that might allocate — never hold a view across a call into C++. This is one of the most common heisenbugs." }
      ]
    },
    {
      id: "call-js-from-cpp",
      title: "Calling JS & the DOM from C++: EM_JS, EM_ASM, val",
      level: "core",
      body: [
        { type: "p", text: "WASM can't touch the DOM directly — it goes through JS. Emscripten gives three ways to run JS *from* C++: **`EM_ASM`** (inline JS statements), **`EM_JS`** (declare a C-callable function whose body is JS), and **`emscripten::val`** (a C++ handle to any JS value, for real object graphs)." },
        { type: "code", lang: "cpp", code: "#include <emscripten/emscripten.h>\n\n// EM_JS: declare a C++ function implemented in JS. Args cross by value;\n// strings need UTF8ToString on the JS side (they arrive as pointers).\nEM_JS(void, set_title, (const char* text), {\n  document.title = UTF8ToString(text);\n});\n\nEM_JS(int, window_width, (), {\n  return window.innerWidth;\n});\n\nvoid update_ui() {\n  set_title(\"Rendered from C++\");\n  int w = window_width();\n\n  // EM_ASM: run inline JS immediately. $0,$1 = the passed args.\n  EM_ASM({ console.log('width is', $0); }, w);\n\n  // EM_ASM_INT / EM_ASM_DOUBLE / EM_ASM_PTR when you need a return value\n  int h = EM_ASM_INT({ return window.innerHeight; });\n}" },
        { type: "heading", text: "emscripten::val — a C++ handle to any JS value" },
        { type: "p", text: "For anything beyond a one-liner — walking objects, calling methods, `await`ing promises, building DOM nodes — use `emscripten::val`. It's a smart handle to a live JS value; property access, method calls, and type conversion all work from C++." },
        { type: "code", lang: "cpp", code: "#include <emscripten/val.h>\nusing emscripten::val;\n\nvoid make_button() {\n  val document = val::global(\"document\");\n  val btn = document.call<val>(\"createElement\", std::string(\"button\"));\n  btn.set(\"textContent\", std::string(\"Click me\"));\n  btn.set(\"onclick\", val::module_property(\"onClick\")); // an Embind-exposed fn\n  document.call<val>(\"querySelector\", std::string(\"#app\")).call<void>(\"appendChild\", btn);\n}\n\n// read values back into C++ with .as<T>()\nint width = val::global(\"window\")[\"innerWidth\"].as<int>();\nstd::string ua = val::global(\"navigator\")[\"userAgent\"].as<std::string>();" },
        { type: "callout", variant: "note", text: "`emscripten::val` requires Embind — build with `--bind` (a.k.a. `-lembind`). `EM_JS`/`EM_ASM` don't need it and are lighter, but they're strings of JS embedded in your C++ (no type checking). Prefer `EM_JS` for small fixed calls, `val` when you need to manipulate JS objects/promises from C++." },
        { type: "callout", variant: "gotcha", text: "In `EM_ASM`/`EM_JS`, a `const char*` argument arrives on the JS side as a **pointer (number)**, not a string. You must decode it: `UTF8ToString($0)` in `EM_ASM`, or `UTF8ToString(text)` in `EM_JS`. Passing it straight to `console.log` prints a meaningless integer." }
      ]
    },
    {
      id: "embind",
      title: "Embind: the ergonomic C++↔JS bridge",
      level: "core",
      body: [
        { type: "p", text: "**Embind** is the high-level binding layer: declare your C++ functions, classes, structs, and enums in an `EMSCRIPTEN_BINDINGS` block, and they show up on the JS `Module` as real objects with methods — no manual pointer marshalling, no `extern \"C\"`, no HEAP juggling. It's the closest thing to a \"proper API surface\" for a C++/WASM module. Build with `--bind`." },
        { type: "code", lang: "cpp", code: "#include <emscripten/bind.h>\n#include <string>\n#include <vector>\nusing namespace emscripten;\n\nstd::string greet(const std::string& name) { return \"Hi, \" + name; }\n\nstruct Point { float x, y; };              // a plain value object\n\nenum class Shape { Circle, Square, Tri };\n\nclass Counter {\npublic:\n  Counter(int start) : n_(start) {}\n  void inc() { ++n_; }\n  int value() const { return n_; }\nprivate:\n  int n_;\n};\n\nEMSCRIPTEN_BINDINGS(my_module) {\n  function(\"greet\", &greet);\n\n  // value_object: copied by value across the boundary (no lifetime worries)\n  value_object<Point>(\"Point\")\n    .field(\"x\", &Point::x)\n    .field(\"y\", &Point::y);\n\n  enum_<Shape>(\"Shape\")\n    .value(\"Circle\", Shape::Circle)\n    .value(\"Square\", Shape::Square)\n    .value(\"Tri\",    Shape::Tri);\n\n  // class_: a JS handle to a C++ object (must be .delete()d! see below)\n  class_<Counter>(\"Counter\")\n    .constructor<int>()\n    .function(\"inc\", &Counter::inc)\n    .function(\"value\", &Counter::value)\n    .property(\"count\", &Counter::value);   // read-only property\n\n  register_vector<int>(\"VectorInt\");        // std::vector<int> <-> JS\n}" },
        { type: "code", lang: "js", code: "const Module = await createModule();\n\nModule.greet(\"Ada\");                 // \"Hi, Ada\"\n\nconst p = { x: 1, y: 2 };            // value_object <-> plain JS object\n\nModule.Shape.Circle;                 // enum value\n\nconst c = new Module.Counter(10);    // constructs a C++ object\nc.inc();\nc.value();                           // 11\nc.count;                             // 11 (property)\nc.delete();                          // MANDATORY: free the C++ object\n\nconst v = new Module.VectorInt();\nv.push_back(1); v.push_back(2);\nv.size();                            // 2\nv.get(0);                            // 1\nv.delete();                          // vectors are objects too -> delete" },
        { type: "list", items: [
          "**`function()`** exposes free functions; **`class_<T>()`** exposes classes with `.constructor<Args...>()`, `.function()`, `.property()`, `.class_function()` (static).",
          "**`value_object<T>()`** / **`value_array<T>()`** copy small structs by value ↔ plain JS objects/arrays — no lifetime management, ideal for POD data crossing the seam.",
          "**`register_vector<T>()`, `register_map<K,V>()`** bridge STL containers; the JS side gets `.push_back/.get/.set/.size/.delete`.",
          "**Smart pointers:** `class_<T>().smart_ptr<std::shared_ptr<T>>(\"T\")` lets Embind manage `shared_ptr` lifetimes; return `std::shared_ptr<T>` from factory functions.",
          "**Overloads/optional args:** use `select_overload<Sig>(&fn)` to disambiguate; `.function(\"f\", &f, allow_raw_pointers())` when you must pass raw pointers."
        ] },
        { type: "callout", variant: "warn", text: "**Every `class_` object (and every `register_vector`/`register_map` handle) you create in JS holds a C++ object that the GC will NOT free.** You MUST call `obj.delete()` when done, or you leak the underlying C++ memory. `value_object`/`value_array` are copied by value and need no `.delete()`. For scoped cleanup wrap in try/finally, or use a helper that deletes after use." },
        { type: "callout", variant: "tip", text: "Using a deleted handle throws \"BindingError: instance already deleted\". In dev, `-sASSERTIONS` also warns about leaked handles at exit. A common pattern is a small JS `using`-style helper: `withObj(new Module.Counter(0), c => c.value())` that calls `.delete()` in a finally." }
      ]
    },
    {
      id: "main-loop",
      title: "The main loop: why you can't block",
      level: "core",
      body: [
        { type: "p", text: "The browser is single-threaded and event-driven: JS (and your WASM) run on the main thread, and **the page only paints when you return control to the browser**. A native-style `while(running){ render(); }` loop *never returns* — it freezes the tab, blocks rendering and input, and eventually triggers \"page unresponsive\". So an interactive C++ app must **yield each frame** instead of looping forever." },
        { type: "code", lang: "cpp", code: "#include <emscripten/emscripten.h>\n\nvoid one_frame(void* arg) {\n  auto* app = static_cast<App*>(arg);\n  app->update();\n  app->render();     // draw one frame, then RETURN -> browser paints + polls events\n}\n\nint main() {\n  App* app = new App();\n  // fps=0 -> use requestAnimationFrame (vsync-aligned, the right default)\n  // simulate_infinite_loop=1 -> main() 'returns' but the loop keeps running\n  emscripten_set_main_loop_arg(one_frame, app, 0, /*simulate_infinite_loop=*/1);\n  // code here is UNREACHABLE when simulate_infinite_loop=1\n}" },
        { type: "list", items: [
          "**`emscripten_set_main_loop(fn, fps, sim)`** — no user arg; **`emscripten_set_main_loop_arg(fn, arg, fps, sim)`** — passes `arg` each tick.",
          "**`fps = 0`** → drive with `requestAnimationFrame` (recommended: matches the display, pauses in background tabs). A positive `fps` uses `setTimeout` at that rate.",
          "**`simulate_infinite_loop = 1`** → Emscripten unwinds `main`'s stack but keeps calling your frame fn; locals in `main` after the call are gone (allocate app state on the heap).",
          "**Control it:** `emscripten_cancel_main_loop()` to stop, `emscripten_pause_main_loop()` / `emscripten_resume_main_loop()` to pause, `emscripten_set_main_loop_timing()` to change rate."
        ] },
        { type: "callout", variant: "gotcha", text: "Any long **synchronous** work — a busy `while`, `sleep`, a blocking network read, `std::this_thread::sleep_for` on the main thread — freezes the whole page. Move heavy compute to a pthread/Web Worker, split it across frames, or use **Asyncify** (`emscripten_sleep`, next-but-one section) so the call *appears* blocking to C++ while actually yielding to the browser." }
      ]
    },
    {
      id: "rendering",
      title: "Rendering: SDL2, OpenGL ES → WebGL & canvas",
      level: "core",
      body: [
        { type: "p", text: "For graphics, Emscripten ships **ports** of the usual native libraries that target the browser: **SDL2** (windowing, input, audio, 2D), **OpenGL ES 2.0/3.0** (mapped onto **WebGL**), GLFW, GLES headers. Your existing SDL/GL C++ code often compiles nearly unchanged — SDL's window becomes the page's `<canvas>`, and GL calls become WebGL calls." },
        { type: "code", lang: "cpp", code: "#include <SDL.h>\n#include <emscripten.h>\n\nSDL_Renderer* ren;\n\nvoid frame() {\n  SDL_SetRenderDrawColor(ren, 20, 20, 40, 255);\n  SDL_RenderClear(ren);\n  // ... draw ...\n  SDL_RenderPresent(ren);           // present one frame, then return\n}\n\nint main() {\n  SDL_Init(SDL_INIT_VIDEO);\n  SDL_Window* win;\n  SDL_CreateWindowAndRenderer(640, 480, 0, &win, &ren); // maps to the <canvas>\n  emscripten_set_main_loop(frame, 0, 1);\n  return 0;\n}" },
        { type: "code", lang: "bash", code: "# enable the SDL2 port with -sUSE_SDL=2 (Emscripten fetches/builds it)\nem++ game.cpp -o game.html \\\n  -sUSE_SDL=2 -sUSE_WEBGL2=1 -sFULL_ES3=1 \\\n  -sALLOW_MEMORY_GROWTH=1 -O2\n\n# other common ports: -sUSE_SDL_IMAGE=2 -sUSE_SDL_TTF=2 -sUSE_GLFW=3\n#   (older syntax; newer builds prefer --use-port=sdl2 etc.)" },
        { type: "list", items: [
          "**OpenGL ES → WebGL:** ES 2.0 ≈ WebGL 1, ES 3.0 ≈ WebGL 2 (`-sUSE_WEBGL2=1`, `-sFULL_ES3=1`). Desktop GL features not in WebGL won't map — port shaders to GLSL ES and avoid unsupported calls.",
          "**Raw HTML5 API:** `emscripten/html5.h` gives direct access to canvas/WebGL context creation, and to browser events — `emscripten_set_click_callback`, `emscripten_set_keydown_callback`, `emscripten_request_fullscreen`, `emscripten_set_canvas_element_size`, pointer-lock, gamepad, resize.",
          "**Which canvas:** Emscripten targets a canvas by CSS selector; the default is `#canvas`. Set `Module.canvas` in your glue/HTML, or pass a selector to the HTML5 API calls.",
          "**Audio/input:** SDL audio maps to Web Audio; keyboard/mouse/touch/gamepad come through SDL events or the html5.h callbacks."
        ] },
        { type: "code", lang: "cpp", code: "// html5.h: react to browser events directly (no SDL)\n#include <emscripten/html5.h>\n\nEM_BOOL on_key(int type, const EmscriptenKeyboardEvent* e, void* user) {\n  if (e->keyCode == 27) /* Esc */ stop();\n  return EM_TRUE; // consume the event\n}\nint main() {\n  emscripten_set_keydown_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, 1, on_key);\n}" },
        { type: "callout", variant: "note", text: "For newer/finer control there are `WebGPU` bindings (`emscripten/html5_webgpu.h`) and the modern `--use-port=` syntax replacing some `-sUSE_*` flags. But `-sUSE_SDL=2 + OpenGL ES` remains the well-trodden path for porting existing games/tools." }
      ]
    },
    {
      id: "imgui",
      title: "Dear ImGui: immediate-mode GUIs in the browser",
      level: "deep",
      body: [
        { type: "p", text: "The most popular way to build an *actual GUI* (buttons, sliders, windows, tables) in C++/WASM is **Dear ImGui** — a bloat-free **immediate-mode** GUI library. You rebuild the entire UI from code every frame; ImGui outputs vertex buffers that a backend (SDL2 + OpenGL ES/WebGL) draws to the canvas. It ships an official Emscripten example. This is the pragmatic answer to \"there's no C++ web UI framework.\"" },
        { type: "code", lang: "cpp", code: "// per-frame: describe the UI; no retained widget tree, no callbacks\nvoid frame() {\n  ImGui_ImplOpenGL3_NewFrame();\n  ImGui_ImplSDL2_NewFrame();\n  ImGui::NewFrame();\n\n  ImGui::Begin(\"Controls\");\n  static float amp = 1.0f;\n  ImGui::SliderFloat(\"Amplitude\", &amp, 0.0f, 10.0f);\n  if (ImGui::Button(\"Reset\")) amp = 1.0f;\n  ImGui::Text(\"FPS: %.1f\", ImGui::GetIO().Framerate);\n  ImGui::End();\n\n  ImGui::Render();\n  ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());\n  // ... swap / present, then return to the browser\n}" },
        { type: "list", items: [
          "**Immediate mode** = state lives in *your* variables, not in the widgets. The UI is a pure function of your data, rebuilt each frame — conceptually similar to how React re-renders, but you draw to a canvas, not the DOM.",
          "**Backends:** `imgui_impl_sdl2` + `imgui_impl_opengl3` compiled with `-sUSE_SDL=2 -sFULL_ES3=1 -sUSE_WEBGL2=1`. ImGui's repo has `examples/example_emscripten_opengl3` you can copy.",
          "**Not DOM:** ImGui draws pixels on a canvas — it is not accessible HTML, doesn't reflow with the page, and won't be indexed by search engines. Great for tools, dashboards, editors, debug overlays; wrong for content sites.",
          "**Alternatives in the same spirit:** Nuklear (single-header immediate-mode GUI), or roll your own on top of SDL/Canvas."
        ] },
        { type: "callout", variant: "tip", text: "ImGui + Emscripten is the go-to for porting a native C++ tool's UI to the web with minimal effort: the same ImGui code compiles natively *and* to WASM. You pay in bundle size and lose HTML accessibility, but you get a real, interactive GUI from pure C++." }
      ]
    },
    {
      id: "retained-ui",
      title: "Retained-mode options: Qt for WebAssembly & Asm-DOM",
      level: "deep",
      body: [
        { type: "p", text: "If you need *retained-mode* UI (a persistent widget tree you mutate, not a per-frame redraw), the two realistic C++ options are **Qt for WebAssembly** and **Asm-DOM** — very different beasts." },
        { type: "heading", text: "Qt for WebAssembly" },
        { type: "list", items: [
          "Compiles a **Qt** app (Qt Widgets or Qt Quick/QML) to WASM via Emscripten — the *entire Qt app* runs in the browser, rendering to a single `<canvas>` (it does NOT produce HTML/DOM).",
          "**Best for:** porting an existing desktop Qt application to run in-browser with little change. You get Qt's full widget set, layouts, signals/slots.",
          "**Costs:** large download (multi-MB WASM), a full canvas takeover (not accessible HTML, no CSS styling from the page), and threading needs COOP/COEP. Set up via the Qt online installer's \"WebAssembly\" target + `qmake`/CMake with the wasm kit.",
          "**Not** a way to build a web page — it's a way to run a Qt desktop app on the web platform."
        ] },
        { type: "heading", text: "Asm-DOM" },
        { type: "p", text: "**Asm-DOM** is a minimal **virtual-DOM** library for C++/WASM — the one option here that actually produces real HTML/DOM nodes (via a vdom diff, like a tiny React). You build a virtual node tree in C++ and it patches the real DOM. It's small and niche, and much less active than the JS ecosystem, but it's the closest to \"React, but in C++.\"" },
        { type: "code", lang: "cpp", code: "// Asm-DOM sketch: build a vnode tree in C++, patch the real DOM\n#include <asm-dom.hpp>\nusing namespace asmdom;\n\nVNode* view(int count) {\n  return h(\"div\",\n    Children{\n      h(\"button\", Data(Callbacks{{\"onclick\", onClick}}), std::string(\"+1\")),\n      h(\"span\", std::string(\"count: \" + std::to_string(count)))\n    });\n}\n// patch(oldVnode, view(count));  // diffs and updates the DOM" },
        { type: "callout", variant: "note", text: "Honest guidance: for genuine DOM-based web apps, C++ is rarely the right tool. If you want a compiled-language, retained-mode, DOM-rendering frontend, **Rust (Yew/Leptos)** and **Blazor (C#)** have far larger ecosystems. Use C++/WASM for compute or for porting existing canvas/native apps — reach for Qt when porting a Qt desktop app, Asm-DOM only for special cases." }
      ]
    },
    {
      id: "filesystem-async",
      title: "Virtual filesystem, fetch & async (Asyncify)",
      level: "core",
      body: [
        { type: "p", text: "C++ code that opens files (`fopen`, `std::ifstream`) still works — Emscripten provides a **virtual filesystem**. The default is **MEMFS** (in-memory, lost on reload). You can pre-bundle assets, or mount browser-backed filesystems. Networking and truly-async work needs one of `--preload-file`, `fetch`, or Asyncify." },
        { type: "code", lang: "bash", code: "# --preload-file bakes assets into a .data file loaded before main()\nem++ app.cpp -o app.html \\\n  --preload-file assets/            # now fopen(\"assets/level1.map\") just works\n\n# --embed-file inlines small files directly into the wasm/js (no separate .data)\nem++ app.cpp -o app.js --embed-file config.json" },
        { type: "list", items: [
          "**MEMFS** (default) — a RAM filesystem; writes vanish on reload. **IDBFS** persists to IndexedDB (call `FS.syncfs`). **NODEFS** maps the real disk (Node only). **WORKERFS** exposes `File`/`Blob` objects to a worker.",
          "**`--preload-file dir/`** packages files into `app.data`, fetched and mounted into MEMFS **before `main()`** runs. **`--embed-file`** inlines them (use only for small files — it bloats the module).",
          "**`-sFETCH`** enables the **Emscripten Fetch API** (`emscripten_fetch`) — `XHR`/`fetch` from C++ with sync (in a worker) or async modes, progress, and IndexedDB caching.",
          "**Async without threads:** enable **`-sASYNCIFY`** so a normally-blocking C++ call can suspend the WASM stack and yield to the browser — `emscripten_sleep(ms)`, awaiting a JS promise via `val::await`, or a synchronous-looking fetch that actually pauses without freezing the page."
        ] },
        { type: "code", lang: "cpp", code: "// ASYNCIFY: this LOOKS blocking to C++ but actually yields to the browser.\n// build with: -sASYNCIFY\n#include <emscripten.h>\n#include <emscripten/val.h>\n\nvoid demo() {\n  emscripten_sleep(1000);      // pauses 1s WITHOUT freezing the tab\n\n  // await a JS promise from synchronous-looking C++ (needs val + ASYNCIFY)\n  using emscripten::val;\n  val resp = val::global(\"fetch\")(std::string(\"/data.json\")).await();\n  val json = resp.call<val>(\"json\").await();\n}" },
        { type: "callout", variant: "gotcha", text: "**Asyncify has a real cost:** it instruments the module to save/restore the stack, which grows the binary and slows *every* call on the async path. Turn it on only when you need it, and narrow the set of unwound functions with `-sASYNCIFY_ONLY=[...]`/`ASYNCIFY_ADD` for large apps. For heavy concurrent compute, prefer **pthreads/Web Workers** over Asyncify." }
      ]
    },
    {
      id: "threads-simd",
      title: "Threads (pthreads), SharedArrayBuffer & SIMD",
      level: "deep",
      body: [
        { type: "p", text: "C++ threads *do* work in the browser: Emscripten implements **pthreads** (and `std::thread`) on top of **Web Workers**, with shared memory backed by a **`SharedArrayBuffer`**. The catch is a security requirement — `SharedArrayBuffer` is only available when the page is **cross-origin isolated**, which you enable with two HTTP response headers." },
        { type: "code", lang: "bash", code: "# build with pthreads + a worker pool\nem++ app.cpp -o app.js \\\n  -pthread -sPTHREAD_POOL_SIZE=8 \\\n  -sALLOW_MEMORY_GROWTH=1 \\\n  -msimd128                       # also enable WASM SIMD (portable 128-bit)" },
        { type: "code", lang: "text", code: "# the page (and the .wasm/.js/worker) MUST be served with BOTH headers,\n# or SharedArrayBuffer is undefined and thread creation fails:\nCross-Origin-Opener-Policy: same-origin\nCross-Origin-Embedder-Policy: require-corp" },
        { type: "list", items: [
          "**`-pthread`** enables threads (compile *and* link). **`-sPTHREAD_POOL_SIZE=N`** pre-spawns N workers so `std::thread`/`pthread_create` don't pay worker-startup latency mid-run.",
          "**COOP/COEP headers are mandatory** for `SharedArrayBuffer`. `emrun` sets them; in production configure your server/CDN. Cross-origin subresources then need `Cross-Origin-Resource-Policy` / CORS or they'll be blocked by COEP.",
          "**Blocking is OK on a worker thread** — a pthread can `sleep`/`join`/block without freezing the page, because it's not the main thread. Do heavy compute there and message results back.",
          "**SIMD:** `-msimd128` enables portable 128-bit WASM SIMD; use `<wasm_simd128.h>` intrinsics or let autovectorization use it. Big wins for DSP/image/ML kernels. **Relaxed SIMD** adds more with `-mrelaxed-simd`."
        ] },
        { type: "callout", variant: "warn", text: "The pthreads + COOP/COEP requirement is the single biggest deployment gotcha for threaded WASM. If threads \"work locally but not in production,\" your host is almost certainly not sending `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`. Verify `self.crossOriginIsolated === true` in the console. Some static hosts can't set headers — you may need a `_headers` file, edge worker, or a different host." }
      ]
    },
    {
      id: "bundler",
      title: "Integrating WASM into a JS/Vite frontend",
      level: "core",
      body: [
        { type: "p", text: "The common real-world shape: a normal JS app (React/Vue/vanilla, bundled by Vite) that loads a C++/WASM *compute module* on demand. Build the module as an **ES module factory** (`-sMODULARIZE=1 -sEXPORT_ES6=1`), then `import` and instantiate it like any async dependency." },
        { type: "code", lang: "bash", code: "# produce an ES-module factory + its .wasm, dropped into your src\nem++ src/engine.cpp -o web/src/wasm/engine.mjs \\\n  -O3 -flto --bind \\\n  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createEngine \\\n  -sALLOW_MEMORY_GROWTH=1 -sENVIRONMENT=web" },
        { type: "code", lang: "js", code: "// engine.js — a thin JS wrapper around the WASM module\nimport createEngine from \"./wasm/engine.mjs\";\n\nlet modPromise;\nexport function getEngine() {\n  // instantiate once, reuse the promise (WASM instantiation is expensive)\n  modPromise ??= createEngine({\n    // locateFile lets you point at a hashed/CDN .wasm path\n    locateFile: (path) => new URL(`./wasm/${path}`, import.meta.url).href,\n  });\n  return modPromise;\n}\n\n// usage in a component / worker\nconst engine = await getEngine();\nconst result = engine.process(inputArray);   // an Embind-exposed function" },
        { type: "list", items: [
          "**`locateFile`** — the glue must find its `.wasm` (and `.data`/worker) at runtime; override this hook when your bundler hashes or moves assets, or when serving from a CDN.",
          "**Vite:** the emitted `.mjs` imports fine; ensure the `.wasm` is treated as an asset (Vite handles `new URL('...', import.meta.url)` automatically). For pthreads you also need Vite's dev server to send COOP/COEP headers (`server.headers`).",
          "**Run it in a Web Worker** for anything long-running so instantiation and compute don't block the UI thread — post the `ArrayBuffer` in, post results out.",
          "**Instantiate once, reuse** — creating the module compiles the WASM and sets up the heap; cache the promise. Repeatedly re-instantiating is a common perf mistake."
        ] },
        { type: "callout", variant: "tip", text: "Keep a clean seam: expose a *small, typed* API from C++ via Embind (a handful of functions/classes taking `value_object`s and `TypedArray`s), and write a thin idiomatic JS/TS wrapper (`engine.ts`) around it. Your app code should never see `_malloc`, `HEAPF32`, or `.delete()` — hide the raw memory dance behind the wrapper." }
      ]
    },
    {
      id: "debugging",
      title: "Debugging: source maps, DWARF & sanitizers",
      level: "core",
      body: [
        { type: "p", text: "Debugging WASM has matured: with debug info you can set breakpoints and inspect C++ variables in Chrome DevTools (with the C/C++ DevTools Support extension), and Emscripten ports clang's sanitizers to the browser." },
        { type: "code", lang: "bash", code: "# dev build: full DWARF debug info + assertions, no optimization\nem++ app.cpp -o app.html \\\n  -O0 -g3 \\\n  -sASSERTIONS=2 \\\n  -sSAFE_HEAP=1 \\             # trap out-of-bounds / misaligned heap access\n  -sSTACK_OVERFLOW_CHECK=2 \\  # detect stack overflow (cheap, keep in dev)\n  -sDEMANGLE_SUPPORT=1        # readable C++ names in stack traces\n\n# sanitizers (great at catching UB the browser would silently corrupt over)\nem++ app.cpp -o app.js -fsanitize=address    # ASan: use-after-free, OOB\nem++ app.cpp -o app.js -fsanitize=undefined   # UBSan: UB, signed overflow, etc." },
        { type: "list", items: [
          "**`-g` / `-g3` / `-gsource-map`** — `-g3` embeds DWARF for source-level debugging in DevTools; `-gsource-map` emits a `.wasm.map` for line mapping. Strip for production (bigger downloads).",
          "**`-sASSERTIONS`** — enables Emscripten's runtime sanity checks (bad `ccall` args, wrong export usage, memory issues) with helpful messages. `=2` is the loudest. Turn OFF for release (it's slow).",
          "**`-sSAFE_HEAP=1`** catches out-of-bounds/unaligned linear-memory access; **`-fsanitize=address|undefined`** catch the classic C++ bugs — invaluable because native UB often *silently* corrupts WASM memory instead of crashing.",
          "**`console_error` clarity:** `abort()` / `RuntimeError: memory access out of bounds` traces are readable with `-g` + `DEMANGLE_SUPPORT`; without symbols you get raw `wasm-function[123]` frames.",
          "**`emrun --log_stdout`** / the browser console surface `printf`/`std::cout` — Emscripten routes stdio to the console by default."
        ] },
        { type: "callout", variant: "gotcha", text: "A release build (`-O2/-O3`, no `-g`, `ASSERTIONS=0`) that mysteriously misbehaves where the debug build is fine almost always means **undefined behavior** the optimizer exploited (uninitialized memory, OOB, signed overflow, ODR). Rebuild with `-fsanitize=address,undefined -O1 -g` and reproduce — WASM won't segfault to save you, it just corrupts the heap." }
      ]
    },
    {
      id: "alternatives",
      title: "Beyond Emscripten: raw clang, WASI & Cheerp",
      level: "deep",
      body: [
        { type: "p", text: "Emscripten is the default for *browser* C++/WASM, but it's not the only toolchain — and it's worth knowing what each alternative is actually for so you don't reach for the wrong one." },
        { type: "table", headers: ["Toolchain", "What it is", "When"], rows: [
          ["**Emscripten**", "clang + a big browser runtime (libc, SDL, GL, FS, Embind, pthreads)", "the default for anything running **in a browser**"],
          ["**Raw clang** `--target=wasm32`", "LLVM emits WASM with *no* runtime/glue", "custom hosts, tiny modules, you provide everything (rarely for the web)"],
          ["**WASI SDK**", "clang + a **WASI** libc (system interface for *outside* the browser)", "server-side/edge/CLI WASM (Wasmtime, Wasmer), **not** DOM/browser"],
          ["**Cheerp**", "a C++→WASM+JS compiler that can emit **JS** and interop closely with the DOM", "when you want tighter DOM/JS integration than Emscripten's model"]
        ] },
        { type: "list", items: [
          "**`clang --target=wasm32 -nostdlib`** gives you a bare `.wasm` with no printf, no malloc, no filesystem — you supply imports from JS by hand. Educational and used for tiny hand-optimized modules; not how you port a real C++ app to the web.",
          "**WASI** (`--target=wasm32-wasi`) targets *non-browser* runtimes with a POSIX-ish syscall interface. Great for portable server/plugin WASM; it does **not** give you DOM, canvas, or Web APIs.",
          "**Cheerp** (from Leaning Technologies) compiles C++ to a mix of WebAssembly and JavaScript and offers a more direct DOM/JS binding style; a commercial-friendly alternative for browser-first C++.",
          "**Not for C++:** `wasm-pack`/`wasm-bindgen` are the **Rust** toolchain — mentioned only because people conflate the ecosystems. For C++ the browser answer is Emscripten (Embind ≈ wasm-bindgen's role)."
        ] },
        { type: "callout", variant: "note", text: "Rule of thumb: **browser → Emscripten**; **server/edge/CLI → WASI SDK**; **need deep DOM/JS interop or a JS-output option → consider Cheerp**; **bare metal / learning → raw clang**. If you're reading this deck to put C++ on a web page, you want Emscripten." }
      ]
    },
    {
      id: "build-deploy",
      title: "Build size, MIME & deployment",
      level: "core",
      body: [
        { type: "p", text: "Two deployment realities dominate: **binary size** (WASM ships over the wire, so shrink it) and **serving correctly** (right MIME type, and COOP/COEP if you use threads)." },
        { type: "heading", text: "Shrinking the binary" },
        { type: "code", lang: "bash", code: "em++ app.cpp -o dist/app.mjs \\\n  -Oz \\                       # optimize for SIZE (over -Os / -O3)\n  -flto \\                     # link-time optimization\n  --closure 1 \\               # run Closure Compiler on the JS glue (smaller/faster)\n  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web \\\n  -sMALLOC=emmalloc \\         # smaller allocator than dlmalloc\n  -sFILESYSTEM=0 \\            # drop the FS runtime if you don't use files\n  --no-entry                  # library module with no main()\n\n# inspect what's big: build with -g2 then\n#   wasm-opt --metrics app.wasm   (Binaryen ships with emsdk)" },
        { type: "list", items: [
          "**`-Oz`** (size) or **`-Os`** — often the biggest single lever for download size; **`-flto`** compounds it. Trade a little runtime speed for a much smaller module.",
          "**`--closure 1`** minifies the JS glue with Google Closure Compiler; **`-sFILESYSTEM=0`**, **`-sMALLOC=emmalloc`**, disabling exceptions/RTTI (`-fno-exceptions -fno-rtti`) all trim runtime bloat.",
          "**Compression:** serve the `.wasm` with **gzip or Brotli** (`Content-Encoding: br`) — WASM compresses very well; this usually beats source-level tricks for transfer size.",
          "**Streaming compile:** keep the correct MIME so the browser can `instantiateStreaming` — it compiles *while downloading*."
        ] },
        { type: "heading", text: "Serving it" },
        { type: "code", lang: "text", code: "# 1) .wasm MUST be served as application/wasm, or streaming compile fails:\n#    \"Incorrect response MIME type. Expected 'application/wasm'.\"\n#    (nginx: add to mime.types)  application/wasm  wasm;\n\n# 2) if you use pthreads / SharedArrayBuffer, add on EVERY response:\nCross-Origin-Opener-Policy: same-origin\nCross-Origin-Embedder-Policy: require-corp\n\n# 3) enable compression\nContent-Encoding: br            # (or gzip)\nCache-Control: public, max-age=31536000, immutable   # hashed asset names" },
        { type: "callout", variant: "gotcha", text: "**Wrong MIME on `.wasm`** is the classic prod failure: the module still works via the non-streaming fallback but you lose streaming compilation, and some setups reject it outright. Ensure the server maps `.wasm` → `application/wasm`. Static hosts (S3, GitHub Pages, Netlify) each have their own way to set content type and headers — verify with `curl -I your.wasm`." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring ways C++/WASM bites, and the fix for each. Most are consequences of two facts: the browser must never be blocked, and JS/C++ share one raw block of memory." },
        { type: "list", items: [
          "**Blocking the main thread** — a `while(1)` / `sleep` / synchronous compute freezes the tab. Fix: use `emscripten_set_main_loop` (yield each frame), move work to a **pthread/worker**, or use **Asyncify** (`emscripten_sleep`, `val::await`).",
          "**Memory growth invalidates HEAP views** — after linear memory grows, cached `Module.HEAPF32`/`subarray` references are detached and read garbage. Fix: with `-sALLOW_MEMORY_GROWTH`, re-read `Module.HEAP*` *after* any call that may allocate; never hold a view across a C++ call.",
          "**Name mangling** — `ccall(\"foo\")` fails to find a C++ function. Fix: wrap in `extern \"C\"` (+ `EMSCRIPTEN_KEEPALIVE`), or use **Embind**, which handles mangling and types.",
          "**Forgetting `.delete()` on Embind objects** — `class_`/vector/map handles leak the underlying C++ object (JS GC won't free it). Fix: call `.delete()` when done; wrap in try/finally or a `withObj` helper. (`value_object`s are by-value; no delete.)",
          "**Dead-code elimination** — an exported function/runtime method comes back `undefined`. Fix: `EMSCRIPTEN_KEEPALIVE` or `-sEXPORTED_FUNCTIONS`, and `-sEXPORTED_RUNTIME_METHODS` for `ccall`/`cwrap`/`HEAPF32`/`UTF8ToString`/`FS`.",
          "**`file://` / wrong MIME / CORS** — \"failed to fetch the wasm\" or \"expected application/wasm.\" Fix: serve over HTTP, map `.wasm` → `application/wasm`, and allow CORS for cross-origin assets.",
          "**COOP/COEP missing** — threads work locally but `SharedArrayBuffer is not defined` in prod. Fix: send `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`; confirm `crossOriginIsolated === true`.",
          "**Large binary size** — multi-MB download. Fix: `-Oz -flto --closure 1`, drop unused runtime (`-sFILESYSTEM=0`, `-sMALLOC=emmalloc`, `-fno-exceptions -fno-rtti`), and serve **Brotli/gzip** compressed.",
          "**Passing a string prints a number** — in `EM_ASM`/`EM_JS`, `const char*` arrives as a pointer. Fix: `UTF8ToString(ptr)` on the JS side.",
          "**OOB / UB corrupts silently** — no segfault, just wrong results, often only in `-O3`. Fix: reproduce with `-fsanitize=address,undefined -O1 -g` and `-sASSERTIONS -sSAFE_HEAP` in dev.",
          "**Long startup / re-instantiation** — re-creating the module each call recompiles the WASM. Fix: with `MODULARIZE`, instantiate the factory **once** and cache the promise.",
          "**`Module` used before ready** — calling exports before the runtime initialized throws. Fix: `await createModule()` (or the `onRuntimeInitialized` callback in non-MODULARIZE builds) before calling anything."
        ] },
        { type: "callout", variant: "tip", text: "A healthy default workflow: **dev** with `-O0 -g3 -sASSERTIONS=2 -sSAFE_HEAP=1` and sanitizers on; **ship** with `-Oz -flto --closure 1`, no debug info, assertions off, Brotli compression, and a thin typed JS wrapper hiding all pointer/`.delete()` details from app code." }
      ]
    }
  ],

  packages: [
    { name: "emsdk", why: "the SDK manager — installs/activates a matched clang + Emscripten toolchain" },
    { name: "emcc / em++", why: "the C / C++ compiler front-ends that emit .wasm + .js glue" },
    { name: "Embind (--bind)", why: "declarative C++↔JS bindings: functions, classes, value_object, enums, STL" },
    { name: "emscripten::val", why: "C++ handle to any JS value — call methods, read props, await promises" },
    { name: "Binaryen (wasm-opt)", why: "WASM optimizer/analyzer bundled with emsdk (size, metrics, transforms)" },
    { name: "Closure Compiler (--closure)", why: "minifies the generated JS glue for smaller, faster loads" },
    { name: "SDL2 (-sUSE_SDL=2)", why: "windowing/input/audio/2D port — maps to <canvas> + Web Audio" },
    { name: "OpenGL ES / WebGL", why: "GLES 2/3 mapped onto WebGL 1/2 for GPU rendering to the canvas" },
    { name: "Dear ImGui", why: "immediate-mode C++ GUI (buttons/sliders/windows) drawn to the canvas" },
    { name: "GLFW (-sUSE_GLFW=3)", why: "alternative windowing/input port for GL apps" },
    { name: "Qt for WebAssembly", why: "run a full Qt Widgets/Quick desktop app in the browser (canvas)" },
    { name: "Asm-DOM", why: "minimal C++ virtual-DOM library — real DOM output, React-like" },
    { name: "Cheerp", why: "alternative C++→WASM+JS compiler with tighter DOM/JS interop" },
    { name: "WASI SDK", why: "clang + WASI libc for server/edge/CLI WASM (not browser/DOM)" },
    { name: "emrun", why: "dev server that serves with correct MIME + COOP/COEP and captures stdout" }
  ],

  gotchas: [
    "You **can't** open the output over `file://` — browsers block fetching/streaming the `.wasm`. Serve over HTTP (`emrun`, `python3 -m http.server`, your dev server).",
    "**Never block the main thread**: a `while(1)`/`sleep`/sync compute freezes the tab. Use `emscripten_set_main_loop` (yield per frame), a pthread/worker, or Asyncify (`emscripten_sleep`).",
    "**Memory growth detaches HEAP views**: with `-sALLOW_MEMORY_GROWTH`, cached `Module.HEAPF32`/`subarray` go stale after any allocation. Re-read `Module.HEAP*` after every call into C++.",
    "**Name mangling**: `ccall(\"foo\")` can't find a C++ symbol (`_Z3fooii`). Wrap in `extern \"C\"` + `EMSCRIPTEN_KEEPALIVE`, or use Embind.",
    "**Forgetting `.delete()`** on Embind `class_`/`register_vector` handles leaks the C++ object — JS GC won't free it. `value_object`s are by-value and need no delete.",
    "**Dead-code elimination** drops unreferenced exports: list them in `-sEXPORTED_FUNCTIONS` (leading `_`!) and helpers like `ccall`/`cwrap`/`HEAPF32`/`UTF8ToString`/`FS` in `-sEXPORTED_RUNTIME_METHODS`.",
    "**Pointer view shifts**: `HEAP8` indexes bytes, `HEAPF32` by `ptr >> 2`, `HEAPF64` by `ptr >> 3`. Wrong shift reads garbage.",
    "In `EM_ASM`/`EM_JS`, a `const char*` arg is a **pointer (number)** in JS — decode with `UTF8ToString(ptr)` or you print an integer.",
    "**COOP/COEP required for threads**: `SharedArrayBuffer` (hence pthreads) needs `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`. Verify `crossOriginIsolated === true`.",
    "**Wrong `.wasm` MIME** (`application/wasm`) breaks streaming compile and some hosts reject it — configure the server; check with `curl -I`.",
    "**UB silently corrupts** WASM memory instead of crashing — release-only bugs usually mean uninitialized/OOB/overflow. Rebuild with `-fsanitize=address,undefined -O1 -g -sSAFE_HEAP`.",
    "**Calling exports before the runtime is ready** throws — `await createModule()` (MODULARIZE) or wait for `onRuntimeInitialized`.",
    "**Re-instantiating the module** each call recompiles the WASM — instantiate the factory once and cache the promise.",
    "**Manual free across the seam**: if JS `_malloc`s, JS must `_free`; if C++ returns owned memory, call the C++ free fn, not `_free`. Hide this behind a JS wrapper.",
    "**Big bundle** surprises: exceptions/RTTI, the FS runtime, and dlmalloc add weight. Trim with `-Oz -flto --closure 1 -sFILESYSTEM=0 -sMALLOC=emmalloc -fno-exceptions -fno-rtti` and Brotli."
  ],

  flashcards: [
    { q: "Is there a dominant C++ web UI framework like React or Leptos?", a: "No. C++ has **no single retained-mode web UI framework**. The web story is: compile C++ to WebAssembly with **Emscripten**, then interop with JS/DOM or draw to `<canvas>`. UIs are usually immediate-mode (SDL/OpenGL, Dear ImGui); retained options (Qt for WASM, Asm-DOM) are heavier/niche." },
    { q: "How do you install the Emscripten toolchain?", a: "Clone `emsdk`, then `./emsdk install latest && ./emsdk activate latest`, then `source ./emsdk_env.sh` to put `emcc`/`em++` on PATH. Re-source it in each new shell." },
    { q: "What do the different `-o` output extensions produce?", a: "`.html` → full runnable page + glue + wasm; `.js` → glue + `.wasm` (you write the HTML); `.mjs` → ES module + wasm (bundlers); `.wasm` → bare module (`STANDALONE_WASM`)." },
    { q: "How do you call a plain C++ function from JS?", a: "Mark it `extern \"C\"` (no mangling) + `EMSCRIPTEN_KEEPALIVE` (no DCE), or list it in `-sEXPORTED_FUNCTIONS`. Then `Module.ccall(name, ret, argTypes, args)` or build a reusable `Module.cwrap(...)`; raw numeric calls via `Module._name`." },
    { q: "What is linear memory and what are HEAP views?", a: "A WASM module has one contiguous `ArrayBuffer` (linear memory); C++ pointers are byte offsets into it. `Module.HEAP8/HEAPU8/HEAP32/HEAPF32/HEAPF64` are typed-array views JS uses to read/write that shared memory." },
    { q: "Why can holding a HEAPF32 reference be a bug?", a: "With `-sALLOW_MEMORY_GROWTH`, growing memory swaps the underlying `ArrayBuffer`, detaching any cached view. Re-read `Module.HEAP*` after any call that might allocate; never hold a view across a call into C++." },
    { q: "How do you run JS/DOM code from C++?", a: "`EM_ASM({ ... })` (inline JS), `EM_JS(ret, name, (args), { ...JS... })` (a C-callable JS function), or `emscripten::val` (a C++ handle to JS values — property access, method calls, `.await()`). `val` needs `--bind`." },
    { q: "What is Embind and why use it?", a: "The ergonomic binding layer: `EMSCRIPTEN_BINDINGS` exposes C++ `function`s, `class_`es, `value_object`s, `enum_`s, and STL (`register_vector`) as real JS objects — no mangling, no manual HEAP marshalling. Build with `--bind`." },
    { q: "What must you remember with Embind `class_` objects in JS?", a: "Call `.delete()` when done — the JS GC does NOT free the underlying C++ object, so forgetting leaks it. `value_object`/`value_array` are copied by value and need no delete." },
    { q: "Why can't a C++/WASM app use a normal `while(1)` render loop?", a: "The browser only paints when you return control to it; an infinite loop freezes the tab. Use `emscripten_set_main_loop(fn, 0, 1)` — it calls your frame fn via requestAnimationFrame and yields each frame." },
    { q: "How do you render graphics from C++ in the browser?", a: "Use the SDL2 port (`-sUSE_SDL=2`) and/or OpenGL ES 2/3 (`-sUSE_WEBGL2 -sFULL_ES3`) mapped to WebGL, drawing to `<canvas>`. `emscripten/html5.h` gives raw canvas/WebGL/event access. Dear ImGui builds full GUIs on top." },
    { q: "How do you do async / blocking-looking calls without freezing?", a: "Enable `-sASYNCIFY`: `emscripten_sleep(ms)` and `val::...await()` suspend the WASM stack and yield to the browser, so C++ looks synchronous while the page stays responsive. It has size/speed cost — narrow it or prefer threads." },
    { q: "What do C++ threads require in the browser?", a: "`-pthread` (threads via Web Workers + `SharedArrayBuffer`) AND cross-origin isolation: serve with `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`. Check `crossOriginIsolated === true`." },
    { q: "How do you integrate a WASM module into a Vite/JS app?", a: "Build with `-sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=create...`; `import` the `.mjs` factory, `await` it once (cache the promise), use `locateFile` to point at the hashed/CDN `.wasm`. Run heavy work in a Web Worker." },
    { q: "Emscripten vs raw clang/wasm32 vs WASI SDK vs Cheerp?", a: "**Emscripten** = browser default (libc, SDL, GL, Embind). **Raw clang --target=wasm32** = bare module, no runtime. **WASI SDK** = server/edge/CLI WASM, no DOM. **Cheerp** = C++→WASM+JS with tighter DOM interop. (`wasm-pack` is Rust, not C++.)" },
    { q: "How do you shrink and correctly serve a WASM binary?", a: "Build `-Oz -flto --closure 1` (+ drop FS/exceptions/RTTI); serve `.wasm` as `application/wasm` with Brotli/gzip and long-cache hashed names; add COOP/COEP if you use threads." }
  ],

  cheatsheet: [
    { label: "Install toolchain", code: "./emsdk install latest && ./emsdk activate latest && source ./emsdk_env.sh" },
    { label: "Hello world", code: "em++ hello.cpp -o hello.html && emrun hello.html" },
    { label: "ES-module build", code: "em++ src.cpp -o app.mjs -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=create" },
    { label: "Export a C fn", code: "extern \"C\" EMSCRIPTEN_KEEPALIVE int add(int a,int b){return a+b;}" },
    { label: "Call from JS", code: "const add = Module.cwrap(\"add\",\"number\",[\"number\",\"number\"]);" },
    { label: "Alloc + write heap", code: "const p=Module._malloc(n*4); Module.HEAPF32.set(arr, p>>2);" },
    { label: "Run JS from C++", code: "EM_JS(void, log, (const char* s), { console.log(UTF8ToString(s)); });" },
    { label: "Embind function", code: "EMSCRIPTEN_BINDINGS(m){ function(\"greet\", &greet); }" },
    { label: "Embind class", code: "class_<T>(\"T\").constructor<int>().function(\"inc\", &T::inc);" },
    { label: "Free Embind object", code: "const c = new Module.Counter(0); /* ... */ c.delete();" },
    { label: "Main loop", code: "emscripten_set_main_loop(frame, 0 /*rAF*/, 1 /*sim inf*/);" },
    { label: "SDL2 + WebGL2", code: "em++ game.cpp -o game.html -sUSE_SDL=2 -sUSE_WEBGL2=1 -sFULL_ES3=1" },
    { label: "Preload assets", code: "em++ app.cpp -o app.html --preload-file assets/" },
    { label: "Async sleep", code: "emscripten_sleep(1000);   // build with -sASYNCIFY" },
    { label: "Threads", code: "em++ app.cpp -o app.js -pthread -sPTHREAD_POOL_SIZE=8" },
    { label: "Ship (small)", code: "em++ app.cpp -o app.mjs -Oz -flto --closure 1 -sMODULARIZE=1" }
  ]
});
