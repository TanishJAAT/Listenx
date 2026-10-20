/**
 * Main Application Orchestrator for Listen-X Web.
 * Coordinates UI views, navigation tabs, player sheet, and dialogs.
 */

import { LiquidBackground } from './components/liquidBackground.js';
import { NowPlayingSheet } from './components/nowPlayingSheet.js';
import { OnlineView } from './components/onlineView.js';
import { PlaylistView } from './components/playlistView.js';
import { EqualizerModal } from './components/equalizerModal.js';
import { SettingsModal } from './components/settingsModal.js';
import { player } from './services/audioPlayer.js';

class App {
  constructor() {
    this.currentTab = 'online'; // 'online' | 'playlists' (No videos, as per request)
    this._init();
  }

  _init() {
    // 1. Initialize Liquid Background Engine
    this.liquidBg = new LiquidBackground('liquidBgContainer');

    // 2. Initialize Now Playing Sheet & Mini Player
    this.nowPlaying = new NowPlayingSheet();

    // 3. Initialize Equalizer & Settings Modals
    this.equalizerModal = new EqualizerModal();
    this.settingsModal = new SettingsModal(this.liquidBg);

    // 4. Initialize Core Views
    this.onlineView = new OnlineView('onlineViewContainer');
    this.playlistView = new PlaylistView('playlistViewContainer');

    // 5. Bind Navigation & Header
    this._bindNavigation();
    this._bindHeader();
    this._bindKeyboardShortcuts();

    // 6. Set initial view
    this.switchTab('online');
  }

  _bindNavigation() {
    const navOnline = document.getElementById('navTabOnline');
    const navPlaylists = document.getElementById('navTabPlaylists');

    navOnline.addEventListener('click', () => this.switchTab('online'));
    navPlaylists.addEventListener('click', () => this.switchTab('playlists'));

    window.addEventListener('nav-tab-change', (e) => {
      if (e.detail && e.detail.tab) {
        this.switchTab(e.detail.tab);
      }
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    const onlineBtn = document.getElementById('navTabOnline');
    const playlistsBtn = document.getElementById('navTabPlaylists');
    const onlineContainer = document.getElementById('onlineViewContainer');
    const playlistsContainer = document.getElementById('playlistViewContainer');

    if (tab === 'online') {
      onlineBtn.classList.add('active');
      playlistsBtn.classList.remove('active');
      onlineContainer.classList.remove('hidden');
      playlistsContainer.classList.add('hidden');
    } else {
      playlistsBtn.classList.add('active');
      onlineBtn.classList.remove('active');
      playlistsContainer.classList.remove('hidden');
      onlineContainer.classList.add('hidden');
      this.playlistView.refresh();
    }
  }

  _bindHeader() {
    // Logo click resets to online
    document.getElementById('headerBrand').addEventListener('click', () => {
      this.switchTab('online');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Header EQ Button
    document.getElementById('headerEqBtn').addEventListener('click', () => {
      this.equalizerModal.open();
    });

    // Header Settings Button
    document.getElementById('headerSettingsBtn').addEventListener('click', () => {
      this.settingsModal.open();
    });
  }

  _bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        player.togglePlay();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        player.playNext();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        player.playPrevious();
      } else if (e.code === 'ArrowRight') {
        player.seek(player.activeAudio.currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        player.seek(Math.max(0, player.activeAudio.currentTime - 5));
      } else if (e.key === 'm' || e.key === 'M') {
        const cur = player.getVolume();
        player.setVolume(cur > 0 ? 0 : 0.85);
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
