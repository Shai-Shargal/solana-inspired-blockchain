const crypto = require('crypto');
const { MerkleTree } = require('merkletreejs');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function generateMerkleRoot(txHashes) {
  if (txHashes.length === 0) {
    return { merkleRoot: '', proofs: new Map() };
  }

  const leaves = txHashes.map((txHash) => sha256(txHash));
  const tree = new MerkleTree(leaves, sha256, { sortPairs: true });
  const merkleRoot = tree.getRoot().toString('hex');
  const proofs = new Map();

  for (const txHash of txHashes) {
    proofs.set(txHash, tree.getProof(sha256(txHash)));
  }

  return { merkleRoot, proofs };
}

function verifyTransactionInBlock(txHash, proof, merkleRoot) {
  if (!proof || !merkleRoot) {
    return false;
  }

  const leaf = sha256(txHash);
  const rootBuffer = Buffer.from(merkleRoot, 'hex');
  const tree = new MerkleTree([], sha256, { sortPairs: true });
  return tree.verify(proof, leaf, rootBuffer);
}

module.exports = {
  generateMerkleRoot,
  verifyTransactionInBlock,
};
