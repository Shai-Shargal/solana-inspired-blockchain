const Block = require('./Block');
const Transaction = require('./Transaction');
const { USER_TXS_PER_BLOCK, BLOCK_REWARD, BASE_FEE, TIP } = require('./constants');
const { Wallet, INITIAL_BALANCE, ALL_WALLETS, MINERS } = require('../wallet/Wallet');
const { mightContainTransaction } = require('../bloom/BloomHelper');
const { verifyTransactionInBlock } = require('../merkle/MerkleHelper');

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.wallets = Wallet.createAllWallets();
    this.pendingTransactions = [];
    this.currentMinerIndex = 0;
    this.totalBurned = 0;
    this.totalMined = 0;
    this.totalTips = 0;
    this.appliedTransactionCount = 0;
    this.skippedTransactionCount = 0;
  }

  createGenesisBlock() {
    return new Block({
      index: 0,
      timestamp: '01/01/2019',
      previousHash: '0',
      transactions: [],
      witnessData: [],
      merkleRoot: '',
      bloomFilter: null,
      proofOfHistoryHash: Block.computeProofOfHistory([]),
      miner: null,
      merkleProofs: new Map(),
    });
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  getCurrentMiner() {
    return MINERS[this.currentMinerIndex];
  }

  getBalance(walletId) {
    const wallet = this.wallets.get(walletId);
    return wallet ? wallet.getBalance() : 0;
  }

  processTransaction({ from, to, amount }) {
    const sender = this.wallets.get(from);
    const transaction = new Transaction(from, to, amount);

    transaction.signTransaction(sender.getSigningKey(), from);

    if (!transaction.isValid(sender.getPublicKey())) {
      throw new Error(`Invalid signature for transaction from ${from}`);
    }

    this.pendingTransactions.push(transaction);

    if (this.pendingTransactions.length >= USER_TXS_PER_BLOCK) {
      this.createBlockFromPending();
    }
  }

  settlePendingTransactions(miner) {
    const minerWallet = this.wallets.get(miner);

    for (const transaction of this.pendingTransactions) {
      if (transaction.isCoinbase()) {
        const receiver = this.wallets.get(transaction.to);
        receiver.credit(transaction.amount);
        this.totalMined += BLOCK_REWARD;
        continue;
      }

      const sender = this.wallets.get(transaction.from);
      const receiver = this.wallets.get(transaction.to);
      const totalCost = transaction.amount + BASE_FEE + TIP;

      if (!sender.canAfford(totalCost)) {
        this.skippedTransactionCount += 1;
        continue;
      }

      sender.debit(totalCost);
      receiver.credit(transaction.amount);
      minerWallet.credit(TIP);
      this.totalBurned += BASE_FEE;
      this.totalTips += TIP;
      this.appliedTransactionCount += 1;
    }
  }

  createBlockFromPending() {
    if (this.pendingTransactions.length === 0) {
      return;
    }

    const miner = this.getCurrentMiner();
    const rewardTx = new Transaction(null, miner, BLOCK_REWARD);
    this.pendingTransactions.push(rewardTx);

    this.settlePendingTransactions(miner);

    const block = Block.fromPendingTransactions(
      this.chain.length,
      Date.now(),
      this.getLatestBlock().hash,
      this.pendingTransactions,
      miner
    );

    this.chain.push(block);
    this.pendingTransactions = [];
    this.currentMinerIndex = (this.currentMinerIndex + 1) % MINERS.length;
  }

  processAllTransactions(transactions) {
    for (const tx of transactions) {
      this.processTransaction(tx);
    }
    if (this.pendingTransactions.length > 0) {
      this.createBlockFromPending();
    }
  }

  verifyTransaction(txHash) {
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];

      if (!mightContainTransaction(block.bloomFilter, txHash)) {
        continue;
      }

      const proof = block.merkleProofs.get(txHash);
      if (verifyTransactionInBlock(txHash, proof, block.merkleRoot)) {
        return true;
      }
    }
    return false;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransactions(this.wallets)) {
        return false;
      }
      if (!currentBlock.verifyMerkleRoot()) {
        return false;
      }
      if (!currentBlock.verifyProofOfHistory()) {
        return false;
      }
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
      if (!MINERS.includes(currentBlock.miner)) {
        return false;
      }
    }

    const totalCoins = this.getTotalCoins();
    const expected = ALL_WALLETS.length * INITIAL_BALANCE + this.totalMined - this.totalBurned;
    return totalCoins === expected;
  }

  getTotalCoins() {
    let total = 0;
    for (const wallet of this.wallets.values()) {
      total += wallet.getBalance();
    }
    return total;
  }

  getMinedBlockCount() {
    return this.chain.length - 1;
  }

  printBlockTransactionCounts() {
    console.log('\n=== Block Transaction Counts ===\n');
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      const reward = block.transactions.filter((tx) => tx.from === null).length;
      const user = block.transactions.length - reward;
      console.log(
        `Block ${i}: User transactions = ${user}, Reward transactions = ${reward}, Total transactions = ${block.transactions.length}`
      );
    }
  }

  printStatistics() {
    console.log('\n=== Final Statistics ===\n');
    console.log('Wallet Balances:');
    for (const id of ALL_WALLETS) {
      console.log(`  ${id}: ${this.getBalance(id)}`);
    }
    console.log(`\nTotal Coins: ${this.getTotalCoins()}`);
    console.log(`Total Mined: ${this.totalMined}`);
    console.log(`Total Burned: ${this.totalBurned}`);
    console.log(`Total Tips (to miners): ${this.totalTips}`);
    console.log(`Transactions Applied: ${this.appliedTransactionCount}`);
    console.log(`Transactions Skipped (insufficient funds): ${this.skippedTransactionCount}`);
    console.log(`Number of Blocks: ${this.getMinedBlockCount()}`);
    console.log(`Blockchain Validity: ${this.isChainValid()}`);
  }
}

module.exports = Blockchain;
