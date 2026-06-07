const EC = require('elliptic').ec;
const { hashString } = require('../utils/HashUtils');

const ec = new EC('secp256k1');

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.signature = null;
  }

  getBody() {
    return { from: this.from, to: this.to, amount: this.amount };
  }

  calculateHash() {
    return hashString(JSON.stringify(this.getBody()));
  }

  signTransaction(signingKey, walletId) {
    if (walletId !== this.from) {
      throw new Error('You cannot sign transaction for other wallets');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isCoinbase() {
    return this.from === null;
  }

  isValid(publicKeyHex) {
    if (this.isCoinbase()) {
      return true;
    }
    return Transaction.verifySignature(this.getBody(), this.signature, publicKeyHex);
  }

  static verifySignature(body, signature, publicKeyHex) {
    if (!signature || signature.length === 0) {
      return false;
    }
    const publicKey = ec.keyFromPublic(publicKeyHex, 'hex');
    const bodyHash = hashString(JSON.stringify(body));
    return publicKey.verify(bodyHash, signature);
  }
}

module.exports = Transaction;
