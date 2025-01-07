// encoding.js
import wordlist from "./wordlist.js";
import {
  create_checksum,
  verify_checksum,
  CHECKSUM_LENGTH_WORDS
} from "./rs1024.js";

/**
 * Convert a string to bytes (UTF-8).
 */
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

/**
 * Convert bytes to string (UTF-8).
 */
function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

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
 * Convert a string -> array of mnemonic words (data + 3 checksum words).
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
 * Convert array of mnemonic words -> original string. Verifies RS1024 checksum.
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
 * Convert string -> single space-delimited mnemonic (data + checksum).
 */
export function strToMnemonic(str) {
  return strToWords(str).join(" ");
}

/**
 * Convert single space-delimited mnemonic -> original string.
 */
export function mnemonicToStr(mnemonic) {
  const words = mnemonic.trim().split(/\s+/);
  return wordsToStr(words);
}
