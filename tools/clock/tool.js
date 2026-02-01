// Clock Playground Tool - Meadow Math

(function() {
  'use strict';

  const state = {
    mode: 'explore',
    hour: 12,
    minute: 0,
    isDragging: false,
    dragTarget: null,
    challengeIndex: 0,
    challenges: []
  };

  const challengesList = [
    { hour: 3, minute: 0, prompt: 'Set the clock to 3:00' },
    { hour: 7, minute: 30, prompt: 'Set the clock to 7:30' },
    { hour: 9, minute: 45, prompt: 'Set the clock to 9:45' },
    { hour: 12, minute: 0, prompt: 'Set the clock to 12:00' },
    { hour: 6, minute: 15, prompt: 'Set the clock to 6:15' },
    { hour: 2, minute: 30, prompt: 'Set the clock to 2:30' }
  ];

  let svg, hourHand, minuteHand, digitalTime;
  let feedbackBanner, feedbackText, challengePanel, challengePrompt, challengeProgress;
  let completionOverlay;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    drawClockMarkers();
    setupEventListeners();
    updateClock();
  }

  function cacheElements() {
    svg = document.getElementById('clock-svg');
    hourHand = document.getElementById('hour-hand');
    minuteHand = document.getElementById('minute-hand');
    digitalTime = document.getElementById('digital-time');
    feedbackBanner = document.getElementById('feedback-banner');
    feedbackText = document.getElementById('feedback-text');
    challengePanel = document.getElementById('challenge-panel');
    challengePrompt = document.getElementById('challenge-prompt');
    challengeProgress = document.getElementById('challenge-progress');
    completionOverlay = document.getElementById('completion-overlay');
  }

  function drawClockMarkers() {
    const markersGroup = document.getElementById('hour-markers');
    markersGroup.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = 100 + 70 * Math.cos(angle);
      const y = 100 + 70 * Math.sin(angle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'clock-number');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.textContent = i;
      markersGroup.appendChild(text);
    }

    // Minor tick marks
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * Math.PI / 180;
      const isMajor = i % 5 === 0;
      const innerR = isMajor ? 78 : 82;
      const outerR = 88;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', `hour-marker ${isMajor ? 'major' : ''}`);
      line.setAttribute('x1', 100 + innerR * Math.cos(angle));
      line.setAttribute('y1', 100 + innerR * Math.sin(angle));
      line.setAttribute('x2', 100 + outerR * Math.cos(angle));
      line.setAttribute('y2', 100 + outerR * Math.sin(angle));
      markersGroup.appendChild(line);
    }
  }

  function setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    document.querySelectorAll('.hop-btn').forEach(btn => {
      btn.addEventListener('click', () => jumpTime(parseInt(btn.dataset.jump)));
    });

    // Drag handlers for clock hands
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    svg.addEventListener('touchstart', startDrag, { passive: false });
    svg.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);

    document.querySelector('.btn-reset').addEventListener('click', reset);
    document.getElementById('btn-check')?.addEventListener('click', checkAnswer);
    document.getElementById('btn-skip')?.addEventListener('click', nextChallenge);
    document.getElementById('btn-restart')?.addEventListener('click', restartChallenges);
  }

  function getAngleFromPoint(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI + 90;
    return (angle + 360) % 360;
  }

  function startDrag(e) {
    const target = e.target;
    if (target === minuteHand || target === hourHand) {
      e.preventDefault();
      state.isDragging = true;
      state.dragTarget = target === minuteHand ? 'minute' : 'hour';
    }
  }

  function drag(e) {
    if (!state.isDragging) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const angle = getAngleFromPoint(clientX, clientY);

    if (state.dragTarget === 'minute') {
      state.minute = Math.round(angle / 6) % 60;
    } else {
      const hourAngle = angle / 30;
      state.hour = Math.round(hourAngle) % 12 || 12;
    }

    updateClock();
  }

  function endDrag() {
    state.isDragging = false;
    state.dragTarget = null;
  }

  function jumpTime(minutes) {
    let totalMinutes = state.hour * 60 + state.minute + minutes;
    totalMinutes = ((totalMinutes % (12 * 60)) + (12 * 60)) % (12 * 60);

    state.hour = Math.floor(totalMinutes / 60) || 12;
    state.minute = totalMinutes % 60;
    updateClock();
  }

  function updateClock() {
    // Calculate hand angles
    const minuteAngle = state.minute * 6;
    const hourAngle = (state.hour % 12) * 30 + state.minute * 0.5;

    // Update hand positions
    const minRad = (minuteAngle - 90) * Math.PI / 180;
    const hourRad = (hourAngle - 90) * Math.PI / 180;

    minuteHand.setAttribute('x2', 100 + 65 * Math.cos(minRad));
    minuteHand.setAttribute('y2', 100 + 65 * Math.sin(minRad));

    hourHand.setAttribute('x2', 100 + 45 * Math.cos(hourRad));
    hourHand.setAttribute('y2', 100 + 45 * Math.sin(hourRad));

    // Update digital display
    const displayHour = state.hour === 0 ? 12 : state.hour;
    const displayMinute = state.minute.toString().padStart(2, '0');
    digitalTime.textContent = `${displayHour}:${displayMinute}`;
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

    state.hour = 12;
    state.minute = 0;
    updateClock();
  }

  function checkAnswer() {
    const challenge = state.challenges[state.challengeIndex];
    const isCorrect = state.hour === challenge.hour && state.minute === challenge.minute;
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
    state.hour = 12;
    state.minute = 0;
    updateClock();
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
