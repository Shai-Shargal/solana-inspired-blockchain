const Blockchain = require('./blockchain/Blockchain');
const TransactionLoader = require('./loaders/TransactionLoader');

function main() {
  console.log('Starting Solana-inspired blockchain simulation...\n');

  const blockchain = new Blockchain();
  const transactions = TransactionLoader.load();

  console.log(`Loaded ${transactions.length} transactions from ./data/transactions.json\n`);
  blockchain.processAllTransactions(transactions);

  const firstBlock = blockchain.chain[1];
  const secondBlock = blockchain.chain[2];
  if (firstBlock && secondBlock) {
    console.log(
      `Merkle root test (Block 1 != Block 2): ${firstBlock.merkleRoot !== secondBlock.merkleRoot}`
    );
  }

  if (firstBlock && firstBlock.transactions.length > 0) {
    const sampleHash = firstBlock.transactions[0].txHash;
    console.log(`Light-wallet verify (first tx): ${blockchain.verifyTransaction(sampleHash)}`);
  }

  blockchain.printBlockTransactionCounts();
  blockchain.printStatistics();
}

main();
