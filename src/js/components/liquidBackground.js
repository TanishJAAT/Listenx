/**
 * Dynamic Liquid Background Engine for Listen-X.
 * Renders procedural neon fluid mesh blobs on canvas for ULTRA_LIQUID mode,
 * supports BALANCED (static blur), LOW (AMOLED flat dark), and custom photo wallpapers with dark scrim.
 */

import { storage } from '../services/storage.js';

export class LiquidBackground {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'liquid-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.mode = 'ULTRA_LIQUID'; // ULTRA_LIQUID, BALANCED, LOW
    this.blobs = [];
    this.animationFrameId = null;
    this.customBgUrl = null;

    this._initBlobs();
    this._bindResize();
    this.applySettings();
  }

  _initBlobs() {
    this.blobs = [
      { x: 0.2, y: 0.2, vx: 0.0004, vy: 0.0003, r: 0.45, color: 'rgba(0, 240, 255, 0.25)' },  // Cyan
      { x: 0.8, y: 0.3, vx: -0.0003, vy: 0.0005, r: 0.5, color: 'rgba(138, 43, 226, 0.22)' }, // Purple
      { x: 0.5, y: 0.8, vx: 0.0005, vy: -0.0004, r: 0.48, color: 'rgba(255, 0, 127, 0.18)' }, // Pink Glow
      { x: 0.3, y: 0.7, vx: -0.0004, vy: 0.0003, r: 0.35, color: 'rgba(0, 240, 255, 0.15)' },  // Soft Cyan
      { x: 0.7, y: 0.6, vx: 0.0003, vy: -0.0005, r: 0.4, color: 'rgba(255, 179, 0, 0.12)' }   // Amber Gold
    ];
  }

  _bindResize() {
    const resize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  applySettings() {
    const settings = storage.getSettings();
    this.mode = settings.graphicsLevel || 'ULTRA_LIQUID';
    this.customBgUrl = settings.customBg || null;

    // Apply custom wallpaper if present
    if (this.customBgUrl) {
      this.container.style.backgroundImage = `url("${this.customBgUrl}")`;
      this.container.classList.add('has-custom-bg');
    } else {
      this.container.style.backgroundImage = '';
      this.container.classList.remove('has-custom-bg');
    }

    if (this.mode === 'ULTRA_LIQUID') {
      this.canvas.style.display = 'block';
      this.container.classList.add('mode-ultra-liquid');
      this.container.classList.remove('mode-balanced', 'mode-low');
      this.start();
    } else if (this.mode === 'BALANCED') {
      this.stop();
      this.canvas.style.display = 'none';
      this.container.classList.add('mode-balanced');
      this.container.classList.remove('mode-ultra-liquid', 'mode-low');
    } else {
      this.stop();
      this.canvas.style.display = 'none';
      this.container.classList.add('mode-low');
      this.container.classList.remove('mode-ultra-liquid', 'mode-balanced');
    }
  }

  start() {
    if (this.animationFrameId) return;
    const animate = () => {
      this._render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  _render() {
    if (!this.ctx || this.mode !== 'ULTRA_LIQUID') return;
    const w = this.width;
    const h = this.height;

    this.ctx.clearRect(0, 0, w, h);

    // Dark cyber backdrop base
    this.ctx.fillStyle = '#0D0E15';
    this.ctx.fillRect(0, 0, w, h);

    // Update & draw glowing fluid orbs
    for (let b of this.blobs) {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < 0.1 || b.x > 0.9) b.vx *= -1;
      if (b.y < 0.1 || b.y > 0.9) b.vy *= -1;

      const px = b.x * w;
      const py = b.y * h;
      const radius = b.r * Math.min(w, h);

      const grad = this.ctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
