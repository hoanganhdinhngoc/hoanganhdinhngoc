/* =====================================================================
   Chess System — audio.js
   Global: YoRHaAudio
   - UI sounds from https://hoanganhdinhngoc.github.io/cdn/sounds/
   - Background music: fortress-of-lies-the-bunker.ogg (loop, toggle + volume)
   - Realistic wooden chess piece placement sound (Web Audio synthesis)
   ===================================================================== */
(function () {
  'use strict';

  const CDN_SOUNDS = 'https://hoanganhdinhngoc.github.io/cdn/sounds/';
  const BGM_URL = CDN_SOUNDS + 'fortress-of-lies-the-bunker.ogg';

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let enabled = true;
  let volume = 0.7;
  let bgmEnabled = true;
  let bgmVolume = 0.35;
  let bgmAudio = null;
  let bgmWanted = false;

  const uiClips = {};
  const CLIP_FILES = {
    core_1: 'core_1.ogg',
    core_16: 'core_16.ogg',
    core_20: 'core_20.ogg',
    core_32: 'core_32.ogg',
    core_52: 'core_52.ogg',
    core_58: 'core_58.ogg',
    core_76: 'core_76.ogg'
  };

  function preloadClips() {
    Object.keys(CLIP_FILES).forEach(k => {
      if (uiClips[k]) return;
      try {
        const a = new Audio(CDN_SOUNDS + CLIP_FILES[k]);
        a.preload = 'auto';
        a.volume = enabled ? volume : 0;
        uiClips[k] = a;
      } catch (e) { /* ignore */ }
    });
  }

  function ensureBgm() {
    if (!bgmAudio) {
      try {
        bgmAudio = new Audio(BGM_URL);
        bgmAudio.loop = true;
        bgmAudio.preload = 'auto';
        bgmAudio.volume = bgmEnabled ? bgmVolume : 0;
      } catch (e) { /* ignore */ }
    }
    return bgmAudio;
  }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? volume : 0;
      master.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.25);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playClip(key, volScale) {
    if (!enabled) return;
    preloadClips();
    const base = uiClips[key];
    if (!base) return;
    try {
      base.volume = Math.max(0, Math.min(1, volume * (volScale || 1)));
      base.currentTime = 0;
      base.play().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------
     Realistic Wooden Chess Piece Sound (Web Audio API)
     Simulates a weighted wooden Staunton piece set down on a wooden board:
     - Warm low-mid wood body resonance (135–190 Hz + 340–480 Hz)
     - Crisp felt/wood contact transient (filtered noise burst)
     - Optional secondary knock for captures or castling
     ------------------------------------------------------------------ */
  function woodKnock(offset, intensity, pitchShift) {
    if (!ensureCtx() || !enabled) return;
    const t0 = ctx.currentTime + (offset || 0);
    const p = pitchShift || 1;
    const amp = (intensity || 1) * 0.55;

    // 1. Primary wood board cavity thump (warm low-mid)
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(175 * p, t0);
    body.frequency.exponentialRampToValueAtTime(72 * p, t0 + 0.065);
    bodyGain.gain.setValueAtTime(0.0001, t0);
    bodyGain.gain.linearRampToValueAtTime(amp, t0 + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.075);
    body.connect(bodyGain);
    bodyGain.connect(master);
    body.start(t0);
    body.stop(t0 + 0.08);

    // 2. Hardwood piece resonance (mid-wood timbre)
    const wood = ctx.createOscillator();
    const woodGain = ctx.createGain();
    wood.type = 'triangle';
    wood.frequency.setValueAtTime(430 * p, t0);
    wood.frequency.exponentialRampToValueAtTime(195 * p, t0 + 0.038);
    woodGain.gain.setValueAtTime(0.0001, t0);
    woodGain.gain.linearRampToValueAtTime(amp * 0.65, t0 + 0.002);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.042);
    wood.connect(woodGain);
    woodGain.connect(master);
    wood.start(t0);
    wood.stop(t0 + 0.048);

    // 3. Short wooden surface tap transient (bandpass noise)
    if (noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(780 * p, t0);
      bp.Q.setValueAtTime(2.4, t0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1850, t0);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(amp * 0.9, t0);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.024);
      src.connect(bp);
      bp.connect(lp);
      lp.connect(nGain);
      nGain.connect(master);
      src.start(t0);
      src.stop(t0 + 0.03);
    }
  }

  const YoRHaAudio = {
    get enabled() { return enabled; },
    get volume() { return volume; },
    get bgmEnabled() { return bgmEnabled; },
    get bgmVolume() { return bgmVolume; },

    init() {
      preloadClips();
      ensureCtx();
      if (bgmWanted && bgmEnabled) {
        this.startBgm();
      }
    },

    play(name) {
      if (!enabled) return;
      switch (name) {
        // Wooden board piece sounds
        case 'move':
          woodKnock(0, 0.95, 1.0);
          break;
        case 'capture':
          // Slightly sharper initial contact + firm wooden set-down
          woodKnock(0, 0.7, 1.28);
          woodKnock(0.028, 1.15, 0.92);
          break;
        case 'castle':
          // King + Rook two-step wooden placement
          woodKnock(0, 0.95, 0.96);
          woodKnock(0.11, 0.9, 1.08);
          break;
        case 'promote':
          woodKnock(0, 1.05, 0.95);
          playClip('core_58', 0.75);
          break;
        case 'check':
          woodKnock(0, 1.05, 1.12);
          playClip('core_20', 0.75);
          break;
        case 'select':
          // Subtle wooden pick-up tap
          woodKnock(0, 0.35, 1.35);
          break;
        case 'tick':
          woodKnock(0, 0.28, 1.5);
          break;

        // NieR CDN UI sounds
        case 'hover':
          playClip('core_16', 0.7);
          break;
        case 'click':
          playClip('core_52', 0.85);
          break;
        case 'confirm':
        case 'start':
        case 'brilliant':
          playClip('core_58', 0.9);
          break;
        case 'cancel':
          playClip('core_1', 0.85);
          break;
        case 'end':
          playClip('core_32', 0.9);
          break;
        case 'blunder':
        case 'error':
          playClip('core_76', 0.9);
          break;
        default:
          playClip('core_52', 0.8);
          break;
      }
    },

    setEnabled(flag) {
      enabled = !!flag;
      if (master && ctx) master.gain.setValueAtTime(enabled ? volume : 0, ctx.currentTime);
      Object.values(uiClips).forEach(a => { a.volume = enabled ? volume : 0; });
    },

    setVolume(v) {
      volume = Math.max(0, Math.min(1, Number(v) || 0));
      if (master && ctx) master.gain.setValueAtTime(enabled ? volume : 0, ctx.currentTime);
      Object.values(uiClips).forEach(a => { a.volume = enabled ? volume : 0; });
    },

    startBgm() {
      bgmWanted = true;
      const a = ensureBgm();
      if (!a) return;
      a.volume = bgmEnabled ? bgmVolume : 0;
      if (bgmEnabled && a.paused) {
        a.play().catch(() => {});
      }
    },

    stopBgm() {
      bgmWanted = false;
      if (bgmAudio && !bgmAudio.paused) {
        try { bgmAudio.pause(); } catch (e) { /* ignore */ }
      }
    },

    setBgmEnabled(flag) {
      bgmEnabled = !!flag;
      const a = ensureBgm();
      if (!a) return;
      a.volume = bgmEnabled ? bgmVolume : 0;
      if (bgmEnabled && bgmWanted) {
        a.play().catch(() => {});
      } else if (!bgmEnabled && !a.paused) {
        a.pause();
      }
    },

    setBgmVolume(v) {
      bgmVolume = Math.max(0, Math.min(1, Number(v) || 0));
      if (bgmAudio) {
        bgmAudio.volume = bgmEnabled ? bgmVolume : 0;
      }
    }
  };

  window.YoRHaAudio = YoRHaAudio;
})();
