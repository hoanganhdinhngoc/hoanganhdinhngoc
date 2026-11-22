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
    autoFlip: false,
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
    return Object.assign({}, DEFAULT_SETTINGS, s && typeof s === 'object' ? s : {});
  }

  function saveSettings(partial) {
    const merged = Object.assign({}, getSettings(), partial || {});
    writeJSON(KEYS.settings, merged);
    return merged;
  }

  /* ---------------- Match Archive ---------------- */
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
    const copy = Object.assign({}, match, {
      format: 'yorha-chess-match',
      version: 1,
      id,
      timestamp: match.timestamp || now,
      savedAt: now,
      favorite: !!match.favorite
    });
    const idx = list.findIndex(m => m && m.id === id);
    if (idx >= 0) {
      copy.favorite = match.favorite != null ? !!match.favorite : !!list[idx].favorite;
      list.splice(idx, 1);
    }
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

  /* ---------------- File Export / Import ---------------- */
  function pad2(n) { return String(n).padStart(2, '0'); }

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
          if (!data || typeof data !== 'object' || !Array.isArray(data.moves)) {
            reject(new Error('invalid'));
            return;
          }
          // Verify moves are replayable with Chess if available
          if (window.Chess) {
            const c = new window.Chess();
            const startFen = data.startFen || data.initialFen;
            if (startFen && startFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
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
      initialFen: study.initialFen || study.root.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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
    const payload = {
      format: 'yorha-chess-study',
      version: 1,
      id: study.id || ('st_' + Date.now()),
      title: String(study.title || 'Untitled Study').trim() || 'Untitled Study',
      initialFen: study.initialFen || study.root.fen,
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
          if (!data || typeof data !== 'object' || !data.root || typeof data.root !== 'object') {
            reject(new Error('invalid'));
            return;
          }
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
    listSaves,
    saveMatch,
    getMatch,
    deleteMatch,
    toggleFavorite,
    exportMatch,
    buildFilename,
    importFile,
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
