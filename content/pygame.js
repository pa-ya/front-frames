(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "pygame",
  name: "Pygame",
  language: "Python",
  group: "Game dev",
  navLabel: "Pygame (Python)",
  color: "#5aa02c",
  readMinutes: 30,
  tagline: "A thin **SDL2** wrapper for 2D games and multimedia in Python — you own the game loop, the pixels, and the timing. Use the actively-maintained **pygame-ce** fork.",

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Pygame is a set of Python modules that wrap **SDL2** (Simple DirectMedia Layer) — a battle-tested C library for windowing, 2D blitting, input, audio and image loading. It gives you a **framebuffer you draw onto** and an **event queue you poll**, and gets out of the way. It is deliberately *not* a game engine: there's no scene graph, no entity system, no physics, no editor, no asset pipeline. **You write the loop.** That's the whole point — total control, minimal magic, tiny learning surface." },
        { type: "callout", variant: "tip", text: "**Use `pygame-ce` (Community Edition), not classic `pygame`.** After a 2021 governance split, `pygame-ce` is where nearly all active development happens — new features (`Window`/`Renderer` GPU API, `FRect`, geometry helpers, better performance) land there first. It is a drop-in fork: `pip install pygame-ce` but you still `import pygame`. The two cannot be installed at the same time — pick one." },
        { type: "table", headers: ["Pygame IS", "Pygame is NOT"], rows: [
          ["A window + a Surface you blit onto", "An engine with a scene graph / ECS"],
          ["An event queue + input state", "A physics engine (use pymunk)"],
          ["An audio mixer (SDL_mixer)", "A GUI toolkit (roll your own or use pygame_gui)"],
          ["Image/font/transform helpers", "A level editor (use Tiled + pytmx)"],
          ["CPU software blitting (mostly)", "A GPU/shader framework (use pyglet/moderngl)"]
        ] },
        { type: "p", text: "**Alternatives** worth knowing: **`arcade`** (higher-level, OpenGL-backed, batteries-included sprites/physics, modern Python API) and **`pyglet`** (OpenGL windowing/media, no external deps, good for custom GL). Pygame wins on ubiquity, tutorials, simplicity, and SDL's rock-solid input/audio. Pick pygame to learn game-loop fundamentals and ship 2D games fast." },
        { type: "callout", variant: "note", text: "This deck targets **Python 3.12+** and **pygame-ce** (2.5+). Almost everything here is identical on classic pygame; where the CE fork adds something (e.g. `Window`/`Renderer`, `FRect`) it's called out." }
      ]
    },
    {
      id: "setup",
      title: "Setup & a minimal window",
      level: "core",
      body: [
        { type: "p", text: "Install into a virtualenv. `pygame.init()` boots all subsystems (display, font, mixer, etc.); `set_mode` creates the window and returns the **screen Surface** — the framebuffer everything ends up on." },
        { type: "code", lang: "bash", code: "python -m venv .venv && source .venv/bin/activate   # Windows: .venv\\Scripts\\activate\npip install pygame-ce          # the maintained fork — still `import pygame`\n# NOT `pip install pygame` (classic) — they conflict; uninstall one before the other\npython -c \"import pygame; print(pygame.ver)\"   # sanity check the version" },
        { type: "code", lang: "python", code: "import pygame\n\npygame.init()                                  # boot all subsystems\nscreen = pygame.display.set_mode((800, 600))   # window + returns the screen Surface\npygame.display.set_caption(\"Hello Pygame\")     # title bar text\n\nscreen.fill((30, 30, 40))                      # RGB dark blue-grey\npygame.display.flip()                          # push the buffer to the monitor\n\n# park so the window doesn't vanish instantly (a real loop comes next)\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\npygame.quit()                                  # clean up SDL" },
        { type: "list", items: [
          "`pygame.init()` returns `(successes, failures)` — usually you ignore it, but if audio is missing on a headless box, `mixer` init can fail silently.",
          "You can init only what you need: `pygame.display.init()`, `pygame.font.init()`, `pygame.mixer.init()`.",
          "`set_mode((w, h), flags)` — useful flags: `pygame.RESIZABLE`, `pygame.FULLSCREEN`, `pygame.SCALED` (integer-scale a fixed logical resolution to the window), `pygame.NOFRAME`.",
          "Always call `pygame.quit()` on exit to release the window and audio device cleanly."
        ] },
        { type: "callout", variant: "gotcha", text: "Nothing appears on screen until you call `pygame.display.flip()` (or `update()`). Pygame is **double-buffered**: you draw to a back buffer, then flip it to the front. Forgetting the flip is the #1 'my window is black' bug." }
      ]
    },
    {
      id: "game-loop",
      title: "The game loop (the heart of everything)",
      level: "core",
      body: [
        { type: "p", text: "Every pygame program is one loop that repeats every frame: **(1) handle events**, **(2) update game state**, **(3) draw**, **(4) flip**. A `pygame.time.Clock` throttles the loop to a target FPS with `clock.tick(fps)`, which also *returns the milliseconds since the last tick* — your delta time. This structure never changes; everything else is detail." },
        { type: "code", lang: "python", code: "import pygame\n\npygame.init()\nscreen = pygame.display.set_mode((800, 600))\npygame.display.set_caption(\"Game Loop\")\nclock = pygame.time.Clock()\n\nx, y = 100, 300\nspeed = 200          # pixels per SECOND (not per frame — see delta-time section)\nrunning = True\n\nwhile running:\n    dt = clock.tick(60) / 1000.0        # 1) throttle to 60 FPS; dt = seconds since last frame\n\n    # --- 1) EVENTS: drain the OS event queue every frame ---\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:   # window close button\n            running = False\n\n    # --- 2) UPDATE: advance game state using dt ---\n    keys = pygame.key.get_pressed()\n    if keys[pygame.K_RIGHT]:\n        x += speed * dt                 # frame-rate independent movement\n    if keys[pygame.K_LEFT]:\n        x -= speed * dt\n\n    # --- 3) DRAW: clear, then paint this frame from scratch ---\n    screen.fill((20, 20, 30))           # wipe last frame\n    pygame.draw.circle(screen, (240, 200, 60), (int(x), int(y)), 24)\n\n    # --- 4) FLIP: show the finished frame ---\n    pygame.display.flip()\n\npygame.quit()" },
        { type: "list", items: [
          "**Drain the whole event queue every frame** with the `for event in pygame.event.get():` loop. If you don't, the OS eventually flags your app as 'Not Responding' (unpumped queue = frozen app).",
          "**`clock.tick(fps)`** sleeps just enough to cap the frame rate and returns elapsed ms. Store that as `dt` — it's the single most useful number in the loop.",
          "**Clear → draw → flip, every frame.** Pygame doesn't remember what you drew; you repaint the world each frame (immediate-mode). Skip the `fill` and you get smears/trails.",
          "**Quit cleanly:** set a `running` flag to `False`, fall out of the loop, then `pygame.quit()` (and `sys.exit()` if you want to hard-stop)."
        ] },
        { type: "callout", variant: "gotcha", text: "`clock.tick(60)` caps the FPS but does **not** guarantee exactly 60 — a slow frame just takes longer and `dt` grows. That's why you multiply movement by `dt` rather than assuming a fixed step. Use `clock.tick_busy_loop(60)` for tighter timing at the cost of burning CPU." }
      ]
    },
    {
      id: "surfaces",
      title: "Surfaces, display & the coordinate system",
      level: "core",
      body: [
        { type: "p", text: "A **`Surface`** is an in-memory image (a rectangle of pixels). The window's framebuffer is just a special Surface returned by `set_mode`. You create your own Surfaces for sprites, off-screen buffers, cached text, etc. **Blitting** copies one Surface onto another." },
        { type: "code", lang: "python", code: "# the screen is a Surface\nscreen = pygame.display.set_mode((800, 600))\n\n# make your own Surface (opaque)\nbox = pygame.Surface((64, 64))\nbox.fill((200, 60, 60))             # solid red\n\n# a Surface WITH per-pixel alpha (transparency)\nglow = pygame.Surface((64, 64), pygame.SRCALPHA)   # note the flag\nglow.fill((60, 200, 255, 120))      # RGBA — last value is alpha 0..255\n\n# blit = copy a Surface onto another at (x, y) top-left\nscreen.fill((15, 15, 20))           # clear the screen\nscreen.blit(box, (100, 80))         # draw box\nscreen.blit(glow, (140, 110))       # draw semi-transparent glow on top\npygame.display.flip()" },
        { type: "table", headers: ["Concept", "Detail"], rows: [
          ["Origin", "**top-left is (0, 0)**; x grows right, **y grows DOWN** (screen coords, not math)"],
          ["Color", "RGB tuple `(r, g, b)` 0-255, or RGBA `(r, g, b, a)` with alpha 0-255"],
          ["`Surface.fill(color)`", "paint the whole surface (or a sub-`Rect`) one color — how you clear each frame"],
          ["`dest.blit(src, (x, y))`", "copy `src` onto `dest` at top-left `(x, y)`; returns the affected `Rect`"],
          ["`pygame.SRCALPHA`", "flag to give a Surface a per-pixel alpha channel (needed for transparency)"],
          ["`Surface.set_alpha(a)`", "whole-surface transparency (cheaper than per-pixel; no SRCALPHA needed)"]
        ] },
        { type: "callout", variant: "gotcha", text: "**y grows downward.** `(0, 0)` is the top-left corner; increasing y moves *down* the screen. Gravity is `y += speed`, jumping is `y -= speed`. This trips up everyone who expects math-style axes." },
        { type: "callout", variant: "note", text: "A plain `pygame.Surface((w, h))` is fully opaque black. For transparency you need either `set_alpha()` (uniform) or the `SRCALPHA` flag plus RGBA fills / a loaded PNG with an alpha channel (per-pixel)." }
      ]
    },
    {
      id: "drawing",
      title: "Drawing shapes: pygame.draw",
      level: "core",
      body: [
        { type: "p", text: "`pygame.draw` paints primitives directly onto a Surface — rectangles, circles, lines, polygons. Good for prototyping, UI, debug overlays, and simple games. For anything you draw repeatedly (a player, a tile), pre-render it to a Surface once and **blit** instead — blitting a cached image beats re-running vector draws every frame." },
        { type: "code", lang: "python", code: "screen.fill((18, 18, 24))\n\n# rect: (surface, color, Rect-or-(x,y,w,h), width=0)  width 0 = filled, >0 = outline\npygame.draw.rect(screen, (70, 160, 90), (50, 50, 120, 80))          # filled\npygame.draw.rect(screen, (240, 240, 240), (50, 50, 120, 80), 3)     # 3px outline\npygame.draw.rect(screen, (200, 80, 80), (200, 50, 120, 80), border_radius=12)\n\n# circle: (surface, color, center(x,y), radius, width=0)\npygame.draw.circle(screen, (240, 200, 60), (420, 90), 40)\n\n# line / lines: (surface, color, start, end, width)\npygame.draw.line(screen, (120, 200, 255), (50, 200), (500, 260), 4)\npygame.draw.aaline(screen, (120, 200, 255), (50, 240), (500, 300))  # antialiased\n\n# polygon: (surface, color, [points], width=0)\npygame.draw.polygon(screen, (180, 120, 255), [(600, 60), (700, 120), (650, 200), (560, 140)])\n\npygame.display.flip()" },
        { type: "list", items: [
          "The **`width`** argument: `0` (default) fills the shape; any positive value draws an outline that many pixels thick.",
          "`pygame.draw.rect` takes a `Rect` or a 4-tuple `(x, y, w, h)` — and supports `border_radius` for rounded corners (pygame-ce).",
          "`aaline`/`aalines` are antialiased (smooth) lines; regular `line` is aliased but faster.",
          "`pygame.gfxdraw` (submodule) offers antialiased circles/polygons and more primitives when you need them."
        ] },
        { type: "callout", variant: "tip", text: "**Draw vs blit:** use `pygame.draw` for one-offs and dynamic vector graphics; use `blit` for anything repeated. Rasterize a shape once into a `Surface`, then blit that Surface each frame — far cheaper than recomputing the vector fill 60 times a second." }
      ]
    },
    {
      id: "images",
      title: "Images & sprites: load, convert, transform",
      level: "core",
      body: [
        { type: "p", text: "Load an image file into a Surface with `pygame.image.load(...)`. Then — critically — call **`.convert()`** (opaque images) or **`.convert_alpha()`** (images with transparency) to convert the Surface to the display's pixel format. Skipping this is the single most common performance mistake in pygame: every blit of an unconverted Surface does a slow per-pixel format conversion." },
        { type: "code", lang: "python", code: "# load ONCE, at startup — never inside the game loop\nplayer_img = pygame.image.load(\"assets/player.png\").convert_alpha()   # has transparency\nbg_img     = pygame.image.load(\"assets/bg.jpg\").convert()             # fully opaque\n\n# transform: scale, rotate, flip (each returns a NEW Surface)\nbig    = pygame.transform.scale(player_img, (128, 128))\nsmooth = pygame.transform.smoothscale(player_img, (128, 128))   # antialiased scale\nrot    = pygame.transform.rotate(player_img, 45)                # degrees, CCW\nflipx  = pygame.transform.flip(player_img, True, False)         # mirror horizontally\nscaled = pygame.transform.scale_by(player_img, 2.0)             # relative scale (ce)\n\nscreen.blit(bg_img, (0, 0))\nscreen.blit(player_img, (350, 250))\npygame.display.flip()" },
        { type: "table", headers: ["Call", "When"], rows: [
          ["`.convert()`", "opaque images (JPG, opaque PNG) — fastest blits, drops any alpha"],
          ["`.convert_alpha()`", "images with transparency (most PNG sprites) — keeps per-pixel alpha, still fast"],
          ["no convert", "**avoid** — every blit re-converts pixel formats, murdering your frame rate"]
        ] },
        { type: "callout", variant: "warn", text: "**`convert()`/`convert_alpha()` requires the display to exist** — call `set_mode(...)` before loading/converting images, or you'll get 'cannot convert without pygame.display initialized'. Load and convert all assets once at startup, never per frame." },
        { type: "callout", variant: "gotcha", text: "**`transform.rotate` grows the Surface** to fit the rotated bounding box (and repeated rotation accumulates artifacts). Always rotate from the *original* image, and re-center: grab `new_rect = rotated.get_rect(center=old_rect.center)` so the sprite spins in place instead of drifting." }
      ]
    },
    {
      id: "rects",
      title: "Rects & collision detection",
      level: "core",
      body: [
        { type: "p", text: "A **`Rect`** is pygame's workhorse: an integer rectangle `(x, y, width, height)` with dozens of helper attributes and methods for positioning and collision. Every Surface can hand you a Rect sized to it via `surface.get_rect()`. Use Rects for position, movement, and axis-aligned bounding-box (AABB) collision." },
        { type: "code", lang: "python", code: "player = player_img.get_rect(topleft=(100, 100))   # Rect sized to the image\nenemy  = enemy_img.get_rect(center=(400, 300))\n\n# convenient virtual attributes (get AND set them)\nplayer.centerx = 400\nplayer.bottom = 590            # sit on the floor\nprint(player.x, player.y, player.width, player.center, player.midbottom)\n\n# movement\nplayer.move_ip(5, 0)           # move in place (mutates player)\nshifted = player.move(0, -10)  # returns a new moved Rect\n\n# collision\nif player.colliderect(enemy):\n    print(\"hit!\")\nif enemy.collidepoint(pygame.mouse.get_pos()):\n    print(\"mouse over enemy\")\nidx = player.collidelist([r1, r2, r3])         # first Rect it overlaps, or -1\nhits = player.collidelistall([r1, r2, r3])     # indices of ALL overlaps\n\n# draw at the Rect's position\nscreen.blit(player_img, player)                # blit accepts a Rect as dest" },
        { type: "list", items: [
          "**Position attributes:** `x/y`, `top/left/bottom/right`, `centerx/centery`, `center`, `topleft`, `midbottom`, `size`, `width/height` — set any of them to move/resize; they stay consistent.",
          "**`colliderect`** = AABB overlap test (fast, the default collision). **`collidepoint`** = is a point inside (great for mouse clicks / buttons).",
          "**`clamp`/`clamp_ip`** keeps a Rect inside a bounding Rect (constrain the player to the screen).",
          "**`inflate`/`inflate_ip`** grows/shrinks a Rect (make a hitbox smaller than the sprite for fairer collisions).",
          "pygame-ce adds **`FRect`** — a float-precision Rect for smooth sub-pixel movement (regular `Rect` truncates to ints)."
        ] },
        { type: "heading", text: "Pixel-perfect collision with masks" },
        { type: "p", text: "Rect collision is rectangular, so two sprites 'touch' as soon as their bounding boxes overlap — often too generous for irregular shapes. **`pygame.mask`** builds a bitmask of the non-transparent pixels for true pixel-perfect collision. It's more expensive, so gate it behind a cheap `colliderect` first (broad phase → narrow phase)." },
        { type: "code", lang: "python", code: "mask_a = pygame.mask.from_surface(player_img)   # build once per sprite image\nmask_b = pygame.mask.from_surface(enemy_img)\n\n# broad phase: cheap Rect test first\nif player.colliderect(enemy):\n    offset = (enemy.x - player.x, enemy.y - player.y)\n    if mask_a.overlap(mask_b, offset):          # narrow phase: pixel-perfect\n        print(\"real hit\")" },
        { type: "callout", variant: "tip", text: "Rebuild a mask only when the underlying image changes (e.g. a new animation frame or a rotation), not every frame. For most arcade games, Rect (or a slightly `inflate`-shrunk Rect) collision feels fine and is much cheaper than masks." }
      ]
    },
    {
      id: "sprites",
      title: "The sprite system: Sprite & Group",
      level: "core",
      body: [
        { type: "p", text: "`pygame.sprite` gives you a lightweight object model so you don't hand-manage lists of images and rects. Subclass **`pygame.sprite.Sprite`**; give each instance an **`image`** (a Surface) and a **`rect`** (its position). Put sprites in a **`Group`**, then `group.update()` advances them all and `group.draw(screen)` blits them all. Groups also power collision helpers." },
        { type: "code", lang: "python", code: "class Player(pygame.sprite.Sprite):\n    def __init__(self, pos):\n        super().__init__()                       # MUST call — registers the sprite\n        self.image = pygame.image.load(\"player.png\").convert_alpha()\n        self.rect = self.image.get_rect(center=pos)\n        self.speed = 300\n\n    def update(self, dt):                        # Group.update(dt) forwards args here\n        keys = pygame.key.get_pressed()\n        dx = (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * self.speed * dt\n        dy = (keys[pygame.K_DOWN]  - keys[pygame.K_UP])   * self.speed * dt\n        self.rect.x += dx\n        self.rect.y += dy\n\nclass Bullet(pygame.sprite.Sprite):\n    def __init__(self, pos):\n        super().__init__()\n        self.image = pygame.Surface((6, 12)); self.image.fill((255, 240, 120))\n        self.rect = self.image.get_rect(center=pos)\n    def update(self, dt):\n        self.rect.y -= 600 * dt\n        if self.rect.bottom < 0:\n            self.kill()                          # remove from ALL groups\n\n# groups\nall_sprites = pygame.sprite.Group()\nbullets     = pygame.sprite.Group()\nenemies     = pygame.sprite.Group()\nplayer = Player((400, 500)); all_sprites.add(player)\n\n# in the loop:\nall_sprites.update(dt)       # calls each sprite's update(dt)\nscreen.fill((10, 10, 15))\nall_sprites.draw(screen)     # blits each sprite's image at its rect\npygame.display.flip()" },
        { type: "heading", text: "Group collision helpers" },
        { type: "code", lang: "python", code: "# bullets vs enemies: kill bullets (dokill_a=True) and enemies (dokill_b=True) on hit\nhits = pygame.sprite.groupcollide(bullets, enemies, True, True)\nfor bullet, killed_enemies in hits.items():\n    score += len(killed_enemies)\n\n# player vs enemies: which enemies hit the player? (don't kill the player group=False)\ntouched = pygame.sprite.spritecollide(player, enemies, dokill=False)\nif touched:\n    player_health -= 1\n\n# use a pixel-perfect collision callback instead of Rect\npygame.sprite.spritecollide(player, enemies, False,\n                            pygame.sprite.collide_mask)" },
        { type: "table", headers: ["Helper", "Does"], rows: [
          ["`Group.add/remove`", "add/remove sprites; a sprite can be in several groups at once"],
          ["`Group.update(*args)`", "call `update(*args)` on every sprite (pass `dt`, etc.)"],
          ["`Group.draw(surface)`", "blit every sprite's `image` at its `rect` (needs both attrs)"],
          ["`sprite.kill()`", "remove a sprite from *all* groups it belongs to"],
          ["`spritecollide(spr, grp, dokill)`", "list of sprites in `grp` hitting `spr` (optionally remove them)"],
          ["`groupcollide(g1, g2, k1, k2)`", "dict of all cross-collisions between two groups"],
          ["`collide_mask` / `collide_circle`", "pass as `collided=` for pixel-perfect / circular tests"]
        ] },
        { type: "callout", variant: "gotcha", text: "You **must** call `super().__init__()` in your Sprite subclass — it initializes the internal group bookkeeping. Skip it and `add()`/`kill()` blow up. Also, `Group.draw` needs both `self.image` and `self.rect`; if you name them differently, draw won't find them." },
        { type: "callout", variant: "tip", text: "`pygame.sprite.LayeredUpdates` is a Group that draws sprites in a controllable `_layer` order — the clean way to handle z-ordering (background sprites behind the player behind the HUD)." }
      ]
    },
    {
      id: "input",
      title: "Input: events vs. polled state",
      level: "core",
      body: [
        { type: "p", text: "There are two distinct ways to read input, and mixing them up causes classic bugs. **Events** (from the queue) are *one-shot moments*: a key went down, a button was clicked, the mouse wheel scrolled. **Polled state** (`key.get_pressed()`, `mouse.get_pressed()`, `mouse.get_pos()`) is a *continuous snapshot*: is this key held **right now**? Use events for discrete actions (jump, shoot, menu select) and polled state for continuous ones (walking, aiming)." },
        { type: "code", lang: "python", code: "for event in pygame.event.get():\n    if event.type == pygame.QUIT:\n        running = False\n\n    # --- one-shot: the moment a key is pressed / released ---\n    elif event.type == pygame.KEYDOWN:\n        if event.key == pygame.K_SPACE:\n            jump()                       # fires ONCE per press\n        elif event.key == pygame.K_ESCAPE:\n            paused = not paused\n    elif event.type == pygame.KEYUP:\n        if event.key == pygame.K_SPACE:\n            release_jump()\n\n    # --- mouse ---\n    elif event.type == pygame.MOUSEBUTTONDOWN:\n        if event.button == 1:            # 1=left, 2=middle, 3=right, 4/5=wheel\n            shoot_at(event.pos)          # event.pos = (x, y) at click time\n    elif event.type == pygame.MOUSEWHEEL:\n        zoom += event.y                  # +1 up / -1 down\n\n# --- continuous: polled every frame, OUTSIDE the event loop ---\nkeys = pygame.key.get_pressed()\nif keys[pygame.K_d]:  player.rect.x += speed * dt   # held-down movement\nif keys[pygame.K_a]:  player.rect.x -= speed * dt\n\nmx, my = pygame.mouse.get_pos()          # current cursor position\nif pygame.mouse.get_pressed()[0]:        # left button held down\n    paint(mx, my)" },
        { type: "table", headers: ["Need", "Use", "Why"], rows: [
          ["Jump, shoot, menu click", "`KEYDOWN` / `MOUSEBUTTONDOWN` events", "fires exactly once per press (one-shot)"],
          ["Walk, run, hold-to-charge", "`key.get_pressed()` polling", "true every frame the key is held (continuous)"],
          ["Aim / drag / hover", "`mouse.get_pos()` polling", "always the current position"],
          ["Text entry", "`pygame.TEXTINPUT` event", "handles layouts/IME; gives `event.text`"]
        ] },
        { type: "callout", variant: "gotcha", text: "If you check `key.get_pressed()` for a *jump*, the player will jump **every frame the key is held** (dozens of times). Discrete actions belong in `KEYDOWN`. Conversely, driving *walking* off `KEYDOWN` makes movement stutter (KEYDOWN only repeats at the OS key-repeat rate). One-shot → events; continuous → polling." },
        { type: "callout", variant: "note", text: "`event.key` is a *keycode* (physical-ish, layout-dependent). For WASD-vs-arrows and non-QWERTY layouts, `pygame.key.get_pressed()` indexes by the same `K_*` constants. Use `pygame.key.set_repeat(delay, interval)` if you actually want KEYDOWN to auto-repeat (e.g. menu navigation)." }
      ]
    },
    {
      id: "delta-time",
      title: "Delta-time: frame-rate independent movement",
      level: "core",
      body: [
        { type: "p", text: "**Never move by a fixed number of pixels per frame.** If you write `x += 5` each frame, your game runs twice as fast on a 120 Hz monitor as on 60 Hz, and slows to a crawl when frames drop. Instead, express speed in **units per second** and multiply by **delta time** (`dt`, the seconds elapsed since the last frame). Then a body moves the same real-world distance regardless of frame rate." },
        { type: "code", lang: "python", code: "clock = pygame.time.Clock()\nspeed = 250          # pixels per SECOND\nx = 100.0            # keep position as a float for smooth sub-pixel motion\n\nwhile running:\n    dt = clock.tick(60) / 1000.0     # ms -> seconds (e.g. ~0.0167 at 60 FPS)\n\n    x += speed * dt                  # RIGHT: distance scales with real time\n    # x += 5                         # WRONG: speed depends on frame rate\n\n    screen.fill((0, 0, 0))\n    screen.blit(img, (round(x), 300))   # round only at draw time\n    pygame.display.flip()" },
        { type: "list", items: [
          "`dt = clock.tick(fps) / 1000.0` gives seconds. Everything time-based — velocity, timers, animation — multiplies by `dt`.",
          "**Keep positions as floats.** A `Rect` stores ints and truncates fractional movement; accumulate position in a `float` (or pygame-ce `FRect`) and only round when blitting.",
          "For gravity/acceleration: `vy += gravity * dt; y += vy * dt` (semi-implicit Euler) — stable and simple.",
          "**Clamp huge `dt` spikes:** after a stall (window drag, GC pause) `dt` can jump, teleporting objects through walls. Cap it: `dt = min(dt, 0.05)`.",
          "For deterministic physics, use a **fixed timestep**: accumulate `dt` and step the simulation in fixed 1/60 s chunks (the 'fix your timestep' pattern) — matters for networked/replay games."
        ] },
        { type: "callout", variant: "warn", text: "Rects hold integers. If your speed × dt is less than 1 pixel per frame and you assign it straight to `rect.x`, the fraction is truncated to 0 and the sprite **never moves**. Store the real position in a float attribute, add `speed * dt` to it, then set `self.rect.x = round(self.pos_x)` for drawing." }
      ]
    },
    {
      id: "text",
      title: "Text & fonts",
      level: "core",
      body: [
        { type: "p", text: "Text isn't drawn directly — you **render** a string with a `Font` into a Surface, then blit that Surface. Rendering is comparatively expensive, so **cache** the rendered Surface and only re-render when the text actually changes (not every frame for a static label)." },
        { type: "code", lang: "python", code: "pygame.font.init()   # (pygame.init already does this)\n\n# a font from a .ttf file (bundle your own for consistent looks)\nfont   = pygame.font.Font(\"assets/PressStart2P.ttf\", 24)\n# or a system font (availability varies across machines)\nui     = pygame.font.SysFont(\"consolas\", 20, bold=True)\n\n# render(text, antialias, color, background=None) -> Surface\ntitle = font.render(\"GAME OVER\", True, (240, 80, 80))\nscreen.blit(title, title.get_rect(center=(400, 200)))\n\n# a HUD score that changes -> re-render only when it changes\nlast_score = None\nscore_surf = None\ndef draw_score(score):\n    global last_score, score_surf\n    if score != last_score:                      # cache: skip re-render if unchanged\n        score_surf = ui.render(f\"Score: {score}\", True, (230, 230, 230))\n        last_score = score\n    screen.blit(score_surf, (16, 16))" },
        { type: "list", items: [
          "`Font(path, size)` loads a TrueType font; `SysFont(name, size)` finds an installed one (`pygame.font.get_fonts()` lists them). Bundle a `.ttf` so your game looks the same everywhere.",
          "`render(text, antialias, color)` returns a new Surface every call — cache it; don't render inside the loop for static text.",
          "`render` does **not** wrap lines or handle `\\n` (classic pygame). Split on newlines yourself and blit line-by-line, or use pygame-ce's `font.render(..., wraplength=px)` for word-wrapping.",
          "`font.size(text)` measures a string without rendering (useful for layout/centering)."
        ] },
        { type: "callout", variant: "tip", text: "Antialias (`True`) looks smooth on most fonts but blurry on tiny pixel fonts — pass `False` for crisp retro bitmap text. For lots of dynamic text, consider `pygame.freetype` (finer control, direct-to-surface rendering) instead of `pygame.font`." }
      ]
    },
    {
      id: "audio",
      title: "Sound & music: pygame.mixer",
      level: "core",
      body: [
        { type: "p", text: "`pygame.mixer` wraps SDL_mixer. There are two models: **`Sound`** objects are loaded fully into memory and played on channels — use them for short SFX (jumps, hits, coins). **`music`** streams a single track from disk — use it for the background soundtrack. Initialize the mixer before loading audio." },
        { type: "code", lang: "python", code: "# init the mixer (pygame.init does this, but you can tune it first)\npygame.mixer.pre_init(frequency=44100, size=-16, channels=2, buffer=512)\npygame.init()\n\n# --- short sound effects (fully loaded, low-latency) ---\njump = pygame.mixer.Sound(\"assets/jump.wav\")   # WAV/OGG; keep SFX short\ncoin = pygame.mixer.Sound(\"assets/coin.ogg\")\njump.set_volume(0.6)\njump.play()                                    # fire and forget\ncoin.play(loops=0)                             # loops=-1 = loop forever\n\n# channels: control simultaneous sounds\npygame.mixer.set_num_channels(16)              # how many can overlap\nch = pygame.mixer.Channel(3)\nch.play(coin)                                  # play on a specific channel\n\n# --- streamed background music (one at a time) ---\npygame.mixer.music.load(\"assets/theme.ogg\")    # streamed, not preloaded\npygame.mixer.music.set_volume(0.4)\npygame.mixer.music.play(loops=-1)              # loop the soundtrack\n# pygame.mixer.music.fadeout(2000)             # fade over 2s\n# pygame.mixer.music.pause() / .unpause() / .stop()" },
        { type: "table", headers: ["", "`Sound`", "`mixer.music`"], rows: [
          ["Loading", "fully into RAM", "streamed from disk"],
          ["Use for", "short SFX, many at once", "one long background track"],
          ["Concurrency", "many, on channels", "a single stream"],
          ["Latency", "low (preloaded)", "higher (streamed)"],
          ["Volume", "`snd.set_volume()` / per-channel", "`mixer.music.set_volume()`"]
        ] },
        { type: "callout", variant: "gotcha", text: "**Audio needs `pygame.mixer.init()`** (done by `pygame.init()`, but it can fail on headless/CI boxes with no audio device — wrap it in try/except). Prefer **OGG** over MP3 (licensing/decoder issues); use short WAV/OGG for SFX and OGG for music. Big buffer = latency; tiny buffer = crackle — 512 is a decent default." }
      ]
    },
    {
      id: "animation",
      title: "Animation: sprite sheets & frame timing",
      level: "core",
      body: [
        { type: "p", text: "2D animation = cycling through frames. Rather than 20 separate PNGs, artists ship one **sprite sheet** (a grid of frames); you slice frames out with `Surface.subsurface(Rect)` (or `blit` a sub-region). Advance the frame on a **timer driven by `dt`**, not once per game frame — otherwise the animation speed follows the frame rate." },
        { type: "code", lang: "python", code: "sheet = pygame.image.load(\"assets/run_sheet.png\").convert_alpha()\nFRAME_W, FRAME_H, N = 32, 32, 6\n\n# slice frames out of the sheet once, at load time\nframes = [sheet.subsurface(pygame.Rect(i * FRAME_W, 0, FRAME_W, FRAME_H))\n          for i in range(N)]\n\nclass Runner(pygame.sprite.Sprite):\n    def __init__(self, pos):\n        super().__init__()\n        self.frames = frames\n        self.index = 0.0\n        self.fps = 10                       # animation frames per second\n        self.image = self.frames[0]\n        self.rect = self.image.get_rect(center=pos)\n\n    def update(self, dt):\n        self.index += self.fps * dt         # advance by real time\n        if self.index >= len(self.frames):\n            self.index = 0.0                # loop\n        self.image = self.frames[int(self.index)]" },
        { type: "list", items: [
          "**Slice once** at load time into a `frames` list; never `subsurface`/`load` inside `update`.",
          "**Drive timing with `dt`:** `index += fps * dt` and take `int(index)` — decoupled from your rendering frame rate.",
          "`subsurface` returns a *view* sharing pixels with the parent Surface (no copy). Convert the sheet with `convert_alpha()` first so all frames inherit the fast format.",
          "For directional sprites, keep a dict of frame lists (`{'left': [...], 'right': [...]}`) or `transform.flip` one set to face the other way.",
          "Trigger events on specific frames (e.g. spawn a hit on frame 3) by checking `int(self.index)` transitions."
        ] },
        { type: "callout", variant: "tip", text: "Tools like **Aseprite** export sprite sheets plus a JSON atlas of frame rects/durations — load that JSON to get per-frame timing for free instead of assuming a uniform grid. For tile-based level art, author maps in **Tiled** and load them with **`pytmx`**." }
      ]
    },
    {
      id: "scenes",
      title: "Scenes & state management",
      level: "core",
      body: [
        { type: "p", text: "Real games have multiple screens — menu, gameplay, pause, game-over. Cramming them into one giant loop with `if state == ...` branches rots fast. Use a simple **scene/state machine**: each scene is an object with `handle_events`, `update(dt)`, and `draw(screen)`, and it can request a switch to another scene. The main loop just drives 'the current scene'." },
        { type: "code", lang: "python", code: "class Scene:\n    next_scene = None                     # set to another Scene to switch\n    def handle_events(self, events): ...\n    def update(self, dt): ...\n    def draw(self, screen): ...\n\nclass Menu(Scene):\n    def __init__(self, font): self.font = font\n    def handle_events(self, events):\n        for e in events:\n            if e.type == pygame.KEYDOWN and e.key == pygame.K_RETURN:\n                self.next_scene = Play(self.font)     # start the game\n    def draw(self, screen):\n        screen.fill((15, 15, 25))\n        screen.blit(self.font.render(\"PRESS ENTER\", True, (230, 230, 230)), (280, 280))\n\nclass Play(Scene):\n    def __init__(self, font):\n        self.font = font; self.x = 100; self.hp = 3\n    def update(self, dt):\n        self.x += 200 * dt\n        if self.hp <= 0:\n            self.next_scene = GameOver(self.font)\n    def draw(self, screen):\n        screen.fill((10, 20, 15))\n        pygame.draw.circle(screen, (240, 200, 60), (int(self.x) % 800, 300), 20)\n\nclass GameOver(Scene):\n    def __init__(self, font): self.font = font\n    def handle_events(self, events):\n        for e in events:\n            if e.type == pygame.KEYDOWN: self.next_scene = Menu(self.font)\n    def draw(self, screen):\n        screen.fill((25, 10, 10))\n        screen.blit(self.font.render(\"GAME OVER\", True, (240, 80, 80)), (300, 280))\n\n# --- the whole main loop is now tiny ---\npygame.init()\nscreen = pygame.display.set_mode((800, 600)); clock = pygame.time.Clock()\nfont = pygame.font.SysFont(\"consolas\", 32)\nscene = Menu(font)\nrunning = True\nwhile running:\n    dt = clock.tick(60) / 1000.0\n    events = pygame.event.get()\n    for e in events:\n        if e.type == pygame.QUIT: running = False\n    scene.handle_events(events)\n    scene.update(dt)\n    scene.draw(screen)\n    if scene.next_scene:                  # switch scenes\n        scene = scene.next_scene\n    pygame.display.flip()\npygame.quit()" },
        { type: "callout", variant: "tip", text: "For pause/inventory overlays, use a **stack** of scenes instead of a single current scene: push 'Pause' on top of 'Play' (Play keeps its state, isn't destroyed), pop it to resume. This is the cleanest way to handle modal screens without losing gameplay state." }
      ]
    },
    {
      id: "performance",
      title: "Performance",
      level: "deep",
      body: [
        { type: "p", text: "Pygame blitting is CPU software rendering (on the classic surface API), so performance is about **doing less per frame**: convert your surfaces, avoid re-loading/re-rendering, and don't overdraw. Profile with the on-screen FPS (`clock.get_fps()`) before optimizing." },
        { type: "list", items: [
          "**`convert()` / `convert_alpha()` every loaded image** — the single biggest win. Unconverted Surfaces blit several times slower.",
          "**Load and render once, not per frame.** No `image.load`, `font.render`, `transform.scale`, or `mask.from_surface` inside the loop — pre-compute at startup or on change.",
          "**`Group.draw`** batches sprite blits and is faster than looping `screen.blit` in Python for each sprite.",
          "**Dirty-rect rendering:** instead of redrawing the whole screen, track the rectangles that changed and update only those with `pygame.display.update(rect_list)`. `pygame.sprite.RenderUpdates`/`LayeredDirty` + `display.update(dirty)` automate this — big win for mostly-static screens; little benefit for full-scrolling games (redraw everything with `flip()` there).",
          "**Cull off-screen work:** don't blit or update sprites outside the view; `Rect.colliderect(screen_rect)` is a cheap visibility test.",
          "**Prefer `set_mode(..., SCALED | vsync=1)`** to render a small logical resolution and let SDL scale — fewer pixels to touch, and vsync avoids tearing.",
          "For thousands of sprites or true GPU speed, use pygame-ce's **`Window`/`Renderer`/`Texture`** GPU API (hardware-accelerated), or move to `arcade`/`pyglet`/`moderngl`."
        ] },
        { type: "code", lang: "python", code: "# dirty-rect style: only update what changed\nall_sprites = pygame.sprite.LayeredDirty()   # tracks dirty rects for you\n# ... add sprites; each Sprite sets self.dirty = 1 when it moves ...\nall_sprites.clear(screen, background)        # restore background under old positions\ndirty = all_sprites.draw(screen)             # returns changed rects\npygame.display.update(dirty)                 # update ONLY those rects (not the whole screen)\n\n# show real FPS to know if you even need to optimize\npygame.display.set_caption(f\"FPS: {clock.get_fps():.0f}\")" },
        { type: "callout", variant: "note", text: "Python-level per-object work (thousands of `update()` calls, per-pixel loops) is usually the real bottleneck, not blitting. Batch, cache, and push hot loops into vectorized `Surface` ops or `pygame.surfarray` (NumPy views of pixels) rather than Python `for` loops over pixels." }
      ]
    },
    {
      id: "packaging",
      title: "Packaging: PyInstaller & pygbag (web)",
      level: "deep",
      body: [
        { type: "p", text: "Ship a desktop build as a single executable with **PyInstaller**. The tricky part is **bundling assets** (images, fonts, sounds): they aren't imported, so PyInstaller doesn't find them — you must add them with `--add-data` and resolve paths correctly at runtime (assets live in a temp dir when frozen)." },
        { type: "code", lang: "bash", code: "pip install pyinstaller\n\n# one-file build, windowed (no console), with an assets/ folder bundled\n# Linux/macOS use ':' as the separator; Windows uses ';'\npyinstaller --onefile --windowed \\\n  --add-data \"assets:assets\" \\\n  --name MyGame main.py\n# -> dist/MyGame (the distributable executable)" },
        { type: "code", lang: "python", code: "import sys, os\n\ndef resource_path(rel):\n    \"\"\"Resolve an asset path in dev AND inside a PyInstaller bundle.\"\"\"\n    base = getattr(sys, \"_MEIPASS\", os.path.abspath(\".\"))  # _MEIPASS = unpack dir when frozen\n    return os.path.join(base, rel)\n\nplayer = pygame.image.load(resource_path(\"assets/player.png\")).convert_alpha()" },
        { type: "heading", text: "Web / WASM with pygbag" },
        { type: "p", text: "**`pygbag`** compiles a pygame(-ce) game to WebAssembly so it runs in the browser (via Pyodide/Emscripten) — great for itch.io and jam entries. The catch: the loop must be **async** and `await asyncio.sleep(0)` once per frame so the browser can breathe. pygame-ce is the recommended runtime for pygbag." },
        { type: "code", lang: "python", code: "import asyncio, pygame\n\nasync def main():\n    pygame.init()\n    screen = pygame.display.set_mode((640, 360))\n    clock = pygame.time.Clock()\n    running = True\n    while running:\n        for e in pygame.event.get():\n            if e.type == pygame.QUIT: running = False\n        screen.fill((20, 20, 30))\n        pygame.display.flip()\n        clock.tick(60)\n        await asyncio.sleep(0)      # REQUIRED for the browser event loop\n    pygame.quit()\n\nasyncio.run(main())" },
        { type: "code", lang: "bash", code: "pip install pygbag\npygbag main.py            # builds + serves at http://localhost:8000\npygbag --build main.py    # just produce build/web/ to upload to itch.io" },
        { type: "callout", variant: "gotcha", text: "For a web build the top-level structure must be async with `await asyncio.sleep(0)` each frame — a normal blocking `while` loop hard-freezes the browser tab. Keep the entry file named `main.py`, and remember `pygame.quit()`/`sys.exit()` behave differently under WASM (the tab owns the process)." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that produce a black screen, a stuttering game, or a 'Not Responding' window. Almost every beginner hits several of these." },
        { type: "heading", text: "1. Forgetting convert()/convert_alpha()" },
        { type: "callout", variant: "warn", text: "Blitting an unconverted Surface re-converts pixel formats **every blit** — several times slower. Always `pygame.image.load(path).convert()` (opaque) or `.convert_alpha()` (transparent) right after loading. Requires `set_mode` to have run first." },
        { type: "heading", text: "2. Nothing shows on screen" },
        { type: "callout", variant: "gotcha", text: "You must call **`pygame.display.flip()`** (or `update()`) at the end of every frame to present the back buffer. No flip = permanently black window. If only part updates, you passed a too-small rect list to `update()`." },
        { type: "heading", text: "3. Window says 'Not Responding'" },
        { type: "callout", variant: "gotcha", text: "You must **pump the event queue every frame** (`pygame.event.get()` or `pygame.event.pump()`). If you don't drain it, the OS thinks your app hung and greys it out. Never do long blocking work (big file loads, `time.sleep`) inside the loop." },
        { type: "heading", text: "4. Game runs at different speeds on different machines" },
        { type: "callout", variant: "warn", text: "Frame-rate-dependent movement (`x += 5` per frame) is faster on high-refresh monitors and stutters on slow ones. Multiply by **delta time**: `x += speed * dt` where `dt = clock.tick(60)/1000`. And cap `dt` (`min(dt, 0.05)`) to survive stalls." },
        { type: "heading", text: "5. Loading assets inside the loop" },
        { type: "callout", variant: "gotcha", text: "`pygame.image.load`, `font.render`, `mixer.Sound(...)`, and `transform.scale` inside the game loop re-do disk/CPU work every frame and tank performance (and leak). Load and pre-render **once** at startup; keep handles in variables." },
        { type: "heading", text: "6. Blitting order (painter's algorithm)" },
        { type: "callout", variant: "note", text: "Pygame draws in the order you blit — **later blits cover earlier ones**. Draw background first, then entities, then the HUD last. For dynamic z-order use `pygame.sprite.LayeredUpdates`/`LayeredDirty` and a `_layer` attribute." },
        { type: "heading", text: "7. Coordinate confusion (y grows down)" },
        { type: "callout", variant: "gotcha", text: "Origin `(0,0)` is the **top-left**; y increases **downward**. Jump is `y -= v`, gravity is `y += v`. And `rect.x` is an int — accumulate real positions in a float and round only when drawing, or sub-pixel movement gets truncated to zero." },
        { type: "heading", text: "8. No sound" },
        { type: "callout", variant: "gotcha", text: "Audio needs `pygame.mixer.init()` (usually via `pygame.init()`), which can silently fail with no audio device (CI/headless/WSL). Wrap it in try/except, prefer OGG/WAV over MP3, and remember a `Sound` object must stay referenced or it may be garbage-collected mid-play." },
        { type: "callout", variant: "note", text: "General discipline: convert every asset, load once, drain events every frame, move by `dt`, clear→draw→flip in that order, and check `clock.get_fps()` before you optimize anything." }
      ]
    }
  ],

  packages: [
    { name: "pygame-ce", why: "the actively-maintained Community Edition fork (`pip install pygame-ce`, `import pygame`) — new features, fixes, GPU Window/Renderer, FRect. Use this." },
    { name: "pygame", why: "the classic/original package; still works but development stalled after the 2021 split. Conflicts with pygame-ce — install only one." },
    { name: "pytmx", why: "loads Tiled (.tmx) tile maps + object layers into pygame Surfaces — the standard way to build levels without hand-coding tile grids" },
    { name: "pymunk", why: "2D rigid-body physics (Chipmunk) — real collisions, joints, gravity; pairs with pygame for platformers/physics games" },
    { name: "pygame_gui", why: "themeable UI widgets (buttons, text entry, windows, sliders) on top of pygame — saves rolling your own menu system" },
    { name: "pyinstaller", why: "bundle the game into a standalone desktop executable; use --add-data to include assets, _MEIPASS to resolve paths" },
    { name: "pygbag", why: "compile a pygame-ce game to WebAssembly to run in the browser (Pyodide) — itch.io/jam distribution; requires an async loop" },
    { name: "pytweening / easing-functions", why: "easing curves (ease-in/out, bounce) for smooth animations, camera moves, and UI transitions" },
    { name: "numpy", why: "back `pygame.surfarray`/`sndarray` for fast per-pixel/sample manipulation without Python-level loops" },
    { name: "esper", why: "a lightweight Entity-Component-System you can layer on pygame when the sprite model outgrows plain OOP" },
    { name: "pyfxr / pygame.mixer", why: "generate/play retro sound effects; mixer (SDL_mixer) is built in for SFX + streamed music" },
    { name: "cx_Freeze / briefcase", why: "alternative packagers (briefcase targets desktop + mobile app stores) if PyInstaller doesn't fit your pipeline" }
  ],

  gotchas: [
    "**Call `convert()`/`convert_alpha()`** on every loaded image right after `pygame.image.load` — unconverted Surfaces blit several times slower. Needs `set_mode` first.",
    "**Nothing renders until `pygame.display.flip()`** (or `update()`). Pygame is double-buffered; the flip presents the back buffer. Forgetting it = black window.",
    "**Drain the event queue every frame** (`pygame.event.get()`), or the OS marks the app 'Not Responding'. Never block (sleep, big loads) inside the loop.",
    "**Move by `speed * dt`, not fixed pixels.** `dt = clock.tick(60)/1000`. Fixed-per-frame movement runs at different speeds on different refresh rates; also clamp `dt` after stalls.",
    "**`Rect` stores ints** — sub-pixel `speed*dt` gets truncated to 0. Keep the real position in a float (or pygame-ce `FRect`) and round only when blitting.",
    "**y grows downward**, origin top-left. Jump is `y -= v`, gravity `y += v`. Not math-style axes.",
    "**Blit order is painter's algorithm** — later blits cover earlier ones. Background → entities → HUD. Use `LayeredUpdates` for z-order.",
    "**One-shot vs held input:** discrete actions (jump/shoot) belong in `KEYDOWN` events; continuous movement uses `key.get_pressed()` polling. Swapping them causes machine-gun jumps or stuttery walking.",
    "**Call `super().__init__()`** in every `Sprite` subclass, and give it both `self.image` and `self.rect`, or `Group.add`/`kill`/`draw` break.",
    "**`transform.rotate` grows the Surface** and drifts the sprite — always rotate the original and re-center via `rotated.get_rect(center=old.center)`.",
    "**Don't load/render inside the loop** — `image.load`, `font.render`, `Sound(...)`, `transform.scale`, `mask.from_surface` are startup/on-change work, not per-frame.",
    "**Audio needs `mixer.init()`** (via `pygame.init()`), which can fail silently with no audio device. Prefer OGG/WAV over MP3; keep `Sound` objects referenced so they aren't GC'd mid-play.",
    "**`SysFont` availability varies** across machines — bundle a `.ttf` and load it with `pygame.font.Font` for a consistent look.",
    "**`pygame.font.render` doesn't wrap** (classic) — split newlines yourself or use pygame-ce's `wraplength=`. Cache the rendered Surface for static text.",
    "**pygbag needs an async loop** with `await asyncio.sleep(0)` per frame; a blocking `while` freezes the browser tab. Entry file must be `main.py`.",
    "**pygame vs pygame-ce can't coexist** — installing one requires uninstalling the other; both expose `import pygame`."
  ],

  flashcards: [
    { q: "pygame vs pygame-ce — which and why?", a: "Use **pygame-ce** (Community Edition): `pip install pygame-ce`, still `import pygame`. It's the actively-developed fork since the 2021 split, with new features (Window/Renderer GPU API, FRect) and fixes. Classic `pygame` still works but lags. They can't be installed together." },
    { q: "What are the four steps of the game loop?", a: "1) **Handle events** (`pygame.event.get()`), 2) **update** game state (using `dt`), 3) **draw** (clear → blit/draw), 4) **flip** (`pygame.display.flip()`). Throttle with `clock.tick(fps)`." },
    { q: "What does `clock.tick(60)` return and why does it matter?", a: "It caps the loop to ~60 FPS **and returns milliseconds since the last tick**. Divide by 1000 to get `dt` (seconds) and multiply all movement by it for frame-rate-independent motion." },
    { q: "convert() vs convert_alpha()?", a: "Both convert a loaded image to the display's pixel format for fast blitting. `convert()` for opaque images (drops alpha); `convert_alpha()` for images with transparency (keeps per-pixel alpha). Call one right after `image.load` — requires `set_mode` first." },
    { q: "Why is `x += 5` per frame wrong?", a: "It ties speed to frame rate — twice as fast at 120 Hz as 60 Hz, and slows on dropped frames. Use `x += speed * dt` (speed in pixels/second, `dt` in seconds). Keep position as a float since `Rect` truncates." },
    { q: "Events vs polled input — when to use each?", a: "**Events** (`KEYDOWN`/`MOUSEBUTTONDOWN`) are one-shot: use for jump, shoot, menu select. **Polling** (`key.get_pressed()`, `mouse.get_pos()`) is continuous: use for walking, aiming. Using polling for a jump fires it every frame the key is held." },
    { q: "What two attributes must a Sprite have for Group.draw?", a: "`self.image` (a Surface) and `self.rect` (its position). `Group.draw(screen)` blits each sprite's `image` at its `rect`. Also call `super().__init__()` in the subclass." },
    { q: "How do you do pixel-perfect collision?", a: "`pygame.mask.from_surface(img)` builds a bitmask of opaque pixels, then `mask_a.overlap(mask_b, offset)`. Gate it behind a cheap `rect.colliderect` (broad phase) first, and only rebuild masks when the image changes." },
    { q: "Sound vs mixer.music?", a: "`pygame.mixer.Sound` loads short SFX fully into RAM and plays on channels (many at once, low latency). `pygame.mixer.music` streams one long track from disk (the soundtrack). Both need `mixer.init()`." },
    { q: "Why doesn't anything appear in my window?", a: "You forgot `pygame.display.flip()` / `update()` — pygame is double-buffered and nothing shows until you present the back buffer. (Or you never `fill`ed/blit'ed, or drew off-screen.)" },
    { q: "Why does my app go 'Not Responding'?", a: "You didn't pump the event queue. Call `pygame.event.get()` (or `pygame.event.pump()`) every frame; never block with sleeps or big synchronous loads inside the game loop." },
    { q: "How do you rotate a sprite without it drifting?", a: "`transform.rotate` returns a bigger Surface (bounding box grows), shifting the top-left. Rotate the **original** image each time and re-anchor: `new_rect = rotated.get_rect(center=old_rect.center)`." },
    { q: "How do you slice a sprite sheet and time animation?", a: "`sheet.subsurface(pygame.Rect(i*w, 0, w, h))` for each frame (once, at load). Advance with `index += anim_fps * dt; image = frames[int(index) % len(frames)]` so speed is frame-rate independent." },
    { q: "How do you structure menu → play → game-over?", a: "A scene/state machine: each Scene has `handle_events`, `update(dt)`, `draw(screen)` and can set `next_scene`. The main loop drives the current scene and swaps when `next_scene` is set. Use a scene stack for pause overlays." },
    { q: "What is dirty-rect rendering and when to use it?", a: "Redraw only the rectangles that changed via `pygame.display.update(rect_list)` (or `LayeredDirty` + returned rects) instead of the whole screen with `flip()`. Big win for mostly-static screens; negligible for full-scrolling games." },
    { q: "How do you bundle assets with PyInstaller?", a: "`pyinstaller --onefile --windowed --add-data \"assets:assets\" main.py` (use `;` on Windows). At runtime resolve paths against `sys._MEIPASS` (the temp unpack dir) so loads work both in dev and frozen." },
    { q: "What must change for a pygbag (web) build?", a: "The loop must be **async**: wrap it in `async def main()`, `asyncio.run(main())`, and `await asyncio.sleep(0)` once per frame so the browser can run. Entry file must be `main.py`; use pygame-ce." }
  ],

  cheatsheet: [
    { label: "Install (maintained fork)", code: "pip install pygame-ce   # still: import pygame" },
    { label: "Init + window", code: "pygame.init(); screen = pygame.display.set_mode((800,600))" },
    { label: "Clock + dt", code: "clock = pygame.time.Clock(); dt = clock.tick(60)/1000" },
    { label: "Event loop", code: "for e in pygame.event.get():\n    if e.type == pygame.QUIT: running = False" },
    { label: "Held-key polling", code: "keys = pygame.key.get_pressed(); keys[pygame.K_RIGHT]" },
    { label: "Clear / present", code: "screen.fill((20,20,30)); ...; pygame.display.flip()" },
    { label: "Load image (fast)", code: "img = pygame.image.load('p.png').convert_alpha()" },
    { label: "Blit", code: "screen.blit(img, rect)   # or (x, y)" },
    { label: "Rect from surface", code: "rect = img.get_rect(center=(400,300))" },
    { label: "AABB collision", code: "if a.colliderect(b): ...   # a.collidepoint(mx,my)" },
    { label: "Move by dt", code: "pos_x += speed*dt; rect.x = round(pos_x)" },
    { label: "Draw shapes", code: "pygame.draw.circle(screen,(240,200,60),(x,y),r)" },
    { label: "Text", code: "surf = font.render('Hi', True, (255,255,255)); screen.blit(surf,(x,y))" },
    { label: "Sprite group", code: "g = pygame.sprite.Group(); g.update(dt); g.draw(screen)" },
    { label: "Group collision", code: "pygame.sprite.groupcollide(bullets, enemies, True, True)" },
    { label: "Rotate + recenter", code: "r = pygame.transform.rotate(img, a); rc = r.get_rect(center=rect.center)" },
    { label: "SFX / music", code: "snd = pygame.mixer.Sound('x.wav'); snd.play(); pygame.mixer.music.play(-1)" },
    { label: "Package desktop", code: "pyinstaller --onefile --windowed --add-data 'assets:assets' main.py" }
  ]
});
