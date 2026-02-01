/**
 * Migration Helper for Refactoring Activities
 * 
 * This script helps identify which parts of an activity can be replaced
 * with the new shared code from ActivityBase and shared CSS.
 * 
 * Usage: 
 * 1. Include this script in an activity page
 * 2. Check console for suggestions: MigrationHelper.analyze()
 * 3. Generate template: MigrationHelper.generateTemplate('activity-id', 'Activity Name')
 */

const MigrationHelper = {
  /**
   * Analyze an activity page and provide refactoring suggestions
   */
  analyze() {
    console.group('🔍 Activity Refactoring Analysis');

    const suggestions = [];
    const warnings = [];

    // Check if using shared ActivityBase
    if (!window.ActivityBase) {
      warnings.push('⚠️ ActivityBase not loaded - include ../../js/activity-base.js');
    } else {
      suggestions.push('✓ ActivityBase is available');
    }

    // Check if using shared ActivityComponents
    if (!window.ActivityComponents) {
      warnings.push('⚠️ ActivityComponents not loaded - include ../../js/activity-components.js');
    } else {
      suggestions.push('✓ ActivityComponents is available');
    }

    // Check for shared CSS
    this.checkForSharedCSS(suggestions, warnings);

    // Check for common elements that could use shared classes
    this.checkForCommonElements(suggestions, warnings);

    // Check for duplicate code patterns
    this.checkForDuplicatePatterns(suggestions, warnings);

    // Display results
    console.log('\n📋 Suggestions:');
    suggestions.forEach(s => console.log(s));

    if (warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      warnings.forEach(w => console.log(w));
    }

    this.printNextSteps();

    console.groupEnd();

    return { suggestions, warnings };
  },

  /**
   * Check for shared CSS files
   */
  checkForSharedCSS(suggestions, warnings) {
    const stylesheets = Array.from(document.styleSheets);

    const hasActivityCSS = stylesheets.some(sheet => {
      try {
        return sheet.href && sheet.href.includes('activity.css');
      } catch (e) {
        return false;
      }
    });

    if (hasActivityCSS) {
      suggestions.push('✓ activity.css is loaded');
    } else {
      warnings.push('⚠️ activity.css not found');
    }

    const hasSharedCSS = stylesheets.some(sheet => {
      try {
        return sheet.href && sheet.href.includes('activity-shared.css');
      } catch (e) {
        return false;
      }
    });

    if (hasSharedCSS) {
      suggestions.push('✓ activity-shared.css is loaded');
    }
  },

  /**
   * Check for common elements
   */
  checkForCommonElements(suggestions, warnings) {
    const elements = {
      'progress': 'Progress indicator',
      'feedback': 'Feedback message',
      'stats-overlay': 'Stats overlay',
      'stats-message': 'Stats message',
      'btn-play-again': 'Play again button',
      'btn-reset': 'Reset button'
    };

    for (const [id, name] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (el) {
        suggestions.push(`✓ ${name} found (#${id})`);
      }
    }
  },

  /**
   * Check for duplicate patterns in inline scripts
   */
  checkForDuplicatePatterns(suggestions, warnings) {
    const scripts = Array.from(document.querySelectorAll('script:not([src])'));
    const scriptContent = scripts.map(s => s.textContent).join('\n');

    const patterns = {
      'correctCount': 'Use incrementCorrect()',
      'incorrectCount': 'Use incrementIncorrect()',
      'wrongCount': 'Use incrementIncorrect()',
      'showStats': 'Use ActivityBase.showStats()',
      'renderProgress': 'Use ActivityBase.renderProgress()',
      'addEventListener.*languageChanged': 'Handled by ActivityBase.init()',
      'Math\\.floor\\(Math\\.random': 'Use this.randomInt() or global randomInt()',
      'shuffle.*Fisher': 'Use this.shuffle() or global shuffle()',
      'escapeHtml': 'Use this.escapeHtml()',
      '\\.disabled\\s*=': 'Use this.disableButtons()/enableButtons()'
    };

    for (const [pattern, suggestion] of Object.entries(patterns)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(scriptContent)) {
        warnings.push(`⚠️ Found pattern '${pattern}' - ${suggestion}`);
      }
    }
  },

  /**
   * Print next steps
   */
  printNextSteps() {
    console.log('\n💡 Refactoring Steps:');
    console.log('1. Ensure shared JS files are loaded:');
    console.log('   <script src="../../js/activity-base.js"></script>');
    console.log('   <script src="../../js/activity-components.js"></script>');
    console.log('');
    console.log('2. Update CSS imports (activity.css should import shared)');
    console.log('');
    console.log('3. Convert activity object to use ActivityBase:');
    console.log('   - Remove duplicate utility functions');
    console.log('   - Use base class methods for stats, progress, feedback');
    console.log('   - Use auto-advance helper');
    console.log('');
    console.log('4. Test thoroughly!');
  },

  /**
   * Generate a template for a refactored activity
   */
  generateTemplate(activityId, activityName, gradeLevel = 'grade1') {
    const className = this.toPascalCase(activityId);
    const backToKey = gradeLevel === 'prek' ? 'nav.prek' : `nav.${gradeLevel}`;

    const template = `
/**
 * ${activityName} Activity
 * 
 * Uses ActivityBase for common functionality:
 * - Stats tracking
 * - Progress indicator
 * - Stats modal
 * - Auto-advance
 * - Translation support
 */
class ${className} extends ActivityBase {
  constructor() {
    super({
      totalRounds: 8,
      activityId: '${activityId}',
      activityName: '${activityName}',
      gradeLevel: '${gradeLevel}',
      autoAdvanceDelay: 1500
    });

    // Activity-specific properties
    this.currentAnswer = null;

    // Activity-specific DOM elements (assigned in init)
    this.questionEl = null;
    this.choicesContainer = null;
  }

  /**
   * Initialize the activity
   */
  init() {
    // Initialize base class (DOM refs, event listeners, translations)
    super.init();

    // Get activity-specific DOM elements
    this.questionEl = document.getElementById('question');
    this.choicesContainer = document.getElementById('choices-container');

    // Set up activity-specific event listeners
    // ...

    // Start the activity
    this.nextRound();
  }

  /**
   * Start a new round
   * Called by nextRound() from base class
   */
  startRound() {
    // Generate question
    this.generateQuestion();

    // Generate answer choices
    this.generateChoices();

    // Render UI
    this.renderQuestion();
    this.renderChoices();
  }

  /**
   * Generate a new question
   */
  generateQuestion() {
    // Activity-specific question generation
    // Use this.randomInt(min, max) for random numbers
  }

  /**
   * Generate answer choices
   */
  generateChoices() {
    // Generate correct answer and distractors
    // Use this.shuffle() to randomize
  }

  /**
   * Render the question
   */
  renderQuestion() {
    if (this.questionEl) {
      // Update question display
    }
  }

  /**
   * Render answer choices
   */
  renderChoices() {
    if (!this.choicesContainer) return;

    this.choicesContainer.innerHTML = '';
    // Create choice buttons...
  }

  /**
   * Handle answer selection
   */
  selectAnswer(answer, buttonEl) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    // Disable all buttons
    this.disableButtons(this.choicesContainer);

    const correct = answer === this.currentAnswer;

    if (correct) {
      this.incrementCorrect();
      buttonEl.classList.add('correct');
      this.showFeedback('Correct!', false);
    } else {
      this.incrementIncorrect();
      buttonEl.classList.add('incorrect');
      this.showFeedback('Try again!', true);
      // Optionally highlight correct answer
    }

    // Auto-advance to next round
    this.autoAdvance();
  }

  /**
   * Custom reset for current round (optional)
   */
  resetRound() {
    super.resetRound();
    // Activity-specific round reset
  }

  /**
   * Custom activity reset (optional)
   */
  onReset() {
    // Called by base class resetActivity()
    // Add activity-specific cleanup here
  }

  /**
   * Update translations (optional)
   */
  updateTranslations() {
    super.updateTranslations();
    // Activity-specific translation updates
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const activity = new ${className}();
  activity.init();
});
    `.trim();

    console.group(`📝 Generated Template for ${activityName}`);
    console.log(template);
    console.groupEnd();

    return template;
  },

  /**
   * Convert kebab-case to PascalCase
   */
  toPascalCase(str) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  },

  /**
   * List all activities that could be refactored
   */
  listActivities() {
    console.group('📚 Activities to Refactor');

    // This would need to be run from a page that can access the file system
    // For now, just print instructions
    console.log('Run this command in terminal to list activities:');
    console.log('ls prek/activities/*.html | wc -l');
    console.log('ls grade1/activities/*.html | wc -l');

    console.groupEnd();
  }
};

// Make available globally
window.MigrationHelper = MigrationHelper;

console.log('💡 Migration Helper loaded!');
console.log('   - MigrationHelper.analyze() - Analyze current page');
console.log('   - MigrationHelper.generateTemplate(id, name, grade) - Generate template');
