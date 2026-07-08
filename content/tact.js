(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "tact",
  name: "Tact",
  language: "Tact",
  group: "TON",
  color: "#0098ea",
  readMinutes: 30,
  tagline: "The modern, high-level language for **TON (The Open Network / Telegram)** smart contracts — statically typed, TypeScript/Solidity-flavored, compiled down to FunC → TVM, built and tested with the **Blueprint** toolchain (`@ton/blueprint` + `@ton/sandbox`).",

  sections: [
    {
      id: "overview",
      title: "Overview & the TON actor mental model",
      level: "core",
      body: [
        { type: "p", text: "**Tact** is a statically-typed high-level language for **TON smart contracts**. It reads like TypeScript with Solidity-style contracts, but compiles down to **FunC → TVM assembly** (the TON Virtual Machine) — you get a safer, higher-level surface than writing FunC by hand while still targeting the same bytecode. This deck targets **Tact 1.6.x** (1.6.13 is current, mid-2026) built with **Blueprint**." },
        { type: "p", text: "The hard part is not the syntax — it is that **TON is nothing like the EVM**. TON is an **actor-model, asynchronous, sharded** blockchain. If you carry EVM intuitions over unchanged, you will write broken contracts. Internalize this section before anything else." },
        { type: "heading", text: "1. Every contract is an actor" },
        { type: "list", items: [
          "A contract is an **actor**: it owns its **own persistent state**, has an **address**, and processes **one message at a time**. There is no shared global memory between contracts.",
          "Actors communicate **only by asynchronous message passing**. You send a message and your transaction ends — the recipient processes it *later*, in a *separate* transaction, possibly in a different shard.",
          "**You CANNOT synchronously call another contract and read its return value.** There is no `otherContract.balanceOf(x)` that returns a number inside your call, like on the EVM. To \"ask\" another contract something you send it a message and it must send a message *back* — a full round trip across two or more transactions.",
          "This changes everything: no synchronous cross-contract reads, no atomic multi-contract composition inside one call, and \"reentrancy\" means something completely different (see Security)."
        ] },
        { type: "heading", text: "2. Data lives in cells" },
        { type: "list", items: [
          "TON's native data structure is the **cell**: up to **1023 bits** of data plus up to **4 references** to other cells. Contract storage, messages, and code are all trees of cells.",
          "You read a cell by turning it into a **`Slice`** (a cursor you parse fields out of) and build one with a **`Builder`**. Tact hides most of this behind structs, but it leaks through in serialization (`Int as uint64`) and gas costs.",
          "Because a single cell is only 1023 bits, large data (maps, strings) becomes a *tree* of cells — and deep trees cost gas to traverse. Keeping state small and flat is a first-class concern."
        ] },
        { type: "heading", text: "3. Gas, value & storage rent" },
        { type: "list", items: [
          "Native currency is **Toncoin** (`nanoton`; 1 TON = 10^9 nanoton). Messages carry a **value** (attached TON) that pays for the *recipient's* gas — you forward funds to cover downstream work.",
          "Contracts pay **storage rent**: TON charges you continuously for the bytes you keep on-chain. A contract that runs out of balance can be **frozen and eventually deleted**. State size is a cost you pay forever, not once.",
          "**Sharding:** TON auto-splits load across shard-chains. Your contract may live on a different shard than the one it messages, which is *why* messaging is asynchronous — cross-shard delivery takes blocks."
        ] },
        { type: "heading", text: "TON vs EVM at a glance" },
        { type: "table", headers: ["Concept", "EVM (Solidity)", "TON (Tact)"], rows: [
          ["Execution model", "synchronous, single global state", "**asynchronous actors**, message passing"],
          ["Call another contract", "`x.f()` returns a value atomically", "**send a message**; reply arrives in a later tx"],
          ["Storage unit", "32-byte slots in a flat map", "**cells** (1023 bits + 4 refs), a tree"],
          ["Read state off-chain", "`view` function via `eth_call`", "**`get fun`** getter (off-chain only, free)"],
          ["Gas payment", "sender pays for the whole call tree", "**each message carries value** to pay the next hop"],
          ["Persistent cost", "pay once at write (SSTORE)", "**storage rent** — pay continuously to keep bytes"],
          ["A token (fungible)", "one ERC-20 contract holds all balances", "**Jetton**: a master + **one wallet contract per holder**"],
          ["Failure of a call", "revert bubbles up synchronously", "**bounce** — a failed message returns to sender async"],
          ["Reentrancy", "callee re-enters mid-call", "no synchronous re-entry; races come from **message ordering**"]
        ] },
        { type: "callout", variant: "note", text: "TON is promoting **Tolk** (a newer FunC-successor) as a future default, and the legacy TON docs page for Tact is being trimmed. But Tact remains widely used, actively maintained (1.6.13, May 2026), and roughly a third of new TON contracts are written in it. Everything here targets **Tact 1.6**." },
        { type: "callout", variant: "tip", text: "The single most valuable habit switching from EVM: whenever you want to \"call and get a result,\" stop and ask *who sends the reply, and what happens if it never arrives?* Async design (request/response messages, timeouts via bounce, carry-value) is the whole game." }
      ]
    },
    {
      id: "cells",
      title: "Cells, slices & builders — TON's data model",
      level: "core",
      body: [
        { type: "p", text: "Everything on TON — contract code, contract state, and every message — is a tree of **cells**. You rarely construct cells by hand in Tact (structs and `message`s do it for you), but understanding the model explains serialization widths, gas costs, and the `Cell`/`Slice`/`Builder` types." },
        { type: "table", headers: ["Type", "What it is", "You use it to"], rows: [
          ["`Cell`", "1023 bits of data + up to 4 refs to child cells (immutable)", "store/pass structured data; the unit of storage"],
          ["`Slice`", "a read cursor over a cell's bits + refs", "**parse** data out of a cell field by field"],
          ["`Builder`", "a write buffer you append bits/refs to", "**construct** a new cell"],
          ["`Struct` / `Message`", "Tact's typed layer over cells", "define fields once; Tact generates the ser/de"]
        ] },
        { type: "code", lang: "tact", code: "// Low-level: build a cell, then read it back through a slice.\nlet b: Builder = beginCell()\n    .storeUint(42, 32)          // 32-bit unsigned int\n    .storeAddress(sender())     // 267-bit std address\n    .storeCoins(ton(\"1.5\"));    // variable-width nanoton amount\nlet c: Cell = b.endCell();\n\nlet s: Slice = c.beginParse();  // cell -> slice cursor\nlet n: Int = s.loadUint(32);    // read fields back IN THE SAME ORDER\nlet who: Address = s.loadAddress();\nlet amount: Int = s.loadCoins();" },
        { type: "list", items: [
          "A cell holds **1023 bits max**. Overflow that and the compiler/VM errors — big records must spread across referenced child cells.",
          "**Order matters**: you must `load*` in exactly the order you `store*`d. Tact structs enforce this for you, which is the main reason to use them over raw cells.",
          "Refs are limited to **4 per cell**. Maps and long strings are cell *trees*; traversing them costs gas per cell touched — a real factor in loop-heavy code.",
          "`Cell` is immutable; you never mutate one, you build a new one. `Slice` and `Builder` are the mutable working types."
        ] },
        { type: "callout", variant: "gotcha", text: "Serialization width is not cosmetic. If a message field is declared `Int as uint32` but you try to store a value ≥ 2^32, the contract **throws at runtime** (exit code 5, integer out of range) when it serializes the cell. Choose widths to fit your real value ranges — see the Types section." }
      ]
    },
    {
      id: "setup",
      title: "Setup: Blueprint, the Tact compiler & project layout",
      level: "core",
      body: [
        { type: "p", text: "**Blueprint** (`@ton/blueprint`) is the standard TON development environment: it scaffolds a project, compiles Tact/FunC/Tolk, generates **TypeScript wrappers** from your contracts, runs an in-process sandbox blockchain for tests, and deploys to testnet/mainnet with a real wallet. It is TON's equivalent of Foundry/Hardhat." },
        { type: "code", lang: "bash", code: "# scaffold a new project interactively (pick \"Tact\" when prompted)\nnpm create ton@latest my-app\ncd my-app\nnpm install\n\n# add another contract later (non-interactive)\nnpx blueprint create Counter --type tact-counter   # or tact-empty\n\nnpx blueprint build       # compile Tact -> FunC -> TVM, emit TS wrappers\nnpx blueprint test        # run the Jest + sandbox test suite\nnpx blueprint run         # execute a script from scripts/ (deploy, interact)" },
        { type: "code", lang: "text", code: "my-app/\n  contracts/            # your .tact sources (Counter.tact ...)\n  wrappers/             # generated + hand-edited TS wrappers (Counter.ts, Counter.compile.ts)\n  tests/                # Jest tests against @ton/sandbox (Counter.spec.ts)\n  scripts/              # deploy & interaction scripts (deployCounter.ts)\n  build/                # compiled artifacts: .boc code, .pkg, generated bindings\n  package.json\n  tsconfig.json" },
        { type: "p", text: "Each contract has a **`*.compile.ts`** file in `wrappers/` telling Blueprint how to build it. `npx blueprint build` runs the **`@tact-lang/compiler`** and, crucially, generates a typed **TS wrapper class** that mirrors your contract's messages and getters — you use that wrapper from tests and scripts." },
        { type: "code", lang: "ts", code: "// wrappers/Counter.compile.ts — tells Blueprint to compile with Tact\nimport { CompilerConfig } from \"@ton/blueprint\";\n\nexport const compile: CompilerConfig = {\n  lang: \"tact\",\n  target: \"contracts/counter.tact\",\n  options: { debug: true },   // enables dump()/require debug output in the sandbox\n};" },
        { type: "callout", variant: "tip", text: "The Tact compiler emits its own TS bindings (message encoders, `Counter.fromInit(...)`, getter methods) into `build/`. Blueprint re-exports them through `wrappers/`. Re-run `npx blueprint build` whenever you change a contract's messages or getters, or your tests will use stale types." }
      ]
    },
    {
      id: "anatomy",
      title: "Contract anatomy: state, init, getters, receivers",
      level: "core",
      body: [
        { type: "p", text: "A **`contract`** bundles **persistent state fields**, an **`init(...)`** (deploy-time constructor), **`get fun`** getters (read off-chain for free), and **receivers** (handlers for incoming messages). Fields are serialized into the contract's storage cell on every transaction, so their serialization widths directly affect gas and rent." },
        { type: "code", lang: "tact", code: "import \"@stdlib/deploy\";\n\nmessage Add { amount: Int as uint32; }   // a typed message this contract accepts\n\ncontract Counter with Deployable {\n    // --- persistent state (lives in the storage cell, pays rent) ---\n    owner: Address;\n    val: Int as uint32 = 0;               // field with serialization + default\n\n    // --- init: runs once at deploy; args are part of the contract's ADDRESS ---\n    init(owner: Address) {\n        self.owner = owner;\n    }\n\n    // --- receiver: handles an incoming internal message of type Add ---\n    receive(msg: Add) {\n        self.val += msg.amount;\n    }\n\n    // --- getter: callable OFF-CHAIN for free; cannot be called by other contracts ---\n    get fun value(): Int {\n        return self.val;\n    }\n}" },
        { type: "list", items: [
          "**State fields** must have a serialization type where relevant (`Int as uint32`). All fields together form the storage cell; keep it small to minimize rent.",
          "**`init(...)`** is the constructor. Its arguments plus the code hash **determine the contract's address** — the same init args always produce the same address (like CREATE2). Deploying is just sending the first message to that computed address.",
          "**`get fun`** getters are executed **off-chain only** (via a get-method call over the API). They are free and cannot mutate state. **Another contract on-chain cannot call your getter** — that is the async model biting again.",
          "**Receivers** are the on-chain entry points. A contract with no matching receiver for an incoming message **throws** (and the message bounces)."
        ] },
        { type: "callout", variant: "gotcha", text: "Getters look like EVM `view` functions but are fundamentally different: they only exist for **off-chain** callers (your frontend, tests, explorers). On-chain, contract A can never read contract B's getter — it must send B a message and await a reply. Design cross-contract reads as request/response message pairs." },
        { type: "callout", variant: "note", text: "Because `init` args feed the address, you deploy a contract by computing its address from `Contract.fromInit(args)` off-chain and sending TON there with a `stateInit` attached. Blueprint's generated wrapper does this for you (`Counter.fromInit(owner)`)." }
      ]
    },
    {
      id: "types",
      title: "Types: Int serialization, Address, maps, structs & optionals",
      level: "core",
      body: [
        { type: "p", text: "Tact is statically typed. Primitives map to TVM/cell concepts; the `as` clause controls **how a value is serialized into a cell** (its bit-width), which matters for state fields and message fields — but *not* for local variables (locals are always a full 257-bit int)." },
        { type: "code", lang: "tact", code: "// Int serialization — only meaningful on state/struct/message FIELDS\nfield1: Int as uint8;      // 0 .. 255\nfield2: Int as uint64;     // 0 .. 2^64-1\nfield3: Int as int32;      // signed\nfield4: Int as coins;      // variable-width nanoton amount (for TON values)\nfield5: Int;               // default: 257-bit signed (biggest, costs most bits)\n\n// other primitives\nflag: Bool;\naddr: Address;             // 267-bit standard address\nc: Cell; s: Slice; b: Builder;\nname: String;              // immutable text; build with StringBuilder\n\n// optionals: T? plus the null-handling operators\nmaybeOwner: Address?;      // may be null" },
        { type: "table", headers: ["Type", "Notes"], rows: [
          ["`Int`", "always 257-bit signed at runtime; `as uintN`/`intN`/`coins`/`varuintN` sets **stored** width"],
          ["`Bool`", "1 bit when serialized"],
          ["`Address`", "a TON address (`sender()` gives you one); compare with `==`"],
          ["`Cell` / `Slice` / `Builder`", "raw cell data / read cursor / write buffer"],
          ["`String` / `StringBuilder`", "`String` is immutable; concatenate via `beginString()...` or `.asComment()` for message bodies"],
          ["`map<K, V>`", "hash map in a cell tree; keys `Int`/`Address`, values primitives/structs. Not free to grow"],
          ["`struct` / `message`", "custom records; `message` also gets a 32-bit **opcode** so receivers can route it"],
          ["`T?`", "optional; use `!!` to assert non-null, `?` in access, `== null` to test"]
        ] },
        { type: "heading", text: "Structs, messages & maps" },
        { type: "code", lang: "tact", code: "// struct: a plain record, no opcode — used for data, getters, nested fields\nstruct Point { x: Int as int32; y: Int as int32; }\n\n// message: like a struct but carries a 32-bit opcode for routing.\n// Give an explicit opcode to match an external/standard message layout:\nmessage(0x7362d09c) TokenNotification { amount: Int as coins; from: Address; }\nmessage Transfer { to: Address; amount: Int as coins; }  // opcode auto-assigned\n\ncontract Bank {\n    // a map from holder -> balance; lives in a cell tree in storage\n    balances: map<Address, Int as coins>;\n\n    receive(msg: Transfer) {\n        let cur: Int = self.balances.get(msg.to)!! ? self.balances.get(msg.to)!! : 0;\n        // set / get / del are the core map ops\n        self.balances.set(msg.to, cur + msg.amount);\n    }\n\n    get fun balanceOf(who: Address): Int {\n        let v: Int? = self.balances.get(who);   // get returns an optional\n        return v == null ? 0 : v!!;             // !! asserts non-null\n    }\n}" },
        { type: "list", items: [
          "**Maps** are convenient but dangerous: they live in a cell tree, each entry costs storage rent, and **iterating/serializing a large map costs a lot of gas**. Never let an unbounded map grow inside a single contract — that is the EVM \"one contract holds everyone's balance\" anti-pattern (use per-holder contracts / the carry-value pattern instead).",
          "**`.get(k)`** returns an **optional** (`V?`) — null when absent. **`.set(k, v)`**, **`.del(k)`**, **`.replace(k, v)`** are the mutators. Iterate with `foreach (k, v in m) { ... }` (bounded maps only).",
          "**`!!`** asserts a value is non-null (throws if it is); **`?`** guards; comparing `== null` tests presence.",
          "A **`struct`** is pure data; a **`message`** additionally has a 32-bit opcode so a receiver can be routed to by type. Use an explicit opcode when matching a TEP standard's on-the-wire format."
        ] },
        { type: "callout", variant: "gotcha", text: "`Int as coins` (a.k.a. `varuint16`) is for **TON amounts** — it is variable-width and caps around 2^120. Using a fixed `Int as uint64` for a coin amount can overflow for large balances; using plain `Int` (257-bit) for every field wastes storage bits and rent. Match the width to the field's real domain." }
      ]
    },
    {
      id: "receivers",
      title: "Receivers & messages: internal, text, bounced, external",
      level: "core",
      body: [
        { type: "p", text: "**Receivers** are how a contract reacts to incoming messages — the only on-chain entry points. Tact routes an incoming message to a receiver by matching its type/opcode. There are four flavors, each for a different message source." },
        { type: "code", lang: "tact", code: "message Mint { amount: Int as coins; }\n\ncontract Router with Deployable {\n    owner: Address;\n    init(owner: Address) { self.owner = owner; }\n\n    // 1) EMPTY internal message (e.g. a plain TON transfer with no body)\n    receive() {\n        // often used as the deploy handler / bare top-up\n    }\n\n    // 2) TEXT message — matches a specific comment string\n    receive(\"increment\") {\n        // handle the exact text \"increment\" sent as a message comment\n    }\n\n    // 2b) arbitrary text (any comment) via a String binding\n    receive(msg: String) {\n        // msg is the comment text; parse/route yourself\n    }\n\n    // 3) TYPED internal message — routed by Mint's opcode\n    receive(msg: Mint) {\n        require(sender() == self.owner, \"only owner mints\");\n        // ... business logic; sender() is the calling contract/wallet\n    }\n\n    // 4) BOUNCED — a message WE sent came back because the recipient failed\n    bounced(msg: bounced<Mint>) {\n        // undo optimistic state; only the first 224 bits of the body come back\n    }\n\n    // 5) EXTERNAL — a message from OUTSIDE the blockchain (no sender, no value)\n    external(msg: Slice) {\n        acceptMessage();   // MUST accept to pay for gas yourself; verify signature first!\n    }\n}" },
        { type: "table", headers: ["Receiver", "Triggered by", "Key point"], rows: [
          ["`receive()`", "empty-body internal message", "bare TON transfers / deploy top-ups"],
          ["`receive(\"text\")`", "message with that exact comment", "simple human/wallet commands"],
          ["`receive(msg: T)`", "internal message with T's opcode", "the main business path; `sender()` is set"],
          ["`bounced(msg: bounced<T>)`", "a message you sent that FAILED", "async error handling — **only ~224 body bits** return"],
          ["`external(...)`", "a message from off-chain (no sender)", "must `acceptMessage()`; **you** pay gas; verify sig / replay-guard"]
        ] },
        { type: "list", items: [
          "**Internal messages** (contract-to-contract) carry a `sender()` and a `value` (attached TON). This is the normal path. If no receiver matches, the message **throws and bounces** back to the sender.",
          "**Bounced messages** are TON's async \"the call failed\" signal. If you optimistically updated state before sending, the `bounced` receiver is where you roll it back. Only the message's **first 224 bits** survive the bounce, so keep bounce-relevant data small.",
          "**External messages** originate off-chain and have **no sender and no attached value** — the contract itself must call `acceptMessage()` to pay for its own gas. This is the wallet-contract pattern: verify a signature and a **seqno** (replay protection) *before* accepting, or anyone can drain you."
        ] },
        { type: "callout", variant: "warn", text: "Never `acceptMessage()` in an `external` receiver before verifying a signature and replay counter (seqno). An external message is unauthenticated and gas is paid from the contract's balance — an attacker who reaches `acceptMessage()` with garbage can burn your funds. Check first, accept second." }
      ]
    },
    {
      id: "sending",
      title: "Sending messages: send, reply, forward & modes",
      level: "core",
      body: [
        { type: "p", text: "A contract acts on the world by **sending messages**. Sends are queued and delivered **after** the current transaction finishes — they are asynchronous. The core primitive is `send(SendParameters{...})`; `self.reply`/`self.notify`/`self.forward` are ergonomic wrappers." },
        { type: "code", lang: "tact", code: "message Payout { to: Address; amount: Int as coins; }\n\nreceive(msg: Payout) {\n    require(sender() == self.owner, \"denied\");\n\n    // full-control send\n    send(SendParameters{\n        to: msg.to,                       // recipient address\n        value: msg.amount,                // nanoton to attach (pays their gas + delivers funds)\n        mode: SendPayGasSeparately,       // how to treat value/balance/fees\n        bounce: true,                     // return funds to us if the recipient fails\n        body: \"paid\".asComment(),         // optional message body (a Cell)\n    });\n}\n\nreceive(msg: Ping) {\n    // reply: send a message BACK to sender() carrying the REMAINING value of this msg\n    self.reply(\"pong\".asComment());       // bounceable, mode = SendRemainingValue\n\n    // notify: like reply but NON-bounceable (fire-and-forget notification)\n    self.notify(\"noted\".asComment());\n\n    // forward: send to an arbitrary address, optionally deploying it (with init)\n    self.forward(target, body, false, null);\n}" },
        { type: "table", headers: ["Mode", "Meaning"], rows: [
          ["`SendPayGasSeparately` (1)", "pay fees out of the contract balance, deliver `value` in full"],
          ["`SendIgnoreErrors` (2)", "skip this action instead of aborting the whole tx if it errors"],
          ["`SendDestroyIfZero` (32)", "delete this contract if its balance hits zero after the send"],
          ["`SendRemainingValue` (64)", "attach the **remaining value of the incoming message** (what `reply` uses)"],
          ["`SendRemainingBalance` (128)", "attach the **contract's entire balance** — empties the contract"],
          ["combine with `|`", "e.g. `SendRemainingValue | SendIgnoreErrors`"]
        ] },
        { type: "list", items: [
          "**`value`** is how much TON to attach; it pays the recipient's gas and delivers funds. Attach too little and the recipient's transaction runs out of gas and **bounces**.",
          "**`mode`** decides accounting. `SendRemainingValue` (used by `reply`) forwards leftover incoming value — the natural way to pass gas along a chain without draining the contract. `SendRemainingBalance` (128) empties the contract — use only when intentionally sweeping funds.",
          "**`bounce: true`** (default) means a failed delivery returns the funds and hits your `bounced` receiver. Set `bounce: false` for deploys/notifications where you do not want a return trip.",
          "Every send you queue is **executed after** your receiver returns. You cannot observe its result within this transaction — that is the whole async model."
        ] },
        { type: "callout", variant: "tip", text: "Prefer `self.reply(...)` / `SendRemainingValue` for responses so gas flows along the message chain instead of being drained from the contract's balance. Reserve `SendRemainingBalance` (128) for deliberate \"empty this contract\" operations. Watch out combining `128` with more sends — there is nothing left to attach to them." },
        { type: "callout", variant: "note", text: "Tact 1.6 also exposes `message(MessageParameters{...})` and `deploy(DeployParameters{...})` as lower-overhead alternatives to `send(SendParameters{...})` when you do not need every field. `send` remains the general-purpose primitive shown in most examples." }
      ]
    },
    {
      id: "traits",
      title: "Traits: reusable behavior (Ownable, Deployable, Stoppable)",
      level: "core",
      body: [
        { type: "p", text: "Tact has no class inheritance; it composes behavior with **traits**. A `trait` can declare **required state fields**, receivers, functions, and constants; a `contract` pulls them in with **`with`**. The standard library ships the traits you reach for constantly." },
        { type: "code", lang: "tact", code: "import \"@stdlib/ownable\";     // Ownable, OwnableTransferable\nimport \"@stdlib/stoppable\";   // Stoppable, Resumable (require Ownable)\nimport \"@stdlib/deploy\";      // Deployable\n\ncontract Vault with Ownable, Stoppable, Deployable {\n    // traits REQUIRE these fields to exist — the compiler enforces it:\n    owner: Address;     // required by Ownable\n    stopped: Bool;      // required by Stoppable\n\n    init(owner: Address) {\n        self.owner = owner;\n        self.stopped = false;\n    }\n\n    receive(msg: Withdraw) {\n        self.requireOwner();       // provided by Ownable\n        self.requireNotStopped();  // provided by Stoppable\n        // ... business logic\n    }\n}" },
        { type: "table", headers: ["Trait (import)", "Gives you", "Requires field"], rows: [
          ["`Ownable` (`@stdlib/ownable`)", "`owner`, `requireOwner()`, `ChangeOwner` msg", "`owner: Address`"],
          ["`OwnableTransferable`", "Ownable + safe two-step ownership transfer", "`owner: Address`"],
          ["`Stoppable` (`@stdlib/stoppable`)", "`stopped`, `requireNotStopped()`, `\"Stop\"` receiver, `stopped()` getter", "`owner`, `stopped: Bool`"],
          ["`Resumable`", "Stoppable + a `\"Resume\"` receiver", "`owner`, `stopped: Bool`"],
          ["`Deployable` (`@stdlib/deploy`)", "a standard `Deploy` handler + deploy-notification reply", "— (adds a receiver)"]
        ] },
        { type: "heading", text: "Defining your own trait" },
        { type: "code", lang: "tact", code: "trait Counter {\n    // required state: any contract using this trait MUST declare `val`\n    val: Int;\n\n    // abstract: no body here — the contract must implement it\n    abstract fun onOverflow();\n\n    // virtual: has a default body, but a contract may override it\n    virtual fun step(): Int { return 1; }\n\n    receive(\"inc\") {\n        self.val += self.step();\n        if (self.val > 1000) { self.onOverflow(); }\n    }\n}\n\ncontract MyCounter with Counter {\n    val: Int as uint32 = 0;\n    override fun step(): Int { return 2; }   // override the virtual default\n    override fun onOverflow() { self.val = 0; }\n}" },
        { type: "list", items: [
          "**`with`** composes one or more traits into a contract (comma-separated). Traits can require fields, which the compiler forces the contract to declare — a clean way to share receivers and invariants.",
          "**`virtual`** functions/constants have a default and may be `override`-ridden; **`abstract`** ones have no body and *must* be implemented by the contract.",
          "Traits can extend other traits (`trait A with B`), and the standard traits build on each other — `Stoppable` requires `Ownable`, `Deployable` bundles a standard deploy flow."
        ] },
        { type: "callout", variant: "gotcha", text: "A trait's required fields are declared *without* serialization in the trait, but your contract must declare them **with** a concrete serialization (`owner: Address`, `stopped: Bool`). Forgetting a required field (e.g. adding `Stoppable` but not `stopped: Bool`) is a compile error — read the trait's docs for its required fields." }
      ]
    },
    {
      id: "functions",
      title: "Functions: fun, get fun, extends/mutates & native",
      level: "core",
      body: [
        { type: "p", text: "Tact has several function kinds: contract methods (`fun`, `get fun`), free/global functions, extension functions (`extends`), mutating extensions (`mutates`), and FunC bindings (`native`)." },
        { type: "code", lang: "tact", code: "// a free (global) function — pure helper, no contract context\nfun clamp(x: Int, lo: Int, hi: Int): Int {\n    if (x < lo) { return lo; }\n    if (x > hi) { return hi; }\n    return x;\n}\n\n// extension function: adds a method to an existing type (self is the receiver)\nextends fun isZeroAddress(self: Address): Bool {\n    return self == newAddress(0, 0);\n}\n\n// mutating extension: may modify self in place (call site must be a variable)\nextends mutates fun double(self: Int) {\n    self *= 2;\n}\n\n// native: bind a low-level FunC function into Tact\n@name(\"my_func_helper\")\nnative funcHelper(x: Int): Int;\n\ncontract Demo {\n    n: Int as uint32 = 0;\n\n    // contract method: internal helper, can read/write self\n    fun bump() { self.n += 1; }\n\n    // getter: off-chain, read-only\n    get fun current(): Int { return self.n; }\n\n    receive(\"go\") {\n        let a: Int = clamp(500, 0, 100);   // -> 100\n        self.bump();\n    }\n}" },
        { type: "list", items: [
          "**`fun`** inside a contract is an internal method with access to `self`; **`get fun`** is an off-chain getter (free, read-only, not callable by other contracts).",
          "**`extends fun`** adds method-call syntax to any type (`addr.isZeroAddress()`); **`extends mutates fun`** may mutate its `self` and must be called on an assignable variable.",
          "**`native`** binds a FunC function by name (`@name(...)`) — the escape hatch to drop below Tact when you need raw TVM behavior or a stdlib primitive Tact doesn't wrap.",
          "Free functions (declared at top level) are pure utilities with no `self` — good for math/validation shared across contracts and traits."
        ] },
        { type: "callout", variant: "note", text: "Getters are compiled as TVM **get-methods** and can only be invoked off-chain. There is deliberately no way for one deployed contract to call another's `get fun` — reinforcing that all on-chain cross-contract communication is via messages." }
      ]
    },
    {
      id: "stdlib",
      title: "Standard library: context, sender, require, dump, emit",
      level: "core",
      body: [
        { type: "p", text: "Tact's stdlib (auto-imported, with `@stdlib/*` for optional traits) gives you the transaction context, guards, and debugging tools you use in almost every receiver." },
        { type: "code", lang: "tact", code: "receive(msg: Order) {\n    let ctx: Context = context();     // full incoming-message context\n    // ctx.sender  : Address   (== sender())\n    // ctx.value   : Int       nanoton attached to THIS message\n    // ctx.bounced : Bool      was this a bounced message?\n    // ctx.raw     : Slice     the raw message body\n\n    require(sender() == self.owner, \"unauthorized\");   // guard: throws + bounces on false\n    require(ctx.value >= ton(\"0.1\"), \"attach more gas\");\n\n    let t: Int = now();               // current unix time (seconds)\n    let me: Address = myAddress();     // this contract's address\n    let bal: Int = myBalance();         // this contract's balance (nanoton)\n\n    dump(ctx.value);                  // debug print — sandbox/testnet only (needs debug: true)\n    emit(OrderPlaced{ id: msg.id }.toCell());   // log an event as an outbound external msg\n}" },
        { type: "table", headers: ["Function", "Returns / does"], rows: [
          ["`sender()`", "`Address` of the message sender (auth source for internal msgs)"],
          ["`context()`", "`Context{ bounced, sender, value, raw }` for the incoming message"],
          ["`now()`", "current block unix time in seconds"],
          ["`myAddress()` / `myBalance()`", "this contract's address / TON balance"],
          ["`require(cond, \"msg\")`", "throw (and bounce) if `cond` is false"],
          ["`dump(x)` / `dumpStack()`", "debug output — **only** when compiled with `debug: true`; strip for prod"],
          ["`emit(cell)`", "send a log as an external outbound message (how you emit \"events\")"],
          ["`ton(\"1.5\")` / `nanoToTon`", "convert human TON strings to nanoton literals"]
        ] },
        { type: "callout", variant: "gotcha", text: "`emit(...)` is not a cheap EVM `LOG`. It sends a real **outbound external message**, and indexers watch for it — but it consumes gas and the message body is a cell. Off-chain tools reconstruct history from these. `dump()` is purely a debug aid and is a no-op (or compile-stripped) unless `debug: true`; never rely on it in production paths." }
      ]
    },
    {
      id: "jettons-nfts",
      title: "Jettons (TEP-74) & NFTs (TEP-62): the master/wallet pattern",
      level: "core",
      body: [
        { type: "p", text: "This is where TON diverges most sharply from the EVM. A fungible token on Ethereum is **one** ERC-20 contract holding a `mapping(address => uint256)`. On TON that design would not shard and would create a storage/gas hotspot. Instead, TON tokens (**Jettons**, TEP-74) are **many contracts**: one **Jetton master** (metadata + total supply + minting) and **one Jetton wallet contract per holder**." },
        { type: "table", headers: ["", "ERC-20 (EVM)", "Jetton (TON, TEP-74)"], rows: [
          ["Contracts", "1 contract, one balances map", "1 master + **1 wallet per holder**"],
          ["Your balance", "a row in the master's map", "the state of **your own** wallet contract"],
          ["Transfer", "master mutates two map rows atomically", "**your wallet → recipient's wallet** via async internal messages"],
          ["Read balance", "`balanceOf(you)` on the master", "get-method on **your** jetton-wallet contract"],
          ["Why", "cheap synchronous state", "sharding + no single hotspot; **carry-value** pattern"]
        ] },
        { type: "heading", text: "The transfer flow" },
        { type: "list", items: [
          "To send Jettons, you message **your own** jetton-wallet with a `TokenTransfer` (opcode `0x0f8a7ea5`). Your wallet decrements its balance and sends an **`internal transfer`** message to the *recipient's* jetton-wallet.",
          "The recipient's wallet increments its balance and (optionally) sends a **`TokenNotification`** (opcode `0x7362d09c`) to its owner so the owner contract learns tokens arrived.",
          "Leftover gas is returned via an `excesses` message. This is the **carry-value pattern**: value/authority travels *with* the message instead of being looked up in a central table.",
          "**NFTs (TEP-62)** mirror this: an **NFT collection** contract mints **NFT item** contracts, one per token. Ownership lives in each item; transfer is a message to the item contract."
        ] },
        { type: "code", lang: "tact", code: "// standard Jetton transfer body (TEP-74). Send THIS to your own jetton wallet.\nmessage(0x0f8a7ea5) TokenTransfer {\n    queryId: Int as uint64;\n    amount: Int as coins;            // how many jettons\n    destination: Address;            // the RECIPIENT (owner), not their wallet\n    responseDestination: Address?;   // where to refund leftover gas\n    customPayload: Cell?;\n    forwardTonAmount: Int as coins;  // TON to forward to trigger a notification\n    forwardPayload: Slice as remaining;\n}\n\n// what a receiving owner contract handles to know tokens arrived:\nmessage(0x7362d09c) TokenNotification {\n    queryId: Int as uint64;\n    amount: Int as coins;\n    from: Address;                   // the SENDER's owner address\n    forwardPayload: Slice as remaining;\n}" },
        { type: "callout", variant: "tip", text: "Don't hand-roll Jettons/NFTs. Use the audited **`@ton-community` / `tact-lang/jetton`** reference implementations (TEP-74 compatible, gas-optimized) and extend them, the way you'd inherit OpenZeppelin on the EVM. Getting the master/wallet address derivation and forward-gas accounting exactly right is subtle." },
        { type: "callout", variant: "gotcha", text: "A jetton-wallet only trusts `internal transfer` messages from the **correct sibling wallet address** (derived from the master + owner). Skipping that check lets anyone mint balance into a wallet. Always validate that the sender is the expected wallet computed from the master's code + the owner — the standard implementations do this for you." }
      ]
    },
    {
      id: "gas-storage",
      title: "Gas, message value & storage rent",
      level: "core",
      body: [
        { type: "p", text: "On TON you pay in three places: **compute gas** (executing your receiver), **forward/action fees** (sending messages), and **storage rent** (keeping bytes on-chain over time). Because messages are async and each hop needs its own gas, **value accounting** is a design responsibility, not an afterthought." },
        { type: "list", items: [
          "**Attach enough value.** A message's `value` pays the recipient's gas. Under-fund it and the recipient's transaction aborts and **bounces** — a half-completed multi-contract operation. Estimate downstream gas and forward it.",
          "**Forward, don't hoard.** Use `SendRemainingValue`/`self.reply` so leftover incoming value flows to the next hop, and refund true excess to the user (`responseDestination`) rather than accumulating it in the contract.",
          "**Storage rent is continuous.** TON charges per byte of state per unit time. A contract whose balance drains below the rent threshold gets **frozen** and can be deleted. Keep a small TON reserve and keep state small.",
          "**Keep state small & flat.** Every field adds bits to the storage cell you serialize on *every* transaction. Large maps mean big cell trees, more gas per tx, and more rent. Prefer the **carry-value / per-holder-contract** pattern over one giant map.",
          "**Reserve balance** with `nativeReserve(amount, mode)` when you need to guarantee funds stay after sends (e.g. keep rent buffer before sweeping with mode 128)."
        ] },
        { type: "code", lang: "tact", code: "receive(msg: Forward) {\n    let ctx: Context = context();\n    // demand enough gas up front so downstream sends don't bounce\n    require(ctx.value >= ton(\"0.05\"), \"insufficient gas attached\");\n\n    // keep a rent buffer on this contract, then forward the rest\n    nativeReserve(ton(\"0.02\"), ReserveExact);\n    send(SendParameters{\n        to: msg.target,\n        value: 0,\n        mode: SendRemainingBalance,   // sweep what's left after the reserve\n        bounce: true,\n        body: msg.payload,\n    });\n}" },
        { type: "callout", variant: "warn", text: "The classic TON money bug: forwarding `SendRemainingBalance` (128) without first reserving a rent buffer empties the contract, and the next storage charge freezes it. Reserve (or send a fixed `value` with `SendPayGasSeparately`) so the contract keeps enough TON to pay rent and stay alive." }
      ]
    },
    {
      id: "testing",
      title: "Testing: @ton/sandbox + Jest",
      level: "core",
      body: [
        { type: "p", text: "Blueprint tests run against **`@ton/sandbox`** — a full TVM blockchain running **in-process**, so you can deploy contracts, send messages, and inspect the resulting transactions and getters, all in Jest. You interact through the **generated TS wrapper** for your contract." },
        { type: "code", lang: "ts", code: "// tests/Counter.spec.ts\nimport { Blockchain, SandboxContract, TreasuryContract } from \"@ton/sandbox\";\nimport { toNano } from \"@ton/core\";\nimport { Counter } from \"../wrappers/Counter\";\nimport \"@ton/test-utils\";   // adds the toHaveTransaction matcher\n\ndescribe(\"Counter\", () => {\n  let blockchain: Blockchain;\n  let deployer: SandboxContract<TreasuryContract>;\n  let counter: SandboxContract<Counter>;\n\n  beforeEach(async () => {\n    blockchain = await Blockchain.create();\n    deployer = await blockchain.treasury(\"deployer\");   // a funded test wallet\n\n    // compute address from init args and get a wrapper bound to the sandbox\n    counter = blockchain.openContract(await Counter.fromInit(deployer.address));\n\n    // deploy by sending the first message (Deployable's Deploy handler)\n    const res = await counter.send(\n      deployer.getSender(),\n      { value: toNano(\"0.05\") },\n      { $$type: \"Deploy\", queryId: 0n },\n    );\n    expect(res.transactions).toHaveTransaction({\n      from: deployer.address, to: counter.address, deploy: true, success: true,\n    });\n  });\n\n  it(\"increments\", async () => {\n    await counter.send(\n      deployer.getSender(),\n      { value: toNano(\"0.05\") },\n      { $$type: \"Add\", amount: 5n },\n    );\n    expect(await counter.getValue()).toBe(5n);   // read the get fun\n  });\n});" },
        { type: "list", items: [
          "**`Blockchain.create()`** spins up an isolated in-process TVM; **`blockchain.treasury(name)`** gives a pre-funded wallet to send from.",
          "**`blockchain.openContract(await X.fromInit(args))`** binds the wrapper to a computed address; the first `.send(...)` deploys it.",
          "**`toHaveTransaction({...})`** (from `@ton/test-utils`) asserts a transaction happened with matchers like `from`, `to`, `success`, `deploy`, `exitCode`, `op` — the primary way you verify async message flows.",
          "**Getters** are called directly (`await counter.getValue()`) since the wrapper exposes them; results are `bigint`.",
          "Run with **`npx blueprint test`** (or `npm test`). Use `blockchain.now = ...` to control time and inspect `result.transactions` for the full message tree."
        ] },
        { type: "callout", variant: "tip", text: "Because sends are async, one `.send(...)` can produce a *tree* of transactions (your contract → a jetton wallet → a notification …). Assert on the whole tree with multiple `toHaveTransaction` calls, and check `exitCode`/`success` on each hop — a green top-level tx can still hide a bounced downstream message." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment & client interaction (wrappers, @ton/ton)",
      level: "core",
      body: [
        { type: "p", text: "Deploys and interactions are **scripts** in `scripts/`, run with `npx blueprint run`. Blueprint handles wallet connection (Tonkeeper via TON Connect, a mnemonic, or a deeplink) and network choice (testnet/mainnet). From a real client you use `@ton/ton` + the generated wrapper." },
        { type: "code", lang: "ts", code: "// scripts/deployCounter.ts\nimport { toNano } from \"@ton/core\";\nimport { Counter } from \"../wrappers/Counter\";\nimport { NetworkProvider } from \"@ton/blueprint\";\n\nexport async function run(provider: NetworkProvider) {\n  const counter = provider.open(\n    await Counter.fromInit(provider.sender().address!),\n  );\n\n  await counter.send(\n    provider.sender(),\n    { value: toNano(\"0.05\") },\n    { $$type: \"Deploy\", queryId: 0n },\n  );\n\n  await provider.waitForDeploy(counter.address);\n  console.log(\"deployed at\", counter.address.toString());\n}" },
        { type: "code", lang: "bash", code: "npx blueprint run                     # pick a script, network (testnet/mainnet), wallet\nnpx blueprint run deployCounter --testnet --mnemonic\nnpx blueprint run deployCounter --mainnet --tonconnect   # sign with Tonkeeper" },
        { type: "code", lang: "ts", code: "// interacting from a standalone client (frontend/backend)\nimport { TonClient } from \"@ton/ton\";\nimport { Address, toNano } from \"@ton/core\";\nimport { Counter } from \"./Counter\";   // the generated wrapper\n\nconst client = new TonClient({ endpoint: \"https://toncenter.com/api/v2/jsonRPC\" });\nconst counter = client.open(Counter.fromAddress(Address.parse(\"EQ...\")));\n\nconst value = await counter.getValue();          // off-chain getter, free\nconsole.log(value);\n// to write, send a message via a connected wallet (TON Connect) instead of a getter" },
        { type: "list", items: [
          "The **generated wrapper** (`Counter`) is the single source of truth for messages and getters — `fromInit(args)` for a not-yet-deployed contract, `fromAddress(addr)` for a live one.",
          "**`@ton/core`** provides `Address`, `Cell`, `toNano`/`fromNano`, and the serialization primitives; **`@ton/ton`** provides `TonClient` (RPC access) and wallet contracts; **`@ton/crypto`** handles key pairs and mnemonics.",
          "**Deploying is sending a message** with the contract's `stateInit` attached. Blueprint computes the address from `fromInit` and sends the first message; `waitForDeploy` polls until code appears at that address.",
          "For production frontends, use **TON Connect** so users sign with their own wallet (Tonkeeper), never a raw mnemonic in the browser."
        ] },
        { type: "callout", variant: "note", text: "Re-run `npx blueprint build` after any contract change so the wrapper's message types and getter signatures stay in sync. A stale wrapper encodes the wrong opcodes/fields and your messages silently route to the wrong (or no) receiver." }
      ]
    },
    {
      id: "security",
      title: "Security (TON-specific): bounces, replay, carry-value",
      level: "core",
      body: [
        { type: "p", text: "TON's security model is different because execution is async. Classic EVM reentrancy (a callee re-entering mid-call) does not exist the same way — but new hazards appear from **message ordering**, **bounces**, and the **carry-value** design. Contracts still hold real value on an adversarial network; treat every incoming message as hostile." },
        { type: "list", items: [
          "**Handle `bounced`.** If you optimistically update state before sending a message (decrement a balance, mark something sent), you MUST implement `bounced(...)` to roll it back when delivery fails. Forgetting this leaves permanently inconsistent state. Remember only the first ~224 bits of the body return.",
          "**Replay protection for externals (seqno).** External messages are unauthenticated and have no sender. Wallet-style contracts must verify a **signature** and a monotonically increasing **seqno** *before* `acceptMessage()`, or a replayed message re-executes. This is TON's answer to nonces.",
          "**Validate `sender()` on every privileged internal message.** With per-holder contracts (jetton wallets), trust must be derived: a wallet only accepts `internal transfer` from the *specific* sibling wallet address computed from the master + owner. Never trust an address just because it sent you a well-formed message.",
          "**Value/gas checks.** Require a minimum attached `ctx.value` before doing work that sends downstream messages, so you don't strand a half-finished operation when gas runs out.",
          "**Reentrancy under async.** A contract processes one message at a time, so there is no synchronous re-entry. But state can change *between* the message you sent and the reply you get back — never assume the world is unchanged across an async round trip. Design for stale replies (include a `queryId`/expected state and re-check on the reply).",
          "**Unbounded storage / maps.** A map an attacker can grow (one entry per spam message) inflates your storage cell, gas, and rent until the contract is unusable. Bound growth or push state out to per-user contracts.",
          "**Carry-value correctly.** Value and authority travel *with* messages. Losing track (forgetting to forward, wrong mode) means funds get stuck in an intermediate contract. Account for every nanoton across the message chain."
        ] },
        { type: "code", lang: "tact", code: "message Send { to: Address; amount: Int as coins; }\n\ncontract Wallet with Ownable {\n    owner: Address;\n    balance: Int as coins = 0;\n    init(owner: Address) { self.owner = owner; }\n\n    receive(msg: Send) {\n        require(sender() == self.owner, \"denied\");\n        require(self.balance >= msg.amount, \"insufficient\");\n        self.balance -= msg.amount;                 // optimistic update\n        send(SendParameters{\n            to: msg.to, value: msg.amount, mode: SendPayGasSeparately, bounce: true,\n            body: emptyCell(),\n        });\n    }\n\n    // if delivery fails, the funds come back -> restore state\n    bounced(msg: bounced<Send>) {\n        self.balance += msg.amount;   // roll back the optimistic decrement\n    }\n}" },
        { type: "callout", variant: "warn", text: "Audit reality: the most common TON exploits are missing `sender()`/wallet-address validation (fake token deposits), missing `bounced` handling (funds lost or double-counted), and unauthenticated externals accepting gas. TON's own guidance and third-party audits (e.g. CertiK's Tact write-ups) all center on these — not on EVM-style reentrancy." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns for developers arriving from the EVM (or from FunC). Most trace back to one root cause: **TON is asynchronous and everything is a separate actor.**" },
        { type: "heading", text: "1. Expecting synchronous cross-contract calls" },
        { type: "callout", variant: "warn", text: "You cannot call another contract and read its return value in the same transaction. There is no `token.balanceOf(x)` that returns a number on-chain. **Fix:** model it as request/response messages (send, then handle a reply in a later tx), and design for the reply possibly never arriving (bounce/timeout)." },
        { type: "heading", text: "2. Forgetting to handle bounced messages" },
        { type: "callout", variant: "gotcha", text: "If you optimistically mutate state then send a message, a delivery failure bounces back — and without a `bounced(...)` receiver your state is now wrong forever. **Fix:** implement `bounced<T>` to undo the optimistic change. Keep bounce-critical data in the first ~224 bits of the body, since that's all that returns." },
        { type: "heading", text: "3. Gas/value accounting on sends" },
        { type: "callout", variant: "gotcha", text: "Attaching too little `value` makes the recipient's tx run out of gas and bounce; using `SendRemainingBalance` (128) without reserving empties the contract and freezes it on the next rent charge. **Fix:** `require(ctx.value >= ...)`, forward with `SendRemainingValue`/`reply`, and `nativeReserve(...)` a rent buffer before sweeping." },
        { type: "heading", text: "4. Treating a token like one ERC-20 contract" },
        { type: "callout", variant: "gotcha", text: "There is no single Jetton contract with everyone's balance — each holder has their **own** jetton-wallet contract. **Fix:** send transfers to *your own* wallet, validate incoming `internal transfer` comes from the correct sibling wallet address, and read balances from the holder's wallet get-method. Use the audited reference implementations." },
        { type: "heading", text: "5. Storage rent & bloated state" },
        { type: "callout", variant: "warn", text: "Storage is rented continuously; a drained contract gets frozen and can be deleted. Big maps serialized every tx also spike gas. **Fix:** keep the storage cell small and flat, keep a TON reserve for rent, and push per-user state into per-user contracts (carry-value) instead of one growing map." },
        { type: "heading", text: "6. Int serialization width mismatches" },
        { type: "callout", variant: "gotcha", text: "A field `Int as uint32` throws (exit code 5) the moment you store a value ≥ 2^32; a coin amount in `uint64` can overflow for large balances; plain `Int` (257-bit) everywhere wastes bits and rent. **Fix:** size each field to its real domain — `as coins` for TON amounts, appropriately sized `uintN`/`intN` for the rest." },
        { type: "heading", text: "7. Unauthenticated external messages" },
        { type: "callout", variant: "warn", text: "`external(...)` messages have no sender and the contract pays their gas. Calling `acceptMessage()` before verifying a signature + seqno lets attackers burn your balance or replay actions. **Fix:** verify signature and increment seqno *before* `acceptMessage()`. This is how wallet contracts stay safe." },
        { type: "heading", text: "8. Map gas costs & iteration" },
        { type: "callout", variant: "gotcha", text: "Maps live in cell trees; `.get`/`.set` traverse cells (gas per level) and iterating a large map can blow the gas limit. **Fix:** avoid unbounded maps, never iterate attacker-growable maps in one message, and prefer per-holder contracts. Use `foreach` only on maps you know stay small." },
        { type: "callout", variant: "note", text: "General discipline: compile with `debug: true` and use `dump()` in the sandbox (never prod), assert on the whole transaction *tree* in tests (each hop's `success`/`exitCode`), validate `sender()` on every privileged path, handle every `bounced`, and lean on audited standard traits and Jetton/NFT reference contracts rather than rolling your own." }
      ]
    }
  ],

  packages: [
    { name: "@tact-lang/compiler", why: "the Tact compiler — compiles .tact to FunC/TVM and emits TypeScript bindings (v1.6.x)" },
    { name: "@ton/blueprint", why: "the standard dev environment: scaffold, build, generate wrappers, test, deploy scripts" },
    { name: "@ton/sandbox", why: "in-process TVM blockchain for fast, isolated tests (Blockchain.create, treasury)" },
    { name: "@ton/test-utils", why: "Jest matchers for TON — the toHaveTransaction matcher for asserting message trees" },
    { name: "@ton/core", why: "core primitives: Address, Cell, Slice, Builder, toNano/fromNano, serialization" },
    { name: "@ton/ton", why: "TonClient (RPC access), wallet contracts, and helpers for talking to real networks" },
    { name: "@ton/crypto", why: "key pairs, mnemonics, and signing for wallets and external-message auth" },
    { name: "create-ton", why: "the `npm create ton@latest` scaffolder that bootstraps a Blueprint project" },
    { name: "@stdlib/ownable", why: "Ownable / OwnableTransferable traits — owner field, requireOwner(), ChangeOwner" },
    { name: "@stdlib/stoppable", why: "Stoppable / Resumable traits — emergency stop switch gated by the owner" },
    { name: "@stdlib/deploy", why: "Deployable trait — a standard Deploy handler + deploy-notification reply" },
    { name: "tact-lang/jetton", why: "TEP-74-compatible, gas-optimized Jetton (fungible token) reference implementation in Tact" },
    { name: "@ton-community/tact reference NFTs", why: "TEP-62 NFT collection/item reference contracts to extend instead of hand-rolling" },
    { name: "@tact-lang/tact-language-server / intelli-tact", why: "editor tooling: LSP for VS Code and the JetBrains plugin (types, hovers, diagnostics)" }
  ],

  gotchas: [
    "**No synchronous cross-contract calls.** You cannot call another contract and read its return in the same tx — send a message and handle a reply in a later transaction. This is the #1 EVM-to-TON mistake.",
    "**Handle `bounced<T>`.** If you optimistically update state before a send, a failed delivery bounces back — without a `bounced` receiver your state is permanently wrong. Only the first ~224 bits of the body return.",
    "**Getters are off-chain only.** `get fun` is free for your frontend/tests but **cannot be called by another contract** on-chain. Cross-contract reads must be request/response messages.",
    "**Attach enough `value`.** A message's value pays the recipient's gas; under-fund it and the recipient's tx runs out of gas and bounces, stranding a multi-hop operation.",
    "**`SendRemainingBalance` (128) empties the contract** — sweep only intentionally, and `nativeReserve(...)` a rent buffer first or the next storage charge freezes the contract.",
    "**Storage rent is continuous.** TON charges per byte over time; a drained contract is frozen/deleted. Keep the storage cell small and flat and keep a TON reserve.",
    "**A Jetton is many contracts:** one master + one wallet per holder. Send transfers to your *own* wallet, and validate `internal transfer` comes from the correct sibling wallet address — don't trust any sender.",
    "**Int width mismatches throw.** Storing a value that doesn't fit a field's `as uintN` throws (exit code 5). Use `as coins` for TON amounts and size each field to its real range.",
    "**Externals are unauthenticated.** `external(...)` has no sender and the contract pays its gas — verify signature + seqno **before** `acceptMessage()` or you'll be drained/replayed.",
    "**Cells are 1023 bits + 4 refs.** Big records spill into child cells; deep cell trees (large maps) cost gas per level and inflate rent. Prefer per-holder contracts / carry-value over one giant map.",
    "**Maps aren't cheap or safe to iterate.** Every entry costs rent and `foreach` over a large or attacker-growable map can exceed the gas limit — bound growth or move state out to per-user contracts.",
    "**Rebuild wrappers after contract changes** (`npx blueprint build`). A stale wrapper encodes wrong opcodes/fields and routes messages to the wrong (or no) receiver.",
    "**`init` args determine the address** (like CREATE2). Same args + code = same address; changing an init arg deploys a *different* contract at a *different* address.",
    "**`dump()` is debug-only.** It's a no-op unless compiled with `debug: true`; `emit()` (real outbound external message) is the actual way to log events, and it costs gas.",
    "**Validate `sender()` on every privileged internal message.** A well-formed message from the wrong address is still an attack — derive expected addresses, don't trust arbitrary senders."
  ],

  flashcards: [
    { q: "Why can't you call another TON contract and read its return value?", a: "TON is an **actor model with asynchronous message passing**. A send is queued and delivered in a *separate* later transaction; there's no synchronous return. To read another contract you send it a message and it must message you back — a multi-tx round trip." },
    { q: "What is a cell, and what are Slice/Builder?", a: "A **cell** holds up to **1023 bits + 4 refs** and is the unit of storage/messages/code. A **`Builder`** constructs a cell (`store*`); a **`Slice`** parses one (`load*`, in the same order). `Cell` is immutable." },
    { q: "What does `get fun` compile to and who can call it?", a: "A TVM **get-method**, callable **off-chain only** (frontend/tests/explorers) and free. Another deployed contract **cannot** call it — on-chain reads must be async messages." },
    { q: "What determines a contract's address on TON?", a: "The **`init(...)` arguments plus the code hash** (like CREATE2). Same init args + code always yield the same address; deploying is sending the first message with the stateInit attached." },
    { q: "Name the four receiver kinds.", a: "`receive()` (empty msg), `receive(\"text\")`/`receive(msg: String)` (comments), `receive(msg: T)` (typed internal, routed by opcode), `bounced(msg: bounced<T>)` (a failed send returns), and `external(...)` (off-chain, no sender, must `acceptMessage()`)." },
    { q: "What is a bounced message and why must you handle it?", a: "When a message you sent fails to deliver/execute, it **bounces** back to you asynchronously. If you optimistically changed state before sending, the `bounced(...)` receiver is where you roll it back. Only the first ~224 body bits return." },
    { q: "What does `Int as coins` mean and when do you use it?", a: "A variable-width (`varuint16`) serialization for **TON/nanoton amounts**, capping ~2^120. Use it for value fields; use sized `uintN`/`intN` for other integers. The `as` clause sets *stored* width only — locals are always 257-bit." },
    { q: "How does a Jetton differ from an ERC-20?", a: "ERC-20 is one contract with a balances map. A **Jetton (TEP-74)** is a **master contract + one wallet contract per holder**; transfers are async messages between the sender's and recipient's wallet contracts (the carry-value pattern)." },
    { q: "What do `send`, `self.reply`, and `self.notify` do?", a: "`send(SendParameters{...})` is the full-control primitive. `self.reply(body)` messages `sender()` back with `SendRemainingValue` (bounceable). `self.notify(body)` is the same but non-bounceable fire-and-forget." },
    { q: "What are send modes 64 and 128?", a: "`SendRemainingValue` (64) attaches the **remaining value of the incoming message** (what `reply` uses — forwards gas along the chain). `SendRemainingBalance` (128) attaches the **contract's entire balance**, emptying it — sweep only, and reserve a rent buffer first." },
    { q: "How do traits work in Tact?", a: "No class inheritance — a `contract ... with TraitA, TraitB` composes traits. Traits can require state fields (compiler-enforced), and declare `virtual` (overridable) / `abstract` (must-implement) functions. Stdlib gives Ownable, Stoppable, Deployable." },
    { q: "What replay protection do wallet/external contracts need?", a: "External messages are unauthenticated with no sender, and the contract pays their gas. You must verify a **signature** and a monotonic **seqno** *before* `acceptMessage()` — TON's equivalent of a nonce — or messages can be replayed." },
    { q: "What is storage rent and why does it shape design?", a: "TON charges continuously per byte of on-chain state; a contract that drains below threshold is **frozen/deleted**. So you keep state small and flat, keep a TON reserve, and push per-user data into per-user contracts rather than one big map." },
    { q: "How do you test Tact contracts?", a: "Blueprint + **`@ton/sandbox`** (in-process TVM) + Jest. `Blockchain.create()`, `blockchain.treasury(name)` for funded wallets, `openContract(await X.fromInit(...))` to deploy, and **`toHaveTransaction({...})`** (from `@ton/test-utils`) to assert on the transaction tree; call getters directly." },
    { q: "Why is reentrancy different on TON?", a: "A contract processes one message at a time, so there's no synchronous re-entry mid-call. The real hazard is **state changing between the message you sent and the reply you get back** — design for stale replies (queryId + re-check) rather than EVM-style CEI/guards." },
    { q: "What is the carry-value pattern?", a: "Instead of a central table of balances, **value and authority travel with the message** to per-holder contracts (as in Jettons). It shards well and avoids hotspots, but you must account for every nanoton across the message chain and validate sibling addresses." }
  ],

  cheatsheet: [
    { label: "New project", code: "npm create ton@latest my-app   # choose Tact" },
    { label: "Add a contract", code: "npx blueprint create Counter --type tact-empty" },
    { label: "Build (+ wrappers)", code: "npx blueprint build" },
    { label: "Test (sandbox+Jest)", code: "npx blueprint test" },
    { label: "Deploy / run script", code: "npx blueprint run deployCounter --testnet" },
    { label: "Contract skeleton", code: "contract C with Deployable { v: Int as uint32 = 0; init() {} receive(m: Add){ self.v += m.amount; } get fun val(): Int { return self.v; } }" },
    { label: "Typed message", code: "message Add { amount: Int as uint32; }   // opcode auto-assigned" },
    { label: "Message w/ opcode", code: "message(0x0f8a7ea5) TokenTransfer { amount: Int as coins; destination: Address; }" },
    { label: "Send full control", code: "send(SendParameters{ to: a, value: ton(\"0.1\"), mode: SendPayGasSeparately, bounce: true, body: \"hi\".asComment() });" },
    { label: "Reply (forward gas)", code: "self.reply(\"pong\".asComment());   // SendRemainingValue, bounceable" },
    { label: "Guard / context", code: "let ctx = context(); require(sender() == self.owner, \"denied\");" },
    { label: "Map ops", code: "m.set(k, v);  let x: V? = m.get(k);  m.del(k);  foreach (k, v in m) { }" },
    { label: "Optional handling", code: "let n: Int = m.get(k) == null ? 0 : m.get(k)!!;   // !! asserts non-null" },
    { label: "Bounced handler", code: "bounced(msg: bounced<Send>) { self.balance += msg.amount; }" },
    { label: "Reserve rent buffer", code: "nativeReserve(ton(\"0.02\"), ReserveExact); // before SendRemainingBalance" },
    { label: "Test assertion", code: "expect(res.transactions).toHaveTransaction({ from, to, success: true });" }
  ]
});
