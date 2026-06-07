const crypto = require('crypto');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

const INITIAL_BALANCE = 100;
const ALL_WALLETS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const MINERS = ['A', 'B', 'C', 'D', 'E'];

class Wallet {
  constructor(id) {
    this.id = id;
    this.balance = INITIAL_BALANCE;
    this.keyPair = Wallet.deriveKeyPair(id);
  }

  static deriveKeyPair(walletId) {
    const seed = crypto.createHash('sha256').update(`wallet-${walletId}`).digest('hex');
    return ec.keyFromPrivate(seed);
  }

  static createAllWallets() {
    const wallets = new Map();
    for (const id of ALL_WALLETS) {
      wallets.set(id, new Wallet(id));
    }
    return wallets;
  }

  getPublicKey() {
    return this.keyPair.getPublic('hex');
  }

  getSigningKey() {
    return this.keyPair;
  }

  getBalance() {
    return this.balance;
  }

  canAfford(amount) {
    return this.balance >= amount;
  }

  debit(amount) {
    if (this.balance < amount) {
      throw new Error(`Wallet ${this.id} has insufficient funds`);
    }
    this.balance -= amount;
  }

  credit(amount) {
    this.balance += amount;
  }
}

module.exports = {
  Wallet,
  INITIAL_BALANCE,
  ALL_WALLETS,
  MINERS,
};
