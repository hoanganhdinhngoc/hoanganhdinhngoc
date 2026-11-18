/* =====================================================================
   Standard Chess & Tactical Analysis System — app.js
   Global: App — main controller (menu, modals, board, drag-and-drop,
   0.2s piece animation, game flow, collapsible analysis, review,
   puzzles, archive, settings, i18n re-rendering).
   Depends on: Chess (chess.js 0.10.3), I18N, YoRHaAudio, YStorage, Bots,
               PUZZLES / PUZZLE_CATEGORIES, Engine
   ===================================================================== */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const FILES = 'abcdefgh';
  const T = (k, p) => I18N.t(k, p);
  const sideName = (c) => T(c === 'w' ? 'ui.whiteSide' : 'ui.blackSide');
  const PIECE_GLYPH = { p: '♟\uFE0E', n: '♞\uFE0E', b: '♝\uFE0E', r: '♜\uFE0E', q: '♛\uFE0E', k: '♚\uFE0E' };
  const ARROW_COLORS = { cyan: '#2B8C84', green: '#4E7A45', red: '#B83A2D', orange: '#C9772B' };
  const CLS_COLORS = {
    brilliant: '#2B8C84', best: '#4E7A45', great: '#4A6A8A', book: '#8A6E4B', good: '#6E7350',
    inaccuracy: '#B88A2D', mistake: '#C9772B', blunder: '#B83A2D'
  };

  /* ------------------------------------------------------------------
     Chess Piece SVG Set (viewBox 0 0 45 45)
     ------------------------------------------------------------------ */
  const PIECE_PATHS = {
    p: '<circle cx="22.5" cy="12" r="5.5"/><path d="M18 18 L27 18 L25.5 22 L19.5 22 Z"/><path d="M19.5 22 L25.5 22 L29.5 34 L15.5 34 Z"/><rect x="12" y="34" width="21" height="5"/>',
    r: '<path d="M12 17 L12 8 L16.5 8 L16.5 11.5 L20.5 11.5 L20.5 8 L24.5 8 L24.5 11.5 L28.5 11.5 L28.5 8 L33 8 L33 17 Z"/><path d="M14.5 17 L30.5 17 L31.5 34 L13.5 34 Z"/><rect x="11" y="34" width="23" height="5"/><path class="d" d="M15 22 L30 22 M15 29 L30.5 29" fill="none"/>',
    n: '<path d="M13 34 L17 26 L22.5 22 L21.5 19.5 L15 24.5 L11 22.5 L11 18.5 L18 11 L18 6.5 L21 9 L24 6.5 L31 13.5 L33.5 22 L31.5 34 Z"/><rect x="11" y="34" width="23" height="5"/><rect class="dfill" x="18.5" y="13.5" width="2.5" height="2.5"/><path class="d" d="M26 12 L29.5 22.5 L28 34" fill="none"/>',
    b: '<circle cx="22.5" cy="5.5" r="2.3"/><path d="M22.5 8 L29 15.5 L26 22 L19 22 L16 15.5 Z"/><path d="M19 22 L26 22 L29.5 34 L15.5 34 Z"/><rect x="11" y="34" width="23" height="5"/><path class="d" d="M24.8 11.5 L21 17.5 M18 27 L27 27" fill="none"/>',
    q: '<path d="M14 34 L10.5 14.5 L17 24.5 L16.5 10.5 L21 23 L22.5 8.5 L24 23 L28.5 10.5 L28 24.5 L34.5 14.5 L31 34 Z"/><circle cx="10.5" cy="13" r="2"/><circle cx="16.5" cy="9" r="2"/><circle cx="22.5" cy="7" r="2"/><circle cx="28.5" cy="9" r="2"/><circle cx="34.5" cy="13" r="2"/><rect x="11" y="34" width="23" height="5"/><path class="d" d="M14.5 29 L30.5 29" fill="none"/>',
    k: '<rect x="21" y="3" width="3" height="12"/><rect x="17.5" y="6.5" width="10" height="3"/><path d="M14 34 L12 21 L22.5 16 L33 21 L31 34 Z"/><rect x="11" y="34" width="23" height="5"/><path class="d" d="M13.5 27 L31.5 27 M22.5 16 L22.5 34" fill="none"/>'
  };
  function pieceSVG(color, type) {
    const fill = color === 'w' ? '#EFECE6' : '#3B3831';
    const stroke = color === 'w' ? '#3B3831' : '#CEC8B0';
    return '<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><style>.d{stroke:' + stroke + ';stroke-width:1.2}.dfill{fill:' + stroke + ';stroke:none}</style>' +
      '<g fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5" stroke-linejoin="miter">' + PIECE_PATHS[type] + '</g></svg>';
  }

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  const S = {
    view: 'menu',            // 'menu' | 'game'
    mode: 'idle',            // 'idle' | 'bot' | 'pvp' | 'puzzle' | 'review'
    chess: new Chess(),
    startFen: Engine.START_FEN,
    orientation: 'w',
    playerColor: 'w',
    bot: null,
    white: null, black: null,
    history: [],
    liveEval: false,
    timeControl: 'none',
    clock: { enabled: false, w: 0, b: 0, inc: 0, last: 0, timer: null },
    paused: false,
    gameOver: false, result: null, termination: null,
    selected: null, legal: [],
    arrows: [],
    viewFen: null,           // when set, board shows this FEN (preview / review)
    coach: { entry: null, optimalShown: false },
    review: { active: false, index: 0, fens: [], ready: false, token: 0, summary: null },
    puzzle: null,
    moveToken: 0,
    matchId: null,
    matchTimestamp: null,
    setup: { mode: 'bot', botId: 'cadet', color: 'w' },
    statusFn: null, statusAlert: false,
    coachFn: null,
    goFn: null,
    botLineFn: null, lastBotMood: null,
    puzzleFilter: 'all',
    pendingAnims: []         // [{ from, to }] queued for 0.2s slide animation
  };

  const els = {};
  let squares = {};
  let drag = null;
  let promoResolve = null;
  let confirmResolve = null;
  let pauseHoldRaf = null;
  let pauseHoldStart = 0;

  /* ------------------------------------------------------------------
     Utils & Screen Navigation
     ------------------------------------------------------------------ */
  let toastTimer = null;
  function toast(msg, alert) {
    const t = els.toast;
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('alert', !!alert);
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  function sound(name) { try { YoRHaAudio.play(name); } catch (e) { /* */ } }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function askConfirm(msg) {
    return new Promise(resolve => {
      if (confirmResolve) {
        const prev = confirmResolve;
        confirmResolve = null;
        prev(false);
      }
      confirmResolve = resolve;
      const txt = $('confirm-text');
      if (txt) txt.textContent = msg;
      const yesBtn = $('btn-confirm-yes');
      const noBtn = $('btn-confirm-no');
      const finish = (ans) => {
        const r = confirmResolve;
        confirmResolve = null;
        closeModal('modal-confirm');
        if (r) r(ans);
      };
      if (yesBtn) yesBtn.onclick = () => { sound('confirm'); finish(true); };
      if (noBtn) noBtn.onclick = () => { sound('cancel'); finish(false); };
      openModal('modal-confirm');
    });
  }

  function isMobilePauseMode() {
    return window.matchMedia('(max-width: 1080px), (hover: none) and (pointer: coarse)').matches;
  }

  function openMobileDrawer() {
    if (els.mobileDrawer) els.mobileDrawer.classList.add('open');
    if (els.mobileDrawerBackdrop) els.mobileDrawerBackdrop.classList.add('open');
    sound('open');
  }

  function closeMobileDrawer() {
    if (els.mobileDrawer) els.mobileDrawer.classList.remove('open');
    if (els.mobileDrawerBackdrop) els.mobileDrawerBackdrop.classList.remove('open');
  }

  function checkPausedBlock() {
    if (!S.paused) return false;
    toast(T('alert.pausedNA'), true);
    sound('error');
    return true;
  }

  function cancelPauseHold() {
    if (pauseHoldRaf) {
      cancelAnimationFrame(pauseHoldRaf);
      pauseHoldRaf = null;
    }
    pauseHoldStart = 0;
    if (els.pauseHoldFill) els.pauseHoldFill.style.width = '0%';
  }

  function clearPauseCover() {
    cancelPauseHold();
    S.paused = false;
    if (els.pauseCover) {
      els.pauseCover.classList.remove('active');
      els.pauseCover.setAttribute('aria-hidden', 'true');
    }
  }

  function pauseGame() {
    if (S.paused || S.gameOver || S.review.active || ['bot', 'pvp', 'puzzle'].indexOf(S.mode) < 0) return;
    if (drag) onPointerCancel();
    if (S.clock.enabled && S.clock.timer) {
      const now = Date.now();
      const turn = S.chess.turn();
      S.clock[turn] = Math.max(0, S.clock[turn] - (now - S.clock.last));
      S.clock.last = now;
    }
    stopClock();
    S.paused = true;
    cancelPauseHold();
    if (els.pauseHoldText) {
      els.pauseHoldText.textContent = T(isMobilePauseMode() ? 'pause.hold' : 'pause.click');
    }
    if (els.pauseCover) {
      els.pauseCover.classList.add('active');
      els.pauseCover.setAttribute('aria-hidden', 'false');
    }
    renderPlayers();
    sound('select');
  }

  function resumeGame() {
    if (!S.paused) return;
    clearPauseCover();
    sound('confirm');
    startClock();
    renderPlayers();
  }

  function startPauseHold(e) {
    if (!S.paused) return;
    if (e && e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (!isMobilePauseMode()) {
      if (e) e.preventDefault();
      resumeGame();
      return;
    }
    if (e) e.preventDefault();
    cancelPauseHold();
    pauseHoldStart = performance.now();
    const tick = (now) => {
      if (!S.paused || !pauseHoldStart) return;
      const elapsed = now - pauseHoldStart;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      if (els.pauseHoldFill) els.pauseHoldFill.style.width = pct.toFixed(1) + '%';
      if (elapsed >= 3000) {
        resumeGame();
        return;
      }
      pauseHoldRaf = requestAnimationFrame(tick);
    };
    pauseHoldRaf = requestAnimationFrame(tick);
  }

  async function showMenuScreen(force) {
    if (!force && S.history.length && !S.gameOver && ['bot', 'pvp'].indexOf(S.mode) >= 0) {
      if (!(await askConfirm(T('alert.confirmNew')))) return false;
    }
    closeMobileDrawer();
    clearPauseCover();
    S.moveToken++;
    S.review.token++;
    if (S.review.active) exitReview();
    stopClock();
    Engine.cancelAnalysis();
    YoRHaAudio.stopBgm();
    S.view = 'menu';
    document.body.dataset.view = 'menu';
    els.screenMenu.classList.remove('hidden');
    els.screenGame.classList.add('hidden');
    sound('cancel');
    return true;
  }

  function showGameScreen() {
    closeMobileDrawer();
    S.view = 'game';
    document.body.dataset.view = 'game';
    els.screenMenu.classList.add('hidden');
    els.screenGame.classList.remove('hidden');
    YoRHaAudio.startBgm();
    syncAnalysisVisibility();
  }

  function syncBoardControlsPlacement() {
    const ctrl = els.boardControls;
    const colCenter = els.colCenter;
    const sideBody = els.sideBoxBody;
    if (!ctrl || !colCenter || !sideBody) return;
    if (S.review.active && window.innerWidth <= 1080) {
      const fileAct = sideBody.querySelector('.file-actions');
      if (ctrl.parentNode !== sideBody) sideBody.insertBefore(ctrl, fileAct || null);
    } else if (ctrl.parentNode !== colCenter) {
      colCenter.appendChild(ctrl);
    }
  }

  function syncAnalysisVisibility() {
    const showAnalysis = S.liveEval || S.review.active;
    document.body.dataset.liveEval = showAnalysis ? 'true' : 'false';
    document.body.dataset.mode = S.review.active ? 'review' : S.mode;
    if (els.evalBar) els.evalBar.classList.toggle('hidden', !showAnalysis);
    if (els.paneCoach) els.paneCoach.classList.toggle('hidden', !showAnalysis);
    if (els.reviewControlsWrap) els.reviewControlsWrap.classList.toggle('hidden', !S.review.active);
    if (els.paneBot) els.paneBot.classList.toggle('hidden', S.mode !== 'bot');
    if (els.panePuzzleActive) els.panePuzzleActive.classList.toggle('hidden', S.mode !== 'puzzle');
    if (els.coachSource) els.coachSource.classList.add('hidden');
    syncBoardControlsPlacement();
  }

  function fmtClock(ms) {
    if (!S.clock.enabled) return '∞';
    ms = Math.max(0, ms);
    const s = Math.ceil(ms / 1000);
    if (ms < 10000) return (ms / 1000).toFixed(1);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function playerLabel(p) {
    if (!p) return { name: '—', elo: '' };
    if (p.isBot) { const b = Bots.get(p.botId); return { name: I18N.pick(b.name), elo: b.elo }; }
    return { name: p.name, elo: p.elo };
  }
  function isHumanTurn() {
    const turn = S.chess.turn();
    if (S.mode === 'pvp') return true;
    if (S.mode === 'bot') return turn === S.playerColor;
    if (S.mode === 'puzzle') return S.puzzle && !S.puzzle.solved && !S.puzzle.busy && !S.puzzle.canonical && turn === S.puzzle.playerColor;
    return false;
  }
  function canInteract() {
    return !S.paused && ['bot', 'pvp', 'puzzle'].indexOf(S.mode) >= 0 && !S.gameOver && !S.viewFen && isHumanTurn() && !promoResolve;
  }
  function setStatus(fn, alert) { S.statusFn = fn; S.statusAlert = !!alert; renderStatus(); }
  function renderStatus() {
    if (!els.status) return;
    els.status.textContent = S.statusFn ? S.statusFn() : T('status.idle');
    els.status.classList.toggle('alert', S.statusAlert);
  }

  /* ------------------------------------------------------------------
     Board construction, rendering & 0.2s Piece Slide Animation
     ------------------------------------------------------------------ */
  function buildBoard() {
    const board = els.board;
    board.innerHTML = '';
    squares = {};
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const file = S.orientation === 'w' ? col : 7 - col;
        const rank = S.orientation === 'w' ? 7 - row : row;
        const sq = FILES[file] + (rank + 1);
        const d = document.createElement('div');
        d.className = 'sq ' + ((file + rank) % 2 === 1 ? 'light' : 'dark');
        d.dataset.sq = sq;
        if (col === 0) { const c = document.createElement('span'); c.className = 'coord rank'; c.textContent = rank + 1; d.appendChild(c); }
        if (row === 7) { const c = document.createElement('span'); c.className = 'coord file'; c.textContent = FILES[file]; d.appendChild(c); }
        const p = document.createElement('div'); p.className = 'piece'; d.appendChild(p);
        d._piece = p; d._code = '';
        board.appendChild(d);
        squares[sq] = d;
      }
    }
    if (els.evalBar) els.evalBar.classList.toggle('flipped', S.orientation === 'b');
  }

  function queueMoveAnimation(m) {
    if (!m || !m.from || !m.to) return;
    const list = [{ from: m.from, to: m.to }];
    // Also animate rook during castling
    if (m.flags && m.flags.indexOf('k') >= 0) {
      const rank = m.color === 'w' ? '1' : '8';
      list.push({ from: 'h' + rank, to: 'f' + rank });
    } else if (m.flags && m.flags.indexOf('q') >= 0) {
      const rank = m.color === 'w' ? '1' : '8';
      list.push({ from: 'a' + rank, to: 'd' + rank });
    }
    S.pendingAnims = list;
  }

  function runPendingAnimations() {
    if (!S.pendingAnims || !S.pendingAnims.length) return;
    const anims = S.pendingAnims.slice();
    S.pendingAnims = [];
    anims.forEach(a => {
      const fromSq = squares[a.from];
      const toSq = squares[a.to];
      if (!fromSq || !toSq || !toSq._piece) return;
      const rFrom = fromSq.getBoundingClientRect();
      const rTo = toSq.getBoundingClientRect();
      if (!rFrom.width || !rTo.width) return;
      const dx = rFrom.left - rTo.left;
      const dy = rFrom.top - rTo.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const pEl = toSq._piece;
      pEl.style.transition = 'none';
      pEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      pEl.style.zIndex = '18';
      void pEl.offsetWidth; // force reflow before 0.2s transition
      pEl.style.transition = 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)';
      pEl.style.transform = 'translate(0px, 0px)';
      setTimeout(() => {
        if (pEl) {
          pEl.style.transition = '';
          pEl.style.transform = '';
          pEl.style.zIndex = '';
        }
      }, 215);
    });
  }

  function currentFen() { return S.viewFen || S.chess.fen(); }

  function render() {
    const fen = currentFen();
    const c = S.viewFen ? new Chess(fen) : S.chess;
    const board = c.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = FILES[f] + (8 - r);
        const d = squares[sq]; if (!d) continue;
        const p = board[r][f];
        const code = p ? p.color + p.type : '';
        if (d._code !== code) { d._piece.innerHTML = p ? pieceSVG(p.color, p.type) : ''; d._code = code; }
        d.classList.remove('last', 'selected', 'legal', 'capture', 'check', 'hint-sq', 'drag-over');
        const mark = d.querySelector('.cls-mark'); if (mark) mark.remove();
      }
    }
    // last move
    const last = lastMoveForDisplay();
    if (last) {
      if (squares[last.from]) squares[last.from].classList.add('last');
      if (squares[last.to]) squares[last.to].classList.add('last');
    }
    // classification mark (only when Analysis is ON or in Review)
    if (last && last.cls && squares[last.to] && (S.liveEval || S.review.active)) {
      const m = document.createElement('span');
      m.className = 'cls-mark';
      m.style.background = CLS_COLORS[last.cls];
      m.textContent = I18N.CLASS_SYMBOL[last.cls] === 'BOOK' ? 'B' : (I18N.CLASS_SYMBOL[last.cls] === 'GOOD' ? 'G' : I18N.CLASS_SYMBOL[last.cls]);
      squares[last.to].appendChild(m);
    }
    // check
    if (c.in_check()) {
      const turn = c.turn();
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (p && p.type === 'k' && p.color === turn) squares[FILES[f] + (8 - r)].classList.add('check');
      }
    }
    // selection
    if (S.selected && !S.viewFen && squares[S.selected]) {
      squares[S.selected].classList.add('selected');
      const settings = YStorage.getSettings();
      if (settings.showLegal) {
        S.legal.forEach(m => {
          const d = squares[m.to];
          if (d) { d.classList.add('legal'); if (m.captured) d.classList.add('capture'); }
        });
      }
    }
    if (S.puzzle && S.puzzle.hintSq && squares[S.puzzle.hintSq]) squares[S.puzzle.hintSq].classList.add('hint-sq');
    runPendingAnimations();
    renderArrows();
    renderPlayers();
  }

  function lastMoveForDisplay() {
    if (S.review.active) {
      const i = S.review.index;
      if (i <= 0) return null;
      const h = S.history[i - 1];
      return { from: h.uci.slice(0, 2), to: h.uci.slice(2, 4), cls: h.cls ? h.cls.cls : null };
    }
    if (S.viewFen) return null;
    const h = S.history[S.history.length - 1];
    if (!h) return null;
    return { from: h.uci.slice(0, 2), to: h.uci.slice(2, 4), cls: (S.liveEval && h.cls) ? h.cls.cls : null };
  }

  /* ---------- arrows ---------- */
  function sqCenter(sq) {
    const file = FILES.indexOf(sq[0]); const rank = parseInt(sq[1], 10) - 1;
    const col = S.orientation === 'w' ? file : 7 - file;
    const row = S.orientation === 'w' ? 7 - rank : rank;
    return { x: col * 100 + 50, y: row * 100 + 50 };
  }
  function drawArrows(list) { S.arrows = list || []; renderArrows(); }
  function clearArrows() { S.arrows = []; renderArrows(); }
  function renderArrows() {
    const g = els.arrowGroup;
    if (!g) return;
    g.innerHTML = '';
    S.arrows.forEach(a => {
      if (!a || !a.from || !a.to || a.from === a.to) return;
      const p1 = sqCenter(a.from), p2 = sqCenter(a.to);
      const dx = p2.x - p1.x, dy = p2.y - p1.y; const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = p1.x + ux * 18, sy = p1.y + uy * 18;
      const ex = p2.x - ux * 34, ey = p2.y - uy * 34;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', sx); line.setAttribute('y1', sy); line.setAttribute('x2', ex); line.setAttribute('y2', ey);
      line.setAttribute('stroke', ARROW_COLORS[a.color] || ARROW_COLORS.cyan);
      line.setAttribute('stroke-width', a.width || 15);
      line.setAttribute('stroke-opacity', a.opacity || 0.88);
      line.setAttribute('marker-end', 'url(#ah-' + (a.color || 'cyan') + ')');
      line.setAttribute('class', 'arrow-anim');
      g.appendChild(line);
    });
  }

  /* ---------- players / clocks / captured ---------- */
  function renderPlayers() {
    const topColor = S.orientation === 'w' ? 'b' : 'w';
    const botColor = S.orientation;
    fillBar(els.barTop, topColor);
    fillBar(els.barBottom, botColor);
  }
  function fillBar(bar, color) {
    if (!bar) return;
    bar.classList.toggle('side-w', color === 'w');
    bar.classList.toggle('side-b', color === 'b');
    const p = color === 'w' ? S.white : S.black;
    const lbl = playerLabel(p);
    const pc = bar.querySelector('.pcolor');
    if (pc) {
      pc.className = 'pcolor ' + color;
      pc.innerHTML = pieceSVG(color, 'k');
    }
    bar.querySelector('.pname').textContent = lbl.name;
    bar.querySelector('.pelo').textContent = lbl.elo ? '(' + lbl.elo + ')' : '';
    const clk = bar.querySelector('.pclock');
    clk.textContent = S.clock.enabled ? fmtClock(S.clock[color]) : '∞';
    clk.classList.toggle('low', S.clock.enabled && S.clock[color] < 20000);
    const inMatch = !S.gameOver && !S.review.active && ['bot', 'pvp', 'puzzle'].indexOf(S.mode) >= 0;
    const isOwnClock = inMatch && (
      S.mode === 'pvp' ||
      (S.mode === 'bot' && color === S.playerColor) ||
      (S.mode === 'puzzle' && S.puzzle && color === S.puzzle.playerColor) ||
      bar === els.barBottom
    );
    clk.classList.toggle('pausable', isOwnClock);
    clk.onclick = isOwnClock ? () => {
      if (S.paused && !isMobilePauseMode()) resumeGame();
      else pauseGame();
    } : null;
    const active = inMatch && S.chess.turn() === color;
    bar.classList.toggle('active-turn', active);
    // captured material (pieces this side has taken)
    const fen = currentFen().split(' ')[0];
    const count = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    for (const ch of fen) {
      if (/[pnbrq]/.test(ch)) count.b[ch]++;
      else if (/[PNBRQ]/.test(ch)) count.w[ch.toLowerCase()]++;
    }
    const init = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const opp = color === 'w' ? 'b' : 'w';
    let html = '', mat = 0;
    ['q', 'r', 'b', 'n', 'p'].forEach(t => {
      const taken = Math.max(0, init[t] - count[opp][t]);
      html += PIECE_GLYPH[t].repeat(taken);
      mat += (count[color][t] - count[opp][t]) * Engine.VAL[t];
    });
    if (mat > 0) html += '<span class="adv">+' + mat + '</span>';
    bar.querySelector('.pcaptured').innerHTML = html;
  }

  /* ---------- eval bar ---------- */
  function updateEvalBar(analysis) {
    if (!analysis || !els.evalFill || !els.evalText) return;
    const w = Engine.winPercent(analysis.cpWhite);
    els.evalFill.style.height = w.toFixed(1) + '%';
    els.evalText.textContent = Engine.formatEval(analysis.cpWhite, analysis.mate);
  }
  function resetEvalBar() {
    if (!els.evalFill || !els.evalText) return;
    els.evalFill.style.height = '50%';
    els.evalText.textContent = '0.0';
  }

  /* ------------------------------------------------------------------
     Input: Desktop Drag-and-Drop (Chess.com style) + Touch Support
     ------------------------------------------------------------------ */
  function squareFromPoint(x, y) {
    const r = els.board.getBoundingClientRect();
    if (x < r.left || x >= r.right || y < r.top || y >= r.bottom) return null;
    const col = Math.floor((x - r.left) / r.width * 8);
    const row = Math.floor((y - r.top) / r.height * 8);
    const file = S.orientation === 'w' ? col : 7 - col;
    const rank = S.orientation === 'w' ? 7 - row : row;
    return FILES[file] + (rank + 1);
  }
  function select(sq) {
    S.selected = sq;
    S.legal = S.chess.moves({ square: sq, verbose: true });
    sound('select');
    render();
  }
  function deselect() { S.selected = null; S.legal = []; render(); }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    YoRHaAudio.init();
    if (S.viewFen && !S.review.active) { exitPreview(); return; }
    if (!canInteract()) return;
    const sq = squareFromPoint(e.clientX, e.clientY);
    if (!sq) return;
    e.preventDefault();

    // Only allow tap-to-move on touch devices; desktop mouse requires drag-and-drop
    if (e.pointerType !== 'mouse' && S.selected && S.legal.some(m => m.to === sq)) {
      attemptMove(S.selected, sq, true);
      return;
    }

    const p = S.chess.get(sq);
    if (p && p.color === S.chess.turn()) {
      const wasSelected = S.selected === sq;
      select(sq);
      drag = {
        from: sq,
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId,
        pointerType: e.pointerType,
        dragging: false,
        wasSelected,
        ghost: null
      };
      try { els.board.setPointerCapture(e.pointerId); } catch (x) { /* */ }
    } else if (S.selected) {
      deselect();
    }
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dist = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    if (!drag.dragging && dist > 3) {
      drag.dragging = true;
      const g = document.createElement('div');
      g.className = 'drag-ghost';
      const size = els.board.getBoundingClientRect().width / 8;
      g.style.width = size + 'px';
      g.style.height = size + 'px';
      const p = S.chess.get(drag.from);
      if (p) g.innerHTML = pieceSVG(p.color, p.type);
      document.body.appendChild(g);
      drag.ghost = g;
      if (squares[drag.from] && squares[drag.from]._piece) {
        squares[drag.from]._piece.classList.add('dragging-src');
      }
    }
    if (drag.dragging && drag.ghost) {
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      const over = squareFromPoint(e.clientX, e.clientY);
      Object.values(squares).forEach(d => d.classList.remove('drag-over'));
      if (over && squares[over]) squares[over].classList.add('drag-over');
    }
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    try { els.board.releasePointerCapture(e.pointerId); } catch (x) { /* */ }
    if (d.ghost) d.ghost.remove();
    if (squares[d.from] && squares[d.from]._piece) {
      squares[d.from]._piece.classList.remove('dragging-src');
    }
    Object.values(squares).forEach(s => s.classList.remove('drag-over'));

    if (d.dragging) {
      const to = squareFromPoint(e.clientX, e.clientY);
      const legalMoves = S.chess.moves({ square: d.from, verbose: true });
      if (to && to !== d.from && legalMoves.some(m => m.to === to)) {
        attemptMove(d.from, to, true);
      } else {
        render();
      }
    } else if (d.wasSelected) {
      deselect();
    }
  }

  function onPointerCancel() {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    if (squares[drag.from] && squares[drag.from]._piece) {
      squares[drag.from]._piece.classList.remove('dragging-src');
    }
    drag = null;
    render();
  }

  async function attemptMove(from, to, animate) {
    const legalFromSq = S.chess.moves({ square: from, verbose: true });
    const cands = legalFromSq.filter(m => m.from === from && m.to === to);
    if (!cands.length) { sound('error'); render(); return; }
    let promotion;
    if (cands.some(m => m.promotion)) {
      promotion = await askPromotion(S.chess.turn());
      if (!promotion) { deselect(); return; }
    }
    S.selected = null;
    S.legal = [];
    playerMove({ from, to, promotion }, animate !== false);
  }

  function askPromotion(color) {
    return new Promise(resolve => {
      promoResolve = resolve;
      const box = $('promo-choices');
      box.innerHTML = '';
      ['q', 'r', 'b', 'n'].forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = pieceSVG(color, t);
        b.title = I18N.pieceName(t);
        b.onclick = (ev) => {
          ev.stopPropagation();
          const r = promoResolve;
          promoResolve = null;
          closeModal('modal-promo');
          if (r) r(t);
        };
        box.appendChild(b);
      });
      openModal('modal-promo');
    });
  }

  /* ------------------------------------------------------------------
     Move execution
     ------------------------------------------------------------------ */
  function recordMove(m, fenBefore) {
    const entry = {
      ply: S.history.length + 1, san: m.san, uci: m.from + m.to + (m.promotion || ''),
      color: m.color, piece: m.piece, captured: m.captured || null, flags: m.flags,
      fenBefore, fenAfter: S.chess.fen(), cls: null, ctx: null
    };
    S.history.push(entry);
    return entry;
  }
  function moveSound(m) {
    if (S.chess.in_check()) sound('check');
    else if (m.promotion) sound('promote');
    else if (m.flags.indexOf('k') >= 0 || m.flags.indexOf('q') >= 0) sound('castle');
    else if (m.captured) sound('capture');
    else sound('move');
  }
  function applyIncrement(color) {
    if (!S.clock.enabled) return;
    S.clock[color] += S.clock.inc;
  }

  function playerMove(mv, animate) {
    const fenBefore = S.chess.fen();
    const m = S.chess.move(mv);
    if (!m) { sound('error'); toast(T('alert.illegal'), true); render(); return; }
    const entry = recordMove(m, fenBefore);
    applyIncrement(m.color);
    moveSound(m);
    clearArrows();
    S.coach.optimalShown = false;
    if (S.puzzle && S.puzzle.hintSq) S.puzzle.hintSq = null;
    if (animate !== false) queueMoveAnimation(m);
    render();
    renderMoveList();
    if (S.mode === 'puzzle') { puzzleOnMove(entry); return; }
    if (checkGameEnd()) return;
    startTurn();
    if (S.liveEval) coachEvaluate(entry);
  }

  function startTurn() {
    if (S.gameOver) return;
    const turn = S.chess.turn();
    if (S.mode === 'pvp') {
      const settings = YStorage.getSettings();
      if (settings.autoFlip && S.orientation !== turn) { S.orientation = turn; buildBoard(); render(); }
      setStatus(() => {
        if (S.chess.in_check()) return T('status.check') + ' ' + T('status.turnOf', { name: playerLabel(turn === 'w' ? S.white : S.black).name, color: sideName(turn) });
        return T('status.turnOf', { name: playerLabel(turn === 'w' ? S.white : S.black).name, color: sideName(turn) });
      }, S.chess.in_check());
      if (S.liveEval) prefetch();
    } else if (S.mode === 'bot') {
      if (turn === S.playerColor) {
        setStatus(() => (S.chess.in_check() ? T('status.check') + ' ' : '') + T('status.yourTurn', { color: sideName(turn) }), S.chess.in_check());
        if (S.liveEval) prefetch();
      } else {
        botMove();
      }
    }
    startClock();
  }

  async function prefetch() {
    const fen = S.chess.fen();
    const token = S.moveToken;
    const a = await Engine.analyze(fen, { multiPV: 3, tag: 'prefetch', priority: 'normal' });
    if (!a || token !== S.moveToken || S.chess.fen() !== fen) return;
    updateEvalBar(a);
    if (!S.coach.entry) {
      S.coachFn = null;
      els.coachEval.textContent = Engine.formatEval(a.cpWhite, a.mate);
    }
  }

  async function botMove() {
    const token = S.moveToken;
    const bot = S.bot;
    setStatus(() => T('status.botThinking', { name: I18N.pick(bot.name).toUpperCase() }));
    if (Math.random() < 0.12) botSay('thinking');
    const t0 = Date.now();
    const fen = S.chess.fen();
    let uci = null;
    try { uci = await Engine.getBotMove(fen, bot); } catch (e) { console.error(e); }
    const [dmin, dmax] = bot.thinkDelay || [300, 900];
    const wait = dmin + Math.random() * (dmax - dmin) - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
    while (S.paused && !S.gameOver && token === S.moveToken) { await sleep(100); }
    if (token !== S.moveToken || S.gameOver || S.mode !== 'bot' || S.chess.fen() !== fen) return;
    let m = uci ? S.chess.move(Engine.parseUci(uci)) : null;
    if (!m) {
      const legal = S.chess.moves({ verbose: true });
      if (!legal.length) return;
      m = S.chess.move(legal[Math.floor(Math.random() * legal.length)]);
    }
    recordMove(m, fen);
    applyIncrement(m.color);
    moveSound(m);
    queueMoveAnimation(m);
    render();
    renderMoveList();
    if (S.chess.in_check()) botSay('botCheck');
    else if (m.captured && Engine.VAL[m.captured] >= 3 && Math.random() < 0.6) botSay('botCapture');
    if (!S.coach.entry || S.coach.entry.color !== S.playerColor) {
      S.coachFn = () => T('coach.botMove', { name: I18N.pick(bot.name), move: m.san });
      renderCoachText();
    }
    if (checkGameEnd()) return;
    startTurn();
  }

  /* ------------------------------------------------------------------
     Game end
     ------------------------------------------------------------------ */
  function checkGameEnd() {
    const c = S.chess;
    if (c.in_checkmate()) { endGame(c.turn() === 'w' ? '0-1' : '1-0', 'checkmate'); return true; }
    if (c.in_stalemate()) { endGame('1/2-1/2', 'stalemate'); return true; }
    if (c.in_threefold_repetition()) { endGame('1/2-1/2', 'repetition'); return true; }
    if (c.insufficient_material()) { endGame('1/2-1/2', 'insufficient'); return true; }
    if (c.in_draw()) { endGame('1/2-1/2', 'fifty'); return true; }
    return false;
  }

  function endGame(result, termination) {
    S.gameOver = true; S.result = result; S.termination = termination;
    stopClock();
    S.moveToken++;
    sound('end');
    const winner = result === '1-0' ? 'w' : result === '0-1' ? 'b' : null;
    const nameOf = (c) => playerLabel(c === 'w' ? S.white : S.black).name.toUpperCase();
    setStatus(() => {
      if (termination === 'checkmate') return T('status.checkmate', { winner: nameOf(winner) });
      if (termination === 'timeout') return T('status.timeout', { winner: nameOf(winner) });
      if (termination === 'resign') return T('status.resigned', { winner: nameOf(winner), loser: nameOf(winner === 'w' ? 'b' : 'w') });
      return T('status.draw', { reason: T('draw.' + (termination || 'generic')) });
    }, true);
    if (S.mode === 'bot') {
      if (!winner) botSay('draw'); else botSay(winner === S.playerColor ? 'lose' : 'win');
    }
    renderPlayers();
    // auto-archive
    try { const rec = buildMatchRecord(); YStorage.saveMatch(rec); S.matchId = rec.id; renderArchive(); } catch (e) { console.warn(e); }
    S.goFn = () => {
      let title = T('go.over');
      if (S.mode === 'bot') title = !winner ? T('go.draw') : (winner === S.playerColor ? T('go.win') : T('go.lose'));
      else if (!winner) title = T('go.draw');
      return { title, text: T('go.text', { result: S.statusFn(), score: result }) };
    };
    renderGameOver();
    setTimeout(() => openModal('modal-gameover'), 450);
  }
  function renderGameOver() {
    if (!S.goFn) return;
    const g = S.goFn();
    $('go-title').textContent = g.title;
    $('go-text').textContent = g.text;
  }

  /* ------------------------------------------------------------------
     Clocks
     ------------------------------------------------------------------ */
  function setupClock(tc) {
    stopClock();
    S.timeControl = tc;
    if (!tc || tc === 'none') { S.clock = { enabled: false, w: 0, b: 0, inc: 0, last: 0, timer: null }; return; }
    const [min, inc] = tc.split('+').map(Number);
    S.clock = { enabled: true, w: min * 60000, b: min * 60000, inc: (inc || 0) * 1000, last: 0, timer: null };
  }
  function startClock() {
    if (!S.clock.enabled || S.gameOver || S.paused) return;
    if (S.history.length === 0) return; // clock starts after first move
    S.clock.last = Date.now();
    if (S.clock.timer) return;
    S.clock.timer = setInterval(tickClock, 200);
  }
  function stopClock() { if (S.clock.timer) { clearInterval(S.clock.timer); S.clock.timer = null; } }
  function tickClock() {
    if (S.gameOver || S.paused || !S.clock.enabled || S.review.active) { stopClock(); return; }
    const now = Date.now();
    const turn = S.chess.turn();
    S.clock[turn] -= now - S.clock.last;
    S.clock.last = now;
    if (S.clock[turn] <= 0) {
      S.clock[turn] = 0;
      renderPlayers();
      endGame(turn === 'w' ? '0-1' : '1-0', 'timeout');
      return;
    }
    if (S.clock[turn] < 10000 && Math.floor(S.clock[turn] / 1000) !== Math.floor((S.clock[turn] + 200) / 1000)) sound('tick');
    renderPlayers();
  }

  /* ------------------------------------------------------------------
     New game / takeback / resign
     ------------------------------------------------------------------ */
  function resetCommon() {
    S.moveToken++;
    S.review.token++;
    Engine.cancelAnalysis();
    stopClock();
    clearPauseCover();
    S.history = []; S.gameOver = false; S.result = null; S.termination = null;
    S.selected = null; S.legal = []; S.viewFen = null; S.arrows = [];
    S.pendingAnims = [];
    S.coach = { entry: null, optimalShown: false };
    S.review = { active: false, index: 0, fens: [], ready: false, token: S.review.token, summary: null };
    S.puzzle = null; S.matchId = null; S.matchTimestamp = new Date().toISOString();
    S.coachFn = null; S.goFn = null;
    els.reviewSummary.classList.add('hidden');
    els.evalGraph.classList.add('hidden');
    els.reviewComment.classList.add('hidden');
    els.reviewProgress.classList.add('hidden');
    if (els.reviewControlsWrap) els.reviewControlsWrap.classList.add('hidden');
    syncBoardControlsPlacement();
    resetCoach();
    resetEvalBar();
  }

  function openSetupModal(mode) {
    if (mode) S.setup.mode = mode;
    document.querySelectorAll('#mode-select .seg-btn').forEach(x => x.classList.toggle('active', x.dataset.mode === S.setup.mode));
    $('bot-setup').classList.toggle('hidden', S.setup.mode !== 'bot');
    $('pvp-setup').classList.toggle('hidden', S.setup.mode !== 'pvp');
    renderBotRoster();
    if (els.tcSelect) syncCustomSelect(els.tcSelect);
    openModal('modal-setup');
  }

  async function newGame(opts) {
    opts = opts || {};
    if (S.history.length && !S.gameOver && ['bot', 'pvp'].indexOf(S.mode) >= 0 && !opts.force) {
      if (!(await askConfirm(T('alert.confirmNew')))) return;
    }
    closeModal('modal-setup');
    closeModal('modal-gameover');
    resetCommon();
    showGameScreen();

    const profile = YStorage.getProfile();
    const mode = opts.mode || S.setup.mode;
    S.mode = mode;
    S.chess = new Chess();
    S.startFen = Engine.START_FEN;
    setupClock(opts.timeControl || els.tcSelect.value);
    if (mode === 'bot') {
      const bot = Bots.get(opts.botId || S.setup.botId);
      S.bot = bot;
      let color = opts.color || S.setup.color;
      if (color === 'random') color = Math.random() < 0.5 ? 'w' : 'b';
      S.playerColor = color;
      const human = { name: profile.p1.name, elo: profile.p1.elo, isBot: false, botId: null };
      const botP = { name: bot.name.en, elo: bot.elo, isBot: true, botId: bot.id };
      S.white = color === 'w' ? human : botP;
      S.black = color === 'w' ? botP : human;
      S.orientation = color;
      YStorage.saveSettings({ lastBot: bot.id, lastColor: opts.color || S.setup.color, timeControl: S.timeControl });
      renderBotCard();
      botSay('greet');
    } else {
      S.bot = null;
      S.playerColor = 'both';
      S.white = { name: profile.p1.name, elo: profile.p1.elo, isBot: false, botId: null };
      S.black = { name: profile.p2.name, elo: profile.p2.elo, isBot: false, botId: null };
      S.orientation = 'w';
      YStorage.saveSettings({ timeControl: S.timeControl });
      renderBotCard();
    }
    syncAnalysisVisibility();
    buildBoard();
    render();
    renderMoveList();
    sound('start');
    startTurn();
  }

  function takeback() {
    if (checkPausedBlock()) return;
    if (S.mode === 'puzzle') { puzzleRetry(); return; }
    if (['bot', 'pvp'].indexOf(S.mode) < 0 || !S.history.length || S.review.active) { toast(T('alert.takebackNA')); return; }
    if (S.gameOver && (S.termination === 'resign' || S.termination === 'timeout')) { toast(T('alert.takebackNA')); return; }
    S.moveToken++;
    Engine.cancelAnalysis('live');
    exitPreview(true);
    let n = 1;
    if (S.mode === 'bot') {
      const last = S.history[S.history.length - 1];
      n = last.color === S.playerColor ? 1 : 2;
      if (S.history.length < n) n = S.history.length;
      if (n === 1 && last.color !== S.playerColor) { toast(T('alert.takebackNA')); return; }
    }
    let lastUndone = null;
    for (let i = 0; i < n; i++) {
      lastUndone = S.chess.undo();
      S.history.pop();
    }
    if (lastUndone) {
      S.pendingAnims = [{ from: lastUndone.to, to: lastUndone.from }];
    }
    if (S.gameOver) { S.gameOver = false; S.result = null; S.termination = null; closeModal('modal-gameover'); }
    S.selected = null; S.legal = []; clearArrows();
    S.coach = { entry: null, optimalShown: false };
    resetCoach();
    if (S.mode === 'bot') botSay('takeback');
    sound('cancel');
    render(); renderMoveList();
    startTurn();
  }

  async function resign() {
    if (checkPausedBlock()) return;
    if (['bot', 'pvp'].indexOf(S.mode) < 0 || S.gameOver) return;
    if (!(await askConfirm(T('alert.confirmResign')))) return;
    const loser = S.mode === 'bot' ? S.playerColor : S.chess.turn();
    endGame(loser === 'w' ? '0-1' : '1-0', 'resign');
  }

  function flip() {
    if (checkPausedBlock()) return;
    S.orientation = S.orientation === 'w' ? 'b' : 'w';
    buildBoard(); render();
    sound('click');
  }

  /* ------------------------------------------------------------------
     Live Coach & Collapsible Move Analysis
     ------------------------------------------------------------------ */
  function buildCtx(entry, before, after) {
    const idx = S.history.indexOf(entry);
    const uciHistory = S.history.slice(0, idx + 1).map(h => h.uci);
    return {
      fenBefore: entry.fenBefore, uci: entry.uci, san: entry.san, color: entry.color, ply: entry.ply,
      before, after, uciHistory, startFen: S.startFen
    };
  }

  async function coachEvaluate(entry) {
    if (!entry) return;
    if (S.mode === 'bot' && entry.color !== S.playerColor) return;
    S.coach.entry = entry;
    S.coach.optimalShown = false;
    els.coachBadge.className = 'cls-badge cls-none';
    els.coachBadge.textContent = '…';
    S.coachFn = () => T('coach.thinking', { move: entry.san });
    renderCoachText();
    els.btnOptimal.classList.add('hidden');
    els.btnCoachTakeback.classList.add('hidden');
    els.coachBest.classList.add('hidden');
    const before = await Engine.analyze(entry.fenBefore, { multiPV: 3, tag: 'coach', priority: 'normal' });
    const after = await Engine.analyze(entry.fenAfter, { multiPV: 3, tag: 'coach', priority: 'normal' });
    if (!before || !after || S.history.indexOf(entry) < 0) return;
    entry.ctx = buildCtx(entry, before, after);
    entry.cls = Engine.classifyMove(entry.ctx);
    if (S.coach.entry !== entry) { renderMoveList(); return; }
    renderCoach();
    updateEvalBar(after);
    renderMoveList();
    render();
    const cls = entry.cls.cls;
    if (cls === 'blunder') { sound('blunder'); glitchBoard(); if (S.mode === 'bot') botSay('playerBlunder'); }
    else if (cls === 'mistake') { sound('error'); if (S.mode === 'bot' && Math.random() < 0.5) botSay('playerBlunder'); }
    else if (cls === 'brilliant' || cls === 'great') { sound('brilliant'); if (S.mode === 'bot') botSay('playerGoodMove'); }
    // mood lines based on eval
    if (S.mode === 'bot') {
      const botSign = S.playerColor === 'w' ? -1 : 1;
      const ev = botSign * after.cpWhite;
      const mood = ev > 300 ? 'botWinning' : ev < -300 ? 'botLosing' : null;
      if (mood && mood !== S.lastBotMood && cls !== 'blunder') { S.lastBotMood = mood; setTimeout(() => botSay(mood), 900); }
    }
  }

  function glitchBoard() {
    els.board.classList.remove('glitch'); void els.board.offsetWidth; els.board.classList.add('glitch');
  }

  function resetCoach() {
    els.coachBadge.className = 'cls-badge cls-none';
    els.coachBadge.innerHTML = '—';
    els.coachEval.textContent = '0.00';
    if (els.coachSource) els.coachSource.textContent = '';
    els.coachBest.classList.add('hidden');
    els.btnOptimal.classList.add('hidden');
    els.btnCoachTakeback.classList.add('hidden');
    S.coachFn = null;
    renderCoachText();
  }
  function renderCoachText() {
    els.coachText.textContent = S.coachFn ? S.coachFn() : T(S.liveEval ? 'coach.idle' : 'coach.off');
  }
  function renderCoach(customTextFn) {
    const entry = S.coach.entry;
    if (!entry || !entry.cls) { renderCoachText(); return; }
    const c = entry.cls;
    els.coachBadge.className = 'cls-badge cls-' + c.cls + ' pop';
    els.coachBadge.innerHTML = I18N.CLASS_SYMBOL[c.cls] + '<small>' + I18N.classLabel(c.cls) + '</small>';
    const a = entry.ctx.after;
    els.coachEval.textContent = Engine.formatEval(a.cpWhite, a.mate);
    if (els.coachSource) els.coachSource.textContent = '';
    S.coachFn = customTextFn || (() => Engine.comment(entry.ctx, entry.cls));
    renderCoachText();
    if (S.review.active) {
      els.coachBest.classList.add('hidden');
      els.btnOptimal.classList.add('hidden');
      els.btnCoachTakeback.classList.add('hidden');
      return;
    }
    const suboptimal = !c.isBest && ['good', 'inaccuracy', 'mistake', 'blunder'].indexOf(c.cls) >= 0;
    els.btnOptimal.classList.toggle('hidden', !suboptimal);
    els.btnOptimal.textContent = T(S.coach.optimalShown ? 'btn.hideOptimal' : 'btn.showOptimal');
    els.btnCoachTakeback.classList.toggle('hidden', !(suboptimal && S.coach.optimalShown && S.mode !== 'puzzle'));
    if (S.coach.optimalShown) {
      els.coachBest.classList.remove('hidden');
      const mv = Engine.describeMove(entry.fenBefore, c.bestUci);
      const bestEval = Engine.formatEval(entry.ctx.before.cpWhite, entry.ctx.before.mate);
      const playedEval = Engine.formatEval(a.cpWhite, a.mate);
      els.coachBest.textContent = T('coach.optimalIs', { move: mv }) + ' — ' + T('b.whyBetter', { move: c.bestSan, eval: bestEval, played: playedEval });
    } else {
      els.coachBest.classList.add('hidden');
    }
  }

  function showOptimal() {
    if (checkPausedBlock()) return;
    const entry = S.coach.entry;
    if (!entry || !entry.cls || !entry.cls.bestUci) return;
    if (S.coach.optimalShown) { exitPreview(); return; }
    S.coach.optimalShown = true;
    S.viewFen = entry.fenBefore;
    S.selected = null; S.legal = [];
    sound('confirm');
    const best = entry.cls.bestUci;
    const isRed = entry.cls.cls === 'blunder';
    drawArrows([
      { from: entry.uci.slice(0, 2), to: entry.uci.slice(2, 4), color: isRed ? 'red' : 'orange', width: 11, opacity: 0.7 },
      { from: best.slice(0, 2), to: best.slice(2, 4), color: 'cyan' }
    ]);
    render();
    renderCoach();
  }
  function exitPreview(silent) {
    if (!S.viewFen || S.review.active) return;
    S.viewFen = null;
    S.coach.optimalShown = false;
    clearArrows();
    render();
    renderCoach();
    if (!silent) sound('cancel');
  }

  /* ------------------------------------------------------------------
     Bot roster & in-game bot banner
     ------------------------------------------------------------------ */
  function renderBotRoster() {
    const box = els.botRoster;
    if (!box) return;
    box.innerHTML = '';
    Bots.list.forEach(b => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'bot-chip' + (b.id === S.setup.botId ? ' active' : '');
      d.dataset.bot = b.id;
      d.innerHTML = '<div class="chip-portrait">' + Bots.portrait(b.id, 46) + '</div><div class="chip-name">' + I18N.pick(b.name) + '</div><div class="chip-elo">Elo ' + b.elo + '</div>';
      d.title = I18N.pick(b.title) + ' — ' + I18N.pick(b.desc);
      d.onclick = () => {
        S.setup.botId = b.id;
        sound('select');
        renderBotRoster();
      };
      box.appendChild(d);
    });
    const curBot = Bots.get(S.setup.botId);
    if (els.botSelectedDesc && curBot) {
      els.botSelectedDesc.textContent = I18N.pick(curBot.name) + ' (' + I18N.pick(curBot.title) + ' · Elo ' + curBot.elo + '): ' + I18N.pick(curBot.desc);
    }
  }

  function renderBotCard() {
    if (S.mode === 'bot' && S.bot) {
      const b = S.bot;
      els.botPortrait.innerHTML = Bots.portrait(b.id, 46);
      els.botName.textContent = I18N.pick(b.name);
      els.botElo.textContent = I18N.pick(b.title) + ' · Elo ' + b.elo;
      els.paneBot.classList.remove('hidden');
      els.botDialogue.classList.toggle('hostile', b.tier >= 5);
    } else {
      els.paneBot.classList.add('hidden');
    }
  }
  function botSay(trigger) {
    if (!S.bot) return;
    const id = S.bot.id;
    const variant = Math.random();
    S.botLineFn = () => Bots.say(id, trigger, { variant, name: playerLabel(S.playerColor === 'w' ? S.white : S.black).name });
    renderBotLine();
  }
  function renderBotLine() {
    if (!els.botDialogue) return;
    const t = els.botDialogue.querySelector('.dlg-text');
    if (t) t.textContent = S.botLineFn ? S.botLineFn() : '...';
  }

  /* ------------------------------------------------------------------
     Move list
     ------------------------------------------------------------------ */
  function renderMoveList() {
    const ol = els.moveList;
    if (!ol) return;
    ol.innerHTML = '';
    const startBlack = S.startFen.split(' ')[1] === 'b';
    const startNo = parseInt(S.startFen.split(' ')[5], 10) || 1;
    let i = 0, no = startNo;
    const items = S.history;
    const mk = (h, idx) => {
      const sp = document.createElement('span');
      sp.className = 'mv';
      const current = S.review.active ? S.review.index === idx + 1 : idx === items.length - 1;
      if (current) sp.classList.add('current');
      sp.textContent = h.san;
      if (h.cls && (S.review.active || S.liveEval)) {
        const tag = document.createElement('span');
        tag.className = 'mv-tag';
        tag.style.background = CLS_COLORS[h.cls.cls];
        tag.textContent = I18N.CLASS_SYMBOL[h.cls.cls] === 'BOOK' ? 'B' : (I18N.CLASS_SYMBOL[h.cls.cls] === 'GOOD' ? '' : I18N.CLASS_SYMBOL[h.cls.cls]);
        if (tag.textContent) sp.appendChild(tag);
      }
      sp.onclick = () => { if (S.review.active) reviewGo(idx + 1); };
      return sp;
    };
    const empty = () => { const s = document.createElement('span'); s.className = 'mv'; s.textContent = startBlack && i === 0 ? '…' : ''; return s; };
    while (i < items.length) {
      const li = document.createElement('li');
      const n = document.createElement('span'); n.className = 'mv-no'; n.textContent = no + '.';
      li.appendChild(n);
      if (i === 0 && startBlack) { li.appendChild(empty()); li.appendChild(mk(items[0], 0)); i = 1; }
      else {
        li.appendChild(mk(items[i], i));
        if (items[i + 1]) li.appendChild(mk(items[i + 1], i + 1)); else li.appendChild(empty());
        i += 2;
      }
      ol.appendChild(li);
      no++;
    }
    const cur = ol.querySelector('.current');
    if (cur) {
      const olRect = ol.getBoundingClientRect();
      const curRect = cur.getBoundingClientRect();
      if (curRect.bottom > olRect.bottom) {
        ol.scrollTop += (curRect.bottom - olRect.bottom);
      } else if (curRect.top < olRect.top) {
        ol.scrollTop -= (olRect.top - curRect.top);
      }
    }
  }

  /* ------------------------------------------------------------------
     Post-game review
     ------------------------------------------------------------------ */
  async function startReview(match) {
    if (match) {
      if (!loadMatch(match)) { toast(T('archive.importFail'), true); return; }
    }
    if (!S.history.length) { toast(T('review.needGame')); return; }
    closeModal('modal-gameover');
    closeModal('modal-load');
    showGameScreen();

    S.moveToken++;
    stopClock();
    Engine.cancelAnalysis();
    const token = ++S.review.token;
    S.review.active = true; S.review.ready = false;
    S.review.fens = [S.startFen].concat(S.history.map(h => h.fenAfter));
    S.review.index = S.history.length;
    S.viewFen = S.review.fens[S.review.index];
    S.selected = null; S.legal = [];
    if (S.mode !== 'review') S.reviewFrom = S.mode;
    S.mode = 'review';
    S.coach.entry = null;
    resetCoach();
    S.coachFn = () => T('status.analyzing');
    renderCoachText();
    syncAnalysisVisibility();
    setStatus(() => T('status.analyzing'));
    renderBotCard();
    render(); renderMoveList();
    const n = S.review.fens.length;
    const analyses = new Array(n);
    els.reviewProgress.classList.remove('hidden');
    const fill = els.reviewProgress.querySelector('.rp-fill');
    const txt = els.reviewProgress.querySelector('.rp-text');
    for (let i = 0; i < n; i++) {
      fill.style.width = (i / n * 100) + '%';
      txt.textContent = T('review.analyzing', { i: i + 1, n });
      let a = await Engine.analyze(S.review.fens[i], { multiPV: 3, depth: Engine.profile.reviewDepth, movetime: Engine.profile.reviewMovetime, tag: 'review' });
      if (token !== S.review.token) return;
      if (!a) a = { fen: S.review.fens[i], source: 'mini', depth: 0, lines: [], bestUci: null, cpWhite: i ? analyses[i - 1].cpWhite : 0, mate: null };
      analyses[i] = a;
    }
    fill.style.width = '100%';
    els.reviewProgress.classList.add('hidden');
    S.history.forEach((h, j) => {
      h.ctx = buildCtx(h, analyses[j], analyses[j + 1]);
      h.cls = Engine.classifyMove(h.ctx);
    });
    S.review.analyses = analyses;
    S.review.summary = computeSummary();
    S.review.ready = true;
    sound('confirm');
    renderSummary();
    renderGraph();
    reviewGo(0);
    if (els.reviewComment) els.reviewComment.classList.add('hidden');
    try { const rec = buildMatchRecord(); YStorage.saveMatch(rec); S.matchId = rec.id; renderArchive(); } catch (e) { /* */ }
  }

  function computeSummary() {
    const sum = { w: { acc: 0, n: 0, counts: {} }, b: { acc: 0, n: 0, counts: {} } };
    S.history.forEach(h => {
      if (!h.cls) return;
      const s = sum[h.color];
      s.acc += h.cls.accuracy; s.n++;
      s.counts[h.cls.cls] = (s.counts[h.cls.cls] || 0) + 1;
    });
    ['w', 'b'].forEach(c => { sum[c].accuracy = sum[c].n ? Math.round(sum[c].acc / sum[c].n * 10) / 10 : 0; });
    return sum;
  }

  function renderSummary() {
    const s = S.review.summary;
    if (!s) { els.reviewSummary.classList.add('hidden'); return; }
    const order = ['brilliant', 'great', 'best', 'book', 'good', 'inaccuracy', 'mistake', 'blunder'];
    const side = (c) => {
      const p = playerLabel(c === 'w' ? S.white : S.black);
      let counts = '';
      order.forEach(k => {
        counts += '<span><b style="color:' + CLS_COLORS[k] + '">' + I18N.CLASS_SYMBOL[k] + '</b> ' + (s[c].counts[k] || 0) + '</span>';
      });
      return '<div class="rs-side"><h4>' + sideName(c).toUpperCase() + ' · ' + escapeHtml(p.name) + (p.elo ? ' (' + p.elo + ')' : '') + '</h4>' +
        '<div class="field-label" style="margin:2px 0">' + T('review.accuracy') + '</div><div class="rs-acc">' + s[c].accuracy.toFixed(1) + '%</div>' +
        '<div class="rs-counts">' + counts + '</div></div>';
    };
    els.reviewSummary.innerHTML = side('w') + side('b');
    els.reviewSummary.classList.remove('hidden');
  }

  function renderGraph() {
    const svg = els.evalGraph;
    const a = S.review.analyses;
    if (!a || !a.length) { svg.classList.add('hidden'); return; }
    svg.classList.remove('hidden');
    const n = a.length - 1 || 1;
    const W = 300, H = 80;
    const pts = a.map((x, i) => [i / n * W, H - Engine.winPercent(x.cpWhite) / 100 * H]);
    let area = 'M0,' + H + ' ' + pts.map(p => 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + ' L' + W + ',' + H + ' Z';
    let html = '<path d="' + area + '" fill="#EFECE6" opacity="0.9"/>';
    html += '<line x1="0" y1="40" x2="300" y2="40" stroke="#7A7567" stroke-dasharray="3 3" stroke-width="0.6"/>';
    S.history.forEach((h, j) => {
      if (h.cls && h.cls.critical) {
        const p = pts[j + 1];
        html += '<rect x="' + (p[0] - 2.2) + '" y="' + (p[1] - 2.2) + '" width="4.4" height="4.4" fill="' + CLS_COLORS[h.cls.cls] + '" stroke="#3B3831" stroke-width="0.5" transform="rotate(45 ' + p[0] + ' ' + p[1] + ')"/>';
      }
    });
    const ci = S.review.index / n * W;
    html += '<line id="graph-cursor" x1="' + ci + '" y1="0" x2="' + ci + '" y2="80" stroke="#2B8C84" stroke-width="1.5"/>';
    svg.innerHTML = html;
  }

  function reviewGo(index) {
    if (!S.review.active) return;
    const n = S.review.fens.length - 1;
    const prevIndex = S.review.index;
    index = Math.max(0, Math.min(n, index));
    S.review.index = index;
    S.viewFen = S.review.fens[index];

    if (index === prevIndex + 1 && index > 0) {
      const h = S.history[index - 1];
      S.pendingAnims = [{ from: h.uci.slice(0, 2), to: h.uci.slice(2, 4) }];
    } else if (index === prevIndex - 1 && prevIndex > 0) {
      const h = S.history[prevIndex - 1];
      S.pendingAnims = [{ from: h.uci.slice(2, 4), to: h.uci.slice(0, 2) }];
    }

    const arrows = [];
    let commentFn;
    if (index > 0) {
      const h = S.history[index - 1];
      if (h.cls) {
        const isRed = h.cls.cls === 'blunder';
        arrows.push({ from: h.uci.slice(0, 2), to: h.uci.slice(2, 4), color: isRed ? 'red' : 'orange', width: 11, opacity: 0.7 });
        if (!h.cls.isBest && h.cls.bestUci) arrows.push({ from: h.cls.bestUci.slice(0, 2), to: h.cls.bestUci.slice(2, 4), color: 'cyan' });
        const moveNo = Math.ceil((h.ply + (S.startFen.split(' ')[1] === 'b' ? 1 : 0)) / 2) + (parseInt(S.startFen.split(' ')[5], 10) || 1) - 1;
        commentFn = () => {
          const head = T('review.moveHeader', { no: moveNo, dots: h.color === 'w' ? '.' : '...', san: h.san });
          return head + ' — ' + Engine.comment(h.ctx, h.cls);
        };
        if (h.cls.cls === 'blunder') sound('blunder'); else if (h.cls.cls === 'brilliant') sound('brilliant'); else sound(h.captured ? 'capture' : 'move');
        updateEvalBar(h.ctx.after);
      } else {
        commentFn = () => h.san;
        sound('move');
      }
    } else {
      commentFn = () => T('review.start') + (S.review.ready ? ' ' + T('review.done') : '');
      if (S.review.analyses) updateEvalBar(S.review.analyses[0]);
    }
    S.reviewCommentFn = commentFn;
    if (els.reviewComment) els.reviewComment.classList.add('hidden');
    S.arrows = arrows;
    setStatus(() => T('status.reviewing', { ply: S.review.index, total: S.review.fens.length - 1 }));
    render();
    renderMoveList();
    const cur = $('graph-cursor');
    if (cur) { const x = index / (n || 1) * 300; cur.setAttribute('x1', x); cur.setAttribute('x2', x); }
    if (index > 0 && S.history[index - 1].cls) {
      S.coach.entry = S.history[index - 1];
      S.coach.optimalShown = false;
      renderCoach(commentFn);
    } else {
      S.coach.entry = null;
      S.coach.optimalShown = false;
      els.coachBadge.className = 'cls-badge cls-none';
      els.coachBadge.innerHTML = '—';
      const a0 = (index > 0 && S.review.analyses && S.review.analyses[index]) || (S.review.analyses && S.review.analyses[0]);
      els.coachEval.textContent = a0 ? Engine.formatEval(a0.cpWhite, a0.mate) : '0.00';
      S.coachFn = commentFn;
      renderCoachText();
      els.btnOptimal.classList.add('hidden');
      els.btnCoachTakeback.classList.add('hidden');
      els.coachBest.classList.add('hidden');
    }
  }

  function nextCritical() {
    if (!S.review.active) { toast(T('review.needGame')); return; }
    if (!S.review.ready) return;
    for (let j = S.review.index + 1; j <= S.history.length; j++) {
      const h = S.history[j - 1];
      if (h.cls && h.cls.critical) { reviewGo(j); return; }
    }
    toast(T('review.noCritical'));
  }

  function exitReview() {
    S.review.active = false;
    S.review.token++;
    S.viewFen = null;
    S.arrows = [];
    syncAnalysisVisibility();
  }

  /* ------------------------------------------------------------------
     Match records (save / export / import)
     ------------------------------------------------------------------ */
  function buildMatchRecord() {
    const c = new Chess();
    if (S.startFen !== Engine.START_FEN) c.load(S.startFen);
    S.history.forEach(h => c.move(Engine.parseUci(h.uci)));
    const w = playerLabel(S.white), b = playerLabel(S.black);
    const ts = S.matchTimestamp || new Date().toISOString();
    const d = new Date(ts);
    c.header('Event', 'Standard Chess Match', 'Site', 'Local', 'Date',
      d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'),
      'White', w.name, 'Black', b.name, 'WhiteElo', String(w.elo || ''), 'BlackElo', String(b.elo || ''),
      'Result', S.result || '*', 'TimeControl', S.timeControl || 'none');
    const mode = S.mode === 'review' ? (S.reviewFrom || S.importedMode || 'bot') : S.mode;
    const acc = S.review.summary ? { white: S.review.summary.w.accuracy, black: S.review.summary.b.accuracy } : null;
    return {
      format: 'yorha-chess-match', version: 1,
      id: S.matchId || ('m_' + Date.now()),
      timestamp: ts,
      mode,
      timeControl: S.timeControl || 'none',
      white: { name: w.name, elo: w.elo, isBot: !!(S.white && S.white.isBot), botId: S.white ? S.white.botId : null },
      black: { name: b.name, elo: b.elo, isBot: !!(S.black && S.black.isBot), botId: S.black ? S.black.botId : null },
      botTier: S.bot ? { id: S.bot.id, tier: S.bot.tier, elo: S.bot.elo } : (S.importedBotTier || null),
      result: S.result || '*',
      termination: S.termination || null,
      startFen: S.startFen,
      pgn: c.pgn(),
      fenHistory: [S.startFen].concat(S.history.map(h => h.fenAfter)),
      moves: S.history.map(h => ({ ply: h.ply, san: h.san, uci: h.uci, color: h.color })),
      evaluations: S.history.map(h => h.cls ? {
        ply: h.ply, cpWhite: h.cls.evalAfter, mate: h.ctx && h.ctx.after ? h.ctx.after.mate : null,
        bestUci: h.cls.bestUci, bestSan: h.cls.bestSan, classification: h.cls.cls, cpl: h.cls.cpl, winDrop: h.cls.winDrop
      } : { ply: h.ply }),
      accuracy: acc,
      favorite: S.matchFavorite || false,
      lang: I18N.lang
    };
  }

  function loadMatch(match) {
    try {
      resetCommon();
      const c = new Chess();
      const start = match.startFen || Engine.START_FEN;
      if (start !== Engine.START_FEN && !c.load(start)) return false;
      S.startFen = start;
      S.history = [];
      for (const mv of match.moves || []) {
        const fenBefore = c.fen();
        const m = c.move(mv.uci ? Engine.parseUci(mv.uci) : mv.san);
        if (!m) return false;
        S.history.push({ ply: S.history.length + 1, san: m.san, uci: m.from + m.to + (m.promotion || ''), color: m.color, piece: m.piece, captured: m.captured || null, flags: m.flags, fenBefore, fenAfter: c.fen(), cls: null, ctx: null });
      }
      S.chess = c;
      S.white = match.white ? { name: match.white.name, elo: match.white.elo, isBot: !!match.white.isBot, botId: match.white.botId || null } : null;
      S.black = match.black ? { name: match.black.name, elo: match.black.elo, isBot: !!match.black.isBot, botId: match.black.botId || null } : null;
      if (S.white && S.white.isBot && !Bots.get(S.white.botId)) S.white.isBot = false;
      if (S.black && S.black.isBot && !Bots.get(S.black.botId)) S.black.isBot = false;
      S.bot = null;
      S.importedBotTier = match.botTier || null;
      S.importedMode = match.mode || 'bot';
      S.reviewFrom = match.mode || 'bot';
      S.result = match.result || '*';
      S.termination = match.termination || null;
      S.timeControl = match.timeControl || 'none';
      S.matchId = match.id || null;
      S.matchTimestamp = match.timestamp || new Date().toISOString();
      S.matchFavorite = !!match.favorite;
      S.gameOver = true;
      S.clock.enabled = false;
      S.mode = 'review';
      const humanBlack = S.black && !S.black.isBot && S.white && S.white.isBot;
      S.orientation = humanBlack ? 'b' : 'w';
      buildBoard();
      return true;
    } catch (e) { console.error(e); return false; }
  }

  function saveCurrent() {
    if (!S.history.length) { toast(T('alert.noMoves')); return; }
    const rec = buildMatchRecord();
    rec.favorite = true;
    S.matchFavorite = true;
    YStorage.saveMatch(rec);
    S.matchId = rec.id;
    renderArchive();
    toast(T('archive.saved'));
    sound('confirm');
  }
  function exportCurrent() {
    if (!S.history.length) { toast(T('alert.noMoves')); return; }
    const rec = buildMatchRecord();
    const file = YStorage.exportMatch(rec);
    toast(T('archive.exported', { file }));
    sound('confirm');
  }
  async function importFile(file) {
    try {
      const match = await YStorage.importFile(file);
      toast(T('archive.imported'));
      startReview(match);
    } catch (e) {
      toast(T('archive.importFail'), true);
      sound('error');
    }
  }

  function renderArchive() {
    const ul = els.archiveList;
    if (!ul) return;
    const saves = YStorage.listSaves();
    ul.innerHTML = '';
    if (!saves.length) { ul.innerHTML = '<li class="archive-empty">' + T('archive.empty') + '</li>'; return; }
    saves.forEach(m => {
      const li = document.createElement('li');
      const d = new Date(m.timestamp);
      const wName = m.white.isBot && Bots.get(m.white.botId) ? I18N.pick(Bots.get(m.white.botId).name) : m.white.name;
      const bName = m.black.isBot && Bots.get(m.black.botId) ? I18N.pick(Bots.get(m.black.botId).name) : m.black.name;
      li.innerHTML = '<div class="ar-title">' + (m.favorite ? '<span class="ar-fav">★</span> ' : '') +
        escapeHtml(T('archive.vs', { w: wName, we: m.white.elo, b: bName, be: m.black.elo })) + '</div>' +
        '<div class="ar-meta">' + d.toLocaleString(I18N.lang === 'vi' ? 'vi-VN' : 'en-US') + ' · ' + T('mode.' + (m.mode === 'pvp' ? 'pvp' : m.mode === 'puzzle' ? 'puzzle' : 'bot')) +
        ' · ' + (m.result || '*') + ' · ' + T('archive.moves', { n: (m.moves || []).length }) +
        (m.accuracy ? ' · ' + m.accuracy.white + '% / ' + m.accuracy.black + '%' : '') + '</div>' +
        '<div class="ar-actions"></div>';
      const act = li.querySelector('.ar-actions');
      const mkBtn = (label, fn) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tool-btn';
        b.textContent = label;
        b.onclick = fn;
        act.appendChild(b);
      };
      mkBtn(T('btn.load'), () => { startReview(YStorage.getMatch(m.id)); });
      mkBtn(T('btn.export'), () => { const f = YStorage.exportMatch(YStorage.getMatch(m.id)); toast(T('archive.exported', { file: f })); });
      mkBtn(T(m.favorite ? 'btn.unfavorite' : 'btn.favorite'), () => { YStorage.toggleFavorite(m.id); renderArchive(); sound('click'); });
      mkBtn(T('btn.delete'), () => { YStorage.deleteMatch(m.id); renderArchive(); toast(T('archive.deleted')); sound('cancel'); });
      ul.appendChild(li);
    });
  }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

  /* ------------------------------------------------------------------
     Puzzles
     ------------------------------------------------------------------ */
  function puzzleById(id) { return (window.PUZZLES || []).find(p => p.id === id); }
  function filteredPuzzles() {
    const f = S.puzzleFilter;
    return (window.PUZZLES || []).filter(p => f === 'all' || p.cat === f || (p.cat + ':' + p.sub) === f);
  }

  function renderPuzzleFilter() {
    const sel = els.puzzleFilter;
    if (!sel) return;
    const cur = S.puzzleFilter;
    sel.innerHTML = '';
    const add = (v, label) => { const o = document.createElement('option'); o.value = v; o.textContent = label; sel.appendChild(o); };
    add('all', T('puzzle.all'));
    (window.PUZZLE_CATEGORIES || []).forEach(cat => {
      add(cat.id, '■ ' + I18N.pick(cat.name));
      (cat.subs || []).forEach(s => add(cat.id + ':' + s.id, '   └ ' + I18N.pick(s.name)));
    });
    sel.value = cur;
    syncCustomSelect(sel);
  }

  function renderPuzzleList() {
    const ul = els.puzzleList;
    if (!ul) return;
    const solved = YStorage.getSolved();
    ul.innerHTML = '';
    const list = filteredPuzzles();
    let lastCat = null;
    list.forEach((p, i) => {
      if (p.cat !== lastCat) {
        lastCat = p.cat;
        const cat = (window.PUZZLE_CATEGORIES || []).find(c => c.id === p.cat);
        const g = document.createElement('li'); g.className = 'pz-group';
        g.textContent = cat ? I18N.pick(cat.name).toUpperCase() : p.cat;
        ul.appendChild(g);
      }
      const li = document.createElement('li');
      li.className = (solved[p.id] ? 'solved' : '') + (S.puzzle && S.puzzle.data.id === p.id ? ' active' : '');
      li.innerHTML = '<span class="pz-state">' + (solved[p.id] ? '✓' : String(i + 1).padStart(2, '0')) + '</span>' +
        '<span>' + escapeHtml(I18N.pick(p.title)) + '</span><span class="pz-rating">' + (p.rating || '') + '</span>';
      li.onclick = () => loadPuzzle(p.id, true);
      ul.appendChild(li);
    });
    const total = (window.PUZZLES || []).length;
    if (els.puzzleProgress) {
      els.puzzleProgress.textContent = T('puzzle.progress', { s: Object.keys(solved).filter(id => puzzleById(id)).length, n: total });
    }
    const act = ul.querySelector('li.active');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  async function loadPuzzle(id, force) {
    const p = puzzleById(id);
    if (!p) return;
    if (!force && S.history.length && !S.gameOver && ['bot', 'pvp'].indexOf(S.mode) >= 0) {
      if (!(await askConfirm(T('alert.confirmNew')))) return;
    }
    closeModal('modal-puzzles');
    resetCommon();
    showGameScreen();

    S.mode = 'puzzle';
    S.chess = new Chess();
    if (!S.chess.load(p.fen)) { console.error('Bad puzzle FEN', p.id); return; }
    S.startFen = p.fen;
    setupClock('none');
    const color = S.chess.turn();
    S.puzzle = { data: p, step: 0, attempts: 0, solved: false, playerColor: color, canonical: null, feedback: null, busy: false, hintSq: null };
    const profile = YStorage.getProfile();
    const human = { name: profile.p1.name, elo: profile.p1.elo, isBot: false, botId: null };
    const opp = { name: T('mode.puzzle'), elo: p.rating || '', isBot: false, botId: null };
    S.white = color === 'w' ? human : opp;
    S.black = color === 'w' ? opp : human;
    S.bot = null;
    S.orientation = color;
    renderBotCard();
    syncAnalysisVisibility();
    buildBoard();
    render(); renderMoveList();
    renderPuzzleInfo();
    renderPuzzleList();
    sound('start');
    setStatus(() => T('status.puzzle', { title: I18N.pick(p.title), color: sideName(color).toUpperCase() }));
    if (S.liveEval) prefetch();
  }

  function renderPuzzleInfo() {
    const box = els.puzzleInfo;
    if (!box) return;
    if (!S.puzzle) { box.innerHTML = '<div class="pz-meta">' + T('puzzle.select') + '</div>'; updateCanonicalBtn(); return; }
    const p = S.puzzle.data;
    const cat = (window.PUZZLE_CATEGORIES || []).find(c => c.id === p.cat);
    const sub = cat && (cat.subs || []).find(s => s.id === p.sub);
    let html = '<h3>' + escapeHtml(I18N.pick(p.title)) + '</h3>' +
      '<div class="pz-meta">' + (cat ? escapeHtml(I18N.pick(cat.name)) : '') + (sub ? ' / ' + escapeHtml(I18N.pick(sub.name)) : '') +
      ' · ' + T('puzzle.rating', { r: p.rating || '?' }) + (p.source ? ' · ' + T('puzzle.source', { s: escapeHtml(p.source) }) : '') + '</div>' +
      '<div class="pz-goal">▶ ' + escapeHtml(I18N.pick(p.goal)) + ' — ' + T('puzzle.toMove', { color: sideName(S.puzzle.playerColor) }) + '</div>';
    if (S.puzzle.feedback) {
      const fb = S.puzzle.feedback;
      html += '<div class="pz-feedback ' + fb.type + '">' + escapeHtml(fb.fn()) + '</div>';
    }
    if (S.puzzle.solved || (S.puzzle.canonical && S.puzzle.canonical.done)) {
      html += '<div class="y-sep"></div><div>' + escapeHtml(I18N.pick(p.explain)) + '</div>';
    }
    box.innerHTML = html;
    updateCanonicalBtn();
  }
  function updateCanonicalBtn() {
    const b = els.btnCanonical;
    if (!b) return;
    const active = S.puzzle && S.puzzle.canonical && !S.puzzle.canonical.done;
    b.textContent = T(active ? 'btn.canonicalNext' : 'btn.canonical');
  }
  function puzzleFeedback(type, fn) { if (!S.puzzle) return; S.puzzle.feedback = { type, fn }; renderPuzzleInfo(); }

  async function puzzleOnMove(entry) {
    const pz = S.puzzle;
    const expected = pz.data.moves[pz.step];
    const ok = Engine.sameMove(entry.uci, expected) || S.chess.in_checkmate();
    if (S.liveEval) coachEvaluate(entry);
    if (!ok) {
      pz.attempts++;
      pz.busy = true;
      sound('error');
      glitchBoard();
      const san = entry.san;
      puzzleFeedback('bad', () => T('puzzle.wrong', { move: san }));
      await sleep(900);
      if (S.puzzle !== pz) return;
      const undone = S.chess.undo();
      S.history.pop();
      if (undone) S.pendingAnims = [{ from: undone.to, to: undone.from }];
      pz.busy = false;
      render(); renderMoveList();
      return;
    }
    pz.step++;
    if (S.chess.in_checkmate() || pz.step >= pz.data.moves.length) { puzzleSolved(); return; }
    puzzleFeedback('ok', () => T('puzzle.correct'));
    sound('confirm');
    pz.busy = true;
    await sleep(450);
    if (S.puzzle !== pz) return;
    const reply = pz.data.moves[pz.step];
    const fenBefore = S.chess.fen();
    const m = S.chess.move(Engine.parseUci(reply));
    pz.busy = false;
    if (!m) { puzzleSolved(); return; }
    recordMove(m, fenBefore);
    moveSound(m);
    queueMoveAnimation(m);
    pz.step++;
    render(); renderMoveList();
    if (pz.step >= pz.data.moves.length) { puzzleSolved(); return; }
    if (S.liveEval) prefetch();
  }

  function puzzleSolved() {
    const pz = S.puzzle;
    pz.solved = true;
    YStorage.markSolved(pz.data.id, pz.attempts + 1);
    sound('brilliant');
    puzzleFeedback('ok', () => T('puzzle.solved'));
    setStatus(() => T('puzzle.solved'));
    renderPuzzleList();
  }

  function puzzleHint() {
    if (checkPausedBlock()) return;
    if (S.mode !== 'puzzle' || !S.puzzle || S.puzzle.solved) return;
    const mv = S.puzzle.data.moves[S.puzzle.step];
    if (!mv) return;
    const sq = mv.slice(0, 2);
    const p = S.chess.get(sq);
    S.puzzle.hintSq = sq;
    S.puzzle.attempts++;
    sound('click');
    puzzleFeedback('info', () => T('puzzle.hint', { piece: I18N.t('piece.pl.' + (p ? p.type : 'p')), square: sq }));
    render();
  }
  function puzzleRetry() {
    if (checkPausedBlock()) return;
    if (S.puzzle) loadPuzzle(S.puzzle.data.id, true);
  }
  function puzzleNext() {
    if (checkPausedBlock()) return;
    const list = filteredPuzzles();
    if (!list.length) return;
    const solved = YStorage.getSolved();
    let idx = S.puzzle ? list.findIndex(p => p.id === S.puzzle.data.id) : -1;
    for (let k = 1; k <= list.length; k++) {
      const p = list[(idx + k) % list.length];
      if (!solved[p.id] || k === list.length) { loadPuzzle(p.id, true); return; }
    }
    loadPuzzle(list[(idx + 1) % list.length].id, true);
  }

  function puzzleCanonical() {
    if (checkPausedBlock()) return;
    if (S.mode !== 'puzzle' || !S.puzzle) { if (filteredPuzzles().length) loadPuzzle(filteredPuzzles()[0].id, true); return; }
    const pz = S.puzzle;
    if (!pz.canonical || pz.canonical.done) {
      S.moveToken++;
      S.chess = new Chess(); S.chess.load(pz.data.fen);
      S.history = []; S.viewFen = null; S.selected = null; S.legal = [];
      pz.step = 0; pz.hintSq = null;
      pz.canonical = { i: 0, done: false };
    }
    const c = pz.canonical;
    const moves = pz.data.moves;
    if (c.i >= moves.length) { c.done = true; updateCanonicalBtn(); return; }
    const uci = moves[c.i];
    const fenBefore = S.chess.fen();
    const desc = Engine.describeMove(fenBefore, uci);
    const m = S.chess.move(Engine.parseUci(uci));
    if (!m) { c.done = true; return; }
    recordMove(m, fenBefore);
    moveSound(m);
    queueMoveAnimation(m);
    c.i++;
    const isPlayer = m.color === pz.playerColor;
    S.arrows = [{ from: m.from, to: m.to, color: isPlayer ? 'cyan' : 'orange' }];
    const i = c.i, n = moves.length;
    if (c.i >= moves.length) { c.done = true; pz.solved = false; }
    puzzleFeedback('info', () => T('puzzle.canonicalStep', { i, n, move: desc }) + (c.done ? ' — ' + T('puzzle.canonicalDone') : ''));
    render(); renderMoveList();
    if (S.liveEval) prefetch();
  }

  /* ------------------------------------------------------------------
     Custom NieR Dropdowns
     ------------------------------------------------------------------ */
  function syncCustomSelect(selectEl) {
    if (!selectEl) return;
    let wrap = selectEl.parentNode;
    if (!wrap || !wrap.classList.contains('nier-select-wrap')) {
      wrap = document.createElement('div');
      wrap.className = 'nier-select-wrap';
      selectEl.parentNode.insertBefore(wrap, selectEl);
      wrap.appendChild(selectEl);
      selectEl.classList.add('nier-select-native');
    }
    let trigger = wrap._trigger;
    let menu = wrap._menu;
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'nier-select-trigger';
      menu = document.createElement('div');
      menu.className = 'nier-select-menu hidden';
      wrap.appendChild(trigger);
      wrap.appendChild(menu);
      wrap._trigger = trigger;
      wrap._menu = menu;
      trigger.onclick = (e) => {
        e.stopPropagation();
        const wasOpen = !menu.classList.contains('hidden');
        document.querySelectorAll('.nier-select-menu').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.nier-select-trigger').forEach(t => t.classList.remove('open'));
        if (!wasOpen) {
          menu.classList.remove('hidden');
          trigger.classList.add('open');
        }
        sound('click');
      };
    }
    if (!syncCustomSelect._docBound) {
      syncCustomSelect._docBound = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nier-select-wrap')) {
          document.querySelectorAll('.nier-select-menu').forEach(m => m.classList.add('hidden'));
          document.querySelectorAll('.nier-select-trigger').forEach(t => t.classList.remove('open'));
        }
      });
    }
    const opts = Array.from(selectEl.options);
    const selectedOpt = opts[selectEl.selectedIndex] || opts[0];
    trigger.innerHTML = '<span>' + escapeHtml(selectedOpt ? selectedOpt.textContent : '') + '</span><i class="fas fa-chevron-down"></i>';
    menu.innerHTML = '';
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nier-select-option' + (opt.value === selectEl.value ? ' active' : '');
      btn.textContent = opt.textContent;
      btn.onclick = (e) => {
        e.stopPropagation();
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        menu.classList.add('hidden');
        trigger.classList.remove('open');
        sound('select');
        syncCustomSelect(selectEl);
      };
      menu.appendChild(btn);
    });
  }

  /* ------------------------------------------------------------------
     Modals, settings & profile
     ------------------------------------------------------------------ */
  function openModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('hidden');
    sound('open');
  }
  function closeModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.add('hidden');
    if (id === 'modal-promo' && promoResolve) {
      const r = promoResolve;
      promoResolve = null;
      r(null);
    }
    if (id === 'modal-confirm' && confirmResolve) {
      const r = confirmResolve;
      confirmResolve = null;
      r(false);
    }
  }

  function openProfile() {
    const p = YStorage.getProfile();
    $('pf-p1-name').value = p.p1.name; $('pf-p1-elo').value = p.p1.elo;
    $('pf-p2-name').value = p.p2.name; $('pf-p2-elo').value = p.p2.elo;
    openModal('modal-profile');
  }
  function saveProfile() {
    const clampElo = v => Math.max(100, Math.min(3500, parseInt(v, 10) || 800));
    const p = {
      p1: { name: ($('pf-p1-name').value || 'Player 1').trim().slice(0, 24) || 'Player 1', elo: clampElo($('pf-p1-elo').value) },
      p2: { name: ($('pf-p2-name').value || 'Player 2').trim().slice(0, 24) || 'Player 2', elo: clampElo($('pf-p2-elo').value) },
      onboarded: true
    };
    YStorage.saveProfile(p);
    if (S.white && !S.white.isBot) { S.white.name = p.p1.name; S.white.elo = p.p1.elo; }
    if (S.black && !S.black.isBot) {
      if (S.mode === 'pvp') { S.black.name = p.p2.name; S.black.elo = p.p2.elo; }
      else { S.black.name = p.p1.name; S.black.elo = p.p1.elo; }
    }
    closeModal('modal-profile');
    toast(T('profile.saved'));
    sound('confirm');
    renderPlayers();
  }

  function syncSettingsUI() {
    const s = YStorage.getSettings();
    document.querySelectorAll('#set-lang .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === I18N.lang));
    if ($('set-bgm')) $('set-bgm').checked = s.bgm;
    if ($('set-bgm-volume')) $('set-bgm-volume').value = Math.round((s.bgmVolume != null ? s.bgmVolume : 0.35) * 100);
    $('set-audio').checked = s.audio;
    $('set-volume').value = Math.round(s.volume * 100);
    $('set-live').checked = S.liveEval;
    $('set-legal').checked = s.showLegal;
    $('set-coords').checked = s.showCoords;
    $('set-autoflip').checked = s.autoFlip;
    $('opt-autoflip').checked = s.autoFlip;
    $('set-cloud').checked = s.cloudEval;
    els.board.classList.toggle('no-coords', !s.showCoords);
    els.btnLang.textContent = I18N.lang === 'vi' ? 'VI' : 'EN';
    if (els.btnBgm) els.btnBgm.innerHTML = '<i class="fas fa-music"></i> ' + (s.bgm ? 'ON' : 'OFF');
    els.btnAudio.innerHTML = '<i class="fas ' + (s.audio ? 'fa-volume-up' : 'fa-volume-mute') + '"></i> ' + (s.audio ? 'ON' : 'OFF');
    const tg = els.toggleLive;
    tg.classList.toggle('on', S.liveEval);
    tg.setAttribute('aria-pressed', S.liveEval);
    tg.querySelector('.tg-state').textContent = S.liveEval ? '[ON]' : '[OFF]';
    syncAnalysisVisibility();
    renderEngineInfo();
  }
  function renderEngineInfo() {
    const p = Engine.profile;
    $('engine-info').textContent = T('settings.engine', {
      engine: (Engine.kind || '...').toUpperCase(), device: T(Engine.isMobile ? 'settings.mobile' : 'settings.desktop'),
      threads: p.threads, depth: p.depth, movetime: p.movetime
    });
  }

  function setLiveEval(on) {
    S.liveEval = !!on;
    YStorage.saveSettings({ liveEval: S.liveEval });
    syncSettingsUI();
    sound(on ? 'confirm' : 'cancel');
    if (!on) {
      exitPreview(true);
      if (!S.review.active) resetEvalBar();
      renderCoachText();
    } else {
      // Evaluate the latest move or current position immediately when toggled ON
      const last = S.history[S.history.length - 1];
      if (last && !last.cls) {
        coachEvaluate(last);
      } else if (last && last.cls) {
        S.coach.entry = last;
        renderCoach();
        if (last.ctx && last.ctx.after) updateEvalBar(last.ctx.after);
      } else if (isHumanTurn() && !S.gameOver) {
        prefetch();
      }
    }
    render();
    renderMoveList();
  }

  /* ------------------------------------------------------------------
     Language
     ------------------------------------------------------------------ */
  function applyLanguage() {
    I18N.apply(document);
    if (els.pauseHoldText) {
      els.pauseHoldText.textContent = T(isMobilePauseMode() ? 'pause.hold' : 'pause.click');
    }
    if (els.tcSelect) syncCustomSelect(els.tcSelect);
    syncSettingsUI();
    renderBotRoster();
    renderBotCard();
    renderBotLine();
    renderStatus();
    renderPlayers();
    if (S.coach.entry && S.coach.entry.cls) {
      renderCoach(S.review.active ? S.reviewCommentFn : null);
    } else if (S.review.active && S.reviewCommentFn) {
      S.coachFn = S.reviewCommentFn;
      renderCoachText();
    } else {
      renderCoachText();
    }
    if (S.review.summary) renderSummary();
    renderMoveList();
    renderPuzzleFilter();
    renderPuzzleList();
    renderPuzzleInfo();
    renderArchive();
    renderGameOver();
  }

  /* ------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------ */
  function bind() {
    // generic UI hover & click sounds matching CDN theme
    const SILENT_BTN = '.review-nav .tool-btn';
    document.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.themebutton, .tool-btn, .dropContent, .seg-btn, .bot-chip');
      if (btn && btn.matches(SILENT_BTN)) { bind._lastHover = btn; return; }
      if (btn && btn !== bind._lastHover) {
        bind._lastHover = btn;
        sound('hover');
      } else if (!btn) {
        bind._lastHover = null;
      }
    });

    document.addEventListener('click', (e) => {
      YoRHaAudio.init();
      const t = e.target.closest('.themebutton, .tool-btn, .dropContent, .seg-btn');
      if (t && !t.matches(SILENT_BTN)) sound('click');
      const close = e.target.closest('[data-close]');
      if (close) closeModal(close.dataset.close);
    });

    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => {
      if (e.target === m && m.id !== 'modal-promo') closeModal(m.id);
    }));

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (S.review.active) {
        if (e.key === 'ArrowLeft') reviewGo(S.review.index - 1);
        else if (e.key === 'ArrowRight') reviewGo(S.review.index + 1);
        else if (e.key === 'Home') reviewGo(0);
        else if (e.key === 'End') reviewGo(S.review.fens.length - 1);
        else if (e.key === 'c') nextCritical();
      }
      if (e.key === 'Escape') document.querySelectorAll('.modal:not(.hidden)').forEach(m => closeModal(m.id));
    });

    // Main Menu bindings
    const playBtn = $('menu-btn-play');
    const playSub = $('menu-play-sub');
    playBtn.onclick = () => {
      const isOpen = playSub.classList.toggle('hidden');
      playBtn.classList.toggle('open', !isOpen);
    };
    $('menu-sub-bot').onclick = () => openSetupModal('bot');
    $('menu-sub-pvp').onclick = () => openSetupModal('pvp');
    $('menu-sub-puzzles').onclick = () => {
      renderPuzzleFilter();
      renderPuzzleList();
      openModal('modal-puzzles');
    };
    $('menu-btn-load').onclick = () => {
      renderArchive();
      openModal('modal-load');
    };
    $('menu-btn-settings').onclick = () => {
      syncSettingsUI();
      openModal('modal-settings');
    };
    $('menu-btn-profile').onclick = openProfile;

    // Board input
    els.board.addEventListener('pointerdown', onPointerDown);
    els.board.addEventListener('pointermove', onPointerMove);
    els.board.addEventListener('pointerup', onPointerUp);
    els.board.addEventListener('pointercancel', onPointerCancel);
    els.board.addEventListener('contextmenu', e => e.preventDefault());

    // Game Screen Toolbar
    $('btn-back-menu').onclick = () => showMenuScreen(false);
    if ($('btn-mobile-menu')) $('btn-mobile-menu').onclick = openMobileDrawer;
    if ($('btn-drawer-close')) $('btn-drawer-close').onclick = closeMobileDrawer;
    if (els.mobileDrawerBackdrop) els.mobileDrawerBackdrop.onclick = closeMobileDrawer;
    // Swipe-to-close (drag drawer toward the right edge; release past half width to dismiss)
    if (els.mobileDrawer) {
      const dr = els.mobileDrawer;
      let sx = 0, sy = 0, dx = 0, tracking = false, horiz = false;
      dr.addEventListener('touchstart', (e) => {
        if (!dr.classList.contains('open') || e.touches.length !== 1) return;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; tracking = true; horiz = false;
      }, { passive: true });
      dr.addEventListener('touchmove', (e) => {
        if (!tracking) return;
        const mx = e.touches[0].clientX - sx, my = e.touches[0].clientY - sy;
        if (!horiz) {
          if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
          if (Math.abs(my) > Math.abs(mx)) { tracking = false; return; }
          horiz = true;
          dr.style.transition = 'none';
        }
        dx = Math.max(0, mx);
        dr.style.transform = 'translateX(' + dx + 'px)';
      }, { passive: true });
      const endSwipe = () => {
        if (!tracking) return;
        tracking = false;
        dr.style.transition = '';
        const w = dr.getBoundingClientRect().width;
        const shouldClose = horiz && dx > w / 2;
        dr.style.transform = '';
        if (shouldClose) { closeMobileDrawer(); sound('cancel'); }
      };
      dr.addEventListener('touchend', endSwipe);
      dr.addEventListener('touchcancel', endSwipe);
    }
    if ($('drawer-btn-menu')) $('drawer-btn-menu').onclick = () => { closeMobileDrawer(); showMenuScreen(false); };
    if ($('drawer-btn-load')) $('drawer-btn-load').onclick = () => { closeMobileDrawer(); renderArchive(); openModal('modal-load'); };
    if ($('drawer-btn-profile')) $('drawer-btn-profile').onclick = () => { closeMobileDrawer(); openProfile(); };
    if ($('drawer-btn-settings')) $('drawer-btn-settings').onclick = () => { closeMobileDrawer(); syncSettingsUI(); openModal('modal-settings'); };

    if (els.pauseCover) {
      els.pauseCover.addEventListener('pointerdown', startPauseHold);
      els.pauseCover.addEventListener('pointerup', cancelPauseHold);
      els.pauseCover.addEventListener('pointercancel', cancelPauseHold);
      els.pauseCover.addEventListener('pointerleave', cancelPauseHold);
      els.pauseCover.addEventListener('contextmenu', e => e.preventDefault());
    }
    els.btnLang.onclick = () => { I18N.setLang(I18N.lang === 'vi' ? 'en' : 'vi'); };
    if (els.btnBgm) {
      els.btnBgm.onclick = () => {
        const s = YStorage.saveSettings({ bgm: !YStorage.getSettings().bgm });
        YoRHaAudio.setBgmEnabled(s.bgm);
        if (s.bgm && S.view === 'game') YoRHaAudio.startBgm();
        syncSettingsUI();
      };
    }
    els.btnAudio.onclick = () => {
      const s = YStorage.saveSettings({ audio: !YStorage.getSettings().audio });
      YoRHaAudio.setEnabled(s.audio);
      syncSettingsUI();
      sound('confirm');
    };
    $('btn-open-load').onclick = () => {
      renderArchive();
      openModal('modal-load');
    };
    $('btn-profile').onclick = openProfile;
    $('btn-settings').onclick = () => { syncSettingsUI(); openModal('modal-settings'); };

    // Setup Modal
    document.querySelectorAll('#mode-select .seg-btn').forEach(b => b.onclick = () => {
      S.setup.mode = b.dataset.mode;
      document.querySelectorAll('#mode-select .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      $('bot-setup').classList.toggle('hidden', S.setup.mode !== 'bot');
      $('pvp-setup').classList.toggle('hidden', S.setup.mode !== 'pvp');
    });
    document.querySelectorAll('#color-select .seg-btn').forEach(b => b.onclick = () => {
      S.setup.color = b.dataset.color;
      document.querySelectorAll('#color-select .seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
    $('btn-start').onclick = () => {
      newGame({ mode: S.setup.mode, force: true });
    };
    $('opt-autoflip').onchange = (e) => { YStorage.saveSettings({ autoFlip: e.target.checked }); syncSettingsUI(); };

    // Board controls
    $('btn-new').onclick = () => {
      if (checkPausedBlock()) return;
      if (S.mode === 'puzzle') {
        renderPuzzleFilter();
        renderPuzzleList();
        openModal('modal-puzzles');
      } else {
        openSetupModal(S.setup.mode);
      }
    };
    $('btn-flip').onclick = flip;
    $('btn-takeback').onclick = takeback;
    $('btn-resign').onclick = resign;
    els.toggleLive.onclick = () => setLiveEval(!S.liveEval);

    // Coach
    els.btnOptimal.onclick = showOptimal;
    els.btnCoachTakeback.onclick = takeback;

    // Review
    $('rv-prev').onclick = () => reviewGo(S.review.index - 1);
    $('rv-next').onclick = () => reviewGo(S.review.index + 1);
    $('rv-critical').onclick = nextCritical;
    els.evalGraph.addEventListener('click', (e) => {
      if (!S.review.active) return;
      const r = els.evalGraph.getBoundingClientRect();
      const n = S.review.fens.length - 1;
      reviewGo(Math.round((e.clientX - r.left) / r.width * n));
    });
    $('btn-analyze').onclick = () => startReview();
    $('btn-save').onclick = saveCurrent;
    $('btn-export').onclick = exportCurrent;
    $('btn-import').onclick = () => $('file-import').click();
    $('file-import').onchange = (e) => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; };

    // Game Over Modal
    $('btn-go-review').onclick = () => { closeModal('modal-gameover'); startReview(); };
    $('btn-go-new').onclick = () => { closeModal('modal-gameover'); openSetupModal(S.setup.mode); };

    // Puzzles
    els.puzzleFilter.onchange = (e) => { S.puzzleFilter = e.target.value; renderPuzzleList(); };
    $('btn-puzzle-hint').onclick = puzzleHint;
    $('btn-puzzle-retry').onclick = puzzleRetry;
    $('btn-puzzle-next').onclick = puzzleNext;
    if ($('btn-puzzle-choose')) {
      $('btn-puzzle-choose').onclick = () => {
        renderPuzzleFilter();
        renderPuzzleList();
        openModal('modal-puzzles');
      };
    }
    els.btnCanonical.onclick = puzzleCanonical;

    // Settings Modal
    document.querySelectorAll('#set-lang .seg-btn').forEach(b => b.onclick = () => I18N.setLang(b.dataset.lang));
    if ($('set-bgm')) {
      $('set-bgm').onchange = (e) => {
        YStorage.saveSettings({ bgm: e.target.checked });
        YoRHaAudio.setBgmEnabled(e.target.checked);
        if (e.target.checked && S.view === 'game') YoRHaAudio.startBgm();
        syncSettingsUI();
      };
    }
    if ($('set-bgm-volume')) {
      $('set-bgm-volume').oninput = (e) => {
        const v = e.target.value / 100;
        YStorage.saveSettings({ bgmVolume: v });
        YoRHaAudio.setBgmVolume(v);
      };
    }
    $('set-audio').onchange = (e) => { YStorage.saveSettings({ audio: e.target.checked }); YoRHaAudio.setEnabled(e.target.checked); syncSettingsUI(); };
    $('set-volume').oninput = (e) => { const v = e.target.value / 100; YStorage.saveSettings({ volume: v }); YoRHaAudio.setVolume(v); };
    $('set-volume').onchange = () => sound('confirm');
    $('set-live').onchange = (e) => setLiveEval(e.target.checked);
    $('set-legal').onchange = (e) => { YStorage.saveSettings({ showLegal: e.target.checked }); render(); };
    $('set-coords').onchange = (e) => { YStorage.saveSettings({ showCoords: e.target.checked }); syncSettingsUI(); };
    $('set-autoflip').onchange = (e) => { YStorage.saveSettings({ autoFlip: e.target.checked }); syncSettingsUI(); };
    $('set-cloud').onchange = (e) => { YStorage.saveSettings({ cloudEval: e.target.checked }); Engine.cloudEnabled = e.target.checked; };

    // Profile Modal
    $('btn-profile-save').onclick = saveProfile;

    I18N.onChange(() => applyLanguage());
    window.addEventListener('resize', () => {
      if (drag) onPointerCancel();
      syncBoardControlsPlacement();
      if (S.paused && els.pauseHoldText) {
        els.pauseHoldText.textContent = T(isMobilePauseMode() ? 'pause.hold' : 'pause.click');
      }
    });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  function init() {
    els.screenMenu = $('screen-menu');
    els.screenGame = $('screen-game');
    els.board = $('board');
    els.colCenter = $('col-center');
    els.boardControls = $('board-controls');
    els.sideBoxBody = document.querySelector('#col-right .side-box-body');
    els.pauseCover = $('board-pause-cover');
    els.pauseHoldFill = $('pause-hold-fill');
    els.pauseHoldText = els.pauseCover ? els.pauseCover.querySelector('.pause-hold-text') : null;
    els.mobileDrawer = $('mobile-drawer');
    els.mobileDrawerBackdrop = $('mobile-drawer-backdrop');
    els.arrowGroup = $('arrow-group');
    els.evalBar = $('eval-bar'); els.evalFill = $('eval-fill'); els.evalText = $('eval-text');
    els.barTop = $('bar-top'); els.barBottom = $('bar-bottom');
    els.status = $('status-line');
    els.toast = $('toast');
    els.paneCoach = $('pane-coach');
    els.paneBot = $('pane-bot');
    els.panePuzzleActive = $('pane-puzzle-active');
    els.reviewControlsWrap = $('review-controls-wrap');
    els.coachBadge = $('coach-badge'); els.coachEval = $('coach-eval'); els.coachSource = $('coach-source');
    els.coachText = $('coach-text'); els.coachBest = $('coach-best');
    els.btnOptimal = $('btn-optimal'); els.btnCoachTakeback = $('btn-coach-takeback');
    els.moveList = $('move-list'); els.reviewSummary = $('review-summary'); els.evalGraph = $('eval-graph');
    els.reviewComment = $('review-comment'); els.reviewProgress = $('review-progress');
    els.puzzleFilter = $('puzzle-filter'); els.puzzleList = $('puzzle-list'); els.puzzleInfo = $('puzzle-info');
    els.puzzleProgress = $('puzzle-progress'); els.btnCanonical = $('btn-canonical');
    els.archiveList = $('archive-list');
    els.botRoster = $('bot-roster'); els.botSelectedDesc = $('bot-selected-desc');
    els.botPortrait = $('bot-portrait'); els.botName = $('bot-name');
    els.botElo = $('bot-elo'); els.botDialogue = $('bot-dialogue');
    els.btnLang = $('btn-lang'); els.btnBgm = $('btn-bgm'); els.btnAudio = $('btn-audio'); els.toggleLive = $('toggle-live');
    els.tcSelect = $('tc-select');

    const settings = YStorage.getSettings();
    S.liveEval = false;
    YStorage.saveSettings({ liveEval: false });
    S.setup.botId = Bots.get(settings.lastBot) ? settings.lastBot : 'cadet';
    S.setup.color = settings.lastColor || 'w';
    document.querySelectorAll('#color-select .seg-btn').forEach(x => x.classList.toggle('active', x.dataset.color === S.setup.color));
    els.tcSelect.value = settings.timeControl || 'none';
    Engine.cloudEnabled = settings.cloudEval;
    YoRHaAudio.setEnabled(settings.audio);
    YoRHaAudio.setVolume(settings.volume);
    YoRHaAudio.setBgmEnabled(settings.bgm !== false);
    YoRHaAudio.setBgmVolume(settings.bgmVolume != null ? settings.bgmVolume : 0.35);

    const profile = YStorage.getProfile();
    S.white = { name: profile.p1.name, elo: profile.p1.elo, isBot: false, botId: null };
    S.black = { name: profile.p2.name, elo: profile.p2.elo, isBot: false, botId: null };

    bind();
    buildBoard();
    applyLanguage();
    render();
    syncAnalysisVisibility();

    setStatus(() => T('status.engineLoading'));
    Engine.init().then(kind => {
      renderEngineInfo();
      if (S.mode === 'idle') setStatus(() => T('status.engineReady', { engine: kind.toUpperCase() }) + ' ' + T('status.idle'));
      if (kind === 'mini') toast(T('alert.engineFail'), true);
    });
  }

  window.App = {
    state: S,
    init,
    showMenuScreen, showGameScreen,
    newGame, loadPuzzle, startReview, applyLanguage, render,
    drawArrows, clearArrows, takeback, resign, flip, showOptimal,
    reviewGo, nextCritical, buildMatchRecord, onPlayerMove: playerMove
  };

  document.addEventListener('DOMContentLoaded', init);
})();
