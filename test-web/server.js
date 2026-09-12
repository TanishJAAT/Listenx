const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { Readable } = require('stream');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Pure JavaScript DES Decryptor for JioSaavn Audio URLs ---
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

const SBOXES = [
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

const P = [
  16,  7, 20, 21, 29, 12, 28, 17,  1, 15, 23, 26,  5, 18, 31, 10,
   2,  8, 24, 14, 32, 27,  3,  9, 19, 13, 30,  6, 22, 11,  4, 25
];

function permute(src, table) {
  const out = [];
  for (let i = 0; i < table.length; i++) {
    out.push(src[table[i] - 1]);
  }
  return out;
}

function leftShift(arr, n) {
  return arr.slice(n).concat(arr.slice(0, n));
}

function xor(a, b) {
  const out = [];
  for (let i = 0; i < a.length; i++) {
    out.push(a[i] ^ b[i]);
  }
  return out;
}

function bytesToBits(bytes) {
  const bits = [];
  for (let i = 0; i < bytes.length; i++) {
    for (let b = 7; b >= 0; b--) {
      bits.push((bytes[i] >> b) & 1);
    }
  }
  return bits;
}

function bitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i + b];
    }
    bytes.push(byte);
  }
  return bytes;
}

function generateSubkeys(keyBytes) {
  const keyBits = bytesToBits(keyBytes);
  const pc1 = permute(keyBits, PC1);
  let c = pc1.slice(0, 28);
  let d = pc1.slice(28, 56);
  const subkeys = [];

  for (let i = 0; i < 16; i++) {
    c = leftShift(c, SHIFTS[i]);
    d = leftShift(d, SHIFTS[i]);
    subkeys.push(permute(c.concat(d), PC2));
  }
  return subkeys;
}

function desBlock(blockBits, subkeys) {
  const ip = permute(blockBits, IP);
  let l = ip.slice(0, 32);
  let r = ip.slice(32, 64);

  for (let round = 0; round < 16; round++) {
    const k = subkeys[round];
    const er = permute(r, E);
    const x = xor(er, k);

    const sOutput = [];
    for (let i = 0; i < 8; i++) {
      const chunk = x.slice(i * 6, (i + 1) * 6);
      const row = (chunk[0] << 1) | chunk[5];
      const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
      const val = SBOXES[i][row * 16 + col];
      for (let b = 3; b >= 0; b--) {
        sOutput.push((val >> b) & 1);
      }
    }

    const f = permute(sOutput, P);
    const newR = xor(l, f);
    l = r;
    r = newR;
  }

  return permute(r.concat(l), FP);
}

function decryptDesEcb(cipherBytes, keyBytes) {
  const subkeys = generateSubkeys(keyBytes).reverse();
  const outBytes = [];

  for (let i = 0; i < cipherBytes.length; i += 8) {
    const block = cipherBytes.slice(i, i + 8);
    const bits = bytesToBits(block);
    const decBits = desBlock(bits, subkeys);
    outBytes.push(...bitsToBytes(decBits));
  }

  const pad = outBytes[outBytes.length - 1];
  if (pad >= 1 && pad <= 8) {
    return Buffer.from(outBytes.slice(0, outBytes.length - pad)).toString('utf8');
  }
  return Buffer.from(outBytes).toString('utf8');
}

function decryptJioSaavnUrl(encUrl) {
  if (!encUrl) return null;
  try {
    const cipherBytes = Array.from(Buffer.from(encUrl, 'base64'));
    const keyBytes = Array.from(Buffer.from('38346591', 'utf8'));
    return decryptDesEcb(cipherBytes, keyBytes);
  } catch (e) {
    return null;
  }
}

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatSongItem(song) {
  const decrypted = decryptJioSaavnUrl(song.encrypted_media_url);
  const rawUrl = decrypted || song.media_preview_url || '';
  
  // Format high-quality direct streaming links
  let stream320 = null;
  let stream160 = null;
  let stream96 = null;

  if (decrypted) {
    stream320 = decrypted.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_320.mp4');
    stream160 = decrypted.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_160.mp4');
    stream96 = decrypted.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_96.mp4');
  }

  return {
    id: song.id,
    title: cleanHtml(song.song || song.title || 'Unknown Title'),
    album: cleanHtml(song.album || 'Single'),
    artist: cleanHtml(song.singers || song.primary_artists || song.artist || 'Unknown Artist'),
    image_thumb: song.image ? song.image.replace('150x150', '150x150') : '',
    image_large: song.image ? song.image.replace('150x150', '500x500') : '',
    year: song.year || '',
    duration: parseInt(song.duration || 0),
    language: song.language || 'Hindi',
    has_320kbps: song['320kbps'] === 'true' || song['320kbps'] === true,
    stream_url_320: stream320,
    stream_url_160: stream160,
    stream_url_96: stream96,
    active_stream: stream320 || stream160 || rawUrl,
    raw_api_source: {
      provider: "JioSaavn Core Library",
      encrypted_url_present: Boolean(song.encrypted_media_url),
      decrypted_successfully: Boolean(decrypted)
    }
  };
}

const memoryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min fast memory cache

async function searchSongs(query, limit = 24, page = 1) {
  const cacheKey = `${query.toLowerCase()}_${limit}_${page}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&n=${limit}&p=${page}&q=${encodeURIComponent(query)}`;
  const resp = await fetch(saavnUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    signal: AbortSignal.timeout(6000)
  });
  if (!resp.ok) {
    throw new Error(`JioSaavn API HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const results = data.results || [];
  const formatted = results.map(formatSongItem);

  if (formatted.length > 0) {
    memoryCache.set(cacheKey, { timestamp: Date.now(), data: formatted });
  }
  return formatted;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // --- API Routes ---
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      system: 'Listen-X Isolated Music Test Environment',
      library_source: 'JioSaavn Core (Official CDN & Audio Streamer)',
      des_decryptor: 'Pure JS (Zero External Dependencies)',
      port: PORT,
      time: new Date().toISOString()
    }));
    return;
  }

  if (pathname === '/api/search') {
    const query = parsedUrl.query.q || '';
    const limit = parseInt(parsedUrl.query.limit || '24');
    const page = parseInt(parsedUrl.query.page || '1');

    if (!query.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Query parameter q is required' }));
      return;
    }

    try {
      const songs = await searchSongs(query, limit, page);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        query: query,
        page: page,
        count: songs.length,
        has_more: songs.length >= limit,
        songs: songs
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: err.message
      }));
    }
    return;
  }

// Fisher-Yates array shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const genrePools = {
  all: [
    'Latest Trending India', 'Top Hindi Hits', 'Chartbusters Hindi', 'Viral Hits India',
    'Punjabi Hits', 'Haryanvi Mashup', 'Arijit Singh Hits', 'Diljit Dosanjh',
    'Sidhu Moose Wala', 'Soulful Bollywood', 'Desi Pop Hits', 'Anuv Jain',
    'Bollywood Party Songs', 'New Bollywood Releases'
  ],
  hindi: [
    'Top Hindi Hits', 'Latest Bollywood Hits', 'Romantic Hindi Songs',
    'Bollywood Chartbusters', 'New Hindi Releases', '90s Evergreen Bollywood',
    'Soulful Hindi Melodies', 'Trending Bollywood'
  ],
  haryanvi: [
    'Top Haryanvi Songs', 'Diler Kharkiya', 'Masoom Sharma Hits',
    'Gulzaar Chhaniwala', 'Renuka Panwar', 'New Haryanvi Hits',
    'Bhole Ke Bhajan Haryanvi', 'Haryanvi Ragni Mashup'
  ],
  punjabi: [
    'Top Punjabi Songs', 'Diljit Dosanjh', 'Karan Aujla Hits',
    'Sidhu Moose Wala', 'Shubh', 'AP Dhillon', 'Latest Punjabi Hits',
    'B Praak', 'Ammy Virk'
  ],
  arijit: [
    'Arijit Singh Hits', 'Arijit Singh Romantic', 'Best of Arijit Singh',
    'Arijit Singh Soulful', 'Arijit Sad Songs', 'Arijit Singh Live'
  ],
  diljit: [
    'Diljit Dosanjh Hits', 'Ghost Diljit Dosanjh', 'MoonChild Era Diljit',
    'Diljit Dosanjh Punjabi', 'G.O.A.T. Diljit Dosanjh', 'Lover Diljit'
  ],
  romantic: [
    'Bollywood Romantic Songs', 'Soulful Love Songs', 'Romantic Melodies Hindi',
    'Acoustic Bollywood Love', 'Late Night Hindi Vibes', 'Heartfelt Hindi Songs'
  ]
};

  if (pathname === '/api/trending') {
    const genre = (parsedUrl.query.genre || 'all').toLowerCase();
    const limit = parseInt(parsedUrl.query.limit || '24');
    const page = parseInt(parsedUrl.query.page || '1');
    const pool = genrePools[genre] || genrePools['all'];

    let searchQuery;
    let apiPage = Math.floor((page - 1) / pool.length) + 1;

    if (page === 1) {
      // Pick a random seed term on every refresh for fresh mix
      const randomIndex = Math.floor(Math.random() * pool.length);
      searchQuery = pool[randomIndex];
      // Randomize page offset slightly (1 or 2) for maximum variety
      apiPage = Math.floor(Math.random() * 2) + 1;
    } else {
      const queryIndex = (page - 1) % pool.length;
      searchQuery = pool[queryIndex];
    }

    try {
      let songs = await searchSongs(searchQuery, limit, apiPage);
      if (!songs || songs.length === 0) {
        songs = await searchSongs(pool[0], limit, 1);
      }
      
      // Shuffle the songs so they are dynamically ordered on every request
      songs = shuffleArray(songs);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        genre: genre,
        query_used: searchQuery,
        page: page,
        count: songs.length,
        has_more: true,
        songs: songs
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- Personalized For-You Feed API ---
  if (pathname === '/api/for-you') {
    const rawLangs = parsedUrl.query.languages || 'Hindi,Punjabi,Haryanvi';
    const rawSingers = parsedUrl.query.singers || 'Arijit Singh,Diljit Dosanjh,Masoom Sharma';
    const limit = parseInt(parsedUrl.query.limit || '24');
    const page = parseInt(parsedUrl.query.page || '1');

    const langs = rawLangs.split(',').map(s => s.trim()).filter(Boolean);
    const singers = rawSingers.split(',').map(s => s.trim()).filter(Boolean);

    const queries = [];
    if (singers.length > 0) {
      const shuffledSingers = shuffleArray(singers);
      shuffledSingers.slice(0, 3).forEach(singer => {
        queries.push(`${singer} Hits`);
      });
    }
    if (langs.length > 0) {
      langs.forEach(lang => {
        queries.push(`Top ${lang} Songs`);
      });
    }
    if (queries.length === 0) {
      queries.push('Top Trending Hindi');
    }

    try {
      const selectedQuery = queries[(page - 1) % queries.length];
      const apiPage = Math.floor((page - 1) / queries.length) + 1;

      let songs = await searchSongs(selectedQuery, limit, apiPage);
      if (!songs || songs.length < 10) {
        const backup = await searchSongs(queries[0], limit, 1);
        songs = [...(songs || []), ...backup];
      }

      const seen = new Set();
      const deduped = [];
      for (const s of songs) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          deduped.push(s);
        }
      }

      const finalSongs = shuffleArray(deduped).slice(0, limit);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        type: 'for-you',
        query_used: selectedQuery,
        page: page,
        count: finalSongs.length,
        has_more: true,
        songs: finalSongs
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- Smart Song Radio / Recommendation API ---
  if (pathname === '/api/recommend') {
    const artist = (parsedUrl.query.artist || '').split(',')[0].split('&')[0].trim();
    const language = parsedUrl.query.language || '';
    const excludeId = parsedUrl.query.exclude_id || '';
    const limit = parseInt(parsedUrl.query.limit || '12');

    let query = artist;
    if (language && !artist.toLowerCase().includes(language.toLowerCase())) {
      query += ` ${language}`;
    }
    if (!query) query = 'Trending Hits';

    try {
      const allResults = await searchSongs(query, limit + 4, 1);
      const filtered = allResults.filter(s => s.id !== excludeId);
      const recommended = shuffleArray(filtered).slice(0, limit);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        base_artist: artist,
        query: query,
        count: recommended.length,
        songs: recommended
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- Direct Audio Download Pipe ---
  if (pathname === '/api/download') {
    const streamUrl = parsedUrl.query.url;
    let songName = (parsedUrl.query.name || 'ListenX_Track').replace(/[/\\?%*:|"<>]/g, '').trim();
    if (!songName) songName = 'Track';

    if (!streamUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing stream url');
      return;
    }

    try {
      const audioResp = await fetch(streamUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (!audioResp.ok) {
        res.writeHead(audioResp.status, { 'Content-Type': 'text/plain' });
        res.end('Audio source unavailable');
        return;
      }

      const contentType = audioResp.headers.get('content-type') || 'audio/mp4';
      const contentLength = audioResp.headers.get('content-length');

      const headers = {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${songName}.m4a"`,
        'Access-Control-Allow-Origin': '*'
      };
      if (contentLength) headers['Content-Length'] = contentLength;

      res.writeHead(200, headers);
      Readable.fromWeb(audioResp.body).pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Download failed: ' + err.message);
    }
    return;
  }

  // --- Static Files ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const extname = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🎵 Listen-X Isolated Music Test Server is running!`);
  console.log(`👉 Open in browser: http://localhost:${PORT}`);
  console.log(`📡 API Search: http://localhost:${PORT}/api/search?q=kesariya`);
  console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
  console.log('====================================================');
});
