/* Grade 3 Activities Page JavaScript - Meadow Math */

/**
 * Grade 3 page controller
 * Loads activity data from JSON and renders the levels with tabs
 */
const Grade3Page = {
  // Data storage
  data: null,
  currentLang: 'en',

  // DOM elements
  container: null,

  /**
   * Initialize the Grade 3 page
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
   * Wait for i18n system to be initialized with section data
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
      const response = await fetch(`${basePath}/data/grade3.json`);

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }

      this.data = await response.json();
      this.render();
    } catch (error) {
      console.error('Error loading Grade 3 data:', error);
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
   * Get translated text for an activity
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
   * Get Learn More card translation
   */
  getLearnMoreTranslation(levelNumber, cardId, field) {
    const i18nKey = `section.levels.level${levelNumber}.learnMore.${cardId}.${field}`;
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
    if (!level.learnMore || !level.learnMore.cards) {
      return '<p>No learning resources available for this level.</p>';
    }

    const levelNumber = level.number;

    const cardsHtml = level.learnMore.cards.map(card => {
      // Get translations
      let title = this.getLearnMoreTranslation(levelNumber, card.id, 'title');
      let content = this.getLearnMoreTranslation(levelNumber, card.id, 'content');

      // Fallback to card.title if no translation
      if (!title) {
        title = card.title;
      }

      // If no content found, skip this card
      if (!content) {
        return '';
      }

      // Parse markdown-style content to HTML
      let formattedContent;
      if (card.id.includes('home')) {
        formattedContent = this.parseTryAtHomeContent(content);
      } else if (card.id.includes('videos')) {
        formattedContent = this.parseVideosContent(content);
      } else {
        formattedContent = this.parseMarkdownContent(content);
      }

      // Determine card type class based on card id
      let cardTypeClass = '';
      if (card.id.includes('big-idea')) cardTypeClass = 'learn-more-card-big-idea';
      else if (card.id.includes('notice')) cardTypeClass = 'learn-more-card-notice';
      else if (card.id.includes('home')) cardTypeClass = 'learn-more-card-home';
      else if (card.id.includes('videos')) cardTypeClass = 'learn-more-card-videos';

      return `
        <div class="learn-more-card ${cardTypeClass}" data-card-id="${card.id}">
          <div class="learn-more-card-header">
            <span class="learn-more-card-icon">${card.icon}</span>
            <h3 class="learn-more-card-title">${this.escapeHtml(title)}</h3>
          </div>
          <div class="learn-more-card-content">${formattedContent}</div>
        </div>
      `;
    }).filter(html => html).join('');

    return `<div class="learn-more-cards">${cardsHtml}</div>`;
  },

  /**
   * Parse markdown-style content to HTML
   * Supports: **bold**, *italic*, bullet lists, and preserves HTML links
   */
  parseMarkdownContent(content) {
    if (!content) return '';

    // Split into lines
    let lines = content.split('\n');
    let result = [];
    let inList = false;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Check if it's a bullet point
      if (trimmedLine.startsWith('* ')) {
        if (!inList) {
          result.push('<ul class="learn-more-list">');
          inList = true;
        }
        const bulletContent = this.formatInlineMarkdown(trimmedLine.substring(2));
        result.push(`<li>${bulletContent}</li>`);
      } else {
        // Close list if we were in one
        if (inList) {
          result.push('</ul>');
          inList = false;
        }

        if (trimmedLine) {
          const formattedLine = this.formatInlineMarkdown(trimmedLine);
          result.push(`<p>${formattedLine}</p>`);
        }
      }
    });

    // Close any open list
    if (inList) {
      result.push('</ul>');
    }

    return result.join('');
  },

  /**
   * Format inline markdown: **bold**, *italic*, backticks
   * Preserves existing HTML (like anchor tags)
   */
  formatInlineMarkdown(text) {
    // Preserve HTML tags by temporarily replacing them
    const htmlTags = [];
    let preservedText = text.replace(/<[^>]+>/g, (match) => {
      htmlTags.push(match);
      return `\x00HTML${htmlTags.length - 1}\x00`;
    });

    // Escape HTML in the non-tag parts
    preservedText = preservedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format markdown
    // Bold: **text**
    preservedText = preservedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (but not inside bold)
    preservedText = preservedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Inline code: `text`
    preservedText = preservedText.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Restore HTML tags
    preservedText = preservedText.replace(/\x00HTML(\d+)\x00/g, (_, index) => {
      return htmlTags[parseInt(index)];
    });

    return preservedText;
  },

  /**
   * Parse Try at Home content - converts bullets to simple blocks without list styling
   */
  parseTryAtHomeContent(content) {
    if (!content) return '';

    // Split into lines and process
    let lines = content.split('\n');
    let result = [];
    let currentBlock = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Check if it's a new game (starts with * **Game...)
      if (trimmedLine.startsWith('* **')) {
        // Save previous block if exists
        if (currentBlock) {
          result.push(this.renderTryAtHomeBlock(currentBlock));
        }
        // Start new block - extract the bold title
        const titleMatch = trimmedLine.match(/^\* \*\*([^*]+)\*\*\s*(.*)?$/);
        if (titleMatch) {
          currentBlock = {
            title: titleMatch[1],
            description: titleMatch[2] ? this.formatInlineMarkdown(titleMatch[2]) : ''
          };
        }
      } else if (trimmedLine && currentBlock) {
        // Continuation of description
        if (currentBlock.description) {
          currentBlock.description += ' ';
        }
        currentBlock.description += this.formatInlineMarkdown(trimmedLine);
      }
    });

    // Don't forget the last block
    if (currentBlock) {
      result.push(this.renderTryAtHomeBlock(currentBlock));
    }

    return result.join('');
  },

  /**
   * Render a single Try at Home block
   */
  renderTryAtHomeBlock(block) {
    return `
      <div class="try-at-home-item">
        <strong>${block.title}</strong>
        <p>${block.description}</p>
      </div>
    `;
  },

  /**
   * Parse Videos content - adds youtube-search-link class to links
   */
  parseVideosContent(content) {
    if (!content) return '';

    // Use regular markdown parsing but add class to links
    let html = this.parseMarkdownContent(content);

    // Add youtube-search-link class to all links in videos section
    html = html.replace(/<a /g, '<a class="youtube-search-link" ');

    return html;
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
  Grade3Page.init();
});
