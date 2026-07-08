(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "odin",
  name: "Odin",
  language: "Odin",
  color: "#57a5e0",
  readMinutes: 31,
  tagline: "A **data-oriented systems language** — a joyful, explicit C alternative by Ginger Bill with no hidden control flow, an **allocator-first** memory model, built-in `matrix`/vector math, and first-class `vendor:` bindings (Raylib, Vulkan, SDL) for games & graphics.",

  sections: [
    {
      id: "overview",
      title: "Overview & philosophy",
      level: "core",
      body: [
        { type: "p", text: "**Odin** (odin-lang.org, created by **Ginger Bill** in 2016) is a general-purpose, statically-typed, compiled systems language built for **data-oriented programming**. Its whole design goal is *the joy of programming* — a simple, explicit, orthogonal language that lets you see exactly what the machine does. It compiles ahead-of-time via LLVM to a native binary; there is **no garbage collector, no runtime, no hidden allocations, and no hidden control flow**." },
        { type: "list", items: [
          "**Explicit over implicit:** no operator overloading, no exceptions, no RAII/destructors, no macros, no function-body magic. If memory is allocated, *you* can see where. If a proc can fail, it says so in its return values.",
          "**Data-oriented:** the language pushes you toward laying out data for the machine (structs of arrays, arenas, slices) rather than deep object graphs. Built-in fixed arrays, slices, dynamic arrays, `matrix`, SIMD, and array programming make this natural.",
          "**Allocator-first memory:** every allocating call takes an allocator (usually the implicit `context.allocator`). Swapping heap for an arena is a one-line change — this is Odin's signature idea and the reason its memory story is pleasant despite having no GC.",
          "**Batteries included:** a large, high-quality `core:` standard library and officially-maintained `vendor:` bindings ship with the compiler — no package manager needed to draw a window or talk to Vulkan.",
          "**For:** systems programming, game engines, graphics/3D, tools, compilers, and anywhere you'd otherwise reach for C but want a nicer language."
        ] },
        { type: "table", headers: ["Compared to", "How Odin relates"], rows: [
          ["**C**", "the spiritual target: a modern, safer, more expressive C replacement — but still manual memory, still close to the metal, trivially C-interoperable"],
          ["**Go**", "shares the `name := value` feel and multiple returns, but Odin has **no GC**, real generics via parapoly, and is aimed at systems/gamedev not servers"],
          ["**Zig**", "a close peer (both are C alternatives with explicit allocators); Odin favors a simpler, more orthogonal language and a bigger batteries-included stdlib, Zig favors comptime & error-union machinery"],
          ["**Jai**", "Jonathan Blow's (unreleased) language shaped Odin's data-oriented, gamedev-first sensibility; Odin is the shipped, open-source realization of much of that spirit"],
          ["**Rust**", "Rust enforces safety via the borrow checker; Odin trusts the programmer and buys ergonomics/compile-speed instead — manual memory, but with tools (`-vet`, sanitizers, arenas) to manage it"]
        ] },
        { type: "callout", variant: "note", text: "Odin is genuinely great for **games and graphics**: the `vendor:` collection bundles **Raylib**, **OpenGL**, **Vulkan**, **SDL2/SDL3**, **GLFW**, **stb** (image/truetype), **miniaudio**, **microui**, and more — all officially maintained and versioned with the compiler. Combined with built-in vectors, `matrix`, quaternions, swizzling and `core:math/linalg`, you can go from `odin run .` to a rendering window in minutes." },
        { type: "callout", variant: "tip", text: "The mental model: Odin is **C with the sharp edges filed and the nice modern parts added** — slices, `defer`, tagged unions, parapoly, real strings, `context` — without adopting a GC or a borrow checker. You still own memory; the language just makes ownership pleasant and visible." }
      ]
    },
    {
      id: "setup",
      title: "Setup, toolchain & hello world",
      level: "core",
      body: [
        { type: "p", text: "Odin has a **single compiler binary**, `odin`, that drives everything. There is no separate build tool or package manager — the compiler, `core:` stdlib, and `vendor:` bindings all ship together. Install a prebuilt release or build from source (you need an LLVM toolchain and a C compiler for linking)." },
        { type: "code", lang: "bash", code: "# macOS (Homebrew)\nbrew install odin\n\n# or grab a release / build from source\ngit clone https://github.com/odin-lang/Odin\ncd Odin && ./build_odin.sh release      # Windows: build.bat\n\nodin version                            # confirm install\nodin report                             # print environment / config for bug reports" },
        { type: "p", text: "An Odin program is a **package**: a directory of `.odin` files sharing the same `package` name. The executable package is named `main` and its entry point is a proc named `main`." },
        { type: "code", lang: "odin", code: "package main\n\nimport \"core:fmt\"\n\nmain :: proc() {\n\tfmt.println(\"Hello, Odin!\")\n\tfmt.printfln(\"1 + 2 = %d\", 1 + 2)   // printfln = printf + newline\n}" },
        { type: "code", lang: "bash", code: "# run the package in the current directory (build to a temp binary + execute)\nodin run .\n\n# run a single file as its own package\nodin run hello.odin -file\n\n# build a named executable, don't run it\nodin build . -out:app\n\n# type-check only — no codegen, fast feedback (great for editors/CI)\nodin check .\n\n# optimize for speed, and turn on the static analyzer\nodin build . -out:app -o:speed -vet\n\n# useful flags: -debug (debug info), -o:none|minimal|size|speed|aggressive,\n#   -define:KEY=VAL (#config), -collection:name=path (add an import collection)" },
        { type: "list", items: [
          "**`odin run <dir>`** builds the package in that directory to a temporary binary and runs it. `odin run <file> -file` treats one file as the whole package.",
          "**`odin build`** produces a persistent binary; **`odin check`** only type-checks (the fastest inner loop and what language servers use).",
          "**Collections** are named import roots: `core:` and `vendor:` are built in; add your own with `-collection:shared=./libs` then `import \"shared:util\"`.",
          "The **`ols`** language server (Odin Language Server) gives you completion, go-to-definition and diagnostics in VS Code / Neovim — pair it with `odin check` on save."
        ] },
        { type: "callout", variant: "note", text: "There is intentionally **no `odin fmt` config zoo and no external package manager** yet. Dependencies are usually vendored into your repo (git submodule or copied) and pulled in with a `-collection`. This keeps builds hermetic and fast; the tradeoff is a smaller, less centralized ecosystem than C/Rust (see the final section)." }
      ]
    },
    {
      id: "declarations",
      title: "Declarations: `::` (constant) vs `:=` (variable)",
      level: "core",
      body: [
        { type: "p", text: "Odin has **one uniform declaration syntax** and it is the language's signature. Read `name : type : value` (constant) and `name : type = value` (variable); the type is optional when it can be inferred, giving the two shorthands you'll use constantly: **`::`** for a compile-time constant and **`:=`** for a variable." },
        { type: "code", lang: "odin", code: "// the full form:  name : TYPE : VALUE   (constant)   /   name : TYPE = VALUE  (variable)\nMAX_HP : int : 100          // constant, explicit type\nMAX_HP2 :: 100              // constant, inferred type  (the everyday form)\nGREETING :: \"hi\"           // string constant\nPI :: 3.14159265           // untyped float constant — adapts to context\n\nhp : int = 100             // variable, explicit type\nhp2 := 100                 // variable, inferred type   (the everyday form)\nname := \"Link\"            // string variable\n\n// procs, types, and imports use the SAME `::` — they are just compile-time constants\nadd :: proc(a, b: int) -> int { return a + b }\nVec2 :: struct { x, y: f32 }\nColor :: enum { Red, Green, Blue }" },
        { type: "p", text: "Uninitialized declarations are **zero-valued by default** (no garbage, unlike C). You can opt out with `---` when you will fill the memory yourself and want to skip zeroing." },
        { type: "code", lang: "odin", code: "a: int            // = 0        (zero value)\nb: bool           // = false\nc: string         // = \"\"       (empty)\np: ^int           // = nil      (pointers zero to nil)\narr: [4]int       // = {0,0,0,0}\n\nfast: [1024]u8 = ---   // EXPLICITLY uninitialized — contents are garbage, skips zeroing\n\n// multiple assignment & declaration\nx, y := 1, 2\nx, y = y, x            // swap, no temp" },
        { type: "table", headers: ["Form", "Meaning"], rows: [
          ["`X :: value`", "**constant** — resolved at compile time, no storage, can't be reassigned or `&`-addressed"],
          ["`x := value`", "**variable** — runtime storage, mutable, inferred type"],
          ["`x: T`", "variable of type `T`, **zero-initialized**"],
          ["`x: T = ---`", "variable of type `T`, **left uninitialized** (garbage; you promise to fill it)"],
          ["`x, y := a, b`", "multiple declaration; `x, y = y, x` is a swap"]
        ] },
        { type: "callout", variant: "gotcha", text: "The **`::` vs `:=` mix-up** is the classic beginner trip. `HP :: 100` is a *constant* — you cannot take its address (`&HP`) or reassign it. `HP := 100` is a *variable*. If the compiler complains you \"cannot assign to a constant\" or \"cannot take the address of a constant\", you wrote `::` where you meant `:=`." }
      ]
    },
    {
      id: "basic-types",
      title: "Basic types & conversion",
      level: "core",
      body: [
        { type: "p", text: "Odin's built-in types are explicit about size and signedness. Integer sizes go from 8 to 128 bits; there is no implicit numeric conversion — you always cast intentionally, which kills a whole class of C bugs." },
        { type: "code", lang: "odin", code: "// integers: sized + platform\ni:  i8;  j: i16; k: i32; l: i64; m: i128\nu:  u8;  n: u16; o: u32; p: u64; q: u128\nptr_sized: int          // register-width signed (like C's ptrdiff_t/isize)\nun:        uint         // register-width unsigned\nby:        byte         // alias for u8\n\n// endian-specific integers exist for binary formats:  u32le, u32be, i16le ...\nmagic: u32be            // big-endian 32-bit, converts automatically on read/write\n\n// floats, bool, text\nf: f32; g: f64; h: f16\nflag: bool              // also b8, b16, b32, b64 sized booleans\nr: rune                 // a Unicode code point (i32)\ns: string               // length + ^u8 (NOT null-terminated); a VIEW, cheap to pass\ncs: cstring             // null-terminated C string, for foreign/C interop\n\n// dynamic-type & untyped-pointer escape hatches\nid:  typeid             // a runtime handle to a type\nanyv: any               // (data ^rawptr, id typeid) — a boxed value + its type\nraw: rawptr             // typeless pointer (C's void*)" },
        { type: "code", lang: "odin", code: "// conversion is ALWAYS explicit — T(value)\nx: i32 = 300\ny: u8  = u8(x)          // must cast; truncates (300 -> 44), no silent conversion\nz: f64 = f64(x)\n\n// string <-> bytes/runes\nbytes := transmute([]u8)my_string   // reinterpret bits (same layout)\nfor r in \"héllo\" {                  // ranging a string yields runes, decoded UTF-8\n\tfmt.println(r)\n}\n\n// compile-time configuration value: overridden with -define:TILE=64\nTILE_SIZE :: #config(TILE, 32)      // defaults to 32 if -define not passed" },
        { type: "callout", variant: "gotcha", text: "`string` is a **view** — a `{ptr, len}` pair, NOT null-terminated and NOT owning its bytes. It's cheap to copy/slice, but the underlying bytes must outlive it. Passing a `string` to C needs a `cstring` (null-terminated): use `strings.clone_to_cstring(s)` (allocates) or a literal `cstring`. Confusing `string` and `cstring` is a frequent interop bug." },
        { type: "callout", variant: "tip", text: "No implicit numeric conversion means `T(value)` everywhere — verbose but safe. Untyped constants (`PI :: 3.14`, `100`) are the exception: they adapt to whatever typed context they land in, so `f: f32 = PI` and `d: f64 = PI` both work without a cast." }
      ]
    },
    {
      id: "control-flow",
      title: "Control flow: if, the one `for`, switch, when, defer",
      level: "core",
      body: [
        { type: "p", text: "Odin keeps control flow tiny and explicit. There is **one loop keyword — `for`** — that covers every loop shape, a `switch` with **no implicit fallthrough**, a compile-time `when`, and `defer` for cleanup. Conditions have no parentheses; bodies always use braces (or `do` for a single statement)." },
        { type: "code", lang: "odin", code: "// if — optional init statement scoped to the if/else\nif n := len(items); n > 0 {\n\tfmt.println(\"have\", n)\n} else if n == 0 {\n\tfmt.println(\"empty\")\n}\nif ok do handle()          // `do` = single-statement body\n\n// for — the ONLY loop keyword, in every guise:\nfor i := 0; i < 10; i += 1 { }        // classic C-style\nfor i in 0..<10 { }                   // half-open range 0..9  (..< excludes end)\nfor i in 0..=10 { }                   // closed range 0..10    (..= includes end)\nfor x > 0 { x -= 1 }                  // `for cond` == while\nfor { if done() do break }            // `for` alone == infinite loop\n\n// ranging over collections gives value + index (by copy)\nfor v, i in slice { fmt.println(i, v) }\nfor k, v in my_map { }                // maps (unordered!)\nfor r, byte_index in \"héllo\" { }      // runes + byte offset\n\n// mutate elements: range gives COPIES — take &slice[i] to write back\nfor &v in slice { v.hp += 1 }         // `&v` binds a pointer to the element" },
        { type: "code", lang: "odin", code: "// switch — no fallthrough by default; cases can list multiple values\nswitch code {\ncase 200:          fmt.println(\"ok\")\ncase 301, 302:     fmt.println(\"redirect\")\ncase:              fmt.println(\"other\")   // default (empty case label)\n}\n\n// #partial switch on an enum: allow NOT covering every variant (no exhaustiveness warning)\n#partial switch color {\ncase .Red:   draw_red()\ncase .Green: draw_green()\n}\n\n// type switch on a union / any\nswitch v in value {\ncase int:    fmt.println(\"int\", v)\ncase string: fmt.println(\"str\", v)\n}\n\n// when — evaluated at COMPILE TIME; dead branches are never compiled\nwhen ODIN_OS == .Windows {\n\timport_windows_stuff()\n} else {\n\timport_posix_stuff()\n}" },
        { type: "code", lang: "odin", code: "// defer runs at scope exit, in LIFO order — the idiomatic cleanup tool\nf, err := os.open(\"data.bin\")\nif err != nil do return\ndefer os.close(f)          // guaranteed to run when the proc returns\n\n// labeled break/continue for nested loops\nsearch: for row in grid {\n\tfor cell in row {\n\t\tif cell == target do break search   // break the OUTER loop by label\n\t}\n}" },
        { type: "callout", variant: "tip", text: "`for &v in slice` (note the `&`) is how you mutate elements in place — plain `for v in slice` gives you a **copy** of each element, so writing to `v` changes nothing. This copy-vs-reference distinction is a very common source of \"my loop isn't updating anything\" bugs." }
      ]
    },
    {
      id: "procedures",
      title: "Procedures: returns, named results, defaults, overloading",
      level: "core",
      body: [
        { type: "p", text: "Procedures are declared with `proc` and are just constants (`name :: proc(...)`). They support **multiple return values**, **named results**, **default & named arguments**, and compile-time overloading via **`proc` groups**. Parameters are immutable inside the body (pass a pointer to mutate the caller's value)." },
        { type: "code", lang: "odin", code: "// multiple return values\ndivmod :: proc(a, b: int) -> (int, int) {\n\treturn a / b, a % b\n}\nq, r := divmod(17, 5)\n\n// named results — pre-declared, zero-initialized locals; a bare `return` returns them\nparse :: proc(s: string) -> (value: int, ok: bool) {\n\tif s == \"\" {\n\t\treturn                 // returns (0, false) — the zero values\n\t}\n\tvalue = 42\n\tok = true\n\treturn                     // returns the named results as-is\n}\n\n// default arguments + named arguments (call-site clarity)\nmake_window :: proc(w := 1280, h := 720, title := \"App\", vsync := true) {}\nmake_window(title = \"Game\", w = 1920, h = 1080)   // order-independent when named\n\n// parameters are immutable — to modify the caller's data, take a pointer\nreset :: proc(hp: ^int) { hp^ = 100 }             // `^` dereferences\nx := 5; reset(&x)                                 // x is now 100" },
        { type: "code", lang: "odin", code: "// #force_inline / #force_no_inline hint the optimizer at the call or the decl\n#force_inline hot_path()\n\n// procedure GROUPS = compile-time overloading: dispatch by argument types\nadd_ints :: proc(a, b: int) -> int { return a + b }\nadd_f64s :: proc(a, b: f64) -> f64 { return a + b }\nadd :: proc{add_ints, add_f64s}        // pick the matching overload at each call\n\nvalue := add(1, 2)        // -> add_ints\nvalue2 := add(1.5, 2.5)   // -> add_f64s\n\n// a proc is a first-class value; its type includes the calling convention\nhandler: proc(msg: string)     // default Odin calling convention (receives `context`)\ncb:      proc \"c\" (x: i32)    // C calling convention (NO implicit context — see foreign)" },
        { type: "callout", variant: "note", text: "Odin has **no method syntax and no `self`** — a struct doesn't own its procedures. You write free procedures that take the struct (often by pointer): `player_take_damage :: proc(p: ^Player, amount: int)`. This keeps data and code separate, which is the data-oriented point. `using` on a parameter can bring a struct's fields into scope for method-like ergonomics." },
        { type: "callout", variant: "tip", text: "Prefer **named results** for procs that return status: `-> (value: T, ok: bool)` documents the contract and lets a bare `return` yield sensible zero values on the error path. Combine with `or_return` (error-handling section) for clean propagation." }
      ]
    },
    {
      id: "structs",
      title: "Structs, enums, unions, bit_set & distinct",
      level: "core",
      body: [
        { type: "p", text: "Odin's aggregate types are designed for control over memory layout. `struct` groups fields; `using` composes/embeds; `enum` is a named integer; `union` is a **tagged union** (sum type); `bit_set` is a compact set over an enum; and `distinct` makes a strong type alias." },
        { type: "code", lang: "odin", code: "// struct — fields are laid out in declaration order (packable, predictable)\nEntity :: struct {\n\tpos:    [2]f32,\n\thealth: int,\n\tname:   string,\n}\n\n// #packed removes padding (for binary formats / GPU data); #align sets alignment\nFileHeader :: struct #packed {\n\tmagic:   u32,\n\tversion: u16,\n\tflags:   u16,\n}\n\n// `using` embeds a struct — its fields are promoted into the outer one\nPlayer :: struct {\n\tusing entity: Entity,   // p.pos, p.health, p.name all work directly\n\tscore:        int,\n}\np: Player\np.pos = {1, 2}          // reaches into the embedded Entity\n\n// anonymous struct literal & designated fields\nq := Entity{ pos = {3, 4}, health = 100, name = \"orc\" }" },
        { type: "code", lang: "odin", code: "// enum — a named integer type; backing type & values are settable\nDirection :: enum { North, East, South, West }        // 0,1,2,3\nStatus :: enum u8 { Idle = 1, Running, Done }         // 1,2,3 backed by u8\n\n// bit_set — a compact set of enum values, backed by the smallest integer\nDirections :: bit_set[Direction]\nmoving: Directions = {.North, .East}\nmoving |= {.South}                     // set union;  & intersection, - difference\nif .North in moving { }                // membership test\n\n// bit_field — precise bit-width packing (registers, protocols)\nRGBA :: bit_field u32 {\n\tr: u8  | 8,\n\tg: u8  | 8,\n\tb: u8  | 8,\n\ta: u8  | 8,\n}\n\n// union — a TAGGED union (sum type); the tag is tracked automatically\nJSON_Value :: union { i64, f64, bool, string }\nv: JSON_Value = \"hello\"\nswitch x in v {                        // type switch reads the tag safely\ncase i64:    fmt.println(\"int\", x)\ncase string: fmt.println(\"str\", x)\n}\n\n// distinct — a NEW type with the same representation (no implicit mixing)\nMeters :: distinct f32\nFeet   :: distinct f32\nd: Meters = 5\n// d + Feet(3)   // ERROR — can't mix distinct types; deliberate type safety" },
        { type: "table", headers: ["Type", "Use for"], rows: [
          ["`struct`", "records; `#packed` for binary/GPU layout, `using` for embedding/composition"],
          ["`enum`", "named integer constants; backing type & explicit values allowed"],
          ["`bit_set[Enum]`", "compact flag set (union `|` / intersection `&` / `in` membership)"],
          ["`bit_field`", "exact bit-width packing for hardware registers & wire protocols"],
          ["`union`", "tagged sum type; read safely with a **type switch** (`switch x in v`)"],
          ["`distinct T`", "strong alias — same bits, incompatible type (units, ids, handles)"]
        ] },
        { type: "callout", variant: "gotcha", text: "A `union` is `nil` when unset, and its variants are accessed via a **type switch** or `x, ok := v.(int)` type assertion — not by direct field access. Reading the wrong variant with `v.(int)` when it holds a string returns `ok = false` (or panics with the non-`ok` form). Tagged unions replace C's error-prone untagged `union` + manual tag." }
      ]
    },
    {
      id: "collections",
      title: "Arrays, slices, dynamic arrays & maps",
      level: "core",
      body: [
        { type: "p", text: "Odin distinguishes four sequence types by *ownership and growth*. Picking the right one is a core skill: fixed arrays are value types on the stack; slices are non-owning views; dynamic arrays own a growable buffer; maps are hash tables. The last two allocate and must be freed." },
        { type: "code", lang: "odin", code: "// [N]T — fixed-size array; a VALUE type (copied on assignment), lives on the stack\nfixed: [4]int = {1, 2, 3, 4}\nlen(fixed)                        // 4, known at compile time\ncopy := fixed                     // full copy — arrays are values\n\n// []T — slice: a {ptr, len} VIEW into an array/dynamic array; does NOT own memory\nview: []int = fixed[1:3]          // {2, 3} — aliases `fixed`, no allocation\nfmt.println(len(view))            // 2\n\n// [dynamic]T — growable, OWNS a heap buffer via context.allocator\nnums: [dynamic]int                // starts nil/empty\nappend(&nums, 10, 20, 30)         // grows as needed; reallocates when cap exceeded\nfmt.println(len(nums), cap(nums)) // length and capacity\nnums[0] = 99\ndelete(nums)                      // FREE the buffer (or defer delete(nums))\n\n// make / delete: explicitly allocate & free dynamic arrays, slices, maps\nbuf := make([]u8, 1024)           // heap slice of 1024 zeroed bytes\ndefer delete(buf)\nlist := make([dynamic]int, 0, 64) // len 0, cap 64 preallocated" },
        { type: "code", lang: "odin", code: "// map[K]V — hash table; also owns memory, also needs delete\nscores: map[string]int            // nil map\nscores[\"alice\"] = 10              // insert / update\nscores[\"bob\"]   = 7\ndefer delete(scores)\n\n// lookup returns (value, ok); use or_else for a default\nn, ok := scores[\"alice\"]          // (10, true)\nn2 := scores[\"nobody\"] or_else -1 // -1 when the key is absent\n\ndelete_key(&scores, \"bob\")        // remove one entry\nfor k, v in scores { }            // iteration order is UNSPECIFIED" },
        { type: "table", headers: ["Type", "Owns memory?", "Grows?", "Use when"], rows: [
          ["`[N]T` fixed array", "value (inline)", "no", "size known at compile time; small, on-stack, copied by value"],
          ["`[]T` slice", "**no** (a view)", "no", "passing/returning a window into existing data — the default parameter type"],
          ["`[dynamic]T`", "yes (heap)", "yes (`append`)", "a list you build up at runtime; must `delete`"],
          ["`map[K]V`", "yes (heap)", "yes", "keyed lookup; must `delete`; unordered iteration"]
        ] },
        { type: "callout", variant: "gotcha", text: "**`append` can reallocate** the dynamic array's backing buffer. Any slice or pointer you took into it *before* the append may now dangle (point at freed memory). Re-slice/re-index after appending, or reserve capacity up front with `make([dynamic]T, 0, n)` / `reserve(&arr, n)` if you must hold references across appends." },
        { type: "callout", variant: "tip", text: "Take **`[]T` slices** as your default proc parameter — they accept fixed arrays, dynamic arrays, and other slices uniformly without copying or committing to an allocation strategy. Return owning `[dynamic]T`/`map` only when the callee genuinely produces new data (and document who frees it)." }
      ]
    },
    {
      id: "pointers",
      title: "Pointers & manual memory (no GC)",
      level: "core",
      body: [
        { type: "p", text: "Odin has **no garbage collector**: you allocate and free explicitly. Pointers are written `^T` (a pointer to `T`); `&x` takes an address and `p^` dereferences. There is no null-by-default surprise — pointers zero to `nil`, and the language leans on `defer` + allocators (next sections) so manual memory stays manageable rather than painful." },
        { type: "code", lang: "odin", code: "// pointer types & operators\nx := 42\np: ^int = &x        // ^int is \"pointer to int\";  & takes the address\nfmt.println(p^)      // 42  — postfix ^ dereferences\np^ = 100             // writes through the pointer -> x == 100\n\n// nil is the zero value; check before dereferencing\nq: ^Entity           // = nil\nif q != nil { use(q^) }\n\n// new / free — a single heap value of type T\ne := new(Entity)     // allocates one zeroed Entity, returns ^Entity\ndefer free(e)        // release it\ne.health = 100       // auto-deref: e.health == e^.health for field access\n\n// make / delete — collections (slice, dynamic array, map)\nbuf := make([]f32, 256)\ndefer delete(buf)" },
        { type: "list", items: [
          "**`^T`** is a pointer type; **`&x`** takes an address; **`x^`** dereferences. Field access auto-dereferences: `e.health` works whether `e` is `Entity` or `^Entity`.",
          "**`new(T)`** allocates one `T` on the heap and returns `^T`; free it with **`free(ptr)`**. **`make(...)`** allocates a slice/dynamic-array/map; free it with **`delete(...)`**.",
          "Pointers **zero to `nil`** — but Odin does *not* insert null checks for you. Dereferencing a `nil` (or dangling) pointer is undefined behavior / a crash, just like C.",
          "**No pointer arithmetic on `^T`** by default; for raw byte math use `rawptr` + `mem.ptr_offset`/`mem.ptr_sub` or the `core:mem` helpers — explicit and rare.",
          "Every allocating builtin (`new`, `make`, `append`, `delete`, `free`) implicitly uses **`context.allocator`** — which is the hook the next two sections are all about."
        ] },
        { type: "callout", variant: "gotcha", text: "Every `new`/`make`/`append`-driven allocation you own must be paired with a `free`/`delete`, or you leak. The two robust patterns: (1) `defer delete(x)` right after you create it, so cleanup is impossible to forget; (2) allocate from `context.temp_allocator` and bulk-free the whole batch with `free_all(context.temp_allocator)` at a frame/request boundary. Turn on `-vet` and the address/leak sanitizers to catch mistakes." }
      ]
    },
    {
      id: "allocators",
      title: "The allocator system (a signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Odin's answer to \"no GC\" is that **allocation is a first-class, swappable interface**. Instead of a hidden global `malloc`, every allocating call routes through an `Allocator` value — by default `context.allocator`. You can replace it per scope with an **arena**, a **pool**, or a **temp** allocator, changing an entire subsystem's memory strategy without touching the code that allocates." },
        { type: "code", lang: "odin", code: "// context carries two allocators everywhere:\n//   context.allocator       -> general heap (default), for things that outlive the call\n//   context.temp_allocator  -> a per-frame scratch ARENA, bulk-freed all at once\n\n// scratch data via the temp allocator — no individual frees needed\ngreeting := fmt.tprintf(\"Hello, %s\", name)   // tprintf allocates in temp_allocator\nline := strings.concatenate({a, b}, context.temp_allocator)\n\n// ...at a natural boundary (end of frame / request), reclaim ALL of it in O(1):\nfree_all(context.temp_allocator)             // one call frees everything above" },
        { type: "code", lang: "odin", code: "import \"core:mem\"\nimport vmem \"core:mem/virtual\"\n\n// an ARENA: allocate freely, free everything at once — perfect for level/frame data\narena: vmem.Arena\n_ = vmem.arena_init_growing(&arena)\narena_alloc := vmem.arena_allocator(&arena)\n\n// route allocations to the arena for this scope by overriding context.allocator\n{\n\tcontext.allocator = arena_alloc\n\tlevel := load_level(\"world1\")   // every new/make/append inside uses the arena\n\t// ...use level...\n}\nvmem.arena_destroy(&arena)          // frees the whole arena in one shot\n\n// pass an allocator explicitly (procs that allocate SHOULD take one)\nnums := make([]int, 100, arena_alloc)   // last arg = which allocator to use\ndata := new(Entity, context.temp_allocator)" },
        { type: "list", items: [
          "**Why explicit allocators beat a hidden malloc/GC:** you match the memory strategy to the data lifetime. Per-frame junk goes in a temp arena (freed in O(1), zero fragmentation); long-lived data goes on the heap; a level's data lives in a level arena destroyed on unload. No GC pauses, no leak-hunting for scratch data.",
          "**`context.temp_allocator`** is a growing arena meant for short-lived scratch. Allocate freely, never free individually, then `free_all(context.temp_allocator)` at the boundary — the whole point is you *don't* track those frees.",
          "**Arena / pool / stack allocators** live in `core:mem` and `core:mem/virtual`. An arena bump-allocates and frees all at once; a pool hands out fixed-size blocks. Wrap any of them as an `Allocator` and drop it into `context.allocator`.",
          "**A well-behaved allocating proc takes an allocator parameter** (defaulting to `context.allocator`): `load :: proc(path: string, allocator := context.allocator) -> Data`. As of 2025+, `core:` increasingly *requires* you to pass one for procs that return allocated memory — making ownership explicit at the call site.",
          "**`context.allocator` vs an explicit arg:** overriding `context.allocator` re-routes *all* nested allocations in a scope (broad brush); passing an allocator argument targets *one* call (surgical). Use whichever matches the blast radius you want."
        ] },
        { type: "callout", variant: "gotcha", text: "Memory from `context.temp_allocator` is **invalidated by `free_all`** — anything you allocated there (a `tprintf` string, a temp slice) is dangling after the next `free_all`. Never store a temp-allocated value past the frame/request boundary; if you need it to live longer, allocate it from `context.allocator` (or clone it there)." },
        { type: "callout", variant: "tip", text: "The default startup `context` wires `context.allocator` to a general heap allocator and `context.temp_allocator` to a per-thread arena. In a game loop, call `free_all(context.temp_allocator)` once at the end of every frame and you get free, fast scratch memory with zero bookkeeping." }
      ]
    },
    {
      id: "context",
      title: "The implicit `context`",
      level: "core",
      body: [
        { type: "p", text: "Every proc using Odin's default calling convention receives a hidden parameter: **`context`** — a struct threaded automatically through the whole call tree. It carries the current allocator, temp allocator, logger, assertion handler, and a user pointer. This is how Odin gives you global-feeling services (allocation, logging) without actual mutable globals, and lets you override them for a scope." },
        { type: "code", lang: "odin", code: "// the context struct (simplified) — implicitly available inside any Odin proc:\n//   context.allocator          : Allocator     (used by new/make/append/delete)\n//   context.temp_allocator     : Allocator     (scratch arena, free_all-able)\n//   context.logger             : Logger        (core:log writes here)\n//   context.assertion_failure_proc            (what assert/panic call)\n//   context.random_generator                  (rand uses this)\n//   context.user_ptr / context.user_index     (your own per-scope payload)\n\nprocess :: proc() {\n\tlog.info(\"starting\")        // goes to context.logger\n\tbuf := make([]u8, 64)      // uses context.allocator\n\tdefer delete(buf)\n}" },
        { type: "code", lang: "odin", code: "// OVERRIDE context for a scope — changes propagate to everything you call\nrun_with_arena :: proc(arena_alloc: mem.Allocator) {\n\tcontext.allocator = arena_alloc     // this + all nested calls now allocate here\n\tbuild_scene()                       // build_scene allocates into the arena, unknowingly\n}\n\n// temporary swap using a saved copy (context is a value — copy & restore)\n{\n\told := context\n\tcontext.logger = my_file_logger\n\tnoisy_subsystem()                    // logs to the file logger only in this block\n\tcontext = old                        // restore (or just let scope end — it's block-scoped)\n}\n\n// pass data down without extra params via user_ptr\ncontext.user_ptr = &game_state\n// ...deep in a callback:\nstate := (^Game_State)(context.user_ptr)" },
        { type: "callout", variant: "gotcha", text: "Procs declared with a **foreign / C calling convention (`proc \"c\"`) do NOT receive a `context`**. If a C library calls back into an Odin `proc \"c\"` (a Vulkan/GLFW/Raylib callback), you must establish one yourself before allocating or logging: `context = runtime.default_context()` (import `base:runtime`) at the top of the callback — otherwise `context.allocator` is nil and you'll crash." },
        { type: "callout", variant: "tip", text: "`context` is Odin's cleanest idea for cross-cutting concerns: swap the allocator to profile or sandbox a subsystem's memory, swap the logger to capture a module's output, or stash per-request state in `user_ptr`. Because it's a plain value, overriding it is just assignment, and block scope restores it automatically." }
      ]
    },
    {
      id: "errors",
      title: "Error handling: multiple returns, `or_return`, `or_else`",
      level: "core",
      body: [
        { type: "p", text: "Odin has **no exceptions**. Errors are ordinary return values — typically a result plus an error `enum` (where the zero value means success). The language then adds terse operators — **`or_return`**, **`or_else`**, **`or_break`**, **`or_continue`** — so propagating and defaulting on errors stays clean without `try`/`catch` machinery." },
        { type: "code", lang: "odin", code: "// idiom: return (value, Error) where the enum's zero value (.None) means success\nParse_Error :: enum { None, Empty, Bad_Digit }\n\nparse_int :: proc(s: string) -> (n: int, err: Parse_Error) {\n\tif s == \"\" do return 0, .Empty\n\tfor r in s {\n\t\tif r < '0' || r > '9' do return 0, .Bad_Digit\n\t\tn = n*10 + int(r - '0')\n\t}\n\treturn n, .None\n}\n\n// or_return: if the last return value is NON-zero (an error), return it from THIS proc\nread_config :: proc(s: string) -> (cfg: Config, err: Parse_Error) {\n\twidth  := parse_int(s) or_return   // on error, `read_config` returns (cfg, that err)\n\theight := parse_int(s) or_return\n\treturn Config{width, height}, .None\n}" },
        { type: "code", lang: "odin", code: "// or_else: supply a default when the (value, ok) / optional path fails\nport := parse_int(env) or_else 8080        // 8080 if parse_int reports an error\nval  := my_map[key]    or_else default     // map miss -> default\n\n// or_break / or_continue: same idea, but for loops\nfor line in lines {\n\tn := parse_int(line) or_continue        // skip lines that don't parse\n\ttotal += n\n}\n\n// Maybe(T) — an optional: holds a T or nil (a union with nil), from core:builtin\nfind :: proc(id: int) -> Maybe(Entity) {\n\tif id < 0 do return nil\n\treturn some_entity\n}\nif e, ok := find(3).?; ok {                 // .? unwraps a Maybe into (value, ok)\n\tuse(e)\n}" },
        { type: "table", headers: ["Construct", "Does what"], rows: [
          ["`x or_return`", "if `x`'s trailing error value is non-zero, return it (and named results) from the current proc"],
          ["`x or_else def`", "evaluate `x`; if it failed/absent, use `def` instead — great for map/optional defaults"],
          ["`x or_continue` / `x or_break`", "on error, `continue`/`break` the enclosing loop instead of returning"],
          ["`Maybe(T)`", "optional value — a union of `T` and `nil`; unwrap with `.?` into `(value, ok)`"],
          ["`v.(T)` / `v.(T)?`", "type assertion on a `union`/`any`; the `?` form propagates like `or_return`"]
        ] },
        { type: "callout", variant: "note", text: "Compared to **Go's** `if err != nil { return err }` boilerplate on every call, `or_return` collapses the common propagate-upward case to a single suffix while keeping errors as explicit values. It works because the *last* return value carries the error and Odin treats its **zero value as success** — so design your error enums with `.None = 0`." },
        { type: "callout", variant: "gotcha", text: "`or_return` propagates whatever error type the callee returns, so the enclosing proc's trailing return type must be **compatible** with it. Mixing several error enums across layers is a real pain point — many codebases define one project-wide `Error` union (or convert at boundaries) so `or_return` chains cleanly. There's no automatic error wrapping." }
      ]
    },
    {
      id: "generics",
      title: "Parametric polymorphism (generics)",
      level: "core",
      body: [
        { type: "p", text: "Odin's generics are **parametric polymorphism** driven by compile-time parameters: `$T` is a **type parameter**, `$N` is a **constant value parameter**, and a `where` clause constrains them. Everything is monomorphized (a specialized copy per instantiation) — no runtime dispatch, no boxing." },
        { type: "code", lang: "odin", code: "// $T — a type parameter inferred from the argument at each call site\nmax :: proc(a, b: $T) -> T {\n\treturn a if a > b else b\n}\nmax(3, 9)          // T = int\nmax(1.5, 0.2)      // T = f64\n\n// constrain with `where` (uses core:intrinsics predicates)\nimport \"base:intrinsics\"\nsum :: proc(xs: []$T) -> T where intrinsics.type_is_numeric(T) {\n\ttotal: T\n\tfor x in xs do total += x\n\treturn total\n}\n\n// $N — a compile-time CONSTANT parameter (e.g. an array length)\ndot :: proc(a, b: [$N]f32) -> f32 {\n\tr: f32\n\tfor i in 0..<N do r += a[i] * b[i]   // N is a constant, loop unrolls well\n\treturn r\n}\ndot([3]f32{1,2,3}, [3]f32{4,5,6})       // N = 3, T fixed to f32" },
        { type: "code", lang: "odin", code: "// generic STRUCTS: parameters go on the type\nStack :: struct($T: typeid) {\n\tdata: [dynamic]T,\n}\n\npush :: proc(s: ^Stack($T), value: T) {   // $T re-inferred from the struct arg\n\tappend(&s.data, value)\n}\npop :: proc(s: ^Stack($T)) -> (T, bool) {\n\tif len(s.data) == 0 do return {}, false\n\tv := s.data[len(s.data)-1]\n\tpop(&s.data)\n\treturn v, true\n}\n\ns: Stack(int)\npush(&s, 10); push(&s, 20)\nv, ok := pop(&s)                            // (20, true)\n\n// specialization: `$C: typeid/[]$E` patterns let you match & destructure type shapes\nfirst :: proc(list: $C/[]$E) -> E { return list[0] }   // C is any slice; E its element" },
        { type: "callout", variant: "note", text: "Because instantiations are **monomorphized** at compile time, generic Odin is as fast as hand-written specialized code — but each unique type combination compiles a fresh copy (code-size tradeoff, like C++ templates). There is no interface/vtable-style runtime polymorphism built in; for that you use tagged `union`s or a manual vtable struct of `proc` pointers." },
        { type: "callout", variant: "tip", text: "`$` marks *what's being made polymorphic*: `$T` on a type = infer this type; `$N` on a value = this is a compile-time constant. Read `proc(s: ^Stack($T), v: T)` as \"infer `T` from the stack, and `v` must be that same `T`\". Add a `where` clause only when you need to reject invalid instantiations with a clear error." }
      ]
    },
    {
      id: "packages",
      title: "Packages & the core / vendor libraries",
      level: "core",
      body: [
        { type: "p", text: "A **package** is a directory of `.odin` files sharing a `package` declaration; you `import` other packages by path within a **collection**. `core:` is the standard library, `vendor:` is the officially-maintained bindings collection, and you can register your own collections with `-collection:name=path`." },
        { type: "code", lang: "odin", code: "package game\n\nimport \"core:fmt\"                 // import by collection:path; default name = last segment\nimport \"core:strings\"\nimport \"core:math/linalg\"        // nested path; referenced as `linalg.*`\nimport rl \"vendor:raylib\"        // aliased import — reference as `rl.*`\nimport \"shared:util\"             // your own collection (-collection:shared=./libs)\n\nmain :: proc() {\n\tfmt.println(strings.to_upper(\"hi\"))\n\tv := linalg.Vector3f32{1, 0, 0}\n\t_ = rl.Vector2{10, 20}\n}\n\n// identifiers are package-private unless the file/package exposes them;\n// @(private) restricts a decl to its file/package, @(private=\"file\") to one file" },
        { type: "table", headers: ["Package", "What you get"], rows: [
          ["`core:fmt`", "`println` / `printf` / `printfln`; `tprintf`/`aprintf` (temp/heap-allocating) formatting"],
          ["`core:strings`", "`Builder`, `split`, `contains`, `to_upper`, `clone`, `clone_to_cstring`, trimming/joining"],
          ["`core:os` / `core:os/os2`", "files, args (`os.args`), env, `read_entire_file`, `exit`; `os2` is the newer cross-platform API"],
          ["`core:mem` / `core:mem/virtual`", "allocators, arenas, `copy`, `set`, pointer helpers; virtual-memory arenas"],
          ["`core:math` / `core:math/linalg`", "trig/constants; vectors, matrices, quaternions, transforms, `dot`/`cross`/`normalize`"],
          ["`core:slice` / `core:sort`", "`sort`, `reverse`, `contains`, `map`, `filter`, binary search over slices"],
          ["`core:thread` / `core:sync`", "OS threads, thread pools, mutexes, atomics, wait groups"],
          ["`core:log` / `core:testing`", "leveled logging (via `context.logger`); the `@(test)` unit-test framework (`odin test`)"]
        ] },
        { type: "callout", variant: "note", text: "The **`vendor:`** collection is Odin's killer convenience: `vendor:raylib`, `vendor:OpenGL`, `vendor:vulkan`, `vendor:sdl2`, `vendor:sdl3`, `vendor:glfw`, `vendor:stb` (image/truetype/rectpack), `vendor:miniaudio`, `vendor:microui`, `vendor:cgltf` and more ship *with the compiler*, pre-bound and version-matched. No fetching, no build scripts — `import` and go." },
        { type: "callout", variant: "tip", text: "For string building, use `strings.Builder` (grows a buffer, then `strings.to_string(b)`), and prefer `fmt.tprintf` over `fmt.aprintf` for throwaway strings so the temp allocator reclaims them — reach for the heap-allocating (`a*`) variants only when the string must outlive the frame." }
      ]
    },
    {
      id: "math",
      title: "SIMD, matrices & game math",
      level: "core",
      body: [
        { type: "p", text: "This is where Odin shines for graphics. Small fixed arrays double as **math vectors** with component-wise operators and **swizzling** (`v.xyz`); `matrix[R,C]T` is a **built-in** first-class type with real linear-algebra operators; `complex`/`quaternion` are built-in scalar types; and `core:math/linalg` supplies the transform toolbox. There's also true SIMD via `#simd`." },
        { type: "code", lang: "odin", code: "// array programming: operators apply component-wise to [N]T\na := [3]f32{1, 2, 3}\nb := [3]f32{4, 5, 6}\nc := a + b            // {5, 7, 9}   — elementwise\nd := a * 2            // {2, 4, 6}   — scalar broadcast\n\n// swizzling: reorder/select components like a shader\nv := [4]f32{1, 2, 3, 4}\nfmt.println(v.xyz)    // {1, 2, 3}\nfmt.println(v.xy)     // {1, 2}\nfmt.println(v.rgba)   // color-style names alias xyzw\nv.xy = {9, 8}         // assign through a swizzle\n\n// matrix is a BUILT-IN type with proper linear algebra semantics\nm: matrix[4, 4]f32 = 1   // scalar 1 -> identity matrix\np := [4]f32{1, 0, 0, 1}\nr := m * p               // matrix * vector (real matmul, not elementwise)\nmm := m * m              // matrix * matrix" },
        { type: "code", lang: "odin", code: "import \"core:math/linalg\"\n\n// linalg: vectors, matrices, transforms, and helpers for 3D\npos   := linalg.Vector3f32{0, 1, 0}\nfwd   := linalg.normalize(linalg.Vector3f32{1, 0, 1})\nright := linalg.cross(fwd, {0, 1, 0})\ndist  := linalg.length(pos)\n\n// build transform matrices and compose them\ntranslate := linalg.matrix4_translate_f32({10, 0, 0})\nrotate    := linalg.matrix4_rotate_f32(math.PI, {0, 1, 0})\nproj      := linalg.matrix4_perspective_f32(fovy = 1.0, aspect = 16.0/9, near = 0.1, far = 100)\nmvp       := proj * translate * rotate     // standard MVP composition\n\n// built-in complex & quaternion scalar types\nz  := complex(1, 2)                        // complex128; real(z), imag(z), conj(z)\nq  := linalg.quaternion_angle_axis_f32(math.PI/2, {0, 1, 0})   // rotation quaternion\n\n// explicit SIMD when you want it: a hardware vector type + core:simd intrinsics\nlanes: #simd[4]f32 = {1, 2, 3, 4}\ndoubled := lanes + lanes                   // one vector instruction" },
        { type: "callout", variant: "note", text: "Odin's `matrix` type maps to efficient code and, unlike bolting a math library onto C, is understood by the compiler — `m * v` is a real matrix-vector product, transposition/inverse live in `linalg`, and small vectors get SIMD treatment. This built-in numeric fluency is a big reason Odin feels tailor-made for renderers and simulations." },
        { type: "callout", variant: "tip", text: "Vector/matrix element type matters for graphics APIs: use the `_f32` linalg variants (and `[N]f32`) so your data matches what OpenGL/Vulkan expect, and remember column-major vs row-major conventions when you hand a `matrix[4,4]f32` to a shader uniform." }
      ]
    },
    {
      id: "example",
      title: "A complete example: a Raylib window",
      level: "core",
      body: [
        { type: "p", text: "This ties it together: a full, runnable program using `vendor:raylib` that opens a window and draws a rotating square. It shows the package/entry point, a `struct`, the game loop (`for`), swizzled vector math, and Raylib's immediate-mode drawing — no manual allocation needed here because Raylib owns the window and we use stack data." },
        { type: "code", lang: "odin", code: "package main\n\nimport rl \"vendor:raylib\"\nimport \"core:math\"\n\nGame :: struct {\n\tangle:  f32,\n\tcenter: rl.Vector2,\n}\n\nmain :: proc() {\n\trl.InitWindow(800, 600, \"Odin + Raylib\")\n\tdefer rl.CloseWindow()          // guaranteed teardown at scope exit\n\trl.SetTargetFPS(60)\n\n\tgame := Game{ center = {400, 300} }\n\n\t// the game loop: run until the window's close button / ESC\n\tfor !rl.WindowShouldClose() {\n\t\t// --- update ---\n\t\tgame.angle += 90 * rl.GetFrameTime()   // 90 deg/sec, frame-rate independent\n\n\t\t// --- draw ---\n\t\trl.BeginDrawing()\n\t\tdefer rl.EndDrawing()                  // deferred within the loop body\n\n\t\trl.ClearBackground(rl.RAYWHITE)\n\t\trl.DrawText(\"Hello from Odin!\", 20, 20, 20, rl.DARKGRAY)\n\n\t\t// a rotating rectangle around its center\n\t\trl.DrawRectanglePro(\n\t\t\trl.Rectangle{ game.center.x, game.center.y, 120, 120 },\n\t\t\trl.Vector2{60, 60},   // origin (rotate about the middle)\n\t\t\tgame.angle,\n\t\t\trl.MAROON,\n\t\t)\n\t}\n}" },
        { type: "code", lang: "bash", code: "# no dependency install needed — raylib ships in the vendor collection\nodin run . -o:speed        # build (optimized) and launch the window\n# ship it:  odin build . -out:game -o:speed" },
        { type: "list", items: [
          "**`import rl \"vendor:raylib\"`** pulls in the bundled, version-matched Raylib bindings — zero setup.",
          "**`defer rl.CloseWindow()`** / **`defer rl.EndDrawing()`** show `defer` handling both program-level and per-iteration cleanup cleanly.",
          "**`rl.GetFrameTime()`** returns delta-time so motion is frame-rate independent — the loop is Odin's single `for` used as an infinite loop with a condition.",
          "**`rl.Vector2` / `rl.Rectangle`** interop seamlessly with Odin's `[2]f32`-style math; `game.center.x` is ordinary field access on a struct value on the stack."
        ] },
        { type: "callout", variant: "tip", text: "This is the fastest way to *feel* Odin's gamedev ergonomics: one file, one `odin run .`, a window on screen. From here you'd add an entity `[dynamic]Entity` (with `defer delete`), a per-frame `free_all(context.temp_allocator)`, and swap in `vendor:vulkan`/`vendor:OpenGL` when you outgrow Raylib's immediate mode." }
      ]
    },
    {
      id: "metaprogramming",
      title: "Metaprogramming & directives (deep)",
      level: "deep",
      body: [
        { type: "p", text: "Odin deliberately has **no macros**. Its \"metaprogramming\" is a curated set of compile-time features: `when` for conditional compilation, `#`-directives that run at compile time, attributes for codegen/linkage control, and rich compile-time constants. The philosophy: give a few powerful, legible primitives instead of an unbounded macro system that hides code." },
        { type: "code", lang: "odin", code: "// when: compile-time branching on constants — dead branches never compile\nwhen ODIN_OS == .Windows {\n\tPATH_SEP :: '\\\\'\n} else {\n\tPATH_SEP :: '/'\n}\nwhen ODIN_DEBUG {\n\tfmt.println(\"debug build\")   // stripped entirely in release\n}\n\n// #config: read a compile-time value, overridable with -define:KEY=VAL\nMAX_ENTITIES :: #config(MAX_ENTITIES, 1024)   // odin build . -define:MAX_ENTITIES=4096\n\n// #assert: compile-time assertion (fails the build if false)\n#assert(size_of(Header) == 8)\n#assert(MAX_ENTITIES > 0)\n\n// #load: embed a file's bytes into the binary at compile time\nSHADER :: #load(\"shader.glsl\", string)   // -> the file's contents as a string constant\nICON   := #load(\"icon.png\")               // -> []u8\n\n// intrinsics & type queries drive generic constraints (base:intrinsics)\nimport \"base:intrinsics\"\nis_num :: intrinsics.type_is_numeric(f32)   // compile-time bool" },
        { type: "code", lang: "odin", code: "// attributes (@(...)) control codegen, linkage, visibility, and tests\n@(private)                 // package-private (or @(private=\"file\"))\ninternal_helper :: proc() {}\n\n@(require_results)         // caller MUST use the return value (compile error otherwise)\nmust_check :: proc() -> Error { return .None }\n\n@(init)                    // run automatically before main() (like a static initializer)\nsetup :: proc() {}\n\n@(test)                    // a unit test, run by `odin test .`\ntest_math :: proc(t: ^testing.T) {\n\ttesting.expect(t, add(2, 2) == 4)\n}\n\n@(deferred_out=cleanup)    // auto-run cleanup(result) when the calling scope exits\nacquire :: proc() -> Handle { /* ... */ }" },
        { type: "table", headers: ["Feature", "Purpose"], rows: [
          ["`when cond { }`", "conditional compilation — platform/debug branches, dead code eliminated"],
          ["`#config(KEY, default)`", "compile-time value overridable via `-define:KEY=VAL`"],
          ["`#assert(expr)`", "fail the build if a compile-time invariant is false"],
          ["`#load(path[, T])`", "embed a file's bytes/string into the binary at compile time"],
          ["`#force_inline` / `#no_bounds_check`", "per-call codegen control (inlining, skip bounds checks in hot loops)"],
          ["`@(...)` attributes", "linkage/visibility/tests: `@(private)`, `@(test)`, `@(init)`, `@(require_results)`, `@(export)`"]
        ] },
        { type: "callout", variant: "note", text: "**Why no macros?** Ginger Bill's stance is that macros make code lie about what it does and wreck readability/tooling. Odin instead leans on parapoly (`$T`/`$N`), `when`, and a small directive set — enough to embed assets, specialize code, and target platforms, while the code you read is the code that runs. If you truly need generated source, run a code generator as a build step." }
      ]
    },
    {
      id: "interop",
      title: "C interop & building (deep)",
      level: "deep",
      body: [
        { type: "p", text: "Odin is built to live next to C. **`foreign import`** links a C library and declares its functions with `proc \"c\"` signatures; the whole `vendor:` collection is exactly this pattern. On the output side, `odin build` targets many platforms and build modes (exe, DLL/shared, static lib, object, WASM) with a single flag." },
        { type: "code", lang: "odin", code: "package demo\nimport \"core:c\"\n\n// link a C library (system: for OS libs; or a path/name to a .a/.lib/.so)\nforeign import libc \"system:c\"\n\n// declare its functions with the C calling convention; `---` = no Odin body\n@(default_calling_convention=\"c\")\nforeign libc {\n\tputs   :: proc(s: cstring) -> c.int ---\n\tabs    :: proc(n: c.int) -> c.int ---\n\tmalloc :: proc(size: c.size_t) -> rawptr ---\n\tfree   :: proc(ptr: rawptr) ---\n}\n\nmain :: proc() {\n\tputs(\"straight to libc\")   // string literals coerce to cstring\n\tx := abs(-5)               // 5\n}\n\n// exporting Odin FOR C to call: @(export) + a C calling convention\n@(export)\nadd :: proc \"c\" (a, b: c.int) -> c.int {\n\treturn a + b\n}" },
        { type: "code", lang: "bash", code: "# build modes: what artifact to produce\nodin build . -build-mode:exe                 # (default) an executable\nodin build . -build-mode:dll  -out:plugin    # shared library (.dll/.so/.dylib)\nodin build . -build-mode:static -out:lib     # static library (.a/.lib)\nodin build . -build-mode:obj                 # a single .o object file\n\n# cross-compilation: -target:<os>_<arch>\nodin build . -target:windows_amd64\nodin build . -target:linux_arm64\nodin build . -target:darwin_arm64\nodin build . -target:js_wasm32               # WebAssembly for the browser\nodin build . -target:freestanding_wasm32     # no-OS WASM (embed/plugin)\n\n# optimization & hardening\nodin build . -o:speed                        # -o: none|minimal|size|speed|aggressive\nodin build . -debug                          # emit debug info (for gdb/lldb)\nodin build . -vet -strict-style              # static checks + style enforcement\nodin build . -sanitize:address               # ASan; also -sanitize:memory / thread" },
        { type: "list", items: [
          "**`foreign import name \"target\"`** binds a library; `\"system:c\"` links the system C runtime, or give a path/library name. Declarations inside a `foreign` block end with `---` (no body) and use C types (`c.int`, `cstring`, `rawptr`, `c.size_t`).",
          "**`@(default_calling_convention=\"c\")`** applies `proc \"c\"` to every declaration in the block. Remember C-convention procs get **no `context`** — set `context = runtime.default_context()` inside any Odin callback C invokes.",
          "**`@(export)`** exposes an Odin proc so C (or a `-build-mode:dll` consumer) can call it — the basis for writing plugins/shared libraries in Odin.",
          "**Shipping games:** `odin build . -o:speed -build-mode:exe`, bundle your assets (or `#load` them into the binary), and cross-compile per platform. `vendor:` libs are statically linked in, so the executable is largely self-contained (plus the usual OS/graphics runtime).",
          "**WASM:** `-target:js_wasm32` compiles for the browser (pair with a small JS/WebGL host), and `-target:freestanding_wasm32` targets no-OS embedding."
        ] },
        { type: "callout", variant: "tip", text: "Odin's C ABI compatibility is a superpower: you can bind *any* C library in an afternoon (declare the structs/procs you need, `foreign import` the lib), and existing C code links directly. This is how the whole ecosystem gets access to decades of C libraries despite Odin being young." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite Odin developers. Most stem from manual memory and the language's explicitness — the fixes are consistent: use `defer`, lean on the temp allocator, and turn on the vet/sanitizer tooling." },
        { type: "heading", text: "1. Forgetting to free / leaking" },
        { type: "callout", variant: "warn", text: "Every `new`/`make`/`append`/`map` you own needs a matching `free`/`delete`. **Fix:** write `defer delete(x)` / `defer free(x)` on the line you allocate; route scratch data through `context.temp_allocator` + `free_all` at frame boundaries; and build with `-vet` plus `-sanitize:address` (or the tracking allocator) to surface leaks and use-after-free in tests." },
        { type: "heading", text: "2. `::` vs `:=`" },
        { type: "callout", variant: "gotcha", text: "`X :: 5` is a compile-time **constant** (no storage, can't reassign, can't `&X`); `X := 5` is a **variable**. \"Cannot assign to constant\" / \"cannot take address of constant\" means you wrote `::` for something that needs to change or be addressed. Use `:=` for runtime state." },
        { type: "heading", text: "3. Dereferencing nil / bad pointers" },
        { type: "callout", variant: "gotcha", text: "Pointers zero to `nil`, but Odin inserts **no automatic null checks** — `p^` on a nil or dangling pointer crashes (UB), like C. Check `if p != nil` where a pointer can be absent, and prefer `Maybe(T)` / `(value, ok)` returns over nullable pointers so absence is in the type." },
        { type: "heading", text: "4. temp_allocator lifetime" },
        { type: "callout", variant: "warn", text: "Anything from `context.temp_allocator` (a `tprintf` string, a temp slice) is **invalidated by the next `free_all(context.temp_allocator)`**. Never store temp-allocated data past the frame/request; if it must persist, allocate from `context.allocator` or `strings.clone` it there." },
        { type: "heading", text: "5. Slice aliasing & append invalidation" },
        { type: "callout", variant: "gotcha", text: "`append` may **reallocate** the backing buffer, dangling any slice/pointer taken before it. Re-slice/re-index after appending, or `reserve` capacity up front if you must hold references across appends. Likewise, a `[]T` slice is a non-owning view — don't return a slice into a stack array or a freed buffer." },
        { type: "heading", text: "6. Loop value copies vs `&`" },
        { type: "callout", variant: "gotcha", text: "`for v in slice { v.x = 1 }` mutates a **copy** and changes nothing. Use `for &v in slice { v.x = 1 }` to bind a pointer to each element. Same trap with ranging over structs by value in general." },
        { type: "heading", text: "7. Map iteration order & absence" },
        { type: "callout", variant: "note", text: "`for k, v in map` iterates in **unspecified order** (never rely on it; sort keys if you need determinism). A missing key yields the value type's zero value — distinguish present-but-zero from absent with `v, ok := m[k]` or `m[k] or_else default`." },
        { type: "heading", text: "8. Integer overflow & explicit conversion" },
        { type: "callout", variant: "gotcha", text: "There are **no implicit numeric conversions** — you must write `u8(x)`, `f64(n)`, etc. (verbose but bug-killing). Arithmetic can still overflow/wrap silently at the type's width; cast to a wider type before operations that might overflow, and mind truncation when narrowing (`u8(300) == 44`)." },
        { type: "heading", text: "9. Shadowing & unused values" },
        { type: "callout", variant: "gotcha", text: "Re-declaring a name with `:=` in an inner scope **shadows** the outer one — easy to do accidentally in an `if`/`for` init and then update the wrong variable. Odin also errors on unused variables/imports; use `_` to discard (`_, ok := m[k]`) and `_ = x` to silence an intentionally-unused value." },
        { type: "heading", text: "10. C callbacks have no context" },
        { type: "callout", variant: "warn", text: "A `proc \"c\"` given to a C library (Vulkan/GLFW/Raylib callback) receives **no implicit `context`**, so `context.allocator`/`context.logger` are nil and any allocation or `log` call crashes. Start such callbacks with `context = runtime.default_context()` (import `base:runtime`)." },
        { type: "heading", text: "11. The small-ecosystem reality" },
        { type: "callout", variant: "note", text: "Odin has no central package manager and **far fewer third-party libraries** than C/Rust/Go. Upsides: an excellent `core:`/`vendor:` stdlib and trivial C interop, so you bind the C library you need. Downsides: you vendor dependencies yourself and sometimes write bindings — factor that into project planning." },
        { type: "callout", variant: "tip", text: "General discipline: pair every allocation with a `defer` free, keep scratch data in the temp allocator, build tests with `-vet -sanitize:address` and the tracking allocator to catch leaks/UAF early, and prefer `(value, ok)`/`Maybe`/error-enum returns over nullable pointers. Manual memory is fine when it's visible and disciplined — which is exactly what Odin optimizes for." }
      ]
    }
  ],

  packages: [
    { name: "core:fmt", why: "formatted I/O — println/printf/printfln, plus tprintf/aprintf that allocate in the temp/heap allocator" },
    { name: "core:mem", why: "allocators, arenas, pool/stack allocators, mem.copy/set, pointer helpers — the memory toolbox" },
    { name: "core:mem/virtual", why: "virtual-memory-backed growing arenas (arena_init_growing / arena_allocator) for level/frame allocation" },
    { name: "core:math/linalg", why: "vectors, matrices, quaternions, transforms (perspective/rotate/translate), dot/cross/normalize — the graphics math library" },
    { name: "core:strings", why: "Builder, split/join/contains/trim, clone, clone_to_cstring — string manipulation (string is a non-owning view)" },
    { name: "core:os / core:os/os2", why: "files, args, env, read_entire_file, exit; os2 is the newer cross-platform filesystem/process API" },
    { name: "core:slice", why: "sort, reverse, contains, map, filter, binary_search over slices — generic slice algorithms" },
    { name: "core:thread / core:sync", why: "OS threads, thread pools, mutexes, atomics, wait groups for concurrency" },
    { name: "core:testing", why: "the @(test) unit-test framework run by `odin test .`, with testing.expect/expectf assertions" },
    { name: "vendor:raylib", why: "bundled Raylib bindings — the fastest path to a window, input, and immediate-mode 2D/3D drawing" },
    { name: "vendor:OpenGL", why: "OpenGL loader + bindings for custom renderers when you outgrow Raylib" },
    { name: "vendor:vulkan", why: "full Vulkan bindings for explicit, modern GPU work" },
    { name: "vendor:sdl2 / vendor:sdl3", why: "SDL windowing/input/audio bindings — the cross-platform game-shell alternative to Raylib" },
    { name: "vendor:stb", why: "stb_image / stb_truetype / stb_rect_pack bindings for loading textures and fonts" },
    { name: "odin (CLI)", why: "the one compiler binary: build / run / check / test, plus -o / -target / -build-mode / -vet / -sanitize" },
    { name: "ols (Odin Language Server)", why: "editor completion, go-to-def, and diagnostics for VS Code / Neovim, backed by `odin check`" }
  ],

  gotchas: [
    "**Free what you allocate:** every `new`/`make`/`append`/`map` needs a matching `free`/`delete`. Write `defer delete(x)` on the allocation line; use `-vet` + `-sanitize:address` and the tracking allocator to catch leaks.",
    "**`::` vs `:=`:** `X :: 5` is a compile-time constant (can't reassign, can't `&`); `X := 5` is a variable. \"Cannot assign to a constant\" means you meant `:=`.",
    "**No auto null checks:** pointers zero to `nil` but `p^` on nil/dangling pointer crashes. Guard with `if p != nil`, or model absence with `Maybe(T)` / `(value, ok)`.",
    "**temp_allocator is transient:** anything from `context.temp_allocator` dies at the next `free_all` — never store `tprintf`/temp data past the frame; clone into `context.allocator` if it must persist.",
    "**`append` can reallocate:** it may move the backing buffer, dangling slices/pointers taken beforehand. Re-index after appends or `reserve` capacity up front.",
    "**Loops copy by value:** `for v in slice { v.x = 1 }` edits a copy. Use `for &v in slice` to mutate elements in place.",
    "**Maps are unordered:** `for k, v in m` order is unspecified — sort keys for determinism. A missing key returns the zero value; use `v, ok := m[k]` or `or_else` to detect absence.",
    "**No implicit numeric conversion:** you must cast (`u8(x)`, `f64(n)`). Narrowing truncates (`u8(300)==44`); widen before ops that could overflow.",
    "**Shadowing:** re-declaring a name with `:=` in an inner scope shadows the outer one — a classic \"updating the wrong variable\" bug in `if`/`for` inits.",
    "**Unused vars/imports are errors:** discard with `_` (`_, ok := m[k]`) or `_ = x`; remove unused imports.",
    "**C callbacks get no `context`:** a `proc \"c\"` handed to Vulkan/GLFW/Raylib has nil `context.allocator`/`logger`. Set `context = runtime.default_context()` at its top before allocating/logging.",
    "**`string` vs `cstring`:** `string` is a non-owning `{ptr,len}` view (not null-terminated); passing to C needs a `cstring` via `strings.clone_to_cstring` (which allocates — free it).",
    "**`union` access via type switch:** read a tagged union with `switch x in v` or `x, ok := v.(T)`, not direct field access; the non-`ok` assertion form panics on the wrong variant.",
    "**`#partial switch` for enums:** a normal `switch` on an enum warns unless exhaustive; use `#partial switch` when you intentionally handle only some variants.",
    "**Slices don't own memory:** never return a `[]T` into a stack array or a buffer you free — the view will dangle. Return owning `[dynamic]T` (and document who deletes it) instead.",
    "**Small ecosystem:** no central package manager and far fewer libraries than C/Rust — you vendor deps and sometimes write your own C bindings; plan for it (offset by a strong core:/vendor: stdlib)."
  ],

  flashcards: [
    { q: "What is Odin and what's its core philosophy?", a: "A data-oriented systems language (by Ginger Bill) — a joyful, explicit C alternative with **no GC, no runtime, no hidden control flow or allocations**, an allocator-first memory model, and first-class math/vendor bindings for games & graphics." },
    { q: "`::` vs `:=`?", a: "`::` declares a **compile-time constant** (`MAX :: 100`, also how procs/types/imports are declared); `:=` declares a **runtime variable** (`x := 100`). Constants have no storage and can't be reassigned or addressed." },
    { q: "What does `---` mean in a declaration?", a: "Explicitly **uninitialized** — skip the default zero-initialization (`buf: [1024]u8 = ---`). Contents are garbage; you promise to fill them. Everything else zero-initializes by default." },
    { q: "How many loop keywords does Odin have?", a: "One: **`for`**. It's C-style (`for i:=0;i<n;i+=1`), range (`for i in 0..<n`), while (`for cond`), infinite (`for {}`), and iteration (`for v, i in slice` / `for k, v in map`)." },
    { q: "How do you mutate elements while ranging a slice?", a: "Use `for &v in slice` — the `&` binds a pointer to each element. Plain `for v in slice` gives a **copy**, so writes are lost." },
    { q: "Difference between `[N]T`, `[]T`, `[dynamic]T`, and `map[K]V`?", a: "`[N]T` fixed array (value, stack, copied); `[]T` slice (non-owning `{ptr,len}` view); `[dynamic]T` growable owned heap buffer (`append`, must `delete`); `map[K]V` hash table (owned, must `delete`, unordered)." },
    { q: "How is memory managed with no GC?", a: "Manually, but via **swappable allocators**. Every allocating call uses `context.allocator` (default heap) or you route it to an arena/pool/temp allocator. Pair allocations with `defer free`/`delete`." },
    { q: "What is `context.temp_allocator` for?", a: "A per-frame scratch **arena**: allocate freely, never free individually, then `free_all(context.temp_allocator)` at a frame/request boundary reclaims it all in O(1). Data there is invalid after `free_all`." },
    { q: "What is the implicit `context`?", a: "A hidden parameter threaded through every Odin-convention proc, carrying `allocator`, `temp_allocator`, `logger`, `assertion_failure_proc`, `random_generator`, and `user_ptr`. Override it per scope (it's a plain value)." },
    { q: "Why do `proc \"c\"` callbacks crash on allocation?", a: "C calling-convention procs get **no `context`** — `context.allocator`/`logger` are nil. Set `context = runtime.default_context()` (import `base:runtime`) at the top of any Odin callback C invokes." },
    { q: "How does error handling work (no exceptions)?", a: "Return `(value, error-enum)` where the enum's **zero value = success**, then propagate with `x or_return` (return the error up), default with `or_else`, or `or_break`/`or_continue` in loops. `Maybe(T)` models optionals." },
    { q: "How do generics work in Odin?", a: "Parametric polymorphism, monomorphized at compile time: `$T` = type parameter, `$N` = constant value parameter, constrained by a `where` clause. Works on procs and structs (`Stack :: struct($T: typeid)`). No runtime dispatch/boxing." },
    { q: "What's special about Odin's math support?", a: "Built-in `matrix[R,C]T` with real linear-algebra operators, `[N]T` vectors with component-wise ops and **swizzling** (`v.xyz`), built-in `complex`/`quaternion`, `#simd`, and `core:math/linalg` transforms — tailor-made for graphics." },
    { q: "What are `struct` `using`, `bit_set`, and `distinct`?", a: "`using field: T` embeds a struct's fields into the outer one (composition); `bit_set[Enum]` is a compact flag set (`|` `&` `in`); `distinct T` makes a strong type alias with the same bits but incompatible type (units/handles)." },
    { q: "What is `vendor:` and why does it matter?", a: "The officially-maintained bindings collection shipping **with the compiler** — Raylib, OpenGL, Vulkan, SDL2/3, GLFW, stb, miniaudio, microui. `import` and go, no package manager or build scripts." },
    { q: "Why does Odin have no macros?", a: "By design — macros hide what code does and break tooling/readability. Instead: parapoly (`$T`/`$N`), compile-time `when`, and directives (`#config`, `#assert`, `#load`, `@(...)` attributes). The code you read is the code that runs." },
    { q: "How do you call C from Odin?", a: "`foreign import lib \"system:c\"` then declare procs with `proc \"c\"` signatures ending in `---` inside a `@(default_calling_convention=\"c\") foreign lib { ... }` block. `@(export)` exposes Odin procs to C." },
    { q: "Key `odin` CLI commands and flags?", a: "`odin run .` / `odin build . -out:app` / `odin check .` / `odin test .`; flags `-o:speed`, `-debug`, `-vet`, `-sanitize:address`, `-target:linux_arm64`, `-build-mode:dll`, `-define:KEY=VAL`." }
  ],

  cheatsheet: [
    { label: "Run / build / check", code: "odin run .   |   odin build . -out:app -o:speed   |   odin check ." },
    { label: "Hello world", code: "package main\\nimport \"core:fmt\"\\nmain :: proc() { fmt.println(\"hi\") }" },
    { label: "Constant vs variable", code: "MAX :: 100          // const\\nhp := 100           // variable" },
    { label: "Uninitialized", code: "buf: [1024]u8 = ---   // skip zero-init" },
    { label: "For (range / while / iter)", code: "for i in 0..<n {}   for x>0 {}   for &v in slice {}" },
    { label: "Proc, multiple returns", code: "divmod :: proc(a, b: int) -> (int, int) { return a/b, a%b }" },
    { label: "Pointer new/free", code: "e := new(Entity); defer free(e); e.hp = 100" },
    { label: "Dynamic array", code: "xs: [dynamic]int; append(&xs, 1, 2); defer delete(xs)" },
    { label: "Map + default", code: "m: map[string]int; n := m[\"k\"] or_else -1; defer delete(m)" },
    { label: "Temp allocator", code: "s := fmt.tprintf(\"%d\", x); free_all(context.temp_allocator)" },
    { label: "Override allocator (scope)", code: "context.allocator = arena_alloc; build_scene()" },
    { label: "Error propagate", code: "width := parse_int(s) or_return" },
    { label: "Tagged union", code: "V :: union{int, string}; switch x in v { case int: }" },
    { label: "Generic proc", code: "max :: proc(a, b: $T) -> T { return a if a>b else b }" },
    { label: "Generic struct", code: "Stack :: struct($T: typeid) { data: [dynamic]T }" },
    { label: "Vector math + swizzle", code: "v := [4]f32{1,2,3,4}; a := v.xyz; m: matrix[4,4]f32 = 1" },
    { label: "Raylib window loop", code: "for !rl.WindowShouldClose() { rl.BeginDrawing(); rl.EndDrawing() }" },
    { label: "Call C", code: "foreign import c \"system:c\"\\n@(default_calling_convention=\"c\") foreign c { puts :: proc(s: cstring) -> i32 --- }" },
    { label: "Cross-compile / DLL", code: "odin build . -target:js_wasm32   |   -build-mode:dll" },
    { label: "Vet + sanitize", code: "odin build . -vet -sanitize:address" }
  ]
});
