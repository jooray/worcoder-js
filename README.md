# worcoder-js

A JavaScript library for converting an arbitrary string into a sequence of mnemonic words and back, with an RS1024 checksum appended to detect errors.

Python version: [worcoder](https://github.com/jooray/worcoder)
Progressive Web App: [deployed](https://cypherpunk.today/theworcoder/index.html), source:[theworcoder-pwa](https://github.com/jooray/theworcoder-pwa)
Desktop app: [theworcoder-desktop](https://github.com/jooray/theworcoder-desktop)

## Overview

`worcoder-js` allows you to encode any string (ASCII or UTF-8) into a sequence of mnemonic words, based on [SLIP-0039](https://github.com/satoshilabs/slips/blob/master/slip-0039.md) wordlist and encoding. The library appends a three-word checksum to the mnemonic to ensure data integrity during decoding. If the checksum verification fails during decoding, an error is thrown to indicate that the mnemonic has been tampered with or is invalid.

## Installation

(TODO: Not yet published in npm)

Ensure you have [Node.js](https://nodejs.org/) installed. Then, install `worcoder-js` using [npm](https://www.npmjs.com/):

```bash
npm install worcoder-js
```

Alternatively, if you're using [Yarn](https://yarnpkg.com/):

```bash
yarn add worcoder-js
```

## Usage

After installation, you can use `worcoder-js` in your project as follows:

```javascript
import {
  strToWords,
  wordsToStr,
  strToMnemonic,
  mnemonicToStr,
  cleanupMnemonic,
  heuristicMnemonic,
  heuristicWord
} from "worcoder-js"; // Adjust the import path if necessary

const data = "Hello, World!";

// Convert string -> array of words
const wordList = strToWords(data);
console.log("Word List:", wordList);
// Output: Word List: [ 'hello', 'world', '...' ] // Example output

// Convert array of words -> original string
const restored = wordsToStr(wordList);
console.log("Restored:", restored);
// Output: Restored: Hello, World!

// Convert string -> single mnemonic string
const mnemonicString = strToMnemonic(data);
console.log("Mnemonic:", mnemonicString);

// Clean up a potentially messy mnemonic string before decoding
const messyMnemonic = "  Beyond, Gray-Strategy.
Fitness,, Lunch   Grownup Review!";
const cleanedMnemonic = cleanupMnemonic(messyMnemonic);
console.log("Cleaned Mnemonic:", cleanedMnemonic);
// Output: Cleaned Mnemonic: beyond gray strategy fitness lunch grownup review

// Use heuristic to fix unknown words
const fixedMnemonic = heuristicMnemonic(messyMnemonic);
console.log("Fixed Mnemonic:", fixedMnemonic);
// Output: Fixed Mnemonic: beyond gray strategy spit lunch grownup review

// Alternatively, apply heuristic word by word
const fixedMnemonicWords = cleanedMnemonic.split(' ').map(word => heuristicWord(word)).join(' ');
console.log("Fixed Mnemonic (Word-by-Word):", fixedMnemonicWords);
// Output: Fixed Mnemonic (Word-by-Word): beyond gray strategy spit lunch grownup review

// Convert single mnemonic string -> original string
try {
  const restoredAgain = mnemonicToStr(fixedMnemonic);
  console.log("Restored Again:", restoredAgain);
  // Output: Restored Again: Beyond Gray Strategy Spit Lunch Grownup Review
} catch (err) {
  if (err.message.includes("ChecksumError")) {
    console.error("Checksum error!");
  } else {
    console.error("Other error:", err);
  }
}
```

### Cleanup Function

Before decoding a mnemonic, it's good practice to clean it up to ensure consistency and prevent errors due to formatting issues. The `cleanupMnemonic` function performs the following operations:

- Strips whitespace from the beginning and end.
- Replaces newlines with spaces.
- Replaces multiple spaces with a single space.
- Converts all characters to lowercase.
- Removes "-", ".", and ",".
- Handles specific replacements such as:
  - `"and force"` → `"enforce"`
  - `"and large"` → `"enlarge"`
  - `"and less"` → `"endless"`
  - `"and joy"` → `"enjoy"`
  - `"fit"` → `"spit"`
  - `"implies"` → `"imply"`

### Heuristic Functions

#### `heuristicWord(word: string): string`

Applies a heuristic to correct an individual unknown or misspelled word by finding a similar word from the wordlist.

**Parameters:**

- `word` - The word to correct.

**Returns:**

- A corrected word from the wordlist if a similar word is found; otherwise, returns the original word.

**Example:**

```javascript
const fixedWord = heuristicWord("implies");
console.log(fixedWord); // Output: "imply"

const fixedWord2 = heuristicWord("and joy");
console.log(fixedWord2); // Output: "enjoy"

const fixedWord3 = heuristicWord("unknownword");
console.log(fixedWord3); // Output: "unknownword" // No similar word found
```

#### `heuristicMnemonic(mnemonic: string): string`

Cleans up the mnemonic string and applies heuristics to correct any unknown words by utilizing the `heuristicWord` function.

**Parameters:**

- `mnemonic` - The mnemonic string to correct.

**Returns:**

- A cleaned and corrected mnemonic string.

**Example:**

```javascript
const messyMnemonic = "  Beyond, Gray-Strategy.
Fitness,, Lunch   Grownup Review!";
const fixedMnemonic = heuristicMnemonic(messyMnemonic);
console.log("Fixed Mnemonic:", fixedMnemonic);
// Output: Fixed Mnemonic: beyond gray strategy spit lunch grownup review
```

## API Reference

### `strToWords(str: string): string[]`

Converts a string to an array of mnemonic words, appending a checksum.

**Parameters:**

- `str` - The input string to encode.

**Returns:**

- An array of mnemonic words representing the encoded string.

### `wordsToStr(words: string[]): string`

Converts an array of mnemonic words back to the original string after verifying the checksum.

**Parameters:**

- `words` - The array of mnemonic words to decode.

**Returns:**

- The original decoded string.

**Throws:**

- `Error` if the checksum is invalid or if any word is not found in the wordlist.

### `strToMnemonic(str: string): string`

Converts a string to a single space-delimited mnemonic string, including the checksum.

**Parameters:**

- `str` - The input string to encode.

**Returns:**

- A single string containing the mnemonic words separated by spaces.

### `mnemonicToStr(mnemonic: string): string`

Converts a single space-delimited mnemonic string back to the original string after verifying the checksum.

**Parameters:**

- `mnemonic` - The mnemonic string to decode.

**Returns:**

- The original decoded string.

**Throws:**

- `Error` if the checksum is invalid or if any word is not found in the wordlist.

### `cleanupMnemonic(mnemonic: string): string`

Cleans up the input mnemonic string by normalizing its format and applying specific replacements to correct common encoding issues.

**Parameters:**

- `mnemonic` - The mnemonic string to clean up.

**Returns:**

- A cleaned-up mnemonic string.

### `heuristicWord(word: string): string`

Applies a heuristic to correct an individual unknown or misspelled word by finding a similar word from the wordlist.

**Parameters:**

- `word` - The word to correct.

**Returns:**

- A corrected word from the wordlist if a similar word is found; otherwise, returns the original word.

**Example:**

```javascript
const fixedWord = heuristicWord("implies");
console.log(fixedWord); // Output: "imply"

const fixedWord2 = heuristicWord("and joy");
console.log(fixedWord2); // Output: "enjoy"

const fixedWord3 = heuristicWord("unknownword");
console.log(fixedWord3); // Output: "unknownword" // No similar word found
```

### `heuristicMnemonic(mnemonic: string): string`

Cleans up the mnemonic string and applies heuristics to correct any unknown words by utilizing the `heuristicWord` function.

**Parameters:**

- `mnemonic` - The mnemonic string to correct.

**Returns:**

- A cleaned and corrected mnemonic string.

**Example:**

```javascript
const messyMnemonic = "  Beyond, Gray-Strategy.
Fitness,, Lunch   Grownup Review!";
const fixedMnemonic = heuristicMnemonic(messyMnemonic);
console.log("Fixed Mnemonic:", fixedMnemonic);
// Output: Fixed Mnemonic: beyond gray strategy spit lunch grownup review
```

## Error Handling

If the mnemonic has been tampered with or contains invalid words, decoding functions (`wordsToStr` and `mnemonicToStr`) will throw an error indicating a checksum mismatch or invalid word. It's recommended to handle these errors gracefully in your application.

**Example:**

```javascript
try {
  const originalString = mnemonicToStr("invalid mnemonic words here");
  console.log("Original String:", originalString);
} catch (err) {
  if (err.message.includes("ChecksumError")) {
    console.error("Checksum error! The mnemonic may be invalid or corrupted.");
  } else {
    console.error("An error occurred during decoding:", err);
  }
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, features, or improvements.

## License

MIT License. See [LICENSE](./LICENSE) for more details.
