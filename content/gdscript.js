(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "gdscript",
  name: "Godot (GDScript)",
  language: "GDScript",
  group: "Game dev",
  navLabel: "Godot (GDScript)",
  color: "#478cbf",
  readMinutes: 30,
  tagline: "The **Python-like, engine-native** language of the **Godot 4** engine — gradually typed, node/scene-driven, with first-class **signals**, `@export`, `await`, and `Callable`.",

  sections: [
    {
      id: "overview",
      title: "Overview & the Godot mental model",
      level: "core",
      body: [
        { type: "p", text: "**GDScript** is a dynamically-typed-by-default, **gradually-typed** scripting language built *specifically* for the [Godot engine](https://godotengine.org) — the popular free/open-source (MIT) 2D+3D engine. Its syntax is deliberately Python-like (indentation blocks, `func`, `:` types), but it is not Python: it is compiled to **Godot bytecode** and runs inside the engine with deep, zero-glue access to every engine type, node, resource and signal. There is no import ceremony to reach the engine — the engine *is* the standard library." },
        { type: "p", text: "You cannot understand GDScript without the engine's core data model. Everything you build is a tree of **nodes**." },
        { type: "list", items: [
          "**Node** — the atomic building block: a `Sprite2D`, a `CharacterBody2D`, a `Timer`, an `AudioStreamPlayer`, a `Label`. Each node does one job. A **script** (a `.gd` file) attaches to a node to give it custom behavior.",
          "**Scene** — a saved tree of nodes (a `.tscn` file): a Player, an Enemy, a whole Level, the Main Menu. A scene has one **root node**. Scenes are the unit of reuse and are **instanced** into other scenes (a Level scene contains many Enemy instances).",
          "**SceneTree** — the runtime container that holds the *currently running* scenes and drives the game loop (calling `_process`, `_physics_process`, delivering input). You reach it with `get_tree()`.",
          "**Resource** — shared, saveable *data* (not a node): a `Texture2D`, an `AudioStream`, a `PackedScene`, a `Material`, or your own `extends Resource` classes. Resources live at `res://` paths and are reference-counted."
        ] },
        { type: "table", headers: ["Concept", "Web/app analog", "Godot reality"], rows: [
          ["Node", "a DOM element / widget", "a single-purpose engine object with a lifecycle"],
          ["Scene (.tscn)", "a component / prefab", "a reusable saved node tree with one root"],
          ["SceneTree", "the app runtime / event loop", "drives frames & input; `get_tree()`"],
          ["Script (.gd)", "a component's code", "GDScript attached to a node, `extends` its class"],
          ["Signal", "an event / callback", "first-class decoupled event a node emits"],
          ["Resource", "a data file / model", "shared, saveable, ref-counted data at `res://`"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets **Godot 4.x** (4.4 is current in 2026). Godot 4 GDScript is a near-rewrite of the 3.x language: **typed GDScript** is mature and encouraged, annotations use `@` (`@export`, `@onready`, `@tool`), signals are first-class values, coroutines use `await` (not 3.x `yield`), and node names were renamed (`Spatial` → `Node3D`, `KinematicBody` → `CharacterBody2D/3D`). 3.x idioms are noted only as *legacy contrast*." },
        { type: "callout", variant: "tip", text: "**Why GDScript vs C# or GDExtension?** GDScript is the path of least friction: it hot-reloads, needs no build step or bindings, and every engine API is one line away — ideal for gameplay logic and prototyping. Reach for **C#** (also first-class) when you want a mature typed language/ecosystem, or **GDExtension** (C++/Rust) for compute-heavy hot loops (custom physics, procedural generation). Most projects are 95% GDScript with a few native modules where the profiler tells you to." }
      ]
    },
    {
      id: "setup",
      title: "Setup: the editor, scripts & the res:// filesystem",
      level: "core",
      body: [
        { type: "p", text: "Download the ~50 MB Godot editor from godotengine.org (a single executable, no installer) and open the **Project Manager**. A project is a folder with a `project.godot` file at its root — that root maps to the virtual path **`res://`** (read-only *resource* filesystem, packed into the export). User-writable save data lives under **`user://`**." },
        { type: "list", items: [
          "**Attach a script:** select a node in the Scene dock → click the *Attach Script* icon (or right-click → *Attach Script*). Godot creates a `.gd` file whose `extends` matches the node's class and opens it in the built-in editor.",
          "**Run:** press **F5** to run the *main* scene, **F6** to run the *currently edited* scene. The editor and the game share the engine, and scripts **hot-reload** on save.",
          "**The script template** starts you with the two most common callbacks — `_ready()` (once, when the node enters the tree) and `_process(delta)` (every rendered frame).",
          "**`class_name`** registers your script as a global type so it appears in the *Create Node* dialog and is usable by name anywhere (like the engine's own types)."
        ] },
        { type: "code", lang: "gdscript", code: "# player.gd  — the default script template, attached to a Node2D\nextends Node2D\n\n# Called once, when this node and its children have entered the SceneTree.\nfunc _ready() -> void:\n\tprint(\"player ready at \", global_position)\n\n# Called every rendered frame; delta = seconds since the last frame.\nfunc _process(delta: float) -> void:\n\trotation += delta  # spin ~1 radian per second, frame-rate independent" },
        { type: "code", lang: "gdscript", code: "# res:// is the project root (read-only at runtime); user:// is writable save data.\nvar tex := load(\"res://art/player.png\")          # load a resource by path\nvar cfg_path := \"user://savegame.json\"           # OS-specific writable location\nprint(ProjectSettings.globalize_path(\"user://\")) # the real absolute path on disk" },
        { type: "callout", variant: "gotcha", text: "**GDScript indentation is significant and Godot defaults to TABS.** Mixing tabs and spaces is a parse error. Let the editor manage it (Enter auto-indents; the editor inserts tabs). Blocks open with `:` and are defined purely by indentation — there are no braces." },
        { type: "callout", variant: "tip", text: "Enable **Editor Settings → Text Editor → Completion → Add Type Hints** and, in Project Settings, the debug settings for *untyped/unsafe* warnings. Typed GDScript gives you real autocomplete and catches typos at parse time — turn the warnings up and treat them as errors." }
      ]
    },
    {
      id: "variables",
      title: "Variables, types & the core value types",
      level: "core",
      body: [
        { type: "p", text: "Declare with `var` (mutable) and `const` (compile-time constant). GDScript is **dynamically typed by default** but supports **typed GDScript**: annotate with `: Type`, or use **`:=`** to *infer* a static type from the initializer. Typed code is faster (the VM skips runtime lookups) and safer (errors at parse time)." },
        { type: "code", lang: "gdscript", code: "# --- dynamic (no annotation): the variable can hold anything ---\nvar loot = 5\nloot = \"gold\"          # legal but a warning-worthy smell\n\n# --- explicitly typed ---\nvar hp: int = 3\nvar speed: float = 240.0\nvar name: String = \"Hero\"\nvar alive: bool = true\n\n# --- inferred static type with :=  (recommended default) ---\nvar score := 0                 # inferred int\nvar friction := 0.85           # inferred float\nvar dir := Vector2.RIGHT       # inferred Vector2\n\n# --- constants & enums ---\nconst MAX_HP := 100\nconst GRAVITY := 980.0\nenum State { IDLE, RUN, JUMP }  # State.IDLE == 0, State.RUN == 1 ...\nvar state := State.IDLE" },
        { type: "table", headers: ["Type", "Notes"], rows: [
          ["`int`", "64-bit signed integer. **`/` of two ints truncates** (`7/2 == 3`)"],
          ["`float`", "64-bit double. `7.0/2 == 3.5`. Compare with `is_equal_approx()`"],
          ["`bool`", "`true` / `false`"],
          ["`String`", "mutable UTF-8 text; rich methods (`.split`, `.format`, `%`)"],
          ["`StringName`", "interned, cached string (`&\"name\"`); fast `==`, used for node/anim/action names"],
          ["`Variant`", "the untyped 'anything' type — what an unannotated `var` is"]
        ] },
        { type: "heading", text: "Godot's built-in math value types" },
        { type: "p", text: "These are **value types** (copied on assignment, not references) that you use constantly. Vectors carry enough operators and helpers to move things without writing your own math." },
        { type: "code", lang: "gdscript", code: "var pos := Vector2(100, 50)        # 2D point/vector (x, y)\nvar vel := Vector2(3, -4)\nprint(pos + vel)                    # (103, 46) — component-wise\nprint(vel.length())                 # 5.0\nprint(vel.normalized())             # unit vector, length 1\nprint(pos.distance_to(vel))         # euclidean distance\nprint(pos.direction_to(vel))        # normalized vector pos -> vel\nprint(vel.angle())                  # radians\nprint(pos.lerp(vel, 0.5))           # halfway between (interpolation)\n\nvar p3 := Vector3(1, 2, 3)          # 3D\nvar tint := Color(1, 0, 0, 1)       # RGBA, each 0..1 (or Color.RED)\nvar box := Rect2(0, 0, 64, 64)      # position + size\nprint(box.has_point(pos))\n\n# constants save you typing common vectors\nprint(Vector2.ZERO, Vector2.UP, Vector2.LEFT)" },
        { type: "list", items: [
          "**`Vector2` / `Vector3` / `Vector4`** — points, directions, velocities, sizes. Full operator set (`+ - * /`, dot `.dot()`, cross `.cross()`).",
          "**`Color`** — RGBA floats 0..1, named constants (`Color.SKY_BLUE`), `.lerp`, hex via `Color.html(\"#478cbf\")`.",
          "**`Rect2` / `Rect2i`** — axis-aligned rectangle; `.has_point`, `.intersects`, `.grow`.",
          "**`Transform2D` / `Transform3D`** — position + rotation + scale as a matrix; a node's `transform`. `Basis` is the 3×3 rotation/scale part of a `Transform3D`; **`Quaternion`** is the numerically-stable way to represent/interpolate 3D rotation (`slerp`)."
        ] },
        { type: "callout", variant: "gotcha", text: "Value types are **copied, not shared**. `var a := position; a.x = 0` does **not** move the node — you edited a copy. To move it, assign back: `position.x = 0` or `position = a`. (Nodes and Resources, by contrast, are passed by reference.)" }
      ]
    },
    {
      id: "control-flow",
      title: "Operators, control flow & match",
      level: "core",
      body: [
        { type: "p", text: "Arithmetic is C-like; the boolean operators are the **words** `and` / `or` / `not` (the symbols `&& || !` also work but the words are idiomatic). Blocks are indentation, opened by `:`." },
        { type: "code", lang: "gdscript", code: "# if / elif / else\nif hp <= 0:\n\tdie()\nelif hp < 20 and not shielded:\n\tflash_warning()\nelse:\n\tpass  # 'pass' = do nothing (needed where a body is required)\n\n# ternary: value if condition else other\nvar label := \"alive\" if hp > 0 else \"dead\"\n\n# while + break / continue\nwhile hp > 0:\n\thp -= tick_damage()\n\tif invincible:\n\t\tcontinue\n\tif quit_requested:\n\t\tbreak\n\n# for over a numeric range (0,1,2,3,4)\nfor i in 5:\n\tprint(i)\nfor i in range(2, 10, 2):   # start, stop(exclusive), step -> 2,4,6,8\n\tprint(i)\n\n# for over a collection\nfor enemy in get_tree().get_nodes_in_group(\"enemies\"):\n\tenemy.take_damage(10)" },
        { type: "heading", text: "match — structural pattern matching" },
        { type: "p", text: "`match` is GDScript's `switch` on steroids: it matches literals, arrays, dictionaries, bindings and a wildcard `_`. There is **no fall-through** — the first matching branch runs and stops." },
        { type: "code", lang: "gdscript", code: "match state:\n\tState.IDLE:\n\t\tplay(\"idle\")\n\tState.RUN, State.JUMP:      # comma = OR\n\t\tplay(\"move\")\n\t_:                          # wildcard / default\n\t\tpush_warning(\"unknown state\")\n\n# array & dictionary patterns with variable binding\nmatch event_data:\n\t[\"move\", var dx, var dy]:   # binds dx, dy from a 3-element array\n\t\tmove(dx, dy)\n\t{\"type\": \"hit\", \"amount\": var amt}:\n\t\ttake_damage(amt)\n\t[]:\n\t\tprint(\"empty\")\n\t_:\n\t\tprint(\"no match\")" },
        { type: "callout", variant: "tip", text: "In `match`, a bare identifier like `var amt` **binds** a new variable; to compare against an *existing* constant use its qualified name (`State.IDLE`) or wrap literals directly. `..` inside an array pattern matches the rest (`[\"cmd\", ..]`)." }
      ]
    },
    {
      id: "functions",
      title: "Functions, lambdas & Callable",
      level: "core",
      body: [
        { type: "p", text: "Functions use `func`. Annotate parameter and return types for speed and safety; use `-> void` for functions that return nothing. Default argument values are supported. `_init()` is the **constructor** (runs at object creation, before the node enters the tree)." },
        { type: "code", lang: "gdscript", code: "# typed params, default arg, typed return\nfunc heal(amount: int, overheal: bool = false) -> int:\n\thp += amount\n\tif not overheal:\n\t\thp = min(hp, MAX_HP)\n\treturn hp\n\n# no return value\nfunc reset() -> void:\n\thp = MAX_HP\n\n# multiple return via an array or a typed Dictionary is common;\n# GDScript has no tuple, so return a small array/dict or a custom object.\nfunc split(x: int) -> Array:\n\treturn [x / 2, x - x / 2]\n\n# static function: belongs to the class, no instance / no 'self'\nstatic func clamp01(v: float) -> float:\n\treturn clampf(v, 0.0, 1.0)\n\n# the constructor (for objects created with .new(), see the classes section)\nfunc _init(start_hp: int = 3) -> void:\n\thp = start_hp" },
        { type: "heading", text: "Lambdas & Callable" },
        { type: "p", text: "A **`Callable`** is a first-class reference to a function (bound to an object or standalone). Anonymous **lambdas** are written `func(...): ...`. Callables are what you pass to `connect`, `sort_custom`, `filter`, `Tween`, timers — anywhere a callback is needed. `bind()` pre-fills trailing arguments; `call()` / `call_deferred()` invoke it." },
        { type: "code", lang: "gdscript", code: "# a lambda stored in a variable\nvar doubler := func(x: int) -> int: return x * 2\nprint(doubler.call(21))          # 42  (lambdas are called via .call)\n\n# a Callable referencing a method on self\nvar cb := on_hit                 # bare method name -> Callable bound to self\ncb.call(10)\n\n# bind() pre-binds trailing args; great for passing context to signals\nbutton.pressed.connect(_on_pressed.bind(\"start\"))\n\n# higher-order methods take Callables\nvar evens := [1,2,3,4,5,6].filter(func(n): return n % 2 == 0)  # [2,4,6]\nvar names := enemies.map(func(e): return e.name)\nnames.sort_custom(func(a, b): return a < b)\n\nfunc on_hit(dmg: int) -> void: hp -= dmg\nfunc _on_pressed(which: String) -> void: print(\"pressed \", which)" },
        { type: "callout", variant: "note", text: "Call a lambda with `.call(args)`, not `()` — `my_lambda(1)` is a parse error; `my_lambda.call(1)` is correct. Regular named functions are called normally (`heal(5)`). `super()` calls the parent class's version of the current method (see inheritance)." }
      ]
    },
    {
      id: "collections",
      title: "Collections: Array, Dictionary & packed arrays",
      level: "core",
      body: [
        { type: "p", text: "The two workhorses are **`Array`** (ordered list) and **`Dictionary`** (ordered key→value map). Both are dynamically typed by default, but Arrays can be **typed** (`Array[int]`) for safety and speed. **Packed arrays** (`PackedInt32Array`, `PackedVector3Array`, `PackedByteArray`, …) are compact, contiguous, typed buffers used for meshes, audio, and large data — much lighter than a generic `Array`." },
        { type: "code", lang: "gdscript", code: "# --- Array (untyped) ---\nvar loot := [\"sword\", \"shield\", 3]\nloot.append(\"potion\")\nloot.push_front(\"map\")\nprint(loot.size(), loot.has(\"shield\"), loot.find(\"sword\"))\nfor item in loot:\n\tprint(item)\nprint(loot.pop_back())          # remove & return last\nvar top3 := loot.slice(0, 3)    # sub-array\n\n# --- typed array: element type enforced, faster ---\nvar scores: Array[int] = [10, 20, 30]\nscores.append(40)\n# scores.append(\"x\")            # parse/runtime error: wrong element type\nprint(scores.reduce(func(acc, n): return acc + n, 0))  # 100\n\n# --- Dictionary ---\nvar player := {\n\t\"name\": \"Hero\",\n\t\"hp\": 3,\n\t\"pos\": Vector2(0, 0),\n}\nprint(player[\"hp\"])\nplayer[\"hp\"] -= 1\nplayer[\"level\"] = 2             # add a new key\nprint(player.has(\"level\"), player.keys(), player.values())\nfor key in player:              # iterating a Dictionary yields KEYS\n\tprint(key, \" = \", player[key])\nprint(player.get(\"mana\", 0))    # default if missing -> 0" },
        { type: "code", lang: "gdscript", code: "# --- packed arrays: compact, typed, contiguous (use for large/perf data) ---\nvar bytes := PackedByteArray([1, 2, 3])\nvar verts := PackedVector3Array()\nverts.append(Vector3(0, 0, 0))\nverts.append(Vector3(1, 0, 0))\nvar floats := PackedFloat32Array([0.1, 0.2, 0.3])\n# PackedStringArray, PackedInt64Array, PackedColorArray, ... also exist" },
        { type: "callout", variant: "gotcha", text: "`Array` and `Dictionary` are **reference types** (passed by reference, unlike `Vector2`/`int`). Assigning `var b := a` makes `b` point at the *same* array — mutating `b` mutates `a`. Use `a.duplicate()` (shallow) or `a.duplicate(true)` (deep) for an independent copy." },
        { type: "callout", variant: "tip", text: "Prefer **typed arrays** (`Array[Enemy]`, `Array[int]`) for anything with a known element type: you get autocomplete on elements, parse-time type errors, and the VM stores them more efficiently. Prefer a **packed array** when you hold thousands of numbers/vectors." }
      ]
    },
    {
      id: "classes",
      title: "Classes, inheritance & class_name",
      level: "core",
      body: [
        { type: "p", text: "**Every `.gd` file is a class.** It implicitly `extends` a base (default `RefCounted`), declares its members, and can be registered globally with `class_name`. A script attached to a node must `extend` that node's class (or a subclass)." },
        { type: "code", lang: "gdscript", code: "# enemy.gd\nclass_name Enemy            # register a global type usable everywhere by name\nextends CharacterBody2D      # this script IS-A CharacterBody2D\n\nvar hp: int = 30\nvar loot: Array[String] = []\n\nfunc _init() -> void:\n\tpass\n\nfunc take_damage(amount: int) -> void:\n\thp -= amount\n\tif hp <= 0:\n\t\tdie()\n\nfunc die() -> void:\n\tqueue_free()             # remove this node next frame" },
        { type: "code", lang: "gdscript", code: "# boss.gd — inheritance + super()\nclass_name Boss\nextends Enemy               # inherits take_damage, die, hp, ...\n\nfunc _init() -> void:\n\tsuper()                  # call Enemy._init()\n\thp = 500\n\nfunc take_damage(amount: int) -> void:\n\tsuper.take_damage(amount / 2)   # bosses take half; call the parent version\n\tif hp < 100:\n\t\tenrage()\n\nfunc enrage() -> void:\n\tmodulate = Color.RED\n\n# Because Enemy has class_name, you can construct & type-check it anywhere:\nvar e := Enemy.new()        # for a RefCounted class; nodes usually come from scenes\nif some_node is Enemy:\n\t(some_node as Enemy).take_damage(10)" },
        { type: "heading", text: "Inner classes & custom Resources" },
        { type: "code", lang: "gdscript", code: "# inner class: a helper type scoped to this file\nclass Inventory:\n\tvar items: Array[String] = []\n\tfunc add(x: String) -> void: items.append(x)\n\nvar bag := Inventory.new()\nbag.add(\"key\")\n\n# a custom RESOURCE: shareable, saveable data (not a node)\nclass_name ItemData\nextends Resource\n@export var name: String = \"\"\n@export var damage: int = 0\n@export var icon: Texture2D" },
        { type: "callout", variant: "tip", text: "`class_name` does three things: registers the type globally (use it by name, no `preload`), adds it to the *Create Node/Resource* dialog, and enables `is`/`as` checks. Give it an optional editor icon: `@icon(\"res://icons/enemy.svg\")` above the `class_name` line." },
        { type: "callout", variant: "note", text: "**`extends Resource`** is how you make designer-editable, saveable data objects (stats, item definitions, dialogue) — combine with `@export` and they show up in the inspector and save as `.tres` files. Prefer this over stuffing data in Dictionaries when the shape is known." }
      ]
    },
    {
      id: "nodes",
      title: "The node & scene tree: get_node, $, %, @onready",
      level: "core",
      body: [
        { type: "p", text: "At runtime your game is a live tree of nodes. From inside a script you navigate it to find siblings/children and manipulate the tree. Node classes form a hierarchy: **`Node`** (base) → **`Node2D`** (2D transform) / **`Node3D`** (3D transform) / **`Control`** (UI), with specialized subclasses (`Sprite2D`, `CharacterBody3D`, `Button`, `Timer`, …)." },
        { type: "code", lang: "gdscript", code: "# --- getting a child node by path ---\nvar sprite := get_node(\"Sprite2D\")            # verbose form\nvar sprite2 := $Sprite2D                       # $ is shorthand for get_node\nvar hp_bar := $UI/HealthBar                    # a path down the tree\nvar gun := get_node(\"Arm/Gun\") as Node2D       # cast for typed access\n\n# --- unique-name access (%): survives moving the node in the tree ---\n# mark a node 'Access as Unique Name' in the editor, then:\nvar score_label := %ScoreLabel                 # finds it anywhere below owner\n\n# --- navigating relationships ---\nget_parent()\nget_children()\nget_child(0)\nget_tree().root                                # the SceneTree's root Window\nget_tree().current_scene                       # the running main scene" },
        { type: "heading", text: "@onready — cache node references safely" },
        { type: "p", text: "Child nodes do **not exist** while the script is being constructed — only once the node has entered the tree (`_ready`). **`@onready`** defers a variable's initializer until just before `_ready`, so `$Path` lookups are valid. This is the correct, idiomatic way to grab node references." },
        { type: "code", lang: "gdscript", code: "extends CharacterBody2D\n\n@onready var sprite: Sprite2D = $Sprite2D\n@onready var anim: AnimationPlayer = $AnimationPlayer\n@onready var muzzle: Marker2D = %Muzzle\n\nfunc _ready() -> void:\n\tsprite.play()   # safe: @onready ran first, sprite is set" },
        { type: "heading", text: "Instancing scenes & editing the tree" },
        { type: "code", lang: "gdscript", code: "# preload resolves at PARSE time (baked into the script); load at RUN time.\nconst BulletScene := preload(\"res://bullet.tscn\")\n\nfunc shoot() -> void:\n\tvar bullet := BulletScene.instantiate()   # make a live node tree\n\tbullet.global_position = muzzle.global_position\n\tget_tree().current_scene.add_child(bullet) # attach it -> it starts running\n\nfunc despawn(n: Node) -> void:\n\tn.queue_free()               # safely free at end of frame (NOT immediately)\n\n# groups: tag nodes and address them collectively\nfunc _ready() -> void:\n\tadd_to_group(\"enemies\")\nfunc alert_all() -> void:\n\tget_tree().call_group(\"enemies\", \"take_damage\", 5)" },
        { type: "callout", variant: "gotcha", text: "**`queue_free()` frees the node at the *end* of the current frame, not immediately.** Between calling it and the frame ending, the node still exists but is 'about to die'. Guard with `is_instance_valid(node)` or check `is_queued_for_deletion()` before touching a node you may have freed. Use `free()` only for objects you are certain nothing else references this frame." }
      ]
    },
    {
      id: "game-loop",
      title: "The game loop: _ready, _process, _physics_process, input",
      level: "core",
      body: [
        { type: "p", text: "The SceneTree calls a set of **virtual callbacks** on your nodes. Overriding the right one is a correctness issue, not a style one — especially the `_process` vs `_physics_process` distinction." },
        { type: "table", headers: ["Callback", "When it runs", "Use for"], rows: [
          ["`_enter_tree()`", "node added to the tree (before children ready)", "early setup"],
          ["`_ready()`", "once, after node + all children are in the tree", "grab refs, init state"],
          ["`_process(delta)`", "**every rendered frame** (variable rate)", "visuals, UI, non-physics logic"],
          ["`_physics_process(delta)`", "**fixed step** (default 60 Hz)", "movement, physics, `move_and_slide`"],
          ["`_input(event)`", "on every input event", "global input handling"],
          ["`_unhandled_input(event)`", "input not consumed by UI/`_input`", "gameplay input (preferred)"],
          ["`_exit_tree()`", "node removed from the tree", "cleanup, disconnect"]
        ] },
        { type: "code", lang: "gdscript", code: "extends CharacterBody2D\n\nvar spin := 0.0\n\nfunc _process(delta: float) -> void:\n\t# runs as fast as the display refreshes; delta varies. Frame-rate-independent\n\t# code multiplies rates by delta:\n\tspin += 90.0 * delta          # degrees per second, not per frame\n\t$Sprite2D.rotation_degrees = spin\n\nfunc _physics_process(delta: float) -> void:\n\t# runs at a FIXED timestep -> deterministic; do all movement/physics here.\n\tvelocity.y += 980.0 * delta   # gravity\n\tmove_and_slide()" },
        { type: "callout", variant: "warn", text: "**Do movement and physics in `_physics_process`, never `_process`.** `_process` runs at the (variable) display rate, so physics done there stutters, behaves differently at 30 vs 240 FPS, and can tunnel through walls. `_physics_process` runs at a fixed step, keeping the simulation stable and deterministic." },
        { type: "callout", variant: "tip", text: "**Always multiply rates by `delta`.** `position.x += speed` moves faster on faster machines; `position.x += speed * delta` moves at `speed` units *per second* regardless of frame rate. Set the physics tick in Project Settings → Physics → Common → *Physics Ticks per Second*." }
      ]
    },
    {
      id: "signals",
      title: "Signals: Godot's decoupling mechanism",
      level: "core",
      body: [
        { type: "p", text: "**Signals** are Godot's built-in observer pattern and the primary way nodes communicate *upward/outward* without hard references. A node **declares** a signal, **emits** it when something happens, and any number of listeners **connect** a `Callable` to react — the emitter never needs to know who's listening. In Godot 4 signals are **first-class**: `my_signal.emit(...)`, `my_signal.connect(callable)`." },
        { type: "code", lang: "gdscript", code: "extends Node2D\n\n# declare signals (optionally typed params)\nsignal died\nsignal health_changed(new_hp: int, max_hp: int)\n\nvar hp := 100:\n\tset(value):\n\t\thp = clampi(value, 0, 100)\n\t\thealth_changed.emit(hp, 100)   # emit when it changes\n\t\tif hp == 0:\n\t\t\tdied.emit()\n\nfunc _ready() -> void:\n\t# connect in CODE: signal.connect(Callable)\n\tdied.connect(_on_died)\n\thealth_changed.connect(_on_health_changed)\n\t# one-shot / deferred flags:\n\tdied.connect(_on_died, CONNECT_ONE_SHOT)\n\nfunc _on_died() -> void:\n\tprint(\"game over\")\n\nfunc _on_health_changed(new_hp: int, _max_hp: int) -> void:\n\t$UI/HealthBar.value = new_hp" },
        { type: "heading", text: "Connecting built-in signals & await" },
        { type: "code", lang: "gdscript", code: "# every engine node emits signals too — connect them the same way\nfunc _ready() -> void:\n\t$Button.pressed.connect(_on_button_pressed)\n\t$Area2D.body_entered.connect(_on_body_entered)\n\t$Timer.timeout.connect(func(): print(\"tick\"))   # lambda listener\n\n# AWAIT a signal: pause this function until the signal fires, then resume\nfunc flash() -> void:\n\t$Sprite2D.modulate = Color.RED\n\tawait get_tree().create_timer(0.2).timeout   # wait 0.2s without blocking\n\t$Sprite2D.modulate = Color.WHITE\n\nfunc _on_body_entered(body: Node) -> void:\n\tif body.is_in_group(\"player\"):\n\t\tbody.take_damage(10)" },
        { type: "list", items: [
          "**Connect in the editor** too: select the emitting node → *Node* dock → *Signals* tab → double-click a signal → pick the target node/method. Editor connections appear with a green icon in the script.",
          "**`emit()`** on the signal object is the Godot 4 form (3.x used `emit_signal(\"name\", ...)`, still available).",
          "**`disconnect(callable)`** to stop listening; connections auto-clean when either node is freed.",
          "Prefer **signals over polling**: instead of checking `if enemy.hp <= 0` every frame, let the enemy `died.emit()` once. Signals fire exactly when the event happens — cheaper and clearer."
        ] },
        { type: "callout", variant: "gotcha", text: "A common bug is a signal **silently not connected** (typo in the method name, or the connection line never ran) — nothing errors, the handler just never fires. Connecting to the **wrong Callable** (unbound method, wrong argument count) throws at connect/emit time. Verify with `is_connected(callable)` and keep signal-handler names conventional (`_on_<node>_<signal>`)." }
      ]
    },
    {
      id: "exports",
      title: "@export & the inspector",
      level: "core",
      body: [
        { type: "p", text: "**`@export`** exposes a script variable in the editor's **Inspector**, so designers can tune values per-instance without touching code, and the value is saved into the scene. This is the bridge between programmer and designer, and it works with typed vars, ranges, enums, and node/resource references." },
        { type: "code", lang: "gdscript", code: "extends CharacterBody2D\n\n@export var speed: float = 200.0            # a plain number field\n@export var display_name: String = \"Hero\"\n@export var can_double_jump: bool = true\n\n@export_range(0, 100, 5) var volume: int = 80        # slider min,max,step\n@export_range(0.0, 1.0) var friction := 0.9\n@export_enum(\"Easy\", \"Normal\", \"Hard\") var difficulty := 1\n@export_multiline var description: String = \"\"       # multi-line text box\n@export_file(\"*.json\") var config_path: String              # file picker\n@export_color_no_alpha var tint := Color.WHITE\n\n@export var bullet_scene: PackedScene       # drag a .tscn in from the editor\n@export var item: ItemData                  # drag a custom Resource in\n@export var target: Node2D                   # drag another node in\n\n# group inspector fields under a header:\n@export_group(\"Combat\")\n@export var damage := 10\n@export var attack_rate := 1.5" },
        { type: "heading", text: "@tool — run script logic in the editor" },
        { type: "p", text: "Normally scripts run only in the game. Add **`@tool`** at the top of a file and its code runs in the **editor** too — useful for live previews, procedural placement, and custom gizmos. Guard runtime-only work with `Engine.is_editor_hint()`." },
        { type: "code", lang: "gdscript", code: "@tool\nextends Node2D\n\n@export var radius := 50.0:\n\tset(value):\n\t\tradius = value\n\t\tqueue_redraw()          # redraw live as you drag the slider in-editor\n\nfunc _draw() -> void:\n\tdraw_circle(Vector2.ZERO, radius, Color.CYAN)\n\nfunc _process(_delta: float) -> void:\n\tif Engine.is_editor_hint():\n\t\treturn                  # skip game logic while editing" },
        { type: "callout", variant: "tip", text: "Combine `@export` with a **setter** (`var x: float: set(v): ...`) to react the moment a designer changes a value in the inspector (recompute, `queue_redraw`, re-emit a signal). `@onready` and `@export` are annotations, not keywords — they attach to the *next* variable declaration." },
        { type: "callout", variant: "warn", text: "`@tool` scripts run in the editor with your project's data live — an unguarded `_ready` or a null `$Child` can crash or corrupt the editor session. Always null-check node refs and gate game logic behind `Engine.is_editor_hint()`." }
      ]
    },
    {
      id: "input",
      title: "Input: the Input singleton & input map",
      level: "core",
      body: [
        { type: "p", text: "Define named **input actions** in Project Settings → *Input Map* (e.g. `move_left`, `jump`, `fire`) and bind each to keys, mouse buttons, gamepad buttons/axes, and touch. Then query them by name — your code stays device-agnostic and remappable." },
        { type: "code", lang: "gdscript", code: "func _physics_process(delta: float) -> void:\n\t# polling the global Input singleton (great inside _physics_process)\n\tif Input.is_action_pressed(\"move_right\"):\n\t\tvelocity.x = speed\n\tif Input.is_action_just_pressed(\"jump\") and is_on_floor():\n\t\tvelocity.y = -jump_force        # 'just_pressed' = the frame it went down\n\tif Input.is_action_just_released(\"fire\"):\n\t\tstop_charging()\n\n\t# get_vector reads a 2D direction from four actions, with deadzone handling\n\tvar dir := Input.get_vector(\"move_left\", \"move_right\", \"move_up\", \"move_down\")\n\tvelocity = dir * speed              # already normalized for diagonals\n\n\t# get_axis returns -1..1 from two opposing actions\n\tvar throttle := Input.get_axis(\"brake\", \"accelerate\")" },
        { type: "code", lang: "gdscript", code: "# event-based input: react to discrete events (best for menus, one-shots)\nfunc _unhandled_input(event: InputEvent) -> void:\n\tif event.is_action_pressed(\"pause\"):\n\t\ttoggle_pause()\n\tif event is InputEventMouseButton and event.pressed:\n\t\tif event.button_index == MOUSE_BUTTON_LEFT:\n\t\t\tshoot_at(event.position)\n\tif event is InputEventKey and event.keycode == KEY_ESCAPE:\n\t\tget_tree().quit()\n\t# mark handled so it doesn't propagate further:\n\tget_viewport().set_input_as_handled()" },
        { type: "table", headers: ["Approach", "Use for", "Where"], rows: [
          ["`Input.is_action_pressed`", "continuous held input (movement)", "`_physics_process`"],
          ["`Input.is_action_just_pressed`", "one-shot on the frame of press (jump)", "`_process`/`_physics_process`"],
          ["`Input.get_vector` / `get_axis`", "analog direction/throttle with deadzone", "`_physics_process`"],
          ["`_unhandled_input(event)`", "discrete events not eaten by UI", "gameplay callback"],
          ["`_input(event)`", "see *all* events first (rarely needed)", "global callback"]
        ] },
        { type: "callout", variant: "tip", text: "Prefer **`_unhandled_input`** over `_input` for gameplay: UI (`Control` nodes) consumes its events first, so pressing a button won't also fire your weapon. Use polling (`Input.is_action_*`) for held movement inside `_physics_process`, and events for discrete actions like opening a menu." }
      ]
    },
    {
      id: "physics",
      title: "Movement, physics & collision",
      level: "core",
      body: [
        { type: "p", text: "Godot has three body types plus areas. For a player you almost always want **`CharacterBody2D`/`3D`**: you control its `velocity` and call **`move_and_slide()`**, which moves the body, resolves collisions, and slides along surfaces. **`RigidBody2D/3D`** is fully physics-driven (you apply forces, the engine moves it). **`StaticBody`** doesn't move (walls, ground). **`Area2D/3D`** detects overlaps without colliding (triggers, pickups, hurtboxes)." },
        { type: "code", lang: "gdscript", code: "# player.gd — a complete 2D platformer controller\nextends CharacterBody2D\n\n@export var speed := 300.0\n@export var jump_velocity := -600.0\n@export var gravity := 1200.0\n\nfunc _physics_process(delta: float) -> void:\n\t# gravity\n\tif not is_on_floor():\n\t\tvelocity.y += gravity * delta\n\n\t# jump (is_on_floor() is updated by the previous move_and_slide)\n\tif Input.is_action_just_pressed(\"jump\") and is_on_floor():\n\t\tvelocity.y = jump_velocity\n\n\t# horizontal movement from input\n\tvar dir := Input.get_axis(\"move_left\", \"move_right\")\n\tif dir != 0.0:\n\t\tvelocity.x = dir * speed\n\telse:\n\t\tvelocity.x = move_toward(velocity.x, 0.0, speed)  # decelerate\n\n\tmove_and_slide()          # <-- the workhorse: moves & resolves collisions" },
        { type: "heading", text: "Areas, collision signals & raycasts" },
        { type: "code", lang: "gdscript", code: "# a coin pickup using Area2D's overlap signals\nextends Area2D\nfunc _ready() -> void:\n\tbody_entered.connect(_on_body_entered)   # a physics body overlapped us\n\nfunc _on_body_entered(body: Node2D) -> void:\n\tif body.is_in_group(\"player\"):\n\t\tbody.add_coin()\n\t\tqueue_free()\n\n# a raycast query from code (line of sight, ground check, shooting)\nfunc has_line_of_sight(target: Node2D) -> bool:\n\tvar space := get_world_2d().direct_space_state\n\tvar q := PhysicsRayQueryParameters2D.create(global_position, target.global_position)\n\tq.collision_mask = 1                       # only hit layer 1 (walls)\n\tvar hit := space.intersect_ray(q)\n\treturn hit.is_empty()                      # nothing between us -> clear LoS" },
        { type: "table", headers: ["Node", "Moves how", "Collides?", "Use for"], rows: [
          ["`CharacterBody2D/3D`", "you set `velocity` + `move_and_slide()`", "yes", "players, controlled NPCs"],
          ["`RigidBody2D/3D`", "engine physics (forces/impulses)", "yes", "crates, ragdolls, projectiles"],
          ["`StaticBody2D/3D`", "doesn't move", "yes", "walls, floors, platforms"],
          ["`Area2D/3D`", "moved manually", "**overlap only**", "triggers, pickups, hitboxes"]
        ] },
        { type: "callout", variant: "gotcha", text: "**Collision layers vs masks** trip everyone up. A body is *on* the **layers** it occupies and *scans* the **masks** it watches. For A to detect B, B must be on a layer that A's mask includes. Both are bitmask sets you edit in the inspector — a mismatch means collisions/signals silently never fire." },
        { type: "callout", variant: "warn", text: "**Forgetting `move_and_slide()`** (or `move_and_collide()`) means setting `velocity` does nothing — the body never moves. `velocity` is just a stored vector until a move function applies it. Also, `is_on_floor()`/`is_on_wall()` reflect the *last* `move_and_slide()`, so call it every physics frame." }
      ]
    },
    {
      id: "engine-apis",
      title: "Common engine APIs: timers, tweens, random, scenes",
      level: "core",
      body: [
        { type: "p", text: "A tour of the utility APIs you reach for constantly. Most are one-liners hanging off the scene tree, `Time`, or global functions." },
        { type: "heading", text: "Timers" },
        { type: "code", lang: "gdscript", code: "# one-shot inline timer via await (no node needed)\nawait get_tree().create_timer(1.5).timeout\nprint(\"1.5 seconds later\")\n\n# a Timer NODE for repeating logic\nvar t := Timer.new()\nt.wait_time = 1.0\nt.timeout.connect(func(): spawn_enemy())\nadd_child(t)\nt.start()" },
        { type: "heading", text: "Tweens — animate any property over time" },
        { type: "code", lang: "gdscript", code: "# create_tween() animates properties smoothly; chain steps\nvar tw := create_tween()\ntw.tween_property($Sprite2D, \"modulate:a\", 0.0, 0.5)   # fade out over 0.5s\ntw.tween_property(self, \"position\", Vector2(400, 0), 1.0) \\\n\t.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)\ntw.tween_callback(queue_free)                          # then free the node\nawait tw.finished                                      # optionally wait for it" },
        { type: "heading", text: "Randomness, time & scene changes" },
        { type: "code", lang: "gdscript", code: "randomize()                       # seed the RNG (call once, e.g. in an autoload)\nprint(randi())                    # random non-negative int\nprint(randf())                    # random float 0..1\nprint(randf_range(1.0, 5.0))      # random float in a range\nprint(randi_range(1, 6))          # dice roll 1..6\nvar loot := [\"gold\", \"gem\", \"nothing\"].pick_random()\n\nprint(Time.get_ticks_msec())      # ms since engine start\nprint(Time.get_datetime_dict_from_system())\n\n# swap the whole running scene\nget_tree().change_scene_to_file(\"res://levels/level2.tscn\")\nvar packed := preload(\"res://menu.tscn\")\nget_tree().change_scene_to_packed(packed)\n\n# logging\nprint(\"info\")                     # stdout / editor Output\nprint_rich(\"[color=red]hi[/color]\")\npush_warning(\"non-fatal issue\")   # yellow, with a stack location\npush_error(\"something is wrong\")  # red error entry" },
        { type: "callout", variant: "tip", text: "**Tweens are cheaper than animating in `_process` by hand** and read declaratively. Every `tween_property` step runs in sequence by default; call `.set_parallel(true)` (or `tw.parallel()`) to run steps together. A tween auto-frees when finished unless bound to a node with `bind_node`." }
      ]
    },
    {
      id: "resources",
      title: "Resources, saving & autoloads",
      level: "core",
      body: [
        { type: "p", text: "**Resources** are shareable, saveable data objects (`.tres` text / `.res` binary). Textures, audio, `PackedScene`s and your own `extends Resource` classes are all resources. Loading them and persisting game data are core skills." },
        { type: "heading", text: "load vs preload" },
        { type: "table", headers: ["Form", "When it resolves", "Notes"], rows: [
          ["`preload(path)`", "**parse time** (script compile)", "baked in, no runtime cost, path must be a constant string"],
          ["`load(path)`", "**runtime**, when the line runs", "path can be dynamic; can stall on first load"],
          ["`ResourceLoader.load_threaded_*`", "runtime, background", "async loading for big assets / level streaming"]
        ] },
        { type: "code", lang: "gdscript", code: "const Bullet := preload(\"res://bullet.tscn\")   # constant path, resolved at parse\nvar tex := load(\"res://art/\" + skin + \".png\")   # dynamic path, resolved at runtime" },
        { type: "heading", text: "Saving game data" },
        { type: "code", lang: "gdscript", code: "# --- JSON via FileAccess (simple, human-readable, portable) ---\nfunc save_game(data: Dictionary) -> void:\n\tvar f := FileAccess.open(\"user://save.json\", FileAccess.WRITE)\n\tf.store_string(JSON.stringify(data))\n\tf.close()   # or let it close when 'f' goes out of scope\n\nfunc load_game() -> Dictionary:\n\tif not FileAccess.file_exists(\"user://save.json\"):\n\t\treturn {}\n\tvar f := FileAccess.open(\"user://save.json\", FileAccess.READ)\n\tvar parsed = JSON.parse_string(f.get_as_text())\n\treturn parsed if parsed is Dictionary else {}\n\n# --- custom Resource via ResourceSaver (keeps types, refs, @export fields) ---\nfunc save_profile(profile: Resource) -> void:\n\tResourceSaver.save(profile, \"user://profile.tres\")\nfunc load_profile() -> Resource:\n\treturn ResourceLoader.load(\"user://profile.tres\")" },
        { type: "heading", text: "Autoloads (singletons) for global state" },
        { type: "p", text: "Register a scene or script in Project Settings → *Autoload* and it becomes a **global singleton** node loaded before everything else — reachable by name from any script. Perfect for game state, audio managers, scene transitions, and event buses." },
        { type: "code", lang: "gdscript", code: "# game_state.gd — registered as autoload name 'Game'\nextends Node\nvar score := 0\nvar coins := 0\nsignal score_changed(new_score: int)\n\nfunc add_score(n: int) -> void:\n\tscore += n\n\tscore_changed.emit(score)\n\n# ...then from ANY other script, no reference wiring needed:\n# Game.add_score(100)\n# Game.score_changed.connect(_on_score_changed)" },
        { type: "callout", variant: "gotcha", text: "**Autoload order matters:** autoloads initialize top-to-bottom in the Project Settings list, before the main scene. If autoload B references autoload A in its `_ready`/`_init`, A must be listed *above* B. Circular dependencies between autoloads are a design smell — use signals to decouple them." }
      ]
    },
    {
      id: "async",
      title: "Coroutines & async: await",
      level: "core",
      body: [
        { type: "p", text: "**`await`** pauses the current function until a signal fires or an awaited coroutine returns, without blocking the game — the engine keeps rendering and processing other nodes. This is Godot 4's replacement for 3.x's `yield` and makes frame-spanning, sequential logic read top-to-bottom." },
        { type: "code", lang: "gdscript", code: "# await a signal: resume when it emits\nfunc show_intro() -> void:\n\t$AnimationPlayer.play(\"fade_in\")\n\tawait $AnimationPlayer.animation_finished   # pause here until the anim ends\n\t$Label.text = \"Level 1\"\n\tawait get_tree().create_timer(2.0).timeout  # wait 2s\n\tstart_level()\n\n# await another coroutine (a function that itself awaits)\nfunc run_sequence() -> void:\n\tawait flash_red()          # waits for flash_red to fully complete\n\tawait flash_red()\n\tprint(\"both flashes done\")\n\nfunc flash_red() -> void:\n\tmodulate = Color.RED\n\tawait get_tree().create_timer(0.1).timeout\n\tmodulate = Color.WHITE\n\n# await the next frame (spread heavy work across frames)\nfunc build_world() -> void:\n\tfor i in 10000:\n\t\tspawn_tile(i)\n\t\tif i % 100 == 0:\n\t\t\tawait get_tree().process_frame   # yield to keep the frame responsive" },
        { type: "callout", variant: "warn", text: "**`await` can silently swallow problems.** If you `await` a signal that never fires (typo, node freed, condition never met), the coroutine simply *never resumes* — no error, no crash, just a function that quietly hangs forever. Prefer awaiting signals you know will fire; add a timeout race (`await` a timer alongside) for signals that might not." },
        { type: "callout", variant: "gotcha", text: "After an `await`, **the node may have been freed** (time passed; something called `queue_free`). Code after an `await` should re-check `is_instance_valid(self)` / guard node access, because `self` or `$Child` might now be dangling. `await` also makes the function a coroutine — callers that need its result must `await` it too." }
      ]
    },
    {
      id: "advanced",
      title: "Advanced: reflection, interop & performance",
      level: "deep",
      body: [
        { type: "p", text: "Deeper mechanics you'll want once the basics are solid: dynamic reflection, calling into C#/GDExtension, and the performance rules that matter for per-frame code." },
        { type: "heading", text: "Reflection: set / get / call / Callable" },
        { type: "code", lang: "gdscript", code: "# every Object supports string-keyed dynamic access\nnode.set(\"position\", Vector2(10, 10))\nvar p = node.get(\"position\")\nnode.call(\"take_damage\", 10)              # invoke a method by name\nnode.callv(\"take_damage\", [10])           # with an args array\nif node.has_method(\"take_damage\"):\n\tnode.call(\"take_damage\", 5)\n\n# defer to the end of the frame (safe when mid-physics or before _ready)\nnode.call_deferred(\"queue_free\")\nnode.set_deferred(\"visible\", false)\n\n# Callables + bind for flexible dispatch tables\nvar actions := {\n\t\"jump\": jump,\n\t\"fire\": fire.bind(\"laser\"),\n}\nactions[\"fire\"].call()" },
        { type: "heading", text: "Interop: C# and GDExtension" },
        { type: "list", items: [
          "**C#** is a first-class language in Godot (use the .NET editor build). GDScript and C# call each other across the node boundary: `get_node(...).call(\"MethodName\", args)` from GDScript, and Godot's C# API from the other side. Signals cross the boundary too.",
          "**GDExtension** lets native code (C++ via `godot-cpp`, or Rust via [`gdext`](https://github.com/godot-rust/gdext)) register real engine classes with `class_name`-like visibility — GDScript uses them exactly like built-in nodes. Reach for it for compute-heavy hot loops the profiler flags.",
          "**When to leave GDScript:** GDScript is plenty fast for gameplay logic and hot-reloads instantly. Move a system to C#/GDExtension only when profiling shows a real per-frame cost (custom physics integration, large procedural generation, pathfinding over huge graphs)."
        ] },
        { type: "heading", text: "Performance rules that matter" },
        { type: "list", items: [
          "**Static typing speeds GDScript.** Typed vars/params/returns let the VM use faster opcodes and skip runtime type resolution — measurably faster in hot loops than untyped code. Type your per-frame code.",
          "**Cache `$Node` lookups.** `$Path` calls `get_node` every time — do it once in `@onready var`, not every `_process` frame.",
          "**Avoid per-frame allocations.** Creating Arrays/Dictionaries/objects each frame in `_process`/`_physics_process` churns the GC-like refcounter. Reuse buffers; prefer packed arrays for bulk numeric data.",
          "**Batch & signal, don't poll.** Emitting one signal on an event beats scanning every node each frame. `get_tree().call_group` is cheaper than manual iteration when addressing many nodes.",
          "**Prefer `move_and_slide` math and built-in vector ops** (implemented in C++) over hand-rolled component loops in GDScript."
        ] },
        { type: "callout", variant: "note", text: "Profile with the **Debugger → Profiler** (per-function frame time) and **Monitors** (draw calls, physics, object counts). Measure before optimizing — GDScript is rarely the bottleneck; overdraw, physics, and instancing usually are." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite Godot/GDScript developers. Most are about *timing* (when nodes exist, when things free) and *typing* (errors hidden by dynamic code). Internalize them." },
        { type: "heading", text: "1. $ / get_node null before _ready" },
        { type: "callout", variant: "gotcha", text: "Child nodes don't exist while the script constructs. `var s := $Sprite2D` at the top of the file crashes with a null reference. **Fix:** use `@onready var s := $Sprite2D` (defers until the node is in the tree) or grab it inside `_ready()`." },
        { type: "heading", text: "2. Physics/movement in _process" },
        { type: "callout", variant: "warn", text: "Doing movement, `move_and_slide`, or gravity in `_process` makes them frame-rate-dependent and jittery. **Fix:** all physics/movement goes in `_physics_process(delta)` (fixed timestep). Keep visuals/UI in `_process`." },
        { type: "heading", text: "3. Forgetting move_and_slide" },
        { type: "callout", variant: "gotcha", text: "Setting `velocity` on a `CharacterBody2D/3D` does nothing on its own — the body only moves when you call `move_and_slide()` (or `move_and_collide()`) each physics frame. `is_on_floor()` also only updates after that call." },
        { type: "heading", text: "4. Tabs vs spaces / indentation" },
        { type: "callout", variant: "gotcha", text: "GDScript blocks are defined by indentation and Godot defaults to **tabs**; mixing tabs and spaces is a parse error. Let the editor auto-indent, and don't paste space-indented code into a tab file (or convert it)." },
        { type: "heading", text: "5. Untyped code hiding errors" },
        { type: "callout", variant: "tip", text: "Dynamic `var` lets typos and wrong types slip to runtime. **Prefer typed GDScript** (`: Type`, `:=`) and turn on the *untyped/unsafe* warnings — you get autocomplete, parse-time errors, and faster code. Treat `Variant` as a smell in hot paths." },
        { type: "heading", text: "6. Signal not connected / wrong Callable" },
        { type: "callout", variant: "gotcha", text: "A mistyped handler name or a connection line that never runs means the signal handler silently never fires — no error. A wrong-arity Callable errors at connect/emit. **Fix:** use `_on_<node>_<signal>` naming, connect in `_ready`, and check `is_connected()` when debugging." },
        { type: "heading", text: "7. queue_free timing" },
        { type: "callout", variant: "gotcha", text: "`queue_free()` frees the node at the **end of the frame**, not immediately — the node is still alive but doomed until then. Touching a freed node later throws. Guard with `is_instance_valid(node)`; use `free()` only for objects nothing else references this frame." },
        { type: "heading", text: "8. Integer division surprises" },
        { type: "callout", variant: "gotcha", text: "`5 / 2 == 2` because both operands are ints (truncated). **Fix:** make one a float (`5.0 / 2`, `float(a) / b`) when you want `2.5`. Same trap with `%` on floats and with `@export_range` step values." },
        { type: "heading", text: "9. preload vs load at parse time" },
        { type: "callout", variant: "gotcha", text: "`preload(path)` needs a **constant string** and resolves at parse time (fails to compile if the path is wrong or dynamic). Use `load(path)` for runtime/dynamic paths. Preloading heavy scenes in many scripts also bloats parse time — load big optional assets lazily." },
        { type: "heading", text: "10. Autoload ordering" },
        { type: "callout", variant: "gotcha", text: "Autoloads init top-to-bottom before the main scene. If one autoload uses another during `_ready`/`_init`, the dependency must be listed **above** it in Project Settings → Autoload. Decouple with signals to avoid ordering constraints." },
        { type: "heading", text: "11. await swallowing errors / freed self" },
        { type: "callout", variant: "warn", text: "`await` on a signal that never fires hangs the coroutine forever with no error. And after any `await`, `self`/`$Child` may have been freed. **Fix:** await only signals you know will fire (race a timer otherwise) and re-check `is_instance_valid(self)` after awaits." },
        { type: "heading", text: "12. String vs StringName" },
        { type: "callout", variant: "note", text: "Node names, animation names, input actions, and groups are often **`StringName`** (`&\"jump\"`), an interned string. `\"jump\" == &\"jump\"` is true (GDScript coerces), but building StringNames on the fly (concatenation) defeats the caching. Use `&\"...\"` literals for hot comparisons and pass String where the API expects String." },
        { type: "callout", variant: "note", text: "General discipline: type your code, cache node refs in `@onready`, do physics in `_physics_process`, prefer signals over polling, and remember that freeing and awaiting both span frames. When something 'does nothing', suspect a missing `move_and_slide`, an unconnected signal, or a value-type copy." }
      ]
    }
  ],

  packages: [
    { name: "Godot Editor", why: "the engine + IDE: scene/node editor, inspector, built-in script editor, debugger, exporter" },
    { name: "SceneTree (get_tree())", why: "runtime that drives the game loop, groups, scene changes, timers, and the node tree" },
    { name: "Signals & connect()", why: "first-class decoupled events — the primary node-to-node communication mechanism" },
    { name: "Input Map", why: "named, remappable input actions bound to keyboard/mouse/gamepad/touch (Project Settings)" },
    { name: "PhysicsServer2D / 3D + Godot Physics / Jolt", why: "collision/movement backends; Jolt is the modern high-perf 3D physics engine in Godot 4" },
    { name: "TileMapLayer", why: "2D tile-based level building with tilesets, autotiling, physics & navigation layers" },
    { name: "AnimationPlayer & AnimationTree", why: "keyframe any property/signal; state-machine + blend-tree animation graphs" },
    { name: "Tween (create_tween)", why: "declarative property interpolation over time (ease/trans, chained & parallel steps)" },
    { name: "Resource system (.tres/.res)", why: "shareable, saveable data — Texture2D, PackedScene, custom `extends Resource` types" },
    { name: "Autoload / Singletons", why: "global always-loaded nodes for game state, audio managers, event buses" },
    { name: "Debugger & Profiler & Monitors", why: "remote debugging, per-function frame time, draw-call/physics/object counters" },
    { name: "C# (.NET) & GDExtension (godot-cpp / gdext)", why: "first-class C# and native C++/Rust interop for typed ecosystems and hot-loop performance" },
    { name: "Asset Library (AssetLib)", why: "in-editor repository of free plugins, tools, and sample projects" },
    { name: "GDScript static analyzer / warnings", why: "built-in parse-time type & unused-code warnings (configure in Project Settings)" }
  ],

  gotchas: [
    "**`$`/`get_node` is null before `_ready`:** child nodes don't exist during script construction. Use `@onready var x := $Path` or fetch inside `_ready()`.",
    "**Movement belongs in `_physics_process`:** doing it in `_process` is frame-rate-dependent and jittery. Fixed timestep = stable physics.",
    "**`velocity` alone moves nothing:** you must call `move_and_slide()` (or `move_and_collide()`) each physics frame; `is_on_floor()` updates only after it.",
    "**Tabs, not spaces:** indentation is significant and Godot defaults to tabs — mixing them is a parse error. Let the editor indent.",
    "**Integer division truncates:** `5 / 2 == 2`. Make an operand a float (`5.0 / 2`) for `2.5`.",
    "**Value types are copied:** `var a := position; a.x = 0` doesn't move the node — assign back (`position.x = 0`). Arrays/Dictionaries/Nodes are references; `.duplicate()` to copy.",
    "**`queue_free()` is deferred:** the node dies at end of frame, still alive until then. Guard later access with `is_instance_valid(node)`.",
    "**Signals fail silently:** a typo'd handler name or unrun `connect` means the callback never fires with no error. Name handlers `_on_<node>_<signal>`; check `is_connected()`.",
    "**Collision layers vs masks:** a body is *on* its layers and *scans* its masks. For A to detect B, B must sit on a layer in A's mask — mismatch = silent no-collision.",
    "**`preload` needs a constant path** and resolves at parse time; use `load(path)` for dynamic/runtime paths.",
    "**Autoload order matters:** dependencies must be listed above dependents in Project Settings → Autoload; decouple with signals.",
    "**`await` can hang forever:** awaiting a signal that never fires never resumes (no error). And `self` may be freed after an `await` — re-check `is_instance_valid`.",
    "**Untyped code hides bugs:** prefer typed GDScript (`: Type`, `:=`) and enable warnings — it's also faster in hot loops.",
    "**Call lambdas with `.call()`:** `my_lambda(1)` is a parse error; use `my_lambda.call(1)`. Named functions are called normally.",
    "**Iterating a Dictionary yields keys**, not values (`for k in dict: dict[k]`). Iterating an Array yields elements.",
    "**`String` vs `StringName`:** node/anim/action/group names are interned `StringName` (`&\"jump\"`); use literals for hot comparisons instead of concatenating."
  ],

  flashcards: [
    { q: "Node vs Scene vs SceneTree?", a: "A **Node** is a single-purpose object; a **Scene** (`.tscn`) is a saved, reusable tree of nodes with one root; the **SceneTree** (`get_tree()`) is the runtime that holds the running scenes and drives the game loop." },
    { q: "_process vs _physics_process?", a: "`_process(delta)` runs every rendered frame (variable rate) — visuals/UI. `_physics_process(delta)` runs at a fixed timestep — do all movement, physics, and `move_and_slide()` here for stability." },
    { q: "Why use @onready?", a: "Child nodes don't exist while the script is constructed, so `$Path` is null until the node enters the tree. `@onready var x := $Path` defers the initializer until just before `_ready()`, making the lookup valid." },
    { q: "How do signals work in Godot 4?", a: "A node `signal`-declares an event, `my_signal.emit(args)` fires it, and listeners `my_signal.connect(callable)` react — the emitter never references listeners. First-class in 4.x: `emit()`/`connect()` on the signal object." },
    { q: "What does @export do?", a: "Exposes a script variable in the Inspector so designers tune it per-instance (saved into the scene). Variants: `@export_range`, `@export_enum`, `@export_file`, `@export_group`; also exports node/PackedScene/Resource references." },
    { q: "preload vs load?", a: "`preload(path)` resolves at **parse time** with a constant string (baked in, no runtime cost). `load(path)` resolves at **runtime** and accepts dynamic paths. Use `ResourceLoader.load_threaded_*` for background streaming." },
    { q: "How do you move a CharacterBody2D?", a: "Set `velocity` (a Vector2/3) each physics frame, then call `move_and_slide()` — it moves the body, resolves collisions, and slides along surfaces. `is_on_floor()` reflects the last call." },
    { q: "Dynamic vs typed GDScript?", a: "Unannotated `var` holds any Variant (dynamic). Typed GDScript uses `: Type` or inferred `:=`; it catches type errors at parse time, gives autocomplete, and runs faster via specialized opcodes." },
    { q: "What is a Callable?", a: "A first-class reference to a function (bound to an object or a lambda). Passed to `connect`, `sort_custom`, `filter`, tweens, timers. `bind()` pre-fills trailing args; invoke with `.call()`/`.call_deferred()`." },
    { q: "How does await work?", a: "`await expr` pauses the function until a signal fires or an awaited coroutine returns, without blocking the engine. Replaces 3.x `yield`. Beware: an un-firing signal hangs forever, and `self` may be freed after awaiting." },
    { q: "Array vs typed array vs packed array?", a: "`Array` holds any Variant. `Array[int]` (typed) enforces element type — safer & faster. `PackedInt32Array`/`PackedVector3Array`/… are compact contiguous typed buffers for large numeric/vertex data." },
    { q: "What are autoloads?", a: "Scripts/scenes registered in Project Settings → Autoload become global singleton nodes loaded before the main scene, reachable by name from any script — ideal for game state, managers, and event buses. Order matters." },
    { q: "class_name — what does it give you?", a: "Registers your script as a global type: usable by name without `preload`, added to the Create Node/Resource dialog, and enabling `is`/`as` type checks. Add `@icon(\"...\")` for an editor icon." },
    { q: "Area2D vs CharacterBody2D vs RigidBody2D?", a: "`Area2D` detects overlaps only (triggers/pickups, `body_entered`). `CharacterBody2D` is code-controlled via `velocity`+`move_and_slide`. `RigidBody2D` is fully physics-driven (forces/impulses)." },
    { q: "Why does 5 / 2 equal 2?", a: "Both operands are ints, so division truncates. Make one a float (`5.0 / 2` or `float(a) / b`) to get `2.5`. This int-division surprise is a classic GDScript bug." },
    { q: "Input polling vs events?", a: "Poll `Input.is_action_pressed`/`get_vector` in `_physics_process` for held movement. Handle discrete actions (menus, one-shots) in `_unhandled_input(event)`, which sees only events UI didn't consume." },
    { q: "Node names / value copies gotcha?", a: "`Vector2`/`Color`/`Rect2`/`int` are value types — copied on assignment (editing a copy doesn't affect the node). `Array`/`Dictionary`/`Node`/`Resource` are references — use `.duplicate()` to copy." },
    { q: "How do you save game data?", a: "Simple/portable: `FileAccess.open(\"user://save.json\", WRITE)` + `JSON.stringify`. Typed/rich: a custom `extends Resource` with `ResourceSaver.save(res, \"user://x.tres\")` / `ResourceLoader.load`." }
  ],

  cheatsheet: [
    { label: "Typed var / inferred", code: "var hp: int = 3    ;    var dir := Vector2.RIGHT" },
    { label: "Ready callback", code: "func _ready() -> void: pass" },
    { label: "Per-frame vs physics", code: "func _process(delta): ...   func _physics_process(delta): ..." },
    { label: "Cache a child node", code: "@onready var sprite: Sprite2D = $Sprite2D" },
    { label: "Get node / unique name", code: "$UI/HealthBar    ;    %ScoreLabel" },
    { label: "Declare & emit signal", code: "signal died\ndied.emit()" },
    { label: "Connect a signal", code: "$Button.pressed.connect(_on_pressed)" },
    { label: "Await a delay", code: "await get_tree().create_timer(1.0).timeout" },
    { label: "Export to inspector", code: "@export_range(0, 100) var speed := 50" },
    { label: "Player movement", code: "velocity = Input.get_vector(\"l\",\"r\",\"u\",\"d\") * speed\nmove_and_slide()" },
    { label: "Instance a scene", code: "var b := preload(\"res://b.tscn\").instantiate(); add_child(b)" },
    { label: "Free a node", code: "queue_free()   # end of frame; guard with is_instance_valid()" },
    { label: "match statement", code: "match state:\n\tState.RUN: play(\"run\")\n\t_: pass" },
    { label: "Lambda / Callable", code: "var f := func(x): return x * 2\nf.call(21)" },
    { label: "Typed array", code: "var scores: Array[int] = [10, 20, 30]" },
    { label: "Random", code: "randomize(); randi_range(1, 6); [\"a\",\"b\"].pick_random()" },
    { label: "Tween a property", code: "create_tween().tween_property($S, \"modulate:a\", 0.0, 0.5)" },
    { label: "Change scene", code: "get_tree().change_scene_to_file(\"res://level2.tscn\")" },
    { label: "Group broadcast", code: "get_tree().call_group(\"enemies\", \"take_damage\", 5)" },
    { label: "Save JSON", code: "FileAccess.open(\"user://s.json\", FileAccess.WRITE).store_string(JSON.stringify(data))" }
  ]
});
