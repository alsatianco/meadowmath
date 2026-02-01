// Number Line Explorer - Meadow Math

(function() {
  'use strict';

  // ============ STATE ============
  const state = {
    mode: 'explore', // 'explore' or 'challenges'
    range: { min: 0, max: 20 },
    position: 0,
    hops: [],
    isDragging: false,
    challengeIndex: 0,
    challenges: []
  };

  // ============ CHALLENGES ============
  const challengesList = [
    { type: 'place', target: 13, prompt: 'Place the point at 13' },
    { type: 'place', target: 7, prompt: 'Place the point at 7' },
    { type: 'hop', start: 6, hops: [5], prompt: 'Start at 6. Jump +5. Where are you?' },
    { type: 'place', target: 15, prompt: 'Find the missing number between 14 and 16' },
    { type: 'hop', start: 7, hops: [10], prompt: 'Start at 7 and jump +10' },
    { type: 'place', target: 0, prompt: 'Place the point at 0' }
  ];

  // ============ DOM ELEMENTS ============
  let svg, canvas;
  let pointMarker, pointCircle, pointLabel;
  let feedbackBanner, feedbackText, currentPositionEl;
  let challengePanel, challengePrompt, challengeProgress;
  let completionOverlay;

  // ============ SVG DIMENSIONS ============
  const SVG_CONFIG = {
    padding: 40,
    lineY: 100,
    tickHeight: 12,
    minorTickHeight: 6,
    pointRadius: 15,
    arcHeight: 40
  };

  // ============ INITIALIZATION ============
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    setupEventListeners();
    parseUrlParams();
    renderNumberLine();
    updateFeedback();
  }

  function cacheElements() {
    svg = document.getElementById('number-line-svg');
    canvas = document.getElementById('tool-canvas');
    feedbackBanner = document.getElementById('feedback-banner');
    feedbackText = document.getElementById('feedback-text');
    currentPositionEl = document.getElementById('current-position');
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

    // Range select
    document.getElementById('range-select').addEventListener('change', (e) => {
      const { min, max } = parseRange(e.target.value);
      state.range = { min, max };
      state.position = Math.max(min, Math.min(max, state.position));
      state.hops = [];
      renderNumberLine();
      updateFeedback();
    });

    // Hop buttons
    document.querySelectorAll('.hop-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hop = parseInt(btn.dataset.hop);
        performHop(hop);
      });
    });

    // Reset button
    document.querySelector('.btn-reset').addEventListener('click', reset);

    // Challenge buttons
    document.getElementById('btn-check')?.addEventListener('click', checkAnswer);
    document.getElementById('btn-skip')?.addEventListener('click', nextChallenge);
    document.getElementById('btn-restart')?.addEventListener('click', restartChallenges);

    // Window resize
    window.addEventListener('resize', debounce(renderNumberLine, 200));
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'challenges') {
      switchMode('challenges');
    }
    if (params.get('range')) {
      const { min, max } = parseRange(params.get('range'));
      if (!isNaN(min) && !isNaN(max)) {
        state.range = { min, max };
        document.getElementById('range-select').value = params.get('range');
      }
    }
  }

  // Parse range string like "0-20" or "-20-20" into {min, max}
  function parseRange(rangeStr) {
    // Match pattern: optional negative number, then dash, then optional negative number
    // Examples: "0-20", "-20-20", "-10-10", "0-100"
    const match = rangeStr.match(/^(-?\d+)-(-?\d+)$/);
    if (match) {
      return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
    }
    // Fallback for edge cases
    return { min: 0, max: 20 };
  }

  // ============ MODE SWITCHING ============
  function switchMode(mode) {
    state.mode = mode;

    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide panels
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
  function renderNumberLine() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.min(rect.width - 40, 900);
    const height = 200;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';

    const { min, max } = state.range;
    const range = max - min;
    const lineStart = SVG_CONFIG.padding;
    const lineEnd = width - SVG_CONFIG.padding;
    const lineWidth = lineEnd - lineStart;

    // Determine tick interval
    let majorInterval = 1;
    let minorInterval = 0;
    if (range > 50) {
      majorInterval = 10;
      minorInterval = 5;
    } else if (range > 20) {
      majorInterval = 5;
      minorInterval = 1;
    }

    // Add class for large ranges
    svg.classList.toggle('range-large', range > 50);

    // Draw arrow heads
    svg.innerHTML += `
      <polygon class="arrow-left" points="${lineStart - 10},${SVG_CONFIG.lineY} ${lineStart},${SVG_CONFIG.lineY - 6} ${lineStart},${SVG_CONFIG.lineY + 6}"/>
      <polygon class="arrow-right" points="${lineEnd + 10},${SVG_CONFIG.lineY} ${lineEnd},${SVG_CONFIG.lineY - 6} ${lineEnd},${SVG_CONFIG.lineY + 6}"/>
    `;

    // Draw main line
    svg.innerHTML += `<line class="number-line" x1="${lineStart}" y1="${SVG_CONFIG.lineY}" x2="${lineEnd}" y2="${SVG_CONFIG.lineY}"/>`;

    // Draw ticks and labels
    for (let i = min; i <= max; i++) {
      const x = lineStart + ((i - min) / range) * lineWidth;
      const isMajor = i % majorInterval === 0;
      const isMinor = minorInterval && i % minorInterval === 0 && !isMajor;

      if (isMajor) {
        // Major tick
        svg.innerHTML += `<line class="tick-major" x1="${x}" y1="${SVG_CONFIG.lineY - SVG_CONFIG.tickHeight}" x2="${x}" y2="${SVG_CONFIG.lineY + SVG_CONFIG.tickHeight}"/>`;

        // Label
        const isHighlight = i === 0 || i === min || i === max;
        svg.innerHTML += `<text class="tick-label ${isHighlight ? 'highlight' : ''}" x="${x}" y="${SVG_CONFIG.lineY + SVG_CONFIG.tickHeight + 18}">${i}</text>`;
      } else if (isMinor) {
        // Minor tick
        svg.innerHTML += `<line class="tick-minor" x1="${x}" y1="${SVG_CONFIG.lineY - SVG_CONFIG.minorTickHeight}" x2="${x}" y2="${SVG_CONFIG.lineY + SVG_CONFIG.minorTickHeight}"/>`;
      }
    }

    // Draw zero marker if in range
    if (min < 0 && max > 0) {
      const zeroX = lineStart + ((0 - min) / range) * lineWidth;
      svg.innerHTML += `<circle class="zero-marker" cx="${zeroX}" cy="${SVG_CONFIG.lineY}" r="4"/>`;
    }

    // Draw hops
    renderHops(lineStart, lineWidth, range, min);

    // Create draggable point
    createPoint(lineStart, lineWidth, range, min);

    // Setup drag handlers
    setupDragHandlers(lineStart, lineEnd, lineWidth, range, min);
  }

  function createPoint(lineStart, lineWidth, range, min) {
    const x = lineStart + ((state.position - min) / range) * lineWidth;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('point-marker');
    group.id = 'point-marker';
    group.innerHTML = `
      <circle class="point-circle" cx="${x}" cy="${SVG_CONFIG.lineY}" r="${SVG_CONFIG.pointRadius}"/>
      <text class="point-label" x="${x}" y="${SVG_CONFIG.lineY - 30}">${state.position}</text>
    `;
    svg.appendChild(group);

    pointMarker = group;
    pointCircle = group.querySelector('.point-circle');
    pointLabel = group.querySelector('.point-label');
  }

  function renderHops(lineStart, lineWidth, range, min) {
    let currentPos = state.hops.length > 0 ? state.hops[0].start : state.position;

    state.hops.forEach((hop, index) => {
      const startX = lineStart + ((hop.start - min) / range) * lineWidth;
      const endX = lineStart + ((hop.end - min) / range) * lineWidth;
      const midX = (startX + endX) / 2;
      const direction = hop.value > 0 ? 1 : -1;
      const arcY = SVG_CONFIG.lineY - SVG_CONFIG.arcHeight * direction;

      // Draw arc
      const pathD = `M ${startX} ${SVG_CONFIG.lineY} Q ${midX} ${arcY} ${endX} ${SVG_CONFIG.lineY}`;
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arc.setAttribute('d', pathD);
      arc.classList.add('hop-arc', hop.value > 0 ? 'positive' : 'negative');
      svg.appendChild(arc);

      // Get actual path length and set stroke-dasharray accordingly
      const pathLength = arc.getTotalLength();
      arc.style.strokeDasharray = pathLength;
      arc.style.strokeDashoffset = pathLength;
      arc.style.animationDelay = `${index * 0.1}s`;
      // Use CSS custom property for dynamic animation
      arc.style.setProperty('--path-length', pathLength);

      // Draw label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.classList.add('hop-label', hop.value > 0 ? 'positive' : 'negative');
      label.setAttribute('x', midX);
      label.setAttribute('y', arcY - 5 * direction);
      label.textContent = (hop.value > 0 ? '+' : '') + hop.value;
      svg.appendChild(label);
    });
  }

  function setupDragHandlers(lineStart, lineEnd, lineWidth, range, min) {
    const getPositionFromX = (clientX) => {
      const rect = svg.getBoundingClientRect();
      const svgX = (clientX - rect.left) * (svg.viewBox.baseVal.width / rect.width);
      const clampedX = Math.max(lineStart, Math.min(lineEnd, svgX));
      const value = min + ((clampedX - lineStart) / lineWidth) * range;
      return Math.round(value);
    };

    const updatePosition = (clientX) => {
      const newPos = getPositionFromX(clientX);
      if (newPos !== state.position) {
        state.position = newPos;
        state.hops = []; // Clear hops when dragging
        renderNumberLine();
        updateFeedback();
      }
    };

    // Mouse events
    pointMarker.addEventListener('mousedown', (e) => {
      e.preventDefault();
      state.isDragging = true;
      pointMarker.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (state.isDragging) {
        updatePosition(e.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      if (state.isDragging) {
        state.isDragging = false;
        pointMarker.style.cursor = 'grab';
      }
    });

    // Touch events
    pointMarker.addEventListener('touchstart', (e) => {
      e.preventDefault();
      state.isDragging = true;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (state.isDragging && e.touches.length > 0) {
        updatePosition(e.touches[0].clientX);
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      state.isDragging = false;
    });

    // Click on line to move point
    svg.addEventListener('click', (e) => {
      if (e.target === pointMarker || e.target.closest('.point-marker')) return;
      updatePosition(e.clientX);
    });
  }

  // ============ HOPS ============
  function performHop(hopValue) {
    const newPos = state.position + hopValue;

    // Check bounds
    if (newPos < state.range.min || newPos > state.range.max) {
      // Visual feedback for out of bounds
      feedbackBanner.classList.add('error');
      setTimeout(() => feedbackBanner.classList.remove('error'), 300);
      return;
    }

    // Add hop to history
    state.hops.push({
      start: state.position,
      end: newPos,
      value: hopValue
    });

    state.position = newPos;
    renderNumberLine();
    updateFeedback();
  }

  // ============ FEEDBACK ============
  function updateFeedback() {
    if (state.mode === 'explore') {
      currentPositionEl.textContent = state.position;
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

    // Setup for challenge
    if (challenge.type === 'hop' && challenge.start !== undefined) {
      state.position = challenge.start;
      state.hops = [];
    } else {
      state.position = Math.floor((state.range.min + state.range.max) / 2);
      state.hops = [];
    }

    renderNumberLine();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    let isCorrect = false;

    if (challenge.type === 'place') {
      isCorrect = state.position === challenge.target;
    } else if (challenge.type === 'hop') {
      const expectedEnd = challenge.start + challenge.hops.reduce((a, b) => a + b, 0);
      isCorrect = state.position === expectedEnd;
    }

    // Show feedback
    const banner = feedbackBanner;
    banner.style.display = 'block';
    challengePanel.querySelector('.challenge-actions').style.visibility = 'hidden';

    if (isCorrect) {
      banner.className = 'tool-feedback correct';
      banner.querySelector('.feedback-text').textContent = '🎉 Correct!';

      setTimeout(() => {
        banner.style.display = 'none';
        banner.className = 'tool-feedback';
        challengePanel.querySelector('.challenge-actions').style.visibility = 'visible';
        nextChallenge();
      }, 1200);
    } else {
      banner.className = 'tool-feedback incorrect';
      banner.querySelector('.feedback-text').textContent = '❌ Try again!';

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
    state.position = 0;
    state.hops = [];
    if (state.mode === 'challenges') {
      state.challengeIndex = 0;
      loadChallenge();
    } else {
      renderNumberLine();
      updateFeedback();
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

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
})();
