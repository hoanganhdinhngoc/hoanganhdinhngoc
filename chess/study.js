/* =====================================================================
   NieR Chess Study — study.js
   Global: Study — standalone Board Editor, Self-Analysis, Multi-Branch
   Variation Tree, Telestrator Annotations, Branch JSON Export &
   Study Archive (strictly isolated from active match state S).
   Depends on: Chess (chess.js 0.10.3), I18N, YoRHaAudio, YStorage, Engine, App
   ===================================================================== */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const FILES = 'abcdefgh';
  const T = (k, p) => (window.I18N ? I18N.t(k, p) : k);
  const ANNOT_COLORS = {
    green: '#4E7A45',
    red: '#B83A2D',
    blue: '#3A6EA5',
    yellow: '#C99A2E'
  };
  const CLS_COLORS = {
    brilliant: '#2B8C84', best: '#4E7A45', great: '#4A6A8A', book: '#8A6E4B', good: '#6E7350',
    inaccuracy: '#B88A2D', mistake: '#C9772B', blunder: '#B83A2D'
  };
  const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
  function getStartFen() { return (window.Engine && Engine.START_FEN) || DEFAULT_FEN; }

  let nextNodeSeq = 1;
  function genNodeId() {
    nextNodeSeq += 1;
    return 'n_' + Date.now().toString(36) + '_' + nextNodeSeq.toString(36);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  function pieceSVG(color, type) {
    if (window.App && typeof window.App.pieceSVG === 'function') {
      return window.App.pieceSVG(color, type);
    }
    return '';
  }

  function toast(msg, isAlert) {
    if (window.App && typeof window.App.toast === 'function') {
      window.App.toast(msg, isAlert);
    }
  }

  function askConfirm(msg) {
    if (window.App && typeof window.App.askConfirm === 'function') {
      return window.App.askConfirm(msg);
    }
    return Promise.resolve(true);
  }

  function sound(name) {
    try { if (window.YoRHaAudio) YoRHaAudio.play(name); } catch (e) { /* ignore */ }
  }

  function cloneAnnotations(a) {
    const src = a && typeof a === 'object' ? a : {};
    return {
      arrows: Array.isArray(src.arrows) ? src.arrows.map(x => ({ from: x.from, to: x.to, color: x.color || 'green' })) : [],
      highlights: Array.isArray(src.highlights) ? src.highlights.map(x => ({ sq: x.sq, color: x.color || 'green' })) : []
    };
  }

  function createRootNode(fen) {
    const useFen = fen || getStartFen();
    const parts = String(useFen).trim().split(/\s+/);
    const fullMove = parseInt(parts[5] || '1', 10) || 1;
    const turn = parts[1] === 'b' ? 'b' : 'w';
    const basePly = (fullMove - 1) * 2 + (turn === 'b' ? 1 : 0);
    return {
      id: 'root',
      parentId: null,
      move: null,
      ply: basePly,
      fen: useFen,
      comment: '',
      evaluation: null,
      annotations: { arrows: [], highlights: [] },
      children: []
    };
  }

  function createEmptyStudy(fen, title) {
    const startFen = fen || getStartFen();
    return {
      format: 'yorha-chess-study',
      version: 1,
      id: null,
      title: title || '',
      initialFen: startFen,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      root: createRootNode(startFen)
    };
  }

  /* ------------------------------------------------------------------
     Pure Helpers (FEN parsing / Editor Validation / Tree Helpers)
     (Exposed for automated testing via Study._test)
     ------------------------------------------------------------------ */
  function boardMapFromFen(fen) {
    const map = {};
    const rows = String(fen || '').trim().split(/\s+/)[0].split('/');
    for (let r = 0; r < 8; r++) {
      const rowStr = rows[r] || '8';
      let f = 0;
      for (let i = 0; i < rowStr.length && f < 8; i++) {
        const ch = rowStr[i];
        if (ch >= '1' && ch <= '8') {
          f += parseInt(ch, 10);
        } else {
          const lower = ch.toLowerCase();
          if ('pnbrqk'.indexOf(lower) >= 0) {
            const color = ch === ch.toUpperCase() ? 'w' : 'b';
            const sq = FILES[f] + (8 - r);
            map[sq] = { color, type: lower };
          }
          f += 1;
        }
      }
    }
    return map;
  }

  function sanitizeCastleFlags(boardMap, castle) {
    const c = castle || {};
    const out = { K: false, Q: false, k: false, q: false };
    const at = (sq, col, type) => boardMap[sq] && boardMap[sq].color === col && boardMap[sq].type === type;
    if (c.K && at('e1', 'w', 'k') && at('h1', 'w', 'r')) out.K = true;
    if (c.Q && at('e1', 'w', 'k') && at('a1', 'w', 'r')) out.Q = true;
    if (c.k && at('e8', 'b', 'k') && at('h8', 'b', 'r')) out.k = true;
    if (c.q && at('e8', 'b', 'k') && at('a8', 'b', 'r')) out.q = true;
    return out;
  }

  function buildFenFromEditorState(boardMap, turn, castle, epSq, halfmove, fullmove) {
    const rows = [];
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let line = '';
      for (let f = 0; f < 8; f++) {
        const sq = FILES[f] + (8 - r);
        const p = boardMap[sq];
        if (!p) {
          empty += 1;
        } else {
          if (empty > 0) { line += empty; empty = 0; }
          line += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
        }
      }
      if (empty > 0) line += empty;
      rows.push(line);
    }
    const sc = sanitizeCastleFlags(boardMap, castle);
    let castStr = (sc.K ? 'K' : '') + (sc.Q ? 'Q' : '') + (sc.k ? 'k' : '') + (sc.q ? 'q' : '');
    if (!castStr) castStr = '-';
    const active = turn === 'b' ? 'b' : 'w';
    const ep = epSq && /^[a-h][36]$/.test(epSq) ? epSq : '-';
    const hm = Number.isFinite(halfmove) ? halfmove : 0;
    const fm = Number.isFinite(fullmove) && fullmove >= 1 ? fullmove : 1;
    return rows.join('/') + ' ' + active + ' ' + castStr + ' ' + ep + ' ' + hm + ' ' + fm;
  }

  function validatePosition(boardMap, turn, castle) {
    let wKings = [];
    let bKings = [];
    for (const sq of Object.keys(boardMap)) {
      const p = boardMap[sq];
      if (!p) continue;
      if (p.type === 'p') {
        const rank = sq[1];
        if (rank === '1' || rank === '8') return { ok: false, key: 'study.errPawnRank' };
      }
      if (p.type === 'k') {
        if (p.color === 'w') wKings.push(sq);
        else bKings.push(sq);
      }
    }
    if (wKings.length !== 1) return { ok: false, key: 'study.errWhiteKing' };
    if (bKings.length !== 1) return { ok: false, key: 'study.errBlackKing' };

    const wf = FILES.indexOf(wKings[0][0]);
    const wr = parseInt(wKings[0][1], 10);
    const bf = FILES.indexOf(bKings[0][0]);
    const br = parseInt(bKings[0][1], 10);
    if (Math.max(Math.abs(wf - bf), Math.abs(wr - br)) <= 1) {
      return { ok: false, key: 'study.errAdjacentKings' };
    }

    const opp = turn === 'b' ? 'w' : 'b';
    const fenOppTurn = buildFenFromEditorState(boardMap, opp, castle);
    if (window.Chess) {
      const checker = new window.Chess();
      if (!checker.load(fenOppTurn)) return { ok: false, key: 'study.fenInvalid' };
      if (checker.in_check()) return { ok: false, key: 'study.errOpponentInCheck' };
      const fenActual = buildFenFromEditorState(boardMap, turn, castle);
      const actual = new window.Chess();
      if (!actual.load(fenActual)) return { ok: false, key: 'study.fenInvalid' };
      return { ok: true, key: 'study.legalOk', fen: actual.fen() };
    }
    return { ok: true, key: 'study.legalOk', fen: buildFenFromEditorState(boardMap, turn, castle) };
  }

  function parseFenIntoEditor(fenStr) {
    const raw = String(fenStr || '').trim();
    if (!raw) return null;
    const parts = raw.split(/\s+/);
    const rows = parts[0].split('/');
    if (rows.length !== 8) return null;
    const map = {};
    for (let r = 0; r < 8; r++) {
      let colCount = 0;
      for (const ch of rows[r]) {
        if (ch >= '1' && ch <= '8') {
          colCount += parseInt(ch, 10);
        } else if ('pnbrqkPNBRQK'.indexOf(ch) >= 0) {
          if (colCount >= 8) return null;
          map[FILES[colCount] + (8 - r)] = {
            color: ch === ch.toUpperCase() ? 'w' : 'b',
            type: ch.toLowerCase()
          };
          colCount += 1;
        } else {
          return null;
        }
      }
      if (colCount !== 8) return null;
    }
    const turn = parts[1] === 'b' ? 'b' : 'w';
    const castStr = parts[2] || '-';
    const castle = {
      K: castStr.indexOf('K') >= 0,
      Q: castStr.indexOf('Q') >= 0,
      k: castStr.indexOf('k') >= 0,
      q: castStr.indexOf('q') >= 0
    };
    return { boardMap: map, turn, castle };
  }

  function countTreeNodes(root) {
    if (!root) return 0;
    let total = 0;
    const stack = [root];
    while (stack.length) {
      const n = stack.pop();
      if (!n) continue;
      if (n.id !== 'root') total += 1;
      if (Array.isArray(n.children)) {
        for (let i = 0; i < n.children.length; i++) stack.push(n.children[i]);
      }
    }
    return total;
  }

  /* ------------------------------------------------------------------
     Module State
     ------------------------------------------------------------------ */
  const ST = {
    active: false,
    mode: 'play',         // 'play' | 'editor'
    orientation: 'w',     // 'w' | 'b'
    selfAnalysis: false,
    drawMode: false,
    drawColor: 'green',
    selectedSq: null,
    legalMoves: [],
    study: createEmptyStudy(),
    nodesById: new Map(),
    currentNodeId: 'root',
    collapsedIds: new Set(),
    mobileTab: 'tree',
    engineReqSeq: 0,
    pendingMoveAnim: null,

    // Board Editor working buffer
    editorTool: 'move',   // 'move' | 'erase' | 'wp'..'bk'
    editorMap: {},
    editorTurn: 'w',
    editorCastle: { K: true, Q: true, k: true, q: true },
    editorSelectedSq: null,
    editorDirty: false
  };

  const els = {};
  const boardSquares = {};
  let drag = null;
  let drawDrag = null;
  let edDrag = null;
  let inited = false;

  /* ------------------------------------------------------------------
     Tree Indexing & Navigation
     ------------------------------------------------------------------ */
  function normalizeTree(node, parentId) {
    if (!node || typeof node !== 'object') return;
    if (!node.id) node.id = parentId === null ? 'root' : genNodeId();
    node.parentId = parentId;
    node.annotations = cloneAnnotations(node.annotations);
    if (typeof node.comment !== 'string') node.comment = '';
    if (!Array.isArray(node.children)) node.children = [];
    ST.nodesById.set(node.id, node);
    for (let i = 0; i < node.children.length; i++) {
      normalizeTree(node.children[i], node.id);
    }
  }

  function rebuildIndex() {
    ST.nodesById.clear();
    if (!ST.study || !ST.study.root) {
      ST.study = createEmptyStudy();
    }
    ST.study.root.id = 'root';
    normalizeTree(ST.study.root, null);
    if (!ST.nodesById.has(ST.currentNodeId)) {
      ST.currentNodeId = 'root';
    }
  }

  function currentNode() {
    return ST.nodesById.get(ST.currentNodeId) || ST.study.root;
  }

  function getPathToNode(nodeId) {
    const path = [];
    let cur = ST.nodesById.get(nodeId);
    const guard = new Set();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      path.unshift(cur);
      cur = cur.parentId ? ST.nodesById.get(cur.parentId) : null;
    }
    return path;
  }

  function expandAncestors(nodeId) {
    let cur = ST.nodesById.get(nodeId);
    while (cur && cur.parentId) {
      ST.collapsedIds.delete(cur.parentId);
      cur = ST.nodesById.get(cur.parentId);
    }
  }

  function navigateTo(nodeId, withMoveSfx) {
    if (!ST.nodesById.has(nodeId)) return;
    const prev = currentNode();
    ST.currentNodeId = nodeId;
    ST.selectedSq = null;
    ST.legalMoves = [];
    expandAncestors(nodeId);

    const node = currentNode();
    if (withMoveSfx && node.move && prev && node.parentId === prev.id) {
      ST.pendingMoveAnim = { from: node.move.from, to: node.move.to };
      playMoveSound(node.move, node.fen);
    } else {
      ST.pendingMoveAnim = null;
    }

    if (window.Engine) Engine.cancelAnalysis('study');
    renderAll();
    if (ST.mode === 'play' && ST.selfAnalysis) {
      triggerAnalysisForCurrentNode();
    }
  }

  function playMoveSound(mv, fenAfter) {
    if (!mv) return;
    if (window.Chess && fenAfter) {
      try {
        const c = new window.Chess(fenAfter);
        if (c.in_check()) { sound('check'); return; }
      } catch (e) { /* ignore */ }
    }
    const flags = mv.flags || '';
    if (flags.indexOf('p') >= 0 || mv.promotion) sound('promote');
    else if (flags.indexOf('k') >= 0 || flags.indexOf('q') >= 0) sound('castle');
    else if (mv.captured || flags.indexOf('c') >= 0 || flags.indexOf('e') >= 0) sound('capture');
    else sound('move');
  }

  function prevNode() {
    const n = currentNode();
    if (n && n.parentId) navigateTo(n.parentId, false);
  }

  function nextNode() {
    const n = currentNode();
    if (n && n.children && n.children.length) {
      navigateTo(n.children[0].id, true);
    }
  }

  function switchSibling(delta) {
    const n = currentNode();
    if (!n || !n.parentId) return;
    const parent = ST.nodesById.get(n.parentId);
    if (!parent || parent.children.length <= 1) return;
    const idx = parent.children.indexOf(n);
    const nextIdx = (idx + delta + parent.children.length) % parent.children.length;
    navigateTo(parent.children[nextIdx].id, false);
  }

  function endOfMainline() {
    let cur = currentNode();
    while (cur && cur.children && cur.children.length) {
      cur = cur.children[0];
    }
    if (cur && cur.id !== ST.currentNodeId) {
      navigateTo(cur.id, false);
    }
  }

  function promoteCurrentNode() {
    const n = currentNode();
    if (!n || !n.parentId) return;
    const parent = ST.nodesById.get(n.parentId);
    if (!parent) return;
    const idx = parent.children.indexOf(n);
    if (idx <= 0) return;
    parent.children.splice(idx, 1);
    parent.children.unshift(n);
    sound('confirm');
    renderTree();
  }

  async function deleteCurrentBranch() {
    const n = currentNode();
    if (!n) return;
    if (n.id === 'root') {
      if (!n.children.length) return;
      if (!(await askConfirm(T('study.deleteConfirm')))) return;
      n.children = [];
      rebuildIndex();
      navigateTo('root', false);
      sound('cancel');
      return;
    }
    if (!(await askConfirm(T('study.deleteConfirm')))) return;
    const parent = ST.nodesById.get(n.parentId);
    if (!parent) return;
    parent.children = parent.children.filter(ch => ch.id !== n.id);
    rebuildIndex();
    navigateTo(parent.id, false);
    sound('cancel');
  }

  /* ------------------------------------------------------------------
     Play Move in Study Tree (with Child De-duplication)
     ------------------------------------------------------------------ */
  async function commitMoveInTree(from, to, forcePromo) {
    const parent = currentNode();
    const chess = new window.Chess(parent.fen);
    const legal = chess.moves({ verbose: true }).filter(m => m.from === from && m.to === to);
    if (!legal.length) return false;

    let promo = forcePromo || null;
    if (!promo && legal.some(m => m.promotion)) {
      if (window.App && typeof window.App.askPromotion === 'function') {
        promo = await window.App.askPromotion(chess.turn());
      } else {
        promo = 'q';
      }
    }

    const mv = chess.move({ from, to, promotion: promo || undefined });
    if (!mv) return false;

    const uci = mv.from + mv.to + (mv.promotion || '');
    const existing = parent.children.find(ch => ch.move && (
      window.Engine && Engine.sameMove ? Engine.sameMove(ch.move.uci, uci) : ch.move.uci === uci
    ));

    if (existing) {
      navigateTo(existing.id, true);
      return true;
    }

    const child = {
      id: genNodeId(),
      parentId: parent.id,
      move: {
        san: mv.san,
        uci,
        from: mv.from,
        to: mv.to,
        promotion: mv.promotion || null,
        color: mv.color,
        piece: mv.piece,
        captured: mv.captured || null,
        flags: mv.flags || ''
      },
      ply: parent.ply + 1,
      fen: chess.fen(),
      comment: '',
      evaluation: null,
      annotations: { arrows: [], highlights: [] },
      children: []
    };

    parent.children.push(child);
    ST.nodesById.set(child.id, child);
    ST.currentNodeId = child.id;
    ST.selectedSq = null;
    ST.legalMoves = [];
    ST.pendingMoveAnim = { from: mv.from, to: mv.to };
    expandAncestors(child.id);
    playMoveSound(child.move, child.fen);

    if (window.Engine) Engine.cancelAnalysis('study');
    renderAll();

    if (ST.selfAnalysis) {
      triggerAnalysisForCurrentNode();
    }
    return true;
  }

  /* ------------------------------------------------------------------
     Stockfish Self-Analysis & Node Caching
     ------------------------------------------------------------------ */
  function buildMoveCtxForNode(node) {
    if (!node || !node.parentId || !node.move || !node.evaluation) return null;
    const parent = ST.nodesById.get(node.parentId);
    if (!parent || !parent.evaluation) return null;
    const path = getPathToNode(node.id);
    const uciHistory = path.slice(1).map(n => n.move && n.move.uci).filter(Boolean);
    return {
      fenBefore: parent.fen,
      uci: node.move.uci,
      san: node.move.san,
      color: node.move.color,
      ply: node.ply,
      before: parent.evaluation,
      after: node.evaluation,
      uciHistory,
      startFen: ST.study.initialFen
    };
  }

  function evalMoveClassForNode(node) {
    if (!node || !node.evaluation) return null;
    if (node.evaluation.clsObj) return node.evaluation.clsObj;
    const ctx = buildMoveCtxForNode(node);
    if (!ctx || !window.Engine || typeof Engine.classifyMove !== 'function') return null;
    const cls = Engine.classifyMove(ctx);
    node.evaluation.clsObj = cls;
    return cls;
  }

  async function triggerAnalysisForCurrentNode() {
    if (!ST.active || ST.mode !== 'play' || !ST.selfAnalysis || !window.Engine) return;
    const targetId = ST.currentNodeId;
    const node = ST.nodesById.get(targetId);
    if (!node) return;

    // Show cached evaluation immediately if already stored on node
    if (node.evaluation && node.evaluation.lines && node.evaluation.lines.length) {
      evalMoveClassForNode(node);
      renderEnginePanel();
      renderEvalBar();
      renderEngineArrow();
      renderTree();
      return;
    }

    const reqSeq = ++ST.engineReqSeq;
    renderEnginePanel(true);

    // Ensure parent node has eval too if we want move classification
    const parent = node.parentId ? ST.nodesById.get(node.parentId) : null;
    let parentEval = parent ? parent.evaluation : null;
    if (parent && !parentEval) {
      parentEval = await Engine.analyze(parent.fen, {
        multiPV: 3,
        depth: Engine.isMobile ? 12 : 15,
        movetime: Engine.isMobile ? 700 : 1000,
        tag: 'study',
        priority: 'normal'
      });
      if (parentEval) parent.evaluation = parentEval;
    }

    if (!ST.active || !ST.selfAnalysis || ST.engineReqSeq !== reqSeq || ST.currentNodeId !== targetId) return;

    const res = await Engine.analyze(node.fen, {
      multiPV: 3,
      depth: Engine.isMobile ? 13 : 16,
      movetime: Engine.isMobile ? 900 : 1400,
      tag: 'study',
      priority: 'normal'
    });
    if (!res || !ST.active || !ST.selfAnalysis || ST.engineReqSeq !== reqSeq) return;

    node.evaluation = {
      fen: res.fen,
      source: res.source,
      depth: res.depth,
      bestUci: res.bestUci,
      cpWhite: res.cpWhite,
      mate: res.mate,
      lines: (res.lines || []).slice(0, 3).map(l => ({
        uci: l.uci,
        pv: Array.isArray(l.pv) ? l.pv.slice(0, 8) : (l.uci ? [l.uci] : []),
        cpWhite: l.cpWhite,
        mateWhite: l.mateWhite != null ? l.mateWhite : null
      })),
      clsObj: null
    };
    evalMoveClassForNode(node);

    if (ST.currentNodeId === targetId) {
      renderEnginePanel(false);
      renderEvalBar();
      renderEngineArrow();
      renderBoard();
      renderTree();
    }
  }

  function setSelfAnalysis(on) {
    ST.selfAnalysis = !!on;
    if (!ST.selfAnalysis && window.Engine) {
      ST.engineReqSeq += 1;
      Engine.cancelAnalysis('study');
    }
    syncModeAndToggleUI();
    renderEnginePanel(false);
    renderEvalBar();
    renderEngineArrow();
    renderBoard();
    if (ST.selfAnalysis && ST.mode === 'play') {
      triggerAnalysisForCurrentNode();
    }
  }

  /* ------------------------------------------------------------------
     Mode Switching (Play/Study <-> Board Editor)
     ------------------------------------------------------------------ */
  function loadRootIntoEditor() {
    const startFen = getStartFen();
    const rootFen = (ST.study && ST.study.initialFen) || startFen;
    const parsed = parseFenIntoEditor(rootFen) || {
      boardMap: boardMapFromFen(startFen),
      turn: 'w',
      castle: { K: true, Q: true, k: true, q: true }
    };
    ST.editorMap = parsed.boardMap;
    ST.editorTurn = parsed.turn;
    ST.editorCastle = parsed.castle;
    ST.editorSelectedSq = null;
    ST.editorDirty = false;
    syncEditorControlsUI();
  }

  function enterMode(mode) {
    if (mode !== 'editor' && mode !== 'play') return;
    if (ST.mode === mode) return;
    if (mode === 'editor') {
      if (window.Engine) Engine.cancelAnalysis('study');
      ST.mode = 'editor';
      ST.selectedSq = null;
      ST.legalMoves = [];
      ST.drawMode = false;
      loadRootIntoEditor();
      if (window.innerWidth < 1024) ST.mobileTab = 'editor';
      renderAll();
    } else {
      ST.mode = 'play';
      if (window.innerWidth < 1024 && ST.mobileTab === 'editor') ST.mobileTab = 'tree';
      renderAll();
      if (ST.selfAnalysis) triggerAnalysisForCurrentNode();
    }
  }

  async function commitEditorPosition() {
    const res = validatePosition(ST.editorMap, ST.editorTurn, ST.editorCastle);
    if (!res.ok) {
      sound('error');
      toast(T(res.key), true);
      return;
    }
    const oldFen = (ST.study.initialFen || '').split(' ').slice(0, 4).join(' ');
    const newFen = res.fen.split(' ').slice(0, 4).join(' ');
    if (oldFen !== newFen && ST.study.root.children.length > 0) {
      if (!(await askConfirm(T('study.commitConfirm')))) return;
    }
    if (oldFen !== newFen || ST.study.root.fen !== res.fen) {
      ST.study.initialFen = res.fen;
      ST.study.root = createRootNode(res.fen);
      rebuildIndex();
      ST.currentNodeId = 'root';
    }
    ST.editorDirty = false;
    ST.mode = 'play';
    if (window.innerWidth < 1024) ST.mobileTab = 'tree';
    sound('confirm');
    renderAll();
    if (ST.selfAnalysis) triggerAnalysisForCurrentNode();
  }

  function syncEditorControlsUI() {
    if (!els.fenInput) return;
    const fen = buildFenFromEditorState(ST.editorMap, ST.editorTurn, ST.editorCastle);
    els.fenInput.value = fen;
    els.fenInput.classList.remove('invalid');

    const turnW = $('study-turn-w');
    const turnB = $('study-turn-b');
    if (turnW) turnW.classList.toggle('active', ST.editorTurn === 'w');
    if (turnB) turnB.classList.toggle('active', ST.editorTurn === 'b');

    const sanitized = sanitizeCastleFlags(ST.editorMap, ST.editorCastle);
    ST.editorCastle = sanitized;
    ['K', 'Q', 'k', 'q'].forEach(k => {
      const cb = $('study-castle-' + k);
      if (cb) cb.checked = !!ST.editorCastle[k];
    });

    const val = validatePosition(ST.editorMap, ST.editorTurn, ST.editorCastle);
    if (els.legalMsg) {
      els.legalMsg.textContent = T(val.key);
      els.legalMsg.classList.toggle('ok', !!val.ok);
      els.legalMsg.classList.toggle('err', !val.ok);
    }
    if (els.commitBtn) els.commitBtn.disabled = !val.ok;

    document.querySelectorAll('#study-panel-editor [data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === ST.editorTool);
    });
  }

  /* ------------------------------------------------------------------
     Board Rendering + Engine & Telestrator SVG Layers
     ------------------------------------------------------------------ */
  function buildStudyBoard() {
    const board = els.board;
    if (!board) return;
    board.innerHTML = '';
    for (const k of Object.keys(boardSquares)) delete boardSquares[k];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const file = ST.orientation === 'w' ? col : 7 - col;
        const rank = ST.orientation === 'w' ? 7 - row : row;
        const sq = FILES[file] + (rank + 1);
        const d = document.createElement('div');
        d.className = 'sq ' + ((file + rank) % 2 === 1 ? 'light' : 'dark');
        d.dataset.sq = sq;
        if (col === 0) {
          const cr = document.createElement('span');
          cr.className = 'coord rank';
          cr.textContent = rank + 1;
          d.appendChild(cr);
        }
        if (row === 7) {
          const cf = document.createElement('span');
          cf.className = 'coord file';
          cf.textContent = FILES[file];
          d.appendChild(cf);
        }
        const p = document.createElement('div');
        p.className = 'piece';
        d.appendChild(p);
        d._piece = p;
        d._code = '';
        board.appendChild(d);
        boardSquares[sq] = d;
      }
    }
    if (els.evalBar) els.evalBar.classList.toggle('flipped', ST.orientation === 'b');
    const settings = window.YStorage ? YStorage.getSettings() : { showCoords: true };
    board.classList.toggle('no-coords', !settings.showCoords);
  }

  function sqCenter(sq) {
    const file = FILES.indexOf(sq[0]);
    const rank = parseInt(sq[1], 10) - 1;
    const col = ST.orientation === 'w' ? file : 7 - file;
    const row = ST.orientation === 'w' ? 7 - rank : rank;
    return { x: col * 100 + 50, y: row * 100 + 50, col, row };
  }

  function runMoveAnimIfNeeded() {
    const m = ST.pendingMoveAnim;
    ST.pendingMoveAnim = null;
    if (!m || !m.from || !m.to) return;
    const fromSq = boardSquares[m.from];
    const toSq = boardSquares[m.to];
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
    void pEl.offsetWidth;
    pEl.style.transition = 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)';
    pEl.style.transform = 'translate(0px, 0px)';
    setTimeout(() => {
      if (pEl) {
        pEl.style.transition = '';
        pEl.style.transform = '';
        pEl.style.zIndex = '';
      }
    }, 195);
  }

  function renderBoard() {
    const isEd = ST.mode === 'editor';
    const node = currentNode();
    let map;
    let checkSq = null;

    if (isEd) {
      map = ST.editorMap;
    } else {
      map = boardMapFromFen(node.fen);
      try {
        const c = new window.Chess(node.fen);
        if (c.in_check()) {
          const turn = c.turn();
          for (const sq of Object.keys(map)) {
            if (map[sq].type === 'k' && map[sq].color === turn) checkSq = sq;
          }
        }
      } catch (e) { /* ignore */ }
    }

    for (const sq of Object.keys(boardSquares)) {
      const d = boardSquares[sq];
      const p = map[sq];
      const code = p ? p.color + p.type : '';
      if (d._code !== code) {
        d._piece.innerHTML = p ? pieceSVG(p.color, p.type) : '';
        d._code = code;
      }
      d.classList.remove('last', 'selected', 'legal', 'capture', 'check', 'drag-over');
      const mark = d.querySelector('.cls-mark');
      if (mark) mark.remove();
    }

    if (isEd) {
      if (ST.editorSelectedSq && boardSquares[ST.editorSelectedSq]) {
        boardSquares[ST.editorSelectedSq].classList.add('selected');
      }
      return;
    }

    if (node.move) {
      if (boardSquares[node.move.from]) boardSquares[node.move.from].classList.add('last');
      if (boardSquares[node.move.to]) boardSquares[node.move.to].classList.add('last');
      if (ST.selfAnalysis && node.evaluation && node.evaluation.clsObj && boardSquares[node.move.to]) {
        const cObj = node.evaluation.clsObj;
        const m = document.createElement('span');
        m.className = 'cls-mark';
        m.style.background = CLS_COLORS[cObj.cls] || '#6E7350';
        const sym = window.I18N && I18N.CLASS_SYMBOL ? I18N.CLASS_SYMBOL[cObj.cls] : cObj.cls;
        m.textContent = sym === 'BOOK' ? 'B' : (sym === 'GOOD' ? 'G' : sym);
        boardSquares[node.move.to].appendChild(m);
      }
    }

    if (checkSq && boardSquares[checkSq]) boardSquares[checkSq].classList.add('check');

    if (ST.selectedSq && boardSquares[ST.selectedSq]) {
      boardSquares[ST.selectedSq].classList.add('selected');
      const settings = window.YStorage ? YStorage.getSettings() : { showLegal: true };
      if (settings.showLegal) {
        ST.legalMoves.forEach(m => {
          const sqEl = boardSquares[m.to];
          if (sqEl) {
            sqEl.classList.add('legal');
            if (m.captured) sqEl.classList.add('capture');
          }
        });
      }
    }

    runMoveAnimIfNeeded();
  }

  function renderEngineArrow() {
    const g = els.engineArrowGroup;
    if (!g) return;
    g.innerHTML = '';
    if (ST.mode !== 'play' || !ST.selfAnalysis) return;
    const node = currentNode();
    const best = node.evaluation && node.evaluation.bestUci;
    if (!best || best.length < 4) return;
    const from = best.slice(0, 2);
    const to = best.slice(2, 4);
    if (from === to || !boardSquares[from] || !boardSquares[to]) return;
    const p1 = sqCenter(from);
    const p2 = sqCenter(to);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (!len) return;
    const ux = dx / len;
    const uy = dy / len;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x + ux * 18);
    line.setAttribute('y1', p1.y + uy * 18);
    line.setAttribute('x2', p2.x - ux * 34);
    line.setAttribute('y2', p2.y - uy * 34);
    line.setAttribute('stroke', '#2B8C84');
    line.setAttribute('stroke-width', '14');
    line.setAttribute('stroke-opacity', '0.82');
    line.setAttribute('marker-end', 'url(#st-ah-cyan)');
    g.appendChild(line);
  }

  function renderAnnotLayer(previewItem) {
    const hlGroup = els.annotHighlights;
    const arrGroup = els.annotArrows;
    if (!hlGroup || !arrGroup) return;
    hlGroup.innerHTML = '';
    arrGroup.innerHTML = '';
    if (ST.mode !== 'play') return;

    const node = currentNode();
    const ann = node.annotations || { arrows: [], highlights: [] };

    const hls = ann.highlights.slice();
    if (previewItem && previewItem.sq) hls.push(previewItem);
    hls.forEach(h => {
      if (!h || !h.sq || !boardSquares[h.sq]) return;
      const c = sqCenter(h.sq);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', c.col * 100);
      rect.setAttribute('y', c.row * 100);
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '100');
      rect.setAttribute('fill', ANNOT_COLORS[h.color] || ANNOT_COLORS.green);
      rect.setAttribute('fill-opacity', previewItem && h === previewItem ? '0.28' : '0.42');
      hlGroup.appendChild(rect);
    });

    const arrs = ann.arrows.slice();
    if (previewItem && previewItem.from && previewItem.to && previewItem.from !== previewItem.to) {
      arrs.push(previewItem);
    }
    arrs.forEach(a => {
      if (!a || !a.from || !a.to || a.from === a.to) return;
      const p1 = sqCenter(a.from);
      const p2 = sqCenter(a.to);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (!len) return;
      const ux = dx / len;
      const uy = dy / len;
      const colorName = ANNOT_COLORS[a.color] ? a.color : 'green';
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x + ux * 16);
      line.setAttribute('y1', p1.y + uy * 16);
      line.setAttribute('x2', p2.x - ux * 32);
      line.setAttribute('y2', p2.y - uy * 32);
      line.setAttribute('stroke', ANNOT_COLORS[colorName]);
      line.setAttribute('stroke-width', '16');
      line.setAttribute('stroke-opacity', previewItem && a === previewItem ? '0.55' : '0.88');
      line.setAttribute('marker-end', 'url(#st-ah-' + colorName + ')');
      arrGroup.appendChild(line);
    });
  }

  /* ------------------------------------------------------------------
     Telestrator Toggle Logic
     ------------------------------------------------------------------ */
  function toggleHighlight(node, sq, color) {
    if (!node) return;
    if (!node.annotations) node.annotations = { arrows: [], highlights: [] };
    const list = node.annotations.highlights;
    const idx = list.findIndex(h => h.sq === sq);
    if (idx >= 0) {
      if (list[idx].color === color) list.splice(idx, 1);
      else list[idx].color = color;
    } else {
      list.push({ sq, color });
    }
  }

  function toggleArrow(node, from, to, color) {
    if (!node || from === to) return;
    if (!node.annotations) node.annotations = { arrows: [], highlights: [] };
    const list = node.annotations.arrows;
    const idx = list.findIndex(a => a.from === from && a.to === to);
    if (idx >= 0) {
      if (list[idx].color === color) list.splice(idx, 1);
      else list[idx].color = color;
    } else {
      list.push({ from, to, color });
    }
  }

  function clearCurrentNodeAnnotations() {
    const node = currentNode();
    if (!node) return;
    node.annotations = { arrows: [], highlights: [] };
    renderAnnotLayer();
  }

  /* ------------------------------------------------------------------
     Panel Renderers (Eval Bar, Engine PV, Tree, Comment, Toolbar/Tabs)
     ------------------------------------------------------------------ */
  function renderEvalBar() {
    if (!els.evalFill || !els.evalText) return;
    const node = currentNode();
    if (ST.mode === 'editor' || !node.evaluation) {
      els.evalFill.style.height = '50%';
      els.evalText.textContent = ST.mode === 'editor' ? 'EDIT' : '0.0';
      return;
    }
    const ev = node.evaluation;
    const pct = window.Engine ? Engine.winPercent(ev.cpWhite) : 50;
    els.evalFill.style.height = pct.toFixed(1) + '%';
    els.evalText.textContent = window.Engine ? Engine.formatEval(ev.cpWhite, ev.mate) : '0.0';
  }

  function formatPvLineSan(fen, pvUcis, maxPlies) {
    if (!window.Chess || !Array.isArray(pvUcis) || !pvUcis.length) return '';
    try {
      const c = new window.Chess(fen);
      const turnCount = parseInt(fen.split(/\s+/)[5] || '1', 10) || 1;
      let moveNo = turnCount;
      const tokens = [];
      const limit = Math.min(pvUcis.length, maxPlies || 8);
      for (let i = 0; i < limit; i++) {
        const u = pvUcis[i];
        if (!u || u.length < 4) break;
        const side = c.turn();
        const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined });
        if (!m) break;
        if (side === 'w') tokens.push(moveNo + '. ' + m.san);
        else tokens.push((i === 0 ? moveNo + '... ' : '') + m.san);
        if (side === 'b') moveNo += 1;
      }
      return tokens.join(' ');
    } catch (e) {
      return pvUcis.slice(0, maxPlies || 6).join(' ');
    }
  }

  function renderEnginePanel(isLoading) {
    const node = currentNode();
    if (!els.nodeEval || !els.engineStatus || !els.pvList) return;
    const ev = node.evaluation;

    if (els.nodeBadge) {
      if (ST.selfAnalysis && ev && ev.clsObj && window.I18N) {
        const cName = ev.clsObj.cls;
        els.nodeBadge.className = 'study-node-badge cls-' + cName;
        els.nodeBadge.style.background = CLS_COLORS[cName] || '#6E7350';
        els.nodeBadge.textContent = (I18N.CLASS_SYMBOL[cName] || '') + ' ' + I18N.classLabel(cName);
        els.nodeBadge.classList.remove('hidden');
      } else {
        els.nodeBadge.classList.add('hidden');
      }
    }

    if (ev && window.Engine) {
      els.nodeEval.textContent = Engine.formatEval(ev.cpWhite, ev.mate);
    } else {
      els.nodeEval.textContent = '+0.00';
    }

    if (!ST.selfAnalysis) {
      els.engineStatus.textContent = T('study.analysisIdle');
      els.pvList.innerHTML = '';
      return;
    }

    if (isLoading && !ev) {
      els.engineStatus.textContent = T('study.analyzing');
      els.pvList.innerHTML = '';
      return;
    }

    try {
      const c = new window.Chess(node.fen);
      if (c.in_checkmate()) {
        const winner = c.turn() === 'w' ? T('ui.blackSide') : T('ui.whiteSide');
        els.engineStatus.textContent = T('study.gameOver', { reason: '#' + ' (' + winner + ')' });
        els.pvList.innerHTML = '';
        return;
      }
      if (c.game_over()) {
        els.engineStatus.textContent = T('study.gameOver', { reason: '1/2 - 1/2' });
        els.pvList.innerHTML = '';
        return;
      }
    } catch (e) { /* ignore */ }

    const depthLabel = ev ? (T('ui.depth', { d: ev.depth || 0 }) + (ev.source ? ' · ' + String(ev.source).toUpperCase() : '')) : T('study.analyzing');
    let commentText = '';
    if (ev && ev.clsObj && window.Engine && typeof Engine.comment === 'function') {
      const ctx = buildMoveCtxForNode(node);
      if (ctx) commentText = Engine.comment(ctx, ev.clsObj, { showBest: true }) || '';
    }
    els.engineStatus.textContent = commentText ? (depthLabel + ' — ' + commentText) : depthLabel;

    els.pvList.innerHTML = '';
    const lines = ev && Array.isArray(ev.lines) ? ev.lines : [];
    lines.forEach((line, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'study-pv-item';
      const score = Engine.formatEval(line.cpWhite, line.mateWhite);
      const pvText = formatPvLineSan(node.fen, line.pv && line.pv.length ? line.pv : [line.uci], 7);
      btn.innerHTML = '<span class="pv-rank">#' + (idx + 1) + '</span>' +
        '<span class="pv-score">' + escapeHtml(score) + '</span>' +
        '<span class="pv-moves">' + escapeHtml(pvText || line.uci || '') + '</span>';
      btn.onclick = () => {
        const firstUci = (line.pv && line.pv[0]) || line.uci;
        if (firstUci && firstUci.length >= 4) {
          commitMoveInTree(firstUci.slice(0, 2), firstUci.slice(2, 4), firstUci.length > 4 ? firstUci[4] : undefined);
        }
      };
      els.pvList.appendChild(btn);
    });
  }

  function formatMoveLabel(node, forceMoveNumber) {
    const moveNo = Math.floor((node.ply - 1) / 2) + 1;
    const isBlack = node.move && node.move.color === 'b';
    if (!isBlack) return moveNo + '. ' + node.move.san;
    if (forceMoveNumber) return moveNo + '... ' + node.move.san;
    return node.move.san;
  }

  function createMoveChip(node, showNum) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'study-move-chip' + (node.id === ST.currentNodeId ? ' active' : '');
    btn.dataset.nodeId = node.id;
    let extra = '';
    if (node.evaluation && node.evaluation.clsObj && window.I18N) {
      const sym = I18N.CLASS_SYMBOL[node.evaluation.clsObj.cls];
      if (sym && ['!!', '!', '?!', '?', '??'].indexOf(sym) >= 0) {
        extra += '<span class="chip-cls">' + escapeHtml(sym) + '</span>';
      }
    }
    if (node.comment && node.comment.trim()) {
      extra += '<span class="chip-note" title="Note">✎</span>';
    }
    btn.innerHTML = '<span class="chip-san">' + escapeHtml(formatMoveLabel(node, showNum)) + '</span>' + extra;
    btn.onclick = () => navigateTo(node.id, true);
    return btn;
  }

  function renderVariationToggle(parentId, count) {
    const collapsed = ST.collapsedIds.has(parentId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'study-var-toggle';
    btn.textContent = (collapsed ? '[+ ' : '[− ') + count + ']';
    btn.onclick = () => {
      if (ST.collapsedIds.has(parentId)) ST.collapsedIds.delete(parentId);
      else ST.collapsedIds.add(parentId);
      renderTree();
    };
    return { collapsed, btn };
  }

  function appendLineFlow(container, startNode, isSubVariation) {
    let cur = startNode;
    let forceNum = true;
    let segEl = document.createElement('div');
    segEl.className = isSubVariation ? 'study-var-line' : 'study-main-line';
    container.appendChild(segEl);

    while (cur) {
      const chip = createMoveChip(cur, forceNum || (cur.move && cur.move.color === 'w'));
      segEl.appendChild(chip);

      if (!cur.children || !cur.children.length) break;

      if (cur.children.length === 1) {
        cur = cur.children[0];
        forceNum = false;
        continue;
      }

      const tog = renderVariationToggle(cur.id, cur.children.length - 1);
      segEl.appendChild(tog.btn);

      if (!tog.collapsed) {
        const varWrap = document.createElement('div');
        varWrap.className = 'study-var-block';
        for (let i = 1; i < cur.children.length; i++) {
          appendLineFlow(varWrap, cur.children[i], true);
        }
        container.appendChild(varWrap);
      }

      cur = cur.children[0];
      segEl = document.createElement('div');
      segEl.className = isSubVariation ? 'study-var-line' : 'study-main-line';
      container.appendChild(segEl);
      forceNum = true;
    }
  }

  function renderTree() {
    const box = els.treeBox;
    if (!box) return;
    box.innerHTML = '';

    const rootRow = document.createElement('div');
    rootRow.className = 'study-root-row';
    const rootBtn = document.createElement('button');
    rootBtn.type = 'button';
    rootBtn.className = 'study-root-btn' + (ST.currentNodeId === 'root' ? ' active' : '');
    rootBtn.textContent = T('study.rootLabel');
    rootBtn.onclick = () => navigateTo('root', false);
    rootRow.appendChild(rootBtn);
    box.appendChild(rootRow);

    const root = ST.study.root;
    if (!root.children.length) {
      const empty = document.createElement('div');
      empty.className = 'study-tree-empty';
      empty.textContent = T('study.rootPrompt');
      box.appendChild(empty);
    } else {
      if (root.children.length > 1) {
        const tog = renderVariationToggle('root', root.children.length - 1);
        rootRow.appendChild(tog.btn);
        if (!tog.collapsed) {
          const varWrap = document.createElement('div');
          varWrap.className = 'study-var-block';
          for (let i = 1; i < root.children.length; i++) {
            appendLineFlow(varWrap, root.children[i], true);
          }
          box.appendChild(varWrap);
        }
      }
      appendLineFlow(box, root.children[0], false);
    }

    const activeChip = box.querySelector('.study-move-chip.active, .study-root-btn.active');
    if (activeChip && typeof activeChip.scrollIntoView === 'function') {
      try { activeChip.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* ignore */ }
    }

    // Node action button states
    const cur = currentNode();
    const parent = cur && cur.parentId ? ST.nodesById.get(cur.parentId) : null;
    if (els.promoteBtn) {
      els.promoteBtn.disabled = !parent || parent.children.indexOf(cur) <= 0;
    }
    if (els.deleteNodeBtn) {
      els.deleteNodeBtn.disabled = cur.id === 'root' && !cur.children.length;
    }
  }

  function renderCommentBox() {
    if (!els.commentInput) return;
    const node = currentNode();
    if (els.commentInput.value !== (node.comment || '')) {
      els.commentInput.value = node.comment || '';
    }
    els.commentInput.placeholder = T('study.commentPlaceholder');
  }

  function syncModeAndToggleUI() {
    if (els.workspace) {
      els.workspace.dataset.mode = ST.mode;
      els.workspace.dataset.mobileTab = ST.mobileTab;
    }
    if (els.modeEditorBtn) els.modeEditorBtn.classList.toggle('active', ST.mode === 'editor');
    if (els.modePlayBtn) els.modePlayBtn.classList.toggle('active', ST.mode === 'play');
    if (els.panelEditor) els.panelEditor.classList.toggle('hidden', ST.mode !== 'editor');
    if (els.panelEngine) els.panelEngine.classList.toggle('hidden', ST.mode === 'editor');
    if (els.panelDraw) els.panelDraw.classList.toggle('hidden', ST.mode === 'editor');

    document.querySelectorAll('#study-mobile-tabs .study-mob-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === ST.mobileTab);
    });

    if (els.analysisBtn) {
      els.analysisBtn.classList.toggle('on', ST.selfAnalysis);
      els.analysisBtn.textContent = T(ST.selfAnalysis ? 'study.analysisOn' : 'study.analysisOff');
    }

    if (els.drawModeBtn) {
      els.drawModeBtn.classList.toggle('on', ST.drawMode);
    }
    document.querySelectorAll('#study-draw-colors .study-color-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === ST.drawColor);
    });

    const titleEl = $('study-title-input');
    if (titleEl && document.activeElement !== titleEl) {
      titleEl.value = ST.study.title || '';
      titleEl.placeholder = T('study.titlePlaceholder');
    }

    syncNavButtons();
  }

  function syncNavButtons() {
    const cur = currentNode();
    const isEd = ST.mode === 'editor';
    const hasParent = !!(cur && cur.parentId);
    const hasChild = !!(cur && cur.children && cur.children.length);
    const parent = hasParent ? ST.nodesById.get(cur.parentId) : null;
    const hasSibling = !!(parent && parent.children.length > 1);

    if (els.navStart) els.navStart.disabled = isEd || !hasParent;
    if (els.navPrev) els.navPrev.disabled = isEd || !hasParent;
    if (els.navNext) els.navNext.disabled = isEd || !hasChild;
    if (els.navEnd) els.navEnd.disabled = isEd || !hasChild;
    if (els.navPrevVar) els.navPrevVar.disabled = isEd || !hasSibling;
    if (els.navNextVar) els.navNextVar.disabled = isEd || !hasSibling;
  }

  function renderAll() {
    syncModeAndToggleUI();
    if (ST.mode === 'editor') syncEditorControlsUI();
    renderBoard();
    renderEngineArrow();
    renderAnnotLayer();
    renderEvalBar();
    renderEnginePanel(false);
    renderTree();
    renderCommentBox();
    syncToolbarSettingsUI();
  }

  function syncToolbarSettingsUI() {
    const s = window.YStorage ? YStorage.getSettings() : { audio: true, showCoords: true };
    if (els.langBtn && window.I18N) els.langBtn.textContent = I18N.lang === 'vi' ? 'VI' : 'EN';
    if (els.audioBtn) {
      els.audioBtn.innerHTML = '<i class="fas ' + (s.audio ? 'fa-volume-up' : 'fa-volume-mute') + '"></i> ' + (s.audio ? 'ON' : 'OFF');
    }
    if (els.board) els.board.classList.toggle('no-coords', !s.showCoords);
  }

  /* ------------------------------------------------------------------
     Board Pointer Interaction (Play / Draw Telestrator / Editor)
     ------------------------------------------------------------------ */
  function squareFromPoint(x, y) {
    if (!els.board) return null;
    const r = els.board.getBoundingClientRect();
    if (x < r.left || x >= r.right || y < r.top || y >= r.bottom) return null;
    const col = Math.floor((x - r.left) / r.width * 8);
    const row = Math.floor((y - r.top) / r.height * 8);
    const file = ST.orientation === 'w' ? col : 7 - col;
    const rank = ST.orientation === 'w' ? 7 - row : row;
    return FILES[file] + (rank + 1);
  }

  function modifierColor(e) {
    if (e.shiftKey && e.altKey) return 'yellow';
    if (e.shiftKey) return 'red';
    if (e.altKey) return 'blue';
    return 'green';
  }

  function makeGhostSvg(color, type) {
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost study-drag-ghost';
    ghost.innerHTML = pieceSVG(color, type);
    document.body.appendChild(ghost);
    return ghost;
  }

  function cleanupDrags() {
    if (drag && drag.ghost) drag.ghost.remove();
    if (drag && drag.originSq && boardSquares[drag.originSq]) {
      boardSquares[drag.originSq]._piece.style.opacity = '';
    }
    if (edDrag && edDrag.ghost) edDrag.ghost.remove();
    if (edDrag && edDrag.originSq && boardSquares[edDrag.originSq]) {
      boardSquares[edDrag.originSq]._piece.style.opacity = '';
    }
    drag = null;
    drawDrag = null;
    edDrag = null;
    Object.values(boardSquares).forEach(s => s.classList.remove('drag-over'));
  }

  function onBoardPointerDown(e) {
    if (!ST.active) return;
    const sq = squareFromPoint(e.clientX, e.clientY);
    if (!sq) return;

    // 1. Desktop Right-Click Telestrator (Play Mode)
    if (e.button === 2 && ST.mode === 'play') {
      e.preventDefault();
      drawDrag = {
        pointerId: e.pointerId,
        startSq: sq,
        curSq: sq,
        color: modifierColor(e)
      };
      try { els.board.setPointerCapture(e.pointerId); } catch (ex) { /* ignore */ }
      renderAnnotLayer({ sq, color: drawDrag.color });
      return;
    }

    if (e.button !== 0) return;

    // 2. Touch Draw Mode (Play Mode)
    if (ST.mode === 'play' && ST.drawMode) {
      e.preventDefault();
      drawDrag = {
        pointerId: e.pointerId,
        startSq: sq,
        curSq: sq,
        color: ST.drawColor
      };
      try { els.board.setPointerCapture(e.pointerId); } catch (ex) { /* ignore */ }
      renderAnnotLayer({ sq, color: drawDrag.color });
      return;
    }

    // 3. Board Editor Interaction
    if (ST.mode === 'editor') {
      e.preventDefault();
      handleEditorBoardDown(e, sq);
      return;
    }

    // 4. Play Mode: Piece Selection & Legal Move Execution (left-click NEVER clears annotations!)
    const node = currentNode();
    const chess = new window.Chess(node.fen);
    const p = chess.get(sq);

    if (ST.selectedSq) {
      const targetLegal = ST.legalMoves.some(m => m.to === sq);
      if (targetLegal) {
        const from = ST.selectedSq;
        ST.selectedSq = null;
        ST.legalMoves = [];
        commitMoveInTree(from, sq);
        return;
      }
    }

    if (p && p.color === chess.turn()) {
      const isSame = ST.selectedSq === sq;
      ST.selectedSq = sq;
      ST.legalMoves = chess.moves({ square: sq, verbose: true });
      renderBoard();
      const ghost = makeGhostSvg(p.color, p.type);
      drag = {
        pointerId: e.pointerId,
        originSq: sq,
        color: p.color,
        type: p.type,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        wasSelected: isSame,
        ghost
      };
      ghost.style.display = 'none';
      try { els.board.setPointerCapture(e.pointerId); } catch (ex) { /* ignore */ }
      return;
    }

    if (ST.selectedSq) {
      ST.selectedSq = null;
      ST.legalMoves = [];
      renderBoard();
    }
  }

  function handleEditorBoardDown(e, sq) {
    const tool = ST.editorTool;
    if (tool === 'erase') {
      if (ST.editorMap[sq]) {
        delete ST.editorMap[sq];
        ST.editorSelectedSq = null;
        ST.editorDirty = true;
        sound('select');
        syncEditorControlsUI();
        renderBoard();
      }
      return;
    }

    if (tool && tool.length === 2 && 'wb'.indexOf(tool[0]) >= 0 && 'pnbrqk'.indexOf(tool[1]) >= 0) {
      const pColor = tool[0];
      const pType = tool[1];
      if (ST.editorMap[sq] && ST.editorMap[sq].color === pColor && ST.editorMap[sq].type === pType) {
        delete ST.editorMap[sq];
      } else {
        ST.editorMap[sq] = { color: pColor, type: pType };
      }
      ST.editorDirty = true;
      sound('move');
      syncEditorControlsUI();
      renderBoard();
      return;
    }

    // Move tool: click-to-move OR drag-to-move/delete-off-board
    if (ST.editorSelectedSq) {
      if (ST.editorSelectedSq === sq) {
        ST.editorSelectedSq = null;
        renderBoard();
        return;
      }
      const moving = ST.editorMap[ST.editorSelectedSq];
      if (moving) {
        ST.editorMap[sq] = moving;
        delete ST.editorMap[ST.editorSelectedSq];
        ST.editorSelectedSq = null;
        ST.editorDirty = true;
        sound('move');
        syncEditorControlsUI();
        renderBoard();
        return;
      }
    }

    const existing = ST.editorMap[sq];
    if (existing) {
      const ghost = makeGhostSvg(existing.color, existing.type);
      ghost.style.display = 'none';
      edDrag = {
        pointerId: e.pointerId,
        source: 'board',
        originSq: sq,
        color: existing.color,
        type: existing.type,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        ghost
      };
      try { els.board.setPointerCapture(e.pointerId); } catch (ex) { /* ignore */ }
    }
  }

  function onGlobalPointerMove(e) {
    if (!ST.active) return;

    if (drawDrag && e.pointerId === drawDrag.pointerId) {
      const sq = squareFromPoint(e.clientX, e.clientY);
      if (sq && sq !== drawDrag.curSq) {
        drawDrag.curSq = sq;
        if (sq === drawDrag.startSq) renderAnnotLayer({ sq, color: drawDrag.color });
        else renderAnnotLayer({ from: drawDrag.startSq, to: sq, color: drawDrag.color });
      }
      return;
    }

    if (drag && e.pointerId === drag.pointerId) {
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.active && dist > 6) {
        drag.active = true;
        drag.ghost.style.display = 'flex';
        if (boardSquares[drag.originSq]) boardSquares[drag.originSq]._piece.style.opacity = '0.25';
      }
      if (drag.active) {
        drag.ghost.style.left = e.clientX + 'px';
        drag.ghost.style.top = e.clientY + 'px';
        const overSq = squareFromPoint(e.clientX, e.clientY);
        Object.values(boardSquares).forEach(s => s.classList.remove('drag-over'));
        if (overSq && ST.legalMoves.some(m => m.to === overSq) && boardSquares[overSq]) {
          boardSquares[overSq].classList.add('drag-over');
        }
      }
      return;
    }

    if (edDrag && e.pointerId === edDrag.pointerId) {
      const dist = Math.hypot(e.clientX - edDrag.startX, e.clientY - edDrag.startY);
      if (!edDrag.active && dist > 5) {
        edDrag.active = true;
        edDrag.ghost.style.display = 'flex';
        if (edDrag.originSq && boardSquares[edDrag.originSq]) {
          boardSquares[edDrag.originSq]._piece.style.opacity = '0.25';
        }
      }
      if (edDrag.active) {
        edDrag.ghost.style.left = e.clientX + 'px';
        edDrag.ghost.style.top = e.clientY + 'px';
        const overSq = squareFromPoint(e.clientX, e.clientY);
        Object.values(boardSquares).forEach(s => s.classList.remove('drag-over'));
        if (overSq && boardSquares[overSq]) boardSquares[overSq].classList.add('drag-over');
      }
    }
  }

  function onGlobalPointerUp(e) {
    if (!ST.active) return;

    if (drawDrag && e.pointerId === drawDrag.pointerId) {
      const endSq = squareFromPoint(e.clientX, e.clientY) || drawDrag.curSq;
      const node = currentNode();
      if (endSq) {
        if (endSq === drawDrag.startSq) toggleHighlight(node, endSq, drawDrag.color);
        else toggleArrow(node, drawDrag.startSq, endSq, drawDrag.color);
      }
      drawDrag = null;
      renderAnnotLayer();
      return;
    }

    if (drag && e.pointerId === drag.pointerId) {
      const d = drag;
      drag = null;
      d.ghost.remove();
      if (boardSquares[d.originSq]) boardSquares[d.originSq]._piece.style.opacity = '';
      Object.values(boardSquares).forEach(s => s.classList.remove('drag-over'));

      if (d.active) {
        const dropSq = squareFromPoint(e.clientX, e.clientY);
        if (dropSq && ST.legalMoves.some(m => m.to === dropSq)) {
          ST.selectedSq = null;
          ST.legalMoves = [];
          commitMoveInTree(d.originSq, dropSq);
          return;
        }
        renderBoard();
      } else if (d.wasSelected) {
        ST.selectedSq = null;
        ST.legalMoves = [];
        renderBoard();
      }
      return;
    }

    if (edDrag && e.pointerId === edDrag.pointerId) {
      const ed = edDrag;
      edDrag = null;
      ed.ghost.remove();
      if (ed.originSq && boardSquares[ed.originSq]) boardSquares[ed.originSq]._piece.style.opacity = '';
      Object.values(boardSquares).forEach(s => s.classList.remove('drag-over'));

      const dropSq = squareFromPoint(e.clientX, e.clientY);
      if (!ed.active && ed.source === 'board' && ed.originSq) {
        // Click select in Move tool
        ST.editorSelectedSq = ST.editorSelectedSq === ed.originSq ? null : ed.originSq;
        renderBoard();
        return;
      }

      if (ed.source === 'palette') {
        if (dropSq) {
          ST.editorMap[dropSq] = { color: ed.color, type: ed.type };
          ST.editorDirty = true;
          sound('move');
          syncEditorControlsUI();
          renderBoard();
        }
        return;
      }

      if (ed.source === 'board' && ed.originSq) {
        if (dropSq) {
          if (dropSq !== ed.originSq) {
            ST.editorMap[dropSq] = { color: ed.color, type: ed.type };
            delete ST.editorMap[ed.originSq];
            ST.editorDirty = true;
            sound('move');
          }
        } else {
          // Dragged off board -> delete piece!
          delete ST.editorMap[ed.originSq];
          ST.editorDirty = true;
          sound('select');
        }
        ST.editorSelectedSq = null;
        syncEditorControlsUI();
        renderBoard();
      }
    }
  }

  /* ------------------------------------------------------------------
     Palette Builder
     ------------------------------------------------------------------ */
  function buildEditorPalette() {
    const buildColorRow = (color, containerId) => {
      const box = $(containerId);
      if (!box) return;
      box.innerHTML = '';
      ['k', 'q', 'r', 'b', 'n', 'p'].forEach(type => {
        const code = color + type;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'themebutton study-piece-btn';
        btn.dataset.tool = code;
        btn.innerHTML = pieceSVG(color, type);
        btn.addEventListener('pointerdown', (e) => {
          if (e.button !== 0 || ST.mode !== 'editor') return;
          ST.editorTool = code;
          ST.editorSelectedSq = null;
          syncEditorControlsUI();
          const ghost = makeGhostSvg(color, type);
          ghost.style.display = 'none';
          edDrag = {
            pointerId: e.pointerId,
            source: 'palette',
            color,
            type,
            startX: e.clientX,
            startY: e.clientY,
            active: false,
            ghost
          };
        });
        box.appendChild(btn);
      });
    };
    buildColorRow('w', 'study-palette-white');
    buildColorRow('b', 'study-palette-black');
  }

  /* ------------------------------------------------------------------
     Export Branch & Study Archive (Strictly Separated from Match Saves)
     ------------------------------------------------------------------ */
  function computeBranchResult(fen) {
    if (!window.Chess) return '*';
    try {
      const c = new window.Chess(fen);
      if (c.in_checkmate()) return c.turn() === 'w' ? '0-1' : '1-0';
      if (c.in_draw() || c.in_stalemate() || c.in_threefold_repetition()) return '1/2-1/2';
    } catch (e) { /* ignore */ }
    return '*';
  }

  function exportSelectedBranch() {
    const path = getPathToNode(ST.currentNodeId);
    if (path.length <= 1) {
      sound('error');
      toast(T('study.branchEmpty'), true);
      return;
    }
    const profile = window.YStorage ? YStorage.getProfile() : { p1: { name: 'Player 1', elo: 600 }, p2: { name: 'Study', elo: 600 } };
    const moves = [];
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const cur = path[i];
      if (!cur.move) continue;
      moves.push({
        ply: i,
        san: cur.move.san,
        uci: cur.move.uci,
        color: cur.move.color,
        piece: cur.move.piece,
        captured: cur.move.captured || null,
        flags: cur.move.flags || '',
        fenBefore: prev.fen,
        fenAfter: cur.fen
      });
    }
    const matchObj = {
      format: 'yorha-chess-match',
      version: 1,
      id: 'st_branch_' + Date.now(),
      timestamp: new Date().toISOString(),
      mode: 'study',
      startFen: ST.study.initialFen,
      result: computeBranchResult(path[path.length - 1].fen),
      termination: 'study',
      white: { name: profile.p1.name || 'White', elo: profile.p1.elo || 600, botId: null },
      black: { name: (ST.study.title && ST.study.title.trim()) || T('study.untitled'), elo: profile.p2.elo || 600, botId: null },
      moves
    };
    const file = YStorage.exportMatch(matchObj, 'NieR_Chess_Study_Branch_');
    sound('confirm');
    toast(T('study.exportedBranchToast', { n: moves.length, file }));
  }

  function saveCurrentStudy() {
    if (!window.YStorage) return;
    const titleInput = $('study-title-input');
    const titleVal = titleInput ? titleInput.value.trim() : '';
    ST.study.title = titleVal || T('study.untitled');
    const saved = YStorage.saveStudy(ST.study);
    if (saved) {
      ST.study = saved;
      rebuildIndex();
      syncModeAndToggleUI();
      sound('confirm');
      toast(T('study.savedToast', { title: saved.title }));
    }
  }

  function exportFullStudy() {
    if (!window.YStorage) return;
    const titleInput = $('study-title-input');
    if (titleInput && titleInput.value.trim()) ST.study.title = titleInput.value.trim();
    const file = YStorage.exportStudyFile(ST.study);
    if (file) {
      sound('confirm');
      toast(T('archive.exported', { file }));
    }
  }

  async function importStudyFromFile(file) {
    if (!window.YStorage || !file) return;
    try {
      const data = await YStorage.importStudyFile(file);
      ST.study = {
        format: 'yorha-chess-study',
        version: 1,
        id: data.id || null,
        title: data.title || T('study.untitled'),
        initialFen: data.initialFen || data.root.fen,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        root: data.root
      };
      ST.collapsedIds.clear();
      rebuildIndex();
      ST.mode = 'play';
      navigateTo('root', false);
      if (window.App && typeof window.App.closeModal === 'function') window.App.closeModal('modal-study-archive');
      sound('confirm');
      toast(T('study.importedToast', { title: ST.study.title }));
    } catch (e) {
      sound('error');
      toast(T('archive.importFail'), true);
    }
  }

  async function newBlankStudy() {
    if (ST.study.root.children.length > 0 && !(await askConfirm(T('study.newStudyConfirm')))) return;
    if (window.Engine) Engine.cancelAnalysis('study');
    ST.study = createEmptyStudy();
    ST.collapsedIds.clear();
    rebuildIndex();
    ST.mode = 'play';
    navigateTo('root', false);
    sound('confirm');
  }

  function renderStudyArchive() {
    const listEl = $('study-archive-list');
    if (!listEl || !window.YStorage) return;
    const list = YStorage.listStudies();
    listEl.innerHTML = '';
    if (!list.length) {
      listEl.innerHTML = '<div class="empty-msg">' + escapeHtml(T('study.archiveEmpty')) + '</div>';
      return;
    }
    const langTag = window.I18N && I18N.lang === 'vi' ? 'vi-VN' : 'en-US';
    list.forEach(st => {
      const item = document.createElement('div');
      item.className = 'archive-item';
      const d = new Date(st.updatedAt || st.createdAt || Date.now());
      const nodeCount = countTreeNodes(st.root);
      const customFen = st.initialFen && st.initialFen !== getStartFen();

      const main = document.createElement('div');
      main.className = 'ar-main';
      main.innerHTML =
        '<div class="ar-title">' + escapeHtml(st.title || T('study.untitled')) +
        (customFen ? ' <span class="study-fen-badge">FEN</span>' : '') + '</div>' +
        '<div class="ar-meta">' + escapeHtml(d.toLocaleString(langTag)) + ' · ' +
        escapeHtml(T('study.archiveNodes', { n: nodeCount })) + '</div>';
      main.onclick = () => {
        ST.study = JSON.parse(JSON.stringify(st));
        ST.collapsedIds.clear();
        rebuildIndex();
        ST.mode = 'play';
        navigateTo('root', false);
        if (window.App && typeof window.App.closeModal === 'function') window.App.closeModal('modal-study-archive');
        sound('confirm');
      };

      const act = document.createElement('div');
      act.className = 'ar-act';

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.textContent = T('study.archiveOpen');
      openBtn.onclick = (ev) => { ev.stopPropagation(); main.onclick(); };

      const renBtn = document.createElement('button');
      renBtn.type = 'button';
      renBtn.textContent = T('study.renameStudy');
      renBtn.onclick = (ev) => {
        ev.stopPropagation();
        const titleDiv = main.querySelector('.ar-title');
        if (!titleDiv || titleDiv.querySelector('.study-rename-input')) return;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 64;
        inp.className = 'popup-input study-rename-input';
        inp.value = st.title || '';
        inp.onclick = (e2) => e2.stopPropagation();
        let done = false;
        const commitRename = (saveChange) => {
          if (done) return;
          done = true;
          if (saveChange) {
            const newTitle = inp.value.trim() || T('study.untitled');
            const updated = YStorage.saveStudy(Object.assign({}, st, { title: newTitle }));
            if (updated && ST.study.id === st.id) {
              ST.study.title = updated.title;
              syncModeAndToggleUI();
            }
            sound('confirm');
          }
          renderStudyArchive();
        };
        inp.onkeydown = (e2) => {
          if (e2.key === 'Enter') { e2.preventDefault(); commitRename(true); }
          else if (e2.key === 'Escape') { e2.preventDefault(); commitRename(false); }
        };
        inp.onblur = () => commitRename(true);
        titleDiv.innerHTML = '';
        titleDiv.appendChild(inp);
        inp.focus();
        inp.select();
      };

      const expBtn = document.createElement('button');
      expBtn.type = 'button';
      expBtn.textContent = 'JSON';
      expBtn.onclick = (ev) => {
        ev.stopPropagation();
        const file = YStorage.exportStudyFile(st);
        if (file) toast(T('archive.exported', { file }));
      };

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = T('study.archiveDelete');
      delBtn.onclick = async (ev) => {
        ev.stopPropagation();
        if (!(await askConfirm(T('study.archiveDeleteConfirm', { title: st.title || T('study.untitled') })))) return;
        YStorage.deleteStudy(st.id);
        renderStudyArchive();
        sound('cancel');
      };

      act.appendChild(openBtn);
      act.appendChild(renBtn);
      act.appendChild(expBtn);
      act.appendChild(delBtn);
      item.appendChild(main);
      item.appendChild(act);
      listEl.appendChild(item);
    });
  }

  /* ------------------------------------------------------------------
     Keyboard Shortcuts & Binding
     ------------------------------------------------------------------ */
  function isModalOpen() {
    return !!document.querySelector('.modal:not(.hidden)');
  }

  function onKeyDown(e) {
    if (!ST.active) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (isModalOpen()) return;

    const k = e.key;
    if (ST.mode === 'play') {
      if (k === 'ArrowLeft') { e.preventDefault(); prevNode(); return; }
      if (k === 'ArrowRight') { e.preventDefault(); nextNode(); return; }
      if (k === 'ArrowUp') { e.preventDefault(); switchSibling(-1); return; }
      if (k === 'ArrowDown') { e.preventDefault(); switchSibling(+1); return; }
      if (k === 'Home') { e.preventDefault(); navigateTo('root', false); return; }
      if (k === 'End') { e.preventDefault(); endOfMainline(); return; }
      if (k === 'l' || k === 'L') { e.preventDefault(); setSelfAnalysis(!ST.selfAnalysis); return; }
      if (k === 'c' || k === 'C') { e.preventDefault(); clearCurrentNodeAnnotations(); sound('cancel'); return; }
    }
    if (k === 'f' || k === 'F') {
      e.preventDefault();
      ST.orientation = ST.orientation === 'w' ? 'b' : 'w';
      buildStudyBoard();
      renderAll();
      return;
    }
    if (k === 'e' || k === 'E') {
      e.preventDefault();
      enterMode(ST.mode === 'editor' ? 'play' : 'editor');
    }
  }

  function bindEvents() {
    els.board.addEventListener('pointerdown', onBoardPointerDown);
    els.board.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', cleanupDrags);
    document.addEventListener('keydown', onKeyDown);

    // Top Toolbar
    $('study-btn-back-menu').onclick = () => {
      if (window.App && typeof window.App.showMenuScreen === 'function') window.App.showMenuScreen(true);
    };
    $('study-btn-new').onclick = newBlankStudy;
    $('study-btn-save').onclick = saveCurrentStudy;
    $('study-btn-archive').onclick = () => {
      renderStudyArchive();
      if (window.App && typeof window.App.openModal === 'function') window.App.openModal('modal-study-archive');
    };
    $('study-btn-lang').onclick = () => {
      if (window.I18N) I18N.setLang(I18N.lang === 'vi' ? 'en' : 'vi');
    };
    $('study-btn-audio').onclick = () => {
      if (!window.YStorage) return;
      const s = YStorage.saveSettings({ audio: !YStorage.getSettings().audio });
      if (window.YoRHaAudio) YoRHaAudio.setEnabled(s.audio);
      syncToolbarSettingsUI();
      if (window.App && typeof window.App.syncSettingsUI === 'function') window.App.syncSettingsUI();
      sound('confirm');
    };
    $('study-btn-settings').onclick = () => {
      if (window.App) {
        if (typeof window.App.syncSettingsUI === 'function') window.App.syncSettingsUI();
        if (typeof window.App.openModal === 'function') window.App.openModal('modal-settings');
      }
    };

    const titleInput = $('study-title-input');
    if (titleInput) {
      titleInput.oninput = (e) => { ST.study.title = e.target.value; };
    }

    // Mode switch
    els.modeEditorBtn.onclick = () => enterMode('editor');
    els.modePlayBtn.onclick = () => enterMode('play');

    // Editor tools
    document.querySelectorAll('#study-panel-editor .study-tool-btn').forEach(btn => {
      btn.onclick = () => {
        ST.editorTool = btn.dataset.tool || 'move';
        ST.editorSelectedSq = null;
        syncEditorControlsUI();
        renderBoard();
      };
    });
    $('study-btn-startpos').onclick = () => {
      ST.editorMap = boardMapFromFen(getStartFen());
      ST.editorTurn = 'w';
      ST.editorCastle = { K: true, Q: true, k: true, q: true };
      ST.editorSelectedSq = null;
      ST.editorDirty = true;
      syncEditorControlsUI();
      renderBoard();
    };
    $('study-btn-clear').onclick = () => {
      ST.editorMap = {};
      ST.editorTurn = 'w';
      ST.editorCastle = { K: false, Q: false, k: false, q: false };
      ST.editorSelectedSq = null;
      ST.editorDirty = true;
      syncEditorControlsUI();
      renderBoard();
    };
    $('study-btn-flip-ed').onclick = $('study-btn-flip').onclick = () => {
      ST.orientation = ST.orientation === 'w' ? 'b' : 'w';
      buildStudyBoard();
      renderAll();
    };
    $('study-turn-w').onclick = () => {
      ST.editorTurn = 'w';
      ST.editorDirty = true;
      syncEditorControlsUI();
    };
    $('study-turn-b').onclick = () => {
      ST.editorTurn = 'b';
      ST.editorDirty = true;
      syncEditorControlsUI();
    };
    ['K', 'Q', 'k', 'q'].forEach(k => {
      const cb = $('study-castle-' + k);
      if (cb) {
        cb.onchange = () => {
          ST.editorCastle[k] = cb.checked;
          ST.editorDirty = true;
          syncEditorControlsUI();
        };
      }
    });
    els.fenInput.oninput = (e) => {
      const parsed = parseFenIntoEditor(e.target.value);
      if (!parsed) {
        els.fenInput.classList.add('invalid');
        if (els.legalMsg) {
          els.legalMsg.textContent = T('study.fenInvalid');
          els.legalMsg.classList.remove('ok');
          els.legalMsg.classList.add('err');
        }
        if (els.commitBtn) els.commitBtn.disabled = true;
        return;
      }
      els.fenInput.classList.remove('invalid');
      ST.editorMap = parsed.boardMap;
      ST.editorTurn = parsed.turn;
      ST.editorCastle = sanitizeCastleFlags(parsed.boardMap, parsed.castle);
      ST.editorSelectedSq = null;
      ST.editorDirty = true;
      const val = validatePosition(ST.editorMap, ST.editorTurn, ST.editorCastle);
      if (els.legalMsg) {
        els.legalMsg.textContent = T(val.key);
        els.legalMsg.classList.toggle('ok', !!val.ok);
        els.legalMsg.classList.toggle('err', !val.ok);
      }
      if (els.commitBtn) els.commitBtn.disabled = !val.ok;
      ['K', 'Q', 'k', 'q'].forEach(k => {
        const cb = $('study-castle-' + k);
        if (cb) cb.checked = !!ST.editorCastle[k];
      });
      $('study-turn-w').classList.toggle('active', ST.editorTurn === 'w');
      $('study-turn-b').classList.toggle('active', ST.editorTurn === 'b');
      renderBoard();
    };
    $('study-btn-copy-fen').onclick = () => {
      const fen = els.fenInput ? els.fenInput.value : currentNode().fen;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fen).then(() => toast(T('study.fenCopied'))).catch(() => {});
      } else if (els.fenInput) {
        els.fenInput.select();
        try { document.execCommand('copy'); toast(T('study.fenCopied')); } catch (ex) { /* ignore */ }
      }
    };
    els.commitBtn.onclick = commitEditorPosition;

    // Self-Analysis & Annotations
    els.analysisBtn.onclick = () => setSelfAnalysis(!ST.selfAnalysis);
    els.drawModeBtn.onclick = () => {
      ST.drawMode = !ST.drawMode;
      syncModeAndToggleUI();
    };
    $('study-btn-clear-annot').onclick = () => { clearCurrentNodeAnnotations(); sound('cancel'); };
    document.querySelectorAll('#study-draw-colors .study-color-swatch').forEach(btn => {
      btn.onclick = () => {
        ST.drawColor = btn.dataset.color || 'green';
        syncModeAndToggleUI();
      };
    });

    // Export / Import
    $('study-btn-export-branch').onclick = exportSelectedBranch;
    $('study-btn-export-study').onclick = exportFullStudy;
    $('study-btn-import-study').onclick = () => $('study-import-file').click();
    $('study-import-file').onchange = (e) => {
      const f = e.target.files[0];
      if (f) importStudyFromFile(f);
      e.target.value = '';
    };
    $('study-modal-import-btn').onclick = () => $('study-modal-import-file').click();
    $('study-modal-import-file').onchange = (e) => {
      const f = e.target.files[0];
      if (f) importStudyFromFile(f);
      e.target.value = '';
    };

    // Tree Navigation & Node Actions
    els.navStart.onclick = () => navigateTo('root', false);
    els.navPrev.onclick = prevNode;
    els.navNext.onclick = nextNode;
    els.navEnd.onclick = endOfMainline;
    els.navPrevVar.onclick = () => switchSibling(-1);
    els.navNextVar.onclick = () => switchSibling(+1);

    els.promoteBtn.onclick = promoteCurrentNode;
    els.deleteNodeBtn.onclick = deleteCurrentBranch;

    els.commentInput.oninput = (e) => {
      const n = currentNode();
      if (n) n.comment = e.target.value;
    };

    // Mobile Sub-Tab Switcher
    document.querySelectorAll('#study-mobile-tabs .study-mob-tab').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab || 'tree';
        ST.mobileTab = tab;
        if (tab === 'editor' && ST.mode !== 'editor') {
          enterMode('editor');
          return;
        }
        if (tab !== 'editor' && ST.mode === 'editor') {
          enterMode('play');
          return;
        }
        syncModeAndToggleUI();
      };
    });
  }

  function cacheElements() {
    els.screen = $('screen-study');
    els.workspace = $('study-workspace');
    els.board = $('study-board');
    els.engineArrowGroup = $('study-engine-arrow-group');
    els.annotHighlights = $('study-annot-highlights');
    els.annotArrows = $('study-annot-arrows');
    els.evalBar = $('study-eval-bar');
    els.evalFill = $('study-eval-fill');
    els.evalText = $('study-eval-text');
    els.modeEditorBtn = $('study-mode-editor-btn');
    els.modePlayBtn = $('study-mode-play-btn');
    els.panelEditor = $('study-panel-editor');
    els.panelEngine = $('study-panel-engine');
    els.panelDraw = $('study-panel-draw');
    els.fenInput = $('study-fen-input');
    els.legalMsg = $('study-legal-msg');
    els.commitBtn = $('study-btn-commit');
    els.analysisBtn = $('study-btn-analysis');
    els.nodeEval = $('study-node-eval');
    els.nodeBadge = $('study-node-badge');
    els.engineStatus = $('study-engine-status');
    els.pvList = $('study-pv-list');
    els.drawModeBtn = $('study-btn-draw-mode');
    els.treeBox = $('study-tree-box');
    els.promoteBtn = $('study-btn-promote');
    els.deleteNodeBtn = $('study-btn-delete-node');
    els.commentInput = $('study-node-comment');
    els.navStart = $('study-nav-start');
    els.navPrev = $('study-nav-prev');
    els.navNext = $('study-nav-next');
    els.navEnd = $('study-nav-end');
    els.navPrevVar = $('study-nav-prev-var');
    els.navNextVar = $('study-nav-next-var');
    els.langBtn = $('study-btn-lang');
    els.audioBtn = $('study-btn-audio');
  }

  function init() {
    if (inited) return;
    inited = true;
    cacheElements();
    if (!els.screen || !els.board) return;
    rebuildIndex();
    buildEditorPalette();
    buildStudyBoard();
    bindEvents();
    renderAll();
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */
  window.Study = {
    init,
    open() {
      init();
      ST.active = true;
      buildStudyBoard();
      renderAll();
      if (ST.mode === 'play' && ST.selfAnalysis) triggerAnalysisForCurrentNode();
    },
    onLeave() {
      ST.active = false;
      cleanupDrags();
      if (window.Engine) Engine.cancelAnalysis('study');
    },
    applyLanguage() {
      if (!inited) return;
      renderAll();
    },
    syncSettingsUI() {
      if (!inited) return;
      syncToolbarSettingsUI();
    },
    _test: {
      ST,
      EMPTY_BOARD_FEN,
      createEmptyStudy,
      createRootNode,
      boardMapFromFen,
      buildFenFromEditorState,
      validatePosition,
      parseFenIntoEditor,
      countTreeNodes,
      rebuildIndex,
      getPathToNode,
      commitMoveInTree,
      promoteCurrentNode,
      toggleHighlight,
      toggleArrow,
      navigateTo,
      computeBranchResult
    }
  };
})();
