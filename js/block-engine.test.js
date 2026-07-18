// js/block-engine.test.js
const test = require('node:test');
const assert = require('node:assert');
const BlockEngine = require('./block-engine.js');

test('COLORS covers 0..10', () => {
  for (let n = 0; n <= 10; n++) {
    assert.match(BlockEngine.COLORS[n], /^#[0-9a-f]{6}$/i, `color for ${n}`);
  }
});

test('patternCoords returns the right number of cells', () => {
  for (let n = 0; n <= 10; n++) {
    assert.strictEqual(BlockEngine.patternCoords(n).length, n, `count for ${n}`);
  }
});

test('8 is two rows of four', () => {
  const cells = BlockEngine.patternCoords(8);
  const rows = new Set(cells.map(c => c.r));
  assert.strictEqual(rows.size, 2, 'two rows');
  cells.forEach(c => assert.ok(c.c >= 0 && c.c <= 3, 'cols 0..3'));
  assert.deepStrictEqual(BlockEngine.gridSize(8), { rows: 2, cols: 4 });
});

test('5 is a dice quincunx (corners + center of 3x3)', () => {
  const key = c => `${c.r},${c.c}`;
  const set = new Set(BlockEngine.patternCoords(5).map(key));
  ['0,0', '0,2', '1,1', '2,0', '2,2'].forEach(k => assert.ok(set.has(k), `has ${k}`));
});

test('10 is a 2x5 ten-frame', () => {
  assert.deepStrictEqual(BlockEngine.gridSize(10), { rows: 2, cols: 5 });
  assert.strictEqual(BlockEngine.patternCoords(10).length, 10);
});

test('7 is six (2x3) plus one centered below', () => {
  const key = c => `${c.r},${c.c}`;
  const set = new Set(BlockEngine.patternCoords(7).map(key));
  assert.ok(set.has('2,1'), 'the extra block sits below center');
  assert.deepStrictEqual(BlockEngine.gridSize(7), { rows: 3, cols: 3 });
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
