/* Search Results Page - Meadow Math
 *
 * Reads ?q=<query>&grade=<section|all> from the URL, runs MeadowSearch over
 * data/search-index.json and renders results. Uses the History API so the
 * back button and shared links work.
 */
(function () {
  'use strict';

  const PAGE_SIZE = 20;
  const RELATED_LIMIT = 6;
  const INDEX_URL = 'data/search-index.json';

  const state = {
    engine: null,
    index: null,
    query: '',
    grade: null, // null = auto-detect from query, 'all' = no filter, else a section id
    shown: PAGE_SIZE,
    lastResponse: null
  };

  const el = {};

  function t(key, vars) {
    let text = window.i18n ? window.i18n.t(key) : key;
    if (vars) {
      Object.keys(vars).forEach(name => {
        text = text.split(`{${name}}`).join(vars[name]);
      });
    }
    return text;
  }

  function raw(key) {
    return (window.i18n && window.i18n.getRaw(key)) || [];
  }

  function lang() {
    return (window.i18n && window.i18n.currentLang) || 'en';
  }

  function localized(doc, field) {
    const current = doc[lang()] && doc[lang()][field];
    return current || (doc.en && doc.en[field]) || '';
  }

  function sectionName(id) {
    const section = state.index && state.index.sections.find(s => s.id === id);
    return section ? (section[lang()] || section.en) : id;
  }

  function sectionIcon(id) {
    const section = state.index && state.index.sections.find(s => s.id === id);
    return section ? section.icon : '';
  }

  // ---------- URL state ----------

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    state.query = (params.get('q') || '').trim().slice(0, 100);
    const grade = params.get('grade');
    const valid = grade === 'all' || (state.index && state.index.sections.some(s => s.id === grade));
    state.grade = valid ? grade : null;
    state.shown = PAGE_SIZE;
  }

  function writeUrl(push) {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.grade) params.set('grade', state.grade);
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history[push ? 'pushState' : 'replaceState'](null, '', url);
  }

  // ---------- Rendering helpers ----------

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Append `text` to `parent`, wrapping words that matched the search in <mark>. */
  function appendHighlighted(parent, text, matchedTerms) {
    if (!matchedTerms.size) {
      parent.textContent = text;
      return;
    }
    const parts = text.split(/([\p{L}\p{N}]+)/u);
    parts.forEach(part => {
      if (!part) return;
      const processed = /[\p{L}\p{N}]/u.test(part) ? window.MeadowSearch.processTerm(part) : null;
      const forms = Array.isArray(processed) ? processed : [processed];
      if (processed && forms.some(f => matchedTerms.has(f))) {
        parent.appendChild(create('mark', null, part));
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderResult(result) {
    const { doc } = result;
    const terms = new Set(result.terms || []);
    const item = create('li', 'search-result');
    const link = create('a', 'search-result-link');
    link.href = doc.url;

    const icon = create('span', 'search-result-icon', doc.icon || sectionIcon(doc.section));
    icon.setAttribute('aria-hidden', 'true');

    const body = create('div', 'search-result-body');
    const title = create('h3', 'search-result-title');
    appendHighlighted(title, localized(doc, 'title'), terms);

    const meta = create('div', 'search-result-meta');
    const badge = create('span', 'search-badge', sectionName(doc.section));
    badge.dataset.section = doc.section;
    meta.appendChild(badge);
    const topic = localized(doc, 'topic');
    if (topic) {
      meta.appendChild(create('span', 'search-result-topic', topic));
    } else if (doc.type !== 'activity') {
      meta.appendChild(create('span', 'search-result-topic', t(`search.types.${doc.type}`)));
    }

    body.appendChild(title);
    body.appendChild(meta);

    const description = localized(doc, 'description');
    if (description) {
      const desc = create('p', 'search-result-desc');
      appendHighlighted(desc, description, terms);
      body.appendChild(desc);
    }

    link.appendChild(icon);
    link.appendChild(body);
    item.appendChild(link);
    return item;
  }

  function renderList(listEl, results) {
    const fragment = document.createDocumentFragment();
    results.forEach(result => fragment.appendChild(renderResult(result)));
    listEl.replaceChildren(fragment);
  }

  function chip(label, { pressed, onClick, href }) {
    const node = create(href ? 'a' : 'button', 'search-chip', label);
    if (href) {
      node.href = href;
    } else {
      node.type = 'button';
      node.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      node.addEventListener('click', onClick);
    }
    return node;
  }

  function renderChips(activeSection) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(chip(t('search.allGrades'), {
      pressed: !activeSection,
      onClick: () => setGrade('all')
    }));
    state.index.sections.forEach(section => {
      fragment.appendChild(chip(`${section.icon} ${sectionName(section.id)}`, {
        pressed: activeSection === section.id,
        onClick: () => setGrade(section.id)
      }));
    });
    el.chips.replaceChildren(fragment);
    el.filters.hidden = false;
  }

  function renderHelp(message, showTips) {
    el.helpMessage.textContent = message || '';
    el.tipsBlock.hidden = !showTips;
    el.tips.replaceChildren(...raw('search.tips').map(tip => create('li', null, tip)));

    el.suggestions.replaceChildren(...raw('search.suggestions').map(word =>
      chip(word, { href: `search.html?q=${encodeURIComponent(word)}` })));

    el.browse.replaceChildren(...state.index.sections.map(section => {
      const url = section.id === 'tools' ? 'tools/index.html' : `${section.id}/index.html`;
      return chip(`${section.icon} ${sectionName(section.id)}`, { href: url });
    }));
    el.help.hidden = false;
  }

  function updateTitle() {
    const base = t('search.pageTitle');
    document.title = state.query ? `“${state.query}” – ${base}` : base;
  }

  // ---------- Main render ----------

  function render() {
    if (!state.engine) return;
    el.input.value = state.query;
    updateTitle();

    el.help.hidden = true;
    el.message.hidden = true;
    el.related.hidden = true;
    el.more.hidden = true;
    el.results.replaceChildren();
    el.relatedList.replaceChildren();

    const response = state.engine.search(state.query, { section: state.grade || undefined });
    state.lastResponse = response;
    const active = response.section;
    renderChips(active);

    // Nothing typed and no grade chosen: show a friendly starting point.
    if (!state.query && !active) {
      el.status.textContent = '';
      el.filters.hidden = true;
      renderHelp('', false);
      return;
    }

    const { results, related } = response;
    const hasTerms = response.terms.length > 0;

    if (!results.length) {
      el.status.textContent = '';
      const message = active
        ? t('search.noResultsInSection', { query: state.query, section: sectionName(active) })
        : t('search.noResults', { query: state.query });
      renderHelp(message, true);
      if (active) {
        el.tips.appendChild(create('li')).appendChild(
          chip(t('search.searchAllGrades'), { pressed: false, onClick: () => setGrade('all') }));
      }
      return;
    }

    if (hasTerms) {
      const count = results.length;
      let status = count === 1
        ? t('search.resultsOne', { query: state.query })
        : t('search.resultsMany', { count, query: state.query });
      if (active) status += ` ${t('search.inSection', { section: sectionName(active) })}`;
      el.status.textContent = status;
    } else {
      el.status.textContent = t('search.browseCount', {
        count: results.filter(r => r.doc.type !== 'grade').length,
        section: sectionName(active)
      });
    }

    renderList(el.results, results.slice(0, state.shown));
    el.more.hidden = results.length <= state.shown;

    if (related.length) {
      renderList(el.relatedList, related.slice(0, RELATED_LIMIT));
      el.related.hidden = false;
    }
  }

  function showMore() {
    const results = state.lastResponse ? state.lastResponse.results : [];
    const start = state.shown;
    state.shown += PAGE_SIZE;
    const fragment = document.createDocumentFragment();
    results.slice(start, state.shown).forEach(result => fragment.appendChild(renderResult(result)));
    el.results.appendChild(fragment);
    el.more.hidden = results.length <= state.shown;
    // Move focus to the first newly shown result for keyboard and screen reader users.
    const firstNew = el.results.children[start];
    if (firstNew) firstNew.querySelector('a').focus();
  }

  function setGrade(grade) {
    state.grade = grade;
    state.shown = PAGE_SIZE;
    writeUrl(true);
    render();
  }

  function onSubmit(event) {
    event.preventDefault();
    const query = el.input.value.trim().slice(0, 100);
    // A grade typed in the query ("grade 2 money") wins over a previously chosen chip;
    // "All grades" only overrides detection for the query it was chosen for.
    if (state.grade === 'all' || window.MeadowSearch.parseQuery(query).section) {
      state.grade = null;
    }
    state.query = query;
    state.shown = PAGE_SIZE;
    writeUrl(true);
    render();
  }

  async function loadIndex() {
    const response = await fetch(INDEX_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function init() {
    el.form = document.getElementById('search-form');
    el.input = document.getElementById('search-input');
    el.filters = document.querySelector('.search-filters');
    el.chips = document.getElementById('search-chips');
    el.status = document.getElementById('search-status');
    el.message = document.getElementById('search-message');
    el.results = document.getElementById('search-results');
    el.more = document.getElementById('search-more');
    el.related = document.getElementById('search-related');
    el.relatedList = document.getElementById('search-related-results');
    el.help = document.getElementById('search-help');
    el.helpMessage = document.getElementById('search-help-message');
    el.tipsBlock = document.getElementById('search-tips-block');
    el.tips = document.getElementById('search-tips');
    el.suggestions = document.getElementById('search-suggestions');
    el.browse = document.getElementById('search-browse');
    if (!el.form) return;

    // Show the typed query right away, even before the index loads.
    el.input.value = new URLSearchParams(window.location.search).get('q') || '';
    el.form.addEventListener('submit', onSubmit);
    el.more.addEventListener('click', showMore);

    if (window.i18n && window.i18n.ready) await window.i18n.ready();

    el.message.textContent = t('search.loading');
    el.message.hidden = false;
    try {
      state.index = await loadIndex();
      state.engine = window.MeadowSearch.create(state.index);
    } catch (error) {
      console.error('Search index failed to load:', error);
      el.message.textContent = t('search.loadError');
      return;
    }
    el.message.hidden = true;

    readUrl();
    render();
    if (!state.query) el.input.focus();

    window.addEventListener('popstate', () => {
      readUrl();
      render();
    });
    document.addEventListener('languageChanged', () => render());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
