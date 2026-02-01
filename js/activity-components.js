/**
 * Shared HTML Components for Activities
 * 
 * Provides functions to generate common HTML components used across
 * all grade-level activities, reducing code duplication.
 * 
 * Usage:
 * - Use these functions to generate consistent HTML structures
 * - All components support i18n via data-i18n attributes
 */

const ActivityComponents = {
  /**
   * Grade configuration for navigation
   */
  grades: [
    { id: 'home', icon: '🏠', path: 'index.html', i18nKey: 'nav.home' },
    { id: 'prek', icon: '🪺', path: 'prek/index.html', i18nKey: 'nav.prek' },
    { id: 'kinder', icon: '🌱', path: 'kinder/index.html', i18nKey: 'nav.kindergarten', aliases: ['kindergarten'] },
    { id: 'grade1', icon: '📐', path: 'grade1/index.html', i18nKey: 'nav.grade1' },
    { id: 'grade2', icon: '➕', path: 'grade2/index.html', i18nKey: 'nav.grade2' },
    { id: 'grade3', icon: '➖', path: 'grade3/index.html', i18nKey: 'nav.grade3' },
    { id: 'grade4', icon: '✖️', path: 'grade4/index.html', i18nKey: 'nav.grade4' },
    { id: 'grade5', icon: '➗', path: 'grade5/index.html', i18nKey: 'nav.grade5' }
  ],

  /**
   * Get the sidebar navigation HTML
   * @param {Object} config - Configuration object
   * @param {string} config.basePath - Base path for links (e.g., '../../')
   * @param {string} config.activeGrade - Current grade level ID ('prek', 'grade1', etc.)
   * @returns {string} Sidebar HTML string
   */
  getSidebarHTML(config = {}) {
    const { basePath = '../../', activeGrade = '' } = config;

    const navItems = this.grades.map(grade => {
      // Check if this grade is active (by id or alias)
      const isActive = grade.id === activeGrade ||
                       (grade.aliases && grade.aliases.includes(activeGrade)) ? ' active' : '';
      const path = grade.id === 'home' ? `${basePath}index.html` : `${basePath}${grade.path}`;
      const defaultText = grade.id.charAt(0).toUpperCase() + grade.id.slice(1).replace(/(\d)/, ' $1');

      return `
        <a href="${path}" class="nav-item${isActive}">
          <span class="nav-item-icon">${grade.icon}</span>
          <span class="nav-item-text" data-i18n="${grade.i18nKey}">${defaultText}</span>
        </a>`;
    }).join('');

    return `
    <aside class="sidebar">
      <a href="${basePath}index.html" class="sidebar-logo">
        <span class="sidebar-logo-text" data-i18n="siteName">Meadow Math</span>
      </a>

      <nav class="sidebar-nav" aria-label="Main navigation">
        ${navItems}
      </nav>

      <div class="language-switcher">
        <span class="language-label" data-i18n="language">Language</span>
        <div class="language-buttons">
          <button class="lang-btn active" data-lang="en" aria-label="English">🇺🇸</button>
          <button class="lang-btn" data-lang="vi" aria-label="Tiếng Việt">🇻🇳</button>
        </div>
      </div>
    </aside>`;
  },

  /**
   * Get the hamburger menu HTML
   * @returns {string} Hamburger menu HTML string
   */
  getHamburgerHTML() {
    return `
    <button class="hamburger" aria-label="Toggle navigation menu">
      <div class="hamburger-icon">
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
      </div>
    </button>
    <div class="sidebar-backdrop"></div>`;
  },

  /**
   * Get the stats overlay modal HTML
   * @param {Object} config - Configuration object
   * @param {string} config.icon - Emoji icon for the modal (default: 🎉)
   * @param {boolean} config.showStats - Whether to show correct/incorrect counts
   * @returns {string} Stats overlay HTML string
   */
  getStatsOverlayHTML(config = {}) {
    const { icon = '🎉', showStats = true } = config;

    const statsGrid = showStats ? `
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value correct" id="stat-correct">0</div>
            <div class="stat-label" data-i18n="stats.correct">Correct</div>
          </div>
          <div class="stat-item">
            <div class="stat-value incorrect" id="stat-incorrect">0</div>
            <div class="stat-label" data-i18n="stats.incorrect">Incorrect</div>
          </div>
        </div>` : '';

    return `
    <div class="stats-overlay" id="stats-overlay">
      <div class="stats-modal">
        <div class="stats-icon" id="stats-icon">${icon}</div>
        <h2 class="stats-title" data-i18n="stats.title">Activity Complete!</h2>
        ${statsGrid}
        <p class="stats-message" id="stats-message">Great job!</p>
        <div class="stats-actions">
          <button class="btn-activity btn-primary" id="btn-play-again" data-i18n="buttons.playAgain">Play Again</button>
        </div>
      </div>
    </div>`;
  },

  /**
   * Get the activity header HTML
   * @param {Object} config - Configuration object
   * @param {string} config.activityId - Activity ID for i18n (e.g., 'add-three-numbers')
   * @param {string} config.icon - Emoji icon for the activity
   * @param {string} config.title - Default title (fallback)
   * @param {string} config.description - Default description
   * @param {string} config.backPath - Path back to grade index
   * @param {string} config.backToKey - i18n key for "Back to" grade
   * @returns {string} Activity header HTML string
   */
  getActivityHeaderHTML(config) {
    const {
      activityId,
      icon = '📐',
      title = 'Activity',
      description = '',
      backPath = '../index.html',
      backToKey = 'nav.grade1'
    } = config;

    return `
    <header class="activity-header">
      <a href="${backPath}" class="back-link">
        <span data-i18n="activity.backTo">← Back to</span> 
        <span data-i18n="${backToKey}">Grade</span>
      </a>
      <h1 class="activity-title">
        <span class="activity-title-icon">${icon}</span>
        <span data-i18n="section.activities.${activityId}.title">${title}</span>
      </h1>
      <p class="activity-instruction" data-i18n="section.activities.${activityId}.description">${description}</p>
    </header>`;
  },

  /**
   * Get progress indicator HTML
   * @param {number} total - Total number of rounds
   * @param {number} current - Current round (1-indexed)
   * @param {boolean} currentCompleted - Whether current round is completed
   * @returns {string} Progress indicator HTML
   */
  getProgressHTML(total, current = 1, currentCompleted = false) {
    let html = '';
    for (let i = 1; i <= total; i++) {
      let className = 'progress-dot';
      if (i < current || (i === current && currentCompleted)) {
        className += ' completed';
      } else if (i === current) {
        className += ' current';
      }
      html += `<div class="${className}"></div>`;
    }
    return html;
  },

  /**
   * Get common CSS link tags
   * @param {string} basePath - Base path for CSS files
   * @returns {string} CSS link tags HTML string
   */
  getCommonCSSLinks(basePath = '../../css/') {
    return `
  <link rel="stylesheet" href="${basePath}reset.css">
  <link rel="stylesheet" href="${basePath}variables.css">
  <link rel="stylesheet" href="${basePath}global.css">
  <link rel="stylesheet" href="${basePath}animations.css">
  <link rel="stylesheet" href="${basePath}sidebar.css">
  <link rel="stylesheet" href="${basePath}navigation.css">`.trim();
  },

  /**
   * Get common JavaScript script tags
   * @param {string} basePath - Base path for JS files
   * @param {boolean} includeActivityBase - Whether to include activity-base.js
   * @returns {string} Script tags HTML string
   */
  getCommonScriptTags(basePath = '../../js/', includeActivityBase = false) {
    let scripts = `
  <script src="${basePath}utils.js"></script>
  <script src="${basePath}storage.js"></script>
  <script src="${basePath}animations.js"></script>
  <script src="${basePath}i18n.js"></script>
  <script src="${basePath}navigation.js"></script>`;

    if (includeActivityBase) {
      scripts += `\n  <script src="${basePath}activity-base.js"></script>`;
    }

    return scripts.trim();
  },

  /**
   * Generate number button grid
   * @param {number} min - Minimum number
   * @param {number} max - Maximum number
   * @param {string} containerId - Container element ID
   * @returns {string} Number buttons HTML
   */
  getNumberButtonsHTML(min = 0, max = 10, containerId = 'number-buttons') {
    let html = `<div class="number-buttons" id="${containerId}">`;
    for (let i = min; i <= max; i++) {
      html += `<button class="number-btn" data-value="${i}">${i}</button>`;
    }
    html += '</div>';
    return html;
  },

  /**
   * Generate choice buttons grid
   * @param {Array} choices - Array of choice values
   * @param {string} containerId - Container element ID
   * @returns {string} Choice buttons HTML
   */
  getChoiceButtonsHTML(choices, containerId = 'choices-container') {
    const buttons = choices.map(choice => 
      `<button class="choice-btn" data-value="${choice}">${choice}</button>`
    ).join('');
    return `<div class="choices-container" id="${containerId}">${buttons}</div>`;
  }
};

// Export for use in activity files
window.ActivityComponents = ActivityComponents;
