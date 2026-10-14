// Lightweight Web Audio based SFX + simple voice-like tones for taunts
class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = 0.7;
    this.sfx = 0.8;
    this.voice = 0.9;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolumes(master, sfx, voice) {
    this.master = master;
    this.sfx = sfx;
    this.voice = voice;
  }

  _gain(type = 'sfx') {
    if (!this.ctx) return null;
    const g = this.ctx.createGain();
    const vol = (type === 'voice' ? this.voice : this.sfx) * this.master;
    g.gain.value = vol;
    g.connect(this.ctx.destination);
    return g;
  }

  // Simple synthesized SFX
  playTone(freq, duration, type = 'square', volScale = 1, destType = 'sfx') {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const g = this._gain(destType);
    if (!g) return;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(volScale * (destType === 'voice' ? this.voice : this.sfx) * this.master, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Attack whoosh
  attack() {
    this.playTone(180 + Math.random() * 80, 0.12, 'sawtooth', 0.4);
    this.playTone(90, 0.08, 'square', 0.25);
  }

  // Magic cast
  cast(type) {
    const base = { dark: 90, fire: 220, water: 160, wind: 300, lightning: 440, earth: 70, antimagic: 110, spatial: 250 }[type] || 150;
    this.playTone(base, 0.18, 'sine', 0.5);
    this.playTone(base * 1.5, 0.12, 'triangle', 0.3);
  }

  // Hit impact
  hit() {
    this.playTone(60 + Math.random() * 40, 0.1, 'square', 0.45);
  }

  // Enemy death
  death() {
    this.playTone(120, 0.25, 'sawtooth', 0.4);
    this.playTone(60, 0.35, 'triangle', 0.3);
  }

  // Heal
  heal() {
    this.playTone(400, 0.2, 'sine', 0.35);
    this.playTone(600, 0.25, 'sine', 0.25);
  }

  // UI click
  click() {
    this.playTone(600, 0.06, 'square', 0.2);
  }

  // Level / important event
  fanfare() {
    this.playTone(262, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(330, 0.15, 'sine', 0.3), 120);
    setTimeout(() => this.playTone(392, 0.25, 'sine', 0.35), 240);
  }

  // Simple "voice" for taunts – short tonal patterns that feel speech-like
  taunt() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [180, 220, 160, 200, 140];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f + Math.random() * 20;
      g.gain.setValueAtTime(0.18 * this.voice * this.master, now + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.09);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.1);
    });
  }

  // Ryo style deeper voice pattern
  ryoSpeak() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [90, 110, 85, 100];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22 * this.voice * this.master, now + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.12);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.13);
    });
  }

  // Ambient low drone (optional continuous)
  startAmbient() {
    // Kept simple – can be expanded later
  }
}

const Audio = new GameAudio();
