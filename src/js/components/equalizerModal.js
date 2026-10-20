/**
 * 6-Band Graphic Equalizer & Preamp Modal for Listen-X Web.
 * Real-time Web Audio API biquad filter tuning with presets.
 */

import { player, EQ_PRESETS } from '../services/audioPlayer.js';
import { storage } from '../services/storage.js';

export class EqualizerModal {
  constructor() {
    this.modal = null;
    this.bands = [
      { label: '60 Hz', sub: 'Sub Bass', index: 0 },
      { label: '230 Hz', sub: 'Bass', index: 1 },
      { label: '910 Hz', sub: 'Mids', index: 2 },
      { label: '3.6 kHz', sub: 'Presence', index: 3 },
      { label: '14 kHz', sub: 'Brilliance', index: 4 },
      { label: 'Preamp', sub: 'Master Gain', index: 5 }
    ];

    window.addEventListener('open-equalizer-modal', () => this.open());
  }

  open() {
    if (this.modal) this.modal.remove();

    const savedSettings = storage.getSettings();
    const currentGains = savedSettings.eqGains || [0, 0, 0, 0, 0, 0];
    const currentPreset = savedSettings.eqPreset || 'Flat';

    this.modal = document.createElement('div');
    this.modal.className = 'glass-modal-overlay';
    this.modal.innerHTML = `
      <div class="glass-modal-card eq-modal-card">
        <div class="modal-header">
          <div class="header-icon-group">
            <i class="fa-solid fa-sliders eq-icon-glow"></i>
            <div>
              <h3>6-Band Graphic Equalizer</h3>
              <p class="modal-subtext">Precision 32-bit DSP audio enhancement</p>
            </div>
          </div>
          <button class="icon-btn modal-close-btn" id="eqCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <!-- Presets Row -->
          <div class="eq-presets-row">
            ${Object.keys(EQ_PRESETS).map(preset => `
              <button class="glass-pill-btn eq-preset-btn ${preset === currentPreset ? 'active' : ''}" data-preset="${preset}">
                ${preset}
              </button>
            `).join('')}
          </div>

          <!-- Equalizer Sliders -->
          <div class="eq-sliders-container">
            ${this.bands.map(band => {
              const val = currentGains[band.index] || 0;
              return `
                <div class="eq-band-col">
                  <span class="eq-val-badge" id="eqVal_${band.index}">${val > 0 ? '+' : ''}${val} dB</span>
                  <div class="eq-slider-wrapper">
                    <input type="range" class="eq-slider" orient="vertical" id="eqSlider_${band.index}"
                           min="-12" max="12" step="0.5" value="${val}" />
                  </div>
                  <span class="eq-band-freq">${band.label}</span>
                  <small class="eq-band-sub">${band.sub}</small>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Reset Button -->
          <div class="eq-modal-footer">
            <button class="glass-pill-btn reset-eq-btn" id="resetEqBtn">
              <i class="fa-solid fa-rotate-left"></i> Reset to Flat
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this._bindEvents();
  }

  _bindEvents() {
    this.modal.querySelector('#eqCloseBtn').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Preset buttons
    this.modal.querySelectorAll('.eq-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.modal.querySelectorAll('.eq-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        player.applyPreset(preset);
        const gains = EQ_PRESETS[preset] || [0, 0, 0, 0, 0, 0];
        this._updateSliderValues(gains);
      });
    });

    // Slider inputs
    for (let i = 0; i < 6; i++) {
      const slider = this.modal.querySelector(`#eqSlider_${i}`);
      const badge = this.modal.querySelector(`#eqVal_${i}`);
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        badge.textContent = `${val > 0 ? '+' : ''}${val} dB`;

        // Gather all current values
        const newGains = [];
        for (let j = 0; j < 6; j++) {
          newGains.push(parseFloat(this.modal.querySelector(`#eqSlider_${j}`).value));
        }
        player.setEqualizerGains(newGains);

        // Remove active from preset buttons since custom values were adjusted
        this.modal.querySelectorAll('.eq-preset-btn').forEach(b => b.classList.remove('active'));
      });
    }

    // Reset button
    this.modal.querySelector('#resetEqBtn').addEventListener('click', () => {
      player.applyPreset('Flat');
      this._updateSliderValues([0, 0, 0, 0, 0, 0]);
      this.modal.querySelectorAll('.eq-preset-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.preset === 'Flat');
      });
    });
  }

  _updateSliderValues(gains) {
    for (let i = 0; i < 6; i++) {
      const val = gains[i] || 0;
      const slider = this.modal.querySelector(`#eqSlider_${i}`);
      const badge = this.modal.querySelector(`#eqVal_${i}`);
      if (slider && badge) {
        slider.value = val;
        badge.textContent = `${val > 0 ? '+' : ''}${val} dB`;
      }
    }
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}
