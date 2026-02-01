/**
 * Unified Activity Base Class
 * 
 * Shared base class for all grade-level activities (Pre-K, Grade 1, etc.)
 * Provides common functionality:
 * - Stats tracking (correct/incorrect counts)
 * - Progress indicator rendering
 * - Stats modal display
 * - Translation support
 * - Utility methods (shuffle, randomInt, etc.)
 * 
 * Usage:
 * 1. Create your activity object
 * 2. Set config options (totalRounds, activityId, etc.)
 * 3. Call init() to set up common elements
 * 4. Override startRound() for activity-specific logic
 * 5. Use incrementCorrect()/incrementIncorrect() to track stats
 * 6. Call showStats() when activity completes
 */

class ActivityBase {
  constructor(config = {}) {
    // Game state
    this.totalRounds = config.totalRounds || config.maxRounds || 8;
    this.currentRound = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.isAnswered = false;
    this.autoAdvanceDelay = config.autoAdvanceDelay || 1500;

    // Activity config
    this.activityId = config.activityId || '';
    this.activityName = config.activityName || 'Activity';
    this.gradeLevel = config.gradeLevel || 'grade1'; // 'prek', 'kindergarten', 'grade1', etc.

    // DOM elements (common across all activities)
    this.progress = null;
    this.feedback = null;
    this.statsOverlay = null;
    this.statsMessage = null;
    this.statsIcon = null;
    this.statCorrect = null;
    this.statIncorrect = null;
    this.btnPlayAgain = null;
    this.btnReset = null;
  }

  /**
   * Initialize common DOM elements and event listeners
   */
  init() {
    this.initElements();
    this.initEventListeners();
    this.initLanguageListener();
  }

  /**
   * Initialize DOM element references
   */
  initElements() {
    this.progress = document.getElementById('progress');
    this.feedback = document.getElementById('feedback');
    this.statsOverlay = document.getElementById('stats-overlay');
    this.statsMessage = document.getElementById('stats-message');
    this.statsIcon = document.getElementById('stats-icon');
    this.statCorrect = document.getElementById('stat-correct') || document.getElementById('stats-correct');
    this.statIncorrect = document.getElementById('stat-incorrect') || document.getElementById('stats-wrong');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnReset = document.getElementById('btn-reset');
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    if (this.btnPlayAgain) {
      this.btnPlayAgain.addEventListener('click', () => this.resetActivity());
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.resetRound());
    }

