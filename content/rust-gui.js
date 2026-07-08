(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "rust-gui",
  name: "egui (Rust)",
  language: "Rust",
  group: "Desktop GUI",
  navLabel: "egui (Rust)",
  color: "#dea584",
  readMinutes: 30,
  tagline: "**Immediate-mode** desktop GUI in **pure Rust** via **egui + eframe** — the same code runs native *and* in the browser (WASM). Plus a survey of the wider landscape: **iced**, **Slint**, **gtk-rs**, **Tauri**, **Dioxus**.",

  sections: [
    {
      id: "landscape",
      title: "The Rust GUI landscape & how to choose",
      level: "core",
      body: [
        { type: "p", text: "There is no blessed \"Rust GUI\" the way Python has Tk or C# has WinForms — it's a young, fragmented but fast-maturing field. Six options cover almost every real project. Pick by **paradigm** (immediate vs retained vs web-tech) and by **who renders the pixels** (pure-Rust GPU canvas vs native OS widgets vs a webview)." },
        { type: "table", headers: ["Toolkit", "Paradigm", "Renders with", "Reach for it when…"], rows: [
          ["**egui** (+eframe)", "immediate mode", "own GPU canvas (wgpu/glow)", "tools, debug/dev UIs, game overlays, dashboards — fastest to *anything on screen*"],
          ["**iced**", "retained, Elm arch", "own GPU canvas (wgpu)", "you want a structured `Message`/`update`/`view` app with type-safe events"],
          ["**Slint**", "retained, declarative", "own renderer (GPU/software)", "designer-friendly `.slint` DSL, embedded/MCU targets, commercial products"],
          ["**gtk-rs** (gtk4)", "retained, native", "real GTK widgets", "a native Linux/GNOME app, accessibility, mature widget set"],
          ["**Tauri**", "web (HTML/CSS/JS)", "OS webview", "you have a web frontend (React/Svelte) and want a tiny Rust-backed desktop shell"],
          ["**Dioxus**", "retained, RSX", "webview (desktop) / DOM (web)", "React-like Rust across web + desktop + mobile from one RSX codebase"]
        ] },
        { type: "list", items: [
          "**egui** — *immediate mode*: you rebuild the UI from your state every frame; no widget tree, no callbacks. Easiest to learn, trivial to wire to live data, ideal for tools/games. This deck's hands-on focus.",
          "**iced** — *retained + Elm*: a `Message` enum, an `update` that mutates state, a `view` that produces widgets. Type-safe, predictable, the second-most-popular pure-Rust option.",
          "**Slint** — a declarative markup language (`.slint`) compiled to Rust; strong tooling (live preview, VS Code), great for embedded and shipping products; dual licensed.",
          "**gtk-rs** — mature, safe bindings to GTK 4. Real native widgets and accessibility, but you inherit GTK's model (GObject, signals) and its heaviest on non-Linux.",
          "**Tauri / Dioxus** — reach for web tech. Tauri wraps *your existing web app* in a Rust shell + OS webview (tiny binaries vs Electron). Dioxus writes the UI itself in Rust `rsx!` and targets web, desktop (webview) and mobile."
        ] },
        { type: "callout", variant: "note", text: "Versions in this guide target **egui/eframe 0.34** (mid-2026), **iced 0.13** (the `Task`-based API), **Slint 1.16**, **Dioxus 0.6**, **Tauri 2**, **gtk4-rs**. egui moves fast and breaks small things every ~6 weeks — pin your version and read the CHANGELOG when you bump." },
        { type: "callout", variant: "tip", text: "Rule of thumb: **need it on screen today → egui**. **Structured app with clear state flow → iced**. **Designer + embedded/product polish → Slint**. **Native Linux app → gtk4**. **Already have a web UI → Tauri**. **One Rust codebase across web/desktop/mobile → Dioxus**." }
      ]
    },
    {
      id: "immediate-vs-retained",
      title: "Immediate mode vs retained mode — the core mental model",
      level: "core",
      body: [
        { type: "p", text: "This is *the* concept that makes egui click. In a **retained-mode** toolkit (Qt, GTK, the web DOM, iced, Slint) you build a persistent tree of widget objects once, then mutate it and attach callbacks; the framework keeps that tree between frames and redraws it for you. In **immediate mode** there is no persistent tree — every frame your code *describes* the entire UI from scratch by calling functions, and the library lays out, draws, and returns interaction results inline." },
        { type: "code", lang: "rust", code: "// IMMEDIATE MODE (egui): describe + react, every frame, from your state\nif ui.button(\"Increment\").clicked() {   // draws the button AND tells you it was clicked\n    self.count += 1;                    // just mutate your own state\n}\nui.label(format!(\"Count: {}\", self.count));  // re-emitted every frame from state\n\n// RETAINED MODE (pseudo-Qt): build once, store handles, wire callbacks\n// let btn = Button::new(\"Increment\");\n// btn.on_click(|| self.count += 1);   // callback fires later\n// let lbl = Label::new(...);          // you keep + mutate lbl.set_text(...)" },
        { type: "list", items: [
          "**No widget handles, no callbacks.** `ui.button(..)` returns a `Response` *this frame*; you check `.clicked()` right there. You never store a button to update it later — you just emit it again next frame with new text.",
          "**The UI is a pure function of your state.** Want a row hidden? Don't emit it. Want a label to change? Change the state it's built from. There is no \"set the label's text\" API because there is no persistent label.",
          "**`update()` runs ~60×/sec** (or on demand). Cheap because egui only *repaints* when something changed or you ask it to (`request_repaint`).",
          "**Tradeoff:** immediate mode is wonderfully simple for live/data-driven UIs and dead-easy to reason about (no stale widget state), but it's less suited to very deep static forms, complex accessibility, and pixel-perfect OS-native look. That's where iced/Slint/gtk shine."
        ] },
        { type: "callout", variant: "note", text: "egui *does* keep a little state between frames internally (which window is open, scroll offsets, text-cursor position) keyed by widget **id** — but your app code stays stateless-looking: read from `&mut self`, write to `&mut self`. Everything the user sees is regenerated each frame." }
      ]
    },
    {
      id: "setup",
      title: "Setup: your first eframe app",
      level: "core",
      body: [
        { type: "p", text: "**egui** is the UI library (widgets, layout, painting). **eframe** is the official *framework* around it: it opens a native window (or a web canvas), runs the event/render loop, and calls your code. You almost always start with eframe." },
        { type: "code", lang: "bash", code: "cargo new my_app\ncd my_app\ncargo add eframe            # pulls egui in as a re-export: eframe::egui\ncargo add egui_extras       # optional: tables, image loaders, date picker\n# run it\ncargo run" },
        { type: "code", lang: "toml", code: "# Cargo.toml\n[dependencies]\neframe = \"0.34\"       # brings egui with it (use eframe::egui)\n# or split them if you need egui features directly:\n# egui = \"0.34\"" },
        { type: "p", text: "A complete minimal app. Three pieces: a **state struct** (with `Default`), the **`eframe::App` trait** whose `update` is called every frame, and **`run_native`** to launch it." },
        { type: "code", lang: "rust", code: "// src/main.rs\nuse eframe::egui;\n\nfn main() -> eframe::Result {\n    let options = eframe::NativeOptions {\n        viewport: egui::ViewportBuilder::default()\n            .with_inner_size([420.0, 260.0])\n            .with_title(\"Hello egui\"),\n        ..Default::default()\n    };\n    eframe::run_native(\n        \"my_app\",                              // app id (used for storage)\n        options,\n        Box::new(|cc| Ok(Box::new(MyApp::new(cc)))),  // build the App\n    )\n}\n\nstruct MyApp {\n    name: String,\n    age: u32,\n}\n\nimpl Default for MyApp {\n    fn default() -> Self {\n        Self { name: \"Ada\".to_owned(), age: 42 }\n    }\n}\n\nimpl MyApp {\n    fn new(_cc: &eframe::CreationContext<'_>) -> Self {\n        // cc gives you: egui_ctx (set fonts/visuals here), storage, gl handle...\n        Self::default()\n    }\n}\n\nimpl eframe::App for MyApp {\n    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {\n        egui::CentralPanel::default().show(ctx, |ui| {\n            ui.heading(\"My egui App\");\n            ui.horizontal(|ui| {\n                ui.label(\"Name:\");\n                ui.text_edit_singleline(&mut self.name);\n            });\n            ui.add(egui::Slider::new(&mut self.age, 0..=120).text(\"age\"));\n            if ui.button(\"Birthday\").clicked() {\n                self.age += 1;\n            }\n            ui.label(format!(\"{} is {}\", self.name, self.age));\n        });\n    }\n}" },
        { type: "list", items: [
          "**`eframe::run_native(id, options, app_creator)`** blocks until the window closes and returns `eframe::Result`. The closure gets a `CreationContext` and must return `Ok(Box::new(app))` — note the `Ok`: the creator is fallible (a change from older versions that returned the box directly).",
          "**`eframe::App::update(&mut self, ctx, frame)`** is the whole loop. It runs every frame; you get `&mut self` (your state), the `egui::Context` (the frame's UI + input + memory), and the `eframe::Frame` (window/platform controls: `frame.info()`, close, etc.).",
          "**`CentralPanel::default().show(ctx, |ui| { ... })`** fills the remaining space and hands you a `Ui` to emit widgets into. The `Ui` is your primary handle — layout flows top-to-bottom by default.",
          "**`ViewportBuilder`** configures the OS window (size, title, icon, decorations, transparency). It lives under `NativeOptions.viewport`."
        ] },
        { type: "callout", variant: "tip", text: "Fastest way to explore: run the official demo with `cargo run` on the `egui_demo_app`, or visit the hosted web demo. Nearly every widget has a \"source\" button showing the exact code — it's the best egui reference there is." }
      ]
    },
    {
      id: "widgets",
      title: "Widgets & the Response pattern",
      level: "core",
      body: [
        { type: "p", text: "Every widget call returns an **`egui::Response`** describing this frame's interaction. That single return-value convention replaces the callbacks/signals of retained toolkits: you branch on `.clicked()`, `.changed()`, `.hovered()` inline. Widgets that *edit* a value take a `&mut` to it (two-way binding without observers)." },
        { type: "code", lang: "rust", code: "// Text\nui.label(\"plain text\");\nui.heading(\"big text\");\nui.colored_label(egui::Color32::RED, \"warning\");\nui.hyperlink(\"https://egui.rs\");\n\n// Buttons: the classic immediate-mode idiom\nif ui.button(\"Save\").clicked() {\n    self.save();\n}\nlet resp = ui.button(\"Hover me\");\nif resp.hovered() { /* ... */ }\nresp.on_hover_text(\"tooltip shown on hover\");\n\n// Text input (bind to &mut String)\nui.text_edit_singleline(&mut self.name);\nui.text_edit_multiline(&mut self.notes);\nif ui.text_edit_singleline(&mut self.query).changed() {\n    self.search();                 // .changed() = edited this frame\n}\n\n// Toggles & numbers (bind to &mut)\nui.checkbox(&mut self.enabled, \"Enabled\");\nui.add(egui::Slider::new(&mut self.volume, 0.0..=1.0).text(\"Volume\"));\nui.add(egui::DragValue::new(&mut self.count).speed(1));" },
        { type: "code", lang: "rust", code: "// Radio buttons: one enum, several radio_value calls\n#[derive(PartialEq)]\nenum Mode { Light, Dark, Auto }\n\nui.horizontal(|ui| {\n    ui.radio_value(&mut self.mode, Mode::Light, \"Light\");\n    ui.radio_value(&mut self.mode, Mode::Dark,  \"Dark\");\n    ui.radio_value(&mut self.mode, Mode::Auto,  \"Auto\");\n});\n\n// Combo box (dropdown)\negui::ComboBox::from_label(\"Framework\")\n    .selected_text(format!(\"{:?}\", self.mode))\n    .show_ui(ui, |ui| {\n        ui.selectable_value(&mut self.mode, Mode::Light, \"Light\");\n        ui.selectable_value(&mut self.mode, Mode::Dark,  \"Dark\");\n        ui.selectable_value(&mut self.mode, Mode::Auto,  \"Auto\");\n    });" },
        { type: "table", headers: ["`Response` method", "True when…"], rows: [
          ["`.clicked()`", "the widget was clicked (released) this frame"],
          ["`.double_clicked()` / `.secondary_clicked()`", "double / right click"],
          ["`.changed()`", "an editable widget's value changed this frame"],
          ["`.hovered()` / `.has_focus()`", "pointer is over it / it holds keyboard focus"],
          ["`.dragged()` / `.drag_delta()`", "being dragged / how far since last frame"],
          ["`.lost_focus()`", "focus just left (great for \"commit on Enter/blur\")"]
        ] },
        { type: "code", lang: "rust", code: "// Images: since egui 0.24+, load by URI via egui_extras loaders\n// (call egui_extras::install_image_loaders(&cc.egui_ctx) once in new())\nui.image(egui::include_image!(\"../assets/logo.png\")); // bundled at compile time\nui.add(egui::Image::new(\"file://icon.png\").max_width(64.0));\n\n// A responsive image button\nif ui.add(egui::ImageButton::new(egui::include_image!(\"../assets/play.png\")))\n     .clicked() { self.play(); }" },
        { type: "callout", variant: "gotcha", text: "`ui.button(\"X\")` returns a `Response`; `.clicked()` is `true` for exactly **one frame**. Because `update` reruns constantly, that's all you need — but never store the `Response` to check next frame (it's this frame's). And don't try to keep a \"button object\" around: there isn't one." }
      ]
    },
    {
      id: "layout-containers",
      title: "Layout: panels, windows, grids, scroll areas",
      level: "core",
      body: [
        { type: "p", text: "egui composes layout from **containers**. Top-level structure comes from **panels**; inside a `Ui` you nest `horizontal`/`vertical` groups, `Grid`s for aligned forms, `ScrollArea`s, collapsing sections, and floating `Window`s." },
        { type: "heading", text: "Panels: Top/Bottom, Side, Central" },
        { type: "code", lang: "rust", code: "fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {\n    egui::TopBottomPanel::top(\"menu\").show(ctx, |ui| {\n        egui::menu::bar(ui, |ui| {\n            ui.menu_button(\"File\", |ui| {\n                if ui.button(\"Quit\").clicked() { std::process::exit(0); }\n            });\n        });\n    });\n    egui::SidePanel::left(\"sidebar\").resizable(true).show(ctx, |ui| {\n        ui.heading(\"Nav\");\n        ui.selectable_value(&mut self.tab, Tab::Home, \"Home\");\n        ui.selectable_value(&mut self.tab, Tab::Settings, \"Settings\");\n    });\n    egui::CentralPanel::default().show(ctx, |ui| {\n        // CentralPanel must be added LAST — it takes whatever space is left\n        ui.heading(format!(\"{:?}\", self.tab));\n    });\n}" },
        { type: "callout", variant: "warn", text: "**Add `CentralPanel` last.** Panels claim space in the order you add them; the central panel fills the remainder. If you add it before your side/top panels, it grabs the whole window and the others overlap or vanish." },
        { type: "heading", text: "Rows, columns & grids" },
        { type: "code", lang: "rust", code: "ui.horizontal(|ui| {\n    ui.label(\"Name:\");\n    ui.text_edit_singleline(&mut self.name);\n});\nui.vertical_centered(|ui| ui.heading(\"Centered\"));\n\n// Equal columns\nui.columns(2, |cols| {\n    cols[0].label(\"left column\");\n    cols[1].button(\"right column\");\n});\n\n// A form-aligned grid: call end_row() after each row\negui::Grid::new(\"form\").num_columns(2).spacing([8.0, 6.0]).show(ui, |ui| {\n    ui.label(\"User\");\n    ui.text_edit_singleline(&mut self.user);\n    ui.end_row();\n    ui.label(\"Pass\");\n    ui.add(egui::TextEdit::singleline(&mut self.pass).password(true));\n    ui.end_row();\n});" },
        { type: "heading", text: "Scroll areas, collapsing headers & windows" },
        { type: "code", lang: "rust", code: "egui::ScrollArea::vertical().show(ui, |ui| {\n    for i in 0..1000 { ui.label(format!(\"row {i}\")); }\n});\n\nui.collapsing(\"Advanced\", |ui| {\n    ui.checkbox(&mut self.verbose, \"Verbose logging\");\n});\n\n// A floating, movable window (lives on ctx, not inside a panel Ui)\negui::Window::new(\"Inspector\")\n    .open(&mut self.show_inspector)   // bind an &mut bool for the close button\n    .resizable(true)\n    .show(ctx, |ui| {\n        ui.label(\"floating content\");\n    });" },
        { type: "callout", variant: "tip", text: "For huge lists don't emit 100k widgets — use `ScrollArea::vertical().show_rows(ui, row_height, total_rows, |ui, range| { ... })`, which only builds the visible rows. For real data tables, `egui_extras::TableBuilder` gives resizable, virtualized columns." }
      ]
    },
    {
      id: "state-borrow",
      title: "State & the borrow checker in update()",
      level: "core",
      body: [
        { type: "p", text: "Because the whole UI is emitted inside one `&mut self` method, the borrow checker is your main friction — and your main safety net. The classic fight: you want to iterate over `self.items` while a button handler mutates `self.items`, which is two borrows of `self` at once. A handful of patterns dissolve nearly all of these." },
        { type: "code", lang: "rust", code: "// PROBLEM: borrow self.items (iter) while wanting to mutate self.items (remove)\n// for item in &self.items {           // immutable borrow of self.items ...\n//     if ui.button(\"delete\").clicked() {\n//         self.items.remove(...);      // ERROR: also needs &mut self.items\n//     }\n// }\n\n// FIX 1: iterate by INDEX and record the action, apply it after the loop\nlet mut to_delete: Option<usize> = None;\nfor i in 0..self.items.len() {\n    ui.horizontal(|ui| {\n        ui.label(&self.items[i]);\n        if ui.button(\"delete\").clicked() {\n            to_delete = Some(i);        // don't mutate mid-iteration\n        }\n    });\n}\nif let Some(i) = to_delete {\n    self.items.remove(i);               // safe: loop's borrow has ended\n}" },
        { type: "code", lang: "rust", code: "// FIX 2: copy small Copy values OUT before the closure that borrows self\nlet volume = self.volume;               // f32 is Copy\nui.label(format!(\"vol {volume}\"));\n\n// FIX 3: std::mem::take to move a field out, work on it, put it back\nlet mut items = std::mem::take(&mut self.items);  // self.items is now empty\nitems.retain(|it| { ... });\nself.items = items;\n\n// FIX 4: split a big state struct so panels borrow disjoint fields\n// fn draw_sidebar(&mut self.nav, ...)  // borrows only .nav, not all of self" },
        { type: "heading", text: "Animation & waking the UI: request_repaint" },
        { type: "p", text: "egui is lazy: it only repaints when input arrives or you ask. For animations, timers, or results arriving from another thread, call **`ctx.request_repaint()`** to schedule the next frame. Without it your animation freezes until the user moves the mouse." },
        { type: "code", lang: "rust", code: "// smooth animation: advance state, then guarantee another frame\nself.angle += ctx.input(|i| i.stable_dt) * 1.0;   // dt-based, frame-rate independent\nctx.request_repaint();                            // keep animating\n// or schedule after a delay (e.g. a clock ticking once a second):\n// ctx.request_repaint_after(std::time::Duration::from_secs(1));" },
        { type: "callout", variant: "note", text: "egui's per-frame **memory** persists small bits keyed by id: `ctx.data_mut(|d| d.insert_temp(id, value))` / `get_temp`. Use it for transient UI state you don't want in your app struct (an expander's open flag, a scratch string). App-domain data belongs in `self`." }
      ]
    },
    {
      id: "sizing",
      title: "Sizing, spacing & alignment",
      level: "core",
      body: [
        { type: "p", text: "By default a widget is as small as its content and layout flows top-down, left-aligned. To take control of size and direction you use `add_sized`, the spacing settings, and `Layout`/`with_layout`." },
        { type: "code", lang: "rust", code: "// Force a widget's size\nui.add_sized([200.0, 40.0], egui::Button::new(\"Wide button\"));\nui.add_sized(ui.available_size(), egui::TextEdit::multiline(&mut self.body));\n\n// Fill available width for one widget\nui.add(egui::Slider::new(&mut self.x, 0.0..=1.0));\nlet full = ui.available_width();\nui.allocate_ui(egui::vec2(full, 0.0), |ui| { ui.text_edit_singleline(&mut self.name); });\n\n// Spacing (per-Ui overrides)\nui.spacing_mut().item_spacing = egui::vec2(8.0, 6.0);   // gap between widgets\nui.add_space(12.0);                                     // manual gap\nui.separator();                                         // a divider line" },
        { type: "code", lang: "rust", code: "// Layout direction & alignment: put a button on the far right of a row\nui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {\n    if ui.button(\"Delete\").clicked() { /* ... */ }\n    ui.label(\"Danger zone\");   // emitted right-to-left, so label ends up left\n});\n\n// Top-down but right-aligned\nui.with_layout(egui::Layout::top_down(egui::Align::RIGHT), |ui| {\n    ui.label(\"a\"); ui.label(\"bb\"); ui.label(\"ccc\");\n});" },
        { type: "list", items: [
          "**`ui.add_sized([w, h], widget)`** — the go-to for fixed-size widgets (it centers the widget in the allocated box).",
          "**`ui.available_size()` / `available_width()`** — remaining space; combine with `add_sized` to make something fill the panel.",
          "**`ui.spacing_mut()`** — tweak `item_spacing`, `button_padding`, `indent` for the current `Ui` and its children.",
          "**`Layout`** — `left_to_right`, `right_to_left`, `top_down`, `bottom_up`, each taking a cross-axis `Align` (`LEFT`/`Center`/`RIGHT`/`Min`/`Max`). Wrap a region with `with_layout`."
        ] }
      ]
    },
    {
      id: "styling",
      title: "Styling: visuals, themes & fonts",
      level: "core",
      body: [
        { type: "p", text: "Global look is controlled by the **`Style`** (spacing, interaction) and **`Visuals`** (colors, dark/light, rounding, shadows) on the `Context`. Set them once (usually in `App::new`) or live from a settings screen." },
        { type: "code", lang: "rust", code: "// In MyApp::new(cc):\ncc.egui_ctx.set_visuals(egui::Visuals::dark());     // or ::light()\n\n// Live theme switch from a button in update:\nif ui.button(\"Toggle theme\").clicked() {\n    let v = if ui.visuals().dark_mode { egui::Visuals::light() }\n            else { egui::Visuals::dark() };\n    ctx.set_visuals(v);\n}\n\n// Follow the OS light/dark preference (0.34):\nctx.set_theme(egui::Theme::Dark);   // or use ThemePreference::System\n\n// Tweak specific colors / rounding\nctx.style_mut(|s| {\n    s.visuals.widgets.noninteractive.rounding = egui::Rounding::same(6.0);\n    s.visuals.override_text_color = Some(egui::Color32::from_rgb(220, 220, 220));\n});\n\n// Scale the whole UI (great for HiDPI / accessibility)\nctx.set_pixels_per_point(1.25);" },
        { type: "heading", text: "Fonts (including emoji & CJK)" },
        { type: "p", text: "egui ships a small default font that covers Latin plus a subset of symbols. For custom fonts, CJK, or full emoji you must install your own font bytes into the `FontDefinitions` — this is the fix for the infamous \"boxes instead of glyphs\" problem." },
        { type: "code", lang: "rust", code: "fn install_fonts(ctx: &egui::Context) {\n    let mut fonts = egui::FontDefinitions::default();\n    fonts.font_data.insert(\n        \"myfont\".to_owned(),\n        std::sync::Arc::new(egui::FontData::from_static(include_bytes!(\"../assets/NotoSans.ttf\"))),\n    );\n    // put it first in the proportional family so it's used for body text\n    fonts.families.get_mut(&egui::FontFamily::Proportional).unwrap()\n         .insert(0, \"myfont\".to_owned());\n    ctx.set_fonts(fonts);\n}\n// call install_fonts(&cc.egui_ctx) in MyApp::new" },
        { type: "callout", variant: "tip", text: "Set fonts/visuals **once in `new()`**, not every frame in `update()` — `set_fonts` re-rasterizes the atlas and is expensive. Doing it per frame tanks your frame rate." }
      ]
    },
    {
      id: "concurrency",
      title: "Long work: threads, channels & request_repaint",
      level: "core",
      body: [
        { type: "p", text: "`update()` must return quickly — it runs every frame on the UI thread. **Any blocking work (file I/O, HTTP, heavy compute) inside `update` freezes the window.** The immediate-mode fix mirrors Tkinter's: do the work on another thread and hand results back through a channel that `update` polls (non-blocking) each frame." },
        { type: "code", lang: "rust", code: "use std::sync::mpsc::{channel, Receiver};\n\nstruct MyApp {\n    rx: Option<Receiver<String>>,   // results arrive here\n    result: String,\n    loading: bool,\n}\n\nimpl eframe::App for MyApp {\n    fn update(&mut self, ctx: &egui::Context, _f: &mut eframe::Frame) {\n        egui::CentralPanel::default().show(ctx, |ui| {\n            if ui.add_enabled(!self.loading, egui::Button::new(\"Fetch\")).clicked() {\n                let (tx, rx) = channel();\n                self.rx = Some(rx);\n                self.loading = true;\n                let ctx = ctx.clone();          // Context is cheap to clone (Arc)\n                std::thread::spawn(move || {\n                    let data = do_slow_work();  // blocks, but off the UI thread\n                    let _ = tx.send(data);\n                    ctx.request_repaint();      // WAKE the UI so it polls the channel\n                });\n            }\n            // poll WITHOUT blocking, every frame\n            if let Some(rx) = &self.rx {\n                if let Ok(msg) = rx.try_recv() {\n                    self.result = msg;\n                    self.loading = false;\n                    self.rx = None;\n                }\n            }\n            if self.loading { ui.spinner(); }\n            ui.label(&self.result);\n        });\n    }\n}" },
        { type: "list", items: [
          "**`rx.try_recv()`**, never `recv()` — `recv` blocks the UI thread. `try_recv` returns immediately with `Err(Empty)` when nothing's ready.",
          "**Clone the `Context` into the worker** and call **`ctx.request_repaint()`** when done. egui is lazy; without a repaint request the result sits in the channel until the next mouse move.",
          "**Async instead of threads?** Spawn onto a `tokio` runtime (or `poll_promise`'s `Promise`), send the result down the same channel. On WASM use `wasm_bindgen_futures::spawn_local` — there are no OS threads in the browser.",
          "**Never touch `ui`/`ctx` widgets from the worker.** The worker only computes and `send`s data; all UI happens back on the UI thread in `update`."
        ] },
        { type: "callout", variant: "gotcha", text: "The single most common egui \"bug report\": *my async result never shows up until I wiggle the mouse.* You forgot `ctx.request_repaint()`. egui only ran a frame when input arrived; nothing told it to run one when your data landed." }
      ]
    },
    {
      id: "painting",
      title: "Custom painting & plotting",
      level: "deep",
      body: [
        { type: "p", text: "Below the widgets sits a retained-immediate **`Painter`** you can draw arbitrary shapes with. Allocate a region with a `Sense` (what interactions you want), get back a `Response` + `Painter`, then paint from your state and read interaction off the `Response` — the same describe-and-react loop, one level down." },
        { type: "code", lang: "rust", code: "// A little interactive canvas: click to drop points, drag to pan\nlet (response, painter) =\n    ui.allocate_painter(egui::vec2(400.0, 300.0), egui::Sense::click_and_drag());\nlet rect = response.rect;\n\npainter.rect_filled(rect, 4.0, egui::Color32::from_gray(20));\nif let Some(pos) = response.interact_pointer_pos() {\n    if response.clicked() { self.points.push(pos); }\n}\nfor p in &self.points {\n    painter.circle_filled(*p, 4.0, egui::Color32::LIGHT_BLUE);\n}\npainter.line_segment(\n    [rect.left_top(), rect.right_bottom()],\n    egui::Stroke::new(2.0, egui::Color32::RED),\n);\npainter.text(rect.center(), egui::Align2::CENTER_CENTER,\n    format!(\"{} pts\", self.points.len()), egui::FontId::proportional(16.0),\n    egui::Color32::WHITE);" },
        { type: "list", items: [
          "**`Sense`** declares intent: `Sense::hover()`, `Sense::click()`, `Sense::drag()`, `Sense::click_and_drag()`. It decides which `Response` flags become meaningful.",
          "**`Painter` shapes:** `circle_filled`, `rect_filled`, `rect_stroke`, `line_segment`, `add(Shape::...)`, `text`, `image`. Coordinates are screen points; clip to `response.rect`.",
          "**`response.interact_pointer_pos()`** gives the pointer position while interacting; `response.hover_pos()` while merely hovering.",
          "Everything repaints from your state each frame — to animate the canvas, mutate state and `ctx.request_repaint()`."
        ] },
        { type: "heading", text: "Plotting with egui_plot" },
        { type: "code", lang: "rust", code: "// Cargo.toml: egui_plot = \"0.34\"   (kept in lockstep with egui's version)\nuse egui_plot::{Line, Plot, PlotPoints};\n\nlet sin: PlotPoints = (0..1000).map(|i| {\n    let x = i as f64 * 0.01;\n    [x, x.sin()]\n}).collect();\n\nPlot::new(\"my_plot\").view_aspect(2.0).show(ui, |plot_ui| {\n    plot_ui.line(Line::new(\"sin(x)\", sin));\n});" },
        { type: "callout", variant: "note", text: "`egui_plot`, `egui_extras`, `egui_dock`, `egui-notify` etc. are versioned to match egui. When you bump `egui`, bump these together or you'll get trait-mismatch compile errors from two egui versions in the tree." }
      ]
    },
    {
      id: "web",
      title: "Native + Web (WASM) from one codebase",
      level: "deep",
      body: [
        { type: "p", text: "eframe's headline feature: the *same* `App` compiles to native **and** to WebAssembly, rendered on an HTML `<canvas>`. You add a WASM entry point alongside `main`, gate them with `cfg`, and build with **Trunk**." },
        { type: "code", lang: "rust", code: "// src/main.rs — two entry points, one App\n#[cfg(not(target_arch = \"wasm32\"))]\nfn main() -> eframe::Result {\n    let options = eframe::NativeOptions::default();\n    eframe::run_native(\"my_app\", options,\n        Box::new(|cc| Ok(Box::new(MyApp::new(cc)))))\n}\n\n#[cfg(target_arch = \"wasm32\")]\nfn main() {\n    use eframe::wasm_bindgen::JsCast as _;\n    let web_options = eframe::WebOptions::default();\n    wasm_bindgen_futures::spawn_local(async {\n        let canvas = web_sys::window().unwrap().document().unwrap()\n            .get_element_by_id(\"the_canvas_id\").unwrap()\n            .dyn_into::<web_sys::HtmlCanvasElement>().unwrap();\n        eframe::WebRunner::new()\n            .start(canvas, web_options,\n                   Box::new(|cc| Ok(Box::new(MyApp::new(cc)))))\n            .await.expect(\"failed to start eframe\");\n    });\n}" },
        { type: "code", lang: "bash", code: "rustup target add wasm32-unknown-unknown\ncargo install trunk --locked\ntrunk serve        # dev server + live reload at http://127.0.0.1:8080\ntrunk build --release   # -> ./dist  (static files you can host anywhere)" },
        { type: "code", lang: "html", code: "<!-- index.html at the crate root -->\n<!DOCTYPE html>\n<html>\n  <head><meta charset=\"utf-8\"/><title>My App</title></head>\n  <body>\n    <canvas id=\"the_canvas_id\"></canvas>\n    <link data-trunk rel=\"rust\" href=\"Cargo.toml\" data-wasm-opt=\"2\"/>\n  </body>\n</html>" },
        { type: "list", items: [
          "**No OS threads in the browser.** `std::thread::spawn` panics on WASM — use `wasm_bindgen_futures::spawn_local` + async for background work, and `poll_promise` to await results in `update`.",
          "**No blocking file I/O / std networking.** Use `ehttp`/`reqwest` (WASM-aware) for HTTP and the `rfd` async file-dialog API; the sync `std::fs` path only works native.",
          "**Timekeeping differs:** `std::time::Instant` panics on WASM; use `web-time` (a drop-in) or `ctx.input(|i| i.time)`.",
          "**Startup is async** on web (fetch + compile the `.wasm`), synchronous on native — hence the `spawn_local` wrapper. The `App` itself is identical."
        ] },
        { type: "callout", variant: "tip", text: "Start from the official **`eframe_template`** repo — it's set up for native + web + GitHub Pages deploy out of the box, with the `cfg` split and `index.html` already correct. Far easier than assembling the WASM plumbing by hand." }
      ]
    },
    {
      id: "persistence",
      title: "Persistence: eframe Storage & serde",
      level: "core",
      body: [
        { type: "p", text: "eframe can save and restore your entire app state between runs (window size too). Derive `serde` on your state, enable the `persistence` feature, load in `new()`, and implement `App::save()`. On native it writes to a per-app config dir; on web to `localStorage`." },
        { type: "code", lang: "toml", code: "[dependencies]\neframe = { version = \"0.34\", features = [\"persistence\"] }\nserde = { version = \"1\", features = [\"derive\"] }" },
        { type: "code", lang: "rust", code: "#[derive(serde::Deserialize, serde::Serialize)]\n#[serde(default)]                 // tolerate added/removed fields across versions\nstruct MyApp {\n    name: String,\n    count: i32,\n    #[serde(skip)] rx: Option<std::sync::mpsc::Receiver<String>>, // don't persist runtime junk\n}\n\nimpl Default for MyApp {\n    fn default() -> Self { Self { name: \"Ada\".into(), count: 0, rx: None } }\n}\n\nimpl MyApp {\n    fn new(cc: &eframe::CreationContext<'_>) -> Self {\n        // restore previous state if any, else Default\n        if let Some(storage) = cc.storage {\n            return eframe::get_value(storage, eframe::APP_KEY).unwrap_or_default();\n        }\n        Self::default()\n    }\n}\n\nimpl eframe::App for MyApp {\n    // called periodically and on exit when the persistence feature is on\n    fn save(&mut self, storage: &mut dyn eframe::Storage) {\n        eframe::set_value(storage, eframe::APP_KEY, self);\n    }\n    fn update(&mut self, ctx: &egui::Context, _f: &mut eframe::Frame) { /* ... */ }\n}" },
        { type: "callout", variant: "gotcha", text: "State not persisting? Common causes: you didn't enable the `persistence` feature; you didn't *load* in `new()` (implementing `save` alone isn't enough); or a non-`Serialize` field (channel, handle) makes the derive fail — mark it `#[serde(skip)]`. Use `#[serde(default)]` so old saved state still loads after you add fields." }
      ]
    },
    {
      id: "packaging",
      title: "Packaging, icons, file dialogs & distribution",
      level: "deep",
      body: [
        { type: "p", text: "Shipping a native egui app is ordinary Rust plus a couple of GUI-specific touches: a release build, a window icon, an OS-native file dialog (egui has none built in), and optional installer bundling." },
        { type: "code", lang: "bash", code: "cargo build --release            # -> target/release/my_app  (a single binary)\n\n# nicer distributables:\ncargo install cargo-bundle       # .app / .deb / .msi from Cargo.toml metadata\ncargo bundle --release\n\ncargo install cargo-dist         # CI-driven installers + GitHub releases\ncargo dist init" },
        { type: "code", lang: "rust", code: "// Window icon via ViewportBuilder\nfn load_icon() -> egui::IconData {\n    let img = image::load_from_memory(include_bytes!(\"../assets/icon.png\"))\n        .unwrap().to_rgba8();\n    let (w, h) = img.dimensions();\n    egui::IconData { rgba: img.into_raw(), width: w, height: h }\n}\nlet options = eframe::NativeOptions {\n    viewport: egui::ViewportBuilder::default().with_icon(load_icon()),\n    ..Default::default()\n};" },
        { type: "code", lang: "rust", code: "// Native file dialogs: the rfd crate (Rust File Dialog)\nif ui.button(\"Open…\").clicked() {\n    if let Some(path) = rfd::FileDialog::new()\n        .add_filter(\"Text\", &[\"txt\", \"md\"]).pick_file() {\n        self.text = std::fs::read_to_string(path).unwrap_or_default();\n    }\n}\nif ui.button(\"Save As…\").clicked() {\n    if let Some(path) = rfd::FileDialog::new().set_file_name(\"out.txt\").save_file() {\n        let _ = std::fs::write(path, &self.text);\n    }\n}\n// On WASM use rfd's ASYNC API (AsyncFileDialog) — the sync one blocks and won't work." },
        { type: "list", items: [
          "**`cargo build --release`** yields one self-contained binary — no runtime, no interpreter. That's egui's packaging superpower vs Python/Electron.",
          "**Icons:** `ViewportBuilder::with_icon` for the window/taskbar; on Windows also embed a `.ico` via the `winres`/`embed-resource` build script for the `.exe` file icon.",
          "**`rfd`** provides native open/save/folder/message dialogs on all platforms (and async on web). egui deliberately ships none.",
          "**Bundling:** `cargo-bundle` for one-off `.app`/`.deb`/`.msi`; `cargo-dist` for reproducible cross-platform release CI. macOS distribution still needs code-signing + notarization."
        ] }
      ]
    },
    {
      id: "iced-tour",
      title: "The other paradigm: iced (Elm architecture)",
      level: "deep",
      body: [
        { type: "p", text: "Know one retained option too. **iced** is the leading pure-Rust alternative, built on the **Elm architecture**: state lives in a struct, a **`Message`** enum enumerates every event, **`update`** mutates state in response to a message, and **`view`** produces widgets from the current state. It's the inverse of egui: you *return* a widget tree and iced retains it; events come back as typed messages rather than inline `Response`s." },
        { type: "code", lang: "toml", code: "[dependencies]\niced = \"0.13\"" },
        { type: "code", lang: "rust", code: "use iced::widget::{button, column, text, Column};\n\npub fn main() -> iced::Result {\n    // the terse entry point: (title, update, view)\n    iced::run(\"Counter\", Counter::update, Counter::view)\n}\n\n#[derive(Default)]\nstruct Counter { value: i64 }\n\n#[derive(Debug, Clone, Copy)]\nenum Message { Increment, Decrement }   // every possible event, typed\n\nimpl Counter {\n    fn update(&mut self, message: Message) {\n        match message {\n            Message::Increment => self.value += 1,\n            Message::Decrement => self.value -= 1,\n        }\n    }\n    fn view(&self) -> Column<Message> {\n        column![\n            button(\"+\").on_press(Message::Increment),\n            text(self.value),\n            button(\"-\").on_press(Message::Decrement),\n        ]\n    }\n}" },
        { type: "list", items: [
          "**`Message`** is the whole event vocabulary. Widgets emit messages (`button(..).on_press(Message::X)`), `update` receives them — no callbacks, fully type-checked.",
          "**`view(&self) -> Element<Message>`** builds widgets from state; iced retains and diffs the tree. Layout uses `column!`/`row!`/`container` combinators, styled with `.padding()`, `.spacing()`, `.width(Length::Fill)`.",
          "**Async work returns a `Task`.** For side effects, give `update` the signature `fn update(&mut self, m: Message) -> Task<Message>` and return `Task::perform(future, Message::Loaded)`; iced runs it and feeds the result back as a message. (This replaced the old `Command` API in 0.13.)",
          "**More control:** use the builder `iced::application(title, update, view).subscription(..).theme(..).run()` when you need subscriptions (timers, streams, WS) or theming."
        ] },
        { type: "code", lang: "rust", code: "// Async in iced: update returns a Task that resolves into another Message\nfn update(&mut self, message: Message) -> iced::Task<Message> {\n    match message {\n        Message::Fetch => iced::Task::perform(load_data(), Message::Loaded),\n        Message::Loaded(data) => { self.data = data; iced::Task::none() }\n    }\n}" },
        { type: "callout", variant: "note", text: "When to prefer iced over egui: you want a *structured*, testable app where every interaction is an explicit, type-checked message and state transitions live in one `update` `match`. egui wins for speed-to-screen and live/tool UIs; iced wins for a disciplined application architecture. Both are pure Rust with GPU rendering." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns in egui/eframe — most stem from bringing retained-mode habits to an immediate-mode library, or forgetting egui is lazy and single-threaded." },
        { type: "heading", text: "1. Treating egui like a retained toolkit" },
        { type: "callout", variant: "gotcha", text: "Trying to store widget \"handles\" (`let btn = ui.button(...)`) to update them later. There are no persistent widgets. **Fix:** store *data* in `self`; re-emit widgets from that data every frame. To change a label, change the state it's built from." },
        { type: "heading", text: "2. Borrow-checker fights in update()" },
        { type: "callout", variant: "warn", text: "Iterating `&self.items` while a handler wants `&mut self.items` won't compile. **Fix:** loop by index and record the action (`to_delete = Some(i)`), applying it after the loop; copy out small `Copy` values first; use `std::mem::take` to move a field out and back; or split state so panels borrow disjoint fields." },
        { type: "heading", text: "3. Forgetting request_repaint (animation/async \"freezes\")" },
        { type: "callout", variant: "warn", text: "Animations stutter or async results appear only when you move the mouse. egui is lazy — it repaints on input or on request. **Fix:** call `ctx.request_repaint()` each animating frame (or `request_repaint_after(dt)`), and from a worker thread after `send`ing a result (clone the `Context` into the thread)." },
        { type: "heading", text: "4. Blocking work in update() (frozen UI)" },
        { type: "callout", variant: "warn", text: "A network call, big loop, or `recv()` inside `update` blocks the UI thread and freezes the whole window. **Fix:** move the work to `std::thread::spawn` (native) or `spawn_local` (WASM); return results via an `mpsc` channel that you `try_recv()` (non-blocking) each frame." },
        { type: "heading", text: "5. CentralPanel added too early" },
        { type: "callout", variant: "gotcha", text: "Side/top panels overlap or don't show. Panels claim space in the order added and `CentralPanel` fills the rest. **Fix:** add all `TopBottomPanel`/`SidePanel`s first, then `CentralPanel` last." },
        { type: "heading", text: "6. State not persisting" },
        { type: "callout", variant: "gotcha", text: "Nothing survives a restart. **Fix:** enable eframe's `persistence` feature, derive `serde` on state, *load* in `new()` via `eframe::get_value(storage, eframe::APP_KEY)`, implement `save()`, and `#[serde(skip)]` non-serializable fields with `#[serde(default)]` for forward compat." },
        { type: "heading", text: "7. WASM build gotchas" },
        { type: "callout", variant: "warn", text: "`std::thread`, `std::time::Instant`, blocking `std::fs`/networking all panic in the browser. **Fix:** use `spawn_local` + async, `web-time` for time, `ehttp`/`reqwest` and `rfd`'s async dialog. Gate native-only paths behind `#[cfg(not(target_arch = \"wasm32\"))]`." },
        { type: "heading", text: "8. Fonts / emoji show as boxes" },
        { type: "callout", variant: "gotcha", text: "CJK, custom glyphs, or full emoji render as tofu boxes because the default font lacks them. **Fix:** install your own font bytes into `FontDefinitions` and call `ctx.set_fonts(...)` **once** in `new()` (never per frame — it re-rasterizes the atlas)." },
        { type: "heading", text: "9. Mismatched companion-crate versions" },
        { type: "callout", variant: "gotcha", text: "`egui_plot`/`egui_extras` fail to compile with trait errors after bumping egui. They pull their own egui version. **Fix:** keep `egui`, `eframe`, and every `egui_*` crate on the *same* version." },
        { type: "heading", text: "10. Setting visuals/fonts every frame" },
        { type: "callout", variant: "warn", text: "Calling `set_fonts` or rebuilding `Visuals` inside `update` every frame tanks performance. **Fix:** configure style/fonts once in `new()`; only mutate on an actual user action (e.g. a theme toggle)." },
        { type: "callout", variant: "note", text: "General discipline: keep `update` cheap and non-blocking, drive everything from `&mut self`, request repaints for anything not user-triggered, and set style/fonts once. Do that and egui stays fast and pleasant." }
      ]
    }
  ],

  packages: [
    { name: "eframe", why: "the official egui framework — opens the native window (or web canvas), runs the loop, handles storage; brings egui in as `eframe::egui`" },
    { name: "egui", why: "the immediate-mode GUI library itself: widgets, layout, `Ui`/`Context`/`Response`, painter. Usually consumed via eframe" },
    { name: "egui_extras", why: "virtualized `TableBuilder`, image loaders (`install_image_loaders`), date picker, syntax highlighting — the batteries egui core omits" },
    { name: "egui_plot", why: "line/scatter/bar plots with pan/zoom; versioned in lockstep with egui" },
    { name: "rfd", why: "native open/save/folder/message dialogs on all platforms (async API on WASM) — egui ships none" },
    { name: "image", why: "decode PNG/JPEG/etc. for window icons (`IconData`) and textures" },
    { name: "serde", why: "derive `Serialize`/`Deserialize` on app state for eframe persistence and config files" },
    { name: "poll-promise", why: "await a future inside `update` without blocking — poll a `Promise` each frame for async results (works native + WASM)" },
    { name: "ehttp / reqwest", why: "HTTP that works on WASM too (ehttp is tiny; reqwest with the right features) — never block `update` on a request" },
    { name: "iced", why: "the leading retained-mode Rust GUI (Elm architecture: Message/update/view, `Task` for async) — the main alternative paradigm" },
    { name: "slint", why: "declarative `.slint` DSL compiled to Rust; live preview tooling, embedded/MCU targets, dual-licensed for products" },
    { name: "gtk4", why: "safe gtk-rs bindings to GTK 4 — real native widgets, accessibility, mature ecosystem, best on Linux/GNOME" },
    { name: "tauri", why: "wrap a web frontend (React/Svelte/…) in a Rust shell + OS webview for tiny cross-platform desktop apps (Electron alternative)" },
    { name: "dioxus", why: "React-like Rust with `rsx!` targeting web, desktop (webview) and mobile from one codebase" },
    { name: "tokio", why: "async runtime for background tasks on native; spawn work and return results to `update` via a channel (use `spawn_local` on WASM instead)" }
  ],

  gotchas: [
    "**No persistent widgets.** Immediate mode rebuilds the UI every frame from `self`. Don't store widget handles or try to `set_text` a label — change the state it's drawn from.",
    "**`update` must not block.** File/HTTP/heavy compute inside it freezes the window. Offload to a thread (native) or `spawn_local` (WASM) and poll results via `mpsc::try_recv()`.",
    "**Forgetting `ctx.request_repaint()`** makes animations stutter and async results appear only on the next input event — egui is lazy. Request a repaint each animating frame and from workers after sending a result.",
    "**Borrow-checker in `update`:** iterating `&self.items` while mutating them won't compile. Loop by index and defer the mutation, copy out `Copy` values, or use `std::mem::take`.",
    "**`CentralPanel` must be added last** — panels claim space in order and the central panel fills the remainder; add it first and it eats the whole window.",
    "**Persistence needs three things:** the `persistence` feature, *loading* in `new()` via `eframe::get_value(.., eframe::APP_KEY)`, and `save()`. Missing any one silently loses state; `#[serde(skip)]` non-serializable fields.",
    "**WASM has no OS threads, no `Instant`, no blocking `std::fs`/net** — they panic. Use `spawn_local` + async, `web-time`, `ehttp`/`reqwest`, and `rfd`'s async dialog; `cfg`-gate native-only code.",
    "**Font tofu:** the default font lacks CJK/most emoji. Install your own bytes into `FontDefinitions` and `ctx.set_fonts(...)` **once** in `new()` — never per frame (it re-rasterizes the atlas).",
    "**Keep `egui`, `eframe`, and all `egui_*` companion crates on the same version** — mixed versions cause confusing trait-mismatch compile errors.",
    "**The app creator is fallible now:** `Box::new(|cc| Ok(Box::new(App::new(cc))))` — you must wrap in `Ok(..)` (older tutorials return the box directly and won't compile on 0.24+).",
    "**`.clicked()` is true for one frame only** and belongs to *this* frame's `Response`. Check it inline; never stash a `Response` to inspect next frame.",
    "**Setting visuals/fonts every frame** in `update` kills performance. Configure them in `new()` and only on explicit user actions (theme toggle).",
    "**Don't emit thousands of widgets** for long lists — use `ScrollArea::show_rows` or `egui_extras::TableBuilder` to build only visible rows.",
    "**`recv()` vs `try_recv()`:** `recv` blocks the UI thread (frozen window). Always poll channels with the non-blocking `try_recv()` inside `update`.",
    "**egui isn't OS-native:** it draws its own widgets on a GPU canvas, so look and accessibility differ from native. If native widgets/AX matter, reach for gtk4 or Slint."
  ],

  flashcards: [
    { q: "Immediate mode vs retained mode in one sentence?", a: "Immediate mode (egui): you *rebuild* the whole UI from your state every frame and read interaction inline from the returned `Response`. Retained mode (iced/gtk/Qt): you build a persistent widget tree once and mutate it via handles/callbacks." },
    { q: "What do egui and eframe each provide?", a: "**egui** is the UI library (widgets, layout, `Ui`/`Context`/`Response`, painter). **eframe** is the framework around it that opens the window (native or web canvas), runs the render loop, and handles storage. You usually start with eframe and use `eframe::egui`." },
    { q: "What is the `eframe::App` trait's key method?", a: "`fn update(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame)` — called every frame. `&mut self` is your state, `ctx` is the frame's UI/input/memory, `frame` is window/platform controls. Emit UI here via panels." },
    { q: "How do you launch an eframe app?", a: "`eframe::run_native(app_id, native_options, Box::new(|cc| Ok(Box::new(MyApp::new(cc)))))` — note the fallible creator returns `Ok(Box::new(app))`. It blocks until the window closes." },
    { q: "The immediate-mode button idiom?", a: "`if ui.button(\"Save\").clicked() { self.save(); }`. The call draws the button *and* returns a `Response`; `.clicked()` is true for the one frame it was clicked." },
    { q: "How do editable widgets bind to your data?", a: "They take a `&mut` to the value: `ui.text_edit_singleline(&mut self.name)`, `ui.checkbox(&mut self.on, \"..\")`, `ui.add(egui::Slider::new(&mut self.x, 0.0..=1.0))`. Two-way binding with no observers; check `.changed()` to react." },
    { q: "How do you avoid borrow-checker conflicts in `update`?", a: "Loop by **index** and defer mutations (`to_delete = Some(i)`, apply after the loop), **copy out** small `Copy` values before a borrowing closure, use `std::mem::take` to move a field out and back, or split state so regions borrow disjoint fields." },
    { q: "Why isn't my animation/async result updating?", a: "egui is lazy and only repaints on input or request. Call `ctx.request_repaint()` each animating frame (or `request_repaint_after(dt)`), and from a worker thread after sending a result — clone the `Context` into the thread first." },
    { q: "How do you do long/blocking work without freezing the UI?", a: "Never block `update`. `std::thread::spawn` (native) or `spawn_local` (WASM) the work, send results down an `mpsc` channel, and `try_recv()` (non-blocking) each frame; call `ctx.request_repaint()` when the result lands." },
    { q: "Panel ordering rule?", a: "Add `TopBottomPanel`/`SidePanel`s first and `CentralPanel` **last** — panels claim space in order and the central panel fills whatever remains." },
    { q: "How does eframe persist app state?", a: "Enable the `persistence` feature, derive serde on state, *load* in `new()` via `eframe::get_value(storage, eframe::APP_KEY).unwrap_or_default()`, and implement `save()` calling `eframe::set_value(...)`. Mark runtime-only fields `#[serde(skip)]`." },
    { q: "How does one codebase target native and web?", a: "eframe compiles the same `App` to WASM. Add a `#[cfg(target_arch = \"wasm32\")]` `main` that uses `eframe::WebRunner::new().start(canvas, opts, creator)` inside `spawn_local`; build with Trunk. No OS threads/Instant/blocking IO on web." },
    { q: "How do you draw custom graphics in egui?", a: "`let (response, painter) = ui.allocate_painter(size, egui::Sense::click_and_drag());` then paint shapes (`painter.circle_filled`, `line_segment`, `text`) from state and read interaction off `response` (`interact_pointer_pos`, `clicked`)." },
    { q: "What is iced and its architecture?", a: "The leading retained-mode Rust GUI, using the Elm architecture: a `Message` enum of all events, `update(&mut self, msg)` mutating state, and `view(&self) -> Element<Message>` returning widgets. Async work returns a `Task<Message>` (the post-0.13 API)." },
    { q: "When would you pick iced, Slint, gtk4, or Tauri over egui?", a: "**iced** for a structured, type-safe message/update/view app; **Slint** for a designer-friendly `.slint` DSL and embedded/product polish; **gtk4** for a native Linux app with real widgets/accessibility; **Tauri** when you already have a web frontend to wrap." },
    { q: "How do you get a native file dialog in egui?", a: "egui ships none — use the `rfd` crate: `rfd::FileDialog::new().add_filter(..).pick_file()` (and `.save_file()`). Use rfd's `AsyncFileDialog` on WASM since the sync one blocks." }
  ],

  cheatsheet: [
    { label: "Deps", code: "cargo add eframe egui_extras\n# eframe = \"0.34\" (brings egui)" },
    { label: "Launch", code: "eframe::run_native(\"id\", eframe::NativeOptions::default(),\n  Box::new(|cc| Ok(Box::new(MyApp::new(cc)))))" },
    { label: "App trait", code: "impl eframe::App for MyApp {\n  fn update(&mut self, ctx: &egui::Context, _f: &mut eframe::Frame) { }\n}" },
    { label: "Central panel", code: "egui::CentralPanel::default().show(ctx, |ui| {\n  ui.heading(\"Hi\");\n});" },
    { label: "Button", code: "if ui.button(\"Go\").clicked() { self.go(); }" },
    { label: "Text input", code: "ui.text_edit_singleline(&mut self.name);\nif ui.text_edit_singleline(&mut self.q).changed() { self.search(); }" },
    { label: "Checkbox / slider", code: "ui.checkbox(&mut self.on, \"On\");\nui.add(egui::Slider::new(&mut self.x, 0.0..=1.0).text(\"x\"));" },
    { label: "Combo box", code: "egui::ComboBox::from_label(\"Mode\").selected_text(cur)\n  .show_ui(ui, |ui| { ui.selectable_value(&mut self.m, M::A, \"A\"); });" },
    { label: "Layout row", code: "ui.horizontal(|ui| { ui.label(\"Name:\"); ui.text_edit_singleline(&mut self.n); });" },
    { label: "Grid form", code: "egui::Grid::new(\"g\").show(ui, |ui| {\n  ui.label(\"a\"); ui.text_edit_singleline(&mut self.a); ui.end_row();\n});" },
    { label: "Scroll / collapse", code: "egui::ScrollArea::vertical().show(ui, |ui| { /* rows */ });\nui.collapsing(\"More\", |ui| { });" },
    { label: "Window", code: "egui::Window::new(\"Inspector\").open(&mut self.show).show(ctx, |ui| { });" },
    { label: "Repaint", code: "ctx.request_repaint();\nctx.request_repaint_after(std::time::Duration::from_secs(1));" },
    { label: "Thread + channel", code: "let (tx, rx) = std::sync::mpsc::channel();\nlet ctx = ctx.clone();\nstd::thread::spawn(move || { tx.send(work()).ok(); ctx.request_repaint(); });\n// each frame: if let Ok(v) = rx.try_recv() { self.v = v; }" },
    { label: "Theme / scale", code: "ctx.set_visuals(egui::Visuals::dark());\nctx.set_pixels_per_point(1.25);" },
    { label: "Painter", code: "let (r, p) = ui.allocate_painter(sz, egui::Sense::click());\np.circle_filled(r.rect.center(), 4.0, egui::Color32::RED);" },
    { label: "File dialog (rfd)", code: "if let Some(path) = rfd::FileDialog::new().pick_file() { /* read path */ }" },
    { label: "Persistence", code: "eframe::get_value(cc.storage.unwrap(), eframe::APP_KEY).unwrap_or_default()\n// save(): eframe::set_value(storage, eframe::APP_KEY, self);" }
  ]
});
