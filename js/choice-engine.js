/**
 * ChoiceEngine - shared multiple-choice engine for activities (2-4 options).
 * Requires ActivityBase (load ../../js/activity-base.js first).
 */
(function initChoiceEngine() {
  if (!window.ActivityBase) {
    console.warn('ChoiceEngine: ActivityBase not found. Load activity-base.js first.');
    return;
  }

  class ChoiceEngine extends ActivityBase {
    constructor(config = {}) {
      super(config);

      this.choicesContainerId = config.choicesContainerId || config.choiceContainerId || 'choices-container';
      this.choiceButtonClass = config.choiceButtonClass || 'choice-btn';
      this.choiceButtonClasses = Array.isArray(config.choiceButtonClasses) ? config.choiceButtonClasses : [];
      this.squareButtons = config.squareButtons !== false;
      this.choiceLayout = config.choiceLayout || null;
      this.containerClasses = Array.isArray(config.containerClasses) ? config.containerClasses : [];
      this.useChoiceContainerClass = config.useChoiceContainerClass !== false;
      this.choiceDisableOnAnswer = config.choiceDisableOnAnswer !== false;

      this.getRoundData = config.getRoundData || null;
      this.onRoundStart = config.onRoundStart || null;
      this.onAnswer = config.onAnswer || null;
      this.onCorrect = config.onCorrect || null;
      this.onIncorrect = config.onIncorrect || null;
      this.getFeedbackText = typeof config.getFeedbackText === 'function' ? config.getFeedbackText : null;

      this.correctFeedbackKey = config.correctFeedbackKey || 'feedback.correct';
      this.incorrectFeedbackKey = config.incorrectFeedbackKey || 'feedback.tryAgain';
      this.correctFeedbackText = config.correctFeedbackText || 'Great job!';
      this.incorrectFeedbackText = config.incorrectFeedbackText || 'Try again!';
      this.feedbackDuration = Number.isFinite(config.feedbackDuration) ? config.feedbackDuration : 0;

      this.maxAttempts = Number.isFinite(config.maxAttempts) ? Math.max(1, config.maxAttempts) : 1;
      this.advanceOnCorrect = config.advanceOnCorrect !== false;
      this.advanceOnIncorrect = config.advanceOnIncorrect !== undefined ? config.advanceOnIncorrect : this.maxAttempts === 1;
      this.showCorrectOnIncorrect = config.showCorrectOnIncorrect !== false;

      this.choiceContainer = null;
      this.choiceButtons = [];
      this.currentRoundData = null;
      this.attempts = 0;
      this.lastFeedback = null;
    }

    init() {
      super.init();

      this.choiceContainer = typeof this.choicesContainerId === 'string'
        ? document.getElementById(this.choicesContainerId)
        : this.choicesContainerId;

      if (!this.choiceContainer) {
        console.warn('ChoiceEngine: choices container not found.');
        return;
      }

      if (this.feedback && !this.feedback.hasAttribute('aria-live')) {
        this.feedback.setAttribute('aria-live', 'polite');
      }

      this.nextRound();
    }

    startRound() {
      if (typeof this.getRoundData !== 'function') {
        console.warn('ChoiceEngine: getRoundData is required.');
        return;
      }

      this.attempts = 0;
      this.lastFeedback = null;
      this.currentRoundData = this.getRoundData(this.currentRound, this);

      if (!this.currentRoundData || !Array.isArray(this.currentRoundData.choices)) {
        console.warn('ChoiceEngine: round data must include choices array.');
        return;
      }

      if (typeof this.onRoundStart === 'function') {
        this.onRoundStart(this.currentRoundData, this);
      }

      this.renderChoices(this.currentRoundData.choices, this.currentRoundData);
    }

    renderChoices(choices, roundData) {
      if (!this.choiceContainer) return;

      this.choiceButtons = [];
      this.choiceContainer.innerHTML = '';
      this.applyContainerClasses(choices.length, roundData);

      choices.forEach((choice, index) => {
        const button = this.buildChoiceButton(choice, index, roundData);
        this.choiceContainer.appendChild(button);
        this.choiceButtons.push(button);
      });
    }

    applyContainerClasses(count, roundData) {
      if (!this.choiceContainer) return;

      if (this.useChoiceContainerClass) {
        this.choiceContainer.classList.add('choices-container', 'choice-engine');
      }

      if (this.containerClasses.length) {
        this.choiceContainer.classList.add(...this.containerClasses);
      }

      this.choiceContainer.classList.remove('grid-3', 'grid-4');

      const layout = (roundData && roundData.layout) || this.choiceLayout;
      if (layout) {
        this.choiceContainer.classList.add(layout);
      } else if (count === 3) {
        this.choiceContainer.classList.add('grid-3');
      } else if (count === 4) {
        this.choiceContainer.classList.add('grid-4');
      }
    }

    buildChoiceButton(choice, index, roundData) {
      const button = document.createElement('button');
      button.type = 'button';

      const classes = [];
      if (this.choiceButtonClass) {
        classes.push(...this.choiceButtonClass.split(' ').filter(Boolean));
      }
      if (this.choiceButtonClasses.length) {
        classes.push(...this.choiceButtonClasses);
      }
      if (this.squareButtons) {
        classes.push('choice-square');
      }
      if (choice.className) {
        classes.push(...choice.className.split(' ').filter(Boolean));
      }

      if (classes.length) {
        button.classList.add(...classes);
      }

      button.dataset.choiceIndex = index;

      if (choice.value !== undefined) {
        button.dataset.value = choice.value;
      }

      if (choice.data && typeof choice.data === 'object') {
        Object.entries(choice.data).forEach(([key, value]) => {
          button.dataset[key] = String(value);
        });
      }

      this.applyChoiceContent(button, choice);

      const ariaLabel = this.getChoiceAriaLabel(choice);
      if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel);
      }

      button.addEventListener('click', () => this.handleChoice(choice, index, button, roundData));

      return button;
    }

    applyChoiceContent(button, choice) {
      if (typeof choice.render === 'function') {
        const content = choice.render(choice, this);
        this.replaceButtonContent(button, content);
        return;
      }

      if (choice.html) {
        button.innerHTML = choice.html;
        return;
      }

      const label = this.getChoiceLabel(choice);
      button.textContent = label;
    }

    replaceButtonContent(button, content) {
      if (content === null || content === undefined) {
        button.textContent = '';
        return;
      }

      if (content instanceof Node) {
        button.replaceChildren(content);
        return;
      }

      if (Array.isArray(content)) {
        button.replaceChildren(...content);
        return;
      }

      button.innerHTML = content;
    }

    getChoiceLabel(choice) {
      const fallback = choice.label !== undefined && choice.label !== null
        ? String(choice.label)
        : (choice.value !== undefined && choice.value !== null ? String(choice.value) : '');

      if (choice.labelKey) {
        return this.t(choice.labelKey, fallback);
      }

      return fallback;
    }

    getChoiceAriaLabel(choice) {
      const fallback = choice.ariaLabel || this.getChoiceLabel(choice);

      if (choice.ariaLabelKey) {
        return this.t(choice.ariaLabelKey, fallback);
      }

      return fallback;
    }

    handleChoice(choice, index, button, roundData) {
      if (this.isAnswered) return;

      const isCorrect = this.evaluateChoice(choice, index, roundData);
      this.attempts += 1;

      const allowRetry = !isCorrect && this.attempts < this.maxAttempts;
      const resolved = isCorrect || !allowRetry;

      if (resolved && this.choiceDisableOnAnswer) {
        this.disableButtons(this.choiceContainer);
      } else if (!isCorrect && allowRetry) {
        button.disabled = true;
      }

      if (isCorrect) {
        button.classList.add('correct');
        this.incrementCorrect();
      } else {
        button.classList.add('incorrect');
        this.incrementIncorrect();
        if (resolved && this.showCorrectOnIncorrect) {
          this.highlightCorrectChoice(roundData);
        }
      }

      this.lastFeedback = { isCorrect, choice, roundData };
      this.updateFeedbackText(true);

      if (typeof this.onAnswer === 'function') {
        this.onAnswer({
          isCorrect,
          choice,
          roundData,
          attempts: this.attempts,
          resolved,
          button,
          engine: this
        });
      }

      if (isCorrect && typeof this.onCorrect === 'function') {
        this.onCorrect(choice, roundData, this, button);
      }

      if (!isCorrect && typeof this.onIncorrect === 'function') {
        this.onIncorrect(choice, roundData, this, button);
      }

      if (resolved) {
        this.isAnswered = true;
        this.renderProgress();

        const shouldAdvance = isCorrect ? this.advanceOnCorrect : this.advanceOnIncorrect;
        if (shouldAdvance) {
          this.autoAdvance();
        }
      } else {
        this.renderProgress();
      }
    }

    evaluateChoice(choice, index, roundData) {
      if (typeof choice.isCorrect === 'boolean') return choice.isCorrect;

      if (roundData && typeof roundData.isChoiceCorrect === 'function') {
        return !!roundData.isChoiceCorrect(choice, index, this);
      }

      if (roundData && typeof roundData.correctIndex === 'number') {
        return index === roundData.correctIndex;
      }

      if (roundData && Object.prototype.hasOwnProperty.call(roundData, 'correctValue')) {
        return choice.value === roundData.correctValue;
      }

      return false;
    }

    highlightCorrectChoice(roundData) {
      if (!roundData || !Array.isArray(roundData.choices)) return;

      const correctIndex = roundData.choices.findIndex((choice, index) =>
        this.evaluateChoice(choice, index, roundData)
      );

      if (correctIndex < 0) return;

      const button = this.choiceButtons[correctIndex];
      if (button) {
        button.classList.add('correct');
      }
    }

    getFeedbackMessage(isCorrect, choice, roundData) {
      if (this.getFeedbackText) {
        const message = this.getFeedbackText({ isCorrect, choice, roundData, engine: this });
        if (typeof message === 'string') return message;
      }

      const roundFeedback = roundData && roundData.feedback ? roundData.feedback : {};
      const key = isCorrect
        ? roundFeedback.correctKey || this.correctFeedbackKey
        : roundFeedback.incorrectKey || this.incorrectFeedbackKey;
      const fallback = isCorrect
        ? roundFeedback.correctText || this.correctFeedbackText
        : roundFeedback.incorrectText || this.incorrectFeedbackText;

      return this.t(key, fallback);
    }

    updateFeedbackText(show = false) {
      if (!this.feedback) return;
      if (!this.lastFeedback) return;

      const message = this.getFeedbackMessage(
        this.lastFeedback.isCorrect,
        this.lastFeedback.choice,
        this.lastFeedback.roundData
      );

      if (!message) return;

      if (show) {
        this.showFeedback(message, !this.lastFeedback.isCorrect, this.feedbackDuration);
      } else if (this.feedback.classList.contains('show')) {
        this.feedback.textContent = message;
      }
    }

    updateChoiceLabels() {
      if (!this.currentRoundData || !this.choiceButtons.length) return;

      this.choiceButtons.forEach((button, index) => {
        const choice = this.currentRoundData.choices[index];
        if (!choice) return;
        this.applyChoiceContent(button, choice);
        const ariaLabel = this.getChoiceAriaLabel(choice);
        if (ariaLabel) {
          button.setAttribute('aria-label', ariaLabel);
        }
      });
    }

    updateTranslations() {
      super.updateTranslations();
      this.updateChoiceLabels();
      this.updateFeedbackText(false);
    }

    static shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    }

    static randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static generateNumberChoices({
      correct,
      count = 4,
      min = 0,
      max = 20,
      spread = 3,
      includeCorrect = true
    }) {
      const choices = new Set();
      if (includeCorrect && correct !== undefined && correct !== null) {
        choices.add(correct);
      }

      const candidates = [];
      for (let value = correct - spread; value <= correct + spread; value++) {
        if (value >= min && value <= max && value !== correct) {
          candidates.push(value);
        }
      }

      ChoiceEngine.shuffleArray(candidates).forEach(value => {
        if (choices.size < count) {
          choices.add(value);
        }
      });

      while (choices.size < count) {
        choices.add(ChoiceEngine.randomInt(min, max));
      }

      return ChoiceEngine.shuffleArray(Array.from(choices)).slice(0, count);
    }
  }

  window.ChoiceEngine = ChoiceEngine;
})();
