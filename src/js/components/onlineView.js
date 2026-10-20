/**
 * Online Songs Screen for Listen-X Web.
 * Mirrors the Android app's OnlineSongsScreen.kt with:
 * - Real-time debounced live search
 * - Dynamic genre categories (Trending, Haryanvi, Punjabi, Bollywood, Pop, LoFi)
 * - Quick Artist Pills
 * - In-place song list shuffle & multi-sorting
 * - 320kbps audio streaming, instant downloads, favorites, and playlist picker.
 */

import { api } from '../services/api.js';
import { player } from '../services/audioPlayer.js';
import { storage } from '../services/storage.js';

export class OnlineView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentCategory = 'Trending';
    this.searchQuery = '';
    this.songs = [];
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.refreshSeed = Math.floor(Math.random() * 10000);
    this.debounceTimer = null;

    this.artistPicks = {
      'Haryanvi': [
        'Masoom Sharma', 'Gulzaar Chhaniwala', 'Renuka Panwar',
        'Amit Saini Rohtakiya', 'KD Desi Rock', 'Diler Kharkiya',
        'Sapna Choudhary', 'Khasa Aala Chahar', 'Ajay Hooda', 'Sumit Goswami'
      ],
      'Punjabi': [
        'Sidhu Moosewala', 'Karan Aujla', 'Diljit Dosanjh',
        'AP Dhillon', 'Shubh', 'Amrit Maan', 'B Praak', 'Jass Manak'
      ],
      'Bollywood': [
        'Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam',
        'Jubin Nautiyal', 'Badshah', 'Kishore Kumar', 'Pritam'
      ],
      'Pop': [
        'Taylor Swift', 'Ed Sheeran', 'The Weeknd', 'Dua Lipa', 'Justin Bieber'
      ],
      'Trending': [
        'Masoom Sharma', 'Sidhu Moosewala', 'Arijit Singh',
        'Karan Aujla', 'Gulzaar Chhaniwala', 'Shreya Ghoshal', 'Diljit Dosanjh'
      ],
      'LoFi': [
        'Bollywood LoFi', 'Midnight LoFi', 'Rainy Day LoFi', 'Punjabi Chill LoFi'
      ]
    };

    this._createDOM();
    this._bindEvents();
    this.loadSongs(true);
  }

  _createDOM() {
    this.container.innerHTML = `
      <div class="online-screen">
        <!-- Top Search Bar -->
        <div class="search-bar-wrapper">
          <div class="search-input-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" class="search-input" id="onlineSearchInput" placeholder="Search songs, artists, Haryanvi, Punjabi, Bollywood..." />
            <button class="search-clear-btn hidden" id="searchClearBtn" title="Clear">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="categories-row">
          <button class="category-pill active" data-cat="Trending"><i class="fa-solid fa-fire"></i> Trending</button>
          <button class="category-pill" data-cat="Haryanvi"><i class="fa-solid fa-bolt"></i> Haryanvi</button>
          <button class="category-pill" data-cat="Punjabi"><i class="fa-solid fa-music"></i> Punjabi</button>
          <button class="category-pill" data-cat="Bollywood"><i class="fa-solid fa-film"></i> Bollywood</button>
          <button class="category-pill" data-cat="Pop"><i class="fa-solid fa-globe"></i> Pop</button>
          <button class="category-pill" data-cat="LoFi"><i class="fa-solid fa-moon"></i> LoFi</button>
        </div>

        <!-- Artist Quick Picks -->
        <div class="artists-quick-row" id="artistsQuickRow"></div>

        <!-- Section Header with Shuffle & Sorting -->
        <div class="section-header-bar">
          <div class="section-title-group">
            <h3 class="section-title" id="sectionHeaderTitle">Trending Hits</h3>
            <span class="section-badge" id="sectionHeaderCount">0 Songs</span>
          </div>
          <div class="section-actions-group">
            <button class="glass-pill-btn" id="sectionShuffleBtn" title="In-place list shuffle">
              <i class="fa-solid fa-shuffle"></i> Shuffle Order
            </button>
            <div class="sort-dropdown-wrapper">
              <select class="sort-select" id="sortSelect">
                <option value="default">Default Order</option>
                <option value="title_asc">Title (A - Z)</option>
                <option value="title_desc">Title (Z - A)</option>
                <option value="artist">Artist Name</option>
                <option value="duration">Longest Track</option>
              </select>
            </div>
            <button class="icon-btn refresh-feed-btn" id="refreshFeedBtn" title="Refresh Feed">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
        </div>

        <!-- Song Cards Grid / List -->
        <div class="songs-grid" id="songsGrid">
          <div class="loading-shimmer-container">
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
          </div>
        </div>

        <!-- Load More Button -->
        <div class="load-more-row">
          <button class="glass-pill-btn load-more-btn" id="loadMoreBtn">
            <i class="fa-solid fa-plus"></i> Load More Songs
          </button>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('onlineSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearBtn.classList.toggle('hidden', q.length === 0);

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.searchQuery = q;
        this.currentPage = 1;
        this.loadSongs(true);
      }, 400);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearBtn.classList.add('hidden');
      this.currentPage = 1;
      this.loadSongs(true);
    });

    // Category Pills
    this.container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.cat;
        searchInput.value = '';
        this.searchQuery = '';
        clearBtn.classList.add('hidden');
        this.currentPage = 1;
        this._renderArtistPicks();
        this.loadSongs(true);
      });
    });

    // In-place shuffle order
    document.getElementById('sectionShuffleBtn').addEventListener('click', () => {
      this.shuffleVisibleSongs();
    });

    // Sorting
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      this.sortVisibleSongs(e.target.value);
    });

    // Refresh Feed
    document.getElementById('refreshFeedBtn').addEventListener('click', () => {
      this.refreshSeed = Math.floor(Math.random() * 10000);
      this.currentPage = 1;
      const icon = document.getElementById('refreshFeedBtn').querySelector('i');
      icon.classList.add('fa-spin');
      this.loadSongs(true).finally(() => icon.classList.remove('fa-spin'));
    });

    // Load More
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
      if (!this.isLoading) {
        this.currentPage++;
        this.loadSongs(false);
      }
    });

    // Listen to favorite & player state changes
    player.subscribe((event) => {
      if (event === 'songChanged' || event === 'playStateChanged') {
        this._highlightActiveSong();
      }
    });

    this._renderArtistPicks();
  }

  _renderArtistPicks() {
    const row = document.getElementById('artistsQuickRow');
    const artists = this.artistPicks[this.currentCategory] || this.artistPicks['Trending'];
    row.innerHTML = '';

    artists.forEach(artist => {
      const pill = document.createElement('button');
      pill.className = 'artist-pill';
      pill.innerHTML = `<i class="fa-solid fa-microphone-lines"></i> ${artist}`;
      pill.addEventListener('click', () => {
        document.getElementById('onlineSearchInput').value = artist;
        document.getElementById('searchClearBtn').classList.remove('hidden');
        this.searchQuery = artist;
        this.currentPage = 1;
        this.loadSongs(true);
      });
      row.appendChild(pill);
    });
  }

  async loadSongs(reset = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    const songsGrid = document.getElementById('songsGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const headerTitle = document.getElementById('sectionHeaderTitle');

    if (reset) {
      songsGrid.innerHTML = `
        <div class="loading-shimmer-container">
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
        </div>
      `;
    }
    loadMoreBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';

    let newSongs = [];
    if (this.searchQuery.trim()) {
      headerTitle.textContent = `Search: "${this.searchQuery}"`;
      newSongs = await api.searchSongs(this.searchQuery, 30, this.currentPage);
    } else {
      headerTitle.textContent = `${this.currentCategory} Hits`;
      newSongs = await api.getTrendingSongs(this.currentCategory, this.currentPage, this.refreshSeed);
    }

    if (reset) {
      this.songs = newSongs;
    } else {
      // Append deduplicated
      const seen = new Set(this.songs.map(s => s.id));
      for (let s of newSongs) {
        if (!seen.has(s.id)) {
          this.songs.push(s);
          seen.add(s.id);
        }
      }
    }

    this.isLoading = false;
    loadMoreBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Load More Songs';

    document.getElementById('sectionHeaderCount').textContent = `${this.songs.length} Songs`;
    player.setFeedSongs(this.songs);
    this._renderSongsGrid();
  }

  _renderSongsGrid() {
    const grid = document.getElementById('songsGrid');
    grid.innerHTML = '';

    if (this.songs.length === 0) {
      grid.innerHTML = `
        <div class="empty-results-box">
          <i class="fa-solid fa-compact-disc empty-icon"></i>
          <h4>No songs found</h4>
          <p>Try searching for a different track, artist, or category</p>
        </div>
      `;
      return;
    }

    const currentPlayingSong = player.getCurrentSong();

    this.songs.forEach((song, idx) => {
      const isPlayingCurrent = currentPlayingSong && currentPlayingSong.id === song.id;
      const isFav = storage.isFavorite(song.id);

      const card = document.createElement('div');
      card.className = `song-card ${isPlayingCurrent ? 'active-playing-card' : ''}`;
      card.dataset.id = song.id;

      card.innerHTML = `
        <div class="song-card-art-box">
          <img class="song-card-art" src="${song.artworkUri || 'assets/favicon.svg'}" alt="${song.title}" loading="lazy" />
          <div class="song-card-play-overlay">
            <button class="card-play-btn" title="Play">
              <i class="fa-solid ${isPlayingCurrent && player.isPlaying ? 'fa-pause' : 'fa-play'}"></i>
            </button>
          </div>
          ${isPlayingCurrent ? '<div class="card-wave-indicator"><span class="bar b1"></span><span class="bar b2"></span><span class="bar b3"></span></div>' : ''}
        </div>
        <div class="song-card-info">
          <div class="song-card-title" title="${song.title}">${song.title}</div>
          <div class="song-card-artist" title="${song.artist}">${song.artist}</div>
          <div class="song-card-meta">
            <span class="badge-quality">320K</span>
            <span class="song-duration">${this._formatDuration(song.durationMs)}</span>
          </div>
        </div>
        <div class="song-card-actions">
          <button class="icon-btn card-fav-btn ${isFav ? 'active-heart' : ''}" title="Favorite">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <button class="icon-btn card-download-btn" title="Download Audio">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="icon-btn card-menu-btn" title="Options">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
      `;

      // Play song when clicking card
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        player.playSong(song);
      });

      card.querySelector('.card-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlayingCurrent) {
          player.togglePlay();
        } else {
          player.playSong(song);
        }
      });

      // Favorite toggle
      const favBtn = card.querySelector('.card-fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowFav = storage.toggleFavorite(song);
        favBtn.classList.toggle('active-heart', nowFav);
        favBtn.innerHTML = `<i class="fa-${nowFav ? 'solid' : 'regular'} fa-heart"></i>`;
        window.dispatchEvent(new CustomEvent('favorites-changed'));
      });

      // Download
      card.querySelector('.card-download-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        player.downloadSong(song);
      });

      // Options Menu
      card.querySelector('.card-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._openSongMenu(song, e);
      });

      grid.appendChild(card);
    });
  }

  _highlightActiveSong() {
    const cur = player.getCurrentSong();
    document.querySelectorAll('.song-card').forEach(card => {
      const isCur = cur && card.dataset.id === cur.id;
      card.classList.toggle('active-playing-card', isCur);
      const playIcon = card.querySelector('.card-play-btn i');
      if (playIcon) {
        playIcon.className = `fa-solid ${isCur && player.isPlaying ? 'fa-pause' : 'fa-play'}`;
      }
    });
  }

  shuffleVisibleSongs() {
    if (this.songs.length <= 1) return;
    for (let i = this.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
    }
    this._renderSongsGrid();
  }

  sortVisibleSongs(criteria) {
    if (criteria === 'title_asc') {
      this.songs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (criteria === 'title_desc') {
      this.songs.sort((a, b) => b.title.localeCompare(a.title));
    } else if (criteria === 'artist') {
      this.songs.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (criteria === 'duration') {
      this.songs.sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0));
    }
    this._renderSongsGrid();
  }

  _openSongMenu(song, event) {
    const existing = document.getElementById('floatingSongMenu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'floatingSongMenu';
    menu.className = 'floating-context-menu';

    const isFav = storage.isFavorite(song.id);
    menu.innerHTML = `
      <div class="menu-item" id="mPlayNext"><i class="fa-solid fa-forward-step"></i> Play Next</div>
      <div class="menu-item" id="mAddToQueue"><i class="fa-solid fa-list-ul"></i> Add to Queue</div>
      <div class="menu-item" id="mAddToPlaylist"><i class="fa-solid fa-folder-plus"></i> Add to Playlist</div>
      <div class="menu-item" id="mToggleFav"><i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i> ${isFav ? 'Remove Favorite' : 'Save to Favorites'}</div>
      <div class="menu-item" id="mDownload"><i class="fa-solid fa-download"></i> Download Track</div>
      <div class="menu-item" id="mDetails"><i class="fa-solid fa-circle-info"></i> Track Details</div>
    `;

    // Position menu near click
    const rect = event.target.getBoundingClientRect();
    menu.style.top = `${Math.min(window.innerHeight - 250, rect.bottom + 8)}px`;
    menu.style.left = `${Math.max(16, rect.left - 160)}px`;

    document.body.appendChild(menu);

    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 50);

    menu.querySelector('#mPlayNext').addEventListener('click', () => {
      player.playNextInQueue(song);
      menu.remove();
    });

    menu.querySelector('#mAddToQueue').addEventListener('click', () => {
      player.addToQueue(song);
      menu.remove();
    });

    menu.querySelector('#mAddToPlaylist').addEventListener('click', () => {
      menu.remove();
      this._openAddToPlaylistDialog(song);
    });

    menu.querySelector('#mToggleFav').addEventListener('click', () => {
      storage.toggleFavorite(song);
      this._updateShortcutCounts();
      this._renderSongsGrid();
      window.dispatchEvent(new CustomEvent('favorites-changed'));
      menu.remove();
    });

    menu.querySelector('#mDownload').addEventListener('click', () => {
      player.downloadSong(song);
      menu.remove();
    });

    menu.querySelector('#mDetails').addEventListener('click', () => {
      menu.remove();
      this._openTrackDetailsModal(song);
    });
  }

  _openAddToPlaylistDialog(song) {
    const playlists = storage.getPlaylists().filter(p => !p.isSystem);
    const modal = document.createElement('div');
    modal.className = 'glass-modal-overlay';
    modal.innerHTML = `
      <div class="glass-modal-card">
        <div class="modal-header">
          <h3>Add to Playlist</h3>
          <button class="icon-btn modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-subtext">Select a playlist for <b>${song.title}</b></p>
          <div class="playlist-picker-list">
            ${playlists.length === 0 ? '<p class="empty-note">No custom playlists yet. Create one in Playlists tab.</p>' : ''}
            ${playlists.map(p => `
              <div class="playlist-picker-item" data-id="${p.id}">
                <i class="fa-solid fa-music"></i>
                <div class="picker-item-info">
                  <strong>${p.title}</strong>
                  <small>${p.songs.length} tracks</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelectorAll('.playlist-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        storage.addSongToPlaylist(id, song);
        modal.remove();
      });
    });
  }

  _openTrackDetailsModal(song) {
    const modal = document.createElement('div');
    modal.className = 'glass-modal-overlay';
    modal.innerHTML = `
      <div class="glass-modal-card">
        <div class="modal-header">
          <h3>Track Details</h3>
          <button class="icon-btn modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body details-body">
          <img class="details-art" src="${song.artworkUri || 'assets/favicon.svg'}" alt="Art" />
          <table class="details-table">
            <tr><th>Title</th><td>${song.title}</td></tr>
            <tr><th>Artist</th><td>${song.artist}</td></tr>
            <tr><th>Album</th><td>${song.album || 'Single'}</td></tr>
            <tr><th>Duration</th><td>${this._formatDuration(song.durationMs)}</td></tr>
            <tr><th>Quality</th><td>320 kbps High-Fidelity Audio</td></tr>
            <tr><th>Audio Engine</th><td>Media3 / Web Audio API</td></tr>
            <tr><th>Source</th><td>${song.isLaptop ? 'Laptop D:\\music' : 'Listen-X Stream Engine'}</td></tr>
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  _formatDuration(ms) {
    const totalSec = Math.round((ms || 0) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
