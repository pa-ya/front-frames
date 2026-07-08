(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "gml",
  name: "GameMaker (GML)",
  language: "GML",
  group: "Game dev",
  navLabel: "GameMaker (GML)",
  color: "#26c281",
  readMinutes: 30,
  tagline: "**GameMaker Language** — the fast-iteration scripting language of the **GameMaker** 2D engine. Code lives inside **object events** (Create/Step/Draw), with modern structs, constructors and method variables.",

  sections: [
    {
      id: "overview",
      title: "Overview & the object-event mental model",
      level: "core",
      body: [
        { type: "p", text: "**GML (GameMaker Language)** is the scripting language of **GameMaker** (formerly *GameMaker Studio 2*, now owned by Opera/YoYo). It is a dynamically-typed, C-flavoured language built for one job: making **2D games** fast. You rarely write a `main()` — instead you attach snippets of GML to the **events** of **objects**, and the engine's game loop calls them for you every frame." },
        { type: "p", text: "The core hierarchy is **object → instance → event → action**. An **object** is a class/blueprint (a `obj_player`). An **instance** is a live copy of it placed in a **room** (the level). Each instance has built-in variables (`x`, `y`, `sprite_index`, `speed`) plus whatever you add. **Events** are hooks — *Create* (runs once), *Step* (runs every frame), *Draw* (renders), *Collision*, *Alarm*, input events — and your GML runs inside them." },
        { type: "list", items: [
          "**The game loop is implicit.** GameMaker runs at a fixed step (default **60 fps**). Every frame it fires each instance's *Step* event, moves it, resolves collisions, then fires *Draw*. You never write the loop — you fill in the event bodies.",
          "**GML compiles two ways.** The **VM** (bytecode interpreter — fast to build, great for iteration) or the **YYC / YoYo Compiler** (transpiles to C++ then native machine code — faster runtime, used for release builds). Same GML, two backends.",
          "**Instance variables persist** across events and frames on that instance; **`var` locals** vanish at the end of the event; **`global.`** is shared by everything.",
          "**Everything is a real or a reference.** Numbers are 64-bit doubles (`real`), plus strings, booleans, `undefined`, arrays, structs, and method values. There is no separate int type in normal use.",
          "**Where GML fits:** rapid 2D prototyping and shipping (Undertale, Hyper Light Drifter, Nuclear Throne, Katana Zero). Trades the control of a general engine for speed of iteration."
        ] },
        { type: "table", headers: ["GameMaker concept", "General-language analog", "Reality in GML"], rows: [
          ["Object", "class", "blueprint with events + default variables"],
          ["Instance", "object/instance of a class", "a live copy in a room, has an `id`"],
          ["Event (Create/Step/Draw)", "method / lifecycle hook", "GML the engine calls for you each frame"],
          ["Room", "scene / level", "container of instances, layers, tiles, cameras"],
          ["Script asset", "module of free functions", "`function`s callable from anywhere"],
          ["Instance variable", "field", "lives on the instance, survives across frames"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets **modern GameMaker** (LTS **2026.0**, IDE 16 / Runtime 23) — the runtime with **structs**, **constructors** (`function X() constructor {}`), **method variables**, the `function` keyword, and function-based event code. Legacy idioms (`script_execute`, `argument0`, `globalvar`, `ds_map`-based JSON) still work but are noted as the *old way*." },
        { type: "callout", variant: "tip", text: "GML is meaningless without the event model. If a line of code isn't behaving, the first question is always **which event is it in?** — the same function does different things in *Create* vs *Step* vs *Draw*." }
      ]
    },
    {
      id: "setup",
      title: "Setup: the IDE, projects, and the run loop",
      level: "core",
      body: [
        { type: "p", text: "You write GML inside the **GameMaker IDE** (Windows/macOS/Ubuntu). Grab it from [gamemaker.io](https://gamemaker.io) — as of 2026 you no longer need to sign in just to use the IDE (only to export builds). A project is a folder of **assets**: objects, sprites, rooms, scripts, sounds, tilesets, shaders, fonts." },
        { type: "list", items: [
          "**Create a project** (`New` → *GameMaker Language*, not *GameMaker Visual* which is drag-and-drop).",
          "**Add a sprite** (`spr_player`) — an image with one or more animation subimages, an origin, and a collision mask.",
          "**Add an object** (`obj_player`), assign it the sprite, then open its **Events** panel and add a *Create* and *Step* event — each opens a code editor where your GML lives.",
          "**Add a room** (`rm_game`) and drag `obj_player` onto its *Instances* layer.",
          "**Press F5** (or the ▶ button) to run with the VM. **F6** runs with the debugger attached."
        ] },
        { type: "heading", text: "Where GML actually lives" },
        { type: "table", headers: ["Location", "What it is", "Runs when"], rows: [
          ["Object event code", "GML attached to Create/Step/Draw/… of an object", "the engine fires that event"],
          ["Script asset", "one or more `function`s in a `.gml` script", "when you call the function"],
          ["Room Creation Code", "GML on a room", "once when the room starts"],
          ["Instance Creation Code", "GML on a specific placed instance", "after that instance's Create event"]
        ] },
        { type: "callout", variant: "tip", text: "The **run/debug loop** is the whole appeal: edit code, hit F5, see it live in seconds (VM build). Use the **debugger** (F6) to set breakpoints, watch variables, and inspect every live instance. Switch to **YYC** in the target dropdown only for performance profiling or release." },
        { type: "heading", text: "Export targets at a glance" },
        { type: "list", items: [
          "**Desktop:** Windows (incl. ARM64), macOS, Ubuntu — GX.games / WASM for the browser.",
          "**Web / instant:** **GX.games** exports a WASM build playable in-browser (Opera GX's game portal).",
          "**Mobile:** Android, iOS, tvOS. **Console:** PlayStation, Xbox, Nintendo Switch (licensed dev accounts required).",
          "**Tooling:** **GM-CLI** (2026) drives builds from the command line without opening the IDE; **GMRT** is the new next-gen runtime (beta) that will add first-class JS/TS/C#."
        ] },
        { type: "code", lang: "bash", code: "# GM-CLI: build/run from the terminal (2026+), no IDE window\ngm-cli build ./MyGame.yyp --target windows --config default\ngm-cli run   ./MyGame.yyp --runtime vm      # quick VM run\ngm-cli run   ./MyGame.yyp --runtime yyc     # native compile" }
      ]
    },
    {
      id: "variables",
      title: "Variables & data types",
      level: "core",
      body: [
        { type: "p", text: "GML is dynamically typed. The scope of a variable is decided by **how you declare it**, and this is the single most important thing to get right." },
        { type: "table", headers: ["Scope", "How to write it", "Lifetime / who sees it"], rows: [
          ["**Local**", "`var speed = 4;`", "this event/function only; gone at the end of it"],
          ["**Instance**", "`hp = 100;` (no `var`)", "lives on the instance, survives across all its events/frames"],
          ["**Global**", "`global.score = 0;`", "one copy shared by the entire game"]
        ] },
        { type: "code", lang: "gml", code: "// --- in obj_player's Create event ---\nhp = 100;                 // INSTANCE variable: persists for this player\nmax_hp = 100;             // another instance variable\nglobal.score = 0;         // GLOBAL: shared everywhere\n\n// --- in obj_player's Step event ---\nvar spd = 4;              // LOCAL: only exists during this Step\nx += spd;                 // 'hp' and 'x' are still here from Create; 'spd' is fresh each frame\n\nif (hp <= 0) {\n    global.score += 10;   // reach into the shared global\n}" },
        { type: "heading", text: "The data types" },
        { type: "list", items: [
          "**Real** — every number is a 64-bit float. `4`, `3.14`, `-7`. There is no separate int type in normal code (an `int64` type exists for buffers/APIs).",
          "**String** — `\"hello\"`, double-quoted. Concatenate with `+`. Strings are **1-indexed**.",
          "**Boolean** — `true` / `false` (really `1` / `0`; any value `> 0.5` is truthy).",
          "**`undefined`** — an unset value; check with `is_undefined(x)`. Reading an instance variable that was never assigned is a *runtime error*, not `undefined`.",
          "**`pointer_null` / `noone` / `NaN` / `infinity`** — sentinel values you meet in specific APIs (`noone` = `-4`, returned by instance searches that find nothing).",
          "**Reference types** — arrays, structs, and methods are passed by reference (see Data structures)."
        ] },
        { type: "heading", text: "Constants: #macro and enum" },
        { type: "code", lang: "gml", code: "// #macro: a compile-time text substitution (no semicolon, no scope)\n#macro MAX_SPEED 8\n#macro GAME_TITLE \"Dungeon of GML\"\n#macro GRAVITY 0.4\n\n// enum: named integer constants, great for states\nenum PlayerState {\n    idle,     // 0\n    walk,     // 1\n    jump,     // 2\n    dead      // 3\n}\n\n// usage\nstate = PlayerState.idle;\nif (speed > MAX_SPEED) speed = MAX_SPEED;" },
        { type: "callout", variant: "gotcha", text: "**Forgetting `var` is the classic bug.** Inside a Step event, `speed = 4;` (no `var`) silently creates or overwrites an *instance* variable `speed` — and `speed` happens to be a built-in that moves the instance! Meant a throwaway local? Write `var speed = 4;`. Meant a temp global? You just polluted the instance. Declare `var` for anything temporary." },
        { type: "callout", variant: "note", text: "`#macro` is not a variable — it is literal text pasted in before compile, so it has no scope and can't be reassigned at runtime. Use `enum` for grouped constants and `global.` for values that genuinely change at runtime." }
      ]
    },
    {
      id: "operators",
      title: "Operators & expressions",
      level: "core",
      body: [
        { type: "p", text: "Arithmetic, comparison and logic are C-like, with a couple of GML-specific keywords (`div`, `mod`) and word-forms of the logical operators." },
        { type: "table", headers: ["Category", "Operators", "Notes"], rows: [
          ["Arithmetic", "`+  -  *  /  div  mod  %`", "`/` always gives a real; `div` = integer divide; `mod`/`%` = remainder"],
          ["Assignment", "`=  +=  -=  *=  /=  ++  --`", "`++`/`--` exist; no `**` power operator (use `power(a,b)`)"],
          ["Comparison", "`==  !=  <  >  <=  >=`", "`=` also works as comparison in a condition (a footgun)"],
          ["Logical", "`&&  ||  !`  or  `and  or  not`", "word-forms are identical; short-circuit evaluated"],
          ["Bitwise", "`&  |  ^  ~  <<  >>`", "operates on 64-bit integer view of the real"],
          ["Ternary", "`cond ? a : b`", "nullish coalescing: `a ?? b` (b if a is undefined)"]
        ] },
        { type: "code", lang: "gml", code: "var a = 17;\nvar b = 5;\nshow_debug_message(a / b);      // 3.4   (always a real)\nshow_debug_message(a div b);    // 3     (integer division)\nshow_debug_message(a mod b);    // 2     (remainder, same as a % b)\n\n// logical: && and 'and' are the same thing\nif (hp > 0 && !is_dead) { /* ... */ }\nif (hp > 0 and not is_dead) { /* ... */ }   // identical\n\n// ternary + nullish coalesce\nvar label = (hp > 50) ? \"healthy\" : \"hurt\";\nvar nm = player_name ?? \"Player 1\";   // fall back if undefined" },
        { type: "heading", text: "Type conversion & string building" },
        { type: "code", lang: "gml", code: "// numbers do NOT auto-convert to strings in concatenation:\nvar n = 42;\n// draw_text(x, y, \"Score: \" + n);      // ERROR: can't add string + real\ndraw_text(x, y, \"Score: \" + string(n));   // string() converts -> \"Score: 42\"\n\nreal(\"3.14\");        // -> 3.14   (parse a string to a number)\nstring(pi);          // -> \"3.141592...\"\nstring_format(pi, 1, 3);   // -> \"3.142\"  (total width 1, 3 decimals)" },
        { type: "callout", variant: "gotcha", text: "`\"Score: \" + score` throws — GML will **not** silently coerce a real into a string. Always wrap numbers in `string(...)` when concatenating. And `\"5\" == 5` is `false`: a string is never equal to a real." },
        { type: "callout", variant: "tip", text: "**Accessor symbols** let you read/write structured data inline: `array[i]` (array), `grid[# x, y]` (ds_grid), `list[| i]` (ds_list), `map[? key]` (ds_map), and `struct[$ \"field\"]` (struct dynamic key). You'll meet these in the Data structures section." }
      ]
    },
    {
      id: "control-flow",
      title: "Control flow (including with)",
      level: "core",
      body: [
        { type: "p", text: "The usual C-family control structures, plus GML's signature construct: **`with`**, which runs a block *in the scope of other instances*." },
        { type: "code", lang: "gml", code: "// if / else if / else\nif (hp <= 0)      state = PlayerState.dead;\nelse if (hp < 30) state = PlayerState.hurt;\nelse              state = PlayerState.idle;\n\n// switch (no fall-through needed if you break; case values can be enum members)\nswitch (state) {\n    case PlayerState.idle: sprite_index = spr_idle; break;\n    case PlayerState.walk: sprite_index = spr_walk; break;\n    default:               sprite_index = spr_idle; break;\n}\n\n// loops\nfor (var i = 0; i < 10; i++) { /* ... */ }\nwhile (x < room_width) { x += 1; }\ndo { y += 1; } until (place_meeting(x, y, obj_wall));   // runs at least once\nrepeat (5) { instance_create_layer(x, y, \"Enemies\", obj_bullet); }   // fixed count\n\n// break / continue work in loops; exit leaves the whole event/script; return leaves a function\nfor (var i = 0; i < 100; i++) {\n    if (i == 50) break;       // stop the loop\n    if (i mod 2) continue;    // skip odd i\n}" },
        { type: "heading", text: "with — target and iterate other instances" },
        { type: "p", text: "`with(target)` re-scopes the block so that inside it, **`self`** is the target instance and **`other`** is the instance that ran the `with`. The target can be an *object* (runs for **every** instance of it), a single instance **`id`**, or the keywords **`all`** / **`other`** / **`noone`**." },
        { type: "code", lang: "gml", code: "// runs once FOR EACH instance of obj_enemy; inside, x/y/hp are that enemy's\nwith (obj_enemy) {\n    hp -= 10;                 // 'self' = this enemy\n    if (hp <= 0) instance_destroy();\n}\n\n// target a single instance by its id\nwith (boss_id) { sprite_index = spr_boss_angry; }\n\n// 'other' inside with refers to the instance that STARTED the with\nwith (obj_bullet) {\n    if (place_meeting(x, y, other)) {   // 'other' = whoever ran this with (e.g. the player)\n        other.hp -= 1;                  // damage the runner\n        instance_destroy();             // destroy this bullet\n    }\n}\n\n// create an instance and configure it immediately\nvar enemy = instance_create_layer(x, y, \"Enemies\", obj_enemy);\nwith (enemy) { hp = 50; target = other.id; }   // 'other' = the creator" },
        { type: "callout", variant: "gotcha", text: "Inside `with`, **`self` is the target, not the caller**. Beginners write `with (obj_enemy) { x = x + hspeed; }` expecting `x`/`hspeed` to be the player's — they're the enemy's. To reach the calling instance's variables, use `other.`. This scope flip is the #1 source of `with` confusion." }
      ]
    },
    {
      id: "functions",
      title: "Functions, scripts & method variables",
      level: "core",
      body: [
        { type: "p", text: "The modern way to make reusable code is the **`function`** keyword. Put named functions in a **script asset** and they're callable from anywhere. Functions can also be stored *in variables* — these are **method variables**, GML's first-class functions." },
        { type: "code", lang: "gml", code: "// --- in a script asset, e.g. scr_combat ---\nfunction deal_damage(_target, _amount) {\n    _target.hp -= _amount;\n    if (_target.hp <= 0) instance_destroy(_target);\n    return _target.hp;   // return a value\n}\n\n// default argument values\nfunction spawn(_obj, _x, _y = 0, _layer = \"Instances\") {\n    return instance_create_layer(_x, _y, _layer, _obj);\n}\n\n// variadic: argument_count + argument[i]\nfunction sum_all() {\n    var total = 0;\n    for (var i = 0; i < argument_count; i++) total += argument[i];\n    return total;\n}\nsum_all(1, 2, 3, 4);   // -> 10" },
        { type: "heading", text: "Method variables (functions stored in variables)" },
        { type: "code", lang: "gml", code: "// a function value assigned to an instance variable\non_death = function() {\n    instance_create_layer(x, y, \"FX\", obj_explosion);\n    audio_play_sound(snd_boom, 10, false);\n};\n\n// call it later like any function\nif (hp <= 0) on_death();\n\n// method() binds a function to a specific scope (struct or instance)\nvar cb = method(self, function() { hp += 10; });\ncb();   // runs with 'self' bound to this instance even if called elsewhere\n\n// callbacks: pass a function into another function\narray_foreach([1, 2, 3], function(_val, _i) {\n    show_debug_message(\"item \" + string(_i) + \" = \" + string(_val));\n});" },
        { type: "callout", variant: "note", text: "**Legacy contrast:** old GML used *script assets as callable units* invoked with `script_execute(scr_name, arg0, ...)` and read args via `argument0`..`argument15`. Modern GML uses named `function`s (call them directly) and `argument[i]`/`argument_count` for variadics. A script asset can hold many `function`s now, not just one." },
        { type: "callout", variant: "tip", text: "Because functions are values, you can build lightweight *strategy* patterns: store an `update` method on an instance and swap it (`update = state_walk;`) to change behaviour — a clean state machine without a giant `switch`." }
      ]
    },
    {
      id: "data-structures",
      title: "Data structures: arrays, structs, constructors, ds_*",
      level: "core",
      body: [
        { type: "p", text: "Modern GML has three tiers of collections: **arrays** and **structs** (garbage-collected, the default choice) and the older **`ds_*`** types (manual memory, still useful for specific structures)." },
        { type: "heading", text: "Arrays" },
        { type: "code", lang: "gml", code: "var a = [10, 20, 30];      // literal\na[0];                       // -> 10  (0-indexed)\narray_length(a);            // -> 3\na[5] = 99;                  // grows the array; gaps fill with 0\n\narray_push(a, 40);          // append\narray_pop(a);               // remove + return last\narray_insert(a, 1, 15);     // insert at index\narray_delete(a, 0, 1);      // remove 1 element at index 0\n\n// 2D arrays (arrays of arrays)\nvar grid = [[1, 2, 3], [4, 5, 6]];\ngrid[1][2];                 // -> 6\n\n// handy helpers\narray_sort(a, true);        // ascending\narray_contains(a, 20);      // -> true\nvar b = array_map(a, function(v) { return v * 2; });" },
        { type: "heading", text: "Structs & constructors" },
        { type: "p", text: "A **struct** is an anonymous object literal (`{ }`). A **constructor** is a `function` marked `constructor` that you build with **`new`** — GML's closest thing to a class, complete with methods and `static` members." },
        { type: "code", lang: "gml", code: "// struct literal (like a JS object)\nvar player = { name: \"Hero\", hp: 100, pos: { x: 0, y: 0 } };\nplayer.hp -= 10;                 // dot access\nplayer[$ \"hp\"];                  // dynamic-key access via [$ ]\nvariable_struct_exists(player, \"mana\");   // -> false\n\n// constructor: a reusable struct blueprint\nfunction Vec2(_x, _y) constructor {\n    x = _x;\n    y = _y;\n    // methods live on the struct\n    add = function(_o) { x += _o.x; y += _o.y; return self; };\n    length = function() { return sqrt(x * x + y * y); };\n    // static: one shared copy across all instances (not per-instance)\n    static zero = function() { return new Vec2(0, 0); };\n}\n\nvar v = new Vec2(3, 4);\nv.length();                      // -> 5\nv.add(new Vec2(1, 1));           // v is now (4,5)\n\n// constructor inheritance\nfunction Enemy(_x, _y, _hp) : Vec2(_x, _y) constructor {\n    hp = _hp;\n}" },
        { type: "heading", text: "The legacy ds_* types (manual memory!)" },
        { type: "table", headers: ["Type", "What it is", "Create / destroy"], rows: [
          ["`ds_list`", "ordered dynamic list", "`ds_list_create()` / `ds_list_destroy(l)`"],
          ["`ds_map`", "key→value hash map", "`ds_map_create()` / `ds_map_destroy(m)`"],
          ["`ds_grid`", "2D fixed grid (fast bulk ops)", "`ds_grid_create(w,h)` / `ds_grid_destroy(g)`"],
          ["`ds_stack`", "LIFO stack", "`ds_stack_create()` / `ds_stack_destroy(s)`"],
          ["`ds_queue`", "FIFO queue", "`ds_queue_create()` / `ds_queue_destroy(q)`"],
          ["`ds_priority`", "priority queue", "`ds_priority_create()` / `ds_priority_destroy(p)`"]
        ] },
        { type: "code", lang: "gml", code: "var inv = ds_list_create();\nds_list_add(inv, \"sword\", \"shield\");\ninv[| 0];                      // -> \"sword\"   ([| ] is the ds_list accessor)\nds_list_size(inv);             // -> 2\n// ...when done, you MUST free it or it leaks:\nds_list_destroy(inv);\n\nvar m = ds_map_create();\nm[? \"gold\"] = 50;              // [? ] is the ds_map accessor\nds_map_destroy(m);             // manual cleanup, always" },
        { type: "callout", variant: "warn", text: "**`ds_*` structures are NOT garbage-collected.** `ds_list_create()` returns an integer handle to memory you own. If you don't call the matching `ds_*_destroy()`, it leaks for the whole session. Arrays and structs *are* collected automatically — so **prefer arrays/structs**; reach for `ds_grid` (bulk 2D ops), `ds_priority`, or `ds_*` only when you need their specific behaviour." },
        { type: "callout", variant: "tip", text: "Rule of thumb: **struct** for a record with named fields, **array** for an ordered list, **constructor** when you need many of the same shape with methods, **ds_grid** for tile/heatmap math, **ds_priority** for pathfinding open-sets. `ds_map`/`ds_list` are mostly superseded by structs/arrays now." }
      ]
    },
    {
      id: "strings",
      title: "Strings",
      level: "core",
      body: [
        { type: "p", text: "Strings are double-quoted and, crucially, **1-indexed** — the first character is at position 1, not 0. Most string functions follow that convention." },
        { type: "code", lang: "gml", code: "var s = \"GameMaker\";\nstring_length(s);              // -> 9\nstring_char_at(s, 1);          // -> \"G\"   (1-indexed!)\nstring_copy(s, 1, 4);          // -> \"Game\" (from index 1, 4 chars)\nstring_pos(\"Maker\", s);        // -> 5     (index where substring starts, 0 if none)\nstring_upper(s);               // -> \"GAMEMAKER\"\nstring_replace_all(\"a_b_c\", \"_\", \"-\");   // -> \"a-b-c\"\nstring_delete(s, 1, 4);        // -> \"Maker\"  (remove 4 chars from pos 1)\n\n// split (returns an array) — great for parsing\nvar parts = string_split(\"1,2,3\", \",\");   // -> [\"1\", \"2\", \"3\"]\n\n// formatting numbers\nstring_format(3.14159, 1, 2);  // -> \"3.14\"  (width, decimals)\nchr(65);                       // -> \"A\"   (code point to char)\nord(\"A\");                      // -> 65    (char to code point)" },
        { type: "callout", variant: "note", text: "**Localization:** for shipping in multiple languages, keep display text out of code — store strings in a struct/JSON keyed by language and look them up (`lang[$ key]`), or use a Marketplace localization extension. `os_get_language()` gives the device locale. Don't hard-code UI text in Draw events." },
        { type: "callout", variant: "gotcha", text: "The 1-indexing bites everyone: a loop over characters is `for (var i = 1; i <= string_length(s); i++)`, not `i = 0; i < len`. Arrays are 0-indexed but strings are 1-indexed — they do not match." }
      ]
    },
    {
      id: "events",
      title: "The event model in depth",
      level: "core",
      body: [
        { type: "p", text: "Events are the entry points the engine calls. Understanding **which events exist and in what order they fire each frame** is essential — it is the difference between smooth logic and flickering bugs." },
        { type: "table", headers: ["Event", "Fires", "Use it for"], rows: [
          ["**Create**", "once, when the instance is made", "initialise instance variables"],
          ["**Begin Step**", "every frame, before Step", "read input, pre-update decisions"],
          ["**Step**", "every frame", "the main game logic / movement"],
          ["**End Step**", "every frame, after movement", "camera follow, post-movement fixes"],
          ["**Alarm[0..11]**", "when its countdown hits 0", "delayed/timed actions"],
          ["**Collision(obj)**", "while overlapping another object", "hit detection responses"],
          ["**Key / Mouse**", "on that input", "input handling (or poll in Step)"],
          ["**Draw**", "every frame, render pass", "drawing sprites/shapes/text"],
          ["**Draw GUI**", "render pass, screen space", "HUD/UI fixed to the screen"],
          ["**Room Start / End**", "entering / leaving a room", "level setup/teardown"],
          ["**Destroy / Clean Up**", "on `instance_destroy` / removal", "free ds_*, drop references"]
        ] },
        { type: "heading", text: "Order of events per frame" },
        { type: "list", ordered: true, items: [
          "**Begin Step** (all instances)",
          "Alarms, then **Keyboard / Mouse / Gamepad** input events",
          "**Step** (all instances) — your main logic",
          "The engine applies **built-in movement** (`x += hspeed`, `speed`/`direction`)",
          "**End Step** (all instances)",
          "**Draw Begin → Draw → Draw End**, then **Draw GUI** (screen space)"
        ] },
        { type: "code", lang: "gml", code: "// Create event: set up state once\nhp = 100;\nalarm[0] = room_speed * 2;   // fire Alarm 0 in 2 seconds (at 60fps -> 120 steps)\n\n// Step event: logic that runs every frame\nif (keyboard_check(vk_right)) x += 4;\n\n// Alarm 0 event: runs when the countdown reaches 0\ninstance_create_layer(x, y, \"Enemies\", obj_spawner);\nalarm[0] = room_speed * 2;   // re-arm it to repeat" },
        { type: "callout", variant: "warn", text: "**Update and draw are separate passes — keep logic out of Draw.** The Draw event exists to render; if you put game logic there it runs coupled to the render (and won't run at all if drawing is skipped or the instance isn't visible). Movement, timers, and state changes belong in **Step**; only `draw_*` calls belong in **Draw**." },
        { type: "callout", variant: "gotcha", text: "If an object has **no Draw event**, GameMaker automatically draws its `sprite_index`. The moment you add *any* Draw event, that automatic drawing stops — you must call `draw_self()` yourself, or the instance goes invisible." }
      ]
    },
    {
      id: "instances",
      title: "Objects, instances & scope",
      level: "core",
      body: [
        { type: "p", text: "An instance is created from an object and gets a unique **`id`**. Scope keywords let you refer to *this* instance, the *other* one in a collision/with, or *all* instances." },
        { type: "table", headers: ["Keyword", "Means"], rows: [
          ["`self` / `id`", "the current instance (id is its unique handle)"],
          ["`other`", "the other instance (in a Collision event, or the caller of a `with`)"],
          ["`all`", "every instance in the room"],
          ["`noone`", "no instance (`-4`); what searches return on failure"],
          ["object name (`obj_x`)", "used in a search/`with`, means \"any/all instances of obj_x\""]
        ] },
        { type: "code", lang: "gml", code: "// create instances\nvar e = instance_create_layer(100, 200, \"Enemies\", obj_enemy);   // on a named layer\nvar b = instance_create_depth(x, y, -100, obj_bullet);          // at a specific depth\ne.hp = 30;                    // configure via the returned id\n\n// find / count / test existence\nif (instance_exists(obj_boss)) show_debug_message(\"boss alive\");\nvar n = instance_number(obj_enemy);          // how many enemies exist\nvar near = instance_nearest(x, y, obj_coin); // closest coin's id (or noone)\n\n// destroy\ninstance_destroy();           // destroys the current instance (self)\ninstance_destroy(e);          // destroys a specific instance" },
        { type: "heading", text: "Inheritance (parent objects)" },
        { type: "code", lang: "gml", code: "// Set obj_enemy_base as the PARENT of obj_slime and obj_bat in the object editor.\n// A child inherits the parent's events unless it overrides them.\n\n// In obj_slime's Step event, run the parent's Step first, then add to it:\nevent_inherited();            // runs obj_enemy_base's Step\nx += wobble;                  // then slime-specific behaviour\n\n// A collision/with against the PARENT hits ALL children:\nif (place_meeting(x, y, obj_enemy_base)) { /* hits slimes AND bats */ }" },
        { type: "callout", variant: "note", text: "**Deactivation** (`instance_deactivate_object(obj_enemy)`, `instance_deactivate_region(...)`) freezes instances: they stop running events, stop drawing, and are **invisible to `with`, `instance_exists`, and collision checks**. Reactivate with `instance_activate_*`. It's the standard trick for huge worlds — but a deactivated boss will *look* destroyed to your code, so track it deliberately." },
        { type: "callout", variant: "gotcha", text: "Referencing an object name where a single instance is expected uses the *first* instance of that object. If several exist, `obj_enemy.hp` reads an arbitrary one. Capture the specific `id` from `instance_create_layer(...)` when you need a particular instance." }
      ]
    },
    {
      id: "drawing",
      title: "Drawing: sprites, shapes, text & the GUI layer",
      level: "core",
      body: [
        { type: "p", text: "All rendering happens in **Draw** events, and `draw_*` functions only do anything there. The **Draw** event renders in *room space* (moves with the camera); the **Draw GUI** event renders in *screen space* (fixed HUD)." },
        { type: "code", lang: "gml", code: "// --- Draw event (room space) ---\ndraw_self();                       // draw this instance's own sprite/subimage\n\n// draw any sprite explicitly\ndraw_sprite(spr_coin, 0, x, y);    // sprite, subimage, x, y\ndraw_sprite_ext(spr_coin, image_index, x, y,\n                image_xscale, image_yscale, image_angle, c_white, image_alpha);\n\n// text\ndraw_set_font(fnt_ui);\ndraw_set_halign(fa_center);\ndraw_set_color(c_yellow);\ndraw_text(x, y - 20, \"HP: \" + string(hp));\n\n// shapes\ndraw_set_color(c_red);\ndraw_rectangle(x, y, x + 32, y + 4, false);   // false = filled\ndraw_circle(x, y, 8, true);                   // true = outline only\ndraw_line(x, y, mouse_x, mouse_y);\n\n// colours: constants (c_white, c_red...) or make your own\ndraw_set_color(make_color_rgb(80, 200, 120));\ndraw_set_alpha(0.5);               // reset with draw_set_alpha(1) afterwards" },
        { type: "heading", text: "Sprites & animation" },
        { type: "list", items: [
          "**`sprite_index`** — which sprite the instance shows; **`image_index`** — current subimage (frame); **`image_number`** — total frames of the current sprite.",
          "**`image_speed`** — how fast the animation advances (1 = normal). Set to 0 and control `image_index` manually for state-based frames.",
          "**`image_xscale`/`image_yscale`** — flip/scale (`image_xscale = -1` faces left). **`image_angle`** — rotation. **`image_blend`** — tint. **`image_alpha`** — opacity.",
          "The engine advances `image_index` automatically each Step by `image_speed` — you usually just set `sprite_index` and let it animate."
        ] },
        { type: "code", lang: "gml", code: "// --- Draw GUI event (screen space, ignores the camera) ---\ndraw_set_color(c_white);\ndraw_text(20, 20, \"Score: \" + string(global.score));   // stays top-left of the screen\n// a health bar that never scrolls with the world\ndraw_healthbar(20, 50, 220, 60, (hp / max_hp) * 100, c_black, c_red, c_lime, 0, true, true);" },
        { type: "callout", variant: "warn", text: "**Always reset draw state you change.** `draw_set_color`, `draw_set_alpha`, `draw_set_font`, `draw_set_halign` are *global* to the render pass — if you leave alpha at 0.3, every later instance draws faded. Set what you need, then set it back (or set it explicitly at the top of each Draw)." },
        { type: "callout", variant: "gotcha", text: "Use **Draw GUI** for HUD/score/menus. If you draw the HUD in the normal Draw event it lives in room space and scrolls away as the camera moves. Draw GUI coordinates are screen pixels (top-left `0,0`), independent of the camera and view zoom." }
      ]
    },
    {
      id: "input",
      title: "Input: keyboard, mouse & gamepad",
      level: "core",
      body: [
        { type: "p", text: "The reliable pattern is to **poll input in the Step event** with the `*_check` family, rather than relying only on the dedicated Key/Mouse events. There are three flavours of check: held, just-pressed, and just-released." },
        { type: "table", headers: ["Function", "True when"], rows: [
          ["`keyboard_check(key)`", "the key is currently **held** (every frame it's down)"],
          ["`keyboard_check_pressed(key)`", "the key went down **this frame** (fires once)"],
          ["`keyboard_check_released(key)`", "the key came up **this frame** (fires once)"]
        ] },
        { type: "code", lang: "gml", code: "// Step event — poll input every frame\nvar move = keyboard_check(vk_right) - keyboard_check(vk_left);   // -1, 0, or 1\nx += move * 4;\n\n// letter keys: use ord(\"X\") with an UPPERCASE letter\nif (keyboard_check_pressed(ord(\"Z\"))) jump();\nif (keyboard_check_pressed(vk_space)) shoot();   // vk_ constants for special keys\n\n// mouse (mouse_x/mouse_y are in ROOM space)\nif (mouse_check_button_pressed(mb_left)) fire_at(mouse_x, mouse_y);\nif (mouse_wheel_up()) zoom_in();\n\n// gamepad (pad slot 0)\nif (gamepad_is_connected(0)) {\n    var lx = gamepad_axis_value(0, gp_axislh);      // left stick X, -1..1\n    if (abs(lx) > 0.2) x += lx * 4;                 // deadzone\n    if (gamepad_button_check_pressed(0, gp_face1)) jump();   // A / cross\n}" },
        { type: "callout", variant: "gotcha", text: "**`keyboard_check` vs `keyboard_check_pressed` is a top beginner trap.** `keyboard_check(vk_space)` is `true` *every frame* the key is held, so a jump/shoot fires continuously. Use `keyboard_check_pressed(...)` for one-shot actions (jump, fire, confirm) and `keyboard_check(...)` only for continuous ones (walking)." },
        { type: "callout", variant: "note", text: "`ord(\"a\")` and `ord(\"A\")` differ — always pass an **uppercase** letter to `ord` for key checks, since keyboard keys map to uppercase codes. For UI hit-testing under the camera, convert with `device_mouse_x_to_gui(0)` to get GUI-space mouse coordinates." }
      ]
    },
    {
      id: "movement",
      title: "Movement & collision",
      level: "core",
      body: [
        { type: "p", text: "Every instance has built-in motion variables the engine applies automatically each frame. You can move by setting position directly, or by using the vector variables." },
        { type: "table", headers: ["Variable", "Effect (applied every Step by the engine)"], rows: [
          ["`x`, `y`", "position; set directly for full control"],
          ["`hspeed`, `vspeed`", "horizontal/vertical velocity added to x/y each frame"],
          ["`speed`, `direction`", "polar velocity (magnitude + angle in degrees)"],
          ["`gravity`, `gravity_direction`", "acceleration added to the velocity each frame"],
          ["`friction`", "speed reduction per frame"]
        ] },
        { type: "code", lang: "gml", code: "// direct control (most platformers do this manually)\nx += hsp;\ny += vsp;\n\n// built-in vector motion\nspeed = 5;\ndirection = point_direction(x, y, mouse_x, mouse_y);   // aim at the mouse\nmove_towards_point(target_x, target_y, 4);             // sets speed+direction for you" },
        { type: "heading", text: "Collision checks" },
        { type: "code", lang: "gml", code: "// place_meeting: would I collide at (x,y) with this object? (bool)\nif (place_meeting(x, y + 1, obj_wall)) on_ground = true;\n\n// instance_place: WHICH instance is there? (returns id or noone)\nvar hit = instance_place(x + hsp, y, obj_enemy);\nif (hit != noone) hit.hp -= 10;\n\n// pixel-perfect movement: stop exactly at the wall\nif (place_meeting(x + hsp, y, obj_wall)) {\n    while (!place_meeting(x + sign(hsp), y, obj_wall)) x += sign(hsp);  // inch up to it\n    hsp = 0;\n}\nx += hsp;\n\n// bounding box + area checks\nif (bbox_right > room_width) x = room_width - (bbox_right - x);\nvar c = collision_line(x, y, mouse_x, mouse_y, obj_wall, true, false);  // line-of-sight" },
        { type: "callout", variant: "tip", text: "**Check the destination before you move, not after.** `place_meeting(x + hsp, y, obj_wall)` tests the *future* position while you're still in a valid spot. Moving first and un-embedding later is fiddly and causes jitter. The inch-forward loop above gives clean pixel-perfect stops." },
        { type: "callout", variant: "note", text: "Collisions use each instance's **collision mask** (from its sprite — rectangle, ellipse, or precise per-pixel). Precise masks are accurate but slow; a rectangle mask is far cheaper for lots of instances. `bbox_left/right/top/bottom` expose the current bounding box in room coordinates." }
      ]
    },
    {
      id: "rooms",
      title: "Rooms, layers & cameras",
      level: "core",
      body: [
        { type: "p", text: "A **room** is a level: a set of **layers** (instance, tile, background, asset), a size, and one or more **cameras/views**. You move between rooms with `room_goto`." },
        { type: "code", lang: "gml", code: "// changing rooms\nroom_goto(rm_level_2);\nroom_goto_next();          // next room in the room order\nroom_restart();            // reload the current room\n\n// persistence: a persistent object survives room changes (great for the player/GameController)\n// (toggle 'Persistent' in the object editor, or:)\npersistent = true;\n\n// layers: create/find and put instances on them\nvar lay = layer_get_id(\"Instances\");\ninstance_create_layer(x, y, \"Enemies\", obj_bat);\nlayer_set_visible(\"Background\", false);" },
        { type: "heading", text: "Cameras & following the player" },
        { type: "code", lang: "gml", code: "// get the room's default camera (view 0 must be enabled in room settings)\nvar cam = view_camera[0];\n\n// center the camera on the player each End Step\nvar cw = camera_get_view_width(cam);\nvar ch = camera_get_view_height(cam);\nvar tx = clamp(player.x - cw / 2, 0, room_width  - cw);   // clamp to room edges\nvar ty = clamp(player.y - ch / 2, 0, room_height - ch);\ncamera_set_view_pos(cam, tx, ty);\n\n// or let GameMaker follow automatically:\ncamera_set_view_target(cam, player);   // pass an instance id to auto-follow" },
        { type: "callout", variant: "tip", text: "Do camera-follow in **End Step**, not Step. The player moves during Step (and the engine applies built-in motion after Step); positioning the camera in End Step uses the *final* player position and avoids a one-frame lag/jitter." },
        { type: "callout", variant: "note", text: "**Persistent rooms** remember their state when you leave and return; **persistent objects** carry across every room. A common structure is one persistent `obj_game` controller (score, settings, audio) that lives for the whole session, plus non-persistent gameplay objects per room." }
      ]
    },
    {
      id: "assets",
      title: "Sprites, sound & assets",
      level: "core",
      body: [
        { type: "p", text: "Assets (sprites, sounds, tilesets, fonts) are referenced in code by their **name**, which is really a numeric asset id. You can also look them up by string at runtime." },
        { type: "code", lang: "gml", code: "// sprites\nsprite_index = spr_run;         // switch animation\nimage_speed = 1;                 // animate at normal rate\nimage_number;                    // frame count of the current sprite\nsprite_get_width(spr_run);       // query sprite metadata\n\n// audio\nvar snd_id = audio_play_sound(snd_jump, 10, false);   // sound, priority, loop?\naudio_sound_gain(snd_id, 0.5, 0);        // set volume (0..1), fade over ms\naudio_stop_sound(snd_music);\naudio_play_sound(snd_music, 1, true);    // looping background music\n\n// spatial (positional) audio\naudio_play_sound_at(snd_boom, x, y, 0, 100, 400, 1, false, 5);" },
        { type: "heading", text: "Dynamic asset lookup & loading" },
        { type: "code", lang: "gml", code: "// resolve an asset from a string name (data-driven content)\nvar spr = asset_get_index(\"spr_\" + enemy_type);   // e.g. \"spr_slime\"\nif (spr != -1) sprite_index = spr;\n\n// load an external image at runtime (returns a new sprite, must be freed later)\nvar dyn = sprite_add(\"portrait.png\", 1, false, false, 0, 0);\n// ... use it ...\nsprite_delete(dyn);              // free it when done (dynamically-added sprites aren't auto-freed)" },
        { type: "callout", variant: "note", text: "Built-in assets bundled with the project are managed by the engine — you never free `spr_player`. But resources you create at runtime (`sprite_add`, surfaces, buffers, `ds_*`) are **yours to free** (`sprite_delete`, `surface_free`, `buffer_delete`). Do it in the **Clean Up** event so it runs even when the instance is destroyed." },
        { type: "callout", variant: "tip", text: "Referencing assets by string (`asset_get_index`) plus a naming convention (`spr_<type>`, `snd_<name>`) lets you drive content from data (JSON/CSV) instead of a giant `switch` — the backbone of data-driven enemy/item systems." }
      ]
    },
    {
      id: "random-timing",
      title: "Randomness, timing & alarms",
      level: "core",
      body: [
        { type: "p", text: "GameMaker gives you a family of RNG helpers, frame-based **alarms** for timers, and `delta_time` for frame-rate awareness." },
        { type: "code", lang: "gml", code: "// randomness\nrandom(10);              // real in [0, 10)\nirandom(10);             // integer in [0, 10]  (inclusive!)\nrandom_range(2, 5);      // real in [2, 5)\nirandom_range(1, 6);     // integer in [1, 6]  (a dice roll)\nchoose(\"a\", \"b\", \"c\");   // pick one argument at random\n\n// seed the RNG once, at game start, or every run is identical:\nrandomize();             // new random seed\nrandom_set_seed(12345);  // fixed seed -> reproducible (great for tests/seeded runs)" },
        { type: "heading", text: "Alarms & timers" },
        { type: "code", lang: "gml", code: "// alarm[i] counts DOWN by 1 each step; at 0 it fires the Alarm i event, then stops.\n// Create event:\nalarm[0] = room_speed;        // fire Alarm 0 in ~1 second (room_speed = fps, default 60)\n\n// Alarm 0 event:\nspawn_wave();\nalarm[0] = room_speed * 3;    // re-arm to repeat every 3 seconds\n\n// modern alternative: time sources (real-time, not tied to steps)\nvar ts = time_source_create(time_source_game, 2, time_source_units_seconds,\n                            function() { show_debug_message(\"2s passed\"); });\ntime_source_start(ts);\n\n// one-off deferred call\ncall_later(90, time_source_units_frames, function() { open_door(); });" },
        { type: "heading", text: "Frame rate & delta time" },
        { type: "list", items: [
          "**`room_speed` / `game_get_speed`** — the target frames per second (default 60). Alarms and `image_speed` count in *frames*, so they scale with this.",
          "**`delta_time`** — microseconds elapsed since the last frame. Multiply movement by `delta_time / 1000000` for frame-rate-independent motion.",
          "**`fps` / `fps_real`** — the actual achieved frame rate (`fps_real` = uncapped potential)."
        ] },
        { type: "callout", variant: "gotcha", text: "**`irandom(n)` is inclusive** — `irandom(3)` returns 0, 1, 2, *or* 3 (four outcomes). `random(n)` is exclusive of `n` and returns a real. And **call `randomize()` once** (in a controller's Create) — without it every playthrough uses the same default seed and your \"random\" level is identical every time." }
      ]
    },
    {
      id: "advanced",
      title: "Advanced: serialization, surfaces, shaders, particles, buffers",
      level: "deep",
      body: [
        { type: "p", text: "The systems you reach for once the game works: saving data, off-screen rendering, GPU shaders, particle effects, and raw binary buffers." },
        { type: "heading", text: "Serialization & saving (JSON, buffers, ini)" },
        { type: "code", lang: "gml", code: "// modern JSON: works directly on structs/arrays\nvar save = { level: 3, hp: 80, inventory: [\"sword\", \"key\"] };\nvar text = json_stringify(save);        // struct/array -> string\nvar loaded = json_parse(text);          // string -> struct/array\nshow_debug_message(loaded.inventory[0]); // -> \"sword\"\n\n// persist a save file with buffers (works on every platform incl. HTML5/console)\nvar buff = buffer_create(1, buffer_grow, 1);\nbuffer_write(buff, buffer_text, json_stringify(save));\nbuffer_save(buff, \"save.dat\");\nbuffer_delete(buff);                    // free it (buffers are manual memory)\n\n// small key/value settings -> .ini is simplest\nini_open(\"settings.ini\");\nini_write_real(\"audio\", \"volume\", 0.8);\nvar vol = ini_read_real(\"audio\", \"volume\", 1);\nini_close();                            // MUST close to actually write" },
        { type: "heading", text: "Surfaces (off-screen render targets)" },
        { type: "code", lang: "gml", code: "// draw to a surface, then draw the surface — used for lighting, minimaps, effects\nif (!surface_exists(surf)) surf = surface_create(320, 180);   // recreate if freed!\nsurface_set_target(surf);\n    draw_clear_alpha(c_black, 0);\n    draw_circle_color(lx, ly, 64, c_white, c_black, false);   // a light\nsurface_reset_target();\ndraw_surface(surf, 0, 0);" },
        { type: "heading", text: "Shaders (GLSL ES)" },
        { type: "code", lang: "gml", code: "// in the Draw event: set a shader, pass uniforms, draw, then reset\nshader_set(sh_flash);\nvar u_amount = shader_get_uniform(sh_flash, \"u_amount\");\nshader_set_uniform_f(u_amount, flash_amount);   // pass a float to the fragment shader\ndraw_self();\nshader_reset();                                 // ALWAYS reset or everything else uses it" },
        { type: "heading", text: "Particles" },
        { type: "code", lang: "gml", code: "// a particle system: system -> type -> emit\nps = part_system_create();\npt = part_type_create();\npart_type_shape(pt, pt_shape_spark);\npart_type_size(pt, 0.5, 1.5, -0.02, 0);\npart_type_speed(pt, 2, 6, 0, 0);\npart_type_life(pt, 20, 40);\n// emit a burst at (x,y)\npart_particles_create(ps, x, y, pt, 25);\n// free in Clean Up: part_type_destroy(pt); part_system_destroy(ps);" },
        { type: "callout", variant: "warn", text: "**Surfaces are volatile.** The OS can free a surface at any time (alt-tab, resolution change), leaving a dangling handle. *Every* frame, guard with `if (!surface_exists(surf)) surf = surface_create(...)` before drawing to it — code that assumes a surface still exists crashes randomly on players' machines." },
        { type: "callout", variant: "note", text: "Buffers, surfaces, particle systems/types, `ds_*`, and dynamically-added sprites are all **manual memory**. Structs and arrays are garbage-collected; these are not. Track them and free them (usually in **Clean Up**) or you leak for the whole session. This is the through-line of every GML gotcha: know what you own." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite GML developers. Most trace back to two facts: scope is decided by how you declare a variable, and several resource types are not garbage-collected." },
        { type: "heading", text: "1. Forgetting var (accidental instance/global variables)" },
        { type: "callout", variant: "gotcha", text: "A bare `speed = 4;` in a Step event creates/overwrites an *instance* variable — and `speed` is a built-in that moves the instance. Anything temporary must be `var`. Un-`var`'d temps also leak onto the instance and can silently clobber built-ins (`speed`, `direction`, `image_index`)." },
        { type: "heading", text: "2. ds_* memory leaks" },
        { type: "callout", variant: "warn", text: "`ds_list_create()` / `ds_map_create()` return handles to memory you own. No `ds_*_destroy()` = a leak for the whole session. Free them in the **Clean Up** event (fires even on `instance_destroy`). Prefer **arrays/structs**, which *are* garbage-collected, unless you truly need a `ds_grid`/`ds_priority`." },
        { type: "heading", text: "3. Arrays & structs are references, not copies" },
        { type: "callout", variant: "gotcha", text: "Modern GML passes arrays and structs **by reference**. `var b = a;` (both arrays) makes `b` point at the *same* array — mutating `b` mutates `a`. To get an independent copy use `array_clone(a)` / `array_copy(...)` or `variable_clone(struct)`. (Old pre-2.3 runtimes used copy-on-write, so legacy tutorials assume the opposite — don't trust them.)" },
        { type: "heading", text: "4. Drawing outside the Draw event / logic inside it" },
        { type: "callout", variant: "gotcha", text: "`draw_*` functions do nothing outside a Draw event. Conversely, putting movement/timers/state in Draw couples logic to rendering (and it won't run if the instance isn't drawn). **Logic → Step; drawing → Draw.** And once you add any Draw event, call `draw_self()` or the sprite vanishes." },
        { type: "heading", text: "5. with scope confusion (self vs other)" },
        { type: "callout", variant: "gotcha", text: "Inside `with (target)`, **`self` is the target**, and **`other`** is the instance that ran the `with`. `with (obj_enemy) { hp -= 10; }` hits each enemy's `hp`, not the caller's. Reach back to the caller via `other.` — this trips up everyone the first time." },
        { type: "heading", text: "6. image_speed is frame-rate dependent" },
        { type: "callout", variant: "warn", text: "`image_speed` advances the animation per *game frame*, so at a higher `room_speed` animations play faster (and slower during frame drops). For consistent animation timing set the sprite's speed to *frames per second* in the sprite editor, or drive `image_index` yourself scaled by `delta_time`." },
        { type: "heading", text: "7. Uninitialized variable errors" },
        { type: "callout", variant: "gotcha", text: "Reading an instance variable you never assigned is a **runtime crash** (\"variable not set before reading it\"), not `undefined`. Initialise every instance variable in the **Create** event. The **Feather** linter flags this before you run. Guard optional ones with `variable_instance_exists(id, \"name\")`." },
        { type: "heading", text: "8. == vs = and real-vs-string comparison" },
        { type: "callout", variant: "gotcha", text: "In a condition, `=` also works as comparison in GML (`if (x = 5)` compiles), which hides real bugs — always use `==` for comparison and `=` for assignment. Also `\"5\" == 5` is **false**: strings never equal reals. Convert with `real(str)` / `string(num)` before comparing." },
        { type: "heading", text: "9. Instance execution order isn't guaranteed" },
        { type: "callout", variant: "note", text: "The order instances run their Step events is *not* something to rely on (roughly creation order, but it can change). Don't write logic that assumes enemy A steps before enemy B. If order matters, drive it explicitly from one controller with a `with`/loop, or use Begin/End Step to sequence phases." },
        { type: "heading", text: "10. Deactivated instances go invisible to your code" },
        { type: "callout", variant: "note", text: "`instance_deactivate_*` freezes instances so they don't run events, draw, or appear in `with`/`instance_exists`/collision checks. Handy for big worlds, but a deactivated boss *looks* destroyed to your logic. Track deactivated instances deliberately and reactivate with `instance_activate_region`/`instance_activate_object`." },
        { type: "heading", text: "11. Delta time vs the fixed step" },
        { type: "callout", variant: "tip", text: "GameMaker runs a **fixed step** (default 60fps), so most 2D games can safely move in constant per-frame amounts (`x += 4`). If you target variable frame rates, multiply by `delta_time/1000000` — but then alarms (frame-based) and per-frame `image_speed` no longer line up with real time, so pick one model and be consistent." }
      ]
    }
  ],

  packages: [
    { name: "GameMaker IDE", why: "the editor: object/event editors, code editor, and the F5 run / F6 debug loop where all GML is written" },
    { name: "GMRT runtime (2026 beta)", why: "next-gen GameMaker Runtime via the Package Manager; adds first-class JS/TS and C# interop alongside GML" },
    { name: "VM runtime", why: "bytecode interpreter — fast builds, the default for day-to-day iteration" },
    { name: "YYC (YoYo Compiler)", why: "transpiles GML to C++ then native code for faster release builds and profiling" },
    { name: "GM-CLI", why: "2026 command-line toolchain to build/run projects without opening the IDE (CI, automation)" },
    { name: "The debugger", why: "breakpoints, variable watches, live per-instance inspection, step-through (F6)" },
    { name: "Sprite editor", why: "authors sprites, animation subimages, origins, and collision masks used by draw_* and collisions" },
    { name: "Room editor", why: "lays out rooms, layers (instance/tile/background), tilesets, and camera/view settings" },
    { name: "Audio system", why: "audio_play_sound / gain / positional 3D audio; the runtime's sound engine" },
    { name: "ds_* library", why: "list/map/grid/stack/queue/priority structures — manual-memory collections for specific needs" },
    { name: "struct & array system", why: "the modern garbage-collected data model: literals, constructors (new), method variables" },
    { name: "Buffers", why: "raw binary read/write for save files, networking, and cross-platform serialization" },
    { name: "Shaders (GLSL ES)", why: "vertex/fragment programs for GPU effects; shader_set / uniforms / shader_reset" },
    { name: "Feather", why: "built-in static analyser/linter: catches uninitialized vars, type mismatches, and code smells before runtime" },
    { name: "GX.games export", why: "one-click WASM build playable in-browser on Opera GX's game portal" },
    { name: "Marketplace & extensions", why: "third-party assets, tools, and native extensions (platform SDKs, plugins) to extend the engine" }
  ],

  gotchas: [
    "**Forgetting `var`:** a bare `speed = 4;` creates/overwrites an *instance* variable (and `speed` is a built-in that moves the instance). Use `var` for anything temporary.",
    "**ds_* leak:** `ds_*_create()` is manual memory — always call the matching `ds_*_destroy()` (in Clean Up). Prefer garbage-collected arrays/structs where you can.",
    "**Arrays/structs are references:** `b = a` shares the same array; mutating `b` mutates `a`. Use `array_clone`/`variable_clone` for an independent copy. (Old runtimes were copy-on-write — legacy tutorials mislead.)",
    "**`with` flips scope:** inside `with (target)`, `self` is the target and `other` is the caller. `with (obj_enemy) { hp -= 10; }` hits each enemy, not the runner.",
    "**Draw event stops auto-drawing:** add any Draw event and the sprite disappears unless you call `draw_self()`. And `draw_*` does nothing outside a Draw event.",
    "**Logic in Draw:** movement/timers belong in Step; Draw is for rendering only (it's coupled to the render pass and skipped when not drawn).",
    "**Uninitialized variable = crash:** reading an unset instance variable throws at runtime, not `undefined`. Initialise everything in Create; Feather warns you.",
    "**`=` works as comparison in conditions:** `if (x = 5)` compiles — always use `==` to compare. And `\"5\" == 5` is false; strings never equal reals.",
    "**Strings are 1-indexed** but arrays are 0-indexed — `string_char_at(s, 1)` is the first char; loop strings `for (i = 1; i <= len; i++)`.",
    "**`irandom(n)` is inclusive** (`irandom(3)` -> 0..3), `random(n)` is exclusive of n and returns a real. Call `randomize()` once or every run is identical.",
    "**`keyboard_check` vs `_pressed`:** `check` is true every frame held (continuous), `check_pressed` fires once (one-shot actions like jump/fire).",
    "**Number + string won't coerce:** `\"Score: \" + n` throws — wrap numbers in `string(n)` when concatenating.",
    "**`image_speed` is frame-rate dependent:** higher `room_speed` plays animations faster. Set the sprite's speed in fps, or drive `image_index` with delta time.",
    "**Surfaces are volatile:** the OS can free them anytime — guard every use with `if (!surface_exists(s)) s = surface_create(...)`.",
    "**Deactivated instances vanish from code:** `instance_deactivate_*` hides them from `with`/`instance_exists`/collisions; track and reactivate deliberately.",
    "**Instance step order isn't guaranteed:** don't assume enemy A steps before enemy B; sequence explicitly from a controller or via Begin/End Step.",
    "**#macro isn't a variable:** it's compile-time text with no scope and can't be reassigned; use `global.` for runtime-changeable shared state.",
    "**Free what you create at runtime:** `sprite_add`, `buffer_create`, `part_system_create`, `ds_*_create` are yours to free (in Clean Up) — only built-in assets are auto-managed."
  ],

  flashcards: [
    { q: "The three variable scopes in GML?", a: "**Local** `var x = 4;` (event only), **instance** `hp = 100;` (persists on the instance across frames), **global** `global.score = 0;` (shared by the whole game)." },
    { q: "What does `with (target) { ... }` do, and what is `self`/`other` inside it?", a: "Runs the block in the scope of the target (an object = every instance of it, or a single id). Inside, `self` is the **target**; `other` is the instance that ran the `with`." },
    { q: "Why does adding a Draw event make the sprite disappear?", a: "With no Draw event, GameMaker auto-draws `sprite_index`. Any Draw event replaces that — you must call `draw_self()` (or a `draw_sprite`) yourself." },
    { q: "Arrays/structs: value or reference semantics in modern GML?", a: "**Reference.** `b = a` shares the same array/struct; mutating one mutates the other. Copy with `array_clone`/`variable_clone`. (Pre-2.3 was copy-on-write.)" },
    { q: "ds_* vs arrays/structs — the key difference?", a: "`ds_*` are **manual memory** (create returns a handle; you must `ds_*_destroy`). Arrays and structs are **garbage-collected**. Prefer arrays/structs unless you need a specific ds structure." },
    { q: "`keyboard_check` vs `keyboard_check_pressed`?", a: "`check` is true **every frame** the key is held (continuous movement); `check_pressed` fires **once** when it goes down (jump, fire, confirm)." },
    { q: "Order of the main events in one frame?", a: "Begin Step → Alarms/input events → Step → engine applies built-in movement → End Step → Draw (Begin/Draw/End) → Draw GUI." },
    { q: "Draw vs Draw GUI event?", a: "**Draw** renders in room space (scrolls with the camera). **Draw GUI** renders in screen space (fixed HUD at `0,0` top-left), ideal for score/health bars/menus." },
    { q: "What is a constructor in GML and how do you use it?", a: "`function Vec2(_x,_y) constructor { x=_x; y=_y; add=function(o){...}; }` — a struct blueprint built with `new Vec2(1,2)`. Supports methods, `static`, and `: Parent()` inheritance." },
    { q: "How do method variables work?", a: "A `function` value stored in a variable: `on_die = function() {...}; on_die();`. `method(scope, fn)` binds it to a scope; you can pass them as callbacks (e.g. `array_foreach`)." },
    { q: "`div` vs `/` vs `mod`?", a: "`/` always gives a real (`17/5 = 3.4`); `div` is integer division (`17 div 5 = 3`); `mod` (or `%`) is the remainder (`17 mod 5 = 2`)." },
    { q: "How do alarms work?", a: "`alarm[i] = n;` counts down 1 per step; at 0 it fires the object's Alarm i event once. Re-arm inside the alarm to repeat. `room_speed` steps ≈ 1 second at 60fps." },
    { q: "`instance_create_layer` vs `instance_create_depth`?", a: "Both spawn an instance and return its `id`. `_layer` places it on a named layer (`\"Instances\"`); `_depth` places it at a numeric depth. Configure via the returned id." },
    { q: "How do you save game data in modern GML?", a: "`json_stringify(struct)` -> text, `json_parse(text)` -> struct. Persist with a **buffer** (`buffer_save`) for cross-platform, or `.ini` for small key/value settings." },
    { q: "How do object parents (inheritance) behave?", a: "A child inherits the parent's events unless it overrides them; `event_inherited()` runs the parent's version. A collision/`with` against the parent matches **all** children." },
    { q: "Why `randomize()` and the difference between `random` and `irandom`?", a: "Without `randomize()` every run uses the same seed (identical 'random' results). `random(n)` = real in `[0,n)`; `irandom(n)` = integer in `[0,n]` **inclusive**." },
    { q: "Where should camera-follow code go and why?", a: "**End Step** — it runs after the player's Step and the engine's built-in movement, so it uses the final position and avoids a one-frame lag/jitter." },
    { q: "What makes surfaces dangerous?", a: "They're **volatile** — the OS can free them anytime (alt-tab, resolution change), leaving a dangling handle. Guard every use with `if (!surface_exists(s)) s = surface_create(...)`." }
  ],

  cheatsheet: [
    { label: "Local / instance / global", code: "var t = 4;   hp = 100;   global.score = 0;" },
    { label: "Macro & enum", code: "#macro MAX 8\nenum State { idle, walk, dead }" },
    { label: "with (iterate instances)", code: "with (obj_enemy) { hp -= 10; if (hp <= 0) instance_destroy(); }" },
    { label: "Spawn + configure", code: "var e = instance_create_layer(x, y, \"Enemies\", obj_enemy); e.hp = 30;" },
    { label: "Struct literal", code: "var p = { name: \"Hero\", hp: 100 };  p.hp -= 10;" },
    { label: "Constructor + new", code: "function Vec2(_x,_y) constructor { x=_x; y=_y; }\nvar v = new Vec2(3, 4);" },
    { label: "Method variable", code: "on_die = function() { instance_create_layer(x,y,\"FX\",obj_boom); };  on_die();" },
    { label: "Array basics", code: "var a = [1,2,3]; array_push(a, 4); array_length(a);" },
    { label: "ds_list (free it!)", code: "var l = ds_list_create(); ds_list_add(l, 1); ds_list_destroy(l);" },
    { label: "Held vs pressed input", code: "if (keyboard_check(vk_right)) x += 4;\nif (keyboard_check_pressed(ord(\"Z\"))) jump();" },
    { label: "Check-then-move collision", code: "if (!place_meeting(x + hsp, y, obj_wall)) x += hsp; else hsp = 0;" },
    { label: "Draw sprite + text", code: "draw_self();  draw_text(x, y-20, \"HP: \" + string(hp));" },
    { label: "Draw GUI (HUD)", code: "// Draw GUI event\ndraw_text(20, 20, \"Score: \" + string(global.score));" },
    { label: "Alarm timer", code: "alarm[0] = room_speed * 2;   // Alarm 0 fires in 2s, re-arm inside it" },
    { label: "Random (seed once)", code: "randomize();  var roll = irandom_range(1, 6);  choose(\"a\",\"b\",\"c\");" },
    { label: "Camera follow (End Step)", code: "camera_set_view_pos(view_camera[0], player.x - 160, player.y - 90);" },
    { label: "JSON save/load", code: "var s = json_stringify(data);  var d = json_parse(s);" },
    { label: "Change room", code: "room_goto(rm_level_2);   // or room_goto_next();" }
  ]
});
