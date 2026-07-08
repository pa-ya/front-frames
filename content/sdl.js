(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "sdl",
  name: "SDL",
  language: "C++",
  group: "Game dev",
  navLabel: "SDL (C++)",
  color: "#1d6fb8",
  readMinutes: 34,
  tagline: "The cross-platform C/C++ layer under **Valve/Steam**, emulators, and countless shipped games — windowing, input, audio, and **GPU-accelerated 2D rendering**. SDL hands you the raw pixels and the event queue; **you own the game loop**. This deck targets **SDL3** (the current stable release) and flags every place SDL2 tutorials will trip you.",

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "**SDL (Simple DirectMedia Layer)** is a C library (with a first-class C++ story) that abstracts the platform: it creates a window, gives you a **GPU-accelerated 2D renderer**, drains an **event queue** (keyboard, mouse, gamepad, touch, window), opens **audio devices**, reads the filesystem, timers, threads, and more — identically on Windows, macOS, Linux, iOS, Android, and the web. It is the plumbing under Valve's Steam client and Steam Deck, most console ports, and emulators (RetroArch, Dolphin, PCSX2). Godot, and many custom engines, build on it." },
        { type: "p", text: "Like pygame (which *wraps* SDL), SDL is deliberately **not an engine**: no scene graph, no ECS, no physics, no asset pipeline, no editor. It gives you a **render target you draw onto** and an **event queue you poll**, and gets out of the way. **You write the loop.** That is the whole appeal — total control, tiny conceptual surface, and C-level performance. Everything above (sprites, collision, cameras, state machines) you build yourself or pull from small libraries." },
        { type: "table", headers: ["SDL IS", "SDL is NOT"], rows: [
          ["A window + a GPU `SDL_Renderer`", "An engine with a scene graph / ECS"],
          ["An event queue + input state", "A physics engine (bring Box2D / roll AABB)"],
          ["An audio device + SDL_mixer", "A GUI toolkit (use Dear ImGui for debug UI)"],
          ["Image / font / timer helpers", "A level editor (author in Tiled, load yourself)"],
          ["Cross-platform C ABI, permissive **zlib** license", "A managed runtime — you manage lifetimes"]
        ] },
        { type: "callout", variant: "note", text: "SDL3 is **zlib-licensed** (permissive, same as before): link it statically or dynamically, ship commercial games, no royalties. The extension libs (SDL_image/ttf/mixer) are also zlib." },
        { type: "callout", variant: "tip", text: "**Want the friendlier object-oriented alternative? Reach for SFML.** SFML wraps the same territory (window/graphics/audio/input) in clean C++ classes (`sf::RenderWindow`, `sf::Sprite`, `sf::Texture`, `sf::Music`) with RAII lifetimes and no manual `SDL_Destroy*`. It is lovely for learning and jams. SDL wins on **reach** (consoles, mobile, web, Steam Deck), battle-tested input/audio, a massive ecosystem, and being the industry-standard C layer. Learn SDL to ship broadly; pick SFML if you want ergonomics over reach." }
      ]
    },
    {
      id: "sdl3-vs-sdl2",
      title: "SDL3 vs SDL2 — read this before any tutorial",
      level: "core",
      body: [
        { type: "p", text: "SDL3 shipped in 2025 and is the current stable release. **The overwhelming majority of tutorials, StackOverflow answers, and books are still SDL2**, and SDL3 renamed a *huge* number of symbols. If you copy SDL2 code it will not compile against SDL3. Know the systematic renames and you can translate on sight." },
        { type: "table", headers: ["Concept", "SDL2", "SDL3"], rows: [
          ["Window create", "`SDL_CreateWindow(title,x,y,w,h,flags)`", "`SDL_CreateWindow(title,w,h,flags)` — **no position**"],
          ["Renderer create", "`SDL_CreateRenderer(win,idx,flags)`", "`SDL_CreateRenderer(win,name)` — no index/flags"],
          ["Draw a texture", "`SDL_RenderCopy(r,tex,src,dst)`", "`SDL_RenderTexture(r,tex,src,dst)` — **`SDL_FRect`**"],
          ["Rotated draw", "`SDL_RenderCopyEx(...)`", "`SDL_RenderTextureRotated(...)`"],
          ["Dest rect type", "`SDL_Rect` (ints)", "`SDL_FRect` (floats) for render ops"],
          ["Quit event", "`SDL_QUIT`", "`SDL_EVENT_QUIT`"],
          ["Key down event", "`SDL_KEYDOWN`", "`SDL_EVENT_KEY_DOWN`"],
          ["Key field", "`event.key.keysym.sym`", "`event.key.key` (and `.scancode`, `.down`)"],
          ["Error-return funcs", "`int` (`0` ok, `<0` fail)", "**`bool`** (`true` ok, `false` fail)"],
          ["Keyboard state", "`const Uint8*`", "`const bool*` from `SDL_GetKeyboardState`"],
          ["Gamepad API", "`SDL_GameController*`", "`SDL_Gamepad*` (`SDL_INIT_GAMEPAD`)"],
          ["Logical size", "`SDL_RenderSetLogicalSize`", "`SDL_SetRenderLogicalPresentation`"]
        ] },
        { type: "callout", variant: "gotcha", text: "**The single biggest headache in this whole deck:** you follow a 2020 SDL2 tutorial, `SDL_RenderCopy` and `SDL_QUIT` don't exist, and half the signatures are wrong. Prefer SDL3-native learning resources (**Lazy Foo's SDL3 series**, the **official migration guide** `README-migration`, and studyplan.dev's SDL3 course). SDL ships `build-scripts/rename_symbols.py` to auto-port SDL2 source." },
        { type: "callout", variant: "note", text: "The extension libraries got a matching major bump and are now named **SDL3_image**, **SDL3_ttf**, **SDL3_mixer** (headers `<SDL3_image/SDL_image.h>` etc.). SDL3_mixer 3.0 is a **complete API redesign** (`MIX_*`), not just a rename — covered in the audio section." }
      ]
    },
    {
      id: "setup",
      title: "Setup & build with CMake",
      level: "core",
      body: [
        { type: "p", text: "The modern, portable way to build an SDL app is **CMake**. Two supply strategies: **`find_package(SDL3)`** (SDL installed system-wide or via vcpkg/Conan/your package manager) or **`FetchContent`** (CMake clones and builds SDL from source as part of your build — zero external install, reproducible, great for CI and for pinning a version)." },
        { type: "heading", text: "A complete minimal CMakeLists.txt (FetchContent)" },
        { type: "code", lang: "cpp", code: "cmake_minimum_required(VERSION 3.16)\nproject(MyGame LANGUAGES CXX)\n\nset(CMAKE_CXX_STANDARD 20)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\ninclude(FetchContent)\nFetchContent_Declare(\n  SDL3\n  GIT_REPOSITORY https://github.com/libsdl-org/SDL.git\n  GIT_TAG release-3.2.0        # pin a real release tag, not main\n)\nFetchContent_MakeAvailable(SDL3)\n\n# extension libs the same way (each FetchContent_Declare + MakeAvailable):\n#   SDL3_image, SDL3_ttf, SDL3_mixer\n\nadd_executable(MyGame src/main.cpp)\n\n# SDL3::SDL3 pulls in headers + the right link flags for every platform.\n# SDL3::SDL3main / the SDL_main shim is folded into this target in SDL3.\ntarget_link_libraries(MyGame PRIVATE SDL3::SDL3)\n# add: SDL3_image::SDL3_image SDL3_ttf::SDL3_ttf SDL3_mixer::SDL3_mixer" },
        { type: "code", lang: "cpp", code: "// find_package variant — swap the FetchContent block for:\nfind_package(SDL3 REQUIRED CONFIG)\n// then the SAME target_link_libraries(MyGame PRIVATE SDL3::SDL3)\n// install SDL first: vcpkg install sdl3   |   brew install sdl3   |   apt/pacman" },
        { type: "code", lang: "bash", code: "cmake -S . -B build -DCMAKE_BUILD_TYPE=Release\ncmake --build build -j\n./build/MyGame        # Windows: build\\Release\\MyGame.exe" },
        { type: "heading", text: "SDL_main: why you must include SDL_main.h" },
        { type: "p", text: "SDL needs to sit **in front of your `main`** on some platforms (Windows uses `WinMain`; macOS/iOS/Android need bootstrap). In SDL3 you get this by including `<SDL3/SDL_main.h>` in **exactly one** translation unit — the one with `main` (or with the callbacks). Your entry point must be the canonical `int main(int argc, char* argv[])` — a bare `int main()` will fail to link the SDL_main shim on Windows." },
        { type: "code", lang: "cpp", code: "#include <SDL3/SDL.h>\n#include <SDL3/SDL_main.h>   // include in the ONE file that defines main / callbacks\n\nint main(int argc, char* argv[]) {   // must be this exact signature\n    // ...\n    return 0;\n}" },
        { type: "callout", variant: "warn", text: "In SDL3 the header is `<SDL3/SDL_main.h>` and it is **no longer pulled in automatically by `<SDL3/SDL.h>`** — you include it yourself. Forgetting it gives a linker error about `SDL_main`/`WinMain` on Windows (works fine on Linux, so it ambushes you at ship time)." }
      ]
    },
    {
      id: "init",
      title: "Init & teardown: subsystems",
      level: "core",
      body: [
        { type: "p", text: "`SDL_Init(flags)` boots the subsystems you name (OR the flags together). In SDL3 it returns **`bool`** — `true` on success. `SDL_Quit()` shuts everything down at exit. You only pay for what you init; there is no `SDL_INIT_EVERYTHING` in SDL3, and `SDL_INIT_TIMER` is gone (timers always available). The events subsystem is implied by `VIDEO`, but naming it is harmless." },
        { type: "code", lang: "cpp", code: "if (!SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_GAMEPAD)) {\n    SDL_Log(\"SDL_Init failed: %s\", SDL_GetError());   // note bool: !ok == failure\n    return 1;\n}\n// ... run the game ...\nSDL_Quit();                                            // release everything" },
        { type: "table", headers: ["Flag", "Gives you"], rows: [
          ["`SDL_INIT_VIDEO`", "windows, the renderer, and (implicitly) events"],
          ["`SDL_INIT_AUDIO`", "audio device access (needed for SDL_mixer / audio streams)"],
          ["`SDL_INIT_EVENTS`", "the event queue (implied by VIDEO; name it for clarity)"],
          ["`SDL_INIT_GAMEPAD`", "controllers via the `SDL_Gamepad` API (was `SDL_INIT_GAMECONTROLLER`)"],
          ["`SDL_INIT_JOYSTICK`", "raw joysticks (implied by GAMEPAD)"],
          ["`SDL_INIT_HAPTIC`", "force-feedback / rumble devices"]
        ] },
        { type: "callout", variant: "note", text: "You can init subsystems late with `SDL_InitSubSystem(flags)` and tear one down with `SDL_QuitSubSystem(flags)`. Every SDL failure sets a thread-local error string — **always read `SDL_GetError()`** when a `bool` comes back `false` or a pointer comes back `NULL`. That string is your single best debugging tool." }
      ]
    },
    {
      id: "window-renderer",
      title: "Window, renderer & the draw loop",
      level: "core",
      body: [
        { type: "p", text: "Create a **window** and a **renderer** (the GPU-backed 2D drawing context bound to that window). In SDL3 `SDL_CreateWindow` dropped the x/y position args, and `SDL_CreateRenderer` takes just the window and an optional driver *name* (`nullptr` = let SDL pick the best: Direct3D/Metal/Vulkan/OpenGL). There is a one-shot convenience, `SDL_CreateWindowAndRenderer`, that makes both." },
        { type: "code", lang: "cpp", code: "SDL_Window*   window   = nullptr;\nSDL_Renderer* renderer = nullptr;\n\n// one call for both (title, w, h, window-flags, out-window, out-renderer)\nif (!SDL_CreateWindowAndRenderer(\"My Game\", 1280, 720,\n                                 SDL_WINDOW_RESIZABLE, &window, &renderer)) {\n    SDL_Log(\"create failed: %s\", SDL_GetError());\n    return 1;\n}\n\n// or the two-step form:\n// window   = SDL_CreateWindow(\"My Game\", 1280, 720, SDL_WINDOW_RESIZABLE);\n// renderer = SDL_CreateRenderer(window, nullptr);   // nullptr = best driver\n\nSDL_SetRenderVSync(renderer, 1);   // 1 = sync to monitor refresh (no tearing)" },
        { type: "heading", text: "The render loop: clear -> draw -> present" },
        { type: "p", text: "Every frame you (1) set the clear color and **`SDL_RenderClear`** to wipe the back buffer, (2) issue draw calls, (3) **`SDL_RenderPresent`** to flip it to the screen. Colors are 0-255 per channel. This is double-buffered — nothing is visible until you present." },
        { type: "code", lang: "cpp", code: "// inside the game loop, once per frame:\nSDL_SetRenderDrawColor(renderer, 20, 22, 30, 255);   // RGBA\nSDL_RenderClear(renderer);                            // wipe last frame\n\n// draw calls go here (textures, primitives) ...\nSDL_SetRenderDrawColor(renderer, 240, 200, 60, 255);\nSDL_FRect box{ 100.0f, 100.0f, 64.0f, 64.0f };        // x, y, w, h (floats!)\nSDL_RenderFillRect(renderer, &box);\n\nSDL_RenderPresent(renderer);                          // show the finished frame" },
        { type: "heading", text: "Logical presentation (resolution-independent rendering)" },
        { type: "p", text: "Design your game for one fixed logical resolution (say 640x360) and let SDL scale it to whatever the window/monitor is — with letterboxing, integer scaling, or stretch. Call **`SDL_SetRenderLogicalPresentation`** once; then you draw in logical coordinates forever and it Just Works on a 4K monitor or a phone." },
        { type: "code", lang: "cpp", code: "SDL_SetRenderLogicalPresentation(renderer, 640, 360,\n                                 SDL_LOGICAL_PRESENTATION_LETTERBOX);\n// modes: _DISABLED, _STRETCH, _LETTERBOX, _OVERSCAN, _INTEGER_SCALE\n// map a physical mouse coord back into logical space when you need it:\nfloat lx, ly;\nSDL_RenderCoordinatesFromWindow(renderer, mouse_x, mouse_y, &lx, &ly);" },
        { type: "callout", variant: "gotcha", text: "**Forgetting `SDL_RenderPresent` = a black (or never-updating) window** — the #1 'nothing shows' bug, exactly like forgetting `flip()` in pygame. And clean up in reverse order at exit: `SDL_DestroyRenderer(renderer); SDL_DestroyWindow(window); SDL_Quit();`" }
      ]
    },
    {
      id: "game-loop",
      title: "The game loop: timing & delta time",
      level: "core",
      body: [
        { type: "p", text: "SDL gives you no loop — you write it, and it is the heart of the program: **(1) drain events, (2) update state, (3) render, (4) present**, forever, until a quit is requested. The only subtlety is *timing*: move things by **units per second × delta time**, never a fixed number of pixels per frame, or your game speed follows the monitor's refresh rate." },
        { type: "code", lang: "cpp", code: "bool running = true;\nUint64 last = SDL_GetTicks();   // milliseconds since SDL_Init (Uint64 in SDL3)\n\nwhile (running) {\n    Uint64 now = SDL_GetTicks();\n    float dt = (now - last) / 1000.0f;   // seconds since last frame\n    last = now;\n    if (dt > 0.05f) dt = 0.05f;          // clamp spikes (window drag, stall)\n\n    // 1) EVENTS\n    SDL_Event e;\n    while (SDL_PollEvent(&e)) {\n        if (e.type == SDL_EVENT_QUIT) running = false;\n    }\n\n    // 2) UPDATE (frame-rate independent)\n    const bool* keys = SDL_GetKeyboardState(nullptr);\n    if (keys[SDL_SCANCODE_RIGHT]) player_x += 300.0f * dt;   // px/second\n    if (keys[SDL_SCANCODE_LEFT])  player_x -= 300.0f * dt;\n\n    // 3) RENDER  4) PRESENT\n    SDL_SetRenderDrawColor(renderer, 18, 18, 24, 255);\n    SDL_RenderClear(renderer);\n    // ... draw ...\n    SDL_RenderPresent(renderer);   // with VSync on, this paces the loop to refresh\n}" },
        { type: "heading", text: "High-precision timing & the fixed-timestep accumulator" },
        { type: "p", text: "`SDL_GetTicks()` is millisecond resolution; for tighter measurement use the **performance counter** (`SDL_GetPerformanceCounter` / `SDL_GetPerformanceFrequency`). For deterministic physics (networking, replays, stable collision) you want a **fixed timestep**: accumulate real elapsed time and step the simulation in constant 1/60 s chunks, rendering with whatever leftover time remains. This is the classic 'Fix Your Timestep' pattern." },
        { type: "code", lang: "cpp", code: "const double STEP = 1.0 / 60.0;   // simulate at a fixed 60 Hz\ndouble accumulator = 0.0;\nUint64 prev = SDL_GetPerformanceCounter();\nconst double freq = (double)SDL_GetPerformanceFrequency();\n\nwhile (running) {\n    Uint64 cur = SDL_GetPerformanceCounter();\n    double frame = (cur - prev) / freq;\n    prev = cur;\n    if (frame > 0.25) frame = 0.25;   // avoid the 'spiral of death'\n    accumulator += frame;\n\n    // ... poll events ...\n    while (accumulator >= STEP) {\n        fixed_update(STEP);           // physics: always exactly 1/60 s\n        accumulator -= STEP;\n    }\n    double alpha = accumulator / STEP;   // 0..1 leftover, for interpolated render\n    render(alpha);\n}" },
        { type: "table", headers: ["Approach", "Use when"], rows: [
          ["Variable timestep (`move += v*dt`)", "arcade games, prototypes — simplest, good enough for most"],
          ["Fixed timestep + accumulator", "physics, networking, replays, anything needing determinism"],
          ["VSync paces the loop", "default: `SDL_SetRenderVSync(r,1)` caps to refresh, saves CPU/GPU"]
        ] },
        { type: "callout", variant: "warn", text: "Cap `dt` (e.g. `min(dt, 0.05)`). After a stall — dragging the window, a GC-less-but-long asset load, alt-tab — `dt` balloons and a moving object teleports *through* walls in one frame (tunneling). Clamping keeps collisions sane. If VSync is off, add `SDL_Delay` or a frame cap so you don't spin at 3000 fps burning the GPU." }
      ]
    },
    {
      id: "main-callbacks",
      title: "SDL3 main callbacks (the modern entry point)",
      level: "deep",
      body: [
        { type: "p", text: "SDL3 introduced an alternative to writing your own `main` loop: **main callbacks**. You `#define SDL_MAIN_USE_CALLBACKS` before including `<SDL3/SDL_main.h>` and implement four functions instead of `main`. SDL owns the loop and calls you. **Why it matters:** on the **web (Emscripten)** and on **iOS/Android**, a blocking `while` loop fights the platform's own event loop — callbacks let SDL drive the loop natively on every platform with *identical* code. It is the recommended structure for anything you want to ship to browsers." },
        { type: "code", lang: "cpp", code: "#define SDL_MAIN_USE_CALLBACKS\n#include <SDL3/SDL.h>\n#include <SDL3/SDL_main.h>\n\nstruct AppState { SDL_Window* window; SDL_Renderer* renderer; float x; };\n\n// called ONCE at startup; stash your state via *appstate\nSDL_AppResult SDL_AppInit(void** appstate, int argc, char* argv[]) {\n    if (!SDL_Init(SDL_INIT_VIDEO)) return SDL_APP_FAILURE;\n    auto* s = new AppState{};\n    SDL_CreateWindowAndRenderer(\"Callbacks\", 800, 600, 0, &s->window, &s->renderer);\n    *appstate = s;                 // handed back to every other callback\n    return SDL_APP_CONTINUE;       // CONTINUE keeps running; SUCCESS/FAILURE exit\n}\n\n// called for EACH event (replaces your SDL_PollEvent loop)\nSDL_AppResult SDL_AppEvent(void* appstate, SDL_Event* e) {\n    if (e->type == SDL_EVENT_QUIT) return SDL_APP_SUCCESS;   // clean exit\n    return SDL_APP_CONTINUE;\n}\n\n// called every frame — one iteration of the game loop\nSDL_AppResult SDL_AppIterate(void* appstate) {\n    auto* s = static_cast<AppState*>(appstate);\n    s->x += 1.0f;\n    SDL_SetRenderDrawColor(s->renderer, 18, 18, 24, 255);\n    SDL_RenderClear(s->renderer);\n    SDL_RenderPresent(s->renderer);\n    return SDL_APP_CONTINUE;\n}\n\n// called once on exit (after SUCCESS/FAILURE) — free everything\nvoid SDL_AppQuit(void* appstate, SDL_AppResult result) {\n    delete static_cast<AppState*>(appstate);\n    // SDL_Quit() is called for you after this returns\n}" },
        { type: "table", headers: ["Callback", "When / returns"], rows: [
          ["`SDL_AppInit(void** s, argc, argv)`", "once at startup; return `SDL_APP_CONTINUE` to proceed"],
          ["`SDL_AppEvent(void* s, SDL_Event* e)`", "once per event; return CONTINUE, or SUCCESS/FAILURE to quit"],
          ["`SDL_AppIterate(void* s)`", "once per frame; do update+render, return CONTINUE"],
          ["`SDL_AppQuit(void* s, SDL_AppResult r)`", "once on shutdown; free your state (SDL_Quit runs after)"]
        ] },
        { type: "callout", variant: "gotcha", text: "With `SDL_MAIN_USE_CALLBACKS` defined you must **not** also define `main` — the build will fail (or the callbacks never fire). It is one style or the other. Beginners can absolutely stay with a hand-written `while` loop; adopt callbacks when you target the web or want SDL's native loop integration on mobile." }
      ]
    },
    {
      id: "events-input",
      title: "Events & input: edges vs held state",
      level: "core",
      body: [
        { type: "p", text: "`SDL_PollEvent(&e)` pops one event off the queue (returns `false` when empty), so you drain it in a `while` loop every frame. Events are a **union** — read `e.type` first, then the matching member (`e.key`, `e.button`, `e.motion`, `e.wheel`, `e.gaxis`...). As in pygame, the crucial distinction is **edge vs held**: events fire once on a transition (key pressed, button clicked); **`SDL_GetKeyboardState`** is a snapshot of what is held *right now*." },
        { type: "code", lang: "cpp", code: "SDL_Event e;\nwhile (SDL_PollEvent(&e)) {\n    switch (e.type) {\n        case SDL_EVENT_QUIT:                 // window close / OS quit\n            running = false; break;\n\n        case SDL_EVENT_KEY_DOWN:             // ONE-SHOT: fired on the press edge\n            if (e.key.key == SDLK_SPACE && !e.key.repeat) jump();   // key = keycode\n            if (e.key.scancode == SDL_SCANCODE_ESCAPE) paused = !paused;\n            break;\n\n        case SDL_EVENT_MOUSE_BUTTON_DOWN:\n            if (e.button.button == SDL_BUTTON_LEFT) shoot(e.button.x, e.button.y);\n            break;                           // x/y are floats in SDL3\n        case SDL_EVENT_MOUSE_MOTION:\n            aim(e.motion.x, e.motion.y); break;\n        case SDL_EVENT_MOUSE_WHEEL:\n            zoom += e.wheel.y; break;\n\n        case SDL_EVENT_WINDOW_RESIZED:\n            on_resize(e.window.data1, e.window.data2); break;\n    }\n}\n\n// HELD STATE: poll every frame, OUTSIDE the event loop, indexed by SCANCODE\nconst bool* keys = SDL_GetKeyboardState(nullptr);\nif (keys[SDL_SCANCODE_W]) player_y -= speed * dt;   // continuous movement\nif (keys[SDL_SCANCODE_S]) player_y += speed * dt;\n\nfloat mx, my;\nSDL_MouseButtonFlags b = SDL_GetMouseState(&mx, &my);   // current pos + buttons\nif (b & SDL_BUTTON_LMASK) paint(mx, my);" },
        { type: "table", headers: ["Need", "Use", "Why"], rows: [
          ["Jump, shoot, menu select", "`SDL_EVENT_KEY_DOWN` (check `!e.key.repeat`)", "fires once per press (an edge)"],
          ["Walk, run, hold-to-charge", "`SDL_GetKeyboardState` polling", "true every frame the key is held"],
          ["Aim / drag / hover", "`SDL_GetMouseState` polling", "always the current position"],
          ["Physical key vs layout", "`e.key.scancode` (SDL_SCANCODE_*) vs `e.key.key` (SDLK_*)", "scancode = physical WASD; keycode = layout letter"],
          ["Typing / chat / IME", "`SDL_EVENT_TEXT_INPUT` + `SDL_StartTextInput`", "handles IME, dead keys; gives UTF-8 `e.text.text`"]
        ] },
        { type: "heading", text: "Text input" },
        { type: "code", lang: "cpp", code: "SDL_StartTextInput(window);        // enable IME/text events (on a window in SDL3)\n// in the event loop:\ncase SDL_EVENT_TEXT_INPUT:\n    buffer += e.text.text;         // UTF-8 chars, respects keyboard layout/IME\n    break;\n// SDL_StopTextInput(window) when the text field loses focus" },
        { type: "callout", variant: "gotcha", text: "Driving a **jump** off `SDL_GetKeyboardState` fires it every frame the key is held (dozens of times). Discrete actions → `SDL_EVENT_KEY_DOWN` (and guard `!e.key.repeat` so OS key-repeat doesn't re-trigger). Driving **walking** off `KEY_DOWN` stutters (it only repeats at the OS auto-repeat rate). One-shot → events; continuous → polling. Note `SDL_GetKeyboardState` returns **`const bool*`** in SDL3 (was `Uint8*`) and is indexed by **scancode**, not keycode." }
      ]
    },
    {
      id: "gamepad-touch",
      title: "Gamepads & touch",
      level: "deep",
      body: [
        { type: "p", text: "The **`SDL_Gamepad`** API (renamed from SDL2's `SDL_GameController`) maps any recognized controller — Xbox, PlayStation, Switch Pro, third-party — onto a standard layout so you code against abstract buttons/axes, not raw joystick indices. Init `SDL_INIT_GAMEPAD`, open pads as they connect, then poll or handle events." },
        { type: "code", lang: "cpp", code: "SDL_Gamepad* pad = nullptr;\n\n// hot-plug: open when a controller is added\ncase SDL_EVENT_GAMEPAD_ADDED:\n    pad = SDL_OpenGamepad(e.gdevice.which); break;\ncase SDL_EVENT_GAMEPAD_REMOVED:\n    SDL_CloseGamepad(pad); pad = nullptr; break;\n\n// edge: button pressed this frame (positional: SOUTH/EAST/WEST/NORTH, not A/B/X/Y)\ncase SDL_EVENT_GAMEPAD_BUTTON_DOWN:\n    if (e.gbutton.button == SDL_GAMEPAD_BUTTON_SOUTH) jump();\n    break;\n\n// held / analog: poll every frame\nif (pad) {\n    // axes are Sint16 -32768..32767; normalize and deadzone them\n    float lx = SDL_GetGamepadAxis(pad, SDL_GAMEPAD_AXIS_LEFTX) / 32767.0f;\n    if (SDL_fabsf(lx) > 0.15f) player_x += lx * speed * dt;   // 0.15 deadzone\n    if (SDL_GetGamepadButton(pad, SDL_GAMEPAD_BUTTON_EAST)) dash();\n    SDL_RumbleGamepad(pad, 0xC000, 0x8000, 200);              // haptics, 200 ms\n}" },
        { type: "callout", variant: "note", text: "SDL3 renamed the face buttons to **positional** (`SDL_GAMEPAD_BUTTON_SOUTH/EAST/WEST/NORTH`) so the bottom button is always SOUTH regardless of Xbox-vs-Nintendo layout. Use `SDL_GetGamepadButtonLabel()` when you need the *printed* letter to show on-screen prompts. SDL ships a huge community mapping database, so almost any USB/Bluetooth pad Just Works." },
        { type: "p", text: "**Touch** arrives as `SDL_EVENT_FINGER_DOWN` / `_FINGER_MOTION` / `_FINGER_UP` with **normalized** 0..1 coordinates (`e.tfinger.x * window_w` for pixels) plus a `fingerID` so you can track multi-touch. This is your input path on iOS/Android." }
      ]
    },
    {
      id: "textures-rendering",
      title: "Surfaces, textures & rendering",
      level: "core",
      body: [
        { type: "p", text: "Two image concepts, and confusing them is a classic mistake. A **`SDL_Surface`** lives in **CPU/RAM** — good for loading and pixel editing, slow to draw. A **`SDL_Texture`** lives in **GPU/VRAM** — that is what the hardware renderer draws, fast. The pattern is: **load into a Surface, upload to a Texture once, then draw the texture every frame**." },
        { type: "code", lang: "cpp", code: "SDL_Surface* surf = SDL_LoadBMP(\"player.bmp\");           // CPU-side pixels\nSDL_Texture* tex  = SDL_CreateTextureFromSurface(renderer, surf);  // -> GPU\nSDL_DestroySurface(surf);                               // surface no longer needed\n\n// draw the whole texture at a float dest rect (SDL_RenderTexture = SDL2's RenderCopy)\nSDL_FRect dst{ 350.0f, 250.0f, 64.0f, 64.0f };\nSDL_RenderTexture(renderer, tex, nullptr, &dst);        // src=nullptr => whole texture\n\n// draw a SUB-RECT of the texture (sprite-sheet frame): src slices the atlas\nSDL_FRect src{ 32.0f, 0.0f, 32.0f, 32.0f };             // frame at column 1\nSDL_RenderTexture(renderer, tex, &src, &dst);" },
        { type: "heading", text: "Rotation, flip, tint & blend" },
        { type: "code", lang: "cpp", code: "// rotate (degrees, clockwise) about a center point, with optional flip\nSDL_FPoint center{ 32.0f, 32.0f };\nSDL_RenderTextureRotated(renderer, tex, nullptr, &dst,\n                         angle, &center, SDL_FLIP_HORIZONTAL);\n\n// modulation: tint and fade a texture without editing pixels\nSDL_SetTextureColorMod(tex, 255, 120, 120);   // multiply RGB (red tint / damage flash)\nSDL_SetTextureAlphaMod(tex, 128);             // 0..255 whole-texture transparency\nSDL_SetTextureBlendMode(tex, SDL_BLENDMODE_BLEND);   // alpha blend (or _ADD for glow)\nSDL_SetTextureScaleMode(tex, SDL_SCALEMODE_NEAREST); // crisp pixel-art (vs _LINEAR)" },
        { type: "heading", text: "Drawing primitives" },
        { type: "code", lang: "cpp", code: "SDL_SetRenderDrawColor(renderer, 90, 200, 120, 255);\nSDL_FRect r{ 50, 50, 120, 80 };\nSDL_RenderFillRect(renderer, &r);                    // filled rect\nSDL_RenderRect(renderer, &r);                        // outline\nSDL_RenderLine(renderer, 0, 0, 400, 300);            // a line (floats)\nSDL_RenderPoint(renderer, 200, 150);                 // a pixel\n// no built-in filled circle — draw it yourself or use SDL_RenderGeometry (triangles)" },
        { type: "table", headers: ["Concept", "Detail"], rows: [
          ["Origin", "top-left `(0,0)`; **x right, y DOWN** (screen coords, not math)"],
          ["Surface", "CPU/RAM pixels — load, edit, `SDL_DestroySurface` when done"],
          ["Texture", "GPU/VRAM — what you draw; `SDL_DestroyTexture` to free"],
          ["`SDL_FRect`", "**float** rect `{x,y,w,h}` — all SDL3 render calls take these"],
          ["`SDL_RenderTexture`", "SDL2's `SDL_RenderCopy`, renamed"],
          ["src rect = `nullptr`", "draw the whole texture; give a sub-rect to slice a sheet"]
        ] },
        { type: "callout", variant: "gotcha", text: "**Do not create a texture every frame.** `SDL_CreateTextureFromSurface` (and `IMG_LoadTexture`) allocate VRAM; calling them in the loop leaks GPU memory and stutters. Create once at load, `SDL_DestroyTexture` at cleanup. Also: **integer `SDL_Rect` vs float `SDL_FRect`** — render functions want `SDL_FRect` in SDL3; passing the wrong one won't compile, and mixing them for positions loses sub-pixel smoothness." }
      ]
    },
    {
      id: "assets",
      title: "Loading assets: images, sprite sheets & fonts",
      level: "core",
      body: [
        { type: "p", text: "Core SDL only decodes BMP (`SDL_LoadBMP`). For PNG/JPG/WEBP you add **SDL3_image**; for TrueType text, **SDL3_ttf**. Both are separate libraries you link (see the CMake section)." },
        { type: "heading", text: "SDL3_image — PNG, JPG, etc." },
        { type: "code", lang: "cpp", code: "#include <SDL3_image/SDL_image.h>\n// SDL3_image 3.0 dropped IMG_Init/IMG_Quit — just load.\n\nSDL_Surface* s   = IMG_Load(\"assets/hero.png\");            // -> CPU surface\nSDL_Texture* tex = SDL_CreateTextureFromSurface(renderer, s);\nSDL_DestroySurface(s);\n\n// or straight to a GPU texture in one call (most common):\nSDL_Texture* bg = IMG_LoadTexture(renderer, \"assets/bg.jpg\");" },
        { type: "heading", text: "Sprite sheets: slice with source rects" },
        { type: "p", text: "One image holds a grid of frames; you draw a different **source `SDL_FRect`** to pick the frame. Advance the frame index on a `dt`-driven timer so animation speed is independent of frame rate." },
        { type: "code", lang: "cpp", code: "const float FW = 32, FH = 32;\nint   frame = 0;\nfloat timer = 0.0f;\nconst float FPS = 10.0f;\n\n// per frame:\ntimer += dt;\nif (timer >= 1.0f / FPS) { timer = 0; frame = (frame + 1) % 6; }\nSDL_FRect src{ frame * FW, 0, FW, FH };     // column = frame, row 0\nSDL_FRect dst{ player_x, player_y, FW * 2, FH * 2 };   // 2x scaled\nSDL_RenderTexture(renderer, sheet, &src, &dst);" },
        { type: "heading", text: "SDL3_ttf — text rendering" },
        { type: "p", text: "Text is not drawn directly: you **render a string to a Surface**, upload it to a Texture, then draw that. Rendering is expensive, so **cache** the texture and only re-render when the string changes." },
        { type: "code", lang: "cpp", code: "#include <SDL3_ttf/SDL_ttf.h>\nTTF_Init();\nTTF_Font* font = TTF_OpenFont(\"assets/font.ttf\", 24.0f);   // ptsize is float in SDL3\n\nSDL_Color white{ 240, 240, 240, 255 };\n// SDL3 signature: (font, text, length, color); length 0 => whole null-terminated string\nSDL_Surface* ts  = TTF_RenderText_Blended(font, \"Score: 1200\", 0, white);\nSDL_Texture* ttex = SDL_CreateTextureFromSurface(renderer, ts);\nfloat w, h; SDL_GetTextureSize(ttex, &w, &h);\nSDL_FRect where{ 16, 16, w, h };\nSDL_RenderTexture(renderer, ttex, nullptr, &where);\nSDL_DestroySurface(ts);\n// ... cache ttex; re-render only when the score changes ...\n// cleanup: TTF_CloseFont(font); TTF_Quit();" },
        { type: "table", headers: ["TTF render variant", "Quality / use"], rows: [
          ["`TTF_RenderText_Solid`", "fast, aliased, one color — cheap debug text"],
          ["`TTF_RenderText_Shaded`", "antialiased on a solid background box"],
          ["`TTF_RenderText_Blended`", "antialiased with alpha — the usual choice for UI/HUD"],
          ["`TTF_RenderText_LCD`", "subpixel LCD-optimized — crispest on desktop"]
        ] },
        { type: "callout", variant: "note", text: "**Pixel formats & speed:** SDL3_ttf 3.0 also has a *text engine* (`TTF_CreateRendererTextEngine` + `TTF_Text`) that draws text straight through the renderer without the surface→texture dance — nicer for lots of dynamic text. For pixel art, set `SDL_SetTextureScaleMode(tex, SDL_SCALEMODE_NEAREST)` so scaling stays crisp instead of blurry (`SDL_SCALEMODE_LINEAR` is the default)." }
      ]
    },
    {
      id: "audio",
      title: "Audio: SDL_mixer 3 & the raw stream API",
      level: "core",
      body: [
        { type: "p", text: "For games, the easy path is **SDL3_mixer 3.0** — but note it is a **complete redesign**, not a rename: no more `Mix_OpenAudio`/`Mix_PlayChannel`. The new model is **`MIX_Mixer`** (a mixing device), **`MIX_Audio`** (loaded sound data, SFX or music, in RAM), and **`MIX_Track`** (a playing voice you assign audio to). For one-shots there is a fire-and-forget `MIX_PlayAudio`." },
        { type: "code", lang: "cpp", code: "#include <SDL3_mixer/SDL_mixer.h>\nSDL_Init(SDL_INIT_AUDIO);\nMIX_Init();\nMIX_Mixer* mixer = MIX_CreateMixerDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr);\n\n// load sound data (predecode=true loads fully to RAM: best for short SFX)\nMIX_Audio* jump  = MIX_LoadAudio(mixer, \"assets/jump.wav\", true);\nMIX_Audio* music = MIX_LoadAudio(mixer, \"assets/theme.ogg\", false);  // stream music\n\n// simplest: play a one-shot with no management\nMIX_PlayAudio(mixer, jump);\n\n// managed: a track you control (loop, volume, stop) — good for the music bed\nMIX_Track* bg = MIX_CreateTrack(mixer);\nMIX_SetTrackAudio(bg, music);\nMIX_PlayTrack(bg, 0);   // options via an SDL_PropertiesID (0 = defaults)\n\n// cleanup: MIX_DestroyAudio(jump); MIX_DestroyMixer(mixer); MIX_Quit();" },
        { type: "table", headers: ["SDL_mixer 3 concept", "Role"], rows: [
          ["`MIX_Mixer`", "the audio device / mixing engine (`MIX_CreateMixerDevice`)"],
          ["`MIX_Audio`", "loaded sound data (SFX or music) — `MIX_LoadAudio`"],
          ["`MIX_Track`", "a voice that plays a `MIX_Audio`; make several for overlap"],
          ["`MIX_PlayAudio`", "fire-and-forget one-shot (SDL_mixer manages the track)"],
          ["`MIX_PlayTrack`", "play a track you keep a handle to (loop/volume/stop)"]
        ] },
        { type: "heading", text: "The raw SDL3 audio stream API (no mixer lib)" },
        { type: "p", text: "SDL3 folded audio into a clean **`SDL_AudioStream`** model that does format conversion and resampling for you — no extra library. Open a device-bound stream, then either push samples with `SDL_PutAudioStreamData` or supply a callback. This is how you generate audio (synths, chiptune) or play decoded WAV/samples without SDL_mixer." },
        { type: "code", lang: "cpp", code: "SDL_AudioSpec spec{ SDL_AUDIO_F32, 2, 48000 };   // format, channels, Hz\nSDL_AudioStream* stream =\n    SDL_OpenAudioDeviceStream(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, &spec, nullptr, nullptr);\nSDL_ResumeAudioStreamDevice(stream);      // devices start PAUSED — resume to hear it\n\n// load a WAV and feed it in\nUint8* buf; Uint32 len; SDL_AudioSpec wav;\nSDL_LoadWAV(\"assets/coin.wav\", &wav, &buf, &len);\nSDL_PutAudioStreamData(stream, buf, len); // SDL resamples wav.format -> spec for you\nSDL_free(buf);" },
        { type: "callout", variant: "gotcha", text: "**Audio devices open PAUSED in SDL3** — if you hear nothing, you forgot `SDL_ResumeAudioStreamDevice` (raw API) or a `MIX_CreateMixerDevice` that failed on a headless/CI box with no audio (check `SDL_GetError`). Prefer **OGG** for music and short **WAV/OGG** for SFX. Don't reload a sound every time you play it — load once, replay the `MIX_Audio`." }
      ]
    },
    {
      id: "collision",
      title: "Collision & physics (roll your own)",
      level: "core",
      body: [
        { type: "p", text: "SDL has **no physics** — it is a media layer, not an engine. For most 2D games you write your own **axis-aligned bounding box (AABB)** overlap tests against `SDL_FRect`s, which is fast and enough for platformers, shooters, and top-downs. SDL even gives you the rect math." },
        { type: "code", lang: "cpp", code: "SDL_FRect player{ px, py, 32, 48 };\nSDL_FRect wall  { 100, 200, 64, 64 };\n\n// cheap boolean overlap\nif (SDL_HasRectIntersectionFloat(&player, &wall)) {\n    // resolve the collision (push out along the smaller overlap axis, etc.)\n}\n\n// the actual overlap rectangle (to compute penetration depth for resolution)\nSDL_FRect hit;\nif (SDL_GetRectIntersectionFloat(&player, &wall, &hit)) {\n    if (hit.w < hit.h) px += (player.x < wall.x ? -hit.w : hit.w);  // resolve X\n    else               py += (player.y < wall.y ? -hit.h : hit.h);  // resolve Y\n}\n\n// hand-rolled AABB (no SDL call) — the whole test is four comparisons\nbool overlap = a.x < b.x + b.w && a.x + a.w > b.x &&\n               a.y < b.y + b.h && a.y + a.h > b.y;" },
        { type: "callout", variant: "tip", text: "For real rigid-body physics — joints, stacking, slopes, restitution — drop in **Box2D** (the industry-standard 2D physics engine; C++ or the C `box2d` v3) and let SDL just *draw* the bodies it simulates. Use SDL AABB for arcade games; use Box2D when the simulation itself is the gameplay. Do broad-phase (a cheap grid/quadtree, or one AABB test) before any expensive narrow-phase check." },
        { type: "callout", variant: "note", text: "With a **fixed timestep** (see the game-loop section) fast objects won't tunnel through thin walls, because each physics step is small and bounded. If you must use a variable step, clamp `dt` and consider swept/continuous collision for bullets." }
      ]
    },
    {
      id: "structuring",
      title: "Structuring a game: entities, scenes & camera",
      level: "core",
      body: [
        { type: "p", text: "SDL gives you primitives; you impose the architecture. A pragmatic starting point: **entity structs** with float positions and a texture, a **scene/state machine** for menu→play→gameover, and a **camera** you subtract from world coordinates when drawing." },
        { type: "heading", text: "Entities with float positions" },
        { type: "code", lang: "cpp", code: "struct Entity {\n    float x, y, vx, vy;      // world position/velocity as FLOATS (sub-pixel smooth)\n    float w, h;\n    SDL_Texture* tex;\n    bool alive = true;\n};\n\nvoid update(Entity& e, float dt) {\n    e.vy += 980.0f * dt;     // gravity, px/s^2\n    e.x  += e.vx * dt;       // integrate with dt, always\n    e.y  += e.vy * dt;\n}\nvoid draw(SDL_Renderer* r, const Entity& e, float camx, float camy) {\n    SDL_FRect dst{ e.x - camx, e.y - camy, e.w, e.h };   // world -> screen via camera\n    SDL_RenderTexture(r, e.tex, nullptr, &dst);\n}" },
        { type: "heading", text: "A simple scene/state machine" },
        { type: "code", lang: "cpp", code: "struct Scene {\n    virtual ~Scene() = default;\n    virtual void handle(const SDL_Event&) {}\n    virtual Scene* update(float dt) { return this; }   // return next scene (or this)\n    virtual void   render(SDL_Renderer*) {}\n};\nstruct MenuScene : Scene { /* ... returns new PlayScene on Enter ... */ };\nstruct PlayScene : Scene { /* ... returns new GameOverScene on death ... */ };\n\n// the whole main loop becomes tiny:\nScene* scene = new MenuScene();\nwhile (running) {\n    SDL_Event e;\n    while (SDL_PollEvent(&e)) { if (e.type == SDL_EVENT_QUIT) running = false; scene->handle(e); }\n    Scene* next = scene->update(dt);\n    if (next != scene) { delete scene; scene = next; }   // switch scenes\n    scene->render(renderer);\n    SDL_RenderPresent(renderer);\n}" },
        { type: "callout", variant: "tip", text: "A **camera** is just an offset: store `camx/camy` (often the player's position minus half the logical screen), and subtract it in every draw. Clamp it to the level bounds so you don't scroll past the edges. For a **viewport** (split-screen, minimap) use `SDL_SetRenderViewport` to restrict drawing to a sub-rect of the target." },
        { type: "callout", variant: "note", text: "When entity counts grow (hundreds of bullets, particles), plain structs-in-a-`std::vector` beats an inheritance hierarchy of `virtual update()` calls. For a real data-oriented model, layer an **ECS like EnTT** on top — SDL neither knows nor cares how you organize game objects." }
      ]
    },
    {
      id: "performance",
      title: "Performance",
      level: "deep",
      body: [
        { type: "p", text: "The SDL renderer is GPU-accelerated, so 2D performance is mostly about **feeding the GPU efficiently** and **not doing wasteful work per frame**. Measure before optimizing: log your frame time and watch it." },
        { type: "list", items: [
          "**Use a texture atlas.** Every distinct `SDL_Texture` you switch between can break batching. Pack sprites into one big atlas and draw sub-rects — SDL batches consecutive draws from the *same* texture into few GPU calls.",
          "**Never create textures/surfaces or load files in the loop.** `IMG_LoadTexture`, `SDL_CreateTextureFromSurface`, `TTF_RenderText_*` are startup/on-change work. Doing them per frame leaks VRAM and stutters.",
          "**Avoid per-frame heap allocations.** No `new`/`std::vector` growth inside the hot loop; pre-size pools and reuse. Cache rendered text; only re-render when the string changes.",
          "**Cull off-screen entities** with a cheap `SDL_HasRectIntersectionFloat` against the camera rect before you draw or fully update them.",
          "**Keep VSync on** (`SDL_SetRenderVSync`) unless you have a reason not to — it caps the frame rate to the display and removes tearing without you writing a limiter.",
          "**Batch primitives:** `SDL_RenderGeometry` draws many textured triangles in one call — the path to particle systems and custom shapes at scale.",
          "For raw GPU control (shaders, 3D, compute) SDL3 ships a new cross-platform **`SDL_gpu`** API (Vulkan/Metal/D3D12 under one interface) — beyond 2D, but there when you outgrow the 2D renderer."
        ] },
        { type: "code", lang: "cpp", code: "// simple frame-time logging with SDL_Log\nUint64 t0 = SDL_GetPerformanceCounter();\n// ... render the frame ...\nUint64 t1 = SDL_GetPerformanceCounter();\ndouble ms = (t1 - t0) * 1000.0 / SDL_GetPerformanceFrequency();\nif (ms > 16.7) SDL_Log(\"slow frame: %.2f ms\", ms);   // dropped below 60fps\n// SDL_LogError(SDL_LOG_CATEGORY_RENDER, ...) for categorized error logging" },
        { type: "callout", variant: "note", text: "For an in-game debug overlay (live tweak sliders, entity inspectors, profilers) integrate **Dear ImGui** — it has an official SDL3 + SDL_Renderer backend and is the standard tool. It costs almost nothing and turns SDL's bare-bones nature into a fast iteration loop." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment: desktop, web & mobile",
      level: "deep",
      body: [
        { type: "p", text: "SDL's whole point is reach: the same source targets Windows, macOS, Linux, iOS, Android, and the browser. The work is in **bundling assets** and choosing **static vs dynamic** linking." },
        { type: "table", headers: ["Target", "How"], rows: [
          ["Windows", "ship the `.exe` + `SDL3.dll` (dynamic) next to it, or link static; bundle `assets/`"],
          ["macOS", "build a `.app` bundle; put dylibs in `Contents/Frameworks`, assets in `Resources`"],
          ["Linux", "AppImage/Flatpak, or rely on the distro's `libSDL3.so`"],
          ["Web", "**Emscripten** → WASM + a canvas (itch.io, jams)"],
          ["iOS / Android", "SDL provides Xcode / Gradle project templates; touch input works out of the box"]
        ] },
        { type: "heading", text: "Static vs dynamic linking" },
        { type: "list", items: [
          "**Dynamic** (ship `SDL3.dll`/`.dylib`/`.so`): smaller exe, users/distros can update SDL for security fixes; you must ship the shared lib alongside. The common default.",
          "**Static** (`-DBUILD_SHARED_LIBS=OFF` when building SDL): one self-contained binary, nothing to bundle, no 'missing DLL' support tickets — at the cost of a bigger exe and re-shipping to get SDL fixes. Note SDL's zlib license permits static linking freely."
        ] },
        { type: "heading", text: "Finding your assets at runtime" },
        { type: "code", lang: "cpp", code: "// don't assume the working directory. Base paths off the executable:\nconst char* base = SDL_GetBasePath();          // dir of the running exe (install dir)\nstd::string p = std::string(base) + \"assets/hero.png\";\nSDL_Texture* t = IMG_LoadTexture(renderer, p.c_str());\n// SDL_GetPrefPath(org, app) => a writable per-user dir for saves/config" },
        { type: "heading", text: "Web build with Emscripten" },
        { type: "code", lang: "bash", code: "# Emscripten has a built-in SDL3 port. --preload-file bakes assets into the WASM FS.\nemcc main.cpp -o index.html \\\n  -sUSE_SDL=3 \\\n  --preload-file assets \\\n  -sALLOW_MEMORY_GROWTH=1\n# open index.html via a local server; the canvas hosts your game" },
        { type: "callout", variant: "warn", text: "For the **web** you should use SDL3 **main callbacks** (`SDL_MAIN_USE_CALLBACKS`) or Emscripten's `emscripten_set_main_loop` — a blocking `while(true)` loop hard-freezes the browser tab (the browser owns the event loop, exactly like pygame's pygbag needing `await asyncio.sleep(0)`). Also remember `SDL_GetBasePath` differs under WASM; the preloaded virtual filesystem is rooted at `/`." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that produce a black screen, a leak, or a game that won't compile against the tutorial you're following. Nearly everyone hits several." },
        { type: "heading", text: "1. SDL2 tutorial doesn't compile against SDL3" },
        { type: "callout", variant: "warn", text: "The **biggest** one, because most learning material is still SDL2. `SDL_RenderCopy`→`SDL_RenderTexture`, `SDL_QUIT`→`SDL_EVENT_QUIT`, `event.key.keysym.sym`→`event.key.key`, `int`→`bool` returns, `SDL_Rect`→`SDL_FRect` for rendering. Keep the migration table (section 2) open, or run `build-scripts/rename_symbols.py` on ported code." },
        { type: "heading", text: "2. Black screen / nothing updates" },
        { type: "callout", variant: "gotcha", text: "You forgot **`SDL_RenderPresent(renderer)`** at the end of the frame — the back buffer is never flipped. (Or you never `SDL_RenderClear`ed, or drew off-screen, or the draw color's alpha was 0.)" },
        { type: "heading", text: "3. Creating textures every frame" },
        { type: "callout", variant: "gotcha", text: "`IMG_LoadTexture` / `SDL_CreateTextureFromSurface` / `TTF_RenderText_*` inside the loop leaks VRAM and stutters. **Load/render once**, keep the handle, `SDL_DestroyTexture` at cleanup. Cache rendered text; re-render only when it changes." },
        { type: "heading", text: "4. Integer vs float rects" },
        { type: "callout", variant: "warn", text: "SDL3 render calls take **`SDL_FRect`** (floats), not `SDL_Rect`. Mismatches won't compile; storing positions as ints throws away sub-pixel motion, so slow movement (`speed*dt < 1`) truncates to zero and things stutter or don't move. Keep positions in `float`." },
        { type: "heading", text: "5. Event loop starvation / 'Not Responding'" },
        { type: "callout", variant: "gotcha", text: "**Drain the whole queue every frame** with `while (SDL_PollEvent(&e))`. Polling only one event per frame lets the queue back up (laggy input); not polling at all makes the OS grey out the window. Never do long blocking work (huge sync load, sleep) inside the loop." },
        { type: "heading", text: "6. Uninitialized subsystems" },
        { type: "callout", variant: "gotcha", text: "Using audio without `SDL_Init(SDL_INIT_AUDIO)`, or gamepads without `SDL_INIT_GAMEPAD`, fails quietly. Check every `bool`/pointer return and print `SDL_GetError()`. Remember audio devices open **paused** — resume them." },
        { type: "heading", text: "7. main() signature / SDL_main linker error" },
        { type: "callout", variant: "warn", text: "On Windows you get an `undefined reference to WinMain`/`SDL_main` error unless you `#include <SDL3/SDL_main.h>` in the file with `main` and use the exact `int main(int argc, char* argv[])` signature. It compiles fine on Linux, so it ambushes you at cross-platform time." },
        { type: "heading", text: "8. Blocking the loop / tunneling" },
        { type: "callout", variant: "gotcha", text: "Long synchronous work (loading assets mid-game, `SDL_Delay(1000)`) freezes rendering and input. And an unclamped `dt` after a stall lets fast objects teleport through walls — clamp `dt` (`min(dt, 0.05f)`) and/or use a fixed timestep." },
        { type: "callout", variant: "note", text: "General discipline: init only what you need, check every return and read `SDL_GetError()`, load once and keep handles, clear→draw→present every frame, move by `speed*dt` with float positions, drain the whole event queue, and destroy in reverse (`renderer`, then `window`, then `SDL_Quit`)." }
      ]
    }
  ],

  packages: [
    { name: "SDL3", why: "the core library — window, GPU `SDL_Renderer`, events, input, audio, timers, filesystem, threads. Everything else builds on it. Headers `<SDL3/SDL.h>` + `<SDL3/SDL_main.h>`." },
    { name: "SDL3_image", why: "load PNG/JPG/WEBP/GIF/SVG as surfaces or textures (`IMG_Load`, `IMG_LoadTexture`). SDL3_image 3.0 dropped `IMG_Init` — just load. Essential for real sprites." },
    { name: "SDL3_ttf", why: "TrueType text: `TTF_OpenFont`, `TTF_RenderText_Blended` (font, text, length, color) → surface → texture. Also a text engine that draws straight through the renderer." },
    { name: "SDL3_mixer", why: "game audio, **completely redesigned in 3.0**: `MIX_CreateMixerDevice` / `MIX_LoadAudio` / `MIX_Track` / `MIX_PlayAudio`. SFX + streamed music with mixing and effects." },
    { name: "CMake", why: "the standard cross-platform build; consume SDL via `FetchContent` (build from source, pin a tag) or `find_package(SDL3 CONFIG)`, link `SDL3::SDL3`." },
    { name: "SDL_gpu (built into SDL3)", why: "SDL3's new low-level GPU API — one interface over Vulkan/Metal/D3D12 for shaders, 3D, and compute when you outgrow the 2D `SDL_Renderer`." },
    { name: "Dear ImGui", why: "immediate-mode debug UI (sliders, inspectors, profilers) with an official SDL3 + SDL_Renderer backend. The standard way to add dev tooling to an SDL game." },
    { name: "EnTT", why: "fast header-only C++ Entity-Component-System. Layer it on SDL when structs-in-a-vector stop scaling; SDL is agnostic about how you organize game objects." },
    { name: "Box2D", why: "the industry-standard 2D physics engine (rigid bodies, joints, contacts). SDL has no physics, so pair Box2D for simulation and let SDL draw the bodies." },
    { name: "GLM", why: "header-only vector/matrix math (`vec2`, transforms, easing helpers). Handy for camera math, particles, and anything beyond scalar positions." },
    { name: "SFML", why: "the friendlier OO alternative to SDL (`sf::RenderWindow`, `sf::Sprite`, RAII, no manual destroy). Great for learning/jams; SDL wins on console/mobile/web reach." },
    { name: "Emscripten", why: "compile your SDL3 game to WebAssembly for the browser (`emcc -sUSE_SDL=3 --preload-file assets`). Ships to itch.io; use main callbacks so the tab doesn't freeze." },
    { name: "tmxlite / Tiled", why: "author tile maps and object layers in the Tiled editor, load them with tmxlite — the standard way to build 2D levels without hand-coding tile grids." }
  ],

  gotchas: [
    "**SDL3 renamed almost everything from SDL2** — `SDL_RenderCopy`→`SDL_RenderTexture`, `SDL_QUIT`→`SDL_EVENT_QUIT`, `event.key.keysym.sym`→`event.key.key`, error returns are `bool` not `int`. Most tutorials are SDL2; keep the migration guide open.",
    "**Forgetting `SDL_RenderPresent`** leaves a black/never-updating window — the classic 'nothing shows' bug (the SDL equivalent of pygame's missing `flip()`).",
    "**Don't create textures every frame.** `IMG_LoadTexture` / `SDL_CreateTextureFromSurface` / `TTF_RenderText_*` allocate VRAM; call them once at load, `SDL_DestroyTexture` at cleanup. Per-frame = leak + stutter.",
    "**Render functions take `SDL_FRect` (floats)** in SDL3, not integer `SDL_Rect`. Keep positions as `float` or sub-pixel movement (`speed*dt < 1`) truncates to zero and things don't move.",
    "**Drain the whole event queue** with `while (SDL_PollEvent(&e))`. One event per frame lags input; none makes the OS grey out the window as 'Not Responding'.",
    "**Edge vs held input:** discrete actions (jump/shoot) belong in `SDL_EVENT_KEY_DOWN` (guard `!e.key.repeat`); continuous movement uses `SDL_GetKeyboardState` (now `const bool*`, indexed by **scancode**). Swapping them causes machine-gun jumps or stuttery walking.",
    "**Move by `speed * dt`, never fixed pixels/frame** — otherwise game speed follows the monitor's refresh rate. Compute `dt` from `SDL_GetTicks`/performance counter and clamp it (`min(dt, 0.05f)`) to survive stalls (tunneling).",
    "**`#include <SDL3/SDL_main.h>`** in the file with `main`, and use `int main(int argc, char* argv[])` exactly — or Windows fails to link (`WinMain`/`SDL_main`). It compiles fine on Linux, ambushing you at ship time.",
    "**Audio devices open PAUSED in SDL3** — call `SDL_ResumeAudioStreamDevice` (raw API) or you'll hear nothing. And SDL_mixer 3.0 is a full redesign (`MIX_*`), not a rename — old `Mix_OpenAudio` code won't compile.",
    "**Init the subsystems you use** — audio without `SDL_INIT_AUDIO`, gamepads without `SDL_INIT_GAMEPAD` fail silently. Check every `bool`/pointer return and print `SDL_GetError()`.",
    "**Surface (CPU/RAM) vs Texture (GPU/VRAM):** load into a `SDL_Surface`, upload once to a `SDL_Texture`, `SDL_DestroySurface`, then draw the texture. Drawing surfaces directly (or keeping both) wastes memory.",
    "**With `SDL_MAIN_USE_CALLBACKS` you must not also define `main`** — it's callbacks *or* a hand-written loop, never both, or the build breaks.",
    "**Web builds must not block** — a `while(true)` loop freezes the browser tab. Use SDL3 main callbacks or `emscripten_set_main_loop`, and `--preload-file` your assets.",
    "**Base asset paths off `SDL_GetBasePath`**, not the working directory (which varies by how the game is launched). Use `SDL_GetPrefPath` for writable save/config files.",
    "**Destroy in reverse order:** `SDL_DestroyTexture` → `SDL_DestroyRenderer` → `SDL_DestroyWindow` → `SDL_Quit`. Leaking the renderer/window can hang on some drivers.",
    "**No built-in physics or filled circles** — SDL is a media layer. Roll AABB with `SDL_HasRectIntersectionFloat`, bring Box2D for real physics, and draw circles yourself or via `SDL_RenderGeometry`."
  ],

  flashcards: [
    { q: "SDL3 vs SDL2 — the changes that break tutorials?", a: "`SDL_RenderCopy`→**`SDL_RenderTexture`**, `SDL_QUIT`→**`SDL_EVENT_QUIT`**, `SDL_KEYDOWN`→`SDL_EVENT_KEY_DOWN`, `event.key.keysym.sym`→**`event.key.key`**, error returns are **`bool`** (true=ok) not `int`, render rects are **`SDL_FRect`** (floats), `SDL_GameController`→`SDL_Gamepad`, `SDL_CreateWindow` drops x/y, `SDL_CreateRenderer` drops index/flags." },
    { q: "How do you create a window + renderer in SDL3?", a: "`SDL_CreateWindowAndRenderer(title, w, h, flags, &win, &ren)` in one call (returns `bool`), or `SDL_CreateWindow(title, w, h, flags)` then `SDL_CreateRenderer(win, nullptr)` (nullptr = best driver). Then `SDL_SetRenderVSync(ren, 1)`." },
    { q: "What are the steps of a render frame?", a: "`SDL_SetRenderDrawColor` → **`SDL_RenderClear`** (wipe back buffer) → draw calls (`SDL_RenderTexture`, `SDL_RenderFillRect`) → **`SDL_RenderPresent`** (flip to screen). Forgetting Present = black window." },
    { q: "Surface vs Texture?", a: "**Surface** = CPU/RAM pixels (load, edit; slow to draw). **Texture** = GPU/VRAM (fast, what the renderer draws). Pattern: `IMG_Load`→surface, `SDL_CreateTextureFromSurface`→texture, `SDL_DestroySurface`, draw the texture. Or `IMG_LoadTexture` in one step." },
    { q: "How do you make movement frame-rate independent?", a: "Compute `dt` = seconds since last frame (`(SDL_GetTicks()-last)/1000.0f`), move by **`speed * dt`** (units/second), keep positions as `float`, and clamp `dt` (`min(dt, 0.05f)`) to avoid tunneling after stalls." },
    { q: "Edge vs held input in SDL?", a: "**Edge:** `SDL_EVENT_KEY_DOWN` events (once per press; guard `!e.key.repeat`) for jump/shoot. **Held:** `SDL_GetKeyboardState(nullptr)` returns `const bool*` indexed by `SDL_SCANCODE_*`, polled each frame for continuous movement." },
    { q: "How do you draw a sprite-sheet frame?", a: "Pass a **source `SDL_FRect`** selecting the frame's cell: `SDL_RenderTexture(r, sheet, &src, &dst)`. Advance the frame index on a `dt` timer (`if (timer >= 1.0f/fps) frame = (frame+1)%N`) so animation speed is fps-independent." },
    { q: "How do you rotate/flip and tint a texture?", a: "`SDL_RenderTextureRotated(r, tex, src, dst, angle_deg, &center, flip)`. Tint with `SDL_SetTextureColorMod` (RGB multiply), fade with `SDL_SetTextureAlphaMod`, blend with `SDL_SetTextureBlendMode(SDL_BLENDMODE_BLEND)`." },
    { q: "How is text rendered with SDL3_ttf?", a: "`TTF_Init()`, `TTF_OpenFont(path, ptsize)` (float size), `TTF_RenderText_Blended(font, text, length, color)` → surface (length 0 = whole string), then `SDL_CreateTextureFromSurface` and draw. **Cache** the texture; re-render only on change." },
    { q: "How does audio work — SDL_mixer 3.0?", a: "It's redesigned: `MIX_Init` → `MIX_CreateMixerDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr)` → `MIX_LoadAudio` (→`MIX_Audio`) → `MIX_PlayAudio(mixer, audio)` for one-shots, or `MIX_CreateTrack`/`MIX_SetTrackAudio`/`MIX_PlayTrack` for managed voices. Raw path: `SDL_OpenAudioDeviceStream` + `SDL_ResumeAudioStreamDevice`." },
    { q: "How do you do collision in SDL?", a: "SDL has no physics — roll AABB. `SDL_HasRectIntersectionFloat(&a, &b)` for overlap, `SDL_GetRectIntersectionFloat(&a, &b, &out)` for the overlap rect (penetration depth). Bring **Box2D** when the simulation is the gameplay." },
    { q: "What are SDL3 main callbacks and why use them?", a: "`#define SDL_MAIN_USE_CALLBACKS` then implement `SDL_AppInit`/`SDL_AppEvent`/`SDL_AppIterate`/`SDL_AppQuit` (returning `SDL_APP_CONTINUE`/`SUCCESS`/`FAILURE`) instead of `main`. SDL owns the loop — essential for **web (Emscripten)** and mobile where a blocking loop freezes the platform." },
    { q: "Fixed vs variable timestep?", a: "**Variable** (`pos += v*dt`) is simplest — fine for arcade games. **Fixed** accumulates real time and steps physics in constant 1/60 s chunks (the accumulator pattern) — needed for determinism (networking, replays) and to avoid tunneling." },
    { q: "Why the SDL_main linker error on Windows?", a: "SDL wraps your entry point. `#include <SDL3/SDL_main.h>` in the file with `main` and use exactly `int main(int argc, char* argv[])`. Missing it → `undefined reference to WinMain`/`SDL_main` (compiles fine on Linux, breaks on Windows)." },
    { q: "How do you consume SDL3 in CMake?", a: "`FetchContent_Declare(SDL3 GIT_REPOSITORY ... GIT_TAG release-3.x)` + `FetchContent_MakeAvailable`, **or** `find_package(SDL3 REQUIRED CONFIG)`; then `target_link_libraries(app PRIVATE SDL3::SDL3)`. Same pattern for `SDL3_image/ttf/mixer`." },
    { q: "How do you ship to the web?", a: "Emscripten has a built-in SDL3 port: `emcc main.cpp -o index.html -sUSE_SDL=3 --preload-file assets`. Use **main callbacks** (or `emscripten_set_main_loop`) — a blocking `while` loop freezes the browser tab." }
  ],

  cheatsheet: [
    { label: "Init + quit", code: "SDL_Init(SDL_INIT_VIDEO|SDL_INIT_AUDIO); /* ... */ SDL_Quit();" },
    { label: "Window + renderer", code: "SDL_CreateWindowAndRenderer(\"Game\", 1280, 720, 0, &win, &ren);" },
    { label: "VSync", code: "SDL_SetRenderVSync(ren, 1);" },
    { label: "Delta time", code: "Uint64 now=SDL_GetTicks(); float dt=(now-last)/1000.0f; last=now;" },
    { label: "Event loop", code: "SDL_Event e; while(SDL_PollEvent(&e)){ if(e.type==SDL_EVENT_QUIT) running=false; }" },
    { label: "Held keys", code: "const bool* k=SDL_GetKeyboardState(nullptr); if(k[SDL_SCANCODE_W]){}" },
    { label: "Clear / present", code: "SDL_SetRenderDrawColor(ren,20,22,30,255); SDL_RenderClear(ren); /*...*/ SDL_RenderPresent(ren);" },
    { label: "Load texture", code: "SDL_Texture* t = IMG_LoadTexture(ren, \"hero.png\");" },
    { label: "Draw texture", code: "SDL_FRect d{x,y,w,h}; SDL_RenderTexture(ren, t, nullptr, &d);" },
    { label: "Sheet frame (src rect)", code: "SDL_FRect s{col*32,0,32,32}; SDL_RenderTexture(ren,t,&s,&d);" },
    { label: "Rotate", code: "SDL_RenderTextureRotated(ren,t,nullptr,&d,angle,&center,SDL_FLIP_NONE);" },
    { label: "Tint / fade", code: "SDL_SetTextureColorMod(t,255,120,120); SDL_SetTextureAlphaMod(t,128);" },
    { label: "Filled rect", code: "SDL_FRect r{50,50,120,80}; SDL_RenderFillRect(ren,&r);" },
    { label: "AABB collision", code: "if(SDL_HasRectIntersectionFloat(&a,&b)){ /* hit */ }" },
    { label: "Text (SDL_ttf)", code: "SDL_Surface* s=TTF_RenderText_Blended(font,\"Hi\",0,color);" },
    { label: "SFX (SDL_mixer 3)", code: "MIX_Audio* a=MIX_LoadAudio(mix,\"j.wav\",true); MIX_PlayAudio(mix,a);" },
    { label: "Main callbacks", code: "#define SDL_MAIN_USE_CALLBACKS  // impl SDL_AppInit/Event/Iterate/Quit" },
    { label: "CMake link", code: "target_link_libraries(MyGame PRIVATE SDL3::SDL3)" }
  ]
});
