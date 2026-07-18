// js/block-engine.js
// Shared visual engine for the "Bạn Số" / Number Friends world.
// Renders numbers as cube creatures in canonical subitizing layouts and
// animates split/merge. Pure logic (COLORS, patternCoords, validSplits,
// makeChoices, decomposeTeen) is DOM-free and unit-tested via `node --test`.
(function () {
  'use strict';

  const COLORS = {
    0: '#c9c0ad', 1: '#e0403f', 2: '#f68b21', 3: '#f6c521', 4: '#4fb04b',
    5: '#2f9ee0', 6: '#7b5aa6', 7: '#8e5bbf', 8: '#ef5ba1', 9: '#9b9788', 10: '#e04b3f',
    11: '#d66f55', 12: '#e7aa42', 13: '#58a967', 14: '#4594c9', 15: '#8a72c6',
    16: '#c46aa5', 17: '#cf7d38', 18: '#64a86e', 19: '#818b92', 20: '#5676c8'
  };

  const FRIEND_STYLES = {
    0: { accent: '#8b8171', expression: 'soft', decor: 'none' },
    1: { accent: '#f6b7a0', expression: 'bright', decor: 'none', eyes: 1 },
    2: { accent: '#f5c273', expression: 'soft', decor: 'glasses' },
    3: { accent: '#ffe08a', expression: 'bright', decor: 'crown' },
    4: { accent: '#b7dc75', expression: 'calm', decor: 'brows' },
    5: { accent: '#9bd4e7', expression: 'bright', decor: 'starHand' },
    6: { accent: '#d4a6e3', expression: 'happy', decor: 'dice' },
    7: {
      accent: '#ffd060', expression: 'happy', decor: 'none',
      cubes: ['#e0403f', '#f68b21', '#f6c521', '#4fb04b', '#2f9ee0', '#7b5aa6', '#8e5bbf']
    },
    8: { accent: '#f4a3bd', expression: 'calm', decor: 'bow' },
    9: { accent: '#d2c9ad', expression: 'soft', decor: 'sneezy' },
    10: { accent: '#a7d6bd', expression: 'bright', decor: 'stripes' },
    11: { accent: '#f6b7a0', expression: 'happy', decor: 'none' },
    12: { accent: '#ffd37c', expression: 'soft', decor: 'sprout' },
    13: { accent: '#a7d887', expression: 'bright', decor: 'star' },
    14: { accent: '#9fd3f1', expression: 'happy', decor: 'spark' },
    15: { accent: '#cbb3ef', expression: 'calm', decor: 'bow' },
    16: { accent: '#efa9ce', expression: 'soft', decor: 'lashes' },
    17: { accent: '#f4c16a', expression: 'happy', decor: 'crayons' },
    18: { accent: '#a8d48c', expression: 'bright', decor: 'sprout' },
    19: { accent: '#cfc7b1', expression: 'calm', decor: 'brows' },
    20: { accent: '#aebce9', expression: 'happy', decor: 'star' }
  };

  function rowCells(rowIndex, count, startColumn) {
    const cells = [];
    for (let columnIndex = 0; columnIndex < count; columnIndex++) {
      cells.push({ r: rowIndex, c: columnIndex + (startColumn || 0) });
    }
    return cells;
  }

  function rectangleCells(rowCount, columnCount, startRow) {
    const cells = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      cells.push(...rowCells(rowIndex + (startRow || 0), columnCount));
    }
    return cells;
  }

  function cellSize(cells) {
    if (cells.length === 0) return { rows: 0, cols: 0 };
    return {
      rows: Math.max(...cells.map(cell => cell.r)) + 1,
      cols: Math.max(...cells.map(cell => cell.c)) + 1
    };
  }

  function shiftedCells(cells, rowOffset, columnOffset) {
    return cells.map(cell => ({ r: cell.r + rowOffset, c: cell.c + columnOffset }));
  }

  // Canonical hand-drawn layouts. Each entry is a list of {r,c} grid cells.
  const PATTERNS = {
    0: [],
    1: [{ r: 0, c: 0 }],
    2: rowCells(0, 2),
    3: rowCells(0, 3),
    4: rectangleCells(2, 2),
    5: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }],
    6: rectangleCells(2, 3),
    7: [{ r: 0, c: 0, x: '50%' }, ...rectangleCells(3, 2, 1)],
    8: rectangleCells(2, 4),
    9: rectangleCells(3, 3),
    10: rectangleCells(2, 5)
  };

  for (let numberValue = 11; numberValue <= 20; numberValue++) {
    const extraCells = PATTERNS[numberValue - 10];
    const extraSize = cellSize(extraCells);
    const centeredColumn = Math.max(0, Math.floor((5 - extraSize.cols) / 2));
    PATTERNS[numberValue] = [
      ...rectangleCells(2, 5),
      ...shiftedCells(extraCells, 2, centeredColumn)
    ];
  }

  function patternCoords(n) {
    const cells = PATTERNS[n];
    if (!cells) throw new RangeError('patternCoords supports 0..20, got ' + n);
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

  // ---------- audio (optional; no-op when unsupported or muted) ----------

  let _audioCtx = null;
  let _narrationAudio = null;
  let _narrationRequest = 0;
  let _deferredNarration = null;
  let _deferredNarrationListening = false;
  let _deferredNarrationPrompt = null;
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
    if (_muted || typeof window === 'undefined') return;
    try {
      const request = ++_narrationRequest;
      const value = String(text);
      const lang = opts.lang || (window.i18n && window.i18n.currentLang === 'en' ? 'en-US' : 'vi-VN');
      const exactFile = lang.startsWith('en') && (
        (opts.audioId && window.TTS_AUDIO_BY_ID && window.TTS_AUDIO_BY_ID[opts.audioId]) ||
        (window.TTS_AUDIO && window.TTS_AUDIO[value])
      );
      // Dynamic math feedback (for example, "Yes! That's 7.") has many
      // possible combinations. Speak its final numeric result with the
      // generated voice rather than dropping to a robotic system voice.
      const numberMatch = value.match(/\b\d+\b/g);
      const resultFile = !exactFile && lang.startsWith('en') && numberMatch && window.TTS_AUDIO &&
        window.TTS_AUDIO[numberMatch[numberMatch.length - 1]];
      const file = exactFile || resultFile;
      if (_narrationAudio) {
        _narrationAudio.pause();
        _narrationAudio = null;
      }
      if (file) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        const audio = new Audio(file);
        _narrationAudio = audio;
        audio.onended = audio.onerror = () => { if (_narrationAudio === audio) _narrationAudio = null; };
        audio.play().catch((error) => {
          // A later narration superseded this request. In particular, pausing
          // the old Audio can reject its promise with AbortError; never turn
          // that stale rejection into duplicate browser speech.
          if (request !== _narrationRequest) return;
          if (_narrationAudio === audio) _narrationAudio = null;
          // iPad/iPhone only permits media playback after a gesture in the
          // current document. Preserve the generated narration and replay it
          // on the next touch instead of replacing it with Web Speech.
          if (error && error.name === 'NotAllowedError') {
            deferNarration(value, opts, request);
            return;
          }
          speakWithBrowser(value, lang);
        });
        return;
      }
      speakWithBrowser(value, lang);
    } catch (e) { /* speech is optional */ }
  }

  function deferNarration(text, opts, request) {
    _deferredNarration = { text, opts, request };
    showDeferredNarrationPrompt();
    if (_deferredNarrationListening) return;
    _deferredNarrationListening = true;
    const retry = () => {
      window.removeEventListener('pointerdown', retry, true);
      window.removeEventListener('touchstart', retry, true);
      if (_deferredNarrationPrompt) {
        _deferredNarrationPrompt.remove();
        _deferredNarrationPrompt = null;
      }
      const pending = _deferredNarration;
      _deferredNarration = null;
      _deferredNarrationListening = false;
      if (pending && pending.request === _narrationRequest) speak(pending.text, pending.opts);
    };
    window.addEventListener('pointerdown', retry, { once: true, capture: true });
    window.addEventListener('touchstart', retry, { once: true, capture: true });
  }

  function showDeferredNarrationPrompt() {
    if (_deferredNarrationPrompt || !document.body) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tts-tap-to-hear';
    button.textContent = '🔊 Tap to hear';
    button.setAttribute('aria-label', 'Tap to hear narration');
    button.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:1000;padding:10px 14px;border:0;border-radius:999px;background:#2f9ee0;color:#fff;font:600 15px system-ui,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.22);';
    document.body.appendChild(button);
    _deferredNarrationPrompt = button;
  }

  function speakWithBrowser(text, lang) {
    if (!window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang;
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech is optional */ }
  }

  // ---------- DOM rendering ----------

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function towerCells(n) {
    const cells = [];
    for (let i = 0; i < n; i++) cells.push({ r: i, c: 0 });
    return cells;
  }

  function buildCreature(value, color, opts) {
    opts = opts || {};
    const isTower = opts.layout === 'tower';
    const cells = isTower ? towerCells(value) : PATTERNS[value];
    const size = isTower ? { rows: value, cols: value > 0 ? 1 : 0 } : gridSize(value);
    const friendStyle = FRIEND_STYLES[value] || FRIEND_STYLES[10];
    const wrap = el('div', 'nb-creature');
    wrap.classList.add('nb-creature--value-' + value, 'nb-expression-' + friendStyle.expression);
    if (value > 10) wrap.classList.add('nb-creature--teen');
    if (isTower) wrap.classList.add('nb-creature--tower');
    if (size.cols >= 5) wrap.classList.add('nb-creature--wide');
    if (size.rows >= 4) wrap.classList.add('nb-creature--tall');
    if (size.rows >= 7) wrap.classList.add('nb-creature--xtall');
    wrap.dataset.value = value;
    wrap.setAttribute('aria-label', 'Number ' + value + ' block friend');
    wrap.style.setProperty('--nb-color', color);
    wrap.style.setProperty('--nb-accent', friendStyle.accent);
    wrap.style.setProperty('--nb-cols', size.cols || 1);
    wrap.style.setProperty('--nb-rows', size.rows || 1);
    cells.forEach((cell, index) => {
      const cube = el('div', 'nb-cube');
      cube.style.gridRowStart = cell.r + 1;
      cube.style.gridColumnStart = cell.c + 1;
      if (cell.x) cube.style.setProperty('--nb-cell-shift-x', cell.x);
      if (friendStyle.cubes && friendStyle.cubes[index]) cube.style.setProperty('--nb-cell-color', friendStyle.cubes[index]);
      cube.style.setProperty('--nb-tilt', (((index + value) % 3) - 1) * 0.55 + 'deg');
      wrap.appendChild(cube);
    });
    if (friendStyle.decor === 'stripes') {
      wrap.classList.add('nb-creature--stripes');
    } else if (friendStyle.decor !== 'none') {
      const decor = el('div', 'nb-decor nb-decor--' + friendStyle.decor);
      if (friendStyle.decor === 'crayons') {
        ['#ef5a45', '#f0b641', '#8abf4e', '#44a2d4', '#8a66bc'].forEach(crayonColor => {
          const crayon = el('span');
          crayon.style.setProperty('--nb-crayon-color', crayonColor);
          decor.appendChild(crayon);
        });
      }
      wrap.appendChild(decor);
    }
    const face = el('div', 'nb-face' + (friendStyle.decor === 'glasses' ? ' nb-face--glasses' : ''));
    const eyeCount = friendStyle.eyes || 2;
    face.innerHTML = '<span class="nb-eye"></span>'.repeat(eyeCount) + '<span class="nb-mouth"></span>';
    wrap.appendChild(face);
    const badge = el('div', 'nb-number-badge');
    badge.textContent = value;
    wrap.appendChild(badge);
    return wrap;
  }

  function render(container, opts) {
    const value = opts.value;
    const color = opts.color || COLORS[value] || COLORS[Math.min(value, 20)] || COLORS[10];
    const root = el('div', 'nb-group');
    root.classList.add('nb-group--value-' + value);
    root.appendChild(buildCreature(value, color, opts));
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

  // ---------- silhouettes / splittable / draggable ----------

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
    if (value > 10) body.classList.add('nb-creature--teen');
    if (cols >= 5) body.classList.add('nb-creature--wide');
    if (rows >= 4) body.classList.add('nb-creature--tall');
    if (rows >= 7) body.classList.add('nb-creature--xtall');
    body.dataset.value = value;
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
    const rawValue = creature.dataset.value !== undefined ? creature.dataset.value : groupEl.dataset.value;
    const value = parseInt(rawValue, 10);
    if (!Number.isFinite(value) || value < 2) return;
    creature.querySelectorAll('.nb-seam').forEach(seamEl => seamEl.remove());
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
    targets = Array.from(targets);
    let startX = 0, startY = 0, moved = false;
    let cleanupSelectionListeners = () => {};
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
    dragEl.addEventListener('pointercancel', () => {
      dragEl.classList.remove('nb-dragging');
      dragEl.style.transform = '';
    });
    dragEl.addEventListener('pointerup', e => {
      dragEl.classList.remove('nb-dragging');
      dragEl.style.transform = '';
      // Always drop any listeners from a previous selection cycle and clear
      // selection state up front — a completed drag (moved && target) must
      // not leave a stale tap-select listener on the targets or leave the
      // dragged element stuck in `.nb-selected`. Capture the prior state
      // first so the tap-to-select branch below can still tell "was this a
      // select tap or a deselect tap" after we've cleared it.
      const wasSelected = dragEl.classList.contains('nb-selected');
      cleanupSelectionListeners();
      cleanupSelectionListeners = () => {};
      dragEl.classList.remove('nb-selected');
      const target = hitTarget(e.clientX, e.clientY);
      if (moved && target) { onDrop(target); return; }
      if (!moved && !wasSelected) { // tap-to-select fallback (only when turning selection on)
        dragEl.classList.add('nb-selected');
        const chosen = ev => {
          const t = targets.find(x => x === ev.currentTarget);
          if (t) {
            dragEl.classList.remove('nb-selected');
            cleanupSelectionListeners();
            cleanupSelectionListeners = () => {};
            onDrop(t);
          }
        };
        targets.forEach(t => t.addEventListener('click', chosen));
        cleanupSelectionListeners = () => targets.forEach(t => t.removeEventListener('click', chosen));
      }
    });
  }

  // ---------- split / merge / celebrate animations ----------

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

  const BlockEngine = {
    COLORS, patternCoords, gridSize, validSplits, seamSplits, makeChoices, decomposeTeen,
    render, clear, buildCreature, split, merge, celebrate,
    renderSilhouette, fillSilhouette, makeSplittable, makeDraggable,
    speak, sfx, setMuted, isMuted
  };

  if (typeof window !== 'undefined') window.BlockEngine = BlockEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = BlockEngine;
})();
