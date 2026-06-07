const { BloomFilter } = require('bloom-filters');

function createBloomFilter(txHashes) {
  if (txHashes.length === 0) {
    return BloomFilter.create(1, 0.01);
  }
  return BloomFilter.from(txHashes, 0.01);
}

function mightContainTransaction(bloomFilterJson, txHash) {
  if (!bloomFilterJson) {
    return false;
  }
  const filter = BloomFilter.fromJSON(bloomFilterJson);
  return filter.has(txHash);
}

module.exports = {
  createBloomFilter,
  mightContainTransaction,
};

