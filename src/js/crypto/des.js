/**
 * Pure JavaScript DES-ECB Decryptor for JioSaavn encrypted CDN media URLs.
 * Replicates JioSaavnDecryptor.kt exactly using the fixed DES secret key "38346591".
 * Zero dependencies, pure browser and node compatible.
 */

// Standard DES Tables
const PC1 = [
  57, 49, 41, 33, 25, 17,  9,  1, 58, 50, 42, 34, 26, 18,
  10,  2, 59, 51, 43, 35, 27, 19, 11,  3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,  7, 62, 54, 46, 38, 30, 22,
  14,  6, 61, 53, 45, 37, 29, 21, 13,  5, 28, 20, 12,  4
];

const PC2 = [
  14, 17, 11, 24,  1,  5,  3, 28, 15,  6, 21, 10,
  23, 19, 12,  4, 26,  8, 16,  7, 27, 20, 13,  2,
  41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
];

const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

const IP = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17,  9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7
];

const FP = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41,  9, 49, 17, 57, 25
];

const E = [
  32,  1,  2,  3,  4,  5,  4,  5,  6,  7,  8,  9,
   8,  9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32,  1
];

const P = [
  16,  7, 20, 21, 29, 12, 28, 17,  1, 15, 23, 26,  5, 18, 31, 10,
   2,  8, 24, 14, 32, 27,  3,  9, 19, 13, 30,  6, 22, 11,  4, 25
];

const S = [
  [
    14,  4, 13,  1,  2, 15, 11,  8,  3, 10,  6, 12,  5,  9,  0,  7,
     0, 15,  7,  4, 14,  2, 13,  1, 10,  6, 12, 11,  9,  5,  3,  8,
     4,  1, 14,  8, 13,  6,  2, 11, 15, 12,  9,  7,  3, 10,  5,  0,
    15, 12,  8,  2,  4,  9,  1,  7,  5, 11,  3, 14, 10,  0,  6, 13
  ],
  [
    15,  1,  8, 14,  6, 11,  3,  4,  9,  7,  2, 13, 12,  0,  5, 10,
     3, 13,  4,  7, 15,  2,  8, 14, 12,  0,  1, 10,  6,  9, 11,  5,
     0, 14,  7, 11, 10,  4, 13,  1,  5,  8, 12,  6,  9,  3,  2, 15,
    13,  8, 10,  1,  3, 15,  4,  2, 11,  6,  7, 12,  0,  5, 14,  9
  ],
  [
    10,  0,  9, 14,  6,  3, 15,  5,  1, 13, 12,  7, 11,  4,  2,  8,
    13,  7,  0,  9,  3,  4,  6, 10,  2,  8,  5, 14, 12, 11, 15,  1,
    13,  6,  4,  9,  8, 15,  3,  0, 11,  1,  2, 12,  5, 10, 14,  7,
     1, 10, 13,  0,  6,  9,  8,  7,  4, 15, 14,  3, 11,  5,  2, 12
  ],
  [
     7, 13, 14,  3,  0,  6,  9, 10,  1,  2,  8,  5, 11, 12,  4, 15,
    13,  8, 11,  5,  6, 15,  0,  3,  4,  7,  2, 12,  1, 10, 14,  9,
    10,  6,  9,  0, 12, 11,  7, 13, 15,  1,  3, 14,  5,  2,  8,  4,
     3, 15,  0,  6, 10,  1, 13,  8,  9,  4,  5, 11, 12,  7,  2, 14
  ],
  [
     2, 12,  4,  1,  7, 10, 11,  6,  8,  5,  3, 15, 13,  0, 14,  9,
    14, 11,  2, 12,  4,  7, 13,  1,  5,  0, 15, 10,  3,  9,  8,  6,
     4,  2,  1, 11, 10, 13,  7,  8, 15,  9, 12,  5,  6,  3,  0, 14,
    11,  8, 12,  7,  1, 14,  2, 13,  6, 15,  0,  9, 10,  4,  5,  3
  ],
  [
    12,  1, 10, 15,  9,  2,  6,  8,  0, 13,  3,  4, 14,  7,  5, 11,
    10, 15,  4,  2,  7, 12,  9,  5,  6,  1, 13, 14,  0, 11,  3,  8,
     9, 14, 15,  5,  2,  8, 12,  3,  7,  0,  4, 10,  1, 13, 11,  6,
     4,  3,  2, 12,  9,  5, 15, 10, 11, 14,  1,  7,  6,  0,  8, 13
  ],
  [
     4, 11,  2, 14, 15,  0,  8, 13,  3, 12,  9,  7,  5, 10,  6,  1,
    13,  0, 11,  7,  4,  9,  1, 10, 14,  3,  5, 12,  2, 15,  8,  6,
     1,  4, 11, 13, 12,  3,  7, 14, 10, 15,  6,  8,  0,  5,  9,  2,
     6, 11, 13,  8,  1,  4, 10,  7,  9,  5,  0, 15, 14,  2,  3, 12
  ],
  [
    13,  2,  8,  4,  6, 15, 11,  1, 10,  9,  3, 14,  5,  0, 12,  7,
     1, 15, 13,  8, 10,  3,  7,  4, 12,  5,  6, 11,  0, 14,  9,  2,
     7, 11,  4,  1,  9, 12, 14,  2,  0,  6, 10, 13, 15,  3,  5,  8,
     2,  1, 14,  7,  4, 10,  8, 13, 15, 12,  9,  0,  3,  5,  6, 11
  ]
];

