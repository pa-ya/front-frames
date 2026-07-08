(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "solidity",
  name: "Solidity",
  language: "Solidity",
  group: "EVM",
  navLabel: "Solidity",
  color: "#627eea",
  readMinutes: 32,
  tagline: "The language of **EVM smart contracts** — typed, contract-oriented Solidity, tested and shipped with the **Foundry** toolchain (`forge`/`cast`/`anvil`).",

  sections: [
    {
      id: "overview",
      title: "Overview & the EVM mental model",
      level: "core",
      body: [
        { type: "p", text: "Solidity is a statically-typed, contract-oriented language that compiles to **EVM bytecode** — the instruction set of the Ethereum Virtual Machine that runs on Ethereum and every EVM-compatible chain (Arbitrum, Optimism, Base, Polygon, BNB, Avalanche C-chain, …). A *smart contract* is code plus state that lives at an on-chain **address**; anyone can call its public functions by sending a transaction." },
        { type: "list", items: [
          "**Two kinds of accounts:** *EOAs* (externally-owned accounts, controlled by a private key — wallets) and *contract accounts* (controlled by their code). Only an EOA can *originate* a transaction; contracts run in response.",
          "**Deterministic, replicated execution:** every node re-runs your code and must reach the same state. No randomness, no clock, no network/file I/O, no floats — the world outside the chain is invisible except via oracles.",
          "**Gas:** every opcode costs gas; the sender pays `gasUsed × gasPrice` in ETH. Run out of gas and the whole transaction **reverts** (all state changes undone) but the gas is still burned. This is why loops and storage writes are expensive and must be bounded.",
          "**State is on-chain & public:** contract storage is a giant key→value map persisted in every node. `private` only hides a variable from *other contracts* — anyone can read raw storage. Never store secrets.",
          "**Immutable by default:** once deployed, a contract's code cannot change. Upgrades require an explicit proxy pattern. Bugs are permanent and funds are real — correctness is not optional."
        ] },
        { type: "table", headers: ["Concept", "Web/backend analog", "EVM reality"], rows: [
          ["Deploy", "start a server", "one tx creates a contract at an address; code is frozen"],
          ["Call a function", "HTTP request", "a transaction (writes) or an `eth_call` (free reads)"],
          ["Database", "Postgres", "contract `storage` — 32-byte slots, pay per write"],
          ["Auth / identity", "session/JWT", "`msg.sender` (the calling address), cryptographically proven"],
          ["Money", "Stripe API", "native ETH (`msg.value`, `wei`) moved by the VM itself"],
          ["Logs / analytics", "log lines", "`event`s written to the transaction receipt (indexed by topics)"]
        ] },
        { type: "callout", variant: "note", text: "This deck targets **Solidity 0.8.x** (0.8.35 is the latest stable, April 2026) and the **Foundry** toolchain (`forge`/`cast`/`anvil`) as the default way to build, test and ship. The 0.8 line brought **checked arithmetic** (overflow reverts) and, more recently, **custom errors**, `push0`, and **transient storage** (`transient`). Pin a version with `pragma solidity 0.8.x;`." },
        { type: "callout", variant: "tip", text: "Test contracts *in Solidity* with Foundry, not just from JS. Writing your tests in the same language as the code you audit — with `vm` cheatcodes, fuzzing and invariants — is Foundry's whole pitch and what makes it the modern default over Hardhat for protocol work." }
      ]
    },
    {
      id: "setup",
      title: "Foundry: setup, project structure & workflow",
      level: "core",
      body: [
        { type: "p", text: "**Foundry** is a fast, Rust-based smart-contract toolchain with three binaries: **`forge`** (build, test, deploy), **`cast`** (talk to a chain from the CLI), and **`anvil`** (a local dev node). Install it with `foundryup`, then scaffold a project with `forge init`." },
        { type: "code", lang: "bash", code: "# install the toolchain (installs foundryup, then the binaries)\ncurl -L https://foundry.paradigm.xyz | bash\nfoundryup                      # install/update forge, cast, anvil, chisel\n\nforge init my-protocol         # scaffold a new project (installs forge-std)\ncd my-protocol\n\nforge build                    # compile -> out/ (ABIs + bytecode)\nforge test                     # run the Solidity test suite\nforge test -vvv                # more verbosity: -vv logs, -vvv traces on failure, -vvvv full traces\nforge fmt                      # format all .sol files\nforge coverage                 # line/branch coverage report" },
        { type: "code", lang: "text", code: "my-protocol/\n  foundry.toml        # config: solc version, remappings, profiles, rpc endpoints\n  src/                # your contracts (Counter.sol ...)\n  test/               # Solidity tests (Counter.t.sol) — .t.sol convention\n  script/             # deploy/automation scripts (Counter.s.sol) — .s.sol convention\n  lib/                # dependencies as git submodules (forge-std, openzeppelin-contracts)\n  out/                # compiled artifacts (gitignored)\n  cache/              # build cache (gitignored)\n  remappings.txt      # optional: import aliases" },
        { type: "code", lang: "toml", code: "# foundry.toml\n[profile.default]\nsrc = \"src\"\nout = \"out\"\nlibs = [\"lib\"]\nsolc = \"0.8.35\"              # pin the compiler\nevm_version = \"prague\"        # target EVM hard fork (Pectra/Prague is live on L1; cancun added transient storage)\noptimizer = true\noptimizer_runs = 200          # lower = smaller deploy; higher = cheaper runtime calls\nremappings = [\n  \"@openzeppelin/=lib/openzeppelin-contracts/\",\n]\n\n[profile.ci]\nfuzz = { runs = 10000 }       # heavier fuzzing in CI\n\n[rpc_endpoints]\nmainnet = \"${MAINNET_RPC_URL}\"    # read from env; used by --rpc-url mainnet\n\n[etherscan]\nmainnet = { key = \"${ETHERSCAN_API_KEY}\" }" },
        { type: "p", text: "Dependencies are **git submodules** under `lib/`, not npm packages. Install and update them with `forge install` / `forge update`, and wire import paths with **remappings**." },
        { type: "code", lang: "bash", code: "forge install OpenZeppelin/openzeppelin-contracts    # add a dependency\nforge install transmissions11/solmate\nforge update                                          # bump all submodules\nforge remappings                                      # print the resolved remappings" },
        { type: "callout", variant: "tip", text: "Remappings let you write `import \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";` instead of a long relative path. Foundry auto-detects sensible remappings from `lib/`, but pinning them in `foundry.toml` or `remappings.txt` avoids surprises across machines and with your editor's language server." }
      ]
    },
    {
      id: "anatomy",
      title: "Contract anatomy: pragma, license, state, constructor",
      level: "core",
      body: [
        { type: "p", text: "Every `.sol` file starts with an **SPDX license identifier** (a comment the compiler checks) and a **`pragma`** declaring the compiler version. A `contract` bundles **state variables** (persisted in storage), **functions**, **events**, **errors** and **modifiers**. The **`constructor`** runs exactly once, at deployment, and is not part of the deployed code." },
        { type: "code", lang: "solidity", code: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;      // ^ = this minor or higher within 0.8.x; use a fixed 0.8.35 for prod\n\ncontract Wallet {\n    // --- state variables (live in contract storage, persisted on-chain) ---\n    address public owner;                 // auto getter: owner()\n    uint256 public balance;               // auto getter: balance()\n    mapping(address => uint256) public deposits;   // getter: deposits(addr)\n\n    // constant / immutable are NOT in storage -> much cheaper reads\n    uint256 public constant FEE_BPS = 30;         // fixed at compile time\n    address public immutable factory;             // set once in the constructor\n\n    // runs once at deploy; msg.sender is the deployer\n    constructor(address _factory) {\n        owner = msg.sender;\n        factory = _factory;\n    }\n}" },
        { type: "list", items: [
          "**`constant`** — value fixed at compile time, inlined into bytecode, no storage slot.",
          "**`immutable`** — set once in the constructor, stored in the code (not storage), read as cheaply as a constant.",
          "A **`public` state variable** automatically generates a same-named getter function; you never write `getBalance()` by hand.",
          "State variables are laid out into **32-byte storage slots** in declaration order — order matters for gas (packing) and for proxy storage compatibility."
        ] },
        { type: "callout", variant: "gotcha", text: "`pragma solidity ^0.8.20;` means \"0.8.20 or any later 0.8.x\" — great for libraries, risky for the exact contract you deploy, because a different compiler can change bytecode/gas. For the contracts you ship, **pin an exact version** (`pragma solidity 0.8.35;`) and set `solc` in `foundry.toml` so builds are reproducible." }
      ]
    },
    {
      id: "types",
      title: "Types: value vs reference, structs, enums, mappings",
      level: "core",
      body: [
        { type: "p", text: "Solidity is statically typed with two families: **value types** (copied on assignment) and **reference types** (arrays, `struct`, `bytes`, `string`, `mapping` — passed by reference, and require an explicit *data location*)." },
        { type: "code", lang: "solidity", code: "// value types\nbool    active;\nuint256 amount;         // uint == uint256; sizes uint8..uint256 in steps of 8\nint256  delta;          // signed\naddress owner;          // 20-byte address; address payable can receive ETH\nbytes32 root;           // fixed 32-byte word (hashes, small ids) — cheapest\nenum Status { Pending, Active, Closed }   // stored as uint8 (0,1,2)\n\n// reference types\nstring  name;           // dynamic UTF-8 text (bytes under the hood)\nbytes   blob;           // dynamic byte array\nuint256[] scores;       // dynamic array\nuint256[3] fixedTriple; // fixed-size array\n\nstruct Order {          // group related fields\n    address maker;\n    uint96  price;       // packs with `maker` into one 32-byte slot (20 + 12 bytes)\n    bool    filled;\n}\n\n// mapping: the core on-chain data structure — a hash map, always in storage\nmapping(address => uint256) balances;\nmapping(address => mapping(address => uint256)) allowance;  // nested (ERC-20 style)" },
        { type: "table", headers: ["Type", "Notes"], rows: [
          ["`uint256` / `int256`", "default integer; `uint` aliases `uint256`. Overflow **reverts** in 0.8+"],
          ["`address` / `address payable`", "20 bytes; only `payable` can be sent ETH via `.transfer`/`.send`/`.call`"],
          ["`bytes32`", "fixed 32-byte word — cheapest for hashes/ids; prefer over `string` when possible"],
          ["`string` / `bytes`", "dynamic; need a data location; no indexing on `string` (cast to `bytes`)"],
          ["`struct`", "custom record; declaration order affects storage packing"],
          ["`enum`", "named `uint8`; reverts if you cast an out-of-range integer into it"],
          ["`mapping(K => V)`", "hash map, **storage only**; not iterable, no length, no delete-all"]
        ] },
        { type: "callout", variant: "gotcha", text: "**Mappings can't be iterated** and have no length — there is no `for (key in mapping)`. If you need to enumerate keys, keep a parallel `address[]` (or use OpenZeppelin's `EnumerableSet`/`EnumerableMap`). Also, reading a missing key returns the type's zero value, not an error." }
      ]
    },
    {
      id: "data-location",
      title: "Data location: storage vs memory vs calldata",
      level: "core",
      body: [
        { type: "p", text: "Reference types must declare **where they live**. This is not a style choice — it changes semantics (aliasing vs copying) and gas cost dramatically." },
        { type: "table", headers: ["Location", "Lifetime", "Cost / behavior"], rows: [
          ["`storage`", "persistent, on-chain", "expensive (SLOAD/SSTORE); a reference *aliases* the real state"],
          ["`memory`", "duration of the call", "cheap, mutable scratch space; a *copy* — edits don't touch storage"],
          ["`calldata`", "duration of the call", "read-only, cheapest; the raw tx input — no copy made"]
        ] },
        { type: "code", lang: "solidity", code: "struct User { uint256 score; bool banned; }\nmapping(address => User) users;\n\nfunction bump(address who) external {\n    // storage reference: ALIASES the mapping entry -> writes persist\n    User storage u = users[who];\n    u.score += 1;               // this updates on-chain state\n\n    // memory copy: a scratch clone -> edits are thrown away\n    User memory tmp = users[who];\n    tmp.score = 999;            // NO effect on storage\n}\n\n// calldata: read-only external input, cheapest for arrays you only read\nfunction sum(uint256[] calldata xs) external pure returns (uint256 total) {\n    for (uint256 i; i < xs.length; ++i) total += xs[i];\n}" },
        { type: "callout", variant: "gotcha", text: "The classic bug: `User memory u = users[who]; u.score++;` compiles fine and does **nothing** on-chain, because `memory` is a copy. Use `User storage u = users[who]` when you intend to mutate state. Conversely, taking a `storage` reference and mutating it when you only wanted a scratch value corrupts real state." },
        { type: "callout", variant: "tip", text: "For `external` functions, prefer **`calldata`** over `memory` for array/struct/`bytes`/`string` params you only read — it skips the copy and saves significant gas. Use `memory` when you need to mutate the argument locally." }
      ]
    },
    {
      id: "functions",
      title: "Functions: visibility, mutability, returns, overloading",
      level: "core",
      body: [
        { type: "p", text: "A function declares **visibility** (who can call it), **state mutability** (what it may touch), optional **return values**, and modifiers. Getting visibility and mutability right is both a correctness and a gas concern." },
        { type: "table", headers: ["Visibility", "Callable from"], rows: [
          ["`external`", "other contracts / txs only (not internally as `f()`); args can be `calldata`"],
          ["`public`", "everywhere — externally *and* internally; generates a getter for state vars"],
          ["`internal`", "this contract and derived contracts (like `protected`)"],
          ["`private`", "this contract only (not even derived contracts)"]
        ] },
        { type: "table", headers: ["Mutability", "Meaning"], rows: [
          ["(none)", "may read and write storage; can be called in a state-changing tx"],
          ["`view`", "reads state, must not write; free via `eth_call`"],
          ["`pure`", "touches no state at all (no read/write); pure computation"],
          ["`payable`", "may receive ETH (`msg.value` > 0 allowed); otherwise sending ETH reverts"]
        ] },
        { type: "code", lang: "solidity", code: "contract Bank {\n    mapping(address => uint256) public balanceOf;   // auto getter\n\n    // payable: caller may attach ETH; msg.value is credited\n    function deposit() external payable {\n        balanceOf[msg.sender] += msg.value;\n    }\n\n    // view: reads state, changes nothing -> free to call off-chain\n    function balance(address who) external view returns (uint256) {\n        return balanceOf[who];\n    }\n\n    // pure: no state access at all\n    function feeOn(uint256 amount) public pure returns (uint256) {\n        return (amount * 30) / 10_000;   // 0.30%\n    }\n\n    // named + multiple returns\n    function split(uint256 x) external pure returns (uint256 half, uint256 rest) {\n        half = x / 2;\n        rest = x - half;\n    }\n\n    // overloading: same name, different parameter types\n    function value(uint256 x) public pure returns (uint256) { return x; }\n    function value(uint256 x, uint256 y) public pure returns (uint256) { return x + y; }\n}" },
        { type: "callout", variant: "tip", text: "Prefer **`external`** over `public` for functions never called internally — it's marginally cheaper and clearer about the interface. If you also need to call it inside the contract, either make it `public` or factor the body into an `internal` helper both call." }
      ]
    },
    {
      id: "modifiers-events",
      title: "Modifiers, events & logs",
      level: "core",
      body: [
        { type: "p", text: "A **modifier** wraps a function with reusable pre/post checks; the `_;` placeholder is where the function body runs. **Events** emit structured **logs** into the transaction receipt — the standard way to notify off-chain indexers, subgraphs and frontends (logs are cheap and cannot be read back by contracts)." },
        { type: "code", lang: "solidity", code: "contract Vault {\n    address public owner;\n    bool private _locked;\n\n    // up to 3 params can be `indexed` -> searchable as log topics\n    event Deposit(address indexed from, uint256 amount);\n    event OwnerChanged(address indexed previous, address indexed next);\n\n    error NotOwner();      // custom error (see next section)\n\n    constructor() { owner = msg.sender; }\n\n    modifier onlyOwner() {\n        if (msg.sender != owner) revert NotOwner();\n        _;                 // <- the wrapped function body executes here\n    }\n\n    modifier nonReentrant() {\n        require(!_locked, \"reentrant\");\n        _locked = true;\n        _;                 // body runs\n        _locked = false;   // post-body cleanup\n    }\n\n    function deposit() external payable {\n        emit Deposit(msg.sender, msg.value);   // write a log\n    }\n\n    function setOwner(address next) external onlyOwner {\n        emit OwnerChanged(owner, next);\n        owner = next;\n    }\n}" },
        { type: "list", items: [
          "**`indexed`** fields (max 3) become log *topics* — you can filter by them (`Deposit` where `from == X`). Non-indexed fields go in the log *data*.",
          "Events are **write-only from the contract's view**: no on-chain code can read past logs. They exist for off-chain consumers.",
          "Emitting a log costs gas (`LOG` opcodes + per-byte), but far less than storing the same data — use events for history/analytics you don't need on-chain.",
          "By convention, emit an event on every meaningful state change so indexers can reconstruct state."
        ] },
        { type: "callout", variant: "note", text: "`address` (20 bytes) fits in a topic and is the usual thing to index. Indexing a *dynamic* type (`string`/`bytes`) stores the **keccak256 hash** as the topic, not the value — you can match on it but can't recover the original from the topic alone." }
      ]
    },
    {
      id: "errors",
      title: "Errors: require / revert / assert, custom errors & try/catch",
      level: "core",
      body: [
        { type: "p", text: "Reverting undoes **all** state changes in the current call and returns an error to the caller (unused gas is refunded to the sender). There are three built-ins plus **custom errors**, which are the modern, gas-cheap idiom." },
        { type: "table", headers: ["Form", "Use for", "Gas / data"], rows: [
          ["`require(cond, \"msg\")`", "validate inputs / preconditions", "cheap; string reason is expensive to store"],
          ["`revert CustomError(args)`", "preferred: typed, cheap, structured error", "cheapest; 4-byte selector + args"],
          ["`assert(cond)`", "invariants that must NEVER be false (bugs)", "consumes gas, signals a Panic; don't use for input checks"],
          ["`require(cond, Err())`", "0.8.26+: require with a custom error", "combines require ergonomics + custom-error cost"]
        ] },
        { type: "code", lang: "solidity", code: "error InsufficientBalance(uint256 available, uint256 required);\nerror AmountZero();\n\ncontract Token {\n    mapping(address => uint256) public balanceOf;\n\n    function transfer(address to, uint256 amount) external {\n        uint256 bal = balanceOf[msg.sender];\n        // custom error: 4-byte selector + encoded args, much cheaper than a string\n        if (bal < amount) revert InsufficientBalance(bal, amount);\n\n        // classic require (string reason) — readable but pricier\n        require(to != address(0), \"zero address\");\n\n        // 0.8.26+: require WITH a custom error (pick an error that fits the check)\n        require(amount > 0, AmountZero());\n\n        balanceOf[msg.sender] = bal - amount;\n        balanceOf[to] += amount;\n\n        // assert: only for things that should be logically impossible\n        assert(balanceOf[msg.sender] <= bal);   // invariant, not input validation\n    }\n}" },
        { type: "p", text: "**`try/catch`** handles reverts from *external* calls and contract creations — you can recover instead of bubbling the failure up." },
        { type: "code", lang: "solidity", code: "interface IPriceFeed { function latest() external view returns (uint256); }\n\nfunction safePrice(IPriceFeed feed) external view returns (uint256 price, bool ok) {\n    try feed.latest() returns (uint256 p) {\n        return (p, true);                    // success branch\n    } catch Error(string memory reason) {    // revert(\"...\") / require(false, \"...\")\n        return (0, false);\n    } catch (bytes memory lowLevel) {         // custom errors / Panic / no reason\n        return (0, false);\n    }\n}" },
        { type: "callout", variant: "tip", text: "Prefer **custom errors** over `require` strings everywhere: they cost less to deploy and to revert with, and they carry typed data (`InsufficientBalance(available, required)`) that tooling can decode. `require(cond, Err())` (0.8.26+) gives you the familiar `require` shape with custom-error economics." },
        { type: "callout", variant: "note", text: "In 0.8+, arithmetic overflow, division by zero, out-of-range enum casts and similar trip a **`Panic(uint256)`** error (a distinct code) — not a `require`-style `Error(string)`. In `try/catch` these land in the generic `catch (bytes ...)` / `catch Panic(uint256 code)` branch." }
      ]
    },
    {
      id: "globals-eth",
      title: "Globals, receiving ETH, receive & fallback",
      level: "core",
      body: [
        { type: "p", text: "Solidity injects transaction/block context as globals. The most important is **`msg.sender`** (the immediate caller) and **`msg.value`** (ETH attached, in wei)." },
        { type: "table", headers: ["Global", "Meaning"], rows: [
          ["`msg.sender`", "the **immediate** caller (EOA or contract) — your identity/auth source"],
          ["`msg.value`", "wei sent with the call (only nonzero if the fn is `payable`)"],
          ["`msg.data`", "the raw calldata of the call"],
          ["`tx.origin`", "the EOA that started the whole tx chain — **avoid for auth** (phishing)"],
          ["`block.timestamp`", "current block time (seconds); miner-influenced by a few seconds"],
          ["`block.number`", "current block height"],
          ["`address(this).balance`", "this contract's ETH balance in wei"],
          ["`keccak256(bytes)`", "the EVM's hash function; `abi.encode`/`abi.encodePacked` to build the input"]
        ] },
        { type: "p", text: "A contract can receive ETH only if it declares a **`receive()`** and/or **`fallback()`** function (or has a `payable` function). To *send* ETH, prefer low-level **`call`** over `transfer`/`send`." },
        { type: "code", lang: "solidity", code: "contract EthBox {\n    event Received(address from, uint256 amount);\n\n    // called on plain ETH transfers with EMPTY calldata\n    receive() external payable {\n        emit Received(msg.sender, msg.value);\n    }\n\n    // called when no function matches, or ETH sent WITH calldata (must be payable to accept ETH)\n    fallback() external payable {}\n\n    // sending ETH out — three ways, but only one is recommended:\n    function withdraw(address payable to, uint256 amount) external {\n        // 1) transfer: forwards 2300 gas, reverts on failure. DISCOURAGED (gas assumption breaks)\n        // to.transfer(amount);\n        // 2) send: forwards 2300 gas, returns bool (easy to ignore). DISCOURAGED\n        // bool ok = to.send(amount);\n        // 3) call: forwards all gas, returns (bool, bytes). PREFERRED — check the result!\n        (bool ok, ) = to.call{value: amount}(\"\");\n        require(ok, \"ETH transfer failed\");\n    }\n}" },
        { type: "callout", variant: "warn", text: "`transfer`/`send` hard-code a **2300 gas** stipend. Since gas costs of opcodes can change across hard forks (and some recipients are contracts/multisigs that need more), this can wrongly fail. The community standard is `(bool ok, ) = to.call{value: x}(\"\"); require(ok);` — but `call` forwards all gas, so pair it with the **checks-effects-interactions** pattern or a reentrancy guard (next section)." },
        { type: "callout", variant: "gotcha", text: "`receive()` runs with only the 2300 gas stipend when triggered by `.transfer`/`.send` from another contract — doing anything nontrivial in it (writing storage, emitting a big event) can run out of gas. Keep `receive()`/`fallback()` minimal." }
      ]
    },
    {
      id: "inheritance",
      title: "Inheritance, interfaces, abstract contracts & libraries",
      level: "core",
      body: [
        { type: "p", text: "Solidity has single-rooted multiple inheritance (C3-linearized). Base functions marked **`virtual`** can be **`override`**-ridden. **Interfaces** declare a contract's external API with no implementation; **abstract** contracts have some unimplemented functions; **libraries** are stateless, reusable code, often attached to a type with **`using ... for`**." },
        { type: "code", lang: "solidity", code: "// interface: external function signatures only (implicitly abstract, no state)\ninterface IERC20 {\n    function transfer(address to, uint256 amount) external returns (bool);\n    function balanceOf(address who) external view returns (uint256);\n}\n\n// abstract: partially implemented, cannot be deployed directly\nabstract contract Ownable {\n    address public owner;\n    error NotOwner();\n    constructor() { owner = msg.sender; }\n    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }\n    function _authorizeUpgrade() internal virtual;   // subclasses must implement\n}\n\n// inheritance + virtual/override\ncontract Base {\n    function greet() public virtual pure returns (string memory) { return \"base\"; }\n}\ncontract Child is Base, Ownable {\n    function greet() public pure override returns (string memory) { return \"child\"; }\n    function _authorizeUpgrade() internal override onlyOwner {}\n    // super.greet() calls the parent implementation\n}", },
        { type: "heading", text: "Libraries & using-for" },
        { type: "code", lang: "solidity", code: "library SafeMath {   // 0.8 has checked math built-in; libraries still great for helpers\n    function pct(uint256 x, uint256 bps) internal pure returns (uint256) {\n        return (x * bps) / 10_000;\n    }\n}\n\ncontract Fees {\n    using SafeMath for uint256;    // attach the library's fns to uint256\n\n    function fee(uint256 amount) external pure returns (uint256) {\n        return amount.pct(30);     // reads as a method call on the value\n    }\n}", },
        { type: "table", headers: ["Construct", "Has state?", "Deployable?", "Use for"], rows: [
          ["`interface`", "no", "no", "declare an external API to call other contracts"],
          ["`abstract contract`", "yes", "no", "shared base with some unimplemented parts"],
          ["`library`", "no (internal) / separate (external)", "linked", "reusable pure/utility functions; `using for`"],
          ["`contract`", "yes", "yes", "the actual deployable thing"]
        ] },
        { type: "callout", variant: "note", text: "`internal` library functions are **inlined** into your contract (no external call, cheap). Library functions marked `public`/`external` are deployed once and **`delegatecall`**-ed, sharing the caller's storage context — the mechanism behind OpenZeppelin's upgradeable libraries." }
      ]
    },
    {
      id: "openzeppelin",
      title: "OpenZeppelin: ERC-20, ERC-721 & ERC-1155",
      level: "core",
      body: [
        { type: "p", text: "**OpenZeppelin Contracts** is the audited, de-facto-standard library for token standards, access control, security utilities and proxies. Do not hand-roll an ERC-20 — inherit from OZ and override only what you need. Token standards are just interfaces (ERC = Ethereum Request for Comment): **ERC-20** fungible tokens, **ERC-721** NFTs (unique), **ERC-1155** multi-token (batches of fungible + non-fungible)." },
        { type: "code", lang: "bash", code: "forge install OpenZeppelin/openzeppelin-contracts\n# remapping in foundry.toml: \"@openzeppelin/=lib/openzeppelin-contracts/\"" },
        { type: "code", lang: "solidity", code: "// SPDX-License-Identifier: MIT\npragma solidity 0.8.35;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/Ownable.sol\";\n\ncontract MyToken is ERC20, Ownable {\n    // OZ v5 Ownable takes the initial owner in its constructor\n    constructor(uint256 initialSupply)\n        ERC20(\"My Token\", \"MTK\")\n        Ownable(msg.sender)\n    {\n        _mint(msg.sender, initialSupply);   // internal helper from ERC20\n    }\n\n    // only the owner can mint more\n    function mint(address to, uint256 amount) external onlyOwner {\n        _mint(to, amount);\n    }\n}", },
        { type: "list", items: [
          "**ERC-20** (`ERC20`, `ERC20Burnable`, `ERC20Permit` for gasless approvals): fungible tokens — `transfer`, `approve`/`transferFrom`, `balanceOf`, `totalSupply`.",
          "**ERC-721** (`ERC721`, `ERC721URIStorage`, `ERC721Enumerable`): NFTs — each `tokenId` is unique with an owner and a `tokenURI` for metadata.",
          "**ERC-1155** (`ERC1155`): one contract managing many token ids with balances — efficient for games/editions; supports batch transfers.",
          "**Utilities:** `SafeERC20` (safe `transfer`/`approve` for non-standard tokens), `ReentrancyGuard`, `Pausable`, `AccessControl`, `Ownable`, `EnumerableSet`, proxy/upgradeable variants (`@openzeppelin/contracts-upgradeable`)."
        ] },
        { type: "callout", variant: "warn", text: "**OpenZeppelin v5 changed several APIs** vs v4: `Ownable` now requires an initial owner in the constructor (`Ownable(msg.sender)`), `_beforeTokenTransfer`/`_afterTokenTransfer` hooks were merged into a single `_update`, and `Counters` was removed. Old tutorials targeting v4 won't compile against v5." },
        { type: "callout", variant: "tip", text: "Use **`SafeERC20`** (`token.safeTransfer(...)`) when moving *arbitrary* ERC-20s: some real tokens (USDT is the famous case) don't return a bool from `transfer`, so a naive `require(token.transfer(...))` reverts against them. `SafeERC20` handles both conventions." }
      ]
    },
    {
      id: "security",
      title: "Security: reentrancy, access control, arithmetic & more",
      level: "core",
      body: [
        { type: "p", text: "Smart contracts hold real money on an adversarial, public network — security *is* the job. The single most famous class of bug is **reentrancy**: an external call (sending ETH, calling an unknown contract) hands control to the callee, which can re-enter your function *before* you've updated state." },
        { type: "heading", text: "Reentrancy & checks-effects-interactions" },
        { type: "code", lang: "solidity", code: "// VULNERABLE: interaction (ETH send) happens BEFORE the state update\nfunction withdrawBad() external {\n    uint256 bal = balances[msg.sender];\n    (bool ok, ) = msg.sender.call{value: bal}(\"\");   // attacker re-enters here...\n    require(ok);\n    balances[msg.sender] = 0;                         // ...before this runs -> drained\n}\n\n// SAFE: Checks -> Effects -> Interactions. Update state BEFORE the external call.\nimport \"@openzeppelin/contracts/utils/ReentrancyGuard.sol\";\ncontract Bank is ReentrancyGuard {\n    mapping(address => uint256) public balances;\n\n    function withdraw() external nonReentrant {        // guard = belt and suspenders\n        uint256 bal = balances[msg.sender];           // Checks\n        require(bal > 0, \"nothing\");\n        balances[msg.sender] = 0;                      // Effects (state updated FIRST)\n        (bool ok, ) = msg.sender.call{value: bal}(\"\"); // Interactions (external call LAST)\n        require(ok, \"send failed\");\n    }\n}", },
        { type: "list", items: [
          "**Checks-Effects-Interactions (CEI):** validate, then update your storage, *then* make external calls. This alone defeats classic reentrancy; add `nonReentrant` as defense-in-depth.",
          "**Access control:** gate privileged functions with `onlyOwner` (`Ownable`) or role checks (`AccessControl`'s `onlyRole(MINTER_ROLE)`). A missing modifier is a total compromise.",
          "**Integer overflow:** in 0.8+ arithmetic **reverts on overflow/underflow** automatically — no more SafeMath. Only opt out with `unchecked { ... }` when you've proven it's safe.",
          "**`tx.origin` phishing:** never authorize with `require(tx.origin == owner)`. A malicious contract the owner is tricked into calling passes that check. Use `msg.sender`.",
          "**Unchecked external calls:** `call`/`send` return a success bool — always check it (`require(ok)`). Ignoring it silently swallows failures.",
          "**Front-running / MEV:** the mempool is public; anyone can see and reorder/copy your pending tx. Use commit-reveal, slippage limits, or private mempools for sensitive ordering.",
          "**Oracle / price manipulation:** never trust a spot price from a single AMM pool (flash-loan manipulable). Use time-weighted averages (TWAP) or Chainlink."
        ] },
        { type: "code", lang: "solidity", code: "import \"@openzeppelin/contracts/access/AccessControl.sol\";\n\ncontract Minter is AccessControl {\n    bytes32 public constant MINTER_ROLE = keccak256(\"MINTER_ROLE\");\n    constructor() { _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); }\n\n    function mint() external onlyRole(MINTER_ROLE) { /* ... */ }\n}", },
        { type: "callout", variant: "warn", text: "`unchecked { }` disables overflow checks to save gas — legitimate for loop counters (`unchecked { ++i; }`) or math you've bounded, but a footgun anywhere value is at stake. Underflowing a balance in an `unchecked` block silently wraps to a huge number. Only use it where you can prove the operation can't over/underflow." },
        { type: "callout", variant: "note", text: "Run static analysis (`slither .`), a fuzzer (Foundry fuzz/invariant tests, or Echidna), and get an audit before mainnet. Study the [Solidity security considerations](https://docs.soliditylang.org/en/latest/security-considerations.html) and known incident write-ups — most exploits recycle the same handful of bug classes." }
      ]
    },
    {
      id: "gas",
      title: "Gas optimization",
      level: "deep",
      body: [
        { type: "p", text: "Storage is the dominant cost: a cold `SSTORE` (writing a fresh slot) is ~20,000 gas; reading storage (`SLOAD`) is ~2,100 cold. Memory and stack ops are cheap. Optimize by touching storage less and packing it tighter — but never trade away correctness or readability for micro-savings." },
        { type: "list", items: [
          "**Pack storage:** group small types so multiple fit in one 32-byte slot (`uint96 price; address maker;` → one slot, since 12 + 20 = 32 bytes; adding a `bool filled;` spills into a second slot — still 2 slots vs 3 unpacked). Declaration order matters. A `bool` next to a `uint256` wastes a slot each, since the `uint256` already fills its slot.",
          "**`constant` / `immutable`** instead of storage reads for fixed values — they're inlined into code, saving an `SLOAD` on every access.",
          "**Cache storage in memory:** read a storage var into a local once, work with the local, write back once, rather than re-reading `state.x` in a loop.",
          "**`calldata` over `memory`** for read-only external array/struct params — avoids the copy.",
          "**Custom errors over `require` strings** — a string reason bloats deploy size and revert cost; a custom error is a 4-byte selector.",
          "**`unchecked`** for provably-safe arithmetic (loop increments, indices) skips the overflow check.",
          "**`++i` over `i++`**, avoid unnecessary `SLOAD`s in loop conditions (`for (uint i; i < len; ++i)` where `len` is cached).",
          "**Short-circuit & minimize on-chain data:** emit events instead of storing history; store hashes not blobs; avoid unbounded loops entirely."
        ] },
        { type: "code", lang: "solidity", code: "// storage packing: 20 + 12 = 32 bytes -> ONE slot instead of three\nstruct Order { address maker; uint96 amount; }   // 20 + 12 bytes = 1 slot\n\n// cache storage, loop with unchecked increment\nfunction total(uint256[] calldata xs) external pure returns (uint256 sum) {\n    uint256 len = xs.length;                 // cache length\n    for (uint256 i; i < len;) {\n        sum += xs[i];\n        unchecked { ++i; }                    // i can't overflow len\n    }\n}", },
        { type: "code", lang: "bash", code: "forge test --gas-report          # per-function gas table\nforge snapshot                   # write .gas-snapshot; diff to catch regressions\nforge snapshot --check           # fail CI if gas usage changed\nforge inspect MyToken bytecode | wc -c   # rough deployed-size check" },
        { type: "callout", variant: "tip", text: "Measure, don't guess: `forge test --gas-report` and `forge snapshot` show real numbers. The optimizer's `optimizer_runs` trades deploy cost vs runtime cost — a high value (e.g. 1,000,000) makes calls cheaper but deployment bigger; a low value (200) is the opposite. Tune it to how often the contract is called." }
      ]
    },
    {
      id: "foundry-testing",
      title: "Foundry testing: forge-std, cheatcodes, fuzz & invariants",
      level: "core",
      body: [
        { type: "p", text: "You write tests **in Solidity**. Test files live in `test/` and are named `*.t.sol`; a test contract inherits `forge-std`'s `Test`, and every `public`/`external` function whose name starts with `test` is run as a test. **`vm` cheatcodes** manipulate the EVM (set the caller, warp time, expect reverts, fund accounts). `setUp()` runs fresh before **each** test — tests are isolated, state does not leak between them." },
        { type: "table", headers: ["Function name prefix", "What Forge does with it"], rows: [
          ["`test_Foo()`", "a standard unit test — passes unless it reverts / an assert fails"],
          ["`testFuzz_Foo(uint x)`", "fuzz test — parameters get hundreds of random inputs"],
          ["`test_RevertWhen_X` / `test_RevertIf_X`", "convention for tests that assert a revert (pair with `vm.expectRevert`)"],
          ["`invariant_Foo()`", "invariant test — checked after every random call sequence"],
          ["`setUp()`", "runs before each test; `beforeTestSetup`/`afterInvariant` are optional hooks"],
          ["a name WITHOUT `test`/`invariant`", "not run as a test — treated as an internal helper"]
        ] },
        { type: "code", lang: "solidity", code: "// test/Bank.t.sol\n// SPDX-License-Identifier: MIT\npragma solidity 0.8.35;\n\nimport \"forge-std/Test.sol\";\nimport \"../src/Bank.sol\";\n\ncontract BankTest is Test {\n    Bank bank;\n    address alice = makeAddr(\"alice\");   // deterministic labeled address\n\n    function setUp() public {\n        bank = new Bank();\n        vm.deal(alice, 10 ether);         // give alice ETH\n    }\n\n    function test_DepositCreditsBalance() public {\n        vm.prank(alice);                  // next call's msg.sender = alice\n        bank.deposit{value: 1 ether}();\n        assertEq(bank.balances(alice), 1 ether);\n    }\n\n    function test_RevertWhen_WithdrawEmpty() public {\n        vm.prank(alice);\n        vm.expectRevert(\"nothing\");        // assert the next call reverts (with this reason)\n        bank.withdraw();\n    }\n\n    function test_WarpTime() public {\n        vm.warp(block.timestamp + 7 days); // move the clock forward\n        vm.roll(block.number + 100);       // advance block number\n    }\n}", },
        { type: "table", headers: ["Cheatcode", "Effect"], rows: [
          ["`vm.prank(addr)`", "set `msg.sender` for the **next** call only"],
          ["`vm.startPrank(a)` / `vm.stopPrank()`", "set `msg.sender` for a block of calls"],
          ["`vm.deal(addr, amt)`", "set an address's ETH balance"],
          ["`vm.warp(ts)` / `vm.roll(n)`", "set `block.timestamp` / `block.number`"],
          ["`vm.expectRevert(Err.selector)`", "assert next call reverts — by string, `Err.selector`, `abi.encodeWithSelector(Err.selector, args)`, or bytes"],
          ["`vm.expectEmit(true,true,true,true)`", "assert the NEXT emitted event matches — emit the expected event right after, then make the call"],
          ["`vm.expectCall(addr, data)`", "assert `addr` gets called with this calldata"],
          ["`vm.mockCall(addr, data, ret)`", "stub an external call's return value; `vm.clearMockedCalls()` to reset"],
          ["`vm.etch(addr, code)`", "place arbitrary bytecode at an address (inject a mock at a fixed address)"],
          ["`deal(token, to, amt)`", "(forge-std) set an ERC-20 balance; the `vm.deal(addr,amt)` form sets ETH"],
          ["`makeAddr(\"name\")` / `makeAddrAndKey`", "deterministic labeled test address; the `AndKey` form also returns its private key"],
          ["`vm.label(addr, \"name\")`", "name an address so it shows readably in traces"],
          ["`vm.assume(cond)` / `bound(x,lo,hi)`", "fuzz input control: `assume` discards bad runs, `bound` maps into a range (prefer `bound`)"],
          ["`vm.recordLogs()` / `vm.getRecordedLogs()`", "capture emitted logs to assert on topics/data manually"],
          ["`vm.sign(pk, digest)` / `vm.addr(pk)`", "produce an ECDSA signature / derive the address for a private key (permit/EIP-712 tests)"],
          ["`vm.load` / `vm.store`", "read/write raw storage slots directly"],
          ["`assertEq` / `assertGt` / `assertApproxEqAbs`", "forge-std assertions (with nice diffs); add a string as the last arg for a failure message"]
        ] },
        { type: "code", lang: "solidity", code: "function test_EmitsAndRevertsPrecisely() public {\n    // expectEmit: emit the EXPECTED event, then trigger the real one\n    vm.expectEmit(true, false, false, true);   // check topic1 + data\n    emit Deposit(alice, 1 ether);\n    vm.prank(alice);\n    bank.deposit{value: 1 ether}();\n\n    // expectRevert by custom-error selector (with args)\n    vm.expectRevert(abi.encodeWithSelector(Bank.TooLow.selector, 0));\n    bank.withdraw();\n\n    // sign/recover flow for EIP-712 / permit tests\n    (address signer, uint256 pk) = makeAddrAndKey(\"signer\");\n    (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);\n}", },
        { type: "heading", text: "Fuzz testing" },
        { type: "p", text: "Give a test function **parameters** and Forge auto-generates hundreds of random inputs, shrinking any failing case to a minimal counterexample — property-based testing built in." },
        { type: "code", lang: "solidity", code: "// any input `amount` gets fuzzed; bound it to a sensible range\nfunction testFuzz_Deposit(uint96 amount) public {\n    amount = uint96(bound(amount, 1, 100 ether));\n    vm.deal(alice, amount);\n    vm.prank(alice);\n    bank.deposit{value: amount}();\n    assertEq(bank.balances(alice), amount);   // property must hold for ALL inputs\n}", },
        { type: "heading", text: "Invariant testing" },
        { type: "p", text: "**Invariant tests** hammer your contract with random *sequences* of calls (a handler) and assert a property (`invariant_*`) holds after every one — e.g. \"the contract's ETH balance always equals the sum of user balances.\" This catches multi-step bugs a single test never would." },
        { type: "code", lang: "solidity", code: "// functions prefixed `invariant_` are checked after each random call sequence\nfunction invariant_SolvencyHolds() public view {\n    assertGe(address(bank).balance, bank.totalDeposited());\n}", },
        { type: "p", text: "Real invariant suites use a **handler**: a wrapper contract exposing only the state transitions you want fuzzed (with `bound`ed inputs and ghost-variable bookkeeping). Register it in `setUp()` with `targetContract(address(handler))` so the fuzzer calls the handler, not the raw contract — otherwise random calls revert constantly and cover little." },
        { type: "code", lang: "toml", code: "# foundry.toml — fuzz & invariant tuning\n[fuzz]\nruns = 256                 # inputs per fuzz test (bump in CI)\nmax_test_rejects = 65536   # give up after this many vm.assume rejections\n\n[invariant]\nruns = 256                 # number of random call sequences\ndepth = 500                # calls per sequence\nfail_on_revert = true      # true = a reverting handler call fails the run (forces clean handlers)\ncall_override = false" },
        { type: "callout", variant: "gotcha", text: "`fail_on_revert = false` is the trap: the fuzzer counts reverting calls as \"passing\", so your invariant looks green while barely exercising anything. Set it `true` and make handlers revert-free (guard/`bound` every input) so every call does real work. Use `vm.assume` only to skip a few pathological inputs; use `bound` to map a fuzz value into a valid range (it never wastes a run)." },
        { type: "heading", text: "Fork testing" },
        { type: "p", text: "Fork a live network mid-test to run against **real deployed contracts** (a real USDC, Uniswap, Aave) instead of redeploying mocks. Needs an RPC URL — configure it under `[rpc_endpoints]` in `foundry.toml` and read it with `vm.rpcUrl(\"mainnet\")`, or pass `forge test --fork-url $RPC`." },
        { type: "code", lang: "solidity", code: "IERC20 constant USDC = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);\n\nfunction setUp() public {\n    // fork mainnet at a pinned block for reproducibility\n    vm.createSelectFork(vm.rpcUrl(\"mainnet\"), 20_000_000);\n}\n\nfunction test_ImpersonateAWhale() public {\n    address whale = 0x28C6c06298d514Db089934071355E5743bf21d60;\n    vm.startPrank(whale);\n    USDC.transfer(alice, 1_000e6);   // act as the whale against real state\n    vm.stopPrank();\n}", },
        { type: "callout", variant: "tip", text: "Verbosity is your debugger: `forge test -vv` shows `console2.log` output and revert reasons, `-vvv` prints traces for **failing** tests, `-vvvv` prints full traces for **every** test. Narrow the run with `--match-test`, `--match-contract`, `--match-path`, add `--watch` for re-run-on-save, `--gas-report` for a gas table, and `forge coverage` for line/branch coverage." }
      ]
    },
    {
      id: "cast-anvil",
      title: "cast & anvil: talking to chains locally",
      level: "deep",
      body: [
        { type: "p", text: "**`cast`** is a Swiss-army knife for reading/writing chains and encoding data from the shell. **`anvil`** is a local development node (like Ganache/Hardhat Network) that can also **fork mainnet** so you test against real deployed contracts and state." },
        { type: "code", lang: "bash", code: "# --- anvil: local node ---\nanvil                                    # 10 funded accounts, http://127.0.0.1:8545\nanvil --fork-url $MAINNET_RPC_URL        # fork mainnet state locally\nanvil --fork-url $MAINNET_RPC_URL --fork-block-number 19000000   # pin a block\n\n# --- cast: read the chain (free view calls) ---\ncast call 0xToken \"balanceOf(address)(uint256)\" 0xUser --rpc-url $RPC\ncast block-number --rpc-url $RPC\ncast balance 0xabc... --rpc-url $RPC\ncast code 0xContract --rpc-url $RPC       # is there bytecode there?\n\n# --- cast: send a transaction (state-changing) ---\ncast send 0xToken \"transfer(address,uint256)\" 0xTo 1000 \\\n     --private-key $PK --rpc-url $RPC\n\n# --- cast: encode / decode / hash utilities ---\ncast abi-encode \"f(uint256,address)\" 42 0xabc...\ncast calldata \"transfer(address,uint256)\" 0xTo 1000    # full 4-byte + args\ncast 4byte 0xa9059cbb                     # look up a function selector\ncast keccak \"Transfer(address,address,uint256)\"        # event topic hash\ncast --to-wei 1.5 ether                   # unit conversions\ncast sig \"transfer(address,uint256)\"      # -> 0xa9059cbb" },
        { type: "list", items: [
          "**`cast call`** = free read (`eth_call`, no state change, no gas paid); **`cast send`** = a real transaction (needs a signer + gas).",
          "**Forking** (`anvil --fork-url`) lets you test against live protocols (Uniswap, Aave, a real USDC) without deploying them — invaluable for integration tests. Forge tests can fork too via `vm.createSelectFork(...)`.",
          "**Impersonation:** on anvil you can send txs *as any address* (`cast rpc anvil_impersonateAccount 0x...`) — combine with a fork to act as a whale.",
          "**`chisel`** is Foundry's Solidity REPL for quickly evaluating expressions."
        ] },
        { type: "callout", variant: "tip", text: "In Forge tests, `vm.createSelectFork(vm.rpcUrl(\"mainnet\"))` forks a real network mid-test so you can interact with deployed contracts (e.g. swap on a real DEX) — the same superpower as `anvil --fork-url`, but inside your Solidity test suite." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment & verification with forge script",
      level: "core",
      body: [
        { type: "p", text: "Deployment scripts are **written in Solidity** too (`script/*.s.sol`), inheriting `forge-std`'s `Script`. `vm.startBroadcast()` marks the calls that become real on-chain transactions. This gives repeatable, reviewable, testable deploys — far better than ad-hoc CLI commands." },
        { type: "code", lang: "solidity", code: "// script/Deploy.s.sol\n// SPDX-License-Identifier: MIT\npragma solidity 0.8.35;\n\nimport \"forge-std/Script.sol\";\nimport \"../src/MyToken.sol\";\n\ncontract Deploy is Script {\n    function run() external {\n        uint256 pk = vm.envUint(\"PRIVATE_KEY\");   // read a key from env\n        vm.startBroadcast(pk);                     // everything below is broadcast on-chain\n\n        MyToken token = new MyToken(1_000_000e18);\n\n        vm.stopBroadcast();\n        console2.log(\"deployed at\", address(token));\n    }\n}", },
        { type: "code", lang: "bash", code: "# 1) DRY RUN: simulate against the RPC, no tx sent — always do this first\nforge script script/Deploy.s.sol --rpc-url $RPC_URL\n\n# 2) BROADCAST: actually send the txs (and verify on Etherscan in one shot)\nforge script script/Deploy.s.sol:Deploy \\\n  --rpc-url $RPC_URL \\\n  --broadcast \\\n  --verify --etherscan-api-key $ETHERSCAN_API_KEY\n\n# call a specific function instead of run() (with ABI-encoded args)\nforge script script/Deploy.s.sol --sig \"deploy(uint256)\" 1000 --rpc-url $RPC_URL --broadcast\n\n# --resume: a broadcast died mid-way (a tx got stuck)? re-send the unconfirmed ones\nforge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --resume\n\n# quick one-off deploy without a script\nforge create src/MyToken.sol:MyToken \\\n  --constructor-args 1000000000000000000000000 \\\n  --private-key $PK --rpc-url $RPC --broadcast --verify\n\n# verify an already-deployed contract after the fact\nforge verify-contract 0xAddress src/MyToken.sol:MyToken \\\n  --chain mainnet --etherscan-api-key $ETHERSCAN_API_KEY" },
        { type: "heading", text: "Key management (never paste a mainnet key on the CLI)" },
        { type: "code", lang: "bash", code: "# import a key ONCE into an encrypted keystore, then reference it by name\ncast wallet import deployer --interactive     # prompts for the key + a password\nforge script script/Deploy.s.sol --rpc-url $RPC --broadcast --account deployer   # prompts for password\n\n# hardware wallet\nforge script script/Deploy.s.sol --rpc-url $RPC --broadcast --ledger\n\n# env var (fine for testnets / CI secrets, read via vm.envUint in the script)\nforge script script/Deploy.s.sol --rpc-url $RPC --broadcast --private-key $PK" },
        { type: "list", items: [
          "**Dry run vs broadcast:** without `--broadcast`, `forge script` only *simulates* against the RPC (inspect the trace/gas); `--broadcast` signs and sends the real transactions.",
          "**`vm.startBroadcast()` scope:** only calls between `startBroadcast`/`stopBroadcast` become on-chain txs; everything else (reads, setup) runs in the local simulation. `vm.startBroadcast(pk)` fixes the signer; the bare form uses the `--account`/`--private-key`/`--ledger` you pass on the CLI.",
          "**`console2.log(...)`** (from `forge-std/console2.sol`) prints from scripts and tests — shown at `-vv`+ verbosity.",
          "**`--sig`** picks which function to run (default `run()`) and ABI-encodes the args; **`--resume`** re-sends unconfirmed txs from a partially-broadcast run.",
          "**Broadcast artifacts** land in `broadcast/<Script>/<chainId>/run-latest.json` — a record of every deploy with addresses and tx hashes (read them back with `foundry-devops`).",
          "**Verification** publishes your source to Etherscan so users can read/interact; `--verify` inline, or `forge verify-contract` after the fact."
        ] },
        { type: "heading", text: "The JS/TS ecosystem: Hardhat, ethers, viem/wagmi" },
        { type: "p", text: "**Hardhat** is the JavaScript/TypeScript-based alternative toolchain — tests and scripts in JS/TS with a large plugin ecosystem; many teams use it alongside or instead of Foundry (Foundry is favored for fast Solidity-native testing/fuzzing, Hardhat for JS-heavy workflows and TypeScript typing). From a **frontend**, you talk to contracts with **ethers.js** or **viem** (a modern, typed, tree-shakeable client), and **wagmi** provides React hooks (`useReadContract`, `useWriteContract`) on top of viem." },
        { type: "code", lang: "ts", code: "// frontend read/write with viem\nimport { createPublicClient, http, getContract } from \"viem\";\nimport { mainnet } from \"viem/chains\";\n\nconst client = createPublicClient({ chain: mainnet, transport: http() });\nconst token = getContract({ address: \"0xToken\", abi: erc20Abi, client });\nconst bal = await token.read.balanceOf([\"0xUser\"]);   // typed from the ABI", },
        { type: "callout", variant: "note", text: "The **ABI** (Application Binary Interface, the JSON in `out/`) is the contract between Solidity and any client — ethers/viem/wagmi all consume it to encode calls and decode results. Export it from `out/` (or generate typed bindings) and keep it in sync with the deployed contract, or the frontend will decode garbage." }
      ]
    },
    {
      id: "running-commands",
      title: "Running tests & scripts: the commands you actually type",
      level: "core",
      body: [
        { type: "p", text: "One place for the exact invocations. Everything is a subcommand of `forge` (build/test/deploy), `cast` (talk to a chain), or `anvil` (local node). Selectors (`--match-*`) and verbosity (`-v`) stack." },
        { type: "heading", text: "Tests" },
        { type: "code", lang: "bash", code: "forge test                              # run every *.t.sol test\nforge test -vvv                         # traces on failing tests (-vv logs, -vvvv all traces)\nforge test --match-test test_Deposit    # only tests whose name matches (regex)\nforge test --match-contract BankTest    # only this test contract\nforge test --match-path test/Bank.t.sol # only this file\nforge test --no-match-test testFuzz     # exclude a pattern (also --no-match-contract/-path)\nforge test --watch                      # re-run on file save\nforge test --gas-report                 # per-function gas table\nforge test --fork-url $RPC              # run the suite against a forked network\nforge test --fuzz-runs 10000            # override fuzz runs for this run\nforge test --match-test test_X -vvvv    # focus one test with full trace (the debug loop)\nforge coverage                          # line/branch coverage\nforge coverage --report lcov            # machine-readable coverage for CI\nforge snapshot                          # write .gas-snapshot; --check fails CI on drift\nforge test --debug test_Deposit         # step through the opcodes in the debugger" },
        { type: "heading", text: "Scripts & deploys" },
        { type: "code", lang: "bash", code: "forge script script/Deploy.s.sol --rpc-url $RPC                 # simulate (dry run)\nforge script script/Deploy.s.sol --rpc-url $RPC --broadcast     # send it\nforge script ... --broadcast --verify                          # + verify on Etherscan\nforge script ... --broadcast --resume                          # re-send stuck txs\nforge script ... --sig \"deploy(uint256)\" 1000 --broadcast      # call a specific fn\nforge script ... --account deployer --broadcast                # sign from a keystore\nforge create src/T.sol:T --private-key $PK --rpc-url $RPC --broadcast   # one-off deploy" },
        { type: "heading", text: "cast: one-off chain interaction" },
        { type: "code", lang: "bash", code: "cast call 0xC \"balanceOf(address)(uint256)\" 0xU --rpc-url $RPC   # free read (eth_call)\ncast send 0xC \"transfer(address,uint256)\" 0xTo 100 \\\n     --account deployer --rpc-url $RPC                            # state-changing tx\ncast wallet import deployer --interactive                         # encrypt a key into a keystore\ncast wallet address --account deployer                           # show its address\ncast sig \"transfer(address,uint256)\"                             # -> 0xa9059cbb\ncast 4byte-decode 0xa9059cbb...                                  # decode calldata\ncast receipt 0xTxHash --rpc-url $RPC                             # inspect a mined tx" },
        { type: "callout", variant: "tip", text: "The tight inner loop is `forge test --match-test <name> -vvvv --watch`: it re-runs a single test on every save and dumps a full call trace so you can see exactly where and why it reverts. Add `console2.log(...)` (visible at `-vv`+) for value-level debugging." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "These are the recurring foot-guns that bite Solidity developers — some cost gas, several have cost protocols millions. Internalize them." },
        { type: "heading", text: "1. Reentrancy" },
        { type: "callout", variant: "warn", text: "An external call (`call{value:}`, or calling any unknown contract) hands control to the callee, which can re-enter before you update state. **Fix:** Checks-Effects-Interactions (update storage *before* the external call) plus `ReentrancyGuard`'s `nonReentrant`. This is the #1 exploit class historically (The DAO, and many since)." },
        { type: "heading", text: "2. Unchecked return values from low-level calls" },
        { type: "callout", variant: "gotcha", text: "`address.call{value:x}(\"\")` and `.send` return a `bool` you must check — ignoring it means a failed transfer looks successful. Always `(bool ok, ) = ...; require(ok);`. Likewise use `SafeERC20` for tokens: some (USDT) don't return a bool from `transfer`, breaking `require(token.transfer(...))`." },
        { type: "heading", text: "3. msg.sender vs tx.origin" },
        { type: "callout", variant: "gotcha", text: "Authorizing with `tx.origin` is a phishing hole: if the owner is tricked into calling a malicious contract, that contract calls yours and `tx.origin` is still the owner. **Always** authenticate with `msg.sender`. Reserve `tx.origin` for the rare 'reject all contract callers' check — and know EIP-7702 muddies even that." },
        { type: "heading", text: "4. storage vs memory copies" },
        { type: "callout", variant: "gotcha", text: "`MyStruct memory s = data[id]; s.x = 1;` edits a **copy** and changes nothing on-chain. Use `MyStruct storage s = data[id];` to mutate state. The reverse (aliasing storage when you wanted scratch) silently corrupts state. Data location is semantics, not decoration." },
        { type: "heading", text: "5. Division, rounding & no floats" },
        { type: "callout", variant: "gotcha", text: "There are **no floating-point numbers**. Integer division truncates toward zero (`7 / 2 == 3`), and `a / b * c` loses precision — always **multiply before dividing** (`a * c / b`) and scale with fixed-point (e.g. 1e18 'wei' units or basis points). Rounding direction can be an economic exploit; round *against* the user where it protects the protocol." },
        { type: "heading", text: "6. Unbounded loops & gas limits" },
        { type: "callout", variant: "warn", text: "Looping over an array that can grow without bound (e.g. `for` over all users to pay them) will eventually exceed the block gas limit and **permanently brick** that function. Use the **pull-over-push** pattern (users withdraw their own funds), or paginate. Never let external actors grow an array you must iterate in full." },
        { type: "heading", text: "7. public vs external (and internal call cost)" },
        { type: "callout", variant: "tip", text: "`public` functions are callable internally and externally; `external` only externally (and can take `calldata`, saving gas). Marking an interface function `external` is the norm. If a function must be called both ways, make a `public` version or an `internal` helper — don't reach for `this.f()` internally, which forces a costly external call." },
        { type: "heading", text: "8. delegatecall & proxy footguns" },
        { type: "callout", variant: "warn", text: "`delegatecall` runs another contract's code **in your storage context** — the basis of upgradeable proxies, and a minefield. **Storage layout must match** between proxy and implementation (reordering/inserting a variable corrupts state); an implementation contract left uninitialized can be `selfdestruct`ed (the Parity freeze). Use OpenZeppelin's audited UUPS/Transparent proxies and `initializer` modifiers rather than rolling your own." },
        { type: "callout", variant: "note", text: "General discipline: pin the compiler, write invariant + fuzz tests, run `slither`, get an audit, and assume every external input and every external contract is hostile. On mainnet there are no do-overs — deploy behind a timelock/multisig and consider a pause switch (`Pausable`) for emergencies." }
      ]
    }
  ],

  packages: [
    { name: "forge-std", why: "Foundry's std library: Test, Script, console2, vm cheatcode interface, assertions" },
    { name: "@openzeppelin/contracts", why: "audited ERC-20/721/1155, Ownable, AccessControl, ReentrancyGuard, SafeERC20, Pausable" },
    { name: "@openzeppelin/contracts-upgradeable", why: "proxy-safe (initializer-based) variants for UUPS/Transparent upgradeable contracts" },
    { name: "solmate / solady", why: "hyper-gas-optimized alternatives to OZ (ERC20, ERC721, math, auth) for tight-budget code" },
    { name: "foundry (forge/cast/anvil/chisel)", why: "the core toolchain: build, Solidity tests, CLI chain access, local/forking node, REPL" },
    { name: "prb-math / solmate FixedPointMathLib", why: "fixed-point math (UD60x18/SD59x18) for safe decimals without floats" },
    { name: "chainlink (contracts)", why: "price feeds, VRF (randomness), Automation — the standard oracle stack" },
    { name: "slither", why: "static analyzer (Trail of Bits) — catches reentrancy, bad ERC-20 usage, and dozens more" },
    { name: "echidna / medusa", why: "property-based fuzzers for deeper invariant testing beyond forge fuzz" },
    { name: "hardhat", why: "JS/TS alternative toolchain with a large plugin ecosystem (deploy, typechain, coverage)" },
    { name: "ethers.js", why: "mature JS/TS library to sign, send txs, read events, and interact from a frontend/backend" },
    { name: "viem", why: "modern, typed, tree-shakeable TS client for reading/writing contracts (ABI-typed)" },
    { name: "wagmi", why: "React hooks over viem (useReadContract/useWriteContract/useAccount) for dApp frontends" },
    { name: "foundry-devops", why: "helpers to read the latest deployment from broadcast/ artifacts in scripts" }
  ],

  gotchas: [
    "**Reentrancy:** update state BEFORE external calls (checks-effects-interactions) and add `nonReentrant`. An external `call` hands control to the callee, which can re-enter and drain you.",
    "**`memory` is a copy:** `Struct memory s = data[id]; s.x = 1;` changes nothing on-chain. Use `Struct storage s = data[id];` to mutate state.",
    "**Check low-level call results:** `(bool ok, ) = to.call{value:x}(\"\"); require(ok);` — an unchecked `call`/`send` silently swallows failures.",
    "**`tx.origin` is not auth:** use `msg.sender`. A phished owner calling a malicious contract still has `tx.origin == owner`.",
    "**No floats + truncating division:** multiply before dividing (`a * c / b`), scale with 1e18/basis points, and pick rounding direction deliberately (round against the user).",
    "**Prefer `call` over `transfer`/`send`:** the 2300-gas stipend of `transfer`/`send` can wrongly fail after gas-cost changes or for contract recipients.",
    "**`unchecked` wraps silently:** only use it for provably-safe arithmetic (loop counters); an unchecked underflow turns a balance into a huge number.",
    "**Mappings aren't iterable** and have no length — keep a parallel array or use `EnumerableSet` if you must enumerate keys.",
    "**Pin the compiler:** `pragma solidity 0.8.35;` + `solc` in foundry.toml for reproducible bytecode; `^0.8.x` is for libraries, not the contract you ship.",
    "**Add the SPDX line:** every file needs `// SPDX-License-Identifier: MIT` (or similar) or the compiler warns.",
    "**Unbounded loops brick functions:** iterating an array that can grow past the block gas limit is a permanent DoS — use pull-over-push withdrawals or pagination.",
    "**`public` vs `external`:** use `external` (with `calldata`) for functions never called internally; don't call `this.f()` internally (forces a costly external call).",
    "**delegatecall/proxy storage layout:** reordering or inserting a state variable between proxy versions corrupts storage — use OZ proxies + `initializer`, never reorder.",
    "**OpenZeppelin v5 API changes:** `Ownable(msg.sender)` in the constructor, `_update` replaced `_beforeTokenTransfer`, `Counters` removed — v4 tutorials won't compile.",
    "**`private` is not secret:** anyone can read storage off-chain. Never store passwords, keys, or unrevealed data in plaintext on-chain.",
    "**Remember the `payable` receiver:** a contract can only receive ETH if it has `receive()`/`fallback()`/a payable fn; `address` must be `address payable` to be sent ETH."
  ],

  flashcards: [
    { q: "What changed about arithmetic in Solidity 0.8?", a: "Overflow/underflow now **revert** automatically (a `Panic`) — SafeMath is no longer needed. Opt out only inside `unchecked { }` when you've proven the op can't over/underflow." },
    { q: "storage vs memory vs calldata?", a: "`storage` = persistent on-chain state (expensive, aliased). `memory` = temporary, mutable, per-call copy. `calldata` = read-only raw input, cheapest — use it for external read-only array/struct params." },
    { q: "Why prefer `call` over `transfer`/`send` for ETH?", a: "`transfer`/`send` forward only 2300 gas, which can wrongly fail after opcode gas changes or for contract recipients. `(bool ok,)=to.call{value:x}(\"\"); require(ok);` forwards all gas — pair with CEI/nonReentrant since it also enables reentrancy." },
    { q: "What is reentrancy and how do you prevent it?", a: "An external call hands control to the callee, which re-enters your function before state is updated, draining funds. Fix: **Checks-Effects-Interactions** (update storage before the external call) plus a `nonReentrant` guard." },
    { q: "Why never use `tx.origin` for authorization?", a: "`tx.origin` is the original EOA of the whole tx chain. A phished owner calling a malicious contract still passes `tx.origin == owner`. Authenticate with `msg.sender` (the immediate caller)." },
    { q: "Function visibility keywords?", a: "`external` (only from outside), `public` (inside and outside, generates state-var getters), `internal` (this + derived contracts), `private` (this contract only)." },
    { q: "State mutability: view vs pure vs payable?", a: "`view` reads state but can't write (free via eth_call); `pure` touches no state at all; `payable` may receive ETH (`msg.value`). No keyword = may read and write state." },
    { q: "Why use custom errors instead of require strings?", a: "Custom errors (`revert Foo(a,b)`) are a 4-byte selector + encoded args — cheaper to deploy and revert with than a string reason, and carry typed data tools can decode. `require(cond, Err())` (0.8.26+) combines both." },
    { q: "receive() vs fallback()?", a: "`receive()` runs on plain ETH transfers with empty calldata; `fallback()` runs when no function matches (or ETH arrives with calldata). Both must be `payable` to accept ETH; keep them minimal (2300-gas stipend from transfer/send)." },
    { q: "What are the three ERC token standards to know?", a: "**ERC-20** fungible tokens (balances, transfer/approve), **ERC-721** NFTs (unique tokenId + owner + tokenURI), **ERC-1155** multi-token (many ids with balances + batch transfers). Inherit from OpenZeppelin, don't hand-roll." },
    { q: "What does `vm.prank(addr)` do in a Foundry test?", a: "Sets `msg.sender` to `addr` for the **next** call only. `vm.startPrank/stopPrank` do it for a block. Related cheatcodes: `vm.deal` (set ETH), `vm.warp/roll` (time/block), `vm.expectRevert`, `vm.expectEmit`." },
    { q: "How does fuzz testing work in Forge?", a: "Give a test function parameters; Forge feeds hundreds of random inputs and shrinks any failure to a minimal counterexample. Use `bound(x, lo, hi)` to constrain inputs. Invariant tests instead fire random *sequences* and check `invariant_*` properties." },
    { q: "What is `forge script` + `vm.startBroadcast` for?", a: "Solidity-based deployment: calls between `vm.startBroadcast()`/`stopBroadcast()` become real on-chain transactions. Run without `--broadcast` to simulate; add `--verify` to publish source to Etherscan. `forge create` is the quick one-off alternative." },
    { q: "Why does integer division need care?", a: "No floats; division truncates (`7/2==3`) and `a/b*c` loses precision. Multiply before dividing (`a*c/b`), scale with fixed-point (1e18) or basis points, and choose rounding direction to favor the protocol." },
    { q: "What makes a proxy/delegatecall dangerous?", a: "`delegatecall` runs another contract's code in *your* storage. Storage layout must match exactly between proxy and implementation — reordering/inserting a variable corrupts state. Use OZ's audited UUPS/Transparent proxies with `initializer` guards." },
    { q: "What is the ABI and why does it matter?", a: "The Application Binary Interface (JSON in `out/`) describes a contract's functions/events so clients (ethers/viem/wagmi) can encode calls and decode results. A stale ABI vs the deployed contract makes the frontend decode garbage." }
  ],

  cheatsheet: [
    { label: "Install / update", code: "curl -L https://foundry.paradigm.xyz | bash && foundryup" },
    { label: "New project", code: "forge init my-protocol" },
    { label: "Build / test", code: "forge build && forge test -vvv" },
    { label: "Add dependency", code: "forge install OpenZeppelin/openzeppelin-contracts" },
    { label: "Format / coverage", code: "forge fmt && forge coverage" },
    { label: "Gas report", code: "forge test --gas-report && forge snapshot" },
    { label: "Run one test", code: "forge test --match-test test_Deposit -vvv" },
    { label: "Cheatcode (prank)", code: "vm.prank(alice); c.f{value: 1 ether}();" },
    { label: "Expect revert", code: "vm.expectRevert(MyErr.selector); c.f();" },
    { label: "Fuzz test", code: "function testFuzz_X(uint96 a) public { a = uint96(bound(a,1,1e24)); ... }" },
    { label: "Custom error", code: "error TooLow(uint256 got); revert TooLow(x);" },
    { label: "Send ETH safely", code: "(bool ok,) = to.call{value: amt}(\"\"); require(ok);" },
    { label: "Local node / fork", code: "anvil --fork-url $MAINNET_RPC_URL" },
    { label: "Read chain (cast)", code: "cast call 0xT \"balanceOf(address)(uint256)\" 0xU --rpc-url $RPC" },
    { label: "Deploy + verify", code: "forge script script/Deploy.s.sol --rpc-url $RPC --broadcast --verify" },
    { label: "Deploy one-off", code: "forge create src/T.sol:T --private-key $PK --rpc-url $RPC --broadcast" },
    { label: "Deploy from keystore", code: "forge script s.sol --account deployer --broadcast --rpc-url $RPC" },
    { label: "Fork inside a test", code: "vm.createSelectFork(vm.rpcUrl(\"mainnet\"), 20_000_000);" }
  ]
});
