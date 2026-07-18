# "Bạn Số" Chặng 1–6 + Story Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Number Friends world: 22 mini-games + 6 story intros across stages 0–6, teaching subitizing and number composition/decomposition (tách gộp), plus a mission-based story layer — per spec `docs/superpowers/specs/2026-07-16-number-friends-stages-1-6-design.md`.

**Architecture:** Static vanilla HTML/CSS/JS, no build step. Every mini-game/intro is a self-contained page under `number-friends/activities/` (pattern: copy an existing page, swap id/icon/body/script). Shared additions: `js/block-engine.js` grows `seamSplits`, `renderSilhouette`, `fillSilhouette`, `makeSplittable`, `makeDraggable` (old API untouched); new `number-friends/activities/nf-widgets.js` + `css/nf-widgets.css` provide bondDiagram / fruitRow / blockzilla / staircase / hostBadge / rainbow / stamp. Hub gains a story layer (hosts, real-world missions modal).

**Tech Stack:** HTML5, CSS3, vanilla ES2017, Pointer Events, Web Speech, WebAudio, `localStorage` via `js/storage.js`, i18n via `js/i18n.js`. Tests: `node --test js/block-engine.test.js` for pure logic; `number-friends/block-engine.test.html` + manual QA for DOM.

## Global Constraints

- **Source of truth:** spec `2026-07-16-number-friends-stages-1-6-design.md` (+ parent spec `2026-06-26-number-friends-tach-gop-design.md`).
- **No build step, no npm deps. No copyrighted assets** — original art, CSS/emoji only; never use the TV show's name/characters in code, copy, comments, filenames.
- **Bilingual:** every user-facing string via `data-i18n` / `i18n.t(...)`; keys live in `lang/{en,vi}/number-friends.json`. Key scheme: `section.activities.<id>.*`, `section.stages.<id>.*`.
- **BlockEngine old API must not change** (`render/split/merge/celebrate/speak/sfx/COLORS/patternCoords/gridSize/validSplits/makeChoices/decomposeTeen`). Only add.
- **No-fail feedback:** wrong answer → gentle shake, show/act out the right answer, auto-advance. Explore games (`split-free`, `merge-free`, `five-frame`, `ten-frame`, `teen-build`) have no wrong answers — every action counts as progress.
- **Every drag has a tap fallback.** Respect `prefers-reduced-motion` (engine helpers already do).
- **Storage:** `window.Storage.markActivityCompleted('number-friends', <activityId>)`; mission self-stars use ids `<stageId>-mission-<i>`.
- **Numbers:** core 0–10; stage 6 teens 11–19 via `decomposeTeen`.
- **Local test:** `python3 -m http.server 8000` from repo root → `http://localhost:8000/number-friends/`.
- **Commit style:** `feat(number-friends): …` per task, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## File Structure

```
js/block-engine.js                     # MODIFY — add seamSplits, renderSilhouette, fillSilhouette, makeSplittable, makeDraggable
js/block-engine.test.js                # MODIFY — tests for seamSplits
css/block-engine.css                   # MODIFY — ghost cubes, seams, drag states
css/nf-widgets.css                     # CREATE — bond diagram, fruits, blockzilla, staircase, hostBadge, rainbow, stamps, mirror
number-friends/activities/nf-widgets.js# CREATE — NFWidgets namespace
number-friends/activities/activity.css # MODIFY — @import nf-widgets.css + game-specific layout classes
number-friends/block-engine.test.html  # MODIFY — visual sections for new APIs/widgets
data/number-friends.json               # MODIFY — stages 0–6: host, missions, intro, activities
lang/{en,vi}/number-friends.json       # MODIFY — all new keys
number-friends/number-friends.js       # MODIFY — mission chip + modal
number-friends/number-friends.css      # MODIFY — mission modal styles
number-friends/index.html              # MODIFY — mission modal container div
sitemap.xml                            # MODIFY — 28 new URLs
number-friends/activities/*.html       # CREATE — 28 pages:
  stage 0: who-is-bigger, stamp-shapes
  stage 1: split-intro, split-free, split-name, missing-part
  stage 2: merge-intro, merge-free, merge-name, pick-pair
  stage 3: bonds-intro, fruit-salad, all-bonds, inside-me, fill-shape, doubles
  stage 4: hide-intro, hide-seek, bond-missing, take-away
  stage 5: frame-intro, five-frame, ten-frame, number-rainbow, how-many-more
  stage 6: teen-intro, teen-build, teen-split
```

## Shared building blocks (referenced by page tasks as "SNIPPET-…")

**SNIPPET-GAME-PAGE** — to create a game page: copy `number-friends/activities/subitize-flash.html` in full, then replace:
1. Every `subitize-flash` occurrence → `__ID__` (title key, og:url, h1 key, instruction key).
2. `<title>` fallback text and og:title EN text → `__TITLE_EN__`; instruction fallback → `__INSTRUCTION_EN__`.
3. Activity title icon `⚡` → `__ICON__`.
4. The contents of `<div class="activity-area">…</div>` → the task's **AREA** block (keep `progress-indicator` + `feedback-message` ids unless AREA says otherwise).
5. The inline `<script>…</script>` before the Cloudflare snippet → the task's **SCRIPT** block.
6. If the task lists widgets, add `<script src="nf-widgets.js"></script>` after the `block-engine.js` script tag.
Keep: head links, sidebar, hamburger, stats overlay, script order, Cloudflare snippet.

**SNIPPET-INTRO-PAGE** — to create an intro page: copy `number-friends/activities/meet-blocks-intro.html` in full, replace every `meet-blocks-intro` → `__ID__`, title texts → `__TITLE_EN__`, and the inline script → the task's **SCRIPT**. Intro scripts follow the same shape: `steps()` reads `section.activities.__ID__.steps` array, `show()` renders scene for step `i`, Next/Done button, `languageChanged` re-renders. Add `nf-widgets.js` script tag when used.

**SNIPPET-CHOICE-PICK** — the standard answer flow used by quiz games (adapt names per task):
```js
pick(v, btn) {
  if (this.isAnswered) return; this.isAnswered = true;
  this.disableButtons(this.choices);
  const ok = v === this.answer;
  const msg = i18n.t('section.activities.__ID__.' + (ok ? 'correct' : 'incorrect'))
    .replace('{{n}}', this.answer).replace('{{a}}', this.a ?? '').replace('{{b}}', this.b ?? '');
  if (ok) { btn.classList.add('correct'); this.incrementCorrect(); BlockEngine.sfx('correct'); }
  else {
    btn.classList.add('incorrect'); this.incrementIncorrect(); BlockEngine.sfx('wrong');
    this.choices.querySelectorAll('.answer-btn').forEach(b => { if (b.dataset.v == this.answer) b.classList.add('correct'); });
  }
  this.reveal(ok);                       // game-specific "act out the right answer"
  this.showFeedback(msg, !ok); BlockEngine.speak(msg);
  this.renderProgress(); this.autoAdvance();
}
renderChoices(values) {
  this.choices.innerHTML = '';
  values.forEach(v => {
    const b = document.createElement('button');
    b.className = 'answer-btn'; b.textContent = v; b.dataset.v = v;
    b.addEventListener('click', () => this.pick(v, b));
    this.choices.appendChild(b);
  });
}
showStats() { try { window.Storage.markActivityCompleted('number-friends', '__ID__'); } catch (e) {} super.showStats(); }
```

**SNIPPET-AREA-QUIZ** — default AREA for quiz games:
```html
<div class="progress-indicator" id="progress"></div>
<div id="stage" class="nf-stage"></div>
<div class="answer-choices" id="choices"></div>
<div class="feedback-message" id="feedback"></div>
```

**SNIPPET-I18N-RESULTS** — every game's i18n object ends with these 4 result keys (write real copy per game; the stage tasks below give full JSON):
`"perfect"`, `"great"`, `"good"`, `"keepPracticing"`.

**Host badge wiring** (games that list a host): in `init()` after `super.init()`:
```js
NFWidgets.hostBadge(document.querySelector('.activity-header'), {
  value: __HOST__, text: i18n.t('section.stages.__STAGE__.hostLine')
});
```

---

## Task 0: Commit the in-flight storybook redesign

**Files:** all currently-modified files (working tree).