function getBit(bytes, bitPos) {
  const byteIdx = (bitPos - 1) >> 3;
  const bitOffset = 7 - ((bitPos - 1) & 7);
  return (bytes[byteIdx] >> bitOffset) & 1;
}

function generateSubkeys(keyBytes) {
  let c = 0, d = 0;
  for (let i = 0; i < 28; i++) {
    c = (c << 1) | getBit(keyBytes, PC1[i]);
  }
  for (let i = 28; i < 56; i++) {
    d = (d << 1) | getBit(keyBytes, PC1[i]);
  }

  const subkeys = [];
  for (let round = 0; round < 16; round++) {
    const shift = SHIFTS[round];
    c = ((c << shift) | (c >>> (28 - shift))) & 0x0FFFFFFF;
    d = ((d << shift) | (d >>> (28 - shift))) & 0x0FFFFFFF;

    const cdCombined = [
      (c >>> 20) & 0xFF, (c >>> 12) & 0xFF, (c >>> 4) & 0xFF,
      ((c & 0x0F) << 4) | ((d >>> 24) & 0x0F),
      (d >>> 16) & 0xFF, (d >>> 8) & 0xFF, d & 0xFF
    ];

    const k = new Uint8Array(6);
    for (let i = 0; i < 48; i++) {
      const bit = getBit(cdCombined, PC2[i]);
      k[i >> 3] |= (bit << (7 - (i & 7)));
    }
    subkeys.push(k);
  }
  return subkeys;
}

