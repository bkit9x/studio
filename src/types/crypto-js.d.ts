
declare module 'crypto-js' {
  import { Lib } from 'crypto-js';

  export interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: Encoder): string;
    concat(wordArray: WordArray): WordArray;
    clamp(): void;
    clone(): WordArray;
  }

  export interface Encoder {
    stringify(wordArray: WordArray): string;
    parse(str: string): WordArray;
  }

  export const enc: {
    Hex: Encoder;
    Latin1: Encoder;
    Utf8: Encoder;
    Utf16: Encoder;
    Utf16BE: Encoder;
    Utf16LE: Encoder;
    Base64: Encoder;
  };

  export function AES.encrypt(message: string | WordArray, key: string | WordArray, cfg?: object): WordArray;
  export function AES.decrypt(ciphertext: string | WordArray, key: string | WordArray, cfg?: object): WordArray;

  // Add other exports from crypto-js as needed
}
