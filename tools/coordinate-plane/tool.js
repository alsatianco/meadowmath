// Coordinate Plane Tool - Meadow Math

(function() {
  'use strict';

  const state = {
    mode: 'explore',
    range: 10,
    points: [],
    hoverPoint: null,
    challengeIndex: 0,
    challenges: []
  };

  const challengesList = [
    { x: 3, y: 2, prompt: 'Plot (3, 2)' },
    { x: 5, y: 5, prompt: 'Plot (5, 5)' },
    { x: 0, y: 4, prompt: 'Plot (0, 4)' },
    { x: 7, y: 1, prompt: 'Plot (7, 1)' },
    { x: 2, y: 8, prompt: 'Plot (2, 8)' },
    { x: 6, y: 6, prompt: 'Plot (6, 6)' }
  ];

  let svg;
  let feedbackBanner, feedbackText, challengePanel, challengePrompt, challengeProgress;
  let completionOverlay;

  const SVG_SIZE = 600;
  const PADDING = 40;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    setupEventListeners();
    renderGrid();
  }

  function cacheElements() {
    svg = document.getElementById('coordinate-svg');
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

    document.getElementById('range-select').addEventListener('change', (e) => {
      state.range = parseInt(e.target.value);
      reset();
    });

    svg.addEventListener('click', handleClick);
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseleave', () => {
      state.hoverPoint = null;
      renderGrid();
    });

    document.querySelector('.btn-reset').addEventListener('click', reset);
    document.getElementById('btn-check')?.addEventListener('click', checkAnswer);
    document.getElementById('btn-skip')?.addEventListener('click', nextChallenge);
    document.getElementById('btn-restart')?.addEventListener('click', restartChallenges);
  }

  function getGridCoords(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const scale = SVG_SIZE / rect.width;
    const svgX = (clientX - rect.left) * scale;
    const svgY = (clientY - rect.top) * scale;

    const gridSize = SVG_SIZE - 2 * PADDING;
    const cellSize = gridSize / state.range;

    const x = Math.round((svgX - PADDING) / cellSize);
    const y = Math.round((SVG_SIZE - PADDING - svgY) / cellSize);

    if (x >= 0 && x <= state.range && y >= 0 && y <= state.range) {
      return { x, y };
    }
    return null;
  }

  function handleClick(e) {
    const coords = getGridCoords(e.clientX, e.clientY);
    if (coords) {
      // Check if point already exists
      const existingIndex = state.points.findIndex(p => p.x === coords.x && p.y === coords.y);
      if (existingIndex !== -1) {
        state.points.splice(existingIndex, 1);
      } else {
        state.points.push(coords);
      }
      renderGrid();
      updateFeedback();
    }
  }

  function handleMouseMove(e) {
    const coords = getGridCoords(e.clientX, e.clientY);
    if (coords && (state.hoverPoint?.x !== coords.x || state.hoverPoint?.y !== coords.y)) {
      state.hoverPoint = coords;
      renderGrid();
    }
  }

  function renderGrid() {
    svg.setAttribute('viewBox', `0 0 ${SVG_SIZE} ${SVG_SIZE}`);
    svg.innerHTML = '';

    const gridSize = SVG_SIZE - 2 * PADDING;
    const cellSize = gridSize / state.range;

    // Calculate label interval based on range
    let labelInterval = 1;
    if (state.range > 30) labelInterval = 10;
    else if (state.range > 15) labelInterval = 5;
    else if (state.range > 10) labelInterval = 2;

    // Draw grid lines
    for (let i = 0; i <= state.range; i++) {
      const pos = PADDING + i * cellSize;

      // Vertical line
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('class', i === 0 ? 'axis-line' : 'grid-line');
      vLine.setAttribute('x1', pos);
      vLine.setAttribute('y1', PADDING);
      vLine.setAttribute('x2', pos);
      vLine.setAttribute('y2', SVG_SIZE - PADDING);
      svg.appendChild(vLine);

      // Horizontal line
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('class', i === 0 ? 'axis-line' : 'grid-line');
      hLine.setAttribute('x1', PADDING);
      hLine.setAttribute('y1', SVG_SIZE - PADDING - i * cellSize);
      hLine.setAttribute('x2', SVG_SIZE - PADDING);
      hLine.setAttribute('y2', SVG_SIZE - PADDING - i * cellSize);
      svg.appendChild(hLine);

      // X-axis labels (at intervals)
      if (i % labelInterval === 0) {
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('class', 'axis-label');
        xLabel.setAttribute('x', pos);
        xLabel.setAttribute('y', SVG_SIZE - PADDING + 18);
        xLabel.textContent = i;
        svg.appendChild(xLabel);
      }

      // Y-axis labels (at intervals)
      if (i > 0 && i % labelInterval === 0) {
        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('class', 'axis-label');
        yLabel.setAttribute('x', PADDING - 12);
        yLabel.setAttribute('y', SVG_SIZE - PADDING - i * cellSize + 4);
        yLabel.textContent = i;
        svg.appendChild(yLabel);
      }
    }

    // Axis titles
    const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xTitle.setAttribute('class', 'axis-title');
    xTitle.setAttribute('x', SVG_SIZE / 2);
    xTitle.setAttribute('y', SVG_SIZE - 5);
    xTitle.textContent = 'x';
    svg.appendChild(xTitle);

    const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yTitle.setAttribute('class', 'axis-title');
    yTitle.setAttribute('x', 10);
    yTitle.setAttribute('y', SVG_SIZE / 2);
    yTitle.textContent = 'y';
    svg.appendChild(yTitle);

    // Draw hover indicator
    if (state.hoverPoint) {
      const hx = PADDING + state.hoverPoint.x * cellSize;
      const hy = SVG_SIZE - PADDING - state.hoverPoint.y * cellSize;

      const hoverCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hoverCircle.setAttribute('class', 'hover-indicator');
      hoverCircle.setAttribute('cx', hx);
      hoverCircle.setAttribute('cy', hy);
      hoverCircle.setAttribute('r', 12);
      svg.appendChild(hoverCircle);

      const hoverLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      hoverLabel.setAttribute('class', 'hover-coords');
      hoverLabel.setAttribute('x', hx);
      hoverLabel.setAttribute('y', hy - 18);
      hoverLabel.setAttribute('text-anchor', 'middle');
      hoverLabel.textContent = `(${state.hoverPoint.x}, ${state.hoverPoint.y})`;
      svg.appendChild(hoverLabel);
    }

    // Draw points
    state.points.forEach((point, index) => {
      const px = PADDING + point.x * cellSize;
      const py = SVG_SIZE - PADDING - point.y * cellSize;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'point');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', py);
      circle.setAttribute('r', 8);
      svg.appendChild(circle);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'point-label');
      label.setAttribute('x', px + 12);
      label.setAttribute('y', py - 8);
      label.textContent = `(${point.x}, ${point.y})`;
      svg.appendChild(label);
    });
  }

  function updateFeedback() {
    if (state.points.length > 0) {
      const lastPoint = state.points[state.points.length - 1];
      feedbackText.textContent = `Plotted (${lastPoint.x}, ${lastPoint.y})`;
    } else {
      feedbackText.textContent = 'Click on the grid to plot points';
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

    state.points = [];
    renderGrid();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    const isCorrect = state.points.some(p => p.x === challenge.x && p.y === challenge.y);
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
    state.points = [];
    renderGrid();
    feedbackText.textContent = 'Click on the grid to plot points';
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