function desBlock(block8, subkeys, isDecrypt) {
  let l = 0, r = 0;
  for (let i = 0; i < 32; i++) {
    l = (l << 1) | getBit(block8, IP[i]);
    r = (r << 1) | getBit(block8, IP[i + 32]);
  }

  for (let round = 0; round < 16; round++) {
    const k = subkeys[isDecrypt ? (15 - round) : round];
    const rBytes = [
      (r >>> 24) & 0xFF, (r >>> 16) & 0xFF, (r >>> 8) & 0xFF, r & 0xFF
    ];

    const er = new Uint8Array(6);
    for (let i = 0; i < 48; i++) {
      const bit = getBit(rBytes, E[i]);
      er[i >> 3] |= (bit << (7 - (i & 7)));
    }

    for (let i = 0; i < 6; i++) {
      er[i] ^= k[i];
    }

    let sOut = 0;
    for (let i = 0; i < 8; i++) {
      const bitIdx = i * 6;
      const b0 = (er[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
      const b1 = (er[(bitIdx + 1) >> 3] >> (7 - ((bitIdx + 1) & 7))) & 1;
      const b2 = (er[(bitIdx + 2) >> 3] >> (7 - ((bitIdx + 2) & 7))) & 1;
      const b3 = (er[(bitIdx + 3) >> 3] >> (7 - ((bitIdx + 3) & 7))) & 1;
      const b4 = (er[(bitIdx + 4) >> 3] >> (7 - ((bitIdx + 4) & 7))) & 1;
      const b5 = (er[(bitIdx + 5) >> 3] >> (7 - ((bitIdx + 5) & 7))) & 1;

      const row = (b0 << 1) | b5;
      const col = (b1 << 3) | (b2 << 2) | (b3 << 1) | b4;
      const val = S[i][row * 16 + col];
      sOut = (sOut << 4) | val;
    }

    const sBytes = [
      (sOut >>> 24) & 0xFF, (sOut >>> 16) & 0xFF, (sOut >>> 8) & 0xFF, sOut & 0xFF
    ];
    let fVal = 0;
    for (let i = 0; i < 32; i++) {
      fVal = (fVal << 1) | getBit(sBytes, P[i]);
    }

    const nextR = (l ^ fVal) >>> 0;
    l = r;
    r = nextR;
  }

  const preFP = [
    (r >>> 24) & 0xFF, (r >>> 16) & 0xFF, (r >>> 8) & 0xFF, r & 0xFF,
    (l >>> 24) & 0xFF, (l >>> 16) & 0xFF, (l >>> 8) & 0xFF, l & 0xFF
  ];

  const out = new Uint8Array(8);
  for (let i = 0; i < 64; i++) {
    const bit = getBit(preFP, FP[i]);
    out[i >> 3] |= (bit << (7 - (i & 7)));
  }
  return out;
}

// Convert Base64 string to Uint8Array in browser or node
function base64ToUint8Array(base64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64.trim(), 'base64'));
  }
  const binaryString = atob(base64.trim());
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fixed JioSaavn key: "38346591" (8 ASCII bytes)
const JIOSAAVN_KEY = new Uint8Array([51, 56, 51, 52, 54, 53, 57, 49]);
const PRECOMPUTED_SUBKEYS = generateSubkeys(JIOSAAVN_KEY);
const QUALITY_REGEX = /_(96|160|320)\.mp4/g;

export function decryptJioSaavn(encryptedUrl) {
  if (!encryptedUrl || typeof encryptedUrl !== 'string') return null;
  try {
    const data = base64ToUint8Array(encryptedUrl);
    if (!data || data.length === 0 || data.length % 8 !== 0) return null;

    const outBytes = [];
    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      const dec = desBlock(block, PRECOMPUTED_SUBKEYS, true);
      for (let b of dec) outBytes.push(b);
    }

    // PKCS5 unpad
    const padLen = outBytes[outBytes.length - 1];
    if (padLen >= 1 && padLen <= 8) {
      outBytes.splice(outBytes.length - padLen, padLen);
    }

    const decoder = new TextDecoder('utf-8');
    return decoder.decode(new Uint8Array(outBytes)).trim();
  } catch (e) {
    console.error('DES decryption error:', e);
    return null;
  }
}

export function getStreamUrl(encryptedUrl, quality = '320') {
  const decrypted = decryptJioSaavn(encryptedUrl);
  if (!decrypted) return null;
  const targetQuality = quality === '160' ? '_160.mp4' : quality === '96' ? '_96.mp4' : '_320.mp4';
  return decrypted.replace(QUALITY_REGEX, targetQuality);
}
