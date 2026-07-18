# "Bạn Số" Phase 1 — Foundation & Chặng 0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable `block-engine.js` visual engine plus the "Bạn Số" world hub and its first playable stage (Chặng 0 — Làm quen khối số), giving a navigable, bilingual, touch-friendly number-decomposition world for kindergarten.

**Architecture:** Static vanilla HTML/CSS/JS, no build step (matches the existing site). One shared engine module (`js/block-engine.js`) renders numbers as cube creatures in canonical subitizing layouts and animates split/merge — consumed by every activity. A data-driven hub (`number-friends/index.html`) renders a journey map from `data/number-friends.json`, reusing the site's i18n + storage modules. Each mini-game is a self-contained activity page following the existing `kinder/activities/*.html` pattern.

**Tech Stack:** HTML5, CSS3 (custom properties already in `css/variables.css`), vanilla ES2017 JS, Pointer Events, Web Speech API, Web Audio API, `localStorage` (via `js/storage.js`), i18n (`js/i18n.js`). Tests: Node's built-in test runner (`node --test`, Node ≥18; dev box has v24) for the engine's pure logic; a browser visual-test page + manual QA checklist for DOM/animation/audio.

## Global Constraints

- **Source of truth:** `docs/superpowers/specs/2026-06-26-number-friends-tach-gop-design.md`. This plan covers Phase 1 *foundation + Chặng 0 only*; Chặng 1–6 and polish are separate follow-up plans.
- **No build step. No npm runtime dependencies.** Pure static files; `node --test` is dev-only and needs no `package.json`.
- **No copyrighted assets.** Original art only; never use the word/logo/character designs of the referenced TV show in code, copy, comments, or filenames. The user-facing world name is **"Bạn Số" (vi) / "Number Friends" (en)**.
- **Bilingual via i18n.** Every user-facing string uses a `data-i18n` key or `i18n.t(...)`; provide both `lang/en/number-friends.json` and `lang/vi/number-friends.json`. `nav.*` strings go in `lang/{en,vi}/common.json`.
- **Subitizing layout is the default.** Canonical patterns from spec §3.1: 1 single · 2 row-of-2 · 3 row-of-3 · 4 = 2×2 · 5 = dice quincunx · 6 = 2×3 · 7 = 2×3 + 1 · 8 = 2×4 · 9 = 3×3 · 10 = 2×5 ten-frame.
- **Number range:** core 0–10 for Chặng 0 (engine supports 0–20; teen rendering = a Ten ten-frame group + the extra ones).
- **Color palette (BlockEngine.COLORS):** `{0:'#cbd5e1',1:'#e23b3b',2:'#f5872b',3:'#f5c518',4:'#3fb64a',5:'#27b6d6',6:'#3b6fe2',7:'#7c4dd6',8:'#e23b9b',9:'#1faf8f',10:'#f0a818'}`.
- **Accessibility:** every drag interaction has a tap equivalent; respect `prefers-reduced-motion`; no-fail feedback (gentle, never punitive).
- **Storage grade key:** all progress uses grade id `'number-friends'` with `window.Storage.markActivityCompleted('number-friends', <activityId>)` / `isActivityCompleted(...)`.
- **Local manual testing:** serve from repo root with `python3 -m http.server 8000`, open `http://localhost:8000/number-friends/`. (fetch of JSON needs http, not file://.)

---

## File Structure

```
js/block-engine.js                       # CREATE — shared engine (pure logic + DOM + anim + audio)
js/block-engine.test.js                  # CREATE — node --test unit tests for pure logic
css/block-engine.css                     # CREATE — cube / face / pattern styles (shared)
js/i18n.js                               # MODIFY — register 'number-friends' section
lang/en/common.json                      # MODIFY — add nav.numberFriends
lang/vi/common.json                      # MODIFY — add nav.numberFriends
lang/en/number-friends.json              # CREATE — hub + Chặng 0 strings (en)
lang/vi/number-friends.json              # CREATE — hub + Chặng 0 strings (vi)
data/number-friends.json                 # CREATE — journey definition (stages 0–6; activities for Chặng 0)
number-friends/index.html                # CREATE — world hub (journey map)
number-friends/number-friends.css        # CREATE — hub styles
number-friends/number-friends.js         # CREATE — hub controller
number-friends/block-engine.test.html    # CREATE — visual test page for the engine
number-friends/activities/activity.css           # CREATE — @import ../../css/activity.css + block-engine.css
number-friends/activities/activity-shared.css    # CREATE — @import ../../css/activity-shared.css
number-friends/activities/meet-blocks-intro.html # CREATE — Chặng 0 story intro
number-friends/activities/count-blocks.html      # CREATE — mini-game 1
number-friends/activities/tower-to-numeral.html  # CREATE — mini-game 2
number-friends/activities/subitize-flash.html    # CREATE — mini-game 3
index.html                               # MODIFY — add a "Bạn Số" card on the home page
```

## Shared building blocks (used verbatim by Tasks 11–14)

These are defined once here; tasks below say "insert SNIPPET-X" rather than repeating them.

**SNIPPET-HEAD** — `<head>` contents for an activity page (replace `__TITLE_KEY__`, `__TITLE_EN__`):
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Free interactive Kindergarten math practice on Meadow Math.">
<title data-i18n="__TITLE_KEY__">__TITLE_EN__</title>
<link rel="stylesheet" href="../../css/reset.css">
<link rel="stylesheet" href="../../css/variables.css">
<link rel="stylesheet" href="../../css/global.css">
<link rel="stylesheet" href="../../css/animations.css">
<link rel="stylesheet" href="../../css/sidebar.css">
<link rel="stylesheet" href="../../css/navigation.css">
<link rel="stylesheet" href="activity.css">
```

**SNIPPET-SIDEBAR** — the `<aside class="sidebar">…</aside>` block. Copy the sidebar markup verbatim from `kinder/activities/number-bonds-k.html` lines 40–97, with two changes: (a) the active item is the new Number Friends item, not Kinder; (b) insert this nav item immediately **before** the Pre-K `<a>`:
```html
<a href="../index.html" class="nav-item active">
  <span class="nav-item-icon">🧱</span>
  <span class="nav-item-text" data-i18n="nav.numberFriends">Number Friends</span>
</a>
```
and change the existing Pre-K/Kinder/etc. items to `class="nav-item"` (remove `active`). Back-link href is `../index.html`.

**SNIPPET-SCRIPTS** — script tags placed at end of `<body>` (order matters; engine before the activity's inline script):
```html
<script src="../../js/utils.js"></script>
<script src="../../js/storage.js"></script>
<script src="../../js/animations.js"></script>
<script src="../../js/i18n.js"></script>
<script src="../../js/navigation.js"></script>
<script src="../../js/activity-base.js"></script>
<script src="../../js/block-engine.js"></script>
```

**SNIPPET-STATS** — the stats overlay block. Copy verbatim from `kinder/activities/number-bonds-k.html` lines 164–183 (it uses ids `stats-overlay`, `stats-correct`, `stats-wrong`, `stats-message`, `stats-icon`, `btn-play-again`, all consumed by `ActivityBase`).

---

## Task 1: Engine pure logic — colors + canonical pattern map

**Files:**
- Create: `js/block-engine.js`
- Test: `js/block-engine.test.js`

**Interfaces:**
- Produces: `BlockEngine.COLORS` (object `{0..10: hex}`); `BlockEngine.patternCoords(n)` → `Array<{r:number,c:number}>` grid cells (row/col, 0-indexed from top-left) for the canonical layout of `n` (0–10); `BlockEngine.gridSize(n)` → `{rows:number, cols:number}`.

- [ ] **Step 1: Write the failing test**

```js
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
  ['0,0','0,2','1,1','2,0','2,2'].forEach(k => assert.ok(set.has(k), `has ${k}`));
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test js/block-engine.test.js`
Expected: FAIL — `Cannot find module './block-engine.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/block-engine.js
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

  const BlockEngine = { COLORS, patternCoords, gridSize };

  if (typeof window !== 'undefined') window.BlockEngine = BlockEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = BlockEngine;
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test js/block-engine.test.js`
Expected: PASS — all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/block-engine.js js/block-engine.test.js
git commit -m "feat(block-engine): canonical subitizing pattern map + colors"
```

---

## Task 2: Engine pure logic — splits + answer choices

**Files:**
- Modify: `js/block-engine.js`
- Modify: `js/block-engine.test.js`

**Interfaces:**
- Produces: `BlockEngine.validSplits(n)` → `Array<[number, number]>` all `[a, n-a]` with `1 ≤ a ≤ n-1`; `BlockEngine.makeChoices(correct, count, min, max, rng?)` → shuffled `Array<number>` of length `count`, unique, including `correct`, all within `[min, max]`; `BlockEngine.decomposeTeen(n)` → `{ tens: number, ones: number }` (tens in whole tens, ones 0–9), for 0–20.

- [ ] **Step 1: Write the failing test** (append)

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test js/block-engine.test.js`
Expected: FAIL — `BlockEngine.validSplits is not a function`.

- [ ] **Step 3: Write minimal implementation**

Insert these functions before the `const BlockEngine = {...}` line, and add them to the exported object:

```js
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
```

Update the export line to:
```js
  const BlockEngine = { COLORS, patternCoords, gridSize, validSplits, makeChoices, decomposeTeen };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test js/block-engine.test.js`
Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/block-engine.js js/block-engine.test.js
git commit -m "feat(block-engine): validSplits, makeChoices, decomposeTeen"
```

---

## Task 3: Engine DOM rendering + cube/face CSS + visual test page

**Files:**
- Modify: `js/block-engine.js`
- Create: `css/block-engine.css`
- Create: `number-friends/block-engine.test.html`

**Interfaces:**
- Produces: `BlockEngine.render(container, opts)` → HTMLElement. `opts = { value, color?, arrangement?='pattern', face?=true, scale?=1, label? }`. Mounts a `.nb-creature` element (a CSS grid of `.nb-cube` cells positioned by `patternCoords`; for `value>10` renders a `.nb-creature--ten` ten-frame group plus the remaining ones). Returns the created element. `BlockEngine.clear(container)` empties a container.

- [ ] **Step 1: Write the rendering code**

Append to `js/block-engine.js` (inside the IIFE, before the export object; then add `render` and `clear` to the exported object):

```js
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function buildCreature(value, color) {
    const size = gridSize(value);
    const wrap = el('div', 'nb-creature');
    wrap.dataset.value = value;
    wrap.style.setProperty('--nb-color', color);
    wrap.style.setProperty('--nb-cols', size.cols || 1);
    wrap.style.setProperty('--nb-rows', size.rows || 1);
    patternCoords(value).forEach(cell => {
      const cube = el('div', 'nb-cube');
      cube.style.gridRowStart = cell.r + 1;
      cube.style.gridColumnStart = cell.c + 1;
      wrap.appendChild(cube);
    });
    const face = el('div', 'nb-face');
    face.innerHTML = '<span class="nb-eye"></span><span class="nb-eye"></span><span class="nb-mouth"></span>';
    wrap.appendChild(face);
    return wrap;
  }

  function render(container, opts) {
    const value = opts.value;
    const color = opts.color || COLORS[Math.min(value, 10)] || COLORS[10];
    const root = el('div', 'nb-group');
    if (value > 10) {
      const ten = buildCreature(10, COLORS[10]);
      ten.classList.add('nb-creature--ten');
      root.appendChild(ten);
      root.appendChild(buildCreature(value - 10, color));
    } else {
      root.appendChild(buildCreature(value, color));
    }
    if (opts.scale && opts.scale !== 1) root.style.transform = `scale(${opts.scale})`;
    if (opts.label != null) {
      const lab = el('div', 'nb-label');
      lab.textContent = opts.label;
      root.appendChild(lab);
    }
    if (opts.face === false) root.classList.add('nb-no-face');
    if (container) { container.appendChild(root); }
    return root;
  }

  function clear(container) { if (container) container.innerHTML = ''; }
```

Add `render, clear, buildCreature` to the exported object:
```js
  const BlockEngine = { COLORS, patternCoords, gridSize, validSplits, makeChoices, decomposeTeen, render, clear, buildCreature };
```

- [ ] **Step 2: Write the cube/face CSS**

```css
/* css/block-engine.css — shared visuals for the Number Friends block engine */
.nb-group { display: inline-flex; flex-direction: column; align-items: center; gap: 6px; }
.nb-creature {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--nb-cols), 1fr);
  grid-template-rows: repeat(var(--nb-rows), 1fr);
  gap: 4px;
  --nb-cube-size: 34px;
}
.nb-cube {
  width: var(--nb-cube-size);
  height: var(--nb-cube-size);
  border-radius: 7px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--nb-color) 78%, white) 0%, var(--nb-color) 55%, color-mix(in srgb, var(--nb-color) 70%, black) 100%);
  border: 2px solid color-mix(in srgb, var(--nb-color) 65%, black);
  box-shadow: inset 0 3px 0 rgba(255,255,255,.35), 0 2px 0 color-mix(in srgb, var(--nb-color) 55%, black);
}
.nb-face {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  gap: 8px; pointer-events: none;
}
.nb-no-face .nb-face { display: none; }
.nb-eye { width: 9px; height: 9px; border-radius: 50%; background: #1f2937; box-shadow: 0 0 0 3px #fff; }
.nb-mouth {
  position: absolute; bottom: 28%; width: 16px; height: 8px;
  border-bottom: 3px solid #1f2937; border-radius: 0 0 16px 16px;
}
.nb-creature--ten { --nb-cube-size: 26px; }
.nb-label { font-family: var(--font-secondary, sans-serif); font-weight: 700; font-size: 1.5rem; color: var(--color-neutral-700, #334155); }
@media (prefers-reduced-motion: reduce) {
  .nb-creature { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 3: Write the visual test page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlockEngine Visual Test</title>
  <link rel="stylesheet" href="../css/variables.css">
  <link rel="stylesheet" href="../css/block-engine.css">
  <style>
    body { font-family: sans-serif; padding: 24px; background: #f8fafc; }
    .row { display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-end; margin: 18px 0; }
    .cell { text-align: center; }
    button { font-size: 1rem; padding: 8px 14px; margin: 4px; border-radius: 8px; cursor: pointer; }
    #stage { min-height: 180px; display: flex; gap: 40px; align-items: center; }
  </style>
</head>
<body>
  <h1>BlockEngine — visual test</h1>
  <h2>render() 0–20</h2>
  <div class="row" id="all"></div>

  <h2>split / merge / audio</h2>
  <div>
    <button id="btn-split">split 8 → 4 + 4</button>
    <button id="btn-merge">merge 3 + 2 → 5</button>
    <button id="btn-speak">speak "năm"</button>
    <button id="btn-pop">sfx pop</button>
    <button id="btn-snap">sfx snap</button>
    <button id="btn-mute">toggle mute</button>
  </div>
  <div id="stage"></div>

  <script src="../js/storage.js"></script>
  <script src="../js/block-engine.js"></script>
  <script>
    const all = document.getElementById('all');
    for (let n = 0; n <= 20; n++) {
      const cell = document.createElement('div'); cell.className = 'cell';
      BlockEngine.render(cell, { value: n, label: n });
      all.appendChild(cell);
    }
    const stage = document.getElementById('stage');
    document.getElementById('btn-split').onclick = async () => {
      stage.innerHTML = '';
      const c = BlockEngine.render(stage, { value: 8 });
      await BlockEngine.split(c, [4, 4]);
    };
    document.getElementById('btn-merge').onclick = async () => {
      stage.innerHTML = '';
      const a = BlockEngine.render(stage, { value: 3 });
      const b = BlockEngine.render(stage, { value: 2 });
      await BlockEngine.merge(a, b);
    };
    document.getElementById('btn-speak').onclick = () => BlockEngine.speak('năm');
    document.getElementById('btn-pop').onclick = () => BlockEngine.sfx('pop');
    document.getElementById('btn-snap').onclick = () => BlockEngine.sfx('snap');
    document.getElementById('btn-mute').onclick = () => BlockEngine.setMuted(!BlockEngine.isMuted());
  </script>
</body>
</html>
```

- [ ] **Step 4: Verify in browser**

Run: `python3 -m http.server 8000` (from repo root), open `http://localhost:8000/number-friends/block-engine.test.html`.
Expected: numbers 0–20 each render as a labeled cube creature in its canonical layout (4 = 2×2 square, 5 = dice-5, 8 = two rows of 4, 10 = ten-frame, 11–20 = a ten-frame group + extra cubes). Faces show two eyes + a smile. The split/merge/audio buttons will not work yet (added in Tasks 4–5) — that is expected.

- [ ] **Step 5: Commit**

```bash
git add js/block-engine.js css/block-engine.css number-friends/block-engine.test.html
git commit -m "feat(block-engine): DOM render + cube/face CSS + visual test page"
```

---

## Task 4: Engine split() + merge() animations

**Files:**
- Modify: `js/block-engine.js`

**Interfaces:**
- Produces: `BlockEngine.split(creatureEl, [a, b], opts?)` → `Promise<{left:HTMLElement,right:HTMLElement}>` — replaces a value-`(a+b)` creature in place with two creatures `a` and `b` that slide apart (honors `prefers-reduced-motion` by snapping instantly). `BlockEngine.merge(elA, elB, opts?)` → `Promise<HTMLElement>` — slides two creatures together and replaces them with a single creature of value `valueA+valueB`. `BlockEngine.celebrate(el)` adds a brief bounce class.

- [ ] **Step 1: Write the implementation**

Append inside the IIFE and add `split, merge, celebrate` to the exports:

```js
  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function split(creatureEl, parts, opts) {
    opts = opts || {};
    const [a, b] = parts;
    const parent = creatureEl.parentNode;
    const left = buildCreature(a, COLORS[Math.min(a, 10)]);
    const right = buildCreature(b, COLORS[Math.min(b, 10)]);
    const holder = el('div', 'nb-split');
    holder.appendChild(left);
    holder.appendChild(right);
    parent.replaceChild(holder, creatureEl);
    sfx('pop');
    if (prefersReducedMotion()) return Promise.resolve({ left, right });
    holder.classList.add('nb-split--animate');
    return new Promise(resolve => {
      setTimeout(() => resolve({ left, right }), (opts.duration || 450));
    });
  }

  function merge(elA, elB, opts) {
    opts = opts || {};
    const va = parseInt(elA.querySelector('.nb-creature').dataset.value, 10);
    const vb = parseInt(elB.querySelector('.nb-creature').dataset.value, 10);
    const parent = elA.parentNode;
    const done = () => {
      const sum = render(null, { value: va + vb });
      parent.replaceChild(sum, elA);
      if (elB.parentNode) elB.parentNode.removeChild(elB);
      sfx('snap');
      return sum;
    };
    if (prefersReducedMotion()) return Promise.resolve(done());
    elA.classList.add('nb-merge-a');
    elB.classList.add('nb-merge-b');
    return new Promise(resolve => {
      setTimeout(() => resolve(done()), (opts.duration || 450));
    });
  }

  function celebrate(elm) {
    if (!elm || prefersReducedMotion()) return;
    elm.classList.add('nb-celebrate');
    setTimeout(() => elm.classList.remove('nb-celebrate'), 600);
  }
```

Add to `css/block-engine.css`:
```css
.nb-split { display: flex; gap: 8px; }
.nb-split--animate > :first-child { animation: nb-slide-left .45s ease both; }
.nb-split--animate > :last-child { animation: nb-slide-right .45s ease both; }
@keyframes nb-slide-left { from { transform: translateX(20px); opacity:.4 } to { transform: translateX(0); opacity:1 } }
@keyframes nb-slide-right { from { transform: translateX(-20px); opacity:.4 } to { transform: translateX(0); opacity:1 } }
.nb-merge-a { animation: nb-nudge-right .45s ease both; }
.nb-merge-b { animation: nb-nudge-left .45s ease both; }
@keyframes nb-nudge-right { to { transform: translateX(10px) } }
@keyframes nb-nudge-left { to { transform: translateX(-10px) } }
.nb-celebrate { animation: nb-bounce .6s ease; }
@keyframes nb-bounce { 0%,100%{transform:scale(1)} 40%{transform:scale(1.12)} 70%{transform:scale(.96)} }
```

Update exports:
```js
  const BlockEngine = { COLORS, patternCoords, gridSize, validSplits, makeChoices, decomposeTeen, render, clear, buildCreature, split, merge, celebrate };
```
(`sfx` referenced here is added in Task 5; until then split/merge call a no-op — add `function sfx(){}` as a temporary stub now and replace its body in Task 5.)

- [ ] **Step 2: Verify in browser**

Run/refresh `http://localhost:8000/number-friends/block-engine.test.html`, click "split 8 → 4 + 4" and "merge 3 + 2 → 5".
Expected: the 8-creature is replaced by a 4 and a 4 sliding apart; merge replaces 3 + 2 with a single 5. (Audio still silent — Task 5.) With OS "reduce motion" on, the change is instant.

- [ ] **Step 3: Commit**

```bash
git add js/block-engine.js css/block-engine.css
git commit -m "feat(block-engine): split/merge/celebrate animations"
```

---

## Task 5: Engine audio — speak(), sfx(), mute

**Files:**
- Modify: `js/block-engine.js`

**Interfaces:**
- Produces: `BlockEngine.speak(text, opts?)` (Web Speech, `lang` default `'vi-VN'`, no-op if unsupported or muted); `BlockEngine.sfx(name)` where name ∈ `'pop'|'snap'|'correct'|'wrong'` (Web Audio tones, no-op if muted/unsupported); `BlockEngine.setMuted(bool)` / `BlockEngine.isMuted()` (persisted via `window.Storage` settings, key `nbMuted`).

- [ ] **Step 1: Replace the `sfx` stub and add audio functions**

```js
  let _audioCtx = null;
  let _muted = (function () {
    try { return !!(window.Storage && window.Storage.getSettings && window.Storage.getSettings().nbMuted); }
    catch (e) { return false; }
  })();

  function isMuted() { return _muted; }
  function setMuted(v) {
    _muted = !!v;
    try { if (window.Storage && window.Storage.saveSettings) window.Storage.saveSettings({ nbMuted: _muted }); } catch (e) {}
  }

  function sfx(name) {
    if (_muted || typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return;
    try {
      _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const tones = { pop: 520, snap: 660, correct: 784, wrong: 200 };
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.type = name === 'wrong' ? 'sawtooth' : 'sine';
      osc.frequency.value = tones[name] || 440;
      gain.gain.setValueAtTime(0.0001, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, _audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + 0.22);
      osc.connect(gain); gain.connect(_audioCtx.destination);
      osc.start(); osc.stop(_audioCtx.currentTime + 0.24);
    } catch (e) { /* audio is optional */ }
  }

  function speak(text, opts) {
    opts = opts || {};
    if (_muted || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = opts.lang || (window.i18n && window.i18n.currentLang === 'en' ? 'en-US' : 'vi-VN');
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech is optional */ }
  }
```

Replace the temporary `function sfx(){}` stub from Task 4 with the version above, and add `speak, sfx, setMuted, isMuted` to the exported object.

- [ ] **Step 2: Verify in browser**

Refresh the test page; click "speak", "sfx pop", "sfx snap", then "toggle mute" and confirm sounds stop. Reload the page and confirm the mute state persisted.
Expected: speech says "năm" (if a Vietnamese or default voice exists); tones play; mute silences both and survives reload.

- [ ] **Step 3: Commit**

```bash
git add js/block-engine.js
git commit -m "feat(block-engine): speak() + sfx() + persisted mute"
```

---

## Task 6: i18n registration + translation files

**Files:**
- Modify: `js/i18n.js` (line ~36, the `sections` array)
- Modify: `lang/en/common.json`, `lang/vi/common.json`
- Create: `lang/en/number-friends.json`, `lang/vi/number-friends.json`

**Interfaces:**
- Produces: i18n keys consumed by the hub and Chặng 0 pages: `nav.numberFriends`; `section.world.{title,tagline}`; `section.stages.stage-0.{title,goal}`; `section.activities.<id>.{title,instruction,correct,incorrect,perfect,great,good,keepPracticing}` for ids `meet-blocks-intro`, `count-blocks`, `tower-to-numeral`, `subitize-flash`; intro step strings `section.activities.meet-blocks-intro.steps` (array).

- [ ] **Step 1: Register the section**

In `js/i18n.js`, change the `sections` array (currently `['prek', 'kinder', 'kindergarten', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'tools', 'about']`) to include `'number-friends'`:

```js
  sections: ['number-friends', 'prek', 'kinder', 'kindergarten', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'tools', 'about'],
```

- [ ] **Step 2: Add nav key to both common.json files**

In `lang/en/common.json`, inside the existing `"nav": { ... }` object, add:
```json
"numberFriends": "Number Friends",
```
In `lang/vi/common.json`, inside `"nav": { ... }`, add:
```json
"numberFriends": "Bạn Số",
```

- [ ] **Step 3: Create `lang/en/number-friends.json`**

```json
{
  "world": { "title": "Number Friends", "tagline": "Numbers are blocks you can pull apart and snap together." },
  "stages": {
    "stage-0": { "title": "Meet the Blocks", "goal": "See each number as a tower of blocks — and know it by its shape." }
  },
  "activities": {
    "meet-blocks-intro": {
      "title": "Meet the Blocks",
      "instruction": "Tap to meet each number friend!",
      "steps": [
        "Hi! Every number is made of blocks.",
        "One block is One.",
        "Add a block — now it's Two!",
        "Five looks like the dots on dice.",
        "Ten is two rows of five.",
        "Tap a friend to hear its name!"
      ]
    },
    "count-blocks": {
      "title": "Count the Blocks", "instruction": "How many blocks?",
      "correct": "Yes! That's {{n}}.", "incorrect": "Count again — it's {{n}}.",
      "perfect": "Super counting!", "great": "Great counting!", "good": "Nice work!", "keepPracticing": "Keep counting!"
    },
    "tower-to-numeral": {
      "title": "Which Number?", "instruction": "Pick the number that matches the blocks.",
      "correct": "That's {{n}}!", "incorrect": "It's {{n}}.",
      "perfect": "Number star!", "great": "Great matching!", "good": "Nice work!", "keepPracticing": "Keep going!"
    },
    "subitize-flash": {
      "title": "Quick Look", "instruction": "Look fast — how many?",
      "correct": "Sharp eyes! It's {{n}}.", "incorrect": "It was {{n}}.",
      "perfect": "Eagle eyes!", "great": "Quick eyes!", "good": "Nice spotting!", "keepPracticing": "Keep looking!"
    }
  }
}
```

- [ ] **Step 4: Create `lang/vi/number-friends.json`**

```json
{
  "world": { "title": "Bạn Số", "tagline": "Mỗi con số là những khối có thể tách ra và gộp lại." },
  "stages": {
    "stage-0": { "title": "Làm quen khối số", "goal": "Thấy mỗi số là một tháp khối — và nhận ra số nhờ hình dạng." }
  },
  "activities": {
    "meet-blocks-intro": {
      "title": "Làm quen khối số",
      "instruction": "Chạm để gặp từng bạn số nhé!",
      "steps": [
        "Chào bạn! Mỗi con số được làm từ các khối.",
        "Một khối là số Một.",
        "Thêm một khối — thành số Hai!",
        "Số Năm trông giống mặt năm chấm xúc xắc.",
        "Số Mười là hai hàng năm.",
        "Chạm vào một bạn số để nghe tên nhé!"
      ]
    },
    "count-blocks": {
      "title": "Đếm khối", "instruction": "Có mấy khối?",
      "correct": "Đúng rồi! Là {{n}}.", "incorrect": "Đếm lại nhé — là {{n}}.",
      "perfect": "Đếm siêu quá!", "great": "Đếm giỏi lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Cố lên nhé!"
    },
    "tower-to-numeral": {
      "title": "Số nào đây?", "instruction": "Chọn số ứng với khối.",
      "correct": "Là {{n}} đó!", "incorrect": "Là {{n}}.",
      "perfect": "Ngôi sao số học!", "great": "Ghép giỏi lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Cố lên nhé!"
    },
    "subitize-flash": {
      "title": "Nhìn nhanh", "instruction": "Nhìn thật nhanh — mấy khối?",
      "correct": "Mắt tinh ghê! Là {{n}}.", "incorrect": "Vừa rồi là {{n}}.",
      "perfect": "Mắt đại bàng!", "great": "Mắt nhanh ghê!", "good": "Nhìn giỏi lắm!", "keepPracticing": "Nhìn tiếp nhé!"
    }
  }
}
```

- [ ] **Step 5: Verify JSON parses**

Run: `node -e "require('./lang/en/number-friends.json'); require('./lang/vi/number-friends.json'); require('./lang/en/common.json'); require('./lang/vi/common.json'); console.log('ok')"`
Expected: prints `ok` (no JSON syntax errors).

- [ ] **Step 6: Commit**

```bash
git add js/i18n.js lang/en/common.json lang/vi/common.json lang/en/number-friends.json lang/vi/number-friends.json
git commit -m "feat(number-friends): register i18n section + Chặng 0 strings"
```

---

## Task 7: Journey data file

**Files:**
- Create: `data/number-friends.json`

**Interfaces:**
- Produces: the journey definition the hub reads. Shape mirrors `data/kinder.json`: `{ region, title, description, levels: [stage...] }`. Each stage: `{ id, number, title, icon, goal, intro:{id,path}, activities:[{id,icon,path,type}] }`. Chặng 0 has full activities; Chặng 1–6 are present with titles/icons but empty `activities` arrays (so the hub shows them as "coming soon" locked nodes).

- [ ] **Step 1: Write the data file**

```json
{
  "region": "number-friends",
  "title": "Bạn Số",
  "description": "Numbers are blocks you can pull apart and snap together.",
  "levels": [
    {
      "id": "stage-0", "number": 0, "title": "Meet the Blocks", "icon": "🧱",
      "goal": "See each number as a tower of blocks.",
      "intro": { "id": "meet-blocks-intro", "path": "activities/meet-blocks-intro.html" },
      "activities": [
        { "id": "count-blocks", "icon": "🔢", "path": "activities/count-blocks.html", "type": "count-blocks" },
        { "id": "tower-to-numeral", "icon": "🔤", "path": "activities/tower-to-numeral.html", "type": "tower-to-numeral" },
        { "id": "subitize-flash", "icon": "⚡", "path": "activities/subitize-flash.html", "type": "subitize-flash" }
      ]
    },
    { "id": "stage-1", "number": 1, "title": "Tách", "icon": "✂️", "goal": "Split a tower into two parts.", "activities": [] },
    { "id": "stage-2", "number": 2, "title": "Gộp", "icon": "🤝", "goal": "Join two parts into one.", "activities": [] },
    { "id": "stage-3", "number": 3, "title": "Toàn thể của tớ", "icon": "🌈", "goal": "Find every way to split a number.", "activities": [] },
    { "id": "stage-4", "number": 4, "title": "Trốn tìm", "icon": "🫣", "goal": "Find the hidden part.", "activities": [] },
    { "id": "stage-5", "number": 5, "title": "Làm bạn với 5 và 10", "icon": "🖐️", "goal": "Make 5 and make 10.", "activities": [] },
    { "id": "stage-6", "number": 6, "title": "Mười và vài đơn vị", "icon": "🔟", "goal": "Teen numbers are ten and some ones.", "activities": [] }
  ]
}
```

- [ ] **Step 2: Verify JSON parses**

Run: `node -e "const d=require('./data/number-friends.json'); console.log(d.levels.length, 'stages,', d.levels[0].activities.length, 'activities in stage 0')"`
Expected: `7 stages, 3 activities in stage 0`.

- [ ] **Step 3: Commit**

```bash
git add data/number-friends.json
git commit -m "feat(number-friends): journey data (stage 0 activities + stage 1–6 stubs)"
```

---

## Task 8: World hub page

**Files:**
- Create: `number-friends/index.html`
- Create: `number-friends/number-friends.css`
- Create: `number-friends/number-friends.js`

**Interfaces:**
- Consumes: `data/number-friends.json`, `window.i18n`, `window.Storage.isActivityCompleted`. Renders into `#journey-map`.
- Produces: a navigable hub; clicking a stage reveals its intro + activity links; completed activities show a ⭐ via storage.

- [ ] **Step 1: Write `number-friends/index.html`**

Use the sidebar + language-switcher structure from `kinder/index.html` (copy `kinder/index.html` head + body shell), changing: page `<title>` to "Bạn Số | Meadow Math"; the active sidebar nav item to the Number Friends item (icon 🧱, `data-i18n="nav.numberFriends"`, href `index.html`); CSS link to `number-friends.css`; data/JS to `number-friends.js`; and the main content to:

```html
<main class="main-content">
  <header class="region-header">
    <h1 class="region-title" data-i18n="section.world.title">Number Friends</h1>
    <p class="region-tagline" data-i18n="section.world.tagline">Numbers are blocks you can pull apart and snap together.</p>
  </header>
  <div id="journey-map" class="journey-map"></div>
</main>
```
Include script tags (relative to `number-friends/`): `../js/utils.js`, `../js/storage.js`, `../js/i18n.js`, `../js/navigation.js`, `../js/block-engine.js`, then `number-friends.js`. (Sidebar nav hrefs from the hub are `../prek/index.html`, `../kinder/index.html`, etc.; the Number Friends item href is `index.html`.)

- [ ] **Step 2: Write `number-friends/number-friends.css`**

```css
.region-header { text-align: center; padding: 24px 16px 8px; }
.region-title { font-family: var(--font-secondary, sans-serif); font-size: 2rem; color: var(--color-neutral-800, #1e293b); }
.region-tagline { color: var(--color-neutral-500, #64748b); margin-top: 6px; }
.journey-map { max-width: 760px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 18px; }
.stage-node { border: 3px solid #e2e8f0; border-radius: 20px; background: #fff; padding: 16px 18px; box-shadow: 0 4px 0 #e2e8f0; }
.stage-node.locked { opacity: .55; }
.stage-head { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.stage-icon { font-size: 2rem; }
.stage-title { font-family: var(--font-secondary, sans-serif); font-weight: 700; font-size: 1.25rem; }
.stage-goal { color: var(--color-neutral-500, #64748b); font-size: .95rem; }
.stage-activities { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px; }
.activity-chip { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 96px; padding: 12px; border-radius: 16px; border: 2px solid #e2e8f0; text-decoration: none; color: inherit; background: #f8fafc; }
.activity-chip:hover { border-color: #3b82f6; transform: translateY(-3px); }
.activity-chip .chip-icon { font-size: 1.8rem; }
.activity-chip .chip-title { font-size: .85rem; text-align: center; }
.activity-chip .chip-star { font-size: .9rem; min-height: 1em; }
.coming-soon { color: var(--color-neutral-400, #94a3b8); font-style: italic; margin-top: 10px; }
```

- [ ] **Step 3: Write `number-friends/number-friends.js`**

```js
const NumberFriendsHub = {
  data: null,
  async init() {
    this.map = document.getElementById('journey-map');
    if (window.i18n && window.i18n.ready) await window.i18n.ready();
    try {
      const res = await fetch('../data/number-friends.json');
      this.data = await res.json();
    } catch (e) { this.map.innerHTML = '<p>Could not load activities.</p>'; return; }
    this.render();
    document.addEventListener('languageChanged', () => this.render());
  },
  t(key, fallback) {
    const v = window.i18n ? window.i18n.t(key) : key;
    return (v && v !== key) ? v : fallback;
  },
  render() {
    this.map.innerHTML = this.data.levels.map((s, i) => this.renderStage(s, i)).join('');
    this.map.querySelectorAll('.stage-head').forEach(h => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
    });
  },
  renderStage(stage, i) {
    const hasActivities = stage.activities && stage.activities.length > 0;
    const title = this.t(`section.stages.${stage.id}.title`, stage.title);
    const goal = this.t(`section.stages.${stage.id}.goal`, stage.goal);
    const chips = hasActivities
      ? `<div class="stage-activities">
           ${stage.intro ? this.renderChip(stage.intro, '📖', true) : ''}
           ${stage.activities.map(a => this.renderChip(a, a.icon, false)).join('')}
         </div>`
      : `<p class="coming-soon">Sắp ra mắt • Coming soon</p>`;
    return `
      <section class="stage-node ${hasActivities ? '' : 'locked'}">
        <div class="stage-head">
          <span class="stage-icon">${stage.icon}</span>
          <div>
            <div class="stage-title">${this.escape(title)}</div>
            <div class="stage-goal">${this.escape(goal)}</div>
          </div>
        </div>
        ${chips}
      </section>`;
  },
  renderChip(item, icon, isIntro) {
    const title = this.t(`section.activities.${item.id}.title`, item.id);
    let star = '';
    try {
      if (!isIntro && window.Storage && window.Storage.isActivityCompleted('number-friends', item.id)) star = '⭐';
    } catch (e) {}
    return `
      <a class="activity-chip" href="${item.path}" data-activity="${item.id}">
        <span class="chip-icon">${icon}</span>
        <span class="chip-title">${this.escape(title)}</span>
        <span class="chip-star">${star}</span>
      </a>`;
  },
  escape(t) { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; }
};
document.addEventListener('DOMContentLoaded', () => NumberFriendsHub.init());
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8000/number-friends/`.
Expected: header shows "Number Friends" (toggle to VI → "Bạn Số"); Chặng 0 shows an intro chip + 3 activity chips; Chặng 1–6 show "Sắp ra mắt • Coming soon" and look dimmed. Language toggle re-renders titles. (Activity links 404 until Tasks 10–14.)

- [ ] **Step 5: Commit**

```bash
git add number-friends/index.html number-friends/number-friends.css number-friends/number-friends.js
git commit -m "feat(number-friends): world hub with journey map + progress stars"
```

---

## Task 9: Site integration — home card

**Files:**
- Modify: `index.html` (home page)

**Interfaces:**
- Consumes: nothing new. Adds a link to `number-friends/index.html` on the home page.

- [ ] **Step 1: Add a home-page card**

Open `index.html`, find the grid/list of section cards (the existing Pre-K / Kinder / Grade links). Add, as the first card (before Pre-K), a card mirroring the existing card markup exactly but pointing to the new world. Use the existing card's class names verbatim; only change href, icon, and label:

```html
<a href="number-friends/index.html" class="<EXISTING_CARD_CLASS>">
  <span class="<EXISTING_ICON_CLASS>">🧱</span>
  <span class="<EXISTING_LABEL_CLASS>" data-i18n="nav.numberFriends">Number Friends</span>
</a>
```
Replace `<EXISTING_*_CLASS>` with the actual class names already used by the sibling cards in `index.html` (read them first; do not invent new ones).

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/` — a "Number Friends / Bạn Số" card appears and links to the hub.
Expected: clicking it opens the hub.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(number-friends): add home-page entry card"
```

---

## Task 10: Activity folder scaffolding (shared CSS)

**Files:**
- Create: `number-friends/activities/activity.css`
- Create: `number-friends/activities/activity-shared.css`

**Interfaces:**
- Produces: the per-folder CSS that activity pages link as `activity.css`, importing the shared activity styles plus the block-engine styles.

- [ ] **Step 1: Write `number-friends/activities/activity.css`**

```css
@import url('../../css/activity.css');
@import url('../../css/activity-shared.css');
@import url('../../css/block-engine.css');
```

- [ ] **Step 2: Write `number-friends/activities/activity-shared.css`**

```css
@import url('../../css/activity-shared.css');
```

- [ ] **Step 3: Commit**

```bash
git add number-friends/activities/activity.css number-friends/activities/activity-shared.css
git commit -m "chore(number-friends): activity folder CSS scaffolding"
```

---

## Task 11: Chặng 0 — story intro page

**Files:**
- Create: `number-friends/activities/meet-blocks-intro.html`

**Interfaces:**
- Consumes: `BlockEngine.render/speak`, `i18n` (`section.activities.meet-blocks-intro.steps` array via `i18n.getRaw`).
- Produces: a "tap to continue" guided sequence; last step links back to the hub.

- [ ] **Step 1: Write the page**

Structure: `<head>` = SNIPPET-HEAD with `__TITLE_KEY__=section.activities.meet-blocks-intro.title`, `__TITLE_EN__=Meet the Blocks`. Body = hamburger + backdrop + `app-container` with SNIPPET-SIDEBAR, then:

```html
<main class="main-content">
  <div class="activity-wrapper">
    <header class="activity-header">
      <a href="../index.html" class="back-link"><span data-i18n="activity.backTo">← Back to</span> <span data-i18n="nav.numberFriends">Number Friends</span></a>
      <h1 class="activity-title"><span class="activity-title-icon">📖</span> <span data-i18n="section.activities.meet-blocks-intro.title">Meet the Blocks</span></h1>
    </header>
    <div class="activity-area">
      <div id="stage" style="min-height:220px;display:flex;align-items:center;justify-content:center;"></div>
      <p id="caption" class="activity-instruction" style="text-align:center;min-height:2.4em;"></p>
      <div style="text-align:center;margin-top:12px;">
        <button id="btn-next" class="btn-activity btn-primary" data-i18n="buttons.next">Next</button>
      </div>
    </div>
  </div>
</main>
```
Then SNIPPET-SCRIPTS, then:

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    await i18n.ready();
    const stage = document.getElementById('stage');
    const caption = document.getElementById('caption');
    const btn = document.getElementById('btn-next');
    const steps = (window.i18n.getRaw('section.activities.meet-blocks-intro.steps')) || [];
    const values = [null, 1, 2, 5, 10, null]; // which number to show per step (null = keep last / friends row)
    let i = 0;
    function show() {
      caption.textContent = steps[i] || '';
      BlockEngine.clear(stage);
      const v = values[i];
      if (v != null) { const c = BlockEngine.render(stage, { value: v, label: v }); BlockEngine.celebrate(c); BlockEngine.speak(String(v)); }
      else if (i === values.length - 1) { for (let n = 1; n <= 5; n++) { BlockEngine.render(stage, { value: n }); } }
      btn.textContent = (i >= steps.length - 1) ? (i18n.t('buttons.done') !== 'buttons.done' ? i18n.t('buttons.done') : 'Done') : (i18n.t('buttons.next') !== 'buttons.next' ? i18n.t('buttons.next') : 'Next');
    }
    btn.addEventListener('click', () => {
      if (i >= steps.length - 1) { window.location.href = '../index.html'; return; }
      i++; show();
    });
    show();
  });
