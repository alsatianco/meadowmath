// Array Builder Tool - Meadow Math

(function() {
  'use strict';

  const state = {
    mode: 'explore',
    rows: 3,
    cols: 4,
    challengeIndex: 0,
    challenges: []
  };

  const challengesList = [
    { rows: 3, cols: 6, prompt: 'Build an array for 3 × 6' },
    { rows: 4, cols: 5, prompt: 'Build an array for 4 × 5' },
    { rows: 2, cols: 8, prompt: 'Build an array for 2 × 8' },
    { rows: 5, cols: 5, prompt: 'Build an array for 5 × 5' },
    { rows: 6, cols: 4, prompt: 'Build an array for 6 × 4' },
    { rows: 3, cols: 7, prompt: 'Build an array for 3 × 7' }
  ];

  let arrayContainer, rowsSlider, colsSlider;
  let rowsValue, colsValue, rowsDisplay, colsDisplay, totalDisplay;
  let feedbackBanner, feedbackText, challengePanel, challengePrompt, challengeProgress;
  let completionOverlay;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    setupEventListeners();
    renderArray();
  }

  function cacheElements() {
    arrayContainer = document.getElementById('array-container');
    rowsSlider = document.getElementById('rows-slider');
    colsSlider = document.getElementById('cols-slider');
    rowsValue = document.getElementById('rows-value');
    colsValue = document.getElementById('cols-value');
    rowsDisplay = document.getElementById('rows-display');
    colsDisplay = document.getElementById('cols-display');
    totalDisplay = document.getElementById('total-display');
    feedbackBanner = document.getElementById('feedback-banner');
    feedbackText = document.getElementById('feedback-text');
    challengePanel = document.getElementById('challenge-panel');
    challengePrompt = document.getElementById('challenge-prompt');
    challengeProgress = document.getElementById('challenge-progress');
    completionOverlay = document.getElementById('completion-overlay');
  }

  function setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    rowsSlider.addEventListener('input', () => {
      state.rows = parseInt(rowsSlider.value);
      rowsValue.textContent = state.rows;
      renderArray();
    });

    colsSlider.addEventListener('input', () => {
      state.cols = parseInt(colsSlider.value);
      colsValue.textContent = state.cols;
      renderArray();
    });

    document.querySelector('.btn-reset').addEventListener('click', reset);
    document.getElementById('btn-check')?.addEventListener('click', checkAnswer);
    document.getElementById('btn-skip')?.addEventListener('click', nextChallenge);
    document.getElementById('btn-restart')?.addEventListener('click', restartChallenges);
  }

  function switchMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'challenges') {
      feedbackBanner.style.display = 'none';
      challengePanel.style.display = 'block';
      state.challenges = shuffleArray([...challengesList]);
      state.challengeIndex = 0;
      loadChallenge();
    } else {
      feedbackBanner.style.display = 'block';
      challengePanel.style.display = 'none';
      reset();
    }
  }

  function renderArray() {
    arrayContainer.innerHTML = '';
    arrayContainer.style.gridTemplateColumns = `repeat(${state.cols}, 32px)`;

    for (let i = 0; i < state.rows * state.cols; i++) {
      const cell = document.createElement('div');
      cell.className = 'array-cell';
      cell.style.animationDelay = `${(i % 5) * 0.02}s`;
      arrayContainer.appendChild(cell);
    }

    updateDisplay();
  }

  function updateDisplay() {
    rowsDisplay.textContent = state.rows;
    colsDisplay.textContent = state.cols;
    totalDisplay.textContent = state.rows * state.cols;
  }

  function loadChallenge() {
    if (state.challengeIndex >= state.challenges.length) {
      showCompletion();
      return;
    }

    const challenge = state.challenges[state.challengeIndex];
    challengePrompt.textContent = challenge.prompt;
    challengeProgress.textContent = `Challenge ${state.challengeIndex + 1} of ${state.challenges.length}`;

    state.rows = 1;
    state.cols = 1;
    rowsSlider.value = 1;
    colsSlider.value = 1;
    rowsValue.textContent = 1;
    colsValue.textContent = 1;
    renderArray();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    const isCorrect = (state.rows === challenge.rows && state.cols === challenge.cols) ||
                      (state.rows === challenge.cols && state.cols === challenge.rows);
    showFeedback(isCorrect);
  }

  function showFeedback(isCorrect) {
    feedbackBanner.style.display = 'block';
    challengePanel.querySelector('.challenge-actions').style.visibility = 'hidden';

    if (isCorrect) {
      feedbackBanner.className = 'tool-feedback correct';
      feedbackText.textContent = '🎉 Correct!';
      setTimeout(() => {
        feedbackBanner.style.display = 'none';
        feedbackBanner.className = 'tool-feedback';
        challengePanel.querySelector('.challenge-actions').style.visibility = 'visible';
        nextChallenge();
      }, 1200);
    } else {
      feedbackBanner.className = 'tool-feedback incorrect';
      feedbackText.textContent = '❌ Try again!';
      setTimeout(() => {
        feedbackBanner.style.display = 'none';
        feedbackBanner.className = 'tool-feedback';
        challengePanel.querySelector('.challenge-actions').style.visibility = 'visible';
      }, 1000);
    }
  }

  function nextChallenge() {
    state.challengeIndex++;
    loadChallenge();
  }

  function showCompletion() {
    completionOverlay.classList.add('active');
  }

  function restartChallenges() {
    completionOverlay.classList.remove('active');
    state.challenges = shuffleArray([...challengesList]);
    state.challengeIndex = 0;
    loadChallenge();
  }

  function reset() {
    state.rows = 3;
    state.cols = 4;
    rowsSlider.value = 3;
    colsSlider.value = 4;
    rowsValue.textContent = 3;
    colsValue.textContent = 4;
    renderArray();
    if (state.mode === 'challenges') {
      state.challengeIndex = 0;
      loadChallenge();
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
})();
