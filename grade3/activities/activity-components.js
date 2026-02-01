/**
 * Grade 3 Activity Components
 *
 * This file re-exports the shared ActivityComponents from the central JS folder.
 * Grade 3 activities can import from here for backward compatibility.
 *
 * Note: For new activities, prefer importing directly from ../../js/activity-components.js
 */

// The shared ActivityComponents is loaded from ../../js/activity-components.js
// This file exists for backward compatibility with existing Grade 3 activities

/**
 * Grade3Components - Grade 3 specific wrapper with defaults
 */
const Grade3Components = {
  /**
   * Get sidebar HTML with Grade 3 as active
   */
  getSidebarHTML(basePath = '../../') {
    return window.ActivityComponents?.getSidebarHTML({
      basePath,
      activeGrade: 'grade3'
    }) || '';
  },

  /**
   * Get hamburger menu HTML
   */
  getHamburgerHTML() {
    return window.ActivityComponents?.getHamburgerHTML() || '';
  },

  /**
   * Get stats overlay HTML
   */
  getStatsOverlayHTML(config = {}) {
    return window.ActivityComponents?.getStatsOverlayHTML(config) || '';
  },

  /**
   * Get activity header HTML with Grade 3 defaults
   */
  getActivityHeaderHTML(config) {
    return window.ActivityComponents?.getActivityHeaderHTML({
      ...config,
      backPath: config.backPath || '../index.html',
      backToKey: config.backToKey || 'nav.grade3'
    }) || '';
  },

  /**
   * Get common CSS links
   */
  getCommonCSSLinks(basePath = '../../css/') {
    return window.ActivityComponents?.getCommonCSSLinks(basePath) || '';
  },

  /**
   * Get common script tags
   */
  getCommonScriptTags(basePath = '../../js/', includeActivityBase = false) {
    return window.ActivityComponents?.getCommonScriptTags(basePath, includeActivityBase) || '';
  }
};

window.Grade3Components = Grade3Components;

console.log('Grade 3 ActivityComponents loaded via shared module');
