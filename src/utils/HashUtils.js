const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256');

function hashString(value) {
  return SHA256(value).toString();
}

function sha256ForMerkle(data) {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  return crypto.createHash('sha256').update(input).digest();
}

module.exports = {
  hashString,
  sha256ForMerkle,
};
