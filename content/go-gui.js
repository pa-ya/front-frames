(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "go-gui",
  name: "Fyne (Go)",
  language: "Go",
  group: "Desktop GUI",
  navLabel: "Fyne (Go)",
  color: "#00add8",
  readMinutes: 28,
  tagline: "Build **cross-platform desktop *and* mobile GUIs from one Go codebase** with **Fyne** — pure Go, its own OpenGL-rendered canvas, a Material-ish look. We survey the landscape (**Gio**, **Wails**, **Walk**, **go-app**) then go deep on Fyne.",

  sections: [
    {
      id: "landscape",
      title: "The Go GUI landscape & how to choose",
      level: "core",
      body: [
        { type: "p", text: "Go has no standard GUI library — the ecosystem settled into a handful of distinct approaches, and the right one depends on whether you want native look, web tech, mobile support, or raw performance. This module is hands-on with **Fyne** (the most-used, most-approachable toolkit), but you should know the map before you commit." },
        { type: "table", headers: ["Toolkit", "Model", "Reach", "cgo?", "Best for"], rows: [
          ["**Fyne**", "retained-mode widgets, own canvas, OpenGL/software render, Material-ish", "Win/mac/Linux/BSD + **Android/iOS** + WASM", "yes (desktop GL)", "the default — cross-platform apps incl. mobile, fastest to ship"],
          ["**Gio**", "**immediate-mode**, low-level, GPU-accelerated (Vulkan/Metal/GL)", "Win/mac/Linux + **Android/iOS** + WASM", "yes (via gioui shims)", "high-perf, custom-drawn UIs, games-adjacent, you want full control"],
          ["**Wails**", "Go backend + **web/JS frontend** in a native webview (like Electron/Tauri)", "Win/mac/Linux desktop", "yes (webview)", "you already have a web UI / React-Svelte skills; small binaries vs Electron"],
          ["**Walk**", "**Windows-native** Win32 widgets", "Windows only", "no (syscall)", "genuine native Windows look, Windows-only tools"],
          ["**go-app**", "WASM/**PWA** in the browser, component model like React", "browser (WASM) + installable PWA", "no", "web/PWA apps written entirely in Go"],
          ["**gotk4 / therecipe-qt**", "cgo bindings to native GTK4 / Qt", "GTK: Linux-first; Qt: all", "heavy cgo", "you need true native GTK/Qt widgets and can stomach the build pain"]
        ] },
        { type: "heading", text: "How to choose in one breath" },
        { type: "list", items: [
          "**Want it to just work, one codebase, desktop + mobile?** → **Fyne**. Consistent look everywhere (it draws its own widgets), the smoothest onboarding, mobile packaging built in.",
          "**Need maximum rendering performance or a fully custom-drawn UI?** → **Gio** (immediate-mode, GPU). Steeper learning curve; you rebuild the whole UI every frame.",
          "**Have web frontend skills / an existing web UI?** → **Wails** (Go logic, HTML/CSS/JS view in a system webview).",
          "**Shipping a Windows-only utility that must look native?** → **Walk**.",
          "**Targeting the browser as a PWA, all in Go?** → **go-app**.",
          "**Must have real native GTK/Qt widgets?** → **gotk4** or the Qt bindings — expect a rough cgo toolchain."
        ] },
        { type: "callout", variant: "note", text: "**Fyne is the focus of this module.** It's pure Go (no external UI runtime), renders its own widgets on an OpenGL (or software) canvas, and packages the *same source* into Windows/macOS/Linux binaries plus Android APKs and iOS apps. Trade-off: it looks like Fyne everywhere, not pixel-native. If native look is non-negotiable, that's when you drop to Walk/GTK/Qt." },
        { type: "callout", variant: "tip", text: "The two immediate-mode vs retained-mode camps matter: **Fyne is retained** (you build a widget tree once, then mutate + `Refresh()` it), **Gio is immediate** (a `Layout` function re-emits the entire UI every frame from your state). Retained feels like classic desktop GUI; immediate feels like a game loop." }
      ]
    },
    {
      id: "setup",
      title: "Setup, prerequisites & hello window",
      level: "core",
      body: [
        { type: "p", text: "Fyne uses **cgo on desktop** — its GL driver needs a **C compiler** and **OpenGL development headers** present at build time. This is the single biggest setup surprise for Go devs used to pure-Go builds. Mobile and WASM targets are handled by the `fyne` CLI." },
        { type: "table", headers: ["OS", "What to install"], rows: [
          ["**Windows**", "a C compiler — install **TDM-GCC** or **MSYS2 mingw-w64 gcc**; ensure it's on PATH"],
          ["**macOS**", "**Xcode command-line tools** (`xcode-select --install`) — provides clang + the GL/Cocoa frameworks"],
          ["**Linux (Debian/Ubuntu)**", "`sudo apt install gcc libgl1-mesa-dev xorg-dev` (GL headers + X11 dev libs)"],
          ["**Linux (Fedora)**", "`sudo dnf install gcc libX11-devel libXcursor-devel libXrandr-devel libXinerama-devel mesa-libGL-devel libXi-devel libXxf86vm-devel`"]
        ] },
        { type: "code", lang: "bash", code: "# 1. add the toolkit to your module\ngo get fyne.io/fyne/v2@latest\n\n# 2. install the Fyne CLI (packaging, bundling, cross-build).\n#    NOTE the module path moved: it's fyne.io/tools now, NOT fyne.io/fyne/v2/cmd/fyne\ngo install fyne.io/tools/cmd/fyne@latest\n\n# 3. sanity-check your build environment (prints compiler, GL, versions)\nfyne env" },
        { type: "callout", variant: "gotcha", text: "The CLI **moved modules** as of the v2.6 era: install it from **`fyne.io/tools/cmd/fyne`**. The old `fyne.io/fyne/v2/cmd/fyne` path is deprecated. If you see `command not found: fyne`, add `$(go env GOPATH)/bin` to your PATH." },
        { type: "heading", text: "A full minimal app" },
        { type: "code", lang: "text", code: "package main\n\nimport (\n\t\"fyne.io/fyne/v2/app\"\n\t\"fyne.io/fyne/v2/widget\"\n)\n\nfunc main() {\n\ta := app.New()                       // create the application\n\tw := a.NewWindow(\"Hello Fyne\")       // a top-level window\n\n\tw.SetContent(widget.NewLabel(\"Hello, world!\"))  // ONE root object per window\n\tw.Resize(fyne.NewSize(320, 160))     // optional starting size (dp)\n\tw.ShowAndRun()                       // show + start the event loop (BLOCKS)\n}" },
        { type: "list", items: [
          "**`app.New()`** builds the app object (event loop, driver, settings). Use **`app.NewWithID(\"com.example.myapp\")`** instead if you need `Preferences()` or notifications — they key off the ID.",
          "**`a.NewWindow(title)`** creates a window; **`w.SetContent(obj)`** sets its single root object (wrap many widgets in a container).",
          "**`w.ShowAndRun()`** shows the window and enters the run loop — it **blocks** until the last window closes. Code after it runs only on shutdown. (`w.Show()` + `a.Run()` is the split form.)",
          "Sizes are in **device-independent pixels (dp)** via `fyne.NewSize(w, h)` and positions via `fyne.NewPos(x, y)` — Fyne scales them per display DPI."
        ] },
        { type: "callout", variant: "warn", text: "Forgetting **`ShowAndRun()`** (or `Run()`) is a classic first bug: the program builds the widget tree, `main` returns, and the window flashes or never appears. Exactly one window's lifecycle must drive the loop." }
      ]
    },
    {
      id: "widgets",
      title: "The widget tour",
      level: "core",
      body: [
        { type: "p", text: "Widgets live in **`fyne.io/fyne/v2/widget`**. Constructors are `widget.NewX(...)`; most interactive ones take their callback right in the constructor. Icons come from the **`theme`** package so they recolor with light/dark automatically." },
        { type: "code", lang: "text", code: "import (\n\t\"fyne.io/fyne/v2/widget\"\n\t\"fyne.io/fyne/v2/theme\"\n\t\"fyne.io/fyne/v2/container\"\n)\n\n// text & buttons\nlbl := widget.NewLabel(\"Name:\")\nbtn := widget.NewButton(\"Save\", func() { /* onTapped */ })\niconBtn := widget.NewButtonWithIcon(\"Add\", theme.ContentAddIcon(), func() {})\n\n// entries\nname := widget.NewEntry()\nname.SetPlaceHolder(\"Ada Lovelace\")\nname.OnChanged = func(s string) { /* fires on every keystroke */ }\nbio := widget.NewMultiLineEntry()          // textarea\npw := widget.NewPasswordEntry()            // masked + reveal toggle\n\n// choices\nchk := widget.NewCheck(\"I agree\", func(b bool) {})\nradio := widget.NewRadioGroup([]string{\"Go\", \"Rust\"}, func(s string) {})\nsel := widget.NewSelect([]string{\"S\", \"M\", \"L\"}, func(s string) {})\nslider := widget.NewSlider(0, 100)\nslider.OnChanged = func(v float64) {}\n\n// feedback\nprog := widget.NewProgressBar()            // 0..1\nprog.SetValue(0.6)\nspin := widget.NewProgressBarInfinite()    // indeterminate\nico := widget.NewIcon(theme.InfoIcon())\ncard := widget.NewCard(\"Title\", \"Subtitle\", widget.NewLabel(\"body\"))\nmd := widget.NewRichTextFromMarkdown(\"# Hi\\n\\n**Fyne** supports _markdown_.\")" },
        { type: "heading", text: "Forms" },
        { type: "p", text: "**`widget.Form`** lays out label/field pairs with a submit + cancel row and per-item validation — the idiomatic way to build a settings or login screen." },
        { type: "code", lang: "text", code: "email := widget.NewEntry()\nemail.Validator = func(s string) error {\n\tif !strings.Contains(s, \"@\") { return errors.New(\"invalid email\") }\n\treturn nil\n}\nform := &widget.Form{\n\tItems: []*widget.FormItem{\n\t\t{Text: \"Email\", Widget: email},\n\t\t{Text: \"Bio\", Widget: widget.NewMultiLineEntry()},\n\t},\n\tOnSubmit: func() { /* all validators passed */ },\n\tOnCancel: func() {},\n}\n// shorthand: widget.NewForm(widget.NewFormItem(\"Email\", email))" },
        { type: "heading", text: "Collections: List, Table, Tree" },
        { type: "p", text: "Collection widgets are **virtualized** and use a **create/update** callback pair: you supply a template object once and a function that binds data into a recycled row. This scales to huge datasets because only visible cells exist." },
        { type: "code", lang: "text", code: "data := []string{\"apple\", \"banana\", \"cherry\"}\n\nlist := widget.NewList(\n\tfunc() int { return len(data) },              // length\n\tfunc() fyne.CanvasObject {                     // create ONE template row\n\t\treturn widget.NewLabel(\"template\")\n\t},\n\tfunc(i widget.ListItemID, o fyne.CanvasObject) { // update recycled row i\n\t\to.(*widget.Label).SetText(data[i])\n\t},\n)\nlist.OnSelected = func(id widget.ListItemID) { /* ... */ }\n\n// Table: length returns (rows, cols); update gets a TableCellID{Row,Col}\ntbl := widget.NewTable(\n\tfunc() (int, int) { return 100, 3 },\n\tfunc() fyne.CanvasObject { return widget.NewLabel(\"\") },\n\tfunc(id widget.TableCellID, o fyne.CanvasObject) {\n\t\to.(*widget.Label).SetText(fmt.Sprintf(\"r%d c%d\", id.Row, id.Col))\n\t},\n)" },
        { type: "callout", variant: "gotcha", text: "The **create** callback must return the *widest/tallest* template — Fyne sizes rows from it. And **never** capture per-row state in the create function; all per-row logic goes in **update**, because rows are recycled as you scroll. `widget.NewTree` follows the same pattern keyed by string node IDs." },
        { type: "heading", text: "Toolbar" },
        { type: "code", lang: "text", code: "tb := widget.NewToolbar(\n\twidget.NewToolbarAction(theme.DocumentCreateIcon(), func() {}),\n\twidget.NewToolbarSeparator(),\n\twidget.NewToolbarSpacer(),\n\twidget.NewToolbarAction(theme.SettingsIcon(), func() {}),\n)" }
      ]
    },
    {
      id: "layouts",
      title: "Layouts & containers",
      level: "core",
      body: [
        { type: "p", text: "A window holds **one** root object, so real UIs nest **containers**. A `container.Container` pairs a slice of child objects with a **layout** that positions them. The helpers in `fyne.io/fyne/v2/container` cover almost everything; drop to `layout.New*` only for the rest." },
        { type: "table", headers: ["Helper", "Arranges children…"], rows: [
          ["`container.NewVBox(...)`", "stacked vertically, each at min height, full width"],
          ["`container.NewHBox(...)`", "in a row, each at min width, full height"],
          ["`container.NewGridWithColumns(n, ...)`", "grid of n equal columns (rows added as needed)"],
          ["`container.NewGridWithRows(n, ...)`", "grid of n equal rows"],
          ["`container.NewBorder(top, bottom, left, right, center...)`", "edges pinned, center fills remaining space"],
          ["`container.NewCenter(obj)`", "child at min size, centered"],
          ["`container.NewStack(...)`", "children layered, all filling the space (was `NewMax`)"],
          ["`container.NewGridWrap(size, ...)`", "fixed-size cells that wrap to new rows (responsive galleries)"],
          ["`container.NewScroll(obj)`", "wraps a child in a scroll area"]
        ] },
        { type: "code", lang: "text", code: "import (\n\t\"fyne.io/fyne/v2/container\"\n\t\"fyne.io/fyne/v2/layout\"\n)\n\n// classic app shell: toolbar on top, status on bottom, content fills middle\nshell := container.NewBorder(\n\ttoolbar,        // top\n\tstatusBar,     // bottom\n\tnil, nil,      // left, right\n\tmainContent,   // center — gets all leftover space\n)\n\n// push widgets apart with a spacer (VBox/HBox respect layout.NewSpacer)\nrow := container.NewHBox(\n\twidget.NewLabel(\"left\"),\n\tlayout.NewSpacer(),      // eats slack, shoving the next child to the right\n\twidget.NewButton(\"right\", nil),\n)\n\n// a responsive wrapping grid of fixed-size cards\ngallery := container.NewGridWrap(fyne.NewSize(160, 120), card1, card2, card3)" },
        { type: "heading", text: "Custom layouts" },
        { type: "p", text: "A layout is any type implementing **`fyne.Layout`** — two methods: `MinSize(objects)` and `Layout(objects, size)`. Use it when none of the built-ins express your rules (e.g. a diagonal cascade, proportional split)." },
        { type: "code", lang: "text", code: "type stackDown struct{}\n\nfunc (s stackDown) MinSize(o []fyne.CanvasObject) fyne.Size {\n\tw, h := float32(0), float32(0)\n\tfor _, c := range o { m := c.MinSize(); w = fyne.Max(w, m.Width); h += m.Height }\n\treturn fyne.NewSize(w, h)\n}\nfunc (s stackDown) Layout(o []fyne.CanvasObject, size fyne.Size) {\n\ty := float32(0)\n\tfor _, c := range o {\n\t\tc.Resize(fyne.NewSize(size.Width, c.MinSize().Height))\n\t\tc.Move(fyne.NewPos(0, y))\n\t\ty += c.MinSize().Height\n\t}\n}\n// use it: container.New(stackDown{}, a, b, c)" },
        { type: "callout", variant: "tip", text: "**Responsiveness is emergent**, not a breakpoint system: Border/VBox/HBox/GridWrap + `layout.NewSpacer()` adapt as the window resizes. For true breakpoints (change layout under a width) listen to resize via a custom widget or the community `fyne-x` responsive layout. Everything is dp-scaled, so it also adapts across DPIs." }
      ]
    },
    {
      id: "events-goroutine",
      title: "Events & the goroutine rule (the #1 gotcha)",
      level: "core",
      body: [
        { type: "p", text: "Simple interactivity is just callbacks: a button's `func()`, `entry.OnChanged`, `check`'s `func(bool)`, `list.OnSelected`. Since **v2.6**, every Fyne callback is guaranteed to run on the **app (main) goroutine**, so inside a handler you can freely touch widgets." },
        { type: "code", lang: "text", code: "btn := widget.NewButton(\"Click\", func() {\n\tstatus.SetText(\"clicked\")  // safe — we're on the app goroutine\n})\nentry.OnChanged = func(s string) { preview.SetText(s) }" },
        { type: "callout", variant: "warn", text: "**THE big Fyne rule: any code running in a goroutine *you* started must NOT touch UI objects directly.** Fyne's runtime is single-threaded; calling `label.SetText(...)` / `Refresh()` from your own goroutine causes data races and crashes (v2.6 even panics with a thread warning to catch it). You must marshal the update onto the app goroutine." },
        { type: "heading", text: "fyne.Do / fyne.DoAndWait (v2.6+)" },
        { type: "p", text: "**`fyne.Do(fn)`** queues `fn` to run on the app goroutine and returns immediately (fire-and-forget). **`fyne.DoAndWait(fn)`** does the same but blocks your goroutine until `fn` has run — use it when the next step depends on the UI update finishing. This replaced the old, unsafe advice of updating widgets directly from goroutines." },
        { type: "code", lang: "text", code: "// background work -> update UI safely\nbtn := widget.NewButton(\"Fetch\", func() {\n\tbtn.Disable()\n\tgo func() {                          // OUR goroutine: no direct UI calls here\n\t\tresult, err := slowNetworkCall()   // heavy/blocking work off the UI thread\n\n\t\tfyne.Do(func() {                   // <- hop back onto the app goroutine\n\t\t\tif err != nil {\n\t\t\t\tstatus.SetText(\"error: \" + err.Error())\n\t\t\t} else {\n\t\t\t\tstatus.SetText(result)\n\t\t\t}\n\t\t\tbtn.Enable()\n\t\t})\n\t}()\n})" },
        { type: "code", lang: "text", code: "// progress from a worker via a channel + fyne.Do\nprog := widget.NewProgressBar()\ngo func() {\n\tfor i := 0; i <= 100; i++ {\n\t\ttime.Sleep(20 * time.Millisecond)  // pretend work\n\t\tv := float64(i) / 100\n\t\tfyne.Do(func() { prog.SetValue(v) })  // each tick updates on the app goroutine\n\t}\n}()" },
        { type: "list", items: [
          "**Inside a Fyne callback** (button func, OnChanged, menu action, animation tick) → you're already on the app goroutine; **do NOT** wrap in `fyne.Do` (double-queuing / needless overhead).",
          "**Inside a goroutine you spawned** (`go func(){}`, an HTTP handler, a ticker, a channel consumer) → **always** wrap UI mutations in `fyne.Do`.",
          "Use **`fyne.DoAndWait`** only when you must block until the UI change is applied (e.g. you're about to reuse a shared buffer the UI just read); prefer `fyne.Do` otherwise.",
          "Functions passed to `fyne.Do`/`DoAndWait` run **sequentially in submission order** — so ordering across calls is preserved."
        ] },
        { type: "callout", variant: "note", text: "Pre-v2.6 code and old tutorials update widgets straight from goroutines (it *mostly* worked by luck). On v2.6+ that path is a race and can panic. If you're porting old code, wrap those cross-goroutine updates in `fyne.Do`." }
      ]
    },
    {
      id: "data-binding",
      title: "Data binding",
      level: "core",
      body: [
        { type: "p", text: "The **`fyne.io/fyne/v2/data/binding`** package gives you observable values that widgets subscribe to — change the data, the widget refreshes; edit the widget, the data updates (two-way). It removes most manual `SetText`/`Refresh` plumbing." },
        { type: "code", lang: "text", code: "import \"fyne.io/fyne/v2/data/binding\"\n\nname := binding.NewString()             // an observable string\nname.Set(\"Ada\")\n\nentry := widget.NewEntryWithData(name)  // edits flow INTO name\nlabel := widget.NewLabelWithData(name)  // and OUT to any bound widget\n\n// react to changes imperatively\nname.AddListener(binding.NewDataListener(func() {\n\tv, _ := name.Get()\n\tfmt.Println(\"name is now\", v)\n}))\n\n// numeric + typed bindings, with format conversion for a Label\ncount := binding.NewInt()\ncountStr := binding.IntToString(count)\nwidget.NewLabelWithData(countStr)\ncount.Set(42)" },
        { type: "heading", text: "Binding lists to a List widget" },
        { type: "code", lang: "text", code: "items := binding.NewStringList()\nitems.Append(\"one\"); items.Append(\"two\")\n\nlist := widget.NewListWithData(items,\n\tfunc() fyne.CanvasObject { return widget.NewLabel(\"\") },\n\tfunc(di binding.DataItem, o fyne.CanvasObject) {\n\t\to.(*widget.Label).Bind(di.(binding.String))  // bind the cell to its item\n\t},\n)\n// appending later auto-refreshes the visible rows:\nitems.Append(\"three\")" },
        { type: "heading", text: "Struct binding" },
        { type: "p", text: "For slices of structs there's no typed generic list, so use **`binding.NewUntypedList`** (a list of `any`) and type-assert in the update func. For a single struct's fields, bind each field individually (`binding.BindStruct` exists in `fyne-x`), or expose per-field `binding.String`/`Int` values on your model." },
        { type: "code", lang: "text", code: "type Todo struct{ Title string; Done bool }\n\ntodos := binding.NewUntypedList()\ntodos.Append(Todo{Title: \"Ship it\"})\n\nlist := widget.NewListWithData(todos,\n\tfunc() fyne.CanvasObject { return widget.NewCheck(\"\", nil) },\n\tfunc(di binding.DataItem, o fyne.CanvasObject) {\n\t\tv, _ := di.(binding.Untyped).Get()\n\t\tt := v.(Todo)\n\t\tc := o.(*widget.Check)\n\t\tc.Text = t.Title; c.Checked = t.Done; c.Refresh()\n\t},\n)" },
        { type: "callout", variant: "tip", text: "Binding shines for forms and live-updating dashboards. For a one-off label you'll set once, plain `SetText` is simpler. Remember bindings still obey the goroutine rule — calling `.Set(...)` from a background goroutine triggers UI refresh, so wrap it in `fyne.Do`." }
      ]
    },
    {
      id: "navigation",
      title: "Navigation: windows & tabs",
      level: "core",
      body: [
        { type: "p", text: "Structure a multi-screen app with extra windows or tab containers. Any window can be shown independently; tabs keep everything in one window." },
        { type: "code", lang: "text", code: "// multiple windows — all share the one app + event loop\nfunc openDetails(a fyne.App, id int) {\n\tw := a.NewWindow(fmt.Sprintf(\"Item %d\", id))\n\tw.SetContent(widget.NewLabel(\"details...\"))\n\tw.Resize(fyne.NewSize(300, 200))\n\tw.Show()   // NOT ShowAndRun — the loop is already running\n}\n\n// AppTabs: fixed tab bar\ntabs := container.NewAppTabs(\n\tcontainer.NewTabItem(\"Home\", homeContent),\n\tcontainer.NewTabItemWithIcon(\"Settings\", theme.SettingsIcon(), settingsContent),\n)\ntabs.SetTabLocation(container.TabLocationLeading)  // Top/Bottom/Leading/Trailing\n\n// DocTabs: closable, addable document tabs (like editor tabs)\ndocs := container.NewDocTabs(\n\tcontainer.NewTabItem(\"untitled-1\", editor1),\n)\ndocs.CreateTab = func() *container.TabItem {\n\treturn container.NewTabItem(\"new\", widget.NewEntry())\n}\ndocs.OnClosed = func(ti *container.TabItem) { /* handle close */ }" },
        { type: "list", items: [
          "**Extra windows** = `a.NewWindow(...)` then `.Show()`. The app quits when the **master** window closes; mark one with `w.SetMaster()` or the first window is master by default.",
          "**`container.NewAppTabs`** for a stable set of views (Home/Search/Settings). Set icon-only, text-only, or both; reposition the bar with `SetTabLocation`.",
          "**`container.NewDocTabs`** for a dynamic, closable set (open documents) — supports a `+` button via `CreateTab` and an `OnClosed` hook.",
          "For a stack/router pattern, swap the content of a single `container.Stack` and call its `Refresh()` — Fyne has no built-in navigation stack."
        ] }
      ]
    },
    {
      id: "dialogs-menus",
      title: "Dialogs, menus & system tray",
      level: "core",
      body: [
        { type: "p", text: "Modal dialogs come from **`fyne.io/fyne/v2/dialog`**; they overlay their parent window and call back with the user's choice." },
        { type: "code", lang: "text", code: "import \"fyne.io/fyne/v2/dialog\"\n\ndialog.ShowInformation(\"Saved\", \"Your file was saved.\", w)\ndialog.ShowError(err, w)\n\ndialog.ShowConfirm(\"Delete?\", \"This cannot be undone.\", func(ok bool) {\n\tif ok { /* delete */ }\n}, w)\n\n// file picker returns a storage.ReadCloser (or nil if cancelled)\ndialog.ShowFileOpen(func(r fyne.URIReadCloser, err error) {\n\tif err != nil || r == nil { return }\n\tdefer r.Close()\n\tdata, _ := io.ReadAll(r)\n\t_ = data\n}, w)\n// dialog.ShowFileSave(...), dialog.ShowFolderOpen(...) likewise" },
        { type: "heading", text: "Menus" },
        { type: "code", lang: "text", code: "fileMenu := fyne.NewMenu(\"File\",\n\tfyne.NewMenuItem(\"Open\", func() {}),\n\tfyne.NewMenuItemSeparator(),\n\tfyne.NewMenuItem(\"Quit\", func() { a.Quit() }),\n)\nw.SetMainMenu(fyne.NewMainMenu(fileMenu))  // native menu bar (mac) / in-window (else)" },
        { type: "heading", text: "System tray" },
        { type: "p", text: "The tray/menu-extra lives on the **desktop driver** only; type-assert the app to `desktop.App` (a no-op on mobile) and set a tray menu." },
        { type: "code", lang: "text", code: "import \"fyne.io/fyne/v2/driver/desktop\"\n\nif desk, ok := a.(desktop.App); ok {\n\tm := fyne.NewMenu(\"MyApp\",\n\t\tfyne.NewMenuItem(\"Show\", func() { w.Show() }),\n\t\tfyne.NewMenuItem(\"Quit\", func() { a.Quit() }),\n\t)\n\tdesk.SetSystemTrayMenu(m)\n\tdesk.SetSystemTrayIcon(theme.FyneLogo())\n}\n// keep running after the window closes (tray app): w.SetCloseIntercept(func(){ w.Hide() })" },
        { type: "callout", variant: "note", text: "`SetCloseIntercept` lets a tray app hide instead of quit when the window's X is clicked — otherwise closing the master window quits the whole app." }
      ]
    },
    {
      id: "theming",
      title: "Theming & styling",
      level: "core",
      body: [
        { type: "p", text: "Fyne themes are **programmatic**, not CSS: a theme implements the `fyne.Theme` interface (four methods) and answers queries for a color/font/icon/size given a name and the **variant** (dark or light). Embed `theme.DefaultTheme()` and override only what you want." },
        { type: "code", lang: "text", code: "import (\n\t\"image/color\"\n\t\"fyne.io/fyne/v2\"\n\t\"fyne.io/fyne/v2/theme\"\n)\n\ntype myTheme struct{ fyne.Theme } // embeds default; override selectively\n\nfunc (m myTheme) Color(n fyne.ThemeColorName, v fyne.ThemeVariant) color.Color {\n\tif n == theme.ColorNamePrimary {\n\t\treturn color.NRGBA{R: 0x00, G: 0xad, B: 0xd8, A: 0xff} // Go cyan accent\n\t}\n\treturn m.Theme.Color(n, v) // fall through for everything else\n}\nfunc (m myTheme) Size(n fyne.ThemeSizeName) float32 {\n\tif n == theme.SizeNamePadding { return 6 }\n\treturn m.Theme.Size(n)\n}\n\n// apply globally:\na.Settings().SetTheme(myTheme{Theme: theme.DefaultTheme()})\n\n// force a variant regardless of OS:\n// a.Settings().SetTheme(theme.LightTheme())  // or theme.DarkTheme()" },
        { type: "list", items: [
          "**`Color(name, variant)`** — return `color.Color` for names like `theme.ColorNamePrimary`, `ColorNameBackground`, `ColorNameForeground`, `ColorNameButton`. `variant` is `theme.VariantDark`/`VariantLight` so you handle both modes.",
          "**`Font(style)`** — return a `fyne.Resource` for a `fyne.TextStyle` (bold/italic/monospace); this is where you swap in a custom embedded font.",
          "**`Icon(name)`** — override built-in theme icons.",
          "**`Size(name)`** — padding, text size, icon size, etc."
        ] },
        { type: "heading", text: "Embedding a custom font" },
        { type: "code", lang: "text", code: "//go:embed Inter-Regular.ttf\nvar interTTF []byte\nvar interFont = fyne.NewStaticResource(\"Inter-Regular.ttf\", interTTF)\n\nfunc (m myTheme) Font(s fyne.TextStyle) fyne.Resource {\n\tif !s.Bold && !s.Italic && !s.Monospace { return interFont }\n\treturn m.Theme.Font(s)\n}" },
        { type: "callout", variant: "tip", text: "There is no per-widget `style=` / CSS. To restyle one widget differently you either use a wrapping container with its own theme (`container.NewThemeOverride` in `fyne-x`), swap the whole app theme, or build a custom widget. Individual color tweaks usually mean overriding a `ColorName` app-wide." }
      ]
    },
    {
      id: "canvas-animation",
      title: "Canvas primitives & animation",
      level: "core",
      body: [
        { type: "p", text: "Below the widgets sits **`fyne.io/fyne/v2/canvas`** — raw drawable objects you can place, size, and animate: `Text`, `Rectangle`, `Circle`, `Line`, `Image`, `Raster` (per-pixel), `Gradient`. They're `fyne.CanvasObject`s, so they go into containers like widgets." },
        { type: "code", lang: "text", code: "import (\n\t\"image/color\"\n\t\"fyne.io/fyne/v2/canvas\"\n)\n\nrect := canvas.NewRectangle(color.NRGBA{R: 0x00, G: 0xad, B: 0xd8, A: 0xff})\nrect.SetMinSize(fyne.NewSize(100, 60))\nrect.CornerRadius = 8\n\ntxt := canvas.NewText(\"Hello\", color.White)\ntxt.TextSize = 24\ntxt.TextStyle = fyne.TextStyle{Bold: true}\n\nline := canvas.NewLine(color.Gray{Y: 0x99})\nline.StrokeWidth = 2\nimg := canvas.NewImageFromResource(theme.FyneLogo())\nimg.FillMode = canvas.ImageFillContain" },
        { type: "heading", text: "Animation" },
        { type: "p", text: "**`fyne.NewAnimation(duration, fn)`** calls `fn(float32)` with an eased 0→1 progress each frame; convenience helpers animate specific properties. Call **`.Start()`** to run; set `AutoReverse`/`RepeatCount` for loops." },
        { type: "code", lang: "text", code: "import \"time\"\n\n// 1) generic progress animation — move a rectangle across\nanim := fyne.NewAnimation(time.Second, func(p float32) {\n\trect.Move(fyne.NewPos(p*200, 0))\n\tcanvas.Refresh(rect)\n})\nanim.Curve = fyne.AnimationEaseInOut\nanim.Start()\n\n// 2) built-in colour tween red -> blue\nred  := color.NRGBA{R: 0xff, A: 0xff}\nblue := color.NRGBA{B: 0xff, A: 0xff}\ncanvas.NewColorRGBAAnimation(red, blue, 2*time.Second, func(c color.Color) {\n\trect.FillColor = c\n\tcanvas.Refresh(rect)\n}).Start()\n\n// 3) position/size tweens\ncanvas.NewPositionAnimation(fyne.NewPos(0,0), fyne.NewPos(100,0), time.Second,\n\tfunc(p fyne.Position) { rect.Move(p); canvas.Refresh(rect) }).Start()" },
        { type: "callout", variant: "warn", text: "Animation `fn` callbacks run on the app goroutine (safe to touch objects), but call **`canvas.Refresh(obj)`** inside them — mutating `FillColor`/position without a refresh won't repaint. And starting/stopping an animation from a background goroutine still needs `fyne.Do`." }
      ]
    },
    {
      id: "assets",
      title: "Assets & resources (bundle vs go:embed)",
      level: "deep",
      body: [
        { type: "p", text: "For a single self-contained binary you must embed images/fonts/data — there's no assets folder at runtime. Two ways: the `fyne bundle` CLI (emits a `fyne.Resource`) or Go's native `//go:embed`." },
        { type: "code", lang: "bash", code: "# generate a Go file exposing your asset as a *fyne.StaticResource\nfyne bundle -o bundled.go icon.png\n# multiple assets, append to one file:\nfyne bundle -o bundled.go -append logo.svg\n# names become resourceIconPng, resourceLogoSvg, etc." },
        { type: "code", lang: "text", code: "// use the bundled resource\nimg := canvas.NewImageFromResource(resourceIconPng)\nbtn := widget.NewButtonWithIcon(\"\", resourceIconPng, nil)\n\n// --- alternative: native go:embed ---\nimport _ \"embed\"\n\n//go:embed assets/logo.png\nvar logoBytes []byte\nvar logoRes = fyne.NewStaticResource(\"logo.png\", logoBytes)\ncanvas.NewImageFromResource(logoRes)" },
        { type: "callout", variant: "tip", text: "`//go:embed` is the modern default — no codegen step, and it works for whole directories (`//go:embed assets/*`). Use `fyne bundle` when you want a ready-made `fyne.Resource` variable or are embedding the app icon in a way the toolchain expects." }
      ]
    },
    {
      id: "custom-widgets",
      title: "Custom widgets: BaseWidget + WidgetRenderer",
      level: "deep",
      body: [
        { type: "p", text: "When composition of existing widgets isn't enough, build one: embed **`widget.BaseWidget`** for behavior/lifecycle, and implement **`CreateRenderer() fyne.WidgetRenderer`** to describe how it draws. The renderer owns the actual canvas objects and how they lay out." },
        { type: "code", lang: "text", code: "type Badge struct {\n\twidget.BaseWidget\n\tText string\n}\n\nfunc NewBadge(t string) *Badge {\n\tb := &Badge{Text: t}\n\tb.ExtendBaseWidget(b)   // REQUIRED: wires the base widget to this concrete type\n\treturn b\n}\n\nfunc (b *Badge) CreateRenderer() fyne.WidgetRenderer {\n\tbg := canvas.NewRectangle(color.NRGBA{R: 0x00, G: 0xad, B: 0xd8, A: 0xff})\n\tbg.CornerRadius = 10\n\tlabel := canvas.NewText(b.Text, color.White)\n\tlabel.Alignment = fyne.TextAlignCenter\n\treturn &badgeRenderer{badge: b, bg: bg, label: label,\n\t\tobjects: []fyne.CanvasObject{bg, label}}\n}\n\ntype badgeRenderer struct {\n\tbadge   *Badge\n\tbg      *canvas.Rectangle\n\tlabel   *canvas.Text\n\tobjects []fyne.CanvasObject\n}\n\nfunc (r *badgeRenderer) Layout(s fyne.Size) {\n\tr.bg.Resize(s); r.label.Resize(s)\n}\nfunc (r *badgeRenderer) MinSize() fyne.Size {\n\treturn fyne.NewSize(r.label.MinSize().Width+20, 28)\n}\nfunc (r *badgeRenderer) Refresh() {\n\tr.label.Text = r.badge.Text\n\tcanvas.Refresh(r.badge)\n}\nfunc (r *badgeRenderer) Objects() []fyne.CanvasObject { return r.objects }\nfunc (r *badgeRenderer) Destroy() {}" },
        { type: "list", items: [
          "**`ExtendBaseWidget(self)`** in your constructor is mandatory — forget it and `CreateRenderer` never fires (blank widget).",
          "The renderer implements exactly five methods: **`Layout`, `MinSize`, `Refresh`, `Objects`, `Destroy`**.",
          "To make it interactive, implement driver interfaces on the widget: `desktop.Hoverable` (`MouseIn/Out/Moved`), `fyne.Tappable` (`Tapped`), `desktop.Mouseable`, etc.",
          "Call **`b.Refresh()`** on the widget after mutating fields to trigger `renderer.Refresh()`."
        ] }
      ]
    },
    {
      id: "storage-prefs",
      title: "Storage & preferences",
      level: "core",
      body: [
        { type: "p", text: "**Preferences** are the simple key/value store for settings (backed by a per-app file in the OS config dir). They require an app **ID**, so create the app with `app.NewWithID`." },
        { type: "code", lang: "text", code: "a := app.NewWithID(\"com.example.myapp\")  // ID required for Preferences\np := a.Preferences()\n\np.SetString(\"username\", \"ada\")\nname := p.StringWithFallback(\"username\", \"guest\")\np.SetInt(\"launches\", p.Int(\"launches\")+1)\np.SetBool(\"darkMode\", true)\n\n// bind a preference straight to a widget\nthemePref := binding.BindPreferenceBool(\"darkMode\", p)\nwidget.NewCheckWithData(\"Dark mode\", themePref)" },
        { type: "heading", text: "The storage API (files/URIs)" },
        { type: "p", text: "For real files, Fyne abstracts over a **`fyne.URI`** so the same code works on desktop and sandboxed mobile. `dialog.ShowFileOpen` hands you a `URIReadCloser`; the `storage` package reads/writes/lists by URI, and `app.Storage()` gives a private per-app document root." },
        { type: "code", lang: "text", code: "import \"fyne.io/fyne/v2/storage\"\n\n// app-private document storage (works on mobile sandboxes)\nroot := a.Storage().RootURI()\nchild, _ := storage.Child(root, \"notes.txt\")\nw, _ := storage.Writer(child)\nw.Write([]byte(\"hello\")); w.Close()\n\n// read back\nr, _ := storage.Reader(child)\ndata, _ := io.ReadAll(r); r.Close()\n_ = data" },
        { type: "callout", variant: "note", text: "Don't use `os.Open`/absolute paths on mobile — those sandboxes forbid arbitrary filesystem access. The `storage` URI API + `dialog.ShowFileOpen` are the portable way, and Preferences is best for small settings (not large blobs)." }
      ]
    },
    {
      id: "packaging",
      title: "Packaging & distribution",
      level: "core",
      body: [
        { type: "p", text: "`go build` gives a bare binary with no icon/metadata (and won't produce a `.app`/`.apk`). The **`fyne` CLI** packages a proper artifact per OS, embedding the icon and metadata from **`FyneApp.toml`**." },
        { type: "code", lang: "toml", code: "# FyneApp.toml (in your main package dir) — read by `fyne package`\n[Details]\n  Icon = \"Icon.png\"\n  Name = \"My App\"\n  ID = \"com.example.myapp\"\n  Version = \"1.0.0\"\n  Build = 1" },
        { type: "code", lang: "bash", code: "# desktop packages (run on the target OS, or cross-compile — see below)\nfyne package -os windows -icon Icon.png   # -> MyApp.exe (icon embedded)\nfyne package -os darwin  -icon Icon.png   # -> MyApp.app bundle\nfyne package -os linux   -icon Icon.png   # -> .tar.xz with desktop entry\n\n# install into the local system (adds menu entry / Applications)\nfyne install\n\n# mobile\nfyne package -os android -appID com.example.myapp  # -> .apk (needs Android NDK)\nfyne package -os ios     -appID com.example.myapp  # -> needs Xcode + signing\n\n# WebAssembly\nfyne package -os wasm     # or: fyne serve  (local dev server)\n\n# signed store-ready builds\nfyne release -os android -appID com.example.myapp -appVersion 1.0.0 -appBuild 1" },
        { type: "callout", variant: "warn", text: "**Cross-compilation is the hard part** because desktop Fyne uses cgo — you need the *target's* C toolchain + GL headers, not just `GOOS=windows`. Plain `GOOS`/`GOARCH` will fail to link. The pragmatic answer is **`fyne-cross`** (`github.com/fyne-io/fyne-cross`), which runs the build inside Docker images that already have each target's toolchain." },
        { type: "code", lang: "bash", code: "go install github.com/fyne-io/fyne-cross@latest\nfyne-cross windows -arch=amd64      # cross-build a Windows exe from Linux/mac in Docker\nfyne-cross android -app-id com.example.myapp" },
        { type: "list", items: [
          "**Binary size**: Fyne apps are 15–40 MB — they statically include the toolkit, fonts, and GL glue. Strip with `-ldflags \"-s -w\"` and compress with `upx` if it matters; there's no way to make them tiny.",
          "**macOS** distribution needs code-signing + notarization; **iOS** needs an Apple developer account and provisioning profiles via `fyne release`.",
          "**Windows**: `fyne package` produces a GUI subsystem exe (no console window) automatically.",
          "Commit **`FyneApp.toml`** so every build/CI run gets consistent icon/metadata."
        ] }
      ]
    },
    {
      id: "gio-contrast",
      title: "The other paradigm: a taste of Gio",
      level: "deep",
      body: [
        { type: "p", text: "**Gio** (`gioui.org`) is the major alternative and it's a fundamentally different mental model: **immediate mode**. There's no retained widget tree to mutate — every frame, your code re-emits the entire UI from current state into an `op.Ops` operation list, and Gio renders it on the GPU. It's lower-level and faster, but you own more plumbing." },
        { type: "code", lang: "text", code: "package main\n\nimport (\n\t\"gioui.org/app\"\n\t\"gioui.org/font/gofont\"\n\t\"gioui.org/layout\"\n\t\"gioui.org/op\"\n\t\"gioui.org/widget\"\n\t\"gioui.org/widget/material\"\n)\n\nfunc main() {\n\tgo func() {\n\t\tw := new(app.Window)\n\t\tth := material.NewTheme()\n\t\tth.Shaper = gofont.Collection()\n\t\tvar btn widget.Clickable\n\t\tvar ops op.Ops\n\t\tfor {\n\t\t\tswitch e := w.Event().(type) {\n\t\t\tcase app.DestroyEvent:\n\t\t\t\treturn\n\t\t\tcase app.FrameEvent:\n\t\t\t\tgtx := app.NewContext(&ops, e)\n\t\t\t\tif btn.Clicked(gtx) { /* handle */ }\n\t\t\t\t// rebuild the WHOLE UI every frame from state:\n\t\t\t\tmaterial.Button(th, &btn, \"Click me\").Layout(gtx)\n\t\t\t\te.Frame(gtx.Ops)\n\t\t\t}\n\t\t}\n\t}()\n\tapp.Main()\n}" },
        { type: "table", headers: ["Aspect", "Fyne (retained)", "Gio (immediate)"], rows: [
          ["Build the UI", "once; mutate + `Refresh()`", "re-emit every frame from state"],
          ["State model", "widgets hold state", "you hold all state; widgets are structs you own"],
          ["Learning curve", "gentle, familiar", "steep, game-loop-like"],
          ["Perf ceiling", "high (v2.6 threading)", "very high (GPU, low alloc)"],
          ["Styling", "theme interface", "you compose layout ops directly"]
        ] },
        { type: "callout", variant: "note", text: "Reach for Gio when you're drawing something custom, animation-heavy, or performance-critical and are comfortable managing your own state and event loop. For typical forms-and-lists apps, Fyne's retained model is far less code." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns, most of which bite exactly once before you internalize them." },
        { type: "heading", text: "1. Updating widgets from a goroutine without fyne.Do" },
        { type: "callout", variant: "warn", text: "The #1 Fyne bug. Calling `label.SetText`/`Refresh`/`binding.Set` from a goroutine you started races the app goroutine and (on v2.6+) panics with a thread warning. **Fix:** wrap every cross-goroutine UI mutation in `fyne.Do(func(){ ... })` (or `fyne.DoAndWait`). Inside Fyne callbacks you're already on the app goroutine — don't double-wrap." },
        { type: "heading", text: "2. cgo / C-compiler build failures on desktop" },
        { type: "callout", variant: "gotcha", text: "`exec: gcc: not found` or `cannot find -lGL`: desktop Fyne needs a C compiler + OpenGL headers. **Fix:** install the toolchain (TDM-GCC/MSYS2 on Windows, Xcode CLT on mac, `gcc libgl1-mesa-dev xorg-dev` on Debian). Run `fyne env` to confirm." },
        { type: "heading", text: "3. Missing OpenGL on headless / CI" },
        { type: "callout", variant: "gotcha", text: "Tests or builds fail on a headless server with GLX/`could not create GL context` errors. **Fix:** run under a virtual framebuffer (`xvfb-run go test ./...`), or use the software renderer with `test.NewApp()`/`FYNE_DRIVER` for unit tests that don't need a real GPU." },
        { type: "heading", text: "4. Forgetting ShowAndRun / Run" },
        { type: "callout", variant: "gotcha", text: "The window flashes and exits, or never appears. **Fix:** one window must call `w.ShowAndRun()` (or `w.Show()` + `a.Run()`); it blocks and drives the event loop. Extra windows use `.Show()` only." },
        { type: "heading", text: "5. Cross-compilation just failing" },
        { type: "callout", variant: "warn", text: "Setting `GOOS=windows go build` on Linux errors because cgo can't find the target C toolchain. **Fix:** use **`fyne-cross`** (Docker-based, ships each target's toolchain) rather than raw `GOOS`/`GOARCH`." },
        { type: "heading", text: "6. Huge binary size" },
        { type: "callout", variant: "note", text: "15–40 MB binaries are normal — the toolkit, fonts and GL glue are statically linked. **Fix (partial):** build with `-ldflags \"-s -w\"` to strip symbols, optionally `upx` the result. You can't get it tiny; budget for it." },
        { type: "heading", text: "7. Blurry rendering / wrong scale" },
        { type: "callout", variant: "gotcha", text: "The UI looks too big/small or fuzzy on some displays. **Fix:** override the scale with the `FYNE_SCALE` env var (e.g. `FYNE_SCALE=1.2`), or let users adjust it in the app's built-in settings. Fyne auto-detects DPI but multi-monitor setups sometimes need a nudge." },
        { type: "heading", text: "8. Refresh() vs rebuilding the tree" },
        { type: "callout", variant: "gotcha", text: "You mutate a `canvas`/widget field but nothing repaints. **Fix:** mutating a field doesn't auto-render — call the object's `Refresh()` (or `canvas.Refresh(obj)`). Conversely, don't rebuild the whole container to change one label; mutate + `Refresh` is far cheaper." },
        { type: "heading", text: "9. Collection create-func capturing per-row state" },
        { type: "callout", variant: "gotcha", text: "List/Table rows show stale/duplicated data because you put row logic in the **create** callback. **Fix:** create returns a bare template; ALL per-row binding happens in the **update** callback, since rows are recycled." },
        { type: "heading", text: "10. Preferences returning empty / panicking" },
        { type: "callout", variant: "gotcha", text: "`a.Preferences()` does nothing useful when the app was built with `app.New()`. **Fix:** create it with `app.NewWithID(\"com.example.app\")` — the ID keys the preferences file." },
        { type: "heading", text: "11. StaticResource / image not showing" },
        { type: "callout", variant: "note", text: "An embedded image is blank because the path/name was wrong or you passed raw bytes where a `fyne.Resource` was expected. **Fix:** wrap bytes with `fyne.NewStaticResource(name, bytes)` (or use `fyne bundle`), and feed that to `canvas.NewImageFromResource` / `widget.NewIcon`." },
        { type: "heading", text: "12. Assuming os.Open works on mobile" },
        { type: "callout", variant: "warn", text: "Absolute filesystem paths fail on Android/iOS sandboxes. **Fix:** use the `storage` URI API + `a.Storage()` for private files and `dialog.ShowFileOpen` for user files — portable across desktop and mobile." }
      ]
    }
  ],

  packages: [
    { name: "fyne.io/fyne/v2", why: "the toolkit itself — `app`, `widget`, `container`, `canvas`, `theme`, `dialog`, `data/binding`, `storage` subpackages" },
    { name: "fyne.io/tools/cmd/fyne", why: "the CLI (v2.6-era module path): `package`, `install`, `release`, `bundle`, `serve`, `env`, `translate`" },
    { name: "github.com/fyne-io/fyne-cross", why: "Docker-based cross-compiler that carries each target's cgo/GL toolchain — the sane way to cross-build" },
    { name: "fyne.io/x/fyne (fyne-x)", why: "community extras: extra widgets (Animated GIF, Calendar, Map), responsive layout, theme overrides, struct binding" },
    { name: "fyne.io/fyne/v2/data/binding", why: "observable values + list bindings for two-way data binding (`NewString`, `NewStringList`, `NewUntypedList`)" },
    { name: "fyne.io/fyne/v2/driver/desktop", why: "desktop-only interfaces: system tray (`desktop.App`), hover/mouse events for custom widgets" },
    { name: "fyne.io/fyne/v2/test", why: "headless test app + helpers (`test.NewApp`, `test.Tap`) for unit-testing UIs without a GPU" },
    { name: "gioui.org", why: "Gio — the immediate-mode, GPU-accelerated alternative toolkit (desktop + mobile + WASM)" },
    { name: "github.com/wailsapp/wails/v2", why: "Wails — Go backend with a web/JS frontend in a native webview (Electron/Tauri-style)" },
    { name: "github.com/lxn/walk", why: "Walk — native Win32 widget bindings for Windows-only desktop apps" },
    { name: "github.com/maxence-charriere/go-app/v10", why: "go-app — build WASM/PWA front-ends entirely in Go with a component model" },
    { name: "github.com/diamondburned/gotk4", why: "modern cgo bindings to native GTK4 (Linux-first true-native look)" },
    { name: "github.com/andlabs/ui / libui", why: "small native-widget bindings (maintenance-mode) — historical native-look option" }
  ],

  gotchas: [
    "**Never touch UI from your own goroutine** — wrap mutations in `fyne.Do(...)` / `fyne.DoAndWait(...)` (v2.6+). Direct `SetText`/`Refresh` from a background goroutine races and panics. Inside Fyne callbacks you're already on the app goroutine — don't wrap.",
    "**Desktop needs cgo:** a C compiler + OpenGL headers must be installed to build. `gcc: not found` / `cannot find -lGL` means your toolchain is missing.",
    "**Cross-compiling with plain `GOOS`/`GOARCH` fails** because of cgo. Use `fyne-cross` (Docker) which bundles each target's toolchain.",
    "**Forgetting `ShowAndRun()`/`Run()`** leaves you with a flashing or invisible window — one window must drive the blocking event loop.",
    "**The CLI moved:** install from `fyne.io/tools/cmd/fyne`, not the deprecated `fyne.io/fyne/v2/cmd/fyne`.",
    "**Collection widgets:** put row logic in the **update** callback, never **create** — rows are recycled, so create-side state leaks/duplicates.",
    "**Mutating a field doesn't repaint** — call `obj.Refresh()` (or `canvas.Refresh(obj)`). But don't rebuild the whole tree for one change either.",
    "**Preferences need `app.NewWithID(\"com.example.app\")`** — `app.New()` gives no persistent ID and preferences won't store.",
    "**Binaries are 15–40 MB** (statically linked toolkit + fonts + GL). Strip with `-ldflags \"-s -w\"`; they'll never be tiny.",
    "**Blurry / wrong size** on some displays: override with the `FYNE_SCALE` env var; multi-monitor DPI detection sometimes needs a nudge.",
    "**Headless CI** fails to create a GL context — run tests under `xvfb-run` or use `test.NewApp()` (software renderer).",
    "**Mobile sandboxes** forbid `os.Open`/absolute paths — use the `storage` URI API + `a.Storage()` and `dialog.ShowFileOpen`.",
    "**Custom widgets:** call `ExtendBaseWidget(self)` in the constructor or `CreateRenderer` never fires and you get a blank widget.",
    "**Old tutorials update widgets from goroutines directly** — that pattern was always unsafe and now panics on v2.6+. Port them to `fyne.Do`."
  ],

  flashcards: [
    { q: "When would you pick Fyne over the other Go GUI options?", a: "You want one Go codebase across **desktop + mobile** with the least friction and a consistent look. Fyne is pure-Go, renders its own OpenGL canvas, and packages Windows/mac/Linux/Android/iOS/WASM. Trade-off: looks like Fyne, not pixel-native." },
    { q: "Fyne vs Gio — the core difference?", a: "**Fyne is retained-mode** (build a widget tree once, mutate + `Refresh()`), **Gio is immediate-mode** (re-emit the whole UI every frame from state, GPU-rendered). Gio is faster/lower-level; Fyne is far less code for typical apps." },
    { q: "What does Fyne need to build on desktop that surprises Go devs?", a: "**cgo** — a C compiler and OpenGL headers (its GL driver is cgo). Pure `go build` on a bare box fails; `fyne env` checks the toolchain." },
    { q: "The minimal Fyne app in one line of API each?", a: "`a := app.New()`; `w := a.NewWindow(\"t\")`; `w.SetContent(obj)`; `w.ShowAndRun()`. The last call blocks and runs the event loop." },
    { q: "How do you install the Fyne CLI (and what changed)?", a: "`go install fyne.io/tools/cmd/fyne@latest`. The module **moved to `fyne.io/tools`** from the deprecated `fyne.io/fyne/v2/cmd/fyne`." },
    { q: "The #1 Fyne threading rule?", a: "Any goroutine **you** start must not touch UI objects directly — wrap mutations in `fyne.Do(fn)` (or `fyne.DoAndWait`) to run on the app goroutine. Fyne's own callbacks already run there." },
    { q: "fyne.Do vs fyne.DoAndWait?", a: "`fyne.Do` queues the UI update and returns immediately (fire-and-forget). `fyne.DoAndWait` blocks your goroutine until it's applied — use it only when the next step depends on the update finishing." },
    { q: "How do Fyne's List/Table widgets scale to big data?", a: "They're **virtualized** with a create/update pair: `create` returns one template row; `update(i, obj)` binds data into a recycled row. Only visible cells exist. Put all per-row logic in `update`." },
    { q: "How does data binding work in Fyne?", a: "`binding.NewString/Int/...` are observable values; `widget.NewEntryWithData`/`NewLabelWithData` two-way-bind to them. Lists use `binding.NewStringList`/`NewUntypedList` + `widget.NewListWithData`." },
    { q: "Which containers cover most layouts?", a: "`container.NewVBox/HBox`, `NewBorder(t,b,l,r,center)`, `NewGridWithColumns/Rows`, `NewStack` (was `NewMax`), `NewGridWrap(size,...)`, plus `layout.NewSpacer()` to push things apart." },
    { q: "How is theming done in Fyne (vs CSS)?", a: "Programmatically: implement the `fyne.Theme` interface (`Color/Font/Icon/Size`), embed `theme.DefaultTheme()`, override selectively, then `a.Settings().SetTheme(...)`. `Color` gets the dark/light `variant`. No per-widget CSS." },
    { q: "How do you build a custom widget?", a: "Embed `widget.BaseWidget`, call `ExtendBaseWidget(self)` in the constructor, and implement `CreateRenderer() fyne.WidgetRenderer` — the renderer implements `Layout/MinSize/Refresh/Objects/Destroy`." },
    { q: "How do you package a Fyne app per platform?", a: "`fyne package -os windows|darwin|linux|android|ios|wasm` (metadata from `FyneApp.toml`), `fyne install` locally, `fyne release` for signed store builds." },
    { q: "Why does cross-compilation need fyne-cross?", a: "Desktop Fyne uses cgo, so `GOOS=windows go build` can't find the target's C/GL toolchain. `fyne-cross` runs the build in Docker images that carry each target's toolchain." },
    { q: "How do you persist small settings vs files, portably?", a: "Settings: `app.NewWithID(...)` then `a.Preferences().SetString/Int/Bool`. Files: the `storage` URI API + `a.Storage()` (works in mobile sandboxes) and `dialog.ShowFileOpen`, not `os.Open`." },
    { q: "Why did my animated/mutated canvas object not repaint?", a: "Mutating a field (color, position) doesn't auto-render — call `canvas.Refresh(obj)` (or the widget's `Refresh()`). In animations, refresh inside the tick callback." }
  ],

  cheatsheet: [
    { label: "Install", code: "go get fyne.io/fyne/v2@latest\ngo install fyne.io/tools/cmd/fyne@latest" },
    { label: "Minimal app", code: "a := app.New()\nw := a.NewWindow(\"App\")\nw.SetContent(widget.NewLabel(\"Hi\"))\nw.ShowAndRun()" },
    { label: "Button + entry", code: "e := widget.NewEntry()\nb := widget.NewButton(\"Go\", func() { fmt.Println(e.Text) })" },
    { label: "Layout shell", code: "container.NewBorder(top, bottom, nil, nil, center)" },
    { label: "VBox + spacer", code: "container.NewHBox(a, layout.NewSpacer(), b)" },
    { label: "Update from goroutine", code: "go func() { r := work(); fyne.Do(func() { lbl.SetText(r) }) }()" },
    { label: "Data binding", code: "s := binding.NewString(); s.Set(\"x\")\nwidget.NewEntryWithData(s)" },
    { label: "List (virtualized)", code: "widget.NewList(func() int { return len(d) },\n  func() fyne.CanvasObject { return widget.NewLabel(\"\") },\n  func(i int, o fyne.CanvasObject) { o.(*widget.Label).SetText(d[i]) })" },
    { label: "Tabs", code: "container.NewAppTabs(container.NewTabItem(\"A\", c1), container.NewTabItem(\"B\", c2))" },
    { label: "Dialog", code: "dialog.ShowConfirm(\"?\", \"sure\", func(ok bool) {}, w)" },
    { label: "Menu", code: "w.SetMainMenu(fyne.NewMainMenu(fyne.NewMenu(\"File\",\n  fyne.NewMenuItem(\"Quit\", func() { a.Quit() }))))" },
    { label: "Theme", code: "a.Settings().SetTheme(myTheme{Theme: theme.DefaultTheme()})" },
    { label: "Animation", code: "canvas.NewColorRGBAAnimation(red, blue, time.Second,\n  func(c color.Color) { r.FillColor = c; canvas.Refresh(r) }).Start()" },
    { label: "Preferences", code: "a := app.NewWithID(\"com.example.app\")\na.Preferences().SetString(\"k\", \"v\")" },
    { label: "Embed asset", code: "//go:embed logo.png\nvar b []byte\nvar res = fyne.NewStaticResource(\"logo.png\", b)" },
    { label: "Package", code: "fyne package -os windows -icon Icon.png\nfyne package -os android -appID com.example.app" },
    { label: "Cross-build", code: "fyne-cross windows -arch=amd64" }
  ]
});
