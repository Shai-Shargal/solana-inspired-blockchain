# Solana-Inspired Blockchain Simulation

University homework assignment: build a blockchain network skeleton that processes a ordered transaction log using Solana-style Proof-of-History, Ethereum-inspired EIP-1559 fees, Merkle trees, Bloom filters, and SegWit-style witness separation.

Built on the classroom `blockchain4.js` foundation ([SavjeeCoin](https://github.com/Savjee/SavjeeCoin)), extended into a modular Node.js project.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- `data/transactions.json` (included in this repo)

### Install and Run

```bash
npm install
npm start
```

The simulation loads all transactions, mines blocks, settles balances and fees, then prints per-wallet balances and network-wide statistics.

---

## Presentation

Slide deck for this assignment:

**[Solana Inspired Blockchain Network](https://docs.google.com/presentation/d/1CmLt104USc4HERGNjYAsvMa8h2wGPNP6knHPR9hXojs/edit?usp=sharing)** — Google Slides

Covers team info, install instructions, and a walkthrough of each implemented feature with code and explanations.

---

## Assignment Overview

The course provides `transactions.json` (hundreds of transfers ordered by network clock). Wallets are labeled **A–J**. Miners **A–E** produce blocks in cyclic rotation (`A → B → C → D → E → A → …`). Wallets **F–J** act as light clients that can verify inclusion without storing the full chain.

Each block contains exactly **50 transactions**: 49 user transfers from the mempool, plus one coinbase reward transaction appended at the end.

### Network Parameters

| Parameter | Value | Description |
|---|---|---|
| Initial balance | 100 coins per wallet | Pre-mined starting supply |
| Block size | 50 transactions | Fixed count per block (49 user + 1 reward) |
| Block reward | 60 coins | Coinbase paid to the current miner |
| Base fee (burned) | 2 coins | Deducted from sender; removed from supply |
| Miner tip | 3 coins | Priority fee paid to the block miner |
| PoH seed | `42` | Global hash chain seed (Solana-style) |
| Miner rotation | A, B, C, D, E | Cyclic, one miner per block |

### Fee Example

If wallet **A** sends **15** coins to **B**:

- **A** pays: `15` (transfer) + `2` (base fee, burned) + `3` (tip to miner) = **20** total
- **B** receives: **15**
- Miner receives: **3** tip
- **2** coins are burned (not credited to any wallet)

---

## Features Implemented

| Requirement | Implementation |
|---|---|
| Bloom filter library | `src/bloom/BloomHelper.js` — per-block filter for fast light-wallet lookups (`bloom-filters`) |
| Merkle tree library | `src/merkle/MerkleHelper.js` — root generation and inclusion proofs (`merkletreejs`) |
| Light-wallet verification | `Blockchain.verifyTransaction()` — Bloom pre-check, then Merkle proof verification |
| Blockchain construction | `src/blockchain/Blockchain.js` — batching, mining, settlement, validation |
| EIP-1559-style fees | Base fee burn + miner tip in `settlePendingTransactions()` |
| Fee burning | Base fee debited from sender, tracked in `totalBurned`, never credited |
| SegWit | Transaction body in `block.transactions`; signatures in `block.witnessData` |
| Solana-style PoH | `Block.computeProofOfHistory()` — chains `seed + txHash` across all txs in a block |
| Final statistics | `printStatistics()` — wallet balances, total supply, mined, burned, validity check |

Demonstration output in `main.js` also includes:

- Merkle root uniqueness across blocks
- Light-wallet verification of a sample transaction from block 1

---

## How It Works

### Block Production

1. User transactions are signed and added to the pending pool.
2. When **49** user transactions accumulate, the current miner is selected.
3. A **coinbase** reward transaction (60 coins) is appended — block now has **50** transactions.
4. Balances are settled (transfers, tips, burns, reward).
5. The block is built with Merkle root, Bloom filter, PoH hash, and SegWit witness data.
6. Miner index advances to the next miner in the cycle.

### Proof-of-History

Starting from seed `42`, each transaction hash is folded into a running hash:

```
hash₀ = SHA256("42")
hash₁ = SHA256(hash₀ + txHash₁)
hash₂ = SHA256(hash₁ + txHash₂)
...
```

The final value is stored as `proofOfHistoryHash` on the block.

### SegWit

Block headers and hashes include only the transaction **body** (`from`, `to`, `amount`). ECDSA signatures live separately in `witnessData`, mirroring SegWit’s separation of witness from transaction data.

### Light-Wallet Verification

`verifyTransaction(txHash)` scans mined blocks:

1. **Bloom filter** — skip blocks that definitely do not contain the transaction (fast negative lookup).
2. **Merkle proof** — verify the transaction hash against the block’s Merkle root.

---

## Project Structure

```
solana-homework/
├── data/
│   └── transactions.json       # Input: ordered list of { from, to, amount }
├── src/
│   ├── main.js                 # Entry point — runs simulation, prints results
│   ├── blockchain/
│   │   ├── Blockchain.js       # Chain logic: batching, fees, mining, validation
│   │   ├── Block.js            # Block structure: Merkle, Bloom, PoH, SegWit
│   │   ├── Transaction.js      # Signed transfers with body/witness separation
│   │   └── constants.js        # Network constants (fees, block size, PoH seed)
│   ├── wallet/
│   │   └── Wallet.js           # Wallets A–J, balances, secp256k1 keys
│   ├── merkle/
│   │   └── MerkleHelper.js     # Merkle root + proof verification
│   ├── bloom/
│   │   └── BloomHelper.js      # Per-block Bloom filter helpers
│   ├── loaders/
│   │   └── TransactionLoader.js  # Loads and validates transactions.json
│   └── utils/
│       └── HashUtils.js        # SHA-256 utilities
├── package.json
└── README.md
```

---

## Sample Output

After processing all transactions, the program prints:

```
=== Block Transaction Counts ===
Block 1: User transactions = 49, Reward transactions = 1, Total transactions = 50
...

=== Final Statistics ===
Wallet Balances:
  A: ...
  B: ...
  ...

Total Coins: ...
Total Mined: ...
Total Burned: ...
Total Tips (to miners): ...
Transactions Applied: ...
Transactions Skipped (insufficient funds): ...
Number of Blocks: ...
Blockchain Validity: true
```

**Supply invariant:** `Total Coins = (wallets × 100) + Total Mined − Total Burned`

Skipped transactions occur when a sender cannot afford `amount + base fee + tip`; they are not applied but the block still mines on schedule.

---

## Submission Checklist (Slides)

The assignment also requires a slide deck (20% of grade). See the **[presentation](https://docs.google.com/presentation/d/1CmLt104USc4HERGNjYAsvMa8h2wGPNP6knHPR9hXojs/edit?usp=sharing)** for the submitted slides.

Suggested structure:

1. **Slide 1** — Team member names; implemented tasks; known bugs; unimplemented tasks
2. **Slide 2** — Install and run instructions (see [Quick Start](#quick-start))
3. **Remaining slides** — Walk through each implemented feature with code snippets and short explanations (Bloom filter, Merkle tree, light-wallet verify, blockchain, EIP-1559, burning, SegWit, statistics)

---

## References

- [Solana Inspired Blockchain Network (slides)](https://docs.google.com/presentation/d/1CmLt104USc4HERGNjYAsvMa8h2wGPNP6knHPR9hXojs/edit?usp=sharing) — assignment presentation
- [SavjeeCoin](https://github.com/Savjee/SavjeeCoin) — classroom starting point
- [EIP-1559 overview (Hebrew)](https://macrobit.co.il/eip-1559/) — base fee burn and priority fee model
- Bloom filter and Merkle tree — course slides
- SegWit — course slides (signature separation from block data)

---

## Dependencies

| Package | Purpose |
|---|---|
| `merkletreejs` | Merkle tree construction and proof verification |
| `bloom-filters` | Bloom filter creation and membership tests |
| `elliptic` | secp256k1 transaction signing |
| `crypto-js` | Hashing utilities |

---

## License

ISC
