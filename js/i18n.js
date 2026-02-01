/* Internationalization (i18n) Module - Meadow Math */

/**
 * i18n system for Meadow Math
 * Supports English (US) and Vietnamese
 * Translations are loaded from JSON files in /lang/{locale}/ folders
 * 
 * Folder structure:
 *   lang/
 *     en/
 *       common.json      - Shared translations (nav, buttons, feedback)
 *       prek.json        - Pre-K section translations
 *       kindergarten.json
 *       grade1.json - grade5.json
 *     vi/
 *       common.json
 *       prek.json
 *       kindergarten.json
 *       grade1.json - grade5.json
 */

const i18n = {
  // Current language
  currentLang: 'en',

  // Loaded translations (merged common + section-specific)
  translations: {},

  // Default fallback language
  fallbackLang: 'en',

  // Supported languages
  supportedLanguages: ['en', 'vi'],

  // Available sections (for lazy loading)
  sections: ['prek', 'kinder', 'kindergarten', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'tools', 'about'],

  // Cache for loaded translations
  cache: {
    en: {},
    vi: {}
  },

  // Flag to track if running from file:// protocol
  isFileProtocol: window.location.protocol === 'file:',

  // Promise that resolves when init() finishes
  _initPromise: null,

  /**
   * Get the base path for language files
   * Handles both development (file://) and production (http://) environments
   */
  getBasePath() {
    if (this.isFileProtocol) {
      // For file:// protocol, calculate relative path from current page
      const path = window.location.pathname;

      // Check if we're in a subdirectory (like /prek/, /grade1/, etc.)
      const pathParts = path.split('/').filter(p => p && !p.includes('.html'));
      const isInSubfolder = this.sections.some(s => pathParts.includes(s)) || 
                           pathParts.includes('kindergarten');

      // Check if we're in an activities subfolder
      const isInActivities = pathParts.includes('activities');

      if (isInActivities) {
        return '../../lang';
      }
      if (isInSubfolder) {
        return '../lang';
      }
      return './lang';
    }
    return '/lang';
  },

  /**
   * Initialize the i18n system
   */
  async init() {
    // Load saved language preference
    const savedLang = localStorage.getItem('meadowmath-lang');
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      this.currentLang = savedLang;
    }

    // Load common translations for current language
    await this.loadCommon(this.currentLang);

    // Also load fallback language common translations
    if (this.currentLang !== this.fallbackLang) {
      await this.loadCommon(this.fallbackLang);
    }

    // Detect current section and load section-specific translations
    const currentSection = this.detectCurrentSection();
    if (currentSection) {
      await this.loadSection(this.currentLang, currentSection);
      if (this.currentLang !== this.fallbackLang) {
        await this.loadSection(this.fallbackLang, currentSection);
      }
    }

    // Apply translations to page
    this.applyTranslations();

    // Set up language button listeners
    this.setupLanguageButtons();

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLang;
  },

  /**
   * Returns a promise that resolves when the initial i18n.init() completes.
   * Useful for activities that need translations before rendering dynamic text.
   */
  ready() {
    return this._initPromise || Promise.resolve();
  },

  /**
   * Detect which section we're currently in based on URL
   */
  detectCurrentSection() {
    const path = window.location.pathname.toLowerCase();

    for (const section of this.sections) {
      if (path.includes(`/${section}/`) || path.includes(`/${section}.`) || path.endsWith(`/${section}`)) {
        return section;
      }
    }

    return null;
  },

  /**
   * Load common translations for a language
   */
  async loadCommon(lang) {
    if (this.cache[lang].common) {
      this.translations[lang] = { ...this.cache[lang].common };
      return;
    }

    try {
      const basePath = this.getBasePath();
      const response = await fetch(`${basePath}/${lang}/common.json`);

      if (!response.ok) {
        throw new Error(`Failed to load common translations for ${lang}`);
      }

      const data = await response.json();
      this.cache[lang].common = data;
      this.translations[lang] = { ...data };
    } catch (error) {
      console.warn(`Could not load common translations for ${lang}:`, error);
      // Initialize empty object if loading fails
      if (!this.translations[lang]) {
        this.translations[lang] = {};
      }
    }
  },

  /**
   * Load section-specific translations for a language
   */
  async loadSection(lang, section) {
    if (this.cache[lang][section]) {
      // Wrap section translations under 'section' key for data-i18n attributes
      this.translations[lang] = {
        ...this.translations[lang],
        section: this.cache[lang][section]
      };
      return;
    }

    try {
      const basePath = this.getBasePath();
      const response = await fetch(`${basePath}/${lang}/${section}.json`);

      if (!response.ok) {
        throw new Error(`Failed to load ${section} translations for ${lang}`);
      }

      const data = await response.json();
      this.cache[lang][section] = data;

      // Wrap section translations under 'section' key for data-i18n attributes
      this.translations[lang] = {
        ...this.translations[lang],
        section: data
      };
    } catch (error) {
      console.warn(`Could not load ${section} translations for ${lang}:`, error);
    }
  },

  /**
   * Get a translation by key (supports nested keys like "nav.home" or "section.activities.countBerries.title")
   */
  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];

    // Navigate through nested keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Try fallback language
        value = this.translations[this.fallbackLang];
        if (!value) return key;

        for (const fk of keys) {
          if (value && typeof value === 'object' && fk in value) {
            value = value[fk];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  },

  /**
   * Get a raw value by key (returns objects, arrays, or strings)
   * Use this for complex data structures like Learn More content
   */
  getRaw(key) {
    const keys = key.split('.');

    // Try current language first
    let value = this.translations[this.currentLang];
    let found = true;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        found = false;
        break;
      }
    }

    if (found && value !== undefined) {
      return value;
    }

    // Try fallback language
    value = this.translations[this.fallbackLang];
    if (!value) return null;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value !== undefined ? value : null;
  },

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);

      if (translation !== key) {
        el.textContent = translation;
      }
    });

    // Handle placeholder translations
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation !== key) {
        el.placeholder = translation;
      }
    });

    // Handle title/aria-label translations
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation !== key) {
        el.title = translation;
        el.setAttribute('aria-label', translation);
      }
    });

    // Update page title if needed
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      const titleKey = titleEl.getAttribute('data-i18n');
      const translation = this.t(titleKey);
      if (translation !== titleKey) {
        document.title = translation;
      }
    }
  },

  /**
   * Set up language button click handlers
   * Uses two buttons (EN | VI) instead of dropdown
   */
  setupLanguageButtons() {
    const buttons = document.querySelectorAll('.lang-btn');

    buttons.forEach(btn => {
      const lang = btn.getAttribute('data-lang');

      // Set initial active state
      if (lang === this.currentLang) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }

      // Add click handler
      btn.addEventListener('click', async () => {
        if (lang === this.currentLang) return; // Already active

        await this.setLanguage(lang);

        // Update button states
        buttons.forEach(b => {
          const bLang = b.getAttribute('data-lang');
          if (bLang === lang) {
            b.classList.add('active');
            b.setAttribute('aria-pressed', 'true');
          } else {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          }
        });
      });
    });
  },

  /**
   * Change the current language
   */
  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language "${lang}" not supported`);
      return;
    }

    this.currentLang = lang;

    // Save preference
    localStorage.setItem('meadowmath-lang', lang);

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Load translations if not already cached
    await this.loadCommon(lang);

    const currentSection = this.detectCurrentSection();
    if (currentSection) {
      await this.loadSection(lang, currentSection);
    }

    // Apply new translations
    this.applyTranslations();

    // Emit language change event for activities to listen to
    document.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  },

  /**
   * Preload translations for a specific section
   * Useful when navigating to a new section
   */
  async preloadSection(section) {
    for (const lang of this.supportedLanguages) {
      if (!this.cache[lang][section]) {
        await this.loadSection(lang, section);
      }
    }
  },

  /**
   * Get all translations for current language (useful for JavaScript access)
   */
  getTranslations() {
    return this.translations[this.currentLang] || {};
  },

  /**
   * Check if a translation key exists
   */
  hasTranslation(key) {
    return this.t(key) !== key;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  i18n._initPromise = i18n.init();
});

// Export for use in other modules
window.i18n = i18n;

// Reload Grade 3 activities on language change to refresh dynamic strings
document.addEventListener('languageChanged', () => {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/grade3/activities/')) {
    window.location.reload();
  }
});
