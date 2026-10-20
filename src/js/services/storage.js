/**
 * Storage Service for Listen-X Web.
 * Persists favorites, playlists, play history, graphics settings,
 * custom wallpaper, equalizer presets, and user taste in localStorage.
 */

const STORAGE_KEYS = {
  FAVORITES: 'listenx_favorites',
  PLAYLISTS: 'listenx_playlists',
  HISTORY: 'listenx_history',
  SETTINGS: 'listenx_settings',
  VOLUME: 'listenx_volume',
  LAST_SONG: 'listenx_last_song',
  SERVER_URL: 'listenx_server_url'
};

const DEFAULT_SETTINGS = {
  graphicsLevel: 'ULTRA_LIQUID', // ULTRA_LIQUID, BALANCED, LOW
  customBg: null,
  crossfadeDuration: 3, // seconds (0 to 12)
  streamQuality: '320', // 320, 160, 96
  eqPreset: 'Flat',
  eqGains: [0, 0, 0, 0, 0, 0], // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz, Preamp
  vocalRemover: false,
  musicTaste: {
    languages: ['Hindi', 'Haryanvi', 'Punjabi', 'English'],
    singers: ['Masoom Sharma', 'Sidhu Moosewala', 'Arijit Singh', 'Karan Aujla', 'Gulzaar Chhaniwala']
  }
};

class StorageService {
  constructor() {
    this._initDefaultPlaylists();
  }

  _initDefaultPlaylists() {
    const playlists = this.getPlaylists();
    if (!playlists || playlists.length === 0) {
      const defaultPlaylists = [
        {
          id: 'pl_favorites',
          title: 'Liked Songs',
          description: 'Your favorite tracks',
          isSystem: true,
          coverIcon: 'heart',
          created: Date.now(),
          songs: []
        },
        {
          id: 'pl_haryanvi_top',
          title: 'Haryanvi Blast',
          description: 'High energy Haryanvi beats & desi bangers',
          isSystem: false,
          coverIcon: 'music',
          created: Date.now(),
          songs: []
        },
        {
          id: 'pl_punjabi_vibes',
          title: 'Punjabi Hits',
          description: 'Moosewala, Karan Aujla, Diljit & AP Dhillon',
          isSystem: false,
          coverIcon: 'fire',
          created: Date.now(),
          songs: []
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(defaultPlaylists));
    }
  }

  // --- Favorites ---
  getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  isFavorite(songId) {
    if (!songId) return false;
    const favs = this.getFavorites();
    return favs.some(s => s.id === songId);
  }

  toggleFavorite(song) {
    if (!song || !song.id) return false;
    let favs = this.getFavorites();
    const index = favs.findIndex(s => s.id === song.id);
    let isNowFav = false;

    if (index >= 0) {
      favs.splice(index, 1);
      isNowFav = false;
    } else {
      favs.unshift(song);
      isNowFav = true;
    }

    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    
    // Also sync to system "Liked Songs" playlist
    const playlists = this.getPlaylists();
    const likedPl = playlists.find(p => p.id === 'pl_favorites');
    if (likedPl) {
      likedPl.songs = favs;
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    }

    return isNowFav;
  }

  // --- Playlists ---
  getPlaylists() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  createPlaylist(title, description = '') {
    if (!title || !title.trim()) return null;
    const playlists = this.getPlaylists();
    const newPl = {
      id: 'pl_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      isSystem: false,
      coverIcon: 'music',
      created: Date.now(),
      songs: []
    };
    playlists.push(newPl);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    return newPl;
  }

  deletePlaylist(playlistId) {
    let playlists = this.getPlaylists();
    playlists = playlists.filter(p => p.id !== playlistId || p.isSystem);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    return playlists;
  }

  addSongToPlaylist(playlistId, song) {
    const playlists = this.getPlaylists();
    const target = playlists.find(p => p.id === playlistId);
    if (!target) return false;
    if (!target.songs.some(s => s.id === song.id)) {
      target.songs.unshift(song);
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      return true;
    }
    return false;
  }

  removeSongFromPlaylist(playlistId, songId) {
    const playlists = this.getPlaylists();
    const target = playlists.find(p => p.id === playlistId);
    if (!target) return false;
    target.songs = target.songs.filter(s => s.id !== songId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    return true;
  }

  // --- Listening History ---
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addToHistory(song) {
    if (!song || !song.id) return;
    let history = this.getHistory();
    history = history.filter(s => s.id !== song.id);
    history.unshift({ ...song, playedAt: Date.now() });
    if (history.length > 100) history.pop();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  clearHistory() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  }

  // --- Settings ---
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- Volume ---
  getVolume() {
    const v = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return v !== null ? parseFloat(v) : 0.85;
  }

  saveVolume(vol) {
    localStorage.setItem(STORAGE_KEYS.VOLUME, vol.toString());
  }

  // --- Server URL ---
  getServerUrl() {
    return localStorage.getItem(STORAGE_KEYS.SERVER_URL) || 'http://localhost:8080';
  }

  saveServerUrl(url) {
    localStorage.setItem(STORAGE_KEYS.SERVER_URL, url.trim().replace(/\/+$/, ''));
  }
}

export const storage = new StorageService();
