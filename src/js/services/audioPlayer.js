/**
 * High-Performance Web Audio Player Engine for Listen-X.
 * Features:
 * - HTML5 Audio + Web Audio API pipeline
 * - Dynamic Smart Crossfade: Fixed 4-second continuous gapless crossfading
 * - Pre-transition Trimming: Skips ~3.5s intro & ~3.5s outro silences safely
 * - Instant Song Selection with Smooth 4s Crossfade
 * - Pre-buffers upcoming 2–3 songs in advance
 * - Intelligent Autoplay: Never stops when queue is exhausted, continuously streams
 *   recommendations tailored to the feed, artist, and user taste.
 * - 6-Band Graphic Equalizer & Preamp
 * - Karaoke Vocal Remover DSP
 * - Real-time Audio Analyser
 * - Media Session API for keyboard & OS lockscreen
 */

import { storage } from './storage.js';
import { api } from './api.js';

export const LOOP_MODES = {
  OFF: 'OFF',
  ALL: 'ALL',
  ONE: 'ONE'
};

export const EQ_PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0],
  'Bass Boost': [8, 5, 2, 0, 1, 0],
  'Vocal': [-2, 1, 5, 4, 2, 0],
  'Electronic': [7, 5, 0, 3, 6, 0],
  'Rock': [6, 3, -1, 3, 6, 0],
  'Pop': [2, 4, 3, 2, 1, 0]
};

// Smart transition & trimming constants
export const SMART_INTRO_SKIP = 3.5;       // seconds trimmed at start
export const SMART_OUTRO_SKIP = 3.5;       // seconds trimmed at end
export const FIXED_CROSSFADE_DURATION = 4.0; // fixed 4s crossfade for continuous flow

export function getSafeIntroTrim(durationSec) {
  if (!durationSec || durationSec <= 0) return SMART_INTRO_SKIP;
  if (durationSec < 20) return Math.min(SMART_INTRO_SKIP, durationSec * 0.08);
  return SMART_INTRO_SKIP;
}

export function getSafeOutroTrim(durationSec) {
  if (!durationSec || durationSec <= 0) return SMART_OUTRO_SKIP;
  if (durationSec < 20) return Math.min(SMART_OUTRO_SKIP, durationSec * 0.08);
  return SMART_OUTRO_SKIP;
}

export function getSafeCrossfadeTime(durationSec) {
  if (!durationSec || durationSec <= 0) return FIXED_CROSSFADE_DURATION;
  if (durationSec < 15) return Math.min(FIXED_CROSSFADE_DURATION, durationSec * 0.2);
  return FIXED_CROSSFADE_DURATION;
}

class AudioPlayerService {
  constructor() {
    this.queue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.loopMode = LOOP_MODES.OFF;
    this.isShuffle = false;
    this.playbackSpeed = 1.0;
    this.crossfadeDuration = 3; // Saved user preference (remains unchanged in settings)
    this.isVocalRemoverEnabled = false;

    // Dual audio elements for gapless crossfading
    this.audioA = new Audio();
    this.audioB = new Audio();
    this.activeAudio = this.audioA;
    this.inactiveAudio = this.audioB;

    this.audioA.crossOrigin = 'anonymous';
    this.audioB.crossOrigin = 'anonymous';

    this.audioCtx = null;
    this.analyser = null;
    this.preampGain = null;
    this.eqFilters = [];
    this.vocalRemoverNodes = null;
    this.gainA = null;
    this.gainB = null;

    // Intelligent Autoplay & Preparation State
    this.feedSongs = [];
    this.autoplayPool = [];
    this.recentlyPlayedIds = new Set();
    this.preloadedNextSong = null;
    this.isCrossfading = false;
    this._isCrossfadingTriggered = false;
    this.isRefillingPool = false;

    // Load recent history IDs to avoid repeating songs
    const hist = storage.getHistory();
    if (Array.isArray(hist)) {
      hist.slice(0, 40).forEach(s => {
        if (s && s.id) this.recentlyPlayedIds.add(s.id);
      });
    }

    this.listeners = new Set();
    this._initAudioElements();
    this._initMediaSession();

    // Load saved settings
    const saved = storage.getSettings();
    this.crossfadeDuration = saved.crossfadeDuration ?? 3;
    this.isVocalRemoverEnabled = saved.vocalRemover ?? false;
  }

