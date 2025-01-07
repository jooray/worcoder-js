// test.js
import {
  strToWords,
  wordsToStr,
  strToMnemonic,
  mnemonicToStr
} from "./src/index.js";

const data = "Hello world!";
console.log("Original data:", data);

const mnemonicStr = strToMnemonic(data);
console.log("Mnemonic:", mnemonicStr);

try {
  const decodedData = mnemonicToStr(mnemonicStr);
  console.log("Decoded data:", decodedData);
} catch (err) {
  if (err instanceof ChecksumError) {
    console.error("Checksum error!");
  } else {
    console.error("Other error:", err);
  }
}
