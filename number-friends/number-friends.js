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
