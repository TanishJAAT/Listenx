// ==========================================
// 🎵 Listen-X Smart Music Player Engine
// ==========================================

// Global State
let currentSongs = [];
let currentSongIndex = -1;
let selectedBitrate = '320';
let smartAutoplayEnabled = true;

let currentMode = 'genre'; // 'genre' | 'search' | 'for-you' | 'liked'
let currentParam = 'for-you';
let currentTitle = '✨ Made For You';
let currentPage = 1;
let isLoading = false;
let hasMore = true;

const audio = document.getElementById('audioElement');

// Preset Languages & Dynamic Singers Matrix
const TASTE_DATABASE = {
  languages: [
    { id: 'Hindi', label: '🇮🇳 Hindi (Bollywood)', default: true },
    { id: 'Haryanvi', label: '🚜 Haryanvi', default: true },
    { id: 'Punjabi', label: '👳 Punjabi', default: true },
    { id: 'English', label: '🌐 English (Pop)', default: false },
    { id: 'Bhojpuri', label: '🪕 Bhojpuri', default: false },
    { id: 'South', label: '🌴 South (Tamil/Telugu)', default: false }
  ],
  singersByLang: {
    Hindi: ['Arijit Singh', 'Shreya Ghoshal', 'KK', 'Sonu Nigam', 'Atif Aslam', 'Mohit Chauhan', 'Jubin Nautiyal', 'Badshah', 'Neha Kakkar'],
    Haryanvi: ['Diler Kharkiya', 'Masoom Sharma', 'Gulzaar Chhaniwala', 'Renuka Panwar', 'Ajay Hooda', 'Khasa Aala Chahar', 'Raju Punjabi'],
    Punjabi: ['Diljit Dosanjh', 'Karan Aujla', 'Sidhu Moose Wala', 'AP Dhillon', 'Shubh', 'B Praak', 'Ammy Virk', 'Guru Randhawa'],
    English: ['The Weeknd', 'Taylor Swift', 'Ed Sheeran', 'Justin Bieber', 'Drake', 'Post Malone', 'Dua Lipa', 'Billie Eilish'],
    Bhojpuri: ['Pawan Singh', 'Khesari Lal Yadav', 'Shilpi Raj', 'Manoj Tiwari'],
    South: ['Anirudh Ravichander', 'Sid Sriram', 'A.R. Rahman', 'Armaan Malik']
  }
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const genreChips = document.querySelectorAll('.chip');
const songsGrid = document.getElementById('songsGrid');
const sectionTitle = document.getElementById('sectionTitle');
const sectionSubtitle = document.getElementById('sectionSubtitle');
const songsCount = document.getElementById('songsCount');
const bottomLoader = document.getElementById('bottomLoader');
const scrollSentinel = document.getElementById('scrollSentinel');
const likedCountEl = document.getElementById('likedCount');

// Player DOM Elements
const playerCover = document.getElementById('playerCover');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerLikeBtn = document.getElementById('playerLikeBtn');
const smartAutoplayBtn = document.getElementById('smartAutoplayBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekSlider = document.getElementById('seekSlider');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const volumeSlider = document.getElementById('volumeSlider');
const bitrateSelect = document.getElementById('bitrateSelect');
const eqBars = document.getElementById('eqBars');
const directAudioBtn = document.getElementById('directAudioBtn');
const downloadCurrentBtn = document.getElementById('downloadCurrentBtn');
const skipBackBtn = document.getElementById('skipBackBtn');
const skipForwardBtn = document.getElementById('skipForwardBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const myTasteBtn = document.getElementById('myTasteBtn');

// Modal Elements
const inspectorModal = document.getElementById('inspectorModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalJsonContent = document.getElementById('modalJsonContent');
const modalStreamUrl = document.getElementById('modalStreamUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');

// Taste Modal Elements
const tasteModal = document.getElementById('tasteModal');
const closeTasteModalBtn = document.getElementById('closeTasteModalBtn');
const langChipsContainer = document.getElementById('langChipsContainer');
const artistChipsContainer = document.getElementById('artistChipsContainer');
const saveTasteBtn = document.getElementById('saveTasteBtn');

// ==========================================
// 💾 Local Storage & User Taste Management
// ==========================================
function getUserTaste() {
  const saved = localStorage.getItem('listenx_user_taste');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return null;
}

function saveUserTaste(taste) {
  localStorage.setItem('listenx_user_taste', JSON.stringify(taste));
}

function getLikedSongs() {
  const saved = localStorage.getItem('listenx_liked_songs');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveLikedSongs(list) {
  localStorage.setItem('listenx_liked_songs', JSON.stringify(list));
  updateLikedCounter();
}

function isSongLiked(songId) {
  const liked = getLikedSongs();
  return liked.some(s => s.id === songId);
}

function toggleLikeSong(song, buttonEl = null) {
  let liked = getLikedSongs();
  const exists = liked.some(s => s.id === song.id);

  if (exists) {
    liked = liked.filter(s => s.id !== song.id);
  } else {
    liked.unshift(song);
  }
  saveLikedSongs(liked);
  updateCardsVisual();
  updatePlayerLikeState();

  // If in liked view, re-render
  if (currentMode === 'liked') {
    renderLikedSongsView();
  }
}

function updateLikedCounter() {
  const count = getLikedSongs().length;
  if (likedCountEl) likedCountEl.textContent = count;
}

function updatePlayerLikeState() {
  if (!playerLikeBtn) return;
  if (currentSongIndex >= 0 && currentSongs[currentSongIndex]) {
    const currentSong = currentSongs[currentSongIndex];
    if (isSongLiked(currentSong.id)) {
      playerLikeBtn.innerHTML = '❤️';
      playerLikeBtn.classList.add('liked');
    } else {
      playerLikeBtn.innerHTML = '🤍';
      playerLikeBtn.classList.remove('liked');
    }
  } else {
    playerLikeBtn.innerHTML = '🤍';
    playerLikeBtn.classList.remove('liked');
  }
}

// ==========================================
// 🎨 Taste Preferences Onboarding Modal
// ==========================================
let tempSelectedLangs = new Set(['Hindi', 'Haryanvi', 'Punjabi']);
let tempSelectedSingers = new Set(['Arijit Singh', 'Diljit Dosanjh', 'Masoom Sharma']);

function openTasteModal() {
  const currentTaste = getUserTaste();
  if (currentTaste) {
    tempSelectedLangs = new Set(currentTaste.languages || ['Hindi']);
    tempSelectedSingers = new Set(currentTaste.singers || ['Arijit Singh']);
  }
  renderTasteModalContent();
  tasteModal.classList.add('open');
}

function closeTasteModal() {
  tasteModal.classList.remove('open');
}

function renderTasteModalContent() {
  // Render Languages
  langChipsContainer.innerHTML = '';
  TASTE_DATABASE.languages.forEach(lang => {
    const chip = document.createElement('div');
    const isSelected = tempSelectedLangs.has(lang.id);
    chip.className = `pref-chip ${isSelected ? 'selected' : ''}`;
    chip.innerHTML = `${isSelected ? '✓ ' : ''}${lang.label}`;
    chip.addEventListener('click', () => {
      if (tempSelectedLangs.has(lang.id)) {
        if (tempSelectedLangs.size > 1) tempSelectedLangs.delete(lang.id);
      } else {
        tempSelectedLangs.add(lang.id);
      }
      renderTasteModalContent();
    });
    langChipsContainer.appendChild(chip);
  });

  // Render Singers based on selected languages
  artistChipsContainer.innerHTML = '';
  const eligibleSingers = new Set();
  tempSelectedLangs.forEach(langId => {
    const singers = TASTE_DATABASE.singersByLang[langId] || [];
    singers.forEach(s => eligibleSingers.add(s));
  });

  eligibleSingers.forEach(singer => {
    const chip = document.createElement('div');
    const isSelected = tempSelectedSingers.has(singer);
    chip.className = `pref-chip ${isSelected ? 'selected' : ''}`;
    chip.innerHTML = `${isSelected ? '✓ ' : ''}${singer}`;
    chip.addEventListener('click', () => {
      if (tempSelectedSingers.has(singer)) {
        if (tempSelectedSingers.size > 1) tempSelectedSingers.delete(singer);
      } else {
        tempSelectedSingers.add(singer);
      }
      chip.classList.toggle('selected');
      chip.innerHTML = `${tempSelectedSingers.has(singer) ? '✓ ' : ''}${singer}`;
    });
    artistChipsContainer.appendChild(chip);
  });
}

saveTasteBtn.addEventListener('click', () => {
  const newTaste = {
    languages: Array.from(tempSelectedLangs),
    singers: Array.from(tempSelectedSingers)
  };
  saveUserTaste(newTaste);
  closeTasteModal();
  loadForYouFeed(1);
});

myTasteBtn.addEventListener('click', openTasteModal);
closeTasteModalBtn.addEventListener('click', closeTasteModal);
tasteModal.addEventListener('click', (e) => {
  if (e.target === tasteModal) closeTasteModal();
});

// ==========================================
// 📡 API Fetchers
// ==========================================
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function fetchForYouSongs(page = 1) {
  const taste = getUserTaste() || {
    languages: ['Hindi', 'Haryanvi', 'Punjabi'],
    singers: ['Arijit Singh', 'Diljit Dosanjh', 'Masoom Sharma']
  };
  const langs = encodeURIComponent(taste.languages.join(','));
  const singers = encodeURIComponent(taste.singers.join(','));
  const res = await fetch(`/api/for-you?languages=${langs}&singers=${singers}&page=${page}&limit=24&_t=${Date.now()}`);
  return await res.json();
}

async function fetchGenreSongs(genre, page = 1) {
  const res = await fetch(`/api/trending?genre=${encodeURIComponent(genre)}&page=${page}&limit=24&_t=${Date.now()}`);
  return await res.json();
}

async function fetchSearchSongs(query, page = 1) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=24`);
  return await res.json();
}

async function fetchSmartRecommendation(artist, language, excludeId) {
  try {
    const res = await fetch(`/api/recommend?artist=${encodeURIComponent(artist)}&language=${encodeURIComponent(language || '')}&exclude_id=${encodeURIComponent(excludeId)}&limit=10`);
    const data = await res.json();
    return data.songs || [];
  } catch (e) {
    return [];
  }
}

// ==========================================
// 🎵 Feed Loaders
// ==========================================
async function loadForYouFeed(page = 1) {
  currentMode = 'for-you';
  currentParam = 'for-you';
  currentTitle = '✨ Made For You';
  currentPage = page;
  hasMore = true;
  isLoading = true;

  const taste = getUserTaste();
  const summary = taste ? `${taste.languages.join(', ')} • ${taste.singers.slice(0, 3).join(', ')}` : 'Personalized based on your favorite artists';

  sectionTitle.textContent = currentTitle;
  sectionSubtitle.textContent = summary;
  songsGrid.innerHTML = `
    <div class="loader-container">
      <div class="spinner"></div>
      <p>Curating your personalized music stream...</p>
    </div>
  `;
  songsCount.textContent = 'Loading...';
  bottomLoader.style.display = 'none';

  setActiveChip('for-you');

  try {
    const data = await fetchForYouSongs(1);
    isLoading = false;
    if (data.success && data.songs) {
      currentSongs = data.songs;
      hasMore = data.has_more !== false && data.songs.length > 0;
      renderInitialSongs(currentSongs);
    } else {
      showError(data.error || 'Failed to load personal feed.');
    }
  } catch (err) {
    isLoading = false;
    showError(err.message);
  }
}

function renderLikedSongsView() {
  currentMode = 'liked';
  currentParam = 'liked';
  currentTitle = '❤️ Your Liked Songs';
  currentPage = 1;
  hasMore = false;
  isLoading = false;

  sectionTitle.textContent = currentTitle;
  sectionSubtitle.textContent = 'Songs you have favorited for instant playback';

  setActiveChip('liked');
  const liked = getLikedSongs();
  currentSongs = liked;

  if (liked.length === 0) {
    songsGrid.innerHTML = `
      <div class="loader-container">
        <p>No liked songs yet! Click the ❤️ icon on any song to save it here.</p>
      </div>
    `;
    songsCount.textContent = '0 liked tracks';
    bottomLoader.style.display = 'none';
    return;
  }

  renderInitialSongs(liked);
  songsCount.textContent = `${liked.length} liked tracks`;
}

async function loadGenre(genre, title) {
  if (genre === 'for-you') {
    loadForYouFeed(1);
    return;
  }
  if (genre === 'liked') {
    renderLikedSongsView();
    return;
  }

  currentMode = 'genre';
  currentParam = genre;
  currentTitle = title;
  currentPage = 1;
  hasMore = true;
  isLoading = true;

  sectionTitle.textContent = title;
  sectionSubtitle.textContent = 'Auto-loading endless stream library as you scroll down';
  songsGrid.innerHTML = `
    <div class="loader-container">
      <div class="spinner"></div>
      <p>Loading ${title}...</p>
    </div>
  `;
  songsCount.textContent = 'Loading...';
  bottomLoader.style.display = 'none';

  setActiveChip(genre);

  try {
    const data = await fetchGenreSongs(genre, 1);
    isLoading = false;
    if (data.success && data.songs) {
      currentSongs = data.songs;
      hasMore = data.has_more !== false && data.songs.length > 0;
      renderInitialSongs(currentSongs);
    } else {
      showError(data.error || 'Failed to fetch songs.');
    }
  } catch (err) {
    isLoading = false;
    showError(err.message);
  }
}

async function performSearch(query) {
  if (!query || !query.trim()) return;
  const q = query.trim();

  currentMode = 'search';
  currentParam = q;
  currentTitle = `Search results for "${q}"`;
  currentPage = 1;
  hasMore = true;
  isLoading = true;

  sectionTitle.textContent = currentTitle;
  sectionSubtitle.textContent = 'Auto-loading more results as you scroll down';
  songsGrid.innerHTML = `
    <div class="loader-container">
      <div class="spinner"></div>
      <p>Searching for "${q}"...</p>
    </div>
  `;
  songsCount.textContent = 'Searching...';
  bottomLoader.style.display = 'none';

  genreChips.forEach(c => c.classList.remove('active'));

  try {
    const data = await fetchSearchSongs(q, 1);
    isLoading = false;
    if (data.success && data.songs) {
      currentSongs = data.songs;
      hasMore = data.has_more !== false && data.songs.length > 0;
      renderInitialSongs(currentSongs);
    } else {
      showError(data.error || 'No results found.');
    }
  } catch (err) {
    isLoading = false;
    showError(err.message);
  }
}

function setActiveChip(genreKey) {
  genreChips.forEach(chip => {
    if (chip.dataset.genre === genreKey) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

// ==========================================
// 📜 Infinite Scroll Handler
// ==========================================
async function loadNextPage() {
  if (isLoading || !hasMore || currentMode === 'liked') return;

  isLoading = true;
  currentPage++;
  bottomLoader.style.display = 'flex';

  try {
    let data;
    if (currentMode === 'for-you') {
      data = await fetchForYouSongs(currentPage);
    } else if (currentMode === 'genre') {
      data = await fetchGenreSongs(currentParam, currentPage);
    } else {
      data = await fetchSearchSongs(currentParam, currentPage);
    }

    if (data.success && data.songs && data.songs.length > 0) {
      const startIndex = currentSongs.length;
      currentSongs = currentSongs.concat(data.songs);
      hasMore = data.has_more !== false && data.songs.length >= 10;
      appendSongCards(data.songs, startIndex);
      updateSongCount();
    } else {
      hasMore = false;
      bottomLoader.innerHTML = `<span style="color:var(--text-muted)">✓ Sabhi gaane load ho gaye (${currentSongs.length} total tracks)</span>`;
    }
  } catch (err) {
    console.warn('Error loading more songs:', err);
  } finally {
    isLoading = false;
    if (hasMore) {
      bottomLoader.style.display = 'none';
    }
  }
}

function updateSongCount() {
  songsCount.textContent = `${currentSongs.length} tracks loaded (Scroll for more)`;
}

// ==========================================
// 🎴 Song Card Component
// ==========================================
function createSongCard(song, idx) {
  const isCurrentPlaying = currentSongIndex === idx && !audio.paused;
  const isLiked = isSongLiked(song.id);
  const card = document.createElement('div');
  card.className = `song-card ${isCurrentPlaying ? 'playing' : ''}`;
  card.dataset.index = idx;

  card.innerHTML = `
    <div class="card-cover-wrap">
      <img src="${song.image_large || song.image_thumb || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23151928\'/%3E%3C/svg%3E'}" alt="${song.title}" loading="lazy">
      <div class="card-play-overlay">
        <button class="card-play-btn" title="Play ${song.title}">
          ${isCurrentPlaying ? '⏸' : '▶'}
        </button>
      </div>
      <div class="card-badges">
        <button class="card-like-btn ${isLiked ? 'liked' : ''}" title="Save to Liked">
          ${isLiked ? '❤️' : '🤍'}
        </button>
        ${song.has_320kbps || song.stream_url_320 ? '<span class="badge-hd">320 KBPS</span>' : ''}
      </div>
    </div>
    <div class="card-info">
      <div class="card-title" title="${song.title}">${song.title}</div>
      <div class="card-artist" title="${song.artist}">${song.artist}</div>
      <div class="card-album" title="${song.album}">${song.album} • ${song.year || '2024'}</div>
      <div class="card-footer">
        <span class="card-duration">⏱ ${formatTime(song.duration)}</span>
        <div class="card-footer-btns">
          <button class="card-download-btn" data-index="${idx}" title="Direct Click to Download HD Audio">⬇ Download</button>
          <button class="card-inspect-btn" data-index="${idx}" title="Inspect API JSON">{ }</button>
        </div>
      </div>
    </div>
  `;

  // Play Button Click
  const playBtn = card.querySelector('.card-play-btn');
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playSongAtIndex(idx);
  });

  // Card Click
  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-inspect-btn') || e.target.closest('.card-download-btn') || e.target.closest('.card-like-btn')) return;
    playSongAtIndex(idx);
  });

  // Like Button Click
  const likeBtn = card.querySelector('.card-like-btn');
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLikeSong(song, likeBtn);
  });

  // Download Button Click
  const dlBtn = card.querySelector('.card-download-btn');
  if (dlBtn) {
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerDownload(song, '320', dlBtn);
    });
  }

  // Inspect JSON Button
  const inspectBtn = card.querySelector('.card-inspect-btn');
  inspectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openInspector(song);
  });

  return card;
}

function renderInitialSongs(songs) {
  if (!songs || songs.length === 0) {
    songsGrid.innerHTML = `
      <div class="loader-container">
        <p>No songs found. Try a different category or search keyword.</p>
      </div>
    `;
    songsCount.textContent = '0 songs';
    bottomLoader.style.display = 'none';
    return;
  }

  songsGrid.innerHTML = '';
  updateSongCount();

  songs.forEach((song, idx) => {
    songsGrid.appendChild(createSongCard(song, idx));
  });

  bottomLoader.innerHTML = `
    <div class="spinner sm"></div>
    <span>Scrolling down... Loading more songs (Auto Infinite Scroll)</span>
  `;
}

function appendSongCards(newSongs, startIndex) {
  newSongs.forEach((song, i) => {
    const globalIdx = startIndex + i;
    songsGrid.appendChild(createSongCard(song, globalIdx));
  });
}

// ==========================================
// 🎧 Audio Playback & Smart Autoplay
// ==========================================
function playSongAtIndex(index) {
  if (index < 0 || index >= currentSongs.length) return;

  const song = currentSongs[index];

  let streamUrl = song.stream_url_320;
  if (selectedBitrate === '160') streamUrl = song.stream_url_160 || song.stream_url_320;
  if (selectedBitrate === '96') streamUrl = song.stream_url_96 || song.stream_url_160;
  if (!streamUrl) streamUrl = song.active_stream;

  if (currentSongIndex === index && !audio.paused) {
    audio.pause();
    updatePlayerUI(false);
    return;
  }

  currentSongIndex = index;
  audio.src = streamUrl;
  audio.play().then(() => {
    updatePlayerUI(true);
  }).catch(err => {
    console.warn('Playback error:', err);
    alert('Audio stream error: ' + err.message);
  });

  playerTitle.textContent = song.title;
  playerArtist.textContent = `${song.artist} — ${song.album}`;
  playerCover.src = song.image_large || song.image_thumb;
  directAudioBtn.dataset.url = streamUrl;

  updatePlayerLikeState();
  updateCardsVisual();
}

function updatePlayerUI(isPlaying) {
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
  if (isPlaying) {
    eqBars.classList.add('active');
  } else {
    eqBars.classList.remove('active');
  }
  updateCardsVisual();
}

function updateCardsVisual() {
  document.querySelectorAll('.song-card').forEach((c, idx) => {
    const playBtn = c.querySelector('.card-play-btn');
    const likeBtn = c.querySelector('.card-like-btn');
    const song = currentSongs[idx];

    if (song && likeBtn) {
      const liked = isSongLiked(song.id);
      likeBtn.innerHTML = liked ? '❤️' : '🤍';
      if (liked) likeBtn.classList.add('liked'); else likeBtn.classList.remove('liked');
    }

    if (idx === currentSongIndex) {
      c.classList.add('playing');
      if (playBtn) playBtn.textContent = audio.paused ? '▶' : '⏸';
    } else {
      c.classList.remove('playing');
      if (playBtn) playBtn.textContent = '▶';
    }
  });
}

// 🧠 Smart Autoplay Handler (Contextual Song Radio)
async function handleSongEnded() {
  if (currentSongIndex === -1 || !currentSongs[currentSongIndex]) {
    updatePlayerUI(false);
    return;
  }

  const finishedSong = currentSongs[currentSongIndex];

  if (smartAutoplayEnabled) {
    // Show feedback
    sectionSubtitle.textContent = `🧠 Smart Autoplay: Finding similar songs based on ${finishedSong.artist}...`;

    // Fetch smart recommendations matching the artist & language
    const recos = await fetchSmartRecommendation(finishedSong.artist, finishedSong.language || 'Hindi', finishedSong.id);

    if (recos && recos.length > 0) {
      // Pick first non-duplicate track
      const nextSong = recos[0];
      // Append to playlist so user can see it in queue
      currentSongs.push(nextSong);
      const newIndex = currentSongs.length - 1;
      songsGrid.appendChild(createSongCard(nextSong, newIndex));
      updateSongCount();

      sectionSubtitle.textContent = `🧠 Smart Next: Now playing "${nextSong.title}" (${nextSong.artist})`;
      playSongAtIndex(newIndex);
      return;
    }
  }

  // Standard Next Track Fallback
  if (currentSongIndex + 1 < currentSongs.length) {
    playSongAtIndex(currentSongIndex + 1);
  } else {
    updatePlayerUI(false);
  }
}

// ==========================================
// 📥 Direct Download Pipeline
// ==========================================
function triggerDownload(song, bitrate = '320', btnEl = null) {
  let stream = song.stream_url_320;
  if (bitrate === '160') stream = song.stream_url_160 || song.stream_url_320;
  if (bitrate === '96') stream = song.stream_url_96 || song.stream_url_160;
  if (!stream) stream = song.active_stream;

  if (!stream) {
    alert('Audio stream URL not found for this track.');
    return;
  }

  const cleanName = `${song.title} - ${song.artist}`.replace(/[/\\?%*:|"<>]/g, '').trim();
  const dlUrl = `/api/download?url=${encodeURIComponent(stream)}&name=${encodeURIComponent(cleanName)}`;

  if (btnEl) {
    const originalText = btnEl.innerHTML;
    btnEl.innerHTML = '⬇ Starting...';
    setTimeout(() => { btnEl.innerHTML = originalText; }, 2500);
  }

  const a = document.createElement('a');
  a.href = dlUrl;
  a.setAttribute('download', `${cleanName}.m4a`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================
// 🔍 Error & Inspector Modal Handlers
// ==========================================
function showError(msg) {
  songsGrid.innerHTML = `
    <div class="loader-container">
      <p style="color:#f87171">⚠️ Error: ${msg}</p>
      <button class="primary-btn sm" onclick="loadForYouFeed(1)">Try Again</button>
    </div>
  `;
  songsCount.textContent = 'Error';
}

function openInspector(song) {
  modalJsonContent.textContent = JSON.stringify(song, null, 2);
  const stream = song.stream_url_320 || song.stream_url_160 || song.active_stream || '';
  modalStreamUrl.value = stream;
  inspectorModal.classList.add('open');
}

closeModalBtn.addEventListener('click', () => inspectorModal.classList.remove('open'));
inspectorModal.addEventListener('click', (e) => {
  if (e.target === inspectorModal) inspectorModal.classList.remove('open');
});

copyUrlBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(modalStreamUrl.value).then(() => {
    copyUrlBtn.textContent = 'Copied!';
    setTimeout(() => { copyUrlBtn.textContent = 'Copy Stream URL'; }, 2000);
  });
});

// ==========================================
// 🕹️ Controls & Event Listeners
// ==========================================
function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!isLoading && hasMore && currentSongs.length > 0 && currentMode !== 'liked') {
        loadNextPage();
      }
    }
  }, { rootMargin: '400px 0px' });

  if (scrollSentinel) observer.observe(scrollSentinel);

  window.addEventListener('scroll', () => {
    if (isLoading || !hasMore || currentSongs.length === 0 || currentMode === 'liked') return;
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 700)) {
      loadNextPage();
    }
  }, { passive: true });
}

// Search Listeners
searchBtn.addEventListener('click', () => performSearch(searchInput.value));
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') performSearch(searchInput.value);
});
searchInput.addEventListener('input', () => {
  clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
});
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  loadForYouFeed(1);
});

// Category Chips
genreChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const genre = chip.dataset.genre;
    const title = chip.textContent;
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    loadGenre(genre, title);
  });
});

// Audio Events
audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration) && audio.duration > 0) {
    const percent = (audio.currentTime / audio.duration) * 100;
    seekSlider.value = percent;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalDurationEl.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('play', () => updatePlayerUI(true));
audio.addEventListener('pause', () => updatePlayerUI(false));
audio.addEventListener('ended', handleSongEnded);

// Controls
playPauseBtn.addEventListener('click', () => {
  if (currentSongIndex === -1 && currentSongs.length > 0) {
    playSongAtIndex(0);
    return;
  }
  if (audio.paused) audio.play(); else audio.pause();
});

seekSlider.addEventListener('input', () => {
  if (!isNaN(audio.duration) && audio.duration > 0) {
    audio.currentTime = (seekSlider.value / 100) * audio.duration;
  }
});

skipBackBtn.addEventListener('click', () => {
  audio.currentTime = Math.max(0, audio.currentTime - 10);
});

skipForwardBtn.addEventListener('click', () => {
  audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
});

volumeSlider.addEventListener('input', () => {
  audio.volume = parseFloat(volumeSlider.value);
});

bitrateSelect.addEventListener('change', () => {
  selectedBitrate = bitrateSelect.value;
  if (currentSongIndex !== -1) {
    const currentTime = audio.currentTime;
    const isPlaying = !audio.paused;
    const song = currentSongs[currentSongIndex];
    let newUrl = song.stream_url_320;
    if (selectedBitrate === '160') newUrl = song.stream_url_160 || song.stream_url_320;
    if (selectedBitrate === '96') newUrl = song.stream_url_96 || song.stream_url_160;
    if (!newUrl) newUrl = song.active_stream;

    audio.src = newUrl;
    audio.currentTime = currentTime;
    if (isPlaying) audio.play();
    directAudioBtn.dataset.url = newUrl;
  }
});

directAudioBtn.addEventListener('click', () => {
  const url = directAudioBtn.dataset.url;
  if (url) window.open(url, '_blank');
  else alert('Please select and play a track first.');
});

// Download Current Song
if (downloadCurrentBtn) {
  downloadCurrentBtn.addEventListener('click', () => {
    if (currentSongIndex === -1 || !currentSongs[currentSongIndex]) {
      alert('Please select and play a track first.');
      return;
    }
    const currentSong = currentSongs[currentSongIndex];
    triggerDownload(currentSong, selectedBitrate, downloadCurrentBtn);
  });
}

// Like Current Song
if (playerLikeBtn) {
  playerLikeBtn.addEventListener('click', () => {
    if (currentSongIndex === -1 || !currentSongs[currentSongIndex]) {
      alert('Please select and play a track first.');
      return;
    }
    const currentSong = currentSongs[currentSongIndex];
    toggleLikeSong(currentSong);
  });
}

// Smart Autoplay Toggle
if (smartAutoplayBtn) {
  smartAutoplayBtn.addEventListener('click', () => {
    smartAutoplayEnabled = !smartAutoplayEnabled;
    if (smartAutoplayEnabled) {
      smartAutoplayBtn.classList.add('active');
      smartAutoplayBtn.textContent = '🧠 Smart: ON';
    } else {
      smartAutoplayBtn.classList.remove('active');
      smartAutoplayBtn.textContent = '🧠 Smart: OFF';
    }
  });
}

// Shuffle Mix
if (shuffleBtn) {
  shuffleBtn.addEventListener('click', async () => {
    shuffleBtn.textContent = '⏳ Shuffling...';
    if (currentMode === 'for-you') {
      await loadForYouFeed(1);
    } else if (currentMode === 'liked') {
      currentSongs = currentSongs.sort(() => Math.random() - 0.5);
      renderInitialSongs(currentSongs);
    } else {
      await loadGenre(currentParam, currentTitle);
    }
    shuffleBtn.textContent = '🔀 Shuffle Mix';
  });
}

// ==========================================
// 🚀 App Bootstrapper
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  setupInfiniteScroll();
  updateLikedCounter();

  const userTaste = getUserTaste();
  if (!userTaste) {
    // First time user: show onboarding taste modal
    openTasteModal();
  } else {
    // Existing user: directly launch personalized feed
    loadForYouFeed(1);
  }
});
