/* =====================================================================
   NieR Chess — commentary.js
   Global: Commentary
   Evidence-based move explanations. Every statement is VERIFIED on the real
   board (own bitboard-free geometry + Static Exchange Evaluation) and tied to
   Stockfish's output (best move, MultiPV lines, principal variation, mate scores).

   Pipeline:
     1. facts(fen, uci)       → verified motifs of ONE move (capture, fork, pin,
                                 skewer, discovered attack, rescue, passed pawn…)
     2. outcome(fen, pv)      → what Stockfish's PV really does to the material
     3. explainPlayed / explainBest / positive body → bilingual sentences
   No claim is made unless it can be proven from the position / the PV.
   ===================================================================== */
(function () {
  'use strict';

  const FILES = 'abcdefgh';
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  const KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const KG = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const STRONG = new Set(['m.mate', 'm.fork', 'm.pin', 'm.pinKing', 'm.skewer', 'm.discovered', 'm.discoveredCheck',
    'm.doubleCheck', 'm.threatWin', 'm.capWin', 'm.capFree', 'm.capSac', 'm.check']);

  const T = (k, p) => I18N.t(k, p);
  const pn = (t) => I18N.t('piece.pl.' + t);
  const other = (c) => (c === 'w' ? 'b' : 'w');
  const rel = (color, r) => (color === 'w' ? r : 7 - r);
  const inb = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const sqName = (f, r) => FILES[f] + (r + 1);
  const parseSq = (s) => [FILES.indexOf(s[0]), parseInt(s[1], 10) - 1];
  const parseUci = (u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined });
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  function mk(fen) {
    if (!fen) return null;
    const c = new Chess();
    return c.load(fen) ? c : null;
  }

  /* ---------------- board geometry ---------------- */
  function toGrid(ch) {
    const g = [];
    for (let f = 0; f < 8; f++) g.push(new Array(8).fill(null));
    const b = ch.board();
    for (let row = 0; row < 8; row++) {
      for (let f = 0; f < 8; f++) {
        const p = b[row][f];
        if (p) g[f][7 - row] = { t: p.type, c: p.color };
      }
    }
    return g;
  }

  function attackersOf(g, f, r, color) {
    const res = [];
    const pr = color === 'w' ? r - 1 : r + 1;
    [-1, 1].forEach(d => {
      if (inb(f + d, pr)) {
        const p = g[f + d][pr];
        if (p && p.c === color && p.t === 'p') res.push({ t: 'p', f: f + d, r: pr });
      }
    });
    KN.forEach(([df, dr]) => {
      const a = f + df, b = r + dr;
      if (inb(a, b)) { const p = g[a][b]; if (p && p.c === color && p.t === 'n') res.push({ t: 'n', f: a, r: b }); }
    });
    KG.forEach(([df, dr]) => {
      const a = f + df, b = r + dr;
      if (inb(a, b)) { const p = g[a][b]; if (p && p.c === color && p.t === 'k') res.push({ t: 'k', f: a, r: b }); }
    });
    const slide = (dirs, kinds) => dirs.forEach(([df, dr]) => {
      let a = f + df, b = r + dr;
      while (inb(a, b)) {
        const p = g[a][b];
        if (p) { if (p.c === color && kinds.indexOf(p.t) >= 0) res.push({ t: p.t, f: a, r: b }); break; }
        a += df; b += dr;
      }
    });
    slide(DIAG, ['b', 'q']);
    slide(ORTH, ['r', 'q']);
    return res;
  }

  function attacksFrom(g, f, r) {
    const p = g[f][r];
    if (!p) return [];
    const out = [];
    if (p.t === 'p') {
      const dr = p.c === 'w' ? 1 : -1;
      [-1, 1].forEach(d => { if (inb(f + d, r + dr)) out.push([f + d, r + dr]); });
    } else if (p.t === 'n') {
      KN.forEach(([df, dr]) => { if (inb(f + df, r + dr)) out.push([f + df, r + dr]); });
    } else if (p.t === 'k') {
      KG.forEach(([df, dr]) => { if (inb(f + df, r + dr)) out.push([f + df, r + dr]); });
    } else {
      const dirs = p.t === 'b' ? DIAG : p.t === 'r' ? ORTH : DIAG.concat(ORTH);
      dirs.forEach(([df, dr]) => {
        let a = f + df, b = r + dr;
        while (inb(a, b)) {
          out.push([a, b]);
          if (g[a][b]) break;
          a += df; b += dr;
        }
      });
    }
    return out;
  }

  function leastAtt(g, f, r, color) {
    const a = attackersOf(g, f, r, color);
    if (!a.length) return null;
    a.sort((x, y) => VAL[x.t] - VAL[y.t]);
    return a[0];
  }

  /* Static Exchange Evaluation: pawns that `color` nets by starting a capture on (f,r). */
  function see(g, f, r, color) {
    const tgt = g[f][r];
    if (!tgt || tgt.c === color) return 0;
    const gg = g.map(col => col.slice());
    let att = leastAtt(gg, f, r, color);
    if (!att) return 0;
    const gain = [VAL[tgt.t]];
    let d = 0;
    let onSq = att.t;
    gg[att.f][att.r] = null;
    let side = other(color);
    while (d < 30) {
      att = leastAtt(gg, f, r, side);
      if (!att) break;
      if (att.t === 'k' && leastAtt(gg, f, r, other(side))) break; // king cannot take a defended piece
      d++;
      gain[d] = VAL[onSq] - gain[d - 1];
      onSq = att.t;
      gg[att.f][att.r] = null;
      side = other(side);
    }
    while (d > 0) { gain[d - 1] = -Math.max(-gain[d - 1], gain[d]); d--; }
    return gain[0];
  }

  /* own pieces that the opponent could win material on (SEE > 0) */
  function threatsOf(g, color) {
    const opp = other(color);
    const res = [];
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const p = g[f][r];
        if (!p || p.c !== color || p.t === 'k') continue;
        const s = see(g, f, r, opp);
        if (s > 0) res.push({ t: p.t, f, r, s });
      }
    }
    return res;
  }

  function kingSq(g, color) {
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const p = g[f][r];
      if (p && p.t === 'k' && p.c === color) return [f, r];
    }
    return null;
  }
  function pawnsOnFile(g, f, color) {
    let n = 0;
    for (let r = 0; r < 8; r++) { const p = g[f][r]; if (p && p.t === 'p' && (!color || p.c === color)) n++; }
    return n;
  }
  function isPassed(g, f, r, col) {
    const dir = col === 'w' ? 1 : -1;
    for (let df = -1; df <= 1; df++) {
      const a = f + df;
      if (a < 0 || a > 7) continue;
      for (let b = r + dir; b >= 0 && b < 8; b += dir) {
        const p = g[a][b];
        if (p && p.t === 'p' && p.c !== col) return false;
      }
    }
    return true;
  }
  function passedSet(g, col) {
    const s = new Set();
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const p = g[f][r];
      if (p && p.t === 'p' && p.c === col && isPassed(g, f, r, col)) s.add(f * 8 + r);
    }
    return s;
  }
  function material(ch, color) {
    let s = 0;
    ch.board().forEach(row => row.forEach(p => {
      if (p && p.type !== 'k') s += (p.color === color ? 1 : -1) * VAL[p.type];
    }));
    return s;
  }
  function minorMajorMaterial(g) {
    let s = 0;
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const p = g[f][r];
      if (p && p.t !== 'p' && p.t !== 'k') s += VAL[p.t];
    }
    return s;
  }

  function joinList(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + T('coach.join') + arr[arr.length - 1];
  }
  function pieceAt(t, sq) { return T('m.at', { piece: pn(t), sq }); }

  /* ------------------------------------------------------------------
     facts(): verified motifs of one move, strongest first
     ------------------------------------------------------------------ */
  function facts(fen, uci, info) {
    info = info || {};
    const ch0 = mk(fen);
    if (!ch0 || !uci) return [];
    const wasCheck = ch0.in_check();
    const g0 = toGrid(ch0);
    const ch1 = mk(fen);
    const mv = ch1.move(parseUci(uci));
    if (!mv) return [];
    const g1 = toGrid(ch1);
    const color = mv.color, opp = other(color);
    const [ff, fr] = parseSq(mv.from);
    const [tf, tr] = parseSq(mv.to);
    const out = [];
    const add = (k, p, w) => out.push({ k, p, w });
    const P = pn(mv.piece);
    const ply = info.ply || 30;
    const ahead = (info.evalMover || 0) >= 300;
    const castle = mv.flags.indexOf('k') >= 0 || mv.flags.indexOf('q') >= 0;
    const attNow = attacksFrom(g1, tf, tr);

    if (ch1.in_checkmate()) add('m.mate', {}, 100);
    if (mv.promotion) add('m.promote', { piece: pn(mv.promotion) }, 90);
    if (castle) add('m.castle', {}, 60);

    /* captures (verified by SEE) */
    if (mv.captured) {
      const capName = pn(mv.captured);
      const recap = Math.max(0, see(g1, tf, tr, opp));
      const net = VAL[mv.captured] - recap;
      const defended = attackersOf(g1, tf, tr, opp).length > 0;
      if (!defended) add('m.capFree', { piece: capName, sq: mv.to }, 70 + VAL[mv.captured]);
      else if (net > 0) add('m.capWin', { piece: capName, sq: mv.to }, 68 + VAL[mv.captured]);
      else if (net === 0) {
        add('m.capTrade', { mine: P, piece: capName, sq: mv.to }, 50);
        if (ahead && mv.captured !== 'p') add('m.simplify', {}, 51);
      } else add('m.capSac', { mine: P, piece: capName, sq: mv.to }, 72);
    }

    /* check / double check / discovered check */
    if (ch1.in_check() && !ch1.in_checkmate()) {
      const ks = kingSq(g1, opp);
      const checkers = ks ? attackersOf(g1, ks[0], ks[1], color) : [];
      if (checkers.length >= 2) add('m.doubleCheck', {}, 88);
      else {
        const chk = checkers[0];
        if (chk && !(chk.f === tf && chk.r === tr)) add('m.discoveredCheck', { piece: pn(chk.t), sq: sqName(chk.f, chk.r) }, 86);
        else add('m.check', { piece: P }, 55);
      }
    }

    /* discovered attack: another slider now hits a valuable piece because of this move */
    let disc = null;
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const s = g1[f][r];
        if (!s || s.c !== color || ['b', 'r', 'q'].indexOf(s.t) < 0 || (f === tf && r === tr)) continue;
        const before = new Set(attacksFrom(g0, f, r).map(x => x[0] * 8 + x[1]));
        attacksFrom(g1, f, r).forEach(([a, b]) => {
          if (before.has(a * 8 + b)) return;
          const tg = g1[a][b];
          if (!tg || tg.c !== opp || tg.t === 'k' || VAL[tg.t] < 3) return;
          if (see(g1, a, b, color) > 0 || VAL[tg.t] >= 5) {
            if (!disc || VAL[tg.t] > VAL[disc.tg.t]) disc = { s, f, r, tg, a, b };
          }
        });
      }
    }
    if (disc) add('m.discovered', { piece: pn(disc.s.t), sq: sqName(disc.f, disc.r), target: pn(disc.tg.t), tsq: sqName(disc.a, disc.b) }, 82);

    const forkerSafe = see(g1, tf, tr, opp) <= 0;

    /* fork */
    if (mv.piece !== 'k' && forkerSafe) {
      const worth = [];
      attNow.forEach(([a, b]) => {
        const tg = g1[a][b];
        if (!tg || tg.c !== opp) return;
        if (tg.t === 'k') { worth.push({ t: 'k', sq: '' }); return; }
        if (VAL[tg.t] >= 3 && (see(g1, a, b, color) > 0 || VAL[tg.t] > VAL[mv.piece])) worth.push({ t: tg.t, sq: sqName(a, b) });
      });
      if (worth.length >= 2) {
        const names = worth.map(t => (t.t === 'k' ? pn('k') : pieceAt(t.t, t.sq)));
        add('m.fork', { targets: joinList(names) }, 84);
      }
    }

    /* pin / skewer by the moved slider */
    if (['b', 'r', 'q'].indexOf(mv.piece) >= 0 && forkerSafe) {
      const dirs = mv.piece === 'b' ? DIAG : mv.piece === 'r' ? ORTH : DIAG.concat(ORTH);
      dirs.forEach(([df, dr]) => {
        let a = tf + df, b = tr + dr, A = null;
        while (inb(a, b)) {
          const p = g1[a][b];
          if (p) {
            if (p.c === color) break;
            if (!A) A = { p, a, b };
            else {
              const B = { p, a, b };
              if (A.p.t !== 'k' && (B.p.t === 'k' || VAL[B.p.t] > VAL[A.p.t])) {
                add(B.p.t === 'k' ? 'm.pinKing' : 'm.pin', { pinned: pn(A.p.t), psq: sqName(A.a, A.b), behind: pn(B.p.t), bsq: sqName(B.a, B.b) }, 78);
              } else if (B.p.t !== 'k' && VAL[B.p.t] >= 3 && VAL[A.p.t] > VAL[B.p.t]) {
                add('m.skewer', { front: pn(A.p.t), fsq: sqName(A.a, A.b), behind: pn(B.p.t), bsq: sqName(B.a, B.b) }, 76);
              }
              break;
            }
          }
          a += df; b += dr;
        }
      });
    }

    /* new threats made by the moved piece */
    const oldAtt = new Set(attacksFrom(g0, ff, fr).map(x => x[0] * 8 + x[1]));
    attNow.forEach(([a, b]) => {
      const tg = g1[a][b];
      if (!tg || tg.c !== opp || tg.t === 'k' || oldAtt.has(a * 8 + b)) return;
      const s = see(g1, a, b, color);
      const sq = sqName(a, b);
      if (s > 0 && VAL[tg.t] >= 3) add('m.threatWin', { target: pn(tg.t), tsq: sq }, 66 + VAL[tg.t]);
      else if (s > 0 && tg.t === 'p') add('m.threat', { target: pn('p'), tsq: sq }, 52);
      else if (tg.t === 'p' && mv.piece !== 'p' && attackersOf(g1, a, b, color).length >= attackersOf(g1, a, b, opp).length) add('m.threat', { target: pn('p'), tsq: sq }, 44);
      else if (VAL[tg.t] > VAL[mv.piece] && forkerSafe) add('m.threat', { target: pn(tg.t), tsq: sq }, 46);
    });

    /* rescue / defence of threatened own pieces (threat verified by SEE before the move) */
    const T0 = threatsOf(g0, color);
    const T1set = new Set(threatsOf(g1, color).map(x => x.f * 8 + x.r));
    T0.forEach(x => {
      if (x.f === ff && x.r === fr) {
        if (see(g1, tf, tr, opp) <= 0) add('m.rescue', { piece: P, sq: mv.to }, 72);
        return;
      }
      if (T1set.has(x.f * 8 + x.r)) return;
      const sq = sqName(x.f, x.r);
      const defends = attNow.some(([a, b]) => a === x.f && b === x.r);
      const pawn = x.t === 'p';
      if (defends) add('m.defend', { piece: pn(x.t), sq }, pawn ? 54 : 74);
      else add('m.relieve', { piece: pn(x.t), sq }, pawn ? 50 : 62);
    });

    /* files, ranks, diagonals */
    if ((mv.piece === 'r' || mv.piece === 'q') && ff !== tf && (mv.piece === 'r' || ply >= 14)) {
      if (pawnsOnFile(g1, tf, color) === 0) {
        const open = pawnsOnFile(g1, tf) === 0;
        add('m.rookFile', { piece: P, file: FILES[tf], state: T(open ? 'm.stateOpen' : 'm.stateHalf') }, open ? 58 : 52);
      }
    }
    if ((mv.piece === 'r' || mv.piece === 'q') && rel(color, tr) === 6 && rel(color, fr) !== 6) {
      let target = false;
      for (let f = 0; f < 8; f++) { const p = g1[f][tr]; if (p && p.c === opp && (p.t === 'p' || p.t === 'k')) target = true; }
      if (target) add('m.seventh', { piece: P, rank: tr + 1 }, 58);
    }
    [ff, tf].filter((f, i, arr) => arr.indexOf(f) === i).forEach(f => {
      if (mv.piece === 'p' && ff !== tf && pawnsOnFile(g0, f) > 0 && pawnsOnFile(g1, f) === 0) {
        let heavy = null;
        for (let r = 0; r < 8; r++) { const p = g1[f][r]; if (p && p.c === color && (p.t === 'r' || p.t === 'q')) heavy = p; }
        if (heavy) add('m.openFileRook', { file: FILES[f], piece: pn(heavy.t) }, 64);
        else add('m.openFile', { file: FILES[f] }, 46);
      }
    });
    if (mv.piece === 'b' || mv.piece === 'q') {
      const diagId = (f, r) => (f === r ? 1 : (f + r === 7 ? 2 : 0));
      const id = diagId(tf, tr);
      if (id > 0 && diagId(ff, fr) !== id) {
        const n = attNow.filter(([a, b]) => diagId(a, b) === id).length;
        if (n >= 4) add('m.longDiag', { diag: id === 1 ? 'a1\u2013h8' : 'a8\u2013h1' }, 57);
      }
    }

    /* passed pawns */
    const pb = passedSet(g0, color), pa = passedSet(g1, color);
    let newly = null;
    pa.forEach(k => {
      const had = (mv.piece === 'p' && k === tf * 8 + tr) ? pb.has(ff * 8 + fr) : pb.has(k);
      if (!had) {
        const f = Math.floor(k / 8), r = k % 8;
        if (!newly || rel(color, r) > rel(color, newly.r)) newly = { f, r };
      }
    });
    if (newly) add('m.passed', { sq: sqName(newly.f, newly.r) }, 66);
    else if (mv.piece === 'p' && pa.has(tf * 8 + tr) && rel(color, tr) >= 4) add('m.passedPush', { sq: mv.to, n: 7 - rel(color, tr) }, 60);

    /* centre */
    if (ply <= 40) {
      const CS = [[3, 3], [4, 3], [3, 4], [4, 4]];
      const inCentre = CS.some(([a, b]) => a === tf && b === tr);
      if (inCentre && (mv.piece === 'p' || mv.piece === 'n' || mv.piece === 'b')) add('m.centerOcc', { piece: P, sq: mv.to }, 52);
      else {
        const gained = CS.filter(([a, b]) => attackersOf(g1, a, b, color).length > attackersOf(g0, a, b, color).length).map(([a, b]) => sqName(a, b));
        if (gained.length) add('m.center', { squares: gained.join(', ') }, 46);
      }
    }
    if (ply <= 24 && (mv.piece === 'n' || mv.piece === 'b') && rel(color, fr) === 0) add('m.develop', { piece: P, sq: mv.to }, 44);

    /* knight outpost */
    if (mv.piece === 'n' && rel(color, tr) >= 4 && attackersOf(g1, tf, tr, color).some(x => x.t === 'p')) {
      let chased = false;
      [-1, 1].forEach(d => {
        const a = tf + d;
        if (a < 0 || a > 7) return;
        for (let b = 0; b < 8; b++) {
          const p = g1[a][b];
          if (p && p.t === 'p' && p.c === opp && (color === 'w' ? b > tr : b < tr)) chased = true;
        }
      });
      if (!chased) add('m.outpost', { piece: P, sq: mv.to }, 56);
    }

    /* king */
    if (wasCheck && !mv.captured) add('m.escape', {}, 50);
    if (mv.piece === 'k' && !castle && !wasCheck && minorMajorMaterial(g1) <= 14) add('m.kingActive', { sq: mv.to }, 46);

    /* soft fallbacks (only used when nothing stronger exists) */
    const ek = kingSq(g1, opp);
    if (ek && mv.piece !== 'k' && mv.piece !== 'p') {
      const near = (list) => list.filter(([a, b]) => Math.max(Math.abs(a - ek[0]), Math.abs(b - ek[1])) <= 1).length;
      const nowN = near(attNow);
      if (nowN > near(attacksFrom(g0, ff, fr)) && nowN > 0) add('m.aimKing', { piece: P, sq: mv.to }, 36);
    }
    const mobGain = attNow.length - attacksFrom(g0, ff, fr).length;
    if (mv.piece !== 'k' && mv.piece !== 'p' && mobGain >= 2) add('m.activity', { piece: P, sq: mv.to, n: mobGain }, 30);

    out.sort((a, b) => b.w - a.w);
    return out;
  }

  function phrases(list, max, filter) {
    const seen = new Set();
    const res = [];
    for (const f of list) {
      if (seen.has(f.k) || (filter && !filter.has(f.k))) continue;
      seen.add(f.k);
      res.push(T(f.k, f.p));
      if (res.length >= max) break;
    }
    return res;
  }

  /* ------------------------------------------------------------------
     Stockfish PV → what actually happens to the material
     ------------------------------------------------------------------ */
  function outcome(fen, pv, color) {
    const ch = mk(fen);
    if (!ch || !pv || !pv.length) return null;
    const opp = other(color);
    const base = material(ch, color);
    const steps = [];
    for (let i = 0; i < pv.length && i < 6; i++) {
      const m = ch.move(parseUci(pv[i]));
      if (!m) break;
      steps.push({ m, bal: material(ch, color) });
    }
    if (!steps.length) return null;
    let idx = steps.length % 2 === 0 ? steps.length - 1 : (steps.length > 1 ? steps.length - 2 : 0);
    let delta = steps[idx].bal - base;
    if (steps.length === 1) {
      const m0 = steps[0].m;
      if (m0.captured && m0.color === opp) {
        const gAfter = toGrid(mk(fen));
        const [tf, tr] = parseSq(m0.to);
        delta = -Math.max(0, see(gAfter, tf, tr, opp));
        if (delta === 0) delta = 0;
      } else delta = 0;
    }
    let lost = null;
    let won = null;
    for (let i = 0; i <= idx; i++) {
      const m = steps[i].m;
      if (!m.captured) continue;
      if (m.color === opp && (!lost || VAL[m.captured] > VAL[lost.type])) lost = { type: m.captured, sq: m.to };
      if (m.color === color && (!won || VAL[m.captured] > VAL[won.type])) won = { type: m.captured, sq: m.to };
    }
    return { delta, lost, won, firstSan: steps[0].m.san };
  }

  function pvAfterPlayed(ctx) {
    const E = window.Engine;
    const b = ctx.before, a = ctx.after;
    if (b && b.lines && E) {
      const ml = b.lines.find(l => E.sameMove(l.uci, ctx.uci));
      if (ml && ml.pv && ml.pv.length > 1) return ml.pv.slice(1);
    }
    if (a && a.lines && a.lines[0] && a.lines[0].pv && a.lines[0].pv.length) return a.lines[0].pv;
    return a && a.bestUci ? [a.bestUci] : [];
  }

  /* ------------------------------------------------------------------
     Sentences
     ------------------------------------------------------------------ */
  function explainPlayed(ctx, c) {
    const E = window.Engine;
    const sign = ctx.color === 'w' ? 1 : -1;
    const before = ctx.before || {}, after = ctx.after || {};
    const chA = mk(ctx.fenBefore);
    const mv = chA && chA.move(parseUci(ctx.uci));
    const fenAfter = mv ? chA.fen() : null;
    const pv = pvAfterPlayed(ctx);
    const replyUci = pv[0] || after.bestUci || null;
    let replySan = '';
    if (fenAfter && replyUci) {
      const t = mk(fenAfter);
      const rm = t && t.move(parseUci(replyUci));
      if (rm) replySan = rm.san;
    }

    if (after.mate != null && after.mate * sign < 0 && !(before.mate != null && before.mate * sign < 0)) {
      return { key: 'r.allowsMate', params: { n: Math.abs(after.mate), reply: replySan } };
    }
    if (before.mate != null && before.mate * sign > 0) {
      const mCount = Math.abs(before.mate);
      const bestSan = E.describeMove(ctx.fenBefore, before.bestUci);
      if (!(after.mate != null && after.mate * sign > 0)) {
        if (mCount === 1) return { key: 'r.missedMate1', params: { best: bestSan }, noDrop: true };
        return { key: 'r.missedMate', params: { n: mCount }, noDrop: true };
      }
      if (Math.abs(after.mate) > mCount) {
        return { key: mCount === 1 ? 'r.missedMate1' : 'r.delayedMate', params: { best: bestSan }, noDrop: true };
      }
    }

    const oc = fenAfter ? outcome(fenAfter, pv, ctx.color) : null;
    if (oc && oc.delta <= -1 && oc.lost) {
      return { key: 'r.tacticalLoss', params: { reply: replySan || oc.firstSan, piece: pn(oc.lost.type), square: oc.lost.sq } };
    }

    if (fenAfter && replyUci) {
      const fl = facts(fenAfter, replyUci, { ply: (ctx.ply || 30) + 1, evalMover: 0 });
      const ph = phrases(fl, 2, STRONG);
      if (ph.length) return { key: 'r.allowsMotif', params: { reply: replySan, motif: joinList(ph) } };
    }

    if (sign * c.evalAfter >= 300) return { key: 'r.stillWinning', params: {}, noDrop: true };
    return { key: 'r.evalDrop', params: { from: E.formatEval(c.evalBefore, before.mate), to: E.formatEval(c.evalAfter, after.mate) }, noDrop: true };
  }

  function explainBest(ctx) {
    const b = ctx.before;
    if (!b || !b.bestUci) return '';
    const sign = ctx.color === 'w' ? 1 : -1;
    const ch = mk(ctx.fenBefore);
    const m = ch && ch.move(parseUci(b.bestUci));
    if (!m) return '';
    const san = m.san;
    if (ch.in_checkmate() || (b.mate != null && b.mate * sign > 0 && Math.abs(b.mate) === 1)) {
      return T('b.bestMate', { move: san });
    }
    if (b.mate != null && b.mate * sign > 0) return T('b.bestMateIn', { move: san, n: Math.abs(b.mate) });

    const fl = facts(ctx.fenBefore, b.bestUci, { ply: ctx.ply, evalMover: sign * b.cpWhite });
    const ph = phrases(fl, 2);
    const hasCapture = fl.some(f => f.k.indexOf('m.cap') === 0);
    const pv = b.lines && b.lines[0] && b.lines[0].pv;
    if (!hasCapture && pv && pv.length > 1) {
      const oc = outcome(ctx.fenBefore, pv, ctx.color);
      // outcome() simulates from fenBefore with PV that starts with our move: delta/won are relative to fenBefore
      if (oc && oc.delta >= 1 && oc.won && ph.length < 3) ph.push(T('m.thenWin', { piece: pn(oc.won.type), sq: oc.won.sq }));
    }
    if (ph.length) return T('b.best', { move: san, why: joinList(ph) });
    return T('b.bestPlain', { move: san });
  }

  function positiveBody(ctx) {
    const sign = ctx.color === 'w' ? 1 : -1;
    const fl = facts(ctx.fenBefore, ctx.uci, { ply: ctx.ply, evalMover: sign * (ctx.after ? ctx.after.cpWhite : 0) });
    const ph = phrases(fl, 2);
    return ph.length ? ph : null;
  }

  function build(ctx, c) {
    const E = window.Engine;
    const label = I18N.classLabel(c.cls) + ' (' + I18N.CLASS_SYMBOL[c.cls] + '): ';
    const sign = ctx.color === 'w' ? 1 : -1;
    const evalStr = E.formatEval(c.evalAfter, ctx.after ? ctx.after.mate : null);
    const gain = ' ' + cap(T('coach.gain', { eval: evalStr })) + '.';

    if (c.cls === 'brilliant') {
      const info = mk(ctx.fenBefore);
      const m = info && info.move(parseUci(ctx.uci));
      const body = positiveBody(ctx);
      return label + T('r.brilliant', { piece: pn(m ? m.piece : 'n') }) + (body ? ' ' + cap(joinList(body)) + '.' : '') + gain;
    }
    if (c.cls === 'great') {
      const body = positiveBody(ctx);
      return label + T('r.great') + (body ? ' ' + cap(joinList(body)) + '.' : '') + gain;
    }
    if (c.cls === 'best') {
      const body = positiveBody(ctx);
      const text = c.isBest
        ? (body ? cap(joinList(body)) + '.' : T('r.best'))
        : T('p.altNote', { best: c.bestSan || '', purpose: body ? joinList(body) + '.' : T('r.good') });
      return label + text + gain;
    }
    if (c.cls === 'book') return label + T('r.book') + gain;

    if (c.cls === 'good') {
      const body = positiveBody(ctx);
      let text = body ? cap(joinList(body)) + '.' : T('r.good');
      if (!c.isBest && ctx.before && ctx.before.bestUci) text += ' ' + explainBest(ctx);
      return label + text;
    }

    const pr = explainPlayed(ctx, c);
    const reason = T(pr.key, pr.params);
    const dropPawns = (sign * (c.evalBefore - c.evalAfter)) / 100;
    const bigEval = Math.abs(c.evalBefore) >= 1500 || Math.abs(c.evalAfter) >= 1500;
    const reasonText = (pr.noDrop || bigEval)
      ? T('coach.reasonEnd', { reason })
      : T('coach.reasonDrop', { reason, drop: '-' + Math.max(0.1, dropPawns).toFixed(1) });
    const bestText = (!c.isBest && ctx.before && ctx.before.bestUci) ? ' ' + explainBest(ctx) : '';
    return label + reasonText + bestText;
  }

  function comment(ctx, c) {
    if (!ctx || !c) return '';
    try {
      return build(ctx, c);
    } catch (e) {
      console.error('[Commentary]', e);
      return I18N.classLabel(c.cls) + ' (' + I18N.CLASS_SYMBOL[c.cls] + '): ' + T('r.generic');
    }
  }

  window.Commentary = { comment, facts, see, outcome, explainBest, explainPlayed };
})();
