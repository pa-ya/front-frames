(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "wgpu",
  name: "wgpu",
  language: "Rust",
  group: "3D graphics",
  navLabel: "wgpu (Rust)",
  color: "#7a5cff",
  readMinutes: 44,
  tagline: "Modern, safe **GPU programming in Rust** — a portable **WebGPU** implementation (native + WASM) that powers **Bevy**, Firefox and Deno. Learn the explicit GPU pipeline *and* the linear algebra behind 3D.",

  sections: [
    {
      id: "overview",
      title: "Overview & the modern-GPU mental model",
      level: "core",
      body: [
        { type: "p", text: "**wgpu** is a pure-Rust implementation of the **WebGPU** standard. You write one codebase against the WebGPU API and wgpu runs it natively on **Vulkan, Metal, DX12 or GL**, and on the web on **WebGPU (or WebGL2 fallback)**. It's the low-level graphics layer under **Bevy**, Firefox's WebGPU, Deno, and most serious Rust graphics work. Shaders are written in **WGSL** (WebGPU Shading Language)." },
        { type: "p", text: "The mental shift from old immediate-mode OpenGL is that a modern GPU API is **explicit and mostly immutable**. Instead of flipping global state (`glEnable`, `glBindTexture`) between draw calls, you bake almost everything — shaders, vertex layout, blend, depth, cull — into an immutable **pipeline object** up front, then per frame you just *record commands* into a buffer and *submit* it. This is verbose the first time and boring (in a good way) forever after: no hidden global state, validated up front, and trivially parallel." },
        { type: "list", items: [
          "**One API, everywhere:** the same Rust runs native (Vulkan/Metal/DX12) and in the browser via WASM. Write once, ship to desktop and web.",
          "**Explicit resource ownership:** you create `Buffer`s, `Texture`s, `BindGroup`s and `RenderPipeline`s and keep them alive yourself — no driver magic tracking state behind your back.",
          "**Command recording:** work is recorded into a `CommandEncoder` and handed to the `Queue`. The GPU runs asynchronously; you don't block on it.",
          "**Validation you'll love:** wgpu validates every call against the WebGPU spec and prints *excellent*, specific error messages. Read them — they usually name the exact field that's wrong.",
          "**Safe by construction:** no `unsafe` in your app code, no dangling GPU handles, no undefined behavior from a mismatched draw — the borrow checker plus wgpu's validation catch it."
        ] },
        { type: "table", headers: ["Layer", "What it is", "When to reach for it"], rows: [
          ["**Bevy**", "full ECS game engine built ON wgpu", "you want a batteries-included engine (assets, scenes, physics, UI)"],
          ["**iced / egui**", "GUI toolkits (egui via `egui-wgpu`)", "app UIs, tools, debug overlays on top of your render"],
          ["**wgpu**", "the WebGPU API — pipelines, buffers, shaders", "custom renderers, full control, learning how GPUs really work"],
          ["**wgpu-hal / naga**", "the hardware backends + the shader compiler", "you almost never touch these directly"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets a **current wgpu (25.x/26.x era, mid-2026)** with **winit 0.30+** for windowing and **glam** for math. wgpu's API still shifts slightly between majors (a struct field appears, `request_device` drops an argument) — if a field name differs in your version, the compiler and validation layer will tell you precisely what to change." },
        { type: "callout", variant: "tip", text: "Two crates make wgpu pleasant: **glam** (fast SIMD linear algebra — `Vec3`, `Mat4`, `Quat`) and **bytemuck** (safely reinterpret a `#[repr(C)]` struct as raw bytes to upload to the GPU). You'll use both on every project. The `learn-wgpu` book and the wgpu repo `examples/` are the canonical references." }
      ]
    },
    {
      id: "setup",
      title: "Setup: Cargo project, deps, a window & the init dance",
      level: "core",
      body: [
        { type: "p", text: "A wgpu app is a normal Cargo binary. You need **wgpu** (the API), **winit** (cross-platform windowing + event loop), **glam** (math), **bytemuck** (POD casting), **pollster** (to block on the async init on native), and **env_logger** (so wgpu's log messages actually print). Add **image** for textures." },
        { type: "code", lang: "toml", code: "# Cargo.toml\n[package]\nname = \"wgpu-cube\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[dependencies]\nwgpu = \"26.0\"\nwinit = \"0.30\"\nglam = { version = \"0.30\", features = [\"bytemuck\"] }  # Pod impls for Vec/Mat\nbytemuck = { version = \"1\", features = [\"derive\"] }\npollster = \"0.4\"          # block_on for the async init on native\nenv_logger = \"0.11\"\nimage = \"0.25\"\nlog = \"0.4\"\n\n# web-only deps (see the WASM section)\n[target.'cfg(target_arch = \"wasm32\")'.dependencies]\nwgpu = { version = \"26.0\", features = [\"webgl\"] }  # WebGL2 fallback\nwasm-bindgen = \"0.2\"\nconsole_error_panic_hook = \"0.3\"" },
        { type: "p", text: "winit 0.30 uses the **`ApplicationHandler`** trait: you implement `resumed` (create the window + GPU state) and `window_event` (handle input, resize, redraw). The GPU init is **async**, so on native we wrap it in `pollster::block_on`." },
        { type: "code", lang: "rust", code: "use std::sync::Arc;\nuse winit::application::ApplicationHandler;\nuse winit::event::WindowEvent;\nuse winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop};\nuse winit::window::{Window, WindowId};\n\n#[derive(Default)]\nstruct App { state: Option<State> }\n\nimpl ApplicationHandler for App {\n    // called once the platform is ready to create surfaces\n    fn resumed(&mut self, event_loop: &ActiveEventLoop) {\n        let attrs = Window::default_attributes().with_title(\"wgpu\");\n        let window = Arc::new(event_loop.create_window(attrs).unwrap());\n        // State::new is async -> block on it (native). On web you'd spawn it.\n        self.state = Some(pollster::block_on(State::new(window)));\n    }\n\n    fn window_event(&mut self, event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {\n        let Some(state) = self.state.as_mut() else { return };\n        match event {\n            WindowEvent::CloseRequested => event_loop.exit(),\n            WindowEvent::Resized(size) => state.resize(size),\n            WindowEvent::RedrawRequested => {\n                state.update();\n                match state.render() {\n                    Ok(()) => {}\n                    // surface lost/outdated (minimized, monitor change) -> reconfigure\n                    Err(wgpu::SurfaceError::Lost | wgpu::SurfaceError::Outdated) => state.reconfigure(),\n                    Err(wgpu::SurfaceError::OutOfMemory) => event_loop.exit(),\n                    Err(e) => log::error!(\"frame error: {e:?}\"),\n                }\n                state.window.request_redraw(); // keep the loop going\n            }\n            _ => {}\n        }\n    }\n}\n\nfn main() {\n    env_logger::init();\n    let event_loop = EventLoop::new().unwrap();\n    event_loop.set_control_flow(ControlFlow::Poll); // run as fast as possible (a game loop)\n    event_loop.run_app(&mut App::default()).unwrap();\n}" },
        { type: "heading", text: "The Instance -> Surface -> Adapter -> Device -> Queue dance" },
        { type: "p", text: "GPU init is a fixed sequence: build an **Instance**, create a **Surface** (the drawable window), ask for an **Adapter** (a physical GPU + backend), request a **Device + Queue** from it, then **configure** the surface. This is boilerplate you copy once and rarely touch." },
        { type: "code", lang: "rust", code: "struct State {\n    window: Arc<Window>,\n    surface: wgpu::Surface<'static>,\n    device: wgpu::Device,\n    queue: wgpu::Queue,\n    config: wgpu::SurfaceConfiguration,\n    size: winit::dpi::PhysicalSize<u32>,\n}\n\nimpl State {\n    async fn new(window: Arc<Window>) -> State {\n        let size = window.inner_size();\n\n        // 1) Instance: the wgpu entry point; picks backends\n        let instance = wgpu::Instance::new(&wgpu::InstanceDescriptor {\n            backends: wgpu::Backends::all(),\n            ..Default::default()\n        });\n\n        // 2) Surface: what we present to (the window). Needs 'static -> Arc<Window>.\n        let surface = instance.create_surface(window.clone()).unwrap();\n\n        // 3) Adapter: a handle to a real GPU compatible with our surface\n        let adapter = instance.request_adapter(&wgpu::RequestAdapterOptions {\n            power_preference: wgpu::PowerPreference::HighPerformance,\n            compatible_surface: Some(&surface),\n            force_fallback_adapter: false,\n        }).await.unwrap();\n\n        // 4) Device (logical GPU) + Queue (submit commands here)\n        let (device, queue) = adapter.request_device(&wgpu::DeviceDescriptor {\n            label: Some(\"device\"),\n            required_features: wgpu::Features::empty(),\n            required_limits: wgpu::Limits::default(),   // downlevel_webgl2_defaults() for WebGL\n            memory_hints: wgpu::MemoryHints::default(),\n            trace: wgpu::Trace::Off,\n        }).await.unwrap();\n\n        // 5) Configure the surface: pick an sRGB format, set size + present mode\n        let caps = surface.get_capabilities(&adapter);\n        let format = caps.formats.iter().copied()\n            .find(|f| f.is_srgb())\n            .unwrap_or(caps.formats[0]);\n        let config = wgpu::SurfaceConfiguration {\n            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,\n            format,\n            width: size.width.max(1),\n            height: size.height.max(1),\n            present_mode: caps.present_modes[0],   // Fifo = vsync, always supported\n            alpha_mode: caps.alpha_modes[0],\n            view_formats: vec![],\n            desired_maximum_frame_latency: 2,\n        };\n        surface.configure(&device, &config);\n\n        State { window, surface, device, queue, config, size }\n    }\n\n    fn resize(&mut self, new_size: winit::dpi::PhysicalSize<u32>) {\n        if new_size.width > 0 && new_size.height > 0 {\n            self.size = new_size;\n            self.config.width = new_size.width;\n            self.config.height = new_size.height;\n            self.surface.configure(&self.device, &self.config); // MUST reconfigure on resize\n        }\n    }\n\n    fn reconfigure(&mut self) { self.surface.configure(&self.device, &self.config); }\n    fn update(&mut self) {}\n}" },
        { type: "callout", variant: "gotcha", text: "The surface holds a reference to the window, so it needs a **`'static`** lifetime — the standard fix is `Arc<Window>` (as above). If you resize the window and forget to call `surface.configure(...)`, the swapchain size drifts from the window and you get stretched output or `Outdated` errors every frame." }
      ]
    },
    {
      id: "object-model",
      title: "The wgpu object model",
      level: "core",
      body: [
        { type: "p", text: "Everything in wgpu is one of a small set of objects. Learn what each is and the mental picture clicks." },
        { type: "table", headers: ["Object", "What it is", "Analogy"], rows: [
          ["`Instance`", "the library entry point; enumerates adapters", "the wgpu runtime"],
          ["`Adapter`", "a physical GPU + backend combination", "\"which graphics card\""],
          ["`Device`", "logical connection to the GPU; creates all resources", "an open connection / factory"],
          ["`Queue`", "where you submit command buffers and write buffers/textures", "the outbox to the GPU"],
          ["`Surface`", "the window's swapchain you present frames to", "the screen you draw on"],
          ["`Buffer` / `Texture`", "GPU memory (vertices, uniforms / images, depth)", "GPU-side data"],
          ["`CommandEncoder`", "records render/compute passes into a command buffer", "a recording tape"],
          ["`RenderPipeline`", "immutable bundle: shaders + vertex layout + state", "a compiled draw configuration"],
          ["`BindGroup`", "a bound set of resources (uniforms/textures) for shaders", "arguments passed to shaders"]
        ] },
        { type: "p", text: "The core loop of every frame: **record** commands into a `CommandEncoder`, **finish** it into a command buffer, **submit** that to the `Queue`. The GPU executes asynchronously; you never block waiting for it (except when you explicitly map a buffer to read results back)." },
        { type: "code", lang: "rust", code: "// the shape of every frame\nlet mut encoder = device.create_command_encoder(&Default::default());\n{\n    let mut pass = encoder.begin_render_pass(&/* descriptor */);\n    pass.set_pipeline(&pipeline);\n    pass.draw(0..3, 0..1);\n    // `pass` is dropped here (end of block) -> recording of this pass ends\n}\nqueue.submit([encoder.finish()]);   // hand the recorded work to the GPU" },
        { type: "callout", variant: "note", text: "`Device` and `Queue` are cheap to clone (`Arc` internally) and safe to share across threads — a big reason wgpu scales. You typically create resources once (in `State::new`) and reuse them every frame; creating a pipeline per frame is a classic performance bug." }
      ]
    },
    {
      id: "clear",
      title: "Clearing the screen: the frame lifecycle",
      level: "core",
      body: [
        { type: "p", text: "The smallest useful frame just clears the screen to a color. It shows the whole lifecycle: acquire the current surface texture, make a view, begin a **render pass** with a color attachment that *clears* on load, then submit and present." },
        { type: "code", lang: "rust", code: "fn render(&mut self) -> Result<(), wgpu::SurfaceError> {\n    // acquire the next texture from the swapchain (may fail -> handle in the caller)\n    let frame = self.surface.get_current_texture()?;\n    let view = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());\n\n    let mut encoder = self.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {\n        label: Some(\"encoder\"),\n    });\n\n    {\n        let _pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {\n            label: Some(\"clear pass\"),\n            color_attachments: &[Some(wgpu::RenderPassColorAttachment {\n                view: &view,\n                resolve_target: None,\n                depth_slice: None,   // for 3D textures; None for a normal 2D surface\n                ops: wgpu::Operations {\n                    // LoadOp::Clear wipes to this color at the start of the pass\n                    load: wgpu::LoadOp::Clear(wgpu::Color { r: 0.05, g: 0.06, b: 0.10, a: 1.0 }),\n                    store: wgpu::StoreOp::Store, // keep the result\n                },\n            })],\n            depth_stencil_attachment: None,\n            timestamp_writes: None,\n            occlusion_query_set: None,\n        });\n        // (draw calls would go here)\n    } // <- _pass dropped: encoder is usable again\n\n    self.queue.submit(std::iter::once(encoder.finish()));\n    self.window.pre_present_notify();\n    frame.present();  // hand the finished frame to the compositor\n    Ok(())\n}" },
        { type: "callout", variant: "gotcha", text: "**Borrow-checker friction:** `begin_render_pass` borrows the `encoder` mutably, and you can't call `encoder.finish()` while the pass is alive. Wrap the pass in a `{ }` block (as above) so it's dropped before `finish()`. Forgetting this is the #1 beginner compile error." },
        { type: "callout", variant: "note", text: "`depth_slice: None` on the color attachment is a recent-ish field (added around wgpu 24). If your version doesn't have it, remove that line — the compiler will flag it either way. The rest of this shape is stable." }
      ]
    },
    {
      id: "pipeline",
      title: "The render pipeline",
      level: "core",
      body: [
        { type: "p", text: "A **`RenderPipeline`** is the immutable heart of drawing. It bundles the compiled shaders, the vertex buffer layout, the primitive/topology, blend and depth state, and the output target formats — all fixed at creation. In OpenGL these were mutable globals you toggled between draws; in wgpu you build one pipeline per distinct rendering configuration and just `set_pipeline` to switch." },
        { type: "code", lang: "rust", code: "// 1) compile the WGSL shader module (both entry points live in one file here)\nlet shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {\n    label: Some(\"shader\"),\n    source: wgpu::ShaderSource::Wgsl(include_str!(\"shader.wgsl\").into()),\n});\n\n// 2) a pipeline layout declares which bind-group layouts the shaders use (none yet)\nlet layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {\n    label: Some(\"layout\"),\n    bind_group_layouts: &[],\n    push_constant_ranges: &[],\n});\n\n// 3) the pipeline itself\nlet pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {\n    label: Some(\"pipeline\"),\n    layout: Some(&layout),\n    vertex: wgpu::VertexState {\n        module: &shader,\n        entry_point: Some(\"vs_main\"),        // Option<&str> in current wgpu\n        buffers: &[Vertex::layout()],        // vertex buffer layouts (next section)\n        compilation_options: Default::default(),\n    },\n    fragment: Some(wgpu::FragmentState {\n        module: &shader,\n        entry_point: Some(\"fs_main\"),\n        targets: &[Some(wgpu::ColorTargetState {\n            format: config.format,           // MUST match the surface format\n            blend: Some(wgpu::BlendState::REPLACE),\n            write_mask: wgpu::ColorWrites::ALL,\n        })],\n        compilation_options: Default::default(),\n    }),\n    primitive: wgpu::PrimitiveState {\n        topology: wgpu::PrimitiveTopology::TriangleList,\n        strip_index_format: None,\n        front_face: wgpu::FrontFace::Ccw,    // counter-clockwise = front\n        cull_mode: Some(wgpu::Face::Back),   // don't draw back faces\n        polygon_mode: wgpu::PolygonMode::Fill,\n        unclipped_depth: false,\n        conservative: false,\n    },\n    depth_stencil: None,   // add a DepthStencilState later (depth section)\n    multisample: wgpu::MultisampleState::default(),\n    multiview: None,\n    cache: None,\n});" },
        { type: "callout", variant: "tip", text: "Because pipelines are immutable and validated at creation, most of your \"why is nothing drawing\" bugs surface *here* with a clear message: a target format mismatch, a vertex attribute that doesn't line up with the shader's `@location`, or a bind-group-layout that the pipeline layout didn't declare. Read the panic — it names the field." }
      ]
    },
    {
      id: "triangle",
      title: "First triangle: vertex buffers & bytemuck",
      level: "core",
      body: [
        { type: "p", text: "Vertices are just data in a GPU **buffer**. You define a `#[repr(C)]` struct, derive **bytemuck**'s `Pod`/`Zeroable` so it can be safely reinterpreted as bytes, describe its memory layout with a **`VertexBufferLayout`**, and upload it. Then `draw(0..vertex_count, 0..1)`." },
        { type: "code", lang: "rust", code: "use wgpu::util::DeviceExt; // brings create_buffer_init into scope\n\n#[repr(C)]\n#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]\nstruct Vertex {\n    position: [f32; 3],\n    color: [f32; 3],\n}\n\nconst VERTICES: &[Vertex] = &[\n    Vertex { position: [ 0.0,  0.5, 0.0], color: [1.0, 0.0, 0.0] },\n    Vertex { position: [-0.5, -0.5, 0.0], color: [0.0, 1.0, 0.0] },\n    Vertex { position: [ 0.5, -0.5, 0.0], color: [0.0, 0.0, 1.0] },\n];\n\nimpl Vertex {\n    fn layout() -> wgpu::VertexBufferLayout<'static> {\n        wgpu::VertexBufferLayout {\n            array_stride: std::mem::size_of::<Vertex>() as wgpu::BufferAddress, // 24 bytes\n            step_mode: wgpu::VertexStepMode::Vertex,   // advance once per vertex\n            // each attribute maps a struct field to a shader @location\n            attributes: &wgpu::vertex_attr_array![0 => Float32x3, 1 => Float32x3],\n        }\n    }\n}\n\n// upload once, at setup:\nlet vertex_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {\n    label: Some(\"vertices\"),\n    contents: bytemuck::cast_slice(VERTICES), // struct slice -> &[u8]\n    usage: wgpu::BufferUsages::VERTEX,\n});" },
        { type: "p", text: "Then in the render pass, bind the pipeline and vertex buffer and issue the draw:" },
        { type: "code", lang: "rust", code: "pass.set_pipeline(&self.pipeline);\npass.set_vertex_buffer(0, self.vertex_buffer.slice(..)); // slot 0\npass.draw(0..VERTICES.len() as u32, 0..1); // 3 vertices, 1 instance" },
        { type: "callout", variant: "gotcha", text: "The `vertex_attr_array!` offsets and formats must exactly match both the struct **and** the WGSL `@location` types. A `[f32;3]` field is `Float32x3` (12 bytes); using `Float32x2` silently misreads memory and your triangle warps or vanishes. `bytemuck::cast_slice` also requires the struct be `#[repr(C)]` with no padding surprises — Rust's default layout can reorder fields, so `#[repr(C)]` is mandatory." }
      ]
    },
    {
      id: "wgsl",
      title: "WGSL: the shader language",
      level: "core",
      body: [
        { type: "p", text: "**WGSL** is WebGPU's shading language — Rust-flavored syntax, statically typed, compiled by wgpu's **naga**. A shader has a **vertex** entry point (runs per vertex, outputs a clip-space position) and a **fragment** entry point (runs per pixel, outputs a color). Data flows between them through a struct whose fields are tagged with **`@location`** (interpolated varyings) and **`@builtin`** (special values like `position`)." },
        { type: "code", lang: "wgsl", code: "// shader.wgsl\nstruct VertexInput {\n    @location(0) position: vec3<f32>,   // matches VertexBufferLayout attribute 0\n    @location(1) color: vec3<f32>,      // attribute 1\n};\n\nstruct VertexOutput {\n    @builtin(position) clip_position: vec4<f32>, // REQUIRED vertex output\n    @location(0) color: vec3<f32>,               // interpolated to the fragment stage\n};\n\n@vertex\nfn vs_main(in: VertexInput) -> VertexOutput {\n    var out: VertexOutput;\n    out.clip_position = vec4<f32>(in.position, 1.0); // no transform yet\n    out.color = in.color;\n    return out;\n}\n\n@fragment\nfn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {\n    return vec4<f32>(in.color, 1.0); // @location(0) = first color target\n}" },
        { type: "table", headers: ["WGSL", "GLSL equivalent", "Note"], rows: [
          ["`vec3<f32>`, `mat4x4<f32>`", "`vec3`, `mat4`", "explicit element type + dims"],
          ["`@location(n)`", "`layout(location=n)`", "vertex attrs & varyings"],
          ["`@builtin(position)`", "`gl_Position`", "clip-space output, required"],
          ["`@group(g) @binding(b)`", "`layout(set=g, binding=b)`", "bind-group resources"],
          ["`var<uniform>` / `var<storage>`", "`uniform` / `buffer`", "address spaces"],
          ["`textureSample(t, s, uv)`", "`texture(sampler2D, uv)`", "texture + sampler are separate objects"]
        ] },
        { type: "callout", variant: "tip", text: "The clip-space `@builtin(position)` your vertex shader returns is a **`vec4`** (homogeneous). The GPU divides x/y/z by w to get **normalized device coordinates**. You rarely write raw clip positions — you multiply a model position by an **MVP matrix** (upcoming math sections) and let that produce the right w." }
      ]
    },
    {
      id: "buffers-bindgroups",
      title: "Buffers, index buffers & bind groups — a cube",
      level: "core",
      body: [
        { type: "p", text: "Three buffer roles: **vertex** buffers (per-vertex attributes), **index** buffers (reuse vertices — a cube has 8 corners but 36 index entries), and **uniform** buffers (small shared data like matrices, exposed to shaders through a **bind group**). Indexing avoids duplicating shared vertices; `draw_indexed` walks the index buffer." },
        { type: "code", lang: "rust", code: "// a cube: 8 unique corners, 12 triangles = 36 indices\nconst INDICES: &[u16] = &[\n    0,1,2, 0,2,3,  4,5,6, 4,6,7,  /* ...6 faces... */\n];\n\nlet index_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {\n    label: Some(\"indices\"),\n    contents: bytemuck::cast_slice(INDICES),\n    usage: wgpu::BufferUsages::INDEX,\n});\n\n// draw:\npass.set_vertex_buffer(0, vertex_buffer.slice(..));\npass.set_index_buffer(index_buffer.slice(..), wgpu::IndexFormat::Uint16);\npass.draw_indexed(0..INDICES.len() as u32, 0, 0..1);" },
        { type: "heading", text: "Bind groups: passing data to shaders" },
        { type: "p", text: "A **`BindGroupLayout`** describes the *shape* of resources a shader expects (a uniform buffer at binding 0, a texture at 1, a sampler at 2…). A **`BindGroup`** is a concrete set of resources matching that layout. In WGSL you reference them by **`@group(g) @binding(b)`**. The `@group` index matches the slot you bind with `set_bind_group(g, ...)`." },
        { type: "code", lang: "rust", code: "// layout: one uniform buffer, visible to the vertex stage\nlet bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {\n    label: Some(\"camera bgl\"),\n    entries: &[wgpu::BindGroupLayoutEntry {\n        binding: 0,\n        visibility: wgpu::ShaderStages::VERTEX,\n        ty: wgpu::BindingType::Buffer {\n            ty: wgpu::BufferBindingType::Uniform,\n            has_dynamic_offset: false,\n            min_binding_size: None,\n        },\n        count: None,\n    }],\n});\n\n// concrete bind group pointing at an actual buffer\nlet bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {\n    label: Some(\"camera bg\"),\n    layout: &bgl,\n    entries: &[wgpu::BindGroupEntry {\n        binding: 0,\n        resource: camera_buffer.as_entire_binding(),\n    }],\n});\n\n// in the render pass, bound to @group(0):\npass.set_bind_group(0, &bind_group, &[]);" },
        { type: "callout", variant: "gotcha", text: "The **`BindGroupLayout` you build the pipeline with and the one you build the `BindGroup` with must be the same layout** (pass the same `&bgl` to both the `PipelineLayoutDescriptor` and the `BindGroupDescriptor`). A mismatch — wrong binding number, wrong visibility, wrong type — is a validation error at draw time. wgpu's message names the offending binding." }
      ]
    },
    {
      id: "math-vectors",
      title: "MATH I — vectors (glam Vec2/3/4)",
      level: "core",
      body: [
        { type: "p", text: "3D graphics *is* linear algebra. A **vector** is a direction + magnitude (or a point's coordinates). **glam** gives you `Vec2`/`Vec3`/`Vec4` with SIMD-fast ops. The two operations that unlock everything are the **dot product** and the **cross product** — learn their geometric meaning, not just the formula." },
        { type: "code", lang: "rust", code: "use glam::{Vec2, Vec3, Vec4};\n\nlet a = Vec3::new(1.0, 2.0, 2.0);\nlet b = Vec3::new(3.0, 0.0, 0.0);\n\nlet sum    = a + b;            // component-wise: (4, 2, 2)\nlet scaled = a * 2.0;         // scale magnitude: (2, 4, 4)\nlet len    = a.length();      // magnitude = sqrt(1+4+4) = 3\nlet dir    = a.normalize();   // unit vector (length 1) — pure direction" },
        { type: "heading", text: "Dot product — angle, projection, lighting" },
        { type: "p", text: "`a · b = |a||b|cos θ`. It measures how much two vectors point the same way. Between **unit** vectors it *is* `cos θ`: `1` = same direction, `0` = perpendicular, `-1` = opposite. This is the single most-used operation in lighting: the brightness of a surface is `dot(normal, light_direction)` clamped to `≥ 0`." },
        { type: "code", lang: "rust", code: "let d = a.dot(b);                         // scalar\nlet cos_theta = a.normalize().dot(b.normalize());\nlet angle = cos_theta.acos();            // radians between them\n\n// diffuse lighting: how directly the surface faces the light\nlet brightness = normal.dot(light_dir).max(0.0);\n\n// project a onto b (the component of a along b)\nlet proj = b * (a.dot(b) / b.length_squared());" },
        { type: "heading", text: "Cross product — normals & the right-hand rule" },
        { type: "p", text: "`a × b` returns a vector **perpendicular to both**, with length `|a||b|sin θ`. Its direction follows the **right-hand rule** (point fingers along `a`, curl to `b`, thumb points along `a × b`). You use it to compute a triangle's **surface normal** from two of its edges, and to build a camera's basis." },
        { type: "code", lang: "rust", code: "// surface normal of a triangle (p0, p1, p2)\nlet edge1 = p1 - p0;\nlet edge2 = p2 - p0;\nlet normal = edge1.cross(edge2).normalize(); // winding order decides which way it faces\n\n// camera right vector from forward + world-up\nlet right = forward.cross(Vec3::Y).normalize();" },
        { type: "callout", variant: "note", text: "Cross product is **not commutative**: `a × b == -(b × a)`. Flipping the operands flips the normal, which flips which side of a face is lit or culled. If your model is lit inside-out or disappears, the winding order / cross-product order is usually why." }
      ]
    },
    {
      id: "math-matrices",
      title: "MATH II — matrices & transforms (glam Mat4)",
      level: "core",
      body: [
        { type: "p", text: "A **4×4 matrix** encodes a transform — translate, rotate, scale, or any combination — that you apply to a vector by multiplying. 3D uses **homogeneous coordinates**: a point is `(x, y, z, 1)` and a direction is `(x, y, z, 0)`. The extra `w` component is what lets a single matrix multiply express *translation* (which pure 3×3 matrices can't) and later *perspective*." },
        { type: "code", lang: "rust", code: "use glam::{Mat4, Vec3, Quat};\n\nlet t = Mat4::from_translation(Vec3::new(0.0, 1.0, 0.0));\nlet r = Mat4::from_rotation_y(std::f32::consts::FRAC_PI_2); // 90 deg about Y\nlet s = Mat4::from_scale(Vec3::splat(2.0));\n\n// COMPOSITION: matrices apply RIGHT-to-LEFT to a column vector.\n// This scales first, then rotates, then translates. Order matters!\nlet model = t * r * s;\n\n// one-shot TRS (the usual way to build a model matrix)\nlet model2 = Mat4::from_scale_rotation_translation(\n    Vec3::splat(2.0),\n    Quat::from_rotation_y(std::f32::consts::FRAC_PI_2),\n    Vec3::new(0.0, 1.0, 0.0),\n);\n\n// apply to a POINT (w=1, translated) vs a DIRECTION (w=0, not translated)\nlet moved_point = model.transform_point3(Vec3::ZERO);\nlet rotated_dir = model.transform_vector3(Vec3::X); // ignores translation" },
        { type: "table", headers: ["Order `T * R * S`", "Effect", "Reversed `S * R * T`"], rows: [
          ["scale then rotate then translate", "the natural, expected object transform", "translate first, then rotate the translated position around origin — usually wrong"]
        ] },
        { type: "callout", variant: "gotcha", text: "**Order is not commutative and is right-to-left.** `translate * rotate` rotates the object *in place* then moves it; `rotate * translate` moves it out then swings it around the origin (an orbit). Getting these backwards is the classic \"my object flies off in a circle\" bug. glam is **column-major** (matches WGSL's `mat4x4`), so `to_cols_array_2d()` gives you exactly the layout the shader expects." },
        { type: "callout", variant: "note", text: "glam matrices are column-major and stored as columns, which is why you multiply `M * v` (matrix on the left, column vector on the right). Uploading `Mat4::to_cols_array_2d()` (a `[[f32;4];4]`) into a `mat4x4<f32>` uniform is a direct, no-transpose copy." }
      ]
    },
    {
      id: "math-mvp",
      title: "MATH III — coordinate spaces, MVP & the wgpu z-range",
      level: "core",
      body: [
        { type: "p", text: "Getting a 3D point onto the 2D screen is a chain of coordinate-space transforms, the **Model-View-Projection (MVP)** pipeline:" },
        { type: "list", ordered: true, items: [
          "**Model matrix** — object/local space -> **world** space (where the object sits in the scene).",
          "**View matrix** — world -> **camera/eye** space (as seen from the camera; it's the inverse of the camera's transform, built with `look_at`).",
          "**Projection matrix** — eye -> **clip** space (applies perspective; distant things shrink). After the GPU's perspective divide by w you get **NDC**.",
          "The GPU maps NDC to the viewport pixels."
        ] },
        { type: "code", lang: "rust", code: "use glam::{Mat4, Vec3};\n\nlet model = Mat4::from_rotation_y(angle);\n\n// VIEW: where the camera is, what it looks at, which way is up\nlet view = Mat4::look_at_rh(\n    Vec3::new(0.0, 1.0, 5.0), // eye position\n    Vec3::ZERO,               // target\n    Vec3::Y,                  // up\n);\n\n// PROJECTION: perspective frustum (FOV, aspect, near, far)\nlet aspect = config.width as f32 / config.height as f32;\nlet proj = Mat4::perspective_rh(\n    60f32.to_radians(),  // vertical field of view\n    aspect,              // width/height — recompute on resize!\n    0.1,                 // near plane (>0)\n    100.0,               // far plane\n);\n\n// MVP: applied right-to-left to a point -> proj * view * model\nlet mvp = proj * view * model;" },
        { type: "table", headers: ["Projection", "Looks like", "Use for"], rows: [
          ["**Perspective** (`perspective_rh`)", "vanishing point; farther = smaller (a frustum)", "3D games, realistic scenes"],
          ["**Orthographic** (`orthographic_rh`)", "no foreshortening; parallel lines stay parallel", "2D, isometric, CAD, UI, shadow maps"]
        ] },
        { type: "heading", text: "The crucial wgpu gotcha: clip-space z is [0, 1]" },
        { type: "p", text: "OpenGL's NDC z runs **[-1, 1]**. WebGPU/wgpu (like DirectX/Metal/Vulkan) uses z in **[0, 1]**. If your projection matrix targets the wrong range, depth testing breaks — objects clip or z-fight. **glam's `Mat4::perspective_rh` already produces the [0, 1] range**, so with glam you are correct out of the box. You only need a correction matrix if you port an OpenGL-style projection (e.g. cgmath, or glam's `perspective_rh_gl`)." },
        { type: "code", lang: "rust", code: "// glam's perspective_rh -> z in [0,1] -> correct for wgpu. Nothing to fix.\nlet proj = Mat4::perspective_rh(fovy, aspect, near, far);\n\n// BUT if you use an OpenGL-style projection (z in [-1,1]), correct it:\n#[rustfmt::skip]\nconst OPENGL_TO_WGPU_MATRIX: Mat4 = Mat4::from_cols_array(&[\n    1.0, 0.0, 0.0, 0.0,\n    0.0, 1.0, 0.0, 0.0,\n    0.0, 0.0, 0.5, 0.0,\n    0.0, 0.0, 0.5, 1.0,   // remaps z from [-1,1] into [0,1]\n]);\nlet proj_gl = OPENGL_TO_WGPU_MATRIX * Mat4::perspective_rh_gl(fovy, aspect, near, far);" },
        { type: "callout", variant: "warn", text: "This bites everyone porting tutorials: a lot of learning material uses **cgmath**, whose `perspective` is OpenGL-style, so those tutorials multiply by `OPENGL_TO_WGPU_MATRIX`. If you follow along with **glam** and *also* apply that matrix, you double-correct and everything is subtly wrong. Rule: glam `perspective_rh` = done; GL-style projection = apply the correction once." }
      ]
    },
    {
      id: "uniforms",
      title: "Uniforms in practice — camera buffer & alignment",
      level: "core",
      body: [
        { type: "p", text: "To use the MVP on the GPU you upload it as a **uniform buffer** and update it each frame with `queue.write_buffer`. Define a `#[repr(C)]` POD struct, derive bytemuck, and mirror it exactly in WGSL." },
        { type: "code", lang: "rust", code: "#[repr(C)]\n#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]\nstruct CameraUniform {\n    view_proj: [[f32; 4]; 4], // a Mat4 = 16 f32 = 64 bytes, naturally 16-byte aligned\n}\n\nimpl CameraUniform {\n    fn update(&mut self, vp: glam::Mat4) {\n        self.view_proj = vp.to_cols_array_2d(); // column-major, matches WGSL\n    }\n}\n\n// create the buffer with COPY_DST so we can write to it every frame\nlet camera_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {\n    label: Some(\"camera\"),\n    contents: bytemuck::cast_slice(&[camera_uniform]),\n    usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,\n});\n\n// per frame: recompute and upload (no re-allocation)\nfn update(&mut self) {\n    self.camera_uniform.update(self.proj * self.view);\n    self.queue.write_buffer(&self.camera_buffer, 0, bytemuck::cast_slice(&[self.camera_uniform]));\n}" },
        { type: "code", lang: "wgsl", code: "struct Camera { view_proj: mat4x4<f32> };\n@group(0) @binding(0) var<uniform> camera: Camera;\n\n@vertex\nfn vs_main(in: VertexInput) -> VertexOutput {\n    var out: VertexOutput;\n    out.clip_position = camera.view_proj * vec4<f32>(in.position, 1.0);\n    out.color = in.color;\n    return out;\n}" },
        { type: "heading", text: "The alignment footgun (std140-like 16-byte rules)" },
        { type: "p", text: "WGSL uniform layout has strict alignment: a **`vec3<f32>` is aligned to 16 bytes**, so the field after a `vec3` starts at the next 16-byte boundary, not tightly after 12 bytes. Your Rust `#[repr(C)]` struct uses *natural* alignment and won't match unless you add explicit padding. Mismatch = the shader reads garbage from the wrong offsets." },
        { type: "code", lang: "rust", code: "// BROKEN: 24 bytes in Rust, but WGSL pads `position` to 16 -> `color` misaligns\n#[repr(C)]\n#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]\nstruct LightBad { position: [f32; 3], color: [f32; 3] }\n\n// CORRECT: pad each vec3 to a 16-byte slot\n#[repr(C)]\n#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]\nstruct Light {\n    position: [f32; 3],\n    _pad0: f32,       // -> position occupies bytes 0..16\n    color: [f32; 3],\n    _pad1: f32,       // -> color occupies bytes 16..32\n}" },
        { type: "callout", variant: "warn", text: "The layout rules that trip people: `vec3` aligns to **16** (like a `vec4`); a whole struct's size is rounded up to a multiple of its largest alignment; and an array element is padded to 16 bytes in uniform buffers. When in doubt, use `vec4`s or explicit `_pad` fields and keep struct size a multiple of 16. bytemuck will *not* catch this — it only checks the Rust side is POD, not that it matches WGSL." }
      ]
    },
    {
      id: "camera",
      title: "A controllable camera (WASD + mouse-look)",
      level: "core",
      body: [
        { type: "p", text: "A first-person camera stores a **position** plus **yaw**/**pitch** angles, derives a forward vector, and builds the view matrix with `look_at_rh(position, position + forward, up)`. WASD moves along forward/right; mouse motion adjusts yaw/pitch. Scale all movement by **delta-time** (`dt`) so speed is frame-rate independent." },
        { type: "code", lang: "rust", code: "use glam::{Mat4, Vec3};\n\nstruct Camera {\n    position: Vec3,\n    yaw: f32,   // radians, around world Y\n    pitch: f32, // radians, up/down\n    aspect: f32,\n    fovy: f32,\n    znear: f32,\n    zfar: f32,\n}\n\nimpl Camera {\n    fn forward(&self) -> Vec3 {\n        Vec3::new(\n            self.yaw.cos() * self.pitch.cos(),\n            self.pitch.sin(),\n            self.yaw.sin() * self.pitch.cos(),\n        ).normalize()\n    }\n\n    fn view_proj(&self) -> Mat4 {\n        let target = self.position + self.forward();\n        let view = Mat4::look_at_rh(self.position, target, Vec3::Y);\n        let proj = Mat4::perspective_rh(self.fovy, self.aspect, self.znear, self.zfar);\n        proj * view\n    }\n}\n\n// called each frame with dt (seconds) and current input\nfn update_camera(cam: &mut Camera, input: &Input, dt: f32) {\n    let speed = 5.0 * dt;                 // units/second, frame-rate independent\n    let forward = cam.forward();\n    let right = forward.cross(Vec3::Y).normalize();\n    if input.w { cam.position += forward * speed; }\n    if input.s { cam.position -= forward * speed; }\n    if input.d { cam.position += right * speed; }\n    if input.a { cam.position -= right * speed; }\n\n    // mouse-look: accumulate raw mouse deltas, clamp pitch to avoid flipping over the top\n    cam.yaw   += input.mouse_dx * 0.002;\n    cam.pitch  = (cam.pitch - input.mouse_dy * 0.002).clamp(-1.54, 1.54); // ~+-88 deg\n}" },
        { type: "callout", variant: "tip", text: "Compute `dt` from `Instant::now()` deltas (native) or `performance.now()` (web). Read mouse motion from winit's **`DeviceEvent::MouseMotion`** (raw deltas, unaffected by the cursor hitting a screen edge) rather than cursor position, and grab/hide the cursor with `window.set_cursor_grab(...)` for a real FPS feel. Clamping pitch just short of ±90° avoids gimbal-flip at the poles." }
      ]
    },
    {
      id: "depth",
      title: "Depth testing",
      level: "core",
      body: [
        { type: "p", text: "Without depth testing, triangles paint in draw order and far objects overwrite near ones. A **depth buffer** stores the closest z per pixel; the GPU keeps a fragment only if it's nearer. You add a depth **texture**, attach it to the render pass, and enable `DepthStencilState` in the pipeline." },
        { type: "code", lang: "rust", code: "fn create_depth(device: &wgpu::Device, config: &wgpu::SurfaceConfiguration) -> wgpu::TextureView {\n    let tex = device.create_texture(&wgpu::TextureDescriptor {\n        label: Some(\"depth\"),\n        size: wgpu::Extent3d {\n            width: config.width, height: config.height, depth_or_array_layers: 1,\n        },\n        mip_level_count: 1,\n        sample_count: 1,\n        dimension: wgpu::TextureDimension::D2,\n        format: wgpu::TextureFormat::Depth32Float,\n        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,\n        view_formats: &[],\n    });\n    tex.create_view(&wgpu::TextureViewDescriptor::default())\n}\n\n// in the pipeline:\ndepth_stencil: Some(wgpu::DepthStencilState {\n    format: wgpu::TextureFormat::Depth32Float,\n    depth_write_enabled: true,\n    depth_compare: wgpu::CompareFunction::Less, // smaller z (nearer) passes\n    stencil: wgpu::StencilState::default(),\n    bias: wgpu::DepthBiasState::default(),\n}),\n\n// in the render pass:\ndepth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {\n    view: &self.depth_view,\n    depth_ops: Some(wgpu::Operations {\n        load: wgpu::LoadOp::Clear(1.0),  // clear to the far value each frame\n        store: wgpu::StoreOp::Store,\n    }),\n    stencil_ops: None,\n})," },
        { type: "callout", variant: "gotcha", text: "**Resize the depth texture with the surface.** A depth texture is fixed-size; if the window grows and you keep the old (smaller) depth view, `begin_render_pass` errors that the attachment sizes don't match the color target. In `resize()`, after reconfiguring the surface, recreate the depth view: `self.depth_view = create_depth(&self.device, &self.config);`. Also remember `CompareFunction::Less` pairs with clearing depth to `1.0` (the far plane in wgpu's [0,1] range)." }
      ]
    },
    {
      id: "textures",
      title: "Textures & samplers",
      level: "core",
      body: [
        { type: "p", text: "A **texture** is image data on the GPU; a **sampler** describes how to read it (filtering, wrapping). Load an image with the **image** crate, create a `Texture`, upload the pixels with `queue.write_texture`, make a `TextureView`, and bind the view + sampler in a bind group. WGSL reads it with `textureSample`." },
        { type: "code", lang: "rust", code: "let img = image::load_from_memory(include_bytes!(\"tree.png\")).unwrap().to_rgba8();\nlet (w, h) = img.dimensions();\nlet size = wgpu::Extent3d { width: w, height: h, depth_or_array_layers: 1 };\n\nlet texture = device.create_texture(&wgpu::TextureDescriptor {\n    label: Some(\"tree\"),\n    size,\n    mip_level_count: 1,\n    sample_count: 1,\n    dimension: wgpu::TextureDimension::D2,\n    format: wgpu::TextureFormat::Rgba8UnormSrgb, // sRGB: sampling returns linear color\n    usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,\n    view_formats: &[],\n});\n\nqueue.write_texture(\n    wgpu::TexelCopyTextureInfo {   // (was ImageCopyTexture in older wgpu)\n        texture: &texture, mip_level: 0,\n        origin: wgpu::Origin3d::ZERO, aspect: wgpu::TextureAspect::All,\n    },\n    &img,\n    wgpu::TexelCopyBufferLayout {   // (was ImageDataLayout)\n        offset: 0,\n        bytes_per_row: Some(4 * w), // 4 bytes/pixel (RGBA8); must be tightly correct\n        rows_per_image: Some(h),\n    },\n    size,\n);\n\nlet view = texture.create_view(&wgpu::TextureViewDescriptor::default());\nlet sampler = device.create_sampler(&wgpu::SamplerDescriptor {\n    address_mode_u: wgpu::AddressMode::ClampToEdge,\n    address_mode_v: wgpu::AddressMode::ClampToEdge,\n    mag_filter: wgpu::FilterMode::Linear,\n    min_filter: wgpu::FilterMode::Linear,\n    ..Default::default()\n});" },
        { type: "code", lang: "wgsl", code: "@group(0) @binding(0) var t_diffuse: texture_2d<f32>;\n@group(0) @binding(1) var s_diffuse: sampler;\n\n@fragment\nfn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {\n    return textureSample(t_diffuse, s_diffuse, in.uv);\n}" },
        { type: "callout", variant: "warn", text: "**sRGB is the classic \"colors look washed out / too dark\" bug.** Your surface format is usually `Bgra8UnormSrgb`, so the GPU applies gamma on output. Use an **sRGB** texture format (`Rgba8UnormSrgb`) for color/albedo images so sampling returns linear values that survive the round-trip; use a **non-sRGB** format (`Rgba8Unorm`) for data textures (normal maps, roughness) that must *not* be gamma-decoded. Mismatch here is a subtle, everywhere-wrong color shift." }
      ]
    },
    {
      id: "lighting",
      title: "Lighting — Phong / Blinn-Phong in WGSL",
      level: "core",
      body: [
        { type: "p", text: "The classic **Phong** model sums three terms: **ambient** (a flat fill so nothing is pure black), **diffuse** (`dot(normal, light_dir)` — surfaces facing the light are brighter), and **specular** (a shiny highlight). **Blinn-Phong** computes specular from a *half-vector* — cheaper and smoother. The whole model runs in the fragment shader using per-pixel interpolated normals." },
        { type: "p", text: "The subtlety is **normals must be in the same space as the light and view positions — world space.** And normals don't transform like positions: under non-uniform scale you must use the **normal matrix** (the inverse-transpose of the model's upper-left 3×3), or your lighting skews." },
        { type: "code", lang: "rust", code: "// build the normal matrix alongside the model matrix, upload both\nuse glam::{Mat3, Mat4};\nlet model = Mat4::from_scale_rotation_translation(scale, rot, pos);\nlet normal_mat3 = Mat3::from_mat4(model).inverse().transpose();\n// pad Mat3 -> Mat4 (or three vec4 columns) for WGSL 16-byte alignment\nlet normal_mat = Mat4::from_mat3(normal_mat3);" },
        { type: "code", lang: "wgsl", code: "struct Light { position: vec3<f32>, color: vec3<f32> };\n@group(1) @binding(0) var<uniform> light: Light;\n@group(2) @binding(0) var<uniform> camera_pos: vec4<f32>;\n\n@fragment\nfn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {\n    let object_color = vec3<f32>(0.8, 0.35, 0.25);\n\n    // ambient — constant fill\n    let ambient = 0.05 * light.color;\n\n    // diffuse — Lambert term\n    let n = normalize(in.world_normal);\n    let light_dir = normalize(light.position - in.world_position);\n    let diffuse = max(dot(n, light_dir), 0.0) * light.color;\n\n    // specular — Blinn-Phong half-vector\n    let view_dir = normalize(camera_pos.xyz - in.world_position);\n    let half_dir = normalize(view_dir + light_dir);\n    let spec = pow(max(dot(n, half_dir), 0.0), 32.0); // 32 = shininess\n    let specular = spec * light.color;\n\n    let result = (ambient + diffuse + specular) * object_color;\n    return vec4<f32>(result, 1.0);\n}" },
        { type: "code", lang: "wgsl", code: "// vertex stage: move position AND normal into world space\n@vertex\nfn vs_main(in: VertexInput) -> VertexOutput {\n    var out: VertexOutput;\n    let world_pos = model.matrix * vec4<f32>(in.position, 1.0);\n    out.world_position = world_pos.xyz;\n    // normal uses the normal matrix and w=0 (direction, no translation)\n    out.world_normal = normalize((model.normal_mat * vec4<f32>(in.normal, 0.0)).xyz);\n    out.clip_position = camera.view_proj * world_pos;\n    return out;\n}" },
        { type: "callout", variant: "gotcha", text: "Two lighting footguns: (1) transforming the normal with the plain model matrix breaks under non-uniform scale — use the **inverse-transpose**. (2) Always **`normalize` interpolated normals in the fragment shader**; interpolation across a triangle shortens them, dimming your diffuse term. If lighting looks flat or wrong at angles, check these two first." }
      ]
    },
    {
      id: "instancing",
      title: "Instancing — drawing many objects cheaply",
      level: "core",
      body: [
        { type: "p", text: "To draw 10,000 cubes you don't issue 10,000 draw calls. **Instancing** stores per-object data (typically a model matrix) in a second vertex buffer with `step_mode: Instance`, so it advances **once per instance** instead of per vertex. One `draw_indexed(..., 0..N)` renders all N." },
        { type: "code", lang: "rust", code: "#[repr(C)]\n#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]\nstruct InstanceRaw { model: [[f32; 4]; 4] }\n\nimpl InstanceRaw {\n    fn layout() -> wgpu::VertexBufferLayout<'static> {\n        wgpu::VertexBufferLayout {\n            array_stride: std::mem::size_of::<InstanceRaw>() as wgpu::BufferAddress,\n            step_mode: wgpu::VertexStepMode::Instance, // advance per-instance\n            // a mat4 spans 4 locations (a vertex attribute is at most a vec4)\n            attributes: &wgpu::vertex_attr_array![\n                5 => Float32x4, 6 => Float32x4, 7 => Float32x4, 8 => Float32x4\n            ],\n        }\n    }\n}\n\n// build instances (e.g. a grid), upload as a VERTEX buffer\nlet data: Vec<InstanceRaw> = positions.iter()\n    .map(|p| InstanceRaw { model: Mat4::from_translation(*p).to_cols_array_2d() })\n    .collect();\nlet instance_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {\n    label: Some(\"instances\"),\n    contents: bytemuck::cast_slice(&data),\n    usage: wgpu::BufferUsages::VERTEX,\n});\n\n// draw: bind mesh at slot 0, instances at slot 1, draw N instances\npass.set_vertex_buffer(0, mesh_vbo.slice(..));\npass.set_vertex_buffer(1, instance_buffer.slice(..));\npass.draw_indexed(0..num_indices, 0, 0..data.len() as u32);" },
        { type: "code", lang: "wgsl", code: "struct InstanceInput {\n    @location(5) m0: vec4<f32>, @location(6) m1: vec4<f32>,\n    @location(7) m2: vec4<f32>, @location(8) m3: vec4<f32>,\n};\n\n@vertex\nfn vs_main(v: VertexInput, inst: InstanceInput) -> VertexOutput {\n    let model = mat4x4<f32>(inst.m0, inst.m1, inst.m2, inst.m3); // reassemble\n    var out: VertexOutput;\n    out.clip_position = camera.view_proj * model * vec4<f32>(v.position, 1.0);\n    return out;\n}" },
        { type: "callout", variant: "tip", text: "The pipeline's `buffers: &[Vertex::layout(), InstanceRaw::layout()]` lists **both** layouts in slot order. A `mat4` can't be a single vertex attribute (max size `vec4`), so it occupies four consecutive `@location`s (5–8 here) that you stitch back together in WGSL. If instances animate, put the instance buffer in `COPY_DST` and `write_buffer` it per frame instead of rebuilding it." }
      ]
    },
    {
      id: "math-quaternions",
      title: "MATH IV — quaternions (glam Quat)",
      level: "deep",
      body: [
        { type: "p", text: "Rotations are the one transform where Euler angles (yaw/pitch/roll) fail you. Two problems: **gimbal lock** (at pitch ±90° two axes align and you lose a degree of freedom) and **bad interpolation** (blending Euler angles wobbles). A **quaternion** — a 4-component `(x, y, z, w)` — represents any 3D rotation with none of these issues, composes cleanly, and interpolates smoothly with **slerp**." },
        { type: "code", lang: "rust", code: "use glam::{Quat, Vec3, Mat4, EulerRot};\n\n// construction\nlet q  = Quat::from_axis_angle(Vec3::Y, 90f32.to_radians()); // axis + angle\nlet q2 = Quat::from_euler(EulerRot::YXZ, yaw, pitch, roll);   // from Euler (order matters)\nlet q3 = Quat::from_rotation_arc(Vec3::Z, direction);        // rotate one vector onto another\n\n// rotate a vector\nlet rotated = q * Vec3::X;\n\n// compose rotations: apply q2 first, then q (like matrix multiply, right-to-left)\nlet combined = q * q2;\n\n// SLERP: shortest-path, constant-speed interpolation — the reason quats win for animation\nlet mid = q.slerp(q2, t); // t in 0..1\n\n// feed into a transform (rotation + translation)\nlet model = Mat4::from_rotation_translation(q, Vec3::new(0.0, 1.0, 0.0));" },
        { type: "table", headers: ["Need", "Euler angles", "Quaternion"], rows: [
          ["compose rotations", "convert to matrices, multiply, hope", "`q1 * q2` directly"],
          ["interpolate (animation)", "wobbles, can flip", "`slerp` — smooth, shortest path"],
          ["gimbal lock at ±90° pitch", "yes — loses an axis", "no"],
          ["store orientation", "3 floats, ambiguous order", "4 floats, unambiguous"]
        ] },
        { type: "callout", variant: "tip", text: "Keep an object's **orientation as a `Quat`**, not Euler angles, and derive Euler only for UI display. For a camera it's fine to keep yaw/pitch scalars (as in the camera section) because you clamp pitch and never hit gimbal lock; for tumbling objects, animation, and physics, quaternions are the right storage. `Quat` from glam is always kept normalized by its constructors — renormalize after many manual multiplications to fight float drift." }
      ]
    },
    {
      id: "renderer-structure",
      title: "Structuring a renderer / scene",
      level: "core",
      body: [
        { type: "p", text: "As a project grows, the flat `State` struct gets unwieldy. The standard shape is a `State` (or `Renderer`) owning the device/queue/surface plus a small set of subsystems, with three methods driven by the event loop: **`resize`**, **`update`** (advance the simulation, upload uniforms), and **`render`** (record + submit). Group per-object data into a `Mesh` (buffers + index count), a `Material` (pipeline + bind group), and a `Camera`." },
        { type: "code", lang: "rust", code: "struct Mesh { vbo: wgpu::Buffer, ibo: wgpu::Buffer, num_indices: u32 }\nstruct Material { pipeline: wgpu::RenderPipeline, bind_group: wgpu::BindGroup }\nstruct Object { mesh_id: usize, material_id: usize, transform: glam::Mat4 }\n\nstruct State {\n    // gpu core\n    surface: wgpu::Surface<'static>, device: wgpu::Device, queue: wgpu::Queue,\n    config: wgpu::SurfaceConfiguration, depth_view: wgpu::TextureView,\n    // scene\n    meshes: Vec<Mesh>, materials: Vec<Material>, objects: Vec<Object>,\n    camera: Camera, camera_buffer: wgpu::Buffer, camera_bind_group: wgpu::BindGroup,\n    window: std::sync::Arc<winit::window::Window>,\n}\n\nimpl State {\n    fn resize(&mut self, size: winit::dpi::PhysicalSize<u32>) {\n        self.config.width = size.width.max(1);\n        self.config.height = size.height.max(1);\n        self.surface.configure(&self.device, &self.config);\n        self.depth_view = create_depth(&self.device, &self.config); // resize depth too\n        self.camera.aspect = self.config.width as f32 / self.config.height as f32;\n    }\n\n    fn update(&mut self, dt: f32) {\n        self.camera.update(dt);\n        let vp = self.camera.view_proj();\n        self.queue.write_buffer(&self.camera_buffer, 0,\n            bytemuck::cast_slice(&[vp.to_cols_array_2d()]));\n    }\n\n    fn render(&mut self) -> Result<(), wgpu::SurfaceError> {\n        let frame = self.surface.get_current_texture()?;\n        let view = frame.texture.create_view(&Default::default());\n        let mut enc = self.device.create_command_encoder(&Default::default());\n        {\n            let mut pass = enc.begin_render_pass(&/* color + depth attachments */);\n            pass.set_bind_group(0, &self.camera_bind_group, &[]);\n            for obj in &self.objects {\n                let m = &self.materials[obj.material_id];\n                let mesh = &self.meshes[obj.mesh_id];\n                pass.set_pipeline(&m.pipeline);\n                pass.set_bind_group(1, &m.bind_group, &[]);\n                pass.set_vertex_buffer(0, mesh.vbo.slice(..));\n                pass.set_index_buffer(mesh.ibo.slice(..), wgpu::IndexFormat::Uint16);\n                pass.draw_indexed(0..mesh.num_indices, 0, 0..1);\n            }\n        }\n        self.queue.submit([enc.finish()]);\n        frame.present();\n        Ok(())\n    }\n}" },
        { type: "callout", variant: "tip", text: "A **minimal scene graph** is just objects holding a parent index and a local transform; the world matrix of a node is `parent_world * local`. Sort draws by pipeline/material to minimize `set_pipeline` calls (state changes cost). Once you're maintaining meshes, materials, transforms and a render graph by hand, that's exactly the moment to ask whether **Bevy** (next) should own this for you." }
      ]
    },
    {
      id: "bevy",
      title: "Bevy — the batteries-included path",
      level: "deep",
      body: [
        { type: "p", text: "**Bevy** is the most popular Rust game engine, and it's built *on wgpu*. If you want a game or a rich 3D app rather than a hand-rolled renderer, Bevy gives you an asset system, scenes, a PBR renderer, UI, audio, input and hot-reloading — all organized around an **ECS** (Entity-Component-System). You compose behavior from **components** (plain data) queried by **systems** (functions), instead of an inheritance hierarchy." },
        { type: "code", lang: "rust", code: "use bevy::prelude::*;\n\nfn main() {\n    App::new()\n        .add_plugins(DefaultPlugins)      // window, render, input, assets, ...\n        .add_systems(Startup, setup)      // runs once\n        .add_systems(Update, rotate_cube) // runs every frame\n        .run();\n}\n\nfn setup(\n    mut commands: Commands,\n    mut meshes: ResMut<Assets<Mesh>>,\n    mut materials: ResMut<Assets<StandardMaterial>>,\n) {\n    // a cube = mesh + material + transform (required components, Bevy 0.15+ API)\n    commands.spawn((\n        Mesh3d(meshes.add(Cuboid::default())),\n        MeshMaterial3d(materials.add(Color::srgb(0.8, 0.35, 0.25))),\n        Transform::from_xyz(0.0, 0.5, 0.0),\n    ));\n    // a light\n    commands.spawn((\n        PointLight { shadows_enabled: true, ..default() },\n        Transform::from_xyz(4.0, 8.0, 4.0),\n    ));\n    // a camera looking at the origin\n    commands.spawn((\n        Camera3d::default(),\n        Transform::from_xyz(0.0, 3.0, 8.0).looking_at(Vec3::ZERO, Vec3::Y),\n    ));\n}\n\n// a system: query every Transform that has a Mesh3d, and spin it\nfn rotate_cube(mut q: Query<&mut Transform, With<Mesh3d>>, time: Res<Time>) {\n    for mut t in &mut q {\n        t.rotate_y(time.delta_secs()); // frame-rate independent via delta time\n    }\n}" },
        { type: "table", headers: ["Raw wgpu", "Bevy", "Choose Bevy when"], rows: [
          ["you own the render loop", "the engine owns it; you write systems", "you want a game/app, not a renderer"],
          ["manual meshes/pipelines/uniforms", "spawn entities with components", "you value velocity over total control"],
          ["bring your own asset loading", "built-in `AssetServer` + hot reload", "you load glTF/textures/audio"],
          ["everything is yours to build", "PBR, UI, input, scenes included", "you'd otherwise rebuild an engine"]
        ] },
        { type: "callout", variant: "note", text: "Bevy re-exports **glam** as its math library, so every `Vec3`/`Quat`/`Mat4` skill from the math sections transfers directly. Bevy evolves fast (roughly a release every few months); the `Mesh3d`/`MeshMaterial3d`/`Camera3d` \"required components\" API shown here is the modern (0.15+) shape — older tutorials use `PbrBundle`/`Camera3dBundle`, which were removed. Pin your Bevy version and read that version's migration guide. Choose raw wgpu to learn the GPU or build a bespoke renderer; choose Bevy to ship a game." }
      ]
    },
    {
      id: "wasm",
      title: "WASM / running in the browser",
      level: "deep",
      body: [
        { type: "p", text: "The same wgpu codebase runs in the browser via **WebAssembly**. wgpu targets the browser's **WebGPU** API where available, and falls back to **WebGL2** (enable the `webgl` feature) elsewhere. You compile to `wasm32-unknown-unknown`, generate JS bindings with **wasm-bindgen**, and attach winit's window to an HTML `<canvas>`." },
        { type: "code", lang: "rust", code: "#[cfg(target_arch = \"wasm32\")]\nuse wasm_bindgen::prelude::*;\n\n// exported entry point the page calls\n#[cfg_attr(target_arch = \"wasm32\", wasm_bindgen(start))]\npub fn run() {\n    #[cfg(target_arch = \"wasm32\")]\n    {\n        std::panic::set_hook(Box::new(console_error_panic_hook::hook)); // real panic messages\n        console_log::init_with_level(log::Level::Info).ok();\n    }\n    #[cfg(not(target_arch = \"wasm32\"))]\n    env_logger::init();\n\n    let event_loop = winit::event_loop::EventLoop::new().unwrap();\n    // ... same App / ApplicationHandler as native ...\n    // On web, State::new can't block: use wasm_bindgen_futures::spawn_local(State::new(window)).\n}" },
        { type: "code", lang: "rust", code: "// attaching the winit window to a canvas (inside resumed(), web only)\n#[cfg(target_arch = \"wasm32\")]\n{\n    use winit::platform::web::WindowExtWebSys;\n    let canvas = window.canvas().unwrap();\n    web_sys::window().unwrap().document().unwrap()\n        .get_element_by_id(\"app\").unwrap()\n        .append_child(&canvas).unwrap();\n}" },
        { type: "code", lang: "bash", code: "# one-time tooling\nrustup target add wasm32-unknown-unknown\ncargo install wasm-bindgen-cli\n\n# build + generate JS/WASM bindings\ncargo build --release --target wasm32-unknown-unknown\nwasm-bindgen --out-dir web --target web \\\n  target/wasm32-unknown-unknown/release/wgpu_cube.wasm\n\n# ...or just use trunk (builds, bundles, live-reloads)\ncargo install trunk\ntrunk serve   # serves index.html that loads the wasm" },
        { type: "callout", variant: "warn", text: "Web caveats: (1) **WebGPU** is the good path but not in every browser/config yet, so ship the **`webgl`** feature for a WebGL2 fallback and cap yourself to `Limits::downlevel_webgl2_defaults()` if you must support it. (2) You **cannot `block_on`** on the web (it deadlocks the single browser thread) — drive the async init with `wasm_bindgen_futures::spawn_local`. (3) WebGL2 doesn't support compute shaders or storage buffers, so feature-gate anything advanced. (4) Serve over HTTP (not `file://`); WebGPU needs a secure context." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns of wgpu development. Most produce a clear validation message — **read wgpu's error output first**, it usually names the exact field or binding at fault." },
        { type: "heading", text: "1. Async init boilerplate" },
        { type: "callout", variant: "gotcha", text: "`request_adapter`/`request_device` are `async`. On native, wrap the init in `pollster::block_on(...)`. On the web you **must not** block — use `wasm_bindgen_futures::spawn_local`. The surface also needs `'static`, so hold the window in an `Arc<Window>`. This ceremony is copy-paste-once, then forget." },
        { type: "heading", text: "2. Surface lost / outdated" },
        { type: "callout", variant: "warn", text: "`get_current_texture()` can return `Lost`/`Outdated` (window minimized, resized, monitor/DPI change, GPU reset). **Handle it every frame:** on `Lost | Outdated`, call `surface.configure(&device, &config)` and skip the frame; on `OutOfMemory`, exit. Ignoring these makes the app freeze or crash on resize." },
        { type: "heading", text: "3. The z-range clip-space correction" },
        { type: "callout", variant: "gotcha", text: "wgpu clip-space z is **[0, 1]**, not OpenGL's [-1, 1]. glam's `Mat4::perspective_rh` already targets [0, 1] — correct as-is. Only apply `OPENGL_TO_WGPU_MATRIX` when porting an OpenGL-style projection (cgmath, or `perspective_rh_gl`). Applying it on top of glam's `perspective_rh` double-corrects and breaks depth." },
        { type: "heading", text: "4. Uniform buffer alignment / padding" },
        { type: "callout", variant: "warn", text: "WGSL aligns `vec3` to **16 bytes** and rounds struct size up to 16. Your Rust `#[repr(C)]` struct must add explicit `_pad` fields to match, or the shader reads from the wrong offsets. bytemuck checks the Rust side is POD; it does **not** verify the layout matches WGSL. Prefer `vec4`s / explicit padding, and keep struct size a multiple of 16." },
        { type: "heading", text: "5. sRGB surface format washing out colors" },
        { type: "callout", variant: "gotcha", text: "Surface formats are usually sRGB (`Bgra8UnormSrgb`). Use sRGB texture formats (`Rgba8UnormSrgb`) for color/albedo images and non-sRGB (`Rgba8Unorm`) for data (normal/roughness maps). Mismatch = colors consistently too dark or washed out. If you write final colors yourself, remember the surface applies gamma on output." },
        { type: "heading", text: "6. Bind-group / layout mismatches" },
        { type: "callout", variant: "gotcha", text: "The `BindGroupLayout` used to build the pipeline must be the *same* one used to build the `BindGroup`, and the `@group`/`@binding` numbers and `visibility` in WGSL must line up with `set_bind_group(group, ...)`. A mismatch is a validation error at draw. The message names the binding — fix the number/type/visibility it points at." },
        { type: "heading", text: "7. Forgetting to configure the surface (and depth) on resize" },
        { type: "callout", variant: "warn", text: "On every `Resized` event you must update `config.width/height` and call `surface.configure(...)`, **and** recreate the depth texture at the new size. Skip the surface reconfigure and you get stretched output / `Outdated` errors; skip the depth resize and `begin_render_pass` errors that attachment sizes differ. Also guard against 0×0 (minimized) sizes." },
        { type: "heading", text: "8. WGSL type & entry-point mismatches" },
        { type: "callout", variant: "gotcha", text: "A vertex attribute's `VertexFormat` must match the WGSL `@location` type (`Float32x3` <-> `vec3<f32>`), and `entry_point: Some(\"vs_main\")` must name a function that actually exists with that stage attribute. naga reports the line and expected type — trust it over guessing." },
        { type: "heading", text: "9. Borrow-checker friction with the render pass" },
        { type: "callout", variant: "gotcha", text: "`begin_render_pass` mutably borrows the encoder; you can't `encoder.finish()` until the pass is dropped. Wrap the pass in a `{ }` block. Likewise the surface texture must outlive the pass that draws into its view — keep `frame` alive until after `submit`, then `frame.present()`." },
        { type: "heading", text: "10. Read the validation errors" },
        { type: "callout", variant: "note", text: "Call `env_logger::init()` (native) or `console_log` (web) at startup so wgpu's messages actually print. wgpu's validation layer is one of its best features — errors are specific, name the resource and field, and often suggest the fix. When something doesn't draw, don't guess: run with logging and read the message. `RUST_LOG=wgpu=warn` tunes verbosity." }
      ]
    }
  ],

  packages: [
    { name: "wgpu", why: "the WebGPU API in Rust — surfaces, pipelines, buffers, textures, bind groups, render/compute passes; native + WASM" },
    { name: "winit", why: "cross-platform windowing + event loop (ApplicationHandler in 0.30); the standard way to get a window and input for wgpu" },
    { name: "glam", why: "fast SIMD linear algebra — Vec2/3/4, Mat3/4, Quat; perspective_rh/look_at_rh; enable the `bytemuck` feature for GPU upload" },
    { name: "bytemuck", why: "safely reinterpret #[repr(C)] POD structs as &[u8] for buffer/uniform uploads (Pod/Zeroable derives)" },
    { name: "pollster", why: "minimal block_on to run wgpu's async init on native (do NOT use on the web)" },
    { name: "image", why: "decode PNG/JPG/etc. into RGBA pixels to upload as textures" },
    { name: "env_logger", why: "prints wgpu's excellent validation/log messages on native (RUST_LOG=wgpu=warn to tune)" },
    { name: "wgpu-types", why: "the shared type/enum crate wgpu re-exports (Features, Limits, TextureFormat, ...); occasionally referenced directly" },
    { name: "naga", why: "wgpu's shader compiler/translator (WGSL <-> SPIR-V/MSL/HLSL/GLSL); powers validation and cross-compilation" },
    { name: "egui + egui-wgpu", why: "immediate-mode GUI with a wgpu render backend — debug panels, tools, overlays on top of your scene" },
    { name: "bevy", why: "the popular ECS game engine built on wgpu; batteries-included path (assets, PBR, scenes, UI) when you don't want raw wgpu" },
    { name: "wasm-bindgen", why: "Rust<->JS glue for the web target; #[wasm_bindgen(start)] entry point, canvas access, and the CLI that emits JS bindings" },
    { name: "wgpu-profiler / renderdoc", why: "GPU timing scopes and frame capture/debugging when you need to see what the GPU actually did" },
    { name: "encase", why: "automatic std140/std430 uniform/storage layout — an alternative to hand-padding bytemuck structs to dodge alignment bugs" }
  ],

  gotchas: [
    "**Clip-space z is [0, 1] in wgpu, not [-1, 1] (OpenGL).** glam's `perspective_rh` is already correct; only apply `OPENGL_TO_WGPU_MATRIX` when porting an OpenGL-style (cgmath / `perspective_rh_gl`) projection — never both.",
    "**Uniform alignment:** WGSL aligns `vec3` to 16 bytes and rounds struct size to 16. Add explicit `_pad` fields to your `#[repr(C)]` struct or the shader reads the wrong offsets. bytemuck won't catch it.",
    "**Reconfigure the surface on resize** (`surface.configure`) or you get stretched output / `Outdated` errors — and recreate the **depth texture** at the new size too.",
    "**Handle `SurfaceError::Lost`/`Outdated`** every frame by reconfiguring the surface; they fire on minimize, resize and DPI/monitor changes.",
    "**sRGB mismatch washes out colors:** use `*UnormSrgb` for color textures, plain `*Unorm` for data (normal/roughness) maps; the surface applies gamma on output.",
    "**Bind-group/layout must match:** the same `BindGroupLayout` for pipeline and bind group, and `@group`/`@binding`/visibility must line up with `set_bind_group`.",
    "**Borrow checker:** wrap the render pass in a `{ }` block so it's dropped before `encoder.finish()`; keep the `frame` alive until after `submit` + `present`.",
    "**Async init:** `block_on` on native (pollster), `spawn_local` on the web (blocking deadlocks the browser). The surface needs `'static` — hold the window in `Arc<Window>`.",
    "**Vertex format must match WGSL:** `Float32x3` <-> `vec3<f32>`; a wrong `VertexFormat` or `array_stride` silently misreads memory and warps/hides geometry.",
    "**Normals need the inverse-transpose model matrix** (not the plain model matrix) under non-uniform scale, and must be `normalize`d again in the fragment shader.",
    "**Matrix order is right-to-left and non-commutative:** `T * R * S` (scale, then rotate, then translate). `R * T` orbits the origin — a classic \"flies off in a circle\" bug.",
    "**Don't create pipelines/buffers per frame:** build them once in setup and reuse; per-frame allocation tanks performance. Update uniforms with `queue.write_buffer` instead.",
    "**Guard against 0x0 surface size** on minimize — configuring a zero-size surface panics; skip resize/render when width or height is 0.",
    "**WebGL2 is limited:** no compute shaders or storage buffers; cap to `downlevel_webgl2_defaults()` and feature-gate advanced paths if you ship the WebGL fallback.",
    "**Turn on logging** (`env_logger`/`console_log`) so wgpu's validation errors actually print — they name the exact field/binding at fault; guessing wastes hours.",
    "**A `mat4` vertex attribute spans four `@location`s** (max attribute size is `vec4`); list all four in the layout and reassemble with `mat4x4<f32>(...)` in WGSL (instancing)."
  ],

  flashcards: [
    { q: "What is wgpu, in one sentence?", a: "A safe, portable Rust implementation of the **WebGPU** API that runs natively (Vulkan/Metal/DX12/GL) and on the web (WebGPU/WebGL2) from one codebase; it's the layer under Bevy and Firefox's WebGPU." },
    { q: "What's the init sequence for a wgpu app?", a: "**Instance -> Surface -> Adapter -> Device + Queue -> configure(surface)**. It's async, so `block_on` on native / `spawn_local` on web. The surface needs `'static`, hence `Arc<Window>`." },
    { q: "What does a `RenderPipeline` bundle, and why immutable?", a: "Compiled shaders + vertex layout + primitive/topology + blend + depth + target formats — all fixed at creation. Immutability replaces OpenGL's mutable global state, is validated up front, and is set per-draw with `set_pipeline`." },
    { q: "Recording model: how does a frame reach the GPU?", a: "Record commands into a `CommandEncoder` (render/compute passes), `encoder.finish()` into a command buffer, `queue.submit(...)`, then `frame.present()`. The GPU runs asynchronously." },
    { q: "Dot product — meaning and main use?", a: "`a·b = |a||b|cosθ`: how aligned two vectors are. Between unit vectors it's `cosθ`. Core use: diffuse lighting `max(dot(normal, light_dir), 0)`; also projection and angle between vectors." },
    { q: "Cross product — meaning and main use?", a: "`a×b` is perpendicular to both (right-hand rule), length `|a||b|sinθ`. Used to compute surface normals from two triangle edges and to build camera basis vectors. Not commutative: `a×b = -(b×a)`." },
    { q: "Why do transforms use 4x4 matrices and homogeneous coords?", a: "A point is `(x,y,z,1)`, a direction `(x,y,z,0)`. The `w` component lets one matrix multiply express translation (and later perspective). Points get translated; directions (w=0) don't." },
    { q: "What is the MVP chain?", a: "**Model** (local->world), **View** (world->camera, via `look_at_rh`), **Projection** (camera->clip, via `perspective_rh`). `mvp = proj * view * model`, applied right-to-left to a column vector." },
    { q: "What clip-space z range does wgpu use, and the gotcha?", a: "**[0, 1]** (like DX/Metal/Vulkan), not OpenGL's [-1, 1]. glam's `perspective_rh` already targets [0,1] — correct. Only apply `OPENGL_TO_WGPU_MATRIX` for OpenGL-style projections; never double-correct." },
    { q: "What's the uniform-buffer alignment footgun?", a: "WGSL aligns `vec3` to 16 bytes and rounds struct size to 16. Your `#[repr(C)]` struct must add explicit `_pad` fields to match or the shader reads wrong offsets. bytemuck only checks POD-ness, not the WGSL match." },
    { q: "BindGroupLayout vs BindGroup?", a: "The **layout** describes the *shape* of resources a shader expects (buffer at binding 0, texture at 1...); the **BindGroup** is a concrete set of resources matching it. Both the pipeline and the bind group must use the same layout." },
    { q: "How does instancing work in wgpu?", a: "A second vertex buffer with `step_mode: Instance` holds per-object data (usually a model matrix across 4 `@location`s); one `draw_indexed(..., 0..N)` draws all N. The buffer advances once per instance, not per vertex." },
    { q: "Why quaternions over Euler angles?", a: "Euler angles suffer **gimbal lock** (lost axis at ±90°) and interpolate badly. `Quat` represents any rotation with 4 floats, composes with `q1*q2`, and interpolates smoothly via `slerp` — the choice for animation/orientation." },
    { q: "How do you transform a normal correctly?", a: "Use the **normal matrix** = inverse-transpose of the model's upper-left 3x3 (matters under non-uniform scale), multiply with `w=0`, and `normalize` again in the fragment shader since interpolation shortens it." },
    { q: "Blinn-Phong lighting = which three terms?", a: "**Ambient** (flat fill) + **diffuse** (`max(dot(n, light_dir), 0)`) + **specular** (`pow(max(dot(n, half_dir),0), shininess)`, half_dir = normalize(view_dir + light_dir)). All in world space." },
    { q: "How do you handle a resize correctly?", a: "Update `config.width/height`, call `surface.configure(...)`, recreate the **depth texture** at the new size, update the camera aspect, and skip when size is 0x0 (minimized)." },
    { q: "When choose Bevy over raw wgpu?", a: "Bevy (an ECS engine built on wgpu, re-exporting glam) when you want a game/app with assets, PBR, scenes, UI and input for free. Raw wgpu to learn the GPU or build a bespoke renderer. Bevy's API changes fast — pin the version." },
    { q: "What breaks when running wgpu on the web?", a: "Can't `block_on` (deadlocks) -> use `spawn_local`; WebGPU isn't universal -> ship the `webgl` feature + `downlevel_webgl2_defaults()`; WebGL2 has no compute/storage buffers; serve over HTTPS (secure context) and attach winit's window to a `<canvas>`." }
  ],

  cheatsheet: [
    { label: "Instance", code: "let instance = wgpu::Instance::new(&wgpu::InstanceDescriptor { backends: wgpu::Backends::all(), ..Default::default() });" },
    { label: "Surface + adapter", code: "let surface = instance.create_surface(window.clone())?; let adapter = instance.request_adapter(&opts).await.unwrap();" },
    { label: "Device + queue", code: "let (device, queue) = adapter.request_device(&wgpu::DeviceDescriptor::default()).await.unwrap();" },
    { label: "Configure surface", code: "surface.configure(&device, &config); // re-call on every resize" },
    { label: "Acquire frame", code: "let frame = surface.get_current_texture()?; let view = frame.texture.create_view(&Default::default());" },
    { label: "Clear color", code: "load: wgpu::LoadOp::Clear(wgpu::Color { r:0.05, g:0.06, b:0.1, a:1.0 }), store: wgpu::StoreOp::Store" },
    { label: "Vertex buffer", code: "device.create_buffer_init(&BufferInitDescriptor { contents: bytemuck::cast_slice(V), usage: BufferUsages::VERTEX, .. })" },
    { label: "Update uniform", code: "queue.write_buffer(&buf, 0, bytemuck::cast_slice(&[uniform]));" },
    { label: "Draw indexed", code: "pass.set_index_buffer(ibo.slice(..), IndexFormat::Uint16); pass.draw_indexed(0..n, 0, 0..1);" },
    { label: "Submit + present", code: "queue.submit([encoder.finish()]); frame.present();" },
    { label: "glam perspective (wgpu z)", code: "let proj = glam::Mat4::perspective_rh(60f32.to_radians(), aspect, 0.1, 100.0);" },
    { label: "glam view", code: "let view = glam::Mat4::look_at_rh(eye, target, glam::Vec3::Y);" },
    { label: "glam TRS model", code: "glam::Mat4::from_scale_rotation_translation(scale, quat, translation)" },
    { label: "Mat4 -> WGSL uniform", code: "uniform.view_proj = (proj * view).to_cols_array_2d(); // column-major, no transpose" },
    { label: "Normal matrix", code: "glam::Mat3::from_mat4(model).inverse().transpose()" },
    { label: "Quaternion slerp", code: "let q = glam::Quat::from_axis_angle(Vec3::Y, a); let mid = q.slerp(q2, t);" },
    { label: "WGSL uniform binding", code: "@group(0) @binding(0) var<uniform> camera: Camera;" },
    { label: "WGSL sample texture", code: "return textureSample(t_diffuse, s_diffuse, in.uv);" },
    { label: "Build for web", code: "cargo build --target wasm32-unknown-unknown && wasm-bindgen --target web --out-dir web <wasm>" },
    { label: "Enable wgpu logs", code: "env_logger::init(); // native — then RUST_LOG=wgpu=warn cargo run" }
  ]
});
