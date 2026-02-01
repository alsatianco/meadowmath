/* Pre-K Activities Page JavaScript - Meadow Math */

/**
 * Pre-K page controller
 * Loads activity data from JSON and renders the levels with tabs
 */
const PreKPage = {
  // Data storage
  data: null,
  currentLang: 'en',

  // DOM elements
  container: null,

  /**
   * Initialize the Pre-K page
   */
  async init() {
    this.container = document.getElementById('levels-container');

    if (!this.container) {
      console.error('Levels container not found');
      return;
    }

    // Wait for i18n to be ready
    await this.waitForI18n();

    // Get current language
    this.currentLang = window.i18n?.currentLang || 'en';

    // Load data and render
    await this.loadData();

    // Listen for language changes
    this.setupLanguageListener();
  },

  /**
   * Wait for i18n system to be initialized
   */
  waitForI18n() {
    // Use i18n.ready() which resolves when init() completes
    if (window.i18n?.ready) {
      return window.i18n.ready();
    }
    // Fallback: wait for i18n to exist
    return new Promise((resolve) => {
      if (window.i18n) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.i18n) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
        // Short timeout - i18n should load quickly
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 500);
      }
    });
  },

  /**
   * Load activity data from JSON
   */
  async loadData() {
    try {
      // Determine base path for data
      const basePath = this.getBasePath();
      const response = await fetch(`${basePath}/data/prek.json`);

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }

      this.data = await response.json();
      this.render();
    } catch (error) {
      console.error('Error loading Pre-K data:', error);
      this.renderError();
    }
  },

  /**
   * Get base path for data files
   */
  getBasePath() {
    const path = window.location.pathname;

    // Check if we're in file:// protocol
    if (window.location.protocol === 'file:') {
      return '..';
    }

    // For HTTP, return empty for root-relative paths
    return '..';
  },

  /**
   * Get translated text for an activity or resource
   */
  getTranslation(type, id, field) {
    const i18nKey = `section.${type}.${id}.${field}`;
    const translated = window.i18n?.t(i18nKey);

    // If translation found and it's not the key itself, use it
    if (translated && translated !== i18nKey) {
      return translated;
    }

    // Fallback to data from JSON
    return null;
  },

  /**
   * Get level translation
   */
  getLevelTranslation(levelId, field) {
    const i18nKey = `section.levels.level${levelId.replace('level-', '')}.${field}`;
    const translated = window.i18n?.t(i18nKey);

    if (translated && translated !== i18nKey) {
      return translated;
    }

    return null;
  },

  /**
   * Render all levels
   */
  render() {
    if (!this.data || !this.data.levels) {
      this.renderError();
      return;
    }

    const html = this.data.levels.map(level => this.renderLevel(level)).join('');
    this.container.innerHTML = html;

    // Set up tab functionality
    this.setupTabs();
  },

  /**
   * Render a single level section
   */
  renderLevel(level) {
    const levelNumber = level.number;
    const levelClass = `level-${levelNumber}`;

    // Get translated title and goal
    const title = this.getLevelTranslation(level.id, 'title') || level.title;
    const goal = this.getLevelTranslation(level.id, 'goal') || level.goal;

    // Get tab translations
    const activitiesTab = window.i18n?.t('tabs.exercises') || 'Activities';
    const learnMoreTab = window.i18n?.t('tabs.learnMore') || 'Learn More';

    return `
      <section class="level-section ${levelClass}" data-level="${levelNumber}">
        <header class="level-header">
          <span class="level-badge ${levelClass}">Level ${levelNumber}</span>
          <h2 class="level-title">${this.escapeHtml(title)}</h2>
          <p class="level-goal">${this.escapeHtml(goal)}</p>
        </header>

        <div class="tabs-container">
          <div class="tabs-list" role="tablist">
            <button 
              class="tab-button active" 
              role="tab" 
              aria-selected="true"
              data-tab="activities-${levelNumber}"
              id="tab-activities-${levelNumber}"
              aria-controls="panel-activities-${levelNumber}"
            >
              ${this.escapeHtml(activitiesTab)}
            </button>
            <button 
              class="tab-button" 
              role="tab" 
              aria-selected="false"
              data-tab="learn-more-${levelNumber}"
              id="tab-learn-more-${levelNumber}"
              aria-controls="panel-learn-more-${levelNumber}"
            >
              ${this.escapeHtml(learnMoreTab)}
            </button>
          </div>

          <div 
            class="tab-panel active" 
            role="tabpanel" 
            id="panel-activities-${levelNumber}"
            aria-labelledby="tab-activities-${levelNumber}"
          >
            <div class="activities-grid">
              ${level.activities.map(activity => this.renderActivityCard(activity)).join('')}
            </div>
          </div>

          <div 
            class="tab-panel" 
            role="tabpanel" 
            id="panel-learn-more-${levelNumber}"
            aria-labelledby="tab-learn-more-${levelNumber}"
          >
            ${this.renderLearnMoreContent(level)}
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Render an activity card
   */
  renderActivityCard(activity) {
    // Get translated title and description
    const title = this.getTranslation('activities', activity.id, 'title') || activity.title;
    const description = this.getTranslation('activities', activity.id, 'description') || activity.description;

    return `
      <a href="${this.escapeHtml(activity.path)}" class="activity-card" data-activity="${activity.id}">
        <div class="activity-icon">${activity.icon}</div>
        <h3 class="activity-title">${this.escapeHtml(title)}</h3>
        <p class="activity-description">${this.escapeHtml(description)}</p>
      </a>
    `;
  },

  /**
   * Render Learn More content as field guide cards
   */
  renderLearnMoreContent(level) {
    if (!level.learnMore) {
      return '<p>No learning resources available for this level.</p>';
    }

    // Get the level key for translations (level-1 → level1)
    const levelKey = level.id.replace('-', '');
    const levelNum = level.id.replace('level-', '');

    // Card definitions with their translation keys
    const cardDefs = [
      { id: 'big-idea', icon: '💡', titleKey: 'bigIdea', contentKey: 'bigIdea' },
      { id: 'what-to-notice', icon: '👀', titleKey: 'whatToNotice', contentKey: 'whatToNotice' },
      { id: 'try-at-home', icon: '🏡', titleKey: 'tryAtHome', contentKey: 'tryAtHome' },
      { id: 'optional-videos', icon: '📺', titleKey: 'optionalVideos', contentKey: 'optionalVideos' }
    ];

    const cardsHtml = cardDefs.map(card => {
      // Get translated title
      const titleI18nKey = `section.learnMoreCards.${card.titleKey}.title`;
      const title = window.i18n?.t(titleI18nKey) || this.getDefaultCardTitle(card.id);

      // Get translated content for this level (use getRaw for object data)
      const contentI18nKey = `section.levels.${levelKey}.learnMore.${card.contentKey}`;
      const content = window.i18n?.getRaw?.(contentI18nKey);

      if (!content) {
        return ''; // Skip if no content
      }

      // Special rendering for optional-videos card
      if (card.id === 'optional-videos') {
        return this.renderOptionalVideosCard(card, title, content);
      }

      // Determine card type class based on card id
      let cardTypeClass = '';
      if (card.id.includes('big-idea')) cardTypeClass = 'learn-more-card-big-idea';
      else if (card.id.includes('notice')) cardTypeClass = 'learn-more-card-notice';
      else if (card.id.includes('home')) cardTypeClass = 'learn-more-card-home';

      // Regular card rendering
      return `
        <div class="learn-more-card ${cardTypeClass}" data-card="${card.id}">
          <div class="learn-more-card-header">
            <span class="learn-more-card-icon">${card.icon}</span>
            <h3 class="learn-more-card-title">${this.escapeHtml(title)}</h3>
          </div>
          <div class="learn-more-card-content">
            ${this.renderCardContent(card.id, content)}
          </div>
        </div>
      `;
    }).filter(html => html).join('');

    return `
      <div class="learn-more-cards">
        ${cardsHtml}
      </div>
    `;
  },

  /**
   * Render card content based on card type
   */
  renderCardContent(cardId, content) {
    if (cardId === 'what-to-notice' && content.bullets) {
      // Render as bullet list
      const bulletsHtml = content.bullets.map(bullet => 
        `<li>${this.escapeHtml(bullet)}</li>`
      ).join('');
      return `<ul class="learn-more-bullets">${bulletsHtml}</ul>`;
    }

    if (cardId === 'try-at-home' && content.games) {
      // Render games with bold titles and descriptions (simple format)
      return content.games.map(game => `
        <div class="try-at-home-item">
          <strong>${this.escapeHtml(game.name)}</strong>
          <p>${this.escapeHtml(game.description)}</p>
        </div>
      `).join('');
    }

    // Default: render as paragraph(s)
    if (typeof content === 'string') {
      return `<p>${this.escapeHtml(content)}</p>`;
    }

    if (content.text) {
      return `<p>${this.escapeHtml(content.text)}</p>`;
    }

    return '';
  },

  /**
   * Render the optional videos card with YouTube search links
   */
  renderOptionalVideosCard(card, title, content) {
    if (!content.searches || content.searches.length === 0) {
      return '';
    }

    // Get translated intro text
    const introKey = 'section.learnMoreCards.optionalVideos.intro';
    const intro = window.i18n?.t(introKey) || 'Search YouTube for:';

    const linksHtml = content.searches.map(query => {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, '+')}`;
      return `<li><a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="youtube-search-link">${this.escapeHtml(query)}</a></li>`;
    }).join('');

    return `
      <div class="learn-more-card learn-more-card-videos" data-card="${card.id}">
        <div class="learn-more-card-header">
          <span class="learn-more-card-icon">${card.icon}</span>
          <h3 class="learn-more-card-title">${this.escapeHtml(title)}</h3>
        </div>
        <div class="learn-more-card-content">
          <p class="videos-intro">${this.escapeHtml(intro)}</p>
          <ul class="youtube-search-list">
            ${linksHtml}
          </ul>
        </div>
      </div>
    `;
  },

  /**
   * Get default card title if translation not found
   */
  getDefaultCardTitle(cardId) {
    const defaults = {
      'big-idea': 'Big Idea',
      'what-to-notice': 'What to Notice',
      'try-at-home': 'Try at Home',
      'optional-videos': 'Optional Videos'
    };
    return defaults[cardId] || cardId;
  },

  /**
   * Convert YouTube search queries to clickable links (DEPRECATED - kept for compatibility)
   * Pattern: 'query text' → <a href="https://www.youtube.com/results?search_query=query+text">query text</a>
   */
  addYouTubeLinks(text) {
    // Match patterns like 'Numberblocks ...' within the text
    const pattern = /'([^']+)'/g;

    return text.replace(pattern, (match, query) => {
      // Convert query to URL-safe format
      const searchQuery = encodeURIComponent(query);
      const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

      return `<a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="youtube-search-link">${this.escapeHtml(query)}</a>`;
    });
  },

  /**
   * Generate a resource ID from title for i18n
   */
  generateResourceId(title) {
    // Match common patterns for Numberblocks
    if (title.includes('Numberblocks')) {
      if (title.includes('1–5') || title.includes('1-5')) return 'numberblocks-1-5';
      if (title.includes('Ep 20') || title.includes('Ten')) return 'numberblocks-ten';
      if (title.includes('Ep 35') || title.includes('Zero')) return 'numberblocks-zero';
      if (title.includes('Ep 10') || title.includes('How to Count')) return 'numberblocks-how-to-count';
      if (title.includes('Ep 11') || title.includes('Stampolines')) return 'numberblocks-stampolines';
      if (title.includes('Ep 94') || title.includes("What's My Number")) return 'numberblocks-whats-my-number';
      if (title.includes('Ep 12') || title.includes('Whole of Me')) return 'numberblocks-whole-of-me';
      if (title.includes('Ep 15') || title.includes('Hide and Seek')) return 'numberblocks-hide-seek';
      if (title.includes('Ep 34') || title.includes('Fruit Salad')) return 'numberblocks-fruit-salad';
      if (title.includes('Ep 2:') || title.includes('Another One')) return 'numberblocks-another-one';
      if (title.includes('Ep 14') || title.includes('Holes')) return 'numberblocks-holes';
      if (title.includes('Ep 32') || title.includes('Blockzilla')) return 'numberblocks-blockzilla';
    }

    // Default: convert to kebab-case
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /**
   * Set up tab switching functionality
   */
  setupTabs() {
    const tabButtons = this.container.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = button.dataset.tab;
        const tabsContainer = button.closest('.tabs-container');

        // Update button states
        tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');

        // Update panel visibility
        tabsContainer.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });

        const targetPanel = tabsContainer.querySelector(`#panel-${tabId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  },

  /**
   * Set up language change listener
   */
  setupLanguageListener() {
    // Listen for language button clicks
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Re-render after language change
        setTimeout(() => {
          this.currentLang = window.i18n?.currentLang || 'en';
          this.render();
        }, 100);
      });
    });
  },

  /**
   * Render error state
   */
  renderError() {
    this.container.innerHTML = `
      <div class="error-state">
        <h3>Oops! Something went wrong</h3>
        <p>We couldn't load the activities. Please try refreshing the page.</p>
      </div>
    `;
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PreKPage.init();
});
