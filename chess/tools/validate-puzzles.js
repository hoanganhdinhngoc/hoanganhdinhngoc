/* =====================================================================
   YoRHa Tactical Chess System — tools/validate-puzzles.js
   Validates all puzzles against chess.js 0.10.3:
   - Unique IDs, valid bilingual metadata (title, goal, explain in vi/en)
   - Strict chess rule legality on starting FEN (1 W King, 1 B King,
     non-adjacent kings, no pawns on rank 1/8, opponent not in check)
   - Every move in `moves[]` is legal, and every `mates` puzzle ends in checkmate
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const { Chess } = require(path.join(root, 'vendor/chess.js'));

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'puzzles.js'), 'utf8'), sandbox);

const PUZZLES = sandbox.window.PUZZLES || [];
const CATS = sandbox.window.PUZZLE_CATEGORIES || [];

console.log('Total puzzles:', PUZZLES.length);
console.log('Total categories:', CATS.length);

const FILES = 'abcdefgh';
function checkFenLegality(fen) {
  const parts = String(fen || '').trim().split(/\s+/);
  const rows = (parts[0] || '').split('/');
  if (rows.length !== 8) return 'bad FEN rows';
  const wk = [], bk = [];
  for (let r = 0; r < 8; r++) {
    let f = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        f += parseInt(ch, 10);
      } else {
        const sq = FILES[f] + (8 - r);
        const t = ch.toLowerCase();
        const col = ch === ch.toUpperCase() ? 'w' : 'b';
        if (t === 'k') (col === 'w' ? wk : bk).push(sq);
        if (t === 'p' && (r === 0 || r === 7)) return 'pawn on rank 1/8 at ' + sq;
        f++;
      }
    }
    if (f !== 8) return 'bad FEN file count';
  }
  if (wk.length !== 1) return 'invalid White King count: ' + wk.length;
  if (bk.length !== 1) return 'invalid Black King count: ' + bk.length;
  const wf = FILES.indexOf(wk[0][0]), wr = parseInt(wk[0][1], 10);
  const bf = FILES.indexOf(bk[0][0]), br = parseInt(bk[0][1], 10);
  if (Math.max(Math.abs(wf - bf), Math.abs(wr - br)) <= 1) return 'adjacent kings';
  const turn = parts[1];
  const opp = turn === 'w' ? 'b' : 'w';
  const oppFen = [parts[0], opp, parts[2] || '-', '-', '0', '1'].join(' ');
  const oppChecker = new Chess();
  if (!oppChecker.load(oppFen)) return 'invalid opponent FEN';
  if (oppChecker.in_check()) return 'side not to move is already in check';
  return null;
}

const byCat = {};
const ids = new Set();
const errors = [];

PUZZLES.forEach((p, idx) => {
  byCat[p.cat] = (byCat[p.cat] || 0) + 1;
  if (ids.has(p.id)) errors.push(`Duplicate id: ${p.id}`);
  ids.add(p.id);

  if (!p.title || !p.title.vi || !p.title.en) errors.push(`${p.id}: missing bilingual title`);
  if (!p.goal || !p.goal.vi || !p.goal.en) errors.push(`${p.id}: missing bilingual goal`);
  if (!p.explain || !p.explain.vi || !p.explain.en) errors.push(`${p.id}: missing bilingual explain`);
  if (!Array.isArray(p.moves) || !p.moves.length) errors.push(`${p.id}: empty moves`);

  const ruleErr = checkFenLegality(p.fen);
  if (ruleErr) {
    errors.push(`${p.id} (#${idx + 1}): rule violation (${ruleErr}) "${p.fen}"`);
    return;
  }

  const c = new Chess();
  if (!c.load(p.fen)) {
    errors.push(`${p.id} (#${idx + 1}): invalid FEN "${p.fen}"`);
    return;
  }

  let allOk = true;
  for (let i = 0; i < p.moves.length; i++) {
    const uci = p.moves[i];
    const mv = {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined
    };
    const res = c.move(mv);
    if (!res) {
      errors.push(`${p.id}: illegal move #${i + 1} "${uci}" from FEN "${c.fen()}"`);
      allOk = false;
      break;
    }
  }
  if (allOk && p.cat === 'mates' && !c.in_checkmate()) {
    errors.push(`${p.id}: mate puzzle solution does not end in checkmate (end FEN "${c.fen()}")`);
  }
});

console.log('Counts by category:', byCat);

// Verify DOM IDs in app.js exist in index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const idMatches = [...appJs.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]);
const missingIds = [...new Set(idMatches)].filter(id => id !== 'graph-cursor' && !html.includes('id="' + id + '"'));
if (missingIds.length) {
  errors.push('Missing HTML IDs referenced in app.js: ' + missingIds.join(', '));
}

// Verify data-i18n keys in index.html exist in i18n.js
vm.runInContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), sandbox);
const I18N = sandbox.window.I18N;
const i18nKeys = [...html.matchAll(/data-i18n(?:-title)?="([^"]+)"/g)].map(m => m[1]);
const missingKeys = [...new Set(i18nKeys)].filter(k => !I18N.dict.vi[k] || !I18N.dict.en[k]);
if (missingKeys.length) {
  errors.push('Missing i18n keys in index.html: ' + missingKeys.join(', '));
}

// Verify pawn promotion in chess.js
['q', 'r', 'b', 'n'].forEach(promo => {
  const pc = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
  const m = pc.move({ from: 'a7', to: 'a8', promotion: promo });
  if (!m || m.promotion !== promo || pc.get('a8').type !== promo) {
    errors.push('Pawn promotion failed for piece: ' + promo);
  }
});

if (errors.length) {
  console.error('Validation errors (' + errors.length + '):');
  errors.forEach(e => console.error(' -', e));
  process.exit(1);
} else {
  console.log('DOM IDs verified, i18n keys verified, pawn promotion verified.');
  console.log('ALL ' + PUZZLES.length + ' PUZZLES VALIDATED SUCCESSFULLY!');
}
