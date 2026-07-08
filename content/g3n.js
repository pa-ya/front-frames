(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "g3n",
  name: "G3N",
  language: "Go",
  group: "3D graphics",
  navLabel: "G3N (Go)",
  color: "#2da9a0",
  readMinutes: 36,
  tagline: "The most-used **Go 3D engine** (`github.com/g3n/engine`) — a full **scene-graph** engine over OpenGL with geometries, materials, lights, cameras, a GUI, loaders and audio, plus the **`math32`** linear-algebra you need to actually build 3D.",

  sections: [
    {
      id: "overview",
      title: "Overview & the scene-graph mental model",
      level: "core",
      body: [
        { type: "p", text: "**G3N** (\"gen\", `github.com/g3n/engine`) is a full **retained-mode 3D engine** for Go, not a thin OpenGL wrapper. You never issue draw calls yourself: you build a **tree of nodes** (the *scene graph*), attach a **camera** and hand the tree to a **renderer**, and G3N walks the tree, computes transforms, sorts by material, uploads buffers and draws. It sits on top of OpenGL 3.3+ via cgo and GLFW for windowing." },
        { type: "list", items: [
          "**Retained vs immediate:** you *describe* a persistent scene (add a `Mesh` once, mutate its transform each frame) rather than re-emitting geometry every frame. The engine caches GPU state for you.",
          "**A node is a transform + children.** `core.Node` holds a position/rotation/scale and a list of child nodes. A `graphic.Mesh` is a node that also owns a geometry + material; a `camera.Camera`, a `light.Point`, and a `gui.Button` are all nodes too — everything lives in the same tree.",
          "**Feature set:** built-in geometries (box/sphere/torus/…), materials (unlit/Phong/PBR), four light types, perspective + orthographic cameras with orbit/fly controls, a full immediate-retained **GUI** toolkit (panels/buttons/labels/edits), image **textures**, **glTF/OBJ loaders**, an **animation** package, positional **audio**, and **raycasting** for picking.",
          "**The `math32` package** is G3N's `float32` linear-algebra library — `Vector3`, `Matrix4`, `Quaternion`, `Color`. You use it constantly for transforms, camera math, custom geometry and gameplay, so this deck covers the underlying math, not just the API."
        ] },
        { type: "table", headers: ["Layer", "Package / lib", "You use it for"], rows: [
          ["High-level engine", "`g3n/engine` (this deck)", "scene graph, meshes, lights, cameras, GUI — build a game/viewer fast"],
          ["Low-level GL bindings", "`go-gl/gl` + `go-gl/glfw`", "raw OpenGL: you write every VAO/VBO/shader/draw call yourself"],
          ["2D only", "Ebiten (`hajimehoshi/ebiten`)", "sprite-based 2D games; no 3D scene graph, no depth/lighting"]
        ] },
        { type: "callout", variant: "note", text: "Where G3N sits: **above** raw `go-gl` (which is just Go bindings to the C OpenGL/GLFW APIs — full control, but you implement the whole renderer) and **orthogonal** to **Ebiten**, which is a great Go engine but strictly **2D**. If you want a 3D world in Go with meshes, lights and a camera without writing a renderer, G3N is the default answer." },
        { type: "callout", variant: "tip", text: "G3N is `float32` everywhere (GPUs are single-precision). That is why it ships its own `math32` instead of using the stdlib `math` (`float64`). Don't mix them — convert explicitly with `float32(x)` / `float64(x)` at the boundary." }
      ]
    },
    {
      id: "setup",
      title: "Setup: go get, cgo & the native OpenGL/GLFW deps",
      level: "core",
      body: [
        { type: "p", text: "G3N uses **cgo** — it links against your system's OpenGL and GLFW/X11 libraries. This means you need a C compiler and the native **dev packages** installed *before* `go build` will work. This is the #1 first-run failure, so do it first." },
        { type: "code", lang: "bash", code: "# --- Debian/Ubuntu: C toolchain + OpenGL + GLFW's X11 build deps ---\nsudo apt-get install -y gcc pkg-config \\\n  libgl1-mesa-dev xorg-dev\n# audio (optional, only if you import g3n/engine/audio):\nsudo apt-get install -y libopenal1 libopenal-dev libvorbis0a libvorbis-dev\n\n# Fedora:  sudo dnf install gcc pkgconfig mesa-libGL-devel libX11-devel libXcursor-devel libXrandr-devel libXinerama-devel libXi-devel\n# macOS:   xcode-select --install     (OpenGL ships with the OS; deprecated but works)\n# Windows: install a gcc (mingw-w64 / TDM-GCC); OpenGL ships with the GPU driver" },
        { type: "code", lang: "bash", code: "# --- create the module and pull the engine ---\nmkdir myapp && cd myapp\ngo mod init example.com/myapp\ngo get github.com/g3n/engine/...   # the /... pulls every subpackage\n\nCGO_ENABLED=1 go build ./...       # cgo must be ON (it is by default unless cross-compiling)\ngo run .                           # build + run in one step" },
        { type: "p", text: "There is a legacy `util/application` helper, but the current, recommended entry point is the **`app`** package: `app.App()` returns a singleton `*Application` that owns the window, the GL context, the event dispatcher and the render loop. A minimal window:" },
        { type: "code", lang: "go", code: "package main\n\nimport (\n\t\"time\"\n\n\t\"github.com/g3n/engine/app\"\n\t\"github.com/g3n/engine/core\"\n\t\"github.com/g3n/engine/gls\"\n\t\"github.com/g3n/engine/renderer\"\n)\n\nfunc main() {\n\ta := app.App()              // singleton: window + GL context + dispatcher\n\tscene := core.NewNode()     // root of the scene graph\n\n\ta.Gls().ClearColor(0.1, 0.1, 0.12, 1.0)  // background color (RGBA 0..1)\n\n\ta.Run(func(rend *renderer.Renderer, dt time.Duration) {\n\t\ta.Gls().Clear(gls.COLOR_BUFFER_BIT | gls.DEPTH_BUFFER_BIT | gls.STENCIL_BUFFER_BIT)\n\t\t_ = scene   // nothing to draw yet; add a camera + mesh next\n\t\t_ = dt\n\t})\n}" },
        { type: "callout", variant: "gotcha", text: "`build constraints exclude all Go files` or `cannot find -lGL` / `GL/gl.h: No such file` at build time means the **native dev libs are missing** (or `CGO_ENABLED=0`). Install `libgl1-mesa-dev xorg-dev` (Linux) and ensure `gcc`/`pkg-config` are on PATH. cgo also means **no trivial cross-compilation** — build on the target OS or set up a cross C toolchain." }
      ]
    },
    {
      id: "app-loop",
      title: "The application loop, window & event dispatcher",
      level: "core",
      body: [
        { type: "p", text: "`a.Run(update)` blocks and calls your `update(rend, dt)` **once per frame** until `a.Exit()`. `dt` is a `time.Duration` — the time since the previous frame. **Multiply every per-frame motion by `dt`** so speed is frame-rate independent (a cube spinning `2*dt.Seconds()` radians/frame turns at the same real-world rate on a 60Hz and a 144Hz display)." },
        { type: "code", lang: "go", code: "a := app.App()\nangle := float32(0)\n\na.Run(func(rend *renderer.Renderer, dt time.Duration) {\n\ta.Gls().Clear(gls.COLOR_BUFFER_BIT | gls.DEPTH_BUFFER_BIT | gls.STENCIL_BUFFER_BIT)\n\n\t// frame-rate independent: radians = rate * seconds-elapsed\n\tangle += 1.5 * float32(dt.Seconds())\n\tmesh.SetRotationY(angle)\n\n\trend.Render(scene, cam)   // walk the tree + draw, from this camera\n})" },
        { type: "p", text: "The engine's event system is a **dispatcher** (`core.IDispatcher`): objects `Subscribe` to named events and get called back. The `Application` embeds the window's dispatcher, so `a.Subscribe(evName, cb)` receives window/input events. Handle **resize** to keep the viewport and camera aspect correct — forgetting this stretches the image." },
        { type: "code", lang: "go", code: "onResize := func(evname string, ev interface{}) {\n\twidth, height := a.GetSize()                       // framebuffer size in px\n\ta.Gls().Viewport(0, 0, int32(width), int32(height)) // GL viewport\n\tcam.SetAspect(float32(width) / float32(height))     // keep the camera un-stretched\n}\na.Subscribe(window.OnWindowSize, onResize)\nonResize(\"\", nil)   // call once up-front to set the initial size\n\n// quit on Escape\na.Subscribe(window.OnKeyDown, func(evname string, ev interface{}) {\n\tif ev.(*window.KeyEvent).Key == window.KeyEscape {\n\t\ta.Exit()\n\t}\n})" },
        { type: "table", headers: ["Event name", "Payload type", "Fires on"], rows: [
          ["`window.OnWindowSize`", "`*window.SizeEvent`", "window/framebuffer resized"],
          ["`window.OnKeyDown` / `OnKeyUp`", "`*window.KeyEvent`", "a key pressed / released"],
          ["`window.OnCursor`", "`*window.CursorEvent`", "mouse moved (Xpos/Ypos)"],
          ["`window.OnMouseDown` / `OnMouseUp`", "`*window.MouseEvent`", "mouse button pressed / released"],
          ["`window.OnScroll`", "`*window.ScrollEvent`", "scroll wheel"]
        ] },
        { type: "callout", variant: "note", text: "The callback signature is always `func(evname string, ev interface{})`; you **type-assert** the payload: `kev := ev.(*window.KeyEvent)`. For polling continuous state (a held movement key) prefer `a.KeyState().Pressed(window.KeyW)` over reacting to discrete `OnKeyDown`/`OnKeyUp` events." }
      ]
    },
    {
      id: "scene-graph",
      title: "The scene graph: nodes & how transforms compose",
      level: "core",
      body: [
        { type: "p", text: "Everything drawable or positional is an `INode` backed by a `core.Node`. A node has a **local transform** (position, rotation, scale, relative to its parent) and **children**. `parent.Add(child)` builds the tree; `scene.Add(node)` roots a subtree. Each frame the renderer computes every node's **world matrix** by multiplying its local matrix by its parent's world matrix, top-down." },
        { type: "code", lang: "go", code: "scene := core.NewNode()\n\n// a \"solar system\": planet orbits inside the scene, moon orbits the planet\nsystem := core.NewNode()          // pivot at origin\nscene.Add(system)\n\nplanet := graphic.NewMesh(sphereGeom, planetMat)\nplanet.SetPosition(4, 0, 0)       // 4 units out from the system pivot\nsystem.Add(planet)\n\nmoon := graphic.NewMesh(smallSphere, moonMat)\nmoon.SetPosition(1.2, 0, 0)       // 1.2 units from the PLANET (its parent)\nmoon.SetScale(0.3, 0.3, 0.3)\nplanet.Add(moon)                  // child of planet -> inherits planet's transform\n\n// rotating `system` sweeps the planet AND its moon around the origin;\n// rotating `planet` also carries the moon. This is transform composition.\nsystem.RotateY(0.01)\nplanet.RotateY(0.05)" },
        { type: "table", headers: ["Method", "Effect (all in the node's LOCAL space)"], rows: [
          ["`SetPosition(x,y,z)` / `SetPositionVec(*Vector3)`", "absolute local position"],
          ["`SetRotation(x,y,z)`", "Euler angles in **radians** (X then Y then Z)"],
          ["`SetRotationX/Y/Z(a)`", "set one axis; `RotateX/Y/Z(a)` add to it"],
          ["`SetScale(x,y,z)` / `SetScaleUniform`", "scale factors (1 = unchanged)"],
          ["`SetQuaternion(x,y,z,w)`", "orientation as a quaternion (no gimbal lock)"],
          ["`LookAt(target, up *Vector3)`", "orient the node's -Z toward a world point"],
          ["`Position()`, `Rotation()`, `Scale()`", "read back the local transform (return by value)"]
        ] },
        { type: "callout", variant: "tip", text: "Use empty `core.NewNode()` **pivots/groups** liberally: an orbit is just \"put the object off-center under a node, then rotate the node\". Grouping also lets you show/hide (`SetVisible(false)`) or move a whole subtree at once. This composition is the entire point of a scene graph." },
        { type: "callout", variant: "gotcha", text: "Transform order inside one node is fixed as **scale, then rotate, then translate** (T·R·S). You can't reorder it on a single node — if you need a different order (e.g. rotate about an off-center pivot), insert an intermediate parent node and split the transform across the two." }
      ]
    },
    {
      id: "first-mesh",
      title: "Your first mesh: geometry + material → a spinning cube",
      level: "core",
      body: [
        { type: "p", text: "A drawable is a **`graphic.Mesh`** = a **geometry** (the shape's vertices) + a **material** (how it's shaded). Add it to the scene, add a **camera** to view it and a **light** so a lit material isn't black, then spin it in the loop. This is the smallest complete G3N program." },
        { type: "code", lang: "go", code: "package main\n\nimport (\n\t\"time\"\n\n\t\"github.com/g3n/engine/app\"\n\t\"github.com/g3n/engine/camera\"\n\t\"github.com/g3n/engine/core\"\n\t\"github.com/g3n/engine/geometry\"\n\t\"github.com/g3n/engine/gls\"\n\t\"github.com/g3n/engine/graphic\"\n\t\"github.com/g3n/engine/light\"\n\t\"github.com/g3n/engine/material\"\n\t\"github.com/g3n/engine/math32\"\n\t\"github.com/g3n/engine/renderer\"\n\t\"github.com/g3n/engine/window\"\n)\n\nfunc main() {\n\ta := app.App()\n\tscene := core.NewNode()\n\n\t// camera, pulled back on +Z, looking at the origin\n\tcam := camera.New(1)\n\tcam.SetPosition(0, 0, 4)\n\tscene.Add(cam)\n\tcamera.NewOrbitControl(cam) // drag to orbit, scroll to zoom (free)\n\n\t// keep aspect + viewport in sync with the window\n\tonResize := func(string, interface{}) {\n\t\tw, h := a.GetSize()\n\t\ta.Gls().Viewport(0, 0, int32(w), int32(h))\n\t\tcam.SetAspect(float32(w) / float32(h))\n\t}\n\ta.Subscribe(window.OnWindowSize, onResize)\n\tonResize(\"\", nil)\n\n\t// the mesh: a cube with a standard (lit) material\n\tgeom := geometry.NewCube(1)\n\tmat := material.NewStandard(math32.NewColor(\"MediumTurquoise\"))\n\tcube := graphic.NewMesh(geom, mat)\n\tscene.Add(cube)\n\n\t// lights (without these a Standard material renders BLACK)\n\tscene.Add(light.NewAmbient(&math32.Color{R: 1, G: 1, B: 1}, 0.4))\n\tpl := light.NewPoint(&math32.Color{R: 1, G: 1, B: 1}, 1.0)\n\tpl.SetPosition(2, 3, 3)\n\tscene.Add(pl)\n\n\ta.Gls().ClearColor(0.05, 0.05, 0.07, 1.0)\n\ta.Run(func(rend *renderer.Renderer, dt time.Duration) {\n\t\ta.Gls().Clear(gls.COLOR_BUFFER_BIT | gls.DEPTH_BUFFER_BIT | gls.STENCIL_BUFFER_BIT)\n\t\tcube.RotateY(1 * float32(dt.Seconds())) // ~1 rad/sec, frame-rate independent\n\t\trend.Render(scene, cam)\n\t})\n}" },
        { type: "callout", variant: "good", text: "If you see a spinning turquoise cube you have proven the whole pipeline works: window, GL context, scene graph, camera projection, a lit material, a light, and the per-frame loop. Every later feature is an addition to this skeleton." },
        { type: "callout", variant: "gotcha", text: "Black screen or black cube? The two usual causes: (1) **no light** in the scene while using a lit material — add an ambient + a point/directional light, or use `material.NewBasic()` (unlit) to sanity-check; (2) **camera not looking at the object** — it's outside the frustum. Add `camera.NewOrbitControl(cam)` and drag, or `cam.SetPosition` + `cam.LookAt`." }
      ]
    },
    {
      id: "geometries",
      title: "Geometries: built-ins & building a custom shape from buffers",
      level: "core",
      body: [
        { type: "p", text: "A **geometry** is the raw vertex data: **positions**, and usually **normals** (for lighting), **UVs** (for textures) and an **index** buffer (which vertices form each triangle). The `geometry` package ships the common primitives." },
        { type: "code", lang: "go", code: "geometry.NewBox(w, h, l)                 // width, height, length (float32)\ngeometry.NewCube(size)                    // equal-sided box\ngeometry.NewSphere(radius, wSegs, hSegs)  // radius is float64; segments are int\ngeometry.NewCylinder(radius, height, radialSegs, heightSegs, top, bottom bool)\ngeometry.NewTorus(radius, tube, radialSegs, tubularSegs, arc) // arc e.g. 2*math32.Pi\ngeometry.NewPlane(width, height)          // a flat quad (a floor)\ngeometry.NewCircle(radius, segments)\ngeometry.NewCone(radius, height, radialSegs, heightSegs, top bool)" },
        { type: "heading", text: "A custom geometry from raw buffers" },
        { type: "p", text: "To make *any* shape, build a `geometry.NewGeometry()` and attach **VBOs**. Positions/normals/UVs go into `math32.ArrayF32` float buffers wrapped in a `gls.VBO`, tagged with an attribute type; the triangle indices go into a `math32.ArrayU32` via `SetIndices`. Here is a single triangle, then a quad with normals + UVs." },
        { type: "code", lang: "go", code: "geom := geometry.NewGeometry()\n\n// interleaved per-vertex data: X,Y,Z (position)  NX,NY,NZ (normal)  U,V (texcoord)\nvertices := math32.NewArrayF32(0, 0)\nvertices.Append(\n\t-1, -1, 0, 0, 0, 1, 0, 0, // v0\n\t 1, -1, 0, 0, 0, 1, 1, 0, // v1\n\t 1,  1, 0, 0, 0, 1, 1, 1, // v2\n\t-1,  1, 0, 0, 0, 1, 0, 1, // v3\n)\n// one VBO, three interleaved attributes (order MUST match the data layout)\nvbo := gls.NewVBO(vertices).\n\tAddAttrib(gls.VertexPosition).\n\tAddAttrib(gls.VertexNormal).\n\tAddAttrib(gls.VertexTexcoord)\ngeom.AddVBO(vbo)\n\n// two triangles -> a quad (indices reference the vertices above)\nindices := math32.NewArrayU32(0, 0)\nindices.Append(0, 1, 2, 0, 2, 3)\ngeom.SetIndices(indices)\n\nmat := material.NewStandard(math32.NewColor(\"Tomato\"))\nmat.SetSide(material.SideDouble) // show both faces of a flat shape\nscene.Add(graphic.NewMesh(geom, mat))" },
        { type: "callout", variant: "gotcha", text: "**Custom geometry with no normals lights wrong** (flat/black or uniformly shaded). Lit materials need a `VertexNormal` attribute per vertex — either supply correct unit normals as above, or call a helper that computes them. Normals must be **unit length** and point *out* of the surface; a reversed normal makes a face look inside-out under lighting." },
        { type: "callout", variant: "note", text: "`AddAttrib` order defines the interleave and each attribute's stride/offset automatically (`VertexPosition`=3 floats, `VertexNormal`=3, `VertexTexcoord`=2). You can instead put each attribute in its own separate VBO — one for positions, one for normals — if you don't want to interleave." }
      ]
    },
    {
      id: "materials",
      title: "Materials: unlit, Phong, PBR, textures & transparency",
      level: "core",
      body: [
        { type: "p", text: "A **material** decides how each pixel of a geometry is colored: which shader runs and with what parameters. Pick by lighting model." },
        { type: "table", headers: ["Constructor", "Lighting", "Use for"], rows: [
          ["`material.NewBasic()`", "**unlit** — flat color, ignores lights", "UI, debug, wireframes, glowing things"],
          ["`material.NewStandard(color)`", "Phong-style (ambient+diffuse+specular)", "the everyday lit material — start here"],
          ["`material.NewPhong(color)`", "Phong with more explicit control", "shiny/plastic surfaces"],
          ["`material.NewPhysical(...)`", "**PBR** (metalness/roughness)", "realistic, glTF-imported assets"]
        ] },
        { type: "code", lang: "go", code: "mat := material.NewStandard(math32.NewColor(\"SteelBlue\"))\nmat.SetShininess(30)                              // specular tightness\nmat.SetEmissiveColor(&math32.Color{R: 0, G: 0.1, B: 0.2}) // self-glow, unaffected by lights\nmat.SetWireframe(true)                            // draw edges only\nmat.SetSide(material.SideDouble)                  // render back faces too (default: front only)\n\n// transparency: you MUST flag it, or the alpha is ignored\nmat.SetTransparent(true)\nmat.SetOpacity(0.5)\nmat.SetBlending(material.BlendAlpha)\n\n// texture (see the Textures section for loading)\ntex, _ := texture.NewTexture2DFromImage(\"crate.png\")\nmat.AddTexture(tex)" },
        { type: "list", items: [
          "**`SetColor`** / `NewColor(\"CSSName\")` — named CSS colors, or `&math32.Color{R,G,B}` in 0..1.",
          "**`SetSide`** — `SideFront` (default, cheapest via back-face culling), `SideBack`, or `SideDouble`. Flat planes and custom quads usually need `SideDouble`.",
          "**Transparency needs three things:** `SetTransparent(true)`, an `SetOpacity(<1)` (or a texture with alpha), and usually a blend mode. Transparent objects are drawn after opaque ones.",
          "**Reuse materials.** One `material.Standard` shared across 1000 meshes lets the renderer batch them; a unique material per mesh explodes draw calls and GPU state changes."
        ] },
        { type: "callout", variant: "gotcha", text: "Setting `SetOpacity(0.5)` **without** `SetTransparent(true)` renders fully opaque — the transparent flag is what puts the mesh in the alpha-blended pass. Conversely, marking everything transparent is slow and causes sorting artifacts; only flag what actually needs it." }
      ]
    },
    {
      id: "math-vectors",
      title: "Math I — vectors, dot/cross & transformation matrices",
      level: "core",
      body: [
        { type: "p", text: "3D is linear algebra. G3N's `math32` gives you the three workhorses: **`Vector3`** (a point or direction), **`Matrix4`** (a transform), **`Quaternion`** (an orientation). `math32` methods **mutate the receiver in place and return it** for chaining — `v.Add(u)` changes `v`. Clone first (`v.Clone()`) if you need the original." },
        { type: "heading", text: "Vectors: add, scale, length, normalize" },
        { type: "code", lang: "go", code: "a := math32.NewVector3(1, 2, 3)\nb := math32.NewVector3(0, 1, 0)\n\na.Add(b)                    // a = a + b   (in place!)\na.MultiplyScalar(2)         // a = a * 2\nlen := a.Length()           // magnitude, sqrt(x*x+y*y+z*z)\ndir := a.Clone().Normalize()// unit vector (length 1) pointing the same way\ndist := a.DistanceTo(b)     // |a - b|" },
        { type: "heading", text: "Dot & cross — the two products you use constantly" },
        { type: "p", text: "The **dot product** `a·b = |a||b|cosθ` measures alignment: it's a scalar, positive when vectors point the same way, zero when perpendicular. Use it to test facing direction, project one vector onto another, and (on unit vectors) get the angle. The **cross product** `a×b` returns a *vector perpendicular to both*, whose length is `|a||b|sinθ` — it gives you **surface normals** and rotation axes, and its sign tells you handedness/winding." },
        { type: "code", lang: "go", code: "// dot: is the light in front of the surface? (both unit vectors)\nfacing := normal.Dot(toLight)        // >0 lit, <=0 in shadow -> the core of diffuse lighting\nangle := math32.Acos(u.Dot(v))       // angle between unit vectors u,v (radians)\n\n// cross: compute a triangle's normal from two of its edges\nedge1 := math32.NewVector3().SubVectors(p1, p0) // p1 - p0\nedge2 := math32.NewVector3().SubVectors(p2, p0) // p2 - p0\nnormal := math32.NewVector3().CrossVectors(edge1, edge2).Normalize()" },
        { type: "heading", text: "Matrix4 — translate, rotate, scale & why order matters" },
        { type: "p", text: "A `Matrix4` is a 4×4 matrix that encodes a full transform. 3D uses **4×4 (homogeneous) coordinates** — a point becomes `(x,y,z,1)` — so that **translation** (a shift, not linear in 3D) can be baked into the same matrix as rotation/scale, letting the GPU compose transforms with a single matrix multiply. Multiplying matrices **composes** transforms, but matrix multiply is **not commutative**: `T·R` (rotate, then translate) ≠ `R·T` (translate, then rotate about the origin — an orbit)." },
        { type: "code", lang: "go", code: "t := math32.NewMatrix4().MakeTranslation(5, 0, 0)\nr := math32.NewMatrix4().MakeRotationY(math32.Pi / 2) // 90 deg about Y\ns := math32.NewMatrix4().MakeScale(2, 2, 2)\n\n// compose: result applies S first, then R, then T (right-to-left, like function calls)\nm := math32.NewMatrix4().Multiply(t).Multiply(r).Multiply(s)\n\n// transform a point (w=1) vs a direction (w=0 -> ignores translation)\np := math32.NewVector3(1, 0, 0).ApplyMatrix4(m)         // point: rotated+scaled+moved\nd := math32.NewVector3(1, 0, 0).TransformDirection(m)   // direction: only rotated" },
        { type: "callout", variant: "note", text: "You rarely build these matrices by hand — a node's `SetPosition/SetRotation/SetScale` *is* T·R·S, and the engine multiplies each node by its parent to get the world matrix. But understanding that a transform is one matrix, that composition is multiplication, and that order matters, is what lets you debug \"why is my object in the wrong place / spinning about the wrong point\"." },
        { type: "callout", variant: "tip", text: "Prefer **quaternions** (`SetQuaternion`, `Quaternion.SetFromAxisAngle(axis, angle)`) over Euler angles for orientation you interpolate or accumulate: Euler angles suffer **gimbal lock** (axes collapsing) and interpolate unevenly. `Quaternion.Slerp` gives smooth shortest-path rotation between two orientations." }
      ]
    },
    {
      id: "math-cameras",
      title: "Math II — coordinate spaces, projection & the MVP",
      level: "core",
      body: [
        { type: "p", text: "A vertex travels through a pipeline of **coordinate spaces**, each a matrix multiply. Knowing the chain explains every \"nothing is visible\" bug." },
        { type: "table", headers: ["Space", "Meaning", "Transform that gets you there"], rows: [
          ["Local / object", "vertex as authored, relative to its own origin", "— (the raw geometry)"],
          ["World", "placed in the scene", "**Model** matrix (node's world transform)"],
          ["View / eye", "relative to the camera", "**View** matrix (inverse of camera's world transform)"],
          ["Clip", "projected, ready for the GPU to clip/divide", "**Projection** matrix (perspective or ortho)"],
          ["NDC → screen", "normalized [-1,1] cube, then pixels", "perspective divide + viewport"]
        ] },
        { type: "p", text: "The product `Projection · View · Model` is the famous **MVP matrix**; the GPU multiplies each vertex by it. G3N builds M (from the scene graph), V (from the camera) and P (from the camera's projection) for you — but you set the projection parameters, and getting them wrong is why the scene is empty." },
        { type: "heading", text: "Perspective vs orthographic" },
        { type: "list", items: [
          "**Perspective** — a view *frustum* (truncated pyramid). Distant objects shrink; parallel lines converge. Parameters: **FOV** (vertical field of view), **aspect** (width/height), **near** and **far** clip planes. This is what games and realistic scenes use.",
          "**Orthographic** — a box; no foreshortening, parallel lines stay parallel. Used for CAD, 2D/isometric, UI, and shadow maps. Parameters are the box bounds (left/right/top/bottom/near/far)."
        ] },
        { type: "code", lang: "go", code: "cam := camera.New(16.0 / 9.0)          // aspect = width/height\ncam.SetProjection(camera.Perspective)   // or camera.Orthographic\ncam.SetFov(60)                          // vertical field of view, degrees\ncam.SetAspect(16.0 / 9.0)\n// near/far define the visible depth range; too tight a range clips your scene away\n\ncam.SetPosition(0, 3, 8)\ncam.LookAt(math32.NewVector3(0, 0, 0), math32.NewVector3(0, 1, 0)) // target, up\nscene.Add(cam)" },
        { type: "callout", variant: "gotcha", text: "**Near/far frustum mistakes** are the classic \"empty window\": if `far` is smaller than your camera's distance to the scene, everything is clipped away; if `near` is too small (like 0) or `far` enormous, you get **z-fighting** (flickering overlapping surfaces) from lost depth precision. Keep the near/far ratio modest (e.g. near 0.1, far 1000, not near 0.0001)." },
        { type: "callout", variant: "note", text: "G3N (like OpenGL) is **right-handed**: +X right, +Y up, **+Z toward the viewer** — so the camera looks down **-Z** by default. A brand-new camera at the origin looking at an object also at the origin sees nothing; move the camera back along +Z (`SetPosition(0,0,5)`) or use `LookAt`." }
      ]
    },
    {
      id: "cameras-controls",
      title: "Cameras & controls: OrbitControl and a manual fly camera",
      level: "core",
      body: [
        { type: "p", text: "The camera is a node (`camera.Camera`) — position and orient it like any node. For interaction, G3N ships **`OrbitControl`** (orbit/pan/zoom around a target), and you can hand-roll a **fly/FPS** camera with `math32` vectors + `dt`." },
        { type: "code", lang: "go", code: "// built-in orbit: drag = rotate, right-drag/shift = pan, scroll = dolly\noc := camera.NewOrbitControl(cam)\noc.SetEnabled(camera.OrbitZoom, true)\n// oc.Rotate / oc.Zoom / oc.Pan can be driven programmatically too" },
        { type: "heading", text: "A manual WASD fly camera" },
        { type: "code", lang: "go", code: "type FlyCam struct {\n\tcam   *camera.Camera\n\tyaw   float32 // rotation about world up\n\tpitch float32 // look up/down\n}\n\n// call every frame from the render loop with the frame delta\nfunc (f *FlyCam) Update(a *app.Application, dt float32) {\n\tconst speed = 6.0\n\n\t// forward = where the camera looks (world -Z rotated by the camera's orientation)\n\tforward := math32.NewVector3(0, 0, -1).ApplyQuaternion(f.cam.Quaternion())\n\tright := math32.NewVector3().CrossVectors(forward, math32.NewVector3(0, 1, 0)).Normalize()\n\n\tmove := math32.NewVector3(0, 0, 0)\n\tif a.KeyState().Pressed(window.KeyW) { move.Add(forward) }\n\tif a.KeyState().Pressed(window.KeyS) { move.Sub(forward) }\n\tif a.KeyState().Pressed(window.KeyD) { move.Add(right) }\n\tif a.KeyState().Pressed(window.KeyA) { move.Sub(right) }\n\n\tif move.Length() > 0 {\n\t\tmove.Normalize().MultiplyScalar(speed * dt) // scale by delta-time -> constant real speed\n\t\tpos := f.cam.Position()\n\t\tf.cam.SetPositionVec(pos.Add(&move))\n\t}\n}\n\n// mouse look: subscribe to window.OnCursor, accumulate yaw/pitch from delta,\n// clamp pitch to just under +/- pi/2, then rebuild the quaternion from Euler.\nfunc (f *FlyCam) OnMouse(dx, dy float32) {\n\tf.yaw -= dx * 0.002\n\tf.pitch = math32.Clamp(f.pitch-dy*0.002, -1.55, 1.55)\n\tq := math32.NewQuaternion().SetFromEuler(math32.NewVector3(f.pitch, f.yaw, 0))\n\tf.cam.SetQuaternionQuat(q)\n}" },
        { type: "callout", variant: "tip", text: "`forward` and `right` come straight out of the math section: forward is the camera's local -Z pushed through its orientation quaternion; `right` is `forward × worldUp` (a **cross product**). Normalizing the combined move vector before scaling by `speed*dt` stops diagonal movement from being faster than straight movement." },
        { type: "callout", variant: "note", text: "Swap `camera.Perspective` for `camera.Orthographic` on the same camera to get a CAD/isometric view without changing anything else in your scene — the projection matrix is the only thing that changes." }
      ]
    },
    {
      id: "lighting",
      title: "Lighting: ambient, directional, point & spot",
      level: "core",
      body: [
        { type: "p", text: "Lit materials (Standard/Phong/Physical) are dark until you add lights. G3N has four light types; each is a node you add to the scene. Real scenes combine a weak **ambient** (so shadows aren't pure black) with one or more directional/point lights." },
        { type: "table", headers: ["Light", "Constructor", "Behaves like"], rows: [
          ["Ambient", "`light.NewAmbient(color, intensity)`", "uniform fill from all directions; no position, no shadows"],
          ["Directional", "`light.NewDirectional(color, intensity)`", "parallel rays (the sun); direction from its position toward origin"],
          ["Point", "`light.NewPoint(color, intensity)`", "a bulb radiating in all directions; has a position + falloff"],
          ["Spot", "`light.NewSpot(color, intensity)`", "a cone (flashlight); position, direction, angle + falloff"]
        ] },
        { type: "code", lang: "go", code: "// fill + key light\nscene.Add(light.NewAmbient(&math32.Color{R: 1, G: 1, B: 1}, 0.3))\n\nsun := light.NewDirectional(&math32.Color{R: 1, G: 0.96, B: 0.9}, 0.8)\nsun.SetPosition(5, 10, 5) // for a directional light this sets the DIRECTION (toward origin)\nscene.Add(sun)\n\nbulb := light.NewPoint(&math32.Color{R: 1, G: 0.7, B: 0.4}, 1.5)\nbulb.SetPosition(0, 2, 0)\nbulb.SetLinearDecay(1)      // distance falloff\nbulb.SetQuadraticDecay(1)   // physically-plausible inverse-square-ish attenuation\nscene.Add(bulb)" },
        { type: "p", text: "Lighting math is the dot product at work: **diffuse** brightness of a surface is `max(0, normal·lightDir)` — a face fully facing the light is bright, a grazing face is dark, a face turned away is unlit. **Specular** highlights depend on the angle between the reflected light and the view direction (`shininess` tightens them). This is the **Phong reflection model** G3N's Standard material implements." },
        { type: "callout", variant: "gotcha", text: "There is a **cap on the number of lights** the shaders handle; piling on dozens of point lights is both slow and eventually ignored. Use a couple of directional/point lights plus ambient. Real-time **shadows** in G3N are limited — for shadowed scenes, bake lighting into textures or keep shadow-casting lights minimal." },
        { type: "callout", variant: "warn", text: "Everything black despite a light? Check: the material is a *lit* type (not `NewBasic`), the geometry has **normals**, the light **intensity** is > 0, and a point/spot light is actually **positioned near** the object (its falloff may have dropped to zero). An ambient light alone gives flat, shadeless illumination — add a directional/point light for form." }
      ]
    },
    {
      id: "textures",
      title: "Textures: images, UVs, wrapping & filtering",
      level: "core",
      body: [
        { type: "p", text: "A **texture** maps a 2D image onto a surface. Each vertex carries a **UV** coordinate in [0,1]×[0,1] that says where on the image it samples; the GPU interpolates across the triangle. Load an image into a `texture.Texture2D` and `AddTexture` it to a material." },
        { type: "code", lang: "go", code: "tex, err := texture.NewTexture2DFromImage(\"assets/crate.png\") // png/jpg/gif\nif err != nil {\n\tpanic(err)\n}\ntex.SetWrapS(gls.REPEAT) // how U outside [0,1] behaves: REPEAT / CLAMP_TO_EDGE / MIRRORED_REPEAT\ntex.SetWrapT(gls.REPEAT) // V axis\ntex.SetRepeat(4, 4)      // tile the image 4x4 across the surface\ntex.SetMagFilter(gls.LINEAR)               // smooth when zoomed in (NEAREST = pixelated)\ntex.SetMinFilter(gls.LINEAR_MIPMAP_LINEAR) // trilinear mipmapping when zoomed out\n\nmat := material.NewStandard(&math32.Color{R: 1, G: 1, B: 1}) // white base so texture isn't tinted\nmat.AddTexture(tex)\n\n// second texture (e.g. a normal/detail map) — materials accept multiple\nmat.AddTexture(detailTex)" },
        { type: "list", items: [
          "**Wrapping** controls sampling outside [0,1]: `REPEAT` tiles, `CLAMP_TO_EDGE` stretches the border pixel, `MIRRORED_REPEAT` flips each tile.",
          "**Filtering**: `LINEAR` (bilinear) smooths; `NEAREST` keeps hard pixels (retro/pixel art). Mipmapped min-filters (`*_MIPMAP_*`) avoid shimmering on distant/minified textures.",
          "**UVs come from the geometry.** Built-in geometries include sensible UVs; a custom geometry needs a `VertexTexcoord` attribute or the texture won't map.",
          "**Base color matters:** a `Standard` material multiplies its color by the texture — set the color to white to see the texture's true colors, or tint it deliberately."
        ] },
        { type: "callout", variant: "gotcha", text: "Texture not showing? Check, in order: the file path is correct and the image loaded without error; the geometry has **UVs** (`VertexTexcoord`); the material color isn't black (black × texture = black); the texture isn't being culled by `SideFront` on a back-facing quad; and for transparent PNGs, that you set `SetTransparent(true)`. Very large non-power-of-two textures can also fail to mipmap on some drivers." }
      ]
    },
    {
      id: "input-events",
      title: "Input, events & raycasting (picking objects)",
      level: "core",
      body: [
        { type: "p", text: "Keyboard/mouse arrive as dispatcher events (see the loop section). The advanced piece is **picking**: turning a 2D mouse click into \"which 3D object did I click?\". You cast a ray from the camera through the cursor and intersect it with the scene using `core.Raycaster`." },
        { type: "code", lang: "go", code: "raycaster := core.NewRaycaster(&math32.Vector3{}, &math32.Vector3{})\n\na.Subscribe(window.OnMouseDown, func(evname string, ev interface{}) {\n\tmev := ev.(*window.MouseEvent)\n\twidth, height := a.GetSize()\n\n\t// convert pixel coords -> normalized device coords in [-1, 1]\n\tx := 2*(mev.Xpos/float32(width)) - 1\n\ty := -2*(mev.Ypos/float32(height)) + 1 // flip Y: screen is top-down, NDC is bottom-up\n\n\t// build a ray from the camera through that point\n\traycaster.SetFromCamera(cam, x, y)\n\n\t// intersect against the scene (recursive = descend into children)\n\tintersects := raycaster.IntersectObjects(scene.Children(), true)\n\tif len(intersects) > 0 {\n\t\thit := intersects[0]            // nearest hit\n\t\tif m, ok := hit.Object.(*graphic.Mesh); ok {\n\t\t\tm.GetMaterial(0).(*material.Standard).SetColor(math32.NewColor(\"Yellow\"))\n\t\t}\n\t}\n})" },
        { type: "list", items: [
          "**NDC conversion** is the whole trick: pixels → [-1,1], and **flip Y** because window coordinates grow downward while NDC grows upward.",
          "`SetFromCamera(cam, x, y)` uses the inverse projection·view to shoot the ray into the world — the same MVP matrices from the math section, run backwards.",
          "`IntersectObjects` returns hits **sorted nearest-first**, each with the `Object`, the `Point` in world space, `Distance`, and the triangle index.",
          "For continuous input (movement, held keys) poll `a.KeyState().Pressed(key)` each frame; for discrete actions (jump, shoot, click) subscribe to the `OnKeyDown`/`OnMouseDown` events."
        ] },
        { type: "callout", variant: "tip", text: "Raycasting also does mouse-over highlighting (raycast every `OnCursor`), drag-and-drop in 3D, and shooting in games. It's CPU-side triangle intersection — for thousands of pickable objects, raycast against cheap bounding proxies or spatially cull first." }
      ]
    },
    {
      id: "animation",
      title: "Transformations & animation over time",
      level: "core",
      body: [
        { type: "p", text: "The simplest animation is mutating a node's transform each frame, scaled by `dt`. For smooth motion between states, **interpolate** (`lerp` for position, `slerp` for rotation). For asset animations (a rigged glTF), use the `animation` package." },
        { type: "code", lang: "go", code: "// per-frame spin + bob, frame-rate independent\nt := float32(0)\na.Run(func(rend *renderer.Renderer, dt time.Duration) {\n\tt += float32(dt.Seconds())\n\tcube.RotateY(1.2 * float32(dt.Seconds()))          // continuous spin\n\tcube.SetPositionY(math32.Sin(t*2) * 0.5)           // bob up/down (a sine)\n\trend.Render(scene, cam)\n})\n\n// linear interpolation of position toward a target (easing/tweening)\nfunc moveToward(n core.INode, target *math32.Vector3, alpha float32) {\n\tp := n.GetNode().Position()\n\tp.Lerp(target, alpha) // alpha 0..1: p = p + (target-p)*alpha\n\tn.GetNode().SetPositionVec(&p)\n}\n\n// smooth rotation between two orientations (shortest path, no gimbal lock)\nq := math32.NewQuaternion().SetFromEuler(math32.NewVector3(0, math32.Pi, 0))\ncurrent := node.Quaternion()\ncurrent.Slerp(q, 0.1) // 10% of the way each call\nnode.SetQuaternionQuat(&current)" },
        { type: "p", text: "The **`animation`** package plays keyframed channels (position/rotation/scale/morph tracks over time) — this is how glTF character/skeletal animations run. You create an `animation.Animation`, add channels bound to target nodes, and `Update(dt)` it each frame; loaded glTF files can populate these for you." },
        { type: "callout", variant: "gotcha", text: "**Never** advance animation by a fixed amount per frame (`node.RotateY(0.02)`) — it runs faster on a 144Hz monitor than a 60Hz one. Always multiply by `dt.Seconds()`. If you need deterministic simulation (physics/networking), run a **fixed timestep** accumulator and interpolate the render between steps." }
      ]
    },
    {
      id: "loading-models",
      title: "Loading 3D models: glTF, GLB & OBJ",
      level: "deep",
      body: [
        { type: "p", text: "You won't hand-build real assets. G3N's **`loader`** packages import industry formats. **glTF** (`.gltf` JSON or `.glb` binary) is the modern standard — it carries meshes, PBR materials, textures, cameras and animations; **OBJ** is older, geometry + a `.mtl` material file." },
        { type: "code", lang: "go", code: "import (\n\t\"github.com/g3n/engine/loader/gltf\"\n\t\"github.com/g3n/engine/loader/obj\"\n)\n\n// --- glTF / GLB ---\nfunc loadGLTF(scene *core.Node, path string) error {\n\tg, err := gltf.ParseJSON(path) // use gltf.ParseBin(path) for .glb\n\tif err != nil {\n\t\treturn err\n\t}\n\tnode, err := g.LoadScene(0)      // load scene 0 -> a core.INode subtree\n\tif err != nil {\n\t\treturn err\n\t}\n\tscene.Add(node)                  // materials & textures come along from the file\n\treturn nil\n}\n\n// --- OBJ (+ optional .mtl) ---\nfunc loadOBJ(scene *core.Node, objPath, mtlPath string) error {\n\tdec, err := obj.Decode(objPath, mtlPath) // pass \"\" for mtlPath if none\n\tif err != nil {\n\t\treturn err\n\t}\n\tgroup, err := dec.NewGroup()             // a *core.Node with the meshes\n\tif err != nil {\n\t\treturn err\n\t}\n\tscene.Add(group)\n\treturn nil\n}" },
        { type: "list", items: [
          "`gltf.LoadScene(i)` returns a whole subtree (all meshes/nodes/materials); `gltf.LoadMesh(i)` pulls a single mesh. Both return `core.INode` you `Add` to your scene.",
          "**Prefer glTF/GLB** for anything with materials or animation — OBJ has no animation and weaker material support. `.glb` (binary) bundles textures into one file; `.gltf` references external images.",
          "Loaded assets can be huge; scale/reposition the returned node (`node.GetNode().SetScale(...)`) to fit your scene, and check the model's **up-axis** convention.",
          "Textures referenced by the file are loaded **relative to the model's path** — keep the folder structure intact when copying assets."
        ] },
        { type: "callout", variant: "gotcha", text: "Imported model shows up huge/tiny, upside-down, or off-center? Assets come in wildly different **scales and up-axes** (some tools export Z-up, G3N is Y-up). Wrap the loaded node in a pivot and set scale/rotation there. If it's invisible, it may be too big for your near/far planes or lit only from the wrong side — try an unlit material or add ambient light to confirm it loaded." }
      ]
    },
    {
      id: "gui-text",
      title: "GUI, text/HUD overlays & audio",
      level: "deep",
      body: [
        { type: "p", text: "G3N ships a full **GUI** toolkit in `gui` — panels, buttons, labels, checkboxes, edits, sliders, dropdowns, image labels. GUI elements are nodes you `Add` to the scene; they render as a 2D overlay in screen pixels (top-left origin) and raise events through the same dispatcher." },
        { type: "code", lang: "go", code: "import \"github.com/g3n/engine/gui\"\n\n// a label used as a HUD readout\nfps := gui.NewLabel(\"FPS: --\")\nfps.SetPosition(10, 10)            // pixels from top-left\nfps.SetColor(math32.NewColor(\"White\"))\nfps.SetFontSize(16)\nscene.Add(fps)\n\n// a button with a click handler\nbtn := gui.NewButton(\"Reset\")\nbtn.SetPosition(10, 40)\nbtn.SetSize(90, 30)\nbtn.Subscribe(gui.OnClick, func(name string, ev interface{}) {\n\tcube.SetRotation(0, 0, 0)\n})\nscene.Add(btn)\n\n// a container panel to group controls\npanel := gui.NewPanel(200, 120)\npanel.SetPosition(10, 80)\npanel.SetColor4(&math32.Color4{R: 0, G: 0, B: 0, A: 0.4}) // semi-transparent HUD bg\ncheck := gui.NewCheckBox(\"Wireframe\")\ncheck.SetPosition(8, 8)\ncheck.Subscribe(gui.OnChange, func(string, interface{}) {\n\tmat.SetWireframe(check.Value())\n})\npanel.Add(check)\nscene.Add(panel)\n\n// update the HUD label each frame\nfps.SetText(\"FPS: \" + strconv.Itoa(int(1/dt.Seconds())))" },
        { type: "list", items: [
          "**Widgets:** `NewLabel`, `NewButton`, `NewCheckBox`, `NewEdit` (text input), `NewSlider`, `NewDropDown`, `NewImageLabel`, `NewPanel` (container). Position/size are in **pixels**.",
          "**Events:** subscribe to `gui.OnClick`, `gui.OnChange`, `gui.OnCursorEnter`/`OnCursorLeave`, `gui.OnMouseDown`. Same `func(name, ev)` shape as window events.",
          "**Layout:** panels can use layout managers (`gui.NewHBoxLayout`, `VBoxLayout`, `GridLayout`) so children arrange automatically instead of absolute positions.",
          "GUI draws *after* the 3D scene as an overlay — it always sits on top and ignores depth/lighting."
        ] },
        { type: "heading", text: "Audio" },
        { type: "p", text: "The **`audio`** package (needs OpenAL + libvorbis native libs) plays sound. An `audio.Player` is a node — parent it to a 3D object for **positional/spatial** audio (volume/pan follow the listener), or play it unattached for UI sounds/music." },
        { type: "code", lang: "go", code: "import \"github.com/g3n/engine/audio\"\n\nplayer, err := audio.NewPlayer(\"assets/engine.wav\") // .wav / .ogg (vorbis)\nplayer.SetLooping(true)\nplayer.SetVolume(0.6)\nship.Add(player) // spatialized: sound moves with the ship node\nplayer.Play()" },
        { type: "callout", variant: "note", text: "Audio pulls in extra native deps (`libopenal-dev`, `libvorbis-dev`) and won't build without them — only import `g3n/engine/audio` when you actually need sound, so a silent app doesn't inherit those build requirements." }
      ]
    },
    {
      id: "structuring",
      title: "Structuring a real app & performance basics",
      level: "deep",
      body: [
        { type: "p", text: "The render loop should be thin: **update game state, then render**. Keep simulation (positions, health, AI) separate from the scene-graph nodes that visualize it, so you can test logic without a GL context and swap the view later. A common shape:" },
        { type: "code", lang: "go", code: "type Game struct {\n\tapp   *app.Application\n\tscene *core.Node\n\tcam   *camera.Camera\n\tworld *World          // pure game state, no G3N types\n\tviews map[EntityID]*graphic.Mesh // state -> node mapping\n}\n\nfunc (g *Game) update(rend *renderer.Renderer, dt time.Duration) {\n\tsec := float32(dt.Seconds())\n\tg.world.Step(sec)              // 1) advance simulation (testable in isolation)\n\tfor id, e := range g.world.Entities {\n\t\tg.views[id].SetPositionVec(&e.Pos) // 2) sync view nodes to state\n\t}\n\tg.app.Gls().Clear(gls.COLOR_BUFFER_BIT | gls.DEPTH_BUFFER_BIT | gls.STENCIL_BUFFER_BIT)\n\trend.Render(g.scene, g.cam)   // 3) draw\n}" },
        { type: "heading", text: "Performance basics" },
        { type: "list", items: [
          "**Reuse geometries and materials.** 500 identical trees should share **one** `Geometry` and **one** `Material` instance across 500 meshes — this lets the renderer batch and slashes GPU state changes. A fresh material per mesh is the most common G3N perf mistake.",
          "**Fewer draw calls.** Each distinct mesh/material is roughly a draw call. Merge static geometry into fewer meshes where you can; group tiny objects.",
          "**Cull and hide.** `SetVisible(false)` on offscreen or far subtrees; remove nodes you no longer need (`parent.Remove(child)`).",
          "**Don't allocate in the loop.** Reuse `math32.Vector3`/`Matrix4` scratch values instead of `NewVector3` every frame — it creates GC pressure at 60fps.",
          "**Mind depth range and light count.** A tight near/far and a couple of lights keep both precision and shader cost sane."
        ] },
        { type: "callout", variant: "tip", text: "Dispose GPU resources you truly discard: geometries, materials and textures hold OpenGL buffers/handles. When you throw away a mesh permanently, call `Dispose()` on its geometry/material/textures (or the mesh) so the VRAM is freed — leaking these in a long-running app grows GPU memory until it stalls." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that eat a G3N beginner's first day. Most are \"I see nothing\" or \"it won't build\" — here's the checklist." },
        { type: "heading", text: "1. Build fails on cgo / native libraries" },
        { type: "callout", variant: "warn", text: "`cannot find -lGL`, `GL/gl.h: No such file`, `build constraints exclude all Go files`, or a linker error means the **native dev packages or C toolchain are missing**. Install `gcc pkg-config libgl1-mesa-dev xorg-dev` (Debian/Ubuntu), the mesa/X11 devel equivalents on Fedora, or the Xcode CLT on macOS, and make sure `CGO_ENABLED=1`. cgo also blocks easy cross-compiling — build on the target platform." },
        { type: "heading", text: "2. Everything is black" },
        { type: "callout", variant: "gotcha", text: "A lit material (`Standard`/`Phong`/`Physical`) with **no light** renders black. Add `light.NewAmbient(...)` plus a point/directional light — or temporarily switch to `material.NewBasic()` (unlit) to confirm geometry is present. Also verify the light intensity is > 0 and a point light is close enough that its falloff hasn't reached zero." },
        { type: "heading", text: "3. Nothing visible / empty window" },
        { type: "callout", variant: "gotcha", text: "Usually the camera. G3N looks down **-Z**, so a camera at the origin sees nothing at the origin — `cam.SetPosition(0,0,5)` and/or `cam.LookAt(target, up)`. Then check the **frustum**: if `far` < camera-to-scene distance, or `near`/`far` are wildly set, the scene is clipped away. And confirm you actually called `rend.Render(scene, cam)` and added your mesh to `scene`." },
        { type: "heading", text: "4. Custom geometry looks wrong under light" },
        { type: "callout", variant: "gotcha", text: "No **normals** = broken lighting; supply a `VertexNormal` attribute (unit vectors pointing outward). A face that's dark from the front is likely **wound backwards** (reversed normal / wrong triangle winding) — flip the index order or the normal, or set `SetSide(material.SideDouble)` to render both faces while debugging." },
        { type: "heading", text: "5. Non-uniform scale ruins lighting" },
        { type: "callout", variant: "warn", text: "Scaling a node **non-uniformly** (e.g. `SetScale(1, 3, 1)`) skews its normals, so lit surfaces shade incorrectly. Prefer uniform scale for lit meshes, bake the stretch into the geometry, or keep non-uniform scale for unlit/UI objects. Uniform scale is safe." },
        { type: "heading", text: "6. Transform order & wrong pivot" },
        { type: "callout", variant: "gotcha", text: "A node applies **scale, then rotate, then translate**. To rotate an object *around an external point* (orbit), you can't just rotate the object — parent it to a pivot node at that point and rotate the pivot. \"My object flies off when I rotate it\" is almost always a missing pivot." },
        { type: "heading", text: "7. Frame-rate dependent motion" },
        { type: "callout", variant: "gotcha", text: "`node.RotateY(0.02)` per frame spins twice as fast at 120fps as at 60fps. Multiply every per-frame delta by `dt.Seconds()`. For physics/networking use a **fixed timestep** accumulator and interpolate rendering between steps." },
        { type: "heading", text: "8. Texture not showing" },
        { type: "callout", variant: "gotcha", text: "Check the load error, that the geometry has **UVs** (`VertexTexcoord`), that the material base color isn't black (black × texture = black), that a one-sided quad isn't back-facing (`SideDouble`), and for alpha PNGs that `SetTransparent(true)` is set. A wrong asset path silently returns an error you must check." },
        { type: "heading", text: "9. Leaking GPU memory" },
        { type: "callout", variant: "note", text: "Geometries, materials and textures own OpenGL handles. Reuse them across meshes, and `Dispose()` the ones you permanently discard. Creating a new material/texture every frame (instead of once) both tanks performance and leaks VRAM until the app stalls." },
        { type: "heading", text: "10. Handedness & up-axis surprises" },
        { type: "callout", variant: "note", text: "G3N is **right-handed, Y-up**, camera looking down -Z. Imported models authored Z-up (or in a left-handed tool) come in rotated; wrap them in a pivot and correct the rotation/scale there rather than editing every node." }
      ]
    }
  ],

  packages: [
    { name: "github.com/g3n/engine", why: "the engine itself; the /... import path pulls every subpackage below at once" },
    { name: "g3n/engine/app", why: "app.App() singleton: window + GL context + event dispatcher + the Run() render loop" },
    { name: "g3n/engine/core", why: "the scene graph: Node, INode, Scene, IDispatcher events, and Raycaster for picking" },
    { name: "g3n/engine/math32", why: "float32 linear algebra: Vector3, Matrix4, Quaternion, Color — vectors, transforms, projection" },
    { name: "g3n/engine/geometry", why: "built-in shapes (Box/Sphere/Cylinder/Torus/Plane) and NewGeometry for custom vertex buffers" },
    { name: "g3n/engine/material", why: "Basic (unlit), Standard/Phong, and Physical (PBR) materials; color, textures, wireframe, transparency" },
    { name: "g3n/engine/graphic", why: "Mesh (geometry+material), Lines, Points — the drawable node types" },
    { name: "g3n/engine/light", why: "Ambient, Directional, Point and Spot lights" },
    { name: "g3n/engine/camera", why: "perspective/orthographic Camera plus NewOrbitControl for free orbit/pan/zoom" },
    { name: "g3n/engine/renderer", why: "the Renderer passed to your Run callback; renderer.Render(scene, cam) draws a frame" },
    { name: "g3n/engine/gls", why: "the OpenGL state wrapper: Clear/Viewport/ClearColor, VBO, and buffer/attribute constants" },
    { name: "g3n/engine/window", why: "window + input event names (OnKeyDown/OnCursor/OnWindowSize) and key constants" },
    { name: "g3n/engine/gui", why: "the 2D GUI toolkit: Panel, Button, Label, CheckBox, Edit, Slider, layouts, HUD overlays" },
    { name: "g3n/engine/texture", why: "Texture2D image loading (NewTexture2DFromImage), wrapping and filtering" },
    { name: "g3n/engine/loader/gltf + loader/obj", why: "import glTF/GLB and OBJ models with their materials, textures and animations" },
    { name: "native: libgl1-mesa-dev, xorg-dev (+ go-gl as the low-level alternative)", why: "the cgo build deps G3N links against; go-gl/gl + go-gl/glfw is the raw-OpenGL route below G3N" }
  ],

  gotchas: [
    "**cgo build deps:** G3N links native OpenGL/GLFW — install `gcc pkg-config libgl1-mesa-dev xorg-dev` (Linux) and keep `CGO_ENABLED=1`, or the build fails with `cannot find -lGL` / `build constraints exclude all Go files`. No easy cross-compiling.",
    "**No light = black.** A lit material (`Standard`/`Phong`/`Physical`) renders black without a light. Add `light.NewAmbient` + a point/directional light, or use `material.NewBasic()` to debug.",
    "**Camera looks down -Z.** A camera and object both at the origin show nothing — move the camera back (`SetPosition(0,0,5)`) or `LookAt(target, up)`. G3N is right-handed, Y-up.",
    "**Frustum clips the scene:** if `far` < camera distance the scene vanishes; too small a `near` or huge `far` causes z-fighting. Keep a modest near/far ratio (e.g. 0.1 / 1000).",
    "**Custom geometry needs normals** (`VertexNormal`, unit-length, outward) or lighting is wrong; needs `VertexTexcoord` UVs or textures won't map.",
    "**Reversed winding / normal** makes a face dark or invisible from the front — flip index order or use `material.SideDouble` while debugging.",
    "**Non-uniform scale skews normals**, breaking lighting on lit meshes. Prefer uniform scale, or bake the stretch into the geometry.",
    "**Transform order is fixed (scale→rotate→translate).** To orbit around a point, parent the object to a pivot node and rotate the pivot — you can't reorder one node's transform.",
    "**math32 methods mutate in place:** `v.Add(u)` changes `v`. Call `v.Clone()` first if you need the original — a subtle source of drifting positions.",
    "**Frame-rate dependence:** multiply every per-frame motion by `dt.Seconds()`, never a fixed constant, or speed changes with monitor refresh rate.",
    "**Transparency needs the flag:** `SetOpacity(<1)` does nothing without `SetTransparent(true)` (and usually a blend mode); over-flagging transparency causes sorting artifacts.",
    "**Reuse geometries/materials** across identical meshes; a new material per mesh explodes draw calls and GPU state changes (the top perf mistake).",
    "**Dispose discarded GPU resources** (geometry/material/texture hold GL handles); creating textures/materials every frame leaks VRAM and tanks FPS.",
    "**Handle window resize** (`window.OnWindowSize` → `Gls().Viewport` + `cam.SetAspect`) or the image stretches and picking coordinates go wrong.",
    "**Type-assert event payloads:** callbacks are `func(name string, ev interface{})`; do `ev.(*window.KeyEvent)`. Use `KeyState().Pressed` for held keys, events for discrete actions.",
    "**Imported models vary in scale & up-axis** (some Z-up); wrap the loaded node in a pivot and fix rotation/scale there, and check the load error before assuming it's invisible for another reason.",
    "**Audio adds native deps:** importing `g3n/engine/audio` requires `libopenal-dev` + `libvorbis-dev` or the build breaks — only import it when you need sound.",
    "**Texture not showing** checklist: load error, missing UVs, black base color (black×texture=black), back-facing one-sided quad, or unset transparency for alpha PNGs."
  ],

  flashcards: [
    { q: "Where does G3N sit vs raw go-gl and vs Ebiten?", a: "G3N is a **retained-mode scene-graph 3D engine** on top of OpenGL. `go-gl` is raw OpenGL/GLFW bindings (you write the whole renderer); **Ebiten** is a Go engine but strictly **2D**. G3N gives you meshes/lights/cameras/GUI without writing a renderer." },
    { q: "What is a scene graph and how do transforms compose?", a: "A tree of `core.Node`s, each with a local transform (pos/rot/scale) and children. A node's **world matrix = parent world × local (T·R·S)**, computed top-down each frame — so rotating a parent carries all descendants." },
    { q: "What is the render loop shape in G3N?", a: "`a.Run(func(rend *renderer.Renderer, dt time.Duration){ ... rend.Render(scene, cam) })`. It runs once per frame; `dt` is the frame delta — multiply per-frame motion by `dt.Seconds()` for frame-rate independence." },
    { q: "Minimum to see a lit object?", a: "A **camera** added to the scene and positioned back on +Z (or `LookAt`), a **mesh** (geometry+material) added to the scene, at least one **light** (ambient + point/directional), and `rend.Render(scene, cam)` each frame." },
    { q: "How do you make a custom shape?", a: "`geometry.NewGeometry()`, put per-vertex floats in a `math32.ArrayF32`, wrap in `gls.NewVBO(...).AddAttrib(gls.VertexPosition).AddAttrib(gls.VertexNormal).AddAttrib(gls.VertexTexcoord)`, `AddVBO`, then `SetIndices(math32.ArrayU32)` for the triangles." },
    { q: "Dot product — what is it and what's it for?", a: "`a·b = |a||b|cosθ`, a scalar measuring alignment (0 = perpendicular). Powers **diffuse lighting** (`max(0, normal·lightDir)`), facing tests, projection, and angle-between (`acos` of unit-vector dot)." },
    { q: "Cross product — what is it and what's it for?", a: "`a×b` is a vector **perpendicular to both**, length `|a||b|sinθ`. Used to compute **surface normals** (cross of two triangle edges), a camera's `right` axis, and to test winding/handedness." },
    { q: "Why 4×4 matrices and homogeneous coordinates?", a: "Translation isn't linear in 3D, so points are extended to `(x,y,z,1)` and transforms to 4×4 — this lets translation, rotation and scale combine into **one** matrix the GPU applies per vertex. Composition is matrix multiply (not commutative — order matters)." },
    { q: "What is the MVP matrix?", a: "**Projection · View · Model** — the matrix that takes a vertex from local space to clip space. Model = node world transform, View = inverse camera transform, Projection = perspective/ortho. G3N builds it; you set the projection params." },
    { q: "Perspective vs orthographic projection?", a: "**Perspective** = a frustum with foreshortening (FOV/aspect/near/far); distant things shrink — games. **Orthographic** = a box, no foreshortening, parallels stay parallel — CAD/2D/isometric/shadow maps. Same camera, `SetProjection` switches." },
    { q: "The four G3N light types?", a: "**Ambient** (uniform fill, no position), **Directional** (parallel sun rays), **Point** (bulb with falloff + position), **Spot** (cone: position + direction + angle). Combine a weak ambient with a key light; there's a shader cap on light count." },
    { q: "Why prefer quaternions over Euler angles?", a: "Euler angles suffer **gimbal lock** and interpolate unevenly. Quaternions (`SetFromAxisAngle`, `Slerp`) give smooth shortest-path rotation with no lock — use them for accumulated/interpolated orientation (mouse-look, tweening)." },
    { q: "How do you pick the object under the cursor?", a: "Convert the pixel coords to NDC `[-1,1]` (**flip Y**), `raycaster.SetFromCamera(cam, x, y)`, then `raycaster.IntersectObjects(scene.Children(), true)` — returns hits sorted nearest-first with Object, world Point and Distance." },
    { q: "How do textures map onto geometry?", a: "Each vertex has a **UV** in [0,1]²; the GPU interpolates it across triangles to sample the image. Load with `texture.NewTexture2DFromImage`, set wrap (`REPEAT`/`CLAMP_TO_EDGE`) and filter, `mat.AddTexture(tex)`. Custom geometry must supply `VertexTexcoord`." },
    { q: "How do you load a 3D model?", a: "glTF: `g, _ := gltf.ParseJSON(path)` (or `ParseBin` for .glb) then `node, _ := g.LoadScene(0)`; OBJ: `dec, _ := obj.Decode(obj, mtl)` then `dec.NewGroup()`. Add the returned `core.INode` to the scene; fix scale/up-axis via a pivot." },
    { q: "Two ways to read input, and when to use each?", a: "**Poll** `a.KeyState().Pressed(window.KeyW)` each frame for continuous/held input (movement). **Subscribe** to `window.OnKeyDown`/`OnMouseDown` for discrete actions (jump, click). Callbacks are `func(name string, ev interface{})` — type-assert the payload." },
    { q: "Top G3N performance rule?", a: "**Reuse geometries and materials** across identical meshes (one Material shared by 500 meshes, not 500 materials) so the renderer batches and avoids state changes. Also: fewer draw calls, cull/hide offscreen nodes, no per-frame allocations, `Dispose()` discarded GPU resources." },
    { q: "Why does non-uniform scale break lighting?", a: "Non-uniform scale (`SetScale(1,3,1)`) skews a mesh's normals, so lit shading goes wrong. Use uniform scale for lit meshes or bake the stretch into the geometry; non-uniform scale is fine for unlit/UI objects." }
  ],

  cheatsheet: [
    { label: "Install deps (Ubuntu)", code: "sudo apt-get install gcc pkg-config libgl1-mesa-dev xorg-dev" },
    { label: "Get the engine", code: "go get github.com/g3n/engine/..." },
    { label: "App singleton + loop", code: "a := app.App(); a.Run(func(r *renderer.Renderer, dt time.Duration){ a.Gls().Clear(gls.COLOR_BUFFER_BIT|gls.DEPTH_BUFFER_BIT|gls.STENCIL_BUFFER_BIT); r.Render(scene, cam) })" },
    { label: "Scene root", code: "scene := core.NewNode()" },
    { label: "Camera + orbit", code: "cam := camera.New(1); cam.SetPosition(0,0,4); scene.Add(cam); camera.NewOrbitControl(cam)" },
    { label: "Mesh (shape+material)", code: "m := graphic.NewMesh(geometry.NewCube(1), material.NewStandard(math32.NewColor(\"Teal\"))); scene.Add(m)" },
    { label: "Lights", code: "scene.Add(light.NewAmbient(&math32.Color{R:1,G:1,B:1}, 0.4)); p := light.NewPoint(&math32.Color{R:1,G:1,B:1},1); p.SetPosition(2,3,3); scene.Add(p)" },
    { label: "Transform a node", code: "n.SetPosition(x,y,z); n.SetRotationY(a); n.SetScale(s,s,s); n.RotateY(1*float32(dt.Seconds()))" },
    { label: "Vector math", code: "v.Add(u); v.MultiplyScalar(2); v.Normalize(); d := a.Dot(b); n := math32.NewVector3().CrossVectors(e1,e2).Normalize()" },
    { label: "Matrix compose (T·R·S)", code: "m := math32.NewMatrix4().Multiply(t).Multiply(r).Multiply(s); p.ApplyMatrix4(m)" },
    { label: "Custom geometry VBO", code: "gls.NewVBO(verts).AddAttrib(gls.VertexPosition).AddAttrib(gls.VertexNormal).AddAttrib(gls.VertexTexcoord)" },
    { label: "Texture", code: "t,_ := texture.NewTexture2DFromImage(\"c.png\"); t.SetWrapS(gls.REPEAT); mat.AddTexture(t)" },
    { label: "Transparency", code: "mat.SetTransparent(true); mat.SetOpacity(0.5); mat.SetBlending(material.BlendAlpha)" },
    { label: "Resize handler", code: "a.Subscribe(window.OnWindowSize, func(string, interface{}){ w,h := a.GetSize(); a.Gls().Viewport(0,0,int32(w),int32(h)); cam.SetAspect(float32(w)/float32(h)) })" },
    { label: "Held key vs event", code: "if a.KeyState().Pressed(window.KeyW) { ... }   // vs a.Subscribe(window.OnKeyDown, cb)" },
    { label: "Raycast pick", code: "rc.SetFromCamera(cam, ndcX, ndcY); hits := rc.IntersectObjects(scene.Children(), true)" },
    { label: "Load glTF", code: "g,_ := gltf.ParseJSON(\"m.gltf\"); n,_ := g.LoadScene(0); scene.Add(n)" },
    { label: "Load OBJ", code: "dec,_ := obj.Decode(\"m.obj\",\"m.mtl\"); grp,_ := dec.NewGroup(); scene.Add(grp)" },
    { label: "GUI button", code: "b := gui.NewButton(\"Go\"); b.SetPosition(10,10); b.Subscribe(gui.OnClick, cb); scene.Add(b)" }
  ]
});
