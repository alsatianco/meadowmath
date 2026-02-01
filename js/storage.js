// Storage & Progress Tracking - Meadow Math

/**
 * Storage key prefix
 */
const STORAGE_PREFIX = 'meadow-math-';

/**
 * Storage keys
 */
const KEYS = {
  PROGRESS: `${STORAGE_PREFIX}progress`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  STATS: `${STORAGE_PREFIX}stats`
};

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default value
 */
function getItem(key, defaultValue = null) {
  if (!isStorageAvailable()) return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} True if successful
 */
function setItem(key, value) {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Error writing to localStorage:', e);
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if successful
 */
function removeItem(key) {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Error removing from localStorage:', e);
    return false;
  }
}

/**
 * Get progress data for all grades
 * @returns {Object} Progress data
 */
function getProgress() {
  return getItem(KEYS.PROGRESS, {
    prek: {},
    kindergarten: {},
    grade1: {},
    grade2: {},
    grade3: {},
    grade4: {},
    grade5: {}
  });
}

/**
 * Save progress for a specific activity
 * @param {string} grade - Grade level (e.g., 'prek', 'grade1')
 * @param {string} activityId - Activity identifier
 * @param {Object} data - Progress data to save
 * @returns {boolean} True if successful
 */
function saveActivityProgress(grade, activityId, data) {
  const progress = getProgress();

  if (!progress[grade]) {
    progress[grade] = {};
  }

  progress[grade][activityId] = {
    ...data,
    lastPlayed: new Date().toISOString()
  };

  return setItem(KEYS.PROGRESS, progress);
}

/**
 * Get progress for a specific activity
 * @param {string} grade - Grade level
 * @param {string} activityId - Activity identifier
 * @returns {Object|null} Activity progress or null
 */
function getActivityProgress(grade, activityId) {
  const progress = getProgress();
  return progress[grade]?.[activityId] || null;
}

/**
 * Mark activity as completed
 * @param {string} grade - Grade level
 * @param {string} activityId - Activity identifier
 * @returns {boolean} True if successful
 */
function markActivityCompleted(grade, activityId) {
  const currentProgress = getActivityProgress(grade, activityId) || {};

  return saveActivityProgress(grade, activityId, {
    ...currentProgress,
    completed: true,
    completedAt: new Date().toISOString()
  });
}

/**
 * Check if activity is completed
 * @param {string} grade - Grade level
 * @param {string} activityId - Activity identifier
 * @returns {boolean} True if completed
 */
function isActivityCompleted(grade, activityId) {
  const progress = getActivityProgress(grade, activityId);
  return progress?.completed || false;
}

/**
 * Get user settings
 * @returns {Object} User settings
 */
function getSettings() {
  return getItem(KEYS.SETTINGS, {
    soundEnabled: true,
    animationsEnabled: true,
    theme: 'default'
  });
}

/**
 * Save user settings
 * @param {Object} settings - Settings to save
 * @returns {boolean} True if successful
 */
function saveSettings(settings) {
  const currentSettings = getSettings();
  return setItem(KEYS.SETTINGS, { ...currentSettings, ...settings });
}

/**
 * Get activity statistics
 * @returns {Object} Statistics data
 */
function getStats() {
  return getItem(KEYS.STATS, {
    totalActivitiesPlayed: 0,
    totalTimeSpent: 0,
    correctAnswers: 0,
    totalAnswers: 0
  });
}

/**
 * Update statistics
 * @param {Object} updates - Statistics to update
 * @returns {boolean} True if successful
 */
function updateStats(updates) {
  const stats = getStats();

  // Increment counts
  if (updates.activityPlayed) {
    stats.totalActivitiesPlayed++;
  }

  if (typeof updates.timeSpent === 'number') {
    stats.totalTimeSpent += updates.timeSpent;
  }

  if (updates.correct) {
    stats.correctAnswers++;
    stats.totalAnswers++;
  } else if (updates.incorrect) {
    stats.totalAnswers++;
  }

  return setItem(KEYS.STATS, stats);
}

/**
 * Get accuracy percentage
 * @returns {number} Accuracy percentage (0-100)
 */
function getAccuracy() {
  const stats = getStats();
  if (stats.totalAnswers === 0) return 0;
  return Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
}

/**
 * Clear all stored data
 * @returns {boolean} True if successful
 */
function clearAllData() {
  try {
    removeItem(KEYS.PROGRESS);
    removeItem(KEYS.SETTINGS);
    removeItem(KEYS.STATS);
    return true;
  } catch (e) {
    console.error('Error clearing data:', e);
    return false;
  }
}

/**
 * Export all data as JSON
 * @returns {Object} All stored data
 */
function exportData() {
  return {
    progress: getProgress(),
    settings: getSettings(),
    stats: getStats(),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Import data from JSON
 * @param {Object} data - Data to import
 * @returns {boolean} True if successful
 */
function importData(data) {
  try {
    if (data.progress) setItem(KEYS.PROGRESS, data.progress);
    if (data.settings) setItem(KEYS.SETTINGS, data.settings);
    if (data.stats) setItem(KEYS.STATS, data.stats);
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getProgress,
    saveActivityProgress,
    getActivityProgress,
    markActivityCompleted,
    isActivityCompleted,
    getSettings,
    saveSettings,
    getStats,
    updateStats,
    getAccuracy,
    clearAllData,
    exportData,
    importData
  };
}
