/* =====================================================================
   YoRHa Tactical Chess System — storage.js
   Global: YStorage
   - Profile cache (yorha_chess_profile)
   - Settings persistence (yorha_chess_settings)
   - Match archive (yorha_chess_saves) + .json export / import
   - Puzzle progress (yorha_chess_puzzles_solved)
   ===================================================================== */
(function () {
  'use strict';

  const KEYS = {
    profile: 'yorha_chess_profile',
    settings: 'yorha_chess_settings',
    saves: 'yorha_chess_saves',
    studies: 'yorha_chess_studies',
    solved: 'yorha_chess_puzzles_solved'
  };

  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const DEFAULT_PROFILE = {
    p1: { name: 'Player 1', elo: 600 },
    p2: { name: 'Player 2', elo: 600 },
    onboarded: false,
    updatedAt: null
  };

  const DEFAULT_SETTINGS = {
    lang: 'vi',
    audio: true,
    volume: 0.7,
    bgm: true,
    bgmVolume: 0.35,
    liveEval: false,
    autoFlip: true,
    showLegal: true,
    showCoords: true,
    cloudEval: true,
    timeControl: 'none',
    lastBot: 'cadet',
    lastColor: 'w'
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[YStorage] Failed to write', key, e);
    }
  }

  function clampElo(v, def) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return def || 600;
    return Math.max(100, Math.min(3500, n));
  }

  /* ---------------- Profile ---------------- */
  function getProfile() {
    const p = readJSON(KEYS.profile, null);
    if (!p || typeof p !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    }
    return {
      p1: {
        name: (p.p1 && p.p1.name ? String(p.p1.name).trim() : 'Player 1') || 'Player 1',
        elo: clampElo(p.p1 && p.p1.elo, 600)
      },
      p2: {
        name: (p.p2 && p.p2.name ? String(p.p2.name).trim() : 'Player 2') || 'Player 2',
        elo: clampElo(p.p2 && p.p2.elo, 600)
      },
      onboarded: !!p.onboarded,
      updatedAt: p.updatedAt || null
    };
  }

  function saveProfile(profile) {
    const cur = getProfile();
    const merged = {
      p1: {
        name: (profile && profile.p1 && profile.p1.name ? String(profile.p1.name).trim() : cur.p1.name) || 'Player 1',
        elo: clampElo(profile && profile.p1 ? profile.p1.elo : cur.p1.elo, cur.p1.elo)
      },
      p2: {
        name: (profile && profile.p2 && profile.p2.name ? String(profile.p2.name).trim() : cur.p2.name) || 'Player 2',
        elo: clampElo(profile && profile.p2 ? profile.p2.elo : cur.p2.elo, cur.p2.elo)
      },
      onboarded: profile && profile.onboarded != null ? !!profile.onboarded : true,
      updatedAt: new Date().toISOString()
    };
    writeJSON(KEYS.profile, merged);
    return merged;
  }

  function hasProfile() {
    const p = readJSON(KEYS.profile, null);
    return !!(p && p.onboarded);
  }

  /* ---------------- Settings ---------------- */
  function getSettings() {
    const s = readJSON(KEYS.settings, null);
    const merged = Object.assign({}, DEFAULT_SETTINGS, s && typeof s === 'object' ? s : {});
    if (s && typeof s === 'object' && !s.autoFlipExplicit) {
      merged.autoFlip = true;
    }
    return merged;
  }

  function saveSettings(partial) {
    const patch = Object.assign({}, partial || {});
    if (partial && Object.prototype.hasOwnProperty.call(partial, 'autoFlip')) {
      patch.autoFlipExplicit = true;
    }
    const merged = Object.assign({}, getSettings(), patch);
    writeJSON(KEYS.settings, merged);
    return merged;
  }

  /* ---------------- Match Archive ---------------- */
  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatMatchDefaultTitle(match) {
    const m = match && typeof match === 'object' ? match : {};
    const rawTs = m.timestamp || m.savedAt || m.createdAt || Date.now();
    const d0 = new Date(rawTs);
    const d = isNaN(d0.getTime()) ? new Date() : d0;
    const datePrefix = String(d.getFullYear()) + pad2(d.getMonth() + 1) + pad2(d.getDate());
    const sideLabel = (side, fallback) => {
      if (!side) return fallback;
      let name = side.name || fallback;
      if (side.isBot && side.botId && window.Bots && typeof window.Bots.get === 'function') {
        const b = window.Bots.get(side.botId);
        if (b && b.name) {
          name = (window.I18N && typeof window.I18N.pick === 'function') ? window.I18N.pick(b.name) : (b.name.en || b.name.vi || name);
        }
      }
      name = String(name || fallback).trim() || fallback;
      return side.elo ? (name + ' (' + side.elo + ')') : name;
    };
    return datePrefix + ' ' + sideLabel(m.white, 'White') + ' vs ' + sideLabel(m.black, 'Black');
  }

  function listSaves() {
    const arr = readJSON(KEYS.saves, []);
    if (!Array.isArray(arr)) return [];
    return arr;
  }

  function saveMatch(match) {
    if (!match || typeof match !== 'object') return null;
    const list = listSaves();
    const now = new Date().toISOString();
    const id = match.id || ('m_' + Date.now());
    const idx = list.findIndex(m => m && m.id === id);
    const prev = idx >= 0 ? list[idx] : null;
    const ts = match.timestamp || (prev && prev.timestamp) || now;
    const copy = Object.assign({}, match, {
      format: 'yorha-chess-match',
      version: 1,
      id,
      timestamp: ts,
      savedAt: now,
      favorite: match.favorite != null ? !!match.favorite : !!(prev && prev.favorite)
    });
    const customTitle = match.title != null ? String(match.title).trim() : '';
    copy.title = customTitle || (prev && prev.title ? String(prev.title).trim() : '') || formatMatchDefaultTitle(copy);
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(copy);
    // keep max 60 non-favorite entries; favorites are never auto-pruned
    let nonFav = 0;
    const pruned = list.filter(m => {
      if (m && m.favorite) return true;
      nonFav++;
      return nonFav <= 60;
    });
    writeJSON(KEYS.saves, pruned);
    return copy;
  }

  function renameMatch(id, newTitle) {
    const list = listSaves();
    const item = list.find(m => m && m.id === id);
    if (!item) return null;
    const clean = String(newTitle || '').trim();
    item.title = clean || formatMatchDefaultTitle(item);
    writeJSON(KEYS.saves, list);
    return item;
  }

  function getMatch(id) {
    return listSaves().find(m => m && m.id === id) || null;
  }

  function deleteMatch(id) {
    const next = listSaves().filter(m => m && m.id !== id);
    writeJSON(KEYS.saves, next);
  }

  function toggleFavorite(id) {
    const list = listSaves();
    const item = list.find(m => m && m.id === id);
    if (item) {
      item.favorite = !item.favorite;
      writeJSON(KEYS.saves, list);
    }
    return item || null;
  }

  /* ---------------- File Export / Import & Bidirectional Conversion ---------------- */

  function dedupeStudyAnnotations(a) {
    const src = a && typeof a === 'object' ? a : {};
    const arrowMap = new Map();
    if (Array.isArray(src.arrows)) {
      src.arrows.forEach(x => {
        if (!x || !x.from || !x.to || x.from === x.to) return;
        arrowMap.set(x.from + '>' + x.to, { from: x.from, to: x.to, color: x.color || 'yellow' });
      });
    }
    const hlMap = new Map();
    if (Array.isArray(src.highlights)) {
      src.highlights.forEach(x => {
        if (!x || !x.sq) return;
        hlMap.set(x.sq, { sq: x.sq, color: x.color || 'yellow' });
      });
    }
    return { arrows: Array.from(arrowMap.values()), highlights: Array.from(hlMap.values()) };
  }

  function extractMainlineFromStudyRoot(root) {
    const startFen = (root && root.fen) || START_FEN;
    const moves = [];
    const fenHistory = [startFen];
    let cur = root;
    while (cur && Array.isArray(cur.children) && cur.children.length > 0) {
      cur = cur.children[0];
      if (!cur || !cur.move) break;
      const m = cur.move;
      const uci = m.uci || ((m.from || '') + (m.to || '') + (m.promotion || ''));
      moves.push({
        ply: moves.length + 1,
        san: m.san,
        uci,
        color: m.color || ((moves.length % 2 === 0) ? 'w' : 'b')
      });
      if (cur.fen) fenHistory.push(cur.fen);
    }
    return { startFen, moves, fenHistory, lastFen: fenHistory[fenHistory.length - 1] };
  }

  function matchToStudy(match) {
    if (!match || typeof match !== 'object' || !Array.isArray(match.moves)) return null;
    const startFen = match.startFen || match.initialFen || START_FEN;
    const parts = String(startFen).trim().split(/\s+/);
    const fullMove = parseInt(parts[5] || '1', 10) || 1;
    const turn = parts[1] === 'b' ? 'b' : 'w';
    const basePly = (fullMove - 1) * 2 + (turn === 'b' ? 1 : 0);

    const root = {
      id: 'root',
      parentId: null,
      move: null,
      ply: basePly,
      fen: startFen,
      comment: '',
      evaluation: null,
      annotations: { arrows: [], highlights: [] },
      children: []
    };

    const evalMap = new Map();
    if (Array.isArray(match.evaluations)) {
      match.evaluations.forEach(ev => {
        if (ev && ev.ply != null) evalMap.set(ev.ply, ev);
      });
    }

    if (window.Chess) {
      const c = new window.Chess();
      if (startFen !== START_FEN && !c.load(startFen)) return null;
      let cur = root;
      for (let i = 0; i < match.moves.length; i++) {
        const mv = match.moves[i];
        if (!mv) return null;
        const u = mv.uci;
        const m = u
          ? c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined })
          : c.move(mv.san);
        if (!m) return null;
        const ev = evalMap.get(mv.ply != null ? mv.ply : (i + 1));
        const evaluation = (ev && (ev.cpWhite != null || ev.mate != null)) ? {
          cpWhite: ev.cpWhite != null ? ev.cpWhite : 0,
          mate: ev.mate != null ? ev.mate : null,
          bestUci: ev.bestUci || null,
          bestSan: ev.bestSan || null,
          pv: []
        } : null;
        const child = {
          id: 'n_m_' + (i + 1),
          parentId: cur.id,
          move: {
            san: m.san,
            uci: m.from + m.to + (m.promotion || ''),
            from: m.from,
            to: m.to,
            color: m.color,
            piece: m.piece,
            captured: m.captured || null,
            flags: m.flags || '',
            promotion: m.promotion || null
          },
          ply: cur.ply + 1,
          fen: c.fen(),
          comment: '',
          evaluation,
          annotations: dedupeStudyAnnotations(mv.annotations),
          children: []
        };
        cur.children.push(child);
        cur = child;
      }
    }

    const now = new Date().toISOString();
    const title = (match.title && String(match.title).trim()) || formatMatchDefaultTitle(match);
    return {
      format: 'yorha-chess-study',
      version: 1,
      id: null,
      sourceMatchId: match.id || null,
      title,
      initialFen: startFen,
      createdAt: match.timestamp || now,
      updatedAt: match.savedAt || match.timestamp || now,
      root
    };
  }

  function studyToMatch(study) {
    if (!study || typeof study !== 'object' || !study.root || typeof study.root !== 'object') return null;
    const startFen = study.initialFen || study.startFen || study.root.fen || START_FEN;
    const moves = [];
    const fenHistory = [startFen];
    let result = '*';

    if (window.Chess) {
      const c = new window.Chess();
      if (startFen !== START_FEN && !c.load(startFen)) return null;
      let cur = study.root;
      while (cur && Array.isArray(cur.children) && cur.children.length > 0) {
        cur = cur.children[0];
        if (!cur || !cur.move) break;
        const mv = cur.move;
        const u = mv.uci;
        const m = u
          ? c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined })
          : c.move(mv.san);
        if (!m) return null;
        moves.push({ ply: moves.length + 1, san: m.san, uci: m.from + m.to + (m.promotion || ''), color: m.color });
        fenHistory.push(c.fen());
      }
      if (c.in_checkmate()) result = c.turn() === 'w' ? '0-1' : '1-0';
      else if (c.in_draw() || c.in_stalemate() || c.in_threefold_repetition() || c.insufficient_material()) result = '1/2-1/2';
    } else {
      const ext = extractMainlineFromStudyRoot(study.root);
      ext.moves.forEach(m => moves.push(m));
      for (let i = 1; i < ext.fenHistory.length; i++) fenHistory.push(ext.fenHistory[i]);
    }

    const profile = getProfile();
    const title = String(study.title || 'Untitled Study').trim() || 'Untitled Study';
    const ts = study.updatedAt || study.createdAt || new Date().toISOString();
    return {
      format: 'yorha-chess-match',
      version: 1,
      id: study.id || ('st_m_' + Date.now()),
      title,
      timestamp: ts,
      mode: 'study',
      timeControl: 'none',
      white: { name: profile.p1.name || 'White', elo: profile.p1.elo || 600, isBot: false, botId: null },
      black: { name: title, elo: profile.p2.elo || 600, isBot: false, botId: null },
      result,
      termination: 'study',
      startFen,
      fenHistory,
      moves,
      favorite: false
    };
  }

  function buildFilename(date, prefix, ext) {
    const d = (date instanceof Date && !isNaN(date)) ? date : new Date(date || Date.now());
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    return (prefix || 'Chess_Match_') + yyyy + '-' + mm + '-' + dd + '_' + hh + '-' + mi + '-' + ss + (ext || '.json');
  }

  function triggerJsonDownload(filename, dataObj) {
    const payload = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 200);
    return filename;
  }

  function exportMatch(match, prefix) {
    if (!match) return '';
    const d = match.timestamp ? new Date(match.timestamp) : new Date();
    const filename = buildFilename(d, prefix);
    return triggerJsonDownload(filename, match);
  }

  function importFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error('invalid')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('invalid'));
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ''));
          if (!data || typeof data !== 'object') {
            reject(new Error('invalid'));
            return;
          }
          // Accept Study .study.json directly into Match Review
          if (data.root && typeof data.root === 'object' && (!Array.isArray(data.moves) || data.format === 'yorha-chess-study')) {
            const converted = studyToMatch(data);
            if (!converted) { reject(new Error('invalid')); return; }
            resolve(converted);
            return;
          }
          if (!Array.isArray(data.moves)) {
            reject(new Error('invalid'));
            return;
          }
          // Verify moves are replayable with Chess if available
          if (window.Chess) {
            const c = new window.Chess();
            const startFen = data.startFen || data.initialFen;
            if (startFen && startFen !== START_FEN) {
              if (!c.load(startFen)) { reject(new Error('invalid')); return; }
            }
            for (const mv of data.moves) {
              const u = mv && mv.uci;
              const step = u
                ? c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined })
                : c.move(mv && mv.san);
              if (!step) { reject(new Error('invalid')); return; }
            }
          }
          if (!data.title || !String(data.title).trim()) {
            data.title = formatMatchDefaultTitle(data);
          }
          resolve(data);
        } catch (e) {
          reject(new Error('invalid'));
        }
      };
      reader.readAsText(file);
    });
  }

  /* ---------------- Study Archive ---------------- */
  function listStudies() {
    const arr = readJSON(KEYS.studies, []);
    if (!Array.isArray(arr)) return [];
    return arr;
  }

  function saveStudy(study) {
    if (!study || typeof study !== 'object' || !study.root) return null;
    const list = listStudies();
    const now = new Date().toISOString();
    const id = study.id || ('st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    const idx = list.findIndex(s => s && s.id === id);
    const prev = idx >= 0 ? list[idx] : null;
    const title = String(study.title || (prev && prev.title) || 'Untitled Study').trim() || 'Untitled Study';
    const copy = {
      format: 'yorha-chess-study',
      version: 1,
      id,
      title,
      initialFen: study.initialFen || study.root.fen || START_FEN,
      createdAt: (prev && prev.createdAt) || study.createdAt || now,
      updatedAt: now,
      root: study.root
    };
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(copy);
    writeJSON(KEYS.studies, list.slice(0, 100));
    return copy;
  }

  function getStudy(id) {
    return listStudies().find(s => s && s.id === id) || null;
  }

  function deleteStudy(id) {
    const next = listStudies().filter(s => s && s.id !== id);
    writeJSON(KEYS.studies, next);
  }

  function exportStudyFile(study) {
    if (!study || !study.root) return '';
    const d = study.updatedAt ? new Date(study.updatedAt) : new Date();
    const filename = buildFilename(d, 'NieR_Study_', '.study.json');
    const initialFen = study.initialFen || study.root.fen || START_FEN;
    const ext = extractMainlineFromStudyRoot(study.root);
    const payload = {
      format: 'yorha-chess-study',
      version: 1,
      id: study.id || ('st_' + Date.now()),
      title: String(study.title || 'Untitled Study').trim() || 'Untitled Study',
      initialFen,
      startFen: initialFen,
      moves: ext.moves,
      createdAt: study.createdAt || new Date().toISOString(),
      updatedAt: study.updatedAt || new Date().toISOString(),
      root: study.root
    };
    return triggerJsonDownload(filename, payload);
  }

  function importStudyFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error('invalid')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('invalid'));
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ''));
          if (!data || typeof data !== 'object') {
            reject(new Error('invalid'));
            return;
          }
          if (data.root && typeof data.root === 'object') {
            const fen = data.initialFen || data.root.fen;
            if (!fen || typeof fen !== 'string') {
              reject(new Error('invalid'));
              return;
            }
            if (window.Chess) {
              const c = new window.Chess();
              if (!c.load(fen)) {
                reject(new Error('invalid'));
                return;
              }
            }
            resolve(data);
            return;
          }
          if (Array.isArray(data.moves)) {
            const converted = matchToStudy(data);
            if (!converted) {
              reject(new Error('invalid'));
              return;
            }
            resolve(converted);
            return;
          }
          reject(new Error('invalid'));
        } catch (e) {
          reject(new Error('invalid'));
        }
      };
      reader.readAsText(file);
    });
  }

  /* ---------------- Solved Puzzles ---------------- */
  function getSolved() {
    const obj = readJSON(KEYS.solved, {});
    return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  }

  function markSolved(id, attempts) {
    if (!id) return;
    const solved = getSolved();
    const prev = solved[id];
    solved[id] = {
      solvedAt: new Date().toISOString(),
      attempts: prev ? Math.min(prev.attempts || 1, attempts || 1) : (attempts || 1)
    };
    writeJSON(KEYS.solved, solved);
  }

  function resetSolved() {
    writeJSON(KEYS.solved, {});
  }

  window.YStorage = {
    KEYS,
    getProfile,
    saveProfile,
    hasProfile,
    getSettings,
    saveSettings,
    formatMatchDefaultTitle,
    listSaves,
    saveMatch,
    renameMatch,
    getMatch,
    deleteMatch,
    toggleFavorite,
    exportMatch,
    buildFilename,
    importFile,
    matchToStudy,
    studyToMatch,
    listStudies,
    saveStudy,
    getStudy,
    deleteStudy,
    exportStudyFile,
    importStudyFile,
    getSolved,
    markSolved,
    resetSolved
  };
})();
