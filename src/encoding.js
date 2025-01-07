// encoding.js
import wordlist from "./wordlist.js";
import {
  create_checksum,
  verify_checksum,
  CHECKSUM_LENGTH_WORDS
} from "./rs1024.js";

/**
 * Convert a string to bytes (UTF-8).
 * @param {string} str - The input string.
 * @returns {Uint8Array} - The UTF-8 encoded bytes.
 */
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

/**
 * Convert bytes to string (UTF-8).
 * @param {Uint8Array} bytes - The input bytes.
 * @returns {string} - The decoded string.
 */
function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert a Uint8Array to a base-1024 array.
 * @param {Uint8Array} byteArray - The input byte array.
 * @returns {number[]} - The base-1024 representation.
 */
function bytesToBase1024(byteArray) {
  // Convert bytes to one big integer, big-endian
  let bigVal = 0n;
  for (const b of byteArray) {
    bigVal = (bigVal << 8n) + BigInt(b);
  }
  // Now repeatedly mod by 1024
  const digits = [];
  while (bigVal > 0n) {
    digits.push(Number(bigVal % 1024n));
    bigVal = bigVal / 1024n;
  }
  // If no digits, it means the original data was empty
  if (digits.length === 0) {
    digits.push(0);
  }
  digits.reverse();
  return digits;
}

/**
 * Convert a base-1024 array back to bytes.
 * @param {number[]} arr - The base-1024 array.
 * @returns {Uint8Array} - The reconstructed byte array.
 */
function base1024ToBytes(arr) {
  // Combine digits into one big integer
  let bigVal = 0n;
  for (const digit of arr) {
    bigVal = bigVal * 1024n + BigInt(digit);
  }
  // Then pull out bytes by repeatedly shifting right by 8
  const bytes = [];
  while (bigVal > 0n) {
    bytes.push(Number(bigVal & 0xFFn));
    bigVal = bigVal >> 8n;
  }
  bytes.reverse();
  return new Uint8Array(bytes);
}

/**
 * Convert a string to an array of mnemonic words (data + 3 checksum words).
 * @param {string} str - The input string.
 * @returns {string[]} - The array of mnemonic words.
 */
export function strToWords(str) {
  // 1) string -> bytes
  const bytes = stringToBytes(str);
  // 2) bytes -> base1024 array
  const dataArr = bytesToBase1024(bytes);

  // 3) create 3-word checksum from dataArr
  const custom = []; // no customization
  const csumArr = create_checksum(dataArr, custom);

  // 4) combine data + csum
  const fullArr = dataArr.concat(csumArr);

  // 5) map each index to a word from the wordlist
  const words = fullArr.map(index => wordlist[index]);
  return words;
}

/**
 * Convert an array of mnemonic words back to the original string. Verifies RS1024 checksum.
 * @param {string[]} words - The array of mnemonic words.
 * @returns {string} - The original string.
 * @throws {Error} - If the checksum is invalid or words are invalid.
 */
export function wordsToStr(words) {
  if (words.length < CHECKSUM_LENGTH_WORDS + 1) {
    throw new Error("Not enough words to contain data + checksum");
  }

  // 1) Separate the last 3 words as the checksum
  const dataWords = words.slice(0, -CHECKSUM_LENGTH_WORDS);
  const checksumWords = words.slice(-CHECKSUM_LENGTH_WORDS);

  // 2) Convert each word to an index
  const dataArr = dataWords.map(w => {
    const idx = wordlist.indexOf(w);
    if (idx === -1) {
      throw new Error(`Invalid mnemonic word: '${w}'`);
    }
    return idx;
  });
  const csumArr = checksumWords.map(w => {
    const idx = wordlist.indexOf(w);
    if (idx === -1) {
      throw new Error(`Invalid mnemonic word: '${w}'`);
    }
    return idx;
  });

  // We can combine dataArr + csumArr to form the full base-1024 sequence
  const fullArr = dataArr.concat(csumArr);

  // 3) verify checksum with the same "custom" = []
  const custom = [];
  const isValid = verify_checksum(fullArr, custom);
  if (!isValid) {
    throw new Error("ChecksumError: invalid RS1024 checksum!");
  }

  // 4) Reconstruct the original bytes from dataArr
  const bytes = base1024ToBytes(dataArr);
  const original = bytesToString(bytes);
  return original;
}

/**
 * Convert a string to a single space-delimited mnemonic (data + checksum).
 * @param {string} str - The input string.
 * @returns {string} - The mnemonic string.
 */
export function strToMnemonic(str) {
  return strToWords(str).join(" ");
}

/**
 * Convert a single space-delimited mnemonic back to the original string.
 * @param {string} mnemonic - The mnemonic string.
 * @returns {string} - The original string.
 * @throws {Error} - If the checksum is invalid or mnemonic is invalid.
 */
export function mnemonicToStr(mnemonic) {
  const words = cleanupMnemonic(mnemonic).split(" ");
  return wordsToStr(words);
}

/**
 * Clean up the input mnemonic string.
 *
 * This function performs the following operations:
 * - Strips whitespace from the beginning and end
 * - Replaces newlines with spaces
 * - Replaces multiple spaces with a single space
 * - Converts all characters to lowercase
 * - Removes "-", ".", and ","
 *
 * @param {string} mnemonic - The input mnemonic string to clean up.
 * @returns {string} - The cleaned-up mnemonic string.
 */
export function cleanupMnemonic(mnemonic) {
  return mnemonic
    .trim()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[-.,]/g, '');
}
