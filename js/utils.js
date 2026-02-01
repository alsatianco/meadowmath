// Utility Functions - Meadow Math

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (new array, doesn't modify original)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a set of unique random integers
 * @param {number} count - Number of integers to generate
 * @param {number} maxValue - Maximum value (minimum is 1)
 * @returns {Array} Array of unique random integers
 */
function generateSet(count, maxValue) {
  if (count > maxValue) {
    console.warn('Count exceeds maxValue, returning all values from 1 to maxValue');
    count = maxValue;
  }

  const set = new Set();
  while (set.size < count) {
    set.add(randomInt(1, maxValue));
  }
  return Array.from(set);
}

/**
 * Trigger celebration animation on an element
 * @param {HTMLElement} element - Element to animate
 * @param {Function} callback - Optional callback to run after animation
 */
function celebrate(element, callback) {
  if (!element) return;

  element.classList.add('animate-celebrate');

  // Remove animation class after it completes
  setTimeout(() => {
    element.classList.remove('animate-celebrate');
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, 1000);
}

/**
 * Trigger wiggle animation for incorrect answers
 * @param {HTMLElement} element - Element to animate
 */
function wiggle(element) {
  if (!element) return;

  element.classList.add('animate-wiggle');

  // Remove animation class after it completes
  setTimeout(() => {
    element.classList.remove('animate-wiggle');
  }, 500);
}

/**
 * Trigger pop animation for emphasis
 * @param {HTMLElement} element - Element to animate
 */
function pop(element) {
  if (!element) return;

  element.classList.add('animate-pop');

  setTimeout(() => {
    element.classList.remove('animate-pop');
  }, 400);
}

/**
 * Trigger bounce animation
 * @param {HTMLElement} element - Element to animate
 */
function bounce(element) {
  if (!element) return;

  element.classList.add('animate-bounce');

  setTimeout(() => {
    element.classList.remove('animate-bounce');
  }, 600);
}

/**
 * Create and trigger confetti effect
 * @param {HTMLElement} container - Container element for confetti
 * @param {number} count - Number of confetti pieces (default: 20)
 */
function createConfetti(container, count = 20) {
  if (!container) return;

  const colors = [
    '#FFB6D9', // pink
    '#FFEB99', // yellow
    '#87CEEB', // blue
    '#7BC67E', // green
    '#D4A5FF', // purple
    '#FFCC99'  // orange
  ];

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[randomInt(0, colors.length - 1)];
    confetti.style.left = `${randomInt(0, 100)}%`;
    confetti.style.top = '50%';
    confetti.style.borderRadius = randomInt(0, 1) ? '50%' : '0';
    confetti.classList.add('confetti');

    container.appendChild(confetti);

    // Remove confetti after animation
    setTimeout(() => {
      confetti.remove();
    }, 1500);
  }
}

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Check if device supports touch
 * @returns {boolean} True if touch is supported
 */
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get random item from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item from array
 */
function randomChoice(array) {
  if (!array || array.length === 0) return null;
  return array[randomInt(0, array.length - 1)];
}

/**
 * Create an array of numbers from start to end
 * @param {number} start - Start number
 * @param {number} end - End number
 * @returns {Array} Array of numbers
 */
function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    randomInt,
    shuffle,
    generateSet,
    celebrate,
    wiggle,
    pop,
    bounce,
    createConfetti,
    wait,
    clamp,
    isTouchDevice,
    randomChoice,
    range,
    formatNumber
  };
}
