/**
 * Online Music & Server API Service for Listen-X Web.
 * Connects to JioSaavn API (with direct DES-320kbps decryptor),
 * LRCLIB (for live synced lyrics), and Listen-X Laptop Server (D:\music).
 */

import { getStreamUrl } from '../crypto/des.js';
import { LrcParser } from './lrcParser.js';
import { storage } from './storage.js';

class ApiService {
  constructor() {
    this.corsProxies = [
      url => `/api/proxy?url=${encodeURIComponent(url)}`, // Local Listen-X server proxy
      url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
    ];
    this.memoryCache = new Map();
  }

  /**
   * Helper to execute fetch with automatic CORS proxy fallback.
   */
  async fetchWithProxyFallback(url, options = {}) {
    // 1. Try direct fetch first
    try {
      const resp = await fetch(url, { ...options, mode: 'cors' });
      if (resp.ok) {
        return await resp.text();
      }
    } catch (e) {
      // Direct fetch failed (likely CORS or network), proceed to proxy chain
    }

    // 2. Iterate proxy candidates
    for (const proxyFn of this.corsProxies) {
      try {
        const proxiedUrl = proxyFn(url);
        const resp = await fetch(proxiedUrl, { ...options });
        if (resp.ok) {
          return await resp.text();
        }
      } catch (e) {
        // Try next proxy
      }
    }
    return null;
  }