- [ ] **Step 1:** `git -C /Users/duc.nguyen/git2/meadowmath status --short` — confirm only the 8 known files are dirty (css/block-engine.css, js/block-engine.js, js/block-engine.test.js, number-friends/*, activities/activity.css).
- [ ] **Step 2:** `node --test js/block-engine.test.js` — expect all pass (engine changes in tree must not be broken).
- [ ] **Step 3:** Serve + open `http://localhost:8000/number-friends/` — hub renders, no console errors.
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(number-friends): storybook UI redesign (WIP baseline)"`.

---

## Task 1: Engine pure logic — `seamSplits(n)`

**Files:** Modify `js/block-engine.js`, `js/block-engine.test.js`.

**Interfaces — Produces:** `BlockEngine.seamSplits(n)` → `Array<{axis:'row'|'col', index:number, parts:[number,number]}>` — the natural split lines of the canonical pattern; `axis:'row', index:r` = split below grid row `r`. Single-row numbers (2, 3) split by column. Every later split game consumes this.

- [ ] **Step 1: Failing tests** — append to `js/block-engine.test.js`:
```js
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
```
- [ ] **Step 2:** `node --test js/block-engine.test.js` → FAIL (`seamSplits is not a function`).
- [ ] **Step 3: Implement** — in `js/block-engine.js` after `validSplits`:
```js
// Natural split lines of the canonical pattern. axis 'row' index r = cut below
// grid row r; single-row numbers (2, 3) cut by column instead.
function seamSplits(n) {
  const cells = patternCoords(n);
  const size = gridSize(n);
  const out = [];
  if (size.rows > 1) {
    for (let r = 0; r < size.rows - 1; r++) {
      const a = cells.filter(c => c.r <= r).length;
      if (a > 0 && a < n) out.push({ axis: 'row', index: r, parts: [a, n - a] });
    }
  } else if (size.cols > 1) {
    for (let c = 0; c < size.cols - 1; c++) {
      const a = cells.filter(cell => cell.c <= c).length;
      if (a > 0 && a < n) out.push({ axis: 'col', index: c, parts: [a, n - a] });
    }
  }
  return out;
}
```
Add `seamSplits` to the exported `BlockEngine` object.
- [ ] **Step 4:** `node --test js/block-engine.test.js` → all PASS.
- [ ] **Step 5: Commit** `feat(block-engine): seamSplits — natural split lines of canonical patterns`.

---

## Task 2: Engine DOM — silhouettes, splittable, draggable

**Files:** Modify `js/block-engine.js`, `css/block-engine.css`, `number-friends/block-engine.test.html`.

**Interfaces — Produces:**
- `BlockEngine.renderSilhouette(container, {value, filled=0, layout='pattern'|'frame', color?})` → root el (class `nb-group nb-silhouette`, `data-value`). First `filled` cells (pattern order) are solid, rest are `.nb-cube--ghost`. `layout:'frame'` = rows of 5 (5→1×5, 10→2×5, teens→2×5+ones rows) for frame games.
- `BlockEngine.fillSilhouette(rootEl, count=1)` → number of ghosts remaining after filling `count` ghost cells (in order) with solid class + pop sfx.
- `BlockEngine.makeSplittable(groupEl, onPick)` — overlays one `<button class="nb-seam">` per `seamSplits(value)` seam onto the creature; tap/click calls `onPick(seam)`. Keyboard/tap friendly (they are buttons).
- `BlockEngine.makeDraggable(el, targets, onDrop)` — Pointer-Events drag of `el`; releasing over a target (or tap `el` then tap target) calls `onDrop(targetEl)`. Adds `.nb-dragging` / `.nb-selected` classes.

- [ ] **Step 1: Implement in `js/block-engine.js`** (after `clear`):
```js
function frameCells(n) {
  const cells = [];
  for (let i = 0; i < n; i++) cells.push({ r: Math.floor(i / 5), c: i % 5 });
  return cells;
}

function renderSilhouette(container, opts) {
  const value = opts.value;
  const filled = opts.filled || 0;
  const color = opts.color || COLORS[Math.min(value, 20)];
  const cells = opts.layout === 'frame' ? frameCells(value) : patternCoords(value);
  const rows = cells.length ? Math.max(...cells.map(c => c.r)) + 1 : 1;
  const cols = cells.length ? Math.max(...cells.map(c => c.c)) + 1 : 1;
  const root = el('div', 'nb-group nb-silhouette');
  root.dataset.value = value;
  const body = el('div', 'nb-creature nb-creature--ghost');
  body.style.setProperty('--nb-color', color);
  body.style.setProperty('--nb-cols', cols);
  body.style.setProperty('--nb-rows', rows);
  cells.forEach((cell, index) => {
    const cube = el('div', index < filled ? 'nb-cube' : 'nb-cube nb-cube--ghost');
    cube.style.gridRowStart = cell.r + 1;
    cube.style.gridColumnStart = cell.c + 1;
    if (cell.x) cube.style.setProperty('--nb-cell-shift-x', cell.x);
    body.appendChild(cube);
  });
  root.appendChild(body);
  if (container) container.appendChild(root);
  return root;
}

function fillSilhouette(rootEl, count) {
  count = count == null ? 1 : count;
  const ghosts = rootEl.querySelectorAll('.nb-cube--ghost');
  for (let i = 0; i < Math.min(count, ghosts.length); i++) ghosts[i].classList.remove('nb-cube--ghost');
  if (count > 0) sfx('pop');
  return rootEl.querySelectorAll('.nb-cube--ghost').length;
}

function makeSplittable(groupEl, onPick) {
  const creature = groupEl.classList.contains('nb-creature') ? groupEl : groupEl.querySelector('.nb-creature');
  const value = parseInt(creature.dataset.value, 10);
  seamSplits(value).forEach(seam => {
    const hit = el('button', 'nb-seam nb-seam--' + seam.axis);
    hit.type = 'button';
    hit.setAttribute('aria-label', seam.parts[0] + ' + ' + seam.parts[1]);
    hit.style.setProperty('--nb-seam-pos', seam.index + 1);
    hit.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); onPick(seam); });
    creature.appendChild(hit);
  });
}

function makeDraggable(dragEl, targets, onDrop) {
  let startX = 0, startY = 0, moved = false;
  const hitTarget = (x, y) => targets.find(t => {
    const r = t.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
  dragEl.style.touchAction = 'none';
  dragEl.addEventListener('pointerdown', e => {
    dragEl.setPointerCapture(e.pointerId);
    startX = e.clientX; startY = e.clientY; moved = false;
    dragEl.classList.add('nb-dragging');
  });
  dragEl.addEventListener('pointermove', e => {
    if (!dragEl.classList.contains('nb-dragging')) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    dragEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  });
  dragEl.addEventListener('pointerup', e => {
    dragEl.classList.remove('nb-dragging');
    dragEl.style.transform = '';
    const target = hitTarget(e.clientX, e.clientY);
    if (moved && target) { onDrop(target); return; }
    if (!moved) { // tap-to-select fallback
      dragEl.classList.toggle('nb-selected');
      if (dragEl.classList.contains('nb-selected')) {
        const chosen = ev => {
          const t = targets.find(x => x === ev.currentTarget);
          if (t) { dragEl.classList.remove('nb-selected'); cleanup(); onDrop(t); }
        };
        const cleanup = () => targets.forEach(t => t.removeEventListener('click', chosen));
        targets.forEach(t => t.addEventListener('click', chosen, { once: true }));
      }
    }
  });
}
```
Export all five new functions on `BlockEngine`.
- [ ] **Step 2: CSS** — append to `css/block-engine.css`:
```css
/* silhouettes / ghost cells */
.nb-silhouette .nb-creature--ghost { position: relative; }
.nb-cube--ghost {
  background: transparent !important;
  border: 2px dashed color-mix(in srgb, var(--nb-color, #888) 55%, transparent);
  box-shadow: none !important; opacity: .75;
}
/* seam hit areas */
.nb-seam {
  position: absolute; z-index: 5; border: 0; cursor: pointer;
  background: repeating-linear-gradient(90deg, #fff8 0 8px, transparent 8px 14px);
  border-radius: 4px; opacity: 0; transition: opacity .15s;
}
.nb-creature:hover .nb-seam, .nb-seam:focus-visible { opacity: 1; }
.nb-seam--row { left: -6%; width: 112%; height: 14px; top: calc(var(--nb-seam-pos) * (100% / var(--nb-rows)) - 7px); }
.nb-seam--col { top: -6%; height: 112%; width: 14px; left: calc(var(--nb-seam-pos) * (100% / var(--nb-cols)) - 7px); }
@media (pointer: coarse) { .nb-seam { opacity: .55; } }
/* drag states */
.nb-dragging { z-index: 20; filter: brightness(1.06); }
.nb-selected { outline: 3px solid #e3a83f; outline-offset: 4px; border-radius: 8px; }
@media (prefers-reduced-motion: reduce) { .nb-seam { transition: none; } }
```
- [ ] **Step 3: Visual test page** — in `number-friends/block-engine.test.html` add a section rendering: `renderSilhouette` for 5/7/10 (`filled` 0/3/10), `layout:'frame'` for 5, 10, 13; a splittable 8 (log picked seam to the page); two draggable 3 & 4 with a drop target that logs. Open in browser, check all render and interactions fire.
- [ ] **Step 4:** `node --test js/block-engine.test.js` → still all PASS (no pure-logic change).
- [ ] **Step 5: Commit** `feat(block-engine): silhouettes, seam-splitting and drag interactions`.

---

## Task 3: NFWidgets + CSS

**Files:** Create `number-friends/activities/nf-widgets.js`, `css/nf-widgets.css`; modify `number-friends/activities/activity.css` (add `@import url('../../css/nf-widgets.css');` at top), `number-friends/block-engine.test.html` (widget demo section).

**Interfaces — Produces (all on `window.NFWidgets`):**
- `bondDiagram(container, {direction:'down'|'up'})` → `{root, top, left, right, equation}` (top/left/right = circle content divs; equation = strip div).
- `fruitRow(container, {count, kind})` → el; fruits laid out with `BlockEngine.patternCoords(count)`; each fruit is `<span class="nf-fruit">`.
- `blockzilla(container)` → `{root, point(dir)}`, `dir` ∈ `'left'|'right'|'equal'|null` — mouth wedge opens toward the bigger side, `=` mouth for equal, closed when null.
- `staircase(container, {steps})` → `{root, slot(i)}` — step `i` (1-based) has a landing div to place creatures.
- `hostBadge(container, {value, text})` → `{root, say(text)}` — small creature (scale .5) + speech bubble, appended to container.
- `rainbow(container)` → `{root, arc(a)}` — baseline numbers 0..10; `arc(a)` draws the arc joining `a` and `10−a` (class `nf-arc nf-arc--a<a>`).
- `stamp(container, {cells, color})` → el — grid of plain solid cells (`nf-stamp-cell`) at `{r,c}` positions, no face.

- [ ] **Step 1: Create `number-friends/activities/nf-widgets.js`:**
```js
// NFWidgets — Number Friends shared game widgets (bond diagram, fruits,
// blockzilla comparer, staircase, host badge, make-10 rainbow, stamps).
(function () {
  'use strict';
  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function bondDiagram(container, opts) {
    opts = opts || {};
    const root = el('div', 'nf-bond nf-bond--' + (opts.direction || 'down'), container);
    const top = el('div', 'nf-bond-circle nf-bond-top', root);
    const arms = el('div', 'nf-bond-arms', root);
    el('span', 'nf-bond-arrow nf-bond-arrow--l', arms);
    el('span', 'nf-bond-arrow nf-bond-arrow--r', arms);
    const bottom = el('div', 'nf-bond-bottom', root);
    const left = el('div', 'nf-bond-circle', bottom);
    const right = el('div', 'nf-bond-circle', bottom);
    const equation = el('div', 'nf-bond-equation', root);
    return { root, top, left, right, equation };
  }

  function fruitRow(container, opts) {
    const cells = window.BlockEngine.patternCoords(opts.count);
    const cols = cells.length ? Math.max(...cells.map(c => c.c)) + 1 : 1;
    const rows = cells.length ? Math.max(...cells.map(c => c.r)) + 1 : 1;
    const root = el('div', 'nf-fruits', container);
    root.style.setProperty('--nf-cols', cols);
    root.style.setProperty('--nf-rows', rows);
    cells.forEach(c => {
      const f = el('span', 'nf-fruit', root);
      f.textContent = opts.kind || '🍊';
      f.style.gridRowStart = c.r + 1;
      f.style.gridColumnStart = c.c + 1;
    });
    return root;
  }

  function blockzilla(container) {
    const root = el('div', 'nf-zilla', container);
    root.innerHTML = '<div class="nf-zilla-eye"></div><div class="nf-zilla-eye"></div><div class="nf-zilla-mouth"></div>';
    function point(dir) {
      root.classList.remove('nf-zilla--left', 'nf-zilla--right', 'nf-zilla--equal');
      if (dir === 'left') root.classList.add('nf-zilla--left');
      if (dir === 'right') root.classList.add('nf-zilla--right');
      if (dir === 'equal') root.classList.add('nf-zilla--equal');
    }
    return { root, point };
  }

  function staircase(container, opts) {
    const root = el('div', 'nf-stairs', container);
    const slots = [];
    for (let i = 1; i <= opts.steps; i++) {
      const step = el('div', 'nf-stair', root);
      step.style.setProperty('--nf-stair-h', i);
      el('span', 'nf-stair-num', step).textContent = i;
      slots.push(el('div', 'nf-stair-slot', step));
    }
    return { root, slot: i => slots[i - 1] };
  }

  function hostBadge(container, opts) {
    const root = el('div', 'nf-host', container);
    const holder = el('div', 'nf-host-block', root);
    window.BlockEngine.render(holder, { value: opts.value });
    const bubble = el('div', 'nf-host-bubble', root);
    bubble.textContent = opts.text || '';
    function say(text) { bubble.textContent = text; window.BlockEngine.speak(text); }
    return { root, say };
  }

  function rainbow(container) {
    const root = el('div', 'nf-rainbow', container);
    const arcs = el('div', 'nf-rainbow-arcs', root);
    const base = el('div', 'nf-rainbow-base', root);
    for (let n = 0; n <= 10; n++) {
      const b = el('button', 'nf-rainbow-num', base);
      b.type = 'button'; b.textContent = n; b.dataset.v = n;
    }
    function arc(a) {
      const lo = Math.min(a, 10 - a);
      const arcEl = el('div', 'nf-arc', arcs);
      arcEl.style.setProperty('--nf-arc-lo', lo);
      arcEl.style.setProperty('--nf-arc-span', 10 - 2 * lo);
      arcEl.style.setProperty('--nf-arc-color', window.BlockEngine.COLORS[a] || '#e3a83f');
      return arcEl;
    }
    return { root, arc };
  }

  function stamp(container, opts) {
    const cells = opts.cells;
    const cols = Math.max(...cells.map(c => c[1])) + 1;
    const rows = Math.max(...cells.map(c => c[0])) + 1;
    const root = el('div', 'nf-stamp', container);
    root.style.setProperty('--nf-cols', cols);
    root.style.setProperty('--nf-rows', rows);
    cells.forEach(c => {
      const cube = el('span', 'nf-stamp-cell', root);
      cube.style.gridRowStart = c[0] + 1;
      cube.style.gridColumnStart = c[1] + 1;
      cube.style.background = opts.color || '#75b957';
    });
    return root;
  }

  window.NFWidgets = { bondDiagram, fruitRow, blockzilla, staircase, hostBadge, rainbow, stamp };
})();
```
- [ ] **Step 2: Create `css/nf-widgets.css`** — style the seven widgets. Requirements (exact values are the implementer's judgement, match storybook tokens: parchment `#fff8e8`, ink `#4b372e`, gold `#e3a83f`):
```css
/* bond diagram: top circle over two bottom circles, chunky arrows between */
.nf-bond { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.nf-bond-circle { width: 120px; height: 120px; border: 4px solid #4b372e; border-radius: 50%;
  background: #fff8e8; display: flex; align-items: center; justify-content: center; }
.nf-bond-bottom { display: flex; gap: 56px; }
.nf-bond-arms { display: flex; gap: 90px; height: 34px; }
.nf-bond-arrow { width: 18px; height: 100%; position: relative; }
.nf-bond-arrow::after { content: '⬇'; font-size: 22px; color: #4b372e; }
.nf-bond--up .nf-bond-arrow::after { content: '⬆'; }
.nf-bond--up { flex-direction: column-reverse; }
.nf-bond-equation { font: 700 1.5rem/1 'Chango', Georgia, serif; color: #4b372e;
  border: 3px solid #4b372e; border-radius: 10px; padding: 6px 14px; background: #fff; margin-top: 8px; }
/* fruits */
.nf-fruits { display: grid; grid-template-columns: repeat(var(--nf-cols), 2rem);
  grid-template-rows: repeat(var(--nf-rows), 2rem); gap: 4px; font-size: 1.6rem; }
.nf-fruit { display: flex; align-items: center; justify-content: center; transition: transform .3s, opacity .3s; }
.nf-fruit--gone { transform: translateY(60px) scale(.4); opacity: 0; }
/* blockzilla: round green face, googly eyes, wedge mouth that rotates */
.nf-zilla { position: relative; width: 110px; height: 110px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #9ccf6d, #5f8f3e); display: flex; justify-content: center; gap: 16px; padding-top: 22px; }
.nf-zilla-eye { width: 26px; height: 26px; border-radius: 50%; background: #fff; position: relative; }
.nf-zilla-eye::after { content: ''; position: absolute; inset: 30% 30% auto auto; width: 10px; height: 10px; border-radius: 50%; background: #222; }
.nf-zilla-mouth { position: absolute; bottom: 14px; left: 50%; width: 44px; height: 40px;
  transform: translateX(-50%); background: #35301f;
  clip-path: polygon(0 50%, 100% 0, 100% 100%); transition: transform .35s, clip-path .35s; }
.nf-zilla--left  .nf-zilla-mouth { clip-path: polygon(100% 50%, 0 0, 0 100%); }   /* opens left = left is bigger */
.nf-zilla--right .nf-zilla-mouth { clip-path: polygon(0 50%, 100% 0, 100% 100%); }
.nf-zilla--equal .nf-zilla-mouth { clip-path: polygon(0 15%, 100% 15%, 100% 38%, 0 38%, 0 62%, 100% 62%, 100% 85%, 0 85%); }
/* staircase */
.nf-stairs { display: flex; align-items: flex-end; gap: 6px; }
.nf-stair { width: 84px; background: #e9ddb8; border: 3px solid #4b372e; border-radius: 8px 8px 0 0;
  height: calc(var(--nf-stair-h) * 46px); position: relative; }
.nf-stair-num { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); font-weight: 800; color: #4b372e; }
.nf-stair-slot { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); }
/* host badge */
.nf-host { display: flex; align-items: flex-end; gap: 10px; margin: 8px 0; }
.nf-host-block .nb-group { transform: scale(.5); transform-origin: bottom left; }
.nf-host-bubble { background: #fff; border: 3px solid #4b372e; border-radius: 14px; padding: 8px 12px;
  font-weight: 700; color: #4b372e; position: relative; max-width: 320px; }
.nf-host-bubble::before { content: ''; position: absolute; left: -12px; bottom: 12px;
  border: 8px solid transparent; border-right-color: #4b372e; }
/* rainbow: 11 base numbers, arcs positioned by --nf-arc-lo/span (fractions of 1/11 columns) */
.nf-rainbow { width: min(560px, 92vw); }
.nf-rainbow-arcs { position: relative; height: 180px; }
.nf-arc { position: absolute; bottom: 0;
  left: calc((var(--nf-arc-lo) + .5) * 100% / 11);
  width: calc(var(--nf-arc-span) * 100% / 11);
  height: calc(var(--nf-arc-span) * 16px + 20px);
  border: 6px solid var(--nf-arc-color); border-bottom: none;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0; }
.nf-rainbow-base { display: grid; grid-template-columns: repeat(11, 1fr); }
.nf-rainbow-num { border: 2px solid #4b372e; background: #fff8e8; border-radius: 8px;
  font-weight: 800; padding: 8px 0; cursor: pointer; }
.nf-rainbow-num.correct { background: #8fcf9f; }
/* stamps */
.nf-stamp { display: grid; grid-template-columns: repeat(var(--nf-cols), 30px);
  grid-template-rows: repeat(var(--nf-rows), 30px); gap: 3px; }
.nf-stamp-cell { border-radius: 6px; border: 2px solid #0003; }
/* mirror (doubles) */
.nf-mirror { transform: scaleX(-1); opacity: .55; filter: saturate(.6); }
/* compare layout (who-is-bigger) */
.nf-compare { display: flex; align-items: flex-end; justify-content: center; gap: 28px; min-height: 260px; }
.nf-compare-side { cursor: pointer; border-radius: 12px; padding: 8px; }
.nf-compare-side:hover { background: #0000000d; }
/* generic stage */
.nf-stage { min-height: 220px; display: flex; align-items: center; justify-content: center; gap: 28px; flex-wrap: wrap; }
/* hide overlay bush */
.nb-hide { position: absolute; inset: -12%; display: flex; align-items: center; justify-content: center;
  font-size: 1.9em; z-index: 6; }
@media (prefers-reduced-motion: reduce) { .nf-fruit, .nf-zilla-mouth { transition: none; } }
```
- [ ] **Step 3:** Add `@import url('../../css/nf-widgets.css');` as the first line of `number-friends/activities/activity.css`.
- [ ] **Step 4:** Add a widget demo section to `number-friends/block-engine.test.html` (bond both directions, fruits 3/5/8, blockzilla with 3 buttons calling `point`, staircase 5 with a creature on slot 3, hostBadge, rainbow with arcs 0–5, stamps). Eyeball in browser.
- [ ] **Step 5: Commit** `feat(number-friends): NFWidgets — bond, fruits, blockzilla, stairs, host, rainbow, stamps`.

---

## Task 4: Hub story layer — hosts, missions, data & i18n scaffolding

**Files:** Modify `data/number-friends.json`, `number-friends/number-friends.js`, `number-friends/number-friends.css`, `number-friends/index.html`, `lang/en/number-friends.json`, `lang/vi/number-friends.json`.

**Interfaces — Produces:** data schema additions consumed by all stage tasks: each level gains `"host": <int>` and `"missions": <int count>`; i18n gains `section.stages.<id>.hostLine` and `section.stages.<id>.missions` (array), plus `section.world.missionsTitle`, `section.world.missionsButton`, `section.world.nextStage`. Hub renders a `🏅` chip per completed stage opening a missions modal with per-mission self-star (`Storage.markActivityCompleted('number-friends', '<stageId>-mission-<i>')`).

- [ ] **Step 1: data** — in `data/number-friends.json` add to every level: stage-0 `"host": 1, "missions": 2`; stage-1 `"host": 4, "missions": 2`; stage-2 `"host": 2, "missions": 2`; stage-3 `"host": 6, "missions": 3`; stage-4 `"host": 3, "missions": 2`; stage-5 `"host": 5, "missions": 3`; stage-6 `"host": 10, "missions": 2`.
- [ ] **Step 2: hub JS** — in `number-friends.js`:
  - `renderStage`: when `hasActivities` and every activity id is completed, append after chips: `<button class="mission-chip" data-stage="${stage.id}">🏅 <span>${this.escape(this.t('section.world.missionsButton', 'Real-world missions'))}</span></button>`.
  - `render()`: bind `.mission-chip` clicks → `this.openMissions(stageId)`.
  - Add:
```js
openMissions(stageId) {
  const stage = this.data.levels.find(l => l.id === stageId);
  const raw = window.i18n.getRaw(`section.stages.${stageId}.missions`);
  const missions = Array.isArray(raw) ? raw.slice(0, stage.missions || raw.length) : [];
  const overlay = document.getElementById('mission-overlay');
  const list = document.getElementById('mission-list');
  document.getElementById('mission-title').textContent = this.t('section.world.missionsTitle', 'Explorer missions');
  list.innerHTML = missions.map((m, i) => {
    const done = (() => { try { return window.Storage.isActivityCompleted('number-friends', `${stageId}-mission-${i}`); } catch (e) { return false; } })();
    return `<li class="mission-item${done ? ' done' : ''}" data-i="${i}">
      <button class="mission-speak" aria-label="Read aloud">🔊</button>
      <span class="mission-text">${this.escape(m)}</span>
      <button class="mission-star" aria-pressed="${done}">${done ? '⭐' : '☆'}</button></li>`;
  }).join('');
  list.querySelectorAll('.mission-speak').forEach((b, i) => b.addEventListener('click', () => window.BlockEngine.speak(missions[i])));
  list.querySelectorAll('.mission-star').forEach((b, i) => b.addEventListener('click', () => {
    try { window.Storage.markActivityCompleted('number-friends', `${stageId}-mission-${i}`); } catch (e) {}
    b.textContent = '⭐'; b.closest('.mission-item').classList.add('done');
  }));
  overlay.classList.add('open');
},
```
  - Close handler on `#mission-close` / overlay backdrop click.
- [ ] **Step 3: hub HTML** — before `</main>` in `number-friends/index.html`:
```html
<div class="mission-overlay" id="mission-overlay" role="dialog" aria-modal="true">
  <div class="mission-modal">
    <h2 id="mission-title"></h2>
    <ul id="mission-list"></ul>
    <button class="btn-activity btn-primary" id="mission-close" data-i18n="buttons.done">Done</button>
  </div>
</div>
```
Ensure `block-engine.js` is loaded on the hub page (needed for `speak`; it already is for the hero).
- [ ] **Step 4: hub CSS** — `.mission-overlay { display:none; position: fixed; inset: 0; background: #0006; z-index: 60; align-items: center; justify-content: center; } .mission-overlay.open { display:flex; } .mission-modal { background:#fff8e8; border:4px solid #4b372e; border-radius:18px; padding:24px; max-width:440px; width:92%; } .mission-item { display:flex; gap:10px; align-items:center; padding:8px 0; } .mission-item.done .mission-text { opacity:.6; } .mission-chip { margin-top:8px; }` (match storybook tokens).
- [ ] **Step 5: i18n scaffolding** — add to both lang files (vi shown; en mirrored):
```jsonc
"world": { …existing…, "missionsButton": "Nhiệm vụ thật", "missionsTitle": "Nhiệm vụ nhà thám hiểm số", "nextStage": "Chặng sau" }
// en: "Real-world missions", "Number Explorer missions", "Next stage"
```
Stage `hostLine` + `missions` arrays are added stage-by-stage in Tasks 5–12.
- [ ] **Step 6: Verify** — serve; complete no stage → no chip; temporarily mark stage-0 activities complete in localStorage → chip appears, modal opens, star persists on reload. Undo test data.
- [ ] **Step 7: Commit** `feat(number-friends): story layer — hosts, real-world missions modal`.

---

## Task 5: Stage 0 additions — `who-is-bigger` + `stamp-shapes`

**Files:** Create `number-friends/activities/who-is-bigger.html`, `number-friends/activities/stamp-shapes.html`; modify `data/number-friends.json` (stage-0 activities), both lang files.

- [ ] **Step 1: data** — append to stage-0 `activities`:
```json
{ "id": "who-is-bigger", "icon": "🐊", "path": "activities/who-is-bigger.html", "type": "who-is-bigger" },
{ "id": "stamp-shapes", "icon": "🎪", "path": "activities/stamp-shapes.html", "type": "stamp-shapes" }
```
- [ ] **Step 2: `who-is-bigger.html`** — SNIPPET-GAME-PAGE, `__ID__=who-is-bigger`, `__ICON__=🐊`, `__TITLE_EN__=Who Is Bigger?`, widgets: yes. AREA:
```html
<div class="progress-indicator" id="progress"></div>
<div class="nf-compare">
  <div class="nf-compare-side" id="side-a"></div>
  <div id="zilla"></div>
  <div class="nf-compare-side" id="side-b"></div>
</div>
<div class="answer-choices" id="choices"></div>
<div class="feedback-message" id="feedback"></div>
```
SCRIPT:
```js
class WhoIsBigger extends ActivityBase {
  constructor() { super({ totalRounds: 10, activityId: 'who-is-bigger', gradeLevel: 'number-friends', autoAdvanceDelay: 1700 }); }
  init() {
    super.init();
    this.sideA = document.getElementById('side-a');
    this.sideB = document.getElementById('side-b');
    this.choices = document.getElementById('choices');
    this.zilla = NFWidgets.blockzilla(document.getElementById('zilla'));
    this.sideA.addEventListener('click', () => this.pick('left'));
    this.sideB.addEventListener('click', () => this.pick('right'));
    this.nextRound();
  }
  startRound() {
    const equal = Math.random() < 0.25;
    this.a = this.randomInt(1, 10);
    this.b = equal ? this.a : this.randomInt(1, 10);
    if (!equal && this.b === this.a) this.b = (this.a % 10) + 1;
    BlockEngine.clear(this.sideA); BlockEngine.clear(this.sideB);
    BlockEngine.render(this.sideA, { value: this.a, label: this.a });
    BlockEngine.render(this.sideB, { value: this.b, label: this.b });
    this.zilla.point(null);
    this.choices.innerHTML = '';
    const eq = document.createElement('button');
    eq.className = 'answer-btn'; eq.textContent = '=';
    eq.addEventListener('click', () => this.pick('equal'));
    this.choices.appendChild(eq);
  }
  pick(ans) {
    if (this.isAnswered) return; this.isAnswered = true;
    const truth = this.a === this.b ? 'equal' : (this.a > this.b ? 'left' : 'right');
    const ok = ans === truth;
    this.zilla.point(truth);
    BlockEngine.sfx(ok ? 'correct' : 'wrong');
    if (ok) this.incrementCorrect(); else this.incrementIncorrect();
    const key = 'section.activities.who-is-bigger.' + (truth === 'equal' ? 'equalMsg' : (ok ? 'correct' : 'incorrect'));
    const big = Math.max(this.a, this.b), small = Math.min(this.a, this.b);
    const msg = i18n.t(key).replace('{{big}}', big).replace('{{small}}', small).replace('{{n}}', this.a);
    this.showFeedback(msg, !ok); BlockEngine.speak(msg);
    this.renderProgress(); this.autoAdvance();
  }
  showStats() { try { window.Storage.markActivityCompleted('number-friends', 'who-is-bigger'); } catch (e) {} super.showStats(); }
}
document.addEventListener('DOMContentLoaded', async () => { await i18n.ready(); new WhoIsBigger().init(); });
```
- [ ] **Step 3: `stamp-shapes.html`** — SNIPPET-GAME-PAGE, `__ID__=stamp-shapes`, `__ICON__=🎪`, `__TITLE_EN__=Bouncy Stamps`, widgets: yes. AREA = SNIPPET-AREA-QUIZ with `choices` classed `answer-choices nf-stamp-choices`. SCRIPT:
```js
const ALT_STAMPS = { // alternative (non-canonical) arrangements per count
  2: [[[0,0],[1,0]], [[0,0],[1,1]]],
  3: [[[0,0],[1,0],[1,1]], [[0,0],[1,1],[2,2]], [[0,0],[0,1],[1,0]]],
  4: [[[0,0],[0,1],[0,2],[0,3]], [[0,1],[1,0],[1,1],[2,1]], [[0,0],[0,1],[1,1],[1,2]]],
  5: [[[0,0],[0,1],[0,2],[1,0],[1,1]], [[0,0],[0,1],[0,2],[0,3],[0,4]], [[0,1],[1,0],[1,1],[1,2],[2,1]]],
  6: [[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,2],[1,3],[1,4]], [[0,2],[1,1],[1,2],[2,0],[2,1],[2,2]]]
};
function pickStamp(n) { const v = ALT_STAMPS[n]; return v[Math.floor(Math.random() * v.length)]; }
class StampShapes extends ActivityBase {
  constructor() { super({ totalRounds: 8, activityId: 'stamp-shapes', gradeLevel: 'number-friends', autoAdvanceDelay: 1700 }); }
  init() { super.init(); this.stage = document.getElementById('stage'); this.choices = document.getElementById('choices'); this.nextRound(); }
  startRound() {
    this.n = this.randomInt(2, 6);
    this.odd = this.currentRound % 2 === 1;      // alternate: find-mine / find-the-stranger
    BlockEngine.clear(this.stage); this.choices.innerHTML = '';
    BlockEngine.render(this.stage, { value: this.n, label: this.n });
    const others = [2, 3, 4, 5, 6].filter(v => v !== this.n);
    const wrongN = others[Math.floor(Math.random() * others.length)];
    // build three stamp buttons; in normal mode 1 has n cells, in odd mode 1 has wrongN cells
    const counts = this.odd ? [this.n, this.n, wrongN] : [this.n, wrongN, others[(others.indexOf(wrongN) + 1) % others.length]];
    counts.sort(() => Math.random() - 0.5);
    this.answer = this.odd ? wrongN : this.n;
    const instr = i18n.t('section.activities.stamp-shapes.' + (this.odd ? 'askOdd' : 'askMine')).replace('{{n}}', this.n);
    document.querySelector('.activity-instruction').textContent = instr;
    BlockEngine.speak(instr);
    counts.forEach(c => {
      const b = document.createElement('button');
      b.className = 'answer-btn nf-stamp-btn'; b.dataset.v = c;
      NFWidgets.stamp(b, { cells: pickStamp(c), color: BlockEngine.COLORS[this.n] });
      b.addEventListener('click', () => this.pick(c, b));
      this.choices.appendChild(b);
    });
  }
  reveal() {}
  // SNIPPET-CHOICE-PICK with __ID__=stamp-shapes (message keys correct/incorrect use {{n}})
}
document.addEventListener('DOMContentLoaded', async () => { await i18n.ready(); new StampShapes().init(); });
```
(Include the full SNIPPET-CHOICE-PICK body verbatim in the file; note: in odd mode two stamps share `data-v == this.n` — highlight-the-right-answer uses `b.dataset.v == this.answer`, still correct.)
- [ ] **Step 4: i18n** — add to `lang/vi/number-friends.json` `activities`:
```json
"who-is-bigger": { "title": "Ai lớn hơn?", "instruction": "Chạm vào tháp cao hơn — hoặc dấu = nếu bằng nhau!",
  "correct": "Đúng rồi! {{big}} lớn hơn {{small}}.", "incorrect": "Nhìn lại nhé — {{big}} cao hơn {{small}}.",
  "equalMsg": "Hai bạn cao bằng nhau — là {{n}} đó!",
  "perfect": "Mắt so tài ba!", "great": "So giỏi lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Thử lại nhé!" },
"stamp-shapes": { "title": "Dấu in nhún nhảy", "instruction": "Nhìn dấu in — của bạn số nào?",
  "askMine": "Dấu in nào là của bạn {{n}}?", "askOdd": "Dấu in nào KHÔNG phải của bạn {{n}}?",
  "correct": "Chuẩn luôn! Vẫn là {{n}} dù đứng kiểu gì.", "incorrect": "Đếm thử nhé — bạn {{n}} có {{n}} ô.",
  "perfect": "Vua nhận hình!", "great": "Tinh mắt ghê!", "good": "Làm tốt lắm!", "keepPracticing": "Nhìn kỹ hơn nhé!" }
```
en mirror:
```json
"who-is-bigger": { "title": "Who Is Bigger?", "instruction": "Tap the taller tower — or = if they match!",
  "correct": "Yes! {{big}} is bigger than {{small}}.", "incorrect": "Look again — {{big}} is taller than {{small}}.",
  "equalMsg": "They're the same — both are {{n}}!",
  "perfect": "Compare champion!", "great": "Great comparing!", "good": "Nice work!", "keepPracticing": "Try again!" },
"stamp-shapes": { "title": "Bouncy Stamps", "instruction": "Look at the stamps — whose are they?",
  "askMine": "Which stamp belongs to {{n}}?", "askOdd": "Which stamp is NOT {{n}}'s?",
  "correct": "Right! It's still {{n}}, any way it stands.", "incorrect": "Count and see — {{n}} has {{n}} squares.",
  "perfect": "Shape master!", "great": "Sharp eyes!", "good": "Nice work!", "keepPracticing": "Look closely!" }
```
Also add stage-0 `hostLine` + `missions` to `stages.stage-0` (vi): `"hostLine": "Tớ là Một! Đi khám phá cùng tớ nhé!"`, `"missions": ["Đứng bằng 1 chân và đếm đến 5!", "Tìm 1 đồ vật màu đỏ trong nhà."]`; en: `"hostLine": "I'm One! Come explore with me!"`, `"missions": ["Stand on 1 leg and count to 5!", "Spot 1 red thing in your home."]`.
- [ ] **Step 5: Verify** — serve both pages: play 3+ rounds each, tap fallback works, `=` case appears, stamps render, i18n toggle vi/en, star saved on hub.
- [ ] **Step 6: Commit** `feat(number-friends): stage 0 — who-is-bigger (comparer) + stamp-shapes (conservation)`.

---

## Task 6: Stage 1 — Tách (split-intro, split-free, split-name, missing-part)

**Files:** Create 4 pages; modify `data/number-friends.json` (stage-1), both lang files.

- [ ] **Step 1: data** — stage-1 gets:
```json
"intro": { "id": "split-intro", "path": "activities/split-intro.html" },
"activities": [
  { "id": "split-free", "icon": "✂️", "path": "activities/split-free.html", "type": "split-free" },
  { "id": "split-name", "icon": "🗣️", "path": "activities/split-name.html", "type": "split-name" },
  { "id": "missing-part", "icon": "🧩", "path": "activities/missing-part.html", "type": "missing-part" }
]
```
- [ ] **Step 2: `split-intro.html`** — SNIPPET-INTRO-PAGE (`__ID__=split-intro`, `__TITLE_EN__=Breaking Apart!`). SCRIPT — same shape as meet-blocks-intro but scenes:
```js
// steps (i18n array, 5 entries) — scenes per index:
// 0: host Four says hi (render 4 + hostLine speak)
// 1: render 4, auto split [2,2] after 600ms
// 2: render 4 again, auto split [3,1]
// 3: render 6, makeSplittable — child taps a seam, we split (free play)
// 4: teaser: nextStage text; Done -> ../index.html
async function scene(i, stage) {
  BlockEngine.clear(stage);
  if (i === 0) { const g = BlockEngine.render(stage, { value: 4, label: 4 }); BlockEngine.celebrate(g); }
  if (i === 1 || i === 2) {
    const g = BlockEngine.render(stage, { value: 4, label: 4 });
    setTimeout(() => BlockEngine.split(g.querySelector('.nb-creature'), i === 1 ? [2, 2] : [3, 1]), 600);
  }
  if (i === 3) {
    const g = BlockEngine.render(stage, { value: 6, label: 6 });
    BlockEngine.makeSplittable(g, seam => BlockEngine.split(g.querySelector('.nb-creature'), seam.parts));
  }
}
```
(Full script = meet-blocks-intro script with `values`/render block replaced by `scene(i, stage)` call and step count from i18n.)
- [ ] **Step 3: `split-free.html`** — SNIPPET-GAME-PAGE (`✂️`, host 4). AREA: SNIPPET-AREA-QUIZ without `choices`. SCRIPT:
```js
class SplitFree extends ActivityBase {
  constructor() { super({ totalRounds: 8, activityId: 'split-free', gradeLevel: 'number-friends', autoAdvanceDelay: 1900 }); }
  init() { super.init(); this.stage = document.getElementById('stage');
    NFWidgets.hostBadge(document.querySelector('.activity-header'), { value: 4, text: i18n.t('section.stages.stage-1.hostLine') });
    this.nextRound(); }
  startRound() {
    this.n = this.randomInt(2, 10);
    BlockEngine.clear(this.stage);
    const g = BlockEngine.render(this.stage, { value: this.n, label: this.n });
    BlockEngine.makeSplittable(g, async seam => {
      if (this.isAnswered) return; this.isAnswered = true;
      await BlockEngine.split(g.querySelector('.nb-creature'), seam.parts);
      const msg = i18n.t('section.activities.split-free.result')
        .replace('{{n}}', this.n).replace('{{a}}', seam.parts[0]).replace('{{b}}', seam.parts[1]);
      this.incrementCorrect(); this.showFeedback(msg, false); BlockEngine.speak(msg);
      this.renderProgress(); this.autoAdvance();
    });
  }
  showStats() { try { window.Storage.markActivityCompleted('number-friends', 'split-free'); } catch (e) {} super.showStats(); }
}
document.addEventListener('DOMContentLoaded', async () => { await i18n.ready(); new SplitFree().init(); });
```
- [ ] **Step 4: `split-name.html`** — SNIPPET-GAME-PAGE (`🗣️`). AREA: SNIPPET-AREA-QUIZ. SCRIPT: tower `n = randomInt(3,10)` renders, auto-splits a random seam after 700ms into `[a,b]`; choices = 4 pair strings `"x + y"`:
```js
startRound() {
  this.n = this.randomInt(3, 10);
  const seams = BlockEngine.seamSplits(this.n);
  this.seam = seams[Math.floor(Math.random() * seams.length)];
  const [a, b] = this.seam.parts; this.a = a; this.b = b;
  this.answer = a + '+' + b;
  BlockEngine.clear(this.stage); this.choices.innerHTML = '';
  const g = BlockEngine.render(this.stage, { value: this.n, label: this.n });
  setTimeout(() => { if (!this.isAnswered) BlockEngine.split(g.querySelector('.nb-creature'), [a, b]); }, 700);
  // distractors: other multiset splits of n, then splits of n±1; dedupe as unordered pairs
  const key = p => Math.min(...p) + '+' + Math.max(...p);
  const pool = [];
  [this.n, this.n - 1, this.n + 1].forEach(m => {
    if (m >= 2 && m <= 11) BlockEngine.validSplits(m).forEach(p => pool.push(p));
  });
  const seen = new Set([key([a, b])]);
  const options = [[a, b]];
  pool.sort(() => Math.random() - 0.5).forEach(p => {
    if (options.length < 4 && !seen.has(key(p))) { seen.add(key(p)); options.push(p); }
  });
  options.sort(() => Math.random() - 0.5);
  options.forEach(p => {
    const label = p[0] + '+' + p[1];
    const btn = document.createElement('button');
    btn.className = 'answer-btn'; btn.textContent = p[0] + ' + ' + p[1];
    btn.dataset.v = key(p) === key([a, b]) ? this.answer : label;
    btn.addEventListener('click', () => this.pick(btn.dataset.v, btn));
    this.choices.appendChild(btn);
  });
}
reveal(ok) { /* nothing extra: split already visible */ }
```
plus SNIPPET-CHOICE-PICK (`{{a}}`/`{{b}}` filled from `this.a/this.b`).
- [ ] **Step 5: `missing-part.html`** — SNIPPET-GAME-PAGE (`🧩`). AREA: SNIPPET-AREA-QUIZ with stage split into `<div id="whole"></div><div class="nf-stage" ><div id="part-a"></div><div id="part-b"></div></div>`. SCRIPT:
```js
startRound() {
  this.n = this.randomInt(3, 10);
  this.a = this.randomInt(1, this.n - 1);
  this.b = this.n - this.a; this.answer = this.b;
  BlockEngine.clear(this.whole); BlockEngine.clear(this.partA); BlockEngine.clear(this.partB);
  BlockEngine.render(this.whole, { value: this.n, label: this.n });
  BlockEngine.render(this.partA, { value: this.a, label: this.a });
  this.ghost = BlockEngine.renderSilhouette(this.partB, { value: this.b });
  this.renderChoices(BlockEngine.makeChoices(this.b, 4, 1, 9));
}
reveal(ok) {
  BlockEngine.clear(this.partB);
  const real = BlockEngine.render(this.partB, { value: this.b, label: this.b });
  if (ok) BlockEngine.celebrate(real);
}
```
plus SNIPPET-CHOICE-PICK.
- [ ] **Step 6: i18n (vi / en)** — add `stages.stage-1`: vi `"hostLine": "Tớ là Tư — tớ mê bẻ đôi thành 2 và 2!", "missions": ["Chia 4 quả nho vào 2 bát nhé!", "Bẻ đôi một chiếc bánh — mỗi nửa là bao nhiêu?"]`; en `"hostLine": "I'm Four — I love splitting into 2 and 2!", "missions": ["Split 4 grapes into 2 bowls!", "Break a cracker in half — how much is each half?"]`. Activities (vi):
```json
"split-intro": { "title": "Tách ra nào!", "instruction": "Chạm để xem khối tách ra!",
  "steps": ["Chào! Tớ là Tư. Tớ có trò hay lắm!", "Nhìn nhé — tớ tách thành 2 và 2!", "Tớ còn tách được thành 3 và 1 nữa!", "Đến lượt bạn — chạm vào vạch để tách bạn Sáu!", "Chặng sau: Gộp lại nào!"] },
"split-free": { "title": "Bẻ khối tự do", "instruction": "Chạm vào vạch sáng để tách tháp!",
  "result": "{{n}} tách thành {{a}} và {{b}}!",
  "perfect": "Nhà tách khối!", "great": "Tách cừ lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Tách tiếp nhé!" },
"split-name": { "title": "Tách ra mấy và mấy?", "instruction": "Tháp vừa tách thành mấy và mấy?",
  "correct": "Đúng! {{a}} và {{b}}.", "incorrect": "Là {{a}} và {{b}} đó.",
  "perfect": "Gọi tên siêu chuẩn!", "great": "Giỏi quá!", "good": "Làm tốt lắm!", "keepPracticing": "Nhìn kỹ nhé!" },
"missing-part": { "title": "Phần còn thiếu", "instruction": "Còn thiếu mấy để đủ như tháp lớn?",
  "correct": "Chuẩn! {{a}} và {{b}} làm nên {{n}}.", "incorrect": "{{a}} và {{b}} mới làm nên {{n}}.",
  "perfect": "Thám tử số!", "great": "Tìm giỏi lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Thử tiếp nhé!" }
```
(en mirrors, same keys: "Break Apart Free!", "Which and Which?", "The Missing Part", copy in the same spirit — write natural English, keep `{{}}` slots.)
Note: `missing-part` messages need `{{n}}` — SNIPPET-CHOICE-PICK already replaces `{{n}}` with `this.answer`; in this game override the msg construction to use `this.n/this.a/this.b` explicitly.
- [ ] **Step 7: Verify** — play all 4 pages; seam tap works on touch (DevTools mobile), split animation, vi/en, stars on hub, stage-1 mission chip appears once all 3 starred.
- [ ] **Step 8: Commit** `feat(number-friends): stage 1 — Tách (intro + 3 games)`.

---

## Task 7: Stage 2 — Gộp (merge-intro staircase, merge-free, merge-name, pick-pair)

**Files:** Create 4 pages; modify data (stage-2), lang files.

- [ ] **Step 1: data** — stage-2:
```json
"intro": { "id": "merge-intro", "path": "activities/merge-intro.html" },
"activities": [
  { "id": "merge-free", "icon": "🤝", "path": "activities/merge-free.html", "type": "merge-free" },
  { "id": "merge-name", "icon": "➕", "path": "activities/merge-name.html", "type": "merge-name" },
  { "id": "pick-pair", "icon": "👯", "path": "activities/pick-pair.html", "type": "pick-pair" }
]
```
- [ ] **Step 2: `merge-intro.html`** — SNIPPET-INTRO-PAGE + nf-widgets. Scenes (Number-Magic staircase):
```js
// 0: host Two greets (render 2 + hostLine)
// 1: staircase 5 steps; creature 2 on slot 2, creature 3 on slot 3 ("Hai đứng bậc 2, Ba đứng bậc 3")
// 2: the two walk together: remove both, merge → render 5 on slot 5 ("Gộp lại — cao đúng bậc 5!")
// 3: repeat quickly with 1 + 3 → 4
// 4: teaser nextStage
let stairs;
async function scene(i, stage) {
  BlockEngine.clear(stage);
  if (i === 0) { BlockEngine.render(stage, { value: 2, label: 2 }); return; }
  stairs = NFWidgets.staircase(stage, { steps: 5 });
  if (i === 1) { BlockEngine.render(stairs.slot(2), { value: 2 }); BlockEngine.render(stairs.slot(3), { value: 3 }); }
  if (i === 2) { const s = BlockEngine.render(stairs.slot(5), { value: 5, label: 5 }); BlockEngine.celebrate(s); BlockEngine.sfx('snap'); }
  if (i === 3) { BlockEngine.render(stairs.slot(1), { value: 1 }); BlockEngine.render(stairs.slot(3), { value: 3 });
    setTimeout(() => { BlockEngine.clear(stage); stairs = NFWidgets.staircase(stage, { steps: 5 });
      BlockEngine.celebrate(BlockEngine.render(stairs.slot(4), { value: 4, label: 4 })); BlockEngine.sfx('snap'); }, 1200); }
}
```
- [ ] **Step 3: `merge-free.html`** — SNIPPET-GAME-PAGE (`🤝`, host 2, widgets). AREA: SNIPPET-AREA-QUIZ (no choices). SCRIPT:
```js
startRound() {
  this.a = this.randomInt(1, 6); this.b = this.randomInt(1, Math.min(9 - this.a, 6)); // giữ tổng ≤ 10 và cả hai hiển thị vừa
  BlockEngine.clear(this.stage);
  const ga = BlockEngine.render(this.stage, { value: this.a, label: this.a });
  const gb = BlockEngine.render(this.stage, { value: this.b, label: this.b });
  const join = async () => {
    if (this.isAnswered) return; this.isAnswered = true;
    const sum = await BlockEngine.merge(ga, gb);
    BlockEngine.celebrate(sum);
    const n = this.a + this.b;
    const msg = i18n.t('section.activities.merge-free.result')
      .replace('{{a}}', this.a).replace('{{b}}', this.b).replace('{{n}}', n);
    this.incrementCorrect(); this.showFeedback(msg, false); BlockEngine.speak(msg);
    this.renderProgress(); this.autoAdvance();
  };
  BlockEngine.makeDraggable(ga, [gb], join);
  BlockEngine.makeDraggable(gb, [ga], join);
}
```
(`totalRounds: 8`.)
- [ ] **Step 4: `merge-name.html`** — SNIPPET-GAME-PAGE (`➕`). Two creatures `a`, `b` (`a` 1–9, `b` 1–(10−a)), choices `makeChoices(a+b, 4, 2, 10)`; `reveal(ok)` runs `BlockEngine.merge` of the two rendered groups and celebrates on correct. SNIPPET-CHOICE-PICK, msgs use `{{a}}/{{b}}/{{n}}` (n = sum).
- [ ] **Step 5: `pick-pair.html`** — SNIPPET-GAME-PAGE (`👯`). Whole `n = randomInt(3,10)` rendered; 4 pair buttons, exactly one summing to `n`:
```js
startRound() {
  this.n = this.randomInt(3, 10); this.answer = 'ok';
  BlockEngine.clear(this.stage); this.choices.innerHTML = '';
  BlockEngine.render(this.stage, { value: this.n, label: this.n });
  const good = BlockEngine.validSplits(this.n)[Math.floor(Math.random() * (this.n - 1))];
  const key = p => Math.min(...p) + '+' + Math.max(...p);
  const opts = [[...good]]; const seen = new Set([key(good)]);
  let guard = 0;
  while (opts.length < 4 && guard++ < 200) {
    const x = this.randomInt(1, 9), y = this.randomInt(1, 9);
    if (x + y !== this.n && !seen.has(key([x, y])) && x + y <= 12) { seen.add(key([x, y])); opts.push([x, y]); }
  }
  opts.sort(() => Math.random() - 0.5);
  opts.forEach(p => {
    const b = document.createElement('button');
    b.className = 'answer-btn'; b.textContent = p[0] + ' + ' + p[1];
    b.dataset.v = p[0] + p[1] === this.n ? 'ok' : 'no';
    b.addEventListener('click', () => { this.pair = p; this.pick(b.dataset.v, b); });
    this.choices.appendChild(b);
  });
}
reveal(ok) {
  if (!ok) return;
  BlockEngine.clear(this.stage);
  const ga = BlockEngine.render(this.stage, { value: this.pair[0], label: this.pair[0] });
  const gb = BlockEngine.render(this.stage, { value: this.pair[1], label: this.pair[1] });
  BlockEngine.merge(ga, gb).then(sum => BlockEngine.celebrate(sum));
}
```
(`dataset.v` compare in SNIPPET-CHOICE-PICK: highlight buttons with `b.dataset.v === 'ok'`.)
- [ ] **Step 6: i18n** — `stages.stage-2` vi: `"hostLine": "Tớ là Hai — kết bạn là vui nhất!", "missions": ["Cầm 1 viên sỏi tay trái, 2 viên tay phải — gộp lại là mấy?", "Xếp 2 đôi dép cạnh nhau — đếm xem mấy chiếc!"]`; en mirror. Activities (vi):
```json
"merge-intro": { "title": "Gộp lại nào!", "instruction": "Chạm để xem phép màu bậc thang!",
  "steps": ["Chào! Tớ là Hai. Xem bậc thang thần kỳ này!", "Hai đứng bậc 2, Ba đứng bậc 3.", "Nắm tay nhau — gộp lại cao đúng bậc 5!", "Một và Ba gộp lại — cao bậc mấy nhỉ?", "Chặng sau: Toàn thể của tớ!"] },
"merge-free": { "title": "Ghép hai bạn", "instruction": "Kéo một bạn vào bạn kia (hoặc chạm lần lượt hai bạn)!",
  "result": "{{a}} và {{b}} gộp thành {{n}}!",
  "perfect": "Vua ghép khối!", "great": "Ghép cừ lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Ghép tiếp nhé!" },
"merge-name": { "title": "Gộp thành mấy?", "instruction": "Hai bạn gộp lại thành số mấy?",
  "correct": "Đúng! {{a}} và {{b}} là {{n}}.", "incorrect": "{{a}} và {{b}} gộp thành {{n}} cơ.",
  "perfect": "Siêu cộng khối!", "great": "Giỏi quá!", "good": "Làm tốt lắm!", "keepPracticing": "Cố lên nhé!" },
"pick-pair": { "title": "Ai làm nên tớ?", "instruction": "Cặp nào gộp lại đúng bằng bạn số này?",
  "correct": "Chuẩn! Cặp này làm nên {{n}}.", "incorrect": "Cặp đó chưa bằng {{n}} — xem cặp sáng màu nhé.",
  "perfect": "Thám tử cặp số!", "great": "Tìm cặp giỏi!", "good": "Làm tốt lắm!", "keepPracticing": "Thử tiếp nhé!" }
```
(en mirrors.)
- [ ] **Step 7: Verify** — drag works (mouse + touch emulation), tap-tap fallback merges, staircase intro plays, i18n, stars.
- [ ] **Step 8: Commit** `feat(number-friends): stage 2 — Gộp (staircase intro + 3 games)`.

---

## Task 8: Stage 3 — Toàn thể của tớ, part 1 (bonds-intro, fruit-salad, all-bonds)

**Files:** Create 3 pages; modify data (stage-3 partial), lang files.

- [ ] **Step 1: data** — stage-3:
```json
"intro": { "id": "bonds-intro", "path": "activities/bonds-intro.html" },
"activities": [
  { "id": "fruit-salad", "icon": "🍊", "path": "activities/fruit-salad.html", "type": "fruit-salad" },
  { "id": "all-bonds", "icon": "🌈", "path": "activities/all-bonds.html", "type": "all-bonds" }
]
```
(inside-me/fill-shape/doubles appended in Task 9.)
- [ ] **Step 2: `bonds-intro.html`** — SNIPPET-INTRO-PAGE. Scenes: 0 host Six greets; 1–3 render 6 then auto `split` `[1,5]` / `[2,4]` / `[3,3]` (each step re-renders 6 first); 4 lineup of the three pairs speak "Đều là 6!"; 5 teaser.
- [ ] **Step 3: `fruit-salad.html`** — SNIPPET-GAME-PAGE (`🍊`, widgets, host 6 — but the machine belongs to Ba: hostBadge value 3 with `section.activities.fruit-salad.machineLine`). AREA:
```html
<div class="progress-indicator" id="progress"></div>
<div id="bond-holder" class="nf-stage"></div>
<div class="answer-choices" id="choices"></div>
<div class="feedback-message" id="feedback"></div>
```
SCRIPT (10 rounds, alternate split/merge):
```js
class FruitSalad extends ActivityBase {
  constructor() { super({ totalRounds: 10, activityId: 'fruit-salad', gradeLevel: 'number-friends', autoAdvanceDelay: 1900 }); }
  init() { super.init(); this.holder = document.getElementById('bond-holder'); this.choices = document.getElementById('choices');
    NFWidgets.hostBadge(document.querySelector('.activity-header'), { value: 3, text: i18n.t('section.activities.fruit-salad.machineLine') });
    this.kinds = ['🍊', '🍎', '🍓', '🍌']; this.nextRound(); }
  startRound() {
    this.split = this.currentRound % 2 === 0;
    this.n = this.randomInt(3, 9); this.a = this.randomInt(1, this.n - 1); this.b = this.n - this.a;
    this.answer = this.split ? this.b : this.n;
    this.kind = this.kinds[this.currentRound % this.kinds.length];
    this.holder.innerHTML = ''; this.choices.innerHTML = '';
    this.bond = NFWidgets.bondDiagram(this.holder, { direction: this.split ? 'down' : 'up' });
    if (this.split) {
      NFWidgets.fruitRow(this.bond.top, { count: this.n, kind: this.kind });
      NFWidgets.fruitRow(this.bond.left, { count: this.a, kind: this.kind });
      this.bond.right.textContent = '?';
      this.bond.equation.textContent = this.n + ' = ' + this.a + ' + ?';
    } else {
      this.bond.top.textContent = '?';
      NFWidgets.fruitRow(this.bond.left, { count: this.a, kind: this.kind });
      NFWidgets.fruitRow(this.bond.right, { count: this.b, kind: this.kind });
      this.bond.equation.textContent = this.a + ' + ' + this.b + ' = ?';
    }
    this.renderChoices(BlockEngine.makeChoices(this.answer, 4, 1, 10));
  }
  reveal(ok) {
    if (this.split) { this.bond.right.textContent = ''; NFWidgets.fruitRow(this.bond.right, { count: this.b, kind: this.kind }); }
    else { this.bond.top.textContent = ''; NFWidgets.fruitRow(this.bond.top, { count: this.n, kind: this.kind }); }
    this.bond.equation.textContent = this.split ? (this.n + ' = ' + this.a + ' + ' + this.b) : (this.a + ' + ' + this.b + ' = ' + this.n);
    if (ok) BlockEngine.sfx('snap');
  }
  // + SNIPPET-CHOICE-PICK (__ID__=fruit-salad; msg uses {{a}},{{b}},{{n}} with n = this.n)
}
```
- [ ] **Step 4: `all-bonds.html`** — SNIPPET-GAME-PAGE (`🌈`). 3 rounds, `n` from `[4, 5, 6]` in order. AREA: quiz area + `<div id="found" class="nf-stage"></div>`. Round: show creature n; chips = every unordered split of n (e.g. 5 → `1+4`, `2+3`) plus 3 decoys with sums ≠ n (from n±1); child must tap ALL correct chips; correct chip → chip lights (`.correct`), a mini split render appends into `#found`, `sfx('correct')`; wrong chip → `.incorrect` shake + `incrementIncorrect()` once per round max. Round completes (`incrementCorrect`, feedback `foundAll`) when all correct chips found. This game manages `isAnswered` manually — only set it when round completes.
- [ ] **Step 5: i18n** — stage-3 vi: `"hostLine": "Tớ là Sáu — trong tớ có bao nhiêu cặp bạn nhỉ?", "missions": ["Xếp 5 món đồ chơi thành một đống — chia đống ra 2 phần theo mấy cách?", "Bẻ đôi 6 que tính thành 3 và 3!", "Tìm 2 cách chia 4 chiếc kẹo cho 2 bạn."]`; en mirror. Activities (vi):
```json
"bonds-intro": { "title": "Toàn thể của tớ", "instruction": "Chạm để xem mọi cách tách của Sáu!",
  "steps": ["Chào! Tớ là Sáu — trong tớ giấu nhiều cặp bạn lắm!", "Một và Năm!", "Hai và Bốn!", "Ba và Ba — cặp sinh đôi!", "Cách nào cũng là tớ — Sáu!", "Chặng sau: Trốn tìm!"] },
"fruit-salad": { "title": "Máy Tách Quả", "instruction": "Máy tách quả — bát còn lại có mấy quả?",
  "machineLine": "Chào mừng tới nhà máy quả vui nhộn của tớ!",
  "correct": "Ngon lành! {{a}} và {{b}} — cả thảy {{n}} quả.", "incorrect": "Đếm lại nhé — {{a}} và {{b}} là {{n}} quả.",
  "perfect": "Đầu bếp số!", "great": "Tách quả cừ khôi!", "good": "Làm tốt lắm!", "keepPracticing": "Trộn tiếp nhé!" },
"all-bonds": { "title": "Bao nhiêu cách tách?", "instruction": "Tìm HẾT các cặp làm nên bạn số nhé!",
  "foundOne": "Đúng một cặp rồi!", "foundAll": "Tìm đủ mọi cách tách của {{n}} rồi!", "wrongPair": "Cặp này chưa bằng {{n}}.",
  "perfect": "Vua cầu vồng số!", "great": "Siêu tìm cặp!", "good": "Làm tốt lắm!", "keepPracticing": "Tìm tiếp nhé!" }
```
(en mirrors; fruit-salad en machineLine: "Welcome to my fantastic fun fruit factory!" → paraphrase originally: "Welcome to my fruity fun factory!").
- [ ] **Step 6: Verify + Commit** `feat(number-friends): stage 3 part 1 — bond machine + all-bonds`.

---

## Task 9: Stage 3 — part 2 (inside-me, fill-shape, doubles)

**Files:** Create 3 pages; modify data (append to stage-3 activities), lang files.

- [ ] **Step 1: data** — append:
```json
{ "id": "inside-me", "icon": "🪆", "path": "activities/inside-me.html", "type": "inside-me" },
{ "id": "fill-shape", "icon": "🧊", "path": "activities/fill-shape.html", "type": "fill-shape" },
{ "id": "doubles", "icon": "🪞", "path": "activities/doubles.html", "type": "doubles" }
```
- [ ] **Step 2: `inside-me.html`** — SNIPPET-GAME-PAGE (`🪆`, widgets). 4 rounds: `n ∈ [3, 5, 7, 1]`. Lineup buttons of friends `1..6` (for n=7: `1..8` sample of 6) each a button containing a mini creature (`scale` via CSS class `nf-mini`); child taps every friend `m < n` (correct: button lights, `sfx('correct')`, mini celebrate) — bigger/equal → shake + message `tooBig`. Round n=1 is special: lineup `2..6` + one extra `answer-btn` labeled from key `nobody`; correct answer = `nobody` (One is too small to contain anyone). Round completes when all `m < n` found (or `nobody` tapped for n=1).
- [ ] **Step 3: `fill-shape.html`** — SNIPPET-GAME-PAGE (`🧊`). SCRIPT core:
```js
startRound() {
  this.n = this.randomInt(5, 10);
  this.a = this.randomInt(1, this.n - 1); this.b = this.n - this.a; this.answer = this.b;
  BlockEngine.clear(this.stage); this.choices.innerHTML = '';
  const label = document.createElement('div'); label.className = 'nb-label'; label.textContent = this.n;
  this.sil = BlockEngine.renderSilhouette(this.stage, { value: this.n, filled: this.a });
  this.stage.appendChild(label);
  BlockEngine.makeChoices(this.b, 3, 1, 9).forEach(v => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn nf-block-choice'; btn.dataset.v = v;
    BlockEngine.render(btn, { value: v, face: true });
    btn.addEventListener('click', () => this.pick(v, btn));
    this.choices.appendChild(btn);
  });
}
reveal(ok) { BlockEngine.fillSilhouette(this.sil, this.b); if (ok) BlockEngine.celebrate(this.sil); }
```
CSS (activity.css): `.nf-block-choice .nb-group { transform: scale(.45); transform-origin: center; } .nf-block-choice { min-height: 120px; }`.
- [ ] **Step 4: `doubles.html`** — SNIPPET-GAME-PAGE (`🪞`, widgets). 10 rounds alternating: even rounds = double (`a` 1–5; render creature a + mirrored copy `class nf-mirror`; ask `a+a` via choices; reveal = merge to `2a`); odd rounds = halve (`n ∈ [2,4,6,8,10]`; render n; ask "bẻ đôi mỗi nửa mấy?"; choices `n/2`; reveal = `BlockEngine.split(creature, [n/2, n/2])`). Mirror render: `const m = BlockEngine.render(this.stage, { value: a, face: true }); m.classList.add('nf-mirror');`.
- [ ] **Step 5: i18n (vi)** —
```json
"inside-me": { "title": "Ai ở trong tớ?", "instruction": "Chạm vào TẤT CẢ các bạn nằm vừa trong bạn số lớn!",
  "tooBig": "Bạn này to quá, không chui vừa đâu!", "foundAll": "Đúng hết rồi — các bạn nhỏ đều ở trong {{n}}!",
  "nobody": "Không ai cả!", "nobodyMsg": "Đúng! Một bé xíu nên không chứa được ai.",
  "perfect": "Búp bê số lồng nhau!", "great": "Tinh mắt lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Thử lại nhé!" },
"fill-shape": { "title": "Lấp hình bóng", "instruction": "Bạn khối nào lấp vừa khít phần còn trống?",
  "correct": "Vừa khít! {{a}} và {{b}} làm nên {{n}}.", "incorrect": "Cần bạn {{b}} cơ — {{a}} và {{b}} mới đủ {{n}}.",
  "perfect": "Thợ xếp hình!", "great": "Khéo ghê!", "good": "Làm tốt lắm!", "keepPracticing": "Ướm thử nhé!" },
"doubles": { "title": "Gương nhân đôi", "instruction": "Soi gương nào — hai bạn giống hệt gộp thành mấy?",
  "halveInstruction": "Bẻ đôi thật đều — mỗi nửa là mấy?",
  "correct": "Chuẩn! {{a}} và {{a}} là {{n}}.", "incorrect": "{{a}} và {{a}} gộp thành {{n}} cơ.",
  "halveCorrect": "Đúng! {{n}} bẻ đôi thành {{a}} và {{a}}.", "halveIncorrect": "{{n}} bẻ đôi thành {{a}} và {{a}} cơ.",
  "perfect": "Phù thủy gương!", "great": "Nhân đôi cừ khôi!", "good": "Làm tốt lắm!", "keepPracticing": "Soi tiếp nhé!" }
```
(en mirrors: "Who's Inside Me?", "Fill the Shape", "Mirror Doubles".)
- [ ] **Step 6: Verify + Commit** `feat(number-friends): stage 3 part 2 — inside-me, fill-shape, mirror doubles`.

---

## Task 10: Stage 4 — Trốn tìm (hide-intro, hide-seek, bond-missing, take-away)

**Files:** Create 4 pages; data (stage-4); lang files.

- [ ] **Step 1: data** — stage-4: intro `hide-intro`; activities `hide-seek` 🫣, `bond-missing` ❓, `take-away` 🍃 (paths `activities/<id>.html`).
- [ ] **Step 2: `hide-intro.html`** — SNIPPET-INTRO-PAGE. Scenes: 0 host Ba greets; 1 render 5, after 700ms overlay 🌳 (`.nb-hide` div appended into the last 2 `.nb-cube`s) "Hai bạn trốn sau bụi cây!"; 2 remove overlays + celebrate "Ló ra rồi — vẫn là 5!"; 3 render 7, hide 3, ask rhetorically; 4 reveal; 5 teaser.
- [ ] **Step 3: `hide-seek.html`** — SNIPPET-GAME-PAGE (`🫣`). SCRIPT core:
```js
startRound() {
  this.n = this.randomInt(3, 10); this.k = this.randomInt(1, this.n - 1); this.answer = this.k;
  BlockEngine.clear(this.stage); this.choices.innerHTML = '';
  this.g = BlockEngine.render(this.stage, { value: this.n, label: this.n });
  const cubes = this.g.querySelectorAll('.nb-cube');
  setTimeout(() => {
    if (this.isAnswered) return;
    for (let i = cubes.length - this.k; i < cubes.length; i++) {
      const bush = document.createElement('div'); bush.className = 'nb-hide'; bush.textContent = '🌳';
      cubes[i].appendChild(bush);
    }
    BlockEngine.sfx('pop');
    this.renderChoices(BlockEngine.makeChoices(this.k, 4, 1, 9));
  }, 900);
}
reveal(ok) {
  this.g.querySelectorAll('.nb-hide').forEach(b => b.remove());
  if (ok) BlockEngine.celebrate(this.g);
}
```
Messages use `{{m}}` (visible = n−k), `{{k}}`, `{{n}}` — replace explicitly in `pick`.
- [ ] **Step 4: `bond-missing.html`** — SNIPPET-GAME-PAGE (`❓`, widgets). Same flow as fruit-salad's split mode but with blocks: bond top = mini creature `n` (append `BlockEngine.render(this.bond.top, { value: n, face: false })` with CSS scale class `nf-bond-block`), left = creature `a`, right `?`; choices = `b`; reveal renders `b` into right. Add CSS `.nf-bond-block .nb-group, .nf-bond-circle .nb-group { transform: scale(.4); }` to `activity.css`.
- [ ] **Step 5: `take-away.html`** — SNIPPET-GAME-PAGE (`🍃`). Render `n` (3–10); after 900ms the last `x` (1..n−1) cubes get class `nb-cube--gone` (CSS: `transform: translateY(70px) scale(.3); opacity: 0; transition: .5s;` — add to nf-widgets.css) + `sfx('pop')`; ask remaining `n−x` via choices; reveal on correct: re-render as creature `n−x` + celebrate. Messages `{{n}} bớt {{x}} còn {{r}}`.
- [ ] **Step 6: i18n** — stage-4 vi `"hostLine": "Tớ là Ba — chơi trốn tìm không?", "missions": ["Giấu 2 trong 5 món đồ sau lưng — đố bé mấy món đang trốn!", "Cả nhà chơi trốn tìm — đếm to tới 10 nhé!"]`. Activities vi:
```json
"hide-intro": { "title": "Trốn tìm", "instruction": "Chạm để chơi trốn tìm cùng khối!",
  "steps": ["Chào! Tớ là Ba — trùm trốn tìm đây!", "Suỵt… hai bạn trốn sau bụi cây!", "Ló ra rồi — vẫn là 5!", "Giờ ba bạn của Bảy đi trốn…", "Thấy chưa — 4 và 3 làm nên 7!", "Chặng sau: Làm bạn với 5 và 10!"] },
"hide-seek": { "title": "Khối trốn", "instruction": "Mấy bạn đang trốn sau bụi cây?",
  "correct": "Bắt được! {{k}} bạn trốn — {{m}} và {{k}} làm nên {{n}}.", "incorrect": "Có {{k}} bạn trốn — {{m}} và {{k}} là {{n}}.",
  "perfect": "Mắt thần trốn tìm!", "great": "Tìm giỏi lắm!", "good": "Làm tốt lắm!", "keepPracticing": "Tìm tiếp nhé!" },
"bond-missing": { "title": "Mảnh ghép bí ẩn", "instruction": "Vòng tròn trống là số mấy?",
  "correct": "Chuẩn! {{n}} tách thành {{a}} và {{b}}.", "incorrect": "{{n}} tách thành {{a}} và {{b}} cơ.",
  "perfect": "Thám tử mảnh ghép!", "great": "Suy luận cừ!", "good": "Làm tốt lắm!", "keepPracticing": "Nghĩ tiếp nhé!" },
"take-away": { "title": "Còn lại bao nhiêu?", "instruction": "Vài khối bay đi — còn lại mấy?",
  "correct": "Đúng! {{n}} bớt {{x}} còn {{r}}.", "incorrect": "{{n}} bớt {{x}} còn {{r}} cơ.",
  "perfect": "Siêu tính nhẩm!", "great": "Giỏi quá!", "good": "Làm tốt lắm!", "keepPracticing": "Đếm lại nhé!" }
```
(en mirrors.)
- [ ] **Step 7: Verify + Commit** `feat(number-friends): stage 4 — Trốn tìm (intro + 3 games)`.

---

## Task 11: Stage 5 — Bạn của 5 & 10 (frame-intro, five-frame, ten-frame, number-rainbow, how-many-more)

**Files:** Create 5 pages; data (stage-5); lang files.

- [ ] **Step 1: data** — stage-5: intro `frame-intro`; activities `five-frame` ✋, `ten-frame` 🔟, `number-rainbow` 🌈, `how-many-more` 🎯.
- [ ] **Step 2: `frame-intro.html`** — SNIPPET-INTRO-PAGE. Scenes: 0 host Năm ("Tớ là Năm — như một bàn tay ✋!") render 5 + '✋' caption; 1 `renderSilhouette({value:5, layout:'frame', filled:3})` "3 rồi… thiếu 2 nữa đầy 5"; 2 fill to full + celebrate; 3 host Mười + `renderSilhouette({value:10, layout:'frame', filled:10})` "Mười là hai hàng năm — hai bàn tay!"; 4 teaser.
- [ ] **Step 3: `five-frame.html`** — SNIPPET-GAME-PAGE (`✋`). Explore-style (no wrong): 8 rounds; `a = randomInt(0,4)`; render `renderSilhouette({value:5, layout:'frame', filled:a})`; child taps the silhouette — each tap `fillSilhouette(sil, 1)` + speak count `a+i`; when 0 ghosts remain → feedback `result` "{{a}} và {{b}} làm nên 5" (`b = 5−a`), `incrementCorrect`, autoAdvance. Bind tap on the sil root; ignore when full.
- [ ] **Step 4: `ten-frame.html`** — same as five-frame with `value: 10`, `a = randomInt(3,9)`, message "… làm nên 10". (Write the file fully; do not share code between the two pages.)
- [ ] **Step 5: `number-rainbow.html`** — SNIPPET-GAME-PAGE (`🌈`, widgets). AREA: progress + `<div id="rainbow-holder" class="nf-stage"></div>` + feedback (no `choices` — the rainbow's number buttons ARE the choices). SCRIPT: 6 rounds over shuffled pairs `[0,1,2,3,4,5]`; each round: highlight `a` (add `.correct` style class `nf-glow` to button `a`), speak prompt "{{a}} cần bạn mấy để thành 10?"; click on number `10−a` → `rainbow.arc(a)`, both buttons `.correct`, `sfx('correct')`, incrementCorrect; wrong button → shake `.incorrect`, show right one, incrementIncorrect. Rainbow persists across rounds (arcs accumulate → full rainbow at end). Build once in `init`, not per-round.
- [ ] **Step 6: `how-many-more.html`** — SNIPPET-GAME-PAGE (`🎯`). Quiz: `a = randomInt(1,9)`, `renderSilhouette({value:10, layout:'frame', filled:a})`, choices `makeChoices(10−a, 4, 1, 9)`; reveal fills ghosts. Messages `{{a}}` + `{{b}}` = 10.
- [ ] **Step 7: i18n** — stage-5 vi `"hostLine": "Tớ là Năm — đập tay nào! Mười là hai bàn tay đó!", "missions": ["Giơ 3 ngón tay — thiếu mấy ngón nữa đủ 5?", "Đếm 10 ngón tay thật to!", "Xếp 10 hạt vào 2 hàng 5 như khung mười."]`. Activities vi:
```json
"frame-intro": { "title": "Bàn tay 5 — khung 10", "instruction": "Chạm để làm quen khung 5 và khung 10!",
  "steps": ["Tớ là Năm — như một bàn tay xòe!", "Khung có 3 rồi… thiếu 2 nữa là đầy!", "Đầy 5 rồi — đập tay!", "Còn tớ là Mười — hai hàng năm, hai bàn tay!", "Chặng sau: Mười và vài đơn vị!"] },
"five-frame": { "title": "Đầy khung 5", "instruction": "Chạm vào ô trống để lấp đầy khung 5!",
  "result": "{{a}} và {{b}} làm nên 5!", "tapMore": "Chạm tiếp nào!",
  "perfect": "Bàn tay vàng!", "great": "Đầy khung cừ khôi!", "good": "Làm tốt lắm!", "keepPracticing": "Lấp tiếp nhé!" },
"ten-frame": { "title": "Đầy khung 10", "instruction": "Chạm vào ô trống để lấp đầy khung 10!",
  "result": "{{a}} và {{b}} làm nên 10!", "tapMore": "Chạm tiếp nào!",
  "perfect": "Vua khung mười!", "great": "Đầy khung cừ khôi!", "good": "Làm tốt lắm!", "keepPracticing": "Lấp tiếp nhé!" },
"number-rainbow": { "title": "Cầu vồng số 10", "instruction": "Bạn số nào ghép với bạn sáng màu để thành 10?",
  "ask": "{{a}} cần bạn mấy để thành 10?",
  "correct": "Tuyệt! {{a}} và {{b}} là đôi bạn của 10.", "incorrect": "{{a}} phải ghép với {{b}} cơ.",
  "perfect": "Cầu vồng trọn vẹn!", "great": "Ghép đôi cừ khôi!", "good": "Làm tốt lắm!", "keepPracticing": "Ghép tiếp nhé!" },
"how-many-more": { "title": "Thiếu mấy nữa?", "instruction": "Thiếu mấy ô nữa thì đầy khung 10?",
  "correct": "Đúng! {{a}} thêm {{b}} là 10.", "incorrect": "{{a}} cần thêm {{b}} nữa mới đủ 10.",
  "perfect": "Thần khung mười!", "great": "Tính bù siêu!", "good": "Làm tốt lắm!", "keepPracticing": "Đếm ô trống nhé!" }
```
(en mirrors.)
- [ ] **Step 8: Verify + Commit** `feat(number-friends): stage 5 — five/ten frames, make-10 rainbow, how-many-more`.

---

## Task 12: Stage 6 — Mười và vài đơn vị (teen-intro, teen-build, teen-split)

**Files:** Create 3 pages; data (stage-6); lang files.

- [ ] **Step 1: data** — stage-6: intro `teen-intro`; activities `teen-build` 🏗️, `teen-split` 🔟.
- [ ] **Step 2: `teen-intro.html`** — SNIPPET-INTRO-PAGE. Scenes: 0 host Mười; 1 render 10 + render 3 side by side "Mười… và ba bạn lẻ"; 2 `BlockEngine.merge` the two → 13 "Mười-và-ba — Mười Ba!"; 3 render 15 then `split([10, 5])` "Trong mỗi số teen luôn có một bạn Mười"; 4 teaser: "Bạn đã đi hết hành trình tách gộp — chơi lại chặng nào tùy thích!".
- [ ] **Step 3: `teen-build.html`** — SNIPPET-GAME-PAGE (`🏗️`). Explore-style: 6 rounds; `n = randomInt(11, 19)`; big numeral `n` shown (`.nf-teen-numeral` div, font Chango 3rem); `renderSilhouette({value:n, filled:10})` (canonical teen pattern = full ten block + ones ghosts); child taps to fill each ghost with count speak (`11, 12, …`); full → "{{ones}} và 10 làm nên {{n}}" + celebrate, incrementCorrect, autoAdvance.
- [ ] **Step 4: `teen-split.html`** — SNIPPET-GAME-PAGE (`🔟`). Quiz: `n = randomInt(11, 19)`; render creature `n`; ask "10 và mấy?"; choices `makeChoices(n − 10, 4, 1, 9)`; reveal: `BlockEngine.split(creature, [10, n − 10])` + celebrate on correct. Use `decomposeTeen(n).ones` for the answer.
- [ ] **Step 5: i18n** — stage-6 vi `"hostLine": "Tớ là Mười — các số teen đều cõng tớ trên lưng đó!", "missions": ["Đếm 12 bậc cầu thang — dừng ở bậc 10 hô to: MƯỜI!", "Xếp 13 viên sỏi: 10 viên một hàng, mấy viên lẻ?"]`. Activities vi:
```json
"teen-intro": { "title": "Mười và vài đơn vị", "instruction": "Chạm để gặp các số teen!",
  "steps": ["Tớ là Mười — tròn trịa hai hàng năm!", "Đây là Mười… và ba bạn lẻ.", "Gộp lại — Mười-và-ba: Mười Ba!", "Tách Mười Lăm ra — luôn có một bạn Mười bên trong!", "Bạn đã đi trọn hành trình — chơi lại chặng nào cũng được!"] },
"teen-build": { "title": "Dựng số teen", "instruction": "Chạm ô trống để dựng cho đủ số!",
  "result": "10 và {{ones}} làm nên {{n}}!",
  "perfect": "Kiến trúc sư teen!", "great": "Dựng cừ khôi!", "good": "Làm tốt lắm!", "keepPracticing": "Dựng tiếp nhé!" },
"teen-split": { "title": "Tách số teen", "instruction": "Số này là 10 và mấy?",
  "correct": "Chuẩn! {{n}} là 10 và {{ones}}.", "incorrect": "{{n}} là 10 và {{ones}} cơ.",
  "perfect": "Bậc thầy số teen!", "great": "Tách teen cừ!", "good": "Làm tốt lắm!", "keepPracticing": "Nhìn hàng mười nhé!" }
```
(en mirrors.)
- [ ] **Step 6: Verify + Commit** `feat(number-friends): stage 6 — teen numbers (Ten Again)`.

---

## Task 13: SEO + final QA sweep

**Files:** Modify `sitemap.xml`; QA fixes wherever found.

- [ ] **Step 1: sitemap** — after the existing number-friends entries add one `<url>` per new page (28 total), pattern:
```xml
<url>
  <loc>https://math.alsatian.co/number-friends/activities/<id>.html</loc>
  <lastmod>2026-07-16</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```
ids: who-is-bigger, stamp-shapes, split-intro, split-free, split-name, missing-part, merge-intro, merge-free, merge-name, pick-pair, bonds-intro, fruit-salad, all-bonds, inside-me, fill-shape, doubles, hide-intro, hide-seek, bond-missing, take-away, frame-intro, five-frame, ten-frame, number-rainbow, how-many-more, teen-intro, teen-build, teen-split.
- [ ] **Step 2: QA checklist** — for EVERY new page: loads without console errors · playable by touch only · drag has tap fallback · wrong answer acts out the right one · 🔊 speaks in vi and en · mute persists · `prefers-reduced-motion` (emulate) still playable · mobile 375px layout · star lands on hub · mission chip appears when a stage completes.
- [ ] **Step 3:** `node --test js/block-engine.test.js` → PASS.
- [ ] **Step 4: Run the `verify` skill** (drive the real flow end-to-end) before the final commit.
- [ ] **Step 5: Commit** `feat(number-friends): sitemap for 28 new pages + QA fixes`.
