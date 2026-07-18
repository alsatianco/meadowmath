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

  // ---------- audio (optional; no-op when unsupported or muted) ----------

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

  // ---------- DOM rendering ----------

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

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
    COLORS, patternCoords, gridSize, validSplits, makeChoices, decomposeTeen,
    render, clear, buildCreature, split, merge, celebrate,
    speak, sfx, setMuted, isMuted
  };

  if (typeof window !== 'undefined') window.BlockEngine = BlockEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = BlockEngine;
})();
