/* number-friends/number-friends.js — "Bạn Số" world hub controller */
const NumberFriendsHub = {
  data: null,
  async init() {
    this.map = document.getElementById('journey-map');
    if (window.i18n && window.i18n.ready) await window.i18n.ready();
    try {
      const res = await fetch('../data/number-friends.json');
      this.data = await res.json();
    } catch (e) {
      this.map.innerHTML = '<p class="coming-soon">Could not load activities.</p>';
      return;
    }
    this.render();
    this.renderHero();
    this.bindMissionModal();
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
    this.map.querySelectorAll('.mission-chip').forEach(b => {
      b.addEventListener('click', () => this.openMissions(b.dataset.stage));
    });
  },
  renderStage(stage, i) {
    const hasActivities = stage.activities && stage.activities.length > 0;
    const title = this.t(`section.stages.${stage.id}.title`, stage.title);
    const goal = this.t(`section.stages.${stage.id}.goal`, stage.goal);
    const allActivitiesDone = hasActivities && stage.activities.every(a => {
      try { return window.Storage && window.Storage.isActivityCompleted('number-friends', a.id); } catch (e) { return false; }
    });
    const missionChip = allActivitiesDone
      ? `<button class="mission-chip" data-stage="${stage.id}">🏅 <span>${this.escape(this.t('section.world.missionsButton', 'Real-world missions'))}</span></button>`
      : '';
    const chips = hasActivities
      ? `<div class="stage-activities">
           ${stage.intro ? this.renderChip(stage.intro, '📖', true) : ''}
           ${stage.activities.map(a => this.renderChip(a, a.icon, false)).join('')}
         </div>
         ${missionChip}`
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
  renderHero() {
    const showcase = document.getElementById('number-friends-showcase');
    if (!showcase || !window.BlockEngine) return;
    window.BlockEngine.clear(showcase);
    [
      { value: 4, className: 'nf-pal-one' },
      { value: 5, className: 'nf-pal-two' },
      { value: 7, className: 'nf-pal-five' }
    ].forEach(friend => {
      const node = window.BlockEngine.render(showcase, { value: friend.value });
      node.classList.add('nf-showcase-friend', friend.className);
    });
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
  openMissions(stageId) {
    const stage = this.data.levels.find(l => l.id === stageId);
    if (!stage) return;
    const raw = window.i18n ? window.i18n.getRaw(`section.stages.${stageId}.missions`) : null;
    const missions = Array.isArray(raw) ? raw.slice(0, stage.missions || raw.length) : [];
    const overlay = document.getElementById('mission-overlay');
    const list = document.getElementById('mission-list');
    if (!overlay || !list) return;
    document.getElementById('mission-title').textContent = this.t('section.world.missionsTitle', 'Explorer missions');
    list.innerHTML = missions.map((m, i) => {
      const done = (() => { try { return window.Storage.isActivityCompleted('number-friends', `${stageId}-mission-${i}`); } catch (e) { return false; } })();
      return `<li class="mission-item${done ? ' done' : ''}" data-i="${i}">
        <button class="mission-speak" aria-label="Read aloud">🔊</button>
        <span class="mission-text">${this.escape(m)}</span>
        <button class="mission-star" aria-pressed="${done}">${done ? '⭐' : '☆'}</button></li>`;
    }).join('');
    list.querySelectorAll('.mission-speak').forEach((b, i) => b.addEventListener('click', () => {
      if (window.BlockEngine) window.BlockEngine.speak(missions[i]);
    }));
    list.querySelectorAll('.mission-star').forEach((b, i) => b.addEventListener('click', () => {
      try { window.Storage.markActivityCompleted('number-friends', `${stageId}-mission-${i}`); } catch (e) {}
      b.textContent = '⭐';
      b.setAttribute('aria-pressed', 'true');
      b.closest('.mission-item').classList.add('done');
    }));
    overlay.classList.add('open');
  },
  closeMissions() {
    const overlay = document.getElementById('mission-overlay');
    if (overlay) overlay.classList.remove('open');
  },
  bindMissionModal() {
    const overlay = document.getElementById('mission-overlay');
    const closeBtn = document.getElementById('mission-close');
    if (!overlay || !closeBtn) return;
    closeBtn.addEventListener('click', () => this.closeMissions());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeMissions(); });
  },
  escape(t) { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; }
};
document.addEventListener('DOMContentLoaded', () => NumberFriendsHub.init());
