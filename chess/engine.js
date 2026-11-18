/* =====================================================================
   YoRHa Tactical Chess System — engine.js
   Global: Engine
   - Non-blocking Stockfish Web Worker (Blob + importScripts, local fallback)
   - Lichess Cloud Eval (short timeout) with seamless worker fallback
   - Mobile / desktop adaptive throttling
   - CPL / win% / accuracy, move classifier, bilingual tactical commentary
   - MiniEngine (alpha-beta) as last-resort offline fallback
   ===================================================================== */
(function () {
  'use strict';

  const SF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
  const CLOUD_URL = 'https://lichess.org/api/cloud-eval';
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  const CENTER = new Set(['d4', 'd5', 'e4', 'e5']);
  const EXT_CENTER = new Set(['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6']);

  /* ------------------------------------------------------------------
     Device profile (adaptive throttling)
     ------------------------------------------------------------------ */
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && Math.min(window.innerWidth, window.innerHeight) < 900);
  const cores = navigator.hardwareConcurrency || 2;
  const profile = isMobile
    ? { threads: 1, depth: 10, movetime: 380, minMovetime: 280, maxMovetime: 550, hash: 16, reviewMovetime: 280, reviewDepth: 10 }
    : { threads: Math.max(1, Math.min(4, cores - 1)), depth: 12, movetime: 520, minMovetime: 400, maxMovetime: 750, hash: 32, reviewMovetime: 380, reviewDepth: 12 };

  /* ------------------------------------------------------------------
     Small opening book (UCI lines from the initial position)
     ------------------------------------------------------------------ */
  const BOOK_LINES = [
    'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8',
    'e2e4 e7e5 g1f3 b8c6 f1b5 g8f6 e1g1 f6e4 d2d4 e4d6 b5c6 d7c6 d4e5 d6f5',
    'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d4 e5d4 c3d4 c5b4',
    'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 d2d3 g8f6 c2c3 d7d6 e1g1 e8g8',
    'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 c6a5 c4b5 c7c6',
    'e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 g8f6 d4c6 b7c6 e4e5 d8e7',
    'e2e4 e7e5 g1f3 b8c6 b1c3 g8f6 d2d4 e5d4 f3d4 f8b4',
    'e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d2d4 d6d5 f1d3',
    'e2e4 e7e5 g1f3 d7d6 d2d4 g8f6 b1c3 b8d7',
    'e2e4 e7e5 f2f4 e5f4 g1f3 g7g5',
    'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6 c1e3 e7e5 d4b3 c8e6',
    'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6 c1e3 f8g7 f2f3 e8g8',
    'e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5 d4b5 d7d6',
    'e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 a7a6 f1d3',
    'e2e4 c7c5 b1c3 b8c6 g2g3 g7g6 f1g2 f8g7',
    'e2e4 c7c5 c2c3 g8f6 e4e5 f6d5 d2d4 c5d4',
    'e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7 e4e5 f6d7',
    'e2e4 e7e6 d2d4 d7d5 b1c3 f8b4 e4e5 c7c5 a2a3 b4c3 b2c3',
    'e2e4 e7e6 d2d4 d7d5 e4e5 c7c5 c2c3 b8c6 g1f3 d8b6',
    'e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6 h2h4 h7h6',
    'e2e4 c7c6 d2d4 d7d5 e4e5 c8f5 g1f3 e7e6',
    'e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6 g1f3 c8f5',
    'e2e4 d7d6 d2d4 g8f6 b1c3 g7g6 f2f4 f8g7 g1f3',
    'e2e4 g7g6 d2d4 f8g7 b1c3 d7d6',
    'e2e4 g8f6 e4e5 f6d5 d2d4 d7d6 g1f3',
    'd2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8 g1f3 h7h6',
    'd2d4 d7d5 c2c4 d5c4 g1f3 g8f6 e2e3 e7e6 f1c4 c7c5',
    'd2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4 c8f5',
    'd2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 e7e6 c1g5',
    'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8 f1e2 e7e5',
    'd2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8 f1d3 d7d5',
    'd2d4 g8f6 c2c4 e7e6 g1f3 b7b6 g2g3 c8a6',
    'd2d4 g8f6 c2c4 c7c5 d4d5 b7b5',
    'd2d4 g8f6 c2c4 g7g6 b1c3 d7d5 c4d5 f6d5 e2e4 d5c3 b2c3 f8g7',
    'd2d4 d7d5 g1f3 g8f6 c1f4 e7e6 e2e3 c7c5 c2c3 b8c6',
    'd2d4 g8f6 c1f4 d7d5 e2e3 e7e6 g1f3 c7c5',
    'd2d4 f7f5 g2g3 g8f6 f1g2 g7g6',
    'c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5',
    'c2c4 g8f6 b1c3 e7e6 e2e4 c7c5',
    'c2c4 c7c5 g1f3 b8c6 b1c3 g7g6',
    'g1f3 d7d5 g2g3 g8f6 f1g2 c7c6 e1g1 c8g4',
    'g1f3 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6'
  ];
  const BOOK = new Set();
  BOOK_LINES.forEach(line => {
    const mv = line.split(' ');
    for (let i = 1; i <= mv.length; i++) BOOK.add(mv.slice(0, i).join(' '));
  });

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function fenKey(fen) { return fen.split(' ').slice(0, 4).join(' '); }
  function turnOf(fen) { return fen.split(' ')[1] === 'b' ? 'b' : 'w'; }
  function mateToCp(mate) { return mate > 0 ? 10000 - mate * 10 : -10000 - mate * 10; }
  function clampCp(cp) { return Math.max(-1500, Math.min(1500, cp)); }

  function winPercent(cpWhite) {
    const cp = clampCp(cpWhite);
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  }
  function moveAccuracy(winBefore, winAfter) {
    if (winAfter >= winBefore) return 100;
    const acc = 103.1668 * Math.exp(-0.04354 * (winBefore - winAfter)) - 3.1669;
    return Math.max(0, Math.min(100, acc));
  }
  function formatEval(cpWhite, mate) {
    if (mate != null && mate !== 0) return (mate > 0 ? '#' : '-#') + Math.abs(mate);
    if (mate === 0) return '#';
    if (cpWhite == null || isNaN(cpWhite)) return '0.00';
    const v = cpWhite / 100;
    return (v > 0 ? '+' : '') + v.toFixed(2);
  }
  function parseUci(uci) {
    return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined };
  }
  function newChess(fen) {
    const c = new Chess();
    if (fen && !c.load(fen)) return null;
    return c;
  }
  function uciToSan(fen, uci) {
    try {
      const c = newChess(fen); if (!c) return uci;
      const m = c.move(parseUci(uci));
      return m ? m.san : uci;
    } catch (e) { return uci; }
  }
  function sameMove(a, b) {
    if (!a || !b) return false;
    const na = a.length === 4 ? a : a.slice(0, 5);
    const nb = b.length === 4 ? b : b.slice(0, 5);
    if (na === nb) return true;
    // treat missing promotion as queen
    return (na.length === 4 ? na + 'q' : na) === (nb.length === 4 ? nb + 'q' : nb);
  }
  function isGameOverFen(fen) {
    const c = newChess(fen); if (!c) return null;
    if (c.in_checkmate()) return { cpWhite: c.turn() === 'w' ? -10000 : 10000, mate: 0, over: 'mate' };
    if (c.in_stalemate() || c.insufficient_material()) return { cpWhite: 0, mate: null, over: 'draw' };
    return null;
  }

  /* pieces attacked by the piece standing on `sq` (side = that piece's colour) */
  function attackedBy(fen, sq) {
    const parts = fen.split(' ');
    const c0 = newChess(fen); if (!c0) return [];
    const p = c0.get(sq); if (!p) return [];
    parts[1] = p.color; parts[3] = '-';
    const c = newChess(parts.join(' ')); if (!c) return [];
    const res = [];
    c.moves({ square: sq, verbose: true }).forEach(m => {
      if (m.captured && m.captured !== 'k') res.push({ square: m.to, type: m.captured });
    });
    return res;
  }
  /* lowest-value piece of `color` able to capture on `sq` */
  function minAttacker(fen, sq, color) {
    const parts = fen.split(' ');
    parts[1] = color; parts[3] = '-';
    const c = newChess(parts.join(' ')); if (!c) return null;
    let best = null;
    c.moves({ verbose: true }).forEach(m => {
      if (m.to === sq && m.captured) {
        if (!best || VAL[m.piece] < VAL[best.piece]) best = m;
      }
    });
    return best;
  }

  /* SEE-lite: does `uci` sacrifice material (>= 2 pawns) on the destination square? */
  function isSacrifice(fenBefore, uci) {
    const c = newChess(fenBefore); if (!c) return false;
    const mv = c.move(parseUci(uci)); if (!mv) return false;
    if (mv.piece === 'p' || mv.piece === 'k') return false;
    const V = VAL[mv.promotion || mv.piece];
    const C = mv.captured ? VAL[mv.captured] : 0;
    const fenAfter = c.fen();
    const them = mv.color === 'w' ? 'b' : 'w';
    const att = minAttacker(fenAfter, mv.to, them);
    if (!att) return false;
    // can we recapture after their capture?
    const c2 = newChess(fenAfter);
    const cap = c2.move({ from: att.from, to: att.to, promotion: 'q' });
    if (!cap) return false;
    const re = c2.moves({ verbose: true }).some(m => m.to === mv.to && m.captured);
    const loss = re ? (V - VAL[att.piece]) : V;
    return (loss - C) >= 2;
  }

  /* ------------------------------------------------------------------
     MiniEngine — tiny alpha-beta fallback (material + PST)
     ------------------------------------------------------------------ */
  const PST_CENTER = [0, 1, 2, 3, 3, 2, 1, 0];
  const MiniEngine = {
    evaluate(c) {
      // white POV centipawns
      const board = c.board();
      let s = 0;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const p = board[r][f]; if (!p) continue;
          let v = VAL[p.type] * 100;
          if (p.type === 'k') v = 0;
          if (p.type === 'n' || p.type === 'b') v += (PST_CENTER[r] + PST_CENTER[f]) * 5;
          if (p.type === 'p') v += (p.color === 'w' ? (6 - r) : (r - 1)) * 8 + PST_CENTER[f] * 3;
          s += p.color === 'w' ? v : -v;
        }
      }
      return s;
    },
    search(c, depth, alpha, beta, color, counter) {
      counter.n++;
      if (c.in_checkmate()) return -100000 - depth;
      if (c.in_draw()) return 0;
      if (depth <= 0) return color * this.evaluate(c);
      let moves = c.moves({ verbose: true });
      moves.sort((a, b) => (b.captured ? VAL[b.captured] * 10 - VAL[b.piece] : 0) - (a.captured ? VAL[a.captured] * 10 - VAL[a.piece] : 0));
      let best = -Infinity;
      for (const m of moves) {
        c.move(m);
        const sc = -this.search(c, depth - 1, -beta, -alpha, -color, counter);
        c.undo();
        if (sc > best) best = sc;
        if (sc > alpha) alpha = sc;
        if (alpha >= beta) break;
        if (counter.n > 60000) break;
      }
      return best;
    },
    analyze(fen, depth) {
      const c = newChess(fen);
      const color = c.turn() === 'w' ? 1 : -1;
      const counter = { n: 0 };
      const moves = c.moves({ verbose: true });
      const scored = [];
      for (const m of moves) {
        c.move(m);
        const sc = -this.search(c, depth - 1, -Infinity, Infinity, -color, counter);
        c.undo();
        scored.push({ uci: m.from + m.to + (m.promotion || ''), sc });
      }
      scored.sort((a, b) => b.sc - a.sc);
      return scored.map(s => {
        let cp = s.sc, mate = null;
        if (Math.abs(cp) > 50000) { mate = cp > 0 ? 1 : -1; cp = mateToCp(mate); }
        return { uci: s.uci, pv: [s.uci], cp, mate, cpWhite: color * cp, mateWhite: mate == null ? null : color * mate };
      });
    }
  };

  /* ------------------------------------------------------------------
     Stockfish worker management + job queue
     ------------------------------------------------------------------ */
  let worker = null;
  let engineKind = null;       // 'stockfish' | 'mini'
  let currentJob = null;
  const queue = [];
  const cache = new Map();      // fenKey -> Analysis (full strength analyses only)
  const cloudMiss = new Set();
  let cloudBlockedUntil = 0;

  let lastMultiPV = null;
  let lastSkill = null;

  function bootWorker(factory, timeoutMs) {
    return new Promise((resolve, reject) => {
      let w;
      try { w = factory(); } catch (e) { reject(e); return; }
      let gotUci = false;
      const timer = setTimeout(() => { try { w.terminate(); } catch (e) { /* */ } reject(new Error('timeout')); }, timeoutMs);
      w.onerror = (e) => { clearTimeout(timer); try { w.terminate(); } catch (x) { /* */ } reject(e); };
      w.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : '';
        if (!gotUci && line.indexOf('uciok') === 0) {
          gotUci = true;
          w.postMessage('isready');
        } else if (gotUci && line.indexOf('readyok') === 0) {
          clearTimeout(timer);
          resolve(w);
        }
      };
      w.postMessage('uci');
    });
  }

  async function initWorker() {
    const factories = [];
    if (location.protocol.indexOf('http') === 0) factories.push(() => new Worker('vendor/stockfish.js'));
    factories.push(() => {
      const blob = new Blob(["importScripts('" + SF_CDN + "');"], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    });
    for (const f of factories) {
      try {
        const w = await bootWorker(f, 6000);
        worker = w;
        lastMultiPV = null;
        lastSkill = null;
        worker.onmessage = onWorkerMessage;
        worker.onerror = () => { console.warn('[Engine] worker crashed → mini'); fallbackToMini(); };
        engineKind = 'stockfish';
        pump();
        return 'stockfish';
      } catch (e) { console.warn('[Engine] worker boot failed', e); }
    }
    engineKind = 'mini';
    pump();
    return 'mini';
  }

  function fallbackToMini() {
    try { worker && worker.terminate(); } catch (e) { /* */ }
    worker = null;
    if (currentJob) {
      const j = currentJob;
      clearTimeout(j.timer);
      clearTimeout(j.killTimer);
      currentJob = null;
      runMini(j);
    }
    // Attempt to respawn Stockfish worker in the background instead of staying on MiniEngine forever
    engineKind = 'mini';
    initWorker().catch(() => {});
    pump();
  }

  function send(cmd) { if (worker) worker.postMessage(cmd); }

  function onWorkerMessage(e) {
    const line = typeof e.data === 'string' ? e.data : '';
    const job = currentJob;
    if (!job) return;
    if (line.indexOf('info') === 0 && line.indexOf(' pv ') > 0) {
      const t = line.split(' ');
      const get = (k) => { const i = t.indexOf(k); return i >= 0 ? t[i + 1] : null; };
      const depth = parseInt(get('depth'), 10) || 0;
      const mpv = parseInt(get('multipv'), 10) || 1;
      const si = t.indexOf('score');
      if (si < 0) return;
      const kind = t[si + 1]; const val = parseInt(t[si + 2], 10);
      const pv = t.slice(t.indexOf('pv') + 1);
      job.lines[mpv] = { depth, kind, val, pv };
      job.depth = Math.max(job.depth, depth);
    } else if (line.indexOf('bestmove') === 0) {
      clearTimeout(job.timer);
      clearTimeout(job.killTimer);
      const best = line.split(' ')[1];
      currentJob = null;
      finishJob(job, best);
      pump();
    }
  }

  function finishJob(job, best) {
    if (job.cancelled) { job.resolve(null); return; }
    const sign = turnOf(job.fen) === 'w' ? 1 : -1;
    const lines = Object.keys(job.lines).map(k => +k).sort((a, b) => a - b).map(k => {
      const l = job.lines[k];
      const cp = l.kind === 'mate' ? mateToCp(l.val) : l.val;
      const mate = l.kind === 'mate' ? l.val : null;
      return { uci: l.pv[0], pv: l.pv, cp, mate, cpWhite: sign * cp, mateWhite: mate == null ? null : sign * mate };
    });
    if (!lines.length && best && best !== '(none)') lines.push({ uci: best, pv: [best], cp: 0, mate: null, cpWhite: 0, mateWhite: null });
    job.resolve({ lines, best, depth: job.depth });
  }

  function pump() {
    if (currentJob || !queue.length || !engineKind) return;
    const job = queue.shift();
    if (job.cancelled) { job.resolve(null); pump(); return; }
    currentJob = job;
    if (engineKind === 'mini' || !worker) { currentJob = null; runMini(job); return; }
    job.lines = {}; job.depth = 0;
    const o = job.options;
    const mpv = o.multiPV || 1;
    const skill = o.skill != null ? o.skill : 20;
    if (mpv !== lastMultiPV) { send('setoption name MultiPV value ' + mpv); lastMultiPV = mpv; }
    if (skill !== lastSkill) { send('setoption name Skill Level value ' + skill); lastSkill = skill; }
    send('position fen ' + job.fen);
    send('go depth ' + o.depth + ' movetime ' + o.movetime);
    const stopAfter = Math.max(300, o.movetime || 500) + 1200;
    job.timer = setTimeout(() => { send('stop'); }, stopAfter);
    job.killTimer = setTimeout(() => {
      if (currentJob === job) {
        console.warn('[Engine] worker search timed out → restarting worker');
        fallbackToMini();
      }
    }, stopAfter + 4000);
  }

  function runMini(job) {
    setTimeout(() => {
      if (job.cancelled) { job.resolve(null); pump(); return; }
      let lines = [];
      try { lines = MiniEngine.analyze(job.fen, job.options.miniDepth || 2); } catch (e) { console.error(e); }
      job.resolve({ lines: lines.slice(0, Math.max(1, job.options.multiPV || 1)), best: lines[0] ? lines[0].uci : null, depth: job.options.miniDepth || 2 });
      pump();
    }, 30);
  }

  function enqueue(fen, options, kind, priority, tag) {
    return new Promise(resolve => {
      const job = { fen, options, kind, tag, resolve, cancelled: false };
      if (priority === 'high') queue.unshift(job); else queue.push(job);
      pump();
    });
  }

  /* ------------------------------------------------------------------
     Lichess cloud eval
     ------------------------------------------------------------------ */
  async function cloudEval(fen, multiPV) {
    if (!navigator.onLine || Date.now() < cloudBlockedUntil) return null;
    const key = fenKey(fen);
    if (cloudMiss.has(key)) return null;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), 1500);
    try {
      const res = await fetch(CLOUD_URL + '?fen=' + encodeURIComponent(fen) + '&multiPv=' + (multiPV || 1), { signal: ctrl ? ctrl.signal : undefined });
      clearTimeout(timer);
      if (res.status === 429) { cloudBlockedUntil = Date.now() + 60000; return null; }
      if (!res.ok) { cloudMiss.add(key); return null; }
      const data = await res.json();
      if (!data.pvs || !data.pvs.length) { cloudMiss.add(key); return null; }
      const sign = turnOf(fen) === 'w' ? 1 : -1;
      const lines = data.pvs.map(p => {
        const pv = (p.moves || '').split(' ').filter(Boolean);
        const mateWhite = p.mate != null ? p.mate : null;
        const cpWhite = mateWhite != null ? mateToCp(mateWhite) : p.cp;
        return { uci: pv[0], pv, cp: sign * cpWhite, mate: mateWhite == null ? null : sign * mateWhite, cpWhite, mateWhite };
      }).filter(l => l.uci);
      if (!lines.length) return null;
      return { lines, depth: data.depth || 0 };
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
  }

  function buildAnalysis(fen, raw, source) {
    const lines = raw.lines || [];
    // normalize castling notation from cloud (e1h1 → e1g1 etc.)
    lines.forEach(l => { l.uci = normalizeCastle(fen, l.uci); });
    const top = lines[0];
    return {
      fen, source, depth: raw.depth || 0, lines,
      bestUci: top ? top.uci : (raw.best || null),
      cpWhite: top ? top.cpWhite : 0,
      mate: top ? top.mateWhite : null
    };
  }
  function normalizeCastle(fen, uci) {
    if (!uci) return uci;
    const map = { e1h1: 'e1g1', e1a1: 'e1c1', e8h8: 'e8g8', e8a8: 'e8c8' };
    if (map[uci]) {
      const c = newChess(fen);
      const p = c && c.get(uci.slice(0, 2));
      if (p && p.type === 'k') return map[uci];
    }
    return uci;
  }

  /* ------------------------------------------------------------------
     Move formatting & tactical commentary
     ------------------------------------------------------------------ */
  function describeMove(fen, uci) {
    const c = newChess(fen); if (!c || !uci) return uci || '';
    const m = c.move(parseUci(uci)); if (!m) return uci;
    return m.san;
  }

  function moveInfo(fen, uci) {
    const c = newChess(fen); if (!c || !uci) return null;
    const m = c.move(parseUci(uci)); if (!m) return null;
    return { m, fenAfter: c.fen(), check: c.in_check(), mate: c.in_checkmate() };
  }

  function forkTargets(fenAfter, sq, moverPiece, givesCheck) {
    const c = newChess(fenAfter);
    const p = c && c.get(sq);
    const opp = p ? (p.color === 'w' ? 'b' : 'w') : turnOf(fenAfter);
    if (canProfitablyCaptureSquare(fenAfter, sq, opp)) return null;
    const att = attackedBy(fenAfter, sq);
    const targets = att.filter(a => a.type !== 'k' && (VAL[a.type] > VAL[moverPiece] || a.type === 'r' || a.type === 'q'));
    const uniq = [];
    targets.forEach(t => { if (!uniq.some(u => u.square === t.square)) uniq.push(t); });
    if (givesCheck && !uniq.some(u => u.type === 'k')) uniq.unshift({ type: 'k', square: '' });
    return uniq.length >= 2 ? uniq : null;
  }

  function joinNames(list) {
    const names = list.map(t => I18N.pieceName(t.type));
    if (names.length <= 1) return names.join('');
    return names.slice(0, -1).join(', ') + I18N.t('coach.join') + names[names.length - 1];
  }

  /* Check how much net material (in pawns) the move `uci` wins on its destination square */
  function netCaptureGain(fen, uci) {
    const c = newChess(fen); if (!c || !uci) return 0;
    const mv = c.move(parseUci(uci));
    if (!mv || !mv.captured) return 0;
    const capturedVal = VAL[mv.captured] || 0;
    const attackerVal = VAL[mv.promotion || mv.piece] || 1;
    const fenAfter = c.fen();
    const defenderColor = mv.color === 'w' ? 'b' : 'w';
    const recap = minAttacker(fenAfter, mv.to, defenderColor);
    if (!recap) return capturedVal; // completely undefended
    return Math.max(0, capturedVal - attackerVal);
  }

  function withTurn(fen, color) {
    const parts = fen.split(' ');
    parts[1] = color;
    parts[3] = '-';
    return parts.join(' ');
  }

  /* Check if `attackerColor` can profitably capture (gain >= 2 pawns) the piece on `sq` in `fen` */
  function canProfitablyCaptureSquare(fen, sq, attackerColor) {
    const tf = withTurn(fen, attackerColor);
    const c = newChess(tf);
    if (!c) return false;
    const target = c.get(sq);
    if (!target || target.color === attackerColor) return false;
    const att = minAttacker(tf, sq, attackerColor);
    if (!att) return false;
    const gain = netCaptureGain(tf, att.from + att.to + (att.promotion || ''));
    return gain >= 2;
  }

  /* Verify on the actual board whether `bestUci` genuinely saves or defends `playedHang` */
  function bestMoveActuallyDefends(fenBefore, bestUci, playedHang, playerColor) {
    if (!playedHang || !playedHang.square || !bestUci) return false;
    const cBefore = newChess(fenBefore);
    if (!cBefore) return false;
    const existing = cBefore.get(playedHang.square);
    // The threatened piece must have already existed on that square before the move
    if (!existing || existing.color !== playerColor || existing.type !== playedHang.type) return false;

    const info = moveInfo(fenBefore, bestUci);
    if (!info) return false;
    const opponentColor = playerColor === 'w' ? 'b' : 'w';

    // Case 1: bestUci moves the threatened piece itself to a safe square
    if (info.m.from === playedHang.square) {
      return !canProfitablyCaptureSquare(info.fenAfter, info.m.to, opponentColor);
    }
    // Case 2: bestUci defends the square, blocks the line of attack, or captures the attacker
    // so that after bestUci, the opponent can no longer profitably capture on playedHang.square
    return !canProfitablyCaptureSquare(info.fenAfter, playedHang.square, opponentColor);
  }

  /* Simulate up to `maxPlies` along a UCI principal variation */
  function simulatePv(fenStart, pvUcis, maxPlies) {
    const c = newChess(fenStart);
    const limit = maxPlies || 4;
    const steps = [];
    const sanList = [];
    if (!c || !Array.isArray(pvUcis) || !pvUcis.length) return { steps, sanList, formatted: '' };
    for (let i = 0; i < pvUcis.length && i < limit; i++) {
      const uci = pvUcis[i];
      if (!uci) break;
      const fenBefore = c.fen();
      const m = c.move(parseUci(uci));
      if (!m) break;
      const fenAfter = c.fen();
      steps.push({ uci, san: m.san, m, fenBefore, fenAfter, check: c.in_check(), mate: c.in_checkmate() });
      sanList.push(m.san);
    }
    return { steps, sanList, formatted: sanList.join(' \u2192 ') };
  }

  /* Material balance change (in pawns) for `sideColor` between two FENs */
  function netMaterialDelta(fenStart, fenEnd, sideColor) {
    const balance = (fen) => {
      const c = newChess(fen);
      if (!c) return 0;
      let diff = 0;
      const board = c.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const p = board[r][f];
          if (!p || p.type === 'k') continue;
          diff += (p.color === sideColor ? 1 : -1) * (VAL[p.type] || 0);
        }
      }
      return diff;
    };
    return balance(fenEnd) - balance(fenStart);
  }

  /* Detect whether `info` rescues an attacked friendly piece or defends another threatened piece */
  function findSavedPiece(fenBefore, info, playerColor) {
    const cBefore = newChess(fenBefore);
    if (!cBefore || !info) return null;
    const opp = playerColor === 'w' ? 'b' : 'w';
    const board = cBefore.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p || p.color !== playerColor || p.type === 'p' || p.type === 'k') continue;
        const sq = 'abcdefgh'[f] + (8 - r);
        if (!canProfitablyCaptureSquare(fenBefore, sq, opp)) continue;
        if (sq === info.m.from) {
          if (!canProfitablyCaptureSquare(info.fenAfter, info.m.to, opp)) {
            return { kind: 'evade', type: p.type, square: info.m.to };
          }
        } else if (!canProfitablyCaptureSquare(info.fenAfter, sq, opp)) {
          return { kind: 'defend', type: p.type, square: sq };
        }
      }
    }
    return null;
  }

  /* Detect whether the piece moved in `info` now directly threatens a valuable enemy piece */
  function findCreatedThreat(info, playerColor) {
    if (!info || info.m.piece === 'k') return null;
    const att = attackedBy(info.fenAfter, info.m.to);
    const tf = withTurn(info.fenAfter, playerColor);
    const candidates = att
      .filter(t => VAL[t.type] >= 3 && (VAL[t.type] > VAL[info.m.piece] || netCaptureGain(tf, info.m.to + t.square) >= 2))
      .sort((a, b) => VAL[b.type] - VAL[a.type]);
    return candidates[0] || null;
  }

  function hasFriendlyPawnOnFile(fen, fileCh, color) {
    const c = newChess(fen);
    if (!c) return false;
    const f = 'abcdefgh'.indexOf(fileCh);
    if (f < 0) return false;
    const board = c.board();
    for (let r = 0; r < 8; r++) {
      const p = board[r][f];
      if (p && p.color === color && p.type === 'p') return true;
    }
    return false;
  }

  function describePositivePurpose(fenBefore, uci, playerColor, ply, mate) {
    const sign = playerColor === 'w' ? 1 : -1;
    if (mate != null && mate * sign > 0) return I18N.t('p.mate', { n: Math.abs(mate) });
    const info = moveInfo(fenBefore, uci);
    if (!info) return '';
    const m = info.m;
    const pieceName = I18N.t('piece.pl.' + m.piece);
    if (m.promotion) return I18N.t('p.promote');
    const fork = (m.piece !== 'k') ? forkTargets(info.fenAfter, m.to, m.piece, info.check) : null;
    if (fork) return I18N.t('p.fork', { targets: joinNames(fork) });
    if (m.captured) {
      const capName = I18N.t('piece.pl.' + m.captured);
      if (netCaptureGain(fenBefore, uci) >= 2) return I18N.t('p.capture', { piece: capName, square: m.to });
      return I18N.t('p.trade', { piece: capName, square: m.to });
    }
    const saved = findSavedPiece(fenBefore, info, playerColor);
    if (saved) {
      return I18N.t(saved.kind === 'evade' ? 'p.evade' : 'p.defend', { piece: I18N.t('piece.pl.' + saved.type), square: saved.square });
    }
    if (info.check) return I18N.t('p.check', { piece: pieceName });
    const thr = findCreatedThreat(info, playerColor);
    if (thr) {
      return I18N.t('p.threat', { piece: pieceName, square: m.to, target: I18N.t('piece.pl.' + thr.type), tsq: thr.square });
    }
    if (m.flags.indexOf('k') >= 0 || m.flags.indexOf('q') >= 0) return I18N.t('p.castle');
    if (m.piece === 'p') {
      const r = parseInt(m.to[1], 10);
      if ((playerColor === 'w' && r >= 5) || (playerColor === 'b' && r <= 4)) {
        return I18N.t('p.pawnPush', { square: m.to });
      }
    }
    if (m.piece === 'r' || m.piece === 'q') {
      const onSeventh = (playerColor === 'w' && m.to[1] === '7') || (playerColor === 'b' && m.to[1] === '2');
      if (onSeventh || !hasFriendlyPawnOnFile(info.fenAfter, m.to[0], playerColor)) {
        return I18N.t('p.openFile', { piece: pieceName, square: m.to });
      }
    }
    if (ply <= 24 && CENTER.has(m.to)) return I18N.t('p.center', { piece: pieceName, square: m.to });
    if (ply <= 24 && (m.piece === 'n' || m.piece === 'b') && (m.from[1] === '1' || m.from[1] === '8')) {
      return I18N.t('p.develop', { piece: pieceName, square: m.to });
    }
    if (m.piece === 'k' && ply > 40) return I18N.t('p.kingActive', { square: m.to });
    return I18N.t('p.positional', { piece: pieceName, square: m.to });
  }

  function bestMoveReason(ctx, cls, playedHang) {
    const { fenBefore, before, color, ply } = ctx;
    const bestUci = before.bestUci;
    const move = describeMove(fenBefore, bestUci);
    const sign = color === 'w' ? 1 : -1;
    if (before.mate != null && before.mate * sign > 0) return I18N.t('b.mate', { move, n: Math.abs(before.mate) });
    const info = moveInfo(fenBefore, bestUci);
    if (!info) return I18N.t('b.generic', { move });
    const m = info.m;
    if (m.promotion) return I18N.t('b.promote', { move });
    const fork = (m.piece !== 'k') ? forkTargets(info.fenAfter, m.to, m.piece, info.check) : null;
    if (fork) return I18N.t('b.fork', { move, targets: joinNames(fork) });
    if (m.captured && VAL[m.captured] >= 3 && netCaptureGain(fenBefore, bestUci) >= 2) {
      return I18N.t('b.capture', { move, piece: I18N.t('piece.pl.' + m.captured) });
    }
    if (info.check) return I18N.t('b.check', { move });
    if (playedHang && bestMoveActuallyDefends(fenBefore, bestUci, playedHang, color)) {
      return I18N.t('b.defend', { move, piece: I18N.t('piece.pl.' + playedHang.type), square: playedHang.square });
    }
    const saved = findSavedPiece(fenBefore, info, color);
    if (saved) {
      return I18N.t(saved.kind === 'evade' ? 'b.evade' : 'b.defend', { move, piece: I18N.t('piece.pl.' + saved.type), square: saved.square });
    }
    if (m.flags.indexOf('k') >= 0 || m.flags.indexOf('q') >= 0) return I18N.t('b.castle', { move });
    if (m.captured) return I18N.t('b.capture', { move, piece: I18N.t('piece.pl.' + m.captured) });
    const thr = findCreatedThreat(info, color);
    if (thr) return I18N.t('b.threat', { move, piece: I18N.t('piece.pl.' + m.piece), target: I18N.t('piece.pl.' + thr.type), tsq: thr.square });
    const bestPv = before && before.lines && before.lines[0] ? simulatePv(fenBefore, before.lines[0].pv, 3) : { steps: [], formatted: '' };
    if (bestPv.steps.length >= 2 && bestPv.formatted) {
      const endFen = bestPv.steps[bestPv.steps.length - 1].fenAfter;
      if (netMaterialDelta(fenBefore, endFen, color) >= 2) {
        return I18N.t('b.tacticPv', { move });
      }
    }
    if (ply <= 24 && CENTER.has(m.to)) return I18N.t('b.center', { move });
    if (ply <= 24 && (m.piece === 'n' || m.piece === 'b') && (m.from[1] === '1' || m.from[1] === '8')) return I18N.t('b.develop', { move });
    if (m.piece !== 'k') {
      return I18N.t('b.positionalSq', { move, piece: I18N.t('piece.pl.' + m.piece), square: m.to });
    }
    return I18N.t('b.generic', { move });
  }

  function playedReason(ctx, c) {
    const { fenBefore, uci, before, after, color, ply } = ctx;
    const sign = color === 'w' ? 1 : -1;
    const opp = color === 'w' ? 'b' : 'w';
    const info = moveInfo(fenBefore, uci);
    const res = { key: 'r.generic', params: {}, hang: null };
    if (!info) return res;
    const reply = after && after.bestUci;
    const replySan = reply ? uciToSan(info.fenAfter, reply) : '';
    // allows mate
    if (after && after.mate != null && after.mate * sign < 0 && !(before.mate != null && before.mate * sign < 0)) {
      return { key: 'r.allowsMate', params: { n: Math.abs(after.mate), reply: replySan }, hang: null };
    }
    // missed mate or delayed forced mate
    if (before.mate != null && before.mate * sign > 0) {
      if (!(after && after.mate != null && after.mate * sign > 0)) {
        return { key: 'r.missedMate', params: { n: Math.abs(before.mate) }, hang: null };
      }
      if (Math.abs(after.mate) > Math.abs(before.mate)) {
        return { key: 'r.delayedMate', params: { best: describeMove(fenBefore, before.bestUci) }, hang: null };
      }
    }
    // hangs a piece or pawn: opponent's best reply profitably wins material
    const ri = reply ? moveInfo(info.fenAfter, reply) : null;
    if (ri) {
      const netGain = ri.m.captured ? netCaptureGain(info.fenAfter, reply) : 0;
      if (ri.m.captured && VAL[ri.m.captured] >= 3 && netGain >= 2) {
        if (ri.m.to === info.m.to) {
          return {
            key: 'r.movedIntoAttack',
            params: { piece: I18N.t('piece.pl.' + ri.m.captured), square: ri.m.to, reply: replySan },
            hang: null
          };
        }
        const hang = { type: ri.m.captured, square: ri.m.to };
        return { key: 'r.hangs', params: { piece: I18N.t('piece.pl.' + hang.type), square: hang.square, reply: replySan }, hang };
      }
      if (ri.m.captured === 'p' && netGain >= 1) {
        return { key: 'r.hangsPawn', params: { square: ri.m.to, reply: replySan }, hang: { type: 'p', square: ri.m.to } };
      }
      // allows an immediate fork
      if (ri.m.piece !== 'k') {
        const fork = forkTargets(ri.fenAfter, ri.m.to, ri.m.piece, ri.check);
        if (fork) {
          return { key: 'r.allowsFork', params: { reply: replySan, targets: joinNames(fork) }, hang: null };
        }
      }
    }

    // Multi-ply PV tactical loss check (evaluate on even ply when possible to avoid horizon recapture bias)
    const pvArr = after && after.lines && after.lines[0] && after.lines[0].pv;
    const pvSim = pvArr ? simulatePv(info.fenAfter, pvArr, 4) : { steps: [], formatted: '' };
    if (pvSim.steps.length >= 2) {
      const checkLen = pvSim.steps.length % 2 === 1 && pvSim.steps.length > 2 ? pvSim.steps.length - 1 : pvSim.steps.length;
      const endFen = pvSim.steps[checkLen - 1].fenAfter;
      if (netMaterialDelta(info.fenAfter, endFen, opp) >= 1) {
        const oppCaps = pvSim.steps.slice(0, checkLen).filter(s => s.m.color === opp && s.m.captured);
        if (oppCaps.length) {
          oppCaps.sort((a, b) => (VAL[b.m.captured] || 0) - (VAL[a.m.captured] || 0));
          const lostStep = oppCaps[0];
          return {
            key: 'r.tacticalLoss',
            params: { reply: replySan || pvSim.sanList[0] || '', piece: I18N.t('piece.pl.' + lostStep.m.captured), square: lostStep.m.to },
            hang: null
          };
        }
      }
    }

    // missed profitable capture
    const bi = moveInfo(fenBefore, before.bestUci);
    if (bi && bi.m.captured && VAL[bi.m.captured] >= 3 && netCaptureGain(fenBefore, before.bestUci) >= 2 && !info.m.captured) {
      return { key: 'r.missedCapture', params: { piece: I18N.t('piece.pl.' + bi.m.captured), square: bi.m.to }, hang: null };
    }
    if (ri && ri.check) {
      return { key: 'r.allowsCheck', params: { reply: replySan }, hang: null };
    }
    if (ri) {
      const thr = findCreatedThreat(ri, opp);
      if (thr) {
        return { key: 'r.allowsThreat', params: { reply: replySan, piece: I18N.t('piece.pl.' + thr.type), square: thr.square }, hang: null };
      }
    }
    // center
    if (ply <= 20 && bi && (CENTER.has(bi.m.to) || EXT_CENTER.has(bi.m.to)) && !CENTER.has(info.m.to) &&
      ('ah'.indexOf(info.m.to[0]) >= 0 || info.m.to[1] === (color === 'w' ? '1' : '8') || !EXT_CENTER.has(info.m.to))) {
      return { key: 'r.center', params: {}, hang: null };
    }
    // king safety: pawn push in front of own castled king in opening/middlegame
    if (ply <= 36 && info.m.piece === 'p') {
      const cc = newChess(fenBefore);
      const backRank = color === 'w' ? 7 : 0;
      const board = cc.board();
      let kf = null;
      for (let f = 0; f < 8; f++) {
        const p = board[backRank][f];
        if (p && p.type === 'k' && p.color === color) kf = 'abcdefgh'[f];
      }
      const shelter = kf === 'g' || kf === 'h' ? 'fgh' : (kf === 'b' || kf === 'c' || kf === 'a') ? 'abc' : '';
      if (shelter && shelter.indexOf(info.m.from[0]) >= 0) return { key: 'r.kingSafety', params: {}, hang: null };
    }
    if (c.winBefore >= 60 && c.winAfter < 55) return { key: 'r.lostAdvantage', params: {}, hang: null };
    if (bi && (bi.m.captured || bi.check) && !info.m.captured && !info.check) return { key: 'r.passive', params: {}, hang: null };
    if (replySan) return { key: 'r.counterplay', params: { reply: replySan }, hang: null };
    return res;
  }

  function comment(ctx, c, opts) {
    if (!ctx || !c) return '';
    if (window.Commentary && typeof window.Commentary.comment === 'function') {
      return window.Commentary.comment(ctx, c, opts);
    }
    opts = opts || {};
    const hideBest = !!opts.hideBest;
    const label = I18N.classLabel(c.cls) + ' (' + I18N.CLASS_SYMBOL[c.cls] + '): ';
    const sign = ctx.color === 'w' ? 1 : -1;
    const evalStr = formatEval(c.evalAfter, ctx.after ? ctx.after.mate : null);
    if (c.cls === 'brilliant') {
      const info = moveInfo(ctx.fenBefore, ctx.uci);
      return label + I18N.t('r.brilliant', { piece: I18N.t('piece.pl.' + (info ? info.m.piece : 'n')) }) + ' ' + cap(I18N.t('coach.gain', { eval: evalStr })) + '.';
    }
    if (c.cls === 'great') {
      const mateNow = c.isBest && ctx.before ? ctx.before.mate : (ctx.after ? ctx.after.mate : null);
      const purpose = describePositivePurpose(ctx.fenBefore, ctx.uci, ctx.color, ctx.ply, mateNow);
      return label + I18N.t('r.great') + (purpose ? ' ' + purpose : '') + ' ' + cap(I18N.t('coach.gain', { eval: evalStr })) + '.';
    }
    if (c.cls === 'best') {
      const mateNow = c.isBest && ctx.before ? ctx.before.mate : (ctx.after ? ctx.after.mate : null);
      const purpose = describePositivePurpose(ctx.fenBefore, ctx.uci, ctx.color, ctx.ply, mateNow);
      const body = c.isBest
        ? (purpose || I18N.t('r.best'))
        : I18N.t('p.altNote', { best: c.bestSan || '', purpose: purpose || I18N.t('r.good') });
      return label + body + ' ' + cap(I18N.t('coach.gain', { eval: evalStr })) + '.';
    }
    if (c.cls === 'book') return label + I18N.t('r.book') + ' ' + cap(I18N.t('coach.gain', { eval: evalStr })) + '.';

    const pr = playedReason(ctx, c);
    let reasonText;
    if (c.cls === 'good') {
      const purpose = describePositivePurpose(ctx.fenBefore, ctx.uci, ctx.color, ctx.ply, ctx.after ? ctx.after.mate : null);
      reasonText = purpose || I18N.t('r.good');
      if (!c.isBest && ctx.before && ctx.before.bestUci) {
        return label + reasonText + ' ' + bestMoveReason(ctx, c.cls, null);
      }
      return label + reasonText;
    } else {
      const reason = I18N.t(pr.key, pr.params);
      const dropPawns = (sign * (c.evalBefore - c.evalAfter)) / 100;
      const bigEval = Math.abs(c.evalBefore) >= 1500 || Math.abs(c.evalAfter) >= 1500;
      reasonText = bigEval
        ? I18N.t('coach.reasonEnd', { reason })
        : I18N.t('coach.reasonDrop', { reason, drop: '-' + Math.max(0.1, dropPawns).toFixed(1) });
    }
    let bestText = '';
    if (!hideBest && !c.isBest && ctx.before && ctx.before.bestUci) bestText = ' ' + bestMoveReason(ctx, c.cls, pr.hang);
    return label + reasonText + bestText;
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ------------------------------------------------------------------
     Classifier
     ------------------------------------------------------------------ */
  function classifyMove(ctx) {
    const { fenBefore, uci, color, ply, before, after, uciHistory } = ctx;
    const sign = color === 'w' ? 1 : -1;
    const evalBefore = before ? before.cpWhite : 0;
    let evalAfter = after ? after.cpWhite : evalBefore;
    const bestUci = before ? before.bestUci : null;
    const isBest = sameMove(uci, bestUci);
    const hadMate = before && before.mate != null && before.mate * sign > 0 ? Math.abs(before.mate) : null;
    let hasMate = after && after.mate != null && after.mate * sign > 0 ? Math.abs(after.mate) : null;

    // If the played move is already present in `before.lines` (same search depth & horizon),
    // use its direct evaluation from `before.lines` to avoid odd/even ply horizon noise.
    if (before && before.lines && before.lines.length) {
      const matchedLine = before.lines.find(l => sameMove(l.uci, uci));
      if (matchedLine) {
        evalAfter = matchedLine.cpWhite;
        if (matchedLine.mateWhite != null && matchedLine.mateWhite * sign > 0) {
          hasMate = Math.abs(matchedLine.mateWhite);
        }
      }
    }
    if (isBest) {
      evalAfter = evalBefore;
      hasMate = hadMate;
    }

    const winBefore = winPercent(sign * evalBefore);
    const winAfter = winPercent(sign * evalAfter);
    let winDrop = isBest ? 0 : Math.max(0, winBefore - winAfter);
    const cpl = isBest ? 0 : Math.max(0, Math.min(1000, sign * (clampCp(evalBefore) - clampCp(evalAfter))));
    const rawCpl = isBest ? 0 : Math.max(0, sign * (evalBefore - evalAfter));
    let cls;

    const startStd = ctx.startFen ? fenKey(ctx.startFen) === fenKey(START_FEN) : true;
    if (startStd && ply <= 20 && uciHistory && isBookLine(uciHistory) && winDrop <= 6 && cpl <= 55 && hadMate == null) {
      cls = 'book';
    } else if (hadMate != null && !isBest) {
      if (hasMate == null) {
        if (hadMate <= 3) cls = (sign * evalAfter >= 400) ? 'inaccuracy' : 'mistake';
        else cls = (sign * evalAfter >= 500 && rawCpl < 250) ? 'good' : 'inaccuracy';
      } else if (hasMate > hadMate) {
        if (hadMate === 1 || hasMate - hadMate >= 3) cls = 'inaccuracy';
        else cls = 'good';
      } else {
        cls = 'best';
      }
    } else if (sign * evalBefore >= 600 && !isBest && rawCpl > 20 && winDrop <= 6.5) {
      if (sign * evalAfter >= 650 || rawCpl <= 180) cls = 'good';
      else if (rawCpl <= 380) cls = 'inaccuracy';
      else cls = 'mistake';
    } else if (isBest || (cpl <= 12 && winDrop <= 1.2 && rawCpl <= 25)) {
      cls = 'best';
      if (winAfter >= 40 && isSacrifice(fenBefore, uci) && cpl <= 25 && winDrop <= 2.5) cls = 'brilliant';
      else if (isBest && before && before.lines && before.lines.length > 1) {
        const w1 = winPercent(sign * before.lines[0].cpWhite);
        const w2 = winPercent(sign * before.lines[1].cpWhite);
        if (w1 - w2 >= 15 && winAfter > 30 && winBefore < 98) cls = 'great';
      }
    } else if (winDrop <= 6.5 && cpl <= 65) {
      cls = 'good';
    } else if (winDrop <= 14 && cpl <= 145) {
      cls = 'inaccuracy';
    } else if (winDrop <= 25 && cpl <= 280) {
      cls = 'mistake';
    } else {
      cls = 'blunder';
    }

    const critical = ['brilliant', 'inaccuracy', 'mistake', 'blunder'].indexOf(cls) >= 0 || (!isBest && winDrop >= 6 && cls !== 'book');
    return {
      cls, cpl: Math.round(cpl), winDrop: Math.round(winDrop * 10) / 10,
      evalBefore, evalAfter, winBefore, winAfter,
      bestUci, bestSan: bestUci ? uciToSan(fenBefore, bestUci) : null,
      isBest, critical, accuracy: moveAccuracy(winBefore, winAfter)
    };
  }

  function isBookLine(uciHistory) {
    if (!uciHistory || !uciHistory.length) return false;
    return BOOK.has(uciHistory.join(' '));
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */
  let readyResolve;
  const ready = new Promise(r => { readyResolve = r; });

  const Engine = {
    isMobile, profile, ready, START_FEN, VAL,
    get kind() { return engineKind; },
    cloudEnabled: false,

    init() {
      if (this._inited) return this.ready;
      this._inited = true;
      initWorker().then(kind => readyResolve(kind)).catch(() => { engineKind = 'mini'; readyResolve('mini'); });
      return this.ready;
    },

    async analyze(fen, opts) {
      opts = opts || {};
      const multiPV = opts.multiPV || 3;
      const key = fenKey(fen);
      const over = isGameOverFen(fen);
      if (over) return { fen, source: 'rules', depth: 0, lines: [], bestUci: null, cpWhite: over.cpWhite, mate: over.mate };
      const cached = cache.get(key);
      if (cached && cached.lines.length >= Math.min(multiPV, 2)) return cached;

      if (opts.useCloud === true && this.cloudEnabled) {
        const cl = await cloudEval(fen, multiPV);
        if (cl) {
          const a = buildAnalysis(fen, cl, 'cloud');
          cache.set(key, a);
          return a;
        }
      }
      await Promise.race([this.ready, new Promise(r => setTimeout(r, 2000))]);
      const depth = opts.depth || profile.depth;
      const movetime = opts.movetime || profile.movetime;
      let raw;
      if (!engineKind) {
        const lines = MiniEngine.analyze(fen, 2);
        raw = { lines: lines.slice(0, multiPV), best: lines[0] ? lines[0].uci : null, depth: 2 };
      } else {
        raw = await enqueue(fen, { multiPV, depth, movetime, skill: 20, limitStrength: false, miniDepth: 2 }, 'analysis', opts.priority, opts.tag);
      }
      if (!raw) return null;
      const a = buildAnalysis(fen, raw, (!engineKind || engineKind === 'mini') ? 'mini' : 'stockfish');
      if (a.lines.length) cache.set(key, a);
      return a;
    },

    peek(fen) { return cache.get(fenKey(fen)) || null; },

    async getBotMove(fen, bot) {
      this.cancelAnalysis('prefetch');
      await Promise.race([this.ready, new Promise(r => setTimeout(r, 1500))]);
      const c = newChess(fen);
      const legal = c.moves({ verbose: true });
      if (!legal.length) return null;
      const u = bot.uci;
      const multiPV = Math.max(1, u.multiPV || 1);
      const miniDepth = bot.tier <= 2 ? 1 : 2;
      let raw;
      if (!engineKind) {
        const lines = MiniEngine.analyze(fen, miniDepth);
        raw = { lines: lines.slice(0, multiPV), best: lines[0] ? lines[0].uci : null, depth: miniDepth };
      } else {
        raw = await enqueue(fen, {
          multiPV, depth: Math.min(u.depth, isMobile ? 12 : 20),
          movetime: isMobile ? Math.min(u.movetime, profile.maxMovetime) : u.movetime,
          skill: u.skill, limitStrength: !!u.limitStrength, elo: u.elo,
          miniDepth
        }, 'bot', 'high', 'bot');
      }
      const toUci = m => m.from + m.to + (m.promotion || '');
      if (!raw || !raw.lines || !raw.lines.length) {
        return raw && raw.best && raw.best !== '(none)' ? raw.best : toUci(legal[Math.floor(Math.random() * legal.length)]);
      }
      let choice = raw.best && raw.best !== '(none)' ? raw.best : raw.lines[0].uci;
      // never miss a forced mate-in-1 above tier 1
      const mateNow = raw.lines.find(l => l.mate === 1);
      if (mateNow && bot.tier >= 2) return mateNow.uci;
      if (Math.random() < (bot.randomness || 0)) {
        if (bot.tier <= 1 && Math.random() < 0.5) {
          choice = toUci(legal[Math.floor(Math.random() * legal.length)]);
        } else if (raw.lines.length > 1) {
          const pool = raw.lines.slice(1);
          // avoid hopeless blunders for mid tiers: keep moves within a tolerance
          const tol = bot.tier <= 2 ? 600 : bot.tier <= 4 ? 250 : 120;
          const ok = pool.filter(l => raw.lines[0].cp - l.cp <= tol);
          const pick = (ok.length ? ok : pool)[Math.floor(Math.random() * (ok.length ? ok.length : pool.length))];
          if (pick) choice = pick.uci;
        }
      }
      return choice;
    },

    cancelAnalysis(tag) {
      queue.forEach(j => { if (j.kind === 'analysis' && (!tag || j.tag === tag)) j.cancelled = true; });
      if (currentJob && currentJob.kind === 'analysis' && (!tag || currentJob.tag === tag)) {
        currentJob.cancelled = true;
        send('stop');
      }
    },

    winPercent, moveAccuracy, classifyMove, comment, uciToSan, formatEval, isBookLine,
    describeMove, sameMove, parseUci, fenKey,
    clearCache() { cache.clear(); }
  };

  window.Engine = Engine;
})();