  cleanHtml(str) {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  parseSongObject(obj, trackNumber = 1) {
    try {
      const rawEncryptedUrl = obj.encrypted_media_url || '';
      const stream320 = getStreamUrl(rawEncryptedUrl, '320');
      const previewUrl = obj.media_preview_url || '';
      let finalStreamUrl = stream320 || previewUrl;

      // If we only have preview URL, try to upgrade it from _96_p.mp4 to 320kbps CDN or use as is
      if (!finalStreamUrl) return null;

      const rawTitle = obj.song || obj.title || 'Unknown Title';
      const rawArtist = obj.singers || obj.primary_artists || 'Unknown Artist';
      const rawAlbum = obj.album || 'Single';
      const rawImage = obj.image || '';

      const cleanTitle = this.cleanHtml(rawTitle);
      const cleanArtist = this.cleanHtml(rawArtist);
      const cleanAlbum = this.cleanHtml(rawAlbum);
      const largeImage = rawImage ? rawImage.replace('150x150', '500x500') : '';

      const durationSec = parseInt(obj.duration || '0', 10) || 0;
      const songId = 'online_' + (obj.id || Math.random().toString(36).substring(2, 9));

      return {
        id: songId,
        rawId: obj.id || '',
        title: cleanTitle,
        artist: cleanArtist,
        album: cleanAlbum,
        durationMs: durationSec * 1000,
        streamUrl: finalStreamUrl,
        artworkUri: largeImage || 'assets/favicon.svg',
        mimeType: 'audio/mp4',
        trackNumber: trackNumber,
        isOnline: true,
        encryptedMediaUrl: rawEncryptedUrl
      };
    } catch (e) {
      console.error('Error parsing song object:', e);
      return null;
    }
  }

  /**
   * Searches songs via backend /api/search or fallback JioSaavn API.
   */
  async searchSongs(query, limit = 30, page = 1) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cacheKey = `search_${trimmed.toLowerCase()}_${limit}_${page}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // 1. Try local backend server first (ultra-fast, zero CORS issues on Render)
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=${limit}&page=${page}`);
      if (resp.ok) {
        const songs = await resp.json();
        if (Array.isArray(songs) && songs.length > 0) {
          this.memoryCache.set(cacheKey, songs);
          return songs;
        }
      }
    } catch (e) {
      // Backend /api/search unavailable, proceed to client fallback
    }

    // 2. Direct / Proxy Fallback
    try {
      const encodedQuery = encodeURIComponent(trimmed);
      const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&n=${limit}&p=${page}&q=${encodedQuery}`;
      const responseText = await this.fetchWithProxyFallback(url);
      if (!responseText) return [];

      const data = JSON.parse(responseText);
      const results = data.results || [];
      const songs = [];

      for (let i = 0; i < results.length; i++) {
        const item = this.parseSongObject(results[i], (page - 1) * limit + i + 1);
        if (item) songs.push(item);
      }

      this.memoryCache.set(cacheKey, songs);
      return songs;
    } catch (e) {
      console.error('Search API error:', e);
      return [];
    }
  }

  /**
   * Dynamic Catalog pools matching the Android app's OnlineMusicRepository.kt
   */
  async getTrendingSongs(genre = 'Trending', page = 1, refreshSeed = 0) {
    // 1. Try backend server first (ultra-fast server-to-server fetch)
    try {
      const resp = await fetch(`/api/trending?genre=${encodeURIComponent(genre)}&page=${page}&seed=${refreshSeed}`);
      if (resp.ok) {
        const songs = await resp.json();
        if (Array.isArray(songs) && songs.length > 0) {
          return songs;
        }
      }
    } catch (e) {
      // Backend endpoint unavailable, proceed to client-side catalog
    }
    const haryanviCatalog = [
      'masoom sharma hits', 'gulzaar chhaniwala hits', 'renuka panwar hits',
      'amit saini rohtakiya hits', 'kd desi rock songs', 'diler kharkiya hits',
      'sapna choudhary dance hits', 'khasa aala chahar songs', 'ajay hooda haryanvi',
      'sumit goswami songs', '52 gaj ka daman', 'bahu kale ki', 'haryanvi top 50',
      'haryanvi viral reel songs', 'desi records haryanvi', 'bintu pabra kp kundu'
    ];

    const bollywoodCatalog = [
      'latest bollywood songs 2026', 'arijit singh romantic hits', 'shreya ghoshal superhits',
      'atif aslam soulful hits', 'bollywood dance party', 'jubin nautiyal hits',
      'bollywood top 50 chartbusters', 'bollywood 90s golden hits', 'pritam musical hits',
      'badshah party anthems', 'yo yo honey singh hits'
    ];

    const punjabiCatalog = [
      'sidhu moosewala immortal hits', 'karan aujla superhits', 'diljit dosanjh chartbusters',
      'ap dhillon brown munde', 'shubh still rollin hits', 'punjabi top 50 2026',
      'amrit maan hits', 'b praak soulful hits', 'jass manak hits', 'latest punjabi songs'
    ];

    const popCatalog = [
      'billboard hot 100', 'international pop hits 2026', 'viral english pop',
      'taylor swift hits', 'ed sheeran acoustic', 'the weeknd top hits', 'dua lipa dance pop'
    ];

    const lofiCatalog = [
      'lofi chill hindi', 'bollywood lofi mix', 'night vibes lofi',
      'punjabi lofi chill', 'aesthetic midnight lofi', 'rainy day lofi hindi'
    ];

    const taste = storage.getSettings().musicTaste || {};
    let queryPool;

    switch (genre.toLowerCase()) {
      case 'haryanvi':
        queryPool = haryanviCatalog;
        break;
      case 'bollywood':
        queryPool = bollywoodCatalog;
        break;
      case 'punjabi':
        queryPool = punjabiCatalog;
        break;
      case 'pop':
        queryPool = popCatalog;
        break;
      case 'lofi':
        queryPool = lofiCatalog;
        break;
      default: {
        const dynamicTrending = [
          'trending songs hindi 2026', 'latest bollywood songs', 'viral hits india',
          'top hindi songs', 'party hits hindi', 'masoom sharma hits', 'karan aujla hits',
          'arijit singh songs', 'sidhu moosewala hits'
        ];
        if (taste.singers && taste.singers.length > 0) {
          taste.singers.forEach(s => dynamicTrending.unshift(`${s} top hits`));
        }
        if (taste.languages && taste.languages.length > 0) {
          taste.languages.forEach(l => dynamicTrending.push(`top ${l} songs`));
        }
        queryPool = dynamicTrending;
        break;
      }
    }

    const poolSize = queryPool.length;
    const baseIndex = Math.abs(refreshSeed * 7 + (page - 1) * 2) % poolSize;
    const query1 = queryPool[baseIndex];
    const query2 = queryPool[(baseIndex + 1) % poolSize];

    const [results1, results2] = await Promise.all([
      this.searchSongs(query1, 20, 1),
      this.searchSongs(query2, 20, 1)
    ]);

    const combined = [];
    const seenIds = new Set();
    const maxLen = Math.max(results1.length, results2.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < results1.length && !seenIds.has(results1[i].id)) {
        seenIds.add(results1[i].id);
        combined.push(results1[i]);
      }
      if (i < results2.length && !seenIds.has(results2[i].id)) {
        seenIds.add(results2[i].id);
        combined.push(results2[i]);
      }
    }

    return combined;
  }

  /**
   * Fetches lyrics from LRCLIB (synced) with fallback to JioSaavn lyrics.
   */
  async getLyrics(song) {
    if (!song) return null;

    const cleanTitle = song.title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = song.artist.split(/[,&/]/)[0].trim();
    const durationSec = Math.round((song.durationMs || 0) / 1000);

    // 1. Try LRCLIB exact & search lookup (Native CORS enabled)
    try {
      const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}` +
        (durationSec > 10 ? `&duration=${durationSec}` : '');
      const resp = await fetch(lrclibUrl);
      if (resp.ok) {
        const json = await resp.json();
        if (json.syncedLyrics) {
          const lines = LrcParser.parseLrc(json.syncedLyrics);
          if (lines.length > 0) {
            return {
              isSynced: true,
              lines: lines,
              plainText: json.plainLyrics || lines.map(l => l.text).join('\n'),
              source: 'LRCLIB Synced'
            };
          }
        } else if (json.plainLyrics) {
          return {
            isSynced: false,
            lines: LrcParser.parsePlainText(json.plainLyrics),
            plainText: json.plainLyrics,
            source: 'LRCLIB Plain'
          };
        }
      }
    } catch (e) {
      // Continue to JioSaavn fallback
    }

    // 2. JioSaavn Lyrics API Fallback
    try {
      const rawId = song.rawId || (song.id.startsWith('online_') ? song.id.replace('online_', '') : null);
      if (rawId) {
        const saavnLyricsUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&lyrics_id=${rawId}&ctx=web6dot0&api_version=4&_format=json`;
        const respText = await this.fetchWithProxyFallback(saavnLyricsUrl);
        if (respText) {
          const data = JSON.parse(respText);
          if (data && data.lyrics) {
            const rawLyrics = this.cleanHtml(data.lyrics).replace(/<br\s*\/?>/gi, '\n');
            const lines = LrcParser.parsePlainText(rawLyrics);
            return {
              isSynced: false,
              lines: lines,
              plainText: rawLyrics,
              source: 'JioSaavn Official'
            };
          }
        }
      }
    } catch (e) {
      console.warn('Lyrics fallback failed:', e);
    }

    return null;
  }

  /**
   * Fetches laptop library from Listen-X Python Server (D:\music).
   */
  async getLaptopSongs(serverUrl = 'http://localhost:8080') {
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanUrl}/api/songs`);
      if (resp.ok) {
        const songs = await resp.json();
        return songs.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album,
          durationMs: s.durationMs || 180000,
          streamUrl: s.streamUrl,
          artworkUri: s.artworkUri,
          mimeType: s.mimeType || 'audio/mpeg',
          isLaptop: true
        }));
      }
    } catch (e) {
      console.warn('Could not connect to laptop server:', e);
    }
    return [];
  }
}

export const api = new ApiService();
