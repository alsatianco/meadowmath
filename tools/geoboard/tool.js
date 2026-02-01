// Geoboard Tool - Meadow Math

(function() {
  'use strict';

  const state = {
    mode: 'explore',
    gridSize: 5,
    currentColor: '#FF6B9D',
    selectedPegs: [],
    shapes: [],
    challengeIndex: 0,
    challenges: []
  };

  const challengesList = [
    { type: 'sides', count: 3, prompt: 'Make a triangle' },
    { type: 'sides', count: 4, prompt: 'Make a square or rectangle' },
    { type: 'sides', count: 5, prompt: 'Make a pentagon (5 sides)' },
    { type: 'sides', count: 4, prompt: 'Make a different quadrilateral' },
    { type: 'sides', count: 3, prompt: 'Make a different triangle' },
    { type: 'sides', count: 6, prompt: 'Make a hexagon (6 sides)' }
  ];

  let svg;
  let feedbackBanner, feedbackText, challengePanel, challengePrompt, challengeProgress;
  let completionOverlay;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    setupEventListeners();
    renderBoard();
  }

  function cacheElements() {
    svg = document.getElementById('geoboard-svg');
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

    document.getElementById('grid-select').addEventListener('change', (e) => {
      state.gridSize = parseInt(e.target.value);
      reset();
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentColor = btn.dataset.color;
      });
    });

    document.querySelector('.btn-reset').addEventListener('click', reset);
    document.getElementById('btn-check')?.addEventListener('click', checkAnswer);
    document.getElementById('btn-skip')?.addEventListener('click', nextChallenge);
    document.getElementById('btn-restart')?.addEventListener('click', restartChallenges);
  }

  function renderBoard() {
    const size = 300;
    const padding = 30;
    const spacing = (size - 2 * padding) / (state.gridSize - 1);

    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.innerHTML = '';

    // Draw shapes first (behind pegs)
    const shapesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    shapesGroup.id = 'shapes-group';
    svg.appendChild(shapesGroup);

    // Draw current shape in progress
    if (state.selectedPegs.length > 1) {
      const points = state.selectedPegs.map(p => `${p.x},${p.y}`).join(' ');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      path.setAttribute('points', points);
      path.setAttribute('class', 'rubber-band');
      path.setAttribute('style', `fill: ${state.currentColor}33; stroke: ${state.currentColor};`);
      shapesGroup.appendChild(path);
    }

    // Draw completed shapes
    state.shapes.forEach(shape => {
      const points = shape.pegs.map(p => `${p.x},${p.y}`).join(' ');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      path.setAttribute('points', points);
      path.setAttribute('class', 'rubber-band');
      path.setAttribute('style', `fill: ${shape.color}33; stroke: ${shape.color};`);
      shapesGroup.appendChild(path);
    });

    // Draw pegs
    for (let row = 0; row < state.gridSize; row++) {
      for (let col = 0; col < state.gridSize; col++) {
        const x = padding + col * spacing;
        const y = padding + row * spacing;

        const peg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        peg.setAttribute('class', 'peg');
        peg.setAttribute('cx', x);
        peg.setAttribute('cy', y);
        peg.setAttribute('r', 6);
        peg.dataset.row = row;
        peg.dataset.col = col;

        // Check if selected
        const isSelected = state.selectedPegs.some(p => p.row === row && p.col === col);
        if (isSelected) peg.classList.add('selected');

        peg.addEventListener('click', () => togglePeg(row, col, x, y));
        svg.appendChild(peg);
      }
    }
  }

  function togglePeg(row, col, x, y) {
    const existingIndex = state.selectedPegs.findIndex(p => p.row === row && p.col === col);

    if (existingIndex !== -1) {
      // If clicking the first peg and we have 3+ pegs, complete the shape
      if (existingIndex === 0 && state.selectedPegs.length >= 3) {
        state.shapes.push({
          pegs: [...state.selectedPegs],
          color: state.currentColor
        });
        state.selectedPegs = [];
        updateFeedback();
      } else {
        // Otherwise, remove the peg
        state.selectedPegs.splice(existingIndex, 1);
      }
    } else {
      state.selectedPegs.push({ row, col, x, y });
    }

    renderBoard();
  }

  function updateFeedback() {
    if (state.shapes.length > 0) {
      const lastShape = state.shapes[state.shapes.length - 1];
      feedbackText.textContent = `Shape created with ${lastShape.pegs.length} sides!`;
    }
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

  function loadChallenge() {
    if (state.challengeIndex >= state.challenges.length) {
      showCompletion();
      return;
    }

    const challenge = state.challenges[state.challengeIndex];
    challengePrompt.textContent = challenge.prompt;
    challengeProgress.textContent = `Challenge ${state.challengeIndex + 1} of ${state.challenges.length}`;

    state.selectedPegs = [];
    state.shapes = [];
    renderBoard();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    let isCorrect = false;

    if (challenge.type === 'sides' && state.shapes.length > 0) {
      const lastShape = state.shapes[state.shapes.length - 1];
      isCorrect = lastShape.pegs.length === challenge.count;
    }

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
      feedbackText.textContent = '❌ Try again! Complete a shape by clicking back on the first peg.';
      setTimeout(() => {
        feedbackBanner.style.display = 'none';
        feedbackBanner.className = 'tool-feedback';
        challengePanel.querySelector('.challenge-actions').style.visibility = 'visible';
      }, 1500);
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
    state.selectedPegs = [];
    state.shapes = [];
    renderBoard();
    feedbackText.textContent = 'Click pegs to create shapes';
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
