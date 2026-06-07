const { hashString } = require('../utils/HashUtils');
const { generateMerkleRoot } = require('../merkle/MerkleHelper');
const { createBloomFilter } = require('../bloom/BloomHelper');
const Transaction = require('./Transaction');
const { POH_SEED, BLOCK_REWARD } = require('./constants');
const { MINERS } = require('../wallet/Wallet');

class Block {
  constructor({
    index,
    timestamp,
    previousHash,
    transactions,
    witnessData,
    merkleRoot,
    bloomFilter,
    proofOfHistoryHash,
    miner,
    merkleProofs,
  }) {
    this.index = index;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.transactions = transactions;
    this.witnessData = witnessData;
    this.merkleRoot = merkleRoot;
    this.bloomFilter = bloomFilter;
    this.proofOfHistoryHash = proofOfHistoryHash;
    this.miner = miner;
    this.merkleProofs = merkleProofs || new Map();
    this.hash = this.calculateHash();
  }

  static computeProofOfHistory(txHashes) {
    if (txHashes.length === 0) {
      return hashString(POH_SEED);
    }

    let hash = POH_SEED;
    for (const txHash of txHashes) {
      hash = hashString(hash + txHash);
    }
    return hash;
  }

  static fromPendingTransactions(index, timestamp, previousHash, pendingTransactions, miner) {
    const txHashes = pendingTransactions.map((tx) => tx.calculateHash());
    const { merkleRoot, proofs } = generateMerkleRoot(txHashes);
    const bloomFilter = createBloomFilter(txHashes).saveAsJSON();
    const proofOfHistoryHash = Block.computeProofOfHistory(txHashes);

    const transactions = pendingTransactions.map((tx) => ({
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      txHash: tx.calculateHash(),
    }));
    const witnessData = pendingTransactions.map((tx) => tx.signature);

    return new Block({
      index,
      timestamp,
      previousHash,
      transactions,
      witnessData,
      merkleRoot,
      bloomFilter,
      proofOfHistoryHash,
      miner,
      merkleProofs: proofs,
    });
  }

  calculateHash() {
    const bloomFilterHash = this.bloomFilter
      ? hashString(JSON.stringify(this.bloomFilter))
      : '';
    const payload =
      this.index +
      this.previousHash +
      this.timestamp +
      (this.miner || '') +
      this.merkleRoot +
      this.proofOfHistoryHash +
      bloomFilterHash +
      JSON.stringify(this.transactions);
    return hashString(payload);
  }

  verifyMerkleRoot() {
    const txHashes = this.transactions.map((tx) => tx.txHash);
    const { merkleRoot } = generateMerkleRoot(txHashes);
    return merkleRoot === this.merkleRoot;
  }

  verifyProofOfHistory() {
    const txHashes = this.transactions.map((tx) => tx.txHash);
    return Block.computeProofOfHistory(txHashes) === this.proofOfHistoryHash;
  }

  hasValidTransactions(wallets) {
    for (let i = 0; i < this.transactions.length; i++) {
      const tx = this.transactions[i];
      const signature = this.witnessData[i];

      if (tx.from === null) {
        if (tx.amount !== BLOCK_REWARD || !MINERS.includes(tx.to)) {
          return false;
        }
        continue;
      }

      const wallet = wallets.get(tx.from);
      if (!wallet) {
        return false;
      }

      const body = { from: tx.from, to: tx.to, amount: tx.amount };
      if (!Transaction.verifySignature(body, signature, wallet.getPublicKey())) {
        return false;
      }
    }
    return true;
  }
}

module.exports = Block;