</script>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/number-friends/activities/meet-blocks-intro.html`.
Expected: captions advance on "Next" (EN/VI per language), creatures render per step (1, 2, 5, 10, then a row of friends), speech reads the number; final "Done" returns to the hub.

- [ ] **Step 3: Commit**

```bash
git add number-friends/activities/meet-blocks-intro.html
git commit -m "feat(number-friends): Chặng 0 story intro"
```

---

## Task 12: Chặng 0 — count-blocks mini-game

**Files:**
- Create: `number-friends/activities/count-blocks.html`

**Interfaces:**
- Consumes: `ActivityBase`, `BlockEngine.render/makeChoices/celebrate/speak/sfx`, `i18n`, `Storage.markActivityCompleted`.
- Produces: 8-round game; show a creature (value 1–10), child picks the count from 4 choices.

- [ ] **Step 1: Write the page**

`<head>` = SNIPPET-HEAD (`__TITLE_KEY__=section.activities.count-blocks.title`, `__TITLE_EN__=Count the Blocks`). Body shell = SNIPPET-SIDEBAR + this activity area + SNIPPET-STATS:

```html
<main class="main-content">
  <div class="activity-wrapper">
    <header class="activity-header">
      <a href="../index.html" class="back-link"><span data-i18n="activity.backTo">← Back to</span> <span data-i18n="nav.numberFriends">Number Friends</span></a>
      <h1 class="activity-title"><span class="activity-title-icon">🔢</span> <span data-i18n="section.activities.count-blocks.title">Count the Blocks</span></h1>
      <p class="activity-instruction" data-i18n="section.activities.count-blocks.instruction">How many blocks?</p>
    </header>
    <div class="activity-area">
      <div class="progress-indicator" id="progress"></div>
      <div id="stage" style="min-height:180px;display:flex;align-items:center;justify-content:center;"></div>
      <div class="answer-choices" id="choices" style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"></div>
      <div class="feedback-message" id="feedback"></div>
    </div>
  </div>
  <!-- SNIPPET-STATS here -->