  _ensureAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      // Analyser for real-time visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      // Preamp gain
      this.preampGain = this.audioCtx.createGain();
      this.preampGain.gain.value = 1.0;

      // Master volume gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = storage.getVolume();

      // Individual gains for crossfading
      this.gainA = this.audioCtx.createGain();
      this.gainB = this.audioCtx.createGain();
      this.gainA.gain.value = 1.0;
      this.gainB.gain.value = 0.0;

      // 6-Band Equalizer filters: 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
      const freqs = [60, 230, 910, 3600, 14000];
      const types = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
      this.eqFilters = freqs.map((freq, idx) => {
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = types[idx];
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        return filter;
      });

      // Chain EQ filters
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }

      // Connect source nodes
      const sourceA = this.audioCtx.createMediaElementSource(this.audioA);
      const sourceB = this.audioCtx.createMediaElementSource(this.audioB);

      sourceA.connect(this.gainA);
      sourceB.connect(this.gainB);

      // Mixer for crossfader
      this.crossfadeMixer = this.audioCtx.createGain();
      this.gainA.connect(this.crossfadeMixer);
      this.gainB.connect(this.crossfadeMixer);

      // Connect mixer -> preamp -> EQ -> Analyser -> MasterGain -> destination
      this.crossfadeMixer.connect(this.preampGain);
      this.preampGain.connect(this.eqFilters[0]);
      this.eqFilters[this.eqFilters.length - 1].connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);

      // Apply saved EQ
      const saved = storage.getSettings();
      if (saved.eqGains) {
        this.setEqualizerGains(saved.eqGains);
      }
    } catch (e) {
      console.warn('Web Audio API initialized with limited context:', e);
    }
  }

  _initAudioElements() {
    const bindEvents = (audio) => {
      audio.addEventListener('play', () => {
        if (audio === this.activeAudio) {
          this.isPlaying = true;
          this._emit('playStateChanged', { isPlaying: true });
        }
      });

      audio.addEventListener('pause', () => {
        if (audio === this.activeAudio && !this.isCrossfading) {
          this.isPlaying = false;
          this._emit('playStateChanged', { isPlaying: false });
        }
      });

      audio.addEventListener('timeupdate', () => {
        if (audio === this.activeAudio) {
          const current = audio.currentTime;
          const duration = audio.duration || (this.getCurrentSong()?.durationMs ? this.getCurrentSong().durationMs / 1000 : 0);
          this._emit('timeUpdate', {
            currentTime: current,
            duration: duration,
            progress: duration > 0 ? (current / duration) : 0
          });

          // Smart continuous crossfade & outro trimming trigger
          if (duration > 10 && !this._isCrossfadingTriggered && !this.isCrossfading) {
            const safeOutro = getSafeOutroTrim(duration);
            const fadeDuration = getSafeCrossfadeTime(duration);
            const triggerPoint = duration - safeOutro - fadeDuration;

            if (current >= triggerPoint) {
              this._isCrossfadingTriggered = true;
              this.transitionToNextTrack();
            }
          }
        }
      });

      audio.addEventListener('ended', () => {
        if (audio === this.activeAudio && !this.isCrossfading) {
          this.onTrackEnded();
        }
      });

      audio.addEventListener('error', (e) => {
        if (audio === this.activeAudio) {
          console.error('Audio playback error:', e);
          // Try recovering via next track
          setTimeout(() => this.playNext(), 1000);
        }
      });
    };

    bindEvents(this.audioA);
    bindEvents(this.audioB);
  }

  _initMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.max(0, this.activeAudio.currentTime - offset));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(this.activeAudio.currentTime + offset);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
    }
  }

  _updateMediaSession(song) {
    if (!('mediaSession' in navigator) || !song) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'Listen-X Stream',
      artwork: [
        { src: song.artworkUri || 'assets/favicon.svg', sizes: '500x500', type: 'image/jpeg' }
      ]
    });
  }

  // --- Feed & Candidate Management ---
  setFeedSongs(songs) {
    if (!Array.isArray(songs) || songs.length === 0) return;
    this.feedSongs = [...songs];
    for (let s of songs) {
      if (!this.recentlyPlayedIds.has(s.id) && !this.autoplayPool.some(p => p.id === s.id)) {
        this.autoplayPool.push(s);
      }
    }
    this.prepareUpcomingSongs();
  }

  /**
   * Pre-loads the next 2-3 songs in advance into the candidate buffer
   * and pre-buffers the immediate next track in the inactive audio element.
   */
  prepareUpcomingSongs() {
    const upcoming = [];

    // 1. Prioritize songs in queue
    if (this.currentIndex < this.queue.length - 1) {
      for (let i = this.currentIndex + 1; i < Math.min(this.queue.length, this.currentIndex + 4); i++) {
        upcoming.push(this.queue[i]);
      }
    }

    // 2. Supplement up to 3 songs from autoplay pool / feed
    let poolIdx = 0;
    while (upcoming.length < 3 && poolIdx < this.autoplayPool.length) {
      const cand = this.autoplayPool[poolIdx++];
      if (!this.recentlyPlayedIds.has(cand.id) && !upcoming.some(u => u.id === cand.id)) {
        upcoming.push(cand);
      }
    }

    // 3. Pre-buffer the immediate upcoming song in inactiveAudio
    if (upcoming.length > 0) {
      const nextSong = upcoming[0];
      if (nextSong && nextSong.streamUrl && !this.isCrossfading) {
        if (!this.preloadedNextSong || this.preloadedNextSong.id !== nextSong.id) {
          this.preloadedNextSong = nextSong;
          try {
            this.inactiveAudio.src = nextSong.streamUrl;
            this.inactiveAudio.preload = 'auto';
            this.inactiveAudio.load();
          } catch (e) {}
        }
      }
    }

    // Refill candidate pool in background if low
    if (this.autoplayPool.length < 6) {
      this._refillAutoplayPool();
    }
  }

  /**
   * Intelligently refills autoplay pool based on current artist, active feed, or user taste.
   */
  async _refillAutoplayPool() {
    if (this.isRefillingPool) return;
    this.isRefillingPool = true;

    try {
      const current = this.getCurrentSong();
      let query = '';

      if (current && current.artist) {
        const cleanArtist = current.artist.split(/[,&/]/)[0].trim();
        if (cleanArtist && !cleanArtist.toLowerCase().includes('unknown')) {
          query = `${cleanArtist} hits`;
        }
      }

      if (!query) {
        const taste = storage.getSettings().musicTaste || {};
        if (taste.singers && taste.singers.length > 0) {
          const randomSinger = taste.singers[Math.floor(Math.random() * taste.singers.length)];
          query = `${randomSinger} top hits`;
        } else {
          query = 'trending songs 2026';
        }
      }

      const results = await api.searchSongs(query, 25, 1);
      if (Array.isArray(results) && results.length > 0) {
        for (let s of results) {
          if (!this.recentlyPlayedIds.has(s.id) && !this.autoplayPool.some(p => p.id === s.id)) {
            this.autoplayPool.push(s);
          }
        }
      }
    } catch (e) {
      console.warn('Autoplay pool refill notice:', e);
    } finally {
      this.isRefillingPool = false;
    }
  }

  /**
   * Retrieves the next best unplayed song for intelligent autoplay.
   */
  getNextAutoplaySong() {
    // 1. Pick from candidate pool
    while (this.autoplayPool.length > 0) {
      const candidate = this.autoplayPool.shift();
      if (!this.recentlyPlayedIds.has(candidate.id)) {
        this.recentlyPlayedIds.add(candidate.id);
        if (this.autoplayPool.length < 5) this._refillAutoplayPool();
        return candidate;
      }
    }

    // 2. Pick from active feed songs
    if (this.feedSongs && this.feedSongs.length > 0) {
      const unplayed = this.feedSongs.filter(s => !this.recentlyPlayedIds.has(s.id));
      if (unplayed.length > 0) {
        const picked = unplayed[0];
        this.recentlyPlayedIds.add(picked.id);
        if (this.autoplayPool.length < 5) this._refillAutoplayPool();
        return picked;
      }
      // If all feed songs played, clear session tracker (keep current)
      const current = this.getCurrentSong();
      this.recentlyPlayedIds.clear();
      if (current) this.recentlyPlayedIds.add(current.id);
      return this.feedSongs[0];
    }

    // 3. Fallback to Liked Songs
    const favs = storage.getFavorites();
    if (favs && favs.length > 0) {
      const unplayedFav = favs.find(s => !this.recentlyPlayedIds.has(s.id)) || favs[0];
      this.recentlyPlayedIds.add(unplayedFav.id);
      return unplayedFav;
    }

    return null;
  }

  // --- Playback & Smart Crossfade Engine ---

  /**
   * Plays a single track.
   * If a song is currently playing, crossfades smoothly over fixed 4s starting at ~3.5s!
   * If cold start, fades in smoothly from ~3.5s.
   */
  async playSong(song) {
    if (!song) return;

    // If already playing audio, execute smooth 4-second smart crossfade!
    if (this.isPlaying && this.getCurrentSong() && this.activeAudio && !this.activeAudio.paused) {
      this.queue = [song];
      this.currentIndex = 0;
      this._emit('queueChanged', { queue: this.queue, currentIndex: 0 });
      await this._performSmartCrossfade(song, 0);
      return;
    }

    // Cold start / manual play from stopped state
    this.queue = [song];
    this.currentIndex = 0;
    this._isCrossfadingTriggered = false;
    this._emit('queueChanged', { queue: this.queue, currentIndex: 0 });
    await this.playCurrentTrack(true);
  }

  setQueue(songs, startIndex = 0) {
    if (!songs || songs.length === 0) return;
    const targetSong = songs[Math.max(0, Math.min(startIndex, songs.length - 1))];

    if (this.isPlaying && this.getCurrentSong() && this.activeAudio && !this.activeAudio.paused) {
      this.queue = [...songs];
      this.currentIndex = startIndex;
      this._emit('queueChanged', { queue: this.queue, currentIndex: startIndex });
      this._performSmartCrossfade(targetSong, startIndex);
      return;
    }

    this.queue = [...songs];
    this.currentIndex = Math.max(0, Math.min(startIndex, this.queue.length - 1));
    this._isCrossfadingTriggered = false;
    this._emit('queueChanged', { queue: this.queue, currentIndex: this.currentIndex });
    this.playCurrentTrack(true);
  }

  addToQueue(song) {
    if (!song) return;
    this.queue.push(song);
    this.prepareUpcomingSongs();
    this._emit('queueChanged', { queue: this.queue, currentIndex: this.currentIndex });
  }

  playNextInQueue(song) {
    if (!song) return;
    this.queue.splice(this.currentIndex + 1, 0, song);
    this.prepareUpcomingSongs();
    this._emit('queueChanged', { queue: this.queue, currentIndex: this.currentIndex });
  }

  removeFromQueue(index) {
    if (index < 0 || index >= this.queue.length) return;
    this.queue.splice(index, 1);
    if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      if (this.queue.length > 0) {
        this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
        this.playCurrentTrack();
      } else {
        this.transitionToNextTrack();
      }
    }
    this.prepareUpcomingSongs();
    this._emit('queueChanged', { queue: this.queue, currentIndex: this.currentIndex });
  }

  clearQueue() {
    this.stop();
    this.queue = [];
    this.currentIndex = -1;
    this.recentlyPlayedIds.clear();
    this._emit('queueChanged', { queue: [], currentIndex: -1 });
  }

  shuffleQueue() {
    if (this.queue.length <= 1) return;
    const current = this.getCurrentSong();
    const remaining = this.queue.filter((_, idx) => idx !== this.currentIndex);

    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    if (current) {
      this.queue = [current, ...remaining];
      this.currentIndex = 0;
    } else {
      this.queue = remaining;
      this.currentIndex = 0;
    }
    this.prepareUpcomingSongs();
    this._emit('queueChanged', { queue: this.queue, currentIndex: this.currentIndex });
  }

  getCurrentSong() {
    if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
      return this.queue[this.currentIndex];
    }
    return null;
  }

  /**
   * Cold-starts current track with ~3.5s intro trimming and smooth fade-in.
   */
  async playCurrentTrack(shouldTrimIntro = true) {
    this._ensureAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch {}
    }

    const song = this.getCurrentSong();
    if (!song || !song.streamUrl) return;

    this._isCrossfadingTriggered = false;
    this.isCrossfading = false;
    this.activeAudio.src = song.streamUrl;
    this.activeAudio.playbackRate = this.playbackSpeed;

    const durationSec = (song.durationMs || 0) / 1000;
    const safeIntro = shouldTrimIntro ? getSafeIntroTrim(durationSec) : 0;

    // Reset gain values
    const activeGain = this.activeAudio === this.audioA ? this.gainA : this.gainB;
    const inactiveGain = this.activeAudio === this.audioA ? this.gainB : this.gainA;

    if (activeGain && inactiveGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      activeGain.gain.setValueAtTime(0.0, now);
      activeGain.gain.linearRampToValueAtTime(1.0, now + 0.4);
      inactiveGain.gain.setValueAtTime(0.0, now);
    }

    try {
      this.activeAudio.currentTime = safeIntro;
      await this.activeAudio.play();
      this.isPlaying = true;
      this.recentlyPlayedIds.add(song.id);
      storage.addToHistory(song);
      this._updateMediaSession(song);
      this._emit('songChanged', { song, index: this.currentIndex });
      this._emit('playStateChanged', { isPlaying: true });
      this.prepareUpcomingSongs();
    } catch (e) {
      console.warn('Playback error:', e);
    }
  }

  /**
   * Core Smart Crossfade Engine:
   * - Fixed 4.0-second seamless equal-power/linear crossfade
   * - Pre-trimmed: incoming track starts at safeIntro (~3.5s)
   * - Outgoing track fades to 0 over 4s and cuts outro silence
   */
  async _performSmartCrossfade(incomingSong, targetIndex) {
    if (!incomingSong || !incomingSong.streamUrl) return;

    this._ensureAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch {}
    }

    this.isCrossfading = true;
    this._isCrossfadingTriggered = false;

    const outgoingAudio = this.activeAudio;
    const incomingAudio = this.inactiveAudio;
    const outgoingGain = outgoingAudio === this.audioA ? this.gainA : this.gainB;
    const incomingGain = incomingAudio === this.audioA ? this.gainA : this.gainB;

    // Prepare incoming audio element
    if (incomingAudio.src !== incomingSong.streamUrl) {
      incomingAudio.src = incomingSong.streamUrl;
    }
    incomingAudio.playbackRate = this.playbackSpeed;

    const durationSec = (incomingSong.durationMs || 0) / 1000;
    const safeIntro = getSafeIntroTrim(durationSec);

    const fadeDuration = FIXED_CROSSFADE_DURATION; // Always fixed 4 seconds
    const now = this.audioCtx ? this.audioCtx.currentTime : 0;

    if (this.audioCtx && outgoingGain && incomingGain) {
      outgoingGain.gain.cancelScheduledValues(now);
      incomingGain.gain.cancelScheduledValues(now);

      outgoingGain.gain.setValueAtTime(outgoingGain.gain.value, now);
      outgoingGain.gain.linearRampToValueAtTime(0.0, now + fadeDuration);

      incomingGain.gain.setValueAtTime(0.0, now);
      incomingGain.gain.linearRampToValueAtTime(1.0, now + fadeDuration);
    }

    try {
      incomingAudio.currentTime = safeIntro;
      await incomingAudio.play();
    } catch (err) {
      console.warn('Crossfade playback start note:', err);
    }

    // Switch active pointers immediately so UI updates instantly
    this.activeAudio = incomingAudio;
    this.inactiveAudio = outgoingAudio;
    this.currentIndex = targetIndex;
    this.isPlaying = true;

    this.recentlyPlayedIds.add(incomingSong.id);
    storage.addToHistory(incomingSong);
    this._updateMediaSession(incomingSong);
    this._emit('songChanged', { song: incomingSong, index: this.currentIndex });
    this._emit('playStateChanged', { isPlaying: true });

    // Prepare upcoming songs in the background
    this.prepareUpcomingSongs();

    // Clean up outgoing audio once fade completes
    setTimeout(() => {
      try {
        outgoingAudio.pause();
        outgoingAudio.currentTime = 0;
      } catch {}
      this.isCrossfading = false;
    }, (fadeDuration + 0.15) * 1000);
  }

  /**
   * Seamless continuous transition to next track.
   * If queue has a song, plays next in queue.
   * If queue is empty/exhausted, calls Intelligent Autoplay!
   */
  async transitionToNextTrack() {
    // 1. Loop One Mode
    if (this.loopMode === LOOP_MODES.ONE) {
      const song = this.getCurrentSong();
      if (song) {
        await this._performSmartCrossfade(song, this.currentIndex);
        return;
      }
    }

    // 2. Next track in Queue
    if (this.currentIndex < this.queue.length - 1) {
      const nextIndex = this.currentIndex + 1;
      const nextSong = this.queue[nextIndex];
      await this._performSmartCrossfade(nextSong, nextIndex);
      return;
    }

    // 3. Loop All Mode
    if (this.loopMode === LOOP_MODES.ALL && this.queue.length > 0) {
      await this._performSmartCrossfade(this.queue[0], 0);
      return;
    }

    // 4. Intelligent Autoplay (Queue exhausted -> Never stop playing!)
    const autoplaySong = this.getNextAutoplaySong();
    if (autoplaySong) {
      this.queue.push(autoplaySong);
      const targetIndex = this.queue.length - 1;
      this._emit('queueChanged', { queue: this.queue, currentIndex: targetIndex });
      await this._performSmartCrossfade(autoplaySong, targetIndex);
    } else {
      // Re-trigger refill and retry
      await this._refillAutoplayPool();
      const retrySong = this.getNextAutoplaySong();
      if (retrySong) {
        this.queue.push(retrySong);
        const targetIndex = this.queue.length - 1;
        this._emit('queueChanged', { queue: this.queue, currentIndex: targetIndex });
        await this._performSmartCrossfade(retrySong, targetIndex);
      }
    }
  }

  play() {
    this._ensureAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try { this.audioCtx.resume(); } catch {}
    }
    if (!this.getCurrentSong()) {
      // If queue is empty, trigger autoplay to start continuous music!
      const song = this.getNextAutoplaySong();
      if (song) {
        this.playSong(song);
        return;
      }
    }
    this.activeAudio.play().catch(e => console.warn('Play failed:', e));
  }

  pause() {
    this.activeAudio.pause();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(seconds) {
    if (this.activeAudio && !isNaN(seconds)) {
      this.activeAudio.currentTime = Math.max(0, seconds);
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    storage.saveVolume(clamped);
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    } else {
      this.audioA.volume = clamped;
      this.audioB.volume = clamped;
    }
    this._emit('volumeChanged', { volume: clamped });
  }

  getVolume() {
    return storage.getVolume();
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;
    this.audioA.playbackRate = speed;
    this.audioB.playbackRate = speed;
    this._emit('speedChanged', { speed });
  }

  setLoopMode(mode) {
    this.loopMode = mode;
    this._emit('loopModeChanged', { mode });
  }

  toggleLoopMode() {
    const modes = [LOOP_MODES.OFF, LOOP_MODES.ALL, LOOP_MODES.ONE];
    const next = modes[(modes.indexOf(this.loopMode) + 1) % modes.length];
    this.setLoopMode(next);
    return next;
  }

  hasNext() {
    if (this.loopMode === LOOP_MODES.ALL) return true;
    if (this.currentIndex < this.queue.length - 1) return true;
    // With Intelligent Autoplay, there is ALWAYS a next track available!
    return this.autoplayPool.length > 0 || this.feedSongs.length > 0;
  }

  playNext() {
    this.transitionToNextTrack();
  }

  playPrevious() {
    if (this.queue.length === 0) return;
    const current = this.activeAudio.currentTime;
    // If track is past 4 seconds, rewind to intro trim
    if (current > 4) {
      const dur = this.activeAudio.duration || 0;
      this.seek(getSafeIntroTrim(dur));
      return;
    }

    if (this.currentIndex > 0) {
      const prevIndex = this.currentIndex - 1;
      this._performSmartCrossfade(this.queue[prevIndex], prevIndex);
    } else if (this.loopMode === LOOP_MODES.ALL && this.queue.length > 1) {
      const lastIndex = this.queue.length - 1;
      this._performSmartCrossfade(this.queue[lastIndex], lastIndex);
    } else {
      this.seek(getSafeIntroTrim(this.activeAudio.duration || 0));
    }
  }

  onTrackEnded() {
    if (this.loopMode === LOOP_MODES.ONE) {
      const dur = this.activeAudio.duration || 0;
      this.seek(getSafeIntroTrim(dur));
      this.play();
    } else {
      this.transitionToNextTrack();
    }
  }

  // --- Equalizer & DSP ---
  setEqualizerGains(gains) {
    if (!this.eqFilters || this.eqFilters.length === 0) return;
    for (let i = 0; i < 5; i++) {
      if (this.eqFilters[i] && this.audioCtx) {
        const val = gains[i] || 0;
        this.eqFilters[i].gain.setValueAtTime(val, this.audioCtx.currentTime);
      }
    }
    if (this.preampGain && this.audioCtx) {
      const preampVal = Math.pow(10, (gains[5] || 0) / 20);
      this.preampGain.gain.setValueAtTime(preampVal, this.audioCtx.currentTime);
    }
    storage.saveSettings({ eqGains: gains });
  }

  applyPreset(presetName) {
    const gains = EQ_PRESETS[presetName] || EQ_PRESETS['Flat'];
    this.setEqualizerGains(gains);
    storage.saveSettings({ eqPreset: presetName });
    this._emit('eqPresetChanged', { preset: presetName, gains });
  }

  toggleVocalRemover() {
    this.isVocalRemoverEnabled = !this.isVocalRemoverEnabled;
    storage.saveSettings({ vocalRemover: this.isVocalRemoverEnabled });
    if (this.isVocalRemoverEnabled) {
      this.eqFilters[1].gain.setValueAtTime(-10, this.audioCtx.currentTime);
      this.eqFilters[2].gain.setValueAtTime(-14, this.audioCtx.currentTime);
      this.eqFilters[3].gain.setValueAtTime(-8, this.audioCtx.currentTime);
    } else {
      const saved = storage.getSettings().eqGains || [0, 0, 0, 0, 0, 0];
      this.setEqualizerGains(saved);
    }
    this._emit('vocalRemoverChanged', { enabled: this.isVocalRemoverEnabled });
    return this.isVocalRemoverEnabled;
  }

  getFrequencyData(array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit(event, data) {
    for (let fn of this.listeners) {
      try { fn(event, data); } catch (e) { console.error('Listener error:', e); }
    }
  }

  stop() {
    this.audioA.pause();
    this.audioB.pause();
    this.audioA.src = '';
    this.audioB.src = '';
    this.isPlaying = false;
    this.isCrossfading = false;
    this._isCrossfadingTriggered = false;
    this._emit('playStateChanged', { isPlaying: false });
  }

  async downloadSong(song) {
    if (!song || !song.streamUrl) return false;
    try {
      const safeTitle = (song.title || 'Track').replace(/[/\\?%*:|"<>]/g, '');
      const safeArtist = (song.artist || 'Listen-X').replace(/[/\\?%*:|"<>]/g, '');
      const filename = `${safeArtist} - ${safeTitle}.mp4`;

      const a = document.createElement('a');
      a.href = song.streamUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (e) {
      console.error('Download error:', e);
      return false;
    }
  }
}

export const player = new AudioPlayerService();
