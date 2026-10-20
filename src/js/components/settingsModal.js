/**
 * Settings & Customization Modal for Listen-X Web.
 * Covers:
 * - Performance Modes (Ultra Liquid, Balanced, Low)
 * - Custom Wallpaper photo upload with dark scrim
 * - DJ Crossfade slider (0s to 12s)
 * - Music Taste Configuration (Languages & Singers)
 * - Laptop Server connection URL
 * - Developer & Version Info
 */

import { storage } from '../services/storage.js';
import { player } from '../services/audioPlayer.js';

export class SettingsModal {
  constructor(liquidBgInstance) {
    this.liquidBg = liquidBgInstance;
    this.modal = null;

    window.addEventListener('open-settings-modal', () => this.open());
  }

  open() {
    if (this.modal) this.modal.remove();

    const current = storage.getSettings();
    const serverUrl = storage.getServerUrl();

    this.modal = document.createElement('div');
    this.modal.className = 'glass-modal-overlay';
    this.modal.innerHTML = `
      <div class="glass-modal-card settings-modal-card">
        <div class="modal-header">
          <div class="header-icon-group">
            <i class="fa-solid fa-gear settings-icon-glow"></i>
            <div>
              <h3>Settings & Customization</h3>
              <p class="modal-subtext">Visual physics, audio DSP, and server connectivity</p>
            </div>
          </div>
          <button class="icon-btn modal-close-btn" id="settingsCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body settings-body">
          <!-- 1. Graphics & Performance -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-wand-magic-sparkles"></i> Visual Graphics & Performance</h4>
            <div class="graphics-mode-selector">
              <div class="graphics-card ${current.graphicsLevel === 'ULTRA_LIQUID' ? 'active' : ''}" data-level="ULTRA_LIQUID">
                <div class="graphics-card-header">
                  <i class="fa-solid fa-water"></i>
                  <strong>Ultra Liquid</strong>
                </div>
                <p>Full ambient animated neon fluid mesh background, glowing border strokes, dynamic floating depth.</p>
              </div>

              <div class="graphics-card ${current.graphicsLevel === 'BALANCED' ? 'active' : ''}" data-level="BALANCED">
                <div class="graphics-card-header">
                  <i class="fa-solid fa-scale-balanced"></i>
                  <strong>Balanced</strong>
                </div>
                <p>Smooth Compose springs, translucent frosted glass surfaces, and responsive micro-animations.</p>
              </div>

              <div class="graphics-card ${current.graphicsLevel === 'LOW' ? 'active' : ''}" data-level="LOW">
                <div class="graphics-card-header">
                  <i class="fa-solid fa-bolt"></i>
                  <strong>Performance (Low)</strong>
                </div>
                <p>Ultra-minimal flat dark AMOLED UI with zero canvas animations, engineered for battery saving.</p>
              </div>
            </div>
          </div>

          <!-- 2. Custom Photo Background -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-image"></i> Custom Wallpaper Background</h4>
            <p class="section-desc">Personalize player background with an automatic dark scrim overlay.</p>
            <div class="custom-bg-controls">
              <button class="glass-pill-btn" id="uploadBgBtn"><i class="fa-solid fa-cloud-arrow-up"></i> Upload Photo</button>
              <button class="glass-pill-btn ${current.customBg ? '' : 'hidden'}" id="resetBgBtn"><i class="fa-solid fa-trash"></i> Reset to Liquid</button>
              <input type="file" id="customBgFileInput" accept="image/*" class="hidden" />
            </div>
          </div>

          <!-- 3. DJ Crossfader -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-sliders"></i> Real-Time DJ Crossfader</h4>
            <p class="section-desc">Adjust transition blend duration between ending and upcoming songs.</p>
            <div class="slider-row">
              <input type="range" class="sheet-slider" id="crossfadeSlider" min="0" max="12" step="1" value="${current.crossfadeDuration || 3}" />
              <span class="slider-badge" id="crossfadeBadge">${current.crossfadeDuration || 3}s</span>
            </div>
          </div>

          <!-- 4. Music Taste Profile -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-heart"></i> Music Taste Profile</h4>
            <p class="section-desc">Selected languages influence your dynamic Trending home feed.</p>
            <div class="taste-chips-container" id="tasteChipsContainer">
              ${['Hindi', 'Haryanvi', 'Punjabi', 'English', 'Bhojpuri', 'Rajasthani'].map(lang => {
                const isSelected = (current.musicTaste?.languages || []).includes(lang);
                return `<button class="taste-chip ${isSelected ? 'active' : ''}" data-lang="${lang}">${lang}</button>`;
              }).join('')}
            </div>
          </div>

          <!-- 5. Laptop Server Connection -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-laptop"></i> Laptop Streaming Server</h4>
            <p class="section-desc">Target URL for <code>listenx_server.py</code> (D:\\music library).</p>
            <div class="server-input-row">
              <input type="text" class="glass-input" id="serverUrlInput" value="${serverUrl}" placeholder="http://localhost:8080" />
              <button class="glass-pill-btn" id="saveServerUrlBtn">Save</button>
            </div>
          </div>

          <!-- 6. Developer Info -->
          <div class="settings-section dev-info-box">
            <div class="dev-info-header">
              <img src="assets/favicon.svg" alt="Listen-X Logo" class="dev-logo" />
              <div>
                <h4>Listen-X Music Web</h4>
                <p>Version 2.0.0 — Universal Audio Streamer</p>
                <small>Developed by Tanish Nandal</small>
              </div>
            </div>
            <p class="dev-description">
              Listen-X combines dynamic liquid glassmorphism, 320kbps JioSaavn audio streaming,
              LRCLIB synchronized lyrics, 6-band graphic DSP equalization, and zero-config laptop broadcasting.
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this._bindEvents();
  }

  _bindEvents() {
    this.modal.querySelector('#settingsCloseBtn').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Graphics level selection
    this.modal.querySelectorAll('.graphics-card').forEach(card => {
      card.addEventListener('click', () => {
        this.modal.querySelectorAll('.graphics-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const level = card.dataset.level;
        storage.saveSettings({ graphicsLevel: level });
        if (this.liquidBg) this.liquidBg.applySettings();
      });
    });

    // Custom background upload
    const fileInput = this.modal.querySelector('#customBgFileInput');
    this.modal.querySelector('#uploadBgBtn').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          storage.saveSettings({ customBg: dataUrl });
          if (this.liquidBg) this.liquidBg.applySettings();
          this.modal.querySelector('#resetBgBtn').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset background
    this.modal.querySelector('#resetBgBtn').addEventListener('click', () => {
      storage.saveSettings({ customBg: null });
      if (this.liquidBg) this.liquidBg.applySettings();
      this.modal.querySelector('#resetBgBtn').classList.add('hidden');
    });

    // Crossfader slider
    const crossfadeSlider = this.modal.querySelector('#crossfadeSlider');
    const crossfadeBadge = this.modal.querySelector('#crossfadeBadge');
    crossfadeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      crossfadeBadge.textContent = `${val}s`;
      player.crossfadeDuration = val;
      storage.saveSettings({ crossfadeDuration: val });
    });

    // Taste Chips
    this.modal.querySelectorAll('.taste-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const activeLangs = Array.from(this.modal.querySelectorAll('.taste-chip.active')).map(c => c.dataset.lang);
        const curTaste = storage.getSettings().musicTaste || {};
        curTaste.languages = activeLangs;
        storage.saveSettings({ musicTaste: curTaste });
      });
    });

    // Laptop server URL save
    this.modal.querySelector('#saveServerUrlBtn').addEventListener('click', () => {
      const url = this.modal.querySelector('#serverUrlInput').value.trim();
      if (url) {
        storage.saveServerUrl(url);
        const btn = this.modal.querySelector('#saveServerUrlBtn');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
        setTimeout(() => { btn.textContent = 'Save'; }, 1500);
      }
    });
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}
