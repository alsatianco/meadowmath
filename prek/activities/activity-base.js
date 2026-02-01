/**
 * Activity Base Class
 *
 * Provides common functionality for Pre-K activities including:
 * - Progress tracking
 * - Feedback display
 * - Stats overlay
 * - Utility methods
 */

class ActivityBase {
  constructor({ maxRounds = 5, autoAdvanceDelay = 1500, activityName = 'activity' }) {
    this.round = 1;
    this.maxRounds = maxRounds;
    this.autoAdvanceDelay = autoAdvanceDelay;
    this.activityName = activityName;
    this.isComplete = false;
    this.correctCount = 0;
    this.wrongCount = 0;

    // Common DOM elements (initialized in initCommonElements)
    this.progress = null;
    this.feedback = null;
    this.statsOverlay = null;
    this.statsCorrect = null;
    this.statsWrong = null;
    this.statsMessage = null;
    this.statsIcon = null;
    this.btnPlayAgain = null;
  }

  /**
   * Initialize common DOM elements
   * Call this in the activity's init() method
   */
  initCommonElements() {
    this.progress = document.getElementById('progress');
    this.feedback = document.getElementById('feedback');
    this.statsOverlay = document.getElementById('stats-overlay');
    this.statsCorrect = document.getElementById('stats-correct');
    this.statsWrong = document.getElementById('stats-wrong');
    this.statsMessage = document.getElementById('stats-message');
    this.statsIcon = document.getElementById('stats-icon');
    this.btnPlayAgain = document.getElementById('btn-play-again');

    // Set up play again button
    if (this.btnPlayAgain) {
      this.btnPlayAgain.addEventListener('click', () => this.restartActivity());
    }

    // Allow clicking overlay to restart
    if (this.statsOverlay) {
      this.statsOverlay.addEventListener('click', (e) => {
        if (e.target === this.statsOverlay) {
          this.restartActivity();
        }
      });
    }
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Add a class temporarily to an element
   */
  addTemporaryClass(element, className, duration = 300) {
    if (!element) return;
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, duration);
  }

  /**
   * Show feedback message
   */
  showFeedback(message, isError = false, autoClear = 0) {
    if (!this.feedback) return;

    this.feedback.textContent = message;
    this.feedback.classList.remove('error');
    if (isError) {
      this.feedback.classList.add('error');
    }
    this.feedback.classList.add('show');

    if (autoClear > 0) {
      setTimeout(() => this.hideFeedback(), autoClear);
    }
  }

  /**
   * Hide feedback message
   */
  hideFeedback() {
    if (!this.feedback) return;
    this.feedback.classList.remove('show', 'error');
    this.feedback.textContent = '';
  }

  /**
   * Record a correct answer
   */
  recordCorrect(message = '') {
    this.correctCount++;
    if (message) {
      this.showFeedback(message, false);
    }
  }

  /**
   * Record a wrong answer
   */
  recordWrong(message = '') {
    this.wrongCount++;
    if (message) {
      this.showFeedback(message, true);
    }
  }

  /**
   * Render progress indicator
   */
  renderProgress() {
    if (!this.progress) return;

    let html = '';
    for (let i = 1; i <= this.maxRounds; i++) {
      let className = 'progress-dot';
      if (i < this.round || (i === this.round && this.isComplete)) {
        className += ' completed';
      } else if (i === this.round) {
        className += ' current';
      }
      html += `<div class="${className}"></div>`;
    }
    this.progress.innerHTML = html;
  }

  /**
   * Advance to next round
   */
  nextRound() {
    this.round++;
    this.isComplete = false;
    this.startRound();
  }

  /**
   * Start a new round - must be implemented by subclass
   */
  startRound() {
    throw new Error('startRound() must be implemented by the activity subclass');
  }

  /**
   * Get stats message based on performance level
   * Can be overridden by subclass
   */
  getStatsMessage(level) {
    const messages = {
      excellent: 'Amazing! You did great!',
      good: 'Good job!',
      tryAgain: 'Keep practicing!'
    };
    return messages[level];
  }

  /**
   * Show completion stats
   */
  showStats() {
    if (!this.statsOverlay) return;

    // Update stats display
    if (this.statsCorrect) {
      this.statsCorrect.textContent = this.correctCount;
    }
    if (this.statsWrong) {
      this.statsWrong.textContent = this.wrongCount;
    }

    // Determine performance level
    const percent = this.correctCount / this.maxRounds;
    let level, icon;

    if (percent >= 0.8) {
      level = 'excellent';
      icon = '🌟';
    } else if (percent >= 0.5) {
      level = 'good';
      icon = '🎉';
    } else {
      level = 'tryAgain';
      icon = '👍';
    }

    if (this.statsIcon) {
      this.statsIcon.textContent = icon;
    }
    if (this.statsMessage) {
      this.statsMessage.textContent = this.getStatsMessage(level);
    }

    this.statsOverlay.classList.add('show');
  }

  /**
   * Restart the activity
   */
  restartActivity() {
    this.round = 1;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.isComplete = false;

    if (this.statsOverlay) {
      this.statsOverlay.classList.remove('show');
    }

    this.startRound();
    this.renderProgress();
  }
}
