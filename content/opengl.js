(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "opengl",
  name: "OpenGL",
  language: "C++",
  group: "3D graphics",
  navLabel: "OpenGL (C++)",
  color: "#5586a4",
  readMinutes: 44,
  tagline: "Learn **real-time 3D from scratch** in modern C++ — the OpenGL 3.3+ core profile with **GLFW** (windowing), **GLAD** (loader) and **GLM** (math), including the **linear algebra** that actually makes it work.",

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "**OpenGL is not an engine.** It is a specification for a *rasterization API* — a big **state machine** that turns arrays of numbers (vertices) into pixels on a framebuffer, running most of the work on the **GPU**. It has no concept of a scene, a camera, a mesh, a light, or a material. Those are things *you* build on top of it. What OpenGL gives you is: buffers of data, programs (shaders) that run on the GPU, and draw calls that push data through a fixed sequence of stages — the **graphics pipeline**." },
        { type: "p", text: "OpenGL is the classic way to *learn* real-time 3D because it is far simpler to get a triangle on screen than in Vulkan/DirectX/Metal, while teaching the same fundamentals: the pipeline, shaders, buffers, and the linear algebra of moving points through space. Everything you learn here transfers directly to the modern explicit APIs." },
        { type: "heading", text: "Immediate mode (legacy) vs the core profile (modern)" },
        { type: "list", items: [
          "**Legacy / immediate mode (OpenGL ≤ 2.x, the `glBegin/glVertex3f/glEnd` and `glMatrixMode` era):** the driver owned a fixed-function pipeline and a matrix stack. Easy to start, but it hides how the GPU actually works, is slow (per-vertex CPU calls), and is **deprecated**. Old tutorials teaching `glBegin` are teaching a dead API — ignore them.",
          "**Modern / core profile (OpenGL 3.3+):** *you* upload data into GPU buffers once, *you* write the vertex and fragment shaders, *you* build the matrices. Nothing is implicit. This is what this deck teaches, and it maps 1:1 onto how Vulkan/DX12/Metal/WebGPU work.",
          "Request the core profile explicitly at context creation so the deprecated functions are simply unavailable — that turns \"why is nothing drawing\" mysteries into compile/link errors instead."
        ] },
        { type: "heading", text: "The pipeline at a glance" },
        { type: "p", text: "A draw call sends your vertex data through these stages. The **blue** stages are programmable (you write GLSL); the rest are fixed hardware." },
        { type: "table", headers: ["Stage", "What it does", "Programmable?"], rows: [
          ["Vertex specification", "your VBO/VAO feed vertex attributes in", "config (CPU)"],
          ["**Vertex shader**", "transforms each vertex (position → clip space), passes data on", "yes (GLSL)"],
          ["Primitive assembly", "groups vertices into points/lines/triangles", "no"],
          ["Rasterization", "converts each primitive into fragments (candidate pixels)", "no"],
          ["**Fragment shader**", "computes the color of each fragment (lighting, texturing)", "yes (GLSL)"],
          ["Per-fragment ops", "depth test, stencil, blending → written to the framebuffer", "config"]
        ] },
        { type: "heading", text: "Where OpenGL sits in the ecosystem" },
        { type: "list", items: [
          "**Below it (lower-level GPU APIs):** **Vulkan** (the modern explicit successor, verbose but total control), **DirectX 12** (Windows/Xbox), **Metal** (Apple), **WebGPU** (the new cross-platform/browser standard). OpenGL drivers are often implemented on top of these today.",
          "**Beside it:** **WebGL** is essentially OpenGL ES in the browser — the GLSL and concepts here transfer almost verbatim.",
          "**Above it (abstraction layers & engines):** **bgfx**, **Magnum**, **Diligent** (thin cross-API renderers), **Ogre3D** (a rendering engine), and full engines like **Unity/Unreal/Godot**. They exist because raw OpenGL makes *you* write the scene graph, culling, asset pipeline, etc."
        ] },
        { type: "callout", variant: "note", text: "**Apple deprecated OpenGL** (frozen at 4.1) in 2018 in favor of Metal — it still runs, but for new Apple-native work Metal/MoltenVK is the path. On Windows and Linux, OpenGL 4.6 drivers are alive and well. This deck targets **3.3 core** (the universal baseline) and notes where 4.x adds nicer tools." },
        { type: "callout", variant: "tip", text: "The canonical free text is **[learnopengl.com](https://learnopengl.com)** by Joey de Vries — this deck follows the same modern-core path. Pair it with the **[docs.gl](https://docs.gl)** function reference and the **[OpenGL wiki](https://www.khronos.org/opengl/wiki/)**." }
      ]
    },
    {
      id: "setup",
      title: "Setup & toolchain: GLFW, GLAD, GLM, CMake, a window",
      level: "core",
      body: [
        { type: "p", text: "OpenGL itself is *just a set of function signatures*. To use it in C++ you need three companions: **GLFW** (creates a window + OpenGL context, and gives you keyboard/mouse/time input across Windows/macOS/Linux), **GLAD** (loads the actual driver function pointers at runtime — the OS ships you a blank header, GLAD fills it in), and **GLM** (a header-only math library that mirrors GLSL's `vec`/`mat` types so your CPU math matches your shader math)." },
        { type: "heading", text: "Getting the three libraries" },
        { type: "list", items: [
          "**GLFW** — install via your package manager (`apt install libglfw3-dev`, `brew install glfw`, `vcpkg install glfw3`) or build from source. Alternative: **SDL2/SDL3** does the same windowing job and more.",
          "**GLAD** — *generated*, not installed. Go to the web service **[gen.glad.sh](https://gen.glad.sh)** (or the older glad.dav1d.de), choose API **gl**, version **3.3** (or 4.6), profile **Core**, generate, and download the zip. You get `glad.c` (compile it into your project) plus `glad/glad.h` and `KHR/khrplatform.h`. That `glad.c` is the loader for *exactly* the version/extensions you picked.",
          "**GLM** — header-only. `apt install libglm-dev`, `brew install glm`, `vcpkg install glm`, or just drop the `glm/` folder in your include path. No compilation needed."
        ] },
        { type: "heading", text: "CMake project" },
        { type: "code", lang: "cmake", code: "cmake_minimum_required(VERSION 3.16)\nproject(hello_gl LANGUAGES C CXX)\n\nset(CMAKE_CXX_STANDARD 17)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nfind_package(glfw3 CONFIG REQUIRED)   # windowing/input\nfind_package(glm   CONFIG REQUIRED)   # math (header-only)\nfind_package(OpenGL REQUIRED)         # the system GL library\n\n# GLAD is compiled straight into our target (glad.c generated from gen.glad.sh)\nadd_executable(hello_gl\n    src/main.cpp\n    third_party/glad/src/glad.c)\n\ntarget_include_directories(hello_gl PRIVATE third_party/glad/include)\ntarget_link_libraries(hello_gl PRIVATE glfw glm::glm OpenGL::GL ${CMAKE_DL_LIBS})" },
        { type: "heading", text: "A window + context + the game loop" },
        { type: "code", lang: "cpp", code: "#include <glad/glad.h>   // MUST come before glfw3.h — GLAD defines the GL symbols\n#include <GLFW/glfw3.h>\n#include <iostream>\n\n// called by GLFW whenever the framebuffer is resized\nvoid framebuffer_size_callback(GLFWwindow*, int w, int h) {\n    glViewport(0, 0, w, h);   // map NDC [-1,1] to this pixel rectangle\n}\n\nint main() {\n    glfwInit();\n    // ask for OpenGL 3.3 CORE (no deprecated functions available)\n    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);\n    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);\n    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);\n#ifdef __APPLE__\n    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);  // required on macOS\n#endif\n\n    GLFWwindow* window = glfwCreateWindow(1280, 720, \"Hello GL\", nullptr, nullptr);\n    if (!window) { std::cerr << \"window failed\\n\"; glfwTerminate(); return -1; }\n    glfwMakeContextCurrent(window);              // bind the GL context to this thread\n    glfwSwapInterval(1);                         // vsync on\n\n    // GLAD loads every GL function pointer using GLFW's loader — AFTER a context exists\n    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {\n        std::cerr << \"GLAD failed\\n\"; return -1;\n    }\n    glViewport(0, 0, 1280, 720);\n    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);\n\n    // ---- the render / game loop ----\n    while (!glfwWindowShouldClose(window)) {\n        // input\n        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)\n            glfwSetWindowShouldClose(window, true);\n\n        // render\n        glClearColor(0.1f, 0.12f, 0.15f, 1.0f);  // set the clear color (state)\n        glClear(GL_COLOR_BUFFER_BIT);            // actually clear\n\n        // ... draw calls go here ...\n\n        glfwSwapBuffers(window);   // present the back buffer (double buffering)\n        glfwPollEvents();          // process OS/input events\n    }\n    glfwTerminate();\n    return 0;\n}" },
        { type: "callout", variant: "gotcha", text: "**`#include <glad/glad.h>` must appear BEFORE `<GLFW/glfw3.h>`.** GLAD defines the OpenGL symbols; GLFW's header will pull in the system `<GL/gl.h>` if GLAD hasn't already claimed those symbols, and you'll get a wall of redefinition errors. Also: **call `gladLoadGLLoader` only AFTER `glfwMakeContextCurrent`** — there is nothing to load a function pointer *for* until a context is current." },
        { type: "callout", variant: "tip", text: "On a **HiDPI/Retina** display the framebuffer is larger than the window in screen coordinates — always drive `glViewport` from `glfwGetFramebufferSize`, not the window size, or your rendering fills only a quarter of the window." }
      ]
    },
    {
      id: "pipeline",
      title: "The graphics pipeline in depth",
      level: "core",
      body: [
        { type: "p", text: "Every pixel you draw is the result of your vertex data flowing through the pipeline once per draw call. Understanding the stages — and which run on the CPU vs the GPU — is the single most important mental model in graphics." },
        { type: "list", items: [
          "**Vertex specification (CPU-side config):** you describe *where* your vertex data lives (a VBO) and *how to interpret it* (a VAO: \"bytes 0–11 are a vec3 position, bytes 12–23 are a vec3 normal…\"). The GPU then pulls vertices from there.",
          "**Vertex shader (GPU, programmable):** runs **once per vertex**. Its main job is to output `gl_Position` in *clip space* (usually `projection * view * model * position`). It also passes per-vertex data (colors, normals, texture coords) down to later stages.",
          "**Primitive assembly (GPU, fixed):** groups the stream of vertices into primitives according to the draw mode — `GL_TRIANGLES` groups every 3 vertices into a triangle. (Optional tessellation & geometry shader stages can sit here in 4.x.)",
          "**Rasterization (GPU, fixed):** the heart of it — each triangle is converted into **fragments**, one per pixel it covers. Vertex outputs are **interpolated** across the triangle (perspective-correct), so each fragment gets a smoothly blended color/normal/uv.",
          "**Fragment shader (GPU, programmable):** runs **once per fragment** (usually far more invocations than vertices). Computes the final color — this is where texturing and lighting happen. Outputs a `vec4` color.",
          "**Per-fragment operations (GPU, fixed/config):** the **depth test** (is this fragment nearer than what's already there?), stencil test, and **blending** (transparency) decide whether and how the fragment's color is written to the framebuffer."
        ] },
        { type: "callout", variant: "note", text: "**CPU vs GPU:** the CPU (your C++) sets state and issues draw calls; the GPU runs the shaders massively in parallel — thousands of fragments at once. The golden rule of performance is *minimize CPU→GPU communication*: upload data once, change as little state as possible per frame, and batch draw calls. A \"draw call\" is expensive because it's a CPU→driver→GPU round trip." },
        { type: "p", text: "A **shader** is simply a small program written in **GLSL** (OpenGL Shading Language) that runs on the GPU at one of the programmable stages. A vertex shader + fragment shader are compiled and **linked** into a **shader program**; you bind one program before a draw call and it processes that draw's vertices/fragments. You must supply at least a vertex and a fragment shader — there is no default in the core profile." }
      ]
    },
    {
      id: "triangle",
      title: "Your first triangle: VBO, VAO, glVertexAttribPointer",
      level: "core",
      body: [
        { type: "p", text: "The \"hello world\" of OpenGL. Three objects are involved: a **VBO** (Vertex Buffer Object — a chunk of GPU memory holding your raw vertex bytes), a **VAO** (Vertex Array Object — a saved *description* of how to read that buffer), and a **shader program**. You upload the triangle's three corners, describe the layout once, then draw." },
        { type: "code", lang: "cpp", code: "// three vertices in Normalized Device Coordinates (NDC): x,y,z each in [-1, 1]\nfloat vertices[] = {\n    -0.5f, -0.5f, 0.0f,   // bottom-left\n     0.5f, -0.5f, 0.0f,   // bottom-right\n     0.0f,  0.5f, 0.0f,   // top\n};\n\nunsigned int VAO, VBO;\nglGenVertexArrays(1, &VAO);\nglGenBuffers(1, &VBO);\n\n// 1) bind the VAO first — it will REMEMBER the attribute setup + which VBO/EBO\nglBindVertexArray(VAO);\n\n// 2) upload the data into the VBO\nglBindBuffer(GL_ARRAY_BUFFER, VBO);\nglBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);\n\n// 3) describe attribute 0: 3 floats, not normalized, stride 3*float, offset 0\nglVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);\nglEnableVertexAttribArray(0);   // enable attribute slot 0\n\n// (VAO now records: attrib 0 reads from VBO with that layout)\nglBindVertexArray(0);           // unbind (optional hygiene)" },
        { type: "p", text: "In the render loop, drawing is now two lines: bind the program, bind the VAO, `glDrawArrays`." },
        { type: "code", lang: "cpp", code: "glUseProgram(shaderProgram);\nglBindVertexArray(VAO);\nglDrawArrays(GL_TRIANGLES, 0, 3);   // mode, first vertex, vertex count" },
        { type: "heading", text: "What each object is (and why VAOs exist)" },
        { type: "table", headers: ["Object", "Holds", "Analogy"], rows: [
          ["**VBO**", "raw vertex bytes in GPU memory", "the data file"],
          ["**VAO**", "the *layout*: which attributes, their format, and which VBO/EBO they come from", "the schema / how to read the file"],
          ["**EBO**", "indices into the VBO (next section)", "an index for reuse"]
        ] },
        { type: "p", text: "Without VAOs you would have to re-call `glVertexAttribPointer` + `glEnableVertexAttribArray` for every attribute *before every draw*. The VAO records that entire configuration once; then drawing a mesh is just `glBindVertexArray(vao); glDrawArrays(...)`. **In the core profile a VAO is mandatory** — draw calls with no VAO bound silently draw nothing." },
        { type: "code", lang: "cpp", code: "// glVertexAttribPointer(index, size, type, normalized, stride, offset)\n//   index      = the `location` in the vertex shader (layout(location=0))\n//   size       = components per attribute (3 for a vec3)\n//   type       = GL_FLOAT\n//   normalized = GL_FALSE for floats; GL_TRUE maps int [0,255]->[0,1]\n//   stride     = bytes from one vertex to the next (0 = tightly packed)\n//   offset     = byte offset of THIS attribute within a vertex (cast to void*)" },
        { type: "callout", variant: "gotcha", text: "The `offset` argument is a **`void*`** for legacy reasons — pass `(void*)0`, `(void*)(3*sizeof(float))`, etc., *not* a raw integer, or you'll get a compiler warning/error. And **the VBO must be bound at the moment you call `glVertexAttribPointer`** — that call captures the currently-bound `GL_ARRAY_BUFFER` into the VAO." }
      ]
    },
    {
      id: "shaders",
      title: "Shaders & GLSL: compiling, linking, uniforms",
      level: "core",
      body: [
        { type: "p", text: "GLSL is a C-like language with built-in vector/matrix types (`vec2/3/4`, `mat3/4`), swizzling (`color.rgb`, `pos.xy`), and stage inputs/outputs. A vertex shader receives vertex attributes via `in`, writes `gl_Position` and any `out` varyings; a fragment shader receives interpolated `in` varyings and writes an `out` color." },
        { type: "code", lang: "glsl", code: "// --- vertex.glsl ---\n#version 330 core\nlayout (location = 0) in vec3 aPos;      // matches attrib index 0 in the VAO\nlayout (location = 1) in vec3 aColor;    // per-vertex color\n\nout vec3 vColor;                          // passed to the fragment shader (interpolated)\nuniform mat4 uModel;                      // set from C++ (same for all vertices)\n\nvoid main() {\n    gl_Position = uModel * vec4(aPos, 1.0);   // required output: clip-space position\n    vColor = aColor;\n}" },
        { type: "code", lang: "glsl", code: "// --- fragment.glsl ---\n#version 330 core\nin  vec3 vColor;         // interpolated across the triangle by the rasterizer\nout vec4 FragColor;      // the one output: final pixel color (RGBA)\n\nuniform float uTime;     // a uniform we drive from C++\n\nvoid main() {\n    FragColor = vec4(vColor * (0.5 + 0.5 * sin(uTime)), 1.0);\n}" },
        { type: "table", headers: ["Qualifier", "Meaning"], rows: [
          ["`in`", "an input: vertex attributes (VS) or interpolated varyings (FS)"],
          ["`out`", "an output: varyings passed down the pipeline, or the final FS color"],
          ["`uniform`", "a global constant for the whole draw call, set from C++ (matrices, time, light positions)"],
          ["`layout(location=N)`", "pins an attribute/output to an explicit slot, matching `glVertexAttribPointer`'s index"]
        ] },
        { type: "heading", text: "Compiling & linking a program" },
        { type: "code", lang: "cpp", code: "unsigned int compile(GLenum type, const char* src) {\n    unsigned int s = glCreateShader(type);\n    glShaderSource(s, 1, &src, nullptr);\n    glCompileShader(s);\n    int ok; glGetShaderiv(s, GL_COMPILE_STATUS, &ok);\n    if (!ok) { char log[512]; glGetShaderInfoLog(s, 512, nullptr, log);\n               std::cerr << \"shader compile error:\\n\" << log << '\\n'; }\n    return s;\n}\n\nunsigned int vs = compile(GL_VERTEX_SHADER,   vertexSrc);\nunsigned int fs = compile(GL_FRAGMENT_SHADER, fragmentSrc);\nunsigned int program = glCreateProgram();\nglAttachShader(program, vs);\nglAttachShader(program, fs);\nglLinkProgram(program);\nint linked; glGetProgramiv(program, GL_LINK_STATUS, &linked);\nif (!linked) { char log[512]; glGetProgramInfoLog(program, 512, nullptr, log);\n               std::cerr << \"link error:\\n\" << log << '\\n'; }\nglDeleteShader(vs);   // once linked, the individual shaders can go\nglDeleteShader(fs);" },
        { type: "heading", text: "Sending uniforms from C++" },
        { type: "code", lang: "cpp", code: "glUseProgram(program);                                // must be current first!\nint loc = glGetUniformLocation(program, \"uTime\");     // look up by name\nglUniform1f(loc, (float)glfwGetTime());\n\n// matrices need glUniformMatrix4fv with glm::value_ptr\nglUniformMatrix4fv(glGetUniformLocation(program, \"uModel\"),\n                   1, GL_FALSE, glm::value_ptr(model));" },
        { type: "heading", text: "A minimal shader-class abstraction" },
        { type: "code", lang: "cpp", code: "struct Shader {\n    unsigned int id;\n    Shader(const char* vsSrc, const char* fsSrc) { /* compile+link as above */ }\n    void use() const { glUseProgram(id); }\n    void set(const char* n, float v) const { glUniform1f(loc(n), v); }\n    void set(const char* n, const glm::vec3& v) const { glUniform3fv(loc(n), 1, &v[0]); }\n    void set(const char* n, const glm::mat4& m) const {\n        glUniformMatrix4fv(loc(n), 1, GL_FALSE, glm::value_ptr(m));\n    }\n    int loc(const char* n) const { return glGetUniformLocation(id, n); }\n};" },
        { type: "callout", variant: "gotcha", text: "**Always check compile *and* link logs.** A silent shader failure is the #1 cause of a black screen. `glGetUniformLocation` returns **-1** if the name is misspelled *or* if the compiler optimized the uniform away because it isn't actually used — setting a uniform at location -1 is a silent no-op, not an error." },
        { type: "callout", variant: "tip", text: "You must call `glUseProgram(program)` **before** setting any uniform — uniforms are set on the *currently active* program. Cache uniform locations once (they don't change after linking) instead of calling `glGetUniformLocation` every frame." }
      ]
    },
    {
      id: "math-vectors",
      title: "MATH I — vectors: dot & cross products",
      level: "core",
      body: [
        { type: "p", text: "3D graphics *is* linear algebra. A **vector** is an ordered tuple of numbers that represents either a **position** (a point) or a **direction/displacement**. In graphics you use `vec2` (screen/UV), `vec3` (positions, directions, colors, normals) and `vec4` (homogeneous positions, RGBA). GLM gives you these exact types on the CPU so your math matches the shader." },
        { type: "code", lang: "cpp", code: "#include <glm/glm.hpp>\nglm::vec3 a(1.0f, 2.0f, 3.0f);\nglm::vec3 b(4.0f, 0.0f, 0.0f);\n\nglm::vec3 sum   = a + b;          // component-wise: (5, 2, 3)\nglm::vec3 diff  = b - a;          // a->b displacement\nglm::vec3 scaled = 2.0f * a;      // (2, 4, 6) — scaling stretches length\nfloat     len   = glm::length(a); // sqrt(1+4+9) = 3.7417\nglm::vec3 unit  = glm::normalize(a); // same direction, length 1" },
        { type: "heading", text: "Length & normalize" },
        { type: "p", text: "The **length** (magnitude) of `v = (x,y,z)` is `‖v‖ = sqrt(x² + y² + z²)` (the Pythagorean theorem in 3D). **Normalizing** divides a vector by its length to get a **unit vector** (length 1) pointing the same way. Directions used in lighting (normals, light directions, view directions) should almost always be normalized, because the math below assumes unit length." },
        { type: "heading", text: "Dot product — the angle/projection operator" },
        { type: "p", text: "`a · b = ax·bx + ay·by + az·bz` — multiply componentwise and sum, giving a **single scalar**. Its geometric meaning is the key: `a · b = ‖a‖ ‖b‖ cos θ`, where θ is the angle between them." },
        { type: "list", items: [
          "If **a and b are unit vectors**, then `a · b = cos θ` directly — this is *the* lighting workhorse. Diffuse lighting is `max(dot(normal, lightDir), 0.0)`: full brightness when the light hits head-on (θ=0, cos=1), zero when perpendicular or behind (cos ≤ 0).",
          "**Sign tells you orientation:** `> 0` = same general direction (θ < 90°), `0` = perpendicular, `< 0` = opposing (θ > 90°). Used to test if a surface faces the camera/light.",
          "**Projection:** the length of `a`'s shadow onto a unit vector `n` is `a · n`. This underlies reflection, shadows, and decomposing motion into components."
        ] },
        { type: "code", lang: "cpp", code: "glm::vec3 n = glm::normalize(normal);       // surface normal\nglm::vec3 l = glm::normalize(lightPos - fragPos);  // toward the light\nfloat diffuse = glm::max(glm::dot(n, l), 0.0f);    // Lambert's cosine law\nfloat angleDeg = glm::degrees(glm::acos(glm::dot(a, b) /\n                              (glm::length(a) * glm::length(b))));" },
        { type: "heading", text: "Cross product — building normals & bases" },
        { type: "p", text: "`a × b` produces a **vector perpendicular to both** a and b, with length `‖a‖‖b‖ sin θ` (the area of the parallelogram they span). Its direction follows the **right-hand rule**: point your right hand's fingers from a toward b, and your thumb points along `a × b`." },
        { type: "code", lang: "cpp", code: "// a x b = (ay*bz - az*by,  az*bx - ax*bz,  ax*by - ay*bx)\nglm::vec3 edge1 = v1 - v0;\nglm::vec3 edge2 = v2 - v0;\nglm::vec3 faceNormal = glm::normalize(glm::cross(edge1, edge2)); // triangle normal\n\n// building an orthonormal camera basis from a forward + world-up\nglm::vec3 forward = glm::normalize(target - eye);\nglm::vec3 right   = glm::normalize(glm::cross(forward, worldUp));\nglm::vec3 up      = glm::cross(right, forward);   // already unit-length" },
        { type: "list", items: [
          "**Surface normals:** the normal of a triangle is `cross(edge1, edge2)` normalized — this is how a mesh loader computes normals when a model file lacks them.",
          "**Camera/tangent bases:** cross products build the three perpendicular axes (right/up/forward) of a coordinate frame — used for cameras and normal mapping (TBN matrix).",
          "**Order matters:** `a × b = −(b × a)`. Swapping the operands flips the normal — get this wrong and your lighting/culling faces the wrong way."
        ] },
        { type: "callout", variant: "tip", text: "Rules of thumb: **dot product → \"how aligned?\" (a number, cosine)**; **cross product → \"give me a perpendicular\" (a vector, with right-hand orientation)**. Almost every lighting and camera formula is one of these two, so internalize their geometric meaning, not just the algebra." }
      ]
    },
    {
      id: "math-matrices",
      title: "MATH II — matrices & transformations",
      level: "core",
      body: [
        { type: "p", text: "A **matrix** is a grid of numbers that encodes a *linear (or affine) transformation* — a rule for moving/rotating/scaling every point in space at once. Transforming a vector is a **matrix × vector** multiply. Chaining transformations is **matrix × matrix**. In 3D graphics we use **4×4 matrices** so that translation fits alongside rotation/scale (see homogeneous coordinates below)." },
        { type: "heading", text: "Matrix × vector, and why order matters" },
        { type: "p", text: "To transform a point `p`, you compute `M · p`. To apply transform A *then* B, you build the combined matrix `B · A` and multiply once: `(B · A) · p = B · (A · p)`. **Matrix multiplication is NOT commutative** — `B·A ≠ A·B` — so the order of operations is baked into the multiplication order. Read a chain **right-to-left**: the matrix nearest the vector is applied first." },
        { type: "code", lang: "cpp", code: "// This composed matrix applies SCALE first, then ROTATE, then TRANSLATE:\nglm::mat4 model = T * R * S;   // read right-to-left: S, then R, then T\nglm::vec4 worldPos = model * glm::vec4(localPos, 1.0f);\n\n// T * R * S  (translate-rotate-scale) is the standard object transform order,\n// so an object rotates/scales about its own origin, THEN moves into the world.\n// Swap to  S * R * T  and the object scales/rotates about the world origin\n// after being moved there — usually not what you want." },
        { type: "heading", text: "Why column-major?" },
        { type: "p", text: "OpenGL and GLM store matrices **column-major**: the 16 floats are laid out one *column* at a time, and vectors are treated as **column vectors** multiplied on the right (`M · v`). This is why transforms compose right-to-left and why you'll see `mat[col][row]` indexing in GLM. (DirectX historically uses row-major with `v · M` and left-to-right composition — the same math, transposed.) In practice: build with GLM's helpers, pass `GL_FALSE` for the transpose flag, and don't hand-index unless you must." },
        { type: "heading", text: "The three building-block matrices" },
        { type: "table", headers: ["Transform", "4×4 form (conceptual)", "GLM call"], rows: [
          ["**Translate** by (tx,ty,tz)", "identity with tx,ty,tz in the 4th column", "`glm::translate(m, vec3(tx,ty,tz))`"],
          ["**Scale** by (sx,sy,sz)", "sx,sy,sz on the diagonal", "`glm::scale(m, vec3(sx,sy,sz))`"],
          ["**Rotate** by θ about axis", "sin/cos block (Rodrigues' formula)", "`glm::rotate(m, angleRad, axis)`"]
        ] },
        { type: "code", lang: "cpp", code: "#include <glm/gtc/matrix_transform.hpp>\n\nglm::mat4 model(1.0f);                       // START from the identity matrix!\nmodel = glm::translate(model, glm::vec3(2.0f, 0.0f, -3.0f));\nmodel = glm::rotate(model, glm::radians(45.0f), glm::vec3(0, 1, 0)); // 45° about Y\nmodel = glm::scale(model, glm::vec3(0.5f));  // half size\n\n// NOTE: because each call RIGHT-multiplies, writing them\n// translate -> rotate -> scale  produces  T * R * S  (scale applied first).\n// The code order reads like the visual order you usually want." },
        { type: "heading", text: "Homogeneous coordinates — the 4th component" },
        { type: "p", text: "A 3×3 matrix can rotate and scale but **cannot translate** (translation isn't linear — it doesn't keep the origin fixed). The fix is to add a 4th coordinate **w** and use 4×4 matrices. A point becomes `(x, y, z, 1)` and a direction becomes `(x, y, z, 0)`:" },
        { type: "list", items: [
          "**w = 1 → a position.** The matrix's translation column now actually moves it (translation × 1 = the offset gets added).",
          "**w = 0 → a direction/vector.** Translation × 0 = 0, so directions are *unaffected by translation* — exactly right for normals and light directions, which have no location, only orientation.",
          "**Perspective divide:** after projection the GPU divides `(x,y,z,w)` by `w` to get NDC. Setting `w` to a function of depth is what makes distant objects appear smaller — the whole trick of perspective (next section)."
        ] },
        { type: "callout", variant: "gotcha", text: "**Always initialize a `glm::mat4` to the identity: `glm::mat4 m(1.0f);`** A default-constructed `glm::mat4 m;` is (per GLM's default) *not* guaranteed to be identity — starting from a zero or garbage matrix and then multiplying gives you a black screen with no error. The identity matrix is the \"do-nothing\" transform you build on top of." },
        { type: "callout", variant: "warn", text: "**GLM rotation takes RADIANS.** `glm::rotate(m, 45.0f, axis)` rotates by 45 *radians* (~2578°), not 45 degrees. Always wrap degrees: `glm::radians(45.0f)`. Since GLM 0.9.6 the degree-based overloads were removed for exactly this footgun." }
      ]
    },
    {
      id: "math-mvp",
      title: "MATH III — coordinate spaces & the MVP matrix",
      level: "core",
      body: [
        { type: "p", text: "This is the crux of 3D. A vertex starts in the object's own **local space** and must be transformed through a series of coordinate systems until it lands on your 2D screen. Three matrices do it — **Model**, **View**, **Projection** — and their product is the famous **MVP** matrix. Getting this pipeline right is 90% of 'why is nothing on screen'." },
        { type: "heading", text: "The chain of spaces" },
        { type: "table", headers: ["Space", "Transform to reach it", "Meaning"], rows: [
          ["**Local / object**", "— (the raw vertex data)", "coordinates as authored, centered on the model's origin"],
          ["**World**", "**Model** matrix", "the object placed/oriented/sized in the shared scene"],
          ["**View / eye**", "**View** matrix", "the world seen from the camera (camera at the origin, looking down −Z)"],
          ["**Clip**", "**Projection** matrix", "a cube-ish volume; the GPU clips anything outside it"],
          ["**NDC**", "perspective divide (÷w)", "normalized [-1,1]³ device coordinates"],
          ["**Screen**", "viewport transform (`glViewport`)", "actual pixels in the window"]
        ] },
        { type: "code", lang: "glsl", code: "// the vertex shader that does it all:\n#version 330 core\nlayout(location=0) in vec3 aPos;\nuniform mat4 model, view, projection;\nvoid main() {\n    // right-to-left: local -> world -> view -> clip\n    gl_Position = projection * view * model * vec4(aPos, 1.0);\n}" },
        { type: "heading", text: "Model & View" },
        { type: "p", text: "The **Model** matrix (previous section) puts one object into world space. The **View** matrix transforms the world so the camera sits at the origin looking down −Z — equivalently, it's the *inverse* of the camera's world transform. GLM builds it for you with `glm::lookAt(eye, center, up)`." },
        { type: "code", lang: "cpp", code: "glm::mat4 view = glm::lookAt(\n    glm::vec3(0.0f, 0.0f, 3.0f),   // eye: where the camera is\n    glm::vec3(0.0f, 0.0f, 0.0f),   // center: the point it looks at\n    glm::vec3(0.0f, 1.0f, 0.0f));  // up: world up (usually +Y)\n// internally lookAt builds an orthonormal basis with cross products (MATH I)\n// and combines it with a translation by -eye." },
        { type: "heading", text: "Projection: perspective vs orthographic" },
        { type: "p", text: "The **Projection** matrix maps the visible region (the **view frustum**) into clip space and sets up the perspective divide. Two kinds:" },
        { type: "list", items: [
          "**Perspective** — how the eye/camera sees: a truncated pyramid (frustum). Distant objects shrink because projection writes a `w` proportional to depth, and the later ÷w divide makes far things smaller. Parameters: **FOV** (vertical field of view angle), **aspect** ratio (width/height), **near** and **far** clip planes.",
          "**Orthographic** — parallel projection, no foreshortening: a box. Distant and near objects are the same size. Used for 2D games, UI/HUD, CAD, and shadow-map (directional light) rendering."
        ] },
        { type: "code", lang: "cpp", code: "// perspective: fovY (radians!), aspect, near, far\nglm::mat4 proj = glm::perspective(glm::radians(45.0f),\n                                  1280.0f / 720.0f,   // aspect = width/height\n                                  0.1f, 100.0f);      // near, far\n\n// orthographic: left, right, bottom, top, near, far\nglm::mat4 ortho = glm::ortho(0.0f, 1280.0f, 0.0f, 720.0f, -1.0f, 1.0f);" },
        { type: "heading", text: "Putting it together" },
        { type: "code", lang: "cpp", code: "shader.use();\nshader.set(\"model\", model);\nshader.set(\"view\", view);\nshader.set(\"projection\", proj);\nglBindVertexArray(vao);\nglDrawElements(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, 0);" },
        { type: "callout", variant: "gotcha", text: "**The near plane cannot be 0.** Perspective projection divides by depth, so `near = 0` blows up to infinity — use a small positive value like `0.1`. And keep the **near/far ratio sane**: a huge range (0.001 → 100000) starves the depth buffer of precision and causes **z-fighting** (flickering coplanar surfaces). Pull `near` as far out and `far` as close in as your scene allows." },
        { type: "callout", variant: "note", text: "**Aspect ratio** must track the framebuffer size or everything looks stretched — recompute `glm::perspective` (or at least its aspect) in your resize callback. **FOV** is the zoom: a small FOV (e.g. 30°) is a telephoto zoom-in, a large FOV (90°+) is wide-angle with visible distortion; ~45° is a natural default." }
      ]
    },
    {
      id: "ebo-cube",
      title: "Element buffers (EBO) & drawing a cube",
      level: "core",
      body: [
        { type: "p", text: "Most meshes share vertices between triangles — a cube has 8 corners but 12 triangles (36 vertex references). Duplicating a corner's data 3–6× wastes memory and bandwidth. An **EBO (Element Buffer Object)** stores a list of **indices** into the VBO; `glDrawElements` reads them so each unique vertex is stored once and referenced many times." },
        { type: "code", lang: "cpp", code: "float verts[] = { /* 4 unique corners of a quad: pos.xyz ... */\n     0.5f,  0.5f, 0.0f,   // 0 top-right\n     0.5f, -0.5f, 0.0f,   // 1 bottom-right\n    -0.5f, -0.5f, 0.0f,   // 2 bottom-left\n    -0.5f,  0.5f, 0.0f }; // 3 top-left\n\nunsigned int indices[] = {  // two triangles reuse corners 0 and 2\n    0, 1, 2,   // first triangle\n    0, 2, 3 }; // second triangle  (counter-clockwise winding)\n\nunsigned int VAO, VBO, EBO;\nglGenVertexArrays(1, &VAO); glGenBuffers(1, &VBO); glGenBuffers(1, &EBO);\nglBindVertexArray(VAO);\n\nglBindBuffer(GL_ARRAY_BUFFER, VBO);\nglBufferData(GL_ARRAY_BUFFER, sizeof(verts), verts, GL_STATIC_DRAW);\n\n// the EBO binding is RECORDED in the VAO — bind it while the VAO is bound\nglBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);\nglBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);\n\nglVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3*sizeof(float), (void*)0);\nglEnableVertexAttribArray(0);\nglBindVertexArray(0);" },
        { type: "code", lang: "cpp", code: "// draw with indices instead of glDrawArrays:\nglBindVertexArray(VAO);\nglDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);\n//             mode          count  index type       offset into EBO" },
        { type: "heading", text: "Winding order & what 'front-facing' means" },
        { type: "p", text: "The **order** you list a triangle's vertices defines its *front face*. By default OpenGL treats **counter-clockwise (CCW)** winding (as seen from the camera) as front-facing. This matters for **face culling** (next section): the GPU can skip back-facing triangles to save work, but only if your winding is consistent. A cube built with inconsistent winding will have holes when culling is on." },
        { type: "code", lang: "cpp", code: "glFrontFace(GL_CCW);   // default: counter-clockwise = front\nglEnable(GL_CULL_FACE);\nglCullFace(GL_BACK);   // don't draw back faces (the inside of solid objects)" },
        { type: "callout", variant: "gotcha", text: "**Unbinding the EBO while the VAO is still bound removes it from the VAO.** The element buffer binding is part of VAO state, so call `glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0)` *only after* `glBindVertexArray(0)`, never before — otherwise `glDrawElements` finds no indices and draws nothing. (The `GL_ARRAY_BUFFER` VBO binding, by contrast, is captured per-attribute and is safe to unbind.)" }
      ]
    },
    {
      id: "transforms-practice",
      title: "Transformations in practice: spinning & many objects",
      level: "core",
      body: [
        { type: "p", text: "With the MVP set up, animation is just rebuilding the **model** matrix every frame using the elapsed time, and drawing the same VAO multiple times with different model matrices for multiple objects." },
        { type: "code", lang: "cpp", code: "float t = (float)glfwGetTime();\n\n// spin a cube about the Y axis over time\nglm::mat4 model(1.0f);\nmodel = glm::rotate(model, t * glm::radians(50.0f), glm::vec3(0, 1, 0));\nshader.set(\"model\", model);\nglDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0);" },
        { type: "code", lang: "cpp", code: "// draw 10 cubes at different positions, each with its own model matrix\nglm::vec3 positions[10] = { /* ... */ };\nglBindVertexArray(cubeVAO);\nfor (int i = 0; i < 10; ++i) {\n    glm::mat4 model(1.0f);\n    model = glm::translate(model, positions[i]);         // place it\n    model = glm::rotate(model, t + i, glm::vec3(1, 0.3f, 0.5f)); // spin uniquely\n    shader.set(\"model\", model);\n    glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0); // same mesh, new transform\n}" },
        { type: "heading", text: "Orbiting: composing transforms as a 'stack'" },
        { type: "p", text: "A moon orbiting a planet is nested transforms: the moon's world matrix is `planetTransform * orbitRotation * moonOffset * moonSpin`. Because each factor is a matrix, you compose them by multiplication (parent-to-child, left-to-right in world terms). This is the seed of a **scene graph** (later section)." },
        { type: "code", lang: "cpp", code: "glm::mat4 planet = glm::rotate(glm::mat4(1.0f), t*0.3f, {0,1,0});      // planet spins\nglm::mat4 orbit  = glm::rotate(glm::mat4(1.0f), t*0.9f, {0,1,0});      // moon's orbit angle\nglm::mat4 moon   = planet * orbit\n                 * glm::translate(glm::mat4(1.0f), {3,0,0})            // orbit radius\n                 * glm::scale(glm::mat4(1.0f), glm::vec3(0.4f));       // moon size" },
        { type: "callout", variant: "tip", text: "Rebuild model matrices from the identity **every frame** rather than accumulating (`model = glm::rotate(model, smallAngle, ...)` each frame) — accumulating floating-point error and non-uniform scale into a persistent matrix slowly corrupts it (skew, drift). Derive each frame's transform from clean parameters (position, an angle, a scale)." }
      ]
    },
    {
      id: "cameras",
      title: "Cameras: a fly/FPS camera with mouse-look",
      level: "core",
      body: [
        { type: "p", text: "A camera is just a **view matrix** you rebuild each frame from the camera's **position**, its **front** (look) direction, and an **up** vector, via `glm::lookAt(pos, pos + front, up)`. Movement changes `position`; mouse-look changes `front` via **yaw** and **pitch** angles." },
        { type: "code", lang: "cpp", code: "struct Camera {\n    glm::vec3 pos   {0, 0, 3};\n    glm::vec3 front {0, 0, -1};      // direction the camera looks\n    glm::vec3 up    {0, 1, 0};\n    float yaw = -90.0f, pitch = 0.0f; // -90 so we start looking down -Z\n    float fov = 45.0f;                // also the zoom\n\n    glm::mat4 view() const { return glm::lookAt(pos, pos + front, up); }\n\n    // recompute `front` from yaw/pitch (spherical -> cartesian)\n    void updateFront() {\n        glm::vec3 f;\n        f.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));\n        f.y = sin(glm::radians(pitch));\n        f.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));\n        front = glm::normalize(f);\n    }\n};" },
        { type: "heading", text: "WASD movement with delta-time" },
        { type: "p", text: "Multiply movement by **delta-time** (seconds since last frame) so speed is frame-rate independent — otherwise a 240fps machine moves 4× faster than a 60fps one. `right` is `normalize(cross(front, up))`." },
        { type: "code", lang: "cpp", code: "float now = glfwGetTime();\nfloat dt = now - lastFrame; lastFrame = now;   // delta-time in seconds\nfloat speed = 3.0f * dt;\nglm::vec3 right = glm::normalize(glm::cross(cam.front, cam.up));\n\nif (key(GLFW_KEY_W)) cam.pos += speed * cam.front;\nif (key(GLFW_KEY_S)) cam.pos -= speed * cam.front;\nif (key(GLFW_KEY_A)) cam.pos -= speed * right;   // strafe left\nif (key(GLFW_KEY_D)) cam.pos += speed * right;   // strafe right" },
        { type: "heading", text: "Mouse-look (yaw/pitch) and scroll-zoom (FOV)" },
        { type: "code", lang: "cpp", code: "void mouse_callback(GLFWwindow*, double xpos, double ypos) {\n    static float lastX = 640, lastY = 360; static bool first = true;\n    if (first) { lastX = xpos; lastY = ypos; first = false; }\n    float dx = (xpos - lastX) * 0.1f;      // sensitivity\n    float dy = (lastY - ypos) * 0.1f;      // reversed: screen-y grows downward\n    lastX = xpos; lastY = ypos;\n\n    cam.yaw   += dx;\n    cam.pitch += dy;\n    cam.pitch = glm::clamp(cam.pitch, -89.0f, 89.0f); // avoid flipping at the poles\n    cam.updateFront();\n}\nvoid scroll_callback(GLFWwindow*, double, double yoff) {\n    cam.fov = glm::clamp(cam.fov - (float)yoff, 1.0f, 45.0f); // zoom via FOV\n}\n// in setup: hide+capture the cursor for FPS look\nglfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);\nglfwSetCursorPosCallback(window, mouse_callback);\nglfwSetScrollCallback(window, scroll_callback);" },
        { type: "callout", variant: "warn", text: "**Clamp pitch to ±89°.** At exactly ±90° the `front` vector aligns with the world-up used in `lookAt`, their cross product degenerates to zero, and the view matrix breaks (the camera flips/spins). This is a mild taste of **gimbal lock** — the deeper fix (quaternions) comes later, but for a standard FPS camera clamping is the standard, sufficient trick." },
        { type: "callout", variant: "tip", text: "Handle the **first mouse frame** specially: the very first callback delivers wherever the cursor happened to be, producing a huge jump. Seed `lastX/lastY` on the first event (the `first` flag above). Also feed the camera's `fov` into `glm::perspective` each frame so scroll-zoom actually takes effect." }
      ]
    },
    {
      id: "depth",
      title: "Depth testing, the depth buffer & face culling",
      level: "core",
      body: [
        { type: "p", text: "In 2D you draw back-to-front and later pixels overwrite earlier ones (the painter's algorithm). In 3D that fails for interpenetrating geometry, so the GPU keeps a **depth buffer (z-buffer)**: for every pixel it stores the depth of the closest fragment seen so far, and a new fragment is only drawn if it's nearer. You must **enable** it — it's off by default." },
        { type: "code", lang: "cpp", code: "glEnable(GL_DEPTH_TEST);           // turn on the z-buffer (do this once at setup)\nglDepthFunc(GL_LESS);              // default: pass if fragment is nearer\n\n// every frame you must clear BOTH color and depth:\nglClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);" },
        { type: "heading", text: "Z-fighting" },
        { type: "p", text: "When two surfaces sit at nearly the same depth, limited depth-buffer precision makes the winner flicker per pixel/frame — **z-fighting**. The depth buffer is *non-linear* (most precision is near the camera), so the usual causes and fixes are about the projection range:" },
        { type: "list", items: [
          "**Move the near plane out** (`0.1` not `0.001`) — the near/far ratio dominates precision. This is the single biggest lever.",
          "**Don't place coplanar surfaces** (a decal exactly on a wall) — offset them slightly, or use `glPolygonOffset`.",
          "**Use a 24-bit (or higher) depth buffer** (GLFW gives 24 by default) and consider a reversed-Z scheme for huge view distances."
        ] },
        { type: "heading", text: "Face culling" },
        { type: "p", text: "For closed opaque solids you never see the *inside* of a triangle, so drawing back faces is wasted work. **Face culling** discards them based on winding order (previous section)." },
        { type: "code", lang: "cpp", code: "glEnable(GL_CULL_FACE);\nglCullFace(GL_BACK);     // discard back-facing triangles\nglFrontFace(GL_CCW);     // CCW = front (must match your index winding)" },
        { type: "callout", variant: "gotcha", text: "**Forgetting `GL_DEPTH_BUFFER_BIT` in `glClear`** leaves last frame's depth values in the buffer, so this frame's fragments fail the depth test in seemingly random places — objects vanish or show through walls. Clear color **and** depth every frame. And if enabling culling makes parts of your model disappear, your winding order is inconsistent, not your culling." }
      ]
    },
    {
      id: "textures",
      title: "Textures: loading images, sampling, mipmaps",
      level: "core",
      body: [
        { type: "p", text: "A **texture** is an image sampled in the fragment shader to color surfaces. You load pixels from a file (with the tiny header-only **stb_image**), upload them to a GL texture object, and in GLSL read them with a `sampler2D` at interpolated **texture coordinates (UVs)** where (0,0) is one corner and (1,1) the opposite." },
        { type: "code", lang: "cpp", code: "#define STB_IMAGE_IMPLEMENTATION\n#include \"stb_image.h\"\n\nunsigned int loadTexture(const char* path) {\n    unsigned int tex; glGenTextures(1, &tex);\n    glBindTexture(GL_TEXTURE_2D, tex);\n\n    // wrapping: what happens outside [0,1]\n    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);\n    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);\n    // filtering: how to sample between texels\n    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);\n    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);\n\n    stbi_set_flip_vertically_on_load(true);  // OpenGL's V axis points up\n    int w, h, n;\n    unsigned char* data = stbi_load(path, &w, &h, &n, 0);\n    GLenum fmt = (n == 4) ? GL_RGBA : GL_RGB;\n    glTexImage2D(GL_TEXTURE_2D, 0, fmt, w, h, 0, fmt, GL_UNSIGNED_BYTE, data);\n    glGenerateMipmap(GL_TEXTURE_2D);         // build the downscaled chain\n    stbi_image_free(data);\n    return tex;\n}" },
        { type: "table", headers: ["Setting", "Options", "Purpose"], rows: [
          ["Wrap (S/T)", "`GL_REPEAT`, `GL_MIRRORED_REPEAT`, `GL_CLAMP_TO_EDGE`, `GL_CLAMP_TO_BORDER`", "behavior for UVs outside [0,1]"],
          ["Mag filter", "`GL_NEAREST` (blocky/pixel-art), `GL_LINEAR` (smooth)", "zooming *in* — magnification"],
          ["Min filter", "`GL_LINEAR_MIPMAP_LINEAR` (trilinear), `GL_NEAREST`", "zooming *out* — uses mipmaps"]
        ] },
        { type: "p", text: "**Mipmaps** are pre-shrunk copies of the texture (½, ¼, …). When a textured surface is far away, sampling the full-res image aliases and shimmers; the GPU instead samples the appropriately small mip level. Generate them with `glGenerateMipmap` and select a `*_MIPMAP_*` min filter." },
        { type: "heading", text: "Texture units & multiple textures" },
        { type: "p", text: "Shaders sample from **texture units** (`GL_TEXTURE0`, `GL_TEXTURE1`, …). Bind each texture to a unit, then tell each `sampler2D` uniform *which unit number* to read." },
        { type: "code", lang: "cpp", code: "glActiveTexture(GL_TEXTURE0); glBindTexture(GL_TEXTURE_2D, diffuse);\nglActiveTexture(GL_TEXTURE1); glBindTexture(GL_TEXTURE_2D, overlay);\nshader.use();\nglUniform1i(glGetUniformLocation(shader.id, \"uDiffuse\"), 0); // sampler -> unit 0\nglUniform1i(glGetUniformLocation(shader.id, \"uOverlay\"), 1); // sampler -> unit 1" },
        { type: "code", lang: "glsl", code: "#version 330 core\nin  vec2 vUV;\nout vec4 FragColor;\nuniform sampler2D uDiffuse;   // reads from texture unit 0\nuniform sampler2D uOverlay;   // reads from unit 1\nvoid main() {\n    vec4 base = texture(uDiffuse, vUV);\n    vec4 top  = texture(uOverlay, vUV);\n    FragColor = mix(base, top, 0.3);   // blend 30% overlay\n}" },
        { type: "callout", variant: "gotcha", text: "**Textures usually load upside-down.** Image files store the top row first, but OpenGL's texture origin is the bottom-left, so without `stbi_set_flip_vertically_on_load(true)` your textures appear flipped. Add the UV attribute to the VAO layout and don't forget the extra `stride`/`offset` when you interleave position+UV in one VBO." }
      ]
    },
    {
      id: "lighting",
      title: "Lighting: Phong & Blinn-Phong",
      level: "core",
      body: [
        { type: "p", text: "The **Phong reflection model** approximates surface lighting as the sum of three terms, computed per-fragment. It's not physically accurate, but it's cheap, intuitive, and the foundation everyone learns before PBR." },
        { type: "list", items: [
          "**Ambient** — a small constant so nothing is pure black: `ambient = ka * lightColor`. Fakes bounced/indirect light.",
          "**Diffuse** — matte reflection, brightest where the surface faces the light. Lambert's cosine law: `diffuse = max(dot(N, L), 0) * lightColor`, where **N** is the unit surface normal and **L** the unit direction toward the light. This is the dot product from MATH I doing the work.",
          "**Specular** — the shiny highlight, dependent on the viewer. Phong: `spec = pow(max(dot(R, V), 0), shininess)`, where **R** is the reflection of the light about the normal (`reflect(-L, N)`) and **V** the direction to the viewer."
        ] },
        { type: "code", lang: "glsl", code: "#version 330 core\nin  vec3 vNormal;    // interpolated normal (world space)\nin  vec3 vFragPos;   // fragment world position\nout vec4 FragColor;\n\nuniform vec3 uLightPos, uViewPos, uLightColor, uObjectColor;\n\nvoid main() {\n    vec3 N = normalize(vNormal);              // interpolation denormalizes -> renormalize\n    vec3 L = normalize(uLightPos - vFragPos); // toward the light\n    vec3 V = normalize(uViewPos  - vFragPos); // toward the camera\n\n    vec3 ambient = 0.1 * uLightColor;\n    float diff = max(dot(N, L), 0.0);\n    vec3 diffuse = diff * uLightColor;\n\n    // --- Blinn-Phong specular: use the HALFWAY vector, not the reflection ---\n    vec3 H = normalize(L + V);\n    float spec = pow(max(dot(N, H), 0.0), 64.0);   // 64 = shininess\n    vec3 specular = spec * uLightColor;\n\n    FragColor = vec4((ambient + diffuse + specular) * uObjectColor, 1.0);\n}" },
        { type: "heading", text: "Blinn-Phong vs Phong" },
        { type: "p", text: "Classic Phong reflects the light about the normal and dots with the view (`dot(R,V)`). **Blinn-Phong** instead uses the **halfway vector** `H = normalize(L + V)` and computes `dot(N, H)`. It's slightly cheaper, and — crucially — it fixes an artifact where Phong's highlight cuts off abruptly (and disappears) at grazing angles when `dot(R,V)` goes negative. Blinn-Phong is the default choice; bump the shininess exponent (~2–4×) to match Phong's look." },
        { type: "heading", text: "The normal matrix" },
        { type: "p", text: "Normals are **directions**, so they transform differently from positions. If your model matrix has **non-uniform scale**, transforming a normal by it *skews* it off the surface, breaking lighting. The correct transform is the **inverse-transpose of the model matrix's upper-left 3×3**:" },
        { type: "code", lang: "glsl", code: "// vertex shader\nuniform mat4 model;\nuniform mat3 normalMatrix;   // = transpose(inverse(mat3(model)))\nvNormal  = normalMatrix * aNormal;\nvFragPos = vec3(model * vec4(aPos, 1.0));" },
        { type: "code", lang: "cpp", code: "glm::mat3 normalMatrix = glm::transpose(glm::inverse(glm::mat3(model)));\nshader.set(\"normalMatrix\", normalMatrix);  // compute on CPU; inverse is costly in a shader" },
        { type: "callout", variant: "gotcha", text: "**Always `normalize()` normals in the fragment shader.** Even unit normals get their length changed by perspective-correct interpolation across a triangle, so a normal you assumed was unit-length isn't — and every dot-product term (diffuse, specular) then comes out wrong. Renormalize `N`, `L`, `V`, and `H`." },
        { type: "callout", variant: "note", text: "**Materials** generalize the constants: give each object its own ambient/diffuse/specular colors and a shininess (often as textures — a diffuse/albedo map, a specular map). That struct-of-uniforms is the bridge from ad-hoc lighting to a real material system and, eventually, PBR (metallic/roughness)." }
      ]
    },
    {
      id: "light-types",
      title: "Light types & multiple lights",
      level: "core",
      body: [
        { type: "p", text: "The lighting math is the same; only how you compute the light direction **L** and an intensity falloff changes. Three canonical types:" },
        { type: "table", headers: ["Type", "Light direction L", "Falloff"], rows: [
          ["**Directional** (sun)", "a fixed direction, same everywhere", "none (infinitely far)"],
          ["**Point** (bulb)", "`normalize(lightPos - fragPos)`", "**attenuation** with distance"],
          ["**Spotlight** (torch)", "as point, plus a cone test", "attenuation + soft cone edge"]
        ] },
        { type: "heading", text: "Attenuation (point lights fade with distance)" },
        { type: "code", lang: "glsl", code: "float d = length(uLightPos - vFragPos);\n// classic constant/linear/quadratic falloff\nfloat att = 1.0 / (1.0 + 0.09 * d + 0.032 * d * d);\ndiffuse  *= att;\nspecular *= att;" },
        { type: "heading", text: "Spotlight cone" },
        { type: "code", lang: "glsl", code: "vec3  L      = normalize(uLightPos - vFragPos);\nfloat theta  = dot(L, normalize(-uSpotDir));      // cosine to the spot axis\nfloat inner  = cos(radians(12.5));\nfloat outer  = cos(radians(17.5));\nfloat intensity = clamp((theta - outer) / (inner - outer), 0.0, 1.0); // soft edge\ndiffuse  *= intensity;\nspecular *= intensity;" },
        { type: "heading", text: "Looping many lights in one shader" },
        { type: "code", lang: "glsl", code: "#define NR_POINT_LIGHTS 4\nstruct PointLight { vec3 position, color; float constant, linear, quadratic; };\nuniform PointLight uPoints[NR_POINT_LIGHTS];\nuniform int uNumPoints;\n\nvoid main() {\n    vec3 result = calcDirLight(uDir, N, V);           // one sun\n    for (int i = 0; i < uNumPoints; ++i)              // add each point light\n        result += calcPointLight(uPoints[i], N, vFragPos, V);\n    FragColor = vec4(result, 1.0);\n}" },
        { type: "callout", variant: "tip", text: "Set struct-array uniforms from C++ with names like `\"uPoints[0].position\"`. For more than a handful of lights this forward-per-light approach gets expensive (cost = fragments × lights); the industry answer is **deferred shading** or clustered/forward+ — worth knowing exists once your scenes grow." }
      ]
    },
    {
      id: "model-loading",
      title: "Model loading with Assimp",
      level: "core",
      body: [
        { type: "p", text: "Real assets come from 3D tools (Blender, Maya) as `.obj`, `.fbx`, `.gltf`/`.glb`, etc. **Assimp** (Open Asset Import Library) loads ~40 formats into a uniform in-memory scene graph of meshes, each with vertex positions, normals, texture coords, tangents, and index lists, plus materials referencing textures. You walk that structure and build your own VAO/VBO/EBO per mesh." },
        { type: "code", lang: "cpp", code: "#include <assimp/Importer.hpp>\n#include <assimp/scene.h>\n#include <assimp/postprocess.h>\n\nAssimp::Importer importer;\nconst aiScene* scene = importer.ReadFile(path,\n      aiProcess_Triangulate        // turn polygons into triangles\n    | aiProcess_FlipUVs            // match OpenGL's UV origin\n    | aiProcess_GenSmoothNormals   // create normals if the file lacks them\n    | aiProcess_CalcTangentSpace); // tangents for normal mapping\nif (!scene || scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE || !scene->mRootNode)\n    std::cerr << \"Assimp: \" << importer.GetErrorString() << '\\n';" },
        { type: "code", lang: "cpp", code: "struct Vertex { glm::vec3 pos, normal; glm::vec2 uv; };\n\nvoid processMesh(aiMesh* m, std::vector<Vertex>& verts, std::vector<unsigned>& idx) {\n    for (unsigned i = 0; i < m->mNumVertices; ++i) {\n        Vertex v;\n        v.pos    = { m->mVertices[i].x, m->mVertices[i].y, m->mVertices[i].z };\n        v.normal = { m->mNormals[i].x,  m->mNormals[i].y,  m->mNormals[i].z };\n        v.uv     = m->mTextureCoords[0]     // may be null!\n                 ? glm::vec2{ m->mTextureCoords[0][i].x, m->mTextureCoords[0][i].y }\n                 : glm::vec2{ 0.0f };\n        verts.push_back(v);\n    }\n    for (unsigned f = 0; f < m->mNumFaces; ++f)          // faces -> flat index list\n        for (unsigned j = 0; j < m->mFaces[f].mNumIndices; ++j)\n            idx.push_back(m->mFaces[f].mIndices[j]);\n}" },
        { type: "heading", text: "A Mesh + Model abstraction (conceptual)" },
        { type: "list", items: [
          "**`Mesh`** owns one VAO/VBO/EBO plus the list of textures for that submesh, and a `draw(shader)` that binds its textures to units, binds the VAO, and calls `glDrawElements`.",
          "**`Model`** owns a `vector<Mesh>`, recursively walks `scene->mRootNode` (each node references meshes and has a transform), and loads materials/textures via `scene->mMaterials[...]->GetTexture(aiTextureType_DIFFUSE, ...)` — caching textures so a shared image isn't uploaded twice.",
          "Drawing the whole model is then just `for (auto& mesh : meshes) mesh.draw(shader);`."
        ] },
        { type: "callout", variant: "tip", text: "**Prefer glTF 2.0 (`.glb`)** for new work — it's the modern, well-specified, PBR-friendly runtime format (\"the JPEG of 3D\"), whereas `.obj` has no animation/PBR and `.fbx` is a proprietary Autodesk format. Assimp reads all of them, but glTF maps most cleanly onto a modern renderer." },
        { type: "callout", variant: "gotcha", text: "Assimp arrays can be **null**: `mNormals` is null if the file had none (request `aiProcess_GenSmoothNormals`), and `mTextureCoords[0]` is null for an untextured mesh — always guard those accesses or you'll crash on real-world files." }
      ]
    },
    {
      id: "quaternions",
      title: "MATH IV — quaternions & rotations",
      level: "deep",
      body: [
        { type: "p", text: "Rotations are the trickiest transform. Three ways to represent them, each with trade-offs: **Euler angles** (yaw/pitch/roll), **matrices**, and **quaternions**. For *storing* and *interpolating* orientation, quaternions win." },
        { type: "heading", text: "Euler angles & gimbal lock" },
        { type: "p", text: "Euler angles store three separate rotations about fixed axes. They're intuitive and human-readable, but suffer **gimbal lock**: when one axis rotates 90° it aligns with another, collapsing three degrees of freedom into two — you lose an axis of rotation and get sudden flips (you saw a taste of this clamping camera pitch). They also don't interpolate cleanly (rotating from one Euler triple to another can take a weird path)." },
        { type: "heading", text: "Quaternions" },
        { type: "p", text: "A **quaternion** `q = (w, x, y, z)` is a 4-number encoding of a rotation (a point on a 4D unit sphere), based on `w = cos(θ/2)` and `(x,y,z) = axis · sin(θ/2)`. You rarely touch the components directly — you use library functions. Quaternions have **no gimbal lock**, compose by multiplication, are compact (4 floats vs 9 for a matrix), and — the killer feature — interpolate smoothly with **slerp** (spherical linear interpolation), giving constant-speed shortest-path rotation between two orientations." },
        { type: "code", lang: "cpp", code: "#include <glm/gtc/quaternion.hpp>\n#include <glm/gtx/quaternion.hpp>\n\nglm::quat a = glm::angleAxis(glm::radians(0.0f),  glm::vec3(0,1,0));\nglm::quat b = glm::angleAxis(glm::radians(90.0f), glm::vec3(0,1,0));\n\n// smoothly blend orientation over t in [0,1] — the reason quats exist\nglm::quat q = glm::slerp(a, b, t);\n\nglm::mat4 rot = glm::toMat4(q);          // convert to a matrix for the model transform\nglm::vec3 dir = q * glm::vec3(0, 0, -1); // rotate a vector directly\n\n// compose rotations by multiplication (apply b then a): q = a * b\nglm::quat combined = a * b;\nglm::quat euler = glm::quat(glm::vec3(glm::radians(pitch), glm::radians(yaw), 0));" },
        { type: "table", headers: ["Representation", "Good for", "Weakness"], rows: [
          ["**Euler (yaw/pitch/roll)**", "human input, simple FPS cameras", "gimbal lock; poor interpolation"],
          ["**Matrix (mat3/4)**", "the final GPU transform; combining with translate/scale", "9–16 floats; drifts/skews when accumulated"],
          ["**Quaternion**", "storing orientation, interpolation (slerp), animation, smooth cameras", "unintuitive; must stay normalized"]
        ] },
        { type: "callout", variant: "tip", text: "Practical workflow: **store** orientation as a quaternion, **interpolate** with slerp, **accept user input** as Euler/axis-angle, and **convert to a matrix** (`glm::toMat4`) only at the end to feed the model matrix. Renormalize quaternions occasionally (`glm::normalize`) since repeated multiplication drifts them off the unit sphere. Skeletal animation and smooth camera rigs essentially require them." }
      ]
    },
    {
      id: "renderer-scene",
      title: "Organizing a renderer & a simple scene graph",
      level: "core",
      body: [
        { type: "p", text: "Once you have meshes, materials, cameras and lights, the missing piece is *structure*. A **scene graph** is a tree of nodes where each node has a **local transform** and children; a node's **world transform** is `parent.world * node.local`. This gives you parenting for free — move a car and its wheels follow — and is the orbit-composition from earlier, generalized." },
        { type: "code", lang: "cpp", code: "struct Node {\n    glm::mat4 local {1.0f};\n    Mesh*     mesh = nullptr;      // optional renderable\n    std::vector<Node*> children;\n\n    void draw(const glm::mat4& parentWorld, Shader& sh) {\n        glm::mat4 world = parentWorld * local;   // accumulate down the tree\n        if (mesh) { sh.set(\"model\", world); mesh->draw(sh); }\n        for (Node* c : children) c->draw(world, sh);\n    }\n};\n// root.draw(glm::mat4(1.0f), shader);" },
        { type: "heading", text: "Render-loop structure" },
        { type: "list", items: [
          "**Per frame:** poll input → update (physics, camera, animation, node transforms) → render → swap buffers. Keep update and render separable.",
          "**Render pass:** clear color+depth → for each shader/material, bind it once and set shared uniforms (view, projection, lights) → draw every object using that material → then swap.",
          "**Separate the concerns:** *meshes* (geometry/VAOs), *materials* (a shader + its uniform/texture set), and *transforms* (where things are). A draw is (mesh × material × transform). This separation is what every engine formalizes.",
          "**Batch to cut draw calls:** group objects by material to avoid redundant `glUseProgram`/texture binds; sort opaque front-to-back (depth) and transparent back-to-front (blending). Each `glDraw*` is a CPU→GPU cost — fewer, bigger draws win."
        ] },
        { type: "callout", variant: "note", text: "Don't build a full ECS/engine on day one. A `Model` list + a camera + a light array gets you far. Reach for a scene graph when you actually need hierarchical/parented transforms; reach for material-sorting when draw-call count (not fragment cost) becomes your bottleneck — profile before architecting." }
      ]
    },
    {
      id: "going-further",
      title: "Going further: framebuffers, instancing, UBOs, shadows",
      level: "deep",
      body: [
        { type: "p", text: "A survey of the next techniques — enough to know they exist, what problem each solves, and roughly how, so you can go deeper when you need them." },
        { type: "heading", text: "Framebuffers & render-to-texture (post-processing)" },
        { type: "p", text: "Instead of rendering to the screen, render into a **Framebuffer Object (FBO)** whose color attachment is a texture. Then draw a fullscreen quad sampling that texture through a fragment shader — that's **post-processing**: bloom, tone-mapping, FXAA, color grading, blur. FBOs are also the mechanism for shadow maps, reflections, deferred shading, and picking." },
        { type: "code", lang: "cpp", code: "unsigned int fbo; glGenFramebuffers(1, &fbo);\nglBindFramebuffer(GL_FRAMEBUFFER, fbo);\nglFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, colorTex, 0);\n// + a depth renderbuffer attachment, then check:\nif (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) { /* error */ }" },
        { type: "list", items: [
          "**Instancing** — draw thousands of copies of one mesh (grass, particles, a crowd) in a single call with `glDrawArraysInstanced`/`glDrawElementsInstanced`, feeding per-instance data (transforms) via a vertex attribute with `glVertexAttribDivisor`. Slashes draw-call overhead.",
          "**Uniform Buffer Objects (UBOs)** — put shared uniforms (view + projection, light arrays) in one buffer bound to a binding point, so *all* shaders read the same block and you update it once per frame instead of per-shader. (4.3+ adds SSBOs for large read/write data.)",
          "**Shadow mapping** — render the scene depth from the light's point of view into an FBO depth texture, then in the main pass compare each fragment's light-space depth against it: farther = in shadow. The standard real-time shadow technique.",
          "**Skyboxes** — a cubemap (`samplerCube`, 6 faces) drawn as a big cube around the camera with depth write off, giving an environment background and cheap reflections/IBL.",
          "**Compute shaders (4.3+)** — general GPU computation outside the raster pipeline (particles, culling, image processing) via `glDispatchCompute`.",
          "**Where next:** **Vulkan** (explicit control, multi-threaded command buffers), **PBR** (physically-based metallic/roughness shading + image-based lighting), and modern effects (SSAO, screen-space reflections, TAA)."
        ] },
        { type: "callout", variant: "note", text: "Each of these is a chapter in itself — the point here is the map. When raw OpenGL's boilerplate and single-threaded driver become the bottleneck (or you need portability to consoles/mobile), that's the signal to graduate to Vulkan/WebGPU, where these same concepts reappear as explicit render passes, descriptor sets, and pipelines." }
      ]
    },
    {
      id: "debugging",
      title: "Debugging & tooling",
      level: "deep",
      body: [
        { type: "p", text: "OpenGL fails **silently** by design — a bad call sets an error flag and moves on, so a black screen gives you nothing unless you go looking. Two tools make it tractable: the debug callback and RenderDoc." },
        { type: "heading", text: "glGetError vs the KHR_debug callback" },
        { type: "code", lang: "cpp", code: "// old way: poll the error flag after suspicious calls\nGLenum e; while ((e = glGetError()) != GL_NO_ERROR)\n    std::cerr << \"GL error 0x\" << std::hex << e << '\\n';\n\n// modern (4.3+ / KHR_debug): register a callback that fires WITH a message + stack context\nvoid APIENTRY onGLError(GLenum src, GLenum type, GLuint id, GLenum sev,\n                        GLsizei, const char* msg, const void*) {\n    std::cerr << \"[GL] \" << msg << '\\n';\n}\n// at setup (request a debug context via GLFW_OPENGL_DEBUG_CONTEXT first):\nglEnable(GL_DEBUG_OUTPUT);\nglEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);   // callback fires on the offending call\nglDebugMessageCallback(onGLError, nullptr);" },
        { type: "list", items: [
          "**RenderDoc** — the essential free frame debugger. Capture a frame and inspect every draw call, the bound VAO/VBO/textures/uniforms, the mesh at each pipeline stage, and the exact pixel history. When you can't see *why* nothing draws, RenderDoc shows you the state.",
          "**apitrace** — records and replays every GL call; good for diffing what your program actually issued.",
          "**Vendor tools** — NVIDIA Nsight Graphics, AMD Radeon GPU Profiler for performance/GPU timing.",
          "**Dear ImGui** — drop-in immediate-mode debug UI to tweak light positions, toggle wireframe (`glPolygonMode(GL_FRONT_AND_BACK, GL_LINE)`), and show FPS live."
        ] },
        { type: "heading", text: "The black-screen checklist" },
        { type: "list", ordered: true, items: [
          "Did the **shaders compile and link**? Print the info logs — this is the #1 cause.",
          "Is a **VAO bound** and a **program active** at the draw call? (core profile draws nothing without a VAO).",
          "Did you **clear** color *and* depth, and is the **clear color** not accidentally the same as your geometry?",
          "Is the geometry **in front of the camera** and **inside near/far**? Try an identity MVP to confirm the pipeline, then add matrices back.",
          "Is **`gl_Position`** actually written, with the right `w`? Is the **winding/culling** hiding your triangles (temporarily `glDisable(GL_CULL_FACE)`)?",
          "Are **attribute locations** and `glVertexAttribPointer` **stride/offset** correct for your vertex struct?"
        ] },
        { type: "callout", variant: "tip", text: "Wrap `glDebugMessageCallback` in every debug build — it turns \"invalid enum\" and \"no VAO bound\" from a mystery black screen into a printed line with the exact cause. Combine it with `glPolygonMode(..., GL_LINE)` wireframe to instantly see whether geometry exists but is unshaded vs. isn't being drawn at all." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The failure modes above, collected. Almost every 'it just shows black' session is one of these — check them in roughly this order." },
        { type: "table", headers: ["Symptom", "Likely cause", "Fix"], rows: [
          ["Black screen", "shader didn't compile/link; no VAO bound; forgot to clear", "print compile/link logs; bind a VAO + `glUseProgram`; `glClear(COLOR|DEPTH)`"],
          ["Nothing draws (but no error)", "VAO/attrib layout mismatch; wrong winding culled away", "verify `glVertexAttribPointer` stride/offset; `glDisable(GL_CULL_FACE)` to test"],
          ["Flickering coplanar surfaces", "z-fighting (depth precision)", "push `near` out (0.1), shrink far, offset coplanar geo, use 24-bit depth"],
          ["Object in the wrong place/inside-out", "transform order wrong (`S*R*T` vs `T*R*S`)", "compose `T * R * S`; read chains right-to-left"],
          ["Lighting is dark/banded/wrong", "un-normalized normals/vectors", "`normalize()` N, L, V, H in the fragment shader"],
          ["Lighting warps when scaled", "non-uniform scale skews normals", "transform normals by `transpose(inverse(mat3(model)))`"],
          ["Rotation is 45× too much", "degrees vs radians", "wrap every angle in `glm::radians(...)` — GLM uses radians"],
          ["Textures upside-down", "image origin vs GL origin", "`stbi_set_flip_vertically_on_load(true)` or `aiProcess_FlipUVs`"],
          ["Objects show through each other", "depth test off or depth not cleared", "`glEnable(GL_DEPTH_TEST)`; clear `GL_DEPTH_BUFFER_BIT` each frame"],
          ["`glDrawElements` draws nothing", "EBO unbound while VAO still bound", "unbind the VAO *before* the element buffer"],
          ["Uniform has no effect", "location -1: misspelled or optimized-out; program not active", "`glUseProgram` first; check the name; ensure the uniform is actually used"],
          ["Matrix looks like garbage", "column-major confusion / uninitialized mat4", "start from `glm::mat4(1.0f)`; pass `GL_FALSE` transpose; don't hand-transpose"]
        ] },
        { type: "list", items: [
          "**State leaks:** OpenGL is a global state machine — a texture/VAO/program you bound and forgot to unbind bleeds into the next object's draw. Bind exactly what each draw needs; in debug, unbind afterward to catch reliance on stale state.",
          "**`glGetUniformLocation` returns -1** for both typos *and* unused-so-optimized-away uniforms — a `set(\"uFoo\", ...)` then silently does nothing. If a value 'isn't applying', check the location isn't -1.",
          "**Requesting the wrong context:** on macOS you must request a **forward-compatible 3.3+ core** context or you get a legacy 2.1 context where none of this works. Check `glGetString(GL_VERSION)` at startup.",
          "**Interleaved-VBO offset math:** when you pack position+normal+uv into one VBO, every `glVertexAttribPointer` needs the right `stride` (full vertex size) and per-attribute `offset` — a wrong offset silently reads garbage as positions."
        ] },
        { type: "callout", variant: "good", text: "A reliable bring-up recipe: (1) get a **cleared colored window**, (2) draw a **hard-coded triangle with an identity MVP** (no matrices, no textures), (3) add the **MVP** and confirm it still shows, (4) add **depth test + a cube**, (5) add **textures**, (6) add **lighting**. Introduce one system at a time so a regression has exactly one suspect." }
      ]
    }
  ],

  packages: [
    { name: "GLFW", why: "cross-platform window + OpenGL context creation and keyboard/mouse/gamepad/time input — the default windowing layer for learning OpenGL" },
    { name: "GLAD", why: "generated function-pointer loader; pick GL version+profile at gen.glad.sh, compile the emitted glad.c — how you actually reach modern GL calls" },
    { name: "GLM", why: "header-only math library mirroring GLSL (vec/mat/quat) with glm::translate/rotate/scale, perspective, lookAt, slerp — your CPU-side linear algebra" },
    { name: "stb_image", why: "single-header image loader (PNG/JPG/…); tiny, dependency-free, the standard way to get pixels into a GL texture" },
    { name: "Assimp", why: "Open Asset Import Library — loads ~40 model formats (glTF/OBJ/FBX) into a uniform mesh/material/animation structure" },
    { name: "GLEW", why: "the older alternative to GLAD for loading GL functions; still common in existing codebases (GLAD is preferred for new projects)" },
    { name: "Dear ImGui", why: "immediate-mode debug UI — sliders/toggles/FPS overlays for tweaking lights, cameras and shaders live; has a ready GLFW+OpenGL3 backend" },
    { name: "CMake", why: "the de-facto C++ build system; find_package for glfw3/glm/OpenGL and target_link_libraries wire the project together cross-platform" },
    { name: "RenderDoc", why: "free frame-capture debugger — inspect every draw call, bound buffers/textures/uniforms and pixel history; essential for black-screen debugging" },
    { name: "SDL (SDL2/SDL3)", why: "alternative to GLFW for window/context/input (plus audio, gamepads, filesystem) — favored when building a fuller game framework" },
    { name: "glslang", why: "Khronos reference GLSL validator/compiler (and GLSL→SPIR-V); validate shaders offline in CI instead of only at runtime" },
    { name: "spdlog", why: "fast header-only logging — pair with the GL debug callback to route errors/warnings to a structured log" },
    { name: "fmt", why: "modern type-safe formatting for C++; handy for logging matrices/vectors and shader error messages readably" },
    { name: "tinygltf / tinyobjloader", why: "lightweight single-purpose loaders when you want just glTF or OBJ without pulling in all of Assimp" }
  ],

  gotchas: [
    "**Include order:** `#include <glad/glad.h>` must come BEFORE `<GLFW/glfw3.h>` (or SDL_opengl.h), or you get redefinition errors from the system GL header.",
    "**Load after a context:** call `gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)` only AFTER `glfwMakeContextCurrent` — there's no function to load a pointer for otherwise.",
    "**A VAO is mandatory** in the core profile: draw calls with no VAO bound silently draw nothing. Bind a VAO (and `glUseProgram`) before every `glDraw*`.",
    "**Clear depth every frame:** `glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)` and `glEnable(GL_DEPTH_TEST)` — depth testing is off by default and stale depth makes objects vanish.",
    "**GLM uses radians:** `glm::rotate/perspective` take radians — wrap every angle in `glm::radians(deg)`. This is the classic '45× too much rotation' bug.",
    "**Initialize matrices to identity:** `glm::mat4 m(1.0f);` — a bare `glm::mat4 m;` is not guaranteed identity, and building on a zero matrix gives a black screen.",
    "**Transform order is `T * R * S`** (read right-to-left, scale applied first) so objects rotate/scale about their own origin before moving; swapping the order misplaces everything.",
    "**Normalize normals in the fragment shader** — interpolation denormalizes them, throwing off every dot-product lighting term.",
    "**Non-uniform scale breaks normals:** use the normal matrix `transpose(inverse(mat3(model)))`, not the raw model matrix, to transform normals.",
    "**Textures load upside-down:** call `stbi_set_flip_vertically_on_load(true)` (or Assimp's `aiProcess_FlipUVs`) because image and GL texture origins differ.",
    "**Unbind the EBO after the VAO, not before** — the element-buffer binding is part of VAO state; unbinding it while the VAO is bound leaves `glDrawElements` with no indices.",
    "**`glGetUniformLocation` returns -1** for a misspelled name OR an unused (optimized-out) uniform; setting location -1 is a silent no-op — check compile logs and actual usage.",
    "**`glVertexAttribPointer` offset is a `void*`:** pass `(void*)0` / `(void*)(3*sizeof(float))`, and get `stride` right when interleaving attributes in one VBO.",
    "**Near plane can't be 0** and a huge near/far ratio starves depth precision → z-fighting; use `near≈0.1` and the smallest `far` your scene allows.",
    "**macOS needs a forward-compatible core context** (and is frozen at GL 4.1, deprecated) — set the GLFW hints or you get a legacy 2.1 context and nothing works.",
    "**OpenGL fails silently:** enable the `KHR_debug` callback (`glDebugMessageCallback`) in debug builds instead of hunting with `glGetError` after every call.",
    "**Clamp camera pitch to ±89°** — at ±90° the look direction aligns with world-up and `lookAt`'s cross products degenerate, spinning the view (mini gimbal lock).",
    "**State leaks:** a texture/program/VAO left bound bleeds into the next draw. Bind exactly what each draw needs; the global state machine won't warn you."
  ],

  flashcards: [
    { q: "Immediate mode vs the modern core profile?", a: "Immediate mode (`glBegin/glVertex`, fixed-function, deprecated) hid the pipeline and was slow. Core profile (3.3+) makes you own the buffers, shaders and matrices — nothing implicit — and maps 1:1 onto Vulkan/DX12/Metal." },
    { q: "What are a VBO and a VAO, and why do VAOs exist?", a: "A **VBO** holds raw vertex bytes in GPU memory. A **VAO** records the *layout* (which attributes, format, stride/offset, and source VBO/EBO). The VAO saves you re-specifying attributes before every draw; in the core profile it's mandatory." },
    { q: "Name the programmable stages of the pipeline.", a: "The **vertex shader** (runs per vertex, outputs clip-space `gl_Position`) and the **fragment shader** (runs per fragment, outputs the final color). Between them, fixed-function primitive assembly, rasterization (interpolates varyings) and per-fragment ops run on the GPU." },
    { q: "What does the dot product give you geometrically?", a: "`a·b = |a||b|cosθ`, a scalar. For unit vectors it's `cosθ` directly — the workhorse of diffuse lighting (`max(dot(N,L),0)`). Its sign tells you if two directions align (>0), are perpendicular (0) or oppose (<0)." },
    { q: "What does the cross product give you, and what sets its direction?", a: "`a×b` is a vector perpendicular to both, with length `|a||b|sinθ`. Its direction follows the right-hand rule. Uses: triangle/surface normals and building orthonormal (camera/TBN) bases. Note `a×b = -(b×a)`." },
    { q: "Why 4×4 matrices and homogeneous coordinates?", a: "Translation isn't linear, so a 3×3 matrix can't do it. Adding w and using 4×4 lets translation live in the matrix. Points use w=1 (translation applies); directions/normals use w=0 (translation ignored). The perspective ÷w creates foreshortening." },
    { q: "Why does transform order matter, and what's the standard order?", a: "Matrix multiply isn't commutative, so `B*A ≠ A*B`. The standard object transform is `model = T * R * S` (read right-to-left: scale, then rotate, then translate) so an object transforms about its own origin before moving into the world." },
    { q: "What are the three MVP matrices and the spaces they connect?", a: "**Model** (local→world), **View** (world→camera/eye, via `glm::lookAt`), **Projection** (eye→clip, via `glm::perspective`/`ortho`). `gl_Position = projection * view * model * vec4(pos,1)`; then ÷w gives NDC, then the viewport maps to pixels." },
    { q: "Perspective vs orthographic projection?", a: "Perspective is a frustum with foreshortening (distant = smaller) set by FOV/aspect/near/far — how eyes see. Orthographic is a box with no foreshortening — for 2D/UI/CAD and directional-light shadow maps." },
    { q: "How do you build a fly camera's view matrix?", a: "`glm::lookAt(pos, pos + front, up)`. `front` comes from yaw/pitch (spherical→cartesian); `right = normalize(cross(front, up))` for strafing; multiply movement by delta-time; clamp pitch to ±89°; FOV drives scroll-zoom." },
    { q: "Diffuse vs specular in Phong, and what is Blinn-Phong?", a: "Diffuse = `max(dot(N,L),0)` (matte, view-independent). Specular = shiny highlight, view-dependent. Blinn-Phong replaces Phong's `dot(reflect,V)` with the halfway vector `dot(N, normalize(L+V))` — cheaper and fixes the highlight cutoff at grazing angles." },
    { q: "Why and when do you need the normal matrix?", a: "Normals are directions and break under non-uniform scale if transformed by the model matrix. Transform them by `transpose(inverse(mat3(model)))` so they stay perpendicular to the surface. Also always `normalize()` them in the fragment shader." },
    { q: "Point-light attenuation — what is it?", a: "Point lights fade with distance: `att = 1/(constant + linear*d + quadratic*d²)`, multiplied into diffuse+specular. Directional lights (a sun) have a fixed direction and no attenuation; spotlights add a cone falloff." },
    { q: "Euler angles vs quaternions — when do you use each?", a: "Euler (yaw/pitch/roll) is intuitive for input but suffers gimbal lock and interpolates poorly. Quaternions avoid gimbal lock, are compact, and slerp smoothly — use them to store/interpolate orientation (cameras, skeletal animation); convert to a matrix (`glm::toMat4`) for the GPU." },
    { q: "What is gimbal lock?", a: "With Euler angles, when one rotation aligns two axes (e.g. pitch hits 90°), three degrees of freedom collapse to two — you lose an axis and get sudden flips. Quaternions (or clamping pitch to ±89° for a simple FPS camera) avoid it." },
    { q: "How does the depth buffer work and what is z-fighting?", a: "The z-buffer stores the nearest depth per pixel; a fragment draws only if nearer (`GL_LESS`). Enable `GL_DEPTH_TEST` and clear depth each frame. Z-fighting = flickering when surfaces have nearly equal depth; the non-linear buffer means pushing `near` out and shrinking `far` is the main fix." },
    { q: "Why must you normalize vectors, and which ones?", a: "The lighting formulas assume unit-length vectors (dot = cosθ only then). Normalize the surface normal N, light direction L, view direction V, and halfway H — interpolation across a triangle denormalizes even originally-unit normals." },
    { q: "What do GLFW, GLAD and GLM each do?", a: "**GLFW** creates the window/GL context and handles input+time. **GLAD** loads the GL function pointers for the version/profile you generated. **GLM** provides GLSL-matching vec/mat/quat math (translate/rotate/scale, perspective, lookAt, slerp)." }
  ],

  cheatsheet: [
    { label: "Request 3.3 core context", code: "glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR,3); glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR,3); glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);" },
    { label: "Load GL functions", code: "gladLoadGLLoader((GLADloadproc)glfwGetProcAddress);" },
    { label: "Clear (color + depth)", code: "glEnable(GL_DEPTH_TEST); glClearColor(.1f,.1f,.1f,1); glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);" },
    { label: "VBO + VAO setup", code: "glGenVertexArrays(1,&vao); glBindVertexArray(vao); glGenBuffers(1,&vbo); glBindBuffer(GL_ARRAY_BUFFER,vbo); glBufferData(GL_ARRAY_BUFFER,sizeof(v),v,GL_STATIC_DRAW);" },
    { label: "Vertex attribute", code: "glVertexAttribPointer(0,3,GL_FLOAT,GL_FALSE,3*sizeof(float),(void*)0); glEnableVertexAttribArray(0);" },
    { label: "Draw arrays / elements", code: "glDrawArrays(GL_TRIANGLES,0,3); // or glDrawElements(GL_TRIANGLES,count,GL_UNSIGNED_INT,0);" },
    { label: "Send a mat4 uniform", code: "glUniformMatrix4fv(glGetUniformLocation(prog,\"model\"),1,GL_FALSE,glm::value_ptr(model));" },
    { label: "Model matrix (T*R*S)", code: "glm::mat4 m(1.0f); m=glm::translate(m,pos); m=glm::rotate(m,glm::radians(deg),axis); m=glm::scale(m,scl);" },
    { label: "View matrix", code: "glm::mat4 view = glm::lookAt(eye, eye + front, up);" },
    { label: "Perspective projection", code: "glm::mat4 proj = glm::perspective(glm::radians(45.f), w/h, 0.1f, 100.f);" },
    { label: "Normal matrix", code: "glm::mat3 nm = glm::transpose(glm::inverse(glm::mat3(model)));" },
    { label: "Diffuse term (GLSL)", code: "float diff = max(dot(normalize(N), normalize(L)), 0.0);" },
    { label: "Blinn-Phong specular (GLSL)", code: "vec3 H=normalize(L+V); float spec=pow(max(dot(N,H),0.0), 64.0);" },
    { label: "Load a texture (stb)", code: "stbi_set_flip_vertically_on_load(true); data=stbi_load(path,&w,&h,&n,0); glTexImage2D(...); glGenerateMipmap(GL_TEXTURE_2D);" },
    { label: "Bind texture to a unit", code: "glActiveTexture(GL_TEXTURE0); glBindTexture(GL_TEXTURE_2D,tex); glUniform1i(loc,0);" },
    { label: "Face culling", code: "glEnable(GL_CULL_FACE); glCullFace(GL_BACK); glFrontFace(GL_CCW);" },
    { label: "Quaternion slerp", code: "glm::quat q = glm::slerp(a,b,t); glm::mat4 rot = glm::toMat4(q);" },
    { label: "Wireframe / debug", code: "glPolygonMode(GL_FRONT_AND_BACK, GL_LINE); glEnable(GL_DEBUG_OUTPUT);" }
  ]
});
