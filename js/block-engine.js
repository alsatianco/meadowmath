// js/block-engine.js
// Shared visual engine for the "Bạn Số" / Number Friends world.
// Renders numbers as cube creatures in canonical subitizing layouts and
// animates split/merge. Pure logic (COLORS, patternCoords, validSplits,
// makeChoices, decomposeTeen) is DOM-free and unit-tested via `node --test`.
(function () {
  'use strict';

  const COLORS = {
    0: '#cbd5e1', 1: '#e23b3b', 2: '#f5872b', 3: '#f5c518', 4: '#3fb64a',
    5: '#27b6d6', 6: '#3b6fe2', 7: '#7c4dd6', 8: '#e23b9b', 9: '#1faf8f', 10: '#f0a818'
  };

  // Canonical subitizing layouts (spec §3.1). Each entry: list of {r,c} grid cells.
  const PATTERNS = {
    0: [],
    1: [{ r: 0, c: 0 }],
    2: [{ r: 0, c: 0 }, { r: 0, c: 1 }],
    3: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
    4: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
    5: [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 2 }],
    6: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    7: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }],
    8: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }],
    9: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
    10: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 4 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }]
  };

  function patternCoords(n) {
    const cells = PATTERNS[n];
    if (!cells) throw new RangeError('patternCoords supports 0..10, got ' + n);
    return cells.map(c => ({ r: c.r, c: c.c }));
  }

  function gridSize(n) {
    const cells = patternCoords(n);
    if (cells.length === 0) return { rows: 0, cols: 0 };
    return {
      rows: Math.max(...cells.map(c => c.r)) + 1,
      cols: Math.max(...cells.map(c => c.c)) + 1
    };
  }

  function validSplits(n) {
    const out = [];
    for (let a = 1; a <= n - 1; a++) out.push([a, n - a]);
    return out;
  }

  function makeChoices(correct, count, min, max, rng) {
    rng = rng || Math.random;
    const set = new Set([correct]);
    let guard = 0;
    while (set.size < count && guard++ < 1000) {
      const v = min + Math.floor(rng() * (max - min + 1));
      if (v >= min && v <= max) set.add(v);
    }
    const arr = Array.from(set);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function decomposeTeen(n) {
    const tens = n >= 10 ? 10 : 0;
    return { tens, ones: n - tens };
  }

  const BlockEngine = { COLORS, patternCoords, gridSize, validSplits, makeChoices, decomposeTeen };

  if (typeof window !== 'undefined') window.BlockEngine = BlockEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = BlockEngine;
})();
