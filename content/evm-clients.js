(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "evm-clients",
  name: "EVM Clients (TS)",
  language: "TypeScript",
  group: "EVM",
  navLabel: "EVM Clients (TS)",
  color: "#7b3fe4",
  readMinutes: 30,
  tagline: "Build **EVM dApp clients** in TypeScript — read chain state, send transactions, sign messages and connect wallets with **viem**, **wagmi** and **ethers v6**.",

  sections: [
    {
      id: "overview",
      title: "Overview: what an EVM client does",
      level: "core",
      body: [
        { type: "p", text: "An EVM *client* (or dApp frontend) is the code that talks to a blockchain on the user's behalf. It does four things: **read chain state** (balances, contract storage), **send transactions** (state changes that cost gas), **sign messages** (prove identity without a tx), and **listen to events** (logs emitted by contracts). Everything travels over **JSON-RPC**." },
        { type: "list", items: [
          "**JSON-RPC** — every chain interaction is a JSON-RPC call (`eth_call`, `eth_sendRawTransaction`, `eth_getBalance`, `eth_getLogs`, …) sent over HTTP or WebSocket to a node. Libraries wrap these methods in typed functions so you rarely call them raw.",
          "**Nodes / RPC providers** — you don't run a node; you point at one. **Alchemy** and **Infura** are the managed standards (API-key URLs, higher rate limits, archive data); public RPCs (from `viem/chains`, `chainlist.org`) work for casual reads but are rate-limited and unreliable for production.",
          "**Read vs write** — reads (`eth_call`, `view`/`pure` functions) are **free**: no signature, no gas, no wallet needed, answered by any node. Writes need a **signed transaction** from an account with ETH to pay gas, and only change state once mined.",
          "**The wallet** — private keys live in the user's wallet (MetaMask, Rabby, Coinbase Wallet, hardware). Your dApp never sees the key; it *requests* signatures/transactions and the wallet prompts the user to approve."
        ] },
        { type: "p", text: "The bridge between your dApp and a browser wallet is a **provider** implementing **EIP-1193** — a tiny standard interface with one method, `request({ method, params })`, plus events (`accountsChanged`, `chainChanged`). Injected wallets expose one on `window.ethereum`; modern discovery uses **EIP-6963** (see the wallet-connection section)." },
        { type: "code", lang: "ts", code: "// The raw EIP-1193 interface every browser wallet implements:\ninterface EIP1193Provider {\n  request(args: { method: string; params?: unknown[] }): Promise<unknown>;\n  on(event: string, listener: (...args: any[]) => void): void;\n  removeListener(event: string, listener: (...args: any[]) => void): void;\n}\n\n// The lowest-level thing you can do — everything else is sugar on top:\nconst provider = (window as any).ethereum as EIP1193Provider;\nconst accounts = await provider.request({ method: \"eth_requestAccounts\" }); // prompt connect\nconst chainId = await provider.request({ method: \"eth_chainId\" });           // \"0x1\" = mainnet" },
        { type: "callout", variant: "note", text: "This deck is **TypeScript-only** and client-focused: how to design dApp code that talks to EVM chains. It assumes you already know Solidity/contracts (see the Solidity page). Default stack: **viem** for the core client, **wagmi** for React, **ethers v6** where you meet it in older code." },
        { type: "callout", variant: "tip", text: "Reads are cheap and safe — lean on them. Simulate before you write, read balances/allowances before you build a tx, and never make the user sign something you could have checked with a free `eth_call` first." }
      ]
    },
    {
      id: "landscape",
      title: "The library landscape: viem, ethers, wagmi, web3.js",
      level: "core",
      body: [
        { type: "p", text: "Four libraries dominate. Pick **viem** for new code, reach for **ethers v6** when you inherit it, add **wagmi** when you're in React, and treat **web3.js** as legacy." },
        { type: "table", headers: ["Library", "What it is", "Use when"], rows: [
          ["**viem** (v2)", "Modern, fully-typed, tree-shakeable low-level client. Public/Wallet/Test clients, ABI-inferred types via Abitype.", "Default for all new TS/JS dApps and backends. The recommended foundation."],
          ["**wagmi** (v2)", "React hooks built *on top of viem* + TanStack Query (caching, dedup, reactivity). Connectors, account/chain state.", "Any React app. It manages connection + query lifecycle so you don't."],
          ["**ethers.js** (v6)", "Mature, batteries-included library (Provider/Signer/Contract). Predates viem's type ergonomics.", "Existing codebases, tutorials, tooling (TypeChain, Hardhat) that assume it."],
          ["**web3.js**", "The original library. Sunset — the core repo was deprecated/handed off; no longer recommended.", "Only maintaining legacy code. Migrate to viem/ethers."]
        ] },
        { type: "p", text: "**viem vs ethers** in one breath: viem is smaller (tree-shakeable, ~sub-40kb typical), gives you *end-to-end types inferred from your ABI* (no codegen needed), and is action-oriented (standalone functions you compose). ethers is more object-oriented (`Contract`, `Signer`, `Provider`) and familiar to more developers. Both are excellent; the industry has been moving toward viem/wagmi." },
        { type: "code", lang: "bash", code: "# viem-first stack (recommended)\nnpm i viem                              # core client\nnpm i wagmi @tanstack/react-query       # React hooks (wagmi needs TanStack Query)\nnpm i @rainbow-me/rainbowkit            # (optional) polished connect-button UI\n\n# ethers, if you need it\nnpm i ethers                            # v6\n\n# type tooling\nnpm i -D @wagmi/cli abitype             # generate typed ABIs / hooks" },
        { type: "code", lang: "ts", code: "// Same read, three libraries — note viem's inferred return type:\n\n// viem\nimport { createPublicClient, http } from \"viem\";\nimport { mainnet } from \"viem/chains\";\nconst client = createPublicClient({ chain: mainnet, transport: http() });\nconst block = await client.getBlockNumber();      // bigint\n\n// ethers v6\nimport { JsonRpcProvider } from \"ethers\";\nconst provider = new JsonRpcProvider(\"https://eth.llamarpc.com\");\nconst block2 = await provider.getBlockNumber();   // number\n\n// wagmi (React) — covered in its own section\n// const { data } = useBlockNumber();" },
        { type: "callout", variant: "note", text: "wagmi is not an alternative to viem — it *wraps* it. In a wagmi app you still import viem utilities (`parseEther`, `formatUnits`, ABIs) directly, and you can always drop down to a viem client via `getPublicClient()`/`usePublicClient()`." }
      ]
    },
    {
      id: "viem-reads",
      title: "viem: reading chain state",
      level: "core",
      body: [
        { type: "p", text: "Reads go through a **Public Client** — a viem client bound to a **chain** and a **transport**. The transport is *how* it reaches a node: `http()` (default, batched JSON-RPC), `webSocket()` (subscriptions/live), or `custom(window.ethereum)` (route reads through the user's injected provider)." },
        { type: "code", lang: "ts", code: "import { createPublicClient, http, webSocket, fallback } from \"viem\";\nimport { mainnet } from \"viem/chains\";\n\nconst client = createPublicClient({\n  chain: mainnet,\n  // pass your Alchemy/Infura URL in prod; http() with no arg uses the chain's public RPC\n  transport: http(\"https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY\"),\n});\n\n// fallback() tries transports in order — resilience against a flaky RPC:\nconst resilient = createPublicClient({\n  chain: mainnet,\n  transport: fallback([\n    http(\"https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY\"),\n    http(\"https://eth.llamarpc.com\"),\n  ]),\n});" },
        { type: "code", lang: "ts", code: "// basic reads — everything numeric is a bigint\nconst blockNumber = await client.getBlockNumber();               // 20_000_000n\nconst balance = await client.getBalance({ address: \"0xd8dA...\" }); // wei, bigint\nconst nonce = await client.getTransactionCount({ address: \"0xd8dA...\" });\nconst gas = await client.getGasPrice();\nconst block = await client.getBlock({ blockNumber: 20_000_000n });" },
        { type: "heading", text: "readContract with a typed ABI" },
        { type: "p", text: "The core of contract reads is `readContract`. Declare the ABI with **`as const`** so viem/Abitype can infer the exact argument and return types — no codegen, no manual generics. Getting `as const` right is what makes viem feel typed." },
        { type: "code", lang: "ts", code: "import { erc20Abi } from \"viem\"; // viem ships common ABIs (erc20Abi, erc721Abi, ...)\n\nconst symbol = await client.readContract({\n  address: \"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\", // USDC\n  abi: erc20Abi,\n  functionName: \"balanceOf\",\n  args: [\"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\"], // vitalik.eth\n}); // return type inferred as bigint\n\n// your own ABI — the `as const` is mandatory for inference:\nconst wagmiAbi = [\n  { type: \"function\", name: \"totalSupply\", stateMutability: \"view\", inputs: [], outputs: [{ type: \"uint256\" }] },\n] as const;\n\nconst supply = await client.readContract({ address: \"0x...\", abi: wagmiAbi, functionName: \"totalSupply\" });" },
        { type: "heading", text: "multicall: batch many reads into one RPC call" },
        { type: "p", text: "Calling `readContract` 50 times = 50 round trips. **`multicall`** batches them into a single call to the on-chain Multicall3 contract (deployed at the same address on every major chain), returning all results at once — dramatically fewer requests and less rate-limit pain." },
        { type: "code", lang: "ts", code: "const [name, sym, decimals, bal] = await client.multicall({\n  contracts: [\n    { address: token, abi: erc20Abi, functionName: \"name\" },\n    { address: token, abi: erc20Abi, functionName: \"symbol\" },\n    { address: token, abi: erc20Abi, functionName: \"decimals\" },\n    { address: token, abi: erc20Abi, functionName: \"balanceOf\", args: [user] },\n  ],\n  // allowFailure: true (default) -> each result is { status, result | error };\n  // allowFailure: false -> throws if any call reverts, returns a plain tuple\n  allowFailure: false,\n});" },
        { type: "heading", text: "ENS" },
        { type: "code", lang: "ts", code: "// resolve a name <-> address (mainnet only, unless you configure a chain with ENS)\nconst address = await client.getEnsAddress({ name: \"vitalik.eth\" });\nconst name = await client.getEnsName({ address: \"0xd8dA6BF...\" });\nconst avatar = await client.getEnsAvatar({ name: \"vitalik.eth\" });" },
        { type: "callout", variant: "tip", text: "`http()` batches concurrent requests automatically (JSON-RPC batch) — pass `http(url, { batch: true })` to also coalesce calls made in the same tick. For contract reads specifically, prefer `multicall` (one on-chain aggregate) over many individual `readContract`s." }
      ]
    },
    {
      id: "units",
      title: "Units & BigInt: no floats, ever",
      level: "core",
      body: [
        { type: "p", text: "The EVM has **no floating point**. All amounts are integers in the smallest unit, and in TypeScript they are **`bigint`** (note the `n` suffix: `1000n`). ETH has 18 decimals, so 1 ETH = 10^18 **wei**. Tokens have their *own* `decimals` — you must read it, never assume 18." },
        { type: "table", headers: ["Unit", "Value", "Used for"], rows: [
          ["wei", "1", "the base unit — all on-chain math"],
          ["gwei", "10^9 wei", "gas prices (`maxFeePerGas`, `gasPrice`)"],
          ["ether", "10^18 wei", "human-facing ETH amounts"]
        ] },
        { type: "code", lang: "ts", code: "import { parseEther, formatEther, parseUnits, formatUnits, parseGwei } from \"viem\";\n\nparseEther(\"1.5\");          // 1500000000000000000n  (string -> wei bigint)\nformatEther(1500000000000000000n); // \"1.5\"           (wei -> string)\nparseGwei(\"30\");            // 30000000000n           (gas prices)\n\n// TOKEN amounts: use the token's own decimals\nconst usdcDecimals = 6;\nparseUnits(\"100\", usdcDecimals);   // 100000000n   (100 USDC)\nformatUnits(100000000n, usdcDecimals); // \"100\"" },
        { type: "callout", variant: "gotcha", text: "**Never** use `Number` for token amounts. `Number(bal)` on a big balance loses precision past 2^53 and floats introduce rounding — a whole class of \"my UI shows the wrong balance\" and \"I sent 10x too much\" bugs. Keep values as `bigint` end-to-end; only `formatUnits(...)` to a string at the very last moment for display." },
        { type: "code", lang: "ts", code: "// bigint math is fine and exact; you just can't mix bigint and number\nconst half = amount / 2n;            // OK\nconst withFee = (amount * 997n) / 1000n; // 0.3% fee, integer math (multiply before divide)\n// amount * 0.997        // TypeError: can't mix bigint and number\n// Number(amount) * 1.5  // WRONG: precision loss\n\n// JSON.stringify chokes on bigint -> add a replacer if you must serialize\nJSON.stringify({ amount }, (_k, v) => (typeof v === \"bigint\" ? v.toString() : v));" },
        { type: "callout", variant: "warn", text: "The single most common token bug is **wrong decimals**. USDC/USDT use **6**, WBTC uses **8**, most ERC-20s use 18 — but it is contract-defined. Always `readContract(... functionName: \"decimals\")` (or `useReadContract`) and feed that into `parseUnits`/`formatUnits`. Hard-coding 18 for USDC sends 10^12x the intended amount." }
      ]
    },
    {
      id: "abis-types",
      title: "ABIs & type safety: as const, Abitype, codegen",
      level: "core",
      body: [
        { type: "p", text: "The **ABI** (Application Binary Interface) is the JSON description of a contract's functions, events and errors. It's how any client encodes calls and decodes results. In viem/wagmi the ABI is *also your type source*: with **`as const`**, **Abitype** infers exact TS types for every read, write and event — arguments, returns, and event args all typed from the ABI alone." },
        { type: "code", lang: "ts", code: "// The `as const` freezes the literal types so Abitype can read them.\n// Without it, `abi: someAbi` is just `object[]` and you get `any` everywhere.\nconst abi = [\n  {\n    type: \"function\", name: \"transfer\", stateMutability: \"nonpayable\",\n    inputs: [{ name: \"to\", type: \"address\" }, { name: \"amount\", type: \"uint256\" }],\n    outputs: [{ type: \"bool\" }],\n  },\n  {\n    type: \"event\", name: \"Transfer\",\n    inputs: [\n      { name: \"from\", type: \"address\", indexed: true },\n      { name: \"to\", type: \"address\", indexed: true },\n      { name: \"value\", type: \"uint256\", indexed: false },\n    ],\n  },\n] as const;\n\n// now args and return types are enforced:\n// transfer expects [`0x${string}`, bigint]  and returns boolean" },
        { type: "heading", text: "Where the ABI comes from" },
        { type: "list", items: [
          "**Foundry** writes ABIs into `out/<Contract>.sol/<Contract>.json` on `forge build`. Import the `.abi` field, or copy it into a `.ts` file with `as const`.",
          "**Hardhat** writes them into `artifacts/`.",
          "**Etherscan** — for a verified third-party contract, grab the ABI from its \"Contract\" tab.",
          "For well-known standards, viem exports ready ABIs: `erc20Abi`, `erc721Abi`, `erc1155Abi`, `erc4626Abi`."
        ] },
        { type: "heading", text: "wagmi CLI: generate typed ABIs (and hooks)" },
        { type: "p", text: "Hand-copying ABIs drifts. The **`@wagmi/cli`** reads your Foundry/Hardhat artifacts (or fetches from Etherscan), and emits a typed `.ts` file — optionally *React hooks* per contract via the `react` plugin. This is the idiomatic way to keep types in sync with deployments." },
        { type: "code", lang: "ts", code: "// wagmi.config.ts\nimport { defineConfig } from \"@wagmi/cli\";\nimport { foundry, react } from \"@wagmi/cli/plugins\";\n\nexport default defineConfig({\n  out: \"src/generated.ts\",\n  plugins: [\n    foundry({ project: \"../contracts\" }),  // read out/*.json\n    react(),                                // emit useReadMyToken / useWriteMyToken ...\n  ],\n});" },
        { type: "code", lang: "bash", code: "npx wagmi generate     # writes src/generated.ts with typed abis + hooks\n# then:  import { myTokenAbi, useReadMyToken } from \"./generated\";" },
        { type: "callout", variant: "note", text: "**TypeChain** is the ethers-world equivalent: it generates typed `Contract` factory classes from ABIs (commonly wired into Hardhat). If your stack is ethers-based you'll use TypeChain; if it's viem/wagmi you'll use `@wagmi/cli` + Abitype. Same goal — kill `any` at the contract boundary." },
        { type: "callout", variant: "tip", text: "Forgetting `as const` is the #1 reason \"viem isn't typing my contract call.\" If `functionName` autocompletes to `string` and args are `any`, your ABI lost its literal types — add `as const` (or import from a generated file, which already has it)." }
      ]
    },
    {
      id: "viem-writes",
      title: "viem: sending transactions",
      level: "core",
      body: [
        { type: "p", text: "Writes go through a **Wallet Client**, which needs an **account** to sign. Two account kinds: a **JSON-RPC account** (the signing lives in the user's wallet — the browser case) or a **local account** (`privateKeyToAccount` — signing in-process, for backends/bots/scripts; never ship a private key to the browser)." },
        { type: "code", lang: "ts", code: "import { createWalletClient, custom, http } from \"viem\";\nimport { privateKeyToAccount } from \"viem/accounts\";\nimport { mainnet } from \"viem/chains\";\n\n// A) Browser: signing happens in MetaMask/Rabby via the injected provider\nconst wallet = createWalletClient({\n  chain: mainnet,\n  transport: custom(window.ethereum!), // EIP-1193\n});\nconst [account] = await wallet.requestAddresses(); // prompts connect, returns the address\n\n// B) Backend/script: a local account signs in-process (KEEP THE KEY SERVER-SIDE)\nconst signer = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);\nconst botWallet = createWalletClient({ account: signer, chain: mainnet, transport: http(RPC) });" },
        { type: "heading", text: "The simulate -> write -> wait pattern" },
        { type: "p", text: "The correct write flow has three steps: **`simulateContract`** (a free `eth_call` that verifies the tx will succeed and prepares a typed `request`), **`writeContract`** (submits the signed tx, returns a hash immediately), then **`waitForTransactionReceipt`** (blocks until mined). Simulating first catches reverts *before* the user pays gas and before you fire a doomed tx." },
        { type: "code", lang: "ts", code: "import { publicClient } from \"./clients\"; // a PublicClient for reads/simulate/wait\n\nasync function transfer(to: `0x${string}`, amount: bigint) {\n  // 1) simulate: free eth_call — reverts here BEFORE any gas is spent\n  const { request, result } = await publicClient.simulateContract({\n    account,               // who will send it\n    address: token,\n    abi: erc20Abi,\n    functionName: \"transfer\",\n    args: [to, amount],\n  });\n\n  // 2) write: sign + broadcast; returns the tx hash right away (not yet mined)\n  const hash = await wallet.writeContract(request);\n\n  // 3) wait: poll until included in a block; receipt.status is \"success\" | \"reverted\"\n  const receipt = await publicClient.waitForTransactionReceipt({ hash });\n  if (receipt.status === \"reverted\") throw new Error(\"tx reverted on-chain\");\n  return receipt;\n}" },
        { type: "heading", text: "sendTransaction: plain ETH / raw calldata" },
        { type: "code", lang: "ts", code: "import { parseEther } from \"viem\";\n\n// send native ETH\nconst hash = await wallet.sendTransaction({\n  account, to: \"0xRecipient\", value: parseEther(\"0.1\"),\n});\n\n// arbitrary calldata (e.g. a pre-encoded call) also goes through sendTransaction\nawait wallet.sendTransaction({ account, to: contract, data: \"0xa9059cbb...\" });" },
        { type: "callout", variant: "gotcha", text: "`writeContract` resolves as soon as the tx is *broadcast*, not when it's mined — the returned hash is a receipt claim, not a confirmation. Forgetting `waitForTransactionReceipt` means your UI shows \"done\" while the tx is still pending (or about to revert). Always wait, then check `receipt.status`." },
        { type: "callout", variant: "warn", text: "A successful `simulateContract` is a strong signal but not a *guarantee*: state can change between simulation and inclusion (someone front-runs, price moves, allowance is spent). It catches the common deterministic reverts; still handle an on-chain `reverted` status and use slippage/deadline guards for anything order-sensitive." }
      ]
    },
    {
      id: "wallet-connection",
      title: "Wallet connection: EIP-1193, EIP-6963 & connectors",
      level: "core",
      body: [
        { type: "p", text: "Connecting means: discover the user's wallet provider(s), request account access, and track chain/account changes. The old way — grab `window.ethereum` — breaks when a user has multiple wallets installed (they race to overwrite the global). The modern standard is **EIP-6963**." },
        { type: "heading", text: "EIP-6963: multi-wallet discovery" },
        { type: "p", text: "**EIP-6963** replaces the single `window.ethereum` global with an event-based announcement protocol. Your dApp dispatches `eip6963:requestProvider`; each installed wallet responds with `eip6963:announceProvider`, carrying its provider *plus* metadata (name, icon, rdns). You get a clean list to show a wallet picker — no clobbering, no guessing which wallet `window.ethereum` currently points to." },
        { type: "code", lang: "ts", code: "// Minimal EIP-6963 discovery (wagmi/RainbowKit do this for you):\ntype Announce = CustomEvent<{ info: { name: string; icon: string; rdns: string }; provider: any }>;\nconst wallets = new Map<string, Announce[\"detail\"]>();\n\nwindow.addEventListener(\"eip6963:announceProvider\", (e) => {\n  const detail = (e as Announce).detail;\n  wallets.set(detail.info.rdns, detail); // e.g. \"io.metamask\", \"app.rabby\", \"com.coinbase.wallet\"\n});\nwindow.dispatchEvent(new Event(\"eip6963:requestProvider\")); // ask everyone to announce\n// -> render a picker from `wallets`; use the chosen `detail.provider` as your EIP-1193 provider" },
        { type: "heading", text: "Requesting access, switching chains, reacting to changes" },
        { type: "code", lang: "ts", code: "const provider = chosen.provider; // an EIP-1193 provider from 6963\n\n// prompt the user to connect\nconst [address] = await provider.request({ method: \"eth_requestAccounts\" });\n\n// switch to a chain (Base = 0x2105); if unknown to the wallet, add it first\ntry {\n  await provider.request({ method: \"wallet_switchEthereumChain\", params: [{ chainId: \"0x2105\" }] });\n} catch (err: any) {\n  if (err.code === 4902) { // 4902 = chain not added\n    await provider.request({\n      method: \"wallet_addEthereumChain\",\n      params: [{ chainId: \"0x2105\", chainName: \"Base\", nativeCurrency: { name: \"Ether\", symbol: \"ETH\", decimals: 18 }, rpcUrls: [\"https://mainnet.base.org\"], blockExplorerUrls: [\"https://basescan.org\"] }],\n    });\n  }\n}\n\n// react to the user changing account / network in their wallet\nprovider.on(\"accountsChanged\", (accts: string[]) => { /* accts[] empty => disconnected */ });\nprovider.on(\"chainChanged\", (chainId: string) => { /* often simplest to reload state */ });" },
        { type: "callout", variant: "gotcha", text: "Don't cache `window.ethereum` at module load and assume it's *the* wallet. With multiple extensions it's whichever loaded last, and it can change. Use EIP-6963 discovery (or a connector library that does) and hold onto the *specific* provider the user picked." },
        { type: "callout", variant: "tip", text: "You rarely write raw 6963/connection code — **wagmi** connectors and **RainbowKit / ConnectKit / Reown AppKit** handle discovery, the picker UI, chain switching, reconnection and mobile WalletConnect for you. Hand-rolling is for understanding, not production." }
      ]
    },
    {
      id: "wagmi",
      title: "wagmi: React hooks for dApps",
      level: "core",
      body: [
        { type: "p", text: "**wagmi v2** gives you React hooks over viem, with **TanStack Query** underneath for caching, deduplication, refetch-on-focus and loading/error states. You configure it once with `createConfig` (chains + connectors + transports), wrap your app in `WagmiProvider` **and** `QueryClientProvider`, then use hooks anywhere." },
        { type: "code", lang: "ts", code: "// config.ts\nimport { http, createConfig } from \"wagmi\";\nimport { mainnet, base, arbitrum } from \"wagmi/chains\";\nimport { injected, walletConnect, coinbaseWallet } from \"wagmi/connectors\";\n\nexport const config = createConfig({\n  chains: [mainnet, base, arbitrum],\n  connectors: [\n    injected(),                                       // EIP-6963 discovery, no config\n    walletConnect({ projectId: \"YOUR_WC_PROJECT_ID\" }),\n    coinbaseWallet({ appName: \"My dApp\" }),\n  ],\n  transports: {\n    [mainnet.id]: http(\"https://eth-mainnet.g.alchemy.com/v2/KEY\"),\n    [base.id]: http(),\n    [arbitrum.id]: http(),\n  },\n});" },
        { type: "code", lang: "tsx", code: "// main.tsx — both providers are required\nimport { WagmiProvider } from \"wagmi\";\nimport { QueryClient, QueryClientProvider } from \"@tanstack/react-query\";\nimport { config } from \"./config\";\n\nconst queryClient = new QueryClient();\n\nexport function App({ children }: { children: React.ReactNode }) {\n  return (\n    <WagmiProvider config={config}>\n      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>\n    </WagmiProvider>\n  );\n}" },
        { type: "heading", text: "Account & connection" },
        { type: "code", lang: "tsx", code: "import { useAccount, useConnect, useDisconnect, useBalance } from \"wagmi\";\n\nfunction ConnectBar() {\n  const { address, isConnected, chainId } = useAccount();\n  const { connect, connectors } = useConnect();\n  const { disconnect } = useDisconnect();\n  const { data: bal } = useBalance({ address }); // { value: bigint, formatted, symbol, decimals }\n\n  if (isConnected)\n    return <button onClick={() => disconnect()}>{address} · {bal?.formatted} {bal?.symbol}</button>;\n  return (\n    <>\n      {connectors.map((c) => (\n        <button key={c.uid} onClick={() => connect({ connector: c })}>{c.name}</button>\n      ))}\n    </>\n  );\n}" },
        { type: "heading", text: "Reading & writing contracts" },
        { type: "code", lang: "tsx", code: "import {\n  useReadContract, useReadContracts, useSimulateContract,\n  useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent,\n} from \"wagmi\";\nimport { erc20Abi } from \"viem\";\n\nfunction TransferButton({ token, to, amount }: { token: `0x${string}`; to: `0x${string}`; amount: bigint }) {\n  // READ: cached, auto-refetching, typed from the ABI\n  const { data: balance } = useReadContract({ address: token, abi: erc20Abi, functionName: \"balanceOf\", args: [to] });\n\n  // batch reads with useReadContracts (multicall under the hood)\n  const { data: meta } = useReadContracts({ contracts: [\n    { address: token, abi: erc20Abi, functionName: \"symbol\" },\n    { address: token, abi: erc20Abi, functionName: \"decimals\" },\n  ] });\n\n  // WRITE: simulate -> write -> wait, as hooks\n  const { data: sim } = useSimulateContract({ address: token, abi: erc20Abi, functionName: \"transfer\", args: [to, amount] });\n  const { writeContract, data: hash, isPending } = useWriteContract();\n  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });\n\n  // live events\n  useWatchContractEvent({ address: token, abi: erc20Abi, eventName: \"Transfer\", onLogs: (logs) => console.log(logs) });\n\n  return (\n    <button disabled={!sim || isPending || mining} onClick={() => writeContract(sim!.request)}>\n      {isPending ? \"confirm in wallet…\" : mining ? \"mining…\" : isSuccess ? \"done\" : \"Transfer\"}\n    </button>\n  );\n}" },
        { type: "heading", text: "Connect-button UIs" },
        { type: "table", headers: ["Library", "Package", "Notes"], rows: [
          ["**RainbowKit**", "`@rainbow-me/rainbowkit`", "Polished, themeable connect modal; wraps wagmi config. Most popular."],
          ["**ConnectKit**", "`connectkit`", "Family/Farcaster-adjacent; clean UI, also wagmi-based."],
          ["**Reown AppKit**", "`@reown/appkit`", "The rebrand of **Web3Modal** (WalletConnect). Broad wallet + email/social login, on-ramp."]
        ] },
        { type: "code", lang: "tsx", code: "// RainbowKit: config + one component\nimport { getDefaultConfig, RainbowKitProvider, ConnectButton } from \"@rainbow-me/rainbowkit\";\nimport \"@rainbow-me/rainbowkit/styles.css\";\n\nconst config = getDefaultConfig({ appName: \"My dApp\", projectId: \"WC_ID\", chains: [mainnet, base] });\n// wrap: <WagmiProvider><QueryClientProvider><RainbowKitProvider> ... <ConnectButton /> ...\n// <ConnectButton /> renders connect + account + chain-switcher, fully handled." },
        { type: "callout", variant: "tip", text: "wagmi hooks accept the same TanStack Query knobs via a `query` field: `useReadContract({ ..., query: { enabled: !!address, staleTime: 10_000, refetchInterval: 5_000 } })`. Use `enabled` to gate a read until its args are ready — otherwise it fires with `undefined` args and errors." },
        { type: "callout", variant: "gotcha", text: "Forgetting `QueryClientProvider` is the classic wagmi v2 setup error (v1 didn't need it). Symptom: hooks throw \"No QueryClient set.\" Both providers must wrap your tree, `WagmiProvider` outermost." }
      ]
    },
    {
      id: "tx-lifecycle",
      title: "Transaction lifecycle & gas",
      level: "core",
      body: [
        { type: "p", text: "A transaction carries: **nonce** (per-account counter, must be sequential), **gas limit** (max units), **fees**, `to`, `value`, `data`, and a signature. Since EIP-1559, fees are two numbers, not one." },
        { type: "heading", text: "EIP-1559 vs legacy fees" },
        { type: "table", headers: ["Field", "Meaning"], rows: [
          ["`maxFeePerGas`", "EIP-1559: the *most* you'll pay per gas (covers base fee + tip)"],
          ["`maxPriorityFeePerGas`", "EIP-1559: the *tip* to the validator on top of base fee"],
          ["`gasPrice`", "Legacy (pre-1559): a single flat price. Still valid; some L2s/chains prefer it"],
          ["`gas`", "gas *limit* — max units the tx may consume (estimate via `estimateGas`)"]
        ] },
        { type: "code", lang: "ts", code: "// viem picks EIP-1559 fees automatically from the chain; you can override:\nimport { parseGwei } from \"viem\";\n\nconst gas = await publicClient.estimateGas({ account, to, value });\nconst fees = await publicClient.estimateFeesPerGas(); // { maxFeePerGas, maxPriorityFeePerGas }\n\nconst hash = await wallet.sendTransaction({\n  account, to, value,\n  maxFeePerGas: fees.maxFeePerGas,\n  maxPriorityFeePerGas: parseGwei(\"1\"),\n  // gas,   // usually let viem estimate; set explicitly to override\n});" },
        { type: "heading", text: "Pending -> mined -> confirmed" },
        { type: "list", items: [
          "**Broadcast** — `sendTransaction`/`writeContract` returns a hash; the tx enters the mempool as *pending*.",
          "**Mined** — a validator includes it in a block. `waitForTransactionReceipt` resolves with a receipt; `receipt.status` is `\"success\"` or `\"reverted\"` (a reverted tx *still mines and still costs gas*).",
          "**Confirmations** — blocks built on top. `waitForTransactionReceipt({ hash, confirmations: 5 })` waits for depth; use more confirmations for high-value actions / reorg-prone chains."
        ] },
        { type: "heading", text: "Speed-up, replace & cancel (same nonce, higher fee)" },
        { type: "p", text: "A stuck pending tx can be **replaced** by broadcasting a *new* tx with the **same nonce** and a higher fee (wallets' \"speed up\"). To **cancel**, send a 0-ETH tx to yourself at that same nonce with a higher fee — it wins inclusion and voids the original." },
        { type: "code", lang: "ts", code: "// cancel: same nonce, send-to-self, higher tip\nconst nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: \"pending\" });\nawait wallet.sendTransaction({ account, to: account.address, value: 0n, nonce, maxPriorityFeePerGas: parseGwei(\"5\") });\n\n// viem can also watch for the replacement of a specific tx:\nawait publicClient.waitForTransactionReceipt({\n  hash,\n  onReplaced: (r) => console.log(\"replaced:\", r.reason), // \"repriced\" | \"cancelled\" | \"replaced\"\n});" },
        { type: "callout", variant: "gotcha", text: "**Nonce gaps stall your account.** If nonce 5 is stuck pending, nonces 6, 7, 8 will *never* mine — they wait behind it. For bots sending many txs, track and manage nonces yourself (or serialize sends); don't fire concurrent txs and hope. Use `blockTag: \"pending\"` when reading the next nonce." },
        { type: "callout", variant: "warn", text: "A **reverted** tx is not free — it consumed gas up to the revert and the sender paid for it. This is why `simulateContract` before writing matters: it catches the revert off-chain (free) instead of on-chain (paid + failed UX)." }
      ]
    },
    {
      id: "events-logs",
      title: "Events, logs & indexing",
      level: "core",
      body: [
        { type: "p", text: "Contracts emit **events** as **logs** stored in tx receipts. Logs are how a client learns \"what happened\" — Transfers, Swaps, Mints. Indexed event params become searchable **topics**; you filter by them. viem decodes logs back into typed objects using your ABI." },
        { type: "heading", text: "Historical logs: getLogs / getContractEvents" },
        { type: "code", lang: "ts", code: "import { parseAbiItem } from \"viem\";\n\n// low-level: raw log filter with topic filtering\nconst logs = await publicClient.getLogs({\n  address: token,\n  event: parseAbiItem(\"event Transfer(address indexed from, address indexed to, uint256 value)\"),\n  args: { to: userAddress },          // filter by indexed topic\n  fromBlock: 20_000_000n,\n  toBlock: \"latest\",\n});\nlogs[0].args.value; // bigint, typed & decoded\n\n// higher-level, ABI-driven:\nconst events = await publicClient.getContractEvents({\n  address: token, abi: erc20Abi, eventName: \"Transfer\",\n  args: { from: userAddress }, fromBlock: 20_000_000n,\n});" },
        { type: "heading", text: "Live logs: watchContractEvent" },
        { type: "code", lang: "ts", code: "const unwatch = publicClient.watchContractEvent({\n  address: token, abi: erc20Abi, eventName: \"Transfer\",\n  args: { to: userAddress },\n  onLogs: (logs) => logs.forEach((l) => console.log(l.args.from, \"->\", l.args.to, l.args.value)),\n});\n// call unwatch() to stop. Uses eth_getFilterChanges polling, or subscriptions over a webSocket() transport." },
        { type: "heading", text: "Indexing at scale: The Graph & Ponder" },
        { type: "p", text: "Scanning logs from the RPC is fine for small ranges, but querying \"all of a user's trades since genesis\" that way is slow, rate-limited, and often blocked (providers cap block ranges). For real apps you run an **indexer** that ingests events into a database and exposes a query API." },
        { type: "list", items: [
          "**The Graph** — define a *subgraph* (schema + mapping handlers) that indexes events; query it over **GraphQL**. Hosted/decentralized network. The established standard.",
          "**Ponder** — a modern **TypeScript** indexing framework: write event handlers in TS, get a typed GraphQL/SQL API, run it yourself. Great DX if you're already in the TS ecosystem.",
          "Others: **Envio**, **Subsquid**, or your own worker consuming `getLogs` in ranges into Postgres."
        ] },
        { type: "callout", variant: "gotcha", text: "**Don't scan huge block ranges from a public RPC.** Providers reject `getLogs` spanning too many blocks (e.g. Alchemy's range caps) and rate-limit big backfills. Page in chunks (a few thousand blocks), or — better — run an indexer (The Graph/Ponder) and query *that*, not the chain, for historical data." },
        { type: "callout", variant: "note", text: "Logs are decoded, not queried like SQL — an indexed *dynamic* type (string/bytes) is stored as its **keccak256 hash** in the topic, so you can match on it but can't recover the original value from the log alone (the contract must also emit it un-indexed if you need the value)." }
      ]
    },
    {
      id: "signing-auth",
      title: "Signing & auth: personal_sign, EIP-712, SIWE",
      level: "core",
      body: [
        { type: "p", text: "Signatures prove \"the holder of this key approved this message\" **without a transaction** — no gas, no chain write. Three levels: **`personal_sign`** (arbitrary text), **EIP-712** (structured, human-readable typed data), and **SIWE** (a standard message format for login)." },
        { type: "heading", text: "personal_sign — a plain message" },
        { type: "code", lang: "ts", code: "// sign\nconst signature = await wallet.signMessage({ account, message: \"gm, I approve action X\" });\n\n// verify (client or server) — recovers the signer and compares\nimport { verifyMessage } from \"viem\";\nconst valid = await publicClient.verifyMessage({ address: account.address, message: \"gm, I approve action X\", signature });\n// verifyMessage also handles ERC-1271 (smart-contract wallets) automatically" },
        { type: "heading", text: "EIP-712 — typed structured data" },
        { type: "p", text: "**EIP-712** signs a structured object with a **domain** (name, version, chainId, verifyingContract) so wallets render each field for the user instead of an opaque hex blob. It's the basis of gasless approvals (ERC-2612 `permit`), order books (Seaport, 0x), meta-transactions and more." },
        { type: "code", lang: "ts", code: "const signature = await wallet.signTypedData({\n  account,\n  domain: { name: \"MyDApp\", version: \"1\", chainId: 1, verifyingContract: \"0xCONTRACT\" },\n  types: {\n    Order: [\n      { name: \"maker\", type: \"address\" },\n      { name: \"amount\", type: \"uint256\" },\n      { name: \"nonce\", type: \"uint256\" },\n    ],\n  },\n  primaryType: \"Order\",\n  message: { maker: account.address, amount: 1000n, nonce: 0n },\n});\n// verify with publicClient.verifyTypedData({ address, domain, types, primaryType, message, signature })" },
        { type: "heading", text: "SIWE — Sign-In With Ethereum (EIP-4361)" },
        { type: "p", text: "**SIWE** is a standardized `personal_sign` message for authentication: a wallet signs a human-readable statement with a **domain**, **nonce** and **expiry**; your server verifies the signature and issues a session. The nonce (server-issued, single-use) prevents replay. Use the **`siwe`** package to build/verify the message." },
        { type: "code", lang: "ts", code: "// client\nimport { SiweMessage } from \"siwe\";\nconst nonce = await fetch(\"/api/nonce\").then((r) => r.text()); // server-issued, single-use\nconst msg = new SiweMessage({\n  domain: window.location.host,\n  address: account.address,\n  statement: \"Sign in to My dApp\",\n  uri: window.location.origin,\n  version: \"1\",\n  chainId: 1,\n  nonce,\n});\nconst prepared = msg.prepareMessage();\nconst signature = await wallet.signMessage({ account, message: prepared });\nawait fetch(\"/api/verify\", { method: \"POST\", body: JSON.stringify({ message: prepared, signature }) });\n\n// server\n// const { data } = await new SiweMessage(message).verify({ signature, nonce });\n// -> data.address is authenticated; check nonce not reused, then start a session" },
        { type: "callout", variant: "warn", text: "**Signature phishing is real.** A signed EIP-712 `permit` or a Seaport order can move a user's tokens with no further tx. Show users exactly what they're signing, be suspicious of blind `personal_sign` of hex, and on the verifying side always bind the signature to a server nonce + domain + expiry so it can't be replayed elsewhere." },
        { type: "callout", variant: "note", text: "For **smart-contract wallets** (Safe, EIP-4337 accounts), there's no EOA key to recover — verification uses **ERC-1271** (`isValidSignature`). viem's `verifyMessage`/`verifyTypedData` handle EOA *and* ERC-1271 automatically, so verify through them rather than `ecrecover` by hand." }
      ]
    },
    {
      id: "tokens",
      title: "ERC-20 / ERC-721 client patterns",
      level: "core",
      body: [
        { type: "p", text: "Most dApps live or die on token interactions. Two standards cover 95% of it: **ERC-20** (fungible) and **ERC-721** (NFTs). The client patterns are worth memorizing because the mistakes are expensive." },
        { type: "heading", text: "ERC-20: read metadata & balance" },
        { type: "code", lang: "ts", code: "import { erc20Abi } from \"viem\";\n\nconst [symbol, decimals, balance] = await publicClient.multicall({\n  allowFailure: false,\n  contracts: [\n    { address: token, abi: erc20Abi, functionName: \"symbol\" },\n    { address: token, abi: erc20Abi, functionName: \"decimals\" },   // <- feed into formatUnits\n    { address: token, abi: erc20Abi, functionName: \"balanceOf\", args: [user] },\n  ],\n});\nimport { formatUnits } from \"viem\";\nconst human = formatUnits(balance, decimals); // e.g. \"100\" for 100 USDC (decimals=6)" },
        { type: "heading", text: "The approve -> transferFrom / allowance flow" },
        { type: "p", text: "A contract can't pull your tokens unless you first **`approve`** it for an amount. The contract then calls **`transferFrom(you, dest, amount)`**, which succeeds only up to your **`allowance`**. So the standard \"use a DeFi contract\" flow is: check allowance -> approve if too low -> then the actual action." },
        { type: "code", lang: "ts", code: "// 1) is the spender already approved for enough?\nconst allowance = await publicClient.readContract({\n  address: token, abi: erc20Abi, functionName: \"allowance\", args: [user, spender],\n});\n\n// 2) if not, approve the exact amount (see gotcha on unlimited approvals)\nif (allowance < amount) {\n  const { request } = await publicClient.simulateContract({\n    account, address: token, abi: erc20Abi, functionName: \"approve\", args: [spender, amount],\n  });\n  const hash = await wallet.writeContract(request);\n  await publicClient.waitForTransactionReceipt({ hash }); // WAIT — the next tx needs this mined\n}\n\n// 3) now call the contract that will transferFrom you\n// await wallet.writeContract(... spender contract action ...)" },
        { type: "heading", text: "ERC-721: ownership & metadata" },
        { type: "code", lang: "ts", code: "import { erc721Abi } from \"viem\";\n\nconst owner = await publicClient.readContract({ address: nft, abi: erc721Abi, functionName: \"ownerOf\", args: [tokenId] });\nconst uri = await publicClient.readContract({ address: nft, abi: erc721Abi, functionName: \"tokenURI\", args: [tokenId] });\n\n// tokenURI often points at IPFS -> fetch metadata JSON (swap ipfs:// for a gateway)\nconst url = uri.replace(\"ipfs://\", \"https://ipfs.io/ipfs/\");\nconst metadata = await fetch(url).then((r) => r.json()); // { name, description, image, attributes }" },
        { type: "callout", variant: "warn", text: "**Unlimited approvals are a standing risk.** Approving `2^256-1` (max uint) is convenient (one approve forever) but leaves the spender able to drain that token if it's ever compromised — the source of many drainer exploits. Prefer approving the *exact* amount per action, or use **ERC-2612 `permit`** (a gasless signed approval, no separate tx) where the token supports it." },
        { type: "callout", variant: "gotcha", text: "Common ERC-20 mistakes: (1) assuming 18 decimals — always read `decimals`; (2) `require(token.transfer(...))` reverting on tokens like **USDT** that don't return a bool — use `SafeERC20` on-chain, and on the client don't assume a boolean return; (3) not waiting for the `approve` receipt before the action tx that depends on it." }
      ]
    },
    {
      id: "account-abstraction",
      title: "Account abstraction: EIP-4337 & EIP-7702",
      level: "deep",
      body: [
        { type: "p", text: "Account abstraction lets accounts be *smart contracts* instead of plain EOAs — enabling gas sponsorship, batched actions, session keys, social recovery and passkey login. Two mechanisms matter in 2026: **EIP-4337** (the mempool-based standard) and **EIP-7702** (EOAs that temporarily act as smart accounts, live since the Pectra upgrade, May 2025)." },
        { type: "heading", text: "EIP-4337: smart accounts via UserOperations" },
        { type: "list", items: [
          "**Smart account** — a contract wallet (Safe, Kernel, SimpleAccount, Coinbase Smart Wallet) that validates ops however it wants (multisig, passkey, session key).",
          "**UserOperation** — not a normal tx; a pseudo-tx object describing intent, sent to a separate mempool.",
          "**Bundler** — a service that packs UserOperations into an actual on-chain tx to the singleton **EntryPoint** contract.",
          "**Paymaster** — a contract that pays gas for the user (sponsorship) or lets them pay gas in an ERC-20 (e.g. USDC) — this is how \"gasless\" UX works."
        ] },
        { type: "p", text: "The dominant TS library is **permissionless.js** (by Pimlico), built on viem. You create a smart-account client wired to a bundler + paymaster and then `sendUserOperation` / `sendTransaction` — batched calls, sponsored gas, all through one call." },
        { type: "code", lang: "ts", code: "import { createSmartAccountClient } from \"permissionless\";\nimport { toSimpleSmartAccount } from \"permissionless/accounts\";\nimport { createPublicClient, http } from \"viem\";\nimport { base } from \"viem/chains\";\nimport { entryPoint07Address } from \"viem/account-abstraction\";\n\nconst publicClient = createPublicClient({ chain: base, transport: http() });\nconst account = await toSimpleSmartAccount({ client: publicClient, owner: signer, entryPoint: { address: entryPoint07Address, version: \"0.7\" } });\n\nconst smart = createSmartAccountClient({\n  account,\n  chain: base,\n  bundlerTransport: http(\"https://api.pimlico.io/v2/base/rpc?apikey=KEY\"), // bundler + paymaster\n});\n\n// batched, gas-sponsored: two calls, one signature, zero ETH needed by the user\nconst hash = await smart.sendTransaction({\n  calls: [\n    { to: token, abi: erc20Abi, functionName: \"approve\", args: [spender, amount] },\n    { to: spender, abi: dexAbi, functionName: \"swap\", args: [amount] },\n  ],\n});" },
        { type: "heading", text: "EIP-7702: EOAs that act as smart accounts" },
        { type: "p", text: "**EIP-7702** (live via Pectra) lets an ordinary **EOA** *delegate* to smart-contract code via a signed **authorization**: same address, same private key, but now it can batch calls, sponsor gas and use session keys — without migrating funds to a new contract wallet. It closed the biggest AA adoption gap: users keep their existing address. viem exposes it via `signAuthorization` / the `authorizationList` field, and permissionless.js can turn a 7702-delegated EOA into a 4337 smart account." },
        { type: "code", lang: "ts", code: "// EOA signs an authorization to delegate its address to smart-account code\nimport { createWalletClient, http } from \"viem\";\nimport { privateKeyToAccount } from \"viem/accounts\";\n\nconst eoa = privateKeyToAccount(PK);\nconst wallet = createWalletClient({ account: eoa, chain: base, transport: http() });\n\nconst authorization = await wallet.signAuthorization({ account: eoa, contractAddress: DELEGATE_IMPL });\n// include it in a tx: the EOA now executes with the delegate's code for this tx\nawait wallet.sendTransaction({ authorizationList: [authorization], to: eoa.address, data: batchedCalldata });" },
        { type: "callout", variant: "note", text: "**When to use which:** EIP-4337 for brand-new smart-wallet UX (passkeys, social login, no EOA at all). EIP-7702 to upgrade *existing* EOA users in place (batching + sponsorship without a new address). They compose — a 7702 EOA can run 4337 account logic. Providers (Pimlico, Alchemy, ZeroDev, Biconomy, Coinbase) offer bundler + paymaster infra for both." },
        { type: "callout", variant: "warn", text: "AA changes assumptions your code may bake in: `tx.origin != msg.sender` for sponsored txs, an account's address can hold code, and signature verification may be **ERC-1271** not `ecrecover`. Verify signatures via viem's `verifyMessage` (1271-aware) and don't assume the gas payer is the user." }
      ]
    },
    {
      id: "multi-chain",
      title: "Multi-chain & L2s",
      level: "deep",
      body: [
        { type: "p", text: "Real dApps span many chains — Ethereum mainnet plus L2s (**Arbitrum**, **Optimism**, **Base**, **zkSync**, **Polygon**). Each is a separate chain id with its own RPC, gas market and deployed contract addresses. Your client must be chain-aware: right RPC, right addresses, right explorer, and a way to switch." },
        { type: "code", lang: "ts", code: "// viem: one client per chain; select by chain id\nimport { createPublicClient, http } from \"viem\";\nimport { mainnet, base, arbitrum, optimism } from \"viem/chains\";\n\nconst clients = {\n  [mainnet.id]: createPublicClient({ chain: mainnet, transport: http(MAINNET_RPC) }),\n  [base.id]: createPublicClient({ chain: base, transport: http(BASE_RPC) }),\n  [arbitrum.id]: createPublicClient({ chain: arbitrum, transport: http(ARB_RPC) }),\n  [optimism.id]: createPublicClient({ chain: optimism, transport: http(OP_RPC) }),\n} as const;\n\n// per-chain contract addresses — the SAME token has DIFFERENT addresses per chain\nconst USDC = {\n  [mainnet.id]: \"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\",\n  [base.id]: \"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\",\n} as const;" },
        { type: "code", lang: "tsx", code: "// wagmi: switch chains from the UI\nimport { useAccount, useSwitchChain } from \"wagmi\";\n\nfunction ChainSwitcher() {\n  const { chainId } = useAccount();\n  const { chains, switchChain } = useSwitchChain();\n  return (\n    <select value={chainId} onChange={(e) => switchChain({ chainId: Number(e.target.value) })}>\n      {chains.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}\n    </select>\n  );\n}" },
        { type: "callout", variant: "gotcha", text: "**Same token, different address per chain.** USDC on mainnet, Base and Arbitrum are three different contract addresses. Hard-coding one address and using it on every chain reads a nonexistent/foreign contract (garbage or revert). Key your address book by chain id and always resolve `addresses[chainId]`." },
        { type: "callout", variant: "warn", text: "Always confirm the **connected chain matches what your action targets** before writing. A user on mainnet clicking a Base action will send the tx to mainnet (wrong contract, possibly a revert or worse). Read `useAccount().chainId`, and gate/`switchChain` before the write. L2 fees are tiny but their gas dynamics (e.g. L1 data cost) differ — trust viem's estimation per chain rather than reusing a mainnet number." }
      ]
    },
    {
      id: "testing",
      title: "Testing clients: anvil, viem test client, Vitest",
      level: "deep",
      body: [
        { type: "p", text: "You don't test a dApp against mainnet. Run a **local node** — **anvil** (from Foundry) is the standard — optionally **forking** mainnet so real deployed contracts (Uniswap, a real USDC) exist in your local sandbox. viem's **Test Client** exposes anvil/hardhat cheatcodes (mine blocks, set balances, impersonate accounts, snapshot/revert)." },
        { type: "code", lang: "bash", code: "# plain local chain: 10 funded accounts at http://127.0.0.1:8545\nanvil\n\n# fork mainnet state locally (test against live protocols without deploying them)\nanvil --fork-url $MAINNET_RPC_URL\nanvil --fork-url $MAINNET_RPC_URL --fork-block-number 20000000   # pin a block for determinism" },
        { type: "code", lang: "ts", code: "import { createTestClient, http, createPublicClient, createWalletClient } from \"viem\";\nimport { foundry } from \"viem/chains\";   // chain preset for a local anvil node\n\nconst test = createTestClient({ chain: foundry, mode: \"anvil\", transport: http() });\nconst publicClient = createPublicClient({ chain: foundry, transport: http() });\n\n// cheatcodes via the test client\nawait test.setBalance({ address: user, value: parseEther(\"100\") });\nawait test.impersonateAccount({ address: \"0xWhale\" });      // act as any address on a fork\nawait test.mine({ blocks: 1 });                              // advance a block\nawait test.setNextBlockTimestamp({ timestamp: 9999999999n });\nconst snap = await test.snapshot();                          // save state...\nawait test.revert({ id: snap });                             // ...and roll back after a test" },
        { type: "code", lang: "ts", code: "// Vitest: spin up state, drive your client code, assert on-chain results\nimport { test, expect, beforeEach } from \"vitest\";\n\nbeforeEach(async () => {\n  await testClient.reset({ jsonRpcUrl: MAINNET_RPC, blockNumber: 20_000_000n }); // clean fork each test\n});\n\ntest(\"transfer moves balance\", async () => {\n  await sendTransferViaMyClientCode();\n  const bal = await publicClient.readContract({ address: token, abi: erc20Abi, functionName: \"balanceOf\", args: [to] });\n  expect(bal).toBe(expected);\n});" },
        { type: "callout", variant: "tip", text: "**Fork + impersonate** is the superpower: fork mainnet, `impersonateAccount` a whale or a protocol admin, and exercise your client against the *real* contracts and *real* state — no mocks, no redeploys. `snapshot`/`revert` (or `reset` per test) keeps tests isolated and fast." },
        { type: "callout", variant: "note", text: "For pure UI/hook tests you can also mock at the transport layer, but integration tests against a forked anvil catch the bugs that matter (encoding, decimals, allowances, reverts). Wagmi ships a `mock` connector for React component tests that need a deterministic account without a real wallet." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns of EVM client work. Most are cheap to avoid once and painful to debug in prod." },
        { type: "heading", text: "1. BigInt vs number" },
        { type: "callout", variant: "gotcha", text: "Everything on-chain is `bigint` — there are no floats. `Number(balance)` loses precision past 2^53 and `amount * 1.5` throws (can't mix bigint/number). Keep amounts as `bigint` end-to-end; do integer math (multiply before divide), and only `formatUnits(...)` to a string for display at the very edge." },
        { type: "heading", text: "2. Token decimals" },
        { type: "callout", variant: "warn", text: "Never assume 18. USDC/USDT = 6, WBTC = 8. Read `decimals()` and feed it to `parseUnits`/`formatUnits`. Hard-coding 18 for a 6-decimal token is a 10^12x error — the classic \"I meant 100 USDC and sent 100 trillion\" bug." },
        { type: "heading", text: "3. Forgetting to wait for the receipt" },
        { type: "callout", variant: "gotcha", text: "`writeContract` resolves on *broadcast*, not inclusion. Always `await waitForTransactionReceipt({ hash })` and check `receipt.status === \"success\"` before showing success or firing a dependent tx (e.g. an action that relies on a prior `approve` being mined)." },
        { type: "heading", text: "4. Chain / nonce mismatch" },
        { type: "callout", variant: "warn", text: "Confirm the connected chain matches the action's target chain before writing (`useAccount().chainId`, `switchChain`) — a mainnet wallet firing a Base action hits the wrong contract. And a stuck low nonce blocks every later tx; read the next nonce with `blockTag: \"pending\"` and serialize sends in bots." },
        { type: "heading", text: "5. Unlimited approvals" },
        { type: "callout", variant: "warn", text: "Approving max-uint is convenient but leaves a compromised spender able to drain the token — a top drainer vector. Prefer exact-amount approvals per action or **ERC-2612 `permit`** (gasless signed approval). Surface existing allowances so users can revoke." },
        { type: "heading", text: "6. Grabbing window.ethereum instead of EIP-6963" },
        { type: "callout", variant: "gotcha", text: "With multiple wallets installed, `window.ethereum` is whichever loaded last and can silently clobber. Use **EIP-6963** discovery (or wagmi connectors / RainbowKit) to present a picker and hold onto the *specific* provider the user chose." },
        { type: "heading", text: "7. RPC rate limits & batching" },
        { type: "callout", variant: "gotcha", text: "Public RPCs rate-limit and cap `getLogs` ranges. Batch contract reads with **`multicall`** (one aggregate call), let `http({ batch: true })` coalesce JSON-RPC, page log scans in chunks, and for historical queries run an indexer (The Graph/Ponder) instead of hammering the node. Use `fallback([...])` transports for resilience." },
        { type: "heading", text: "8. Not simulating before writing" },
        { type: "callout", variant: "tip", text: "`simulateContract` is a free `eth_call` that catches most reverts *before* the user pays gas or you broadcast a doomed tx — and it returns a typed `request` you pass to `writeContract`. Simulate first; a reverted tx still mines and still costs gas." },
        { type: "heading", text: "9. Decoding reverts" },
        { type: "callout", variant: "note", text: "When a call reverts, viem throws a rich `ContractFunctionExecutionError` / `BaseError` — walk `error.walk()` or read `error.shortMessage`, and match custom errors from your ABI (`decodeErrorResult`). Don't show users raw hex; map known error selectors to friendly messages." },
        { type: "heading", text: "10. User-rejected requests" },
        { type: "callout", variant: "gotcha", text: "When a user hits \"reject\" in their wallet, the promise *rejects* — it's not an app error. viem throws `UserRejectedRequestError` (EIP-1193 code `4001`). Catch it and treat it as a no-op/cancel in the UI, not a red error toast. Distinguish it from real failures via the error code." }
      ]
    }
  ],

  packages: [
    { name: "viem", why: "modern, typed, tree-shakeable core client — Public/Wallet/Test clients, ABI-inferred types, units, encoding. The recommended foundation." },
    { name: "wagmi", why: "React hooks over viem + TanStack Query: useAccount/useReadContract/useWriteContract, connectors, account+chain state" },
    { name: "@tanstack/react-query", why: "required peer of wagmi — caching, dedup, refetch, loading/error state for all hooks (QueryClientProvider)" },
    { name: "ethers", why: "mature v6 library (Provider/Signer/Contract) — you'll meet it in existing code, tutorials, Hardhat/TypeChain stacks" },
    { name: "@rainbow-me/rainbowkit", why: "polished, themeable connect-button + wallet modal on top of wagmi (ConnectButton)" },
    { name: "connectkit", why: "clean wagmi-based connect UI alternative to RainbowKit" },
    { name: "@reown/appkit", why: "the rebrand of Web3Modal (WalletConnect): broad wallet + email/social login, on-ramp, connect modal" },
    { name: "permissionless", why: "Pimlico's ERC-4337/EIP-7702 smart-account SDK on viem — bundlers, paymasters, UserOperations, gas sponsorship" },
    { name: "siwe", why: "build & verify Sign-In With Ethereum (EIP-4361) messages for wallet-based auth (nonce, domain, expiry)" },
    { name: "abitype", why: "the type engine behind viem/wagmi — infers TS types from `as const` ABIs (arguments, returns, events)" },
    { name: "@wagmi/cli", why: "codegen: read Foundry/Hardhat/Etherscan ABIs and emit typed abis + React hooks (keeps types in sync with deployments)" },
    { name: "@graphprotocol/graph-cli", why: "build & deploy subgraphs (The Graph) to index contract events into a GraphQL API" },
    { name: "ponder", why: "TypeScript indexing framework — write event handlers in TS, get a typed GraphQL/SQL API for historical data" },
    { name: "@safe-global/protocol-kit", why: "interact with Safe smart-contract multisig wallets from TS (deploy, propose, execute)" }
  ],

  gotchas: [
    "**No floats — everything is `bigint`.** `Number(balance)` loses precision past 2^53 and `amount * 1.5` throws. Keep values as bigint; `formatUnits` to a string only for display.",
    "**Read `decimals()` — never assume 18.** USDC/USDT = 6, WBTC = 8. Wrong decimals in `parseUnits`/`formatUnits` is a 10^n error and a common way to send the wrong amount.",
    "**`writeContract` resolves on broadcast, not mining.** Always `await waitForTransactionReceipt({ hash })` and check `receipt.status` before showing success or firing a dependent tx.",
    "**Simulate before you write.** `simulateContract` is a free `eth_call` that catches reverts off-chain and returns the `request` for `writeContract`. A reverted tx still mines and still costs gas.",
    "**Don't grab `window.ethereum`.** With multiple wallets it's whoever loaded last. Use **EIP-6963** discovery (or wagmi connectors) and keep the specific provider the user picked.",
    "**Add `as const` to ABIs.** Without it viem can't infer types and `functionName`/args fall back to `any`/`string`. Generated ABIs (`@wagmi/cli`) already include it.",
    "**Same token, different address per chain.** USDC differs on mainnet/Base/Arbitrum. Key an address book by chain id and resolve `addresses[chainId]`; confirm the connected chain before writing.",
    "**Unlimited (`max-uint`) approvals are a drain risk.** Prefer exact-amount approvals or ERC-2612 `permit`. Let users see and revoke existing allowances.",
    "**RPC rate limits & `getLogs` range caps.** Batch reads with `multicall`, page log scans in chunks, use `fallback([...])` transports, and run an indexer (The Graph/Ponder) for history — don't scan from genesis on a public RPC.",
    "**Nonce gaps stall the account.** A stuck low nonce blocks every later tx. Read the next nonce with `blockTag: \"pending\"` and serialize concurrent sends in bots; replace/cancel by re-sending the same nonce with a higher fee.",
    "**User rejection is `code 4001` (`UserRejectedRequestError`), not an app error.** Catch it and treat as cancel — don't show a scary error toast.",
    "**`require(token.transfer(...))` breaks on USDT** (no bool return). Use `SafeERC20` on-chain and don't assume a boolean on the client.",
    "**Forgetting `QueryClientProvider` in wagmi v2** throws \"No QueryClient set.\" Both `WagmiProvider` and `QueryClientProvider` must wrap the tree.",
    "**Signature phishing:** an EIP-712 `permit`/order can move tokens with no further tx. Show what's being signed; bind server verification to a single-use nonce + domain + expiry.",
    "**Indexed dynamic types are hashed** in log topics — you can match on a string/bytes topic but can't recover the original value; the contract must also emit it un-indexed if you need it.",
    "**Never ship a private key to the browser.** `privateKeyToAccount` is for backends/bots/scripts; in the browser sign through the wallet (JSON-RPC account via `custom(window.ethereum)`)."
  ],

  flashcards: [
    { q: "What is EIP-1193 and where do you meet it?", a: "The standard provider interface every browser wallet implements — one method `request({ method, params })` plus `on(...)` events (`accountsChanged`, `chainChanged`). Injected wallets expose one; you pass it to viem as `custom(provider)`." },
    { q: "Read vs write — what's the difference in cost and requirements?", a: "Reads (`eth_call`, `view`/`pure`, `readContract`) are free — no signature, no gas, any node answers. Writes need a signed tx from a funded account, cost gas, and only change state once mined." },
    { q: "viem vs wagmi vs ethers — when to use which?", a: "**viem** = typed low-level core (default for all new code). **wagmi** = React hooks *on top of* viem + TanStack Query. **ethers v6** = mature alt you meet in existing code. web3.js is legacy/sunset." },
    { q: "Why is `as const` mandatory on ABIs?", a: "It freezes the ABI's literal types so Abitype can infer exact argument/return/event types. Without it the ABI is just `object[]` and every call is `any`/`string`. Generated ABIs include it." },
    { q: "The correct viem write pattern?", a: "`simulateContract` (free eth_call, catches reverts, returns a typed `request`) -> `writeContract(request)` (broadcast, returns hash) -> `waitForTransactionReceipt({ hash })` (wait for mining, check `status`)." },
    { q: "Why must you read a token's `decimals`?", a: "Amounts are integers in the token's smallest unit and each token defines its own decimals (USDC=6, WBTC=8, most=18). Feed `decimals` into `parseUnits`/`formatUnits`; assuming 18 is a 10^n error." },
    { q: "What problem does EIP-6963 solve?", a: "Multiple wallets racing to own `window.ethereum` (silent clobber). EIP-6963 is event-based discovery: dApp requests, each wallet announces its provider + metadata, so you show a proper picker." },
    { q: "What's the ERC-20 approve/transferFrom flow?", a: "A spender can't pull your tokens until you `approve(spender, amount)`; it then calls `transferFrom(you, dest, amount)` up to your `allowance`. Client flow: read allowance -> approve if low (wait for receipt) -> action." },
    { q: "EIP-1559 fee fields?", a: "`maxFeePerGas` (ceiling covering base fee + tip) and `maxPriorityFeePerGas` (the validator tip). Legacy uses a single `gasPrice`. `gas` is the unit *limit*. viem picks 1559 fees automatically." },
    { q: "How do you speed up or cancel a pending tx?", a: "Re-broadcast a tx with the **same nonce** and a higher fee. Cancel = same-nonce 0-ETH send-to-self at a higher tip. A nonce gap stalls all later txs behind it." },
    { q: "personal_sign vs EIP-712 vs SIWE?", a: "`personal_sign` = arbitrary text; EIP-712 = structured typed data the wallet renders field-by-field (permits, orders); SIWE (EIP-4361) = a standard personal_sign login message with domain + single-use nonce + expiry." },
    { q: "Required wagmi v2 providers?", a: "`WagmiProvider` (config) *and* `QueryClientProvider` (TanStack Query), WagmiProvider outermost. Missing the query provider throws \"No QueryClient set.\"" },
    { q: "EIP-4337 pieces?", a: "Smart account (contract wallet) emits a **UserOperation** to a separate mempool; a **bundler** packs it into a tx to the **EntryPoint**; a **paymaster** sponsors gas or takes an ERC-20. Use permissionless.js." },
    { q: "What did EIP-7702 change (2026)?", a: "Live via Pectra (May 2025): an EOA can sign an authorization delegating its address to smart-account code — batching, gas sponsorship, session keys — keeping the same address/key. Closed AA's biggest adoption gap." },
    { q: "Why use multicall / an indexer?", a: "`multicall` batches many contract reads into one on-chain aggregate call (fewer round trips, less rate-limiting). For historical data, an indexer (The Graph/Ponder) beats scanning `getLogs` from genesis, which RPCs rate-limit and range-cap." },
    { q: "How does viem verify signatures from smart-contract wallets?", a: "There's no EOA key to recover, so it uses **ERC-1271** (`isValidSignature`). `verifyMessage`/`verifyTypedData` handle both EOA and ERC-1271 automatically — verify through them, not raw `ecrecover`." }
  ],

  cheatsheet: [
    { label: "Public client (reads)", code: "const c = createPublicClient({ chain: mainnet, transport: http(RPC) });" },
    { label: "Wallet client (browser)", code: "const w = createWalletClient({ chain: mainnet, transport: custom(window.ethereum) });" },
    { label: "Local signer (backend)", code: "const acct = privateKeyToAccount(process.env.PK); // never in the browser" },
    { label: "Read a contract", code: "await c.readContract({ address, abi, functionName: \"balanceOf\", args: [user] });" },
    { label: "Batch reads", code: "await c.multicall({ contracts: [...], allowFailure: false });" },
    { label: "Write pattern", code: "const { request } = await c.simulateContract({...}); const h = await w.writeContract(request); await c.waitForTransactionReceipt({ hash: h });" },
    { label: "Units", code: "parseEther(\"1.5\"); formatUnits(bal, decimals); parseUnits(\"100\", 6);" },
    { label: "Send ETH", code: "await w.sendTransaction({ account, to, value: parseEther(\"0.1\") });" },
    { label: "wagmi read hook", code: "const { data } = useReadContract({ address, abi, functionName: \"symbol\" });" },
    { label: "wagmi write hooks", code: "const { data: sim } = useSimulateContract({...}); const { writeContract } = useWriteContract();" },
    { label: "Connect (wagmi)", code: "const { connect, connectors } = useConnect(); connect({ connector: connectors[0] });" },
    { label: "Switch chain", code: "await provider.request({ method: \"wallet_switchEthereumChain\", params: [{ chainId: \"0x2105\" }] });" },
    { label: "Get logs (filtered)", code: "await c.getLogs({ address, event, args: { to: user }, fromBlock, toBlock: \"latest\" });" },
    { label: "Sign typed data", code: "await w.signTypedData({ account, domain, types, primaryType, message });" },
    { label: "Local test node", code: "anvil --fork-url $MAINNET_RPC_URL" },
    { label: "viem test cheatcodes", code: "await test.setBalance({ address, value }); await test.impersonateAccount({ address });" }
  ]
});
