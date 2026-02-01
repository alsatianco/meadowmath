// Base-10 Blocks Tool - Meadow Math

(function() {
  'use strict';

  // ============ STATE ============
  const state = {
    mode: 'explore',
    hundreds: 0,
    tens: 0,
    ones: 0,
    challengeIndex: 0,
    challenges: []
  };

  // ============ CHALLENGES ============
  const challengesList = [
    { type: 'build', target: 47, prompt: 'Build 47' },
    { type: 'build', target: 123, prompt: 'Build 123' },
    { type: 'build', target: 56, prompt: 'Build 56' },
    { type: 'build', target: 200, prompt: 'Build 200' },
    { type: 'build', target: 305, prompt: 'Build 305' },
    { type: 'build', target: 89, prompt: 'Build 89' }
  ];

  // ============ DOM ELEMENTS ============
  let hundredsArea, tensArea, onesArea;
  let hundredsCount, tensCount, onesCount;
  let totalDisplay, feedbackBanner, feedbackText;
  let challengePanel, challengePrompt, challengeProgress;
  let completionOverlay;

  // ============ INITIALIZATION ============
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    setupEventListeners();
    updateDisplay();
  }

  function cacheElements() {
    hundredsArea = document.getElementById('hundreds-area');
    tensArea = document.getElementById('tens-area');
    onesArea = document.getElementById('ones-area');
    hundredsCount = document.getElementById('hundreds-count');
    tensCount = document.getElementById('tens-count');
    onesCount = document.getElementById('ones-count');
    totalDisplay = document.getElementById('total-display');
    feedbackBanner = document.getElementById('feedback-banner');
    feedbackText = document.getElementById('feedback-text');
    challengePanel = document.getElementById('challenge-panel');
    challengePrompt = document.getElementById('challenge-prompt');
    challengeProgress = document.getElementById('challenge-progress');
    completionOverlay = document.getElementById('completion-overlay');
  }

  function setupEventListeners() {
    // Mode switch
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Bank items
    document.querySelectorAll('.bank-item').forEach(item => {
      item.addEventListener('click', () => addBlock(item.dataset.type));
    });

    // Reset button
    document.querySelector('.btn-reset').addEventListener('click', reset);

    // Challenge buttons
    document.getElementById('btn-check')?.addEventListener('click', checkAnswer);
    document.getElementById('btn-skip')?.addEventListener('click', nextChallenge);
    document.getElementById('btn-restart')?.addEventListener('click', restartChallenges);
  }

  // ============ MODE SWITCHING ============
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

  // ============ BLOCK MANAGEMENT ============
  function addBlock(type) {
    const total = getTotal();

    // Limit to 999
    if (type === 'hundred' && total + 100 > 999) return;
    if (type === 'ten' && total + 10 > 999) return;
    if (type === 'one' && total + 1 > 999) return;

    let area, blockClass;
    switch (type) {
      case 'hundred':
        state.hundreds++;
        area = hundredsArea;
        blockClass = 'hundred-block';
        break;
      case 'ten':
        state.tens++;
        area = tensArea;
        blockClass = 'ten-block';
        break;
      case 'one':
        state.ones++;
        area = onesArea;
        blockClass = 'one-block';
        break;
    }

    // Create block element
    const block = document.createElement('div');
    block.className = `block ${blockClass} adding`;
    block.addEventListener('click', () => removeBlock(type, block));
    area.appendChild(block);

    // Remove animation class
    setTimeout(() => block.classList.remove('adding'), 300);

    updateDisplay();
  }

  function removeBlock(type, element) {
    element.classList.add('removing');

    setTimeout(() => {
      element.remove();

      switch (type) {
        case 'hundred':
          state.hundreds = Math.max(0, state.hundreds - 1);
          break;
        case 'ten':
          state.tens = Math.max(0, state.tens - 1);
          break;
        case 'one':
          state.ones = Math.max(0, state.ones - 1);
          break;
      }

      updateDisplay();
    }, 200);
  }

  function getTotal() {
    return state.hundreds * 100 + state.tens * 10 + state.ones;
  }

  // ============ DISPLAY ============
  function updateDisplay() {
    hundredsCount.textContent = state.hundreds;
    tensCount.textContent = state.tens;
    onesCount.textContent = state.ones;
    totalDisplay.textContent = getTotal();
  }

  function renderBlocks() {
    // Clear all areas
    hundredsArea.innerHTML = '';
    tensArea.innerHTML = '';
    onesArea.innerHTML = '';

    // Render hundreds
    for (let i = 0; i < state.hundreds; i++) {
      const block = document.createElement('div');
      block.className = 'block hundred-block';
      block.addEventListener('click', () => removeBlock('hundred', block));
      hundredsArea.appendChild(block);
    }

    // Render tens
    for (let i = 0; i < state.tens; i++) {
      const block = document.createElement('div');
      block.className = 'block ten-block';
      block.addEventListener('click', () => removeBlock('ten', block));
      tensArea.appendChild(block);
    }

    // Render ones
    for (let i = 0; i < state.ones; i++) {
      const block = document.createElement('div');
      block.className = 'block one-block';
      block.addEventListener('click', () => removeBlock('one', block));
      onesArea.appendChild(block);
    }
  }

  // ============ CHALLENGES ============
  function loadChallenge() {
    if (state.challengeIndex >= state.challenges.length) {
      showCompletion();
      return;
    }

    const challenge = state.challenges[state.challengeIndex];
    challengePrompt.textContent = challenge.prompt;
    challengeProgress.textContent = `Challenge ${state.challengeIndex + 1} of ${state.challenges.length}`;

    // Clear blocks
    state.hundreds = 0;
    state.tens = 0;
    state.ones = 0;
    renderBlocks();
    updateDisplay();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    const total = getTotal();
    const isCorrect = total === challenge.target;

    showFeedback(isCorrect);
  }

  function showFeedback(isCorrect) {
    const banner = feedbackBanner;
    banner.style.display = 'block';
    challengePanel.querySelector('.challenge-actions').style.visibility = 'hidden';

    if (isCorrect) {
      banner.className = 'tool-feedback correct';
      feedbackText.textContent = '🎉 Correct!';

      setTimeout(() => {
        banner.style.display = 'none';
        banner.className = 'tool-feedback';
        challengePanel.querySelector('.challenge-actions').style.visibility = 'visible';
        nextChallenge();
      }, 1200);
    } else {
      banner.className = 'tool-feedback incorrect';
      feedbackText.textContent = '❌ Try again!';

      setTimeout(() => {
        banner.style.display = 'none';
        banner.className = 'tool-feedback';
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

  // ============ RESET ============
  function reset() {
    state.hundreds = 0;
    state.tens = 0;
    state.ones = 0;
    renderBlocks();
    updateDisplay();

    if (state.mode === 'challenges') {
      state.challengeIndex = 0;
      loadChallenge();
    }
  }

  // ============ UTILITIES ============
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
})();