</main>
```
Then SNIPPET-SCRIPTS + this controller:

```html
<script>
  class CountBlocks extends ActivityBase {
    constructor() { super({ totalRounds: 8, activityId: 'count-blocks', gradeLevel: 'number-friends', autoAdvanceDelay: 1500 }); }
    init() { super.init(); this.stage = document.getElementById('stage'); this.choices = document.getElementById('choices'); this.nextRound(); }
    startRound() {
      this.n = this.randomInt(1, 10);
      BlockEngine.clear(this.stage);
      BlockEngine.render(this.stage, { value: this.n });
      this.choices.innerHTML = '';
      const opts = BlockEngine.makeChoices(this.n, 4, 0, 10);
      opts.forEach(v => {
        const b = document.createElement('button');
        b.className = 'answer-btn'; b.textContent = v;
        b.addEventListener('click', () => this.pick(v, b));
        this.choices.appendChild(b);
      });
    }
    pick(v, btn) {
      if (this.isAnswered) return; this.isAnswered = true;
      this.disableButtons(this.choices);
      const ok = v === this.n;
      const msg = i18n.t('section.activities.count-blocks.' + (ok ? 'correct' : 'incorrect')).replace('{{n}}', this.n);
      if (ok) { btn.classList.add('correct'); this.incrementCorrect(); BlockEngine.sfx('correct'); BlockEngine.celebrate(this.stage.firstChild); }
      else { btn.classList.add('incorrect'); this.incrementIncorrect(); BlockEngine.sfx('wrong'); this.choices.querySelectorAll('.answer-btn').forEach(b => { if (+b.textContent === this.n) b.classList.add('correct'); }); }
      this.showFeedback(msg, !ok);
      BlockEngine.speak(String(this.n));
      this.renderProgress();
      this.autoAdvance();
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', 'count-blocks'); } catch(e){} super.showStats(); }
  }
  document.addEventListener('DOMContentLoaded', async () => { await i18n.ready(); const g = new CountBlocks(); g.init(); });
</script>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/number-friends/activities/count-blocks.html`.
Expected: 8 rounds; correct pick → green + chime + speech, wrong → red + reveals correct; progress dots fill; finishing shows the stats modal; returning to the hub shows ⭐ on the count-blocks chip.

- [ ] **Step 3: Commit**

```bash
git add number-friends/activities/count-blocks.html
git commit -m "feat(number-friends): Chặng 0 count-blocks mini-game"
```

---

## Task 13: Chặng 0 — tower-to-numeral mini-game

**Files:**
- Create: `number-friends/activities/tower-to-numeral.html`

**Interfaces:**
- Consumes: same as Task 12. Produces an 8-round game: show a creature, pick the matching numeral (this is the inverse framing of count-blocks but uses larger numeral choice buttons; reuse the same controller shape).

- [ ] **Step 1: Write the page**

Identical structure to Task 12 but: title key `section.activities.tower-to-numeral.title` ("Which Number?"), icon `🔤`, instruction key `section.activities.tower-to-numeral.instruction`, and a controller class `TowerToNumeral` with `activityId: 'tower-to-numeral'`. The round logic is the same as `CountBlocks` (render a value 1–10, four numeral choices via `makeChoices`, pick → feedback → autoAdvance, `markActivityCompleted('number-friends','tower-to-numeral')` in `showStats`). Write the full controller out (do not import from Task 12):

```html
<script>
  class TowerToNumeral extends ActivityBase {
    constructor() { super({ totalRounds: 8, activityId: 'tower-to-numeral', gradeLevel: 'number-friends', autoAdvanceDelay: 1500 }); }
    init() { super.init(); this.stage = document.getElementById('stage'); this.choices = document.getElementById('choices'); this.nextRound(); }
    startRound() {
      this.n = this.randomInt(1, 10);
      BlockEngine.clear(this.stage);
      BlockEngine.render(this.stage, { value: this.n });
      this.choices.innerHTML = '';
      BlockEngine.makeChoices(this.n, 4, 0, 10).forEach(v => {
        const b = document.createElement('button'); b.className = 'answer-btn'; b.textContent = v;
        b.addEventListener('click', () => this.pick(v, b)); this.choices.appendChild(b);
      });
    }
    pick(v, btn) {
      if (this.isAnswered) return; this.isAnswered = true; this.disableButtons(this.choices);
      const ok = v === this.n;
      const msg = i18n.t('section.activities.tower-to-numeral.' + (ok ? 'correct' : 'incorrect')).replace('{{n}}', this.n);
      if (ok) { btn.classList.add('correct'); this.incrementCorrect(); BlockEngine.sfx('correct'); BlockEngine.celebrate(this.stage.firstChild); }
      else { btn.classList.add('incorrect'); this.incrementIncorrect(); BlockEngine.sfx('wrong'); this.choices.querySelectorAll('.answer-btn').forEach(b => { if (+b.textContent === this.n) b.classList.add('correct'); }); }
      this.showFeedback(msg, !ok); BlockEngine.speak(String(this.n)); this.renderProgress(); this.autoAdvance();
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', 'tower-to-numeral'); } catch(e){} super.showStats(); }
  }
  document.addEventListener('DOMContentLoaded', async () => { await i18n.ready(); new TowerToNumeral().init(); });
</script>
```
(Header markup: copy Task 12's body shell, swapping icon `🔤` and the three `count-blocks` i18n keys for `tower-to-numeral`.)

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/number-friends/activities/tower-to-numeral.html`. Expected: same flow as count-blocks; ⭐ appears on its hub chip after completion.

- [ ] **Step 3: Commit**

```bash
git add number-friends/activities/tower-to-numeral.html
git commit -m "feat(number-friends): Chặng 0 tower-to-numeral mini-game"
```

---

## Task 14: Chặng 0 — subitize-flash mini-game

**Files:**
- Create: `number-friends/activities/subitize-flash.html`

**Interfaces:**
- Consumes: same as Task 12, plus a timed reveal. Produces an 8-round game: flash a creature (canonical pattern) for ~1.1s, hide it, then ask for the count.

- [ ] **Step 1: Write the page**

Body shell as Task 12 with icon `⚡` and the `subitize-flash` i18n keys. Controller:

```html
<script>
  class SubitizeFlash extends ActivityBase {
    constructor() { super({ totalRounds: 8, activityId: 'subitize-flash', gradeLevel: 'number-friends', autoAdvanceDelay: 1500 }); }
    init() { super.init(); this.stage = document.getElementById('stage'); this.choices = document.getElementById('choices'); this.nextRound(); }
    startRound() {
      this.n = this.randomInt(1, 10);
      this.choices.innerHTML = '';
      BlockEngine.clear(this.stage);
      const creature = BlockEngine.render(this.stage, { value: this.n, face: false });
      BlockEngine.sfx('pop');
      const reveal = this.matchMediaReduced() ? 2200 : 1100;
      setTimeout(() => {
        BlockEngine.clear(this.stage);
        this.stage.innerHTML = '<div style="font-size:3rem">❓</div>';
        BlockEngine.makeChoices(this.n, 4, 0, 10).forEach(v => {
          const b = document.createElement('button'); b.className = 'answer-btn'; b.textContent = v;
          b.addEventListener('click', () => this.pick(v, b)); this.choices.appendChild(b);
        });
      }, reveal);
    }
    matchMediaReduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    pick(v, btn) {
      if (this.isAnswered) return; this.isAnswered = true; this.disableButtons(this.choices);
      const ok = v === this.n;
      const msg = i18n.t('section.activities.subitize-flash.' + (ok ? 'correct' : 'incorrect')).replace('{{n}}', this.n);
      BlockEngine.clear(this.stage); BlockEngine.render(this.stage, { value: this.n });
      if (ok) { btn.classList.add('correct'); this.incrementCorrect(); BlockEngine.sfx('correct'); }
      else { btn.classList.add('incorrect'); this.incrementIncorrect(); BlockEngine.sfx('wrong'); this.choices.querySelectorAll('.answer-btn').forEach(b => { if (+b.textContent === this.n) b.classList.add('correct'); }); }
      this.showFeedback(msg, !ok); BlockEngine.speak(String(this.n)); this.renderProgress(); this.autoAdvance();
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', 'subitize-flash'); } catch(e){} super.showStats(); }
  }
  document.addEventListener('DOMContentLoaded', async () => { await i18n.ready(); new SubitizeFlash().init(); });
</script>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/number-friends/activities/subitize-flash.html`. Expected: a creature flashes briefly then hides behind ❓; choosing reveals the answer and feedback; reduced-motion lengthens the flash. ⭐ on the hub chip after completion.

- [ ] **Step 3: Commit**

```bash
git add number-friends/activities/subitize-flash.html
git commit -m "feat(number-friends): Chặng 0 subitize-flash mini-game"
```

---

## Task 15: Manual QA pass + spec status update

**Files:**
- Modify: `docs/superpowers/specs/2026-06-26-number-friends-tach-gop-design.md` (status line)

- [ ] **Step 1: Run the engine unit tests once more**

Run: `node --test js/block-engine.test.js`
Expected: all tests PASS.

- [ ] **Step 2: Manual QA checklist (serve + click through)**

With `python3 -m http.server 8000`, verify for each Chặng 0 page: (a) renders on a narrow viewport (~390px) without horizontal scroll; (b) every tap target works; (c) EN↔VI toggle updates all text; (d) correct/incorrect feedback + speech + sfx fire; (e) mute persists across pages; (f) with OS reduce-motion on, animations are minimal; (g) completing a game adds ⭐ on the hub. Note any failures and fix before committing.

- [ ] **Step 3: Update spec status**

Change the status line at the top of the spec from `Đã duyệt thiết kế (chờ rà soát spec)` to `Phase 1 foundation + Chặng 0 implemented (Chặng 1–6 pending)`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-26-number-friends-tach-gop-design.md
git commit -m "docs(number-friends): mark Phase 1 foundation + Chặng 0 done"
```

---

## Follow-up plans (out of scope here)

- **Plan 2 — Chặng 1 (Tách) + Chặng 2 (Gộp):** drag-to-split / drag-to-merge using `BlockEngine.split`/`merge` with Pointer Events + tap fallback; `split-free`, `split-name`, `missing-part`, `merge-free`, `merge-name`, `pick-pair`. Populate their `activities` arrays in `data/number-friends.json` and add their i18n keys.
- **Plan 3 — Chặng 3–5:** number bonds (rainbow / all-bonds / doubles), hide-and-seek (hidden part / bond-missing / take-away), make-5/10 (five-frame / ten-frame / make-ten-pairs / how-many-more).
- **Plan 4 — Chặng 6 + polish:** teen build/split (uses `decomposeTeen` + teen rendering), SEO (`sitemap.xml`, `robots.txt`), final cross-device QA.

## Self-Review

- **Spec coverage:** Engine (§3) → Tasks 1–5. Subitizing patterns (§3.1) → Task 1 + CSS Task 3. Audio (§3.3) → Task 5. Journey/stages + Chặng 0 dạng bài (§4) → Tasks 7, 11–14. Interaction/feedback no-fail (§5) → Tasks 12–14 (drag-based stages deferred to Plan 2, noted). Architecture/i18n/nav (§6) → Tasks 6–10. Error/edge (§7) → reduced-motion (Tasks 3,4,14), audio feature-detect (Task 5), JSON load failure (Task 8). Testing (§8) → Tasks 1–5 (node) + Task 15 (manual + visual page). Phasing (§9, §10) → "Follow-up plans" + scoping note. Chặng 1–6 are explicitly deferred — covered by follow-up plans, not gaps.
- **Placeholder scan:** No "TBD/TODO/handle edge cases" left. Tasks 9 and 13 reference *existing* class names / a sibling task's body shell by instruction but still supply the full controller code inline; Task 9 requires reading real class names from `index.html` (not inventing) — this is a deliberate "match existing markup" instruction, not a placeholder.
- **Type consistency:** `BlockEngine` method names (`render`, `clear`, `split`, `merge`, `celebrate`, `speak`, `sfx`, `setMuted`, `isMuted`, `patternCoords`, `gridSize`, `validSplits`, `makeChoices`, `decomposeTeen`, `buildCreature`, `COLORS`) are consistent across tasks and the visual test page. Storage grade key `'number-friends'` and `markActivityCompleted`/`isActivityCompleted` match `js/storage.js`. i18n key shapes (`section.activities.<id>.*`, `section.stages.<id>.*`, `nav.numberFriends`) match `js/i18n.js` wrapping and the JSON files.
