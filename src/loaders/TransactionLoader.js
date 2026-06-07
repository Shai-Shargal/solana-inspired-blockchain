const fs = require('fs');
const path = require('path');
const { ALL_WALLETS } = require('../wallet/Wallet');

const TRANSACTIONS_PATH = path.join(__dirname, '..', '..', 'data', 'transactions.json');

function load() {
  if (!fs.existsSync(TRANSACTIONS_PATH)) {
    throw new Error('Transaction file not found at ./data/transactions.json');
  }

  const raw = fs.readFileSync(TRANSACTIONS_PATH, 'utf8');
  let transactions;

  try {
    transactions = JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON in ./data/transactions.json');
  }

  if (!Array.isArray(transactions)) {
    throw new Error('Transaction file must contain a JSON array');
  }

  const walletSet = new Set(ALL_WALLETS);

  return transactions.map((tx, index) => {
    if (!tx.from || !tx.to || tx.amount === undefined) {
      throw new Error(`Transaction at index ${index} is missing required fields (from, to, amount)`);
    }
    if (!walletSet.has(tx.from) || !walletSet.has(tx.to)) {
      throw new Error(`Transaction at index ${index} references unknown wallet`);
    }
    if (typeof tx.amount !== 'number' || tx.amount <= 0 || !Number.isInteger(tx.amount)) {
      throw new Error(`Transaction at index ${index} has invalid amount`);
    }
    if (tx.from === tx.to) {
      throw new Error(`Transaction at index ${index} cannot send to the same wallet`);
    }
    return { from: tx.from, to: tx.to, amount: tx.amount };
  });
}

module.exports = { load, TRANSACTIONS_PATH };
