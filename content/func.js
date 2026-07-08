(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "func",
  name: "FunC",
  language: "FunC",
  group: "TON",
  color: "#0088cc",
  readMinutes: 28,
  tagline: "The **low-level, gas-precise** language of **TON** smart contracts — a C-like layer over the stack-based **TVM**, compiled through **Fift** to TVM assembly. Wallets, jettons and NFTs are written in it.",

  sections: [
    {
      id: "overview",
      title: "Overview: FunC, TVM & where it sits",
      level: "core",
      body: [
        { type: "p", text: "**FunC** is a domain-specific, C-like language for writing **TON (The Open Network)** smart contracts. You never write raw VM code: FunC compiles to **Fift** assembly, which assembles to **TVM** (TON Virtual Machine) bytecode that actually runs on-chain. TVM is a **stack machine** — arguments and results flow through an operand stack — so reading FunC well means keeping a stack-machine mental model even though the syntax looks like C." },
        { type: "p", text: "TON's language stack has three layers you should know in 2026: **FunC** (low-level, manual, gas-precise — this deck), **Tolk** (the newer, friendlier successor the TON core team now recommends for *new* contracts — think \"FunC with modern syntax\"), and **Tact** (a high-level, safe, TypeScript-flavored language). **Tact and Tolk ultimately express the same TVM/cell concepts FunC exposes directly** — so FunC is still the language to understand the machine, audit production code, and squeeze gas." },
        { type: "table", headers: ["Aspect", "FunC", "Tact (high-level)"], rows: [
          ["Level", "low-level, close to TVM opcodes", "high-level, abstracted"],
          ["Safety", "manual — you serialize everything by hand", "structs/messages auto-serialized, typed"],
          ["Gas", "precise, hand-tunable — cheapest", "convenient, some overhead"],
          ["Storage", "you build & parse the storage cell yourself", "declared fields, compiler generates layout"],
          ["Best for", "wallets, standards, gas-critical hot paths, audits", "app contracts written fast & safely"],
          ["Mental model", "cells, slices, builders, stack", "actors/messages/structs"]
        ] },
        { type: "callout", variant: "note", text: "**Why FunC still matters in 2026:** the reference wallet contracts, the standard **Jetton** (fungible token) and **NFT** contracts, and most gas-critical DeFi code are written in FunC. The FunC compiler is now in maintenance (last release around **v2025.07**) with active language work shifting to **Tolk**, but the huge existing corpus and the need to *read* TVM behavior keep FunC essential. Learn FunC and Tolk/Tact become easy." },
        { type: "callout", variant: "tip", text: "This deck uses **Blueprint** (the standard TON dev environment) with the **FunC** contract type, plus `@ton/sandbox` + Jest for tests and TypeScript wrappers built on `@ton/core`. Everything here is what a production FunC repo looks like." }
      ]
    },
    {
      id: "tvm-cells",
      title: "The TVM & cell model (read this twice)",
      level: "core",
      body: [
        { type: "p", text: "Everything on TON — contract code, contract storage, every message, every value that leaves the stack and gets stored — is a **cell**. Internalize four types and you can read any FunC contract:" },
        { type: "table", headers: ["Type", "What it is"], rows: [
          ["`cell`", "immutable bag of **up to 1023 bits** + **up to 4 references** to other cells. The universal storage/serialization unit."],
          ["`slice`", "a **read cursor** over a cell — you *parse* (load) bits and refs out of it, front to back."],
          ["`builder`", "a **write buffer** — you *store* bits and refs into it, then seal it into a `cell` with `end_cell()`."],
          ["`cont`", "a **continuation**: a slice of TVM code you can jump to / execute. The building block of control flow (if/while/functions compile to conts)."]
        ] },
        { type: "list", items: [
          "A cell is **immutable**: you never edit one. To \"change\" data you *parse* the old cell into a slice, and *build* a new cell with a builder.",
          "Cells form a **directed acyclic graph** via their references — that is how you exceed 1023 bits: chain data into child cells (up to 4 refs each).",
          "**Contract storage is a single cell** — retrieved with `get_data()`, replaced with `set_data(cell)`. All your persistent state must be serialized into (and parsed out of) that one cell.",
          "TVM is a **stack machine**: opcodes pop operands and push results. FunC hides this behind expressions, but the reason `~` methods and tensors exist is that the machine natively passes multiple values on the stack."
        ] },
        { type: "code", lang: "func", code: ";; build a cell, then read it back\nbuilder b = begin_cell()        ;; new builder\n    .store_uint(42, 32)          ;; write 42 as a 32-bit unsigned int\n    .store_uint(7, 8);           ;; write 7 as an 8-bit unsigned int\ncell c = b.end_cell();          ;; seal builder -> immutable cell\n\nslice s = c.begin_parse();      ;; open a read cursor over the cell\nint a = s~load_uint(32);        ;; read 42 (advances the cursor)\nint z = s~load_uint(8);         ;; read 7\ns.end_parse();                  ;; assert nothing left (optional but good hygiene)" },
        { type: "callout", variant: "warn", text: "The **1023-bit / 4-ref limit is a hard wall**. Storing a 5th reference, or overflowing bits, throws a **cell overflow** (exit code 8) at runtime. When state grows, push data into a *reference* cell (`store_ref`) — this is why dictionaries, message bodies, and big structs live in child cells." }
      ]
    },
    {
      id: "setup",
      title: "Setup: Blueprint, the func compiler & Fift",
      level: "core",
      body: [
        { type: "p", text: "**Blueprint** (`@ton/blueprint`) is the all-in-one TON dev environment: it wires the **`func`** compiler, an in-process **`@ton/sandbox`** TVM for tests, and deploy tooling. Scaffold with `npm create ton@latest` and pick a **FunC** template (`func-empty` or `func-counter`)." },
        { type: "code", lang: "bash", code: "# scaffold a project (interactive: choose a FunC template)\nnpm create ton@latest my-contract\n#   ? Project name: my-contract\n#   ? First contract name: Counter\n#   ? Template: FunC - counter (or FunC - empty)\n\ncd my-contract\nnpm install\n\nnpx blueprint build      # compile FunC -> Fift -> BoC (bag of cells)\nnpx blueprint test       # run the Jest + sandbox test suite\nnpx blueprint run        # execute a deploy/interaction script" },
        { type: "p", text: "Under the hood the toolchain is: **`func`** (compiles `.fc` → Fift `.fif`) → **`fift`** (assembles Fift → TVM bytecode / a serialized cell). Blueprint drives both via `@ton-community/func-js` (a WASM build of the compiler) so you rarely call them by hand, but knowing the pipeline explains error messages." },
        { type: "code", lang: "text", code: "my-contract/\n  contracts/\n    counter.fc            # your FunC source\n    imports/\n      stdlib.fc           # the FunC standard library (vendored)\n  wrappers/\n    Counter.ts            # TS class implementing @ton/core's Contract\n    Counter.compile.ts    # tells Blueprint how to compile this contract\n  tests/\n    Counter.spec.ts       # @ton/sandbox + Jest\n  scripts/\n    deployCounter.ts      # deploy / interaction scripts\n  package.json" },
        { type: "code", lang: "func", code: ";; contracts/counter.fc\n#include \"imports/stdlib.fc\";   ;; pull in the standard library\n#pragma version >=0.4.0;         ;; require a minimum func compiler version\n\n;; ... your functions ..." },
        { type: "callout", variant: "note", text: "**`#include`** is a literal textual include (like C's `#include`) — order matters, and every symbol a file uses must already be declared above. `#pragma version` guards against compiling with an incompatible `func` release. `stdlib.fc` is *vendored into the repo*, not an npm package — keep it under `contracts/imports/`." }
      ]
    },
    {
      id: "structure",
      title: "Program structure: functions & entrypoints",
      level: "core",
      body: [
        { type: "p", text: "A FunC program has **no `contract` keyword** — it is simply a flat set of **functions**. The runtime calls specific *entrypoint* functions by convention. There is no `main`; TVM enters at one of these depending on how the contract was invoked:" },
        { type: "table", headers: ["Entrypoint", "Called when", "Signature (typical)"], rows: [
          ["`recv_internal`", "an **internal message** arrives (from another contract)", "`(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body)`"],
          ["`recv_external`", "an **external message** arrives (from off-chain, e.g. a wallet signing)", "`(slice in_msg_body)`"],
          ["`run_ticktock`", "special system tick/tock call (only certain system contracts)", "`(int is_tock, ...)`"],
          ["get methods", "off-chain reads (see get-methods section)", "any, marked `method_id`"]
        ] },
        { type: "code", lang: "func", code: "#include \"imports/stdlib.fc\";\n\n;; handle messages from other contracts\n() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {\n    if (in_msg_body.slice_empty?()) {\n        return ();               ;; ignore empty messages (e.g. plain TON transfers)\n    }\n    int op = in_msg_body~load_uint(32);   ;; read the operation code\n    ;; ... dispatch on op ...\n}\n\n;; handle external (off-chain) messages — used by wallets\n() recv_external(slice in_msg_body) impure {\n    ;; typically: check signature, accept_message(), then act\n    accept_message();            ;; agree to pay for gas from the contract balance\n}" },
        { type: "callout", variant: "gotcha", text: "**External messages start with the contract paying zero gas.** You MUST call `accept_message()` (usually right after verifying a signature) or the transaction runs out of the tiny free gas budget and aborts. Never `accept_message()` *before* auth checks — that lets anyone drain your balance with junk externals." },
        { type: "callout", variant: "note", text: "`in_msg_full` is the raw message cell; you parse its first bits to read the **flags** and **sender address**. `in_msg_body` is just the message *body* slice — where your op code and payload live. Most contracts read the sender from `in_msg_full` and the op from `in_msg_body`." }
      ]
    },
    {
      id: "types",
      title: "Types: int, cell, slice, builder, tuples & tensors",
      level: "core",
      body: [
        { type: "p", text: "FunC is statically typed at the source level, but **TVM is dynamically typed underneath** — a stack entry is just a tagged value. The static types catch mistakes and pick the right opcodes; there is no runtime class system." },
        { type: "table", headers: ["Type", "Meaning"], rows: [
          ["`int`", "a **257-bit signed integer** — the only number type (no floats, no unsigned type; you enforce widths when you serialize)"],
          ["`cell`", "immutable 1023-bit + 4-ref cell (see cell model)"],
          ["`slice`", "read cursor over a cell"],
          ["`builder`", "write buffer for a cell"],
          ["`cont`", "a continuation (executable code)"],
          ["`tuple`", "an **ordered, dynamically-typed** list `[a, b, c]` (a single stack value holding many)"],
          ["`(int, int)`", "a **tensor** — multiple values passed together on the stack (not a heap object)"],
          ["`()`", "the **unit** type — \"no value\" (an empty tensor); functions returning nothing return `()`"]
        ] },
        { type: "code", lang: "func", code: ";; type inference with `var`, and the `_` hole for \"don't care\"\nvar x = 10;                       ;; inferred int\n(int a, int b) = (1, 2);          ;; tensor destructuring\n(int q, _) = divmod(17, 5);       ;; ignore the remainder with a hole `_`\n\n;; a tuple: heterogeneous, dynamic length\ntuple t = empty_tuple();\nt~tpush(42);\nt~tpush(begin_cell().end_cell());  ;; can hold any type\n\n;; tensors are how a function returns several values at once\n(int, int) minmax(int a, int b) {\n    return (min(a, b), max(a, b));\n}" },
        { type: "callout", variant: "gotcha", text: "**`int` is 257-bit and signed — there is no separate `uint`.** \"Unsigned\" only exists at *serialization* time: `store_uint(x, 32)` throws a **range check** (exit code 5) if `x` is negative or ≥ 2^32. Width safety is your job on every store/load." },
        { type: "callout", variant: "note", text: "Don't confuse a **tensor** `(int, int)` (several separate stack values, zero-cost) with a **tuple** `[int, int]` (one boxed stack value you build/index with `tpush`/`at`). Function multi-returns are tensors; general dynamic lists are tuples." }
      ]
    },
    {
      id: "storage",
      title: "Storage & persistence: serialize it yourself",
      level: "core",
      body: [
        { type: "p", text: "Persistent state is **one cell**, read with `get_data()` and written with `set_data(cell)`. There are no declared storage fields — you **manually serialize** your state into a cell on save and **manually parse** it back on load. The single rule that governs everything: **the store order must exactly match the load order** (same types, same bit widths, same sequence)." },
        { type: "code", lang: "func", code: ";; --- load state from storage ---\n(int, slice, int) load_data() inline {\n    slice ds = get_data().begin_parse();     ;; open storage cell\n    return (\n        ds~load_uint(32),                     ;; counter (32 bits)\n        ds~load_msg_addr(),                   ;; owner address (a slice)\n        ds~load_coins()                       ;; a balance (variable-width coins)\n    );\n}\n\n;; --- save state back to storage ---\n() save_data(int counter, slice owner, int balance) impure inline {\n    set_data(\n        begin_cell()\n            .store_uint(counter, 32)          ;; SAME order & widths as load!\n            .store_slice(owner)\n            .store_coins(balance)\n        .end_cell()\n    );\n}\n\n() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {\n    (int counter, slice owner, int balance) = load_data();\n    counter += 1;\n    save_data(counter, owner, balance);       ;; persist the change\n}" },
        { type: "callout", variant: "warn", text: "**Serialization-order mismatch is the #1 FunC storage bug.** If `save_data` stores `(uint32, addr, coins)` but `load_data` reads `(addr, uint32, coins)`, you don't get an error at that line — you read *garbage* (or throw a cell-underflow later), and it can silently brick the contract. Keep `load_data`/`save_data` adjacent and mirror them line-for-line." },
        { type: "callout", variant: "tip", text: "Use `store_coins`/`load_coins` (a.k.a. var-uint) for TON amounts — they store the minimum bytes. Store big or optional sub-structures in a **reference** (`store_ref`/`load_ref`) to stay under the 1023-bit cell limit." }
      ]
    },
    {
      id: "functions",
      title: "Functions & specifiers: impure, inline, method_id, asm",
      level: "core",
      body: [
        { type: "p", text: "A function is `<return-type> name(<params>) <specifiers> { body }`. Specifiers change *semantics* and *code generation*, and one of them (`impure`) is a genuine correctness trap." },
        { type: "table", headers: ["Specifier", "Meaning"], rows: [
          ["`impure`", "the function has **side effects** (writes storage, sends messages, throws). REQUIRED, or the compiler may delete the call."],
          ["`inline`", "paste the body at each call site (no function call overhead; slightly larger code)"],
          ["`inline_ref`", "body compiled once into a *reference* cell and jumped to — smaller code when reused, no per-call push"],
          ["`method_id`", "expose as an off-chain **get method** (see get-methods)"],
          ["`asm`", "the body is raw **Fift/TVM assembly** — how the stdlib defines primitives"]
        ] },
        { type: "code", lang: "func", code: ";; declaration then definition (forward declaration for mutual recursion)\nint fib(int n) impure;   ;; declaration\n\nint fib(int n) {         ;; definition\n    return n < 2 ? n : fib(n - 1) + fib(n - 2);\n}\n\n;; a low-level primitive written directly in TVM assembly\nint mul_div(int a, int b, int c) asm \"MULDIV\";\n\n;; inline helper (no call overhead)\nint double(int x) inline {\n    return x * 2;\n}" },
        { type: "callout", variant: "warn", text: "**Forgetting `impure` can silently drop your call.** The optimizer assumes a non-`impure` function is pure and, if its return value is unused, **removes the entire call** — so your `send_raw_message`/`set_data` never happens and nothing errors. Rule: any function that stores data, sends a message, or throws MUST be `impure`. When in doubt, add it." },
        { type: "callout", variant: "note", text: "`inline` and `inline_ref` are gas/size trade-offs, not correctness. Use `inline` for tiny hot helpers (like `load_data`), `inline_ref` for larger routines called from several places. Global variables are declared at file scope: `global int ctx_counter;` and read/written directly." }
      ]
    },
    {
      id: "methods",
      title: "The `.` vs `~` methods (the confusing one)",
      level: "core",
      body: [
        { type: "p", text: "FunC has two method-call sugars over the same functions, and mixing them up is the most common beginner bug. Both are just `first_arg.func(rest)` — the difference is what happens to the first argument." },
        { type: "list", items: [
          "**`.method()` — non-modifying.** `s.preload_uint(32)` calls `preload_uint(s, 32)` and returns its result. `s` is unchanged.",
          "**`~method()` — modifying.** `s~load_uint(32)` calls a function that returns **`(modified_first_arg, result)`**; the sugar writes the modified first arg back into `s` *and* gives you the result. So `s~load_uint(32)` advances the cursor `s` **and** returns the value."
        ] },
        { type: "code", lang: "func", code: "slice s = c.begin_parse();\n\n;; ~ MODIFIES s (advances the read cursor) and returns the value\nint a = s~load_uint(32);   ;; s now points past those 32 bits\nint b = s~load_uint(32);   ;; reads the NEXT 32 bits\n\n;; . does NOT modify s — it peeks without advancing\nint peek = s.preload_uint(16);  ;; s is unchanged; peek is the next 16 bits\nint again = s~load_uint(16);    ;; still reads the same 16 bits `peek` saw" },
        { type: "heading", text: "Writing your own `~` method" },
        { type: "p", text: "A `~`-callable function just returns a tensor whose **first element is the new first argument**. Anything can be a modifying method." },
        { type: "code", lang: "func", code: ";; usable as counter~increment(5)  -> mutates counter, returns nothing useful\n(int, ()) increment(int self, int by) {\n    return (self + by, ());\n}\n\n;; usable as t~tpush(x) style: modify tuple, return unit\nint counter = 0;\ncounter~increment(5);   ;; counter is now 5\ncounter~increment(2);   ;; counter is now 7" },
        { type: "callout", variant: "gotcha", text: "Classic mistake: writing `int x = s.load_uint(32);` (dot) when you meant `s~load_uint(32)` (tilde). With the dot, `s` is **not advanced**, so your next `load` re-reads the same bits and everything after it is off. If a parse produces wrong values, check your `.` vs `~` first." }
      ]
    },
    {
      id: "messages",
      title: "Messages: parsing, op codes & sending",
      level: "core",
      body: [
        { type: "p", text: "Contracts communicate by messages. Incoming: parse `in_msg_full` for the header (flags, sender) and `in_msg_body` for your **op code** (`uint32`) and **query_id** (`uint64`), the TON convention for routable requests. Outgoing: build a message cell and hand it to **`send_raw_message(cell msg, int mode)`**." },
        { type: "code", lang: "func", code: "() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {\n    ;; --- read the message header from in_msg_full ---\n    slice cs = in_msg_full.begin_parse();\n    int flags = cs~load_uint(4);\n    if (flags & 1) {                    ;; bit 0 set == this is a bounced message\n        return ();                       ;; usually ignore bounces\n    }\n    slice sender_address = cs~load_msg_addr();\n\n    ;; --- read the body: op + query_id + payload ---\n    if (in_msg_body.slice_empty?()) { return (); }\n    int op       = in_msg_body~load_uint(32);\n    int query_id = in_msg_body~load_uint(64);\n\n    if (op == 0x12345678) {              ;; your custom op\n        int amount = in_msg_body~load_coins();\n        ;; ... do work, then maybe reply ...\n    }\n}" },
        { type: "heading", text: "Sending a message" },
        { type: "code", lang: "func", code: "() send_reply(slice to_address, int amount, int op, int query_id) impure {\n    cell msg = begin_cell()\n        .store_uint(0x18, 6)         ;; 0b011000: internal msg, bounceable\n        .store_slice(to_address)     ;; destination\n        .store_coins(amount)         ;; TON to attach\n        .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)  ;; default header fields\n        .store_uint(op, 32)          ;; body: op code\n        .store_uint(query_id, 64)    ;; body: echo the query_id\n    .end_cell();\n    send_raw_message(msg, 64);       ;; mode 64 = carry remaining value of the inbound msg\n}" },
        { type: "table", headers: ["Mode / flag", "Effect"], rows: [
          ["`0`", "send exactly the `amount` you put in the message"],
          ["`64`", "carry the **remaining value** of the inbound message (after gas) along with `amount`"],
          ["`128`", "carry **all** the contract's remaining balance (ignore the message's own `amount`)"],
          ["`+1`", "pay transfer fees **separately** from the message value"],
          ["`+2`", "**ignore errors** in the action phase for this message (don't bounce the whole tx)"],
          ["`+16`", "**bounce** on error (request a bounced message back if the target fails)"]
        ] },
        { type: "callout", variant: "warn", text: "Modes are **added together** (`128 + 2` = send all balance, ignore errors). Mixing up `64` vs `128` is a money bug: `128` empties the whole contract balance to the recipient. **Bounce handling:** send *bounceable* messages (`0x18`) to real contracts so funds return on failure; use non-bounceable (`0x10`) only when you knowingly send to an uninitialized address." }
      ]
    },
    {
      id: "get-methods",
      title: "Get methods: free off-chain reads",
      level: "core",
      body: [
        { type: "p", text: "A function marked **`method_id`** becomes a **get method** — callable off-chain (from a wrapper, an explorer, a dApp) for **free**, without a transaction. It runs the TVM in read-only mode against the current state and returns typed values. This is TON's equivalent of a Solidity `view` function." },
        { type: "code", lang: "func", code: ";; off-chain callable; no transaction, no gas paid by anyone\nint get_counter() method_id {\n    (int counter, slice owner, int balance) = load_data();\n    return counter;\n}\n\n;; get methods can return tensors (multiple typed values)\n(int, slice) get_state() method_id {\n    (int counter, slice owner, int balance) = load_data();\n    return (counter, owner);\n}" },
        { type: "p", text: "From TypeScript (a Blueprint wrapper) you call it via the sandbox/provider `runGetMethod` — usually wrapped in a typed method on your `Contract` class." },
        { type: "code", lang: "ts", code: "// wrappers/Counter.ts (excerpt)\nasync getCounter(provider: ContractProvider): Promise<number> {\n  const res = await provider.get('get_counter', []);   // call the get method\n  return res.stack.readNumber();\n}" },
        { type: "callout", variant: "note", text: "Get methods are identified by a **method id** hashed from their name (e.g. standard `get_wallet_data`, `get_jetton_data`). Because they never touch the action phase, they can't send messages or change storage — they're pure reads. The names are a de-facto interface: implement the standard ones (`get_jetton_data`, `get_nft_data`, `seqno`) so wallets and explorers recognize your contract." }
      ]
    },
    {
      id: "stdlib",
      title: "The standard library (stdlib.fc)",
      level: "core",
      body: [
        { type: "p", text: "`stdlib.fc` is a vendored file of `asm` one-liners and helpers that wrap TVM primitives. You've already used many (`begin_cell`, `store_uint`, `begin_parse`, `load_uint`, `send_raw_message`, `accept_message`). Know these families:" },
        { type: "table", headers: ["Family", "Examples"], rows: [
          ["Builder (write)", "`begin_cell`, `store_uint`, `store_int`, `store_slice`, `store_coins`, `store_ref`, `store_dict`, `end_cell`"],
          ["Slice (read)", "`begin_parse`, `load_uint`, `load_int`, `load_coins`, `load_ref`, `load_msg_addr`, `preload_uint`, `end_parse`"],
          ["Slice checks", "`slice_empty?`, `slice_bits`, `slice_refs`, `slice_data_equal?`"],
          ["Cell/dict", "`cell_hash`, `dict_get?`, `udict_set`, `udict_get?`, `dict_delete?` (dictionaries live in cells)"],
          ["Hashing / crypto", "`cell_hash`, `slice_hash`, `string_hash`, `check_signature`, `check_data_signature`"],
          ["Message / control", "`send_raw_message`, `accept_message`, `set_data`, `get_data`, `commit`, `now`, `my_address`"],
          ["Errors", "`throw`, `throw_if`, `throw_unless` (next section)"]
        ] },
        { type: "code", lang: "func", code: ";; a real signature check (as in wallet contracts)\n() recv_external(slice in_msg_body) impure {\n    slice signature = in_msg_body~load_bits(512);   ;; ed25519 signature\n    slice cs = in_msg_body;                          ;; the signed payload\n    (int stored_seqno, int public_key) = load_auth();\n    throw_unless(35, check_signature(slice_hash(cs), signature, public_key));\n    accept_message();                                ;; now agree to pay gas\n    ;; ... process ...\n}" },
        { type: "callout", variant: "tip", text: "Dictionaries (`HashmapE`) are TON's key→value maps, implemented as a cell tree and accessed through `dict_*`/`udict_*` stdlib functions. They're powerful but **gas-heavy** — every get/set walks and rebuilds cells. Prefer flat fields when a handful of values suffice." }
      ]
    },
    {
      id: "exceptions",
      title: "Exceptions & exit codes",
      level: "core",
      body: [
        { type: "p", text: "FunC has no try/catch inside a transaction — you **throw** an exit code, which aborts the current computation. If it happens on an internal message, the transaction fails and (if bounceable) a bounce is sent back. Three primitives:" },
        { type: "table", headers: ["Primitive", "Behavior"], rows: [
          ["`throw(code)`", "always throw exit `code`"],
          ["`throw_if(code, cond)`", "throw `code` **if** `cond` is true (nonzero)"],
          ["`throw_unless(code, cond)`", "throw `code` **unless** `cond` is true — the usual assertion form"]
        ] },
        { type: "code", lang: "func", code: ";; guard clauses read cleanly with throw_unless\nthrow_unless(401, equal_slices(sender_address, owner));  ;; 401 = not owner\nthrow_unless(402, msg_value >= min_fee);                 ;; 402 = insufficient value\nthrow_if(403, counter > max_counter);                    ;; 403 = out of range" },
        { type: "table", headers: ["Exit code", "Meaning (reserved by TVM)"], rows: [
          ["`0` / `1`", "success (normal / alternative)"],
          ["`2`", "stack underflow"],
          ["`4`", "integer overflow"],
          ["`5`", "integer out of expected range (bad `store_uint` width, etc.)"],
          ["`8`", "cell overflow (wrote > 1023 bits or > 4 refs)"],
          ["`9`", "cell underflow (read past the end of a slice)"],
          ["`13`", "out of gas"],
          ["`33`–`37`", "action-phase errors (invalid/insufficient message actions)"]
        ] },
        { type: "callout", variant: "note", text: "TVM reserves **exit codes 0–127**; pick your own custom codes **above that range** (many contracts use values like 401/403 or ≥ 256) so they never collide with system codes. Document them — the bounce message carries the code, and that's often all an off-chain caller sees." }
      ]
    },
    {
      id: "comments",
      title: "Comments & code style",
      level: "core",
      body: [
        { type: "p", text: "FunC uses **`;;` for line comments** and **`{- ... -}` for block comments** (block comments nest). Identifiers may contain unusual characters — the trailing **`?`** convention marks predicates (`slice_empty?`, `dict_get?`) and **`~`** prefixes modifying methods, which is why they look odd at first." },
        { type: "code", lang: "func", code: ";; this is a line comment (double semicolon)\n\n{- this is a block comment\n   {- and it can nest -}\n   spanning multiple lines -}\n\nint area(int w, int h) inline {\n    ;; predicate names end in ? ; modifying methods use ~\n    return w * h;\n}" },
        { type: "callout", variant: "note", text: "In this deck the authentic `;;` comments in FunC snippets won't get comment-colored by the highlighter (it doesn't know FunC's syntax) — that's expected. The code above is real, correct FunC; the comments are shown as written so you recognize them in actual source." }
      ]
    },
    {
      id: "gas",
      title: "Gas: why FunC owns the hot paths",
      level: "deep",
      body: [
        { type: "p", text: "On TON, gas is paid in TON and every TVM opcode has a cost. FunC's whole reason to exist over Tact/Tolk is **control**: you decide exactly which cells are built, which refs are followed, and how many dictionary walks happen. Cheap vs expensive is mostly about **cell operations**." },
        { type: "list", items: [
          "**Cell creation and cell hashing are expensive.** Build fewer cells; avoid rebuilding storage you didn't change.",
          "**Dictionary (`dict_*`) operations are costly** — each get/set traverses and reconstructs a cell tree. Prefer flat serialized fields for small, fixed state.",
          "**Following references (`load_ref`) costs more than reading inline bits.** Lay out the *hot* fields in the first cell; push cold/large data into refs.",
          "**Arithmetic and stack ops are cheap.** Don't contort readable math to save a few gas units — measure first.",
          "**Every message you send costs forward fees.** Batch where possible; use message mode `64`/`128` to route value rather than sending extra messages."
        ] },
        { type: "callout", variant: "tip", text: "Measure real gas in the sandbox: a `SendMessageResult` from `@ton/sandbox` reports gas used and the full transaction/action trace per test. Assert on it (or snapshot it) so a refactor that doubles gas fails CI — the TON equivalent of Foundry's gas snapshots." }
      ]
    },
    {
      id: "testing",
      title: "Testing & deploy with Blueprint",
      level: "core",
      body: [
        { type: "p", text: "FunC contracts are tested and shipped exactly like Tact/Tolk ones — through **Blueprint**. Tests run in **`@ton/sandbox`**, an in-process TVM, driven by **Jest**. You interact via TypeScript **wrappers** (classes implementing `Contract` from `@ton/core`), and message/cell helpers come from `@ton/core` (and `@ton/ton` for live-network clients)." },
        { type: "code", lang: "ts", code: "// tests/Counter.spec.ts\nimport { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';\nimport { Cell, toNano } from '@ton/core';\nimport { compile } from '@ton/blueprint';\nimport { Counter } from '../wrappers/Counter';\nimport '@ton/test-utils';   // adds toHaveTransaction() matcher to Jest\n\ndescribe('Counter', () => {\n  let code: Cell;\n  let blockchain: Blockchain;\n  let deployer: SandboxContract<TreasuryContract>;\n  let counter: SandboxContract<Counter>;\n\n  beforeAll(async () => { code = await compile('Counter'); });\n\n  beforeEach(async () => {\n    blockchain = await Blockchain.create();\n    deployer = await blockchain.treasury('deployer');\n    counter = blockchain.openContract(\n      Counter.createFromConfig({ counter: 0, owner: deployer.address }, code)\n    );\n    const res = await counter.sendDeploy(deployer.getSender(), toNano('0.05'));\n    expect(res.transactions).toHaveTransaction({\n      from: deployer.address, to: counter.address, deploy: true, success: true,\n    });\n  });\n\n  it('increments', async () => {\n    await counter.sendIncrement(deployer.getSender(), toNano('0.05'));\n    expect(await counter.getCounter()).toBe(1);\n  });\n});" },
        { type: "code", lang: "ts", code: "// wrappers/Counter.ts (message builder side)\nimport { Contract, ContractProvider, Sender, beginCell, toNano } from '@ton/core';\n\nasync sendIncrement(provider: ContractProvider, via: Sender, value: bigint) {\n  await provider.internal(via, {\n    value,\n    body: beginCell()\n      .storeUint(0x37491f2f, 32)   // op (must match the FunC contract)\n      .storeUint(0, 64)            // query_id\n      .endCell(),\n  });\n}" },
        { type: "code", lang: "bash", code: "npx blueprint test              # run the Jest + sandbox suite\nnpx blueprint test Counter      # just one contract's tests\nnpx blueprint run deployCounter # execute a deploy script (TON Connect / mnemonic)" },
        { type: "callout", variant: "note", text: "The **op codes and serialization in your TS wrapper must byte-for-byte match the FunC contract**. If the wrapper stores `op` as `uint32` at a different offset than the contract loads it, the message parses wrong on-chain and either throws or silently does the wrong thing. Keep wrapper and contract in lockstep — this is the FunC↔TS seam where bugs hide." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "FunC gives you no guardrails — everything is manual and the stack machine is unforgiving. These are the recurring foot-guns; internalize them." },
        { type: "heading", text: "1. Forgetting `impure` — calls silently vanish" },
        { type: "callout", variant: "warn", text: "A function without `impure` whose result is unused can be **deleted by the optimizer**. Your `set_data`/`send_raw_message` never runs and nothing errors. **Fix:** mark every side-effecting function `impure`." },
        { type: "heading", text: "2. Serialization order mismatch (store vs load)" },
        { type: "callout", variant: "gotcha", text: "`save_data` and `load_data` must mirror each other exactly — same types, same widths, same order. A mismatch reads garbage or throws cell-underflow later, not at the offending line. **Fix:** keep the two functions adjacent and edit them together." },
        { type: "heading", text: "3. `~` vs `.` method confusion" },
        { type: "callout", variant: "gotcha", text: "`s~load_uint(32)` advances the cursor; `s.preload_uint(32)` (or writing `.` where you meant `~`) does **not**. A parse that returns wrong values downstream is almost always a `.`/`~` slip. **Fix:** use `~` when reading sequentially, `.` only to peek." },
        { type: "heading", text: "4. The stack-machine mental model" },
        { type: "callout", variant: "note", text: "FunC looks like C but compiles to a stack VM. Multi-returns are tensors on the stack, tuples are boxed, and `~` methods exist because the machine natively returns `(newself, result)`. When behavior surprises you, think in stack terms." },
        { type: "heading", text: "5. The 1023-bit / 4-ref cell limit" },
        { type: "callout", variant: "warn", text: "Overflowing a cell throws exit code 8. **Fix:** push overflow data into a reference cell (`store_ref`) — that's how big structs, dictionaries, and message bodies stay legal. Plan your layout before you serialize." },
        { type: "heading", text: "6. Off-by-bit-width in load/store" },
        { type: "callout", variant: "gotcha", text: "`store_uint(x, 32)` then `load_uint(64)` corrupts everything after it, and storing a negative or too-large value into `store_uint` throws a range check (exit 5). **Fix:** define named width constants and reuse them on both sides." },
        { type: "heading", text: "7. No type safety, manual everything" },
        { type: "callout", variant: "note", text: "There are no structs, no bounds checks, no auto-serialization. The compiler won't stop you storing an address where you meant coins. **Fix:** small mirrored `load_data`/`save_data` helpers, disciplined naming, and thorough sandbox tests are your safety net." },
        { type: "heading", text: "8. accept_message() placement on externals" },
        { type: "callout", variant: "warn", text: "External messages have almost no free gas until you `accept_message()`. Call it **after** authentication, never before — accepting first lets anyone spend your contract's balance with junk. Forgetting it entirely means the external aborts out of gas." },
        { type: "heading", text: "9. The async model — no synchronous returns" },
        { type: "callout", variant: "warn", text: "TON is an **actor model**: contracts communicate only by asynchronous messages. There is **no synchronous cross-contract call that returns a value** — you send a message and (maybe) get a reply message later, in a separate transaction. Design flows as request/response with `query_id` correlation and handle the case where the reply never comes (bounce)." },
        { type: "callout", variant: "note", text: "General discipline: send **bounceable** messages to real contracts so funds return on failure, echo `query_id` in replies, test every op in `@ton/sandbox`, and read the reference wallet/Jetton/NFT contracts — most production FunC follows their patterns exactly." }
      ]
    }
  ],

  packages: [
    { name: "@ton/blueprint", why: "the standard TON dev environment: compile FunC, run sandbox tests, deploy — supports func/tolk/tact templates" },
    { name: "func (compiler)", why: "compiles .fc source to Fift; last release ~v2025.07 (maintenance mode as work shifts to Tolk)" },
    { name: "fift", why: "the assembler/stack language that turns compiler output into TVM bytecode / a serialized cell" },
    { name: "@ton-community/func-js", why: "WASM build of the func compiler that Blueprint drives; pin/upgrade your FunC compiler version through it" },
    { name: "@ton/sandbox", why: "in-process TVM emulator for fast local tests — deploy contracts and send messages without a network" },
    { name: "@ton/core", why: "core primitives used by wrappers: Cell, Address, beginCell/Builder, Slice, Dictionary, toNano, the Contract interface" },
    { name: "@ton/ton", why: "client library to talk to a live TON network (TonClient) for real deploys and reads" },
    { name: "@ton/test-utils", why: "adds Jest matchers like toHaveTransaction() to assert on sandbox transaction/action traces" },
    { name: "@ton/crypto", why: "key generation, mnemonics and ed25519 signing — used in deploy scripts and signature tests" },
    { name: "stdlib.fc", why: "the FunC standard library (vendored into contracts/imports): cell/slice/builder ops, hashing, message & error helpers" },
    { name: "create-ton", why: "the `npm create ton@latest` scaffolder that generates a Blueprint project with your chosen contract template" },
    { name: "@ton/test-utils + jest", why: "the test runner pairing Blueprint uses; describe/it suites drive the sandbox" }
  ],

  gotchas: [
    "**Forgetting `impure`:** a non-`impure` function whose return value is unused gets **deleted by the optimizer** — your `set_data`/`send_raw_message` silently never runs. Mark every side-effecting function `impure`.",
    "**Serialization order:** `save_data` (store) and `load_data` (parse) must mirror exactly — same types, widths, order. A mismatch reads garbage or throws cell-underflow *later*, not at the bad line.",
    "**`~` vs `.` methods:** `s~load_uint(32)` advances the read cursor and returns the value; `s.preload_uint(32)` peeks without advancing. Using `.` where you meant `~` re-reads the same bits.",
    "**1023-bit / 4-ref cell limit:** overflow throws exit code 8. Push extra data into a reference cell with `store_ref` — that's how big structs and dictionaries stay legal.",
    "**Bit-width mismatch:** `store_uint(x, 32)` then `load_uint(64)` corrupts the rest of the slice; storing a negative/too-large value into `store_uint` throws range check (exit 5). Share width constants both sides.",
    "**No `uint` type:** `int` is 257-bit signed. \"Unsigned\" is enforced only at serialization; you own width and sign safety on every store/load.",
    "**Message modes:** modes add together; `64` carries the inbound remaining value, `128` sends the **entire contract balance**. Confusing them is a money bug.",
    "**Bounce handling:** send bounceable (`0x18`) messages to real contracts so funds return on failure; non-bounceable (`0x10`) only to addresses you know are uninitialized.",
    "**`accept_message()` on externals:** externals start with ~no free gas — call `accept_message()` **after** auth, never before (accepting first lets anyone drain your balance).",
    "**Async actor model:** there is **no synchronous cross-contract call that returns a value** — send a message, maybe get a reply in a later transaction. Correlate with `query_id` and handle missing replies.",
    "**Custom exit codes:** TVM reserves 0–127; use your own codes above that (e.g. ≥ 256 or 4xx) so they never collide with system codes, and document them.",
    "**`#include` order:** it's a textual include; every symbol must be declared above where it's used. `#include \"imports/stdlib.fc\";` goes first.",
    "**Wrapper ↔ contract seam:** the op codes and serialization in your TS wrapper (`@ton/core`) must match the FunC contract byte-for-byte, or messages parse wrong on-chain.",
    "**Dictionaries are gas-heavy:** each `dict_*` op walks and rebuilds a cell tree. Prefer flat serialized fields for small, fixed state.",
    "**No type safety:** no structs, no bounds checks, no auto-serialization — small mirrored load/save helpers plus sandbox tests are your only guardrails."
  ],

  flashcards: [
    { q: "What are the four core TVM data types?", a: "**`cell`** (immutable, up to 1023 bits + 4 refs), **`slice`** (read cursor over a cell), **`builder`** (write buffer for a cell), and **`cont`** (a continuation — executable code). Everything on TON serializes into cells." },
    { q: "How big is a cell, and how do you exceed it?", a: "Up to **1023 bits + up to 4 references**. To store more, chain data into child cells via `store_ref` — cells form a DAG. Overflow throws exit code 8." },
    { q: "How is contract storage represented?", a: "As **one cell**, read with `get_data()` and replaced with `set_data(cell)`. You manually serialize state into it and parse it back — the store order must match the load order exactly." },
    { q: "Why is `impure` critical?", a: "Without it, the optimizer may treat the function as pure and, if its result is unused, **delete the call entirely** — so side effects like `set_data`/`send_raw_message` silently never run. Mark all side-effecting functions `impure`." },
    { q: "`.method()` vs `~method()`?", a: "`.` is **non-modifying** (`s.preload_uint(32)` peeks, `s` unchanged). `~` is **modifying** (`s~load_uint(32)` calls a function returning `(newself, result)`, writes the new self back into `s`, and returns the result). `~` advances the cursor." },
    { q: "What are the FunC entrypoints?", a: "`recv_internal(...)` for internal messages, `recv_external(slice)` for off-chain messages, optional `run_ticktock(...)` for system contracts, and `method_id` get methods for off-chain reads. There is no `main`." },
    { q: "How do you send a message from FunC?", a: "Build a message cell with `begin_cell().store_uint(0x18,6).store_slice(dest).store_coins(amount)...end_cell()`, then `send_raw_message(cell, mode)`. Mode `64` carries inbound value; `128` sends the whole balance." },
    { q: "What is a get method?", a: "A function marked `method_id`, callable off-chain for free (no transaction). It runs read-only against current state and returns typed values — TON's equivalent of a Solidity `view`. Standard names (`get_jetton_data`, `seqno`) form the interface." },
    { q: "throw / throw_if / throw_unless?", a: "`throw(code)` always throws exit `code`; `throw_if(code, cond)` throws if cond is true; `throw_unless(code, cond)` throws unless cond is true — the usual assertion form. Codes 0–127 are reserved by TVM; pick custom codes above that." },
    { q: "What does `int` actually hold?", a: "A **257-bit signed** integer — the only numeric type. No floats, no separate unsigned type. Width/sign are enforced only when you serialize (`store_uint(x, n)` range-checks x)." },
    { q: "Tensor vs tuple?", a: "A **tensor** `(int, int)` is several separate stack values (zero-cost, used for multi-return). A **tuple** `[int, int]` is one boxed stack value you build/index with `tpush`/`at`. Different things, similar-looking." },
    { q: "How do you accept gas for an external message?", a: "Call `accept_message()` — but only **after** verifying the signature/auth. Externals start with almost no free gas; without `accept_message()` they abort, and calling it before auth lets anyone drain the balance." },
    { q: "Why can't FunC do synchronous cross-contract calls?", a: "TON is an actor model — contracts only exchange **asynchronous messages**. You send a request and may receive a reply message in a later transaction. Correlate with `query_id` and handle bounces/missing replies." },
    { q: "What's the compile pipeline?", a: "`func` compiles `.fc` source to **Fift** assembly, then `fift` assembles it to TVM bytecode / a serialized cell (BoC). Blueprint runs both via `@ton-community/func-js`." },
    { q: "How are FunC contracts tested?", a: "Through **Blueprint**: `@ton/sandbox` (in-process TVM) + Jest, driven by TypeScript wrappers implementing `@ton/core`'s `Contract`. `@ton/test-utils` adds `toHaveTransaction()`. Run `npx blueprint test`." },
    { q: "What do `;;` and `{- -}` mean?", a: "`;;` is a line comment; `{- ... -}` is a (nestable) block comment. Also note conventions: `?` suffix marks predicates (`slice_empty?`), `~` prefix marks modifying methods." }
  ],

  cheatsheet: [
    { label: "New project", code: "npm create ton@latest my-contract   # pick a FunC template" },
    { label: "Build", code: "npx blueprint build" },
    { label: "Test / run", code: "npx blueprint test   |   npx blueprint run" },
    { label: "Include stdlib", code: "#include \"imports/stdlib.fc\";" },
    { label: "Internal entrypoint", code: "() recv_internal(int bal, int msg_value, cell full, slice body) impure { }" },
    { label: "Build a cell", code: "cell c = begin_cell().store_uint(x, 32).store_coins(v).end_cell();" },
    { label: "Parse a cell", code: "slice s = c.begin_parse(); int x = s~load_uint(32);" },
    { label: "Load storage", code: "slice ds = get_data().begin_parse(); int n = ds~load_uint(32);" },
    { label: "Save storage", code: "set_data(begin_cell().store_uint(n, 32).end_cell());" },
    { label: "Read op + query_id", code: "int op = body~load_uint(32); int qid = body~load_uint(64);" },
    { label: "Send a message", code: "send_raw_message(msg_cell, 64);   ;; mode 64 = carry remaining value" },
    { label: "Assertion", code: "throw_unless(401, equal_slices(sender, owner));" },
    { label: "Get method", code: "int get_counter() method_id { ... }" },
    { label: "Own ~ method", code: "(int, ()) inc(int self, int by) { return (self + by, ()); }" },
    { label: "Accept external gas", code: "throw_unless(35, check_signature(h, sig, pk)); accept_message();" },
    { label: "asm primitive", code: "int mul_div(int a, int b, int c) asm \"MULDIV\";" }
  ]
});
