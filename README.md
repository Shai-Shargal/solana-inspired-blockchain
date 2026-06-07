# Solana-Inspired Blockchain Homework

University blockchain simulation built on the classroom `blockchain4.js` foundation.

## Run

```bash
npm install
npm start
```

Requires `data/transactions.json`.

## Project Structure

| Path | Purpose |
|---|---|
| `src/main.js` | Entry point — loads transactions, runs simulation, prints statistics |
| `src/blockchain/Blockchain.js` | Chain orchestration: batching, mining rotation, EIP-1559, validation |
| `src/blockchain/Block.js` | Block structure: Merkle root, Bloom filter, PoH, SegWit witness |
| `src/blockchain/Transaction.js` | Signed transfer with body/witness separation (SegWit) |
| `src/blockchain/constants.js` | Network constants (block size, fees, rewards) |
| `src/wallet/Wallet.js` | Wallets A–J with balances and signing keys |
| `src/merkle/MerkleHelper.js` | Merkle root generation and proof verification |
| `src/bloom/BloomHelper.js` | Per-block Bloom filter for light-wallet lookups |
| `src/loaders/TransactionLoader.js` | Reads and validates `data/transactions.json` |
| `src/utils/HashUtils.js` | Shared SHA-256 utilities for hashing and Merkle trees |
| `data/transactions.json` | Input transaction dataset |

## Features

- Wallets A–J (100 coins each)
- Block every 50 transactions, miner rotation A→B→C→D→E
- EIP-1559: 2 base fee burned, 3 tip to miner, 60 block reward
- Merkle tree (`merkletreejs`), Bloom filter (`bloom-filters`)
- SegWit-style witness data, Solana-style Proof-of-History
