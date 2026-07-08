(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "tkinter",
  name: "Tkinter",
  language: "Python",
  group: "Python",
  color: "#3776ab",
  readMinutes: 26,
  tagline: "Python's **built-in** desktop GUI toolkit — a thin, cross-platform wrapper over **Tcl/Tk**. Zero install, ships with CPython, and with **ttk** it can look genuinely modern.",

  sections: [
    {
      id: "overview",
      title: "Overview & when to reach for it",
      level: "core",
      body: [
        { type: "p", text: "**Tkinter** is Python's standard-library GUI toolkit. It is a thin Python binding over **Tcl/Tk** — a mature C GUI library (Tk) driven by the Tcl scripting language. When you call `tk.Button(...)`, Tkinter marshals that into Tcl commands sent to an embedded Tcl interpreter, which draws native-ish widgets on Windows, macOS and Linux. You don't write Tcl; you just get its widgets." },
        { type: "list", items: [
          "**Batteries included:** it's part of CPython — `import tkinter` works with no `pip install`. Nothing else in the Python GUI world is truly zero-dependency.",
          "**Cross-platform:** the same code runs on Windows/macOS/Linux. Tk draws its own widgets (with some native theming), so look is *similar* everywhere rather than pixel-perfect native.",
          "**Small & fast to start:** a working window is ~5 lines. Great for internal tools, quick utilities, config screens, teaching, and wrapping a script in a UI.",
          "**Two widget families:** the classic `tkinter` widgets (1990s look) and **`tkinter.ttk`** — themed widgets that respect the OS theme. Prefer **ttk** for anything user-facing."
        ] },
        { type: "table", headers: ["Use Tkinter when…", "Reach for PySide6/PyQt or a web UI when…"], rows: [
          ["You want a simple tool shipped fast with no deps", "You need a polished, complex, data-dense desktop app"],
          ["A few forms, buttons, a table, a canvas", "Rich models/views, dockable panels, charts, native widgets"],
          ["Internal/admin/dev tooling, teaching", "A commercial product where UI quality is the point"],
          ["You want the smallest possible install footprint", "You need QML, GPU rendering, or advanced layouts"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets **Python 3.12 / 3.13** with the bundled **Tcl/Tk 8.6**. The `ttk` themed widgets and `tkinter.font` niceties are all standard. Tk 9.0 exists upstream but CPython still ships 8.6 as of mid-2026." },
        { type: "callout", variant: "tip", text: "Verify your install and see the Tk version with `python -m tkinter` — it pops a tiny demo window printing the Tcl/Tk version. If that fails on Linux, your Python was built without Tk; install the OS package (`sudo apt install python3-tk`)." }
      ]
    },
    {
      id: "hello",
      title: "Hello, window: root, a widget & mainloop",
      level: "core",
      body: [
        { type: "p", text: "Every Tkinter app has exactly one **root window**, created with `tk.Tk()`. You add widgets as children, place them with a geometry manager, then call `root.mainloop()` — the **event loop** that keeps the window alive, dispatches clicks/keys/redraws, and only returns when the window closes." },
        { type: "code", lang: "python", code: "import tkinter as tk\n\nroot = tk.Tk()                     # the one root window\nroot.title(\"Hello Tkinter\")\nroot.geometry(\"320x160\")           # WIDTHxHEIGHT+X+Y (pixels)\n\nlabel = tk.Label(root, text=\"Hello, world!\")\nlabel.pack(padx=20, pady=20)       # add it to the window (pack geometry manager)\n\nbutton = tk.Button(root, text=\"Quit\", command=root.destroy)\nbutton.pack()\n\nroot.mainloop()                    # blocks here, running the event loop, until window closes" },
        { type: "list", items: [
          "**`tk.Tk()`** creates the interpreter + main window. Create it once; a second `Tk()` starts a second Tcl interpreter and causes weird bugs. For extra windows use `tk.Toplevel()`.",
          "**Widget constructor** always takes its parent as the first argument: `tk.Label(root, ...)`. The parent-child tree mirrors the visual nesting.",
          "**`.pack()` / `.grid()` / `.place()`** make a widget actually appear — creating a widget does *not* display it.",
          "**`root.mainloop()`** is a blocking call. Code after it runs only after the window closes. All your logic must run inside callbacks the loop fires."
        ] },
        { type: "callout", variant: "note", text: "The event loop is cooperative and single-threaded: it processes one event (a click, a keypress, a timer, a redraw) at a time. Anything slow you do inside a callback blocks the whole UI until it returns — the root cause of \"frozen window\" bugs (see Concurrency)." }
      ]
    },
    {
      id: "widgets",
      title: "The widget tour (classic + ttk)",
      level: "core",
      body: [
        { type: "p", text: "Widgets are the building blocks. Below are the classic `tk.*` widgets you'll use constantly. Configure them at construction (`tk.Label(root, text=\"x\", fg=\"red\")`) or later with `widget.config(text=\"y\")` / `widget[\"text\"] = \"y\"`." },
        { type: "table", headers: ["Widget", "What it is"], rows: [
          ["`Label`", "static text or image"],
          ["`Button`", "clickable button; `command=` fires a callback"],
          ["`Entry`", "single-line text input"],
          ["`Text`", "multi-line rich text editor (tags, colors, wrapping)"],
          ["`Frame`", "invisible container for grouping/laying out other widgets"],
          ["`Checkbutton`", "on/off toggle bound to a `BooleanVar`/`IntVar`"],
          ["`Radiobutton`", "one-of-many choice; group by sharing one `variable`"],
          ["`Scale`", "slider for a numeric range"],
          ["`Listbox`", "scrollable list of selectable string rows"],
          ["`Spinbox`", "entry with up/down steppers for a range"],
          ["`Canvas`", "free-form drawing surface (shapes, lines, images, animation)"],
          ["`Menu`", "menu bars, dropdowns, and right-click context menus"]
        ] },
        { type: "code", lang: "python", code: "import tkinter as tk\n\nroot = tk.Tk()\n\ntk.Label(root, text=\"Name:\").pack(anchor=\"w\")\nentry = tk.Entry(root)\nentry.pack(fill=\"x\")\n\ntxt = tk.Text(root, height=4, width=40)\ntxt.pack()\ntxt.insert(\"1.0\", \"Multi-line text.\\nLine 2.\")   # index = \"line.column\"\n\ntk.Scale(root, from_=0, to=100, orient=\"horizontal\").pack(fill=\"x\")\n\nlb = tk.Listbox(root)\nfor item in [\"apple\", \"banana\", \"cherry\"]:\n    lb.insert(\"end\", item)\nlb.pack()\n\nroot.mainloop()" },
        { type: "heading", text: "ttk — the themed widgets (prefer these)" },
        { type: "p", text: "**`tkinter.ttk`** provides drop-in replacements that follow the OS theme and look modern: `ttk.Button`, `ttk.Entry`, `ttk.Label`, `ttk.Frame`, `ttk.Checkbutton`, `ttk.Radiobutton`, `ttk.Combobox` (dropdown select), `ttk.Progressbar`, `ttk.Notebook` (tabs), `ttk.Treeview` (table/tree), `ttk.Separator`, `ttk.Scale`, `ttk.Spinbox`. Import ttk and prefer it for anything the user sees." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\n\nroot = tk.Tk()\nfrm = ttk.Frame(root, padding=12)\nfrm.pack(fill=\"both\", expand=True)\n\nttk.Label(frm, text=\"Framework:\").pack(anchor=\"w\")\ncombo = ttk.Combobox(frm, values=[\"Tkinter\", \"PySide6\", \"wxPython\"])\ncombo.current(0)                         # select first item\ncombo.pack(fill=\"x\", pady=4)\n\nttk.Progressbar(frm, value=60, maximum=100).pack(fill=\"x\", pady=4)\nttk.Button(frm, text=\"Go\").pack()\n\nroot.mainloop()" },
        { type: "callout", variant: "gotcha", text: "ttk widgets are styled differently from classic ones: you can't just pass `fg=`/`bg=` to a `ttk.Button` — visual options go through `ttk.Style()` (see the Styling section). Classic and ttk widgets can coexist, but a mixed screen often looks inconsistent — pick one family per window." }
      ]
    },
    {
      id: "geometry",
      title: "Geometry managers: pack, grid & place",
      level: "core",
      body: [
        { type: "p", text: "This is the central layout concept. A widget doesn't position itself — a **geometry manager** on its parent arranges it. Tkinter has three, and you choose **one per container**." },
        { type: "table", headers: ["Manager", "Model", "Use it for"], rows: [
          ["`pack`", "stack children along a side (top/bottom/left/right)", "simple stacks, toolbars, quick layouts"],
          ["`grid`", "rows & columns like a table", "forms and most real UIs — the workhorse"],
          ["`place`", "absolute/relative x,y coordinates", "rare: overlays, custom drawing, precise pixel control"]
        ] },
        { type: "callout", variant: "warn", text: "**The golden rule: never mix `pack` and `grid` in the same container.** Doing so makes Tkinter loop forever negotiating geometry and the window hangs. It's fine to `pack` a Frame and then use `grid` *inside* that Frame — the rule is per-container, not per-app. Different containers can use different managers." },
        { type: "heading", text: "pack" },
        { type: "code", lang: "python", code: "# pack stacks widgets against a side of the remaining space\ntk.Label(root, text=\"Top\").pack(side=\"top\", fill=\"x\")\ntk.Label(root, text=\"Left\").pack(side=\"left\", fill=\"y\")\ntk.Button(root, text=\"OK\").pack(side=\"bottom\", pady=8)\n# fill=\"x\"/\"y\"/\"both\" stretches the widget; expand=True gives it extra space" },
        { type: "heading", text: "grid — and making it resize" },
        { type: "p", text: "`grid` places widgets at `row=`/`column=`. **`sticky=`** anchors/stretches a widget within its cell (compass directions `\"nsew\"`). To make a row/column actually grow when the window is resized, give it **weight** via `columnconfigure`/`rowconfigure` — this is the #1 thing beginners miss." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\n\nroot = tk.Tk()\nroot.title(\"Login\")\n\n# a form: labels in col 0, inputs in col 1\nttk.Label(root, text=\"User:\").grid(row=0, column=0, sticky=\"e\", padx=6, pady=6)\nuser = ttk.Entry(root)\nuser.grid(row=0, column=1, sticky=\"ew\", padx=6, pady=6)\n\nttk.Label(root, text=\"Pass:\").grid(row=1, column=0, sticky=\"e\", padx=6, pady=6)\npw = ttk.Entry(root, show=\"*\")\npw.grid(row=1, column=1, sticky=\"ew\", padx=6, pady=6)\n\nttk.Button(root, text=\"Log in\").grid(row=2, column=1, sticky=\"e\", padx=6, pady=6)\n\n# make column 1 (the inputs) absorb extra horizontal space on resize\nroot.columnconfigure(1, weight=1)\n\nroot.mainloop()" },
        { type: "list", items: [
          "**`sticky=\"ew\"`** = stretch east-west (fill width); **`\"nsew\"`** = fill the whole cell. Without sticky, a widget sits centered at its natural size.",
          "**`columnconfigure(i, weight=n)`** / **`rowconfigure(i, weight=n)`** distribute *extra* space to that row/column proportionally. Weight 0 (default) = never grows.",
          "**`columnspan=` / `rowspan=`** let a widget cover multiple cells (like HTML `colspan`).",
          "**`padx`/`pady`** add outer spacing; **`ipadx`/`ipady`** add inner padding."
        ] },
        { type: "callout", variant: "tip", text: "Reach for **`grid`** for almost everything with more than one row of controls — it's declarative and resizes cleanly. Use `pack` for trivial stacks and toolbars. Use `place` only when you genuinely need absolute coordinates (e.g. a widget layered on a Canvas)." }
      ]
    },
    {
      id: "events",
      title: "Events & callbacks: command vs bind",
      level: "core",
      body: [
        { type: "p", text: "Interactivity comes from two mechanisms: the **`command=`** option (for buttons/menus/checkbuttons — a zero-arg callable) and **`.bind()`** (for any widget, any low-level event like clicks and keystrokes). Both hand control to the event loop, which calls your function when the event fires." },
        { type: "code", lang: "python", code: "import tkinter as tk\n\nroot = tk.Tk()\n\ndef on_click():\n    print(\"clicked\")\n\n# command= takes the function itself, NOT a call\ntk.Button(root, text=\"Click\", command=on_click).pack()\n\n# .bind(event, handler) — handler receives an event object\ndef on_key(event):\n    print(\"key:\", event.char, \"keysym:\", event.keysym)\n\nentry = tk.Entry(root)\nentry.pack()\nentry.bind(\"<Key>\", on_key)                 # any key\nentry.bind(\"<Return>\", lambda e: print(\"Enter pressed\"))\n\ncanvas = tk.Canvas(root, width=200, height=100, bg=\"white\")\ncanvas.pack()\ncanvas.bind(\"<Button-1>\", lambda e: print(f\"click at {e.x},{e.y}\"))  # left click\n\nroot.mainloop()" },
        { type: "table", headers: ["Event pattern", "Fires on"], rows: [
          ["`<Button-1>` / `<Button-3>`", "left / right mouse click"],
          ["`<Double-Button-1>`", "double left-click"],
          ["`<B1-Motion>`", "mouse drag with left button held"],
          ["`<Key>` / `<KeyPress-a>`", "any key / a specific key"],
          ["`<Return>` / `<Escape>` / `<Tab>`", "named keys"],
          ["`<Control-s>` / `<Control-Shift-Z>`", "modifier combinations"],
          ["`<Enter>` / `<Leave>`", "mouse pointer enters / leaves the widget"],
          ["`<FocusIn>` / `<Configure>`", "widget gains focus / is resized/moved"]
        ] },
        { type: "callout", variant: "gotcha", text: "**`command=on_click`** passes the function; **`command=on_click()`** calls it immediately at build time and passes its *return value* (usually `None`) — the button then does nothing. Same trap with `after` and `bind`. If you must pass arguments, use `lambda` or `functools.partial`, never call the function in place." },
        { type: "code", lang: "python", code: "from functools import partial\n\ndef greet(name):\n    print(\"hi\", name)\n\n# passing args to a callback — two idioms:\ntk.Button(root, text=\"A\", command=lambda: greet(\"Ada\")).pack()\ntk.Button(root, text=\"B\", command=partial(greet, \"Babbage\")).pack()\n\n# classic loop pitfall: capture the loop var with a default arg\nfor label in (\"one\", \"two\", \"three\"):\n    tk.Button(root, text=label,\n              command=lambda l=label: print(l)).pack()   # l=label binds NOW" }
      ]
    },
    {
      id: "variables",
      title: "Tkinter variables & reactive updates",
      level: "core",
      body: [
        { type: "p", text: "Tkinter provides special observable variable objects — **`StringVar`, `IntVar`, `DoubleVar`, `BooleanVar`** — that link to a widget's value. Bind one to a widget via **`textvariable=`** (or `variable=` for check/radio) and reads/writes stay in sync automatically. This is Tkinter's answer to two-way data binding." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\n\nroot = tk.Tk()\n\nname = tk.StringVar(value=\"Ada\")\nagree = tk.BooleanVar(value=False)\n\nentry = ttk.Entry(root, textvariable=name)   # widget <-> variable are linked\nentry.pack()\n\nttk.Checkbutton(root, text=\"I agree\", variable=agree).pack()\n\n# a label that mirrors the entry live\nttk.Label(root, textvariable=name).pack()\n\ndef submit():\n    print(name.get(), agree.get())           # .get() reads current value\n    name.set(\"reset\")                        # .set() writes it (updates the widget)\n\nttk.Button(root, text=\"Submit\", command=submit).pack()\n\nroot.mainloop()" },
        { type: "heading", text: "trace_add — react when a variable changes" },
        { type: "p", text: "**`.trace_add(\"write\", callback)`** fires your callback whenever the variable is written — the idiomatic way to do live validation, search-as-you-type, or dependent fields. (The old `.trace(\"w\", ...)` API is deprecated; use `trace_add`.)" },
        { type: "code", lang: "python", code: "query = tk.StringVar()\n\ndef on_change(*_args):        # trace passes (name, index, mode) — usually ignored\n    text = query.get()\n    print(\"searching for:\", text)\n\nquery.trace_add(\"write\", on_change)\nttk.Entry(root, textvariable=query).pack()" },
        { type: "callout", variant: "note", text: "Variables must outlive the widget — keep them as attributes (`self.name = tk.StringVar()`) or module globals. A `StringVar` created as a local inside a function and not stored can be garbage-collected, silently breaking the binding." }
      ]
    },
    {
      id: "styling",
      title: "ttk styling: themes & styles",
      level: "core",
      body: [
        { type: "p", text: "ttk widgets are styled through **`ttk.Style()`**, not per-widget color options. A **theme** is a family of styles; you pick one with `style.theme_use(...)` and customize individual widget styles with `style.configure(...)`. Available themes vary by OS (`\"clam\"`, `\"alt\"`, `\"default\"`, `\"classic\"` everywhere; `\"vista\"`/`\"xpnative\"` on Windows; `\"aqua\"` on macOS)." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\n\nroot = tk.Tk()\nstyle = ttk.Style()\nprint(style.theme_names())        # what's available on this OS\nstyle.theme_use(\"clam\")           # 'clam' is a clean, consistent cross-platform choice\n\n# configure a whole widget class\nstyle.configure(\"TButton\", padding=6, font=(\"Segoe UI\", 11))\n\n# a NAMED custom style: \"Accent.TButton\" derives from TButton\nstyle.configure(\"Accent.TButton\", foreground=\"white\", background=\"#3776ab\")\nstyle.map(\"Accent.TButton\",         # state-dependent colors (hover/pressed)\n          background=[(\"active\", \"#2c5f88\")])\n\nttk.Button(root, text=\"Normal\").pack(pady=4)\nttk.Button(root, text=\"Accent\", style=\"Accent.TButton\").pack(pady=4)\n\nroot.mainloop()" },
        { type: "list", items: [
          "**Class styles** are named `T<Widget>` — `TButton`, `TLabel`, `TEntry`, `Treeview`, `TNotebook`. `style.configure(\"TLabel\", foreground=\"gray\")` restyles all labels.",
          "**Named styles** (`\"Accent.TButton\"`) let you style one widget differently; apply with `style=\"Accent.TButton\"`.",
          "**`style.map(...)`** sets options that depend on widget *state* (`active`, `disabled`, `pressed`, `selected`) — e.g. hover color.",
          "**`style.layout(...)`** is the advanced escape hatch to rebuild a widget from sub-elements — rarely needed."
        ] },
        { type: "callout", variant: "tip", text: "For a modern look with almost no effort, use a themed wrapper: **`ttkbootstrap`** (Bootstrap-style themes over ttk) or **`customtkinter`** (rounded, dark-mode CTk widgets). Both are `pip install`-able and dramatically improve the default 1990s appearance." }
      ]
    },
    {
      id: "dialogs",
      title: "Standard dialogs",
      level: "core",
      body: [
        { type: "p", text: "Tkinter ships common modal dialogs so you don't hand-build them. Import the submodules explicitly — they aren't attributes of `tk`." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import messagebox, filedialog, colorchooser, simpledialog\n\nroot = tk.Tk()\n\ndef demo():\n    # message boxes return True/False/None\n    if messagebox.askyesno(\"Confirm\", \"Delete this file?\"):\n        messagebox.showinfo(\"Done\", \"Deleted.\")\n\n    # file dialogs return a path string ('' if cancelled)\n    path = filedialog.askopenfilename(\n        title=\"Pick a file\",\n        filetypes=[(\"Text\", \"*.txt\"), (\"All files\", \"*.*\")],\n    )\n    save_to = filedialog.asksaveasfilename(defaultextension=\".txt\")\n    folder = filedialog.askdirectory()\n\n    # color chooser -> ((r,g,b), \"#rrggbb\") or (None, None)\n    rgb, hex_ = colorchooser.askcolor()\n\n    # simple input prompts\n    name = simpledialog.askstring(\"Name\", \"Your name?\")\n    age = simpledialog.askinteger(\"Age\", \"Your age?\", minvalue=0, maxvalue=150)\n\ntk.Button(root, text=\"Open dialogs\", command=demo).pack(padx=40, pady=40)\nroot.mainloop()" },
        { type: "table", headers: ["Module", "Common functions"], rows: [
          ["`messagebox`", "`showinfo` `showwarning` `showerror` `askyesno` `askokcancel` `askretrycancel`"],
          ["`filedialog`", "`askopenfilename` `askopenfilenames` `asksaveasfilename` `askdirectory`"],
          ["`colorchooser`", "`askcolor()` → `((r,g,b), \"#hex\")`"],
          ["`simpledialog`", "`askstring` `askinteger` `askfloat`"]
        ] },
        { type: "callout", variant: "note", text: "Dialogs are **modal** and block until dismissed — return values tell you what the user did (`None`/`\"\"` on cancel, so always check). They run inside the same event loop, so this blocking is fine; it isn't the frozen-UI problem." }
      ]
    },
    {
      id: "canvas",
      title: "Canvas: drawing & simple animation",
      level: "core",
      body: [
        { type: "p", text: "The **`Canvas`** is a free-form 2D drawing surface: shapes, lines, text, and images placed by coordinates. Each `create_*` call returns an integer **item id** you use to move, reconfigure, or delete that item. Coordinates start at `(0,0)` top-left, x right, y down." },
        { type: "code", lang: "python", code: "import tkinter as tk\n\nroot = tk.Tk()\ncanvas = tk.Canvas(root, width=400, height=300, bg=\"white\")\ncanvas.pack()\n\n# each create_* returns an item id\nrect = canvas.create_rectangle(20, 20, 120, 80, fill=\"#3776ab\", outline=\"\")\ncanvas.create_oval(150, 20, 250, 120, fill=\"orange\")\ncanvas.create_line(20, 150, 380, 150, width=3, fill=\"gray\")\ncanvas.create_text(200, 200, text=\"Hello Canvas\", font=(\"Arial\", 18))\nball = canvas.create_oval(0, 250, 30, 280, fill=\"red\")\n\ncanvas.itemconfig(rect, fill=\"green\")     # reconfigure by id\ncanvas.move(rect, 10, 0)                   # nudge by dx,dy\n\nroot.mainloop()" },
        { type: "heading", text: "Animation with after()" },
        { type: "p", text: "There is no separate animation timer — you schedule the next frame yourself with **`widget.after(ms, fn)`**, which asks the event loop to call `fn` after `ms` milliseconds. A function that re-schedules itself is a frame loop." },
        { type: "code", lang: "python", code: "dx = 4\ndef animate():\n    global dx\n    canvas.move(ball, dx, 0)\n    x1, _, x2, _ = canvas.coords(ball)     # current bbox\n    if x2 >= 400 or x1 <= 0:\n        dx = -dx                            # bounce off the walls\n    canvas.after(16, animate)               # ~60 fps: schedule next frame\n\nanimate()                                   # kick it off\nroot.mainloop()" },
        { type: "callout", variant: "tip", text: "Never animate with `time.sleep()` + a `while` loop — that blocks `mainloop` and freezes the window. `after()` hands control back to the event loop between frames, keeping the UI responsive. `after_cancel(id)` stops a scheduled call." }
      ]
    },
    {
      id: "images",
      title: "Images: PhotoImage & Pillow",
      level: "core",
      body: [
        { type: "p", text: "Tkinter's built-in **`tk.PhotoImage`** loads GIF and PNG (PPM/PGM too). Assign it to a `Label`/`Button`/`Canvas` via `image=`. For JPEG and everything else, use **Pillow**'s `ImageTk.PhotoImage`." },
        { type: "code", lang: "python", code: "import tkinter as tk\n\nroot = tk.Tk()\n\nlogo = tk.PhotoImage(file=\"logo.png\")     # PNG/GIF supported natively\nlabel = tk.Label(root, image=logo)\nlabel.pack()\n\n# CRITICAL: keep a reference or the image is garbage-collected and shows blank!\nlabel.image = logo                        # anchor it to the widget\n\nroot.mainloop()" },
        { type: "callout", variant: "warn", text: "**The classic PhotoImage GC gotcha:** Tkinter holds only a *weak* reference to the image. If your only Python reference is a local variable, it gets garbage-collected the moment the function returns and the widget shows **blank**. Fix: keep a strong reference — store it on the widget (`label.image = img`), on `self`, or in a list. This is the single most common Tkinter bug." },
        { type: "code", lang: "python", code: "# JPEG / resizing / format conversion -> Pillow\nfrom PIL import Image, ImageTk\n\nimg = Image.open(\"photo.jpg\")\nimg = img.resize((200, 200))\nphoto = ImageTk.PhotoImage(img)\n\nlabel = tk.Label(root, image=photo)\nlabel.image = photo                       # same reference rule applies!\nlabel.pack()" }
      ]
    },
    {
      id: "app-structure",
      title: "Structuring a real app: classes & multiple windows",
      level: "core",
      body: [
        { type: "p", text: "Beyond toy scripts, organize the UI as a **class** — either subclass `tk.Tk` (the app *is* the root) or subclass `ttk.Frame` (a reusable component mounted in a root). Store widgets and variables as `self.*` so callbacks can reach them, and keep business logic out of the widget layer." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\n\nclass CounterApp(tk.Tk):\n    def __init__(self):\n        super().__init__()\n        self.title(\"Counter\")\n        self.count = tk.IntVar(value=0)\n\n        frm = ttk.Frame(self, padding=16)\n        frm.pack(fill=\"both\", expand=True)\n\n        ttk.Label(frm, textvariable=self.count,\n                  font=(\"Segoe UI\", 32)).pack(pady=8)\n        ttk.Button(frm, text=\"Increment\", command=self.increment).pack()\n        ttk.Button(frm, text=\"Details\", command=self.open_details).pack(pady=4)\n\n    def increment(self):\n        self.count.set(self.count.get() + 1)\n\n    def open_details(self):\n        # a secondary window: Toplevel, NOT another Tk()\n        win = tk.Toplevel(self)\n        win.title(\"Details\")\n        ttk.Label(win, text=f\"Current count: {self.count.get()}\",\n                  padding=20).pack()\n\nif __name__ == \"__main__\":\n    CounterApp().mainloop()" },
        { type: "list", items: [
          "**Extra windows = `tk.Toplevel`**, never a second `tk.Tk()`. A Toplevel shares the one interpreter and event loop; a second `Tk()` creates a rival interpreter and breaks variables/images.",
          "**`win.transient(self)`** ties a Toplevel to its parent (minimizes together); **`win.grab_set()`** makes it modal (blocks input to other windows).",
          "**Separate concerns:** put file/network/compute logic in plain functions or classes, and let the Tkinter class only wire widgets to them. Easier to test and to swap the UI later.",
          "For multi-screen apps, stack frames in the same grid cell and `.tkraise()` the active one — a lightweight 'router'."
        ] }
      ]
    },
    {
      id: "concurrency",
      title: "Concurrency: after, threads & queues",
      level: "core",
      body: [
        { type: "p", text: "Tkinter is **single-threaded**. All widget work happens on the main thread inside `mainloop`. Any long-running work you do in a callback (a download, a big computation, `time.sleep`) blocks the loop and the window **freezes** — no repaint, no clicks. There are two correct patterns to stay responsive." },
        { type: "heading", text: "1. Short/periodic work → after()" },
        { type: "code", lang: "python", code: "# a live clock without blocking anything\nimport time\n\ndef tick():\n    clock.config(text=time.strftime(\"%H:%M:%S\"))\n    root.after(1000, tick)      # reschedule in 1s\n\nclock = ttk.Label(root, font=(\"mono\", 24))\nclock.pack()\ntick()" },
        { type: "heading", text: "2. Long/blocking work → background thread + queue" },
        { type: "p", text: "For real blocking work (I/O, heavy compute), run it in a **`threading.Thread`**, push results into a **`queue.Queue`**, and poll that queue from the main thread with `after`. **Never touch a widget from the worker thread** — Tk is not thread-safe; only the main thread may update the UI." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\nimport threading, queue, time\n\nroot = tk.Tk()\nbar = ttk.Progressbar(root, maximum=100)\nbar.pack(fill=\"x\", padx=20, pady=20)\nstatus = ttk.Label(root, text=\"idle\"); status.pack()\n\nq = queue.Queue()\n\ndef worker():                       # runs OFF the main thread\n    for i in range(1, 101):\n        time.sleep(0.03)            # pretend to do slow work\n        q.put(i)                    # hand progress back via the queue\n    q.put(\"done\")\n\ndef poll_queue():                   # runs ON the main thread via after\n    try:\n        while True:\n            msg = q.get_nowait()\n            if msg == \"done\":\n                status.config(text=\"finished\")\n            else:\n                bar[\"value\"] = msg       # safe: we're on the main thread\n    except queue.Empty:\n        pass\n    root.after(100, poll_queue)     # keep polling\n\ndef start():\n    threading.Thread(target=worker, daemon=True).start()\n    poll_queue()\n\nttk.Button(root, text=\"Start\", command=start).pack(pady=8)\nroot.mainloop()" },
        { type: "callout", variant: "warn", text: "**Only the main thread may call widget methods.** Calling `bar[\"value\"] = x` from the worker thread may appear to work but causes intermittent crashes and hangs (Tcl has no cross-thread locking). Always marshal results back through a `queue.Queue` polled by `after`, and start workers as `daemon=True` so they don't block interpreter exit." }
      ]
    },
    {
      id: "treeview-notebook",
      title: "Treeview (tables/trees) & Notebook (tabs)",
      level: "deep",
      body: [
        { type: "p", text: "**`ttk.Treeview`** is the closest thing to a data grid: it renders both flat **tables** (define `columns`) and hierarchical **trees** (nest items under parents). **`ttk.Notebook`** gives tabbed pages." },
        { type: "code", lang: "python", code: "import tkinter as tk\nfrom tkinter import ttk\n\nroot = tk.Tk()\n\ntree = ttk.Treeview(root, columns=(\"lang\", \"year\"), show=\"headings\", height=6)\ntree.heading(\"lang\", text=\"Language\")\ntree.heading(\"year\", text=\"Released\")\ntree.column(\"year\", width=80, anchor=\"center\")\n\nfor lang, year in [(\"Python\", 1991), (\"Rust\", 2010), (\"Go\", 2009)]:\n    tree.insert(\"\", \"end\", values=(lang, year))\n\ntree.pack(fill=\"both\", expand=True)\n\ndef on_select(_e):\n    for iid in tree.selection():\n        print(tree.item(iid, \"values\"))\ntree.bind(\"<<TreeviewSelect>>\", on_select)\n\nroot.mainloop()" },
        { type: "list", items: [
          "**Table mode:** `show=\"headings\"` hides the tree column; define `columns=(...)` and set `heading`/`column` for each.",
          "**Tree mode:** default `show=\"tree headings\"`; pass a parent iid to `insert(parent, \"end\", text=..., ...)` to nest rows.",
          "**Selection:** `tree.selection()` returns selected item ids; bind the virtual event `<<TreeviewSelect>>`.",
          "**No built-in sorting** — bind a heading `command=` and re-order items yourself. For a true data grid, `tksheet` (3rd-party) is more capable."
        ] },
        { type: "code", lang: "python", code: "nb = ttk.Notebook(root)\nnb.pack(fill=\"both\", expand=True)\n\npage1 = ttk.Frame(nb, padding=12)\npage2 = ttk.Frame(nb, padding=12)\nnb.add(page1, text=\"General\")\nnb.add(page2, text=\"Advanced\")\nttk.Label(page1, text=\"Page one\").pack()\nttk.Label(page2, text=\"Page two\").pack()" }
      ]
    },
    {
      id: "packaging",
      title: "Packaging & distribution",
      level: "deep",
      body: [
        { type: "p", text: "Ship a Tkinter app as a standalone executable so users don't need Python. **PyInstaller** is the standard tool; it bundles the interpreter, your code, and Tcl/Tk into one distributable. Use **`--windowed`** so no console window opens alongside the GUI." },
        { type: "code", lang: "bash", code: "pip install pyinstaller\n\n# one-folder build (faster startup, easier to debug)\npyinstaller --windowed --name MyApp app.py\n\n# one-file build (single .exe/.app, slower first launch)\npyinstaller --onefile --windowed --name MyApp app.py\n\n# bundle a data file (image, config). Syntax: SRC:DEST (use ; on Windows)\npyinstaller --onefile --windowed --add-data \"logo.png:.\" app.py\n\n# result in dist/  ->  dist/MyApp  (or dist/MyApp.exe / dist/MyApp.app)" },
        { type: "list", items: [
          "**`--windowed`** (aka `--noconsole`) hides the terminal — essential for a GUI app, but it also hides tracebacks, so test the console build first.",
          "**Bundled data paths break** at runtime: a frozen app's files live in a temp dir. Resolve paths via `sys._MEIPASS` (set by PyInstaller) with a fallback to the script dir.",
          "**macOS:** `--windowed` produces a `.app` bundle; you'll want code-signing/notarization for distribution. **Windows:** add `--icon app.ico`.",
          "Alternatives: **Nuitka** (compiles to C for speed), **cx_Freeze**, or **Briefcase** (BeeWare) for app-store-style packaging."
        ] },
        { type: "code", lang: "python", code: "# robust resource path that works both in dev and when frozen by PyInstaller\nimport sys, os\n\ndef resource_path(rel):\n    base = getattr(sys, \"_MEIPASS\", os.path.dirname(os.path.abspath(__file__)))\n    return os.path.join(base, rel)\n\nlogo = tk.PhotoImage(file=resource_path(\"logo.png\"))" }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite Tkinter developers. Most are cheap to avoid once you've been burned once." },
        { type: "heading", text: "1. PhotoImage goes blank (garbage-collected)" },
        { type: "callout", variant: "warn", text: "An image assigned only to a local variable vanishes when the function returns — Tk keeps only a weak reference. **Fix:** anchor a strong reference (`self.img = img`, `label.image = img`, or a module-level list). The #1 Tkinter bug." },
        { type: "heading", text: "2. Mixing pack and grid in one container" },
        { type: "callout", variant: "gotcha", text: "Calling both `.pack()` and `.grid()` on children of the *same* parent makes Tkinter hang forever negotiating geometry. **Fix:** one manager per container. Nest a `pack`ed Frame and `grid` inside it if you need both." },
        { type: "heading", text: "3. Frozen UI from blocking work" },
        { type: "callout", variant: "warn", text: "`time.sleep`, a big loop, or a network call inside a callback blocks `mainloop`, freezing the window. **Fix:** use `widget.after(ms, fn)` for timers/polling, and a background `threading.Thread` + `queue.Queue` for real blocking work." },
        { type: "heading", text: "4. Touching widgets from another thread" },
        { type: "callout", variant: "warn", text: "Tk is not thread-safe; updating a widget from a worker thread causes intermittent crashes/hangs. **Fix:** the worker only `queue.put(...)`s results; the main thread polls the queue via `after` and does all widget updates." },
        { type: "heading", text: "5. command=fn() instead of command=fn" },
        { type: "callout", variant: "gotcha", text: "`command=fn()` runs `fn` immediately at build time and binds its return value; the button then does nothing. **Fix:** pass `command=fn`; to pass args use `lambda: fn(arg)` or `functools.partial(fn, arg)`." },
        { type: "heading", text: "6. grid not expanding on resize" },
        { type: "callout", variant: "gotcha", text: "Widgets don't grow when the window is resized unless the row/column has weight AND the widget is sticky. **Fix:** `root.columnconfigure(i, weight=1)` / `rowconfigure(...)` plus `sticky=\"nsew\"` on the widget." },
        { type: "heading", text: "7. Default look is dated" },
        { type: "callout", variant: "tip", text: "Classic `tk.*` widgets look like 1995. **Fix:** use `tkinter.ttk` widgets everywhere, pick a theme (`ttk.Style().theme_use(\"clam\")`), or adopt `ttkbootstrap`/`customtkinter` for a modern, dark-mode-capable UI." },
        { type: "heading", text: "8. Loop-variable capture in callbacks" },
        { type: "callout", variant: "gotcha", text: "Building buttons in a `for` loop with `command=lambda: use(var)` captures the *final* value of `var` for every button. **Fix:** bind per-iteration with a default arg: `command=lambda v=var: use(v)`." },
        { type: "callout", variant: "note", text: "General discipline: create exactly one `tk.Tk()`, keep `Toplevel`s for extra windows, store variables/images on `self`, prefer ttk, and keep every callback fast (offload slow work). Do these and Tkinter stays pleasant." }
      ]
    }
  ],

  packages: [
    { name: "tkinter (stdlib)", why: "the toolkit itself — ships with CPython, no install; `import tkinter as tk`" },
    { name: "tkinter.ttk (stdlib)", why: "themed widgets (Button/Entry/Combobox/Treeview/Notebook/Progressbar) — use these for a modern look" },
    { name: "tkinter.messagebox / filedialog / colorchooser / simpledialog (stdlib)", why: "the standard modal dialogs for alerts, file/dir/color pickers, and quick input prompts" },
    { name: "Pillow (PIL)", why: "load/resize JPEG, PNG, WebP etc.; `ImageTk.PhotoImage` bridges into Tkinter widgets" },
    { name: "customtkinter", why: "modern-looking CTk widget set: rounded corners, built-in light/dark themes, drop-in-ish API" },
    { name: "ttkbootstrap", why: "Bootstrap-inspired themes and enhanced widgets layered over ttk — instant polish" },
    { name: "PyInstaller", why: "bundle app + interpreter + Tcl/Tk into a standalone executable (`--windowed`)" },
    { name: "tksheet", why: "high-performance spreadsheet/data-grid widget when Treeview isn't enough" },
    { name: "Nuitka", why: "compile the app to C for faster startup/runtime and harder-to-reverse binaries" },
    { name: "pygubu / pygubu-designer", why: "visual drag-and-drop UI designer that emits Tkinter code/XML" },
    { name: "tkcalendar", why: "date-picker and calendar widgets missing from stock Tkinter" },
    { name: "Pmw (Python megawidgets)", why: "higher-level composite widgets (balloons, combos, dialogs) on classic Tk" }
  ],

  gotchas: [
    "**PhotoImage GC:** an image kept only in a local variable is garbage-collected and shows blank. Keep a strong reference (`label.image = img`, `self.img`, or a list).",
    "**Never mix `pack` and `grid`** in the same container — it hangs the app. One geometry manager per container; nest Frames if you need both.",
    "**`command=fn()` calls immediately** and binds the return value. Pass `command=fn`; use `lambda`/`functools.partial` to pass arguments.",
    "**Blocking the event loop freezes the UI:** no `time.sleep`/heavy loops/blocking I/O in callbacks. Use `after()` for timers and a thread+`queue.Queue` for slow work.",
    "**Tk is not thread-safe:** only the main thread may touch widgets. Workers push to a `queue.Queue`; the main thread polls it via `after` and updates the UI.",
    "**grid won't resize** without `columnconfigure`/`rowconfigure(weight=...)` AND `sticky=\"nsew\"` on the widget.",
    "**Create only one `tk.Tk()`** — a second one starts a rival Tcl interpreter and breaks variables/images. Use `tk.Toplevel()` for extra windows.",
    "**ttk widgets ignore `fg`/`bg`:** style them through `ttk.Style().configure(...)`/`map(...)`, not per-widget color options.",
    "**Loop-variable capture:** `command=lambda: f(x)` in a loop captures the last `x`. Bind per-iteration with a default arg: `lambda x=x: f(x)`.",
    "**Tkinter variables must outlive the widget:** a local `StringVar` can be GC'd, silently breaking `textvariable` binding. Store it on `self`.",
    "**`Text` uses `\"line.column\"` indices** (1-based line, 0-based column): the start is `\"1.0\"`, the end is `\"end\"` — not integer offsets.",
    "**Dialog return values signal cancel:** `filedialog` returns `\"\"`, `simpledialog`/`colorchooser` return `None`. Always check before using.",
    "**`--windowed` PyInstaller builds hide tracebacks:** test with a console build first, and resolve bundled asset paths via `sys._MEIPASS`.",
    "**Default classic widgets look dated:** reach for `ttk`, a theme, or `customtkinter`/`ttkbootstrap` for anything users will see.",
    "**Missing Tk on Linux:** if `import tkinter` fails, your Python lacks Tk — install the OS package (`sudo apt install python3-tk`)."
  ],

  flashcards: [
    { q: "What is Tkinter built on top of?", a: "**Tcl/Tk** — the Tk C GUI library driven by the Tcl language. Tkinter marshals Python calls into Tcl commands run by an embedded interpreter. You write Python, not Tcl." },
    { q: "How do you verify Tkinter is installed?", a: "Run `python -m tkinter` — it opens a demo window showing the Tcl/Tk version. On Linux, if missing, install `python3-tk`." },
    { q: "What does `root.mainloop()` do?", a: "Starts the **event loop**: it blocks, dispatching clicks/keys/timers/redraws one at a time, and returns only when the window closes. All your logic runs inside callbacks it fires." },
    { q: "Why should you prefer `ttk` widgets?", a: "`tkinter.ttk` widgets follow the OS theme and look modern, versus the dated classic `tk.*` look. Style them via `ttk.Style()` rather than per-widget `fg`/`bg`." },
    { q: "The three geometry managers and when to use each?", a: "`pack` (stack against a side — simple layouts/toolbars), `grid` (rows & columns — most real UIs), `place` (absolute x,y — rare). Never mix pack and grid in one container." },
    { q: "How do you make a grid layout resize with the window?", a: "Give rows/columns weight: `root.columnconfigure(i, weight=1)` / `rowconfigure(...)`, and set `sticky=\"nsew\"` on the widget so it fills its cell." },
    { q: "`command=` vs `.bind()`?", a: "`command=` is a zero-arg callback for buttons/menus/checkbuttons. `.bind(event, handler)` attaches to any widget for low-level events (`<Button-1>`, `<Key>`, `<Return>`), and the handler receives an event object." },
    { q: "What are Tkinter variables for?", a: "`StringVar`/`IntVar`/`DoubleVar`/`BooleanVar` two-way-bind to widgets via `textvariable=`/`variable=`. Use `.get()`/`.set()`, and `.trace_add(\"write\", cb)` to react to changes." },
    { q: "The PhotoImage garbage-collection gotcha?", a: "Tk keeps only a weak reference to images. A `PhotoImage` in a local variable is GC'd when the function returns and the widget goes blank. Keep a strong reference (`label.image = img` / `self.img`)." },
    { q: "How do you keep the UI responsive during slow work?", a: "Tkinter is single-threaded — never block the loop. Use `widget.after(ms, fn)` for timers/polling; run blocking work in a `threading.Thread` and pass results back via a `queue.Queue` polled with `after`." },
    { q: "Why can't a worker thread update widgets directly?", a: "Tk is not thread-safe — only the main thread may call widget methods. Cross-thread updates cause intermittent crashes/hangs. Marshal results through a `queue.Queue` and update on the main thread." },
    { q: "How do you open a second window?", a: "Use `tk.Toplevel(parent)`, never a second `tk.Tk()`. `Toplevel` shares the single interpreter/event loop; `transient()`/`grab_set()` make it tied/modal." },
    { q: "How do you draw and animate on a Canvas?", a: "`create_rectangle/oval/line/text/image` return item ids; move/reconfigure with `move`/`itemconfig`/`coords`. Animate by scheduling frames with `canvas.after(ms, fn)` that re-schedules itself — never `time.sleep`." },
    { q: "What is `ttk.Treeview` used for?", a: "A table (`show=\"headings\"` + `columns`) or a hierarchical tree (nest via a parent iid). `insert`/`item`/`selection`; bind `<<TreeviewSelect>>`. No built-in sorting." },
    { q: "How do you ship a Tkinter app as an executable?", a: "PyInstaller: `pyinstaller --onefile --windowed app.py`. `--windowed` hides the console; bundle assets with `--add-data` and resolve their paths at runtime via `sys._MEIPASS`." },
    { q: "Common way to pass arguments to a Tkinter callback?", a: "`command=` needs a zero-arg callable, so wrap: `lambda: fn(arg)` or `functools.partial(fn, arg)`. In loops, capture the loop var with a default arg (`lambda x=x: fn(x)`)." }
  ],

  cheatsheet: [
    { label: "Import", code: "import tkinter as tk\nfrom tkinter import ttk" },
    { label: "Check install", code: "python -m tkinter" },
    { label: "Root window", code: "root = tk.Tk(); root.title(\"App\"); root.geometry(\"400x300\")" },
    { label: "Run the app", code: "root.mainloop()" },
    { label: "Label + Button", code: "ttk.Label(root, text=\"Hi\").pack()\nttk.Button(root, text=\"Go\", command=fn).pack()" },
    { label: "pack", code: "w.pack(side=\"left\", fill=\"both\", expand=True, padx=6, pady=6)" },
    { label: "grid + resize", code: "w.grid(row=0, column=1, sticky=\"ew\")\nroot.columnconfigure(1, weight=1)" },
    { label: "Bind event", code: "w.bind(\"<Button-1>\", lambda e: print(e.x, e.y))" },
    { label: "Variable", code: "v = tk.StringVar(value=\"x\"); ttk.Entry(root, textvariable=v)\nv.get(); v.set(\"y\")" },
    { label: "Trace changes", code: "v.trace_add(\"write\", lambda *a: print(v.get()))" },
    { label: "ttk style", code: "s = ttk.Style(); s.theme_use(\"clam\"); s.configure(\"TButton\", padding=6)" },
    { label: "Message box", code: "from tkinter import messagebox\nif messagebox.askyesno(\"?\", \"Sure?\"): ..." },
    { label: "File dialog", code: "from tkinter import filedialog\npath = filedialog.askopenfilename()" },
    { label: "Image (keep ref!)", code: "img = tk.PhotoImage(file=\"a.png\")\nlbl = tk.Label(root, image=img); lbl.image = img" },
    { label: "Timer / poll", code: "def tick(): ...; root.after(1000, tick)\ntick()" },
    { label: "Thread + queue", code: "threading.Thread(target=work, daemon=True).start()\nroot.after(100, poll_queue)" },
    { label: "Second window", code: "win = tk.Toplevel(root); win.title(\"More\")" },
    { label: "Package (exe)", code: "pyinstaller --onefile --windowed app.py" }
  ]
});
