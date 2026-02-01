// Fraction Bars Tool - Meadow Math

(function() {
  'use strict';

  // ============ STATE ============
  const state = {
    mode: 'explore',
    denominator: 4,
    pieces: [], // Array of pieces in tray
    challengeIndex: 0,
    challenges: []
  };

  // ============ CHALLENGES ============
  // requireDen: true means user MUST use that specific denominator (e.g., "using 1/4 pieces")
  // Otherwise, any equivalent fraction is accepted (e.g., 1/2 = 2/4 = 3/6)
  const challengesList = [
    { type: 'build', target: 1, den: 4, requireDen: true, prompt: 'Build 1 using 1/4 pieces' },
    { type: 'build', target: 0.5, den: 2, prompt: 'Build 1/2' },
    { type: 'build', target: 0.75, den: 4, prompt: 'Build 3/4' },
    { type: 'build', target: 1, den: 3, requireDen: true, prompt: 'Build 1 using 1/3 pieces' },
    { type: 'equivalent', target: 0.5, prompt: 'Make something equal to 1/2' },
    { type: 'build', target: 0.5, den: 6, prompt: 'Build 3/6' }
  ];

  // ============ DOM ELEMENTS ============
  let wholebar, tray, fractionDisplay;
  let feedbackBanner, feedbackText;
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
    wholebar = document.getElementById('whole-bar');
    tray = document.getElementById('fraction-tray');
    fractionDisplay = document.getElementById('fraction-display');
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

    // Denominator buttons - click to add piece
    document.querySelectorAll('.den-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.den-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.denominator = parseInt(btn.dataset.den);
        addPieceToTray();
      });
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

  // ============ RENDERING ============
  function renderTray() {
    tray.innerHTML = '';

    const totalPieces = state.pieces.length;
    const currentDen = state.pieces[0]?.den || state.denominator;

    state.pieces.forEach((piece, index) => {
      const el = document.createElement('div');
      el.className = 'fraction-piece';
      el.dataset.den = piece.den;
      el.style.width = `${100 / piece.den}%`;
      el.textContent = `1/${piece.den}`;
      el.addEventListener('click', () => removePieceFromTray(index));
      tray.appendChild(el);
    });

    // Check if tray is full (equals 1)
    const total = getTotalValue();
    tray.classList.toggle('full', Math.abs(total - 1) < 0.001);
  }

  function updateDisplay() {
    const total = getTotalValue();
    const fraction = getFractionSum();

    if (state.pieces.length === 0) {
      fractionDisplay.textContent = `0/${state.denominator}`;
      if (state.mode === 'explore') {
        const msg = window.i18n?.t('section.tools.fractionBars.clickToAdd') || 'Click a fraction to add pieces';
        feedbackText.textContent = msg;
      }
    } else {
      fractionDisplay.textContent = `${fraction.num}/${fraction.den}`;

      // Show decimal equivalent
      if (state.mode === 'explore') {
        const decimal = total.toFixed(2);
        feedbackText.innerHTML = `
          <strong>${fraction.num}/${fraction.den}</strong> = <strong>${decimal}</strong>
          ${Math.abs(total - 1) < 0.001 ? ' = 1 Whole! 🎉' : ''}
        `;
      }
    }
  }

  function getTotalValue() {
    return state.pieces.reduce((sum, piece) => sum + (1 / piece.den), 0);
  }

  // ============ PIECE MANAGEMENT ============
  function addPieceToTray() {
    const total = getTotalValue();
    const newValue = total + (1 / state.denominator);

    // Don't exceed 1
    if (newValue > 1.001) {
      feedbackBanner.classList.add('error');
      const msg = window.i18n?.t('section.tools.fractionBars.trayFull') || 'The tray is full!';
      feedbackText.textContent = msg;
      setTimeout(() => {
        feedbackBanner.classList.remove('error');
        updateDisplay();
      }, 1500);
      return;
    }

    // In challenge mode, enforce same denominator
    if (state.pieces.length > 0 && state.pieces[0].den !== state.denominator) {
      if (state.mode === 'challenges') {
        // Clear and start fresh
        state.pieces = [];
      }
    }

    state.pieces.push({ den: state.denominator });
    renderTray();
    updateDisplay();
  }

  function removePieceFromTray(index) {
    state.pieces.splice(index, 1);
    renderTray();
    updateDisplay();
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

    // Setup denominator for challenge
    if (challenge.den) {
      state.denominator = challenge.den;
      document.querySelectorAll('.den-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.den) === challenge.den);
      });
    }

    state.pieces = [];
    renderTray();
    updateDisplay();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    const userFraction = getFractionSum();
    let isCorrect = false;

    if (challenge.type === 'build') {
      // Get target as simplified fraction
      const targetNum = Math.round(challenge.target * challenge.den);
      const targetDen = challenge.den;
      const divisor = gcd(targetNum, targetDen);
      const simplifiedTarget = { num: targetNum / divisor, den: targetDen / divisor };

      // Compare simplified fractions (1/2 = 2/4 = 3/6)
      isCorrect = (userFraction.num === simplifiedTarget.num && userFraction.den === simplifiedTarget.den);

      // If requireDen is set, also check that all pieces use the required denominator
      if (challenge.requireDen && isCorrect) {
        isCorrect = state.pieces.length > 0 && state.pieces.every(p => p.den === challenge.den);
      }
    } else if (challenge.type === 'equivalent') {
      const total = getTotalValue();
      isCorrect = Math.abs(total - challenge.target) < 0.001;
    }

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
    state.pieces = [];
    renderTray();
    updateDisplay();

    if (state.mode === 'challenges') {
      state.challengeIndex = 0;
      loadChallenge();
    } else {
      const msg = window.i18n?.t('section.tools.fractionBars.clickToAdd') || 'Click a fraction to add pieces';
      feedbackText.textContent = msg;
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

  // Greatest Common Divisor (Euclidean algorithm)
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  // Least Common Multiple
  function lcm(a, b) {
    return (a * b) / gcd(a, b);
  }

  // Get fraction sum as {numerator, denominator}
  function getFractionSum() {
    if (state.pieces.length === 0) {
      return { num: 0, den: state.denominator };
    }

    // Find LCD of all denominators
    const denominators = state.pieces.map(p => p.den);
    const lcd = denominators.reduce((acc, den) => lcm(acc, den), denominators[0]);

    // Sum all fractions converted to LCD
    const numerator = state.pieces.reduce((sum, piece) => {
      return sum + (lcd / piece.den);
    }, 0);

    // Simplify the fraction
    const divisor = gcd(numerator, lcd);
    return { num: numerator / divisor, den: lcd / divisor };
  }
})();
