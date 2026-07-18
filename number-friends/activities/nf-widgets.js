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
    const mouth = root.querySelector('.nf-zilla-mouth');
    // Glyph convention: left bigger -> '>' (mouth opens toward the left,
    // wide side left), right bigger -> '<' (opens toward the right), equal -> '='.
    const GLYPHS = { left: '>', right: '<', equal: '=' };
    function point(dir) {
      root.classList.remove('nf-zilla--left', 'nf-zilla--right', 'nf-zilla--equal');
      mouth.textContent = GLYPHS[dir] || '';
      if (dir === 'left' || dir === 'right' || dir === 'equal') root.classList.add('nf-zilla--' + dir);
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

  // audioGuide — kids can't read, so every game must SPEAK its instructions.
  // Speaks the instruction once on load, injects a repeatable 🔊 button into
  // .activity-header, and retries the initial speak on the first tap anywhere
  // if the browser blocked speech before a user gesture.
  //
  // Usage:
  //   const audio = NFWidgets.audioGuide({ instructionKey: 'section.activities.foo.instruction' });
  //   // ...later, for rounds whose instruction text changes dynamically:
  //   audio.say(currentInstructionText);
  function audioGuide(opts) {
    opts = opts || {};
    let currentText = '';

    function resolveInitialText() {
      if (typeof opts.text === 'function') return opts.text();
      if (opts.text) return opts.text;
      if (opts.instructionKey && window.i18n) {
        const v = window.i18n.t(opts.instructionKey);
        return (v && v !== opts.instructionKey) ? v : '';
      }
      return '';
    }

    function speakNow(text) {
      if (!text) return;
      currentText = text;
      window.BlockEngine.speak(text);
    }

    function armAutoplayRetry() {
      // Some browsers silently drop speechSynthesis.speak() calls that
      // aren't triggered by a user gesture. If nothing appears to be
      // speaking shortly after our attempt, retry once on the first tap.
      setTimeout(() => {
        if (!window.speechSynthesis) return;
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
        const retry = () => { document.removeEventListener('pointerdown', retry); speakNow(currentText); };
        document.addEventListener('pointerdown', retry, { once: true });
      }, 300);
    }

    function say(text) {
      speakNow(text != null ? text : resolveInitialText());
    }

    // (a) speak once, right away (this is called from a page's init(), which
    // itself runs after DOMContentLoaded + i18n.ready()).
    const initial = resolveInitialText();
    if (initial) { speakNow(initial); armAutoplayRetry(); }

    // (b) round 🔊 button that re-speaks the current instruction on tap.
    const header = document.querySelector('.activity-header');
    if (header && !header.querySelector('.nf-speak-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nf-speak-btn';
      btn.textContent = '🔊';
      const label = (window.i18n && window.i18n.t('buttons.listen')) || 'Hear instructions';
      btn.setAttribute('aria-label', label);
      btn.addEventListener('click', () => say(currentText || resolveInitialText()));
      header.appendChild(btn);
    }

    return { say };
  }

  window.NFWidgets = { bondDiagram, fruitRow, blockzilla, staircase, hostBadge, rainbow, stamp, audioGuide };
})();
