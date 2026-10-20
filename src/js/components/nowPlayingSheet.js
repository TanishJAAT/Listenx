/**
 * Now Playing Floating Mini Player & Fullscreen Liquid Sheet for Listen-X.
 * Includes Live Synced Lyrics (LRCLIB & JioSaavn), Vinyl Turnable, Up Next Queue,
 * Speed Selector, Vocal Remover, and Spectrum Visualizer.
 */

import { player, LOOP_MODES } from '../services/audioPlayer.js';
import { api } from '../services/api.js';
import { storage } from '../services/storage.js';
import { LrcParser } from '../services/lrcParser.js';
import { AudioVisualizer } from './visualizer.js';

export class NowPlayingSheet {
  constructor() {
    this.isExpanded = false;
    this.activeTab = 'art'; // 'art' | 'lyrics' | 'queue'
    this.currentLyrics = null;
    this.activeLyricIndex = -1;
    this.isUserScrollingLyrics = false;
    this.userScrollTimeout = null;

    this._createDOM();
    this._bindEvents();
  }

  _createDOM() {
    // 1. Mini Player Dock
    this.miniPlayer = document.createElement('div');
    this.miniPlayer.className = 'floating-mini-player hidden';
    this.miniPlayer.innerHTML = `
      <div class="mini-progress-bar"><div class="mini-progress-fill" id="miniProgressFill"></div></div>
      <div class="mini-content">
        <div class="mini-art-wrapper">
          <img class="mini-art" id="miniArt" src="assets/favicon.svg" alt="Cover" />
          <div class="mini-live-wave"><canvas id="miniWaveCanvas" width="24" height="16"></canvas></div>
        </div>
        <div class="mini-info">
          <div class="mini-title" id="miniTitle">Select a track</div>
          <div class="mini-artist" id="miniArtist">Listen-X Player</div>
        </div>
        <div class="mini-controls">
          <button class="icon-btn mini-fav-btn" id="miniFavBtn" title="Favorite">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="icon-btn mini-play-btn" id="miniPlayBtn" title="Play/Pause">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="icon-btn mini-next-btn" id="miniNextBtn" title="Next">
            <i class="fa-solid fa-forward-step"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.miniPlayer);

    // 2. Fullscreen Sheet Modal
    this.sheet = document.createElement('div');
    this.sheet.className = 'now-playing-sheet hidden';
    this.sheet.innerHTML = `
      <div class="sheet-scrim"></div>
      <div class="sheet-container">
        <!-- Top Navigation -->
        <div class="sheet-header">
          <button class="icon-btn sheet-down-btn" id="sheetDownBtn" title="Minimize">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="sheet-header-title">
            <span>NOW PLAYING</span>
            <small id="sheetHeaderQuality">320 KBPS HI-FI</small>
          </div>
          <div class="sheet-tab-buttons">
            <button class="sheet-tab-btn active" id="tabArtBtn" title="Album Art"><i class="fa-solid fa-compact-disc"></i></button>
            <button class="sheet-tab-btn" id="tabLyricsBtn" title="Live Lyrics"><i class="fa-solid fa-align-left"></i></button>
            <button class="sheet-tab-btn" id="tabQueueBtn" title="Up Next Queue"><i class="fa-solid fa-list-ul"></i></button>
          </div>
        </div>

        <!-- Sheet Body Views -->
        <div class="sheet-body">
          <!-- View 1: Vinyl Art -->
          <div class="sheet-view sheet-view-art active" id="viewArt">
            <div class="vinyl-container">
              <div class="vinyl-ambient-glow" id="vinylGlow"></div>
              <div class="vinyl-disc" id="vinylDisc">
                <div class="vinyl-grooves"></div>
                <img class="vinyl-art" id="sheetArt" src="assets/favicon.svg" alt="Album Art" />
                <div class="vinyl-center-hole"></div>
              </div>
            </div>
            <div class="track-meta">
              <div class="track-title-wrapper">
                <h2 class="sheet-track-title" id="sheetTitle">No Song Selected</h2>
                <button class="icon-btn sheet-fav-btn" id="sheetFavBtn" title="Favorite">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <p class="sheet-track-artist" id="sheetArtist">Listen-X Universal Streamer</p>
              <p class="sheet-track-album" id="sheetAlbum">Online</p>
            </div>
          </div>

          <!-- View 2: Lyrics Panel -->
          <div class="sheet-view sheet-view-lyrics" id="viewLyrics">
            <div class="lyrics-toolbar">
              <span class="lyrics-source" id="lyricsSource">LRCLIB Synced</span>
              <button class="glass-pill-btn" id="copyLyricsBtn"><i class="fa-regular fa-copy"></i> Copy</button>
            </div>
            <div class="lyrics-scroll-container" id="lyricsContainer">
              <div class="lyrics-placeholder">Loading synced lyrics...</div>
            </div>
          </div>

          <!-- View 3: Up Next Queue -->
          <div class="sheet-view sheet-view-queue" id="viewQueue">
            <div class="queue-toolbar">
              <span class="queue-count" id="queueCount">Queue (0 tracks)</span>
              <div class="queue-actions">
                <button class="glass-pill-btn" id="queueShuffleBtn"><i class="fa-solid fa-shuffle"></i> Shuffle</button>
                <button class="glass-pill-btn" id="queueClearBtn"><i class="fa-solid fa-trash-can"></i> Clear</button>
              </div>
            </div>
            <div class="queue-list" id="queueList"></div>
          </div>
        </div>

        <!-- Visualizer Bar -->
        <div class="sheet-visualizer">
          <canvas id="sheetVisualizerCanvas" height="36"></canvas>
        </div>

        <!-- Progress Scrubber -->
        <div class="sheet-scrubber">
          <input type="range" class="sheet-slider" id="sheetProgressSlider" min="0" max="100" value="0" step="0.1" />
          <div class="sheet-time-labels">
            <span id="sheetTimeCurrent">0:00</span>
            <span id="sheetTimeTotal">0:00</span>
          </div>
        </div>

        <!-- Main Controls -->
        <div class="sheet-controls">
          <button class="icon-btn sheet-control-btn" id="sheetShuffleBtn" title="Shuffle">
            <i class="fa-solid fa-shuffle"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetPrevBtn" title="Previous">
            <i class="fa-solid fa-backward-step"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetRewind10Btn" title="Rewind 10s">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
          <button class="sheet-main-play-btn" id="sheetPlayBtn" title="Play/Pause">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetForward10Btn" title="Forward 10s">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetNextBtn" title="Next">
            <i class="fa-solid fa-forward-step"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetLoopBtn" title="Loop Mode">
            <i class="fa-solid fa-repeat"></i>
          </button>
        </div>

        <!-- Bottom Utility Toolbar -->
        <div class="sheet-bottom-bar">
          <!-- Volume -->
          <div class="sheet-volume-wrapper">
            <button class="icon-btn sheet-mute-btn" id="sheetMuteBtn" title="Mute/Unmute">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <input type="range" class="sheet-slider volume-slider" id="sheetVolumeSlider" min="0" max="1" step="0.01" value="0.85" />
          </div>

          <!-- DSP Tools -->
          <div class="sheet-dsp-tools">
            <button class="glass-pill-btn dsp-btn" id="sheetVocalBtn" title="Karaoke Vocal Remover">
              <i class="fa-solid fa-microphone-slash"></i> Vocal
            </button>
            <button class="glass-pill-btn dsp-btn" id="sheetSpeedBtn" title="Playback Speed">
              <span id="speedLabel">1.0x</span>
            </button>
            <button class="glass-pill-btn dsp-btn" id="sheetEqBtn" title="6-Band Equalizer">
              <i class="fa-solid fa-sliders"></i> EQ
            </button>
            <button class="glass-pill-btn dsp-btn" id="sheetDownloadBtn" title="Download Song">
              <i class="fa-solid fa-download"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.sheet);
  }

  _bindEvents() {
    // Mini player clicks
    this.miniPlayer.querySelector('.mini-content').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      this.open();
    });

    document.getElementById('miniPlayBtn').addEventListener('click', () => player.togglePlay());
    document.getElementById('miniNextBtn').addEventListener('click', () => player.playNext());
    document.getElementById('miniFavBtn').addEventListener('click', () => this._toggleFavCurrent());

    // Sheet dismissal
    document.getElementById('sheetDownBtn').addEventListener('click', () => this.close());
    this.sheet.querySelector('.sheet-scrim').addEventListener('click', () => this.close());

    // Sheet Tabs (Art, Lyrics, Queue)
    document.getElementById('tabArtBtn').addEventListener('click', () => this.switchTab('art'));
    document.getElementById('tabLyricsBtn').addEventListener('click', () => this.switchTab('lyrics'));
    document.getElementById('tabQueueBtn').addEventListener('click', () => this.switchTab('queue'));

    // Controls
    document.getElementById('sheetPlayBtn').addEventListener('click', () => player.togglePlay());
    document.getElementById('sheetNextBtn').addEventListener('click', () => player.playNext());
    document.getElementById('sheetPrevBtn').addEventListener('click', () => player.playPrevious());
    document.getElementById('sheetRewind10Btn').addEventListener('click', () => {
      player.seek(Math.max(0, player.activeAudio.currentTime - 10));
    });
    document.getElementById('sheetForward10Btn').addEventListener('click', () => {
      player.seek(player.activeAudio.currentTime + 10);
    });
    document.getElementById('sheetShuffleBtn').addEventListener('click', () => {
      player.shuffleQueue();
    });
    document.getElementById('sheetLoopBtn').addEventListener('click', () => {
      const mode = player.toggleLoopMode();
      this._updateLoopButton(mode);
    });
    document.getElementById('sheetFavBtn').addEventListener('click', () => this._toggleFavCurrent());

    // Scrubber
    const scrubber = document.getElementById('sheetProgressSlider');
    let isSeeking = false;
    scrubber.addEventListener('input', () => {
      isSeeking = true;
      const duration = player.activeAudio.duration || 0;
      const targetSec = (scrubber.value / 100) * duration;
      document.getElementById('sheetTimeCurrent').textContent = this._formatTime(targetSec);
    });
    scrubber.addEventListener('change', () => {
      const duration = player.activeAudio.duration || 0;
      const targetSec = (scrubber.value / 100) * duration;
      player.seek(targetSec);
      isSeeking = false;
    });

    // Volume
    const volSlider = document.getElementById('sheetVolumeSlider');
    volSlider.value = player.getVolume();
    volSlider.addEventListener('input', (e) => {
      player.setVolume(parseFloat(e.target.value));
      this._updateVolumeIcon(parseFloat(e.target.value));
    });

    document.getElementById('sheetMuteBtn').addEventListener('click', () => {
      const current = player.getVolume();
      if (current > 0) {
        this._preMuteVol = current;
        player.setVolume(0);
        volSlider.value = 0;
        this._updateVolumeIcon(0);
      } else {
        const restore = this._preMuteVol || 0.85;
        player.setVolume(restore);
        volSlider.value = restore;
        this._updateVolumeIcon(restore);
      }
    });

    // Speed toggle dialog / cycle
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    document.getElementById('sheetSpeedBtn').addEventListener('click', () => {
      const current = player.playbackSpeed;
      const nextIdx = (speeds.indexOf(current) + 1) % speeds.length;
      const newSpeed = speeds[nextIdx];
      player.setPlaybackSpeed(newSpeed);
      document.getElementById('speedLabel').textContent = `${newSpeed}x`;
    });

    // Vocal Remover
    document.getElementById('sheetVocalBtn').addEventListener('click', () => {
      const active = player.toggleVocalRemover();
      document.getElementById('sheetVocalBtn').classList.toggle('active', active);
    });

    // Equalizer shortcut
    document.getElementById('sheetEqBtn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-equalizer-modal'));
    });

    // Download song
    document.getElementById('sheetDownloadBtn').addEventListener('click', () => {
      const song = player.getCurrentSong();
      if (song) player.downloadSong(song);
    });

    // Copy Lyrics
    document.getElementById('copyLyricsBtn').addEventListener('click', () => {
      if (this.currentLyrics && this.currentLyrics.plainText) {
        navigator.clipboard.writeText(this.currentLyrics.plainText).then(() => {
          const btn = document.getElementById('copyLyricsBtn');
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
        });
      }
    });

    // Queue buttons
    document.getElementById('queueShuffleBtn').addEventListener('click', () => player.shuffleQueue());
    document.getElementById('queueClearBtn').addEventListener('click', () => player.clearQueue());

    // Lyrics user scroll detection (pause auto-scroll for 3s if user manually scrolls)
    const lyricsBox = document.getElementById('lyricsContainer');
    lyricsBox.addEventListener('wheel', () => this._handleUserLyricsScroll());
    lyricsBox.addEventListener('touchmove', () => this._handleUserLyricsScroll());

    // Initialize visualizers
    this.miniVisualizer = new AudioVisualizer(document.getElementById('miniWaveCanvas'), { type: 'mini' });
    this.sheetVisualizer = new AudioVisualizer(document.getElementById('sheetVisualizerCanvas'), { type: 'bars', barCount: 40 });

    // Subscribe to player events
    player.subscribe((event, data) => this._onPlayerEvent(event, data));
  }

  _handleUserLyricsScroll() {
    this.isUserScrollingLyrics = true;
    clearTimeout(this.userScrollTimeout);
    this.userScrollTimeout = setTimeout(() => {
      this.isUserScrollingLyrics = false;
    }, 3500);
  }

  _toggleFavCurrent() {
    const song = player.getCurrentSong();
    if (!song) return;
    const isNowFav = storage.toggleFavorite(song);
    this._updateFavButton(isNowFav);
    window.dispatchEvent(new CustomEvent('favorites-changed'));
  }

  _updateFavButton(isFav) {
    const miniBtn = document.getElementById('miniFavBtn');
    const sheetBtn = document.getElementById('sheetFavBtn');
    const iconClass = isFav ? 'fa-solid fa-heart active-heart' : 'fa-regular fa-heart';
    miniBtn.innerHTML = `<i class="${iconClass}"></i>`;
    sheetBtn.innerHTML = `<i class="${iconClass}"></i>`;
  }

  _updateLoopButton(mode) {
    const btn = document.getElementById('sheetLoopBtn');
    if (mode === LOOP_MODES.ALL) {
      btn.className = 'icon-btn sheet-control-btn active';
      btn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (mode === LOOP_MODES.ONE) {
      btn.className = 'icon-btn sheet-control-btn active';
      btn.innerHTML = '<i class="fa-solid fa-repeat"></i><span class="loop-one-badge">1</span>';
    } else {
      btn.className = 'icon-btn sheet-control-btn';
      btn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    }
  }

  _updateVolumeIcon(vol) {
    const icon = document.getElementById('sheetMuteBtn').querySelector('i');
    if (vol <= 0) {
      icon.className = 'fa-solid fa-volume-xmark';
    } else if (vol < 0.5) {
      icon.className = 'fa-solid fa-volume-low';
    } else {
      icon.className = 'fa-solid fa-volume-high';
    }
  }

  _onPlayerEvent(event, data) {
    switch (event) {
      case 'songChanged':
        this._updateTrackInfo(data.song);
        this._loadLyrics(data.song);
        this._renderQueue();
        this.miniPlayer.classList.remove('hidden');
        break;

      case 'playStateChanged':
        this._updatePlayButtons(data.isPlaying);
        break;

      case 'timeUpdate':
        this._updateProgress(data.currentTime, data.duration);
        this._updateActiveLyric(data.currentTime * 1000);
        break;

      case 'queueChanged':
        this._renderQueue();
        break;
    }
  }

  _updateTrackInfo(song) {
    if (!song) return;
    const isFav = storage.isFavorite(song.id);
    this._updateFavButton(isFav);

    // Mini
    document.getElementById('miniTitle').textContent = song.title;
    document.getElementById('miniArtist').textContent = song.artist;
    document.getElementById('miniArt').src = song.artworkUri || 'assets/favicon.svg';

    // Sheet
    document.getElementById('sheetTitle').textContent = song.title;
    document.getElementById('sheetArtist').textContent = song.artist;
    document.getElementById('sheetAlbum').textContent = song.album || 'Single';
    document.getElementById('sheetArt').src = song.artworkUri || 'assets/favicon.svg';

    // Ambient glow behind disc
    document.getElementById('vinylGlow').style.backgroundImage = `radial-gradient(circle, rgba(0, 240, 255, 0.45) 0%, rgba(138, 43, 226, 0.25) 50%, transparent 75%)`;
  }

  _updatePlayButtons(isPlaying) {
    const miniIcon = document.getElementById('miniPlayBtn').querySelector('i');
    const sheetIcon = document.getElementById('sheetPlayBtn').querySelector('i');
    const vinylDisc = document.getElementById('vinylDisc');

    if (isPlaying) {
      miniIcon.className = 'fa-solid fa-pause';
      sheetIcon.className = 'fa-solid fa-pause';
      vinylDisc.classList.add('playing');
    } else {
      miniIcon.className = 'fa-solid fa-play';
      sheetIcon.className = 'fa-solid fa-play';
      vinylDisc.classList.remove('playing');
    }
  }

  _updateProgress(current, duration) {
    if (isNaN(duration) || duration <= 0) return;
    const pct = Math.min(100, Math.max(0, (current / duration) * 100));

    // Mini player top progress line
    document.getElementById('miniProgressFill').style.width = `${pct}%`;

    // Sheet scrubber
    const slider = document.getElementById('sheetProgressSlider');
    slider.value = pct;
    document.getElementById('sheetTimeCurrent').textContent = this._formatTime(current);
    document.getElementById('sheetTimeTotal').textContent = this._formatTime(duration);
  }

  async _loadLyrics(song) {
    const container = document.getElementById('lyricsContainer');
    container.innerHTML = '<div class="lyrics-placeholder"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading synced lyrics...</div>';
    this.currentLyrics = null;
    this.activeLyricIndex = -1;

    const lyricsData = await api.getLyrics(song);
    this.currentLyrics = lyricsData;

    if (!lyricsData || !lyricsData.lines || lyricsData.lines.length === 0) {
      container.innerHTML = '<div class="lyrics-placeholder">No lyrics available for this song.</div>';
      document.getElementById('lyricsSource').textContent = 'No Lyrics';
      return;
    }

    document.getElementById('lyricsSource').textContent = lyricsData.source || (lyricsData.isSynced ? 'LRCLIB Synced' : 'Plain Text');
    container.innerHTML = '';

    lyricsData.lines.forEach((line, idx) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = `lyric-line ${line.timestampMs < 0 ? 'plain-line' : ''}`;
      lineDiv.id = `lyricLine_${idx}`;
      lineDiv.textContent = line.text;

      if (line.timestampMs >= 0) {
        lineDiv.title = `Jump to ${this._formatTime(line.timestampMs / 1000)}`;
        lineDiv.addEventListener('click', () => {
          player.seek(line.timestampMs / 1000);
        });
      }
      container.appendChild(lineDiv);
    });
  }

  _updateActiveLyric(currentMs) {
    if (!this.currentLyrics || !this.currentLyrics.isSynced || !this.currentLyrics.lines) return;

    const activeIdx = LrcParser.getActiveLineIndex(this.currentLyrics.lines, currentMs);
    if (activeIdx === this.activeLyricIndex) return;

    // Remove previous active class
    if (this.activeLyricIndex >= 0) {
      const prevEl = document.getElementById(`lyricLine_${this.activeLyricIndex}`);
      if (prevEl) prevEl.classList.remove('active', 'past');
    }

    this.activeLyricIndex = activeIdx;
    if (activeIdx >= 0) {
      const curEl = document.getElementById(`lyricLine_${activeIdx}`);
      if (curEl) {
        curEl.classList.add('active');

        // Auto-scroll to center active line if user is not manually scrolling
        if (!this.isUserScrollingLyrics) {
          const container = document.getElementById('lyricsContainer');
          const targetScroll = curEl.offsetTop - (container.clientHeight / 2) + (curEl.clientHeight / 2);
          container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
      }
    }
  }

  _renderQueue() {
    const queueList = document.getElementById('queueList');
    const queueCount = document.getElementById('queueCount');
    const queue = player.queue;
    const currentIdx = player.currentIndex;

    queueCount.textContent = `Queue (${queue.length} tracks)`;
    queueList.innerHTML = '';

    if (queue.length === 0) {
      queueList.innerHTML = '<div class="queue-empty">Queue is empty. Select songs to play.</div>';
      return;
    }

    queue.forEach((song, idx) => {
      const isCur = idx === currentIdx;
      const item = document.createElement('div');
      item.className = `queue-item ${isCur ? 'active-track' : ''}`;
      item.innerHTML = `
        <span class="queue-track-num">${isCur ? '<i class="fa-solid fa-volume-high active-wave-icon"></i>' : idx + 1}</span>
        <img class="queue-art" src="${song.artworkUri || 'assets/favicon.svg'}" alt="art" />
        <div class="queue-meta">
          <div class="queue-title">${song.title}</div>
          <div class="queue-artist">${song.artist}</div>
        </div>
        <div class="queue-actions">
          <button class="icon-btn queue-play-btn" title="Play"><i class="fa-solid fa-play"></i></button>
          <button class="icon-btn queue-remove-btn" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;

      item.querySelector('.queue-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        player.setQueue(queue, idx);
      });

      item.querySelector('.queue-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        player.removeFromQueue(idx);
      });

      item.addEventListener('click', () => {
        player.setQueue(queue, idx);
      });

      queueList.appendChild(item);
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('tabArtBtn').classList.toggle('active', tab === 'art');
    document.getElementById('tabLyricsBtn').classList.toggle('active', tab === 'lyrics');
    document.getElementById('tabQueueBtn').classList.toggle('active', tab === 'queue');

    document.getElementById('viewArt').classList.toggle('active', tab === 'art');
    document.getElementById('viewLyrics').classList.toggle('active', tab === 'lyrics');
    document.getElementById('viewQueue').classList.toggle('active', tab === 'queue');

    if (tab === 'lyrics' && this.activeLyricIndex >= 0) {
      setTimeout(() => {
        const curEl = document.getElementById(`lyricLine_${this.activeLyricIndex}`);
        const container = document.getElementById('lyricsContainer');
        if (curEl && container) {
          container.scrollTo({ top: curEl.offsetTop - (container.clientHeight / 2), behavior: 'smooth' });
        }
      }, 50);
    }
  }

  open() {
    this.isExpanded = true;
    this.sheet.classList.remove('hidden');
    requestAnimationFrame(() => this.sheet.classList.add('visible'));
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isExpanded = false;
    this.sheet.classList.remove('visible');
    setTimeout(() => {
      this.sheet.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  _formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