    if (this.statsOverlay) {
      this.statsOverlay.addEventListener('click', (e) => {
        if (e.target === this.statsOverlay) {
          this.resetActivity();
        }
      });
    }
  }

  /**
   * Initialize language change listener
   */
  initLanguageListener() {
    document.addEventListener('languageChanged', () => {
      this.updateTranslations();
    });
  }

  /**
   * Increment correct answer count
   */
  incrementCorrect() {
    this.correctCount++;
  }

  /**
   * Increment incorrect answer count
   */
  incrementIncorrect() {
    this.incorrectCount++;
  }

  /**
   * Render progress indicator dots
   */
  renderProgress() {
    if (!this.progress) return;

    let html = '';
    for (let i = 1; i <= this.totalRounds; i++) {
      let className = 'progress-dot';
      if (i < this.currentRound || (i === this.currentRound && this.isAnswered)) {
        className += ' completed';
      } else if (i === this.currentRound) {
        className += ' current';
      }
      html += `<div class="${className}"></div>`;
    }
    this.progress.innerHTML = html;
  }

  /**
   * Show feedback message
   * @param {string} message - Message to display
   * @param {boolean} isError - Whether this is an error message
   * @param {number} duration - How long to show (ms), 0 for permanent
   */
  showFeedback(message, isError = false, duration = 0) {
    if (!this.feedback) return;

    this.feedback.textContent = message;
    this.feedback.classList.remove('error');
    if (isError) {
      this.feedback.classList.add('error');
    }
    this.feedback.classList.add('show');

    if (duration > 0) {
      setTimeout(() => this.hideFeedback(), duration);
    }
  }

  /**
   * Hide feedback message
   */
  hideFeedback() {
    if (!this.feedback) return;
    this.feedback.classList.remove('show', 'error');
  }

  /**
   * Show stats modal with results
   */
  showStats() {
    if (!this.statsOverlay) return;

    // Update stats values
    if (this.statCorrect) {
      this.statCorrect.textContent = this.correctCount;
    }
    if (this.statIncorrect) {
      this.statIncorrect.textContent = this.incorrectCount;
    }

    // Update message and icon based on performance
    this.updateStatsDisplay();

    // Show overlay
    this.statsOverlay.classList.add('show');
  }

  /**
   * Update stats display (icon and message) based on performance
   */
  updateStatsDisplay() {
    const percentage = Math.round((this.correctCount / this.totalRounds) * 100);

    // Update icon
    if (this.statsIcon) {
      if (percentage >= 80) {
        this.statsIcon.textContent = '🌟';
      } else if (percentage >= 60) {
        this.statsIcon.textContent = '🎉';
      } else {
        this.statsIcon.textContent = '👍';
      }
    }

    // Update message
    this.updateStatsMessage();
  }

  /**
   * Update stats message based on performance
   */
  updateStatsMessage() {
    if (!this.statsMessage) return;

    const percentage = Math.round((this.correctCount / this.totalRounds) * 100);
    let msgKey;

    if (percentage === 100) {
      msgKey = this.activityId ? `section.activities.${this.activityId}.perfect` : null;
    } else if (percentage >= 80) {
      msgKey = this.activityId ? `section.activities.${this.activityId}.great` : null;
    } else if (percentage >= 60) {
      msgKey = this.activityId ? `section.activities.${this.activityId}.good` : null;
    } else {
      msgKey = this.activityId ? `section.activities.${this.activityId}.keepPracticing` : null;
    }

    // Try to get translation
    let msg = msgKey && window.i18n ? window.i18n.t(msgKey) : null;

    // Fallback to generic messages
    if (!msg || msg === msgKey) {
      msg = this.getDefaultStatsMessage(percentage);
    }

    this.statsMessage.textContent = msg;
  }

  /**
   * Get default stats message based on percentage
   */
  getDefaultStatsMessage(percentage) {
    if (percentage === 100) {
      return 'Perfect! You\'re amazing!';
    } else if (percentage >= 80) {
      return 'Great job! You\'re really good at this!';
    } else if (percentage >= 60) {
      return 'Good work! Keep practicing!';
    } else {
      return 'Keep practicing! You\'re improving!';
    }
  }

  /**
   * Hide stats modal
   */
  hideStats() {
    if (this.statsOverlay) {
      this.statsOverlay.classList.remove('show');
    }
  }

  /**
   * Update translations for dynamic content
   * Override in child class for activity-specific translations
   */
  updateTranslations() {
    if (this.statsOverlay && this.statsOverlay.classList.contains('show')) {
      this.updateStatsMessage();
    }
  }

  /**
   * Reset activity to initial state
   */
  resetActivity() {
    this.currentRound = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.isAnswered = false;
    this.hideStats();
    this.hideFeedback();

    // Call activity-specific reset if defined
    if (typeof this.onReset === 'function') {
      this.onReset();
    }

    // Start first round
    this.nextRound();
  }

  /**
   * Reset current round only
   * Override in child class for specific behavior
   */
  resetRound() {
    this.isAnswered = false;
    this.hideFeedback();
    this.startRound();
  }

  /**
   * Advance to next round
   */
  nextRound() {
    this.currentRound++;
    this.isAnswered = false;

    if (this.currentRound > this.totalRounds) {
      this.showStats();
      return;
    }

    this.renderProgress();
    this.hideFeedback();
    this.startRound();
  }

  /**
   * Start a round - MUST be implemented by child class
   */
  startRound() {
    console.warn('ActivityBase.startRound() - Override this method in your activity');
  }

  /**
   * Auto-advance to next round after delay
   */
  autoAdvance(callback = null, delay = null) {
    const actualDelay = delay !== null ? delay : this.autoAdvanceDelay;
    setTimeout(() => {
      if (callback) {
        callback();
      } else {
        this.nextRound();
      }
    }, actualDelay);
  }

  // ========== Utility Methods ==========

  /**
   * Get translation text with fallback
   * @param {string} key - Translation key
   * @param {string} fallback - Fallback text if translation not found
   */
  t(key, fallback = '') {
    const translated = window.i18n?.t(key);
    return (translated && translated !== key) ? translated : fallback;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Disable all buttons in a container
   */
  disableButtons(container) {
    if (!container) return;
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
  }

  /**
   * Enable all buttons in a container
   */
  enableButtons(container) {
    if (!container) return;
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }

  /**
   * Add CSS class temporarily
   */
  addTemporaryClass(element, className, duration = 300) {
    if (!element) return;
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, duration);
  }
}

// Export for use in activity files
window.ActivityBase = ActivityBase;
