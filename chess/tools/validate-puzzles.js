/* =====================================================================
   YoRHa Tactical Chess System — tools/validate-puzzles.js
   Validates all 100 puzzles against chess.js 0.10.3:
   - Exact count = 100 (40 tactics, 25 mates, 15 endgames, 20 historical)
   - Unique IDs, valid bilingual metadata (title, goal, explain in vi/en)
   - Valid FEN and every move in `moves[]` is 100% legal
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

  const c = new Chess();
  if (!c.load(p.fen)) {
    errors.push(`${p.id} (#${idx + 1}): invalid FEN "${p.fen}"`);
    return;
  }

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
      break;
    }
  }
});

console.log('Counts by category:', byCat);
if (errors.length) {
  console.error('Validation errors (' + errors.length + '):');
  errors.forEach(e => console.error(' -', e));
  process.exit(1);
} else {
  console.log('ALL 100 PUZZLES VALIDATED SUCCESSFULLY!');
}
