/* =====================================================================
   YoRHa Tactical Chess System — audio.js
   Global: YoRHaAudio — zero-dependency Web Audio API synthesizer
   replicating NieR: Automata mechanical clicks, confirm chimes, piece
   clacks, check sirens, and blunder glitch alerts.
   ===================================================================== */
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let enabled = true;
  let volume = 0.6;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? volume : 0;
      master.connect(ctx.destination);
      // 0.3s white noise buffer for mechanical / glitch textures
      const len = Math.floor(ctx.sampleRate * 0.3);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, type, startOffset, dur, gainVal, freqEnd) {
    if (!ctx || !enabled) return;
    const t0 = ctx.currentTime + (startOffset || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd && freqEnd !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gainVal, t0 + Math.min(0.008, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  function burstNoise(startOffset, dur, gainVal, filterFreq, filterType, q) {
    if (!ctx || !enabled || !noiseBuf) return;
    const t0 = ctx.currentTime + (startOffset || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const flt = ctx.createBiquadFilter();
    flt.type = filterType || 'bandpass';
    flt.frequency.setValueAtTime(filterFreq || 1800, t0);
    flt.Q.setValueAtTime(q || 2.5, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.01);
  }

  const sounds = {
    click() {
      burstNoise(0, 0.022, 0.18, 2600, 'bandpass', 4);
      tone(1480, 'triangle', 0, 0.028, 0.14, 920);
    },
    hover() {
      tone(1960, 'sine', 0, 0.018, 0.06, 2100);
    },
    select() {
      burstNoise(0, 0.018, 0.12, 2200, 'highpass', 1.5);
      tone(1046.5, 'triangle', 0, 0.045, 0.14, 1318.5);
    },
    confirm() {
      // NieR menu confirm double-chime
      burstNoise(0, 0.02, 0.14, 3000, 'bandpass', 3);
      tone(880, 'triangle', 0, 0.09, 0.18);
      tone(1318.5, 'sine', 0.055, 0.16, 0.2);
      tone(1760, 'sine', 0.055, 0.18, 0.08);
    },
    cancel() {
      burstNoise(0, 0.025, 0.14, 1600, 'bandpass', 3);
      tone(987.8, 'triangle', 0, 0.07, 0.16);
      tone(659.3, 'triangle', 0.05, 0.13, 0.16);
    },
    move() {
      // crisp mechanical piece clack
      burstNoise(0, 0.032, 0.26, 1100, 'bandpass', 2.2);
      tone(320, 'triangle', 0, 0.045, 0.22, 140);
      tone(960, 'sine', 0.006, 0.03, 0.09, 640);
    },
    capture() {
      // heavier metallic impact
      burstNoise(0, 0.055, 0.36, 900, 'bandpass', 1.6);
      tone(220, 'sawtooth', 0, 0.08, 0.24, 95);
      tone(1240, 'triangle', 0.01, 0.06, 0.16, 480);
    },
    castle() {
      // two-step mechanical slide + lock
      burstNoise(0, 0.03, 0.22, 1150, 'bandpass', 2);
      tone(310, 'triangle', 0, 0.045, 0.2, 150);
      burstNoise(0.085, 0.035, 0.24, 1350, 'bandpass', 2);
      tone(420, 'triangle', 0.085, 0.055, 0.22, 210);
    },
    check() {
      // YoRHa tactical alert siren
      tone(880, 'sawtooth', 0, 0.11, 0.18, 1174.7);
      tone(880, 'sawtooth', 0.12, 0.14, 0.2, 1318.5);
      tone(1760, 'sine', 0.12, 0.16, 0.1);
    },
    promote() {
      // ascending triad + shimmer
      tone(659.3, 'triangle', 0, 0.09, 0.18);
      tone(880, 'triangle', 0.07, 0.1, 0.19);
      tone(1174.7, 'sine', 0.14, 0.12, 0.2);
      tone(1760, 'sine', 0.21, 0.22, 0.22);
    },
    blunder() {
      // corrupted glitch alert + low drop
      burstNoise(0, 0.06, 0.35, 750, 'bandpass', 1.2);
      burstNoise(0.08, 0.08, 0.32, 1900, 'bandpass', 3);
      tone(370, 'sawtooth', 0, 0.11, 0.22, 260);
      tone(246.9, 'sawtooth', 0.09, 0.22, 0.24, 110);
    },
    brilliant() {
      // crystalline Pod chime
      tone(1046.5, 'sine', 0, 0.14, 0.18);
      tone(1318.5, 'sine', 0.06, 0.16, 0.18);
      tone(1568, 'sine', 0.12, 0.2, 0.2);
      tone(2093, 'triangle', 0.18, 0.28, 0.22);
    },
    start() {
      // mission start sequence
      burstNoise(0, 0.04, 0.16, 2400, 'bandpass', 3);
      tone(440, 'triangle', 0, 0.08, 0.16);
      tone(659.3, 'triangle', 0.065, 0.09, 0.18);
      tone(880, 'sine', 0.13, 0.2, 0.22);
    },
    end() {
      tone(880, 'triangle', 0, 0.12, 0.18);
      tone(659.3, 'triangle', 0.1, 0.14, 0.18);
      tone(440, 'sine', 0.2, 0.28, 0.22);
    },
    error() {
      burstNoise(0, 0.045, 0.24, 950, 'bandpass', 2);
      tone(260, 'sawtooth', 0, 0.09, 0.18, 180);
    },
    tick() {
      tone(1600, 'sine', 0, 0.02, 0.09);
    }
  };

  const YoRHaAudio = {
    get enabled() { return enabled; },
    init() { ensureCtx(); },
    play(name) {
      if (!enabled) return;
      if (!ensureCtx()) return;
      const fn = sounds[name] || sounds.click;
      try { fn(); } catch (e) { /* ignore audio errors */ }
    },
    setEnabled(flag) {
      enabled = !!flag;
      if (master && ctx) master.gain.setValueAtTime(enabled ? volume : 0, ctx.currentTime);
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, Number(v) || 0));
      if (master && ctx) master.gain.setValueAtTime(enabled ? volume : 0, ctx.currentTime);
    }
  };

  window.YoRHaAudio = YoRHaAudio;
})();
