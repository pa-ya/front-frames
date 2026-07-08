(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "love2d",
  name: "LÖVE (Lua)",
  language: "Lua",
  group: "Game dev",
  navLabel: "LÖVE (Lua)",
  color: "#e6398a",
  readMinutes: 32,
  tagline: "The **framework of choice for 2D games in Lua** — you write a few callbacks, LÖVE runs the loop, opens the window, and hands you graphics, audio, input, and Box2D physics.",
  sections: [
    {
      id: "mental-model",
      title: "What LÖVE is (and isn't)",
      level: "core",
      body: [
        { type: "p", text: "**LÖVE** (a.k.a. **Love2D**, spelled `love`) is a batteries-included **framework** for making 2D games in **Lua**. It is *not* an editor or an engine with a scene tree — there is no GUI, no drag-and-drop, no `.love` project wizard. You write plain Lua, LÖVE provides the window, the main loop, and a big set of C-backed modules (`love.graphics`, `love.audio`, `love.physics`, `love.keyboard`, …), and it calls **your** functions each frame." },
        { type: "p", text: "The mental model is almost identical to **Pygame**: an infinite loop of *update state → draw frame*. The difference is that LÖVE owns the loop and calls you back, whereas in Pygame you write the `while True:` yourself. LÖVE ships **LuaJIT**, so hot numeric code runs close to C speed — this is why it punches far above other scripting-language game frameworks." },
        { type: "list", ordered: false, items: [
          "**One binary, one folder.** Drop a `main.lua` in a folder, run `love .`, and you have a game.",
          "**Immediate-mode drawing.** Every frame you redraw everything from scratch in `love.draw`. There is no retained scene graph.",
          "**Callbacks, not a base class.** You don't subclass anything; you define global functions (`love.load`, `love.update`, `love.draw`) and LÖVE calls them.",
          "**Cross-platform.** Same code runs on Windows, macOS, Linux, Android, iOS. (No web target officially, but `love.js` ports exist.)"
        ]},
        { type: "callout", variant: "note", text: "Games shipped on LÖVE include **Balatro**, **Move or Die**, and **Mari0**. Balatro alone proves LÖVE is production-grade for a top-selling commercial title." },
        { type: "callout", variant: "tip", text: "This deck's other game-dev pages are **Pygame** (Python) and **SDL** (C++). LÖVE is the Lua answer: higher-level and faster to prototype than raw SDL, faster at runtime than Pygame thanks to LuaJIT." }
      ]
    },
    {
      id: "install-run",
      title: "Install, project layout & running",
      level: "core",
      body: [
        { type: "p", text: "Install the LÖVE runtime, then run a folder or a `.love` file with it. **You do not install LÖVE via a package manager into your project** — it's a standalone interpreter, like installing Python to run a `.py`." },
        { type: "code", lang: "bash", code: "# Linux (system package) — or grab AppImage from love2d.org\nsudo apt install love          # Debian/Ubuntu\n# macOS\nbrew install --cask love\n# Windows: download the installer from https://love2d.org\n\nlove --version                 # LOVE 11.5 (Mysterious Mysteries)" },
        { type: "p", text: "A minimal project is a **folder** containing `main.lua`. Run it by pointing LÖVE at the folder:" },
        { type: "code", lang: "bash", code: "mygame/\n  main.lua        # required — the entry point\n  conf.lua        # optional — window/config (see later)\n  assets/\n    player.png\n    jump.wav\n\nlove mygame/      # run the folder\nlove .            # …or run the current directory" },
        { type: "code", lang: "lua", code: "-- main.lua — the smallest complete LÖVE game\nfunction love.load()\n  message = \"Hello, LÖVE!\"\nend\n\nfunction love.draw()\n  love.graphics.print(message, 400, 300)\nend" },
        { type: "callout", variant: "tip", text: "For a fast edit loop, install a **hot-reload** helper like [`lurker`](https://github.com/rxi/lurker) (with `lume`) or the [Local Lua Debugger](https://marketplace.visualstudio.com/items?itemName=tomblind.local-lua-debugger-vscode) VS Code extension — the latter gives you real breakpoints inside LÖVE." },
        { type: "callout", variant: "gotcha", text: "`require` uses **dots, not slashes**, and no `.lua` extension: a file `entities/player.lua` is loaded with `require(\"entities.player\")`. Paths are relative to the game's root (where `main.lua` lives)." }
      ]
    },
    {
      id: "callbacks",
      title: "The callback lifecycle",
      level: "core",
      body: [
        { type: "p", text: "LÖVE's engine loop (`love.run`) calls a fixed set of **global callback functions** you define. The three you'll write every time:" },
        { type: "table", headers: ["Callback", "When", "Use it for"], rows: [
          ["`love.load()`", "Once, at startup", "Load images/audio, set up state, seed RNG"],
          ["`love.update(dt)`", "Every frame, before draw", "Advance game logic; `dt` = seconds since last frame"],
          ["`love.draw()`", "Every frame, after update", "Draw the world — nothing here changes state"]
        ]},
        { type: "p", text: "Plus **event callbacks** LÖVE fires when input happens — you don't poll, you implement the ones you care about:" },
        { type: "code", lang: "lua", code: "function love.keypressed(key, scancode, isrepeat)\n  if key == \"escape\" then love.event.quit() end\nend\n\nfunction love.mousepressed(x, y, button, istouch, presses)\n  if button == 1 then spawnParticle(x, y) end   -- 1 = left\nend\n\nfunction love.resize(w, h)   -- window resized\n  layout(w, h)\nend\n\nfunction love.quit()         -- return true to ABORT the quit\n  saveGame()\nend" },
        { type: "callout", variant: "gotcha", text: "Keep `love.draw` **pure**: read state, draw pixels, mutate nothing. Move all logic into `love.update`. Mixing them makes framerate-dependent bugs (a paused/background window still draws but may not update)." },
        { type: "callout", variant: "note", text: "There is no `main()` and no explicit loop. If you truly need to override the loop (fixed timestep, custom scheduling), you *can* redefine `love.run`, but 99% of games never touch it." }
      ]
    },
    {
      id: "drawing",
      title: "Drawing: shapes, color & the 0–1 gotcha",
      level: "core",
      body: [
        { type: "p", text: "`love.graphics` is an **immediate-mode** API: you issue draw calls each frame and they paint onto the back buffer, which LÖVE presents when `love.draw` returns. The coordinate origin `(0,0)` is the **top-left**; **+y points down**." },
        { type: "code", lang: "lua", code: "function love.draw()\n  love.graphics.setColor(1, 0, 0)                    -- red (NOT 255!)\n  love.graphics.rectangle(\"fill\", 100, 100, 200, 80) -- \"fill\" or \"line\"\n\n  love.graphics.setColor(0.2, 0.6, 1, 0.5)           -- r,g,b,a — translucent blue\n  love.graphics.circle(\"fill\", 400, 300, 50)\n\n  love.graphics.setColor(1, 1, 1)                    -- reset to white before text/images!\n  love.graphics.line(0, 0, 800, 600)\n  love.graphics.print(\"score: \" .. score, 10, 10)\nend" },
        { type: "callout", variant: "gotcha", text: "**Colors are floats in the 0–1 range since LÖVE 11.0** — not 0–255. `setColor(255, 0, 0)` clamps to white, a classic \"why is everything white\" bug when porting old 0.10.x code. Divide old values by 255, or use `love.math.colorFromBytes(255, 128, 0)`." },
        { type: "callout", variant: "gotcha", text: "`setColor` is **stateful and sticky**: it tints *everything* drawn after it, including images and text. Always reset to `setColor(1,1,1)` before drawing sprites you don't want tinted." },
        { type: "p", text: "Common primitives: `rectangle`, `circle`, `ellipse`, `line`, `polygon`, `arc`, `points`. Use `love.graphics.setLineWidth(n)` and `setLineStyle(\"rough\"|\"smooth\")` to style strokes." }
      ]
    },
    {
      id: "images-quads",
      title: "Images, sprite sheets & quads",
      level: "core",
      body: [
        { type: "p", text: "Load images **once** in `love.load` (loading in `draw`/`update` will tank your framerate), then draw them each frame. `love.graphics.draw` takes an image plus position, rotation, scale, and origin offset." },
        { type: "code", lang: "lua", code: "function love.load()\n  player = love.graphics.newImage(\"assets/player.png\")\n  player:setFilter(\"nearest\", \"nearest\")  -- crisp pixel art (no blur)\nend\n\nfunction love.draw()\n  -- draw(image, x, y, rotation, sx, sy, ox, oy)\n  local w, h = player:getWidth(), player:getHeight()\n  love.graphics.draw(player, x, y, angle, 2, 2, w/2, h/2)\n  --                              rotate  scale2x   origin = center\nend" },
        { type: "callout", variant: "tip", text: "Rotation and scaling happen around the **origin** `(ox, oy)`, which defaults to the top-left `(0,0)`. To rotate a sprite around its center, pass `ox = w/2, oy = h/2` — a near-universal source of \"my sprite orbits instead of spinning\" confusion." },
        { type: "heading", text: "Sprite sheets with Quads" },
        { type: "p", text: "A **Quad** is a rectangular sub-region of a texture — how you pull one frame out of a sprite sheet without slicing files. Create quads once; draw them each frame." },
        { type: "code", lang: "lua", code: "sheet = love.graphics.newImage(\"assets/run.png\")   -- 4 frames, 32px each\nframes = {}\nfor i = 0, 3 do\n  -- Quad(x, y, w, h, sheetWidth, sheetHeight)\n  frames[i+1] = love.graphics.newQuad(i*32, 0, 32, 32, sheet:getDimensions())\nend\n\nfunction love.draw()\n  local f = math.floor(timer * 10) % 4 + 1\n  love.graphics.draw(sheet, frames[f], x, y)\nend" },
        { type: "callout", variant: "note", text: "For real animation, don't hand-roll frame math — use the [`anim8`](https://github.com/kikito/anim8) library: `anim8.newGrid` + `anim8.newAnimation` handles frame timing, looping, and flipping for you (covered in *Ecosystem*)." },
        { type: "p", text: "Drawing thousands of copies of the same texture? Batch them with `love.graphics.newSpriteBatch(image, maxSprites)` — one GPU draw call for the whole batch instead of one per sprite." }
      ]
    },
    {
      id: "delta-time",
      title: "Delta time & frame-independent movement",
      level: "core",
      body: [
        { type: "p", text: "`love.update(dt)` receives **`dt`**, the seconds elapsed since the previous frame (e.g. `~0.0167` at 60 FPS). **Multiply every rate by `dt`** so motion is the same speed on a 30 Hz laptop and a 144 Hz monitor." },
        { type: "code", lang: "lua", code: "local SPEED = 200   -- pixels per SECOND, not per frame\n\nfunction love.update(dt)\n  if love.keyboard.isDown(\"right\") then x = x + SPEED * dt end\n  if love.keyboard.isDown(\"left\")  then x = x - SPEED * dt end\n\n  -- physics: velocity + gravity, all scaled by dt\n  vy = vy + GRAVITY * dt\n  y  = y + vy * dt\nend" },
        { type: "callout", variant: "gotcha", text: "Forgetting `* dt` (using `x = x + SPEED`) makes the game run at *frame rate* speed — unplayably fast on a fast machine, sluggish on a slow one. This is the #1 beginner bug. If it moves, it multiplies by `dt`." },
        { type: "callout", variant: "warn", text: "On a lag spike `dt` can be large, letting a fast object tunnel through a wall in one step. For collision-critical games, **clamp** `dt` (`dt = math.min(dt, 1/30)`) or use a fixed-timestep accumulator." },
        { type: "p", text: "`love.timer.getFPS()` and `love.timer.getDelta()` help you profile. Cap or uncap vsync via `love.window.setVSync(0)`." }
      ]
    },
    {
      id: "input",
      title: "Input: keyboard, mouse & gamepad",
      level: "core",
      body: [
        { type: "p", text: "There are two styles, and you'll use both: **polling** (\"is this key held *right now*?\" in `update`) and **events** (\"a key was *just* pressed\" via callbacks)." },
        { type: "code", lang: "lua", code: "-- POLLING (continuous actions — movement, holding a button)\nfunction love.update(dt)\n  if love.keyboard.isDown(\"space\") then charge = charge + dt end\n  local mx, my = love.mouse.getPosition()\nend\n\n-- EVENTS (discrete actions — jump, shoot, menu select)\nfunction love.keypressed(key)\n  if key == \"space\" then jump() end          -- fires ONCE per press\nend" },
        { type: "callout", variant: "tip", text: "Use **`isDown`** for things that repeat while held (walking); use **`keypressed`** for one-shot actions (jump, confirm). Trying to detect a single jump with `isDown` gives you dozens of jumps per second." },
        { type: "p", text: "**`key` vs `scancode`:** `key` is the layout-dependent character (`\"w\"` on QWERTY moves, but is `\"z\"` on AZERTY); **`scancode`** is the physical key position. For WASD movement that should work on any layout, check the scancode." },
        { type: "code", lang: "lua", code: "function love.keypressed(key, scancode)\n  if scancode == \"w\" then moveUp() end   -- physical top-left key, any layout\nend\n\n-- Gamepad (LÖVE maps controllers via SDL's gamepad DB)\nfunction love.gamepadpressed(joystick, button)\n  if button == \"a\" then jump() end\nend\nfunction love.update(dt)\n  local js = love.joystick.getJoysticks()[1]\n  if js and js:isGamepad() then\n    local ax = js:getGamepadAxis(\"leftx\")   -- -1..1, apply a deadzone\n  end\nend" },
        { type: "callout", variant: "note", text: "For rebindable controls and unified keyboard/gamepad input, the [`baton`](https://github.com/tesselode/baton) library maps abstract actions (\"jump\", \"left\") to any physical input — far cleaner than scattering key names through your code." }
      ]
    },
    {
      id: "audio",
      title: "Sound & music",
      level: "core",
      body: [
        { type: "p", text: "`love.audio` plays **Sources**. The key decision is `\"static\"` vs `\"stream\"`: decode short SFX fully into memory (**static**), stream long music from disk (**stream**)." },
        { type: "code", lang: "lua", code: "function love.load()\n  jump  = love.audio.newSource(\"assets/jump.wav\", \"static\")  -- short SFX\n  music = love.audio.newSource(\"assets/bg.ogg\",  \"stream\")   -- long track\n  music:setLooping(true)\n  music:setVolume(0.6)\n  music:play()\nend\n\nfunction love.keypressed(k)\n  if k == \"space\" then\n    jump:stop(); jump:play()   -- restart so rapid presses retrigger\n  end\nend" },
        { type: "callout", variant: "gotcha", text: "A single Source is **one playback instance** — calling `:play()` again while it's already playing does nothing new. For overlapping SFX (many coins at once), clone it: `local s = jump:clone(); s:play()`. Or `:stop()` then `:play()` to restart." },
        { type: "callout", variant: "tip", text: "Ship music as **`.ogg`** (small, royalty-free) and SFX as `.wav`. Prefer `\"static\"` only for short clips — loading a 3-minute song as static wastes tens of MB of RAM." },
        { type: "p", text: "Sources support `setPitch`, `setVolume`, `setLooping`, and **positional audio** (`setPosition` + `love.audio.setPosition` for the listener) when you set a Source to mono." }
      ]
    },
    {
      id: "transforms",
      title: "Coordinate system & transformations",
      level: "core",
      body: [
        { type: "p", text: "`love.graphics` keeps a **transform stack** (translate/rotate/scale/shear) that affects every draw call until you pop it. This is how you build cameras, parallax, and nested/relative positioning without doing the matrix math per-sprite." },
        { type: "code", lang: "lua", code: "function love.draw()\n  love.graphics.push()               -- save current transform\n  love.graphics.translate(-camX, -camY)   -- move the world under the camera\n  love.graphics.scale(zoom, zoom)\n    drawWorld()                      -- everything here is in world space\n  love.graphics.pop()                -- restore — UI below is in screen space\n\n  drawHUD()                          -- fixed on screen, ignores the camera\nend" },
        { type: "callout", variant: "gotcha", text: "**Every `push()` needs a matching `pop()`.** Forgetting a `pop` (or popping too many times → error) leaks transforms into the next frame, and your whole world slowly drifts or scales away. Wrap camera code so the pair is obvious." },
        { type: "callout", variant: "tip", text: "For real cameras with smoothing, bounds, and shake, use [`hump.camera`](https://hump.readthedocs.io/en/latest/camera.html) or [`STALKER-X`](https://github.com/a327ex/STALKER-X) rather than hand-rolling translate/scale — they also convert mouse coords to world space (`camera:worldCoords`)." },
        { type: "p", text: "`love.graphics.origin()` resets the transform to identity; `love.graphics.applyTransform(transform)` applies a reusable `love.math.Transform` object." }
      ]
    },
    {
      id: "text-fonts",
      title: "Text & fonts",
      level: "core",
      body: [
        { type: "p", text: "The default font is a small built-in one. Load a **TTF** for anything real, at the pixel size you need — a Font baked at 16px looks blurry scaled to 48px, so create one Font per size you draw." },
        { type: "code", lang: "lua", code: "function love.load()\n  bigFont = love.graphics.newFont(\"assets/pixel.ttf\", 48)\n  smallFont = love.graphics.newFont(14)   -- default font at 14px\nend\n\nfunction love.draw()\n  love.graphics.setFont(bigFont)\n  love.graphics.print(\"GAME OVER\", 300, 200)\n\n  love.graphics.setFont(smallFont)\n  -- printf wraps + aligns within a width\n  love.graphics.printf(\"Press any key\", 0, 400, 800, \"center\")\nend" },
        { type: "callout", variant: "tip", text: "`print` draws a single unwrapped line; **`printf(text, x, y, wraplimit, align)`** wraps to a width and aligns (`\"left\"`/`\"center\"`/`\"right\"`/`\"justify\"`). Use `font:getWidth(str)` / `font:getHeight()` to measure for centering or layout." },
        { type: "callout", variant: "gotcha", text: "For crisp pixel-art fonts, call `font:setFilter(\"nearest\", \"nearest\")` and load the TTF at an integer multiple of its design size. Otherwise LÖVE bilinear-filters the glyphs and they look muddy." }
      ]
    },
    {
      id: "physics",
      title: "Collision & physics",
      level: "core",
      body: [
        { type: "p", text: "You have two very different options, and picking the right one matters:" },
        { type: "table", headers: ["Need", "Use", "Why"], rows: [
          ["Platformer / tile collision, simple pushback", "[`bump.lua`](https://github.com/kikito/bump.lua)", "AABB-only, deterministic, easy — no rigid-body math"],
          ["Realistic bodies, joints, stacking, ragdolls", "`love.physics` (Box2D)", "Full 2D rigid-body sim, built in"]
        ]},
        { type: "p", text: "**`bump.lua`** is what most 2D platformers actually want — axis-aligned boxes with slide/bounce/touch responses:" },
        { type: "code", lang: "lua", code: "local bump = require(\"bump\")\nworld = bump.newWorld(64)\nworld:add(player, player.x, player.y, player.w, player.h)\n\nfunction love.update(dt)\n  local goalX = player.x + player.vx * dt\n  local goalY = player.y + player.vy * dt\n  local ax, ay, cols = world:move(player, goalX, goalY)  -- resolves collisions\n  player.x, player.y = ax, ay\n  for _, c in ipairs(cols) do\n    if c.normal.y < 0 then player.vy = 0; onGround = true end\n  end\nend" },
        { type: "p", text: "**`love.physics`** wraps **Box2D**. It's powerful but heavier: everything is a `World` of `Body` + `Shape` + `Fixture`, and it works in **meters**, not pixels." },
        { type: "code", lang: "lua", code: "function love.load()\n  love.physics.setMeter(64)                       -- 64px = 1 meter\n  world = love.physics.newWorld(0, 9.81 * 64, true)  -- gravity in px/s^2\n\n  ball = {}\n  ball.body    = love.physics.newBody(world, 400, 100, \"dynamic\")\n  ball.shape   = love.physics.newCircleShape(20)\n  ball.fixture = love.physics.newFixture(ball.body, ball.shape, 1)\n  ball.fixture:setRestitution(0.6)                -- bounciness\nend\n\nfunction love.update(dt) world:update(dt) end\nfunction love.draw()\n  love.graphics.circle(\"line\", ball.body:getX(), ball.body:getY(), 20)\nend" },
        { type: "callout", variant: "gotcha", text: "Box2D units are **meters**. Feed it pixel values directly and either nothing moves (values too tiny) or bodies rocket off screen. Set a meter scale with `setMeter` and treat gravity/velocities accordingly, or the simulation misbehaves." },
        { type: "callout", variant: "tip", text: "Don't reach for Box2D by reflex. If your game is grid/tile based, `bump.lua` is simpler, faster, and fully deterministic — critical for anything that needs replays or lockstep multiplayer." }
      ]
    },
    {
      id: "code-organization",
      title: "Structuring code: state & OOP",
      level: "core",
      body: [
        { type: "p", text: "Lua has **no built-in classes**. LÖVE gives you globals and callbacks; beyond a toy, you need your own structure. Two things to solve: **object orientation** and **game states** (menu / playing / game-over)." },
        { type: "heading", text: "Objects" },
        { type: "p", text: "Use a tiny class library rather than reinventing metatables. The popular picks are [`classic`](https://github.com/rxi/classic) (30 lines) and [`middleclass`](https://github.com/kikito/middleclass)." },
        { type: "code", lang: "lua", code: "local Object = require(\"classic\")\n\nlocal Enemy = Object:extend()\nfunction Enemy:new(x, y)\n  self.x, self.y, self.hp = x, y, 3\nend\nfunction Enemy:update(dt) self.x = self.x + 10 * dt end\nfunction Enemy:draw() love.graphics.circle(\"fill\", self.x, self.y, 8) end\n\n-- usage\nlocal e = Enemy(100, 200)   -- calls :new" },
        { type: "heading", text: "Game states" },
        { type: "p", text: "Don't cram menu + gameplay + pause into one giant `if`. Use a **state machine** — either roll a simple one, or use [`hump.gamestate`](https://hump.readthedocs.io/en/latest/gamestate.html), which forwards LÖVE's callbacks to the active state." },
        { type: "code", lang: "lua", code: "local Gamestate = require(\"hump.gamestate\")\nlocal menu, game = {}, {}\n\nfunction menu:draw() love.graphics.print(\"Press enter\", 350, 300) end\nfunction menu:keypressed(k) if k == \"return\" then Gamestate.switch(game) end end\nfunction game:update(dt) --[[ ... ]] end\nfunction game:draw() --[[ ... ]] end\n\nfunction love.load() Gamestate.registerEvents(); Gamestate.switch(menu) end" },
        { type: "callout", variant: "tip", text: "`Gamestate.registerEvents()` monkey-patches LÖVE's callbacks to auto-forward to the current state — after that you never touch the global `love.update`/`love.draw` again; each state owns its own." }
      ]
    },
    {
      id: "canvas-shaders",
      title: "Canvases & shaders",
      level: "deep",
      body: [
        { type: "p", text: "A **Canvas** is an off-screen render target (a framebuffer / texture you draw *into*). Use it for post-processing, lighting, pixel-perfect low-res scaling, or caching an expensive static layer." },
        { type: "code", lang: "lua", code: "function love.load()\n  canvas = love.graphics.newCanvas(320, 180)  -- low internal resolution\n  canvas:setFilter(\"nearest\", \"nearest\")\nend\n\nfunction love.draw()\n  love.graphics.setCanvas(canvas)              -- redirect drawing to the canvas\n    love.graphics.clear()\n    drawWorld()                                -- rendered at 320x180\n  love.graphics.setCanvas()                    -- back to the screen\n\n  love.graphics.draw(canvas, 0, 0, 0, 4, 4)    -- upscale x4 → crisp pixel look\nend" },
        { type: "p", text: "**Shaders** are GLSL fragment/vertex programs. LÖVE wraps them so you write an `effect`/`position` function and it fills in the boilerplate. Great for CRT filters, palette swaps, outlines, waves." },
        { type: "code", lang: "glsl", code: "// grayscale.glsl — a fragment shader\nvec4 effect(vec4 color, Image tex, vec2 uv, vec2 screen) {\n    vec4 px = Texel(tex, uv);          // sample the texture\n    float g = dot(px.rgb, vec3(0.299, 0.587, 0.114));\n    return vec4(g, g, g, px.a) * color;\n}" },
        { type: "code", lang: "lua", code: "shader = love.graphics.newShader(\"grayscale.glsl\")\nfunction love.draw()\n  love.graphics.setShader(shader)\n    love.graphics.draw(sceneCanvas)\n  love.graphics.setShader()          -- always reset\n  -- pass uniforms with shader:send(\"name\", value)\nend" },
        { type: "callout", variant: "gotcha", text: "`setCanvas` and `setShader` are **sticky global state**, exactly like `setColor`. Forgetting to reset (`setCanvas()` / `setShader()`) means the *rest of the frame* renders into the wrong target or through the wrong shader. Always pair set/reset." },
        { type: "callout", variant: "note", text: "GLSL blocks aren't syntax-colored specially here (shown as text), but the LÖVE shader dialect is standard GLSL with LÖVE's `effect`/`Texel`/`Image` helpers. See the [Shader wiki page](https://love2d.org/wiki/Shader)." }
      ]
    },
    {
      id: "filesystem",
      title: "Saving data & the filesystem",
      level: "deep",
      body: [
        { type: "p", text: "`love.filesystem` is **sandboxed**. You can only write to a per-game **save directory** (e.g. `%appdata%/LOVE/<game>` on Windows, `~/.local/share/love/<game>` on Linux) — never arbitrary paths. Reads come from your game folder *and* the save directory, merged." },
        { type: "code", lang: "lua", code: "-- Write a save file (goes to the save directory automatically)\nlove.filesystem.write(\"save.txt\", tostring(score))\n\n-- Read it back (nil if missing)\nif love.filesystem.getInfo(\"save.txt\") then\n  local data = love.filesystem.read(\"save.txt\")\n  score = tonumber(data) or 0\nend\n\n-- Structured saves: serialize a table. Use a lib like `bitser`,\n-- `serpent`, or `lume.serialize` rather than hand-rolling.\nlocal serpent = require(\"serpent\")\nlove.filesystem.write(\"state.lua\", serpent.dump(gameState))" },
        { type: "callout", variant: "gotcha", text: "You **cannot** use Lua's `io.open`/`os` on paths outside the sandbox and expect it to work portably (and it's blocked on mobile). Always go through `love.filesystem`. Set your save identity with `t.identity` in `conf.lua` so saves land in a stable folder." },
        { type: "callout", variant: "tip", text: "`love.filesystem.getSaveDirectory()` tells you where saves actually live — handy for debugging \"my save isn't persisting.\" Player screenshots, configs, and logs all belong there too." }
      ]
    },
    {
      id: "config",
      title: "conf.lua — window & module config",
      level: "deep",
      body: [
        { type: "p", text: "`conf.lua` runs **before** `love.load` and configures the window, identity, version, and which modules to load. It's optional but you'll almost always want one." },
        { type: "code", lang: "lua", code: "-- conf.lua\nfunction love.conf(t)\n  t.identity = \"my-roguelike\"      -- save-directory name\n  t.version  = \"11.5\"              -- LÖVE version you built against\n  t.window.title  = \"My Roguelike\"\n  t.window.width  = 1280\n  t.window.height = 720\n  t.window.resizable = true\n  t.window.vsync  = 1\n  t.window.msaa   = 0              -- keep 0 for pixel art\n\n  t.modules.joystick = true\n  t.modules.physics  = false       -- disable Box2D if you use bump.lua\nend" },
        { type: "callout", variant: "tip", text: "Disabling modules you don't use (`t.modules.physics = false`, `t.modules.audio = false`) shaves a little startup and memory. Set `t.version` to your target — a mismatch triggers a compatibility warning on launch." },
        { type: "callout", variant: "gotcha", text: "You **can't** change most window settings from `conf.lua` at runtime by editing `t` later — for runtime changes use `love.window.setMode(w, h, flags)` instead. `conf.lua` is startup-only." }
      ]
    },
    {
      id: "ecosystem",
      title: "Essential ecosystem libraries",
      level: "core",
      body: [
        { type: "p", text: "LÖVE is deliberately minimal — the community fills the gaps with small, single-file libraries you drop into your project. The near-canonical toolkit:" },
        { type: "table", headers: ["Library", "Solves", "Notes"], rows: [
          ["[`hump`](https://github.com/vrld/hump)", "Gamestate, timer/tween, vector, camera, class", "The Swiss-army bundle; pick the parts you need"],
          ["[`anim8`](https://github.com/kikito/anim8)", "Sprite-sheet animation", "Grid + animation timing, flipping, looping"],
          ["[`bump.lua`](https://github.com/kikito/bump.lua)", "AABB collision", "The default for platformers/top-down"],
          ["[`windfield`](https://github.com/a327ex/windfield)", "Friendly Box2D wrapper", "If you *do* want real physics"],
          ["[`STI`](https://github.com/karai17/Simple-Tiled-Implementation)", "Load **Tiled** `.tmx`/`.lua` maps", "Design levels in the Tiled editor"],
          ["[`SUIT`](https://github.com/vrld/SUIT)", "Immediate-mode GUI", "Buttons/sliders for tools & menus"],
          ["[`baton`](https://github.com/tesselode/baton)", "Input mapping", "Unify keyboard + gamepad, rebindable"],
          ["[`lume`](https://github.com/rxi/lume) / [`classic`](https://github.com/rxi/classic)", "Utility fns / OOP", "Tiny, no-dependency helpers"]
        ]},
        { type: "callout", variant: "tip", text: "Vendoring libs (copying the `.lua` into a `lib/` folder and `require`-ing it) is the norm — LÖVE has **no package manager**. There's `luarocks`, but most LÖVE devs just commit the single files, which also keeps builds reproducible." },
        { type: "callout", variant: "note", text: "Batteries-included alternative: **[Batteries](https://github.com/1bardesign/batteries)** (a stdlib supplement) or opinionated frameworks like **[NOOB](https://github.com/a327ex)**-style stacks. Start minimal; add a lib only when you feel the gap." }
      ]
    },
    {
      id: "packaging",
      title: "Packaging & distribution",
      level: "core",
      body: [
        { type: "p", text: "A **`.love` file is just a ZIP** of your game folder with `main.lua` at its root. Anyone with LÖVE installed can run it. To ship to players who *don't* have LÖVE, you **fuse** the `.love` onto the LÖVE binary." },
        { type: "code", lang: "bash", code: "# 1) Make the .love (zip the CONTENTS, so main.lua is at the zip root)\ncd mygame\nzip -9 -r ../mygame.love .        # NOT `zip mygame.love mygame/` — no top folder!\n\n# 2a) Windows: concatenate onto love.exe\ncopy /b love.exe + mygame.love mygame.exe    # (Windows shell)\ncat love.exe mygame.love > mygame            # (fusing, *nix concept)\n\n# 2b) macOS: drop the .love into LÖVE.app/Contents/Resources, rename the .app" },
        { type: "callout", variant: "gotcha", text: "The classic packaging bug: zipping the *folder* instead of its *contents*, so the archive contains `mygame/main.lua` and LÖVE can't find `main.lua` at the root. Zip from **inside** the folder (`zip -r ../game.love .`)." },
        { type: "callout", variant: "tip", text: "Don't do this by hand — use a tool. **[`makelove`](https://github.com/pfirsich/makelove)** (Python) builds Windows/macOS/Linux/AppImage from a config; **[`love-release`](https://github.com/love-actually/love-release)** is the older sh/luarocks option. Both automate fusing and per-OS packaging." },
        { type: "p", text: "For **Steam**, ship the fused per-OS builds and link the Steamworks API via an FFI binding like [`luasteam`](https://github.com/uspgamedev/luasteam). For **mobile**, build custom LÖVE-Android / love-ios projects embedding your `.love`." }
      ]
    },
    {
      id: "performance",
      title: "Performance & LuaJIT",
      level: "deep",
      body: [
        { type: "p", text: "LÖVE runs on **LuaJIT**, so idiomatic Lua is already fast — but the GPU and the garbage collector are your usual bottlenecks, not the interpreter." },
        { type: "list", ordered: false, items: [
          "**Batch draw calls.** Each `love.graphics.draw` is GPU overhead. Use `SpriteBatch` for many identical sprites and a `Canvas` to cache static layers.",
          "**Avoid per-frame allocation.** Creating tables/strings every frame feeds the GC and causes stutter. Reuse tables; avoid `..` string concat in hot loops; pool bullets/particles.",
          "**Load once.** `newImage`/`newFont`/`newSource` are expensive — do them in `love.load`, never in `update`/`draw`.",
          "**Localize hot globals.** `local sin = math.sin` before a tight loop shaves table lookups (a classic LuaJIT micro-opt).",
          "**FFI for heavy math.** LuaJIT's `ffi` lets you use C structs/arrays for particle systems and numeric buffers when tables get too slow."
        ]},
        { type: "callout", variant: "tip", text: "Profile before optimizing: `love.timer.getFPS()`, the `love.graphics.getStats()` table (draw calls, texture memory), and libs like [`jprof`](https://github.com/pfirsich/jprof) show where frames actually go. Don't micro-optimize Lua that isn't the bottleneck." },
        { type: "callout", variant: "note", text: "LÖVE **12.0** (in development as of 2026) brings a modernized renderer (Metal/Vulkan backends, compute shaders, better GPU batching). Build against 11.5 for stability today; watch 12.0 for perf-heavy projects." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The bugs that bite every LÖVE developer, and the fix for each:" },
        { type: "table", headers: ["Symptom", "Cause", "Fix"], rows: [
          ["Everything is white / colors ignored", "Passing 0–255 to `setColor` (LÖVE 11 uses 0–1)", "Divide by 255, or `love.math.colorFromBytes(...)`"],
          ["Sprites drawn tinted the wrong color", "A previous `setColor` still active", "Reset `setColor(1,1,1)` before drawing images/text"],
          ["Game runs too fast/slow on other PCs", "Movement not scaled by `dt`", "Multiply every rate by `dt` in `update`"],
          ["Sprite orbits instead of rotating in place", "Rotating around top-left origin", "Pass `ox = w/2, oy = h/2` to `draw`"],
          ["World drifts/scales off screen over time", "`push` without matching `pop`", "Pair every `push()` with a `pop()`"],
          ["`require(\"foo/bar\")` fails", "Used a slash / added `.lua`", "Use dots, no extension: `require(\"foo.bar\")`"],
          ["Rapid SFX won't overlap", "Reusing one Source instance", "`source:clone():play()` or `stop()` then `play()`"],
          ["Physics bodies won't move / fly away", "Feeding pixels to Box2D (it uses meters)", "Set `love.physics.setMeter` and scale units"],
          [".love won't launch (\"no main.lua\")", "Zipped the folder, not its contents", "`cd` in, `zip -r ../game.love .`"],
          ["Save file never persists", "Writing outside the sandbox with `io`", "Use `love.filesystem.write` + set `t.identity`"]
        ]},
        { type: "callout", variant: "tip", text: "Two debugging staples: `print(...)` goes to the console (run `love` from a terminal, or set `t.console = true` in `conf.lua` on Windows), and `love.graphics.print(inspect(obj))` on screen. Wrap risky code in `pcall` so one error doesn't hard-crash the window." },
        { type: "callout", variant: "good", text: "Golden rules: load once in `love.load`, scale by `dt` in `love.update`, keep `love.draw` pure and reset every sticky graphics state (color/canvas/shader/transform) you set." }
      ]
    }
  ],
  packages: [
    { name: "love", why: "The runtime itself — the `love` interpreter that runs your folder/.love" },
    { name: "hump", why: "Gamestate, timer/tween, vector, camera, and a class helper in one bundle" },
    { name: "anim8", why: "Sprite-sheet animation: grids, frame timing, flipping, looping" },
    { name: "bump.lua", why: "Fast, deterministic AABB collision — the default for platformers" },
    { name: "windfield", why: "Ergonomic wrapper over love.physics (Box2D) when you want real rigid bodies" },
    { name: "Simple-Tiled-Implementation (STI)", why: "Load and render maps built in the Tiled editor" },
    { name: "baton", why: "Input mapping: unify keyboard + gamepad into rebindable actions" },
    { name: "SUIT", why: "Immediate-mode GUI toolkit for menus and in-game tools" },
    { name: "classic / middleclass", why: "Tiny OOP libraries (Lua has no built-in classes)" },
    { name: "lume", why: "General utility functions (map/filter, serialize, tween, math helpers)" },
    { name: "serpent / bitser", why: "Serialize Lua tables for save files" },
    { name: "makelove", why: "Build fused Windows/macOS/Linux/AppImage distributables from one config" },
    { name: "luasteam", why: "FFI binding to the Steamworks API for Steam releases" },
    { name: "jprof", why: "Frame profiler to find where your milliseconds actually go" }
  ],
  gotchas: [
    "**Colors are 0–1, not 0–255** since LÖVE 11.0. `setColor(255,0,0)` clamps to white — the #1 porting bug. Use `love.math.colorFromBytes` if you think in bytes.",
    "**`setColor` is sticky** — it tints everything after it, including images and text. Reset `setColor(1,1,1)` before drawing sprites you don't want tinted.",
    "**Multiply movement by `dt`.** `x = x + speed` runs at frame-rate speed; `x = x + speed * dt` runs at real-world speed on every machine.",
    "**Rotation/scale happen around the origin** `(ox,oy)`, default top-left. Pass `ox=w/2, oy=h/2` to spin a sprite in place.",
    "**Every `push()` needs a `pop()`.** A leaked transform corrupts every following frame; too many `pop`s throws an error.",
    "**`require` uses dots and no extension**: `require(\"entities.player\")`, not `\"entities/player.lua\"`. Paths are relative to the game root.",
    "**One Source = one playback.** Overlapping SFX need `source:clone():play()`; restart with `stop()` then `play()`.",
    "**Box2D works in meters, not pixels.** Set `love.physics.setMeter` and scale, or bodies won't move / will fly off.",
    "**Load assets in `love.load`**, never in `update`/`draw` — `newImage`/`newFont`/`newSource` are expensive and will stutter your loop.",
    "**`setCanvas`/`setShader` are sticky global state** like `setColor` — always reset with `setCanvas()` / `setShader()` when done.",
    "**Filesystem is sandboxed.** Write only via `love.filesystem` to the save dir; `io`/`os` paths won't work portably and are blocked on mobile.",
    "**Package the folder's *contents*, not the folder.** `main.lua` must sit at the ZIP root or LÖVE reports \"no game\".",
    "**`key` is layout-dependent, `scancode` is physical.** Use scancodes for WASD so AZERTY/Dvorak players can move.",
    "**Clamp `dt` for collision-critical games** — a lag spike can tunnel a fast object through a wall in one large step.",
    "**No package manager.** Vendor single-file libraries into your repo; don't assume `luarocks` on players' machines."
  ],
  flashcards: [
    { q: "What are LÖVE's three core callbacks?", a: "`love.load()` (once), `love.update(dt)` (logic each frame), `love.draw()` (render each frame)." },
    { q: "What range does `love.graphics.setColor` expect since LÖVE 11?", a: "**0–1 floats**, not 0–255. `setColor(1,0,0)` is red; `setColor(255,0,0)` clamps to white." },
    { q: "Why multiply by `dt`?", a: "So motion is frame-rate independent — same real speed at 30, 60, or 144 FPS. `x = x + speed * dt`." },
    { q: "How do you rotate a sprite around its center?", a: "Pass origin `ox = w/2, oy = h/2` to `love.graphics.draw` — rotation/scale pivot on the origin, which defaults to top-left." },
    { q: "What's a Quad?", a: "A rectangular sub-region of a texture — used to pull one frame out of a sprite sheet without slicing image files." },
    { q: "`static` vs `stream` audio Source?", a: "`static` decodes fully into RAM (short SFX); `stream` reads from disk on the fly (long music)." },
    { q: "How do you play the same SFX overlapping itself?", a: "Clone it: `local s = sfx:clone(); s:play()`. A single Source is one playback instance." },
    { q: "`isDown` vs `keypressed`?", a: "`love.keyboard.isDown` polls held keys (continuous, for movement); `love.keypressed` fires once per press (discrete, for jump/confirm)." },
    { q: "What does `push()`/`pop()` do?", a: "Save/restore the graphics transform (translate/rotate/scale) — the basis of cameras. Every `push` needs a matching `pop`." },
    { q: "bump.lua vs love.physics?", a: "`bump.lua` = simple deterministic AABB collision (platformers). `love.physics` = full Box2D rigid-body sim in meters." },
    { q: "How does `require` address files?", a: "Dots, no extension, relative to the game root: `require(\"entities.player\")` loads `entities/player.lua`." },
    { q: "What is a `.love` file?", a: "A ZIP of the game folder with `main.lua` at the root. Fuse it onto the LÖVE binary to ship to players without LÖVE installed." },
    { q: "What is `conf.lua` for?", a: "Runs before `love.load` to configure the window, save `identity`, target `version`, and which modules load." },
    { q: "Where can you write save files?", a: "Only the sandboxed save directory, via `love.filesystem.write` — set `t.identity` in `conf.lua` to name it." },
    { q: "What is a Canvas?", a: "An off-screen render target (framebuffer). Draw into it for post-processing, low-res pixel scaling, or caching static layers." },
    { q: "Why is LÖVE fast for a scripting framework?", a: "It runs on **LuaJIT**, JIT-compiling hot Lua to near-C speed; FFI is available for heavy numeric code." },
    { q: "`key` vs `scancode` in keypressed?", a: "`key` is the layout-dependent character; `scancode` is the physical key position. Use scancodes for WASD to support all layouts." }
  ],
  cheatsheet: [
    { label: "Run a game", code: "love mygame/     # or `love .` in the folder" },
    { label: "Minimal main.lua", code: "function love.load() end\nfunction love.update(dt) end\nfunction love.draw() end" },
    { label: "Draw a filled rect", code: "love.graphics.rectangle(\"fill\", x, y, w, h)" },
    { label: "Set color (0–1!)", code: "love.graphics.setColor(1, 0.5, 0)   -- orange" },
    { label: "Load & draw an image", code: "img = love.graphics.newImage(\"p.png\")\nlove.graphics.draw(img, x, y, angle, sx, sy, ox, oy)" },
    { label: "Frame-independent move", code: "x = x + SPEED * dt" },
    { label: "Key held (polling)", code: "if love.keyboard.isDown(\"right\") then ... end" },
    { label: "Key pressed (event)", code: "function love.keypressed(k) if k==\"space\" then jump() end end" },
    { label: "Mouse position", code: "local mx, my = love.mouse.getPosition()" },
    { label: "Play a sound", code: "sfx = love.audio.newSource(\"j.wav\", \"static\"); sfx:play()" },
    { label: "Camera push/pop", code: "love.graphics.push(); love.graphics.translate(-cx,-cy)\n  drawWorld()\nlove.graphics.pop()" },
    { label: "Load a font", code: "f = love.graphics.newFont(\"font.ttf\", 32); love.graphics.setFont(f)" },
    { label: "Wrapped/aligned text", code: "love.graphics.printf(txt, x, y, width, \"center\")" },
    { label: "New Quad (sprite sheet)", code: "q = love.graphics.newQuad(sx, sy, w, h, img:getDimensions())" },
    { label: "Canvas render target", code: "love.graphics.setCanvas(c); drawWorld(); love.graphics.setCanvas()" },
    { label: "Apply a shader", code: "love.graphics.setShader(s); love.graphics.draw(x); love.graphics.setShader()" },
    { label: "Write a save file", code: "love.filesystem.write(\"save.txt\", data)" },
    { label: "Quit", code: "love.event.quit()   -- or quit(\"restart\")" },
    { label: "Make a .love", code: "cd mygame && zip -9 -r ../mygame.love ." },
    { label: "FPS / draw stats", code: "love.timer.getFPS();  love.graphics.getStats()" }
  ]
});
