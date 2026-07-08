# Frontend Frameworks — Review Deck 🎨

A static, offline web app for **reviewing** frontend, UI, and web-target frameworks — a fast
refresher for things you already learned but forget: setup, components, reactivity/state,
templating, routing, data fetching, forms, and gotchas. Most sections are a 20–32 minute read.

It shares the proven engine of its sibling **Backend Review Deck**, re-skinned with its own
violet/magenta identity and loaded with a different set of (mostly frontend) frameworks.

**Sections** (in sidebar order):

- **Web UI (JS / TS)** — Preact · React · Angular · Vue · TanStack
- **Fullstack** — AdonisJS · Wasp
- **WebAssembly** — Yew (Rust) · C++ WebAssembly (Emscripten)
- **Flutter** (Dart) — mobile / web / desktop from one codebase
- **Desktop GUI** — Qt (C++) · PySide6 (Python) · Tkinter (Python) · egui (Rust) · Fyne (Go)
- **Game dev** — Pygame (Python) · SDL (C++)
- **GraphQL** — schema-first API query language
- **EVM** — Solidity (+ Foundry) · EVM clients (TypeScript / viem)
- **TON** — Tact · FunC (Telegram Open Network smart contracts)
- **Practice & Projects** — cross-framework comparison + project ideas

Related sections are grouped in the sidebar under a collapsible parent (**Web UI (JS / TS)**, **Fullstack**, **WebAssembly**, **Desktop GUI**, **Game dev**, **EVM**, **TON**) — grouped by **purpose** so you can find "how do I build a desktop app / a game / a contract" fast, regardless of language. Every framework carries a **"Common headaches & how to handle them"** section covering its real-world pitfalls and the fix for each.

## Run it

No build, no server, no dependencies. Just open the file:

```bash
# double-click index.html, or:
xdg-open index.html      # Linux
open index.html          # macOS
```

> Content is loaded via plain `<script>` tags, so it works directly from `file://`.
> If your browser ever blocks local files, serve the folder instead:
> `python3 -m http.server` then visit http://localhost:8000

## Features

- 🌗 **Dark / light theme** — toggle with `t`, remembered across visits (respects your OS setting first time).
- 🔎 **Global search** (`/`) — jump to any concept, package, or cheat-card entry across all frameworks.
- 📈 **Deck-stats** — an at-a-glance line under the sidebar (frameworks · sections · total read time).
- 🃏 **Flashcards + quiz** (`f`) — active-recall practice per framework.
- 🧭 **Sticky nav + on-this-page TOC** with scroll-spy; the active item is kept in view and its group auto-expands.
- 📊 **Reading-progress bar** under the top bar, plus a **back-to-top** button (or press `g` `g`).
- ↔ **Prev / Next framework** cards at the foot of every page for linear review.
- 🔗 **Copyable section links** — click a section's number to copy a deep link (`…#react--hooks`) that reopens straight to it.
- ⌨ **Keyboard-shortcut overlay** — press `?` (or the `?` button) for the full list.
- ▸ **Deep-dive accordions** — advanced details are collapsed by default; open only what you need.
- 📋 Syntax-highlighted code (JSX/TSX, Python, Go, Dart, Rust, C++, QML, Solidity, GraphQL, Tact/FunC, …) with **copy** buttons.
- 🖨 **Print-friendly** (Ctrl/Cmd+P expands everything for PDF export).

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `j` / `k` | Next / previous framework |
| `f` | Open flashcards |
| `t` | Toggle theme |
| `?` | Keyboard-shortcut help |
| `g` `g` | Back to top |
| `Esc` | Close modal / menu |

## Project structure

```
index.html            # shell (loads everything)
css/                  # theme (violet/magenta tokens), layout, components, animations
js/                   # highlight, render, nav, search, flashcards, theme, ux, app
content/              # one file per framework (window.FRAMEWORKS.push({...}))
  _schema.md          # authoring guide for the content object
TASK.md               # build log / spec
```

## Editing or adding content

All content lives in `content/*.js`. Each file registers one framework object — see
[`content/_schema.md`](content/_schema.md) for the shape (sections, block types, escaping rules).

Validate a content file after editing:

```bash
node -e "global.window={FRAMEWORKS:[]};require('./content/react.js');console.log('ok', window.FRAMEWORKS.length)"
```

To add a framework: create `content/<id>.js`, then add a matching
`<script src="content/<id>.js"></script>` line in `index.html`. The sidebar, search,
and flashcards pick it up automatically. Consecutive frameworks that share a
`group` value fold into one collapsible sidebar parent.

## Relationship to the backend deck

This project lives in a subfolder of the Backend Review Deck **only for context** — the two are
**independent** and not linked at runtime. Same engine, different skin, different content.
