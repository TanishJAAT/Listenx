/**
 * Real-Time Audio Visualizer for Listen-X.
 * Connects to Web Audio API AnalyserNode and renders glowing neon soundwaves and equalizer bars.
 */

import { player } from '../services/audioPlayer.js';

export class AudioVisualizer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = {
      barCount: options.barCount || 32,
      barSpacing: options.barSpacing || 3,
      glowColor: options.glowColor || '#00F0FF',
      secondaryColor: options.secondaryColor || '#8A2BE2',
      type: options.type || 'bars', // 'bars' | 'wave' | 'mini'
      ...options
    };

    this.dataArray = new Uint8Array(64);
    this.animationId = null;
    this._bindResize();
    this.start();
  }

  _bindResize() {
    const resize = () => {
      if (!this.canvas) return;
      this.width = this.canvas.clientWidth || 300;
      this.height = this.canvas.clientHeight || 60;
      this.canvas.width = this.width * window.devicePixelRatio;
      this.canvas.height = this.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
  }

  start() {
    if (this.animationId) return;
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  render() {
    if (!this.ctx || !this.width) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (player.isPlaying) {
      player.getFrequencyData(this.dataArray);
    } else {
      // Idle animated subtle wave
      const time = Date.now() * 0.003;
      for (let i = 0; i < this.dataArray.length; i++) {
        this.dataArray[i] = Math.sin(time + i * 0.2) * 12 + 16;
      }
    }

    if (this.options.type === 'mini') {
      this._renderMiniBars();
    } else if (this.options.type === 'wave') {
      this._renderWave();
    } else {
      this._renderBars();
    }
  }

  _renderBars() {
    const bars = this.options.barCount;
    const spacing = this.options.barSpacing;
    const totalSpacing = spacing * (bars - 1);
    const barWidth = Math.max(2, (this.width - totalSpacing) / bars);

    for (let i = 0; i < bars; i++) {
      const val = this.dataArray[i % this.dataArray.length] / 255;
      const barHeight = Math.max(3, val * (this.height - 4));
      const x = i * (barWidth + spacing);
      const y = this.height - barHeight;

      const grad = this.ctx.createLinearGradient(0, y, 0, this.height);
      grad.addColorStop(0, '#00F0FF');
      grad.addColorStop(0.6, '#8A2BE2');
      grad.addColorStop(1, '#FF007F');

      this.ctx.fillStyle = grad;
      this.ctx.shadowBlur = player.isPlaying ? 8 : 2;
      this.ctx.shadowColor = '#00F0FF';

      // Rounded top bars
      this.ctx.beginPath();
      const r = Math.min(2, barWidth / 2);
      this.ctx.roundRect ? this.ctx.roundRect(x, y, barWidth, barHeight, [r, r, 0, 0]) : this.ctx.rect(x, y, barWidth, barHeight);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }

  _renderMiniBars() {
    const bars = 4;
    const barWidth = 3;
    const spacing = 2;
    for (let i = 0; i < bars; i++) {
      const val = player.isPlaying ? (this.dataArray[i * 4] / 255) : 0.2;
      const barHeight = Math.max(4, val * (this.height - 2));
      const x = i * (barWidth + spacing);
      const y = (this.height - barHeight) / 2;

      this.ctx.fillStyle = '#00F0FF';
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  _renderWave() {
    const points = 32;
    const sliceWidth = this.width / points;

    this.ctx.beginPath();
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = '#00F0FF';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00F0FF';

    let x = 0;
    for (let i = 0; i < points; i++) {
      const v = this.dataArray[i % this.dataArray.length] / 255;
      const y = this.height / 2 + (v - 0.5) * (this.height * 0.8);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }
}
