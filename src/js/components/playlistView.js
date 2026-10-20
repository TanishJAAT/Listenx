/**
 * Playlists & Library Screen for Listen-X Web.
 * Features:
 * - Liked Songs & History collections
 * - Custom Playlist creator and management
 * - Laptop D:\music Server streamer integration
 * - Offline Local Music files ingestion (HTML5 Audio drag & drop / picker)
 */

import { storage } from '../services/storage.js';
import { player } from '../services/audioPlayer.js';
import { api } from '../services/api.js';

export class PlaylistView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activePlaylist = null; // null or Playlist object
    this.activeSubView = null;  // 'liked' | 'history' | 'laptop' | 'local'
    this.laptopSongs = [];
    this.localFiles = [];

    this._createDOM();
    this._bindEvents();
    this.refresh();
  }

  _createDOM() {
    this.container.innerHTML = `
      <div class="playlists-screen">
        <!-- Sub-View Detail Header (Hidden by default, shown when viewing a specific playlist/category) -->
        <div class="subview-header hidden" id="subviewHeader">
          <button class="icon-btn subview-back-btn" id="subviewBackBtn" title="Back">
            <i class="fa-solid fa-arrow-left"></i> Back to Library
          </button>
          <div class="subview-meta-row">
            <div class="subview-icon-box" id="subviewIconBox"><i class="fa-solid fa-heart"></i></div>
            <div class="subview-info">
              <h2 class="subview-title" id="subviewTitle">Liked Songs</h2>
              <p class="subview-desc" id="subviewDesc">Tracks you love</p>
              <div class="subview-actions">
                <button class="glass-pill-btn subview-play-all-btn" id="subviewPlayAllBtn">
                  <i class="fa-solid fa-play"></i> Play All
                </button>
                <button class="glass-pill-btn subview-clear-btn hidden" id="subviewClearBtn">
                  <i class="fa-solid fa-trash"></i> Clear History
                </button>
              </div>
            </div>
          </div>
          <div class="subview-songs-list" id="subviewSongsList"></div>
        </div>

        <!-- Main Library View -->
        <div class="library-main" id="libraryMain">
          <!-- Library Header -->
          <div class="library-header-row">
            <div>
              <h2 class="library-title">Your Music Library</h2>
              <p class="library-subtitle">Playlists, Laptop streamer, and local files</p>
            </div>
            <button class="glass-pill-btn create-playlist-btn" id="createPlaylistBtn">
              <i class="fa-solid fa-plus"></i> New Playlist
            </button>
          </div>

          <!-- Pinned System Playlists Row -->
          <div class="system-playlists-grid">
            <!-- Liked Songs -->
            <div class="system-card heart-card" id="cardLikedSongs">
              <div class="system-card-icon"><i class="fa-solid fa-heart"></i></div>
              <div class="system-card-info">
                <h3>Liked Songs</h3>
                <span id="likedSongsBadge">0 Tracks</span>
              </div>
              <button class="system-card-play-btn" title="Play All"><i class="fa-solid fa-play"></i></button>
            </div>

            <!-- Recently Played History -->
            <div class="system-card history-card" id="cardHistory">
              <div class="system-card-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
              <div class="system-card-info">
                <h3>Listening History</h3>
                <span id="historyBadge">0 Tracks</span>
              </div>
              <button class="system-card-play-btn" title="Play All"><i class="fa-solid fa-play"></i></button>
            </div>

            <!-- Laptop D:\music Server -->
            <div class="system-card laptop-card" id="cardLaptop">
              <div class="system-card-icon"><i class="fa-solid fa-laptop"></i></div>
              <div class="system-card-info">
                <h3>Laptop D:\\music</h3>
                <span id="laptopBadge">Connect to server</span>
              </div>
              <button class="system-card-play-btn" title="Stream"><i class="fa-solid fa-satellite-dish"></i></button>
            </div>

            <!-- Local Computer Files -->
            <div class="system-card local-card" id="cardLocalFiles">
              <div class="system-card-icon"><i class="fa-solid fa-folder-open"></i></div>
              <div class="system-card-info">
                <h3>Local Computer Audio</h3>
                <span id="localFilesBadge">Play offline MP3s</span>
              </div>
              <button class="system-card-play-btn" title="Browse"><i class="fa-solid fa-file-audio"></i></button>
            </div>
          </div>

          <!-- Custom User Playlists Section -->
          <div class="custom-playlists-section">
            <h3 class="section-heading">Custom Playlists</h3>
            <div class="custom-playlists-grid" id="customPlaylistsGrid"></div>
          </div>
        </div>
      </div>

      <!-- Hidden Local Audio File Input -->
      <input type="file" id="localAudioFileInput" multiple accept="audio/*" class="hidden" />
    `;
  }

  _bindEvents() {
    // System Cards
    document.getElementById('cardLikedSongs').addEventListener('click', () => this.openSubView('liked'));
    document.getElementById('cardHistory').addEventListener('click', () => this.openSubView('history'));
    document.getElementById('cardLaptop').addEventListener('click', () => this.openSubView('laptop'));
    document.getElementById('cardLocalFiles').addEventListener('click', () => {
      document.getElementById('localAudioFileInput').click();
    });

    // Local file input
    document.getElementById('localAudioFileInput').addEventListener('change', (e) => {
      this.handleLocalFiles(e.target.files);
    });

    // Subview Back Button
    document.getElementById('subviewBackBtn').addEventListener('click', () => this.closeSubView());

    // Subview Play All
    document.getElementById('subviewPlayAllBtn').addEventListener('click', () => {
      if (this.currentSubViewSongs && this.currentSubViewSongs.length > 0) {
        player.setQueue(this.currentSubViewSongs, 0);
      }
    });

    // Subview Clear History
    document.getElementById('subviewClearBtn').addEventListener('click', () => {
      storage.clearHistory();
      this.openSubView('history');
    });

    // Create Playlist Button
    document.getElementById('createPlaylistBtn').addEventListener('click', () => {
      this.openCreatePlaylistModal();
    });

    // Listen for tab navigation requests from outside
    window.addEventListener('nav-tab-change', (e) => {
      if (e.detail && e.detail.tab === 'playlists') {
        if (e.detail.sub) {
          this.openSubView(e.detail.sub);
        } else {
          this.closeSubView();
        }
      }
    });

    window.addEventListener('favorites-changed', () => this.refresh());
  }

  refresh() {
    const favorites = storage.getFavorites();
    const history = storage.getHistory();
    const playlists = storage.getPlaylists().filter(p => !p.isSystem);

    document.getElementById('likedSongsBadge').textContent = `${favorites.length} Tracks`;
    document.getElementById('historyBadge').textContent = `${history.length} Tracks`;

    const grid = document.getElementById('customPlaylistsGrid');
    grid.innerHTML = '';

    if (playlists.length === 0) {
      grid.innerHTML = `
        <div class="empty-playlist-box">
          <i class="fa-solid fa-folder-plus"></i>
          <p>No custom playlists yet. Click "New Playlist" to create one!</p>
        </div>
      `;
      return;
    }

    playlists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'custom-playlist-card';
      card.innerHTML = `
        <div class="custom-card-art">
          <i class="fa-solid fa-${pl.coverIcon || 'music'}"></i>
          <button class="custom-card-play-btn" title="Play All"><i class="fa-solid fa-play"></i></button>
        </div>
        <div class="custom-card-body">
          <h4 class="custom-card-title">${pl.title}</h4>
          <p class="custom-card-desc">${pl.description || `${pl.songs.length} tracks`}</p>
          <div class="custom-card-footer">
            <span class="custom-card-count">${pl.songs.length} songs</span>
            <button class="icon-btn delete-playlist-btn" title="Delete Playlist">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.openPlaylist(pl);
      });

      card.querySelector('.custom-card-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (pl.songs.length > 0) player.setQueue(pl.songs, 0);
      });

      card.querySelector('.delete-playlist-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete playlist "${pl.title}"?`)) {
          storage.deletePlaylist(pl.id);
          this.refresh();
        }
      });

      grid.appendChild(card);
    });
  }

  openSubView(subType) {
    this.activeSubView = subType;
    document.getElementById('libraryMain').classList.add('hidden');
    const header = document.getElementById('subviewHeader');
    header.classList.remove('hidden');

    const iconBox = document.getElementById('subviewIconBox');
    const title = document.getElementById('subviewTitle');
    const desc = document.getElementById('subviewDesc');
    const clearBtn = document.getElementById('subviewClearBtn');

    clearBtn.classList.add('hidden');

    if (subType === 'liked') {
      iconBox.innerHTML = '<i class="fa-solid fa-heart"></i>';
      iconBox.className = 'subview-icon-box heart-icon';
      title.textContent = 'Liked Songs';
      desc.textContent = 'All your saved favorites';
      this.currentSubViewSongs = storage.getFavorites();
      this._renderSubViewSongs(this.currentSubViewSongs);
    } else if (subType === 'history') {
      iconBox.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i>';
      iconBox.className = 'subview-icon-box history-icon';
      title.textContent = 'Listening History';
      desc.textContent = 'Recently played songs';
      clearBtn.classList.remove('hidden');
      this.currentSubViewSongs = storage.getHistory();
      this._renderSubViewSongs(this.currentSubViewSongs);
    } else if (subType === 'laptop') {
      iconBox.innerHTML = '<i class="fa-solid fa-laptop"></i>';
      iconBox.className = 'subview-icon-box laptop-icon';
      title.textContent = 'Laptop D:\\music Streamer';
      desc.textContent = 'Connecting to listenx_server.py...';
      this._loadLaptopSongs();
    } else if (subType === 'local') {
      iconBox.innerHTML = '<i class="fa-solid fa-folder-open"></i>';
      iconBox.className = 'subview-icon-box local-icon';
      title.textContent = 'Local Computer Audio';
      desc.textContent = `${this.localFiles.length} loaded offline tracks`;
      this.currentSubViewSongs = this.localFiles;
      this._renderSubViewSongs(this.localFiles);
    }
  }

  openPlaylist(playlist) {
    this.activePlaylist = playlist;
    document.getElementById('libraryMain').classList.add('hidden');
    const header = document.getElementById('subviewHeader');
    header.classList.remove('hidden');

    const iconBox = document.getElementById('subviewIconBox');
    const title = document.getElementById('subviewTitle');
    const desc = document.getElementById('subviewDesc');
    const clearBtn = document.getElementById('subviewClearBtn');

    clearBtn.classList.add('hidden');
    iconBox.innerHTML = `<i class="fa-solid fa-${playlist.coverIcon || 'music'}"></i>`;
    iconBox.className = 'subview-icon-box playlist-icon';
    title.textContent = playlist.title;
    desc.textContent = playlist.description || `${playlist.songs.length} tracks`;

    this.currentSubViewSongs = playlist.songs;
    this._renderSubViewSongs(playlist.songs, playlist.id);
  }

  closeSubView() {
    this.activePlaylist = null;
    this.activeSubView = null;
    document.getElementById('subviewHeader').classList.add('hidden');
    document.getElementById('libraryMain').classList.remove('hidden');
    this.refresh();
  }

  _renderSubViewSongs(songs, playlistId = null) {
    const list = document.getElementById('subviewSongsList');
    list.innerHTML = '';

    if (!songs || songs.length === 0) {
      list.innerHTML = '<div class="subview-empty"><i class="fa-solid fa-compact-disc"></i><p>No songs found in this collection.</p></div>';
      return;
    }

    const currentPlaying = player.getCurrentSong();

    songs.forEach((song, idx) => {
      const isCur = currentPlaying && currentPlaying.id === song.id;
      const isFav = storage.isFavorite(song.id);

      const row = document.createElement('div');
      row.className = `subview-song-row ${isCur ? 'active-track' : ''}`;
      row.innerHTML = `
        <span class="subview-track-index">${isCur ? '<i class="fa-solid fa-volume-high active-wave-icon"></i>' : idx + 1}</span>
        <img class="subview-art" src="${song.artworkUri || 'assets/favicon.svg'}" alt="Art" />
        <div class="subview-song-meta">
          <div class="subview-song-title">${song.title}</div>
          <div class="subview-song-artist">${song.artist}</div>
        </div>
        <span class="subview-song-album">${song.album || 'Single'}</span>
        <span class="subview-song-duration">${this._formatDuration(song.durationMs)}</span>
        <div class="subview-song-actions">
          <button class="icon-btn row-fav-btn ${isFav ? 'active-heart' : ''}" title="Favorite">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <button class="icon-btn row-play-btn" title="Play">
            <i class="fa-solid fa-play"></i>
          </button>
          ${playlistId ? `<button class="icon-btn row-remove-btn" title="Remove from playlist"><i class="fa-solid fa-xmark"></i></button>` : ''}
        </div>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        player.setQueue(songs, idx);
      });

      row.querySelector('.row-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        player.setQueue(songs, idx);
      });

      row.querySelector('.row-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const nowFav = storage.toggleFavorite(song);
        row.querySelector('.row-fav-btn').classList.toggle('active-heart', nowFav);
        row.querySelector('.row-fav-btn').innerHTML = `<i class="fa-${nowFav ? 'solid' : 'regular'} fa-heart"></i>`;
        this.refresh();
      });

      if (playlistId) {
        row.querySelector('.row-remove-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          storage.removeSongFromPlaylist(playlistId, song.id);
          const updated = storage.getPlaylists().find(p => p.id === playlistId);
          if (updated) this.openPlaylist(updated);
        });
      }

      list.appendChild(row);
    });
  }

  async _loadLaptopSongs() {
    const list = document.getElementById('subviewSongsList');
    list.innerHTML = '<div class="subview-empty"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Scanning D:\\music on Listen-X Server...</p></div>';

    const serverUrl = storage.getServerUrl();
    const songs = await api.getLaptopSongs(serverUrl);
    this.laptopSongs = songs;
    this.currentSubViewSongs = songs;

    if (songs.length > 0) {
      document.getElementById('subviewDesc').textContent = `Connected to ${serverUrl} (${songs.length} tracks)`;
      document.getElementById('laptopBadge').textContent = `${songs.length} Tracks ready`;
      this._renderSubViewSongs(songs);
    } else {
      document.getElementById('subviewDesc').textContent = `Could not connect to ${serverUrl}`;
      list.innerHTML = `
        <div class="subview-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h4>Listen-X Laptop Server Not Detected</h4>
          <p>Make sure <code>python listenx_server.py</code> is running on port 8080 or check your server URL in Settings.</p>
          <button class="glass-pill-btn retry-server-btn" id="retryServerBtn"><i class="fa-solid fa-rotate-right"></i> Retry Connection</button>
        </div>
      `;
      document.getElementById('retryServerBtn')?.addEventListener('click', () => this._loadLaptopSongs());
    }
  }

  handleLocalFiles(files) {
    if (!files || files.length === 0) return;

    this.localFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const blobUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      let title = cleanName;
      let artist = 'Local Computer';

      if (cleanName.includes(' - ')) {
        const parts = cleanName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      this.localFiles.push({
        id: `local_${Date.now()}_${i}`,
        title: title,
        artist: artist,
        album: 'Local Storage',
        durationMs: 0,
        streamUrl: blobUrl,
        artworkUri: 'assets/favicon.svg',
        mimeType: file.type || 'audio/mpeg',
        isLocalFile: true
      });
    }

    document.getElementById('localFilesBadge').textContent = `${this.localFiles.length} Tracks loaded`;
    this.openSubView('local');
    if (this.localFiles.length > 0) {
      player.setQueue(this.localFiles, 0);
    }
  }

  openCreatePlaylistModal() {
    const modal = document.createElement('div');
    modal.className = 'glass-modal-overlay';
    modal.innerHTML = `
      <div class="glass-modal-card">
        <div class="modal-header">
          <h3>Create New Playlist</h3>
          <button class="icon-btn modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Playlist Name</label>
            <input type="text" class="glass-input" id="newPlTitle" placeholder="e.g. Late Night Vibe" autofocus />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <input type="text" class="glass-input" id="newPlDesc" placeholder="e.g. My favorite midnight tunes" />
          </div>
          <button class="glass-pill-btn primary-action-btn" id="submitCreatePlBtn">
            <i class="fa-solid fa-check"></i> Create Playlist
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const input = modal.querySelector('#newPlTitle');
    setTimeout(() => input.focus(), 50);

    modal.querySelector('#submitCreatePlBtn').addEventListener('click', () => {
      const title = input.value.trim();
      const desc = modal.querySelector('#newPlDesc').value.trim();
      if (title) {
        storage.createPlaylist(title, desc);
        modal.remove();
        this.refresh();
      }
    });
  }

  _formatDuration(ms) {
    if (!ms || ms <= 0) return '--:--';
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
