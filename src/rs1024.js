// rs1024.js

export const CHECKSUM_LENGTH_WORDS = 3;

/**
 * A direct BigInt port of the Python _polymod function from rs1024.py
 * (SLIP-0039 / BIP-39 style).
 *
 * Python code:
 *   chk = 1
 *   for v in values:
 *       top = chk >> 20
 *       chk = ((chk & 0xFFFFF) << 10) ^ v
 *       for i in range(10):
 *           if (top >> i) & 1:
 *               chk ^= GEN[i]
 *   return chk
 */
function _polymod(values) {
  // Same generator table from slip-0039 (in hex),
  // but stored as BigInt so we do all arithmetic in BigInt.
  const GEN = [
    0xE0E040n,
    0x1C1C080n,
    0x3838100n,
    0x7070200n,
    0xE0E0009n,
    0x1C0C2412n,
    0x38086C24n,
    0x3090FC48n,
    0x21B1F890n,
    0x03F3F120n,
  ];

  let chk = 1n; // start with 1, as in Python
  for (const v of values) {
    // Convert v to BigInt
    const vv = BigInt(v);

    // top = chk >> 20  (the top 10 bits)
    const top = chk >> 20n;

    // chk = ((chk & 0xFFFFF) << 10) ^ v
    chk = ((chk & 0xFFFFFn) << 10n) ^ vv;

    // for i in range(10): if (top >> i) & 1: chk ^= GEN[i]
    for (let i = 0; i < 10; i++) {
      if (((top >> BigInt(i)) & 1n) === 1n) {
        chk ^= GEN[i];
      }
    }
  }
  return chk;
}

/**
 * create_checksum(data, custom)
 *
 * Mirroring Python:
 *   values = custom + data + [0,0,0]
 *   poly = _polymod(values) ^ 1
 *   # Then extract 3 words of 10 bits each
 */
export function create_checksum(data, custom) {
  const values = [...custom, ...data];
  for (let i = 0; i < CHECKSUM_LENGTH_WORDS; i++) {
    values.push(0);
  }

  // poly = _polymod(values) ^ 1
  let poly = _polymod(values) ^ 1n;

  // Extract 3 words of 10 bits each, from left to right (2,1,0).
  const result = [];
  for (let i = CHECKSUM_LENGTH_WORDS - 1; i >= 0; i--) {
    const shiftBits = 10n * BigInt(i); // 20, then 10, then 0
    const word = Number((poly >> shiftBits) & 0x3FFn);
    result.push(word);
  }
  return result;
}

/**
 * verify_checksum(data, custom)
 *
 * Python:
 *   return _polymod(custom + data) == 1
 */
export function verify_checksum(data, custom) {
  const values = [...custom, ...data];
  return _polymod(values) === 1n;
}
