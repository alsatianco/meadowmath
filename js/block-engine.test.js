// js/block-engine.test.js
const test = require('node:test');
const assert = require('node:assert');
const BlockEngine = require('./block-engine.js');

test('COLORS covers 0..20', () => {
  for (let numberValue = 0; numberValue <= 20; numberValue++) {
    assert.match(BlockEngine.COLORS[numberValue], /^#[0-9a-f]{6}$/i, `color for ${numberValue}`);
  }
});

test('patternCoords returns the right number of cells', () => {
  for (let numberValue = 0; numberValue <= 20; numberValue++) {
    assert.strictEqual(BlockEngine.patternCoords(numberValue).length, numberValue, `count for ${numberValue}`);
  }
});

test('8 is two rows of four', () => {
  const cells = BlockEngine.patternCoords(8);
  const rows = new Set(cells.map(c => c.r));
  assert.strictEqual(rows.size, 2, 'two rows');
  cells.forEach(c => assert.ok(c.c >= 0 && c.c <= 3, 'cols 0..3'));
  assert.deepStrictEqual(BlockEngine.gridSize(8), { rows: 2, cols: 4 });
});

test('5 is a plus shape around a center block', () => {
  const key = cell => `${cell.r},${cell.c}`;
  const set = new Set(BlockEngine.patternCoords(5).map(key));
  ['0,1', '1,0', '1,1', '1,2', '2,1'].forEach(position => assert.ok(set.has(position), `has ${position}`));
});

test('10 is a 2x5 ten-frame', () => {
  assert.deepStrictEqual(BlockEngine.gridSize(10), { rows: 2, cols: 5 });
  assert.strictEqual(BlockEngine.patternCoords(10).length, 10);
});

test('7 is six in a 2x3 body plus one cap block', () => {
  const key = cell => `${cell.r},${cell.c}`;
  const set = new Set(BlockEngine.patternCoords(7).map(key));
  assert.ok(set.has('0,0'), 'the cap block sits above the body');
  ['1,0', '1,1', '2,0', '2,1', '3,0', '3,1'].forEach(position => assert.ok(set.has(position), `has body cell ${position}`));
  assert.deepStrictEqual(BlockEngine.gridSize(7), { rows: 4, cols: 2 });
});

test('20 is four clean rows of five', () => {
  assert.deepStrictEqual(BlockEngine.gridSize(20), { rows: 4, cols: 5 });
  assert.strictEqual(BlockEngine.patternCoords(20).length, 20);
});

test('validSplits lists ordered partitions into two positive parts', () => {
  assert.deepStrictEqual(BlockEngine.validSplits(4), [[1, 3], [2, 2], [3, 1]]);
  assert.deepStrictEqual(BlockEngine.validSplits(1), []);
});

test('makeChoices includes the answer, is unique, in range, right length', () => {
  let i = 0;
  const rng = () => [0.1, 0.5, 0.9, 0.3, 0.7][i++ % 5]; // deterministic
  const choices = BlockEngine.makeChoices(3, 4, 0, 10, rng);
  assert.strictEqual(choices.length, 4);
  assert.ok(choices.includes(3), 'includes correct');
  assert.strictEqual(new Set(choices).size, 4, 'unique');
  choices.forEach(v => assert.ok(v >= 0 && v <= 10, 'in range'));
});

test('decomposeTeen splits into tens and ones', () => {
  assert.deepStrictEqual(BlockEngine.decomposeTeen(7), { tens: 0, ones: 7 });
  assert.deepStrictEqual(BlockEngine.decomposeTeen(10), { tens: 10, ones: 0 });
  assert.deepStrictEqual(BlockEngine.decomposeTeen(14), { tens: 10, ones: 4 });
});

test('seamSplits: 10 splits into 5+5 at the row seam', () => {
  assert.deepStrictEqual(BlockEngine.seamSplits(10), [{ axis: 'row', index: 0, parts: [5, 5] }]);
});

test('seamSplits: 7 has row seams 1+6, 3+4, 5+2', () => {
  assert.deepStrictEqual(BlockEngine.seamSplits(7).map(s => s.parts), [[1, 6], [3, 4], [5, 2]]);
});

test('seamSplits: 3 splits by column into 1+2 and 2+1', () => {
  assert.deepStrictEqual(BlockEngine.seamSplits(3), [
    { axis: 'col', index: 0, parts: [1, 2] }, { axis: 'col', index: 1, parts: [2, 1] }
  ]);
});

test('seamSplits: 9 (3x3) gives 3+6 and 6+3', () => {
  assert.deepStrictEqual(BlockEngine.seamSplits(9).map(s => s.parts), [[3, 6], [6, 3]]);
});

test('seamSplits: 0 and 1 have no seams', () => {
  assert.deepStrictEqual(BlockEngine.seamSplits(0), []);
  assert.deepStrictEqual(BlockEngine.seamSplits(1), []);
});
