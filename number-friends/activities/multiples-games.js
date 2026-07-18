// multiples-games.js — shared ×k / ÷k games taught from their ADDITION roots.
// Multiplication is shown as k EQUAL GROUPS laid out as k rows of an array
// (k rows of n = n + n + … = k×n). Division is the same array read the other
// way: a total shared into k equal rows, how many in each row (total ÷ k).
// Each class is parameterised by a factor k (2 = doubles/halves, 3 = triples/
// thirds) so the same code powers both the Nhân/Chia 2 and Nhân/Chia 3 stages.
(function () {
  'use strict';
  const B = window.BlockEngine;
  const ROW_COLORS = ['#5b8fc9', '#e3a83f', '#7bbf5a', '#c76b8e', '#9a7bc8'];

  // A plain k×cols array of cubes; each row gets its own colour so equal groups
  // read at a glance. Returns the wrapper element.
  function renderArray(container, rows, cols, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'nf-array';
    wrap.style.setProperty('--nf-cols', cols);
    for (let r = 0; r < rows; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'nf-array-row';
      const color = opts.oneColor || ROW_COLORS[r % ROW_COLORS.length];
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'nb-cube';
        cell.style.setProperty('--nb-cube-color', color);
        rowEl.appendChild(cell);
      }
      wrap.appendChild(rowEl);
    }
    if (container) container.appendChild(wrap);
    return wrap;
  }

  function repeatedSum(n, k) { return Array(k).fill(n).join(' + '); }

  // ---- 1. GroupsGame — k equal rows of n; add them up (multiplication) ----
  class GroupsGame extends window.ActivityBase {
    constructor(cfg) { super({ totalRounds: 8, activityId: cfg.id, gradeLevel: 'number-friends', autoAdvanceDelay: 2100 }); this.k = cfg.factor; }
    init() {
      super.init();
      this.stage = document.getElementById('stage');
      this.caption = document.getElementById('caption');
      this.choices = document.getElementById('choices');
      window.NFWidgets.audioGuide({ instructionKey: 'section.activities.' + this.activityId + '.instruction' });
      this.nextRound();
    }
    L(key, fb) { return this.t('section.activities.' + this.activityId + '.' + key, fb); }
    startRound() {
      this.n = this.randomInt(2, 10);
      this.answer = this.k * this.n;
      B.clear(this.stage); this.choices.innerHTML = '';
      renderArray(this.stage, this.k, this.n);
      const q = this.L('play', '{{sum}} = ?').replace('{{sum}}', repeatedSum(this.n, this.k));
      this.caption.textContent = q; B.speak(q);
      this.renderChoices(B.makeChoices(this.answer, 4, this.k, this.k * 10));
    }
    pick(v, btn) {
      if (this.isAnswered) return; this.isAnswered = true;
      this.disableButtons(this.choices);
      const ok = v === this.answer;
      const msg = this.L(ok ? 'correct' : 'incorrect', '{{sum}} = {{ans}}')
        .replace('{{sum}}', repeatedSum(this.n, this.k)).replace(/\{\{ans\}\}/g, this.answer).replace(/\{\{n\}\}/g, this.n).replace(/\{\{k\}\}/g, this.k);
      if (ok) { btn.classList.add('correct'); this.incrementCorrect(); B.sfx('correct'); }
      else { btn.classList.add('incorrect'); this.incrementIncorrect(); B.sfx('wrong'); this.choices.querySelectorAll('.answer-btn').forEach(b => { if (b.dataset.v == this.answer) b.classList.add('correct'); }); }
      this.showFeedback(msg, !ok); B.speak(msg);
      this.renderProgress(); this.autoAdvance();
    }
    renderChoices(values) {
      this.choices.innerHTML = '';
      values.forEach(v => { const b = document.createElement('button'); b.className = 'answer-btn'; b.textContent = v; b.dataset.v = v; b.addEventListener('click', () => this.pick(v, b)); this.choices.appendChild(b); });
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', this.activityId); } catch (e) {} super.showStats(); }
  }

  // ---- 2. FlashGame — glance at k equal groups, then they hide; add fast ----
  class FlashGame extends window.ActivityBase {
    constructor(cfg) { super({ totalRounds: 8, activityId: cfg.id, gradeLevel: 'number-friends', autoAdvanceDelay: 2000 }); this.k = cfg.factor; }
    init() {
      super.init();
      this.stage = document.getElementById('stage');
      this.caption = document.getElementById('caption');
      this.choices = document.getElementById('choices');
      window.NFWidgets.audioGuide({ instructionKey: 'section.activities.' + this.activityId + '.instruction' });
      this.nextRound();
    }
    L(key, fb) { return this.t('section.activities.' + this.activityId + '.' + key, fb); }
    startRound() {
      this.n = this.randomInt(2, 5);
      this.answer = this.k * this.n;
      B.clear(this.stage); this.choices.innerHTML = '';
      renderArray(this.stage, this.k, this.n);
      const peek = this.L('peek', 'Quick — how many in {{k}} equal groups?').replace(/\{\{k\}\}/g, this.k);
      this.caption.textContent = peek; B.speak(peek);
      this.flashTimer = setTimeout(() => {
        if (this.isAnswered) return;
        B.clear(this.stage);
        const cover = document.createElement('div'); cover.className = 'nf-flash-cover'; cover.textContent = '🫣';
        this.stage.appendChild(cover);
        this.renderChoices(B.makeChoices(this.answer, 4, this.k, this.k * 5));
      }, 1300);
    }
    pick(v, btn) {
      if (this.isAnswered) return; this.isAnswered = true;
      this.disableButtons(this.choices);
      const ok = v === this.answer;
      B.clear(this.stage); renderArray(this.stage, this.k, this.n);
      const msg = this.L(ok ? 'correct' : 'incorrect', '{{sum}} = {{ans}}')
        .replace('{{sum}}', repeatedSum(this.n, this.k)).replace(/\{\{ans\}\}/g, this.answer);
      if (ok) { btn.classList.add('correct'); this.incrementCorrect(); B.sfx('correct'); }
      else { btn.classList.add('incorrect'); this.incrementIncorrect(); B.sfx('wrong'); this.choices.querySelectorAll('.answer-btn').forEach(b => { if (b.dataset.v == this.answer) b.classList.add('correct'); }); }
      this.showFeedback(msg, !ok); B.speak(msg);
      this.renderProgress(); this.autoAdvance();
    }
    renderChoices(values) {
      this.choices.innerHTML = '';
      values.forEach(v => { const b = document.createElement('button'); b.className = 'answer-btn'; b.textContent = v; b.dataset.v = v; b.addEventListener('click', () => this.pick(v, b)); this.choices.appendChild(b); });
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', this.activityId); } catch (e) {} super.showStats(); }
  }

  // ---- 3. LadderGame — tap the multiples of k in order (skip counting) ----
  class LadderGame extends window.ActivityBase {
    constructor(cfg) { super({ totalRounds: 3, activityId: cfg.id, gradeLevel: 'number-friends', autoAdvanceDelay: 1400 }); this.k = cfg.factor; }
    init() {
      super.init();
      this.stage = document.getElementById('stage');
      this.caption = document.getElementById('caption');
      window.NFWidgets.audioGuide({ instructionKey: 'section.activities.' + this.activityId + '.instruction' });
      this.nextRound();
    }
    L(key, fb) { return this.t('section.activities.' + this.activityId + '.' + key, fb); }
    startRound() {
      B.clear(this.stage);
      this.wrongCounted = false;
      this.next = 1; // expecting k*this.next
      const multiples = [];
      for (let i = 1; i <= 10; i++) multiples.push(this.k * i);
      const board = document.createElement('div'); board.className = 'nf-ladder';
      this.shuffle(multiples).forEach(m => {
        const tile = document.createElement('button'); tile.className = 'nf-ladder-tile'; tile.textContent = m; tile.dataset.v = m;
        tile.addEventListener('click', () => this.tap(m, tile));
        board.appendChild(tile);
      });
      this.stage.appendChild(board);
      const q = this.L('play', 'Tap the numbers counting by {{k}}: {{seq}}…').replace(/\{\{k\}\}/g, this.k).replace('{{seq}}', this.k + ', ' + (2 * this.k) + ', ' + (3 * this.k));
      this.caption.textContent = q; B.speak(q);
    }
    tap(m, tile) {
      if (tile.classList.contains('nf-ladder-done')) return;
      const expected = this.k * this.next;
      if (m === expected) {
        tile.classList.add('nf-ladder-done'); tile.disabled = true;
        B.sfx('pop'); B.speak(String(m));
        this.next++;
        if (this.next > 10) {
          this.incrementCorrect();
          const msg = this.L('done', 'You counted by {{k}} all the way!').replace(/\{\{k\}\}/g, this.k);
          this.showFeedback(msg, false); B.speak(msg);
          this.renderProgress(); this.autoAdvance();
        }
      } else {
        tile.classList.remove('nf-ladder-wrong'); void tile.offsetWidth; tile.classList.add('nf-ladder-wrong');
        B.sfx('wrong');
        if (!this.wrongCounted) { this.wrongCounted = true; this.incrementIncorrect(); }
        const hint = this.L('next', 'Next comes {{m}}.').replace(/\{\{m\}\}/g, expected);
        this.showFeedback(hint, true, 1100); B.speak(hint);
      }
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', this.activityId); } catch (e) {} super.showStats(); }
  }

  // ---- 4. MatchGame — match a group of n with the numeral k×n ----
  class MatchGame extends window.ActivityBase {
    constructor(cfg) { super({ totalRounds: 4, activityId: cfg.id, gradeLevel: 'number-friends', autoAdvanceDelay: 1500 }); this.k = cfg.factor; }
    init() {
      super.init();
      this.stage = document.getElementById('stage');
      this.caption = document.getElementById('caption');
      window.NFWidgets.audioGuide({ instructionKey: 'section.activities.' + this.activityId + '.instruction' });
      this.nextRound();
    }
    L(key, fb) { return this.t('section.activities.' + this.activityId + '.' + key, fb); }
    pickDistinct(count, min, max) { const s = new Set(); while (s.size < count) s.add(this.randomInt(min, max)); return this.shuffle([...s]); }
    startRound() {
      B.clear(this.stage); this.wrongCounted = false;
      if (this.caption) this.caption.textContent = '';
      const k = this.k;
      // 2..4 keeps each group card-sized (a 3x4 array of cubes fits a tile)
      const nums = this.pickDistinct(3, 2, 4);
      const pairs = nums.map(n => ({
        id: n,
        left: card => { renderArray(card, k, n); },
        right: card => { card.textContent = k * n; }
      }));
      window.NFWidgets.matchBoard(this.stage, {
        pairs,
        onResult: ok => { if (ok) { B.sfx('correct'); } else { B.sfx('wrong'); if (!this.wrongCounted) { this.wrongCounted = true; this.incrementIncorrect(); } } },
        onDone: () => { this.incrementCorrect(); const msg = this.L('done', 'Great matching!'); this.showFeedback(msg, false); B.speak(msg); this.renderProgress(); this.autoAdvance(); }
      });
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', this.activityId); } catch (e) {} super.showStats(); }
  }

  // ---- 5. ShareGame — share a total into k equal rows (division ÷k) ----
  class ShareGame extends window.ActivityBase {
    constructor(cfg) { super({ totalRounds: 8, activityId: cfg.id, gradeLevel: 'number-friends', autoAdvanceDelay: 2100 }); this.k = cfg.factor; }
    init() {
      super.init();
      this.stage = document.getElementById('stage');
      this.caption = document.getElementById('caption');
      this.choices = document.getElementById('choices');
      window.NFWidgets.audioGuide({ instructionKey: 'section.activities.' + this.activityId + '.instruction' });
      this.nextRound();
    }
    L(key, fb) { return this.t('section.activities.' + this.activityId + '.' + key, fb); }
    startRound() {
      this.per = this.randomInt(2, 10);
      this.total = this.k * this.per;
      B.clear(this.stage); this.choices.innerHTML = '';
      renderArray(this.stage, this.k, this.per); // total shared into k equal rows
      const q = this.L('play', '{{total}} shared into {{k}} equal rows — how many in each row?')
        .replace(/\{\{total\}\}/g, this.total).replace(/\{\{k\}\}/g, this.k);
      this.caption.textContent = q; B.speak(q);
      this.renderChoices(B.makeChoices(this.per, 4, 1, 10));
    }
    pick(v, btn) {
      if (this.isAnswered) return; this.isAnswered = true;
      this.disableButtons(this.choices);
      const ok = v === this.per;
      const msg = this.L(ok ? 'correct' : 'incorrect', '{{total}} in {{k}} rows is {{per}} each.')
        .replace(/\{\{total\}\}/g, this.total).replace(/\{\{k\}\}/g, this.k).replace(/\{\{per\}\}/g, this.per);
      if (ok) { btn.classList.add('correct'); this.incrementCorrect(); B.sfx('correct'); }
      else { btn.classList.add('incorrect'); this.incrementIncorrect(); B.sfx('wrong'); this.choices.querySelectorAll('.answer-btn').forEach(b => { if (b.dataset.v == this.per) b.classList.add('correct'); }); }
      this.showFeedback(msg, !ok); B.speak(msg);
      this.renderProgress(); this.autoAdvance();
    }
    renderChoices(values) {
      this.choices.innerHTML = '';
      values.forEach(v => { const b = document.createElement('button'); b.className = 'answer-btn'; b.textContent = v; b.dataset.v = v; b.addEventListener('click', () => this.pick(v, b)); this.choices.appendChild(b); });
    }
    showStats() { try { window.Storage.markActivityCompleted('number-friends', this.activityId); } catch (e) {} super.showStats(); }
  }

  window.MultiplesGames = { GroupsGame, FlashGame, LadderGame, MatchGame, ShareGame, renderArray };
})();
